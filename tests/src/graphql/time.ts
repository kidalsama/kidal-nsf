import GraphQLUnits from "../../../server/graphql/GraphQLUnits";

class ServerTime {
  private readonly _now = new Date();

  public format(args: any) {
    return GraphQLUnits.dateUnit(new Date(), args);
  }

  public timestamp() {
    return this._now.getTime();
  }

  public date() {
    return GraphQLUnits.dateUnit(this._now, {unit: "date"});
  }

  public datetime() {
    return GraphQLUnits.dateUnit(this._now, {unit: "datetime"});
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
}
`,
  resolver: {
    serverTime() {
      return new ServerTime();
    },
  },
};
