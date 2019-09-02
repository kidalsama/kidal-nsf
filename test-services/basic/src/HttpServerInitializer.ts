import IHttpServerInitializer from "../../../src/server/IHttpServerInitializer";
import GraphQL from "./graphql/GraphQL";

export default {
  getGraphQLExecutableSchemaDefinition(): { typeDefs: string[]; resolvers: any } {
    return {
      typeDefs: [GraphQL.schema],
      resolvers: GraphQL.resolvers,
    }
  },
} as IHttpServerInitializer
