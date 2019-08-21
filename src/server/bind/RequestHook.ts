/* tslint:disable */
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * TODO: 补注释
 */
function createHookAnnotation(metadataKey: symbol) {
  return (hook: Function) => {
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
