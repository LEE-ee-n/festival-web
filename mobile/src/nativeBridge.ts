import type { RefObject } from "react";

import type { MobileBridgeMessage } from "../../lib/mobile/appBridge";

export type WebViewHandle = {
  goBack: () => void;
  injectJavaScript: (script: string) => void;
};

export function sendMessageToWeb(
  webViewRef: RefObject<WebViewHandle | null>,
  message: MobileBridgeMessage,
) {
  const serialized = JSON.stringify(message);
  webViewRef.current?.injectJavaScript(`
    window.dispatchEvent(new CustomEvent("festibom:native-message", {
      detail: ${serialized}
    }));
    true;
  `);
}

export function sendAuthCallbackToWeb(
  webViewRef: RefObject<WebViewHandle | null>,
  callbackUrl: string,
  returnPath: string,
) {
  webViewRef.current?.injectJavaScript(`
    window.dispatchEvent(new CustomEvent("festibom:auth-callback", {
      detail: {
        url: ${JSON.stringify(callbackUrl)},
        returnPath: ${JSON.stringify(returnPath)}
      }
    }));
    true;
  `);
}
