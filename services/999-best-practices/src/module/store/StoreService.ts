import Store, {IStore} from "./entity/Store";
import PayloadDispatcher from "../../../../../server/PayloadDispatcher";

export default class StoreService {
  public static readonly S = new StoreService();

  private constructor() {
    // 监听字段改变事件
    Store.cache.on("field-updated", (id: string, key: string, value: any) => {
      // 添加到自动同步
      PayloadDispatcher.S.addSyncPartial("Store", id, key, value);
    });
  }

  public async get(id: string): Promise<IStore | null> {
    return await Store.cache.get(id);
  }

  public async set(id: string, val: string): Promise<IStore> {
    // 加载或者创建一个
    const store = await Store.cache.getOrCreate(id, {id, val});

    // 自动同步功能，不用手动保存到数据库
    // 这里会触发上面的「field-updated」监听器
    store.val = val;

    // done
    return store;
  }
}
