import * as fs from "fs";
import * as log4js from "log4js";
import * as path from "path";
import * as yaml from "yaml";
import {log4jsConfig} from "./ApplicationConstants";
import {completeApplicationConfig, IApplicationConfig, mergeConfig} from "./ApplicationConfig";
import fetch from "node-fetch";

/**
 * 框架配置
 */
export interface IFoundationConfig {
  testingFoundation: boolean;
  servicesRootDir: string;
  resourceDirName: string;
  sourceDirName: string;
}

/**
 * 默认框架配置
 */
export const DEFAULT_FOUNDATION_CONFIG: IFoundationConfig = {
  testingFoundation: false,
  servicesRootDir: "services",
  resourceDirName: "resource",
  sourceDirName: "src",
}

/**
 * @author tengda
 */
export default class Environment {
  private static LOG: log4js.Logger;
  private static _INSTANCE?: Environment;
  private _applicationConfig?: IApplicationConfig;
  private _settings?: any;

  /**
   * 单例
   */
  public static get S() {
    return this._INSTANCE!;
  }

  /**
   * 当前工作目录
   * 通常情况下为 process.cwd() 的返回值
   */
  public readonly cwd: string;

  /**
   * 服务名
   */
  public readonly serviceName: string;

  /**
   * 应用配置名
   */
  public readonly applicationConfigName: string;

  /**
   * 环境配置
   */
  public readonly foundationConfig: IFoundationConfig;

  /**
   * 源代码目录
   */
  public readonly srcDir: string;

  /**
   * 资源目录
   */
  public readonly resourceDir: string;

  /**
   * 正在测试框架
   */
  public readonly testing: boolean;

  /**
   * 应用配置
   */
  public get applicationConfig(): IApplicationConfig {
    return this._applicationConfig!;
  }

  /**
   * 设置
   */
  public get settings(): any {
    return this._settings;
  }

  /**
   *
   */
  public constructor(argv: string[], testing: boolean) {
    // 检查参数
    this.checkArgv(argv);

    // 单例
    Environment._INSTANCE = this;

    // 启动参数
    this.testing = testing;
    this.cwd = process.cwd();
    this.serviceName = argv[2];
    this.applicationConfigName = argv[3];

    // 加载框架配置
    this.foundationConfig = this.loadFoundationConfig();

    // 源代码位置
    this.srcDir = path.join(
      this.cwd,
      this.foundationConfig.servicesRootDir,
      this.serviceName,
      this.foundationConfig.sourceDirName,
    );

    // 资源位置
    this.resourceDir = path.join(
      this.cwd,
      this.foundationConfig.servicesRootDir,
      this.serviceName,
      this.foundationConfig.resourceDirName,
    );

    // 配置log4js
    try {
      log4js.configure(path.join(this.resourceDir, `log4js-${this.applicationConfigName}.json`));
    } catch (e) {
      log4js.configure(log4jsConfig);
    }

    // 创建日志器
    Environment.LOG = log4js.getLogger("foundation.src.application.Environment");
  }

  // 进一步启动
  public async boot() {
    // 读取应用配置
    this._applicationConfig = await this.loadApplicationConfig()

    // 读取设置
    this._settings = await this.loadSettings()

    // 打印参数
    Environment.LOG.info(`CurrentWorkingDirectory: ${this.cwd}
ServiceName: ${this.serviceName}
ApplicationConfigName: ${this.applicationConfigName}
SourceDirectory: ${this.srcDir}
ResourceDirectory: ${this.resourceDir}
FoundationConfig ---------------------
${JSON.stringify(this.foundationConfig, null, 2)}
ApplicationConfig ---------------------
${JSON.stringify(this.applicationConfig, null, 2)}
Settings ---------------------
${this._settings ? JSON.stringify(this._settings, null, 2) : "undefined"}
`);
  }

  /**
   * 环境
   */
  public get profiles(): string[] {
    return this.applicationConfig.profiles;
  }

  /**
   * 主要环境
   */
  public get majorProfile(): string {
    return this.applicationConfig.profiles[0];
  }

  /**
   * 环境字符串
   */
  public get profilesString(): string {
    return this.applicationConfig.profiles.join(".");
  }

  /**
   * 是否拥有某个环境
   */
  public hasAnyProfile(...needles: string[]): boolean {
    for (const needle of needles) {
      if (this.applicationConfig.profiles.includes(needle)) {
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
      if (!this.applicationConfig.profiles.includes(needle)) {
        return false;
      }
    }
    return true;
  }

  // 读取矿建配置
  private loadFoundationConfig(): IFoundationConfig {
    let config: any = {};
    try {
      const filename = path.join(this.cwd, `.foundation.json`)
      const text = fs.readFileSync(filename).toString("utf8")
      config = JSON.parse(text)
    } catch (e) {
      // ignored
    }
    mergeConfig(config, DEFAULT_FOUNDATION_CONFIG)
    return config;
  }

  // 读取应用配置
  private async loadApplicationConfig(): Promise<IApplicationConfig> {
    // 加载本地配置
    const filename = path.join(this.resourceDir, `application-${this.applicationConfigName}.yml`)
    if (!fs.existsSync(filename)) {
      // noinspection TsLint
      console.error(`无法加载启动配置 ${filename}`);
      process.exit(0);
    }
    const localConfigText = fs.readFileSync(filename).toString("utf8");
    const localConfig: IApplicationConfig = yaml.parse(localConfigText);

    // 合并应用配置
    return await this.mergeApplicationConfig(localConfig)
  }

  // 合并应用配置
  private async mergeApplicationConfig(localConfig: IApplicationConfig): Promise<IApplicationConfig> {
    const configServer = localConfig.configServer;

    if (configServer.type === "local") {
      return completeApplicationConfig(localConfig)
    } else if (configServer.type === "gitlab") {
      // 如何从gitlab读取raw文件
      //  https://docs.gitlab.com/ee/api/repository_files.html#get-raw-file-from-repository
      const url = `${configServer.uri}/${localConfig.id}-${localConfig.profiles[0]}.yml/raw?ref=master`;
      const response = await fetch(url, {
        headers: {
          "PRIVATE-TOKEN": configServer.token!,
        },
      });
      const status = response.status;
      const text = await response.text();
      if (status !== 200) {
        throw new Error(`无法从 ${url} 读取 Bootstrap 配置: ${text}`);
      }

      // 解析配置
      const gitlabConfig = yaml.parse(text)
      mergeConfig(gitlabConfig, localConfig)
      return gitlabConfig
    } else {
      throw new Error(`无效的配置服务器类型 ${configServer.type}`);
    }
  }

  // 读取设置
  private async loadSettings(): Promise<any> {
    // 加载本地配置
    const filename = path.join(this.resourceDir, `settings-${this.applicationConfigName}.yml`)
    if (!fs.existsSync(filename)) {
      return undefined
    }
    const localConfigText = fs.readFileSync(filename).toString("utf8");
    return yaml.parse(localConfigText);
  }

  // 检查启动参数
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
