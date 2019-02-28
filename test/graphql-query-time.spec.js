"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const Application_1 = __importDefault(require("../src/application/Application"));
const HttpServer_1 = __importDefault(require("../src/server/HttpServer"));
describe("GraphQL Query Time", () => {
    beforeAll(async () => {
        return Application_1.default.run(["", "", "test", "test-server"]);
    });
    it("Time", async () => {
        const resp = await supertest_1.default(HttpServer_1.default.S.expressApp)
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
    testingNull
  }
}`,
        });
        expect(resp.status).toBe(200);
    });
});
//# sourceMappingURL=graphql-query-time.spec.js.map