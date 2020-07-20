import { LudmilaErrorData } from "./LudmilaError";

/**
 * @author kidal
 */
export abstract class LudmilaErrors {
  public static errors: LudmilaErrorData[] = [];

  public static makeId(m: number, g: number, s: number): number {
    return m * 1000 * 1000 + g * 1000 + s;
  }

  public static makeError(
    m: number,
    g: number,
    s: number,
    c: string,
    msg: string
  ): LudmilaErrorData {
    const error: LudmilaErrorData = {
      id: this.makeId(m, g, s),
      code: c,
      message: msg,
    };
    this.errors.push(error);
    return error;
  }

  public static readonly OK = LudmilaErrors.makeError(
    0,
    0,
    0,
    "NSF:OK",
    "成功"
  );
  public static readonly Fail = LudmilaErrors.makeError(
    0,
    0,
    1,
    "NSF:Fail",
    "失败"
  );
  public static readonly InternalError = LudmilaErrors.makeError(
    0,
    0,
    2,
    "NSF:InternalError",
    "内部错误"
  );
  public static readonly NotGranted = LudmilaErrors.makeError(
    0,
    0,
    3,
    "NSF:NotGranted",
    "没有权限"
  );
  public static readonly IncorrectPassport = LudmilaErrors.makeError(
    0,
    0,
    4,
    "NSF:IncorrectPassport",
    "无效的通信证"
  );
}
