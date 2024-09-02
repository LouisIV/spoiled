export interface SupportsAudioStream {
  audioStream?: MediaStream;
  addAudioStream(audioStream: MediaStream): void;
}
