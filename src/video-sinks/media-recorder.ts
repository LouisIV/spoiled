import { VideoSink } from "./types";

interface MediaRecorderSinkOptions {
  frameRate: number;
  mimeType: string;
  segmentLength: number;
}

const defaultOptions: MediaRecorderSinkOptions = {
  frameRate: 30,
  mimeType: "video/mp4;codecs=avc1",
  segmentLength: 5000,
};

export class MediaRecorderSink implements VideoSink {
  frameRate: number;
  mimeType: string;
  segmentLength: number;
  socket: WebSocket;
  audioStream: MediaStream | undefined;

  private makeOptions(options?: Partial<MediaRecorderSinkOptions>) {
    return {
      ...defaultOptions,
      ...(options || {}),
    };
  }
  constructor(
    socket: WebSocket,
    options?: Partial<MediaRecorderSinkOptions>,
    audioStream?: MediaStream
  ) {
    const opts = this.makeOptions(options);
    this.socket = socket;
    this.frameRate = opts.frameRate;
    this.mimeType = opts.mimeType;
    this.segmentLength = opts.segmentLength;
    this.audioStream = audioStream;
  }

  private getFinalStream(canvas: HTMLCanvasElement) {
    const videoStream = canvas.captureStream(this.frameRate); // Capture at 30fps

    if (this.audioStream) {
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...this.audioStream.getAudioTracks(),
      ]);
      return combinedStream;
    }

    return videoStream;
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

  captureVideoStream(canvas: HTMLCanvasElement): void {
    const stream = this.getFinalStream(canvas);

    // Create MediaRecorder to encode the media streams
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.mimeType,
    });

    // When data is available from the MediaRecorder
    mediaRecorder.ondataavailable = (event) => {
      // Send the data chunk over the WebSocket connection
      if (event.data && event.data.size > 0) {
        this.sendSegmentInChunks(event.data);
      }
    };

    // Start recording the media streams
    mediaRecorder.start(this.segmentLength); // For every 2 seconds, call ondataavailable
  }
}
