import { WebRTCManager } from "../connections/peer";
import { Settings } from "../settings";
import { Microphone } from "./microphone";
import { RemoteAudioFile } from "./remote-audio";
import { AudioSourceType } from "./types";
import { WebsocketAudio } from "./websocket";

export interface AudioSourceFactoryDependencies {
  socket?: WebSocket;
  webRTC?: WebRTCManager;
}

export class AudioSourceFactory {
  /**
   * WebSocket (if needed). Must be added with
   * `addWebsocket` method
   * @see {addWebsocket}
   */
  socket?: WebSocket;

  /**
   * Reference to thew WebRTCManager
   */
  webRTC?: WebRTCManager;

  constructor(
    protected audioContext: AudioContext,
    deps?: AudioSourceFactoryDependencies
  ) {
    if (deps) {
      if (deps.socket) {
        this.socket = deps.socket;
      }

      if (deps.webRTC) {
        this.webRTC = deps.webRTC;
      }
    }
  }

  createAudioSource(type: AudioSourceType, settings: Settings) {
    if (type === AudioSourceType.Microphone) {
      return new Microphone(this.audioContext);
    }

    if (type === AudioSourceType.WebRTC) {
      if (!this.webRTC) {
        throw new Error("webRTC manager was not provided!");
      }

      return this.webRTC;
    }

    if (type === AudioSourceType.Remote) {
      if (!settings.audioUrl) {
        throw new Error("audioUrl was not provided in settings!");
      }

      return new RemoteAudioFile(this.audioContext, settings.audioUrl);
    }

    if (type == AudioSourceType.Websocket) {
      if (!this.socket) {
        throw new Error(
          "websocket audio was requested but no socket was provided!"
        );
      }

      return new WebsocketAudio(this.audioContext, this.socket);
    }

    throw new Error("Could not determine requested audio source!");
  }
}
