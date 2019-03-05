import GraphQLUnits from "../../../../../../src/server/graphql/GraphQLUnits";

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
  schema: `
type Query {
  serverTime: ServerTime!
}

type ServerTime {
  format(unit: String): String!
  timestamp: Float!
  date: String!
  datetime: String!
  testingNull: String
}
`,
  resolver: {
    serverTime() {
      return new ServerTime();
    },
  },
};
