import { AudioSource } from "./types";

export class WebsocketAudio implements AudioSource {
  private mediaSource!: MediaSource;
  private sourceBuffer!: SourceBuffer;
  private audioElement!: HTMLAudioElement;

  constructor(
    protected audioContext: AudioContext,
    protected webSocket: WebSocket
  ) {}

  //   async loadAudioWorklet() {
  //     // Dynamically import the worklet module using Vite's module system
  //     await this.audioContext.audioWorklet.addModule(
  //       new URL("./streaming-processor.js", import.meta.url)
  //     );
  //     console.log("Loaded worklet");
  //   }

  private initMediaSource() {
    this.mediaSource = new MediaSource();
    this.audioElement = document.getElementById(
      "audioElement"
    ) as HTMLAudioElement;
    this.audioElement.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener("sourceopen", () => {
      // Create a SourceBuffer for the audio stream (e.g., WebM format with Opus codec)
      this.sourceBuffer = this.mediaSource.addSourceBuffer("audio/mp3");
      this.sourceBuffer.mode = "sequence"; // Optional: set appending mode

      // Handle WebSocket messages after the source buffer is created
      this.handleWebSocketMessages();
    });
  }

  private handleWebSocketMessages() {
    this.webSocket.onmessage = (event) => {
      const audioData = event.data;

      if (typeof audioData === "string") {
        // Ignore non-binary data
        console.log("Got string data", audioData);
        return;
      }

      // Convert Blob to ArrayBuffer if needed
      const convertToBuffer = (blob: Blob) => {
        return new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        });
      };

      const arrayBufferPromise =
        audioData instanceof Blob
          ? convertToBuffer(audioData)
          : Promise.resolve(
              audioData instanceof ArrayBuffer ? audioData : audioData.buffer
            );

      arrayBufferPromise
        .then((arrayBuffer) => {
          if (!arrayBuffer) {
            console.error("Array Buffer Was Empty!");
            return;
          }

          // Append the ArrayBuffer to the SourceBuffer for playback
          if (!this.sourceBuffer.updating) {
            this.sourceBuffer.appendBuffer(arrayBuffer);
          } else {
            this.sourceBuffer.addEventListener(
              "updateend",
              () => {
                this.sourceBuffer.appendBuffer(arrayBuffer);
              },
              { once: true }
            );
          }
        })
        .catch((error) => {
          console.error("Error processing the audio data:", error);
        });
    };

    // this.webSocket.onclose = () => {
    //   console.log("WebSocket closed, ending stream.");
    //   this.sourceBuffer.addEventListener(
    //     "updateend",
    //     () => {
    //       this.mediaSource.endOfStream();
    //     },
    //     { once: true }
    //   );
    // };
  }

  getStream(callback: (stream: MediaStream) => void): void {
    this.initMediaSource(); // Initialize MediaSource and SourceBuffer

    // Create a MediaStreamDestinationNode to capture the output as a MediaStream
    const destinationNode = this.audioContext.createMediaStreamDestination();

    // this.audioElement.srcObject = destinationNode.stream;
    this.audioElement.play(); // Automatically start playing the stream

    // Connect the destination node to the AudioContext for further processing if needed
    this.audioContext
      .createMediaElementSource(this.audioElement)
      .connect(destinationNode);

    // Provide the resulting MediaStream to the callback
    callback(destinationNode.stream);
  }
}
