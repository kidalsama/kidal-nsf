import LudmilaError from "../../../../../../src/error/LudmilaError";
import LudmilaErrors from "../../../../../../src/error/LudmilaErrors";
import {gql} from "apollo-server-core";

export default {
  schema: gql`
type Query {
  error: Boolean
  subType: SubTypeError
}

type SubTypeError {
  error: Boolean
}
`,
  resolvers: {
    Query: {
      error() {
        throw new LudmilaError("998", "test error")
      },
      async subType() {
        return {}
      },
    },
    SubTypeError: {
      async error() {
        throw new LudmilaError("998", "test sub type error")
      },
    },
  },
};
