import LudmilaError from "../../../../../../src/error/LudmilaError";
import LudmilaErrors from "../../../../../../src/error/LudmilaErrors";

export default {
  schema: `
type Query {
  error: Boolean
}
`,
  resolver: {
    error() {
      throw new LudmilaError(LudmilaErrors.FAIL, "testing error")
    },
  },
};
