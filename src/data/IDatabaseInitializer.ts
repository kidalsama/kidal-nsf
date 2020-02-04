import { IEntityMigration } from "./IEntity";

/**
 * 数据库初始化器
 */
export interface IDatabaseInitializer {
  /**
   * 迁移
   */
  migrations?: { [key: string]: IEntityMigration };
}
