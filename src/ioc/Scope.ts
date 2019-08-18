import {IProvider} from "./IProvider";
import {InjectorHandler} from "./InjectorHandler";

/**
 * 实例作用范围
 */
export abstract class Scope {
  /**
   * LocalScope的引用。LocalScope在每个依赖的地方都返回一个新的实例。
   * 这个是默认的作用范围.
   */
  public static LOCAL: Scope;
  /**
   * SingletonScope的引用。SingletonScope在每个依赖的地方总是返回同一个实例。
   */
  public static SINGLETON: Scope;

  /**
   * 当容器需要解析依赖时调用。
   */
  public abstract resolve(provider: IProvider, source: Function): any;

  /**
   * 当某些配置改变容器的绑定时由容器调用。
   */
  public reset(source: Function) {
    // Do nothing
  }
}

/**
 * 默认作用范围
 */
class LocalScope extends Scope {
  public resolve(provider: IProvider, source: Function) {
    return provider.get();
  }
}

/**
 * 单例作用范围
 */
class SingletonScope extends Scope {
  private static instances: Map<Function, any> = new Map<Function, any>();

  public resolve(provider: IProvider, source: any) {
    let instance: any = SingletonScope.instances.get(source);
    if (!instance) {
      source.__block_Instantiation = false;
      instance = provider.get();
      source.__block_Instantiation = true;
      SingletonScope.instances.set(source, instance);
    }
    return instance;
  }

  public reset(source: Function) {
    SingletonScope.instances.delete(InjectorHandler.getConstructorFromType(source));
  }
}

Scope.LOCAL = new LocalScope()
Scope.SINGLETON = new SingletonScope()
