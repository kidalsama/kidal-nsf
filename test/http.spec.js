"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_http_1 = __importDefault(require("chai-http"));
const Application_1 = __importDefault(require("../src/application/Application"));
const HttpServer_1 = __importDefault(require("../src/server/HttpServer"));
const should = chai_1.default.should();
chai_1.default.use(chai_http_1.default);
describe("Http", () => {
    before(async () => {
        return Application_1.default.run(["", "", "test", "test-server"]);
    });
    it("Should get status 200", (done) => {
        chai_1.default.request(HttpServer_1.default.S.server)
            .get("/")
            .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
    it("Should get status 404", (done) => {
        chai_1.default.request(HttpServer_1.default.S.server)
            .get("/wrongUrl2018")
            .end((err, res) => {
            res.should.have.status(404);
            // res.text.should.eql('respond with the user list here');
            done();
        });
    });
});
//# sourceMappingURL=http.spec.js.map