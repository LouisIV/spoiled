import { AudioSource } from "./types";

export class Microphone implements AudioSource {
  constructor(protected audioContext: AudioContext) {}

  getStream(callback: (stream: MediaStream) => void): void {
    // get audioNode from audio source or microphone
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      callback(stream);
    });
  }
}
