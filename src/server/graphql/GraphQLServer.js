"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const HttpServer_1 = __importDefault(require("../HttpServer"));
const Application_1 = __importDefault(require("../../application/Application"));
const express_graphql_1 = __importDefault(require("express-graphql"));
const glob_1 = __importDefault(require("glob"));
const merge_graphql_schemas_1 = require("merge-graphql-schemas");
const Environment_1 = __importDefault(require("../../application/Environment"));
const Logs_1 = __importDefault(require("../../application/Logs"));
const LudmilaError_1 = __importDefault(require("../../error/LudmilaError"));
const LudmilaErrors_1 = __importDefault(require("../../error/LudmilaErrors"));
/**
 * @author tengda
 */
class GraphQLServer {
    /**
     * 单例
     */
    constructor() {
    }
    /**
     * 初始化
     */
    init() {
        const httpServer = HttpServer_1.default.S;
        // 配置
        const app = Application_1.default.INSTANCE;
        const env = Environment_1.default.INSTANCE;
        const config = app.bootstrapConfig.server.graphQL;
        // 读取
        const { schema, resolvers } = this.loadSchemaAndResolvers(env);
        if (schema === null || resolvers === null) {
            GraphQLServer.LOG.info("No graphql autowired");
            return;
        }
        // GraphQL终端
        httpServer.expressApp.use(config.endpoint, express_graphql_1.default({
            schema,
            rootValue: resolvers,
            graphiql: true,
            formatError: (error) => {
                const formattedError = graphql_1.formatError(error);
                const originalError = error.originalError;
                if (originalError !== undefined && originalError !== null && originalError instanceof LudmilaError_1.default) {
                    return Object.assign({}, formattedError, { code: originalError.code, message: originalError.message });
                }
                else {
                    return Object.assign({}, formattedError, { code: LudmilaErrors_1.default.FAIL });
                }
            },
        }));
        // log
        GraphQLServer.LOG.info(`Using GraphQL at endpoint ${config.endpoint}`);
    }
    loadSchemaAndResolvers(env) {
        const pieces = glob_1.default
            .sync(`${env.srcDir}/graphql/**/*.js`)
            .map((it) => require(it).default);
        if (pieces.length === 0) {
            return { schema: null, resolvers: null };
        }
        const source = merge_graphql_schemas_1.mergeTypes(pieces.map((it) => it.schema), { all: true });
        // GraphQLServer.LOG.debug(`Merged Schema\n${source}`);
        const schema = graphql_1.buildSchema(source);
        const resolvers = merge_graphql_schemas_1.mergeResolvers(pieces.map((it) => it.resolver));
        return { schema, resolvers };
    }
}
// 单例
GraphQLServer.S = new GraphQLServer();
GraphQLServer.LOG = Logs_1.default.INSTANCE.getFoundationLogger(__dirname, "GraphQLServer");
exports.default = GraphQLServer;
//# sourceMappingURL=GraphQLServer.js.map