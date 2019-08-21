import {Service} from "../../ioc";
import {MetadataKeys} from "./ServerBindingRegistry";

/**
 * 该类是控制器类
 * @see Service
 */
export function Controller(target: Function) {
  // 标记为控制器，注册器才会处理这个类
  Reflect.defineMetadata(MetadataKeys.Controller, true, target)

  // 使用Service的算法来绑定到容器内
  return Service(target)
}
