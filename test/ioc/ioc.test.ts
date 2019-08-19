import {Autowired, Component, Container, Provided, Provides, Scope, Scoped, Singleton} from "../../src/ioc";

describe("@Autowired 应用于字段", () => {
  @Component
  class SimpleInject {
    @Autowired public dateProperty: Date;
  }

  @Component
  class ConstructorSimpleInject {
    @Autowired public aDateProperty: Date;

    public testOK: boolean;

    constructor() {
      if (this.aDateProperty) {
        this.testOK = true;
      }
    }
  }

  abstract class AbsClass {
    protected constructor(public date: Date) {
    }
  }

  @Component
  class ConstructorInjected extends AbsClass {
    constructor(@Autowired public anotherDate: Date) {
      super(anotherDate);
    }
  }

  it("应该给字段注入新new的值", () => {
    const instance: SimpleInject = new SimpleInject();
    expect(instance.dateProperty).toBeDefined()
  });

  it("应该给字段注入新new的值，并在构造方法内能操作", () => {
    const instance: ConstructorSimpleInject = new ConstructorSimpleInject();
    expect(instance.testOK).toBeTruthy()
  });

  it("应该通过构造方法的参数注入新的值", () => {
    const instance: ConstructorInjected = Container.get(ConstructorInjected);
    expect(instance.anotherDate).toBeDefined()
    expect(instance.date).toBeDefined()
    expect(instance.date).toEqual(instance.anotherDate)
  });
})

describe("@Autowired 应用于构造方法的参数", () => {

  const constructorsArgs: any[] = new Array<any>();
  const constructorsMultipleArgs: any[] = new Array<any>();

  @Component
  class TestConstructor {
    public injectedDate: Date;

    constructor(@Autowired date: Date) {
      constructorsArgs.push(date);
      this.injectedDate = date;
    }
  }

  @Component
  class TestConstructor2 {
    @Autowired
    public test1: TestConstructor;
  }

  it("应该向构造方法注入一个新new的值", () => {
    const instance: TestConstructor2 = new TestConstructor2();
    expect(instance.test1).toBeDefined()
    expect(constructorsArgs.length).toEqual(1)
  });

  it("当传入参数时不应当向构造方法注入值", () => {
    const myDate: Date = new Date(1);
    const instance: TestConstructor = new TestConstructor(myDate);
    expect(instance.injectedDate).toEqual(myDate);
  });

  @Component
  class A {
  }

  @Component
  class B {
  }

  @Component
  class C {
  }

  @Component
  class D {
    constructor(@Autowired a: A, @Autowired b: B, @Autowired c: C) {
      constructorsMultipleArgs.push(a);
      constructorsMultipleArgs.push(b);
      constructorsMultipleArgs.push(c);
    }
  }

  it("应该向构造方法按正确的顺序注入参数", () => {
    const instance: D = Container.get(D);
    expect(instance).toBeDefined()
    expect(constructorsMultipleArgs[0]).toBeDefined()
    expect(constructorsMultipleArgs[1]).toBeDefined()
    expect(constructorsMultipleArgs[2]).toBeDefined()
    expect(constructorsMultipleArgs[0].constructor).toEqual(A)
    expect(constructorsMultipleArgs[1].constructor).toEqual(B);
    expect(constructorsMultipleArgs[2].constructor).toEqual(C);
  });
});

