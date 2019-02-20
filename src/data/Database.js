"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sequelize = require("sequelize");
const Application_1 = __importDefault(require("../application/Application"));
const Logs_1 = __importDefault(require("../application/Logs"));
const glob_1 = __importDefault(require("glob"));
const Environment_1 = __importDefault(require("../application/Environment"));
const EntityCacheImpl_1 = __importDefault(require("./EntityCacheImpl"));
const events = __importStar(require("events"));
/**
 * @author tengda
 */
class Database extends events.EventEmitter {
    /**
     * 单例
     */
    constructor() {
        super();
        // 缓存
        this.caches = new Map();
    }
    /**
     * ORM框架
     */
    get sequelize() {
        return this._sequelize;
    }
    /**
     * 初始化
     */
    async init() {
        // 配置
        const config = Application_1.default.INSTANCE.bootstrapConfig.data;
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
        };
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
                acquire: 5 * 1000,
                idle: 10 * 1000,
            },
            logging: (message) => {
                Database.LOG.info(message);
            },
        });
        // 测试连接
        await this.sequelize.authenticate();
        // log
        const options = this.sequelize.options;
        Database.LOG.info(`Connect database ${options.dialect}://${options.host}:${options.port}/${options.database} successful`);
        // 注册缓存
        await this.registerCaches();
    }
    /**
     * 注册缓存
     */
    async registerCaches() {
        const env = Environment_1.default.INSTANCE;
        // 注册缓存
        const registryList = glob_1.default
            .sync(`${env.srcDir}/**/entity/*.js`)
            .map((it) => require(it).default);
        // 创建缓存
        for (const registry of registryList) {
            // 模型名
            const name = registry.model.name;
            // 检查
            if (this.caches.has(name)) {
                throw new Error(`Entity cache for model ${name} already registered`);
            }
            // 创建缓存
            const cache = new EntityCacheImpl_1.default(this, registry.model);
            this.caches.set(name, cache);
            // 初始化
            await registry.init(cache);
            // log
            Database.LOG.info(`Registered cache: ${name}`);
        }
    }
}
// 单例
Database.S = new Database();
// 日志
Database.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "Database");
exports.default = Database;
//# sourceMappingURL=Database.js.map