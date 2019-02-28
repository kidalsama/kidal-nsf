import IPayload from "./IPayload";
import ISession from "./ISession";

/**
 * @author tengda
 */
export interface IHandlePayloadContext<TArgs, TResults> {
  data: TArgs;
  payload: IPayload;
  session: ISession;
}

/**
 * @author tengda
 */
export default interface IApiRegistry<TArgs, TResults> {
  /**
   * API类型.
   */
  readonly type: string;
  /**
   * 初始化
   */
  init: (type: string) => Promise<any>;

  /**
   * 载荷处理器
   */
  handle(args: IHandlePayloadContext<TArgs, TResults>): Promise<TResults>;
}
