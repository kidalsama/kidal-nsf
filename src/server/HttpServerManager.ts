import HttpServer from "./HttpServer";
import Environment from "../application/Environment";
import * as fs from "fs";
import Logs from "../application/Logs";
import {Service} from "../ioc";

/**
 * @author tengda
 */
@Service
export class HttpServerManager {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "HttpServerManager");

  /**
   * 字典
   */
  private readonly serverMap: Map<string, HttpServer> = new Map<string, HttpServer>()

  /**
   * 获取服务器
   */
  public acquire(name: string = "primary"): HttpServer {
    const server = this.serverMap.get(name)
    if (server === undefined) {
      throw new Error(`Server ${name} not found`)
    }
    return server
  }

  /**
   * 初始化全部
   */
  public async boot(): Promise<HttpServerManager> {
    // 控制器
    const initializerSrc = `${Environment.S.srcDir}/HttpServerInitializer.js`
    let initializer: any = {}
    if (fs.existsSync(initializerSrc)) {
      initializer = require(initializerSrc).default
    }

    const config = Environment.S.applicationConfig.server
    if (!config.enabled) {
      return this
    }

    // vars
    const names = Object.keys(config.httpServerMap)

    // 这里要先添加
    for (const name of names) {
      this.serverMap.set(name, new HttpServer(config.httpServerMap[name], initializer))
    }

    // 启动服务器
    for (const name of this.serverMap.keys()) {
      const server = this.serverMap.get(name)
      if (server) {
        await server.start()
      }
    }

    // done
    return this
  }

  /**
   * 关闭全部数据库
   */
  public async shutdownAll(): Promise<void> {
    for (const server of this.serverMap.values()) {
      try {
        await server.shutdown()
      } catch (e) {
        HttpServerManager.LOG.warn(e)
      }
    }
  }
}
