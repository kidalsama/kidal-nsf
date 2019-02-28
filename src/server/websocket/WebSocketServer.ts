import WebSocket from "ws";
import WebSocketSessionManager from "./WebSocketSessionManager";
import Application from "../../application/Application";
import HttpServer from "../HttpServer";
import Logs from "../../application/Logs";

/**
 * @author tengda
 */
export default class WebSocketServer {
  public static readonly S = new WebSocketServer();
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "WebSocketServer");
  private wss?: WebSocket.Server;

  /**
   * 单例
   */
  private constructor() {

  }

  public init() {
    const httpServer = HttpServer.S;
    const webSocketSessionManager = WebSocketSessionManager.S;
    const config = Application.INSTANCE.bootstrapConfig.server.webSocket;

    // 服务器
    this.wss = new WebSocket.Server({
      server: httpServer.server,
      path: config.endpoint,
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