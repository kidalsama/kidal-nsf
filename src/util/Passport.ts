/**
 * @author tengda
 */
import Logs from "../application/Logs";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";
import Maybe from "./Maybe";

/**
 * @author tengda
 */
export class Passport {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "Passport")

  /**
   * 用户身份识别码
   */
  public readonly uin: number;

  /**
   * 识别号
   */
  public readonly token: string;

  /**
   *
   */
  public constructor(uin: number, token: string) {
    this.uin = uin;
    this.token = token
  }

  /**
   *
   */
  public toString(): string {
    return Buffer.from(`1-${this.uin}-${this.token}`).toString("base64")
  }

  /**
   *
   */
  public static parse(s: Maybe<string>): Passport {
    // 不能为空
    if (!s || s.length === 0) {
      throw new LudmilaError(LudmilaErrors.INCORRECT_PASSPORT)
    }

    // 解码
    const ds = Buffer.from(s, "base64").toString("utf8")

    // 分割版本和内容
    const pos = ds.indexOf("-")
    if (pos === -1) {
      throw new LudmilaError(LudmilaErrors.INCORRECT_PASSPORT)
    }
    const version = ds.substring(0, pos)
    const text = ds.substring(pos + 1)
    if (version.length === 0 || text.length === 1) {
      throw new LudmilaError(LudmilaErrors.INCORRECT_PASSPORT)
    }

    try {
      if (version === "1") {
        return this.parseVer1(text)
      }
    } catch (e) {
      this.LOG.error(e)
    }
    throw new LudmilaError(LudmilaErrors.INCORRECT_PASSPORT)
  }

  // 版本 #1
  private static parseVer1(text: string): Passport {
    const parts = text.split("-", 2)
    if (parts.length < 2 || parts[0].length === 0 || parts[1].length === 1) {
      throw new LudmilaError(LudmilaErrors.INCORRECT_PASSPORT)
    }
    const [id, token] = parts
    return new Passport(Number(id), token)
  }
}
