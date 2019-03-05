import IPayload from "../IPayload";
import ISession from "../ISession";
import Maybe from "graphql/tsutils/Maybe";
import Logs from "../../application/Logs";
import Environment from "../../application/Environment";
import glob from "glob";

/**
 * @author tengda
 */
export interface IWebSocketProcessPayloadContext {
  payload: IPayload;
  session: Maybe<ISession>;
}

/**
 * @author tengda
 */
export interface IWebSocketApiRegistry<TArgs, TResults> {
  /**
   * API类型.
   */
  readonly type: string

  /**
   * 处理载荷
   */
  processPayload(args: TArgs, ctx: IWebSocketProcessPayloadContext): Promise<TResults>
}

/**
 * @author tengda
 */
export default class WebSocketApiManager {
  public static readonly S = new WebSocketApiManager()
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "PayloadDispatcher");
  private readonly registryMap: Map<string, IWebSocketApiRegistry<any, any>> = new Map();

  /**
   * 初始化
   */
  public async init() {
    const env = Environment.S;

    // 注册接口
    const contexts: Array<{ path: string, registry: IWebSocketApiRegistry<any, any> }> = glob
      .sync(`${env.srcDir}/module/**/websocket/*.js`)
      .map((it: string) => ({path: it, registry: require(it).default}));

    for (const context of contexts) {
      // 类型
      const path = context.path;
      const indexOfModule = path.lastIndexOf("/module/");
      const indexOfApi = path.lastIndexOf("/websocket/");
      const type0 = path.substring(indexOfModule + "/module/".length, indexOfApi);
      const type1 = path.substring(indexOfApi + "/websocket/".length);
      const type = type0 + "/" + type1.substring(0, type1.length - ".js".length);

      // 检查
      if (this.registryMap.has(type)) {
        throw new Error(`Api ${type} already registered.`);
      }

      // 缓存
      Reflect.set(context.registry, "type", type)
      this.registryMap.set(type, context.registry);

      // log
      WebSocketApiManager.LOG.info(`Registered api: ${type}`);
    }
  }

  /**
   * 获取注册
   */
  public getRegistry(type: string): IWebSocketApiRegistry<any, any> | undefined {
    return this.registryMap.get(type)
  }
}
