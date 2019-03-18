import WebSocket from "ws";
import WebSocketSessionManager from "./WebSocketSessionManager";
import HttpServer from "../HttpServer";
import Logs from "../../application/Logs";

/**
 * @author tengda
 */
export default class WebSocketServer {
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "WebSocketServer");
  private wss?: WebSocket.Server;
  public readonly httpServer: HttpServer

  public constructor(httpServer: HttpServer) {
    this.httpServer = httpServer
  }

  public init() {
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
