"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Rank_1 = __importDefault(require("../rank/entity/Rank"));
class RankService {
    constructor() {
        // 监听字段改变事件
        Rank_1.default.cache.on("field-updated", (id, key, value) => {
            // 添加到自动同步
            // PayloadDispatcher.S.addSyncPartial("Rank", id, key, value);
        });
    }
    async get(userId) {
        return await await Rank_1.default.cache.loadOne(async (model) => {
            return await model.findOne({ where: { userId } });
        });
    }
    async set(userId, score) {
        let rank = await Rank_1.default.cache.loadOne(async (model) => {
            return await model.findOne({ where: { userId } });
        });
        // 加载或者创建一个
        // const rank = await Rank.cache.getOrCreate(userId, {userId, score});
        if (!rank) {
            rank = await Rank_1.default.cache.create({ userId, score });
        }
        else {
            // 自动同步功能，不用手动保存到数据库
            // 这里会触发上面的「field-updated」监听器
            rank.score = score;
        }
        // done
        return rank;
    }
}
RankService.S = new RankService();
exports.default = RankService;
//# sourceMappingURL=RankService.js.map