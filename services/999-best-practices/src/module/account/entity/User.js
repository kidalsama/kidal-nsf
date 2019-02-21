"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("../../../../../../data/Database"));
const sequelize_1 = __importDefault(require("sequelize"));
exports.model = Database_1.default.S.sequelize.define("999_user", {
    id: {
        type: sequelize_1.default.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: sequelize_1.default.STRING(20),
        allowNull: false,
        defaultValue: "",
        validate: {
            len: [2, 20],
        },
    },
    password: {
        type: sequelize_1.default.STRING(128),
        allowNull: false,
        defaultValue: "",
        validate: {
            len: [2, 128],
        },
    },
}, {
    indexes: [
        {
            name: "unique_username",
            unique: true,
            fields: ["username"],
        },
    ],
});
class Registry {
    constructor(m) {
        this.model = m;
    }
    get cache() {
        return this._cache;
    }
    async init(cache) {
        // 保存缓存
        this._cache = cache;
        // 初始化数据库
        await this.model.sync();
    }
}
exports.default = new Registry(exports.model);
//# sourceMappingURL=User.js.map