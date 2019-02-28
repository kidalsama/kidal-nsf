"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
// @ts-ignore
const LB_Pool = __importStar(require("lb_pool"));
const DiscoveryClient_1 = __importDefault(require("./DiscoveryClient"));
const Logs_1 = __importDefault(require("../application/Logs"));
const LudmilaError_1 = __importDefault(require("../error/LudmilaError"));
const LudmilaErrors_1 = __importDefault(require("../error/LudmilaErrors"));
const Application_1 = __importDefault(require("../application/Application"));
/**
 * @author tengda
 */
class DiscoveryRpcClient {
    /**
     * 单例
     */
    constructor() {
        // 连接池
        this._poolMap = new Map();
    }
    /**
     * 初始化
     */
    async init() {
        // 检查是否启用
        if (!Application_1.default.INSTANCE.bootstrapConfig.cluster.enabled) {
            DiscoveryRpcClient.LOG.info("Cluster disabled");
            return;
        }
        DiscoveryClient_1.default.S.on("nodes-changed", () => this._onNodesChanged());
    }
    /**
     * 节点变化
     */
    _onNodesChanged() {
        this._poolMap.clear();
        DiscoveryRpcClient.LOG.info("Cleared pool");
    }
    /**
     * 调用
     */
    async invoke(id, args) {
        return new Promise((resolve, reject) => {
            // 获取连接池
            let pool = this._poolMap.get(id);
            if (pool === undefined) {
                const nodes = DiscoveryClient_1.default.S.getNodesById(id);
                if (nodes.length === 0) {
                    this._poolMap.set(id, pool = null);
                }
                else {
                    const servers = nodes.map((it) => `${it.data.ip}:${it.data.port}`);
                    pool = new LB_Pool.Pool(http, servers, {
                        max_pending: 300,
                        // ping: "/ping",
                        timeout: 10 * 1000,
                        max_sockets: 10,
                        name: id,
                    });
                    this._poolMap.set(id, pool);
                }
            }
            // 发送载荷
            if (pool) {
                const payload = JSON.stringify(args);
                // noinspection TypeScriptValidateJSTypes
                pool.request({
                    method: "POST",
                    path: "/rpc",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": payload.length,
                    },
                    data: payload,
                }, (err, res, bodyString) => {
                    if (err) {
                        DiscoveryRpcClient.LOG.warn(err);
                        reject(new LudmilaError_1.default(LudmilaErrors_1.default.CLUSTER_DISCOVERY_RPC_CLIENT_NODE_NOT_AVAILABLE));
                    }
                    else {
                        if (res.statusCode !== 200) {
                            DiscoveryRpcClient.LOG.error("Rpc response none status 200: %s, %s", res.statusCode, bodyString);
                            reject(new LudmilaError_1.default(LudmilaErrors_1.default.CLUSTER_DISCOVERY_RPC_CLIENT_STATUS_NOT_200));
                        }
                        else {
                            if (bodyString === null) {
                                resolve({});
                            }
                            else {
                                let body;
                                try {
                                    body = JSON.parse(bodyString);
                                }
                                catch (e) {
                                    DiscoveryRpcClient.LOG.warn(e);
                                    reject(new LudmilaError_1.default(LudmilaErrors_1.default.CLUSTER_DISCOVERY_RPC_CLIENT_INVALID_PAYLOAD));
                                }
                                if (body.hasOwnProperty("error")) {
                                    reject(new LudmilaError_1.default(body.error.code, body.error.message));
                                }
                                else {
                                    resolve(body);
                                }
                            }
                        }
                    }
                });
            }
            else {
                reject(new LudmilaError_1.default(LudmilaErrors_1.default.CLUSTER_DISCOVERY_RPC_CLIENT_NO_INSTANCE));
            }
        });
    }
}
// 单例
DiscoveryRpcClient.S = new DiscoveryRpcClient();
// 日志
DiscoveryRpcClient.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "DiscoveryRpcClient");
exports.default = DiscoveryRpcClient;
//# sourceMappingURL=DiscoveryRpcClient.js.map