import * as _ from "lodash";

export default {
  getProperty<T>(obj: any, keys: string | string[], defaults?: T): T | undefined {
    // 检查根对象
    if (!_.isPlainObject(obj)) {
      return defaults
    }

    // 整理键
    if (_.isString(keys)) {
      keys = keys.split(".")
    }

    // 检查键
    if (!_.isArray(keys)) {
      return defaults
    }

    // 查询
    let lookup = obj
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = lookup[key]

      if (!_.isPlainObject(value) && (i !== keys.length - 1)) {
        return defaults
      }

      lookup = value
    }

    // 找到
    return lookup
  },
}
