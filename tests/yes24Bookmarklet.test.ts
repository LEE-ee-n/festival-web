import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import { buildYes24TicketBookmarklet } from "../crawler/bookmarklet/yes24TicketBookmarklet.ts";

test("YES24 상품 제목·날짜·URL을 JSON으로 저장한다", () => {
  let filename = "";
  let blobParts: string[] = [];
  const download = {
    href: "",
    set download(value: string) { filename = value; },
    click() {},
    remove() {},
  };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL {
    static createObjectURL() { return "blob:test"; }
    static revokeObjectURL() {}
  }
  const card = {
    innerText: "테스트 페스티벌 2026.08.01 ~ 2026.08.02 서울",
    textContent: "",
    parentElement: null,
  };
  const product = {
    href: "https://ticket.yes24.com/Perf/54504?foo=bar",
    innerText: "테스트 페스티벌",
    textContent: "",
    parentElement: card,
    querySelector: () => null,
  };

  runInNewContext(buildYes24TicketBookmarklet().slice("javascript:".length), {
    location: { hostname: "ticket.yes24.com", href: "https://ticket.yes24.com/New/Genre/GenreList.aspx" },
    document: {
      querySelectorAll: (selector: string) => selector === "body *" ? [] : [product, product],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Map, JSON,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });

  const items = JSON.parse(blobParts[0]);
  assert.match(filename, /^\d{6}-YES24-crwal\.json$/);
  assert.equal(items.length, 1);
  assert.equal(items[0].source_url, "https://ticket.yes24.com/Perf/54504");
  assert.equal(items[0].start_date, "2026-08-01");
  assert.equal(items[0].end_date, "2026-08-02");
});

test("YES24의 예전 IdPerf 링크도 현재 상품 URL로 통일한다", () => {
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const product = {
    href: "https://ticket.yes24.com/New/Perf/Detail/Detail.aspx?IdPerf=12345",
    innerText: "SUMMER FESTIVAL 2026",
    textContent: "",
    parentElement: null,
    querySelector: () => null,
  };

  runInNewContext(buildYes24TicketBookmarklet().slice("javascript:".length), {
    location: { hostname: "ticket.yes24.com", href: "https://ticket.yes24.com/New/Genre/GenreList.aspx" },
    document: {
      querySelectorAll: (selector: string) => selector === "body *" ? [] : [product],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Map, JSON,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });

  assert.equal(JSON.parse(blobParts[0])[0].source_url, "https://ticket.yes24.com/Perf/12345");
});

test("onclick 상품 링크를 읽고 페이지 전체 텍스트를 제목으로 사용하지 않는다", () => {
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const card = {
    innerText: "2026 부산국제록페스티벌 2026.10.02 ~ 2026.10.04 부산",
    textContent: "",
    parentElement: null,
  };
  const product = {
    href: "javascript:void(0)",
    innerText: "2026 부산국제록페스티벌",
    textContent: "",
    parentElement: card,
    querySelector: () => null,
    getAttribute: (name: string) => name === "onclick" ? "fnViewPerf('58497')" : "javascript:void(0)",
  };
  const pageWrapper = {
    innerText: "전체보기 국내뮤지션 해외뮤지션 페스티벌 " + "전체 상품 ".repeat(200),
    textContent: "",
    parentElement: null,
    children: [],
    querySelectorAll: () => [product],
    matches: () => false,
  };

  runInNewContext(buildYes24TicketBookmarklet().slice("javascript:".length), {
    location: { hostname: "ticket.yes24.com", href: "https://ticket.yes24.com/New/Genre/GenreList.aspx" },
    document: {
      querySelectorAll: (selector: string) => selector === "body *" ? [pageWrapper] : [product],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Map, JSON,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });

  const items = JSON.parse(blobParts[0]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "2026 부산국제록페스티벌");
  assert.equal(items[0].source_url, "https://ticket.yes24.com/Perf/58497");
  assert.equal(items[0].raw_title, "2026 부산국제록페스티벌 2026.10.02 ~ 2026.10.04 부산");
});
