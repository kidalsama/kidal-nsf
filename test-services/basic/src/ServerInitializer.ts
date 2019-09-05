import IHttpServerInitializer from "../../../src/server/IServerInitializer";
import GraphQL from "./graphql/GraphQL";

export default {
  initGraphQLSchema(): { typeDefs: string[]; resolvers: any } {
    return {typeDefs: [GraphQL.schema], resolvers: GraphQL.resolvers}
  },
} as IHttpServerInitializer
