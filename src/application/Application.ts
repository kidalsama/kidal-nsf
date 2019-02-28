import * as log4js from "log4js";
import fetch from "node-fetch";
import * as yaml from "yaml";
import {IBootstrapConfig, normalizeBootstrapConfig} from "./BootstrapConfig";
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

/**
 * @author tengda
 */
export default class Application {
  // 日志
  private static LOG: log4js.Logger;

  // 单例
  private static _INSTANCE?: Application;

  /**
   * 单例
   */
  public static get INSTANCE(): Application {
    return this._INSTANCE!;
  }

  public static get S(): Application {
    return this._INSTANCE!;
  }

  // 启动配置
  private _bootstrapConfig?: IBootstrapConfig;

  /**
   * 启动配置
   */
  public get bootstrapConfig(): IBootstrapConfig {
    return this._bootstrapConfig!;
  }

  /**
   * 启动
   */
  public static async run(argv: string[]): Promise<Application> {
    if (argv[2].indexOf("test") === -1) {
      // noinspection TsLint
      console.log(`
============================================================
                      _ooOoo_
                     o8888888o
                     88" . "88
                     (| -_- |)
                     O\\  =  /O
                  ____/\`---'\\____
                .'  \\\\|     |//  \`.
               /  \\\\|||  :  |||//  \\
              /  _||||| -:- |||||-  \\
              |   | \\\\\\  -  /// |   |
              | \\_|  ''\\---/''  |   |
              \\  .-\\__  \`-\`  ___/-. /
            ___\`. .'  /--.--\\  \`. . __
         ."" '<  \`.___\\_<|>_/___.'  >'"".
        | | :  \`- \\\`.;\`\\ _ /\`;.\`/ - \` : | |
        \\  \\ \`-.   \\_ __\\ /__ _/   .-\` /  /
   ======\`-.____\`-.___\\_____/___.-\`____.-'======
                      \`=---='
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 佛祖保佑       永无BUG
============================================================`);
    }

    // 日志
    this.LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "Application");

    // 实例化
    this._INSTANCE = new Application();

    // 启动
    await this._INSTANCE.boot(argv);

    // done
    return this._INSTANCE;
  }

  /**
   * 测试启动
   */
  public static async runTest(serviceName: string): Promise<Application> {
    return this.run(["", "", "test", serviceName])
  }

  /**
   * 启动
   */
  private async boot(argv: string[]) {
    const env = new Environment(argv);

    // timer
    const startTs = Date.now();

    // 读取启动配置
    this._bootstrapConfig = normalizeBootstrapConfig(yaml.parse(await this.loadBootstrapConfig()));
    Application.LOG.info("Bootstrap Configuration\n",
      JSON.stringify(this._bootstrapConfig, null, 2));

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

    // timer
    const sec = ((Date.now() - startTs) / 1000).toFixed(3);

    // log
    Application.LOG.info(`Started ${env.id} in ${sec} seconds`);
  }

  /**
   * 关闭
   */
  public async shutdown() {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await Database.S.shutdown()
  }

  /**
   * 加载启动配置
   */
  private async loadBootstrapConfig(): Promise<string> {
    const env = Environment.S;
    const configName = `${env.id}-${env.profile}.yml`;
    const configServer = env.configServer;

    if (configServer.type === "gitlab") {
      // 如何从gitlab读取raw文件
      //  https://docs.gitlab.com/ee/api/repository_files.html#get-raw-file-from-repository
      const url = `${configServer.uri}/${configName}/raw?ref=master`;
      const response = await fetch(url, {
        headers: {
          "PRIVATE-TOKEN":configServer.token,
        },
      });
      const status = response.status;
      const text = await response.text();
      if (status !== 200) {
        throw new Error(`无法从 ${url} 读取 Bootstrap 配置: ${text}`);
      }
      return text;
    } else if (configServer.type === "local") {
      return fs.readFileSync(path.join(env.resDir, `bootstrap-${env.profile}.yml`)).toString("utf8");
    } else {
      throw new Error(`无效的配置服务器类型 ${configServer.type}`);
    }
  }
}
