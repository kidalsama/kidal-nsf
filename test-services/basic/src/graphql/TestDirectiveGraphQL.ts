import {GQLResolver, GQLSchema} from "../../../../src/server/bind/GraphQLBinding";

@GQLSchema()
class QuerySchema {
  public schema() {
    return `
type Query {
  testDirective: TestDirective!
}
`
  }
}

@GQLSchema()
class TestDirectiveSchema {
  public schema() {
    return `
type TestDirective {
  byte: Float! @byte
  date: Date! @date
  time: Float! @time
  url: String! @url
}
`
  }
}

@GQLResolver()
class Query {
  public testDirective() {
    return {}
  }
}

@GQLResolver()
class TestDirective {
  public byte() {
    return 1502546469959274
  }

  public date() {
    return new Date(1990, 0, 25)
  }

  public time() {
    return 1567481165429
  }

  public url() {
    return "http://gitlab.dev.everybodygame.com"
  }
}
