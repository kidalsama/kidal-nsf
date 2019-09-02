import {formatError, GraphQLError, GraphQLFormattedError, printError} from "graphql";
import HttpServer from "../HttpServer";
import glob from "glob";
import Environment from "../../application/Environment";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";
import GraphQLApolloServer from "./GraphQLApolloServer";
import {GraphQLExtension} from "graphql-extensions";
import {makeExecutableSchema, mergeSchemas} from "graphql-tools";
import {Component} from "../../ioc";

/**
 * @author tengda
 */
@Component
export default class GraphQLServer {
  // 日志
  private static readonly LOG = Logs.S.getFoundationLogger(__dirname, "GraphQLServer");
  /**
   * 错误格式化器
   */
  public errorFormatter: (error: GraphQLError) => GraphQLFormattedError

  /**
   * @param env 环境
   * @param httpServer 服务器
   */
  public constructor(
    public readonly env: Environment,
    public readonly httpServer: HttpServer,
  ) {
    this.httpServer = httpServer
    this.errorFormatter = (error) => {
      const formattedError = formatError(error);
      const isLudmilaError = error.originalError && (error.originalError instanceof LudmilaError)
      if (isLudmilaError) {
        const originalError: any = error.originalError;
        // 打印错误
        if (this.httpServer.config.logError) {
          GraphQLServer.LOG.error(
            "LudmilaError",
            originalError.code, originalError.message, originalError.stack,
            printError(error),
          )
        }
        // 返回
        return Object.assign(
          {}, formattedError, {code: originalError.code, message: originalError.message},
        );
      } else {
        // 打印错误
        if (this.httpServer.config.logError) {
          GraphQLServer.LOG.error("Error", formattedError, printError(error))
        }
        // 返回
        return Object.assign({}, formattedError, {code: LudmilaErrors.FAIL});
      }
    }
  }

  /**
   * 初始化
   */
  public init() {
    // 加载注册列表
    const registryList = glob
      .sync(`${this.env.srcDir}/**/graphql/**/*.js`)
      .map((it: string) => require(it).default)
      .filter((it: any) => !!it);
    const schemaList = registryList
      .map((it: any) => makeExecutableSchema({
        typeDefs: it.schema,
        resolvers: it.resolvers,
        allowUndefinedInResolve: true,
      }))
    let schema
    if (schemaList.length === 0) {
      throw new Error("No graphql schema")
    } else if (schemaList.length > 1) {
      GraphQLServer.LOG.warn("DON NOT use multiple graphql schema")
      schema = mergeSchemas({schemas: schemaList})
    } else {
      schema = schemaList[0]
    }

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
        return this.errorFormatter(error)
      },
      extensions: [
        (): GraphQLExtension => ({
          willSendResponse: ({graphqlResponse}) => {
            // const extensions = graphqlResponse.extensions || {}
            // graphqlResponse.extensions = extensions
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
