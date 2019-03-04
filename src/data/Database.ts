import Sequelize = require("sequelize");
import Logs from "../application/Logs";
import glob from "glob";
import Environment from "../application/Environment";
import {IEntityCache, IEntityRegistry} from "./IEntity";
import EntityCacheImpl from "./EntityCacheImpl";
import * as events from "events";

/**
 * @author tengda
 */
export default class Database extends events.EventEmitter {
  // 单例
  public static readonly S = new Database();

  /**
   * 单例
   */
  private constructor() {
    super();
  }

  // 日志
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "Database");
  // ORM框架
  private _sequelize?: Sequelize.Sequelize;
  // 缓存
  private readonly caches: Map<string, IEntityCache<any, any>> = new Map();

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

  /**
   * 初始化
   */
  public async init(): Promise<void> {
    // 配置
    const config = Environment.S.applicationConfig.data;
    if (!config.enabled) {
      Database.LOG.info("Database disabled");
      return;
    }
    const dataSourceMysqlConfig = config.dataSourceMysql;

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
      host: dataSourceMysqlConfig.host,
      port: dataSourceMysqlConfig.port,
      username: dataSourceMysqlConfig.username,
      password: dataSourceMysqlConfig.password,
      database: dataSourceMysqlConfig.database,
      timezone: dataSourceMysqlConfig.timezone,
      dialect: "mysql",
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

    // 注册缓存
    await this.registerCaches();
  }

  /**
   * 关闭
   */
  public async shutdown() {
    if (this.enabled) {
      await this.sequelize.close()
    }
  }

  /**
   * 注册缓存
   */
  private async registerCaches() {
    const env = Environment.S;

    // 注册缓存
    const registryList: Array<IEntityRegistry<any, any>> = glob
      .sync(`${env.srcDir}/**/entity/*.js`)
      .map((it: string) => require(it).default);

    // 创建缓存
    for (const registry of registryList) {
      // 模型名
      const name = registry.model.name;

      // 检查
      if (this.caches.has(name)) {
        throw new Error(`Entity cache for model ${name} already registered`);
      }

      // 创建缓存
      const cache = new EntityCacheImpl(this, registry.model);
      this.caches.set(name, cache);

      // 初始化
      Reflect.set(registry, "_cache", cache)
      await registry.model.sync({force: env.applicationConfig.data.dropTableOnInit})

      // log
      Database.LOG.info(`Registered cache: ${name}`);
    }
  }
}
