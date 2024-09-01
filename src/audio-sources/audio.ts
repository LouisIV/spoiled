import { AudioSource } from "./types";

export class RemoteAudioFile implements AudioSource {
  constructor(
    protected audioContext: AudioContext,
    protected audioUrl: string
  ) {}

  getStream(callback: (stream: MediaStream) => void): void {
    // Fetch the remote audio file and decode it into an AudioBuffer

    fetch(this.audioUrl)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        // Create an AudioBufferSourceNode from the decoded AudioBuffer
        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;

        // Create a MediaStreamDestinationNode to capture the output as a MediaStream
        const destinationNode =
          this.audioContext.createMediaStreamDestination();

        // Connect the source node to the destination node
        sourceNode.connect(destinationNode);

        // Start playing the audio file
        sourceNode.start();

        // Provide the resulting MediaStream to the callback
        callback(destinationNode.stream);
      })
      .catch((error) => {
        console.error("Error loading or decoding the audio file:", error);
      });
  }
}
