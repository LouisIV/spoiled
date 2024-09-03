import { WebRTCManager } from "../connections/peer";
import { Connection } from "../connections/types";
import { MediaRecorderSink } from "./media-recorder";
import { EmptyVideoSink } from "./none";
import { VideoSinkType } from "./types";

export interface VideoSinkFactoryDependencies {
  connection?: Connection;
  webRTC?: WebRTCManager;
}
export class VideoSinkFactory {
  connection?: Connection;
  webRTC?: WebRTCManager;

  constructor(deps?: VideoSinkFactoryDependencies) {
    if (deps) {
      if (deps.connection) {
        this.connection = deps.connection;
      }

      if (deps.webRTC) {
        this.webRTC = deps.webRTC;
      }
    }
  }

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

    if (type === VideoSinkType.WebRTC) {
      if (!this.webRTC) {
        throw new Error("webRTC was not provided!");
      }

      return this.webRTC;
    }
  }
}
