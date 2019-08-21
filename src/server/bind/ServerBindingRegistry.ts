import * as Express from "express";
import * as p from "path";
import {Autowired, Component, Container} from "../../ioc";
import {Environment} from "../../application";

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
  Controller: Symbol("Controller"),
  MappingFunction: Symbol("MappingFunction"),

  Path: Symbol("Path"),
  Method: Symbol("Method"),

  Before: Symbol("Before"),
  After: Symbol("After"),

  Param: Symbol("Param"),
  QueryParam: Symbol("QueryParam"),
  BodyParam: Symbol("BodyParam"),
  Query: Symbol("Query"),
  Body: Symbol("Body"),
  Request: Symbol("Request"),
  Response: Symbol("Response"),
  Next: Symbol("Next"),
}

/**
 * @author tengda
 */
@Component
export class ServerBindingRegistry {
  /**
   * 已经注册的控制器
   */
  private readonly registeredControllers = new Set<Function>()

  /**
   *
   */
  public constructor(
    @Autowired public readonly env: Environment,
  ) {
  }

  /**
   * 初始化
   */
  public async init(router: Express.Router) {
    // 扫描控制器文件
    Container.addSource("**/controller/**/*Controller.js", this.env.srcDir)

    // 注册
    this.registerAllUnregisteredControllers(router)
  }

  /**
   * 注册全部还未注册的控制器
   */
  public registerAllUnregisteredControllers(router: Express.Router) {
    for (const type of Container.getAllTypes()) {
      if (this.registeredControllers.has(type)) {
        continue
      }
      if (!Reflect.hasMetadata(MetadataKeys.Controller, type)) {
        continue
      }
      this.register(router, type)
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
  private register(router: Express.Router, type: Function) {
    // 实例化
    const controller = Container.get(type)
    const controllerRequestMappingOptions = this.retrieveRequestMappingOptions(type)

    // 路由
    const routes: Array<{
      method: string;
      path: string;
      handlers: Express.Handler[];
    }> = []
    for (const name of Object.getOwnPropertyNames(type.prototype)) {
      // 跳过构造方法
      if (name === "constructor") {
        continue
      }

      // 必须是个方法
      const func: Function = controller[name]
      if (typeof func !== "function") {
        continue
      }

      // 必须是映射方法
      if (!Reflect.hasMetadata(MetadataKeys.MappingFunction, type.prototype, name)) {
        continue
      }

      // 获取参数
      const requestMappingOptions = this.retrieveRequestMappingOptions(
        type.prototype,
        name,
        controllerRequestMappingOptions,
      )

      // 路由
      for (const method of requestMappingOptions.method) {
        const beforeHook = Reflect.getMetadata(MetadataKeys.Before, type.prototype, name)
        const afterHook = Reflect.getMetadata(MetadataKeys.After, type.prototype, name)

        const param = Reflect.getMetadata(MetadataKeys.Param, type.prototype, name)
        const queryParam = Reflect.getMetadata(MetadataKeys.QueryParam, type.prototype, name)
        const bodyParam = Reflect.getMetadata(MetadataKeys.BodyParam, type.prototype, name)
        const query = Reflect.getMetadata(MetadataKeys.Query, type.prototype, name)
        const body = Reflect.getMetadata(MetadataKeys.Body, type.prototype, name)
        const request = Reflect.getMetadata(MetadataKeys.Request, type.prototype, name)
        const response = Reflect.getMetadata(MetadataKeys.Response, type.prototype, name)
        const nextFunc = Reflect.getMetadata(MetadataKeys.Next, type.prototype, name)

        const handler: Express.Handler = (req, res, next) => {
          const args: any = []
          if (param) {
            Object.keys(param).map((key) => args[param[key]] = req.params[key])
          }
          if (queryParam) {
            Object.keys(queryParam).map((key) => args[queryParam[key]] = req.query[key])
          }
          if (bodyParam) {
            Object.keys(bodyParam).map((key) => args[bodyParam[key]] = req.body[key])
          }
          if (query) {
            query.map((index: number) => args[index] = req.query)
          }
          if (body) {
            body.map((index: number) => args[index] = req.body)
          }
          if (request) {
            request.map((index: number) => args[index] = req)
          }
          if (response) {
            response.map((index: number) => args[index] = res)
          }
          if (nextFunc) {
            response.map((index: number) => args[index] = next)
          }

          if (beforeHook && typeof beforeHook === "function") {
            beforeHook(req, res, next)
          }

          Promise.resolve(func.apply(controller, args))
            .then((resp) => {
              if (afterHook && typeof afterHook === "function") {
                afterHook(req, res, next)
              }
              if (resp) {
                res.end(resp)
              } else {
                res.end()
              }
            })
            .catch(next)
        }
        routes.push({method, path: requestMappingOptions.path, handlers: [handler]})
      }
    }

    // 注册路由
    for (const route of routes) {
      switch (route.method) {
        case "GET":
          router.get(route.path, ...route.handlers)
          break
        case "POST":
          router.post(route.path, ...route.handlers)
          break
        case "PUT":
          router.put(route.path, ...route.handlers)
          break
        case "PATCH":
          router.patch(route.path, ...route.handlers)
          break
        case "DELETE":
          router.delete(route.path, ...route.handlers)
          break
      }
    }
  }
}
