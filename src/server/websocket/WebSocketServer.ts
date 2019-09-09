import WebSocket from "ws";
import WebSocketSessionManager from "./WebSocketSessionManager";
import HttpServer from "../HttpServer";
import Logs from "../../application/Logs";
import {Environment} from "../../application";

/**
 * @author tengda
 */
export default class WebSocketServer {
  /**
   * 日志
   */
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketServer");

  /**
   * WebSocket服务器实例
   */
  private wss?: WebSocket.Server;

  /**
   *
   */
  public constructor(
    public readonly httpServer: HttpServer,
  ) {
    this.httpServer = httpServer
  }

  /**
   * 启动
   */
  public async start() {
    const webSocketSessionManager = WebSocketSessionManager.S;

    // 服务器
    this.wss = new WebSocket.Server({
      server: this.httpServer.server,
      path: this.httpServer.config.webSocketEndpoint,
    });

    // 客户端连接
    this.wss.on("connection", (ws: WebSocket) => {
      webSocketSessionManager.onConnected(ws);
    });

    // 错误
    this.wss.on("error", (ws: WebSocket, error: Error) => {
      WebSocketServer.LOG.error(error);
    });
  }
}
