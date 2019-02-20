/**
 * @author tengda
 */
export default class LudmilaError extends Error {
  /**
   * 错误码
   */
  public readonly code: string;

  /**
   *
   */
  constructor(code: string, message?: string) {
    super(message);
    this.code = code;
  }
}
