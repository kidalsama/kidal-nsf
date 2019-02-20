"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logs_1 = __importDefault(require("../application/Logs"));
const Environment_1 = __importDefault(require("../application/Environment"));
const glob_1 = __importDefault(require("glob"));
const LudmilaError_1 = __importDefault(require("../error/LudmilaError"));
const LudmilaErrors_1 = __importDefault(require("../error/LudmilaErrors"));
/**
 * @author tengda
 */
class RpcPayloadDispatcher {
    /**
     * 单例
     */
    constructor() {
        // 接口
        this.rpcMap = new Map();
    }
    /**
     * 初始化处理器
     */
    async init() {
        const env = Environment_1.default.INSTANCE;
        // 注册接口
        const contexts = glob_1.default
            .sync(`${env.srcDir}/module/**/rpc/*.js`)
            .map((it) => ({ path: it, registry: require(it).default }));
        for (const context of contexts) {
            // 类型
            const path = context.path;
            const indexOfModule = path.lastIndexOf("/module/");
            const indexOfApi = path.lastIndexOf("/rpc/");
            const type0 = path.substring(indexOfModule + "/module/".length, indexOfApi);
            const type1 = path.substring(indexOfApi + "/rpc/".length);
            const type = type0 + "/" + type1.substring(0, type1.length - ".js".length);
            // 检查
            if (this.rpcMap.has(type)) {
                throw new Error(`Rpc ${type} already registered.`);
            }
            // 缓存
            this.rpcMap.set(type, context.registry);
            // 初始化
            await context.registry.init(type);
            // log
            RpcPayloadDispatcher.LOG.info(`Registered rpc: ${type}`);
        }
    }
    /**
     * 分发载荷
     */
    async dispatch(payload) {
        // 检查必要数据
        if (!payload.type) {
            throw new LudmilaError_1.default(LudmilaErrors_1.default.CLUSTER_DISCOVERY_RPC_CLIENT_INVALID_PAYLOAD);
        }
        // 获取定义
        const registry = this.rpcMap.get(payload.type);
        if (!registry) {
            throw new LudmilaError_1.default(LudmilaErrors_1.default.CLUSTER_DISCOVERY_RPC_CLIENT_NO_HANDLER);
        }
        // 钩住处理器
        return new Promise((resolve, reject) => {
            // 执行
            registry.handle(payload.data)
                .then((reply) => {
                resolve(reply);
            })
                .catch(reject);
        });
    }
}
// 单例
RpcPayloadDispatcher.S = new RpcPayloadDispatcher();
// log
RpcPayloadDispatcher.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "RpcPayloadDispatcher");
exports.RpcPayloadDispatcher = RpcPayloadDispatcher;
//# sourceMappingURL=IRpcPayload.js.map