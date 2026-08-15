import type { GoogleDrivePickedFile } from "./types";

type PickerDocument = { id: string; name: string; mimeType: string; sizeBytes?: number | string };
type PickerResponse = { action: string; docs?: PickerDocument[] };
type PickerBuilder = {
  addView(view: unknown): PickerBuilder;
  setOAuthToken(token: string): PickerBuilder;
  setDeveloperKey(key: string): PickerBuilder;
  setAppId(id: string): PickerBuilder;
  enableFeature(feature: string): PickerBuilder;
  setCallback(callback: (data: PickerResponse) => void): PickerBuilder;
  build(): { setVisible(visible: boolean): void };
};
type GooglePickerApi = {
  Action: { PICKED: string };
  Feature: { MULTISELECT_ENABLED: string };
  DocsView: new () => { setMimeTypes(value: string): unknown };
  DocsUploadView: new () => { setIncludeFolders(included: boolean): unknown };
  PickerBuilder: new () => PickerBuilder;
};

declare global {
  interface Window {
    gapi?: { load(name: string, callback: () => void): void };
    google?: { picker: GooglePickerApi };
  }
}

type OpenGoogleDrivePickerInput = {
  accessToken: string;
  apiKey: string;
  appId: string;
  onPicked(files: GoogleDrivePickedFile[]): void;
};

const MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
].join(",");

let loader: Promise<void> | null = null;

export function loadGooglePicker() {
  if (window.google?.picker) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const finish = () => window.gapi?.load("picker", resolve);
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-picker="true"]');
    if (window.gapi) {
      finish();
      return;
    }
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.dataset.googlePicker = "true";
    script.onload = finish;
    script.onerror = () => reject(new Error("Google Picker를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return loader;
}

function mapPickerDocuments(files: PickerDocument[]): GoogleDrivePickedFile[] {
  return files.flatMap((file) => {
    const fileType = file.mimeType.startsWith("image/")
      ? "image"
      : file.mimeType.startsWith("video/")
        ? "video"
        : null;
    if (!fileType) return [];

    const parsedSize = typeof file.sizeBytes === "string" ? Number(file.sizeBytes) : file.sizeBytes;
    return [{
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: Number.isFinite(parsedSize) ? parsedSize ?? null : null,
      fileType,
    }];
  });
}

async function openPicker(input: OpenGoogleDrivePickerInput, mode: "select" | "upload") {
  await loadGooglePicker();
  const picker = window.google?.picker;
  if (!picker) throw new Error("Google Picker를 초기화하지 못했습니다.");

  const view = mode === "upload"
    ? new picker.DocsUploadView().setIncludeFolders(true)
    : new picker.DocsView().setMimeTypes(MEDIA_MIME_TYPES);

  new picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(input.accessToken)
    .setDeveloperKey(input.apiKey)
    .setAppId(input.appId)
    .enableFeature(picker.Feature.MULTISELECT_ENABLED)
    .setCallback((data) => {
      if (data.action !== picker.Action.PICKED) return;
      input.onPicked(mapPickerDocuments(data.docs ?? []));
    })
    .build()
    .setVisible(true);
}

export function openGoogleDrivePicker(input: OpenGoogleDrivePickerInput) {
  return openPicker(input, "select");
}

export function openGoogleDriveUploadPicker(input: OpenGoogleDrivePickerInput) {
  return openPicker(input, "upload");
}
