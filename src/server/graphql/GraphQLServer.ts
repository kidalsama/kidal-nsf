import {buildSchema, formatError} from "graphql";
import HttpServer from "../HttpServer";
import Application from "../../application/Application";
import graphqlHTTP from "express-graphql";
import glob from "glob";
import {mergeResolvers, mergeTypes} from "merge-graphql-schemas";
import Environment from "../../application/Environment";
import Logs from "../../application/Logs";
import LudmilaError from "../../error/LudmilaError";
import LudmilaErrors from "../../error/LudmilaErrors";

/**
 * @author tengda
 */
export default class GraphQLServer {
  // 单例
  public static readonly S = new GraphQLServer();
  private static readonly LOG = Logs.INSTANCE.getFoundationLogger(__dirname, "GraphQLServer");

  /**
   * 单例
   */
  private constructor() {

  }

  /**
   * 初始化
   */
  public init() {
    const httpServer = HttpServer.S;

    // 配置
    const app = Application.INSTANCE;
    const env = Environment.INSTANCE;
    const config = app.bootstrapConfig.server.graphQL;

    // 读取
    const {schema, resolvers} = this.loadSchemaAndResolvers(env);
    if (schema === null || resolvers === null) {
      GraphQLServer.LOG.info("No graphql autowired");
      return;
    }

    // GraphQL终端
    httpServer.expressApp.use(config.endpoint, graphqlHTTP({
      schema,
      rootValue: resolvers,
      graphiql: true,
      formatError: (error) => {
        const formattedError = formatError(error);
        const originalError = error.originalError;
        if (originalError !== undefined && originalError !== null && originalError instanceof LudmilaError) {
          return Object.assign({}, formattedError, {code: originalError.code, message: originalError.message});
        } else {
          return Object.assign({}, formattedError, {code: LudmilaErrors.FAIL});
        }
      },
    }));

    // log
    GraphQLServer.LOG.info(`Using GraphQL at endpoint ${config.endpoint}`);
  }

  private loadSchemaAndResolvers(env: Environment) {
    const pieces = glob
      .sync(`${env.srcDir}/graphql/**/*.js`)
      .map((it: string) => require(it).default);
    if (pieces.length === 0) {
      return {schema: null, resolvers: null};
    }

    const source = mergeTypes(pieces.map((it: any) => it.schema), {all: true});
    // GraphQLServer.LOG.debug(`Merged Schema\n${source}`);
    const schema = buildSchema(source);
    const resolvers = mergeResolvers(pieces.map((it: any) => it.resolver));

    return {schema, resolvers};
  }
}
