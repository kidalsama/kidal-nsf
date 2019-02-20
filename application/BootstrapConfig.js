"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 默认配置
 */
const DEFAULTS = {
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
function normalizeBootstrapConfig(root) {
    const normalizer = (node, defaults) => {
        const keys = Object.keys(defaults);
        keys.forEach((key) => {
            if (node.hasOwnProperty(key)) {
                if (typeof node[key] !== typeof defaults[key]) {
                    node[key] = defaults[key];
                }
                else if (typeof defaults[key] === "object") {
                    normalizer(node[key], defaults[key]);
                }
            }
            else {
                node[key] = defaults[key];
            }
        });
    };
    normalizer(root, DEFAULTS);
    return root;
}
exports.normalizeBootstrapConfig = normalizeBootstrapConfig;
//# sourceMappingURL=BootstrapConfig.js.map