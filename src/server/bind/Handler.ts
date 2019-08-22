import * as Express from "express";
import * as _ from "lodash";
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * 创建请求处理器
 * @param controllerType 控制器类型
 * @param controller 控制器实例
 * @param func 方法
 * @param funcName 方法名
 */
export function createHandler(
  controllerType: Function,
  controller: Object,
  func: Function,
  funcName: string,
): Express.Handler {
  // 钩子
  const beforeHook = Reflect.getMetadata(MetadataKeys.Before, controllerType.prototype, funcName)
  const afterHook = Reflect.getMetadata(MetadataKeys.After, controllerType.prototype, funcName)

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
    if (httpRequest) {
      httpRequest.map((index: number) => args[index] = req)
    }
    if (httpResponse) {
      httpResponse.map((index: number) => args[index] = res)
    }
    if (nextFunc) {
      nextFunc.map((index: number) => args[index] = next)
    }

    (async (): Promise<any> => {
      // 前置钩子
      if (beforeHook && typeof beforeHook === "function") {
        await Promise.resolve(beforeHook(req, res, next))
      }

      // 本体
      const resp: any = await Promise.resolve(func.apply(controller, args))

      // 后置钩子
      if (afterHook && typeof afterHook === "function") {
        await afterHook(req, res, next)
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
