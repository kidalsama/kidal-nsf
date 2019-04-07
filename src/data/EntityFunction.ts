import Sequelize from "sequelize";
import {IEntityBase} from "./IEntity";

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
