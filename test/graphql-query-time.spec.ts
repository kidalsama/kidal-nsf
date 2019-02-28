import supertest from "supertest";
import Application from "../src/application/Application"
import HttpServer from "../src/server/HttpServer";

describe("GraphQL Query Time", () => {
  beforeAll(async () => {
    return Application.run(["", "", "test", "test-server"]);
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Time", async () => {
    const resp = await supertest(HttpServer.S.expressApp)
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
      })
    expect(resp.status).toBe(200)
  });
});
