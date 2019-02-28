import UserService from "../module/user/UserService";
import {IUser} from "../module/user/entity/User";
import GraphQLUnits from "../../../../src/server/graphql/GraphQLUnits";
import Maybe from "graphql/tsutils/Maybe";

// createdAt
// updatedAt
// 需要转换一下
const transformUser = (user: Maybe<IUser>): any => {
  // 看来只能穷举出来，不能偷懒了
  return user ? {
    id: user.id,
    username: user.username,
    password: user.password,
    createdAt(args: any) {
      return GraphQLUnits.dateUnit(user.createdAt, args);
    },
    updatedAt(args: any) {
      return GraphQLUnits.dateUnit(user.createdAt, args);
    },
  } : null;
};

export default {
  schema: `
type Query {
  login(username: String! password: String!): User
}

type Mutation {
  registerUser(username: String! password: String!): User
  renameUser(id: Int newUsername: String!): User
}

type User {
  id: Int!
  username: String!
  password: String!
  createdAt(unit: String): String!
  updatedAt(unit: String): String!
}
`,
  resolver: {
    async login(args: { username: string, password: string }) {
      return transformUser(await UserService.S.login(null, args.username, args.password));
    },
    async registerUser(args: { username: string, password: string }) {
      return transformUser(await UserService.S.register(null, args.username, args.password));
    },
    async renameUser(args: { id: number, newUsername: string }) {
      return transformUser(await UserService.S.rename(args.id, args.newUsername))
    },
  },
};
