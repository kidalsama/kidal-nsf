import IHttpServerInitializer from "../../../src/server/IServerInitializer";
import GraphQL from "./graphql/GraphQL";
import WebSocketServer from "../../../src/server/websocket/WebSocketServer";
import {close, login, logout} from "./websocket/manual";

export default {
  initGraphQLSchema(): { typeDefs: string[]; resolvers: any } {
    return {typeDefs: [GraphQL.schema], resolvers: GraphQL.resolvers}
  },
  initWebSocket(webSocketServer: WebSocketServer): void {
    webSocketServer.setMessageHandler("login", login)
    webSocketServer.setMessageHandler("logout", logout)
    webSocketServer.setMessageHandler("close", close)
  },
} as IHttpServerInitializer
