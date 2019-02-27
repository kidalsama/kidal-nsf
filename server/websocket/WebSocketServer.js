"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const WebSocketSessionManager_1 = __importDefault(require("./WebSocketSessionManager"));
const Application_1 = __importDefault(require("../../application/Application"));
const HttpServer_1 = __importDefault(require("../HttpServer"));
const Logs_1 = __importDefault(require("../../application/Logs"));
/**
 * @author tengda
 */
class WebSocketServer {
    /**
     * 单例
     */
    constructor() {
    }
    init() {
        const httpServer = HttpServer_1.default.S;
        const webSocketSessionManager = WebSocketSessionManager_1.default.S;
        const config = Application_1.default.INSTANCE.bootstrapConfig.server.webSocket;
        // 服务器
        this.wss = new ws_1.default.Server({
            server: httpServer.server,
            path: config.endpoint,
        });
        // 客户端连接
        this.wss.on("connection", (ws) => {
            webSocketSessionManager.onConnected(ws);
        });
        // 错误
        this.wss.on("error", (ws, error) => {
            WebSocketServer.LOG.error(error);
        });
    }
}
WebSocketServer.S = new WebSocketServer();
WebSocketServer.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "WebSocketServer");
exports.default = WebSocketServer;
//# sourceMappingURL=WebSocketServer.js.map