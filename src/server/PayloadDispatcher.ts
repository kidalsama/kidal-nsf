import Payload from "./IPayload";
import glob from "glob";
import ISession from "./ISession";
import Logs from "../application/Logs";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";
import IApiRegistry from "./IApiRegistry";
import Environment from "../application/Environment";
import * as clsHooked from "cls-hooked";
import * as graphqlHTTP from "express-graphql";
import {Request, Response} from "express";
import Maybe from "graphql/tsutils/Maybe";

/**
 * @author tengda
 */
export default class PayloadDispatcher {
  // 单例
  public static readonly S = new PayloadDispatcher();
  // log
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "PayloadDispatcher");
  // 处理器钩子
  private readonly handlerCls = clsHooked.createNamespace("foundation.server.PayloadDispatcher.handler");
  // 接口
  private readonly apis: Map<string, IApiRegistry<any, any>> = new Map();

  /**
   * 单例
   */
  private constructor() {

  }

  /**
   * 初始化处理器
   */
  public async init() {
    const env = Environment.S;

    // 注册接口
    const contexts: Array<{ path: string, registry: IApiRegistry<any, any> }> = glob
      .sync(`${env.srcDir}/module/**/api/*.js`)
      .map((it: string) => ({path: it, registry: require(it).default}));

    for (const context of contexts) {
      // 类型
      const path = context.path;
      const indexOfModule = path.lastIndexOf("/module/");
      const indexOfApi = path.lastIndexOf("/api/");
      const type0 = path.substring(indexOfModule + "/module/".length, indexOfApi);
      const type1 = path.substring(indexOfApi + "/api/".length);
      const type = type0 + "/" + type1.substring(0, type1.length - ".js".length);

      // 检查
      if (this.apis.has(type)) {
        throw new Error(`Api ${type} already registered.`);
      }

      // 缓存
      Reflect.set(context.registry, "type", type)
      this.apis.set(type, context.registry);

      // log
      PayloadDispatcher.LOG.info(`Registered api: ${type}`);
    }
  }

  /**
   * 获取同步数据
   */
  public getSync(): any {
    return this.handlerCls.get("sync");
  }

  /**
   * 分发GraphQL载荷
   */
  public async dispatchGraphQL(middleware: graphqlHTTP.Middleware,
                               request: Request, response: Response): Promise<undefined> {
    // 钩住处理器
    return new Promise<undefined>((resolve, reject) => {
      this.handlerCls.run(() => {
        // 同步
        const sync = {
          full: [],
          partial: [],
        };

        // 设置参数
        this.handlerCls.set("sync", sync);

        // 调用
        middleware(request, response)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * 分发WebSocket载荷
   */
  public async dispatchWebSocket(session: Maybe<ISession>, payload: Payload): Promise<{ reply: any, sync: any }> {
    // 检查必要数据
    if (!payload.type) {
      throw new LudmilaError(LudmilaErrors.SERVER_WEBSOCKET_INVALID_PAYLOAD);
    }

    // 获取定义
    const registry = this.apis.get(payload.type);
    if (!registry) {
      throw new LudmilaError(LudmilaErrors.SERVER_WEBSOCKET_NO_HANDLER);
    }

    // 钩住处理器
    return new Promise<{ reply: any, sync: any }>((resolve, reject) => {
      this.handlerCls.run(() => {
        // 准备上下文
        const context = {
          data: payload.data,
          payload,
          session,
        };

        // 同步
        const sync = {
          full: [],
          partial: [],
        };

        // 设置参数
        this.handlerCls.set("sync", sync);

        // 执行
        registry.handle(context)
          .then((reply) => {
            resolve({reply, sync});
          })
          .catch(reject);
      });
    });
  }

  /**
   *
   */
  public addSyncFull(type: string, id: any, data: any): void {
    const sync: any = this.handlerCls.get("sync");
    if (sync) {
      sync.full.push({type, id, data});
    }
  }

  /**
   *
   */
  public addSyncPartial(type: string, id: any, key: string, value: any): void {
    const sync: any = this.handlerCls.get("sync");
    if (sync) {
      sync.partial.push({type, id, key, value});
    }
  }
}
