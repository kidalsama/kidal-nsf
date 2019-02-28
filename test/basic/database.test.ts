import request from "supertest";
import Application from "../../src/application/Application"
import HttpServer from "../../src/server/HttpServer";

describe("Basic: Database", () => {
  beforeAll(async () => {
    return Application.runTest("basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Login incorrect user", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .post("/graphql")
      .send({
        query: `
{
  login(username: "123", password: "123") {
    id
    username
    password
    createdAt
    updatedAt
  }
}`,
      })

    expect(resp.body).toHaveProperty("errors")
  });

  let id = 0

  it("Login register user", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .post("/graphql")
      .send({
        query: `
mutation {
  registerUser(username: "123", password: "123") {
    id
    username
    password
    createdAt
    updatedAt
  }
}`,
      })

    expect(resp.body).toHaveProperty("data.registerUser.id")
    expect(resp.body).toHaveProperty("extensions.foundation.sync.full")
    expect(resp.body.extensions.foundation.sync.full.length).toBeGreaterThan(0)
  });

  it("Login correct user", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .post("/graphql")
      .send({
        query: `
{
  login(username: "123", password: "123") {
    id
    username
    password
    createdAt
    updatedAt
  }
}`,
      })

    expect(resp.body).toHaveProperty("data.login.id")
    expect(resp.body).toHaveProperty("extensions.foundation.sync.full")
    expect(resp.body.extensions.foundation.sync.full.length).toBeGreaterThan(0)

    id = resp.body.data.login.id
  });

  it("Rename user", async () => {
    const resp = await request(HttpServer.S.expressApp)
      .post("/graphql")
      .send({
        query: `
mutation {
  renameUser(id: ${id}, newUsername: "233") {
    id
    username
    password
    createdAt
    updatedAt
  }
}`,
      })

    expect(resp.body).toHaveProperty("data.renameUser")
    expect(resp.body.data.renameUser).not.toBeNull()
    expect(resp.body).toHaveProperty("extensions.foundation.sync.partial")
    expect(resp.body.extensions.foundation.sync.partial.length).toBeGreaterThan(0)
    expect(resp.body.extensions.foundation.sync.partial[0]).toHaveProperty("key", "username")
    expect(resp.body.extensions.foundation.sync.partial[0]).toHaveProperty("value", "233")
  });
});
