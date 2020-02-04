import { IEntityMigration } from "./IEntity";
import Database from "./Database";

/**
 * 数据库初始化器
 */
export interface IDatabaseInitializer {
  /**
   * 迁移
   */
  getMigrations?(database: Database): { [key: string]: IEntityMigration };
}
