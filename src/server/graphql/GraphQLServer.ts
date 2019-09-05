import {formatError, GraphQLError, GraphQLFormattedError, printError} from "graphql";
import HttpServer from "../HttpServer";
import Environment from "../../application/Environment";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";
import GraphQLApolloServer from "./GraphQLApolloServer";
import {GraphQLExtension} from "graphql-extensions";
import {makeExecutableSchema, SchemaDirectiveVisitor} from "graphql-tools";
import {Component} from "../../ioc";
import {scalarDate} from "./GraphQLScalars";
import {ByteDirective, DateDirective, TimeDirective, UrlDirective} from "./GraphQLDirectives";
import {mergeResolver, mergeTypeDefs} from "./merges";

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
    const typeDefs: string[] = []
    const resolvers: any[] = []

    // 手动
    if (this.httpServer.initializer && this.httpServer.initializer.getGraphQLExecutableSchemaDefinition) {
      const manual = this.httpServer.initializer.getGraphQLExecutableSchemaDefinition()
      if (manual.typeDefs.length > 0) {
        typeDefs.push(...manual.typeDefs)
        resolvers.push(manual.resolvers)
      }
    }

    // 获取绑定的定义
    const bind = await this.httpServer.bindingRegistry.createGraphQLExecutableSchemaDefinition()
    if (bind.typeDefs.length > 0) {
      typeDefs.push(...bind.typeDefs)
      resolvers.push(bind.resolvers)
    }

    // 标量
    typeDefs.unshift(scalarDate.schema)
    resolvers.push({Date: scalarDate.resolver})

    // 指令
    const schemaDirectives: { [name: string]: typeof SchemaDirectiveVisitor } = {}
    typeDefs.unshift(ByteDirective.SCHEMA, DateDirective.SCHEMA, TimeDirective.SCHEMA, UrlDirective.SCHEMA)
    schemaDirectives[ByteDirective.NAME] = ByteDirective
    schemaDirectives[DateDirective.NAME] = DateDirective
    schemaDirectives[TimeDirective.NAME] = TimeDirective
    schemaDirectives[UrlDirective.NAME] = UrlDirective

    // 合并
    const mergedTypeDefs = mergeTypeDefs(typeDefs, GraphQLServer.LOG)
    const mergedResolvers: any = resolvers.reduce((prev, cur) => mergeResolver("", prev, cur, GraphQLServer.LOG), {})

    // 创建图示
    const schema = makeExecutableSchema({
      typeDefs: mergedTypeDefs,
      resolvers: mergedResolvers,
      allowUndefinedInResolve: true,
      schemaDirectives,
    })

    // 创建订阅
    const subscriptions = this.httpServer.config.graphQLSubscriptionEndpoint
      ? {path: this.httpServer.config.graphQLSubscriptionEndpoint}
      : undefined

    // 创建Apollo服务器
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
          "request.credentials": "include", // possible values: 'omit', 'include', 'same-origin'
          "tracing.hideTracingResponse": true,
          "queryPlan.hideQueryPlanResponse": false,
        },
      },
    });

    // 注册中间件
    apolloServer.applyMiddleware({
      app: this.httpServer.expressApp,
      path: this.httpServer.config.graphQLEndpoint,
      cors: {origin: true, allowedHeaders: "*", methods: "*", credentials: true},
    })

    // 注册订阅
    if (subscriptions) {
      apolloServer.installSubscriptionHandlers(this.httpServer.server)
    }

    // log
    GraphQLServer.LOG.info(`Using GraphQL at endpoint ${this.httpServer.config.graphQLEndpoint}`);
  }
}
