/**
 * 延迟加载参数
 */
export function Lazy() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    let prop: any
    const oldGet = descriptor.get
    descriptor.get = function (): any {
      if (prop === undefined && oldGet) {
        prop = oldGet.apply(this)
      }
      return prop
    }
  }
}
