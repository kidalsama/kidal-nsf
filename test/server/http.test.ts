import request from "supertest";
import Application from "../../src/application/Application";
import * as querystring from "querystring";
import {Container} from "../../src/ioc/Container";
import {HttpServerManager} from "../../src/server/HttpServerManager";

describe("Http", () => {
  beforeAll(async () => {
    return Application.runTest("basic", "test-server");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("应当返回状态码200", async () => {
    const resp = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/.nsf/health")

    expect(resp.status).toBe(200)
  });

  it("应当返回状态码404", async () => {
    const resp = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/wrongUrl2018")
    expect(resp.status).toBe(404)
  });

  it("同名路径", async () => {
    const resp0 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/same-path")
    const resp1 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .post("/test-binding/same-path")
    expect(resp0.text).toEqual("GetMapping")
    expect(resp1.text).toEqual("PostMapping")
  })

  it("空查询参数", async () => {
    const resp0 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/echo-str")
    expect(resp0.status).toEqual(200)
  })

  it("基础类型直接返回", async () => {
    const resp0 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding")
    const resp1 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/undefined")
    const resp2 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/null")
    const resp3 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/boolean")
    const resp4 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/number")
    const resp5 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/string")

    expect(resp0.text).toEqual("Welcome to binding test controller")
    expect(resp1.text).toEqual("")
    expect(resp2.text).toEqual("")
    expect(resp3.text).toEqual("true")
    expect(resp4.text).toEqual("998.889")
    expect(resp5.text).toEqual("hello world")
  });

  it("父类方法", async () => {
    const resp1 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/base-controller")

    expect(resp1.text).toEqual("base-controller")
  });

  it("hook", async () => {
    const resp1 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/hook1")
    const resp2 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/hook2")
    const resp3 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/hook3")
    const resp4 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/hook4")

    expect(resp1.status).toEqual(200)
    expect(resp1.text).toEqual("BeforeHookFunctionAfterHook")
    expect(resp2.status).toEqual(200)
    expect(resp2.text).toEqual("BeforeAllHookFunctionAfterAllHook")
    expect(resp3.status).toEqual(200)
    expect(resp3.text).toEqual("MiddlewareFunction")
    expect(resp4.status).toEqual(200)
    expect(resp4.text).toEqual("Middleware0Middleware1Function")
  });

  it("json", async () => {
    const p1 = Math.random()
    const p2 = "echo-object-to-me"
    const q1 = "阿库嘛塔塔"
    const q2 = ""
    const q = {q1, q2}
    const b1 = "鹅妈妈木木"
    const b2 = "✔️"
    const b = {b1, b2}
    const resp1 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .post(`/test-binding/echo/${p1}/${p2}?${querystring.stringify(q)}`)
      .send(b)

    expect(resp1.status).toEqual(200)
    expect(resp1.body).toMatchObject({q, b, p1, p2, q1, q2, b1, b2})
  });

  it("error", async () => {
    const resp1 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/error")
    const resp2 = await request(Container.get(HttpServerManager).acquire().expressApp)
      .get("/test-binding/ludmila-error")

    expect(resp1.status).toEqual(500)
    expect(resp2.status).toEqual(200)
    expect(resp2.body).toMatchObject({code: 1, message: "testing"})
  });
});
