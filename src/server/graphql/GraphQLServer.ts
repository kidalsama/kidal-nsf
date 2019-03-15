import {formatError} from "graphql";
import HttpServer from "../HttpServer";
import glob from "glob";
import Environment from "../../application/Environment";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";
import GraphQLApolloServer from "./GraphQLApolloServer";
import {GraphQLExtension} from "graphql-extensions";
import PayloadDispatcher from "../PayloadDispatcher";
import {makeExecutableSchema, mergeSchemas} from "graphql-tools";

/**
 * @author tengda
 */
export default class GraphQLServer {
  // 单例
  public static readonly S = new GraphQLServer();
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "GraphQLServer");

  private constructor() {

  }

  /**
   * 初始化
   */
  public init() {
    const httpServer = HttpServer.S;

    // 配置
    const env = Environment.S;
    const config = env.applicationConfig.server.graphQL;

    // 加载注册列表
    const registryList = glob
      .sync(`${env.srcDir}/**/graphql/**/*.js`)
      .map((it: string) => require(it).default)
      .filter((it: any) => !!it);
    const schemaList = registryList
      .map((it: any) => makeExecutableSchema({
        typeDefs: it.schema,
        resolvers: it.resolvers,
      }))
    const schema = mergeSchemas({schemas: schemaList})

    // 使用Apollo中间价
    const apolloServer = new GraphQLApolloServer({
      schema,
      formatError: (error) => {
        const formattedError = formatError(error);
        const originalError = error.originalError;
        if (originalError !== undefined && originalError !== null && originalError instanceof LudmilaError) {
          return Object.assign({}, formattedError, {code: originalError.code, message: originalError.message});
        } else {
          return Object.assign({}, formattedError, {code: LudmilaErrors.FAIL});
        }
      },
      extensions: [
        (): GraphQLExtension => ({
          willSendResponse: ({graphqlResponse}) => {
            const extensions = graphqlResponse.extensions || {}
            extensions.foundation = {sync: PayloadDispatcher.S.getSync()}
            graphqlResponse.extensions = extensions
          },
        }),
      ],
      playground: {
        settings: {
          "editor.cursorShape": "line", // possible values: 'line', 'block', 'underline'
          "editor.fontFamily": `'Monaco', monospace, 'Consolas'`,
          "editor.fontSize": 18,
          "editor.reuseHeaders": true, // new tab reuses headers from last tab
          "editor.theme": "dark", // possible values: 'dark', 'light'
          "general.betaUpdates": false,
          "prettier.printWidth": 80,
          "prettier.tabWidth": 2,
          "prettier.useTabs": false,
          "request.credentials": "include", // possible values: 'omit', 'include', 'same-origin'
          "schema.polling.enable": true, // enables automatic schema polling
          "schema.polling.endpointFilter": "*localhost*", // endpoint filter for schema polling
          "schema.polling.interval": 2000, // schema polling interval in ms
          "schema.disableComments": false,
          "tracing.hideTracingResponse": true,
        },
      },
    });
    apolloServer.applyMiddleware({
      app: httpServer.expressApp,
      path: config.endpoint,
      cors: {
        origin: true,
        allowedHeaders: "*",
        methods: "*",
        credentials: true,
      },
    })

    // log
    GraphQLServer.LOG.info(`Using GraphQL at endpoint ${config.endpoint}`);
  }
}
