/**
 * 错误数据
 */
export type LudmilaErrorData = { id: number, code: string, message: string }

/**
 * @author kidal
 */
export class LudmilaError extends Error {
  /**
   * 错误码
   */
  public readonly data: LudmilaErrorData;

  /**
   *
   */
  constructor(data: LudmilaErrorData, message?: string) {
    super(message);
    this.data = data;
    Error.captureStackTrace(this, this.constructor)
  }
}
