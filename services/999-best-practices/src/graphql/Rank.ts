import RankService from "../module/rank/RankService";

export default {
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
    async getRank(args: { userId: number }) {
      return await RankService.S.get(args.userId);
    },
    async setRank(args: { userId: number, score: number }) {
      return await RankService.S.set(args.userId, args.score);
    },
  },
};
