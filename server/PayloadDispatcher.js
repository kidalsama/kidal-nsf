"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const Logs_1 = __importDefault(require("../application/Logs"));
const LudmilaError_1 = __importDefault(require("../error/LudmilaError"));
const LudmilaErrors_1 = __importDefault(require("../error/LudmilaErrors"));
const Environment_1 = __importDefault(require("../application/Environment"));
const clsHooked = __importStar(require("cls-hooked"));
/**
 * @author tengda
 */
class PayloadDispatcher {
    /**
     * 单例
     */
    constructor() {
        // 处理器钩子
        this.handlerCls = clsHooked.createNamespace("foundation.server.PayloadDispatcher.handler");
        // 接口
        this.apis = new Map();
    }
    /**
     * 初始化处理器
     */
    async init() {
        const env = Environment_1.default.INSTANCE;
        // 注册接口
        const contexts = glob_1.default
            .sync(`${env.srcDir}/module/**/api/*.js`)
            .map((it) => ({ path: it, registry: require(it).default }));
        for (const context of contexts) {
            // 类型
            const path = context.path;
            const indexOfModule = path.lastIndexOf("/module/");
            const indexOfApi = path.lastIndexOf("/api/");
            const type0 = path.substring(indexOfModule + "/module/".length, indexOfApi);
            const type1 = path.substring(indexOfApi + "/api/".length);
            const type = type0 + "/" + type1.substring(0, type1.length - ".js".length);
            // 检查
            if (this.apis.has(type)) {
                throw new Error(`Api ${type} already registered.`);
            }
            // 缓存
            this.apis.set(type, context.registry);
            // 初始化
            await context.registry.init(type);
            // log
            PayloadDispatcher.LOG.info(`Registered api: ${type}`);
        }
    }
    async dispatchGQL(middleware, request, response) {
        // 钩住处理器
        return new Promise((resolve, reject) => {
            this.handlerCls.run(() => {
                // 同步
                const sync = {
                    full: [],
                    partial: [],
                };
                // 设置参数
                this.handlerCls.set("sync", sync);
                // 调用
                middleware(request, response)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    getSync() {
        return this.handlerCls.get("sync");
    }
    /**
     * 分发载荷
     */
    async dispatchWS(session, payload) {
        // 检查必要数据
        if (!payload.type) {
            throw new LudmilaError_1.default(LudmilaErrors_1.default.SERVER_WEBSOCKET_INVALID_PAYLOAD);
        }
        // 获取定义
        const registry = this.apis.get(payload.type);
        if (!registry) {
            throw new LudmilaError_1.default(LudmilaErrors_1.default.SERVER_WEBSOCKET_NO_HANDLER);
        }
        // 钩住处理器
        return new Promise((resolve, reject) => {
            this.handlerCls.run(() => {
                // 准备上下文
                const context = {
                    data: payload.data,
                    payload,
                    session,
                };
                // 同步
                const sync = {
                    full: [],
                    partial: [],
                };
                // 设置参数
                this.handlerCls.set("sync", sync);
                // 执行
                registry.handle(context)
                    .then((reply) => {
                    resolve({ reply, sync });
                })
                    .catch(reject);
            });
        });
    }
    /**
     *
     */
    addSyncFull(type, id, data) {
        const sync = this.handlerCls.get("sync");
        if (sync) {
            sync.full.push({ type, id, data });
        }
    }
    /**
     *
     */
    addSyncPartial(type, id, key, value) {
        const sync = this.handlerCls.get("sync");
        if (sync) {
            sync.partial.push({ type, id, key, value });
        }
    }
}
// 单例
PayloadDispatcher.S = new PayloadDispatcher();
// log
PayloadDispatcher.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "PayloadDispatcher");
exports.default = PayloadDispatcher;
//# sourceMappingURL=PayloadDispatcher.js.map