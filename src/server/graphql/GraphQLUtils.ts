export default {
  makeConnectionSchema(name: string) {
    return `type ${name}Edge {
	# 节点
	node: ${name}
	# 当前节点游标
	cursor: String
}

type OaFieldConnection {
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
}
