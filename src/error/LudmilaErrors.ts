/**
 * @author tengda
 */
export default abstract class LudmilaErrors {
  /**
   *
   */
  public static readonly OK = 0;

  /**
   *
   */
  public static readonly FAIL = 1;

  /**
   * 内部错误
   */
  public static readonly INTERNAL_ERROR = 2;

  /**
   * 未认证
   */
  public static readonly NOT_AUTHENTICATED = 3;

  /**
   * Server
   * 无效的载荷
   */
  public static readonly SERVER_101 = 101;
  /**
   * Server
   * 没有载荷处理器
   */
  public static readonly SERVER_102 = 102;

  /**
   * Cluster
   * 没有对应的实例
   */
  public static readonly CLUSTER_201 = 201;
  /**
   * Cluster
   * 返回错误状态吗(不是200)
   */
  public static readonly CLUSTER_202 = 202;
  /**
   * Cluster
   * 节点无效，无法通信
   */
  public static readonly CLUSTER_203 = 203;
  /**
   * Cluster
   * 无效的载荷，目标服务返回的载荷格式错误
   */
  public static readonly CLUSTER_204 = 204;
  /**
   * Cluster
   * 没有载荷处理器，RPC对应的处理器没注册
   */
  public static readonly CLUSTER_205 = 205;
  /**
   * Cluster Java
   * 无法读取配置
   */
  private static readonly CLUSTER_206 = 206;
  /**
   * Cluster Java
   * 返回错误状态吗(不是200)
   */
  public static readonly CLUSTER_207 = 207;
  /**
   * Cluster Java
   * 无效的载荷，目标服务返回的载荷格式错误
   */
  public static readonly CLUSTER_208 = 208;
  /**
   * Cluster Java
   * 返回错误码
   */
  public static readonly CLUSTER_209 = 209;
}
