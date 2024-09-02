import type Cast from "chromecast-caf-receiver";

// // Initialize the Cast Receiver Manager
// const context = cast.framework.CastReceiverContext.getInstance();

// const playerManager = context.getPlayerManager();

// // Define what happens when the receiver loads media
// context.addEventListener(cast.framework.system.EventType.READY, (event) => {
//   const media = event.media;
//   const customData = media.customData;

//   if (customData && customData.connectionDetails) {
//     const connectionDetails = customData.connectionDetails;
//     console.log("Received connection details:", connectionDetails);

//     // Example: Display the server URL in the console
//     const serverUrl = connectionDetails.serverUrl;
//     const token = connectionDetails.token;
//     console.log("Server URL:", serverUrl);
//     console.log("Token:", token);

//     // Here you can set up any connections or authenticate using the token
//     // For now, we'll just play the media.
//     const videoElement = document.getElementById("videoPlayer");
//     videoElement.src = media.contentId;
//   }
// });

// // Start the receiver manager
// context.start();

type CustomData =
  | Cast.framework.messages.MediaInformationCustomData
  | undefined;

const CUSTOM_DATA_SENTINEL = Symbol("custom-data");

export class ChromecastReceiver {
  private customData?: CustomData | typeof CUSTOM_DATA_SENTINEL;
  private customDataResolve?: (
    value: CustomData | PromiseLike<CustomData>
  ) => void;

  private context: Cast.framework.CastReceiverContext;
  private playerManager: Cast.framework.PlayerManager;

  constructor() {
    this.context = cast.framework.CastReceiverContext.getInstance();
    this.playerManager = this.context.getPlayerManager();

    if (this.isTv()) {
      this.setupCustomDataListener();
      this.context.start();
    }
  }

  private checkUserAgent() {
    const userAgent = navigator.userAgent.toLowerCase();

    return userAgent.includes("crkey") || userAgent.includes("google cast");
  }

  isTv() {
    const capabilities = this.context.getDeviceCapabilities();
    if (capabilities) {
      return capabilities.isTv || this.checkUserAgent();
    }

    return false;
  }

  getCustomData(timeout = 5000) {
    if (this.customData !== CUSTOM_DATA_SENTINEL) {
      Promise.resolve(this.customData);
    }

    return new Promise<CustomData>((resolve, reject) => {
      this.customDataResolve = resolve;

      setTimeout(() => {
        if (this.customDataResolve) {
          this.customDataResolve = undefined;
          reject(new Error("Timeout: customData not available."));
        }
      }, timeout);
    });
  }

  private setCustomData(customData: CustomData) {
    this.customData = customData;
    if (customData && this.customDataResolve) {
      this.customDataResolve(this.customData);
      this.customDataResolve = undefined;
    }
  }

  private setupCustomDataListener() {
    this.playerManager.addEventListener(
      cast.framework.events.EventType.MEDIA_STATUS,
      (event) => {
        if (event.mediaStatus) {
          const customData = event.mediaStatus.media?.customData;
          this.setCustomData(customData);
        }
      }
    );
  }
}
