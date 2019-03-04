import IPayload from "./IPayload";
import ISession from "./ISession";
import Maybe from "graphql/tsutils/Maybe";

/**
 * @author tengda
 */
export interface IHandlePayloadContext<TArgs, TResults> {
  data: TArgs;
  payload: IPayload;
  session: Maybe<ISession>;
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
   * 载荷处理器
   */
  handle(args: IHandlePayloadContext<TArgs, TResults>): Promise<TResults>;
}
