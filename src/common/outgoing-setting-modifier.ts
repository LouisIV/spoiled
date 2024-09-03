import { Settings } from "../settings";

export interface OutgoingSettingModifier {
  modifyOutgoingSettings(settings: Settings): Settings;
}
