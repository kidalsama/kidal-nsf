import {Lazy} from "../../src/ioc/Lazy";

describe("@Lazy", () => {
  class LazyTester {
    public get random(): number {
      return Math.random()
    }

    public getRandom(): number {
      return Math.random()
    }

    @Lazy()
    public get lazyRandom(): number {
      return Math.random()
    }

    @Lazy()
    public getLazyRandom(b0: boolean, n1: number, ...strArray: string[]): string {
      return Math.random().toString() + b0 + n1 + strArray.join("_")
    }
  }

  it("未标记Lazy每次返回不同随机数", () => {
    const tester = new LazyTester()
    const v0 = tester.random
    const v1 = tester.random
    const v2 = tester.getRandom()
    const v3 = tester.getRandom()
    expect(v0).not.toEqual(v1)
    expect(v2).not.toEqual(v3)
  });

  it("标记Lazy每次返回相同随机数", () => {
    const tester = new LazyTester()
    const v0 = tester.lazyRandom
    const v1 = tester.lazyRandom
    const v2 = tester.getLazyRandom(true, 1, "德玛西亚")
    const v3 = tester.getLazyRandom(false, 2, "啦啦啦")
    expect(v0).toEqual(v1)
    expect(v2).toEqual(v3)
  });
})
