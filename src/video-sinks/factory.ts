import { Connection } from "../connections/types";
import { MediaRecorderSink } from "./media-recorder";
import { EmptyVideoSink } from "./none";
import { VideoSinkType } from "./types";

export class VideoSinkFactory {
  constructor(protected connection?: Connection) {}

  createVideoSink(type: VideoSinkType) {
    if (type === VideoSinkType.None) {
      return new EmptyVideoSink();
    }

    if (type === VideoSinkType.MediaRecorder) {
      if (!this.connection) {
        throw new Error("connection was not provided!");
      }

      return new MediaRecorderSink(this.connection);
    }
  }
}
