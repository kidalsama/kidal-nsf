import {InjectorHandler} from "./InjectorHandler";
import {ConfigImpl, IConfig} from "./Config";

function checkType(source: Object) {
  if (!source) {
    throw new TypeError("Invalid type requested to IoC container. Type is not defined.");
  }
}

export class IoCContainer {

  public static isBound(source: Function): boolean {
    checkType(source);
    const baseSource = InjectorHandler.getConstructorFromType(source);
    const config: ConfigImpl | undefined = IoCContainer.bindings.get(baseSource);
    return (!!config);
  }

  public static bind(source: Function): IConfig {
    checkType(source);
    const baseSource = InjectorHandler.getConstructorFromType(source);
    let config: ConfigImpl | undefined = IoCContainer.bindings.get(baseSource);
    if (!config) {
      config = new ConfigImpl(baseSource);
      IoCContainer.bindings.set(baseSource, config);
    }
    return config;
  }

  public static get(source: Function) {
    const config: ConfigImpl = IoCContainer.bind(source) as ConfigImpl;
    if (!config.iocProvider) {
      config.to(config.source as FunctionConstructor);
    }
    return config.getInstance();
  }

  public static getType(source: Function): Function {
    checkType(source);
    const baseSource = InjectorHandler.getConstructorFromType(source);
    const config: ConfigImpl | undefined = IoCContainer.bindings.get(baseSource);
    if (!config) {
      throw new TypeError(`The type ${source.name} hasn't been registered with the IOC Container`);
    }
    return config.targetSource || config.source;
  }

  public static injectProperty(target: Function, key: string, propertyType: Function) {
    const propKey = `__${key}`;
    Object.defineProperty(target.prototype, key, {
      enumerable: true,
      get: function () {
        return this[propKey] ? this[propKey] : this[propKey] = IoCContainer.get(propertyType);
      },
      set: function (newValue) {
        this[propKey] = newValue;
      },
    });
  }

  public static assertInstantiable(target: any) {
    if (target.__block_Instantiation) {
      throw new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get");
    }
  }

  private static bindings: Map<FunctionConstructor, ConfigImpl> = new Map<FunctionConstructor, ConfigImpl>();
}
