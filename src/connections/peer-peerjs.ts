import { Peer } from "peerjs";
import { OutgoingSettingModifier } from "../common/outgoing-setting-modifier";
import { Settings } from "../settings";
import { VideoSink } from "../video-sinks/types";

export class PeerJSWebRTCManager implements VideoSink, OutgoingSettingModifier {
  peerMap: Record<string, Peer> = {};
  peer: Peer;
  stream!: MediaStream;

  constructor(protected canvas: HTMLCanvasElement) {
    const uuid = self.crypto.randomUUID();
    this.peer = new Peer(uuid);
    this.peerMap = {};

    this.connect();
  }

  modifyOutgoingSettings(_settings: Settings): Settings {
    const newSettings: Settings = {};
    newSettings.requestVideoFromPeerId = this.peer.id;
    return newSettings;
  }

  private getStream() {
    if (!this.stream) {
      return this.stream;
    }
    // Capture the canvas as a video stream
    this.stream = this.canvas.captureStream(30); // Capture at 30fps

    return this.stream;
  }

  private connect() {
    const t = this;

    // Respond to calls
    this.peer.on("call", (call) => {
      const stream = t.getStream();
      call.answer(stream);
    });
  }

  callPeer(peerId: string) {
    const createEmptyVideoTrack = ({
      width,
      height,
    }: {
      width: number;
      height: number;
    }) => {
      const canvas = Object.assign(document.createElement("canvas"), {
        width,
        height,
      });
      ((canvas as HTMLCanvasElement).getContext("2d") as any).fillRect(
        0,
        0,
        width,
        height
      );

      const stream = canvas.captureStream();
      const track = stream.getVideoTracks()[0];

      return Object.assign(track, { enabled: false });
    };

    const call = this.peer.call(
      peerId,
      new MediaStream([createEmptyVideoTrack({ width: 640, height: 480 })])
    );

    call.on("stream", function (stream) {
      const video = document.createElement("video");
      video.width = window.innerWidth;
      video.height = window.innerHeight;
      video.style.position = "absolute";

      video.srcObject = stream;
    });
  }

  captureVideoStream(_canvas: HTMLCanvasElement) {
    return;
  }
}
