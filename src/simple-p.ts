import Peer from "simple-peer";
import { AudioSource } from "./audio-sources/types";
import { VideoSink } from "./video-sinks/types";

interface SimplePeerManagerOptions {
  signalingServerUrl: string;
}

const defaultOptions: SimplePeerManagerOptions = {
  signalingServerUrl: "ws://localhost:7584",
};

export class SimplePeerManager implements AudioSource, VideoSink {
  peerConnection: Peer.Instance;

  private makeOptions(options?: Partial<SimplePeerManagerOptions>) {
    return {
      ...defaultOptions,
      ...(options || {}),
    };
  }

  constructor(options?: Partial<SimplePeerManagerOptions>) {
    const opts = this.makeOptions(options);
    // @ts-expect-error Injected from the browser
    this.peerConnection = new SimplePeer({
      initiator: true,
    });
  }

  getStream(callback: (stream: MediaStream) => void): void {
    this.peerConnection.on("track", (track, stream) => {
      callback(stream);
    });
  }

  captureVideoStream(canvas: HTMLCanvasElement): void {
    // Capture the canvas as a video stream
    const videoStream = canvas.captureStream(30); // Capture at 30fps

    // Add the video stream to the WebRTC connection
    videoStream
      .getTracks()
      .forEach((track) => this.peerConnection.addTrack(track, videoStream));
  }
}
