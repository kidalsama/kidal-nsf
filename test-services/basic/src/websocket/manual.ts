import {WebSocketMessageHandler} from "../../../../src/server/websocket/WebSocketServer";

export const close: WebSocketMessageHandler = async (payload, session) => {
  await session.sendMessage("closed")
  await session.close()
}

export const login: WebSocketMessageHandler = async (payload, session) => {
  await session.login(Math.random().toString())
}

export const logout: WebSocketMessageHandler = async (payload, session) => {
  await session.sendMessage("session-info", {
    connectedAt: session.connectedAt,
    authenticatedAt: session.authenticatedAt,
    uin: session.uin,
  })
  await session.logout()
}
