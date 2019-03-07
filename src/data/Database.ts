import Sequelize = require("sequelize");
import Logs from "../application/Logs";
import glob from "glob";
import Environment from "../application/Environment";
import {IEntityBase, IEntityCache, IEntityRegistry} from "./IEntity";
import EntityCacheImpl from "./EntityCacheImpl";
import * as events from "events";
import {IDatabaseConfig} from "../application/ApplicationConfig";
import Maybe from "graphql/tsutils/Maybe";

/**
 * @author tengda
 */
export default class Database extends events.EventEmitter {
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "Database");
  public static readonly databaseMap: Map<string, Database> = new Map();

  /**
   * 获取数据库
   */
  public static acquire(name: string = "primary"): Database {
    const database = this.databaseMap.get(name)
    if (database === undefined) {
      throw new Error(`Database ${name} not found`)
    }
    return database
  }

  /**
   * 初始化全部数据库
   */
  public static async initAll(): Promise<void> {
    const names = Object.keys(Environment.S.applicationConfig.data.databaseMap)

    // 这里要先添加
    // 初始化时扫描文件会读取这里的数据库
    for (const name of names) {
      this.databaseMap.set(name, new Database())
    }

    // 初始化
    for (const name of this.databaseMap.keys()) {
      const database = this.databaseMap.get(name)
      if (database) {
        await database.init(name)
      }
    }

    // 注册
    for (const database of this.databaseMap.values()) {
      await database.registerCaches()
    }
  }

  /**
   * 关闭全部数据库
   */
  public static async shutdownAll(): Promise<void> {
    for (const database of this.databaseMap.values()) {
      try {
        await database.shutdown()
      } catch (e) {
        this.LOG.warn(e)
      }
    }
  }

  //
  private constructor() {
    super();
  }

  private _name?: string;
  private _config?: IDatabaseConfig;
  private _sequelize?: Sequelize.Sequelize;
  private readonly caches: Map<string, IEntityCache<any, any>> = new Map();
  private readonly models: Map<string, Sequelize.Model<any, any>> = new Map();

  /**
   * 数据库名
   */
  public get name() {
    return this._name!;
  }

  /**
   * 配置
   */
  public get config(): IDatabaseConfig {
    return this._config!;
  }

  /**
   * ORM框架
   */
  public get sequelize() {
    return this._sequelize!;
  }

  /**
   * 是否启用
   */
  public get enabled() {
    return Environment.S.applicationConfig.data.enabled
  }

  // 获取数据库配置
  private loadDatabaseConfig(name: string): IDatabaseConfig {
    const databaseMap = Environment.S.applicationConfig.data.databaseMap
    let databaseConfig: Maybe<IDatabaseConfig> = databaseMap[name];
    if (!databaseConfig) {
      throw new Error(`Database config ${name} not found`)
    }
    if (databaseConfig.alias) {
      databaseConfig = this.loadDatabaseConfig(databaseConfig.alias)
    }
    return databaseConfig
  }

  // 初始化
  private async init(name: string): Promise<void> {
    // 是否启用数据库
    const config = Environment.S.applicationConfig.data;
    if (!config.enabled) {
      Database.LOG.info("Database disabled");
      return;
    }

    // 读取配置
    this._name = name
    this._config = this.loadDatabaseConfig(name)

    // 配置数据库
    const Op = Sequelize.Op;
    const operatorsAliases = {
      $eq: Op.eq,
      $ne: Op.ne,
      $gte: Op.gte,
      $gt: Op.gt,
      $lte: Op.lte,
      $lt: Op.lt,
      $not: Op.not,
      $in: Op.in,
      $notIn: Op.notIn,
      $is: Op.is,
      $like: Op.like,
      $notLike: Op.notLike,
      $iLike: Op.iLike,
      $notILike: Op.notILike,
      $regexp: Op.regexp,
      $notRegexp: Op.notRegexp,
      $iRegexp: Op.iRegexp,
      $notIRegexp: Op.notIRegexp,
      $between: Op.between,
      $notBetween: Op.notBetween,
      $overlap: Op.overlap,
      $contains: Op.contains,
      $contained: Op.contained,
      $adjacent: Op.adjacent,
      $strictLeft: Op.strictLeft,
      $strictRight: Op.strictRight,
      $noExtendRight: Op.noExtendRight,
      $noExtendLeft: Op.noExtendLeft,
      $and: Op.and,
      $or: Op.or,
      $any: Op.any,
      $all: Op.all,
      $values: Op.values,
      $col: Op.col,
      $raw: Op.raw,
    } as Sequelize.OperatorsAliases;

    // 初始化
    this._sequelize = new Sequelize({
      host: this._config.host,
      port: this._config.port,
      username: this._config.username,
      password: this._config.password,
      database: this._config.database,
      timezone: this._config.timezone,
      dialect: this._config.dialect,
      dialectOptions: {
        supportBigNumbers: true,
        bigNumberStrings: true,
      },
      operatorsAliases,
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        engine: "InnoDB",
        freezeTableName: true,
      },
      query: {
        raw: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 5 * 1000, // 等待多少毫秒后拿不到连接抛异常
        idle: 10 * 1000, // 最长线程空闲时间
      },
      logging: (message: any) => {
        Database.LOG.info(message);
      },
    });

    // 测试连接
    await this.sequelize.authenticate();

    // log
    const options = this.sequelize.options;
    Database.LOG.info(
      `Connect database ${options.dialect}://${options.host}:${options.port}/${options.database} successful`);
  }

  // 关闭
  private async shutdown() {
    if (this.enabled) {
      await this.sequelize.close()
    }
  }

  /**
   * 获取缓存
   */
  public getCache<TKey extends number | string, TEntity extends IEntityBase<TKey>>(
    name: string,
  ): IEntityCache<TKey, TEntity> {
    const cache = this.caches.get(name)
    if (!cache) {
      throw new Error(`Entity cache ${name} not found`)
    }
    return cache
  }

  /**
   * 获取模型
   */
  public getModel<TKey extends number | string, TEntity extends IEntityBase<TKey>>(
    name: string,
  ): Sequelize.Model<TEntity, any> {
    const model = this.models.get(name)
    if (!model) {
      throw new Error(`Entity model ${name} not found`)
    }
    return model
  }

  // 注册缓存
  private async registerCaches() {
    const env = Environment.S;

    // 注册缓存
    const registryList: Array<IEntityRegistry<any, any>> = glob
      .sync(`${env.srcDir}/**/entity/*.js`)
      .map((it: string) => require(it).default);

    // 创建缓存
    for (const registry of registryList) {
      // 排除非本数据库的注册信息
      if (registry.database !== this) {
        continue
      }

      // 模型名
      const name = registry.model.name;

      // 检查
      if (this.caches.has(name)) {
        throw new Error(`Entity cache for model ${name} already registered`);
      }

      // 创建缓存
      const cache = new EntityCacheImpl(this, registry.model);
      this.caches.set(name, cache);
      this.models.set(name, registry.model)

      // 初始化
      Reflect.set(registry, "cache", cache)
      await registry.model.sync({force: this._config!.dropTableOnInit})

      // log
      Database.LOG.info(`Registered cache: ${name}`);
    }
  }
}
