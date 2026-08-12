import { MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";
import type {
  AndroidWebViewProps,
  WebViewHttpErrorEvent,
} from "react-native-webview/lib/WebViewTypes";

import {
  MOBILE_APP_ORIGIN,
  MOBILE_APP_USER_AGENT,
  parseMobileBridgeMessage,
  type MobileBridgeMessage,
} from "../lib/mobile/appBridge";
import {
  sendAuthCallbackToWeb,
  sendMessageToWeb,
  type WebViewHandle,
} from "./src/nativeBridge";

const MobileWebView = WebView as unknown as ForwardRefExoticComponent<
  AndroidWebViewProps & RefAttributes<WebViewHandle>
>;

const APP_VERSION = Constants.expoConfig?.version ?? "0.1.0";
const APP_USER_AGENT = `${MOBILE_APP_USER_AGENT}/${APP_VERSION}`;
const WEB_ORIGIN = String(Constants.expoConfig?.extra?.webOrigin ?? MOBILE_APP_ORIGIN);
const INJECT_BEFORE_LOAD = `
  document.documentElement.classList.add("festibom-app");
  window.__FESTIBOM_APP__ = true;
  true;
`;

const tabs = [
  { label: "홈", path: "/", icon: "home-outline" },
  { label: "축제", path: "/festivals", icon: "calendar-month-outline" },
  { label: "아티스트", path: "/artists", icon: "account-music-outline" },
  { label: "마이페이지", path: "/mypage", icon: "account-outline" },
] as const;

type Tab = (typeof tabs)[number];

function normalizeInternalPath(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "festibom:") {
      const path = parsed.pathname.startsWith("/") ? parsed.pathname : `/${parsed.pathname}`;
      return `${path}${parsed.search}`;
    }
    if (parsed.origin === WEB_ORIGIN) return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
  return null;
}

function isBlockedPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

