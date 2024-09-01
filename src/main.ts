import { WebsocketAudio } from "./audio-sources/websocket";
import { MediaRecorderSink } from "./video-sinks/media-recorder";
import { Butterchurn } from "./visualizer";

// @ts-expect-error
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

console.log({ audioContext });

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

const socket = new WebSocket("ws://localhost:5187");

const audioSource = new WebsocketAudio(audioContext, socket);

await audioSource.loadAudioWorklet();

const videoSink = new MediaRecorderSink(socket, {
  frameRate: 30,
});

// const audioSource = new Microphone(
//   audioContext
//   // "http://localhost:3000/Catherine Miller Hunchin Master 114bpm.wav"
// );

const butterchurn = new Butterchurn(audioContext, canvas as HTMLCanvasElement);

// window.addEventListener("load", () => {
//   butterchurn.resize();
// });

audioSource.getStream((stream) => butterchurn.connectStream(stream));
butterchurn.render();

videoSink.captureVideoStream(canvas as HTMLCanvasElement);

const startButton = document.getElementById("start");
if (!startButton) {
  throw new Error("button not found");
}

startButton.onclick = (ev) => {
  audioContext.resume();
  startButton.style.display = "none";
};
