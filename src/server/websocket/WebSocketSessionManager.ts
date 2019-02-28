import uuid = require("uuid/v4");
import WebSocket from "ws";
import WebSocketSession from "./WebSocketSession";
import ISessionManager from "../ISessionManager";
import ISession from "../ISession";
import PayloadDispatcher from "../PayloadDispatcher";
import {copyPayload, textToPayload} from "../IPayload";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";

/**
 * @author tengda
 */
export default class WebSocketSessionManager implements ISessionManager {
  // 单例
  public static readonly S = new WebSocketSessionManager();
  // log
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "WebSocketSessionManager");
  // 匿名会话
  private readonly anonymous: Map<string, WebSocketSession> = new Map();
  // 已认证会话
  private readonly authenticated: Map<string, WebSocketSession> = new Map();

  /**
   * 单例
   */
  private constructor() {

  }

  /**
   * 会话链接
   */
  public onConnected(ws: WebSocket): WebSocketSession {
    const sessionId = uuid();
    const session = new WebSocketSession(this, ws, sessionId, new Date());

    // log
    WebSocketSessionManager.LOG.info(`Session ${sessionId}: connected`);

    // 添加到匿名会话
    this.anonymous.set(sessionId, session);

    // 监听消息
    ws.on("message", async (text: string) => {
      // 读取载荷
      let payload;
      try {
        payload = textToPayload(text);
      } catch (e) {
        WebSocketSessionManager.LOG.warn("Received invalid payload", e);
        return;
      }

      try {
        // 分发载荷
        const {reply, sync} = await PayloadDispatcher.S.dispatchWS(session, payload);

        // 推送同步消息
        if (sync.partial.length + sync.full.length > 0) {
          await session.push("sync", sync);
        }

        // 返回应答
        const replyPayload = copyPayload(payload, reply);
        if (replyPayload) {
          await session.sendReplyPayload(replyPayload);
        }
      } catch (e) {
        try {
          if (e instanceof LudmilaError) {
            const error = {
              code: e.code,
              message: e.message,
            };
            if (error.message === "") {
              delete error.message;
            }
            await session.sendReplyPayload(copyPayload(payload, {error}));
          } else {
            // 内部错误
            WebSocketSessionManager.LOG.error("Dispatch payload error", e);

            // 发送错误
            await session.sendReplyPayload(copyPayload(payload, {error: {code: LudmilaErrors.INTERNAL_ERROR}}));
          }
        } catch (e) {
          WebSocketSessionManager.LOG.error("Rpc response error", e);
        }
      }
    });

    // 监听关闭
    ws.on("close", (code: number, reason: string) => {
      this.onClosed(session, code, reason);
    });

    return session;
  }

  /**
   * 登入
   */
  public onLogin(session: WebSocketSession) {
    // 从匿名缓存移动到已认证缓存
    const uin = session.getUin()!;
    this.anonymous.delete(session.getSessionId());
    this.authenticated.set(uin, session);
  }

  /**
   * 登出
   */
  public onLogout(session: WebSocketSession) {
    // 从已认证缓存移动到匿名缓存
    const uin = session.getUin()!;
    this.authenticated.delete(uin);
    this.anonymous.set(session.sessionId, session);
  }

  /**
   * 获取已认证会话
   */
  public getAuthenticatedSession(uin: string): ISession | null {
    return this.authenticated.get(uin) || null;
  }

  /**
   * 会话关闭
   */
  private onClosed(session: WebSocketSession, code: number, reason: string) {
    // log
    WebSocketSessionManager.LOG.info(`Session ${session.sessionId}: closed(code: ${code}, reason: ${reason})`);

    // 匿名
    this.anonymous.delete(session.sessionId);

    // 已认证
    const uin = session.getUin();
    if (uin) {
      this.authenticated.delete(uin);
    }
  }
}
