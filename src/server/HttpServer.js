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
const bodyParser = __importStar(require("body-parser"));
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const Application_1 = __importDefault(require("../application/Application"));
const Logs_1 = __importDefault(require("../application/Logs"));
const IRpcPayload_1 = require("../cluster/IRpcPayload");
const LudmilaError_1 = __importDefault(require("../error/LudmilaError"));
/**
 * @author tengda
 */
class HttpServer {
    /**
     * 单例
     */
    constructor() {
        this.expressApp = express_1.default();
        this.server = http.createServer(this.expressApp);
        this.expressApp.use(bodyParser.urlencoded({ extended: false }));
        this.expressApp.use(bodyParser.json());
        this.expressApp.use("/static", express_1.default.static("public"));
        // 跨域
        this.expressApp.all("*", (req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header("Access-Control-Allow-Methods", "GET,POST");
            next();
        });
        // 路由
        this.expressApp.get("/", (req, res) => {
            res.end("Welcome to Mcg Game Service");
        });
        // RPC
        this.expressApp.post("/rpc", async (req, res) => {
            try {
                const results = await IRpcPayload_1.RpcPayloadDispatcher.S.dispatch({
                    type: req.body.type,
                    data: req.body.data,
                });
                res.status(200).json(results);
            }
            catch (e) {
                if (e instanceof LudmilaError_1.default) {
                    res.json({ error: { code: e.code, message: e.message } });
                }
                else {
                    HttpServer.LOG.error(e);
                    res.status(404).end();
                }
            }
        });
        // docker 健康检查支持
        this.expressApp.get("/docker-support/health", (req, res) => {
            // TODO: 使用HealthIndicator读取健康状态
            res.status(200).end();
        });
    }
    async start() {
        const config = Application_1.default.INSTANCE.bootstrapConfig.server;
        // 404
        this.expressApp.use("*", (req, res) => {
            res.status(404).send("Not Found");
        });
        // 错误处理
        this.expressApp.use((err, req, res) => {
            if (err instanceof Error) {
                res.status(200).json({ error: { code: 1, message: err.message } });
            }
            else {
                HttpServer.LOG.error(err);
                res.status(500).send("Server Internal Error");
            }
        });
        // 监听http
        return new Promise((resolve, reject) => {
            // 端口大于0时才进行监听
            //  可能因为特殊原因不需要服务器监听端口
            //    例如：单元测试
            const port = config.port;
            if (port > 0) {
                this.server.listen(config.port, "0.0.0.0", () => {
                    const address = this.server.address();
                    if (address === null) {
                        reject(new Error("Server's address is null"));
                    }
                    else if (typeof address === "string") {
                        HttpServer.LOG.info(`Listen at ${address}`);
                    }
                    else {
                        HttpServer.LOG.info(`Listen at ${address.address}:${address.port}`);
                    }
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
HttpServer.S = new HttpServer();
HttpServer.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "HttpServer");
exports.default = HttpServer;
//# sourceMappingURL=HttpServer.js.map