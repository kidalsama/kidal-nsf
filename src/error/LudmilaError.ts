/**
 * @author tengda
 */
export default class LudmilaError extends Error {
  /**
   * 错误码
   */
  public readonly code: string | number;

  /**
   *
   */
  constructor(code: string | number, message?: string) {
    super(message);
    this.code = code;
  }
}
