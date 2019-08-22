/* tslint:disable */
import * as Express from "express";
import {MetadataKeys} from "./ServerBindingRegistry";

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
