import {
  IWebSocketApiRegistry,
  IWebSocketProcessPayloadContext,
} from "../../../../../../src/server/websocket/WebSocketApiManager";
import PayloadDispatcher from "../../../../../../src/server/PayloadDispatcher";

class Registry implements IWebSocketApiRegistry<void, void> {
  public readonly type: string = null!;

  public async processPayload(args: void, ctx: IWebSocketProcessPayloadContext): Promise<void> {
    PayloadDispatcher.S.addSyncFull("User", 1, {name: "test"})
    PayloadDispatcher.S.addSyncPartial("User", 1, "sex", "妖")
    ctx.session!.login(Math.random().toString())
  }
}

export default new Registry()
