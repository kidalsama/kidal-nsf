import LudmilaError from "../../../../../../src/error/LudmilaError";
import LudmilaErrors from "../../../../../../src/error/LudmilaErrors";
import {gql} from "apollo-server-core";

export default {
  schema: gql`
type Query {
  error: Boolean
}
`,
  resolvers: {
    Query: {
      error() {
        throw new LudmilaError(LudmilaErrors.FAIL, "testing error")
      },
    },
  },
};
