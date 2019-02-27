import chai from "chai";
import chaiHttp from "chai-http";
import Application from "../application/Application"
import HttpServer from "../server/HttpServer";

const should = chai.should();
chai.use(chaiHttp);

describe("Http", () => {
  before(async () => {
    await Application.run(["", "", "dev,td", "test-server"]);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
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
