import { AudioSource } from "./types";

export class WebsocketAudio implements AudioSource {
  private audioWorkletNode!: AudioWorkletNode;

  constructor(
    protected audioContext: AudioContext,
    protected webSocket: WebSocket
  ) {}

  getNode(): AudioNode {
    return this.audioWorkletNode;
  }

  async loadAudioWorklet() {
    // Load the worklet module
    await this.audioContext.audioWorklet.addModule(
      new URL("./streaming-processor.js", import.meta.url)
    );

    // Create the AudioWorkletNode
    this.audioWorkletNode = new AudioWorkletNode(
      this.audioContext,
      "streaming-processor"
    );

    console.log("Loaded audio worklet");
  }

  private handleWebSocketMessages() {
    this.webSocket.onmessage = (event) => {
      const audioData = event.data;

      if (typeof audioData === "string") {
        console.log("Got string data", audioData);
        return;
      }

      const arrayBufferPromise =
        audioData instanceof Blob
          ? audioData.arrayBuffer()
          : Promise.resolve(
              audioData instanceof ArrayBuffer ? audioData : audioData.buffer
            );

      arrayBufferPromise
        .then((arrayBuffer) => {
          if (!arrayBuffer) {
            console.error("Array Buffer Was Empty!");
            return;
          }

          return this.audioContext.decodeAudioData(arrayBuffer);
        })
        .then((audioBuffer) => {
          if (audioBuffer) {
            const channelData = audioBuffer.getChannelData(0); // Assuming mono audio

            // Send the channel data to the AudioWorkletProcessor
            this.audioWorkletNode.port.postMessage(channelData);
          }
        })
        .catch((error) => {
          console.error("Error decoding the audio data:", error);
        });
    };

    this.webSocket.onclose = () => {
      console.log("WebSocket closed, ending stream.");
    };
  }

  getStream(): Promise<MediaStream> {
    this.handleWebSocketMessages();
    const destinationNode = this.audioContext.createMediaStreamDestination();
    this.audioWorkletNode.connect(destinationNode);
    return Promise.resolve(destinationNode.stream);
  }
}
