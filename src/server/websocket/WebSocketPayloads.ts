import Maybe from "../../util/Maybe";

/**
 * 载荷数据
 */
export interface IPayloadData {
  /**
   * 任意字段
   */
  [key: string]: any
}

/**
 * 载荷
 */
export interface IPayload {
  /**
   * ID
   */
  id: number;
  /**
   * 时间戳
   */
  ts: number;
  /**
   * 类型
   */
  type: string;
  /**
   * 数据
   */
  data?: IPayloadData;
}

/**
 * 复制载荷元数据
 */
export function duplicatePayloadMetadata(payload: IPayload, data?: IPayloadData): IPayload {
  return {
    id: payload.id,
    ts: payload.ts,
    type: payload.type,
    data,
  }
}

/**
 * 载荷序列化器
 */
export interface IPayloadSerializer {
  /**
   * 序列化载荷
   */
  serialize(payload: Maybe<IPayload>): Maybe<string>

  /**
   * 反序列化载荷
   */
  deserialize(text: Maybe<string>): Maybe<IPayload>
}

/**
 * JSON载荷序列化器
 */
export class JsonPayloadSerializer implements IPayloadSerializer {
  public serialize(payload: Maybe<IPayload>): Maybe<string> {
    return payload !== undefined && payload !== null
      ? JSON.stringify(payload)
      : payload
  }

  public deserialize(text: Maybe<string>): Maybe<IPayload> {
    return text !== undefined && text !== null
      ? JSON.parse(text)
      : text
  }
}

/**
 * 漂亮JSON载荷序列化器
 */
export class PrettyJsonPayloadSerializer extends JsonPayloadSerializer {
  public serialize(payload: Maybe<IPayload>): Maybe<string> {
    return payload !== undefined && payload !== null
      ? JSON.stringify(payload, null, 2)
      : payload
  }
}

/**
 * 内建载荷
 */
export class WebSocketPayloads {
  /**
   * 当前载荷ID
   */
  private static currentPayloadID = 1

  /**
   * 排定载荷类型是否是内建类型
   */
  public static isBuildInType(type: string): boolean {
    return type.startsWith("__")
  }

  /**
   * 下一个载荷ID
   */
  public static nextPayloadID(): number {
    return this.currentPayloadID++
  }

  /**
   * 创建载荷
   */
  public static createPayload(type: string, data?: IPayloadData): IPayload {
    return {
      id: this.nextPayloadID(),
      ts: Date.now(),
      type,
      data,
    }
  }

  /**
   * 创建登录载荷
   */
  public static createLoginPayload(uin: string, authenticatedAt: Date): IPayload {
    return this.createPayload("__login", {uin, authenticatedAt})
  }
}
