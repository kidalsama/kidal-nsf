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
        // 用户必须登录，直接通过绑定的Uin获取用户Id
        const id = Number(context.session.requireUin());
        await UserService_1.default.S.rename(id, context.data.newUsername);
    }
    async init(type) {
        this._type = type;
    }
}
exports.default = new Registry();
//# sourceMappingURL=rename.js.map