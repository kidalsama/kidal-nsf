/* tslint:disable */
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * TODO: 补注释
 */
function createSingleParameterAnnotation(metadataKey: symbol) {
  return (name: string) => {
    return (target: Object, propertyKey: string, index: number) => {
      const dict = Reflect.getMetadata(metadataKey, target, propertyKey) || {}
      dict[name] = index
      Reflect.defineMetadata(metadataKey, dict, target, propertyKey)
    }
  }
}

/**
 * TODO: 补注释
 */
function createDataParameterAnnotation(metadataKey: symbol) {
  return (target: Object, propertyKey: string, index: number) => {
    const list: number[] = Reflect.getMetadata(metadataKey, target, propertyKey) || []
    list.push(index)
    Reflect.defineMetadata(metadataKey, list, target, propertyKey)
  }
}

/**
 * TODO: 补注释
 */
export const Param = createSingleParameterAnnotation(MetadataKeys.Param)

/**
 * TODO: 补注释
 */
export const QueryParam = createSingleParameterAnnotation(MetadataKeys.QueryParam)

/**
 * TODO: 补注释
 */
export const BodyParam = createSingleParameterAnnotation(MetadataKeys.BodyParam)

/**
 * TODO: 补注释
 */
export const Query = createDataParameterAnnotation(MetadataKeys.Query)

/**
 * TODO: 补注释
 */
export const Body = createDataParameterAnnotation(MetadataKeys.Body)

/**
 * TODO: 补注释
 */
export const Request = createDataParameterAnnotation(MetadataKeys.Request)

/**
 * TODO: 补注释
 */
export const Response = createDataParameterAnnotation(MetadataKeys.Response)

/**
 * TODO: 补注释
 */
export const Next = createSingleParameterAnnotation(MetadataKeys.Next)
