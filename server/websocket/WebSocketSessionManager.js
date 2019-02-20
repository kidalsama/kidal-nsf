"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid/v4");
const WebSocketSession_1 = __importDefault(require("./WebSocketSession"));
const PayloadDispatcher_1 = __importDefault(require("../PayloadDispatcher"));
const IPayload_1 = require("../IPayload");
const Logs_1 = __importDefault(require("../../application/Logs"));
const LudmilaError_1 = __importDefault(require("../../error/LudmilaError"));
const LudmilaErrors_1 = __importDefault(require("../../error/LudmilaErrors"));
/**
 * @author tengda
 */
class WebSocketSessionManager {
    /**
     * 单例
     */
    constructor() {
        // 匿名会话
        this.anonymous = new Map();
        // 已认证会话
        this.authenticated = new Map();
    }
    /**
     * 会话链接
     */
    onConnected(ws) {
        const sessionId = uuid();
        const session = new WebSocketSession_1.default(this, ws, sessionId, new Date());
        // log
        WebSocketSessionManager.LOG.info(`Session ${sessionId}: connected`);
        // 添加到匿名会话
        this.anonymous.set(sessionId, session);
        // 监听消息
        ws.on("message", async (text) => {
            // 读取载荷
            let payload;
            try {
                payload = IPayload_1.textToPayload(text);
            }
            catch (e) {
                WebSocketSessionManager.LOG.warn("Received invalid payload", e);
                return;
            }
            try {
                // 分发载荷
                const { reply, sync } = await PayloadDispatcher_1.default.S.dispatch(session, payload);
                // 推送同步消息
                if (sync.partial.length + sync.full.length > 0) {
                    await session.push("sync", sync);
                }
                // 返回应答
                const replyPayload = IPayload_1.copyPayload(payload, reply);
                if (replyPayload) {
                    await session.sendReplyPayload(replyPayload);
                }
            }
            catch (e) {
                try {
                    if (e instanceof LudmilaError_1.default) {
                        const error = {
                            code: e.code,
                            message: e.message,
                        };
                        if (error.message === "") {
                            delete error.message;
                        }
                        await session.sendReplyPayload(IPayload_1.copyPayload(payload, { error }));
                    }
                    else {
                        // 内部错误
                        WebSocketSessionManager.LOG.error("Dispatch payload error", e);
                        // 发送错误
                        await session.sendReplyPayload(IPayload_1.copyPayload(payload, { error: { code: LudmilaErrors_1.default.INTERNAL_ERROR } }));
                    }
                }
                catch (e) {
                    WebSocketSessionManager.LOG.error("Rpc response error", e);
                }
            }
        });
        // 监听关闭
        ws.on("close", (code, reason) => {
            this.onClosed(session, code, reason);
        });
        return session;
    }
    /**
     * 登入
     */
    onLogin(session) {
        // 从匿名缓存移动到已认证缓存
        const uin = session.getUin();
        this.anonymous.delete(session.getSessionId());
        this.authenticated.set(uin, session);
    }
    /**
     * 登出
     */
    onLogout(session) {
        // 从已认证缓存移动到匿名缓存
        const uin = session.getUin();
        this.authenticated.delete(uin);
        this.anonymous.set(session.sessionId, session);
    }
    /**
     * 获取已认证会话
     */
    getAuthenticatedSession(uin) {
        return this.authenticated.get(uin) || null;
    }
    /**
     * 会话关闭
     */
    onClosed(session, code, reason) {
        // log
        WebSocketSessionManager.LOG.info(`Session ${session.sessionId}: closed(code: ${code}, reason: ${reason})`);
        // 匿名
        this.anonymous.delete(session.sessionId);
        // 已认证
        const uin = session.getUin();
        if (uin) {
            this.authenticated.delete(uin);
        }
    }
}
// 单例
WebSocketSessionManager.S = new WebSocketSessionManager();
// log
WebSocketSessionManager.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "WebSocketSessionManager");
exports.default = WebSocketSessionManager;
//# sourceMappingURL=WebSocketSessionManager.js.map