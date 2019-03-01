/**
 * 应用配置
 */
export interface IApplicationConfig {
  id: string;
  profiles: string[];
  configServer: IConfigServer;
  server: IServerConfig;
  data: IDataConfig;
  cluster: IClusterConfig;
}

/**
 * 配置服务器配置
 */
export interface IConfigServer {
  type: string;
  uri?: string;
  username?: string;
  password?: string;
  token?: string;
}

/**
 * 服务器配置
 */
export interface IServerConfig {
  port: number;
  graphQL: IServerGraphQLConfig;
  webSocket: IServerWebSocketConfig;
}

/**
 * 服务器 GraphQL 配置
 */
export interface IServerGraphQLConfig {
  endpoint: string;
}

/**
 * 服务器 WebSocket 配置
 */
export interface IServerWebSocketConfig {
  endpoint: string;
}

/**
 * 数据配置（数据库，缓存，任何数据）
 */
export interface IDataConfig {
  enabled: boolean;
  forceSync: boolean;
  dataSourceMysql: IDataSourceMysqlConfig;
}

/**
 * MySQL 数据源配置
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
 * 集群配置
 */
export interface IClusterConfig {
  enabled: boolean;
  discoveryClientType: string;
  zookeeper: IClusterZookeeperConfig;
}

/**
 * Zookeeper 配置
 */
export interface IClusterZookeeperConfig {
  connectionString: string;
}

/**
 * 默认配置
 */
export const DEFAULT_APPLICATION_CONFIG: IApplicationConfig = {
  id: "?",
  profiles: ["dev"],
  configServer: {
    type: "local",
  },
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
 * 合并配置
 * @param dst 合入
 * @param src 待并入
 */
export function mergeConfig(dst: any, src: any) {
  const keys = Object.keys(src);

  keys.forEach((key: string) => {
    if (dst.hasOwnProperty(key)) {
      if (typeof dst[key] !== typeof src[key]) {
        dst[key] = src[key];
      } else if (typeof src[key] === "object") {
        mergeConfig(dst[key], src[key]);
      }
    } else {
      dst[key] = src[key];
    }
  });
}
