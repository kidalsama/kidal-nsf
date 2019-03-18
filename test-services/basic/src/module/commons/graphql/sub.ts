import {PubSub} from "apollo-server";

const pubsub = new PubSub();

const POST_SUB = "POST_SUB"

export default {
  schema: `
type Query {
  postSub(content: String!): Boolean
}

type Subscription {
  sub: Sub
}

type Sub {
  content: String
}
`,
  resolvers: {
    Query: {
      async postSub(root: any, args: { content: string }) {
        await pubsub.publish(POST_SUB, {sub: args})
        return true
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
};
