import IApiRegistry, {IHandlePayloadContext} from "../../../../../../server/IApiRegistry";
import UserService from "../UserService";

interface IArgs {
  newUsername: string;
}

// 自动同步数据，不提供返回值
class Registry implements IApiRegistry<IArgs, void> {
  private _type?: string;

  public get type(): string {
    return this._type!;
  }

  public async handle(context: IHandlePayloadContext<IArgs, void>): Promise<void> {
    // 用户必须登录，直接通过绑定的Uin获取用户Id
    const id = Number(context.session.requireUin());

    await UserService.S.rename(id, context.data.newUsername);
  }

  public async init(type: string): Promise<void> {
    this._type = type;
  }
}

export default new Registry();
