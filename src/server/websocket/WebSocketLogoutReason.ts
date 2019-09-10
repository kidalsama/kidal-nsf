/**
 * 登出原因
 */
export enum WebSocketLogoutReason {
  /**
   * 正常登出
   */
  NORMAL = "NORMAL",
  /**
   * 切换账号
   */
  SWITCH = "SWITCH",
  /**
   * 在其他地方登录
   */
  ELSEWHERE = "ELSEWHERE",
  /**
   * 会话关闭
   */
  CLOSE = "CLOSE",
}
