/**
 * @author tengda
 */
export const DEFAULT_PAGE = 1

/**
 * @author tengda
 */
export const DEFAULT_LIMIT = 10

/**
 * @author tengda
 */
export const MAX_LIMIT = 1000

/**
 * @author tengda
 */
export class PageArgs {
  public readonly page: number
  public readonly limit: number
  public readonly first: number
  public readonly after: string | null
  public readonly last: number
  public readonly before: string | null

  /**
   * @author tengda
   */
  public constructor(
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
    first: number = DEFAULT_LIMIT,
    after: string | null = null,
    last: number = DEFAULT_LIMIT,
    before: string | null = null,
  ) {
    this.page = page
    this.limit = limit
    this.first = first
    this.after = after
    this.last = last
    this.before = before
  }

  /**
   * @author tengda
   */
  public static zero() {
    return new PageArgs(DEFAULT_PAGE, 0)
  }

  /**
   * @author tengda
   */
  public static one() {
    return new PageArgs(DEFAULT_PAGE, 1)
  }

  /**
   * @author tengda
   */
  public static max() {
    return new PageArgs(DEFAULT_PAGE, MAX_LIMIT)
  }
}

/**
 * @author tengda
 */
export interface IEdge<TNode> {
  node?: TNode
  cursor?: string
}

/**
 * @author tengda
 */
export class Connection<TNode> {
  public readonly edges: Array<IEdge<TNode>>
  public readonly totalCount: number
  public readonly startCursor: string | null
  public readonly endCursor: string | null
  public readonly pageArgs: PageArgs

  /**
   * @author tengda
   */
  public constructor(
    edges: Array<IEdge<TNode>>,
    totalCount: number,
    startCursor: string | null,
    endCursor: string | null,
    pageArgs: PageArgs,
  ) {
    this.edges = edges
    this.totalCount = totalCount
    this.startCursor = startCursor
    this.endCursor = endCursor
    this.pageArgs = pageArgs
  }

  /**
   * @author tengda
   */
  public static async make<TNode>(
    nodes: TNode[] | (() => Promise<TNode[]>),
    totalCount: number | (() => Promise<number>),
    pageArgs: PageArgs,
  ): Promise<Connection<TNode>> {
    const fixedTotalCount: number = typeof totalCount === "function"
      ? await totalCount() : totalCount
    const fixedNodes: TNode[] = pageArgs.limit > 0
      ? (typeof nodes === "function" ? await nodes() : nodes) : []

    return new Connection<TNode>(
      fixedNodes.map((it) => ({node: it, cursor: undefined})),
      fixedTotalCount, null, null, pageArgs,
    )
  }

  /**
   * 是否有下一页
   */
  public get hasNextPage(): boolean {
    return this.totalCount > (this.pageArgs.page * this.pageArgs.limit)
  }

  /**
   * 是否有上一页
   */
  public get hasPreviousPage(): boolean {
    return this.pageArgs.page > 1
  }
}
