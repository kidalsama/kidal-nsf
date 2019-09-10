import * as Express from "express";
import {HttpServer} from "./index";
import WebSocketServer from "./websocket/WebSocketServer";
import GraphQLServer from "./graphql/GraphQLServer";

/**
 * Http服务器初始化器
 */
export default interface IServerInitializer {
  /**
   * 初始化路由
   * @param app Express程序
   */
  routes?(app: Express.Express): void

  /**
   * 初始化路由
   */
  initRouter?(httpServer: HttpServer): void

  /**
   * 初始化GraphQL
   */
  initGraphQL?(graphQLServer: GraphQLServer): void

  /**
   * 获取GraphQL的Schema
   */
  initGraphQLSchema?(): { typeDefs: string[], resolvers: any }

  /**
   * 初始化WebSocket
   */
  initWebSocket?(webSocketServer: WebSocketServer): void
}
