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
const Logs_1 = __importDefault(require("../application/Logs"));
const events = __importStar(require("events"));
/**
 * @author tengda
 */
class EntityCacheImpl extends events.EventEmitter {
    /**
     *
     */
    constructor(database, model) {
        super();
        this.database = database;
        this.model = model;
    }
    /**
     *
     */
    async get(id) {
        const entity = await this.model
            .findOne({ where: { id } });
        return entity ? this._watch(entity) : null;
    }
    /**
     *
     */
    async getOrCreate(id, defaults) {
        const [entity] = await this.model.findOrCreate({ where: { id }, defaults });
        return this._watch(entity);
    }
    /**
     *
     * @param loader
     */
    async loadOne(loader) {
        const entity = await loader(this.model);
        return entity ? this._watch(entity) : null;
    }
    /**
     *
     */
    async loadMany(loader) {
        const entities = await loader(this.model);
        return entities
            .map((entity) => this._watch(entity));
    }
    /**
     *
     * @param entity
     */
    async create(entity) {
        const createdEntity = await this.model.create(entity, { returning: true });
        return this._watch(createdEntity);
    }
    /**
     *
     * @param entity
     */
    async createOrUpdate(entity) {
        const createdEntity = await this.model.insertOrUpdate(entity, { returning: true })
            .then((results) => results[0]);
        return this._watch(createdEntity);
    }
    /**
     *
     */
    async update(entity) {
        // 解除监听
        const target = this._unwatch(entity);
        // 回写
        await this.model.update(target, { where: { id: target.id } });
    }
    /**
     * 回写
     */
    _onSingleFieldUpdated(id, propertyKey, value) {
        // 回写到数据库
        const partial = {};
        partial[propertyKey] = value;
        this.model.update(partial, { where: { id } })
            .catch((e) => {
            EntityCacheImpl.LOG.error(`Write back entity ${this.model.name}.${id} failed`, e);
        });
        // 提交事件通知改变
        this.emit("field-updated", id, propertyKey, value);
    }
    /**
     * 监听
     */
    _watch(entity) {
        const keys = Object.keys(entity);
        return new Proxy(entity, {
            // get: (target: TEntity, propertyKey: PropertyKey): any => {
            //   return Reflect.get(target, propertyKey);
            // },
            set: (target, propertyKey, value) => {
                // 写入目标
                const successful = Reflect.set(target, propertyKey, value);
                // 加入回写队列
                if (typeof propertyKey === "string" && keys.includes(propertyKey)) {
                    this._onSingleFieldUpdated(target.id, propertyKey, value);
                }
                // 反馈
                return successful;
            },
        });
    }
    /**
     * 取消监听
     */
    _unwatch(entity) {
        return entity;
    }
}
// 日志
EntityCacheImpl.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "EntityCacheImpl");
exports.default = EntityCacheImpl;
//# sourceMappingURL=EntityCacheImpl.js.map