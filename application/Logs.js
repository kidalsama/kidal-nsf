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
// @ts-ignore
const log4js = __importStar(require("log4js"));
const Environment_1 = __importDefault(require("./Environment"));
const path = __importStar(require("path"));
/**
 * @author tengda
 */
class Logs {
    /**
     *
     */
    constructor() {
    }
    /**
     * 获取日至期
     */
    getLogger(dirname, className) {
        const env = Environment_1.default.S;
        const category = dirname
            .substring(env.srcDir.length + 1)
            .replace(/[\/]/g, ".")
            + "."
            + className;
        return log4js.getLogger(category);
    }
    /**
     * 获取核心日期指
     */
    getFoundationLogger(dirname, className) {
        let logger = null;
        return new Proxy(Logs.FAKE_TARGET, {
            get: (target, p, receiver) => {
                if (!logger) {
                    logger = this.createLogger(dirname, className);
                }
                return Reflect.get(logger, p, receiver);
            },
            apply: (target, thisArg, argArray) => {
                if (!logger) {
                    logger = this.createLogger(dirname, className);
                }
                return Reflect.apply(target, logger, argArray);
            },
        });
    }
    createLogger(dirname, className) {
        const env = Environment_1.default.S;
        const category = env.foundationConfig.testingFoundation
            ? ("foundation" +
                dirname
                    .substring(env.bootDir.length)
                    .replace(/[\/]/g, ".")
                + "."
                + className)
            : (dirname
                .substring(path.join(env.bootDir, "node_modules").length + 1)
                .replace(/[\/]/g, ".")
                + "."
                + className);
        return log4js.getLogger(category);
    }
}
// 单例
Logs.INSTANCE = new Logs();
Logs.FAKE_TARGET = {};
exports.default = Logs;
//# sourceMappingURL=Logs.js.map