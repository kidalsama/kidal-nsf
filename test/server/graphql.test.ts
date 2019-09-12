import request from "supertest";
import Application from "../../src/application/Application"
import {InputObjectTypeDefinitionNode, parse} from "graphql";
import mergeGraphQLNodes from "../../src/server/graphql/merges/merge-node";
import {Container} from "../../src/ioc/Container";
import {HttpServerManager} from "../../src/server/HttpServerManager";

describe("GraphQL: 合并", () => {
  describe("type", () => {
    it("Should merge two GraphQL types correctly when one of them is empty", () => {
      const type1 = parse(`type A { f1: String }`);
      const type2 = parse(`type A`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.fields.length).toBe(1);
      expect(type.fields[0].name.value).toBe("f1");
      expect(type.fields[0].type.name.value).toBe("String");
    });

    it("Should merge two GraphQL Types correctly", () => {
      const type1 = parse(`type A { f1: String }`);
      const type2 = parse(`type A { f2: Int }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.fields.length).toBe(2);
      expect(type.fields[0].name.value).toBe("f1");
      expect(type.fields[1].name.value).toBe("f2");
      expect(type.fields[0].type.name.value).toBe("String");
      expect(type.fields[1].type.name.value).toBe("Int");
    });

    it("Should merge two GraphQL Types correctly when they have shared fields", () => {
      const type1 = parse(`type A { f1: String }`);
      const type2 = parse(`type A { f1: String, f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.fields.length).toBe(2);
      expect(type.fields[0].name.value).toBe("f1");
      expect(type.fields[1].name.value).toBe("f2");
      expect(type.fields[0].type.name.value).toBe("String");
      expect(type.fields[1].type.name.value).toBe("Int");
    });

    it("Should merge GraphQL Types that extends the same interface", () => {
      const type1 = parse(`interface Base { f1: String } type A implements Base { f1: String }`);
      const type2 = parse(`interface Base { f1: String } type A implements Base { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.interfaces.length).toBe(1);
      expect(type.interfaces[0].name.value).toBe("Base");
    });

    it("Should merge GraphQL Types that has interface and then override without it", () => {
      const type1 = parse(`interface Base { f1: String } type A implements Base { f1: String }`);
      const type2 = parse(`type A { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.interfaces.length).toBe(1);
      expect(type.interfaces[0].name.value).toBe("Base");
    });

    it("Should merge GraphQL Types and preserve directives and not override", () => {
      const type1 = parse(`type A @test { f1: String }`);
      const type2 = parse(`type A { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.directives.length).toBe(1);
      expect(type.directives[0].name.value).toBe("test");
    });

    it("Should merge GraphQL Types and preserve directives and merge multiple", () => {
      const type1 = parse(`type A @test { f1: String }`);
      const type2 = parse(`type A @other { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.directives.length).toBe(2);
      expect(type.directives[0].name.value).toBe("test");
      expect(type.directives[1].name.value).toBe("other");
    });

    it("Should merge GraphQL Types and preserve directives", () => {
      const type1 = parse(`type A @test { f1: String }`);
      const type2 = parse(`type A @test { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.directives.length).toBe(1);
      expect(type.directives[0].name.value).toBe("test");
    });

    it("Should merge GraphQL Types and merge directives", () => {
      const type1 = parse(`type A @test { f1: String }`);
      const type2 = parse(`type A @test2 { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.directives.length).toBe(2);
      expect(type.directives[0].name.value).toBe("test");
      expect(type.directives[1].name.value).toBe("test2");
    });

    it("Should merge GraphQL Types that extends the different interfaces", () => {
      const type1 = parse(`interface Base1 { f1: String } type A implements Base1 { f1: String }`);
      const type2 = parse(`interface Base2 { f2: Int } type A implements Base2 { f2: Int}`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.A;

      expect(type.interfaces.length).toBe(2);
      expect(type.interfaces[0].name.value).toBe("Base1");
      expect(type.interfaces[1].name.value).toBe("Base2");
    });

    it("Should merge two GraphQL Types correctly when they have a conflict", () => {
      const type1 = parse(`type A { f1: String }`);
      const type2 = parse(`type A { f1: Int }`);
      const mergedFn = () => mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);

      expect(mergedFn).toThrowError(
        'Unable to merge GraphQL type "A": Field "f1" already defined with a different type.' +
        ' Declared as "String", but you tried to override with "Int"',
      );
    });
  });

  describe("enum", () => {
    it("should merge different enums values", () => {
      const type1 = parse(`enum A { T }`);
      const type2 = parse(`enum A { S }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.A;

      expect(result.values.length).toBe(2);
      expect(result.values[0].name.value).toBe("T");
      expect(result.values[1].name.value).toBe("S");
    });

    it("should merge different same values", () => {
      const type1 = parse(`enum A { T }`);
      const type2 = parse(`enum A { T }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.A;

      expect(result.values.length).toBe(1);
      expect(result.values[0].name.value).toBe("T");
    });

    it("should merge directives correctly", () => {
      const type1 = parse(`enum A @test { T }`);
      const type2 = parse(`enum A @test2 { T }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.A;

      expect(result.directives.length).toBe(2);
      expect(result.directives[0].name.value).toBe("test");
      expect(result.directives[1].name.value).toBe("test2");
    });

    it("should merge directives correctly when only one defined", () => {
      const type1 = parse(`enum A @test { T }`);
      const type2 = parse(`enum A { S }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.A;

      expect(result.directives.length).toBe(1);
      expect(result.directives[0].name.value).toBe("test");
    });
  });

  describe("union", () => {
    it("should merge unions possible types", () => {
      const type1 = parse(`type A union C = A`);
      const type2 = parse(`type B union C = B`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.C;

      expect(result.types.length).toBe(2);
      expect(result.types[0].name.value).toBe("A");
      expect(result.types[1].name.value).toBe("B");
    });
  });

  describe("scalar", () => {
    it("should merge scalar with the same type", () => {
      const type1 = parse(`scalar A`);
      const type2 = parse(`scalar A`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.A;

      expect(result.name.value).toBe("A");
    });
  });

  describe("input", () => {
    it("should merge input", () => {
      const type1 = parse(`input A { f1: String }`);
      const type2 = parse(`input A { f2: String }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: any = merged.A;

      expect(result.fields.length).toBe(2);
      expect(result.fields[0].name.value).toBe("f1");
      expect(result.fields[1].name.value).toBe("f2");
    });

    it("should merge input and prefer NonNullable over Nullable", () => {
      const type1 = parse(`input A { f1: String }`);
      const type2 = parse(`input A { f1: String! }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const result: InputObjectTypeDefinitionNode = merged.A as any;

      expect(result).toBeDefined()
      expect(result.fields).toBeDefined()
      expect(result.fields!.length).toBe(1);
      expect(result.fields![0].name.value).toBe("f1");
      expect(result.fields![0].type.kind).toBe("NonNullType");
    });
  });

  describe("schema", () => {
    it("should merge Query type correctly", () => {
      const type1 = parse(`type Query { f1: String }`);
      const type2 = parse(`type Query { f2: String }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      const type: any = merged.Query;

      expect(type.fields.length).toBe(2);
      expect(type.fields[0].name.value).toBe("f1");
      expect(type.fields[1].name.value).toBe("f2");
      expect(type.fields[0].type.name.value).toBe("String");
      expect(type.fields[1].type.name.value).toBe("String");
    });

    it("should remove schema definition", () => {
      const type1 = parse(`schema { query: Query } type Query { f1: String }`);
      const type2 = parse(`type Query { f2: String }`);
      const merged = mergeGraphQLNodes([...type1.definitions, ...type2.definitions]);
      expect(Object.values(merged).length).toBe(1);
    });
  });
});

describe("GraphQL", () => {
  beforeAll(async () => {
    return Application.runTest("basic", "test-server");
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("TestDate", async () => {
    const now = "2011-10-11 23:55:17"
    const resp = await request(Container.get(HttpServerManager).acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query testDate($now: Date!) {
  testDate(now: $now) {
    yyyy: format(unit: "yyyy")
    unix_timestamp: format(unit: "unix-timestamp")
    datetime_no_sec: format(unit: "datetime-no-sec")
    timestamp
    date
    datetime
    testingNull
    testingDirective
    testingDirective_yy: testingDirective(unit: "yy")
    testingDirectiveWithDefaultYear
  }
}`,
        variables: {now},
      })
    expect(resp.status).toBe(200)
    expect(resp.body).not.toHaveProperty("errors")
    expect(resp.body.data).toBeDefined()
    expect(resp.body.data.testDate).toBeDefined()
    expect(resp.body.data.testDate.yyyy).toEqual("2011")
    expect(resp.body.data.testDate.unix_timestamp).toEqual(Math.floor(new Date(now).getTime() / 1000).toString())
    expect(resp.body.data.testDate.datetime_no_sec).toEqual("2011-10-11 23:55")
    expect(resp.body.data.testDate.timestamp).toEqual(new Date(now).getTime())
    expect(resp.body.data.testDate.date).toEqual("2011-10-11")
    expect(resp.body.data.testDate.datetime).toEqual("2011-10-11 23:55:17")
    expect(resp.body.data.testDate.testingNull).toBeNull()
    expect(resp.body.data.testDate.testingDirective).toEqual("2011-10-11 23:55:17")
    expect(resp.body.data.testDate.testingDirective_yy).toEqual("11")
    expect(resp.body.data.testDate.testingDirectiveWithDefaultYear).toEqual("2011")
  });

  it("TestDirective", async () => {
    const resp = await request(Container.get(HttpServerManager).acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query testDirective {
  testDirective {
    b: byte
    kb: byte(unit: "kb", precision: 2)
    mb: byte(unit: "mb")
    gb: byte(unit: "gb", precision: 2)
    date
    ms: time
    s: time(unit: "s")
    m: time(unit: "m")
    h: time(unit: "h")
    d: time(unit: "d", precision: 2)
    originalUrl: url
    commonUrl: url(unit: "//")
    httpUrl: url(unit: "http")
    httpsUrl: url(unit: "https")
  }
}`,
      })
    expect(resp.status).toBe(200)
    expect(resp.body).not.toHaveProperty("errors")
    expect(resp.body.data).toBeDefined()
    expect(resp.body.data.testDirective).toBeDefined()
    expect(resp.body.data.testDirective.b).toEqual(1502546469959274)
    expect(resp.body.data.testDirective.kb).toEqual(1467330537069.60)
    expect(resp.body.data.testDirective.mb).toEqual(1432939977)
    expect(resp.body.data.testDirective.gb).toEqual(1399355.45)
    expect(resp.body.data.testDirective.date).toEqual("1990-01-25 00:00:00")
    expect(resp.body.data.testDirective.ms).toEqual(1567481165429)
    expect(resp.body.data.testDirective.s).toEqual(1567481165)
    expect(resp.body.data.testDirective.m).toEqual(26124686)
    expect(resp.body.data.testDirective.h).toEqual(435411)
    expect(resp.body.data.testDirective.d).toEqual(18142.14)
    expect(resp.body.data.testDirective.originalUrl).toEqual("http://gitlab.dev.everybodygame.com")
    expect(resp.body.data.testDirective.commonUrl).toEqual("//gitlab.dev.everybodygame.com")
    expect(resp.body.data.testDirective.httpUrl).toEqual("http://gitlab.dev.everybodygame.com")
    expect(resp.body.data.testDirective.httpsUrl).toEqual("https://gitlab.dev.everybodygame.com")
  });

  it("Error", async () => {
    const resp = await request(Container.get(HttpServerManager).acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query error {
  error
}`,
      })
    expect(resp.status).toBe(200)
    expect(resp.body).toHaveProperty("errors")
  });

  it("SubTypeError", async () => {
    const resp = await request(Container.get(HttpServerManager).acquire().expressApp)
      .post("/graphql")
      .send({
        query: `
query error {
  subType {
    error
  }
}`,
      })
    expect(resp.status).toBe(200)
    expect(resp.body).toHaveProperty("errors")
    expect(resp.body.errors[0]).toHaveProperty("code")
    expect(resp.body.errors[0].code).toBe("998")
  });
});
