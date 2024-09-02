export interface AudioSource {
  getStream(): Promise<MediaStream>;
  getNode(): AudioNode;
}

export enum AudioSourceType {
  Microphone = "mic",
  Websocket = "websocket",
  Remote = "remote",
  WebRTC = "webrtc",
}

export function parseAudioSourceType(input: string): AudioSourceType {
  switch (input.toLowerCase()) {
    case AudioSourceType.Microphone:
      return AudioSourceType.Microphone;
    case AudioSourceType.Websocket:
      return AudioSourceType.Websocket;
    case AudioSourceType.Remote:
      return AudioSourceType.Remote;
    case AudioSourceType.WebRTC:
      return AudioSourceType.WebRTC;
    default:
      throw new Error("unknown audio source type");
  }
}
