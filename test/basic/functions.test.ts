import Application from "../../src/application/Application";
import Environment from "../../src/application/Environment";
import LudmilaError from "../../src/error/LudmilaError";
import LudmilaErrors from "../../src/error/LudmilaErrors";
import DiscoveryClient from "../../src/cluster/DiscoveryClient";
import GraphQLUtils from "../../src/server/graphql/GraphQLUtils";

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

  it("DiscoveryClient", async () => {
    const discoveryClient = DiscoveryClient.S

    const nodes = discoveryClient.getNodes()
    const ids = discoveryClient.getNodeIds()

    expect(nodes).not.toBeNull()
    expect(ids).not.toBeNull()
  });

  it("GraphQLUtils", async () => {
    const schema = GraphQLUtils.makeConnectionSchema("Test")

    expect(schema).not.toBeNull()
  });
});
