"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_http_1 = __importDefault(require("chai-http"));
const Application_1 = __importDefault(require("../application/Application"));
const HttpServer_1 = __importDefault(require("../server/HttpServer"));
const should = chai_1.default.should();
chai_1.default.use(chai_http_1.default);
describe("GraphQL Query Time", () => {
    before(async () => {
        await Application_1.default.run(["", "", "dev,td", "test-server"]);
        await new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    });
    it("Time", (done) => {
        chai_1.default.request(HttpServer_1.default.S.server)
            .post("/graphql")
            .send({
            query: `
query time {
  serverTime {
    yyyy: format(unit: "yyyy")
    unix_timestamp: format(unit: "unix-timestamp")
    datetime_no_sec: format(unit: "datetime-no-sec")
    timestamp
    date
    datetime
  }
}`,
        })
            .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
});
//# sourceMappingURL=graphql-query-time.spec.js.map