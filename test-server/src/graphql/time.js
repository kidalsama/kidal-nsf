"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GraphQLUnits_1 = __importDefault(require("../../../server/graphql/GraphQLUnits"));
class ServerTime {
    constructor() {
        this._now = new Date();
    }
    format(args) {
        return GraphQLUnits_1.default.dateUnit(new Date(), args);
    }
    timestamp() {
        return this._now.getTime();
    }
    date() {
        return GraphQLUnits_1.default.dateUnit(this._now, { unit: "date" });
    }
    datetime() {
        return GraphQLUnits_1.default.dateUnit(this._now, { unit: "datetime" });
    }
}
exports.default = {
    schema: `
type Query {
  serverTime: ServerTime!
}

type ServerTime {
  format(unit: String): String!
  timestamp: Float!
  date: String!
  datetime: String!
}
`,
    resolver: {
        serverTime() {
            return new ServerTime();
        },
    },
};
//# sourceMappingURL=time.js.map