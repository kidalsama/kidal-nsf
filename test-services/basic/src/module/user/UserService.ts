import User, {IUser} from "./entity/User";
import PayloadDispatcher from "./../../../../../src/server/PayloadDispatcher";
import {EntityEvents} from "../../../../../src/data/IEntity";
import Database from "../../../../../src/data/Database";

export default class UserService {
  public static readonly S = new UserService();

  private constructor() {
    // 自动同步
    Database.S.getCache<number, IUser>("999_user")
      .on(EntityEvents.FIELD_UPDATED, (id: number, key: string, value: any) => {
        PayloadDispatcher.S.addSyncPartial("User", id, key, value);
      });
  }
}
