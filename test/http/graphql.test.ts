import request from "supertest";
import Application from "../../src/application/Application"
import HttpServer from "../../src/server/HttpServer";
import {GraphQLUnits} from "../../src/server/graphql";

describe("GraphQL", () => {
  beforeAll(async () => {
    return Application.runTest("basic", "test-http");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Time", async () => {
    const now = "2011-10-11 23:55:17"
    const resp = await request(HttpServer.acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query testDate($now: Date!) {
  testDate(now: $now) {
    yyyy: format(unit: "yyyy")
    unix_timestamp: format(unit: "unix-timestamp")
    datetime_no_sec: format(unit: "datetime-no-sec")
    timestamp
    date
    datetime
    testingNull
  }
}`,
        variables: {now},
      })
    expect(resp.status).toBe(200)
    expect(resp.body).not.toHaveProperty("errors")
    expect(resp.body.data).toBeDefined()
    expect(resp.body.data.testDate).toBeDefined()
    expect(resp.body.data.testDate.yyyy).toEqual("2011")
    expect(resp.body.data.testDate.unix_timestamp).toEqual(Math.floor(new Date(now).getTime() / 1000).toString())
    expect(resp.body.data.testDate.datetime_no_sec).toEqual("2011-10-11 23:55")
    expect(resp.body.data.testDate.timestamp).toEqual(new Date(now).getTime())
    expect(resp.body.data.testDate.date).toEqual("2011-10-11")
    expect(resp.body.data.testDate.datetime).toEqual("2011-10-11 23:55:17")
    expect(resp.body.data.testDate.testingNull).toBeNull()
  });

  it("Error", async () => {
    const resp = await request(HttpServer.acquire().expressApp)
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

  it("SubTypeError", async () => {
    const resp = await request(HttpServer.acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query error {
  subType {
    error
  }
}`,
      })
    expect(resp.status).toBe(200)
    expect(resp.body).toHaveProperty("errors")
    expect(resp.body.errors[0]).toHaveProperty("code")
    expect(resp.body.errors[0].code).toBe("998")
  });
});
