import {IUser} from "./entity/User";
import Database from "../../../../../src/data/Database";
import {EntityEvents} from "../../../../../src/data";

export default class UserService {
  public static readonly S = new UserService();

  private constructor() {
    // 自动同步
    Database.acquire().getCache<number, IUser>("user")
      .on(EntityEvents.FIELD_UPDATED, (id: number, key: string, value: any) => {
        //
      });
  }
}
