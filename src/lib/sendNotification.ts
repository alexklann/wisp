import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export default async function pushNotification(title: string, body: string) {
  const appWindow = getCurrentWindow();

  const isWindowFocused = await appWindow.isFocused();
  if (!isWindowFocused) {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    if (permissionGranted) {
      sendNotification({ title, body });
    }
  }
}
