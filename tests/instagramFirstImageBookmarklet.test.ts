import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

import {
  buildInstagramFirstImageBookmarklet,
  buildInstagramFirstImageInstallerHtml,
} from "../crawler/bookmarklet/instagramFirstImageBookmarklet.ts";

function createInstagramPage() {
  const image = {
    src: "https://cdninstagram.example/small.jpg",
    currentSrc: "https://cdninstagram.example/current.jpg",
    srcset:
      "https://cdninstagram.example/640.jpg 640w, https://cdninstagram.example/1080.jpg 1080w",
    naturalWidth: 1080,
    naturalHeight: 1350,
    getBoundingClientRect: () => ({
      left: 0,
      right: 720,
      top: 0,
      bottom: 900,
    }),
  };
  const article = {
    querySelectorAll: (selector: string) => {
      if (selector === "img") return [image];
      return [];
    },
    getBoundingClientRect: () => ({
      left: 0,
      right: 720,
      top: 0,
      bottom: 900,
    }),
  };
  const dialog = {
    querySelector: (selector: string) => {
      if (selector === "img") return image;
      return null;
    },
    querySelectorAll: article.querySelectorAll,
    getBoundingClientRect: article.getBoundingClientRect,
  };

  return { article, dialog, image };
}

test("Instagram 상세 첫 사진을 WebP로 변환해 다운로드", async () => {
  const alerts: string[] = [];
  let clicked = false;
  let filename = "";
  let convertedType = "";
  let convertedQuality = 0;
  const { dialog } = createInstagramPage();
  const download = {
    href: "",
    set download(value: string) { filename = value; },
    click() { clicked = true; },
    remove() {},
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob(
      callback: (blob: { type: string }) => void,
      type: string,
      quality: number,
    ) {
      convertedType = type;
      convertedQuality = quality;
      callback({ type });
    },
  };
  class TestUrl extends URL {
    static createObjectURL() { return "blob:webp"; }
    static revokeObjectURL() {}
  }
  const bookmarklet = buildInstagramFirstImageBookmarklet()
    .slice("javascript:".length);

  await runInNewContext(bookmarklet, {
    location: {
      hostname: "www.instagram.com",
      pathname: "/p/ABC_123/",
    },
    document: {
      querySelectorAll: (selector: string) =>
        selector === '[role="dialog"]' ? [dialog] : [],
      createElement: (tagName: string) =>
        tagName === "canvas" ? canvas : download,
      body: { appendChild() {} },
    },
    window: {
      innerWidth: 1200,
      innerHeight: 1000,
      open: () => null,
    },
    fetch: async (url: string) => {
      assert.equal(url, "https://cdninstagram.example/1080.jpg");
      return {
        ok: true,
        blob: async () => ({ type: "image/jpeg" }),
      };
    },
    createImageBitmap: async () => ({
      width: 1080,
      height: 1350,
      close() {},
    }),
    URL: TestUrl,
    Date,
    Promise,
    alert: (message: string) => alerts.push(message),
    setTimeout: (callback: () => void) => callback(),
  });

  assert.equal(clicked, true);
  assert.match(filename, /^\d{8}-instagram-ABC_123\.webp$/);
  assert.equal(convertedType, "image/webp");
  assert.equal(convertedQuality, 0.92);
  assert.match(alerts[0], /WebP로 저장/);
});

test("WebP 변환이 차단되면 원본 사진을 새 탭으로 열기", async () => {
  const alerts: string[] = [];
  let openedUrl = "";
  const { dialog } = createInstagramPage();
  const bookmarklet = buildInstagramFirstImageBookmarklet()
    .slice("javascript:".length);

  await runInNewContext(bookmarklet, {
    location: {
      hostname: "instagram.com",
      pathname: "/p/ABC123/",
    },
    document: {
      querySelectorAll: () => [dialog],
    },
    window: {
      innerWidth: 1200,
      innerHeight: 1000,
      open: (url: string) => {
        openedUrl = url;
        return {};
      },
    },
    fetch: async () => {
      throw new Error("CORS blocked");
    },
    Date,
    Promise,
    alert: (message: string) => alerts.push(message),
  });

  assert.equal(openedUrl, "https://cdninstagram.example/1080.jpg");
  assert.match(alerts[0], /원본 사진을 새 탭/);
});

test("Instagram 계정 경로가 포함된 독립 상세 페이지에서도 저장한다", async () => {
  const alerts: string[] = [];
  let filename = "";
  const { article } = createInstagramPage();
  const download = {
    href: "",
    set download(value: string) { filename = value; },
    click() {},
    remove() {},
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob(callback: (blob: { type: string }) => void) {
      callback({ type: "image/webp" });
    },
  };
  class TestUrl extends URL {
    static createObjectURL() { return "blob:webp"; }
    static revokeObjectURL() {}
  }
  const bookmarklet = buildInstagramFirstImageBookmarklet()
    .slice("javascript:".length);

  await runInNewContext(bookmarklet, {
    location: {
      hostname: "www.instagram.com",
      pathname: "/gyeonggimusic/p/DbDN-kdk-DY/",
    },
    document: {
      querySelectorAll: (selector: string) => {
        if (selector === "article") return [article];
        return [];
      },
      querySelector: () => null,
      createElement: (tagName: string) =>
        tagName === "canvas" ? canvas : download,
      body: { appendChild() {} },
    },
    window: {
      innerWidth: 1200,
      innerHeight: 1000,
      open: () => null,
    },
    fetch: async () => ({
      ok: true,
      blob: async () => ({ type: "image/jpeg" }),
    }),
    createImageBitmap: async () => ({
      width: 1080,
      height: 1350,
      close() {},
    }),
    URL: TestUrl,
    Date,
    Promise,
    alert: (message: string) => alerts.push(message),
    setTimeout: (callback: () => void) => callback(),
  });

  assert.match(
    filename,
    /^\d{8}-instagram-DbDN-kdk-DY\.webp$/,
  );
  assert.match(alerts[0], /WebP로 저장/);
});

test("Instagram 게시물 상세 주소가 아니면 안내 후 중단", async () => {
  const alerts: string[] = [];
  const bookmarklet = buildInstagramFirstImageBookmarklet()
    .slice("javascript:".length);

  await runInNewContext(bookmarklet, {
    location: {
      hostname: "www.instagram.com",
      pathname: "/",
    },
    document: {
      querySelectorAll: () => [],
    },
    alert: (message: string) => alerts.push(message),
  });

  assert.match(alerts[0], /상세 화면/);
});

test("설치 HTML은 Instagram 북마클릿과 WebP 안내를 포함", () => {
  const html = buildInstagramFirstImageInstallerHtml();

  assert.match(html, /javascript:/);
  assert.match(html, /Instagram 첫 사진 저장/);
  assert.match(html, /독립 상세 페이지/);
  assert.match(html, /WebP/);
});
