import {
  AudioSourceFactory,
  AudioSourceFactoryDependencies,
} from "./audio-sources/factory";
import { Microphone } from "./audio-sources/microphone";
import { WebsocketAudio } from "./audio-sources/websocket";
import { WebRTCManager } from "./connections/peer";
import { Settings, getSettings } from "./settings";
import { VideoSinkFactory } from "./video-sinks/factory";
import { VideoSinkType } from "./video-sinks/types";
import { Butterchurn } from "./visualizer";

// @ts-expect-error
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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

function createDependencies(
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

async function applicationFactory() {
  const settings = await getSettings();

  const dependencies = createDependencies(audioContext, settings);

  const audioSourceFactory = new AudioSourceFactory(audioContext, dependencies);
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

  const butterchurn = new Butterchurn(
    audioContext,
    canvas as HTMLCanvasElement
  );

  const stream = await audioSource.getStream();
  butterchurn.connectStream(stream);

  butterchurn.render();

  if (settings.playReceivedAudio && !(audioSource instanceof Microphone)) {
    const node = audioSource.getNode();
    node.connect(audioContext.destination);
  }

  if (settings.videoSink) {
    const videoSinkFactory = new VideoSinkFactory();
    const videoSink = videoSinkFactory.createVideoSink(
      VideoSinkType.MediaRecorder
    );

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
