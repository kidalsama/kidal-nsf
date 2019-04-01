/**
 * @author tengda
 */
import Environment from "../application/Environment";
import {IJavaClusterEndpoint} from "../application/ApplicationConfig";
import LudmilaError from "../error/LudmilaError";
import LudmilaErrors from "../error/LudmilaErrors";
import fetch from "node-fetch";
import md5 from "md5";
import Logs from "../application/Logs";

/**
 * @author tengda
 */
export interface IJavaTarget {
  config: IJavaClusterEndpoint,
  name: string,
  methodMap: Map<string, IJavaMethod>
}

/**
 * @author tengda
 */
export interface IJavaMethod {
  target: IJavaTarget,
  name: string,
}

/**
 * @author tengda
 */
export class JavaRpcInvoker {
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "JavaRpcInvoker")
  public readonly config: IJavaClusterEndpoint
  private _target?: string;
  private _method?: string;
  private _version?: string;

  public constructor(config: IJavaClusterEndpoint) {
    this.config = config
  }

  public target(val: string): JavaRpcInvoker {
    this._target = val
    return this
  }

  public method(val: string): JavaRpcInvoker {
    this._method = val
    return this
  }

  public version(val: string): JavaRpcInvoker {
    this._version = val
    return this
  }

  public async invoke<TResults>(...argArray: any[]): Promise<TResults> {
    if (!this._target) {
      throw new Error("Missing target")
    }
    if (!this._method) {
      throw new Error("Missing method")
    }

    // 准备url
    const p = 1
    const t = this._target
    const m = this._version ? `${this._method}@${this._version}` : this._method
    const keyId = "lbi000001"
    const keySecret = "CmUfxkCMmu4NVPHvF7HvO3UX"
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const preSignStr = `${p}&${t}&${m}&${timestamp}&${timestamp}&${keySecret}`
    const sign = md5(preSignStr).toLowerCase()
    const c = `${keyId}-${timestamp}-${timestamp}-${sign}`
    const {host, port, path} = this.config
    const url = path ?
      `http://${host}:${port}/${path}/ludmila/lrpc/1.0?p=${p}&t=${t}&m=${m}&c=${c}` :
      `http://${host}:${port}/ludmila/lrpc/1.0?p=${p}&t=${t}&m=${m}&c=${c}`

    // 消息体
    const body = argArray ? Buffer.from(Buffer.from(JSON.stringify(argArray)).toString("base64")) : undefined

    // 发送数据
    // headers: { "Content-Type": "application/json" },
    const resp = await fetch(url, {method: "post", body})

    // 状态码
    const status = resp.status
    if (status === 403) {
      let error: any
      try {
        error = await resp.json()
      } catch (e) {
        throw new LudmilaError(LudmilaErrors.CLUSTER_208)
      }
      throw new LudmilaError(LudmilaErrors.CLUSTER_209, `${error.message}(${error.code})`)
    } else if (status !== 200) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_207)
    }

    // 解包返回消息
    const respBodyString = await resp.text()
    if (respBodyString === null) {
      return Promise.resolve(null as any)
    }
    let respBody
    try {
      //
      respBody = JSON.parse(Buffer.from(respBodyString, "base64").toString("utf8"))
    } catch (e) {
      // FIXME: jsf已修复，观察下这个问题是否再次发生
      JavaRpcInvoker.LOG.warn(e)
      // 暂时视为null
      // throw new LudmilaError(LudmilaErrors.CLUSTER_208)
      return Promise.resolve(null as any)
    }
    if (respBody.hasOwnProperty("error")) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_209, `${respBody.error.message}(${respBody.error.code})`)
    }

    return respBody as TResults
  }
}

/**
 * @author tengda
 */
export default class JavaRpcClientManager {
  public static readonly S = new JavaRpcClientManager()

  /**
   * 获取一个客户端
   */
  public acquire(endpoint: string): JavaRpcInvoker {
    const map = Environment.S.applicationConfig.cluster.javaClusterMap
    if (!map) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_203)
    }
    const config: IJavaClusterEndpoint | undefined = map[endpoint]
    if (config === undefined) {
      throw new LudmilaError(LudmilaErrors.CLUSTER_203)
    }
    return new JavaRpcInvoker(config)
  }
}
