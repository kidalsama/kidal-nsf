import {IEntityBase} from "./IEntity";

/**
 * @author tengda
 */
export enum Events {
  EntityCreated = "EntityCreated",
  EntityUpdated = "EntityUpdated",
  EntityDeleted = "EntityDeleted",
}

/**
 * @author tengda
 */
export interface IEntityCreatedEvent<TKey extends number | string, TEntity extends IEntityBase<TKey>> {
  entity: TEntity;
}

/**
 * @author tengda
 */
export interface IEntityUpdatedEvent<TKey extends number | string, TEntity extends IEntityBase<TKey>> {
  old?: TEntity;
  new: TEntity;
}

/**
 * @author tengda
 */
export interface IEntityDeletedEvent<TKey extends number | string> {
  id: TKey;
}
