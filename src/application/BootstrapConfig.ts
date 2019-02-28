/**
 * @author tengda
 */
export interface IBootstrapConfig {
  server: IServerConfig;
  data: IDataConfig;
  cluster: IClusterConfig;
}

/**
 * @author tengda
 */
export interface IServerConfig {
  port: number;
  graphQL: IServerGraphQLConfig;
  webSocket: IServerWebSocketConfig;
}

/**
 * @author tengda
 */
export interface IServerGraphQLConfig {
  endpoint: string;
}

/**
 * @author tengda
 */
export interface IServerWebSocketConfig {
  endpoint: string;
}

/**
 * @author tengda
 */
export interface IDataConfig {
  enabled: boolean;
  forceSync: boolean;
  dataSourceMysql: IDataSourceMysqlConfig;
}

/**
 * @author tengda
 */
export interface IDataSourceMysqlConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  timezone: string;
}

/**
 * 自动发现客户端乐行
 */
export type DiscoveryClientType = "zookeeper";

/**
 * @author tengda
 */
export interface IClusterConfig {
  enabled: boolean;
  discoveryClientType: string;
  zookeeper: IClusterZookeeperConfig;
}

/**
 * Zookeeper配置
 */
export interface IClusterZookeeperConfig {
  connectionString: string;
}

/**
 * 默认配置
 */
const DEFAULTS: IBootstrapConfig = {
  server: {
    port: 8080,
    graphQL: {
      endpoint: "/graphql",
    },
    webSocket: {
      endpoint: "/ws",
    },
  },
  data: {
    enabled: true,
    forceSync: false,
    dataSourceMysql: {
      host: "192.168.93.222",
      port: 3306,
      username: "mcg",
      password: "Mcg!2345",
      database: "mcg_games_servers",
      timezone: "Asia/Shanghai",
    },
  },
  cluster: {
    enabled: true,
    discoveryClientType: "zookeeper",
    zookeeper: {
      connectionString: "39.106.136.198:2181",
    },
  },
};

/**
 * 标准化启动配置
 * @param root 配置根节点
 */
export function normalizeBootstrapConfig(root: any) {
  const normalizer = (node: any, defaults: any) => {
    const keys = Object.keys(defaults);
    keys.forEach((key: string) => {
      if (node.hasOwnProperty(key)) {
        if (typeof node[key] !== typeof defaults[key]) {
          node[key] = defaults[key];
        } else if (typeof defaults[key] === "object") {
          normalizer(node[key], defaults[key]);
        }
      } else {
        node[key] = defaults[key];
      }
    });
  };
  normalizer(root, DEFAULTS);
  return root;
}
