import Application from "../../src/application/Application"
import PayloadDispatcher from "../../src/server/PayloadDispatcher";

describe("Basic: GraphQL", () => {
  beforeAll(async () => {
    return Application.runTest("basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Time", async () => {
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
