import { Autowired, Service } from "../ioc/Annotation";
import Logs from "../application/Logs";
import Database from "./Database";
import Environment from "../application/Environment";
import { IDatabaseConfig } from "../application/ApplicationConfig";
import Sequelize from "sequelize";
import PathUtils from "../util/PathUtils";
import * as fs from "fs";
import { IDatabaseInitializer } from "./IDatabaseInitializer";

/**
 * @author tengda
 */
@Service
export class DatabaseManager {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(
    __dirname,
    "DatabaseManager"
  );
  /**
   * 数据库列表
   */
  private readonly databaseMap: Map<string, Database> = new Map();

  /**
   *
   */
  public constructor(@Autowired public readonly env: Environment) {}

  /**
   * 获取数据库
   */
  public acquire(name: string = "primary"): Database {
    const database = this.databaseMap.get(name);
    if (database === undefined) {
      throw new Error(`Database ${name} not found`);
    }
    return database;
  }

  /**
   * 初始化全部
   */
  public async boot(): Promise<DatabaseManager> {
    // 检查是否开启数据库功能
    const config = this.env.applicationConfig.data;
    if (!config.enabled) {
      return this;
    }

    // 读取初始化器
    const initializerSrc = PathUtils.path.join(
      this.env.srcDir,
      "DatabaseInitializer.ts"
    );
    const initializer: IDatabaseInitializer = fs.existsSync(initializerSrc)
      ? require(PathUtils.replaceExt(initializerSrc, ".js")).default
      : {};

    // 获取全部数据库名
    const names = Object.keys(config.databaseMap);

    // 这里要先添加
    // 初始化时扫描文件会读取这里的数据库
    for (const name of names) {
      // 载入配置
      const databaseConfig = this.loadDatabaseConfig(name);

      // 创建Sequelize并测试连接
      const sequelize = this.createSequelize(databaseConfig);
      await sequelize.authenticate();

      // 日志
      if (DatabaseManager.LOG.isInfoEnabled()) {
        const options = sequelize.options;
        DatabaseManager.LOG.info(
          `Connect database ${options.dialect}://${options.host}:${options.port}/${options.database} successful`
        );
      }

      // 添加到字典
      this.databaseMap.set(
        name,
        new Database(this.env, name, databaseConfig, sequelize)
      );
    }

    // 扫描实体和数据模型
    for (const database of this.databaseMap.values()) {
      await database.scanEntities();
    }

    // 升级
    for (const database of this.databaseMap.values()) {
      await database.migrateUp(initializer);
    }

    // 初始化
    for (const database of this.databaseMap.values()) {
      await database.initializeData();
    }

    // done
    return this;
  }

  /**
   * 关闭全部数据库
   */
  public async shutdownAll(): Promise<void> {
    // 检查是否开启数据库功能
    const config = this.env.applicationConfig.data;
    if (!config.enabled) {
      return;
    }

    for (const database of this.databaseMap.values()) {
      try {
        await database.shutdown();
      } catch (e) {
        DatabaseManager.LOG.warn(e);
      }
    }
  }

  /**
   * 获取数据库配置
   */
  private loadDatabaseConfig(name: string): IDatabaseConfig {
    const databaseMap = this.env.applicationConfig.data.databaseMap;
    let databaseConfig: IDatabaseConfig = databaseMap[name];
    if (!databaseConfig) {
      throw new Error(`Database config ${name} not found`);
    }
    if (databaseConfig.alias) {
      databaseConfig = this.loadDatabaseConfig(databaseConfig.alias);
    }
    return databaseConfig;
  }

  /**
   * 创建Sequelize
   */
  public createSequelize(
    config: IDatabaseConfig,
    logFunc?: (message: any) => void
  ): Sequelize.Sequelize {
    // 修正老版本的时区问题
    const timezone =
      config.timezone === "Asia/Shanghai" ? "+08:00" : config.timezone;

    // 参数
    const dialectOptions: Object | undefined = config.dialectOptions
      ? config.dialectOptions
      : config.dialect === "mysql"
      ? {
          supportBigNumbers: true,
          bigNumberStrings: true
        }
      : undefined;

    // 定义
    const define: Sequelize.DefineOptions<any> | undefined = config.define
      ? config.define
      : config.dialect === "mysql"
      ? {
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
          freezeTableName: true
        }
      : undefined;

    // 创建
    return new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      // username: config.username,
      // password: config.password,
      // database: config.database,
      timezone,
      dialect: config.dialect,
      dialectOptions,
      operatorsAliases: {
        $eq: Sequelize.Op.eq,
        $ne: Sequelize.Op.ne,
        $gte: Sequelize.Op.gte,
        $gt: Sequelize.Op.gt,
        $lte: Sequelize.Op.lte,
        $lt: Sequelize.Op.lt,
        $not: Sequelize.Op.not,
        $in: Sequelize.Op.in,
        $notIn: Sequelize.Op.notIn,
        $is: Sequelize.Op.is,
        $like: Sequelize.Op.like,
        $notLike: Sequelize.Op.notLike,
        $iLike: Sequelize.Op.iLike,
        $notILike: Sequelize.Op.notILike,
        $regexp: Sequelize.Op.regexp,
        $notRegexp: Sequelize.Op.notRegexp,
        $iRegexp: Sequelize.Op.iRegexp,
        $notIRegexp: Sequelize.Op.notIRegexp,
        $between: Sequelize.Op.between,
        $notBetween: Sequelize.Op.notBetween,
        $overlap: Sequelize.Op.overlap,
        $contains: Sequelize.Op.contains,
        $contained: Sequelize.Op.contained,
        $adjacent: Sequelize.Op.adjacent,
        $strictLeft: Sequelize.Op.strictLeft,
        $strictRight: Sequelize.Op.strictRight,
        $noExtendRight: Sequelize.Op.noExtendRight,
        $noExtendLeft: Sequelize.Op.noExtendLeft,
        $and: Sequelize.Op.and,
        $or: Sequelize.Op.or,
        $any: Sequelize.Op.any,
        $all: Sequelize.Op.all,
        $values: Sequelize.Op.values,
        $col: Sequelize.Op.col,
        $raw: Sequelize.Op.raw
      },
      define,
      query: {
        raw: true
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 5 * 1000, // 等待多少毫秒后拿不到连接抛异常
        idle: 10 * 1000 // 最长线程空闲时间
      },
      logging: (message: any) => {
        if (logFunc) {
          logFunc(message);
        } else {
          DatabaseManager.LOG.trace(message);
        }
      }
    });
  }
}
