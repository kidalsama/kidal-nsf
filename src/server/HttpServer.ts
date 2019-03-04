import * as bodyParser from "body-parser";
import express from "express";
import {Request, Response} from "express-serve-static-core";
import * as http from "http";
import Logs from "../application/Logs";
import {RpcPayloadDispatcher} from "../cluster/IRpcPayload";
import LudmilaError from "../error/LudmilaError";
import Environment from "../application/Environment";

/**
 * @author tengda
 */
export default class HttpServer {
  public static readonly S = new HttpServer();
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "HttpServer");
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
    this.expressApp.use("/static", express.static("public"));

    // 跨域
    this.expressApp.all("*", (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Methods", "GET,POST");
      next();
    });

    // 路由
    this.expressApp.get("/", (req, res) => {
      res.end("Welcome to Mcg Game Service");
    });

    // RPC
    this.expressApp.post("/rpc", async (req, res) => {
      try {
        const results = await RpcPayloadDispatcher.S.dispatch({
          type: req.body.type,
          data: req.body.data,
        });
        res.status(200).json(results);
      } catch (e) {
        if (e instanceof LudmilaError) {
          res.json({error: {code: e.code, message: e.message}});
        } else {
          HttpServer.LOG.error(e);
          res.status(404).end();
        }
      }
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
}
