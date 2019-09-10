import WebSocket from "ws";
import IPayload, {IPayloadData, payloadToText, VERSION} from "../IPayload";
import Logs from "../../application/Logs";
import WebSocketServer from "./WebSocketServer";
import Maybe from "../../util/Maybe";

/**
 * @author tengda
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
   * 用户身份识别号
   */
  public get uin(): string | undefined {
    return this._uin
  }

  /**
   * 用户认证时间
   */
  public get authenticatedAt(): Date | undefined {
    return this._authenticatedAt
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
    // 重复登录不做处理
    if (this.uin === uin) {
      return;
    }

    // 登出现有会话
    if (this.uin) {
      await this.logout();
    }

    // 登出已登录的会话
    const lastSession = this.server.getAuthenticatedSessionByUin(uin);
    if (lastSession) {
      try {
        await lastSession.logout();
      } catch (e) {
        WebSocketSession.LOG.error(e);
      }
    }

    // 先设置uin再通知登录
    this.setUin(uin);
    this.server.onLogin(this);

    // log
    if (WebSocketSession.LOG.isTraceEnabled()) {
      WebSocketSession.LOG.trace(`Session ${this.id} bound uin: ${uin}`);
    }
  }

  /**
   * 会话登出
   */
  public async logout(): Promise<void> {
    // 通知服务器登出会话并清理uin
    const uin = this.uin
    this.server.onLogout(this)
    this.setUin(null)

    // log
    if (WebSocketSession.LOG.isTraceEnabled()) {
      WebSocketSession.LOG.trace(`Session ${this.id} logout uin: ${uin}`);
    }
  }

  /**
   * 关闭会话
   */
  public async close(): Promise<void> {
    // 发送载荷明示关闭原因
    await this.push("_close", {reason});

    // 先登出才能清理uin
    const uin = this.uin
    this.server.onLogout(this);
    this.setUin(null);

    // log
    if (WebSocketSession.LOG.isTraceEnabled()) {
      WebSocketSession.LOG.trace(`Session ${this.id} kicked uin: ${uin}`);
    }
  }

  /**
   * @override
   */
  public push(type: string, data: IPayloadData): Promise<void> {
    const payload = {version: VERSION, type, data};

    return new Promise<void>((resolve, reject) => {
      this.ws.send(payloadToText(payload), (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public sendReplyPayload(payload: IPayload): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.ws.send(payloadToText(payload), (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
