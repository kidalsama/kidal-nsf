"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("./entity/User"));
const sequelize_1 = __importDefault(require("sequelize"));
const LudmilaError_1 = __importDefault(require("../../../../../error/LudmilaError"));
const PayloadDispatcher_1 = __importDefault(require("../../../../../server/PayloadDispatcher"));
class UserService {
    constructor() {
        // 自动同步
        User_1.default.cache.on("field-updated", (id, key, value) => {
            PayloadDispatcher_1.default.S.addSyncPartial("User", id, key, value);
        });
    }
    // 注册用户
    async register(session, username, password) {
        // 创建用户
        let user;
        try {
            user = await User_1.default.cache.create({ username, password });
        }
        catch (e) {
            // 唯一键冲突，因为username是唯一的，所以这里只可能因为username重名
            if (e instanceof sequelize_1.default.UniqueConstraintError) {
                throw new LudmilaError_1.default("Username already existed");
            }
            else {
                throw e;
            }
        }
        // 注册成功，绑定会话
        if (session) {
            await session.bindUin(user.id.toString());
        }
        // 同步完整数据
        PayloadDispatcher_1.default.S.addSyncFull("User", user.id, user);
        return user;
    }
    // 登录
    async login(session, username, password) {
        // 通过用户名获取用户并比较密码
        const user = await User_1.default.cache.loadOne(async (model) => {
            return await model.findOne({ where: { username } });
        });
        if (user === null || user.password !== password) {
            throw new LudmilaError_1.default("1", "用户名或者密码错误");
        }
        // 登录成功，绑定会话
        if (session) {
            await session.bindUin(user.id.toString());
        }
        // 同步完整数据
        PayloadDispatcher_1.default.S.addSyncFull("User", user.id, user);
        return user;
    }
    // 改名
    async rename(id, newUsername) {
        // 读取用户
        const user = await User_1.default.cache.get(id);
        if (user === null) {
            throw new LudmilaError_1.default("1", "用户不存在");
        }
        // 改名
        user.username = newUsername;
        // 完成
        return user;
    }
}
UserService.S = new UserService();
exports.default = UserService;
//# sourceMappingURL=UserService.js.map