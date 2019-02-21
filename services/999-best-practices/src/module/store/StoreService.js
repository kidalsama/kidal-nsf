"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = __importDefault(require("./entity/Store"));
const PayloadDispatcher_1 = __importDefault(require("../../../../../server/PayloadDispatcher"));
class StoreService {
    constructor() {
        // 监听字段改变事件
        Store_1.default.cache.on("field-updated", (id, key, value) => {
            // 添加到自动同步
            PayloadDispatcher_1.default.S.addSyncPartial("Store", id, key, value);
        });
    }
    async get(id) {
        return await Store_1.default.cache.get(id);
    }
    async set(id, val) {
        // 加载或者创建一个
        const store = await Store_1.default.cache.getOrCreate(id, { id, val });
        // 自动同步功能，不用手动保存到数据库
        // 这里会触发上面的「field-updated」监听器
        store.val = val;
        // done
        return store;
    }
}
StoreService.S = new StoreService();
exports.default = StoreService;
//# sourceMappingURL=StoreService.js.map