import { SupportsAudioStream } from "../connections/attributes";
import { VideoSink } from "./types";

export class EmptyVideoSink implements VideoSink, SupportsAudioStream {
  audioStream?: MediaStream | undefined;

  addAudioStream(_audioStream: MediaStream): void {
    return;
  }

  captureVideoStream(_canvas: HTMLCanvasElement): void {
    return;
  }
}
