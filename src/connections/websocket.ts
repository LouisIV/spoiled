export class WebsocketConnection {
  socket: WebSocket;

  constructor(socketUrl: string) {
    this.socket = new WebSocket(socketUrl);
  }

  handleSegment(event: BlobEvent) {
    this.sendSegmentInChunks(event.data);
  }

  private sendSegmentInChunks(segmentBlob: Blob) {
    const chunkSize = 64 * 1024; // 64KB chunks
    const timestamp = Date.now(); // Current timestamp in milliseconds

    const totalChunks = Math.ceil(segmentBlob.size / chunkSize);

    console.log({ totalChunks, timestamp });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, segmentBlob.size);
      const chunk = segmentBlob.slice(start, end);

      // Create metadata with timestamp as a Uint8Array
      const metadata = new ArrayBuffer(12);
      const view = new DataView(metadata);
      view.setUint32(0, timestamp); // Timestamp (4 bytes)
      view.setUint16(4, i); // Chunk index (2 bytes)
      view.setUint16(6, totalChunks); // Total chunks (2 bytes)
      view.setUint32(8, end - start); // Chunk size (4 bytes)

      // Create a Blob with the metadata and the chunk
      const dataToSend = new Blob([metadata, chunk]);

      // Send chunk over WebSocket
      this.socket.send(dataToSend);
    }

    console.log("finished sending chunk");
  }
}
