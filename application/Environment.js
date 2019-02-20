"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const log4js = __importStar(require("log4js"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
/**
 * @author tengda
 */
class Environment {
    /**
     *
     */
    constructor(argv) {
        this.checkArgv(argv);
        // 设置核心启动配置
        this.bootDir = argv[1];
        this.profiles = argv[2].split(",");
        this.srcDir = path.join(this.bootDir, "src", argv[3], "src");
        this.resDir = path.join(this.bootDir, "src", argv[3], "res");
        // 配置日志
        try {
            log4js.configure(path.join(this.resDir, `log4js-${this.profiles[0]}.json`));
        }
        catch (e) {
            log4js.configure({
                "appenders": {
                    "console": {
                        "type": "console",
                        "level": "trace",
                        "maxLevel": "error",
                        "layout": {
                            "type": "pattern",
                            "pattern": "%d{yyyy-MM-dd hh:mm:ss.SSS} %[%5p%] --- [%8z] %m --- %[%c%]"
                        }
                    }
                },
                "categories": {
                    "default": {
                        "appenders": [
                            "console"
                        ],
                        "level": "all"
                    }
                }
            });
        }
        this.log = log4js.getLogger("foundation.application.Environment");
        // 读取用户启动配置
        const environmentConfigPath = path.join(this.resDir, `application-${this.profiles[0]}.yml`);
        if (!fs.existsSync(environmentConfigPath)) {
            this.log.error(`无法加载启动配置 ${environmentConfigPath}`);
            process.exit(0);
        }
        const environmentConfigText = fs.readFileSync(environmentConfigPath).toString("utf8");
        const environmentConfig = yaml.parse(environmentConfigText);
        this.log.info(`Environment\n${JSON.stringify(environmentConfig, null, 2)}`);
        // 解析配置
        this.id = environmentConfig.application.id;
        this.configServer = {
            type: environmentConfig.application.configServer.type,
            uri: environmentConfig.application.configServer.uri,
            password: environmentConfig.application.configServer.password,
            username: environmentConfig.application.configServer.username,
            token: environmentConfig.application.configServer.token,
        };
    }
    static get S() {
        return this.INSTANCE;
    }
    /**
     * 主要环境
     */
    get profile() {
        return this.profiles[0];
    }
    /**
     * 环境字符串
     */
    get profilesString() {
        return this.profiles.join(".");
    }
    /**
     * 检查启动参数
     */
    checkArgv(argv) {
        // 读取启动参数
        if (argv.length !== 4) {
            // noinspection TsLint
            console.error(`Invalid bootstrap argv: ${argv.slice(2).join(" ")}`);
            // noinspection TsLint
            console.log("Bootstrap Command: node . <profiles> <server>");
            // noinspection TsLint
            console.log("  Example: node . dev 101-config");
            process.exit(0);
        }
    }
}
// 单例
Environment.INSTANCE = new Environment(process.argv);
exports.default = Environment;
//# sourceMappingURL=Environment.js.map