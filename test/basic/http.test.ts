import request from "supertest";
import Application from "../../src/application/Application";
import HttpServer from "../../src/server/HttpServer";

describe("Basic: Http", () => {
  beforeAll(async () => {
    return Application.runTest("basic", "test-http");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("应当返回状态码200", async () => {
    const resp = await request(HttpServer.acquire().expressApp)
      .get("/.nsf/health")

    expect(resp.status).toBe(200)
  });

  it("应当返回状态码404", async () => {
    const resp = await request(HttpServer.acquire().expressApp)
      .get("/wrongUrl2018")
    expect(resp.status).toBe(404)
  });
});
