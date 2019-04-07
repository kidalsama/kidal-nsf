import * as events from "events";
import {EntityLoadManyFunction, EntityLoadOneFunction} from "./EntityFunction";
import {EntityEvents} from "./EntityEvents";
import {IEntityBase} from "./IEntity";

/**
 * @author tengda
 */
export default interface IEntityCache<TKey extends number | string, TEntity extends IEntityBase<TKey>>
  extends events.EventEmitter {
  /**
   * 加载实体
   */
  get(id: TKey): Promise<TEntity | null>;

  /**
   * 加载或创建
   */
  getOrCreate(id: TKey, defaults: Partial<TEntity>): Promise<TEntity>;

  /**
   * 通过查询加载
   */
  loadOne(loader: EntityLoadOneFunction): Promise<TEntity | null>;

  /**
   * 通过查询加载
   */
  loadMany(loader: EntityLoadManyFunction): Promise<TEntity[]>;

  /**
   * 创建
   */
  create(entity: Partial<TEntity>): Promise<TEntity>;

  /**
   * 创建或更新
   */
  createOrUpdate(entity: Partial<TEntity>): Promise<TEntity>;

  /**
   * 更新
   */
  updateOne(entity: Partial<TEntity>): Promise<TEntity | null>;

  /**
   * 字段变更事件
   */
  on(event: EntityEvents.FIELD_UPDATED, cb: (id: TKey, key: string, value: any) => void): this;
}
