import { AudioSource } from "../audio-sources/types";
import { VideoSink } from "../video-sinks/types";

interface WebRTCManagerOptions {
  signalingServerUrl: string;
}

const defaultOptions: WebRTCManagerOptions = {
  signalingServerUrl: "ws://localhost:7584",
};

export class WebRTCManager implements AudioSource, VideoSink {
  ws: WebSocket;
  peerConnection: RTCPeerConnection;
  peerMap: Record<string, RTCPeerConnection> = {};
  private incomingAudio?: MediaStreamTrack;
  private incomingAudioResolve?: (value: void | PromiseLike<void>) => void;

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
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });

    this.peerConnection.onicegatheringstatechange = () => {
      console.log({ iceGatheringState: this.peerConnection.iceGatheringState });

      if (this.peerConnection.iceGatheringState === "complete") {
        const offer = this.peerConnection.localDescription;
        this.ws.send(JSON.stringify(offer));
      }
    };

    this.audioContext = new (window.AudioContext ||
      // @ts-expect-error
      window.webkitAudioContext)();

    this.connect();
  }
  getNode(): AudioNode {
    throw new Error("Method not implemented.");
  }

  private setIncomingAudio(audio: MediaStreamTrack) {
    this.incomingAudio = audio;
    if (audio && this.incomingAudioResolve) {
      this.incomingAudioResolve();
      this.incomingAudioResolve = undefined; // Clear the resolve function after use
    }
  }

  private connect() {
    const t = this;

    this.ws.onmessage = async (event) => {
      const desc = JSON.parse(event.data);

      console.log(desc);

      if (desc.type === "offer") {
        console.log("Received offer from server.");
        await t.peerConnection.setRemoteDescription(desc);
        const answer = await t.peerConnection.createAnswer();
        await t.peerConnection.setLocalDescription(answer);
        console.log("Sending answer to server.");
        t.ws.send(JSON.stringify(t.peerConnection.localDescription));
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        t.ws.send(JSON.stringify({ candidate: event.candidate }));
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", t.peerConnection.iceConnectionState);
    };

    // Handle receiving remote audio stream and using it with Web Audio API
    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === "audio") {
        this.setIncomingAudio(event.track);
      }
    };
  }

  // Public method to check if incomingAudio is available
  incomingAudioAvailable(timeout = 5000) {
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

  getStream(): Promise<MediaStream> {
    if (!this.incomingAudio) {
      throw new Error("incoming audio was not attached yet!");
    }

    const remoteStream = new MediaStream([this.incomingAudio]);

    return Promise.resolve(remoteStream);
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
