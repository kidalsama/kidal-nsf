"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserService_1 = __importDefault(require("../module/account/UserService"));
const GraphQLUnits_1 = __importDefault(require("../../../../server/graphql/GraphQLUnits"));
// createdAt
// updatedAt
// 需要转换一下
const transformUser = (user) => {
    // 看来只能穷举出来，不能偷懒了
    return user ? {
        id: user.id,
        username: user.username,
        password: user.password,
        createdAt(args) {
            return GraphQLUnits_1.default.dateUnit(user.createdAt, args);
        },
        updatedAt(args) {
            return GraphQLUnits_1.default.dateUnit(user.createdAt, args);
        },
    } : null;
};
exports.default = {
    schema: `
type Query {
  login(username: String! password: String!): User
}

type Mutation {
  registerUser(username: String! password: String!): User
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
        async login(args) {
            return transformUser(await UserService_1.default.S.login(null, args.username, args.password));
        },
        async registerUser(args) {
            return transformUser(await UserService_1.default.S.register(null, args.username, args.password));
        },
    },
};
//# sourceMappingURL=User.js.map