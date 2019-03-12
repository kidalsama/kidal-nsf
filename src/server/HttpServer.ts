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

/**
 * @author tengda
 */
export default class HttpServer {
  public static readonly S = new HttpServer();
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "HttpServer");
  public readonly expressApp: express.Express;
  public readonly server: http.Server;

  /**
   * 单例
   */
  private constructor() {
    this.expressApp = express();
    this.server = http.createServer(this.expressApp);

    this.expressApp.use(bodyParser.urlencoded({extended: false}));
    this.expressApp.use(bodyParser.json());
    this.expressApp.use(cookieParser());
    this.expressApp.use("/static", express.static("public"));

    // 跨域
    this.expressApp.use(cors({
      origin: ((requestOrigin, callback) => {
        callback(null, true)
      }),
      credentials: true,
    }))

    // 路由
    this.expressApp.get("/", (req, res) => {
      res.end("Welcome to Mcg Game Service");
    });

    // RPC
    this.expressApp.post("/rpc", (req, res) => {
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
    this.expressApp.get("/docker-support/health", (req, res) => {
      // TODO: 使用HealthIndicator读取健康状态
      res.status(200).end();
    });
  }

  /**
   * 启动服务器
   */
  public async start() {
    const config = Environment.S.applicationConfig.server;

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
      const port = config.port
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
        this.server.listen(config.port, "0.0.0.0", listeningListener);
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
