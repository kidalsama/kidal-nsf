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
}
