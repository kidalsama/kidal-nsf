import {EntityLoadManyFunction, EntityLoadOneFunction, IEntityBase, IEntityCache} from "./IEntity";
import Database from "./Database";
import Logs from "../application/Logs";
import * as events from "events";
import Sequelize = require("sequelize");

/**
 * @author tengda
 */
export default class EntityCacheImpl<TKey extends number | string, TEntity extends IEntityBase<TKey>>
  extends events.EventEmitter implements IEntityCache<TKey, TEntity> {

  // 日志
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "EntityCacheImpl");
  // 数据库实例
  private readonly database: Database;
  // 模型
  private readonly model: Sequelize.Model<TEntity, any>;

  /**
   *
   */
  constructor(database: Database, model: Sequelize.Model<TEntity, any>) {
    super();
    this.database = database;
    this.model = model;
  }

  /**
   *
   */
  public async get(id: TKey): Promise<TEntity | null> {
    const entity = await this.model
      .findOne({where: {id}});

    return entity ? this._watch(entity) : null;
  }

  /**
   *
   */
  public async getOrCreate(id: TKey, defaults: Partial<TEntity>): Promise<TEntity> {
    const [entity] = await this.model.findOrCreate({where: {id}, defaults});

    return this._watch(entity);
  }

  /**
   *
   * @param loader
   */
  public async loadOne(loader: EntityLoadOneFunction): Promise<TEntity | null> {
    const entity = await loader(this.model);

    return entity ? this._watch(entity) : null;
  }

  /**
   *
   */
  public async loadMany(loader: EntityLoadManyFunction): Promise<TEntity[]> {
    const entities = await loader(this.model);

    return entities
      .map((entity) => this._watch(entity));
  }

  /**
   *
   * @param entity
   */
  public async create(entity: Partial<TEntity>): Promise<TEntity> {
    const createdEntity = await this.model.create(entity, {returning: true});

    return this._watch(createdEntity);
  }

  /**
   *
   * @param entity
   */
  public async createOrUpdate(entity: Partial<TEntity>): Promise<TEntity> {
    const createdEntity = await this.model.insertOrUpdate(entity, {returning: true})
      .then((results) => results[0]);

    return this._watch(createdEntity);
  }

  /**
   *
   */
  public async update(entity: Partial<TEntity>): Promise<void> {
    // 解除监听
    const target = this._unwatch(entity);

    // 回写
    await this.model.update(target, {where: {id: target.id}});
  }

  /**
   * 回写
   */
  private _onSingleFieldUpdated(id: TKey, propertyKey: string, value: any): void {
    // 回写到数据库
    const partial: any = {};
    partial[propertyKey] = value;
    this.model.update(partial, {where: {id}})
      .catch((e) => {
        EntityCacheImpl.LOG.error(`Write back entity ${this.model.name}.${id} failed`, e);
      });

    // 提交事件通知改变
    this.emit("field-updated", id, propertyKey, value);
  }

  /**
   * 监听
   */
  private _watch(entity: TEntity): TEntity {
    const keys = Object.keys(entity);

    return new Proxy(entity, {
      // get: (target: TEntity, propertyKey: PropertyKey): any => {
      //   return Reflect.get(target, propertyKey);
      // },
      set: (target: TEntity, propertyKey: PropertyKey, value: any): boolean => {
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
  private _unwatch(entity: any): TEntity {
    return entity;
  }
}
