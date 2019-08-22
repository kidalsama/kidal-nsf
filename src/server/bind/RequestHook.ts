/* tslint:disable */
import * as Express from "express";
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * TODO: 补注释
 */
function createFunctionHookAnnotation(metadataKey: symbol) {
  return (hook: Express.Handler) => {
    return (target: Object, propertyKey: string) => {
      Reflect.defineMetadata(metadataKey, hook, target, propertyKey)
    }
  }
}

/**
 * TODO: 补注释
 */
export const Before = createFunctionHookAnnotation(MetadataKeys.Before)

/**
 * TODO: 补注释
 */
export const After = createFunctionHookAnnotation(MetadataKeys.After)

/**
 * TODO: 补注释
 */
export function BeforeAll(target: Object, propertyKey: string) {
  Reflect.defineMetadata(MetadataKeys.BeforeAll, true, target, propertyKey)
}

/**
 * TODO: 补注释
 */
export function AfterAll(target: Object, propertyKey: string) {
  Reflect.defineMetadata(MetadataKeys.AfterAll, true, target, propertyKey)
}

/**
 * TODO: 补注释
 */
export function OnError(target: Object, propertyKey: string) {
  Reflect.defineMetadata(MetadataKeys.OnError, true, target, propertyKey)
}
