import Logs from "../application/Logs";
import Environment from "../application/Environment";
import glob from "glob";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";

/**
 * @author tengda
 */
export interface IRpcArgs<TArgs> {
  /**
   * 接口类型
   */
  type: string;
  /**
   * 请求数据
   */
  data: TArgs;
}

/**
 * @author tengda
 */
export interface IRpcRegistry<TArgs, TResults> {
  /**
   * RPC类型.
   */
  readonly type: string;

  /**
   * 初始化
   */
  init: (type: string) => Promise<any>;

  /**
   * 载荷处理器
   */
  handle(args: TArgs): Promise<TResults>;
}

/**
 * @author tengda
 */
export class RpcPayloadDispatcher {
  // 单例
  public static readonly S = new RpcPayloadDispatcher();
  // log
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "RpcPayloadDispatcher");
  // 接口
  private readonly rpcMap: Map<string, IRpcRegistry<any, any>> = new Map();

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
    const contexts: Array<{ path: string, registry: IRpcRegistry<any, any> }> = glob
      .sync(`${env.srcDir}/module/**/rpc/*.js`)
      .map((it: string) => ({path: it, registry: require(it).default}));

    for (const context of contexts) {
      // 类型
      const path = context.path;
      const indexOfModule = path.lastIndexOf("/module/");
      const indexOfApi = path.lastIndexOf("/rpc/");
      const type0 = path.substring(indexOfModule + "/module/".length, indexOfApi);
      const type1 = path.substring(indexOfApi + "/rpc/".length);
      const type = type0 + "/" + type1.substring(0, type1.length - ".js".length);

      // 检查
      if (this.rpcMap.has(type)) {
        throw new Error(`Rpc ${type} already registered.`);
      }

      // 缓存
      this.rpcMap.set(type, context.registry);

      // 初始化
      await context.registry.init(type);

      // log
      RpcPayloadDispatcher.LOG.info(`Registered rpc: ${type}`);
    }
  }

  /**
   * 分发载荷
   */
  public async dispatch(payload: IRpcArgs<any>): Promise<any> {
    // 检查必要数据
    if (!payload.type) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_DISCOVERY_RPC_CLIENT_INVALID_PAYLOAD);
    }

    // 获取定义
    const registry = this.rpcMap.get(payload.type);
    if (!registry) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_DISCOVERY_RPC_CLIENT_NO_HANDLER);
    }

    // 钩住处理器
    return new Promise<any>((resolve, reject) => {
      // 执行
      registry.handle(payload.data)
        .then((reply) => {
          resolve(reply);
        })
        .catch(reject);
    });
  }
}
