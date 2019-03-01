import * as log4js from "log4js";
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
import {applicationBanner} from "./ApplicationConstants";

/**
 * @author tengda
 */
export default class Application {
  private static LOG: log4js.Logger;
  private static _INSTANCE?: Application;

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
   * @param applicationConfigType 应用配置类型
   */
  public static async runTest(serviceName: string, applicationConfigType: string = "test"): Promise<Application> {
    // 伪造命令行参数
    const argv = ["", "", serviceName, applicationConfigType]

    // 开始启动流程
    return this.startBootstrapSequence(argv, true)
  }

  // 开始启动流程
  private static async startBootstrapSequence(argv: string[], testing: boolean): Promise<Application> {
    // timer
    const startTs = Date.now();

    // （重要）第一步环境初始化
    const env = new Environment(argv);
    await env.boot()

    // 静态初始化
    this.LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "Application");
    this._INSTANCE = new Application(testing);

    // 启动
    await this._INSTANCE.boot();

    // timer
    const sec = ((Date.now() - startTs) / 1000).toFixed(3);

    // log
    Application.LOG.info(`Started ${env.applicationConfig.id} in ${sec} seconds`);

    // 搞定
    return this._INSTANCE;
  }

  // 启动应用
  private async boot() {
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
    // 在测试模式延迟关闭
    if (this.testing) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 关闭服务器
    await HttpServer.S.shutdown()

    // 关闭发现服务
    await DiscoveryClient.S.shutdown()

    // 关闭数据库
    await Database.S.shutdown()
  }
}
