"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("../../../../../../data/Database"));
const Sequelize = require("sequelize");
exports.model = Database_1.default.S.sequelize.define("999_store", {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true,
    },
    val: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "",
        validate: {
            len: [0, 20],
        },
    },
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
//# sourceMappingURL=Store.js.map