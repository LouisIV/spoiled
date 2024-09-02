import type { cast as Cast, framework } from "chromecast-caf-sender";
import { Settings, encodeSettingsForCustomData } from "./settings";
import { loadScript } from "./util/load-script";

type Framework = typeof Cast.framework;

export class GoogleCastSender {
  private castingContext!: framework.CastContext;

  async loadCastAPI() {
    console.log("Loading cast API");
    await loadScript(
      "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
    );

    this.setupCastAPI();
  }

  setupCastAPI() {
    const t = this;

    // @ts-expect-error
    window["__onGCastApiAvailable"] = function (isAvailable) {
      if (isAvailable) {
        t.onAPIAvailable();
      } else {
        alert("Not available");
      }
    };
  }

  castMedia() {
    var mediaInfo = new chrome.cast.media.MediaInfo(
      "https://louisiv.github.io/spoiled",
      ""
    );

    mediaInfo.customData = encodeSettingsForCustomData(this.settings);

    const castSession = this.castingContext.getCurrentSession();

    if (!castSession) {
      console.warn("cast session not available");
      return;
    }

    var request = new chrome.cast.media.LoadRequest(mediaInfo);
    castSession.loadMedia(request).then(
      function () {
        console.log("Load succeed");
      },
      function (errorCode) {
        console.log("Error code: " + errorCode);
      }
    );
  }

  onAPIAvailable() {
    console.log("Cast API configured");

    this.castingContext = (
      cast.framework as unknown as Framework
    ).CastContext.getInstance();

    // Set the chrome app stuff
    this.castingContext.setOptions({
      receiverApplicationId: "8584C79D",
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    this.castingContext.addEventListener(
      (cast.framework as unknown as Framework).CastContextEventType
        .CAST_STATE_CHANGED,
      function (event) {
        console.log("CAST_STATE_CHANGED", { event });
      }
    );

    this.castingContext.addEventListener(
      (cast.framework as unknown as Framework).CastContextEventType
        .SESSION_STATE_CHANGED,
      function (event) {
        console.log("SESSION_STATE_CHANGED", { event });

        switch (event.sessionState) {
          case (cast.framework as unknown as Framework).SessionState
            .SESSION_STARTED:
            console.log(
              "Session started on device: " +
                event.session.getCastDevice().friendlyName
            );
            // Load media or perform other actions
            break;
          case (cast.framework as unknown as Framework).SessionState
            .SESSION_ENDED:
            console.log("Session ended");
            break;
        }
      }
    );

    this.castMedia();
  }

  constructor(protected settings: Settings) {
    this.loadCastAPI();
  }
}
