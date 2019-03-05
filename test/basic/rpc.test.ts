import Application from "../../src/application/Application"
import Rpc from "../../src/cluster/Rpc";

describe("Basic: Rpc", () => {
  beforeAll(async () => {
    return new Promise((resolve) => {
      Application.runTest("basic")
        .then(() => {
          setTimeout(resolve, 1000) // 等待Discovery同步
        });
    })
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Time", async () => {
    const results = await Rpc.S.callRemoteProcedure("901", "commons", "time", {fmt: "yyyy"})
    expect(results).not.toBeNull()
  });
});
