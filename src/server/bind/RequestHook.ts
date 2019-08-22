/* tslint:disable */
import * as Express from "express";
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * TODO: 补注释
 */
function createHookAnnotation(metadataKey: symbol) {
  return (hook: Express.Handler) => {
    return (target: Object, propertyKey: string) => {
      Reflect.defineMetadata(metadataKey, hook, target, propertyKey)
    }
  }
}

/**
 * TODO: 补注释
 */
export const Before = createHookAnnotation(MetadataKeys.Before)

/**
 * TODO: 补注释
 */
export const After = createHookAnnotation(MetadataKeys.After)