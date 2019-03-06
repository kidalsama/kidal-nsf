import * as http from "http";
// @ts-ignore
import * as LB_Pool from "lb_pool";
import DiscoveryClient from "./DiscoveryClient";
import Logs from "../application/Logs";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";
import Environment from "../application/Environment";
import RpcApiManager from "./RpcApiManager";
import IRpcPayload from "./IRpcPayload";

/**
 * @author tengda
 */
export default class Rpc {
  // 单例
  public static readonly S = new Rpc();
  // 日志
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "Rpc");
  // 连接池
  private readonly _poolMap: Map<string, any> = new Map();

  /**
   * 单例
   */
  private constructor() {

  }

  /**
   * 初始化
   */
  public async init() {
    // 检查是否启用
    if (!Environment.S.applicationConfig.cluster.enabled) {
      Rpc.LOG.info("Cluster disabled");
      return;
    }

    DiscoveryClient.S.on("nodes-changed", () => this._onNodesChanged());
  }

  /**
   * 节点变化
   */
  private _onNodesChanged() {
    this._poolMap.clear();
    Rpc.LOG.info("Cleared pool");
  }

  // 获取连接池
  private _getPool(id: string): any {
    // 获取连接池
    let pool = this._poolMap.get(id);
    if (pool === undefined) {
      const nodes = DiscoveryClient.S.getNodesById(id);

      if (nodes.length === 0) {
        this._poolMap.set(id, pool = null);
      } else {
        const servers = nodes.map((it) => `${it.data.ip}:${it.data.port}`);

        pool = new LB_Pool.Pool(http, servers, {
          max_pending: 300, // 最大等待
          // ping: "/ping",
          timeout: 10 * 1000, // 请求超时
          max_sockets: 10, // 最大连接数
          name: id,
        });

        this._poolMap.set(id, pool);
      }
    }
    return pool
  }

  /**
   * 调用远程方法
   */
  public async callRemoteProcedure<TArgs, TResults>(
    id: string, module: string, method: string, args?: any,
  ): Promise<TResults> {
    // 获取连接池
    const pool = this._getPool(id)
    if (!pool) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_201);
    }

    // 准备载荷
    const payload = JSON.stringify({module, method, data: args})

    // async
    return await new Promise<TResults>((resolve, reject) => {
      // 发送载荷
      pool.request(
        {
          method: "POST",
          path: "/rpc",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": payload ? payload.length : 0,
          },
          data: payload,
        },
        (err: Error | null, res: http.IncomingMessage, bodyString: string | null) => {
          if (err) {
            Rpc.LOG.warn(err);
            reject(new LudmilaError(LudmilaErrors.CLUSTER_203));
          } else {
            if (res.statusCode !== 200) {
              Rpc.LOG.error("Rpc response none status 200: %s, %s", res.statusCode, bodyString);
              reject(new LudmilaError(LudmilaErrors.CLUSTER_202));
            } else {
              if (bodyString === null) {
                resolve(undefined);
              } else {
                let body;
                try {
                  body = JSON.parse(bodyString);
                } catch (e) {
                  Rpc.LOG.warn(e);
                  reject(new LudmilaError(LudmilaErrors.CLUSTER_204));
                }
                if (body.hasOwnProperty("error")) {
                  reject(new LudmilaError(body.error.code, body.error.message));
                } else {
                  resolve((body as IRpcPayload).data);
                }
              }
            }
          }
        });
    })
  }

  /**
   * 调用本地方法
   */
  public async callLocalProcedure<TArgs, TResults>(module: string, method: string, args: TArgs): Promise<TResults> {
    // 获取定义
    const registry = RpcApiManager.S.getRegistryByModuleMethod(module, method)
    if (!registry) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_205);
    }

    // 处理
    return await registry.process(args)
  }

  /**
   * 调用本地方法
   */
  public async httpCallLocalProcedure(payload: IRpcPayload): Promise<IRpcPayload> {
    const results = await this.callLocalProcedure(payload.module, payload.method, payload.data)
    return {
      version: payload.version,
      id: payload.id,
      module: payload.module,
      method: payload.method,
      data: results,
    } as IRpcPayload
  }
}
