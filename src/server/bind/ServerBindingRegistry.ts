import * as Express from "express";
import * as p from "path";
import * as lodash from "lodash";
import {Container} from "../../ioc";
import {Logs} from "../../application";
import {createHandlers} from "./Handler";
import ReflectUtils from "../../util/ReflectUtils";

/**
 * 允许的请求方法
 */
export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

/**
 * 隐射参数
 */
interface IRequestMappingOptions {
  path: string
  method: string[]
}

/**
 * 元数据的键
 */
// tslint:disable-next-line
export const MetadataKeys = {
  // 标记
  Controller: Symbol("Controller"),
  MappingFunction: Symbol("MappingFunction"),

  // 路由
  Path: Symbol("Path"),
  Method: Symbol("Method"),

  // 钩子
  Middleware: Symbol("Middleware"),
  Before: Symbol("Before"),
  After: Symbol("After"),
  BeforeAll: Symbol("BeforeAll"),
  AfterAll: Symbol("AfterAll"),
  OnError: Symbol("OnError"),

  // 参数
  Param: Symbol("Param"),
  QueryParam: Symbol("QueryParam"),
  BodyParam: Symbol("BodyParam"),
  Query: Symbol("Query"),
  Body: Symbol("Body"),
  HttpRequest: Symbol("HttpRequest"),
  HttpResponse: Symbol("HttpResponse"),
  Next: Symbol("Next"),
}

/**
 * @author tengda
 */
export class ServerBindingRegistry {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "ServerBindingRegistry")
  /**
   * 已经注册的控制器
   */
  private readonly registeredControllers = new Set<Function>()

  /**
   * 初始化
   */
  public async init(router: Express.Router, pathToScan: string) {
    // 扫描控制器文件
    Container.addSource(pathToScan)

    // 注册
    await this.registerAllUnregisteredControllers(router)
  }

  /**
   * 注册全部还未注册的控制器
   */
  public async registerAllUnregisteredControllers(router: Express.Router) {
    for (const type of Container.getAllTypes()) {
      if (this.registeredControllers.has(type)) {
        continue
      }
      if (!Reflect.hasMetadata(MetadataKeys.Controller, type)) {
        continue
      }
      await this.register(router, type)
      this.registeredControllers.add(type)
    }
  }

  /**
   * 获取请求映射参数
   */
  private retrieveRequestMappingOptions(
    target: Object & Function,
    propertyKey?: string,
    prefix?: IRequestMappingOptions,
  ): IRequestMappingOptions {
    // 读取元数据
    const pathOption: string | undefined = propertyKey ?
      Reflect.getMetadata(MetadataKeys.Path, target, propertyKey) :
      Reflect.getMetadata(MetadataKeys.Path, target)
    const methodOption: string | string[] | undefined =
      Reflect.getMetadata(MetadataKeys.Method, target)

    // 路径
    let path: string
    if (pathOption) {
      path = prefix ? p.join(prefix.path, pathOption) : pathOption
    } else {
      path = prefix ? prefix.path : "/"
    }
    if (!path.startsWith("/")) {
      path = "/" + path
    }

    // 方法
    let method: string[]
    if (methodOption) {
      method = typeof methodOption === "string" ? [methodOption] : methodOption
    } else {
      method = prefix ? prefix.method : ["GET", "POST"]
    }

    // 完成
    return {path, method}
  }

  /**
   * 注册控制器
   */
  private async register(router: Express.Router, type: Function) {
    // 实例化
    const controller = Container.get(type)
    // 获取控制器的元数据
    const controllerRequestMappingOptions = this.retrieveRequestMappingOptions(type)

    // 获取控制器范围内的钩子
    let beforeAllHook: Express.Handler | undefined
    let afterAllHook: Express.Handler | undefined
    let onErrorHook: Express.ErrorRequestHandler | undefined
    await ReflectUtils.doWithProperties(type.prototype,
      async (propertyName, property) => {
        // 获取元数据
        if (!beforeAllHook) {
          beforeAllHook = Reflect.hasMetadata(MetadataKeys.BeforeAll, type.prototype, propertyName)
            ? property : undefined
        }
        if (!afterAllHook) {
          afterAllHook = Reflect.hasMetadata(MetadataKeys.AfterAll, type.prototype, propertyName)
            ? property : undefined
        }
        if (!onErrorHook) {
          onErrorHook = Reflect.hasMetadata(MetadataKeys.OnError, type.prototype, propertyName)
            ? property : undefined
        }
      },
      async (propertyName, property) => {
        return propertyName !== "constructor" &&
          lodash.isFunction(property)
      },
    )

    // 获取路由
    const routes: Array<{ method: string; path: string; handlers: Express.Handler[] }> = []
    await ReflectUtils.doWithProperties(type.prototype,
      async (propertyName, property) => {
        // 获取参数
        const requestMappingOptions = this.retrieveRequestMappingOptions(
          type.prototype,
          propertyName,
          controllerRequestMappingOptions,
        )

        // 路由
        for (const method of requestMappingOptions.method) {
          const handlers = createHandlers(
            type, controller, property, propertyName,
            beforeAllHook, afterAllHook, onErrorHook,
          )
          routes.push({method, path: requestMappingOptions.path, handlers})
        }
      },
      async (propertyName, property) => {
        return propertyName !== "constructor" &&
          lodash.isFunction(property) &&
          Reflect.hasMetadata(MetadataKeys.MappingFunction, type.prototype, propertyName)
      },
    )

    // 注册路由
    for (const route of routes) {
      const handlers = route.handlers.map((handler) =>
        (req: Express.Request, res: Express.Response, next: Express.NextFunction) =>
          Promise.resolve(handler(req, res, next)).then(null, next),
      )
      const args = [route.path, ...handlers];
      (router as any)[route.method.toLocaleLowerCase()].apply(router, args);
    }
  }
}
