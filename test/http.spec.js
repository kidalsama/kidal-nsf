"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const Application_1 = __importDefault(require("../src/application/Application"));
const HttpServer_1 = __importDefault(require("../src/server/HttpServer"));
describe("Http", () => {
    beforeAll(async () => {
        return Application_1.default.run(["", "", "test", "test-server"]);
    });
    afterAll(async () => {
        await Application_1.default.S.shutdown();
    });
    it("Should get status 200", async () => {
        const resp = await supertest_1.default(HttpServer_1.default.S.expressApp)
            .get("/");
        expect(resp.status).toBe(200);
    });
    it("Should get status 404", async () => {
        const resp = await supertest_1.default(HttpServer_1.default.S.expressApp)
            .get("/wrongUrl2018");
        expect(resp.status).toBe(404);
    });
});
//# sourceMappingURL=http.spec.js.map