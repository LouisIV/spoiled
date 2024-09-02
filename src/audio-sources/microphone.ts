import { AudioSource } from "./types";

export class Microphone implements AudioSource {
  constructor(protected audioContext: AudioContext) {}

  getNode(): AudioNode {
    throw new Error("Microphone cannot provide audio node");
  }

  async getStream(): Promise<MediaStream> {
    // get audioNode from audio source or microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  }
}
