/**
 * @author kidal
 */
export abstract class LudmilaErrors {
  public static makeId(m: number, g: number, s: number): number {
    return m * 1000 * 1000 + g * 1000 + s;
  }

  public static readonly OK = {id: 0, code: "NSF:OK", message: "成功"};
  public static readonly Fail = {id: 1, code: "NSF:Fail", message: "失败"};
  public static readonly InternalError = {id: 2, code: "NSF:InternalError", message: "内部错误"};
  public static readonly NotGranted = {id: 3, code: "NSF:NotGranted", message: "没有权限"};
  public static readonly IncorrectPassport = {id: 4, code: "NSF:IncorrectPassport", message: "无效的通信证"};
}
