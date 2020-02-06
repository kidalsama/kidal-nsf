import { IEntityMigration } from "./IEntity";
import Database from "./Database";

/**
 * 数据库初始化器
 */
export interface IDatabaseInitializer {
  /**
   * 迁移
   */
  getPreMigrations?(
    database: Database
  ): Promise<{ [key: string]: IEntityMigration }>;

  /**
   * 迁移
   */
  getPostMigrations?(
    database: Database
  ): Promise<{ [key: string]: IEntityMigration }>;
}
