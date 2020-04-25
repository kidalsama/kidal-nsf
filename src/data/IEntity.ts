import Sequelize = require("sequelize");
import Database from "./Database";

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
export interface IEntityMigration {
  /**
   * 升级数据库版本
   */
  up: () => Promise<void>;
  /**
   * 降级数据库版本
   */
  down?: () => Promise<void>;
}

/**
 * @author tengda
 */
export interface IEntityRegistry<
  TKey extends number | string,
  TEntity extends IEntityBase<TKey>
> {
  /**
   * 数据库
   */
  readonly database: Database;

  /**
   * 数据模型
   */
  readonly model: typeof Sequelize.Model;

  /**
   * 迁移
   */
  readonly migrations: { [key: string]: IEntityMigration };

  /**
   * 初始化数据
   */
  readonly dataInitializer?: () => Promise<void>;
}
