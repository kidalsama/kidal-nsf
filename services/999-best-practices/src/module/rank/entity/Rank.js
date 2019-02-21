"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("../../../../../../data/Database"));
const Sequelize = require("sequelize");
exports.model = Database_1.default.S.sequelize.define("999_rank", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    indexes: [
        {
            name: "unique_userId",
            unique: true,
            fields: ["userId"],
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
//# sourceMappingURL=Rank.js.map