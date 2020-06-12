import { MetadataKeys } from "./ServerBindingRegistry";
import { Service } from "../../ioc/Annotation";

/**
 * 设置选项
 */
function setMetadataOption(
  key: string,
  val: any,
  target: Object & Function,
  propertyKey?: string
) {
  if (propertyKey) {
    const optionsMetadata =
      Reflect.getMetadata(MetadataKeys.GraphQLOptions, target, propertyKey) ||
      {};
    optionsMetadata[key] = val;
    Reflect.defineMetadata(
      MetadataKeys.GraphQLOptions,
      optionsMetadata,
      target,
      propertyKey
    );
  } else {
    const optionsMetadata =
      Reflect.getMetadata(MetadataKeys.GraphQLOptions, target) || {};
    optionsMetadata[key] = val;
    Reflect.defineMetadata(
      MetadataKeys.GraphQLOptions,
      optionsMetadata,
      target
    );
  }
}

/**
 * 声明该类是一个GraphQL的格式定义
 */
export function GQLSchema(): Function {
  return (target: Function) => {
    // 标记
    Reflect.defineMetadata(MetadataKeys.GraphQLSchema, true, target);

    // 注册为服务
    return Service(target);
  };
}

/**
 * 声明该类是一个GraphQL的字段解析器
 * @param key 类: 类型名; 字段: 字段名.
 * @param isSubscription 是否是订阅
 */
export function GQLResolver(key?: string, isSubscription?: boolean): Function {
  return (target: Function) => {
    // 标记
    Reflect.defineMetadata(MetadataKeys.GraphQLResolver, true, target);

    // 设置key
    setMetadataOption("key", key || target.name, target);
    setMetadataOption("isSubscription", isSubscription || false, target);

    // 注册为服务
    return Service(target);
  };
}
