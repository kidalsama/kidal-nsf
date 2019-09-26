import * as lodash from "lodash"

export default {
  /**
   * 标准化更新的参数
   */
  normalizeUpdateValues(values: { [key: string]: any }): { [key: string]: any } {
    const keys = Object.keys(values)
    const normalized: { [key: string]: any } = {}
    for (const key of keys) {
      const value = values[key]
      if (value !== undefined && value !== null) {
        normalized[key] = value
      }
    }
    return normalized
  },
  /**
   * 标准化查询条件
   */
  normalizeWhereValues(values: { [key: string]: any }): { [key: string]: any } {
    const keys = Object.keys(values)
    const normalized: { [key: string]: any } = {}
    for (const key of keys) {
      const value = values[key]
      if (value !== undefined && value !== null) {
        normalized[key] = value
      }
    }
    return normalized
  },
  /**
   * 标准化排序条件
   */
  normalizeOrderValues(values: string[][] | undefined | null): string[][] | undefined {
    if (!values) {
      return undefined
    }
    return values
  },
  /**
   * 使用like语法
   */
  wcUseLike(val: any) {
    if (val === undefined || val === null) {
      return val
    }
    if (lodash.isArray(val)) {
      return {$like: val.map((it) => `%${it}%`)}
    } else {
      return {$like: `%${val}%`}
    }
  },
  /**
   * 使用between语法
   */
  wcUseBetween(val: any, orGTE?: boolean) {
    if (val === undefined || val === null) {
      return val
    }
    if (!lodash.isArray(val)) {
      return orGTE ? {$gte: val} : undefined
    }
    if (val.length === 0) {
      return undefined
    } else if (val.length === 1) {
      return orGTE ? {$gte: val[0]} : undefined
    } else {
      return {$between: [val[0], val[1]]}
    }
  },
}
