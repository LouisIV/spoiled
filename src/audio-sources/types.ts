type GetStreamCallback = (stream: MediaStream) => void;

export interface AudioSource {
  getStream(callback: GetStreamCallback): void;
}
