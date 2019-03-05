import WebSocket from "ws";
import WebSocketSessionManager from "./WebSocketSessionManager";
import HttpServer from "../HttpServer";
import Logs from "../../application/Logs";
import Environment from "../../application/Environment";

/**
 * @author tengda
 */
export default class WebSocketServer {
  public static readonly S = new WebSocketServer();
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketServer");
  private wss?: WebSocket.Server;

  /**
   * 单例
   */
  private constructor() {

  }

  public init() {
    const httpServer = HttpServer.S;
    const webSocketSessionManager = WebSocketSessionManager.S;
    const config = Environment.S.applicationConfig.server.webSocket;

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
