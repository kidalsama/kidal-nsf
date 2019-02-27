"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IPayload_1 = require("../IPayload");
const Logs_1 = __importDefault(require("../../application/Logs"));
const LudmilaError_1 = __importDefault(require("../../error/LudmilaError"));
const LudmilaErrors_1 = __importDefault(require("../../error/LudmilaErrors"));
/**
 * @author tengda
 */
class WebSocketSession {
    constructor(manager, ws, sessionId, connectedAt) {
        // 上下文
        this.context = new Map();
        // 用户身份识别码
        this._uin = null;
        // 认证时间
        this._authenticatedAt = null;
        this.manager = manager;
        this.ws = ws;
        this.sessionId = sessionId;
        this.connectedAt = connectedAt;
    }
    setUin(val) {
        this._uin = val;
        if (this._uin) {
            this._authenticatedAt = new Date();
        }
        else {
            this._authenticatedAt = null;
        }
    }
    sendReplyPayload(payload) {
        return new Promise((resolve, reject) => {
            this.ws.send(IPayload_1.payloadToText(payload), (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * @override
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * @override
     */
    getConnectedAt() {
        return this.connectedAt;
    }
    /**
     * @override
     */
    getUin() {
        return this._uin;
    }
    /**
     * @override
     */
    requireUin() {
        if (this._uin) {
            return this._uin;
        }
        else {
            throw new LudmilaError_1.default(LudmilaErrors_1.default.NOT_AUTHENTICATED);
        }
    }
    /**
     * @override
     */
    getAuthenticatedAt() {
        return this._authenticatedAt;
    }
    /**
     * @override
     */
    requireAuthenticatedAt() {
        if (this._authenticatedAt) {
            return this._authenticatedAt;
        }
        else {
            throw new LudmilaError_1.default(LudmilaErrors_1.default.NOT_AUTHENTICATED);
        }
    }
    /**
     * @override
     */
    async bindUin(uin) {
        // 重复绑定
        if (this.getUin() === uin) {
            return;
        }
        // 切换账号
        if (this.getUin() && this.getUin() !== uin) {
            await this.kick();
        }
        // 登出上一个会话
        const lastSession = this.manager.getAuthenticatedSession(uin);
        if (lastSession !== null) {
            try {
                await lastSession.kick();
            }
            catch (e) {
                WebSocketSession.LOG.error(e);
            }
        }
        // 先设置uin再通知登录
        this.setUin(uin);
        this.manager.onLogin(this);
        // log
        WebSocketSession.LOG.info(`Session ${this.sessionId} bound uin: ${uin}`);
    }
    /**
     * @override
     */
    async kick() {
        // 发送被踢下线载荷
        await this.push("_kicked", {});
        // 先登出才能清理uin
        const uin = this.getUin();
        this.manager.onLogout(this);
        this.setUin(null);
        // log
        WebSocketSession.LOG.info(`Session ${this.sessionId} kicked uin: ${uin}`);
        // done
        return Promise.resolve();
    }
    /**
     * @override
     */
    push(type, data) {
        const payload = { version: IPayload_1.VERSION, type, data };
        return new Promise((resolve, reject) => {
            this.ws.send(IPayload_1.payloadToText(payload), (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     *
     */
    getContextValue(key) {
        return this.context.get(key);
    }
    /**
     *
     */
    setContextValue(key, value) {
        this.context.set(key, value);
    }
}
// log
WebSocketSession.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "WebSocketSession");
exports.default = WebSocketSession;
//# sourceMappingURL=WebSocketSession.js.map