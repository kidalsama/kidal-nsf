"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StoreService_1 = __importDefault(require("../StoreService"));
// 老夫写代码就是 Ctrl-C + Ctrl-V
// 返回值没有写void，这里有返回值，写IResults
class Registry {
    get type() {
        return this._type;
    }
    async handle(context) {
        // 解构参数方便编写
        const { id } = context.data;
        // 这里需要检查下id的合法性，因为是入门教程就不检查了
        // 返回
        return StoreService_1.default.S.get(id);
    }
    async init(type) {
        this._type = type;
    }
}
exports.default = new Registry();
//# sourceMappingURL=get.js.map