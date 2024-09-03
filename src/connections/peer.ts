import type SimplePeer from "simple-peer";
import { AudioSource } from "../audio-sources/types";
import { VideoSink } from "../video-sinks/types";

interface WebRTCManagerOptions {
  signalingServerUrl: string;
}

const defaultOptions: WebRTCManagerOptions = {
  signalingServerUrl: "ws://localhost:7584",
};

// @ts-expect-error
const Peer: SimplePeer = window.SimplePeer as any;

export class WebRTCManager implements AudioSource, VideoSink {
  ws: WebSocket;
  peerConnection: SimplePeer.Instance;
  peerMap: Record<string, SimplePeer.Instance> = {};
  private incomingAudio?: MediaStreamTrack;
  private incomingAudioResolve?: (value: void | PromiseLike<void>) => void;
  private audioNode!: MediaStreamAudioSourceNode;

  private makeOptions(options?: Partial<WebRTCManagerOptions>) {
    return {
      ...defaultOptions,
      ...(options || {}),
    };
  }

  constructor(
    protected audioContext: AudioContext,
    options?: Partial<WebRTCManagerOptions>
  ) {
    const opts = this.makeOptions(options);

    this.peerMap = {};

    this.ws = new WebSocket(opts.signalingServerUrl);
    this.peerConnection = new Peer({
      initiator: false,
      trickle: false,
    });

    this.audioContext = audioContext;

    this.connect();
  }

  private setIncomingAudio(audio: MediaStreamTrack) {
    this.incomingAudio = audio;

    console.log("Got incoming audio", audio);

    if (audio && this.incomingAudioResolve) {
      this.incomingAudioResolve();
      this.incomingAudioResolve = undefined; // Clear the resolve function after use
    }
  }

  private connect() {
    const t = this;

    this.peerConnection.on("signal", (data) => {
      console.log({ data });
      t.ws.send(JSON.stringify(data));
    });

    this.ws.onmessage = (event) => {
      const signal = JSON.parse(event.data);
      t.peerConnection.signal(signal);
    };

    this.peerConnection.on("connect", () => {
      console.log("WebRTC connection established");
    });

    this.peerConnection.on("error", (err) => {
      console.error("Error:", err);
    });

    this.peerConnection.on("close", () => {
      console.log("Connection closed");
    });

    // this.peerConnection.on("stream", (stream) => {
    //   t.setIncomingAudio(stream);
    // });

    this.peerConnection.on("track", (track) => {
      if (track.kind === "audio") {
        console.log("Received audio track:", track);
        t.setIncomingAudio(track);
      } else {
        console.warn("Received non-audio track:", track);
      }
    });
  }

  // Public method to check if incomingAudio is available
  incomingAudioAvailable(timeout = 10000) {
    if (this.incomingAudio) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.incomingAudioResolve = resolve;

      setTimeout(() => {
        if (this.incomingAudioResolve) {
          this.incomingAudioResolve = undefined;
          reject(new Error("Timeout: incomingAudio not available."));
        }
      }, timeout);
    });
  }

  private createMediaStream() {
    if (this.audioNode) {
      return this.audioNode.mediaStream;
    }

    if (!this.incomingAudio) {
      throw new Error("incoming audio was not attached yet!");
    }

    // Use the first audio track from the incoming media stream
    const mediaStream = new MediaStream([this.incomingAudio]);

    // Handle the remote stream (e.g., display it in a video element)
    const video = document.createElement("audio");
    document.body.appendChild(video);

    video.srcObject = mediaStream;
    video.play();

    this.audioNode = this.audioContext.createMediaStreamSource(mediaStream);

    return this.audioNode.mediaStream;
  }

  getNode(): AudioNode {
    console.log("Got audio node");

    if (!this.incomingAudio) {
      throw new Error("incoming audio was not attached yet!");
    }

    if (!this.audioNode) {
      this.createMediaStream();
    }

    return this.audioNode;
  }

  getStream(): Promise<MediaStream> {
    if (!this.incomingAudio) {
      throw new Error("incoming audio was not attached yet!");
    }

    const stream = this.createMediaStream();
    return Promise.resolve(stream);
  }

  captureVideoStream(canvas: HTMLCanvasElement) {
    // Capture the canvas as a video stream
    const videoStream = canvas.captureStream(30); // Capture at 30fps

    // Add the video stream to the WebRTC connection
    videoStream
      .getTracks()
      .forEach((track) => this.peerConnection.addTrack(track, videoStream));
  }
}
