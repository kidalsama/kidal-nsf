import {MetadataKeys, RequestMethod} from "./ServerBindingRegistry";

/**
 * 映射Http请求
 */
export function RequestMapping(
  path: string,
  options?: {
    method?: RequestMethod | RequestMethod[],
  },
): Function {
  return (target: Object & Function, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    // 标记为映射方法，注册器才会处理
    Reflect.defineMetadata(MetadataKeys.MappingFunction, true, target, propertyKey)
    // 请求路径
    Reflect.defineMetadata(MetadataKeys.Path, path, target, propertyKey)
    // 其他可选参数
    if (options) {
      // 方法
      Reflect.defineMetadata(MetadataKeys.Method, options.method, target, propertyKey)
    }
  }
}
