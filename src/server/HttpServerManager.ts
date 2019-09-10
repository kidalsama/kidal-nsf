import HttpServer from "./HttpServer";
import Environment from "../application/Environment";
import * as fs from "fs";
import Logs from "../application/Logs";
import {Autowired, Service} from "../ioc";
import {PathUtils} from "../util/index";
import IServerInitializer from "./IServerInitializer";

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
   * 服务器表
   */
  private readonly serverMap: Map<string, HttpServer> = new Map<string, HttpServer>()

  /**
   *
   */
  public constructor(
    @Autowired public readonly env: Environment,
  ) {
  }

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
    // 检查开放
    const config = this.env.applicationConfig.server
    if (!config.enabled) {
      return this
    }

    // 读取初始化器
    const initializerSrc = PathUtils.path.join(this.env.srcDir, "ServerInitializer.ts")
    const initializer: IServerInitializer = fs.existsSync(initializerSrc)
      ? require(PathUtils.replaceExt(initializerSrc, ".js")).default
      : {}

    // vars
    const names = Object.keys(config.httpServerMap)

    // 这里要先添加
    for (const name of names) {
      const server = new HttpServer(this.env, config.httpServerMap[name], initializer)
      this.serverMap.set(name, server)
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
   * 关闭全部服务器
   */
  public async shutdownAll(): Promise<void> {
    // 检查开放
    const config = this.env.applicationConfig.server
    if (!config.enabled) {
      return
    }

    for (const server of this.serverMap.values()) {
      try {
        await server.shutdown()
      } catch (e) {
        HttpServerManager.LOG.warn(e)
      }
    }
  }
}