describe("继承 @Component 类型", () => {
  const constructorsCalled: string[] = new Array<string>();

  interface ITestInterface {
    property1: Date;
  }

  @Component
  class TestAbstract implements ITestInterface {
    public bbb: Date;

    @Autowired
    public property1: Date;

    constructor() {
      constructorsCalled.push("TestAbstract");
    }
  }

  @Component
  class Test1 extends TestAbstract {
    public proper1: string = "Property";

    @Autowired
    public property2: Date;

    constructor() {
      super();
      constructorsCalled.push("Test1");
    }
  }

  @Component
  class Test2 extends Test1 {
    @Autowired public abc: number = 123;
    @Autowired public property3: Date;

    constructor() {
      super();
      constructorsCalled.push("Test2");
    }
  }

  @Component
  class ConstructorMethodInject extends Test2 {
    public testOK: boolean;

    constructor() {
      super();
      if (this.myMethod()) {
        this.testOK = true;
      }
    }

    public myMethod() {
      return true;
    }
  }

  it("应该注入全部的字段", () => {
    const instance: Test2 = new Test2();
    const instance2: Test2 = new Test2();
    instance2.abc = 234;
    expect(instance.property1).toBeDefined()
    expect(instance.property2).toBeDefined();
    expect(instance.abc).toEqual(123);
    expect(instance2.abc).toEqual(234);
    expect(constructorsCalled).toContain("TestAbstract")
    expect(constructorsCalled).toContain("Test1")
    expect(constructorsCalled).toContain("Test2")
  });

  it("应当保持原型链", () => {
    const instance: ConstructorMethodInject = new ConstructorMethodInject();
    expect(instance.testOK).toBeTruthy()
  });
});

describe("@Component @Scope", () => {
  const scopeCreations: any[] = new Array<any>();

  class MyScope extends (Scope) {
    public resolve(provider: any, source: Function) {
      const result = provider.get();
      scopeCreations.push(result);
      return result;
    }
  }

  @Component
  @Scoped(new MyScope())
  class ScopedTest {
    constructor() {
      // Nothing
    }
  }

  @Component
  class ScopedTest2 {
    @Autowired public test1: ScopedTest;

    constructor() {
      // Nothing
    }
  }

  it("应该注入全部字段", () => {
    const instance: ScopedTest2 = new ScopedTest2();
    expect(instance).toBeDefined()
    expect(instance.test1).toBeDefined()
    expect(scopeCreations.length).toEqual(1)
    expect(scopeCreations[0]).toEqual(instance.test1);
  });
});

describe("自定义 Provider", () => {
  const providerCreations: any[] = new Array<any>();

  const provider = {
    get: () => {
      const result = new ProvidedTest();
      providerCreations.push(result);
      return result;
    },
  };

  @Component
  @Singleton
  @Provided(provider)
  class ProvidedTest {
    constructor() {
      // Nothing
    }
  }

  @Component
  class ProvidedTest2 {
    @Autowired
    public test1: ProvidedTest;

    constructor() {
      // Nothing
    }
  }

  it("应该注入全部字段", () => {
    const instance: ProvidedTest2 = new ProvidedTest2();
    expect(instance).toBeDefined()
    expect(instance.test1).toBeDefined();
    expect(providerCreations.length).toEqual(1);
    expect(providerCreations[0]).toEqual(instance.test1);
  });
});

describe("默认实现类", () => {
  class BaseClass {
  }

  @Component
  @Provides(BaseClass)
  class ImplementationClass implements BaseClass {
    @Autowired
    public testProp: Date;
  }

  it("获取实现类", () => {
    const instance: ImplementationClass = Container.get(BaseClass) as ImplementationClass;
    const test = instance.testProp;
    expect(test).toBeDefined();
  });
});

describe("Container.bind(source)", () => {

  class ContainerInjectTest {
    @Autowired
    public dateProperty: Date;
  }

  Container.bind(ContainerInjectTest);

  it("通过容器获取时应当注入字段", () => {
    const instance: ContainerInjectTest = Container.get(ContainerInjectTest);
    expect(instance.dateProperty).toBeDefined();
  });

  it("通过构造方法创建时应当注入字段", () => {
    const instance: ContainerInjectTest = new ContainerInjectTest();
    expect(instance.dateProperty).toBeDefined()
  });
});

describe("Container.get(source)", () => {

  class ContainerInjectConstructorTest {
    public injectedDate: Date;

    constructor(@Autowired date: Date) {
      this.injectedDate = date;
    }
  }

  Container.bind(ContainerInjectConstructorTest);

  it("通过容器获取时应当注入参数", () => {
    const instance: ContainerInjectConstructorTest = Container.get(ContainerInjectConstructorTest);
    expect(instance.injectedDate).toBeDefined()
  });
});

