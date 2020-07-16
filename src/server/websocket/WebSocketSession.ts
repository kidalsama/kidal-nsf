import WebSocket from "ws";
import Logs from "../../application/Logs";
import WebSocketServer from "./WebSocketServer";
import Maybe from "../../util/Maybe";
import {IPayload, IPayloadData, WebSocketPayloads} from "./WebSocketPayloads";
import {WebSocketLogoutReason} from "./WebSocketLogoutReason";

/**
 * @author kidal
 */
export default class WebSocketSession {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketSession");

  /**
   * 上下文
   */
  public readonly context: Map<string, any> = new Map();
  /**
   * 用户身份识别码
   */
  private _uin?: string;
  /**
   * 认证时间
   */
  private _authenticatedAt?: Date;

  /**
   * 关闭时间
   */
  private _closedAt?: Date

  /**
   * @param server 服务器
   * @param ws 链接
   * @param id 会话ID
   * @param connectedAt 会话链接时间
   */
  public constructor(
    public readonly server: WebSocketServer,
    public readonly ws: WebSocket,
    public readonly id: string,
    public readonly connectedAt: Date,
  ) {
  }

  /**
   * 链接是否已经关闭
   */
  public get closed(): boolean {
    return this.ws.readyState === WebSocket.CLOSING
      || this.ws.readyState === WebSocket.CLOSED
  }

  /**
   * 已经登录
   */
  public get loggedIn(): boolean {
    return this._uin !== undefined
  }

  /**
   * 用户身份识别号
   */
  public get uin(): string {
    return this._uin!
  }

  /**
   * 用户认证时间
   */
  public get authenticatedAt(): Date {
    return this._authenticatedAt!
  }

  /**
   * 会话关闭时间
   */
  public get closedAt(): Date | undefined {
    return this._closedAt
  }

  /**
   * 设置会话的用户身份识别号.
   * 设置过后会话会由匿名会话转为已认证会话.
   * @param val 用户身份识别号; null: 取消认证.
   */
  private setUin(val: Maybe<string>) {
    this._uin = (val === undefined || val === null)
      ? undefined
      : val;
    this._authenticatedAt = this._uin === undefined
      ? undefined
      : new Date()
  }

  /**
   * 会话登录
   */
  public async login(uin: string): Promise<void> {
    if (this.loggedIn) {
      // 重复登录不做处理
      if (this.uin === uin) {
        return;
      }

      // 登出现有会话
      await this.logout(WebSocketLogoutReason.SWITCH);
    }

    // 登出已登录的会话
    const lastSession = this.server.getAuthenticatedSessionByUin(uin);
    if (lastSession) {
      try {
        await lastSession.logout(WebSocketLogoutReason.ELSEWHERE);
      } catch (e) {
        WebSocketSession.LOG.error(e);
      }
    }

    // 先设置uin再通知登录
    this.setUin(uin);
    this.server.onLogin(this);

    // 发送登录载荷
    await this.sendPayload(WebSocketPayloads.createLoginPayload(this.uin, this.authenticatedAt))

    // log
    if (WebSocketSession.LOG.isTraceEnabled()) {
      WebSocketSession.LOG.trace(`Session ${this.id} bound uin: ${uin}`);
    }
  }

  /**
   * 会话登出
   */
  public async logout(reason: WebSocketLogoutReason = WebSocketLogoutReason.NORMAL): Promise<void> {
    // 未登录不做处理
    if (!this.loggedIn) {
      return
    }

    // 通知服务器登出会话并清理uin
    const uin = this.uin
    this.server.onLogout(this)
    this.setUin(null)

    // 发送载荷
    await this.sendPayload(WebSocketPayloads.createLogoutPayload(reason))

    // log
    if (WebSocketSession.LOG.isTraceEnabled()) {
      WebSocketSession.LOG.trace(`Session ${this.id} logout uin: ${uin}`);
    }
  }

  /**
   * 关闭会话
   */
  public async close(): Promise<void> {
    // 获取uin
    const uin = this.loggedIn ? this.uin : undefined

    // 登出
    await this.logout(WebSocketLogoutReason.CLOSE)

    // 关闭会话
    if (!this.closed) {
      this.ws.close()
    }

    // log
    if (WebSocketSession.LOG.isTraceEnabled()) {
      WebSocketSession.LOG.trace(`Session ${this.id} closed uin: ${uin}`);
    }
  }

  /**
   * 发送消息
   */
  public async sendMessage(type: string, data?: IPayloadData): Promise<void> {
    const payload = WebSocketPayloads.createPayload(type, data)
    return await this.sendPayload(payload)
  }

  /**
   * 发送载荷
   */
  public async sendPayload(payload: IPayload): Promise<void> {
    // 关闭后不能再发送载荷
    if (this.closed) {
      return
    }

    // 发送载荷
    return new Promise<void>((resolve, reject) => {
      const text = this.server.payloadSerializer.serialize(payload)
      if (text) {
        this.ws.send(text, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
      }
    })
  }
}
