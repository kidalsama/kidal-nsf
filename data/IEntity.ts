import Sequelize = require("sequelize");
import * as events from "events";

/**
 * @author tengda
 */
export interface IEntityBase<TKey extends number | string> {
  /**
   * 主键
   */
  id: TKey;
}

/**
 * @author tengda
 */
export type EntityLoadOneFunction =
  <TKey extends number | string, TEntity extends IEntityBase<TKey>>(model: Sequelize.Model<TEntity, any>)
    => Promise<TEntity | null>;

/**
 * @author tengda
 */
export type EntityLoadManyFunction =
  <TKey extends number | string, TEntity extends IEntityBase<TKey>>(model: Sequelize.Model<TEntity, any>)
    => Promise<TEntity[]>;

/**
 * @author tengda
 */
export interface IEntityCache<TKey extends number | string, TEntity extends IEntityBase<TKey>>
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
  update(entity: Partial<TEntity>): Promise<void>;

  /**
   * 字段变更事件
   */
  on(event: "field-updated", cb: (id: TKey, key: string, value: any) => void): this;
}

/**
 * @author tengda
 */
export interface IEntityRegistry<TKey extends number | string, TEntity extends IEntityBase<TKey>> {
  /**
   * 缓存
   */
  readonly cache: IEntityCache<TKey, TEntity>;

  /**
   * 数据模型
   */
  readonly model: Sequelize.Model<TEntity, any>;

  /**
   * 初始化
   */
  init: (cache: IEntityCache<TKey, TEntity>) => Promise<any>;
}
