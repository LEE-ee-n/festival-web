import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

import { buildNolTicketBookmarklet } from "../crawler/bookmarklet/nolTicketBookmarklet.ts";

test("북마클릿은 놀티켓 상품만 중복 없이 JSON 다운로드", () => {
  const alerts: string[] = [];
  let clicked = false;
  let filename = "";
  let blobParts: string[] = [];
  const download = {
    href: "",
    set download(value: string) { filename = value; },
    click() { clicked = true; },
    remove() {},
  };
  class TestBlob {
    constructor(parts: string[]) { blobParts = parts; }
  }
  class TestUrl extends URL {
    static createObjectURL() { return "blob:test"; }
    static revokeObjectURL() {}
  }
  const product = {
    href: "https://nol.yanolja.com/ticket/places/1/products/2",
    innerText: " 콘서트   테스트 페스티벌 ",
    textContent: "",
  };
  const bookmarklet = buildNolTicketBookmarklet().slice("javascript:".length);

  runInNewContext(bookmarklet, {
    location: { hostname: "nol.yanolja.com", href: "https://nol.yanolja.com/ticket" },
    document: {
      querySelectorAll: () => [product, product],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl,
    Blob: TestBlob,
    Date,
    Map,
    JSON,
    alert: (message: string) => alerts.push(message),
    setTimeout: (callback: () => void) => callback(),
  });

  assert.equal(clicked, true);
  assert.match(filename, /^\d{6}-NOL-crwal\.json$/);
  assert.equal(JSON.parse(blobParts[0]).length, 1);
  assert.match(alerts[0], /1개/);
});

test("놀티켓이 아닌 사이트에서는 실행 중단", () => {
  const alerts: string[] = [];
  const bookmarklet = buildNolTicketBookmarklet().slice("javascript:".length);
  runInNewContext(bookmarklet, {
    location: { hostname: "example.com" },
    alert: (message: string) => alerts.push(message),
  });
  assert.match(alerts[0], /놀티켓 목록 페이지/);
});
