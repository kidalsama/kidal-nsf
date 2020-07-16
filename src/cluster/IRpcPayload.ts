/**
 * @author kidal
 */
export default interface IRpcPayload {
  /**
   * 版本
   */
  version: number;

  /**
   * 载荷ID.
   */
  id: number;

  /**
   * 模块
   */
  module: string;

  /**
   * 方法
   */
  method: string;

  /**
   * 数据
   */
  data?: any;
}
