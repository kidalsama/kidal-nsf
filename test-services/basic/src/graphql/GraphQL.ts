import {gql, PubSub} from "apollo-server";
import {LudmilaError} from "../../../../src/error";
import {GraphQLUnits} from "../../../../src/server/graphql";

const pubsub = new PubSub();

const POST_SUB = "POST_SUB"

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

interface IResults {
  name: string
}

export default {
  resolvers: {
    Query: {
      error() {
        throw new LudmilaError("998", "test error")
      },
      async subType() {
        return {}
      },
      serverTime() {
        return new ServerTime();
      },
      async postSub(root: any, args: { content: string }) {
        await pubsub.publish(POST_SUB, {sub: args})
        return true
      },
    },
    SubTypeError: {
      async error() {
        throw new LudmilaError("998", "test sub type error")
      },
    },
    Subscription: {
      sub: {
        subscribe: () => {
          return pubsub.asyncIterator([POST_SUB])
        },
      },
    },
  },
  schema: gql`
type Query {
  error: Boolean
  subType: SubTypeError
  serverTime: ServerTime!
  postSub(content: String!): Boolean
}

type Subscription {
  sub: Sub
}

type ServerTime {
  # 格式化时间
  format(unit: String): String!
  timestamp: Float!
  date: String!
  datetime: String!
  testingNull: String
}

type SubTypeError {
  error: Boolean
}

type Sub {
  content: String
}
  `,
}
