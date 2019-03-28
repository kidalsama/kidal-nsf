function required<T>(path: string, config: any, key: string): T {
  if (config.hasOwnProperty(key)) {
    return config[key]
  } else {
    throw new Error(`Configuration property ${path}.${key} is required.`)
  }
}

function orElse<T>(path: string, config: any, key: string, elseVal: T): T {
  if (config.hasOwnProperty(key)) {
    return config[key]
  } else {
    return elseVal
  }
}

function orElseWalkMap<T>(path: string, config: any, key: string,
                          elseVal: { [key: string]: T } | (() => { [key: string]: T }),
                          walker: (key: string, val: T) => T) {
  const map: any = orElse(path, config, key, elseVal)
  const rst: any = {}

  for (const mk of Object.keys(map)) {
    if (map.hasOwnProperty(mk)) {
      rst[mk] = walker(mk, map[mk])
    }
  }

  return rst
}

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

export const completeApplicationConfig = (config: any): IApplicationConfig => {
  return {
    id: required("", config, "id"),
    profiles: orElse("", config, "profiles", ["dev"]),
    configServer: completeConfigServerConfig(config.configServer || {}),
    server: completeServerConfig(config.server || {}),
    data: completeDataConfig(config.data || {}),
    cluster: completeClusterConfig(config.cluster || {}),
  }
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

export const completeConfigServerConfig = (config: any): IConfigServer => {
  return {
    type: orElse("configServer", config, "type", "local"),
    uri: orElse("configServer", config, "uri", undefined),
    username: orElse("configServer", config, "username", undefined),
    password: orElse("configServer", config, "password", undefined),
    token: orElse("configServer", config, "token", undefined),
  }
}

/**
 * 服务器配置
 */
export interface IServerConfig {
  enabled: boolean;
  httpServerMap: { [key: string]: IHttpServerConfig };
}

export interface IHttpServerConfig {
  port: number;
  staticMapping?: { [key: string]: string };
  graphQLEndpoint?: string;
  graphQLSubscriptionEndpoint?: string;
  webSocketEndpoint?: string;
}

const completeServerConfig = (config: any): IServerConfig => {
  return {
    enabled: orElse<boolean>("server", config, "enabled", false),
    httpServerMap: orElseWalkMap<IHttpServerConfig>(
      "server", config, "httpServerMap",
      {
        primary: {
          port: 8080,
          staticMapping: undefined,
          graphQLEndpoint: undefined,
          graphQLSubscriptionEndpoint: undefined,
          webSocketEndpoint: undefined,
        },
      },
      completeHttpServerConfig,
    ),
  }
}

const completeHttpServerConfig = (key: string, config: any): IHttpServerConfig => {
  return {
    port: orElse(`server.httpServerMap:${key}`, config,
      "port", 8080),
    staticMapping: orElse(`server.httpServerMap:${key}`, config,
      "staticMapping", undefined),
    graphQLEndpoint: orElse(`server.httpServerMap:${key}`, config,
      "graphQLEndpoint", undefined),
    graphQLSubscriptionEndpoint: orElse(`server.httpServerMap:${key}`, config,
      "graphQLSubscriptionEndpoint", undefined),
    webSocketEndpoint: orElse(`server.httpServerMap:${key}`, config,
      "webSocketEndpoint", undefined),
  }
}

/**
 * 数据配置（数据库，缓存，任何数据）
 */
export interface IDataConfig {
  enabled: boolean;
  databaseMap: { [key: string]: IDatabaseConfig };
}

export interface IDatabaseConfig {
  alias?: string;
  dialect: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  timezone: string;
  dropTableOnInit?: boolean;
  suppressSyncTableOnInit?: boolean;
  suppressAutoUpdateChangedFields?: boolean;
}

const completeDataConfig = (config: any): IDataConfig => {
  return {
    enabled: orElse("data", config, "enabled", false),
    databaseMap: orElseWalkMap("data", config, "databaseMap",
      {
        primary: {
          dialect: "mysql",
          host: "192.168.93.222",
          port: 3306,
          username: "mcg",
          password: "Mcg!2345",
          database: "mcg_games_servers",
          timezone: "Asia/Shanghai",
        },
      },
      completeDatabaseConfig,
    ),
  }
}

const completeDatabaseConfig = (key: string, config: any): IDatabaseConfig => {
  return {
    alias: orElse(`server.databaseMap:${key}`, config, "alias", undefined),
    dialect: orElse(`server.databaseMap:${key}`, config, "dialect", "mysql"),
    host: orElse(`server.databaseMap:${key}`, config, "host", "192.168.93.222"),
    port: orElse(`server.databaseMap:${key}`, config, "port", 3306),
    username: orElse(`server.databaseMap:${key}`, config, "username", "mcg"),
    password: orElse(`server.databaseMap:${key}`, config, "password", "Mcg!2345"),
    database: orElse(`server.databaseMap:${key}`, config, "database", "dev_node_server_foundation"),
    timezone: orElse(`server.databaseMap:${key}`, config, "timezone", "Asia/Shanghai"),
    dropTableOnInit: orElse(`server.databaseMap:${key}`, config, "dropTableOnInit", undefined),
    suppressSyncTableOnInit: orElse(`server.databaseMap:${key}`, config, "suppressSyncTableOnInit", undefined),
    suppressAutoUpdateChangedFields:
      orElse(`server.databaseMap:${key}`, config, "suppressAutoUpdateChangedFields", undefined),
  }
}

/**
 * 集群配置
 */
export interface IClusterConfig {
  enabled: boolean;
  discoveryClientType: string;
  zookeeper?: IClusterZookeeperConfig;
  javaClusterMap?: { [key: string]: IJavaClusterEndpoint };
}

/**
 * Zookeeper 配置
 */
export interface IClusterZookeeperConfig {
  connectionString: string;
}

/**
 * Java集群终端配置
 */
export interface IJavaClusterEndpoint {
  host: string;
  port: number;
  path?: string;
}

const completeClusterConfig = (config: any): IClusterConfig => {
  return {
    enabled: orElse("cluster", config, "enabled", false),
    discoveryClientType: orElse("cluster", config, "discoveryClientType", "zookeeper"),
    zookeeper: completeClusterZookeeperConfig(config.zookeeper || {}),
    javaClusterMap: orElseWalkMap<IJavaClusterEndpoint>("cluster", config, "javaClusterMap",
      {
        oa: {
          host: "192.168.93.222",
          port: 22130,
        },
      },
      completeJavaClusterEndpointConfig,
    ),
  }
}

const completeClusterZookeeperConfig = (config: any): IClusterZookeeperConfig => {
  return {
    connectionString: orElse("cluster.zookeeper", config, "connectionString", "39.106.136.198:2181"),
  }
}

const completeJavaClusterEndpointConfig = (key: string, config: any): IJavaClusterEndpoint => {
  return {
    host: required(`cluster.javaClusterMap:${key}`, config, "host"),
    port: required(`cluster.javaClusterMap:${key}`, config, "port"),
    path: orElse(`cluster.javaClusterMap:${key}`, config, "path", undefined),
  }
}

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
