import Sequelize = require("sequelize");
import Database from "./Database";
import IEntityCache from "./IEntityCache";

/**
 * @author tengda
 */
export interface IEntityBase<TKey extends number | string> {
  /**
   * 主键
   */
  id: TKey;

  /**
   * 等待自动更新变更的字段完成
   */
  waitAutoUpdateChangedFieldsComplete(): Promise<void>
}

/**
 * @author tengda
 */
export interface IEntityRegistry<TKey extends number | string, TEntity extends IEntityBase<TKey>> {
  /**
   * 数据库
   */
  readonly database: Database;

  /**
   * 数据模型
   */
  readonly model: Sequelize.Model<TEntity, any>;

  /**
   * 缓存
   */
  readonly cache: IEntityCache<TKey, TEntity>;
}
