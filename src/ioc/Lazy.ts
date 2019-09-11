/**
 * 延迟加载参数
 */
export function Lazy() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    let initialized = false
    let property: any

    const {value, get} = descriptor

    if (value) {
      descriptor.value = function (...argArray: any) {
        if (!initialized) {
          property = (value as Function).apply(this, argArray)
          initialized = true
        }
        return property
      }
    } else if (get) {
      descriptor.get = function () {
        if (!initialized) {
          property = (get as Function).apply(this)
          initialized = true
        }
        return property
      }
    }
  }
}
