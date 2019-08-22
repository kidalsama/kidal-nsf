import * as Express from "express";
import * as _ from "lodash";
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * 创建请求处理器
 */
export function createHandler(
  controllerType: Function,
  controller: Object,
  func: Function,
  funcName: string,
  beforeAllHook?: Express.Handler,
  afterAllHook?: Express.Handler,
  onErrorHook?: Express.ErrorRequestHandler,
): Express.Handler {
  // 钩子
  const beforeHook: Express.Handler | undefined =
    Reflect.getMetadata(MetadataKeys.Before, controllerType.prototype, funcName)
  const afterHook: Express.Handler | undefined =
    Reflect.getMetadata(MetadataKeys.After, controllerType.prototype, funcName)

  // 元数据
  const param = Reflect.getMetadata(MetadataKeys.Param, controllerType.prototype, funcName)
  const queryParam = Reflect.getMetadata(MetadataKeys.QueryParam, controllerType.prototype, funcName)
  const bodyParam = Reflect.getMetadata(MetadataKeys.BodyParam, controllerType.prototype, funcName)
  const query = Reflect.getMetadata(MetadataKeys.Query, controllerType.prototype, funcName)
  const body = Reflect.getMetadata(MetadataKeys.Body, controllerType.prototype, funcName)
  const httpRequest = Reflect.getMetadata(MetadataKeys.HttpRequest, controllerType.prototype, funcName)
  const httpResponse = Reflect.getMetadata(MetadataKeys.HttpResponse, controllerType.prototype, funcName)
  const nextFunc = Reflect.getMetadata(MetadataKeys.Next, controllerType.prototype, funcName)

  return (req, res, next) => {
    // nex需要使用控制器错误处理方法给钩住
    if (onErrorHook) {
      const originalNext = next
      next = (err?: Error) => {
        if (err) {
          onErrorHook.apply(controller, [err, req, res, originalNext])
        } else {
          originalNext()
        }
      }
    }

    // 获取参数
    const args: any = []
    // Path param
    if (param) {
      Object.keys(param).map((key) => args[param[key]] = req.params[key])
    }
    // Query param
    if (queryParam) {
      Object.keys(queryParam).map((key) => args[queryParam[key]] = req.query[key])
    }
    // Body param
    if (bodyParam) {
      Object.keys(bodyParam).map((key) => args[bodyParam[key]] = req.body[key])
    }
    // Query data
    if (query) {
      query.map((index: number) => args[index] = req.query)
    }
    // Body data
    if (body) {
      body.map((index: number) => args[index] = req.body)
    }
    // Http request
    if (httpRequest) {
      httpRequest.map((index: number) => args[index] = req)
    }
    // Http response
    if (httpResponse) {
      httpResponse.map((index: number) => args[index] = res)
    }
    // Next function
    if (nextFunc) {
      nextFunc.map((index: number) => args[index] = next)
    }

    (async (): Promise<any> => {
      // 前置钩子
      if (beforeAllHook && typeof beforeAllHook === "function") {
        await Promise.resolve(beforeAllHook.apply(controller, [req, res, next]))
      }
      if (beforeHook && typeof beforeHook === "function") {
        await Promise.resolve(beforeHook.apply(controller, [req, res, next]))
      }

      // 本体
      const resp: any = await Promise.resolve(func.apply(controller, args))

      // 前置钩子
      if (afterHook && typeof afterHook === "function") {
        await Promise.resolve(afterHook.apply(controller, [req, res, next]))
      }
      if (afterAllHook && typeof afterAllHook === "function") {
        await Promise.resolve(afterAllHook.apply(controller, [req, res, next]))
      }

      // 应答
      if (_.isUndefined(resp) || _.isNull(resp)) {
        res.end()
      } else if (_.isObject(resp)) {
        res.json(resp)
      } else {
        res.send(resp.toString())
      }
    })().then(null, next)
  }
}
