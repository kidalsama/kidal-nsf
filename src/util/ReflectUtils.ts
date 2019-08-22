export default {
  /**
   * 遍历原型链上的属性
   * @param prototype 原型链
   * @param dc 遍历方式
   * @param fc 过滤器
   */
  async doWithProperties(
    prototype: any,
    dc: (propertyName: string, property: any) => Promise<void>,
    fc?: (propertyName: string, property: string) => Promise<boolean>,
  ): Promise<void> {
    // 获取全部属性
    const names = Object.getOwnPropertyNames(prototype)
    // 遍历
    for (const name of names) {
      // 过滤器
      if (fc && !(await fc(name, prototype[name]))) {
        continue
      }
      // 执行
      await dc(name, prototype[name])
    }
    // 进父类
    if (prototype.__proto__ && prototype.__proto__ !== Object.prototype) {
      await this.doWithProperties(prototype.__proto__, dc, fc)
    }
  },
}
