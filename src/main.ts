import {
  AudioSourceFactory,
  AudioSourceFactoryDependencies,
} from "./audio-sources/factory";
import { Microphone } from "./audio-sources/microphone";
import { WebsocketAudio } from "./audio-sources/websocket";
import { GoogleCastSender } from "./cast";
import { WebRTCManager } from "./connections/peer";
import { PeerJSWebRTCManager } from "./connections/peer-peerjs";
import { ChromecastReceiver } from "./receiver";
import { Settings, getSettings } from "./settings";
import { Butterchurn } from "./visualizer";

// @ts-expect-error
const audioContext = new (window.AudioContext || window.webkitAudioContext)({
  sampleRate: 48000,
});

const canvas = document.getElementById("visualizerCanvas");

// // Create an audio element and set its source to the Node.js audio stream
// const audioElement = document.createElement("audio");
// audioElement.src = "http://localhost:3000/audio"; // Link to the Node.js server audio stream
// audioElement.controls = true; // Optional: Adds play/pause controls
// audioElement.autoplay = true; // Auto-play the audio when it's available
// document.body.appendChild(audioElement); // Attach the audio element to the page

// // initialize the visualizer
// const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
//   width: window.innerWidth,
//   height: window.innerHeight,
// });

// // get audioNode from audio source or microphone
// navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {

// });

// // When the audio is ready, connect it to the visualizer
// audioElement.addEventListener("canplay", () => {
//   const source = audioContext.createMediaElementSource(audioElement);
//   visualizer.connectAudio(source);
// });

// videoSink.captureVideoStream(canvas as HTMLCanvasElement);

function createAudioDependencies(
  audioContext: AudioContext,
  settings: Settings
): AudioSourceFactoryDependencies {
  const dependencies: AudioSourceFactoryDependencies = {};

  if (settings.signalingServerUrl) {
    dependencies.webRTC = new WebRTCManager(audioContext, {
      signalingServerUrl: settings.signalingServerUrl,
    });
  }

  if (settings.websocketUrl) {
    dependencies.socket = new WebSocket(settings.websocketUrl);
  }

  return dependencies;
}

// function createVideoDependencies(
//   audioDependencies: AudioSourceFactoryDependencies,
//   settings: Settings
// ): VideoSinkFactoryDependencies {
//   const dependencies: VideoSinkFactoryDependencies = {};

//   if (audioDependencies.webRTC) {
//     dependencies.webRTC = audioDependencies.webRTC;
//   }

//   if (settings.websocketUrl) {
//     dependencies.connection = new WebsocketConnection(settings.websocketUrl);
//   }

//   return dependencies;
// }

async function applicationFactory() {
  const chromecast = new ChromecastReceiver();

  const settings = await getSettings(chromecast);
  const peerJSManager = new PeerJSWebRTCManager(canvas as HTMLCanvasElement);

  const dependencies = createAudioDependencies(audioContext, settings);

  if (!chromecast.isTv()) {
    new GoogleCastSender(settings, [peerJSManager]);
  }

  if (settings.audioSource) {
    const audioSourceFactory = new AudioSourceFactory(
      audioContext,
      dependencies
    );
    const audioSource = audioSourceFactory.createAudioSource(
      settings.audioSource,
      settings
    );

    if (audioSource instanceof WebsocketAudio) {
      await audioSource.loadAudioWorklet();
    }

    if (audioSource instanceof WebRTCManager) {
      await audioSource.incomingAudioAvailable();
    }

    try {
      const butterchurn = new Butterchurn(
        audioContext,
        canvas as HTMLCanvasElement
      );

      const stream = await audioSource.getStream();
      butterchurn.connectStream(stream);

      butterchurn.render();
    } catch (err) {
      // Catch errors (for testing)
      console.error(err);
    }

    if (settings.playReceivedAudio && !(audioSource instanceof Microphone)) {
      const node = audioSource.getNode();
      node.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().then(() => {
        console.log("AudioContext resumed");
      });
    }
  }

  if (settings.requestVideoFromPeerId) {
    peerJSManager.callPeer(peerJSManager.peer.id);

    if (chromecast.isTv()) {
      chromecast.providePeerId(peerJSManager.peer.id);
    }
  }

  if (settings.videoSink) {
    console.log("Creating video sink");
    // const videoDependencies = createVideoDependencies(dependencies, settings);

    const videoSink = peerJSManager;

    // const videoSinkFactory = new VideoSinkFactory(videoDependencies);
    // const videoSink = videoSinkFactory.createVideoSink(settings.videoSink);

    console.log("Capturing video stream");
    videoSink?.captureVideoStream(canvas as HTMLCanvasElement);
  }
}

applicationFactory();

const startButton = document.getElementById("start");
if (startButton) {
  startButton.onclick = () => {
    audioContext.resume();
    startButton.style.display = "none";
  };
}

document.onclick = () => {
  if (audioContext.state === "running") {
    audioContext.suspend();
  } else {
    audioContext.resume();
  }
};
