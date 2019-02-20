import * as http from "http";
// @ts-ignore
import * as LB_Pool from "lb_pool";
import DiscoveryClient from "./DiscoveryClient";
import Logs from "../application/Logs";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";
import {IRpcArgs} from "./IRpcPayload";
import Application from "../application/Application";

/**
 * @author tengda
 */
export default class DiscoveryRpcClient {
  // 单例
  public static readonly S = new DiscoveryRpcClient();
  // 日志
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "DiscoveryRpcClient");
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
    if (!Application.INSTANCE.bootstrapConfig.cluster.enabled) {
      DiscoveryRpcClient.LOG.info("Cluster disabled");
      return;
    }

    DiscoveryClient.S.on("nodes-changed", () => this._onNodesChanged());
  }

  /**
   * 节点变化
   */
  private _onNodesChanged() {
    this._poolMap.clear();
    DiscoveryRpcClient.LOG.info("Cleared pool");
  }

  /**
   * 调用
   */
  public async invoke<TArgs, TResults>(id: string, args: IRpcArgs<TArgs>): Promise<TResults> {
    return new Promise<TResults>((resolve, reject) => {
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

      // 发送载荷
      if (pool) {
        const payload = JSON.stringify(args);
        // noinspection TypeScriptValidateJSTypes
        pool.request(
          {
            method: "POST",
            path: "/rpc",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": payload.length,
            },
            data: payload,
          },
          (err: Error | null, res: http.IncomingMessage, bodyString: string | null) => {
            if (err) {
              DiscoveryRpcClient.LOG.warn(err);
              reject(new LudmilaError(LudmilaErrors.CLUSTER_DISCOVERY_RPC_CLIENT_NODE_NOT_AVAILABLE));
            } else {
              if (res.statusCode !== 200) {
                DiscoveryRpcClient.LOG.error("Rpc response none status 200: %s, %s", res.statusCode, bodyString);
                reject(new LudmilaError(LudmilaErrors.CLUSTER_DISCOVERY_RPC_CLIENT_STATUS_NOT_200));
              } else {
                if (bodyString === null) {
                  resolve({} as any);
                } else {
                  let body;
                  try {
                    body = JSON.parse(bodyString);
                  } catch (e) {
                    DiscoveryRpcClient.LOG.warn(e);
                    reject(new LudmilaError(LudmilaErrors.CLUSTER_DISCOVERY_RPC_CLIENT_INVALID_PAYLOAD));
                  }
                  if (body.hasOwnProperty("error")) {
                    reject(new LudmilaError(body.error.code, body.error.message));
                  } else {
                    resolve(body);
                  }
                }
              }
            }
          });
      } else {
        reject(new LudmilaError(LudmilaErrors.CLUSTER_DISCOVERY_RPC_CLIENT_NO_INSTANCE));
      }
    });
  }
}
