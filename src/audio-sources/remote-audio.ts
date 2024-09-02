import { AudioSource } from "./types";

export class RemoteAudioFile implements AudioSource {
  sourceNode!: AudioNode;

  constructor(
    protected audioContext: AudioContext,
    protected audioUrl: string
  ) {}

  getNode(): AudioNode {
    return this.sourceNode;
  }

  getStream(): Promise<MediaStream> {
    // Fetch the remote audio file and decode it into an AudioBuffer
    return new Promise((resolve, reject) => {
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

          // Set the source node
          this.sourceNode = sourceNode;

          // Provide the resulting MediaStream to the callback
          resolve(destinationNode.stream);
        })
        .catch((error) => {
          console.error("Error loading or decoding the audio file:", error);
          reject(error);
        });
    });
  }
}
