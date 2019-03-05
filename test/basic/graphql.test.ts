import request from "supertest";
import Application from "../../src/application/Application"
import HttpServer from "../../src/server/HttpServer";

describe("Basic: GraphQL", () => {
  beforeAll(async () => {
    return Application.runTest("basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Time", async () => {
    const resp = await request(HttpServer.S.expressApp)
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

  it("Error", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .post("/graphql")
      .send({
        query: `
query error {
  error
}`,
      })
    expect(resp.status).toBe(200)
    expect(resp.body).toHaveProperty("errors")
  });
});
