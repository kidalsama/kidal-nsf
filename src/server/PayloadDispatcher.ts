import Payload from "./IPayload";
import ISession from "./ISession";
import Logs from "../application/Logs";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";
// import * as clsHooked from "cls-hooked";
import Maybe from "graphql/tsutils/Maybe";
import WebSocketApiManager from "./websocket/WebSocketApiManager";

/**
 * @author tengda
 */
export default class PayloadDispatcher {
  public static readonly S = new PayloadDispatcher();
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "PayloadDispatcher");

  // private readonly handlerCls = clsHooked.createNamespace("foundation.server.PayloadDispatcher.handler");

  /**
   * 单例
   */
  private constructor() {

  }

  /**
   * 分发WebSocket载荷
   */
  public async dispatchWebSocket(session: Maybe<ISession>, payload: Payload): Promise<{ reply: any, sync: any }> {
    // 检查必要数据
    if (!payload.type) {
      throw new LudmilaError(LudmilaErrors.SERVER_101);
    }

    // 获取定义
    const registry = WebSocketApiManager.S.getRegistry(payload.type);
    if (!registry) {
      throw new LudmilaError(LudmilaErrors.SERVER_102);
    }

    return new Promise<{ reply: any, sync: any }>((resolve, reject) => {
      // 执行
      registry.processPayload(payload.data, {payload, session})
        .then((reply) => {
          resolve({reply, sync: {full: [], partial: []}});
        })
        .catch(reject);
    });
  }
}
