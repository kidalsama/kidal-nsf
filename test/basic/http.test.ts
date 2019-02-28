import request from "supertest";
import Application from "../../src/application/Application";
import HttpServer from "../../src/server/HttpServer";

describe("Basic: Http", () => {
  beforeAll(async () => {
    return Application.runTest("basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Should get status 200", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .get("/")

    expect(resp.status).toBe(200)
  });
  it("Should get status 404", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .get("/wrongUrl2018")
    expect(resp.status).toBe(404)
  });
});
