import {IoCContainer} from "./IocContainer";

export class AutowireHandler {
  public static constructorNameRegEx = /function (\w*)/;

  public static decorateConstructor(target: Function) {
    let newConstructor: any;
    // tslint:disable-next-line:class-name
    newConstructor = class ioc_wrapper extends (target as FunctionConstructor) {
      constructor(...args: any[]) {
        super(...args);
        IoCContainer.assertInstantiable(target);
      }
    };
    newConstructor.__parent = target;
    return newConstructor;
  }

  public static hasNamedConstructor(source: Function): boolean {
    if (source.name) {
      return source.name !== "ioc_wrapper";
    } else {
      try {
        const constructorName = source.prototype.constructor.toString().match(this.constructorNameRegEx)[1];
        return (constructorName && constructorName !== "ioc_wrapper");
      } catch {
        // make linter happy
      }

      return false;
    }
  }

  public static getConstructorFromType(target: Function): FunctionConstructor {
    let typeConstructor: any = target;
    if (this.hasNamedConstructor(typeConstructor)) {
      return typeConstructor as FunctionConstructor;
    }
    typeConstructor = typeConstructor.__parent;
    while (typeConstructor) {
      if (this.hasNamedConstructor(typeConstructor)) {
        return typeConstructor as FunctionConstructor;
      }
      typeConstructor = typeConstructor.__parent;
    }
    throw TypeError("Can not identify the base Type for requested target " + target.toString());
  }
}
