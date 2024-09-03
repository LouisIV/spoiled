import { AudioSourceType, parseAudioSourceType } from "./audio-sources/types";
import { ChromecastReceiver } from "./receiver";
import { VideoSinkType, parseVideoSinkType } from "./video-sinks/types";

export interface Settings {
  requestVideoFromPeerId?: string;

  audioSource?: AudioSourceType;
  videoSink?: VideoSinkType;

  /**
   * Specify the url for remote audio source.
   * NOTE: You still need to specify the audioSource as remote
   */
  audioUrl?: string;

  /**
   * Should the audio source be sent to speakers?
   */
  playReceivedAudio?: boolean;

  /**
   * Signaling server. If specified a WebRTC connection
   * manager will be created
   */
  signalingServerUrl?: string;

  /**
   * WebSocket server. If specified a WebSocket will be opened
   * and passed as a dependency
   */
  websocketUrl?: string;
}

export function encodeSettingsForCustomData(settings: Settings) {
  const result = { ...settings } as any;
  result["playReceivedAudio"] = `${settings.playReceivedAudio}`;
  return result;
}

export async function getSettings(
  chromecast: ChromecastReceiver
): Promise<Settings> {
  const settings: Settings = {
    audioSource: AudioSourceType.Microphone,
    playReceivedAudio: true,
  };

  if (chromecast.isTv()) {
    console.log("Determined to be running on TV");
    const customData: Record<string, any> | undefined =
      await chromecast.getCustomData();

    if (!customData) {
      throw new Error("Custom data was not provided!");
    }

    if (customData["audioSource"]) {
      settings.audioSource = parseAudioSourceType(customData["audioSource"]);
    }

    if (customData["audioUrl"]) {
      settings.audioUrl = customData["audioUrl"];
    }

    if (customData["playReceivedAudio"]) {
      settings.playReceivedAudio = customData["playReceivedAudio"] === "true";
    }

    if (customData["videoSink"]) {
      settings.videoSink = parseVideoSinkType(customData["videoSink"]);
    }

    if (customData["signalingServerUrl"]) {
      settings.signalingServerUrl = customData["signalingServerUrl"];
    }

    if (customData["websocketUrl"]) {
      settings.signalingServerUrl = customData["websocketUrl"];
    }
  } else {
    // Get the query string from the URL
    const queryString = window.location.search;

    // Create a URLSearchParams object
    const urlParams = new URLSearchParams(queryString);

    // We just default to mic if nothing is provided and we're not on Chromecast
    const audioSource = urlParams.get("audioSource");
    if (audioSource) {
      settings.audioSource = parseAudioSourceType(audioSource);
    }

    const audioUrl = urlParams.get("audioUrl");
    if (audioUrl) {
      settings.audioUrl = audioUrl;
    }

    const playReceivedAudio = urlParams.get("playReceivedAudio");
    if (playReceivedAudio) {
      settings.playReceivedAudio = playReceivedAudio === "true";
    }

    const videoSink = urlParams.get("videoSink");
    if (videoSink) {
      settings.videoSink = parseVideoSinkType(videoSink);
    }

    const signalingServerUrl = urlParams.get("signalingServerUrl");
    if (signalingServerUrl) {
      settings.signalingServerUrl = signalingServerUrl;
    }

    const websocketUrl = urlParams.get("websocketUrl");
    if (websocketUrl) {
      settings.websocketUrl = websocketUrl;
    }
  }

  console.log({ settings });

  return settings;
}
