export const VERSION: number = 1;

/**
 * @author tengda
 */
export const payloadToText = (payload: Partial<IPayload>): string => {
  return JSON.stringify(payload);
};

/**
 * @author tengda
 */
export const textToPayload = (text: string): IPayload => {
  return JSON.parse(text) as IPayload;
};

/**
 * @author tengda
 */
export const copyPayload = (payload: IPayload, data: IPayloadData): IPayload => {
  return {
    version: VERSION,
    id: payload.id,
    type: payload.type,
    data,
  };
};

/**
 * @author tengda
 */
export interface IPayloadData {
  /**
   * 任意字段
   */
  [key: string]: any;
}

/**
 * @author tengda
 */
export default interface IPayload {
  /**
   * 版本
   */
  version: number;

  /**
   * 载荷ID.
   */
  id: number;

  /**
   * 载荷类型
   */
  type: string;

  /**
   * 数据
   */
  data: IPayloadData;
}
