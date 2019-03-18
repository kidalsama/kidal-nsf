import GraphQLUnits from "../../../../../../src/server/graphql/GraphQLUnits";
import {gql} from "apollo-server-express";

class ServerTime {
  private readonly _now = new Date();

  public format(args: any) {
    return GraphQLUnits.dateUnit(new Date(), args);
  }

  public timestamp() {
    return GraphQLUnits.dateUnit(new Date(), {unit: "timestamp"});
  }

  public date() {
    return GraphQLUnits.dateUnit(this._now, {unit: "date"});
  }

  public datetime() {
    return GraphQLUnits.dateUnit(this._now, {unit: "datetime"});
  }

  public testingNull() {
    return GraphQLUnits.dateUnit(null, {});
  }
}

export default {
  schema: gql`
type Query {
  serverTime: ServerTime!
}

# 服务器时间
type ServerTime {
  # 格式化时间
  format(unit: String): String!
  timestamp: Float!
  date: String!
  datetime: String!
  testingNull: String
}
`,
  resolvers: {
    Query: {
      serverTime() {
        return new ServerTime();
      },
    },
  },
};
