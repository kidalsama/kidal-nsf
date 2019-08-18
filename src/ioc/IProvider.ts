/**
 * 创建实例的工厂，由容器创建。每次获取实例时都会被调用。
 */
export interface IProvider {
  /**
   * 创建用于绑定的实例。
   * @return 容器需要的实例。
   */
  get(): Object;
}
