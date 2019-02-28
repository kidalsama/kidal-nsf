import ISession from "./ISession";

/**
 * @author tengda
 */
export default interface ISessionManager {
  /**
   * 获取已认证会话
   */
  getAuthenticatedSession(uin: string): ISession | null;
}
