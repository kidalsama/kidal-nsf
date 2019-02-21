import StoreService from "../module/store/StoreService";

export default {
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
    async store(args: { id: string }) {
      return await StoreService.S.get(args.id);
    },
    async saveStore(args: { id: string, val: string }) {
      return await StoreService.S.set(args.id, args.val);
    },
  },
};
