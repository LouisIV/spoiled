import { AudioSource } from "./audio-sources/types";
import { VideoSink } from "./video-sinks/types";

interface WebRTCManagerOptions {
  signalingServerUrl: string;
}

const defaultOptions: WebRTCManagerOptions = {
  signalingServerUrl: "ws://localhost:7584",
};

export class WebRTCManager implements AudioSource, VideoSink {
  signalingSocket: WebSocket;
  peerConnection: RTCPeerConnection;

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
    this.signalingSocket = new WebSocket(opts.signalingServerUrl);
    this.peerConnection = new RTCPeerConnection();
    this.audioContext = new (window.AudioContext ||
      // @ts-expect-error
      window.webkitAudioContext)();
  }

  getStream(callback: (stream: MediaStream) => void) {
    // Handle receiving remote audio stream and using it with Web Audio API
    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === "audio") {
        const remoteStream = new MediaStream([event.track]);

        callback(remoteStream);

        // // Create a MediaStreamSourceNode from the remote audio stream
        // const source = audioContext.createMediaStreamSource(remoteStream);

        // // Connect the audio source to the visualizer
        // visualizer.connectAudio(source);
      }
    };
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
