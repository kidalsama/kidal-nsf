import Logs from "../application/Logs";
import Environment from "../application/Environment";
import glob from "glob";

/**
 * @author tengda
 */
export interface IRpcApiRegistry<TArgs, TResults> {
  /**
   * API类型.
   */
  readonly type: string

  /**
   * 处理载荷
   */
  process(args: TArgs): Promise<TResults>
}

/**
 * @author tengda
 */
export default class RpcApiManager {
  public static readonly S = new RpcApiManager();
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "RpcApiManager");
  private readonly registryMap: Map<string, IRpcApiRegistry<any, any>> = new Map();

  /**
   * 单例
   */
  private constructor() {

  }

  /**
   * 初始化处理器
   */
  public async init() {
    const env = Environment.S;

    // 注册接口
    const contexts: Array<{ path: string, registry: IRpcApiRegistry<any, any> }> = glob
      .sync(`${env.srcDir}/module/**/rpc/*.js`)
      .map((it: string) => ({path: it, registry: require(it).default}));

    for (const context of contexts) {
      // 类型
      const path = context.path;
      const indexOfModule = path.lastIndexOf("/module/");
      const indexOfApi = path.lastIndexOf("/rpc/");
      const module = path.substring(indexOfModule + "/module/".length, indexOfApi);
      const type0 = path.substring(indexOfApi + "/rpc/".length);
      const method = type0.substring(0, type0.length - ".js".length);
      const type = module + "/" + method

      // 检查
      if (this.registryMap.has(type)) {
        throw new Error(`Rpc ${type} already registered.`);
      }

      // 缓存
      Reflect.set(context.registry, "type", type)
      this.registryMap.set(type, context.registry);

      // log
      RpcApiManager.LOG.info(`Registered rpc: ${type}`);
    }
  }

  /**
   * 获取注册
   */
  public getRegistry(type: string): IRpcApiRegistry<any, any> | undefined {
    return this.registryMap.get(type)
  }

  /**
   * 获取注册
   */
  public getRegistryByModuleMethod(module: string, method: string): IRpcApiRegistry<any, any> | undefined {
    return this.getRegistry(module + "/" + method)
  }
}
