import JavaRpcClientManager from "../../../../../../src/cluster/JavaClusterRpc";

interface IResults {
  name: string
}

export default {
  schema: `
type Query {
  debug: Boolean
}
`,
  resolver: {
    async debug() {
      const results = await JavaRpcClientManager.S.acquire("oa")
        .target("213.project")
        .method("get-project")
        .version("2018.11")
        .invoke<IResults>(2)
      return null
    },
  },
};
