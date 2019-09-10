import WebSocket from "ws";
import HttpServer from "../HttpServer";
import Logs from "../../application/Logs";
import WebSocketSession from "./WebSocketSession";
import uuid = require("uuid");

/**
 * @author tengda
 */
export default class WebSocketServer {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketServer");

  /**
   * WebSocket服务器实例
   */
  private wss: WebSocket.Server;
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
  private onSessionMessage(session: WebSocketSession, rawMessage: string): void {

  }

  /**
   * 当会话关闭
   */
  private onSessionClose(session: WebSocketSession, code: number, reason: string): void {
    // 日志
    if (WebSocketServer.LOG.isTraceEnabled()) {
      WebSocketServer.LOG.trace(`Session ${session.id} closed(${code}, ${reason})`)
    }

    // 会话关闭
    session
      .close()
      .then(undefined, (e) => {
        WebSocketServer.LOG.error(e)
      })
  }
}
