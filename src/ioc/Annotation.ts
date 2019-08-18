import "reflect-metadata";
import {IoCContainer} from "./IocContainer";
import {Scope} from "./Scope";
import {IProvider} from "./IProvider";
import {InjectorHandler} from "./InjectorHandler";
import {ConfigImpl} from "./Config";

/**
 * 单例类.
 *
 * ```
 * @ Singleton
 * class PersonDAO {
 *
 * }
 * ```
 *
 * 等同于:
 *
 * ```
 * Container.bind(PersonDAO).scope(Scope.Singleton)
 * ```
 */
export function Singleton(target: Function) {
  IoCContainer.bind(target).scope(Scope.SINGLETON)
}

/**
 * 该类需要使用指定的 [[Scope]] 来处理.
 * 例子:
 *
 * ```
 * class MyScope extends Scope {
 *   resolve(iocProvider:Provider, source:Function) {
 *     console.log('created by my custom scope.')
 *     return iocProvider.get();
 *   }
 * }
 * @ Scoped(new MyScope())
 * class PersonDAO {
 * }
 * ```
 *
 * 等同于:
 *
 * ```
 * Container.bind(PersonDAO).scope(new MyScope());
 * ```
 */
export function Scoped(scope: Scope) {
  return function (target: Function) {
    IoCContainer.bind(target).scope(scope);
  };
}

/**
 * 该类需要使用指定的 [[Provider]] 来处理.
 * 例如:
 *
 * ```
 * @ Provided({get: () => { return new PersonDAO(); }})
 * class PersonDAO {
 * }
 * ```
 *
 * 等同于:
 *
 * ```
 * Container.bind(PersonDAO).provider({get: () => { return new PersonDAO(); }});
 * ```
 */
export function Provided(provider: IProvider) {
  return function (target: Function) {
    IoCContainer.bind(target).provider(provider);
  };
}

/**
 * 该类需要作为目标类的子类来使用.
 * 例如:
 *
 * ```
 * class PersonDAO {
 * }
 *
 * @ Provides(PersonDAO)
 * class ProgrammerDAO extends PersonDAO{
 * }
 * ```
 *
 * 等同于:
 *
 * ```
 * Container.bind(PersonDAO).to(ProgrammerDAO);
 * ```
 */
export function Provides(target: Function) {
  return function (to: Function) {
    IoCContainer.bind(target).to(to);
  };
}

/**
 * 又容器自动装配该类.
 *
 * Autowired类的构造方法会由容器重写。
 * 所以，如果过你编写:
 *
 * ```
 * @ AutoWired
 * class PersonService {
 *   @ Inject
 *   personDAO: PersonDAO;
 * }
 * ```
 *
 * 任何的PersonService都由容器创建，即时你用了new PersonService:
 *
 * ```
 * let PersonService = new PersonService(); // 容器会创建该实例，并且注入内部的[[Inject]]字段.
 * ```
 *
 * 等同于:
 *
 * ```
 * Container.bind(PersonService);
 * let personService: PersonService = Container.get(PersonService);
 * ```
 */
export function Autowired(target: Function) { // <T extends {new(...args:any[]):{}}>(target:T) {
  const newConstructor = InjectorHandler.decorateConstructor(target);
  const config: ConfigImpl = IoCContainer.bind(target) as ConfigImpl;
  config.toConstructor(newConstructor);
  return newConstructor;
}

/**
 * 该字段需要容器注入.
 * 例如:
 *
 * ```
 * @ AutoWired
 * class PersonService {
 *    constructor (@ Inject creationTime: Date) {
 *       this.creationTime = creationTime;
 *    }
 *    @ Inject
 *    personDAO: PersonDAO;
 *
 *    creationTime: Date;
 * }
 *
 * ```
 *
 * 等你调用:
 *
 * ```
 * let personService: PersonService = Container.get(PersonService);
 * // 参数全部会由容器自动注入
 * console.log('PersonService.creationTime: ' + personService.creationTime);
 * console.log('PersonService.personDAO: ' + personService.personDAO);
 * ```
 */
export function Inject(...args: any[]) {
  if (args.length < 3 || typeof args[2] === "undefined") {
    // @ts-ignore
    return InjectPropertyDecorator.apply(this, args);
  } else if (args.length === 3 && typeof args[2] === "number") {
    // @ts-ignore
    return InjectParamDecorator.apply(this, args);
  }

  throw new Error("Invalid @Inject Decorator declaration.");
}

function InjectPropertyDecorator(target: Function, key: string) {
  let t = Reflect.getMetadata("design:type", target, key);
  if (!t) {
    // Needed to support react native inheritance
    t = Reflect.getMetadata("design:type", target.constructor, key);
  }
  IoCContainer.injectProperty(target.constructor, key, t);
}

function InjectParamDecorator(target: Function, propertyKey: string | symbol, parameterIndex: number) {
  if (!propertyKey) { // only intercept constructor parameters
    const config: ConfigImpl = IoCContainer.bind(target) as ConfigImpl;
    config.paramTypes = config.paramTypes || [];
    const paramTypes: any[] = Reflect.getMetadata("design:paramtypes", target);
    config.paramTypes.unshift(paramTypes[parameterIndex]);
  }
}
