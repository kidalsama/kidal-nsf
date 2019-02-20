import {IPayloadData} from "./IPayload";

/**
 * @author tengda
 */
export default interface ISession {
  /**
   * 获取会话ID.
   */
  getSessionId(): string;

  /**
   * 获取连接时间.
   */
  getConnectedAt(): Date;

  /**
   * 获取用户身份识别码.
   */
  getUin(): string | null;

  /**
   * 获取用户身份识别码.
   */
  requireUin(): string;

  /**
   * 获取认证时间
   */
  getAuthenticatedAt(): Date | null;

  /**
   * 获取认证时间
   */
  requireAuthenticatedAt(): Date;

  /**
   * 绑定会话
   */
  bindUin(uin: string): Promise<void>;

  /**
   * 踢下线
   */
  kick(): Promise<void>;

  /**
   * 推送载荷
   */
  push(type: string, data: IPayloadData): Promise<void>;

  /**
   * 获取上下文参数
   */
  getContextValue(key: string): any;

  /**
   * 设置上下文参数
   */
  setContextValue(key: string, value: any): void;
}
