import * as Express from "express";
import {GraphQLServer, HttpServer} from "./index";

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
   * @param httpServer Http服务器
   */
  initRouter?(httpServer: HttpServer): void

  /**
   * 初始化GraphQL
   * @param httpServer 服务器
   * @param graphQLServer GraphQL服务器
   */
  initGraphQL?(httpServer: HttpServer, graphQLServer: GraphQLServer): void

  /**
   * 获取GraphQL的Schema
   */
  initGraphQLSchema?(): { typeDefs: string[], resolvers: any }
}