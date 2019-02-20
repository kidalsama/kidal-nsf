import * as fs from "fs";
import * as log4js from "log4js";
import * as path from "path";
import * as yaml from "yaml";

export interface IConfigServer {
  type: string;
  uri: string;
  username: string;
  password: string;
  token: string;
}

/**
 * @author tengda
 */
export default class Environment {
  // 单例
  public static readonly INSTANCE: Environment = new Environment(process.argv);

  public static get S() {
    return this.INSTANCE;
  }

  // 启动目录
  public readonly bootDir: string;
  // 环境
  public readonly profiles: string[];
  // 源代码目录
  public readonly srcDir: string;
  // 资源目录
  public readonly resDir: string;
  // 应用ID
  public readonly id: string;
  // 配置服务配置
  public readonly configServer: IConfigServer;
  // 日志
  private readonly log: log4js.Logger;

  /**
   *
   */
  private constructor(argv: string[]) {
    this.checkArgv(argv);

    // 设置核心启动配置
    this.bootDir = argv[1];
    this.profiles = argv[2].split(",");
    this.srcDir = path.join(this.bootDir, "src", argv[3], "src");
    this.resDir = path.join(this.bootDir, "src", argv[3], "res");

    // 配置日志
    try {
      log4js.configure(path.join(this.resDir, `log4js-${this.profiles[0]}.json`));
    } catch (e) {
      log4js.configure({
        "appenders": {
          "console": {
            "type": "console",
            "level": "trace",
            "maxLevel": "error",
            "layout": {
              "type": "pattern",
              "pattern": "%d{yyyy-MM-dd hh:mm:ss.SSS} %[%5p%] --- [%8z] %m --- %[%c%]"
            }
          }
        },
        "categories": {
          "default": {
            "appenders": [
              "console"
            ],
            "level": "all"
          }
        }
      });
    }
    this.log = log4js.getLogger("foundation.application.Environment");

    // 读取用户启动配置
    const environmentConfigPath = path.join(this.resDir, `application-${this.profiles[0]}.yml`);
    if (!fs.existsSync(environmentConfigPath)) {
      this.log.error(`无法加载启动配置 ${environmentConfigPath}`);
      process.exit(0);
    }
    const environmentConfigText = fs.readFileSync(environmentConfigPath).toString("utf8");
    const environmentConfig: any = yaml.parse(environmentConfigText);
    this.log.info(`Environment\n${JSON.stringify(environmentConfig, null, 2)}`);

    // 解析配置
    this.id = environmentConfig.application.id;
    this.configServer = {
      type: environmentConfig.application.configServer.type,
      uri: environmentConfig.application.configServer.uri,
      password: environmentConfig.application.configServer.password,
      username: environmentConfig.application.configServer.username,
      token: environmentConfig.application.configServer.token,
    };
  }

  /**
   * 主要环境
   */
  public get profile(): string {
    return this.profiles[0];
  }

  /**
   * 环境字符串
   */
  public get profilesString(): string {
    return this.profiles.join(".");
  }

  /**
   * 检查启动参数
   */
  private checkArgv(argv: string[]): void {
    // 读取启动参数
    if (argv.length !== 4) {
      // noinspection TsLint
      console.error(`Invalid bootstrap argv: ${argv.slice(2).join(" ")}`);
      // noinspection TsLint
      console.log("Bootstrap Command: node . <profiles> <server>");
      // noinspection TsLint
      console.log("  Example: node . dev 101-config");
      process.exit(0);
    }
  }
}
