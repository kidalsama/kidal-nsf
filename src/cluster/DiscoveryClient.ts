import * as os from "os";
import * as zookeeper from "node-zookeeper-client";
import Logs from "../application/Logs";
import Environment from "../application/Environment";
import * as events from "events";

/**
 * @author tengda
 */
export default class DiscoveryClient extends events.EventEmitter {
  // 单例
  public static readonly S = new DiscoveryClient();
  // 日志
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "DiscoveryClient");
  // 客户端
  private _zk?: zookeeper.Client;
  public get zk(): zookeeper.Client {
    return this._zk!;
  }

  /**
   * 单例
   */
  private constructor() {
    super();
  }

  // 自己的uuid
  private _uuid: string = "";
  // 全部节点
  private _nodes: INode[] = [];

  private async _zkConnect(): Promise<void> {
    if (this._zk) {
      return;
    }

    const zookeeperConfig = Environment.S.applicationConfig.cluster.zookeeper;
    this._zk = zookeeper.createClient(zookeeperConfig.connectionString,
      {
        sessionTimeout: 3000,
        spinDelay: 1000,
        retries: 0,
      });

    return new Promise<void>((resolve, reject) => {
      let connected = false;

      // 监听链接超时
      setTimeout(() => {
        if (!connected) {
          reject(new Error("Connect to zookeeper failed"));
        }
      }, 3000);

      // 监听器
      const onConnected = () => {
        connected = true;
        DiscoveryClient.LOG.info("Connected with zookeeper");
        resolve();
      };
      const onDisconnected = () => {
        DiscoveryClient.LOG.warn("Disconnected with zookeeper, try re-init");
        this.zk.off("connected", onConnected);
        this.zk.off("disconnected", onDisconnected);
        this._zk = undefined;
        process.nextTick(() => this.init());
      };

      // 链接成功
      this.zk.once("connected", onConnected);

      // 断开链接
      this.zk.on("disconnected", onDisconnected);

      // 开始链接
      this.zk.connect();
    });
  }

  private async _zkCreateDir(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.zk.create(path, zookeeper.CreateMode.PERSISTENT, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async _zkCreateNode(path: string, data: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.zk.create(path, data, zookeeper.CreateMode.EPHEMERAL, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async _zkRemove(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.zk.remove(path, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async _zkExists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.zk.exists(path, (error, stat) => {
        if (error) {
          reject(error);
        } else if (stat) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  private async _zkGetData(path: string): Promise<INodeData | null> {
    return new Promise<INodeData | null>((resolve, reject) => {
      this.zk.getData(path, (error, buffer) => {
        if (error) {
          reject(error);
        } else if (buffer) {
          const json = buffer.toString("utf8");
          try {
            const data = JSON.parse(json);
            if (!data.hasOwnProperty("version") || data.version !== 1) {
              DiscoveryClient.LOG.warn("Parse data from %s failed: version not match -> %s", path, json);
            }
            resolve(data);
          } catch (e) {
            DiscoveryClient.LOG.warn("Parse data from %s failed: incorrect format -> %s", path, json);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  private _resolveIp(): string | null {
    const networkInterfaces = os.networkInterfaces();

    for (const networkInterfaceKey in networkInterfaces) {
      if (!networkInterfaces.hasOwnProperty(networkInterfaceKey)) {
        continue;
      }
      const networkInterface = networkInterfaces[networkInterfaceKey];
      for (const alias of networkInterface) {
        if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
          return alias.address;
        }
      }
    }

    return null;
  }

  private _retrieveNodes(dir: string) {
    this.zk.getChildren(
      dir,
      (event) => {
        DiscoveryClient.LOG.info("Got watcher event: %s", event);
        this._retrieveNodes(dir);
      },
      async (error, children) => {
        if (error) {
          DiscoveryClient.LOG.error("Failed to list children of %s due to: %s.", dir, error);
          return;
        }

        // 获取新节点
        const nodes: INode[] = [];
        for (const name of children) {
          try {
            const path = `${dir}/${name}`;
            const nodeData = await this._zkGetData(path);
            if (nodeData === null) {
              continue;
            }
            nodes.push({
              path,
              self: this._uuid === nodeData.uuid,
              data: nodeData,
            });
          } catch (e) {
            // ignored
          }
        }
        this._nodes = nodes;

        // log
        DiscoveryClient.LOG.info("Retrieved nodes: %s", JSON.stringify(this._nodes, null, 2));

        // event
        this.emit("nodes-changed", this._nodes);
      });
  }

  /**
   * 初始化
   */
  public async init(): Promise<void> {
    // 检查是否启用
    if (!Environment.S.applicationConfig.cluster.enabled) {
      DiscoveryClient.LOG.info("Cluster disabled");
      return;
    }

    // 解析IP
    const ip = this._resolveIp();
    if (!ip) {
      throw new Error("Resolve ip failed");
    }

    // uuid
    const port = Environment.S.applicationConfig.server.port;
    this._uuid = `${ip}:${port}`;

    // 准备路径
    const env = Environment.S;
    const dir = `/${env.profilesString}`;
    const path = `/${env.profilesString}/${this._uuid}`;

    // 链接服务器
    await this._zkConnect();

    // 创建目录
    if (!(await this._zkExists(dir))) {
      await this._zkCreateDir(dir);
    }

    // 移除已存在节点
    if (await this._zkExists(path)) {
      await this._zkRemove(path);
    }

    // 创建节点
    const nodeData: INodeData = {
      version: 1,
      uuid: this._uuid,
      id: env.applicationConfig.id,
      profiles: env.profilesString,
      ip,
      port,
    };
    await this._zkCreateNode(path, Buffer.from(JSON.stringify(nodeData, null, 2)));

    // log
    DiscoveryClient.LOG.info("Node: %s is successfully created.", path);

    // 开始获取其他节点
    this._retrieveNodes(dir);
  }

  /**
   * 获取全部节点
   */
  public getNodes(): INode[] {
    return this._nodes;
  }

  /**
   * 获取全部节点ID
   */
  public getNodeIds(): string[] {
    const ids = new Set();
    this._nodes.forEach((it) => ids.add(it.data.id));
    return [...ids];
  }

  /**
   * 获取指定ID的节点
   */
  public getNodesById(id: string): INode[] {
    return this._nodes.filter((it) => it.data.id === id);
  }
}

/**
 * @author tengda
 */
export interface INodeData {
  version: number;
  uuid: string;
  id: string;
  profiles: string;
  ip: string;
  port: number;
}

/**
 * @author tengda
 */
export interface INode {
  /**
   * 节点路径
   */
  path: string;
  /**
   * 是否是自身
   */
  self: boolean;
  /**
   * 节点数据
   */
  data: INodeData;
}
