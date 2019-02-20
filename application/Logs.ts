import * as log4js from "log4js";
import Environment from "./Environment";

/**
 * @author tengda
 */
export default class Logs {
  // 单例
  public static readonly INSTANCE = new Logs();

  /**
   *
   */
  private constructor() {

  }

  /**
   * 获取日至期
   */
  public getLogger(dirname: string, className: string): log4js.Logger {
    const env = Environment.INSTANCE;
    const category = dirname
        .substring(env.srcDir.length + 1)
        .replace(/[\/]/g, ".")
      + "."
      + className;
    return log4js.getLogger(category);
  }

  /**
   * 获取核心日期指
   */
  public getFoundationLogger(dirname: string, className: string): log4js.Logger {
    const env = Environment.INSTANCE;
    const category = dirname
        .substring(env.bootDir.length + "/services/".length)
        .replace(/[\/]/g, ".")
      + "."
      + className;
    return log4js.getLogger(category);
  }
}
