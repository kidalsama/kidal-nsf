import User, {IUser} from "./entity/User";
import Sequelize from "sequelize";
import LudmilaError from "../../../../../error/LudmilaError";
import ISession from "../../../../../server/ISession";
import Maybe from "graphql/tsutils/Maybe";
import PayloadDispatcher from "../../../../../server/PayloadDispatcher";

export default class UserService {
  public static readonly S = new UserService();

  private constructor() {
    // 自动同步
    User.cache.on("field-updated", (id: number, key: string, value: any) => {
      PayloadDispatcher.S.addSyncPartial("User", id, key, value);
    });
  }

  // 注册用户
  public async register(session: Maybe<ISession>, username: string, password: string): Promise<IUser> {
    // 创建用户
    let user;
    try {
      user = await User.cache.create({username, password});
    } catch (e) {
      // 唯一键冲突，因为username是唯一的，所以这里只可能因为username重名
      if (e instanceof Sequelize.UniqueConstraintError) {
        throw new LudmilaError("Username already existed");
      } else {
        throw e;
      }
    }

    // 注册成功，绑定会话
    if (session) {
      await session.bindUin(user.id.toString());
    }

    // 同步完整数据
    PayloadDispatcher.S.addSyncFull("User", user.id, user);

    return user;
  }

  // 登录
  public async login(session: Maybe<ISession>, username: string, password: string): Promise<IUser> {
    // 通过用户名获取用户并比较密码
    const user = await User.cache.loadOne(async (model) => {
      return await model.findOne({where: {username}});
    });

    if (user === null || user.password !== password) {
      throw new LudmilaError("1", "用户名或者密码错误");
    }

    // 登录成功，绑定会话
    if (session) {
      await session.bindUin(user.id.toString());
    }

    // 同步完整数据
    PayloadDispatcher.S.addSyncFull("User", user.id, user);

    return user;
  }

  // 改名
  public async rename(id: number, newUsername: string): Promise<IUser> {
    // 读取用户
    const user = await User.cache.get(id);
    if (user === null) {
      throw new LudmilaError("1", "用户不存在");
    }

    // 改名
    user.username = newUsername;

    // 完成
    return user;
  }
}
