import _ from "lodash";
import {
  Connection,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PageArgs,
} from "../../util/Pagination";

/**
 * GraphQL工具
 */
export default {
  /**
   * 创建某类型的Connection的Schema
   * @param name 类型名
   */
  makeConnectionSchema(name: string) {
    return `type ${name}Edge {
	"节点"
	node: ${name}
	"当前节点游标"
	cursor: String
}

type ${name}Connection {
	"节点列表"
	nodes: [${name}!]!
	"边列表"
	edges: [${name}Edge!]!
	"全部节点个数"
	totalCount: Int!
	"向前分页起始游标"
	startCursor: String
	"向后分页起始游标"
	endCursor: String
	"是否有下一页"
	hasNextPage: Boolean!
	"是否有上一页"
	hasPreviousPage: Boolean!
	"当前分页参数"
	pageArgs: ${name}PageArgs!
}

type ${name}PageArgs {
  "页码"
  page: Int
  "每页个数"
  limit: Int
  "after后多少个"
  first: Int
  "起始游标"
  after: String
  "before前多少个"
  last: Int
  "结束游标"
  before: String
}`;
  },
  /**
   * 创建Connection
   */
  makeConnection<TNode>(
    connection: Connection<TNode>,
    transform?: (node: TNode) => TNode
  ): any {
    if (transform) {
      connection = connection.map(transform);
    }
    return {
      edges: connection.edges,
      nodes: connection.edges.map((it) => it.node),
      totalCount: connection.totalCount,
      startCursor: connection.startCursor,
      endCursor: connection.endCursor,
      hasNextPage: connection.hasNextPage,
      hasPreviousPage: connection.hasPreviousPage,
      pageArgs: {
        page: connection.pageArgs.page,
        limit: connection.pageArgs.limit,
        first: connection.pageArgs.first,
        after: connection.pageArgs.after,
        last: connection.pageArgs.last,
        before: connection.pageArgs.before,
      },
    };
  },
  /**
   * 解析分页参数
   */
  parsePageArgs(args: any): PageArgs {
    let fixedPage = args.page ? args.page : DEFAULT_PAGE;
    if (fixedPage < 1) {
      fixedPage = 1;
    }
    let fixedLimit = args.limit ? args.limit : DEFAULT_LIMIT;
    if (fixedLimit < 0) {
      fixedLimit = 0;
    } else if (fixedLimit > MAX_LIMIT) {
      fixedLimit = MAX_LIMIT;
    }
    return PageArgs.page(fixedPage, fixedLimit);
  },

  /**
   * 分离分页排序参数
   */
  detachPageOrderArgs(
    args: any
  ): { pageArgs: PageArgs; order: string[] | undefined } {
    const pageArgs = this.parsePageArgs(args);
    const order: string[] = args.order
      ? args.order.filter((it: string | null) => it !== null)
      : undefined;
    delete args.page;
    delete args.limit;
    delete args.order;
    return { pageArgs, order: order && order.length > 0 ? order : undefined };
  },

  /**
   * 转换ID
   */
  transformIdArray(
    id: string | string[] | null | undefined
  ): number[] | undefined {
    if (id === null || id === undefined) {
      return undefined;
    }
    if (_.isArray(id)) {
      return id.map((it) => Number(it));
    } else {
      return [Number(id)];
    }
  },

  /**
   * 转换ID
   */
  transformId(id: string | null | undefined): number | undefined {
    if (id === null || id === undefined) {
      return undefined;
    }
    return Number(id);
  },
};
