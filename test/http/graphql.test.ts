import request from "supertest";
import Application from "../../src/application/Application"
import HttpServer from "../../src/server/HttpServer";

describe("GraphQL", () => {
  beforeAll(async () => {
    return Application.runTest("basic", "test-http");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("TestDate", async () => {
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
    testingDirective
    testingDirective_yy: testingDirective(unit: "yy")
    testingDirectiveWithDefaultYear
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
    expect(resp.body.data.testDate.testingDirective).toEqual("2011-10-11 23:55:17")
    expect(resp.body.data.testDate.testingDirective_yy).toEqual("11")
    expect(resp.body.data.testDate.testingDirectiveWithDefaultYear).toEqual("2011")
  });

  it("TestDirective", async () => {
    const resp = await request(HttpServer.acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query testDirective {
  testDirective {
    b: byte
    kb: byte(unit: "kb", precision: 2)
    mb: byte(unit: "mb")
    gb: byte(unit: "gb", precision: 2)
    date
    ms: time
    s: time(unit: "s")
    m: time(unit: "m")
    h: time(unit: "h")
    d: time(unit: "d", precision: 2)
    originalUrl: url
    commonUrl: url(unit: "//")
    httpUrl: url(unit: "http")
    httpsUrl: url(unit: "https")
  }
}`,
      })
    expect(resp.status).toBe(200)
    expect(resp.body).not.toHaveProperty("errors")
    expect(resp.body.data).toBeDefined()
    expect(resp.body.data.testDirective).toBeDefined()
    expect(resp.body.data.testDirective.b).toEqual(1502546469959274)
    expect(resp.body.data.testDirective.kb).toEqual(1467330537069.60)
    expect(resp.body.data.testDirective.mb).toEqual(1432939977)
    expect(resp.body.data.testDirective.gb).toEqual(1399355.45)
    expect(resp.body.data.testDirective.date).toEqual("1990-01-25 00:00:00")
    expect(resp.body.data.testDirective.ms).toEqual(1567481165429)
    expect(resp.body.data.testDirective.s).toEqual(1567481165)
    expect(resp.body.data.testDirective.m).toEqual(26124686)
    expect(resp.body.data.testDirective.h).toEqual(435411)
    expect(resp.body.data.testDirective.d).toEqual(18142.14)
    expect(resp.body.data.testDirective.originalUrl).toEqual("http://gitlab.dev.everybodygame.com")
    expect(resp.body.data.testDirective.commonUrl).toEqual("//gitlab.dev.everybodygame.com")
    expect(resp.body.data.testDirective.httpUrl).toEqual("http://gitlab.dev.everybodygame.com")
    expect(resp.body.data.testDirective.httpsUrl).toEqual("https://gitlab.dev.everybodygame.com")
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
