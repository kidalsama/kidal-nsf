import * as log4js from "log4js";
import fetch from "node-fetch";
import * as yaml from "yaml";
import {DEFAULT_CONFIG, IBootstrapConfig, mergeConfig} from "./BootstrapConfig";
import Environment from "./Environment";
import Logs from "./Logs";
import Database from "../data/Database";
import DiscoveryClient from "../cluster/DiscoveryClient";
import GraphQLServer from "../server/graphql/GraphQLServer";
import WebSocketServer from "../server/websocket/WebSocketServer";
import PayloadDispatcher from "../server/PayloadDispatcher";
import HttpServer from "../server/HttpServer";
import DiscoveryRpcClient from "../cluster/DiscoveryRpcClient";
import {RpcPayloadDispatcher} from "../cluster/IRpcPayload";
import * as fs from "fs";
import * as path from "path";
import {applicationBanner} from "./ApplicationConstants";

/**
 * @author tengda
 */
export default class Application {
  private static LOG: log4js.Logger;
  private static _INSTANCE?: Application;
  private _bootstrapConfig?: IBootstrapConfig;

  /**
   * 应用是否处于测试启动模式
   */
  public readonly testing: boolean

  /**
   *
   */
  public constructor(testing: boolean) {
    this.testing = testing;
  }

  /**
   * 单例
   */
  public static get S(): Application {
    return this._INSTANCE!;
  }

  /**
   * 启动配置
   */
  public get bootstrapConfig(): IBootstrapConfig {
    return this._bootstrapConfig!;
  }

  /**
   * 运行应用
   * @param argv 使用 process.argv 即可
   */
  public static async run(argv: string[]): Promise<Application> {
    // 打印Banner
    // noinspection TsLint
    console.log(applicationBanner);

    // 开始启动流程
    return this.startBootstrapSequence(argv, false)
  }

  /**
   * 测试启动
   * @param serviceName 服务名
   * @param profile 环境
   */
  public static async runTest(serviceName: string, profile: string = "test"): Promise<Application> {
    // 伪造命令行参数
    const argv = ["", "", profile, serviceName]

    // 开始启动流程
    return this.startBootstrapSequence(argv, true)
  }

  // 开始启动流程
  private static async startBootstrapSequence(argv: string[], testing: boolean): Promise<Application> {
    // timer
    const startTs = Date.now();

    // （重要）第一步环境初始化
    const env = new Environment(argv);

    // 静态初始化
    this.LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "Application");
    this._INSTANCE = new Application(testing);

    // 启动
    await this._INSTANCE.boot();

    // timer
    const sec = ((Date.now() - startTs) / 1000).toFixed(3);

    // log
    Application.LOG.info(`Started ${env.id} in ${sec} seconds`);

    // 搞定
    return this._INSTANCE;
  }

  // 启动应用
  private async boot() {
    // 读取启动配置
    await this.loadBootstrapConfig()

    // 启动数据库
    await Database.S.init();

    // 启动发现服务
    await DiscoveryClient.S.init();
    await DiscoveryRpcClient.S.init();

    // 启动服务器
    await GraphQLServer.S.init();
    await WebSocketServer.S.init();
    await RpcPayloadDispatcher.S.init();
    await PayloadDispatcher.S.init();
    await HttpServer.S.start();
  }

  /**
   * 关闭应用
   */
  public async shutdown() {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await Database.S.shutdown()
  }

  /**
   * 加载启动配置
   */
  private async loadBootstrapConfig() {
    const env = Environment.S;
    const configName = `${env.id}-${env.profile}.yml`;
    const configServer = env.configServer;

    let text
    if (configServer.type === "gitlab") {
      // 如何从gitlab读取raw文件
      //  https://docs.gitlab.com/ee/api/repository_files.html#get-raw-file-from-repository
      const url = `${configServer.uri}/${configName}/raw?ref=master`;
      const response = await fetch(url, {
        headers: {
          "PRIVATE-TOKEN": configServer.token,
        },
      });
      const status = response.status;
      const respText = await response.text();
      if (status !== 200) {
        throw new Error(`无法从 ${url} 读取 Bootstrap 配置: ${respText}`);
      }
      text = respText;
    } else if (configServer.type === "local") {
      text = fs.readFileSync(path.join(env.resDir, `bootstrap-${env.profile}.yml`)).toString("utf8");
    } else {
      throw new Error(`无效的配置服务器类型 ${configServer.type}`);
    }

    // 解析配置
    this._bootstrapConfig = yaml.parse(text)

    // 合并配置
    mergeConfig(this._bootstrapConfig, DEFAULT_CONFIG)

    // 打印配置
    Application.LOG.info(
      "Bootstrap Configuration\n",
      JSON.stringify(this._bootstrapConfig, null, 2),
    );
  }
}
