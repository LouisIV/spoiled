class StreamingProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    console.log("Streaming Processor up");

    this.buffer = new Float32Array(0);
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    console.log("Got meessage");

    const newBuffer = event.data;
    const combinedBuffer = new Float32Array(
      this.buffer.length + newBuffer.length
    );
    combinedBuffer.set(this.buffer);
    combinedBuffer.set(newBuffer, this.buffer.length);
    this.buffer = combinedBuffer;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const channel = output[0];

    if (this.buffer.length > 0) {
      const bufferSize = channel.length;

      // Fill the output channel with data from the buffer
      channel.set(this.buffer.subarray(0, bufferSize));

      // Remove the played part of the buffer
      this.buffer = this.buffer.subarray(bufferSize);
    }

    return true;
  }
}

registerProcessor("streaming-processor", StreamingProcessor);
