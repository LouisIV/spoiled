import { SupportsAudioStream } from "../connections/attributes";
import { Connection } from "../connections/types";
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

export class MediaRecorderSink implements VideoSink, SupportsAudioStream {
  frameRate: number;
  mimeType: string;
  segmentLength: number;
  audioStream?: MediaStream;
  connection: Connection;

  private makeOptions(options?: Partial<MediaRecorderSinkOptions>) {
    return {
      ...defaultOptions,
      ...(options || {}),
    };
  }
  constructor(
    connection: Connection,
    options?: Partial<MediaRecorderSinkOptions>
  ) {
    const opts = this.makeOptions(options);
    this.connection = connection;
    this.frameRate = opts.frameRate;
    this.mimeType = opts.mimeType;
    this.segmentLength = opts.segmentLength;
  }

  addAudioStream(audioStream: MediaStream): void {
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
        this.connection.handleSegment(event);
      }
    };

    // Start recording the media streams
    mediaRecorder.start(this.segmentLength); // For every 2 seconds, call ondataavailable
  }
}
