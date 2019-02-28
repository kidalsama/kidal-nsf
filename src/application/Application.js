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
const node_fetch_1 = __importDefault(require("node-fetch"));
const yaml = __importStar(require("yaml"));
const BootstrapConfig_1 = require("./BootstrapConfig");
const Environment_1 = __importDefault(require("./Environment"));
const Logs_1 = __importDefault(require("./Logs"));
const Database_1 = __importDefault(require("../data/Database"));
const DiscoveryClient_1 = __importDefault(require("../cluster/DiscoveryClient"));
const GraphQLServer_1 = __importDefault(require("../server/graphql/GraphQLServer"));
const WebSocketServer_1 = __importDefault(require("../server/websocket/WebSocketServer"));
const PayloadDispatcher_1 = __importDefault(require("../server/PayloadDispatcher"));
const HttpServer_1 = __importDefault(require("../server/HttpServer"));
const DiscoveryRpcClient_1 = __importDefault(require("../cluster/DiscoveryRpcClient"));
const IRpcPayload_1 = require("../cluster/IRpcPayload");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * @author tengda
 */
class Application {
    /**
     * 单例
     */
    static get INSTANCE() {
        return this._INSTANCE;
    }
    static get S() {
        return this._INSTANCE;
    }
    /**
     * 启动配置
     */
    get bootstrapConfig() {
        return this._bootstrapConfig;
    }
    /**
     * 启动
     */
    static async run(argv) {
        if (argv[2].indexOf("test") === -1) {
            // noinspection TsLint
            console.log(`
============================================================
                      _ooOoo_
                     o8888888o
                     88" . "88
                     (| -_- |)
                     O\\  =  /O
                  ____/\`---'\\____
                .'  \\\\|     |//  \`.
               /  \\\\|||  :  |||//  \\
              /  _||||| -:- |||||-  \\
              |   | \\\\\\  -  /// |   |
              | \\_|  ''\\---/''  |   |
              \\  .-\\__  \`-\`  ___/-. /
            ___\`. .'  /--.--\\  \`. . __
         ."" '<  \`.___\\_<|>_/___.'  >'"".
        | | :  \`- \\\`.;\`\\ _ /\`;.\`/ - \` : | |
        \\  \\ \`-.   \\_ __\\ /__ _/   .-\` /  /
   ======\`-.____\`-.___\\_____/___.-\`____.-'======
                      \`=---='
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 佛祖保佑       永无BUG
============================================================`);
        }
        // 日志
        this.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "Application");
        // 实例化
        this._INSTANCE = new Application();
        // 启动
        await this._INSTANCE.boot(argv);
        // done
        return this._INSTANCE;
    }
    /**
     * 测试启动
     */
    static async runTest(serviceName) {
        return this.run(["", "", "test", serviceName]);
    }
    /**
     * 启动
     */
    async boot(argv) {
        const env = new Environment_1.default(argv);
        // timer
        const startTs = Date.now();
        // 读取启动配置
        this._bootstrapConfig = BootstrapConfig_1.normalizeBootstrapConfig(yaml.parse(await this.loadBootstrapConfig()));
        Application.LOG.info("Bootstrap Configuration\n", JSON.stringify(this._bootstrapConfig, null, 2));
        // 启动数据库
        await Database_1.default.S.init();
        // 启动发现服务
        await DiscoveryClient_1.default.S.init();
        await DiscoveryRpcClient_1.default.S.init();
        // 启动服务器
        await GraphQLServer_1.default.S.init();
        await WebSocketServer_1.default.S.init();
        await IRpcPayload_1.RpcPayloadDispatcher.S.init();
        await PayloadDispatcher_1.default.S.init();
        await HttpServer_1.default.S.start();
        // timer
        const sec = ((Date.now() - startTs) / 1000).toFixed(3);
        // log
        Application.LOG.info(`Started ${env.id} in ${sec} seconds`);
    }
    /**
     * 关闭
     */
    async shutdown() {
        await Database_1.default.S.shutdown();
    }
    /**
     * 加载启动配置
     */
    async loadBootstrapConfig() {
        const env = Environment_1.default.S;
        const configName = `${env.id}-${env.profile}.yml`;
        const configServer = env.configServer;
        if (configServer.type === "gitlab") {
            // 如何从gitlab读取raw文件
            //  https://docs.gitlab.com/ee/api/repository_files.html#get-raw-file-from-repository
            const url = `${configServer.uri}/${configName}/raw?ref=master`;
            const response = await node_fetch_1.default(url, {
                headers: {
                    "PRIVATE-TOKEN": configServer.token,
                },
            });
            const status = response.status;
            const text = await response.text();
            if (status !== 200) {
                throw new Error(`无法从 ${url} 读取 Bootstrap 配置: ${text}`);
            }
            return text;
        }
        else if (configServer.type === "local") {
            return fs.readFileSync(path.join(env.resDir, `bootstrap-${env.profile}.yml`)).toString("utf8");
        }
        else {
            throw new Error(`无效的配置服务器类型 ${configServer.type}`);
        }
    }
}
exports.default = Application;
//# sourceMappingURL=Application.js.map