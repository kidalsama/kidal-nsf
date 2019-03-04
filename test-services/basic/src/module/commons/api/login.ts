import IApiRegistry, {IHandlePayloadContext} from "../../../../../../src/server/IApiRegistry";

class Registry implements IApiRegistry<void, void> {
  public readonly type: string = null!;

  public async handle(args: IHandlePayloadContext<void, void>): Promise<void> {
    args.session!.login(Math.random().toString())
  }
}

export default new Registry()
