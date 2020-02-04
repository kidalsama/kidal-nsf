import Sequelize = require("sequelize");
import Logs from "../application/Logs";
import Environment from "../application/Environment";
import { IEntityBase, IEntityMigration, IEntityRegistry } from "./IEntity";
import EntityCacheImpl from "./EntityCacheImpl";
import * as events from "events";
import { IDatabaseConfig } from "../application/ApplicationConfig";
import IEntityCache from "./IEntityCache";
import { createMigrationModel, IMigration } from "./Migration";
import { Component } from "../ioc/Annotation";
import glob from "glob";
import PathUtils from "../util/PathUtils";
import { IDatabaseInitializer } from "./IDatabaseInitializer";

/**
 * @author tengda
 */
@Component
export default class Database extends events.EventEmitter {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(
    __dirname,
    "Database"
  );

  private _migrationModel?: Sequelize.Model<IMigration, any>;
  private readonly cacheMap: Map<string, IEntityCache<any, any>> = new Map();
  private readonly modelMap: Map<string, Sequelize.Model<any, any>> = new Map();
  private readonly registryMap: Map<
    string,
    IEntityRegistry<any, any>
  > = new Map();

  public get migrationModel(): Sequelize.Model<IMigration, any> {
    return this._migrationModel!;
  }

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
   * 获取缓存
   */
  public getCache<
    TKey extends number | string,
    TEntity extends IEntityBase<TKey>
  >(name: string): IEntityCache<TKey, TEntity> {
    const cache = this.cacheMap.get(name);
    if (!cache) {
      throw new Error(`Entity cache ${name} not found`);
    }
    return cache;
  }

  /**
   * 获取模型
   */
  public getModel<
    TKey extends number | string,
    TEntity extends IEntityBase<TKey>
  >(name: string): Sequelize.Model<TEntity, any> {
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
      .map((it: string) => require(it).default)
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
      if (this.cacheMap.has(name)) {
        throw new Error(`Entity cache for model ${name} already registered`);
      }

      // 创建缓存
      const cache = new EntityCacheImpl(this, registry.model);

      // 保存参数
      this.cacheMap.set(name, cache);
      this.modelMap.set(name, registry.model);
      this.registryMap.set(name, registry);

      // 初始化
      Reflect.set(registry, "cache", cache);

      // log
      if (Database.LOG.isDebugEnabled()) {
        Database.LOG.debug(`Registered cache: ${name}`);
      }
    }
  }

  // 迁移
  public async migrateUp(initializer: IDatabaseInitializer) {
    // 关闭迁移
    if (this.config.disableMigration) {
      return;
    }

    // 创建迁移记录模型
    this._migrationModel = await createMigrationModel(this);

    // 读取全部迁移记录并分类
    const allMigrations = await this.migrationModel.findAll();
    const ranDict: Map<string, IMigration[]> = new Map();
    for (const m of allMigrations) {
      const list = ranDict.get(m.modelName) || [];
      list.push(m);
      ranDict.set(m.modelName, list);
    }

    // 数据库整体升级
    if (initializer.getMigrations) {
      const name = ".db";
      const ranList = ranDict.get(name) || [];
      const migrations = await initializer.getMigrations(this);
      await this.migrateUpSingleModel(ranList, name, migrations);
    }

    // 单模型升级
    for (const registry of this.registryMap.values()) {
      const name = registry.model.name;
      const ranList = ranDict.get(registry.model.name) || [];
      const migrations = registry.migrations;
      await this.migrateUpSingleModel(ranList, name, migrations);
    }
  }

  // 升级单个模型
  private async migrateUpSingleModel(
    ran: IMigration[],
    modelName: string,
    migrations: { [key: string]: IEntityMigration }
  ) {
    for (const migrationName in migrations) {
      // 跳过已经迁移过的
      if (ran.find((it: IMigration) => it.migrationName === migrationName)) {
        continue;
      }

      // 开始迁移
      await migrations[migrationName].up();

      // 记录
      await this.migrationModel.create({ modelName, migrationName });
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
