import {Connection} from "../../util/Pagination";

export default {
  makeConnectionSchema(name: string) {
    return `type ${name}Edge {
	# 节点
	node: ${name}
	# 当前节点游标
	cursor: String
}

type ${name}Connection {
	# 节点列表
	nodes: [${name}!]!
	# 边列表
	edges: [${name}Edge!]!
	# 全部元素个数
	totalCount: Int!
	# 向前分页起始游标
	startCursor: String
	# 向后分页起始游标
	endCursor: String
	# 是否有下一页
	hasNextPage: Boolean!
	# 是否有上一页
	hasPreviousPage: Boolean!
	# 当前分页参数
	pageArgs: ${name}PageArgs!
}

type ${name}PageArgs {
  page: Int
  limit: Int
  first: Int
  after: String
  last: Int
  before: String
}`
  },
  makeConnection<TNode>(
    connection: Connection<TNode>,
    transform?: (node: TNode) => TNode,
  ): any {
    if (transform) {
      connection = connection.map(transform)
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
    }
  },
}
