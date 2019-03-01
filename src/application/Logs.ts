import * as log4js from "log4js";
import Environment from "./Environment";
import * as path from "path";

/**
 * @author tengda
 */
export default class Logs {
  // 单例
  public static readonly INSTANCE = new Logs();
  private static readonly FAKE_TARGET: any = {};

  /**
   *
   */
  private constructor() {

  }

  /**
   * 获取日至期
   */
  public getLogger(dirname: string, className: string): log4js.Logger {
    const env = Environment.S;
    const category = dirname
        .substring(env.srcDir.length + 1)
        .replace(/[\/]/g, ".")
      + "."
      + className;
    return log4js.getLogger(category);
  }

  /**
   * 获取框架日志器
   */
  public getFoundationLogger(dirname: string, className: string): log4js.Logger {
    let logger: log4js.Logger | null = null;

    return new Proxy(Logs.FAKE_TARGET, {
      get: (target, p, receiver) => {
        if (!logger) {
          logger = this.createLogger(dirname, className)
        }
        return Reflect.get(logger, p, receiver)
      },
      apply: (target, thisArg, argArray) => {
        if (!logger) {
          logger = this.createLogger(dirname, className)
        }
        return Reflect.apply(target, logger, argArray);
      },
    });

  }

  // 创建日志器
  private createLogger(dirname: string, className: string): log4js.Logger {
    const env = Environment.S;
    const category = env.foundationConfig.testingFoundation
      ? ("foundation" +
        dirname
          .substring(env.cwd.length)
          .replace(/[\/]/g, ".")
        + "."
        + className)
      : (dirname
          .substring(path.join(env.cwd, "node_modules").length + 1)
          .replace(/[\/]/g, ".")
        + "."
        + className);
    return log4js.getLogger(category);
  }
}
