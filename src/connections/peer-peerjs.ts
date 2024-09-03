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

    console.log("Peer ID", {
      uuid,
    });

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
      console.log("Reciving call", call.peer);
      const stream = t.getStream();
      call.answer(stream);
    });

    this.peer.on("connection", (conn) => {
      conn.on("data", function (data) {
        console.log("dc", { data });
      });

      conn.on("error", function (error) {
        console.error(error);
      });

      conn.on("open", function () {
        // Receive messages
        conn.on("data", function (data) {
          console.log("Received", data);
        });

        // Send messages
        conn.send("Hello!");
      });
    });
  }

  createMediaStreamFake(): MediaStream {
    const createEmptyAudioTrack = (): MediaStreamTrack => {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const destination = ctx.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      const track = destination.stream.getAudioTracks()[0];
      return Object.assign(track, { enabled: false }) as MediaStreamTrack;
    };

    const createEmptyVideoTrack = ({
      width,
      height,
    }: {
      width: number;
      height: number;
    }): MediaStreamTrack => {
      const canvas = Object.assign(document.createElement("canvas"), {
        width,
        height,
      });
      (canvas.getContext("2d") as any).fillRect(0, 0, width, height);
      const stream = canvas.captureStream();
      const track = stream.getVideoTracks()[0];
      return Object.assign(track, { enabled: false }) as MediaStreamTrack;
    };

    return new MediaStream([
      createEmptyAudioTrack(),
      createEmptyVideoTrack({ width: 640, height: 480 }),
    ]);
  }

  callPeer(peerId: string) {
    console.log("Calling peer", peerId);

    const dc = this.peer.connect(peerId);
    dc.on("open", () => {
      console.log("Established data connection");
    });
    dc.on("iceStateChanged", (state) => {
      console.log("ice state change", state);
    });
    dc.on("data", (data) => {
      console.log("dc data", data);
    });
    dc.on("error", (error) => {
      console.error(error);
    });

    console.log("Starting call");
    const fakeStream = this.createMediaStreamFake();
    const call = this.peer.call(peerId, fakeStream);

    call.on("stream", function (stream) {
      console.log("Got stream");
      const video = document.createElement("video");
      video.width = window.innerWidth;
      video.height = window.innerHeight;
      video.style.position = "absolute";

      video.srcObject = stream;
    });

    call.on("error", function (error) {
      console.error(error);
    });
  }

  captureVideoStream(_canvas: HTMLCanvasElement) {
    return;
  }
}
