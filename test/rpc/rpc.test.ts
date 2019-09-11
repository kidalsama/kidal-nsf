import Application from "../../src/application/Application"
import Rpc from "../../src/cluster/Rpc";
import DiscoveryClient from "../../src/cluster/DiscoveryClient";

describe("Basic: Rpc", () => {
  const waitDiscoveryTimeout = 5 * 1000

  beforeAll(async () => {
    await Application.runTest("basic", "test-cluster")
    await new Promise((resolve, reject) => setTimeout(resolve, waitDiscoveryTimeout))
  }, waitDiscoveryTimeout + 5 * 1000)

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Discovery init twice", async () => {
    await DiscoveryClient.S.init()
    await new Promise((resolve, reject) => setTimeout(resolve, waitDiscoveryTimeout))
  }, waitDiscoveryTimeout + 5 * 1000);

  it("Discovery reconnect", async () => {
    await DiscoveryClient.S.reconnect()
  });

  it("Time", async () => {
    const results = await Rpc.S.callRemoteProcedure("901", "commons", "time", {fmt: "yyyy"})
    expect(results).not.toBeNull()
  });

  it("Error", async () => {
    try {
      await Rpc.S.callRemoteProcedure("901", "error", "error", {fmt: "yyyy"})
      expect(false).toBeTruthy()
    } catch (e) {
      // ignored
    }
  });
});
