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
const os = __importStar(require("os"));
const zookeeper = __importStar(require("node-zookeeper-client"));
const Logs_1 = __importDefault(require("../application/Logs"));
const Application_1 = __importDefault(require("../application/Application"));
const Environment_1 = __importDefault(require("../application/Environment"));
const events = __importStar(require("events"));
/**
 * @author tengda
 */
class DiscoveryClient extends events.EventEmitter {
    /**
     * 单例
     */
    constructor() {
        super();
        // 自己的uuid
        this._uuid = "";
        // 全部节点
        this._nodes = [];
    }
    get zk() {
        return this._zk;
    }
    async _zkConnect() {
        if (this._zk) {
            return;
        }
        const zookeeperConfig = Application_1.default.S.bootstrapConfig.cluster.zookeeper;
        this._zk = zookeeper.createClient(zookeeperConfig.connectionString, {
            sessionTimeout: 3000,
            spinDelay: 1000,
            retries: 0,
        });
        return new Promise((resolve, reject) => {
            let connected = false;
            // 监听链接超时
            setTimeout(() => {
                if (!connected) {
                    reject(new Error("Connect to zookeeper failed"));
                }
            }, 3000);
            // 监听器
            const onConnected = () => {
                connected = true;
                DiscoveryClient.LOG.info("Connected with zookeeper");
                resolve();
            };
            const onDisconnected = () => {
                DiscoveryClient.LOG.warn("Disconnected with zookeeper, try re-init");
                this.zk.off("connected", onConnected);
                this.zk.off("disconnected", onDisconnected);
                this._zk = undefined;
                process.nextTick(() => this.init());
            };
            // 链接成功
            this.zk.once("connected", onConnected);
            // 断开链接
            this.zk.on("disconnected", onDisconnected);
            // 开始链接
            this.zk.connect();
        });
    }
    async _zkCreateDir(path) {
        return new Promise((resolve, reject) => {
            this.zk.create(path, zookeeper.CreateMode.PERSISTENT, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async _zkCreateNode(path, data) {
        return new Promise((resolve, reject) => {
            this.zk.create(path, data, zookeeper.CreateMode.EPHEMERAL, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async _zkRemove(path) {
        return new Promise((resolve, reject) => {
            this.zk.remove(path, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async _zkExists(path) {
        return new Promise((resolve, reject) => {
            this.zk.exists(path, (error, stat) => {
                if (error) {
                    reject(error);
                }
                else if (stat) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
    async _zkGetData(path) {
        return new Promise((resolve, reject) => {
            this.zk.getData(path, (error, buffer) => {
                if (error) {
                    reject(error);
                }
                else if (buffer) {
                    const json = buffer.toString("utf8");
                    try {
                        const data = JSON.parse(json);
                        if (!data.hasOwnProperty("version") || data.version !== 1) {
                            DiscoveryClient.LOG.warn("Parse data from %s failed: version not match -> %s", path, json);
                        }
                        resolve(data);
                    }
                    catch (e) {
                        DiscoveryClient.LOG.warn("Parse data from %s failed: incorrect format -> %s", path, json);
                        resolve(null);
                    }
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    _resolveIp() {
        const networkInterfaces = os.networkInterfaces();
        for (const networkInterfaceKey in networkInterfaces) {
            if (!networkInterfaces.hasOwnProperty(networkInterfaceKey)) {
                continue;
            }
            const networkInterface = networkInterfaces[networkInterfaceKey];
            for (const alias of networkInterface) {
                if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
                    return alias.address;
                }
            }
        }
        return null;
    }
    _retrieveNodes(dir) {
        this.zk.getChildren(dir, (event) => {
            DiscoveryClient.LOG.info("Got watcher event: %s", event);
            this._retrieveNodes(dir);
        }, async (error, children) => {
            if (error) {
                DiscoveryClient.LOG.error("Failed to list children of %s due to: %s.", dir, error);
                return;
            }
            // 获取新节点
            const nodes = [];
            for (const name of children) {
                try {
                    const path = `${dir}/${name}`;
                    const nodeData = await this._zkGetData(path);
                    if (nodeData === null) {
                        continue;
                    }
                    nodes.push({
                        path,
                        self: this._uuid === nodeData.uuid,
                        data: nodeData,
                    });
                }
                catch (e) {
                    // ignored
                }
            }
            this._nodes = nodes;
            // log
            DiscoveryClient.LOG.info("Retrieved nodes: %s", JSON.stringify(this._nodes, null, 2));
            // event
            this.emit("nodes-changed", this._nodes);
        });
    }
    /**
     * 初始化
     */
    async init() {
        // 检查是否启用
        if (!Application_1.default.INSTANCE.bootstrapConfig.cluster.enabled) {
            DiscoveryClient.LOG.info("Cluster disabled");
            return;
        }
        // 解析IP
        const ip = this._resolveIp();
        if (!ip) {
            throw new Error("Resolve ip failed");
        }
        // uuid
        const port = Application_1.default.S.bootstrapConfig.server.port;
        this._uuid = `${ip}:${port}`;
        // 准备路径
        const env = Environment_1.default.S;
        const dir = `/${env.profilesString}`;
        const path = `/${env.profilesString}/${this._uuid}`;
        // 链接服务器
        await this._zkConnect();
        // 创建目录
        if (!(await this._zkExists(dir))) {
            await this._zkCreateDir(dir);
        }
        // 移除已存在节点
        if (await this._zkExists(path)) {
            await this._zkRemove(path);
        }
        // 创建节点
        const nodeData = {
            version: 1,
            uuid: this._uuid,
            id: env.id,
            profiles: env.profilesString,
            ip,
            port,
        };
        await this._zkCreateNode(path, Buffer.from(JSON.stringify(nodeData, null, 2)));
        // log
        DiscoveryClient.LOG.info("Node: %s is successfully created.", path);
        // 开始获取其他节点
        this._retrieveNodes(dir);
    }
    /**
     * 获取全部节点
     */
    getNodes() {
        return this._nodes;
    }
    /**
     * 获取全部节点ID
     */
    getNodeIds() {
        const ids = new Set();
        this._nodes.forEach((it) => ids.add(it.data.id));
        return [...ids];
    }
    /**
     * 获取指定ID的节点
     */
    getNodesById(id) {
        return this._nodes.filter((it) => it.data.id === id);
    }
}
// 单例
DiscoveryClient.S = new DiscoveryClient();
// 日志
DiscoveryClient.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "DiscoveryClient");
exports.default = DiscoveryClient;
//# sourceMappingURL=DiscoveryClient.js.map