import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import {NextFunction, Request, Response} from "express-serve-static-core";
import * as http from "http";
import Logs from "../application/Logs";
import Environment from "../application/Environment";
import * as os from "os";
import Rpc from "../cluster/Rpc";
import LudmilaError from "../error/LudmilaError";
import cors from "cors";
import LudmilaErrors from "../error/LudmilaErrors";
import {IHttpServerConfig} from "../application";
import GraphQLServer from "./graphql/GraphQLServer";
import WebSocketServer from "./websocket/WebSocketServer";
import {ServerBindingRegistry} from "./bind";
import {Component, Container} from "../ioc";
import {HttpServerManager} from "./HttpServerManager";
import IHttpServerInitializer from "./IHttpServerInitializer";

/**
 * @author tengda
 */
@Component
export default class HttpServer {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "HttpServer");

  /**
   * 获取服务器
   */
  public static acquire(name: string = "primary"): HttpServer {
    return Container.get(HttpServerManager).acquire(name)
  }

  public readonly expressApp: express.Express;
  public readonly server: http.Server;
  public readonly graphQLServer?: GraphQLServer
  public readonly webSocketServer?: WebSocketServer
  public readonly bindingRegistry: ServerBindingRegistry = new ServerBindingRegistry()

  /**
   * @param env 环境
   * @param config 配置
   * @param initializer 初始化器
   */
  constructor(
    public readonly env: Environment,
    public readonly config: IHttpServerConfig,
    public readonly initializer?: IHttpServerInitializer,
  ) {
    this.expressApp = express();
    this.server = http.createServer(this.expressApp);

    // 参数解析
    this.expressApp.use(bodyParser.urlencoded({extended: false}));
    this.expressApp.use(bodyParser.json());
    this.expressApp.use(cookieParser());

    // 要获取到反向代理后的真实IP需要信任代理
    this.expressApp.enable("trust proxy")

    // 跨域
    this.expressApp.use(cors({
      origin: ((requestOrigin, callback) => {
        callback(null, true)
      }),
      credentials: true,
    }))

    // 初始化路由
    if (initializer && initializer.routes) {
      HttpServer.LOG.warn("请不要再使用 HttpServerInitializer 的 routes 方法，使用 initRouter 方法替代")
      initializer.routes(this.expressApp)
    } else if (initializer && initializer.initRouter) {
      initializer.initRouter(this)
    }

    // 支持RPC
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
    this.graphQLServer = this.config.graphQLEndpoint
      ? new GraphQLServer(this.env, this)
      : undefined
    if (this.graphQLServer && initializer && initializer.initGraphQL) {
      initializer.initGraphQL(this, this.graphQLServer)
    }

    // WebSocket
    this.webSocketServer = this.config.webSocketEndpoint
      ? new WebSocketServer(this)
      : undefined
  }

  /**
   * 启动服务器
   */
  public async start() {
    // 扫描源码并绑定
    if (this.config.pathToScan) {
      await this.bindingRegistry.init(this, this.config.pathToScan)
    }

    // graphQL
    if (this.graphQLServer) {
      await this.graphQLServer.start()
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
    this.expressApp.use((req: Request, res: Response, next: NextFunction) => {
      if (!res.headersSent) {
        res.status(404).send("Not Found");
      }
    });

    // 错误处理
    this.expressApp.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (this.config.logError) {
        HttpServer.LOG.error(err);
      }
      if (res.headersSent) {
        res.end()
      } else {
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
