import JavaRpcClientManager from "../../../../../../src/cluster/JavaClusterRpc";
import {gql} from "apollo-server-core";

interface IResults {
  name: string
}

export default {
  schema: gql`
type Query {
  debug: Boolean
}
`,
  resolvers: {
    Query: {
      async debug() {
        const results = await JavaRpcClientManager.S.acquire("oa")
          .target("213.project")
          .method("get-project")
          .version("2018.11")
          .invoke<IResults>(2)
        return null
      },
    },
  },
};
