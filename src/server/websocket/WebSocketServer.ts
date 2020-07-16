import WebSocket from "ws";
import HttpServer from "../HttpServer";
import Logs from "../../application/Logs";
import WebSocketSession from "./WebSocketSession";
import {
  IPayload,
  IPayloadData,
  IPayloadSerializer,
  JsonPayloadSerializer,
  PrettyJsonPayloadSerializer,
  WebSocketPayloads,
} from "./WebSocketPayloads";
import {LudmilaError} from "../../error/LudmilaError";
import {LudmilaErrors} from "../../error/LudmilaErrors";
import uuid = require("uuid");

/**
 * 消息处理器
 */
export type WebSocketMessageHandler =
  (payload: IPayload, session: WebSocketSession) => Promise<IPayloadData | undefined | void>;

/**
 * @author kidal
 */
export default class WebSocketServer {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketServer");

  /**
   * 载荷序列化器
   */
  public readonly payloadSerializer: IPayloadSerializer;
  /**
   * WebSocket服务器实例
   */
  private wss: WebSocket.Server;
  /**
   * 处理器
   */
  private readonly handlers: Map<string, WebSocketMessageHandler> = new Map()
  /**
   * 匿名会话
   */
  private readonly anonymous: Map<string, WebSocketSession> = new Map()
  /**
   * 已认证会话(ID->Session)
   */
  private readonly authenticatedMapById: Map<string, WebSocketSession> = new Map()
  /**
   * 已认证会话(UIN->Session)
   */
  private readonly authenticatedMapByUin: Map<string, WebSocketSession> = new Map()

  /**
   *
   */
  public constructor(
    public readonly httpServer: HttpServer,
  ) {
    // 创建载荷序列化器
    //  prod: 使用更加紧凑的编码方式提高效率
    if (httpServer.env.hasAnyProfile("prod")) {
      this.payloadSerializer = new JsonPayloadSerializer()
    } else {
      this.payloadSerializer = new PrettyJsonPayloadSerializer()
    }
  }

  /**
   * 设置消息处理器
   */
  public setMessageHandler(type: string, handler: WebSocketMessageHandler): WebSocketMessageHandler | undefined {
    const prev = this.handlers.get(type)
    this.handlers.set(type, handler)
    return prev
  }

  /**
   * 获取匿名会话
   */
  public getAnonymousSession(id: string): WebSocketSession | undefined {
    return this.anonymous.get(id)
  }

  /**
   * 获取已认证会话
   */
  public getAuthenticatedSession(id: string): WebSocketSession | undefined {
    return this.authenticatedMapById.get(id)
  }

  /**
   * 获取已认证会话
   */
  public getAuthenticatedSessionByUin(uin: string): WebSocketSession | undefined {
    return this.authenticatedMapByUin.get(uin)
  }

  /**
   * 当会话登入时
   */
  public onLogin(session: WebSocketSession) {
    // 从匿名会话移除
    this.anonymous.delete(session.id)

    // 添加到已认证的会话
    this.authenticatedMapByUin.set(session.uin!, session)
    this.authenticatedMapById.set(session.id, session)
  }

  /**
   * 当会话登出时
   */
  public onLogout(session: WebSocketSession) {
    // 从已认证的会话移除
    if (session.uin) {
      this.authenticatedMapByUin.delete(session.uin)
    }
    this.authenticatedMapById.delete(session.id)

    // 添加到匿名会话
    this.anonymous.set(session.id, session)
  }

  /**
   * 启动
   */
  public async start() {
    // 初始化
    if (this.httpServer.initializer && this.httpServer.initializer.initWebSocket) {
      this.httpServer.initializer.initWebSocket(this)
    }

    // 创建服务器
    this.wss = new WebSocket.Server({
      server: this.httpServer.server,
      path: this.httpServer.config.webSocketEndpoint,
    });

    // 监听事件
    this.wss.on("connection", (ws: WebSocket) => this.onSessionConnected(ws))
    this.wss.on("error", (ws: WebSocket, error: Error) => this.onSessionError(ws, error))
  }

  /**
   * 当会话连接时
   */
  private onSessionConnected(ws: WebSocket): void {
    // 创建一个全新的会话
    const session = new WebSocketSession(this, ws, uuid(), new Date())

    // 日志
    if (WebSocketServer.LOG.isTraceEnabled()) {
      WebSocketServer.LOG.trace(`Session ${session.id} connected`)
    }

    // 添加到匿名会话
    this.anonymous.set(session.id, session)

    // 监听消息
    ws.on("message", (raw: string) => this.onSessionMessage(session, raw))
    ws.on("close", (code: number, reason: string) => this.onSessionClose(session, code, reason))
  }

  /**
   * 当链接发生错误
   */
  private onSessionError(ws: WebSocket, error: Error): void {
    // TODO: 处理特定的错误
    WebSocketServer.LOG.error(error)
  }

  /**
   * 当会话收到消息
   */
  private async onSessionMessage(session: WebSocketSession, rawMessage: string) {
    // 读取载荷
    let payload: IPayload
    try {
      // 反序列化
      payload = this.payloadSerializer.deserialize(rawMessage)

      // 检查
      if (!payload) {
        return;
      }
    } catch (e) {
      WebSocketServer.LOG.warn("Incorrect payload", rawMessage, e)
      return
    }

    try {
      // 分发载荷
      const handler = this.handlers.get(payload.type)
      const reply = handler ? (await handler(payload, session)) : undefined

      // 答复
      await session.sendPayload(WebSocketPayloads.createReplyPayload(payload, reply || undefined))
    } catch (e) {
      // 处理标准错误
      try {
        if (e instanceof LudmilaError) {
          // 准备错误消息体
          const error = {code: e.data, message: e.message}
          if (error.message === "") {
            delete error.message
          }

          // 发送错误
          const data: any = {error}
          await session.sendPayload(WebSocketPayloads.createReplyPayload(payload, data))
        } else {
          // 日志
          WebSocketServer.LOG.error("WebSocket Internal Error")

          // 发送错误
          const data: any = {error: LudmilaErrors.InternalError}
          await session.sendPayload(WebSocketPayloads.createReplyPayload(payload, data))
        }
      } catch (e) {
        WebSocketServer.LOG.error(e)
      }
    }
  }

  /**
   * 当会话关闭
   */
  private async onSessionClose(session: WebSocketSession, code: number, reason: string) {
    // 日志
    if (WebSocketServer.LOG.isTraceEnabled()) {
      WebSocketServer.LOG.trace(`Session ${session.id} closed(${code}, ${reason})`)
    }

    // 会话关闭
    try {
      await session.close()
    } catch (e) {
      WebSocketServer.LOG.error(e)
    }
  }
}
