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
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "GraphQLServer");
  public readonly httpServer: HttpServer

  public constructor(httpServer: HttpServer) {
    this.httpServer = httpServer
  }

  /**
   * 初始化
   */
  public init() {
    // 配置
    const env = Environment.S;

    // 加载注册列表
    const registryList = glob
      .sync(`${env.srcDir}/**/graphql/**/*.js`)
      .map((it: string) => require(it).default)
      .filter((it: any) => !!it);
    const schemaList = registryList
      .map((it: any) => makeExecutableSchema({
        typeDefs: it.schema,
        resolvers: it.resolvers,
        allowUndefinedInResolve: true,
      }))
    const schema = mergeSchemas({schemas: schemaList})

    // 使用Apollo中间价
    const subscriptions = this.httpServer.config.graphQLSubscriptionEndpoint ?
      {path: this.httpServer.config.graphQLSubscriptionEndpoint} : undefined
    const apolloServer = new GraphQLApolloServer({
      schema,
      subscriptions,
      context: (ctx: any) => {
        const context: any = {}
        for (const key of Object.keys(ctx)) {
          if (ctx.hasOwnProperty(key)) {
            context[key] = ctx[key]
          }
        }
        context.req = ctx.req
        context.res = ctx.res
        return context
      },
      formatError: (error) => {
        const formattedError = formatError(error);
        // 打印错误
        if (formattedError &&
          formattedError.extensions &&
          formattedError.extensions.hasOwnProperty("code") &&
          formattedError.extensions.code === "INTERNAL_SERVER_ERROR") {
          GraphQLServer.LOG.error("INTERNAL_SERVER_ERROR", formattedError, formattedError.extensions.exception)
        }
        const originalError: any = error.originalError;
        if (!originalError) {
          return Object.assign({}, formattedError, {code: LudmilaErrors.FAIL});
        }
        const errors: any = originalError.errors
        if (!errors || errors.length < 0) {
          return Object.assign({}, formattedError, {code: LudmilaErrors.FAIL});
        }
        const maybeLudmilaError = errors[0].originalError
        if (!(maybeLudmilaError instanceof LudmilaError)) {
          return Object.assign({}, formattedError, {code: LudmilaErrors.FAIL});
        }
        return Object.assign(
          {}, formattedError, {code: maybeLudmilaError.code, message: maybeLudmilaError.message},
        );
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
          "editor.theme": "light", // possible values: 'dark', 'light'
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
          "queryPlan.hideQueryPlanResponse": false,
        },
      },
    });
    apolloServer.applyMiddleware({
      app: this.httpServer.expressApp,
      path: this.httpServer.config.graphQLEndpoint,
      cors: {
        origin: true,
        allowedHeaders: "*",
        methods: "*",
        credentials: true,
      },
    })
    if (subscriptions) {
      apolloServer.installSubscriptionHandlers(
        this.httpServer.server,
      )
    }

    // log
    GraphQLServer.LOG.info(`Using GraphQL at endpoint ${this.httpServer.config.graphQLEndpoint}`);
  }
}
