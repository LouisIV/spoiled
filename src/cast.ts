import type { cast as Cast, framework } from "chromecast-caf-sender";
import { OutgoingSettingModifier } from "./common/outgoing-setting-modifier";
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

  async updateSettings() {
    const castSession = this.castingContext.getCurrentSession();

    if (!castSession) {
      console.warn("cast session not available");
      return;
    }

    let currentSettings = { ...this.settings };

    if (this.outgoingSettingModifiers) {
      for (const modifier of this.outgoingSettingModifiers) {
        currentSettings = modifier.modifyOutgoingSettings(currentSettings);
      }
    }

    console.log("updateSettings", { currentSettings });

    await castSession.sendMessage("urn:x-cast:spoiled.update-settings", {
      type: "update-settings",
      settings: encodeSettingsForCustomData(currentSettings),
    });

    castSession.addMessageListener(
      "urn:x-cast:spoiled.provide-peer-id",
      (namespace, message) => {
        console.log({ namespace, message });
      }
    );
  }

  onAPIAvailable() {
    const t = this;
    console.log("Cast API configured");

    const castContainer = document.getElementById("cast-launcher-container");
    if (!castContainer) {
      throw new Error("Cast container not found!");
    }
    const castElement = document.createElement("google-cast-launcher");
    castContainer.appendChild(castElement);

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

            t.updateSettings();

            // Load media or perform other actions
            break;
          case (cast.framework as unknown as Framework).SessionState
            .SESSION_ENDED:
            console.log("Session ended");
            break;
        }
      }
    );
  }

  constructor(
    protected settings: Settings,
    protected outgoingSettingModifiers?: OutgoingSettingModifier[]
  ) {
    this.loadCastAPI();
  }
}
