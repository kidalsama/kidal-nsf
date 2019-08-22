import Application from "../../src/application/Application"
import JavaRpcClientManager from "../../src/cluster/JavaClusterRpc";
import LudmilaError from "../../src/error/LudmilaError";

describe("Basic: Java Rpc", () => {
  it("Deprecated", () => {
    // tslint:disable-next-line:no-console
    console.log("NSF is no longer requires JSF")
  })

  // beforeAll(async () => {
  //   return Application.runTest("basic", "test-cluster")
  // })
  //
  // afterAll(async () => {
  //   await Application.S.shutdown()
  // })
  //
  // it("Fetch", async () => {
  //   await JavaRpcClientManager.S.acquire("oa")
  //     .target("MAJOR.project")
  //     .method("get-project")
  //     .version("2018.11")
  //     .invoke(2)
  // });
  //
  // it("Error", async () => {
  //   try {
  //     await JavaRpcClientManager.S.acquire("oa")
  //       .target("MAJOR.project")
  //       .method("-no-method")
  //       .version("2018.11")
  //       .invoke(2)
  //     expect(false).toBeTruthy()
  //   } catch (e) {
  //     if (e instanceof LudmilaError) {
  //       // ignored
  //     } else {
  //       throw e
  //     }
  //   }
  // });
});
