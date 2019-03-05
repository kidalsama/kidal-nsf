import WebSocket from "ws";
import ISession from "../ISession";
import IPayload, {IPayloadData, payloadToText, VERSION} from "../IPayload";
import WebSocketSessionManager from "./WebSocketSessionManager";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";

/**
 * @author tengda
 */
export default class WebSocketSession implements ISession {
  // log
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketSession");
  // 管理器
  public readonly manager: WebSocketSessionManager;
  // WebSocket对象
  public readonly ws: WebSocket;
  // 会话ID
  public readonly sessionId: string;
  // 链接时间
  public readonly connectedAt: Date;
  // 上下文
  private readonly context: Map<string, any> = new Map();

  // 用户身份识别码
  private _uin: string | null = null;
  // 认证时间
  private _authenticatedAt: Date | null = null;

  public constructor(manager: WebSocketSessionManager, ws: WebSocket, sessionId: string, connectedAt: Date) {
    this.manager = manager;
    this.ws = ws;
    this.sessionId = sessionId;
    this.connectedAt = connectedAt;
  }

  public setUin(val: string | null) {
    this._uin = val;

    if (this._uin) {
      this._authenticatedAt = new Date();
    } else {
      this._authenticatedAt = null;
    }
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

  /**
   * @override
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * @override
   */
  public getConnectedAt(): Date {
    return this.connectedAt;
  }

  /**
   * @override
   */
  public getUin(): string | null {
    return this._uin;
  }

  /**
   * @override
   */
  public requireUin(): string {
    if (this._uin) {
      return this._uin;
    } else {
      throw new LudmilaError(LudmilaErrors.NOT_AUTHENTICATED);
    }
  }

  /**
   * @override
   */
  public getAuthenticatedAt(): Date | null {
    return this._authenticatedAt;
  }

  /**
   * @override
   */
  public requireAuthenticatedAt(): Date {
    if (this._authenticatedAt) {
      return this._authenticatedAt;
    } else {
      throw new LudmilaError(LudmilaErrors.NOT_AUTHENTICATED);
    }
  }

  /**
   * @override
   */
  public async login(uin: string): Promise<void> {
    // 重复绑定
    if (this.getUin() === uin) {
      return;
    }

    // 切换账号
    if (this.getUin() && this.getUin() !== uin) {
      await this.kick();
    }

    // 登出上一个会话
    const lastSession = this.manager.getAuthenticatedSession(uin);
    if (lastSession !== null) {
      try {
        await lastSession.kick();
      } catch (e) {
        WebSocketSession.LOG.error(e);
      }
    }

    // 先设置uin再通知登录
    this.setUin(uin);
    this.manager.onLogin(this);

    // log
    WebSocketSession.LOG.info(`Session ${this.sessionId} bound uin: ${uin}`);
  }

  public async logout(): Promise<void> {
    const uin = this.getUin()
    this.manager.onLogout(this)
    this.setUin(null)

    // log
    WebSocketSession.LOG.info(`Session ${this.sessionId} logout uin: ${uin}`);

    // done
    return Promise.resolve();
  }

  /**
   * @override
   */
  public async kick(): Promise<void> {
    // 发送被踢下线载荷
    await this.push("_kicked", {});

    // 先登出才能清理uin
    const uin = this.getUin()
    this.manager.onLogout(this);
    this.setUin(null);

    // log
    WebSocketSession.LOG.info(`Session ${this.sessionId} kicked uin: ${uin}`);

    // done
    return Promise.resolve();
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

  /**
   *
   */
  public getContextValue(key: string): any {
    return this.context.get(key);
  }

  /**
   *
   */
  public setContextValue(key: string, value: any): void {
    this.context.set(key, value);
  }
}
