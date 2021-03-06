/**
 * @author kidal
 */
export const DEFAULT_PAGE = 1;

/**
 * @author kidal
 */
export const DEFAULT_LIMIT = 20;

/**
 * @author kidal
 */
export const MAX_LIMIT = 1000;

/**
 * @author kidal
 */
export class PageArgs {
  public readonly page: number;
  public readonly limit: number;
  public readonly first: number;
  public readonly after: string | null;
  public readonly last: number;
  public readonly before: string | null;

  /**
   * @author kidal
   */
  public constructor(
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
    first: number = DEFAULT_LIMIT,
    after: string | null = null,
    last: number = DEFAULT_LIMIT,
    before: string | null = null
  ) {
    this.page = page;
    this.limit = limit;
    this.first = first;
    this.after = after;
    this.last = last;
    this.before = before;
  }

  /**
   * @author kidal
   */
  public static zero() {
    return new PageArgs(DEFAULT_PAGE, 0);
  }

  /**
   * @author kidal
   */
  public static one() {
    return new PageArgs(DEFAULT_PAGE, 1);
  }

  /**
   * @author kidal
   */
  public static max() {
    return new PageArgs(DEFAULT_PAGE, MAX_LIMIT);
  }

  /**
   * @author kidal
   */
  public static page(page: number = DEFAULT_PAGE, limit: number = MAX_LIMIT) {
    return new PageArgs(page, limit);
  }

  /**
   * 起始位置
   */
  public get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

/**
 * @author kidal
 */
export interface IEdge<TNode> {
  node?: TNode;
  cursor?: string;
}

/**
 * @author kidal
 */
export class Connection<TNode> {
  public readonly edges: Array<IEdge<TNode>>;
  public readonly totalCount: number;
  public readonly startCursor: string | null;
  public readonly endCursor: string | null;
  public readonly pageArgs: PageArgs;

  /**
   * @author kidal
   */
  public constructor(
    edges: Array<IEdge<TNode>>,
    totalCount: number,
    startCursor: string | null,
    endCursor: string | null,
    pageArgs: PageArgs
  ) {
    this.edges = edges;
    this.totalCount = totalCount;
    this.startCursor = startCursor;
    this.endCursor = endCursor;
    this.pageArgs = pageArgs;
  }

  /**
   * @author kidal
   */
  public static async make<TNode>(
    nodes: TNode[] | (() => Promise<TNode[]>),
    totalCount: number | (() => Promise<number>),
    pageArgs: PageArgs
  ): Promise<Connection<TNode>> {
    const fixedTotalCount: number =
      typeof totalCount === "function" ? await totalCount() : totalCount;
    const fixedNodes: TNode[] =
      pageArgs.limit > 0
        ? typeof nodes === "function"
          ? await nodes()
          : nodes
        : [];

    return new Connection<TNode>(
      fixedNodes.map(it => ({ node: it, cursor: undefined })),
      fixedTotalCount,
      null,
      null,
      pageArgs
    );
  }

  /**
   * @author kidal
   */
  public static empty<TNode>(pageArgs?: PageArgs): Connection<TNode> {
    return new Connection<TNode>(
      [],
      0,
      null,
      null,
      pageArgs || PageArgs.page()
    );
  }

  /**
   * 全部节点
   */
  public get nodes(): TNode[] {
    return this.edges.map(it => it.node!);
  }

  /**
   * 第一个节点
   */
  public get firstOrNull(): TNode | null {
    return this.edges.length > 0 ? this.edges[0].node || null : null;
  }

  /**
   * 是否有下一页
   */
  public get hasNextPage(): boolean {
    return this.totalCount > this.pageArgs.page * this.pageArgs.limit;
  }

  /**
   * 是否有上一页
   */
  public get hasPreviousPage(): boolean {
    return this.pageArgs.page > 1;
  }

  /**
   * 转换
   */
  public map<R>(transform: (node: TNode) => R): Connection<R> {
    return new Connection<R>(
      this.edges.map(it => {
        return {
          node: it.node ? transform(it.node) : undefined,
          cursor: it.cursor
        };
      }),
      this.totalCount,
      this.startCursor,
      this.endCursor,
      this.pageArgs
    );
  }

  /**
   * 转换为Json
   */
  public stringify(): string {
    return JSON.stringify({
      edges: this.edges,
      totalCount: this.totalCount,
      startCursor: this.startCursor,
      endCursor: this.endCursor,
      pageArgs: this.pageArgs
    });
  }

  /**
   * 从Json解析
   */
  public static parse<T>(s: any): Connection<T> {
    const obj = typeof s === "string" ? JSON.parse(s) : s;

    return new Connection<T>(
      obj.edges,
      obj.totalCount,
      obj.startCursor,
      obj.endCursor,
      new PageArgs(
        obj.pageArgs.page,
        obj.pageArgs.limit,
        obj.pageArgs.first,
        obj.pageArgs.after,
        obj.pageArgs.last,
        obj.pageArgs.before
      )
    );
  }
}
