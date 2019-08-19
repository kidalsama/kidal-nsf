import {ConfigImpl, IConfig} from "./Config";
import {IoCContainer} from "./IocContainer";
import {IProvider} from "./IProvider";
import {Scope} from "./Scope";
import {Component} from "./Annotation";

/**
 * Ioc容器. 用于注册、查询你的依赖.
 * 你可以使用装饰器 [[Autowired]]、[[Scoped]]、[[Singleton]]、[[Provided]]、[[Provides]] 来直接配置你的类。
 */
export class Container {

  /**
   * ```
   * import { Container } from "mcg-nsf";
   *
   * Container.addSource('lib/*');
   * // or
   * Container.addSource('controllers/*', 'baseFolder');
   * // or
   * Container.addSource(['**\/*', '!foo.js'], 'baseFolder');
   * ```
   */
  public static addSource(patterns: string | string[], baseDir?: string) {
    const requireGlob = require("require-glob");
    baseDir = baseDir || process.cwd();
    requireGlob.sync(patterns, {
      cwd: baseDir,
    });
  }

  /**
   * ```
   * Container.bind(PersonDAO).to(ProgrammerDAO).scope(Scope.Singleton);
   * ```
   */
  public static bind(source: Function): IConfig {
    if (!IoCContainer.isBound(source)) {
      Component(source);
      return IoCContainer.bind(source).to(source);
    }

    return IoCContainer.bind(source);
  }

  /**
   *
   */
  public static get<T>(source: Function & { prototype: T }): T {
    return IoCContainer.get(source);
  }

  /**
   *
   */
  public static getType(source: Function) {
    return IoCContainer.getType(source);
  }

  /**
   *
   */
  public static snapshot(source: Function): void {
    const config = Container.bind(source) as ConfigImpl;
    Container.snapshots.providers.set(source, config.iocProvider!);
    if (config.iocScope) {
      Container.snapshots.scopes.set(source, config.iocScope);
    }
    return;
  }

  /**
   *
   */
  public static restore(source: Function): void {
    if (!(Container.snapshots.providers.has(source))) {
      throw new TypeError("Config for source was never snapshoted.");
    }
    const config = Container.bind(source);
    config.provider(Container.snapshots.providers.get(source)!);
    if (Container.snapshots.scopes.has(source)) {
      config.scope(Container.snapshots.scopes.get(source)!);
    }
  }

  /**
   *
   */
  private static snapshots: { providers: Map<Function, IProvider>; scopes: Map<Function, Scope> } = {
    providers: new Map(),
    scopes: new Map(),
  };
}
