import Application from "../../src/application/Application";
import {Passport} from "../../src/util/Passport";

describe("Passport", () => {
  beforeAll(async () => {
    await Application.runTest("basic", "test-basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("toString && parse", () => {
    const uin = Math.random()
    const token = "Test_Tokens-with-"
    const parsed = Passport.parse(new Passport(uin, token).toString())
    expect(uin).toEqual(parsed.uin)
    expect(token).toEqual("Test_Tokens-with-")
  });
})
