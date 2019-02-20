/**
 * @author tengda
 */
export default abstract class LudmilaErrors {
  /**
   *
   */
  public static readonly OK = "OK";

  /**
   *
   */
  public static readonly FAIL = "FAIL";

  /**
   * 内部错误
   */
  public static readonly INTERNAL_ERROR = "INTERNAL_ERROR";

  /**
   * 未认证
   */
  public static readonly NOT_AUTHENTICATED = "NOT_AUTHENTICATED";

  /**
   * 无效的载荷
   */
  public static readonly SERVER_WEBSOCKET_INVALID_PAYLOAD = "SERVER_WEBSOCKET_INVALID_PAYLOAD";

  /**
   * 没有载荷处理器
   */
  public static readonly SERVER_WEBSOCKET_NO_HANDLER = "SERVER_WEBSOCKET_NO_HANDLER";

  /**
   * 没有对应的实例
   */
  public static readonly CLUSTER_DISCOVERY_RPC_CLIENT_NO_INSTANCE = "CLUSTER_DISCOVERY_RPC_CLIENT_NO_INSTANCE";

  /**
   * 返回错误状态吗
   */
  public static readonly CLUSTER_DISCOVERY_RPC_CLIENT_STATUS_NOT_200 = "CLUSTER_DISCOVERY_RPC_CLIENT_STATUS_NOT_200";

  /**
   * 节点无效
   */
  public static readonly CLUSTER_DISCOVERY_RPC_CLIENT_NODE_NOT_AVAILABLE =
    "CLUSTER_DISCOVERY_RPC_CLIENT_NODE_NOT_AVAILABLE";

  /**
   * 无效的载荷
   */
  public static readonly CLUSTER_DISCOVERY_RPC_CLIENT_INVALID_PAYLOAD = "CLUSTER_DISCOVERY_RPC_CLIENT_INVALID_PAYLOAD";

  /**
   * 没有载荷处理器
   */
  public static readonly CLUSTER_DISCOVERY_RPC_CLIENT_NO_HANDLER = "CLUSTER_DISCOVERY_RPC_CLIENT_NO_HANDLER";
}
