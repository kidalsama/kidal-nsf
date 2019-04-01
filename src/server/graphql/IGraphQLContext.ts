import express from "express";

/**
 * @author tengda
 */
export interface IGraphQLInnerContext {
  req: express.Request;
  res: express.Response;
}

/**
 * @author tengda
 */
export default interface IGraphQLContext {
  /**
   * 请求
   */
  req: express.Request;

  /**
   * 应答
   */
  res: express.Response;

  /**
   * 其他参数
   */
  [key: string]: any;
}