export default function App() {
  const webViewRef = useRef<WebViewHandle>(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [canGoBack, setCanGoBack] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [hasWebError, setHasWebError] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const retryPathRef = useRef("/");

  const source = useMemo(() => ({ uri: `${WEB_ORIGIN}${retryPathRef.current}` }), [reloadKey]);

  const sendReady = useCallback((token?: string) => {
    sendMessageToWeb(webViewRef, {
      type: "app:ready",
      payload: {
        platform: Platform.OS === "ios" ? "ios" : "android",
        version: APP_VERSION,
        ...(token ? { expoPushToken: token } : {}),
      },
    });
  }, []);

  const navigateToPath = useCallback((path: string) => {
    if (isBlockedPath(path)) return;
    setCurrentPath(path);
    webViewRef.current?.injectJavaScript(`window.location.assign(${JSON.stringify(path)}); true;`);
  }, []);

  const createExpoPushToken = useCallback(async () => {
    if (!Device.isDevice) return;
    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (typeof projectId !== "string" || projectId.startsWith("REPLACE_")) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Festibom 알림",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    setExpoPushToken(token);
    sendReady(token);
  }, [sendReady]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((permission) => {
      if (permission.status === "granted") {
        void createExpoPushToken();
      } else if (permission.status === "undetermined") {
        setShowNotificationPrompt(true);
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url !== "string") return;
      const path = normalizeInternalPath(url);
      if (path && !isBlockedPath(path)) navigateToPath(path);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url !== "string") return;
      const path = normalizeInternalPath(url);
      if (path && !isBlockedPath(path)) navigateToPath(path);
    });

    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("festibom://auth/callback")) return;
      const path = normalizeInternalPath(url);
      if (path && !isBlockedPath(path)) navigateToPath(path);
    });

    void Linking.getInitialURL().then((url) => {
      if (!url || url.startsWith("festibom://auth/callback")) return;
      const path = normalizeInternalPath(url);
      if (path && !isBlockedPath(path)) navigateToPath(path);
    });

    return () => {
      responseSubscription.remove();
      linkingSubscription.remove();
    };
  }, [createExpoPushToken, navigateToPath]);

  async function enableNotifications() {
    setShowNotificationPrompt(false);
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("알림을 사용할 수 없습니다", "Android 설정에서 Festibom 알림을 허용해 주세요.");
      return;
    }
    await createExpoPushToken();
  }

  async function exportImage(message: Extract<MobileBridgeMessage, { type: "image:export" }>) {
    const fileUri = `${FileSystem.cacheDirectory}${message.payload.filename}`;
    const base64 = message.payload.base64.replace(/^data:image\/png;base64,/, "");
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

    Alert.alert("일정 이미지", "이미지를 저장하거나 공유할 수 있습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "저장",
        onPress: () => void MediaLibrary.requestPermissionsAsync().then(async (permission) => {
          if (permission.granted) await MediaLibrary.createAssetAsync(fileUri);
        }),
      },
      {
        text: "공유",
        onPress: () => void Sharing.shareAsync(fileUri, { mimeType: "image/png" }),
      },
    ]);
  }

  async function handleBridgeMessage(raw: string) {
    const message = parseMobileBridgeMessage(raw);
    if (!message) return;

    if (message.type === "auth:start") {
      const result = await WebBrowser.openAuthSessionAsync(message.payload.url, "festibom://auth/callback");
      if (result.type === "success") {
        sendAuthCallbackToWeb(webViewRef, result.url, message.payload.returnPath);
      }
      return;
    }
    if (message.type === "navigation:changed") {
      const path = normalizeInternalPath(message.payload.url);
      if (path && !isBlockedPath(path)) setCurrentPath(path);
      return;
    }
    if (message.type === "image:export") {
      await exportImage(message);
      return;
    }
    if (message.type === "external:open") {
      await Linking.openURL(message.payload.url);
    }
  }

  function shouldStart(request: { url: string }) {
    const path = normalizeInternalPath(request.url);
    if (path) return !isBlockedPath(path);
    if (request.url === "about:blank") return true;
    if (/^(https:|mailto:)/.test(request.url)) void Linking.openURL(request.url);
    return false;
  }

  if (!isConnected || hasWebError) {
    return (
      <SafeAreaView style={styles.offline}>
        <StatusBar style="dark" />
        <Text style={styles.offlineTitle}>{isConnected ? "페이지를 불러오지 못했습니다" : "인터넷 연결이 없습니다"}</Text>
        <Text style={styles.offlineBody}>연결 상태를 확인한 뒤 다시 시도해 주세요.</Text>
        <Pressable style={styles.retryButton} onPress={() => {
          retryPathRef.current = currentPath;
          setHasWebError(false);
          setReloadKey((value) => value + 1);
        }}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <MobileWebView
        key={reloadKey}
        ref={webViewRef}
        source={source}
        applicationNameForUserAgent={APP_USER_AGENT}
        injectedJavaScriptBeforeContentLoaded={INJECT_BEFORE_LOAD}
        onMessage={(event: WebViewMessageEvent) => void handleBridgeMessage(event.nativeEvent.data)}
        onNavigationStateChange={(navigation: WebViewNavigation) => {
          setCanGoBack(navigation.canGoBack);
          const path = normalizeInternalPath(navigation.url);
          if (path && !isBlockedPath(path)) setCurrentPath(path);
        }}
        onShouldStartLoadWithRequest={shouldStart}
        onError={() => setHasWebError(true)}
        onHttpError={(event: WebViewHttpErrorEvent) => {
          if (event.nativeEvent.statusCode >= 500) setHasWebError(true);
        }}
        onLoadEnd={() => sendReady(expoPushToken)}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
      />

      {showNotificationPrompt && (
        <View style={styles.notificationPrompt}>
          <View style={styles.notificationTextWrap}>
            <Text style={styles.notificationTitle}>관심 소식을 알림으로 받기</Text>
            <Text style={styles.notificationBody}>좋아하는 아티스트 출연과 관심 축제 변경을 알려드립니다.</Text>
          </View>
          <Pressable style={styles.notificationButton} onPress={() => void enableNotifications()}>
            <Text style={styles.notificationButtonText}>알림 사용</Text>
          </Pressable>
          <Pressable onPress={() => setShowNotificationPrompt(false)} accessibilityLabel="알림 안내 닫기">
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.tabBar}>
        {tabs.map((tab: Tab) => {
          const selected = tab.path === "/" ? currentPath === "/" : currentPath.startsWith(tab.path);
          return (
            <Pressable key={tab.path} style={styles.tab} onPress={() => navigateToPath(tab.path)}>
              <MaterialCommunityIcons name={tab.icon} size={23} color={selected ? "#111827" : "#8b8b8b"} />
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  tabBar: { minHeight: 64, flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#dddddd", backgroundColor: "#ffffff", paddingBottom: 4 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabLabel: { color: "#8b8b8b", fontSize: 11, fontWeight: "600" },
  tabLabelSelected: { color: "#111827" },
  notificationPrompt: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#dddddd", backgroundColor: "#ffffff", paddingHorizontal: 14, paddingVertical: 12 },
  notificationTextWrap: { flex: 1 },
  notificationTitle: { color: "#111827", fontSize: 13, fontWeight: "700" },
  notificationBody: { marginTop: 2, color: "#666666", fontSize: 11, lineHeight: 16 },
  notificationButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  notificationButtonText: { color: "#111827", fontSize: 12, fontWeight: "700" },
  closeText: { color: "#8b8b8b", fontSize: 22, lineHeight: 24 },
  offline: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", padding: 24 },
  offlineTitle: { color: "#111827", fontSize: 18, fontWeight: "700" },
  offlineBody: { marginTop: 8, color: "#6b7280", fontSize: 14 },
  retryButton: { marginTop: 20, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { color: "#111827", fontSize: 14, fontWeight: "700" },
});
