import {
  IWebSocketApiRegistry,
  IWebSocketProcessPayloadContext,
} from "../../../../../../src/server/websocket/WebSocketApiManager";

class Registry implements IWebSocketApiRegistry<void, void> {
  public readonly type: string = null!;

  public async processPayload(args: void, ctx: IWebSocketProcessPayloadContext): Promise<void> {
    ctx.session!.kick()
  }
}

export default new Registry()
