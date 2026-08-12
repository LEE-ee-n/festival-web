"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  parseMobileBridgeMessage,
  postMessageToMobileApp,
} from "@/lib/mobile/appBridge";
import { registerCurrentPushDevice } from "@/lib/mobile/pushDevice";
import { supabase } from "@/lib/supabase/client";

const PENDING_DEVICE_KEY = "festibom:pending-push-device";

type PendingDevice = {
  token: string;
  platform: "android" | "ios";
  version: string;
};

function parsePendingDevice(raw: string | null): PendingDevice | null {
  if (!raw) return null;
  const message = parseMobileBridgeMessage(raw);
  if (message?.type !== "app:ready" || !message.payload.expoPushToken) return null;
  return {
    token: message.payload.expoPushToken,
    platform: message.payload.platform,
    version: message.payload.version,
  };
}
async function registerPendingDevice() {
  const pending = parsePendingDevice(window.sessionStorage.getItem(PENDING_DEVICE_KEY));
  if (!pending) return;

  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  try {
    await registerCurrentPushDevice(pending.token, pending.platform, pending.version);
    window.sessionStorage.removeItem(PENDING_DEVICE_KEY);
  } catch (error) {
    console.error("Failed to register mobile push device", error);
  }
}

export default function MobileAppBridge() {
  const pathname = usePathname();

  useEffect(() => {
    postMessageToMobileApp({
      type: "navigation:changed",
      payload: { url: window.location.href },
    });
  }, [pathname]);

  useEffect(() => {
    function handleNativeMessage(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      const raw = JSON.stringify(event.detail);
      const message = parseMobileBridgeMessage(raw);
      if (message?.type !== "app:ready" || !message.payload.expoPushToken) return;

      window.sessionStorage.setItem(PENDING_DEVICE_KEY, JSON.stringify(message));
      void registerPendingDevice();
    }

    window.addEventListener("festibom:native-message", handleNativeMessage);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => void registerPendingDevice());
    });

    return () => {
      window.removeEventListener("festibom:native-message", handleNativeMessage);
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
