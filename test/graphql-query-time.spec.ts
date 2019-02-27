import chai from "chai";
import chaiHttp from "chai-http";
import Application from "../application/Application"
import HttpServer from "../server/HttpServer";

const should = chai.should();
chai.use(chaiHttp);

describe("GraphQL Query Time", () => {
  before(async () => {
    return Application.run(["", "", "test", "test-server"]);
  })

  it("Time", (done) => {
    chai.request(HttpServer.S.server)
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
