import Application from "../../src/application/Application"
import PayloadDispatcher from "../../src/server/PayloadDispatcher";
import WebSocket from "ws";
import {Container} from "../../src/ioc";
import {HttpServerManager} from "../../src/server/HttpServerManager";

describe("WebSocket", () => {
  let wsc: WebSocket

  beforeAll(async () => {
    await Application.runTest("basic", "test-http");
  })

  afterAll(async () => {
    try {
      wsc.close()
    } catch (e) {
      // ignored
    }
    await Application.S.shutdown()
  })

  it("Connect", (done) => {
    const address = Container.get(HttpServerManager).acquire().server.address()

    if (address === null) {
      throw new Error("Server's address is null");
    } else if (typeof address === "string") {
      wsc = new WebSocket(`http://${address}/ws`)
    } else {
      wsc = new WebSocket(`http://localhost:${address.port}/ws`)
    }

    wsc.on("open", () => {
      done()
    })
  })

  it("Login & Logout & Kick", (done) => {
    wsc.on("message", (payload: string) => {
      const data = JSON.parse(payload)
      if (data.data && data.data.error) {
        throw new Error(data.data.error.code)
      }
      if (data.type === "commons/kick") {
        done()
      }
    })
    wsc.send(JSON.stringify({
      type: "commons/login",
    }))
    wsc.send(JSON.stringify({
      type: "commons/login",
    }))
    wsc.send(JSON.stringify({
      type: "commons/logout",
    }))
    wsc.send(JSON.stringify({
      type: "commons/login",
    }))
    wsc.send(JSON.stringify({
      type: "commons/kick",
    }))
  })

  it("PayloadDispatcher#dispatchWebSocket", async () => {
    const results = await PayloadDispatcher.S.dispatchWebSocket(null, {
      version: 1,
      id: 1,
      type: "commons/time",
      data: {
        fmt: "yyyy",
      },
    })
    expect(results).not.toBeNull()
  });
});
