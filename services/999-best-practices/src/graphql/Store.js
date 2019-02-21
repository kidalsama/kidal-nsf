"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StoreService_1 = __importDefault(require("../module/store/StoreService"));
exports.default = {
    schema: `
type Query {
  store(id: String!): Store
}

type Mutation {
  saveStore(id: String! val: String!): Store!
}

type Store {
  id: String!
  val: String!
}
`,
    resolver: {
        async store(args) {
            return await StoreService_1.default.S.get(args.id);
        },
        async saveStore(args) {
            return await StoreService_1.default.S.set(args.id, args.val);
        },
    },
};
//# sourceMappingURL=Store.js.map