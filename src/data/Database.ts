import Sequelize = require("sequelize");
import Logs from "../application/Logs";
import Environment from "../application/Environment";
import { IEntityBase, IEntityMigration, IEntityRegistry } from "./IEntity";
import * as events from "events";
import { IDatabaseConfig } from "../application/ApplicationConfig";
import { Component } from "../ioc/Annotation";
import glob from "glob";
import PathUtils from "../util/PathUtils";
import { IDatabaseInitializer } from "./IDatabaseInitializer";
import { initializeMigrationModel, Migration } from "./Migration";

/**
 * @author kidal
 */
@Component
export default class Database extends events.EventEmitter {
  private readonly log = Logs.S.getFoundationLogger(__dirname, "Database");

  private readonly modelMap: Map<string, typeof Sequelize.Model> = new Map();
  private readonly registryMap = new Map<string, IEntityRegistry<any, any>>();

  /**
   *
   */
  public constructor(
    public readonly env: Environment,
    public readonly name: string,
    public readonly config: IDatabaseConfig,
    public readonly sequelize: Sequelize.Sequelize
  ) {
    super();
  }

  /**
   * 关闭数据库
   */
  public async shutdown() {
    await this.sequelize.close();
  }

  /**
   * 获取模型
   */
  public getModel<
    TKey extends number | string,
    TEntity extends IEntityBase<TKey>
  >(name: string): typeof Sequelize.Model {
    const model = this.modelMap.get(name);
    if (!model) {
      throw new Error(`Entity model ${name} not found`);
    }
    return model;
  }

  // 注册缓存
  public async scanEntities() {
    // 没有设定扫描路劲则跳过
    if (!this.config.pathToScan) {
      return;
    }

    // 注册缓存
    const registryList: Array<IEntityRegistry<any, any>> = glob
      .sync(PathUtils.path.join(this.env.srcDir, this.config.pathToScan))
      .map((it: string) => require(it).registry)
      .filter((it: any) => !!it);

    // 创建缓存
    for (const registry of registryList) {
      // 排除非本数据库的注册信息
      if (registry.database !== this) {
        continue;
      }

      // 模型名
      const name = registry.model.name;

      // 检查
      if (this.modelMap.has(name)) {
        throw new Error(`Entity model ${name} already registered`);
      }

      // 保存参数
      this.modelMap.set(name, registry.model);
      this.registryMap.set(name, registry);

      // log
      this.log.debug(`Registered cache: ${name}`);
    }
  }

  // 迁移
  public async migrateUp(initializer: IDatabaseInitializer) {
    // 关闭迁移
    if (this.config.disableMigration) {
      return;
    }

    // 创建迁移记录模型
    await initializeMigrationModel(this);

    // 读取全部迁移记录并分类
    const allMigrations: Migration[] = await Migration.findAll();
    const ranDict: Map<string, Migration[]> = new Map();
    for (const m of allMigrations) {
      const list = ranDict.get(m.modelName) || [];
      list.push(m);
      ranDict.set(m.modelName, list);
    }

    // 数据库整体升级
    if (initializer.getPreMigrations) {
      const name = ".pre";
      const ranList = ranDict.get(name) || [];
      const migrations = await initializer.getPreMigrations(this);
      await this.migrateUpSingleModel(ranList, name, migrations);
    }

    // 单模型升级
    for (const registry of this.registryMap.values()) {
      const name = registry.model.name;
      const ranList = ranDict.get(registry.model.name) || [];
      const migrations = registry.migrations;
      await this.migrateUpSingleModel(ranList, name, migrations);
    }

    // 数据库整体升级
    if (initializer.getPostMigrations) {
      const name = ".post";
      const ranList = ranDict.get(name) || [];
      const migrations = await initializer.getPostMigrations(this);
      await this.migrateUpSingleModel(ranList, name, migrations);
    }
  }

  // 升级单个模型
  private async migrateUpSingleModel(
    ran: Migration[],
    modelName: string,
    migrations: { [key: string]: IEntityMigration }
  ) {
    for (const migrationName in migrations) {
      // 跳过已经迁移过的
      if (ran.find((it: Migration) => it.migrationName === migrationName)) {
        continue;
      }

      // 开始迁移
      await migrations[migrationName].up();

      // 记录
      await Migration.create({ modelName, migrationName });
    }
  }

  // 初始化
  public async initializeData() {
    for (const registry of this.registryMap.values()) {
      if (registry.dataInitializer) {
        await registry.dataInitializer();
      }
    }
  }
}