describe("Container.getType(source)", () => {

  abstract class ITest {
    public abstract testValue: string;
  }

  class Test implements ITest {
    public testValue: string = "success";
  }

  class TestNoProvider {
    public testValue: string = "success";
  }

  class TypeNotRegistered {
    public testValue: string = "success";
  }

  Container.bind(ITest).to(Test);
  Container.bind(TestNoProvider);

  it("通过容器获取类型", () => {
    const clazz: Function = Container.getType(ITest);
    expect(clazz).toEqual(Test)

    const clazzNoProvider: Function = Container.getType(TestNoProvider);
    expect(clazzNoProvider).toEqual(TestNoProvider);
  });

  it("通过容器获取未注册的类型时应当抛出异常", () => {
    try {
      const clazz: Function = Container.getType(TypeNotRegistered);
      expect(clazz).toBeNull()
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError)
    }
  });

});

describe("Container.snapshot(source) and Container.restore(source)", () => {

  @Component
  abstract class IService {
  }

  @Component
  @Provides(IService)
  class Service implements IService {
  }

  class MockService implements IService {
  }

  Container.bind(IService).to(Service);

  it("当尝试恢复未暂存的类型是应该抛出异常", () => {
    expect(function () {
      Container.restore(IService)
    }).toThrow(TypeError);
  });

  it("应当暂存已存在的类型并重写为新的类型", () => {

    expect(Container.get(IService)).toBeInstanceOf(Service);

    Container.snapshot(IService);
    Container.bind(IService).to(MockService);

    expect(Container.get(IService)).toBeInstanceOf(MockService);
  });

  it("应该恢复暂存的类型", () => {

    Container.restore(IService);

    expect(Container.get(IService)).toBeInstanceOf(Service);
  });

  it("应当暂存已存在的类型并重写为新的类型并改变作用范围", () => {

    Container.bind(IService).to(Service).scope(Scope.LOCAL);

    expect(Container.get(IService)).toBeInstanceOf(Service);

    Container.snapshot(IService);
    Container.bind(IService).to(MockService).scope(Scope.LOCAL);

    expect(Container.get(IService)).toBeInstanceOf(MockService);
  });

  it("应该恢复暂存的类型和作用范围", () => {

    Container.restore(IService);

    expect(Container.get(IService)).toBeInstanceOf(Service);
  });
});

describe("Container", () => {

  @Component
  @Singleton
  class SingletonInstantiation {
  }

  @Component
  class ContainerSingletonInstantiation {
  }

  Container.bind(ContainerSingletonInstantiation)
    .to(ContainerSingletonInstantiation)
    .scope(Scope.SINGLETON);

  it("不允许实例化单例类", () => {
    expect(function () {
      const ins = new SingletonInstantiation();
    })
      .toThrow(TypeError);
  });

  it("作用范围改变应当生效", () => {
    expect(function () {
      const ins = new ContainerSingletonInstantiation();
    })
      .toThrow(TypeError);
  });

  it("应当获取到单间类", () => {
    const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
    expect(instance).toBeDefined();
  });

  it("应该允许将单件类作用范围改为总是新建", () => {
    const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
    expect(instance).toBeDefined()
    Container.bind(SingletonInstantiation).scope(Scope.LOCAL);
    const instance2: SingletonInstantiation = new SingletonInstantiation();
    expect(instance2).toBeDefined()
  });

  it("应当加载不同文件中的类", () => {
    Container.addSource("ioc/data/*.js", "test");

    const Worker = require("./data/classes").Worker;
    const instance = new Worker();
    expect(instance).toBeDefined()
    expect(instance.type).toBeDefined()
    instance.work();
  });
});

describe("Container Config.to()", () => {

  abstract class FirstClass {
    public abstract getValue(): string;
  }

  class SecondClass extends FirstClass {
    public getValue(): string {
      return "second";
    }
  }

  class ThirdClass extends FirstClass {
    public getValue(): string {
      return "third";
    }
  }

  Container.bind(FirstClass).to(SecondClass);

  it("应当允许重写目标", () => {
    let instance: FirstClass = Container.get(FirstClass);
    expect(instance.getValue()).toEqual("second");

    Container.bind(FirstClass).to(ThirdClass);
    instance = Container.get(FirstClass);
    expect(instance.getValue()).toEqual("third");
  });
});
