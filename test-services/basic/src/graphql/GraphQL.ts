import {PubSub} from "apollo-server";
import LudmilaError from "../../../../src/error/LudmilaError";

const pubsub = new PubSub();

const POST_SUB = "POST_SUB"

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
  schema: `
type Query {
  error: Boolean
  subType: SubTypeError
  postSub(content: String!): Boolean
}

type Subscription {
  sub: Sub
}

type SubTypeError {
  error: Boolean
}

type Sub {
  content: String
}
  `,
}
