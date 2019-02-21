"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RankService_1 = __importDefault(require("../module/rank/RankService"));
exports.default = {
    schema: `
type Query {
  getRank(userId: Int!): Rank
}

type Mutation {
  setRank(userId: Int! score: Int!): Rank!
}

type Rank {
  userId: Int!
  score: Int!
}
`,
    resolver: {
        async getRank(args) {
            return await RankService_1.default.S.get(args.userId);
        },
        async setRank(args) {
            return await RankService_1.default.S.set(args.userId, args.score);
        },
    },
};
//# sourceMappingURL=Rank.js.map