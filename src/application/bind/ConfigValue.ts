import {Container} from "../../ioc";
import Environment from "../Environment";
import ObjectUtils from "../../util/ObjectUtils";

/**
 * 注入配置的值
 */
export function ConfigValue(keys: string | string[], defaults?: any) {
  return (target: any, propertyKey: string) => {
    let initialized = false
    let property: any

    Object.defineProperty(target.constructor.prototype, propertyKey, {
      enumerable: true,
      get(): any {
        if (!initialized) {
          property = ObjectUtils.getProperty(Container.get(Environment).applicationConfig, keys, defaults)
          initialized = true
        }
        return property
      },
    })
  }
}
