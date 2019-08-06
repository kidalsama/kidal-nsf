import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import {Request, Response} from "express-serve-static-core";
import * as http from "http";
import Logs from "../application/Logs";
import Environment from "../application/Environment";
import * as os from "os";
import Rpc from "../cluster/Rpc";
import LudmilaError from "../error/LudmilaError";
import cors from "cors";
import LudmilaErrors from "../error/LudmilaErrors";
import {IHttpServerConfig} from "../application/ApplicationConfig";
import GraphQLServer from "./graphql/GraphQLServer";
import WebSocketServer from "./websocket/WebSocketServer";
import * as fs from "fs";

/**
 * @author tengda
 */
export default class HttpServer {
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "HttpServer");
  public static readonly serverMap: Map<string, HttpServer> = new Map()

  /**
   * 获取服务器
   */
  public static acquire(name: string = "primary"): HttpServer {
    const server = this.serverMap.get(name)
    if (server === undefined) {
      throw new Error(`Server ${name} not found`)
    }
    return server
  }

  /**
   * 初始化全部
   */
  public static async initAll(): Promise<void> {
    // 控制器
    const initializerSrc = `${Environment.S.srcDir}/HttpServerInitializer.js`
    let initializer: any = {}
    if (fs.existsSync(initializerSrc)) {
      initializer = require(initializerSrc).default
    }

    const config = Environment.S.applicationConfig.server
    if (!config.enabled) {
      return
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
  }

  /**
   * 关闭全部数据库
   */
  public static async shutdownAll(): Promise<void> {
    for (const server of this.serverMap.values()) {
      try {
        await server.shutdown()
      } catch (e) {
        this.LOG.warn(e)
      }
    }
  }

  public readonly config: IHttpServerConfig;
  public readonly expressApp: express.Express;
  public readonly server: http.Server;
  public readonly graphQLServer?: GraphQLServer
  public readonly webSocketServer?: WebSocketServer

  /**
   * 单例
   */
  private constructor(config: IHttpServerConfig, initializer: any) {
    this.config = config;
    this.expressApp = express();
    this.server = http.createServer(this.expressApp);

    this.expressApp.use(bodyParser.urlencoded({extended: false}));
    this.expressApp.use(bodyParser.json());
    this.expressApp.use(cookieParser());

    // 跨域
    this.expressApp.use(cors({
      origin: ((requestOrigin, callback) => {
        callback(null, true)
      }),
      credentials: true,
    }))

    // 路由
    if (initializer && initializer.routes) {
      HttpServer.LOG.warn("请不要再使用 HttpServerInitializer 的 routes 方法，使用 initRouter 方法替代")
      initializer.routes(this.expressApp)
    } else if (initializer && initializer.initRouter) {
      initializer.initRouter(this)
    }

    // RPC
    this.expressApp.post("/.nsf/rpc", (req, res) => {
      Rpc.S.httpCallLocalProcedure(req.body)
        .then((ret) => {
          res.status(200).json(ret)
        })
        .catch((e) => {
          if (e instanceof LudmilaError) {
            res.status(200).json({error: {code: e.code, message: e.message}})
          } else {
            if (HttpServer.LOG.isDebugEnabled()) {
              HttpServer.LOG.error(e)
            }
            res.status(200).json({error: {code: LudmilaErrors.FAIL, message: e.message}})
          }
        })
    });

    // docker 健康检查支持
    this.expressApp.get("/.nsf/health", (req, res) => {
      // TODO: 使用HealthIndicator读取健康状态
      res.status(200).end();
    });

    // graphQL
    this.graphQLServer = this.config.graphQLEndpoint ? new GraphQLServer(this) : undefined
    if (this.graphQLServer && initializer && initializer.initGraphQL) {
      initializer.initGraphQL(this, this.graphQLServer)
    }
    // WebSocket
    this.webSocketServer = this.config.webSocketEndpoint ? new WebSocketServer(this) : undefined
  }

  /**
   * 启动服务器
   */
  public async start() {
    // graphQL
    if (this.graphQLServer) {
      this.graphQLServer.init()
    }
    // webSocket
    if (this.webSocketServer) {
      this.webSocketServer.init()
    }

    // 静态文件
    if (this.config.staticMapping) {
      for (const path of Object.keys(this.config.staticMapping)) {
        const dir = this.config.staticMapping[path]
        this.expressApp.use(path, express.static(dir));
      }
    }

    // 404
    this.expressApp.use("*", (req, res) => {
      res.status(404).send("Not Found");
    });

    // 错误处理
    this.expressApp.use((err: any, req: Request, res: Response) => {
      if (err instanceof Error) {
        res.status(200).json({error: {code: 1, message: err.message}});
      } else {
        HttpServer.LOG.error(err);
        res.status(500).send("Server Internal Error");
      }
    });

    // 监听http
    return new Promise((resolve, reject) => {
      const port = this.config.port
      const listeningListener = () => {
        const address = this.server.address();
        if (address === null) {
          reject(new Error("Server's address is null"));
        } else if (typeof address === "string") {
          HttpServer.LOG.info(`Listen at ${address}`);
        } else {
          HttpServer.LOG.info(`Listen at ${address.address}:${address.port}`);
        }
        resolve();
      }
      if (port < 0) {
        resolve()
      } else if (port === 0) {
        this.server.listen(listeningListener)
      } else {
        this.server.listen(this.config.port, "0.0.0.0", listeningListener);
      }
    });
  }

  /**
   * 关闭服务器
   */
  public async shutdown() {
    this.server.close()
  }

  /**
   * 获取Ip
   */
  public get ip(): string | null {
    const networkInterfaces = os.networkInterfaces();

    for (const networkInterfaceKey in networkInterfaces) {
      if (!networkInterfaces.hasOwnProperty(networkInterfaceKey)) {
        continue;
      }
      const networkInterface = networkInterfaces[networkInterfaceKey];
      for (const alias of networkInterface) {
        if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
          return alias.address;
        }
      }
    }

    return null;
  }

  /**
   * 获取端口
   */
  public get port(): number {
    const address = this.server.address();
    if (address === null) {
      return -1;
    } else if (typeof address === "string") {
      return Number(address.split(":")[1])
    } else {
      return address.port
    }
  }
}
