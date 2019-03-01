import * as fs from "fs";
import * as log4js from "log4js";
import * as path from "path";
import * as yaml from "yaml";
import {log4jsConfig} from "./ApplicationConstants";

/**
 * 框架配置
 */
export interface IFoundationConfig {
  testingFoundation: boolean;
  serviceRootDir: string;
  resourceDirName: string;
  sourceDirName: string;
}

/**
 * 配置服务器
 */
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
  private static _INSTANCE?: Environment;

  public static get S() {
    return this._INSTANCE!;
  }

  /**
   * 当前工作目录
   * 通常情况下为 process.cwd() 的返回值
   */
  public readonly cwd: string;

  /**
   * 用户设置的应用环境
   */
  public readonly profiles: string[];

  /**
   * 环境配置
   */
  public readonly foundationConfig: IFoundationConfig;
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
  public constructor(argv: string[]) {
    this.checkArgv(argv);

    Environment._INSTANCE = this;

    // 设置核心启动配置
    this.cwd = process.cwd();
    this.profiles = argv[2].split(",");

    // 加载框架配置
    this.foundationConfig = this.loadFoundationConfig();
    this.srcDir = path.join(
      this.cwd,
      this.foundationConfig.serviceRootDir,
      argv[3],
      this.foundationConfig.sourceDirName,
    );
    this.resDir = path.join(
      this.cwd,
      this.foundationConfig.serviceRootDir,
      argv[3],
      this.foundationConfig.resourceDirName,
    );

    // 配置日志
    try {
      log4js.configure(path.join(this.resDir, `log4js-${this.profiles[0]}.json`));
    } catch (e) {
      log4js.configure(log4jsConfig);
    }
    this.log = log4js.getLogger("foundation.src.application.Environment");

    // 读取用户启动配置
    const environmentConfigPath = path.join(this.resDir, `application-${this.profiles[0]}.yml`);
    if (!fs.existsSync(environmentConfigPath)) {
      // noinspection TsLint
      console.error(`无法加载启动配置 ${environmentConfigPath}`);
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
   * 是否拥有某个环境
   */
  public hasAnyProfile(...needles: string[]): boolean {
    for (const needle of needles) {
      if (this.profiles.includes(needle)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 是否拥有全部环境
   */
  public hasAllProfile(...needles: string[]): boolean {
    for (const needle of needles) {
      if (!this.profiles.includes(needle)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 读取环境数据
   */
  private loadFoundationConfig(): IFoundationConfig {
    const defaults: IFoundationConfig = {
      testingFoundation: false,
      serviceRootDir: "services",
      resourceDirName: "res",
      sourceDirName: "src",
    }
    let config: any = {};
    try {
      config = JSON.parse(fs.readFileSync(path.join(this.cwd, `.foundation.json`)).toString("utf8"))
    } catch (e) {
      // ignored
    }
    return Object.assign({}, defaults, config)
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
      console.log("Bootstrap Command: node . <profiles> <server>")
      // noinspection TsLint
      console.log("  Example: node . dev 101-config");
      process.exit(0);
    }
  }
}
