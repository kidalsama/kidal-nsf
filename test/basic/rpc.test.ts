import Application from "../../src/application/Application"
import Rpc from "../../src/cluster/Rpc";

describe("Basic: Rpc", () => {
  const waitDiscoveryTimeout = 5 * 1000

  beforeAll(async () => {
    return new Promise((resolve) => {
      Application.runTest("basic")
        .then(() => {
          setTimeout(resolve, waitDiscoveryTimeout) // 等待Discovery同步
        });
    })
  }, waitDiscoveryTimeout + 2000)

  afterAll(async () => {
    await Application.S.shutdown()
  })

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
