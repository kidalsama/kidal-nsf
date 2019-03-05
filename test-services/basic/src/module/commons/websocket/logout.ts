import {
  IWebSocketApiRegistry,
  IWebSocketProcessPayloadContext,
} from "../../../../../../src/server/websocket/WebSocketApiManager";

class Registry implements IWebSocketApiRegistry<void, void> {
  public readonly type: string = null!;

  public async processPayload(args: void, ctx: IWebSocketProcessPayloadContext): Promise<void> {
    const session = ctx.session!
    session.getConnectedAt()
    session.getAuthenticatedAt()
    session.getUin()
    session.requireUin()
    session.requireAuthenticatedAt()
    session.getContextValue("test")
    session.setContextValue("test", 1)
    session.getContextValue("test")
    session.logout()
  }
}

export default new Registry()
