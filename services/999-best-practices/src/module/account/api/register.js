"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserService_1 = __importDefault(require("../UserService"));
// 自动同步数据，不提供返回值
class Registry {
    get type() {
        return this._type;
    }
    async handle(context) {
        await UserService_1.default.S.register(context.session, context.data.username, context.data.password);
    }
    async init(type) {
        this._type = type;
    }
}
exports.default = new Registry();
//# sourceMappingURL=register.js.map