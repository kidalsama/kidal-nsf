import * as log4js from "log4js";
import Environment from "./Environment";
import Logs from "./Logs";
import Database from "../data/Database";
import DiscoveryClient from "../cluster/DiscoveryClient";
import HttpServer from "../server/HttpServer";
import Rpc from "../cluster/Rpc";
import {applicationBanner} from "./ApplicationConstants";
import WebSocketApiManager from "../server/websocket/WebSocketApiManager";
import RpcApiManager from "../cluster/RpcApiManager";
import * as fs from "fs";
import {Container, Scope, Service} from "../ioc";

/**
 * @author tengda
 */
@Service
export default class Application {
  /**
   * 单例
   */
  public static get S(): Application {
    return Container.get(Application)
  }

  /**
   * 日志
   */
  private static LOG: log4js.Logger;

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

    // 绑定类型
    Container
      .bind(Environment)
      .scope(Scope.SINGLETON)
      .provider({
        get() {
          return new Environment(argv, testing)
        },
      })
    Container.bind(Logs)
      .scope(Scope.SINGLETON)
      .provider({
        get() {
          return new Logs(Container.get(Environment))
        },
      })

    // 环境
    const env = Container.get(Environment)
    await env.boot()

    // 日志初始化
    const logs = Container.get(Logs)
    this.LOG = logs.getFoundationLogger(__dirname, "Application");

    // 启动应用程序
    await this.S.boot();

    // timer
    const sec = ((Date.now() - startTs) / 1000).toFixed(3);

    // log
    Application.LOG.info(`Started ${env.applicationConfig.id} in ${sec} seconds`);

    // 搞定
    return this.S;
  }

  // 启动应用
  private async boot() {
    // 启动数据库
    await Database.initAll()

    // 启动服务器
    await WebSocketApiManager.S.init();
    await HttpServer.initAll()

    // 启动发现服务
    await DiscoveryClient.S.init();

    // Rpc
    await RpcApiManager.S.init();
    await Rpc.S.init();

    // 加载入口
    const entry = `${Environment.S.srcDir}/Entry.js`
    if (fs.existsSync(entry)) {
      require(entry)
    }
  }

  /**
   * 关闭应用
   */
  public async shutdown() {
    // 在测试模式延迟关闭
    if (Environment.S.testing) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 关闭服务器
    await HttpServer.shutdownAll()

    // 关闭发现服务
    await DiscoveryClient.S.shutdown()

    // 关闭数据库
    await Database.shutdownAll()
  }
}
