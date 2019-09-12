/* tslint:disable */
import * as Express from "express";
import {Service} from "../../ioc/Annotation";
import {MetadataKeys, RequestMethod} from "./ServerBindingRegistry";

/**
 * 该类是控制器类
 * @see Service
 */
export function Controller(target: Function) {
  // 标记为控制器，注册器才会处理这个类
  Reflect.defineMetadata(MetadataKeys.Controller, true, target)

  // 使用Service的算法来绑定到容器内
  return Service(target)
}

/**
 * TODO: 补注释
 */
export function Middleware(hook: Express.Handler | Express.Handler[]) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata(MetadataKeys.Middleware, hook, target, propertyKey)
  }
}

/**
 * TODO: 补注释
 */
export function Before(hook: Express.Handler) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata(MetadataKeys.Before, hook, target, propertyKey)
  }
}

/**
 * TODO: 补注释
 */
export function After(hook: Express.Handler) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata(MetadataKeys.After, hook, target, propertyKey)
  }
}

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

/**
 * TODO: 补注释
 */
export function RequestMapping(
  path: string,
  options?: {
    method?: RequestMethod | RequestMethod[],
  },
): Function {
  return (target: Object & Function, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    // 标记为映射方法，注册器才会处理
    Reflect.defineMetadata(MetadataKeys.MappingFunction, true, target, propertyKey)
    // 请求路径
    Reflect.defineMetadata(MetadataKeys.Path, path, target, propertyKey)
    // 其他可选参数
    if (options) {
      // 方法
      Reflect.defineMetadata(MetadataKeys.Method, options.method, target, propertyKey)
    }
  }
}

/**
 * TODO: 补注释
 */
export function GetMapping(path: string) {
  return RequestMapping(path, {method: "GET"})
}

/**
 * TODO: 补注释
 */
export function PostMapping(path: string) {
  return RequestMapping(path, {method: "POST"})
}

/**
 * TODO: 补注释
 */
export function PutMapping(path: string) {
  return RequestMapping(path, {method: "PUT"})
}

/**
 * TODO: 补注释
 */
export function PatchMapping(path: string) {
  return RequestMapping(path, {method: "PATCH"})
}

/**
 * TODO: 补注释
 */
export function DeleteMapping(path: string) {
  return RequestMapping(path, {method: "DELETE"})
}

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
export const HttpRequest = createDataParameterAnnotation(MetadataKeys.HttpRequest)

/**
 * TODO: 补注释
 */
export const HttpResponse = createDataParameterAnnotation(MetadataKeys.HttpResponse)

/**
 * TODO: 补注释
 */
export const Next = createDataParameterAnnotation(MetadataKeys.Next)
