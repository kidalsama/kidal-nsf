import chai from "chai";
import chaiHttp from "chai-http";
import Application from "../src/application/Application"
import HttpServer from "../src/server/HttpServer";

const should = chai.should();
chai.use(chaiHttp);

describe("Http", () => {
  before(async () => {
    return Application.run(["", "", "test", "test-server"]);
  })

  it("Should get status 200", (done) => {
    chai.request(HttpServer.S.server)
      .get("/")
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
  it("Should get status 404", (done) => {
    chai.request(HttpServer.S.server)
      .get("/wrongUrl2018")
      .end((err, res) => {
        res.should.have.status(404);
        // res.text.should.eql('respond with the user list here');
        done();
      });
  });
});
