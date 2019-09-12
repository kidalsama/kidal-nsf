import {IUser} from "./entity/User";
import {EntityEvents} from "../../../../../src/data/EntityEvents";
import {Container} from "../../../../../src/ioc/Container";
import {DatabaseManager} from "../../../../../src/data/DatabaseManager";

export default class UserService {
  public static readonly S = new UserService();

  private constructor() {
    // 自动同步
    Container.get(DatabaseManager).acquire().getCache<number, IUser>("user")
      .on(EntityEvents.FIELD_UPDATED, (id: number, key: string, value: any) => {
        //
      });
  }
}
