import Application from "../../src/application/Application";
import Environment from "../../src/application/Environment";
import LudmilaError from "../../src/error/LudmilaError";
import LudmilaErrors from "../../src/error/LudmilaErrors";

describe("Basic: Functions", () => {
  beforeAll(async () => {
    return Application.runTest("basic");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("Environment", async () => {
    const profiles = Environment.S.profiles
    const majorProfile = Environment.S.majorProfile
    const hasAnyProfile = Environment.S.hasAnyProfile(majorProfile)
    const hasAllProfile = Environment.S.hasAllProfile(majorProfile)

    expect(hasAnyProfile).toBeTruthy()
    expect(hasAllProfile).toBeTruthy()
  });

  it("Error", async () => {
    try {
      throw new LudmilaError(LudmilaErrors.FAIL)
    } catch (e) {
      // ignored
    }
  });
});
