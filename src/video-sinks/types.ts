export interface VideoSink {
  captureVideoStream(canvas: HTMLCanvasElement): void;
}

export enum VideoSinkType {
  None = "none",
  MediaRecorder = "media",
  WebRTC = "webrtc",
}

export function parseVideoSinkType(input: string): VideoSinkType {
  switch (input.toLowerCase()) {
    case VideoSinkType.None:
      return VideoSinkType.None;
    case VideoSinkType.MediaRecorder:
      return VideoSinkType.MediaRecorder;
    case VideoSinkType.WebRTC:
      return VideoSinkType.WebRTC;
    default:
      throw new Error("unknown video sink type!");
  }
}
