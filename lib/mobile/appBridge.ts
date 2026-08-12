export const MOBILE_APP_USER_AGENT = "FestibomApp";
export const MOBILE_APP_SCHEME = "festibom";
export const MOBILE_APP_ORIGIN = "https://festibom.com";

export type MobileBridgeMessage =
  | {
      type: "auth:start";
      payload: { url: string; returnPath: string };
    }
  | {
      type: "navigation:changed";
      payload: { url: string };
    }
  | {
      type: "image:export";
      payload: { filename: string; mimeType: "image/png"; base64: string };
    }
  | {
      type: "external:open";
      payload: { url: string };
    }
  | {
      type: "app:ready";
      payload: {
        platform: "android" | "ios";
        version: string;
        expoPushToken?: string;
      };
    };

type ParsedValue = object | string | number | boolean | null;
type RecordValue = Record<string, ParsedValue | undefined>;

function isRecord(value: ParsedValue | undefined): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeReturnPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isExternalUrl(value: string) {
  try {
    return ["https:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isExpoPushToken(value: string) {
  return /^(Exponent|Expo)PushToken\[[^\]]+\]$/.test(value);
}

export function parseMobileBridgeMessage(raw: string): MobileBridgeMessage | null {
  let parsed: object | string | number | boolean | null;

  try {
    parsed = JSON.parse(raw) as object | string | number | boolean | null;
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string" || !isRecord(parsed.payload)) {
    return null;
  }

  const payload = parsed.payload;

  switch (parsed.type) {
    case "auth:start":
      return typeof payload.url === "string" &&
        isHttpsUrl(payload.url) &&
        typeof payload.returnPath === "string" &&
        isSafeReturnPath(payload.returnPath)
        ? { type: parsed.type, payload: { url: payload.url, returnPath: payload.returnPath } }
        : null;
    case "navigation:changed":
      return typeof payload.url === "string" && payload.url.length <= 2048
        ? { type: parsed.type, payload: { url: payload.url } }
        : null;
    case "image:export":
      return typeof payload.filename === "string" &&
        /^[^\\/:*?"<>|]{1,120}\.png$/i.test(payload.filename) &&
        payload.mimeType === "image/png" &&
        typeof payload.base64 === "string" &&
        payload.base64.length <= 20_000_000
        ? {
            type: parsed.type,
            payload: {
              filename: payload.filename,
              mimeType: payload.mimeType,
              base64: payload.base64,
            },
          }
        : null;
    case "external:open":
      return typeof payload.url === "string" && isExternalUrl(payload.url)
        ? { type: parsed.type, payload: { url: payload.url } }
        : null;
    case "app:ready": {
      const token = payload.expoPushToken;
      if (
        (payload.platform !== "android" && payload.platform !== "ios") ||
        typeof payload.version !== "string" ||
        payload.version.length > 40 ||
        (token !== undefined && (typeof token !== "string" || !isExpoPushToken(token)))
      ) {
        return null;
      }

      return {
        type: parsed.type,
        payload: {
          platform: payload.platform,
          version: payload.version,
          ...(typeof token === "string" ? { expoPushToken: token } : {}),
        },
      };
    }
    default:
      return null;
  }
}

export function isFestibomApp(userAgent: string) {
  return userAgent.includes(`${MOBILE_APP_USER_AGENT}/`);
}

type NativeWebViewBridge = {
  postMessage: (message: string) => void;
};

export function postMessageToMobileApp(message: MobileBridgeMessage) {
  if (typeof window === "undefined") return false;

  const bridge = (window as Window & { ReactNativeWebView?: NativeWebViewBridge })
    .ReactNativeWebView;
  if (!bridge || !isFestibomApp(window.navigator.userAgent)) return false;

  bridge.postMessage(JSON.stringify(message));
  return true;
}
