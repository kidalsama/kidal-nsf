import {GQLResolver, GQLSchema} from "../../../../src/server/bind";
import {GraphQLUnits} from "../../../../src/server/graphql";
import {Autowired} from "../../../../src/ioc";

@GQLSchema()
class ServerTimeSchema {
  public typeServerTime() {
    return `
type ServerTime {
  # 格式化时间
  format(unit: String): String!
  timestamp: Float!
  date: String!
  datetime: String!
  testingNull: String
}
`
  }
}

@GQLResolver("ServerTime")
class ServerTimeResolver {
  public constructor(
    @Autowired public readonly now: Date,
  ) {
  }

  public format(r: any, a: any) {
    return GraphQLUnits.dateUnit(new Date(), a);
  }

  public timestamp() {
    return GraphQLUnits.dateUnit(new Date(), {unit: "timestamp"});
  }

  public async date() {
    return GraphQLUnits.dateUnit(this.now, {unit: "date"});
  }

  public datetime() {
    return GraphQLUnits.dateUnit(this.now, {unit: "datetime"});
  }

  public async testingNull() {
    return GraphQLUnits.dateUnit(null, {});
  }
}
