import {IProvider} from "./IProvider";
import {Scope} from "./Scope";
import {InjectorHandler} from "./InjectorHandler";
import {IoCContainer} from "./IocContainer";

function checkType(source: Object) {
  if (!source) {
    throw new TypeError("Invalid type requested to IoC container. Type is not defined.");
  }
}

export interface IConfig {
  to(target: Object): IConfig;

  provider(provider: IProvider): IConfig;

  scope(scope: Scope): IConfig;

  withParams(...paramTypes: any[]): IConfig;
}

export class ConfigImpl implements IConfig {
  public source: Function;
  public targetSource?: Function;
  public iocProvider?: IProvider;
  public iocScope?: Scope;
  public decoratedConstructor?: FunctionConstructor;
  public paramTypes?: any[];

  constructor(source: Function) {
    this.source = source;
  }

  public to(target: FunctionConstructor) {
    checkType(target);
    const targetSource = InjectorHandler.getConstructorFromType(target);
    this.targetSource = targetSource;
    if (this.source === targetSource) {
      const configImpl = this;
      this.iocProvider = {
        get: () => {
          const params = configImpl.getParameters();
          if (configImpl.decoratedConstructor) {
            return (params ? new configImpl.decoratedConstructor(...params) : new configImpl.decoratedConstructor());
          }
          return (params ? new target(...params) : new target());
        },
      };
    } else {
      this.iocProvider = {
        get: () => {
          return IoCContainer.get(target);
        },
      };
    }
    if (this.iocScope) {
      this.iocScope.reset(this.source);
    }
    return this;
  }

  public provider(provider: IProvider) {
    this.iocProvider = provider;
    if (this.iocScope) {
      this.iocScope.reset(this.source);
    }
    return this;
  }

  public scope(scope: Scope) {
    this.iocScope = scope;
    if (scope === Scope.SINGLETON) {
      (this as any).source.__block_Instantiation = true;
      scope.reset(this.source);
    } else if ((this as any).source.__block_Instantiation) {
      delete (this as any).source.__block_Instantiation;
    }
    return this;
  }

  public withParams(...paramTypes: any[]) {
    this.paramTypes = paramTypes;
    return this;
  }

  public toConstructor(newConstructor: FunctionConstructor) {
    this.decoratedConstructor = newConstructor;
    return this;
  }

  public getInstance() {
    if (!this.iocScope) {
      this.scope(Scope.LOCAL);
    }
    return this.iocScope!.resolve(this.iocProvider!, this.source);
  }

  private getParameters() {
    if (this.paramTypes) {
      return this.paramTypes.map((paramType) => IoCContainer.get(paramType));
    }
    return null;
  }
}
