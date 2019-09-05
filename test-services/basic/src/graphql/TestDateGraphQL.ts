import {GQLResolver, GQLSchema} from "../../../../src/server/bind";
import {GraphQLUnits} from "../../../../src/server/graphql";

@GQLSchema()
class QuerySchema {
  public schema() {
    return `
type Query {
  testDate(now: Date!): TestDate!
}
`
  }
}

@GQLSchema()
class TestDateSchema {
  public schema() {
    return `
type TestDate {
  format(unit: String): Date!
  timestamp: Float!
  date: Date!
  datetime: Date!
  testingNull: Date
  testingDirective: Date! @date
  testingDirectiveWithDefaultYear: Date! @date(unit: "yyyy")
}
`
  }
}

@GQLResolver()
class Query {
  public testDate(r: any, a: any) {
    return {now: a.now}
  }
}

@GQLResolver()
class TestDate {
  public format(r: any, a: any) {
    return GraphQLUnits.dateUnit(r.now, a);
  }

  public timestamp(r: any) {
    return GraphQLUnits.dateUnit(r.now, {unit: "timestamp"});
  }

  public async date(r: any) {
    return GraphQLUnits.dateUnit(r.now, {unit: "date"});
  }

  public datetime(r: any) {
    return GraphQLUnits.dateUnit(r.now, {unit: "datetime"});
  }

  public async testingNull() {
    return GraphQLUnits.dateUnit(null, {});
  }

  public async testingDirective(r: any) {
    return r.now
  }

  public async testingDirectiveWithDefaultYear(r: any) {
    return r.now
  }
}
