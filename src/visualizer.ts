// @ts-expect-error
import butterchurn from "butterchurn";

// @ts-expect-error
import butterchurnPresets from "butterchurn-presets";

export class Butterchurn {
  visualizer: any;
  constructor(
    protected audioContext: AudioContext,
    protected canvas: HTMLCanvasElement
  ) {
    this.createVisualizer();
    this.listenForResizeEvents();
    this.loadPreset();
  }

  resize(event?: UIEvent) {
    const newWidth = event?.view?.innerWidth || window.innerWidth;
    const newHeight = event?.view?.innerHeight || window.innerHeight;

    if (this.canvas) {
      this.canvas.setAttribute("width", `${newWidth}`);
      this.canvas.setAttribute("height", `${newHeight}`);
    }

    this.visualizer.setRendererSize(newWidth, newHeight);
  }

  private listenForResizeEvents() {
    // resize visualizer on window resize
    window.addEventListener("resize", (ev) => {
      this.resize(ev);
    });
  }

  private createVisualizer() {
    // initialize the visualizer
    this.visualizer = butterchurn.createVisualizer(
      this.audioContext,
      this.canvas,
      {
        width: window.innerWidth,
        height: window.innerHeight,
      }
    );

    this.canvas.setAttribute("width", `${window.innerWidth}`);
    this.canvas.setAttribute("height", `${window.innerHeight}`);
  }

  connectStream(stream: MediaStream) {
    const source = this.audioContext.createMediaStreamSource(stream);
    this.visualizer.connectAudio(source);
  }

  loadPreset() {
    const presets = butterchurnPresets.getPresets();
    const preset =
      presets["Flexi, martin + geiss - dedicated to the sherwin maxawow"];
    this.visualizer.loadPreset(preset, 0.0); // 2nd argument is the number of seconds to blend presets
  }

  // Start render loop
  render() {
    const visualizer = this.visualizer;
    function r() {
      visualizer.render();
      requestAnimationFrame(r);
    }

    r();
  }
}
