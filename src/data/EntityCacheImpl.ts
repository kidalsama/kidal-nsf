import {EntityEvents, EntityLoadManyFunction, EntityLoadOneFunction, IEntityBase, IEntityCache} from "./IEntity";
import Database from "./Database";
import Logs from "../application/Logs";
import * as events from "events";
import Environment from "../application/Environment";
import Sequelize = require("sequelize");

/**
 * @author tengda
 */
export default class EntityCacheImpl<TKey extends number | string, TEntity extends IEntityBase<TKey>>
  extends events.EventEmitter implements IEntityCache<TKey, TEntity> {

  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "EntityCacheImpl");
  private readonly database: Database;
  private readonly model: Sequelize.Model<TEntity, any>;
  private readonly updatingCounter: Map<TKey, number> = new Map()

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
      .map((entity) => {
        return this._watch(entity)
      });
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
    // 这里貌似有个Bug，只能返回 boolean
    const changed = await this.model.upsert(entity)

    // load
    return (await this.get(entity.id as TKey))!
  }

  /**
   *
   */
  public async updateOne(entity: Partial<TEntity>): Promise<TEntity | null> {
    // 解除监听
    const target = this._unwatch(entity);

    // 这里貌似有个Bug，只能返回 boolean
    const changed = await this.model.update(target, {where: {id: target.id}})

    // load
    return changed ? await this.get(entity.id as TKey) : null
  }

  /**
   * 回写
   */
  private _onSingleFieldUpdated(id: TKey, propertyKey: string, value: any): void {
    // 回写到数据库
    if (this.database.config.autoUpdateChangedFields) {
      // 更新计数器
      this._incDecUpdatingCounter(id, true)

      // 更新
      const partial: any = {};
      partial[propertyKey] = value;
      this.model.update(partial, {where: {id}})
        .catch((e) => {
          EntityCacheImpl.LOG.error(`Write back entity ${this.model.name}.${id} failed`, e);
        })
        .finally(() => {
          this._incDecUpdatingCounter(id, false)
        });
    }

    // 提交事件通知改变
    this.emit(EntityEvents.FIELD_UPDATED, id, propertyKey, value);
  }

  // 监听
  private _watch(entity: TEntity): TEntity {
    const keys = Object.keys(entity);

    return new Proxy(entity, {
      get: (target: TEntity, propertyKey: PropertyKey): any => {
        // 特殊方法
        if (propertyKey === "waitAutoUpdateChangedFieldsComplete") {
          return async () => {
            while (true) {
              const counter = this.updatingCounter.get(entity.id)
              if (!counter || counter === 0) {
                return
              }
              await new Promise((resolve) => {
                setTimeout(resolve, 100)
              })
            }
          }
        }
        return Reflect.get(target, propertyKey);
      },
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

  // 取消监听
  private _unwatch(entity: any): TEntity {
    return entity;
  }

  // 增加减少更新计数器
  private _incDecUpdatingCounter(id: TKey, inc: boolean) {
    let counter = this.updatingCounter.get(id) || (inc ? 0 : 1)
    if (inc) {
      counter++
    } else {
      counter--
    }
    this.updatingCounter.set(id, counter)
  }
}
