import supertest from "supertest";
import Application from "../src/application/Application";
import HttpServer from "../src/server/HttpServer";

describe("Http", () => {
  beforeAll(async () => {
    return Application.run(["", "", "test", "test-server"]);
  })

  it("Should get status 200", async () => {
    const resp = await supertest(HttpServer.S.expressApp)
      .get("/")

    expect(resp.status).toBe(200)
  });
  it("Should get status 404", async () => {
    const resp = await supertest(HttpServer.S.expressApp)
      .get("/wrongUrl2018")
    expect(resp.status).toBe(404)
  });
});
