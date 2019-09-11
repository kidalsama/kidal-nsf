import Application from "../../src/application/Application";

describe("@ConfigValue", () => {
  class TestConfigValue {
    // 单元测试有某种bug，需要延迟引用进来
    @require("../../src/application/bind/ConfigValue").ConfigValue("settings.test.test.tes", 0)
    public tes: number
  }

  beforeAll(async () => {
    await Application.runTest("basic", "test-basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Settings", () => {
    const t = new TestConfigValue()
    expect(t.tes).toEqual(998.88)
  });
})
