import * as lodash from "lodash";
import {formatError, GraphQLError, GraphQLFormattedError, printError} from "graphql";
import HttpServer from "../HttpServer";
import Environment from "../../application/Environment";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";
import GraphQLApolloServer from "./GraphQLApolloServer";
import {GraphQLExtension} from "graphql-extensions";
import {makeExecutableSchema} from "graphql-tools";
import {Component} from "../../ioc";
import {scalarDate} from "./GraphQLScalars";
import {DateUnitDirective} from "./GraphQLDirectives";

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
   * 启动
   */
  public async start() {
    // 获取定义
    let typeDefs: string[] = []
    let resolvers: any = {}
    let bindTypeDefs: string[] = []
    let bindResolvers: any = {}

    // 手动
    if (this.httpServer.initializer && this.httpServer.initializer.getGraphQLExecutableSchemaDefinition) {
      const manual = this.httpServer.initializer.getGraphQLExecutableSchemaDefinition()
      if (manual.typeDefs.length > 0) {
        typeDefs = manual.typeDefs
        resolvers = manual.resolvers
      }
    }

    // 获取绑定的定义
    const bind = await this.httpServer.bindingRegistry.createGraphQLExecutableSchemaDefinition()
    if (bind.typeDefs.length > 0) {
      bindTypeDefs = bind.typeDefs
      bindResolvers = bind.resolvers
    }

    // 合并定义
    if (bindTypeDefs.length > 0) {
      // 合并Schema
      typeDefs.push(...bindTypeDefs)
      // 合并Resolver
      const mergeResolver = (prefix: string, to: any, from: any) => {
        for (const key of Object.keys(from)) {
          // 获取解析器
          const resolver = from[key]
          // 合并
          if (lodash.isFunction(resolver)) {
            if (to.hasOwnProperty(key)) {
              GraphQLServer.LOG.warn("Duplicated resolver: ", `${prefix}${key}`)
            } else {
              to[key] = resolver
            }
          } else if (lodash.isObject(resolver)) {
            if (to.hasOwnProperty(key)) {
              mergeResolver(`${prefix}${key}.`, to[key], resolver)
            } else {
              mergeResolver(`${prefix}${key}.`, to[key] = {}, resolver)
            }
          }
        }
      }
      mergeResolver("", resolvers, bindResolvers)
    }

    // 设置自定义标量
    if (resolvers.Date === undefined) {
      typeDefs.unshift(scalarDate.schema)
      resolvers.Date = scalarDate.resolver
    }

    // 设置指令
    typeDefs.unshift(
      DateUnitDirective.SCHEMA,
    )

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
      allowUndefinedInResolve: true,
      schemaDirectives: {
        DateUnit: DateUnitDirective,
      },
    })

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
