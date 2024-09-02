export interface WebsocketSupportingFactory {
  socket?: WebSocket;
  addWebsocket(socket: WebSocket): void;
}
