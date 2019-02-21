import GraphQLUnits from "../../../../server/graphql/GraphQLUnits";

export default {
  schema: `
type Query {
  time(unit: String): String!
}
`,
  resolver: {
    time(args: any) {
      return GraphQLUnits.dateUnit(new Date(), args);
    },
  },
};
