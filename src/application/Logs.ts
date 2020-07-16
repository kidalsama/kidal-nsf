import * as log4js from "log4js";
import Environment from "./Environment";
import * as path from "path";
import {Container} from "../ioc/Container";

/**
 * @author kidal
 */
export default class Logs {
  /**
   * 单例
   */
  public static get S() {
    return Container.get(Logs)
  }

  /**
   * 环境
   */
  public readonly env: Environment

  /**
   *
   */
  public constructor(env: Environment) {
    this.env = env
  }

  /**
   * 获取日志
   * @param dirname 目录，传入[[__dirname]]即可
   * @param className 类名
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

    return new Proxy({} as any, {
      get: (target, p, receiver) => {
        if (!logger) {
          logger = this.createLogger(dirname, className)
        }
        return Reflect.get(logger, p, receiver)
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
