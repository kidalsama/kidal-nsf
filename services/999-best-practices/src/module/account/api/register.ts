import IApiRegistry, {IHandlePayloadContext} from "../../../../../../server/IApiRegistry";
import UserService from "../UserService";

interface IArgs {
  username: string;
  password: string;
}

// 自动同步数据，不提供返回值
class Registry implements IApiRegistry<IArgs, void> {
  private _type?: string;

  public get type(): string {
    return this._type!;
  }

  public async handle(context: IHandlePayloadContext<IArgs, void>): Promise<void> {
    await UserService.S.register(context.session, context.data.username, context.data.password);
  }

  public async init(type: string): Promise<void> {
    this._type = type;
  }
}

export default new Registry();
