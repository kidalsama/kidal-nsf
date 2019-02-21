import IApiRegistry, {IHandlePayloadContext} from "../../../../../../server/IApiRegistry";
import StoreService from "../StoreService";

interface IArgs {
  id: string;
  val: string;
}

interface IResults {
  id: string;
  val: string;
}

// 老夫写代码就是 Ctrl-C + Ctrl-V
// 返回值没有写void，这里有返回值，写IResults
class Registry implements IApiRegistry<IArgs, IResults | null> {
  private _type?: string;

  public get type(): string {
    return this._type!;
  }

  public async handle(context: IHandlePayloadContext<IArgs, IResults>): Promise<IResults | null> {
    // 解构参数方便编写
    const {id, val} = context.data;
    // 这里需要检查下id的合法性，因为是入门教程就不检查了
    // 返回
    return StoreService.S.set(id, val);
  }

  public async init(type: string): Promise<void> {
    this._type = type;
  }
}

export default new Registry();
