export interface Connection {
  handleSegment(event: BlobEvent): void;
}
