"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GraphQLUnits_1 = __importDefault(require("../../../../server/graphql/GraphQLUnits"));
exports.default = {
    schema: `
type Query {
  time(unit: String): String!
}
`,
    resolver: {
        time(args) {
            return GraphQLUnits_1.default.dateUnit(new Date(), args);
        },
    },
};
//# sourceMappingURL=time.js.map