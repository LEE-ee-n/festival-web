import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

import { buildTicketlinkBookmarklet } from "../crawler/bookmarklet/ticketlinkBookmarklet.ts";

test("티켓링크 상품 제목·날짜·URL을 JSON으로 저장한다", () => {
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
    href: "https://www.ticketlink.co.kr/product/12345?foo=bar",
    innerText: "테스트 페스티벌",
    textContent: "",
    parentElement: card,
    querySelector: () => null,
  };
  const bookmarklet = buildTicketlinkBookmarklet().slice("javascript:".length);

  runInNewContext(bookmarklet, {
    location: { hostname: "www.ticketlink.co.kr", href: "https://www.ticketlink.co.kr/search?query=test" },
    document: {
      querySelectorAll: () => [product, product],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl,
    Blob: TestBlob,
    Date,
    Set,
    Map,
    JSON,
    alert() {},
    setTimeout: (callback: () => void) => callback(),
  });

  const items = JSON.parse(blobParts[0]);
  assert.match(filename, /^\d{6}-TICKETLINK-crwal\.json$/);
  assert.equal(items.length, 1);
  assert.equal(items[0].source_url, "https://www.ticketlink.co.kr/product/12345");
  assert.equal(items[0].start_date, "2026-08-01");
  assert.equal(items[0].end_date, "2026-08-02");
});

test("같은 상품의 예매 버튼보다 제목·날짜 카드 정보를 우선한다", () => {
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const card = {
    innerText: "2026 도고 뮤직 포레스티벌 2026.08.15 ~ 2026.08.15 청년패스",
    textContent: "",
    parentElement: null,
  };
  const productCard = {
    href: "https://www.ticketlink.co.kr/product/777",
    innerText: "2026 도고 뮤직 포레스티벌",
    textContent: "",
    parentElement: card,
    querySelector: () => null,
  };
  const bookingButton = {
    href: "https://www.ticketlink.co.kr/product/777",
    innerText: "티켓링크 도고 예매",
    textContent: "",
    parentElement: null,
    querySelector: () => null,
  };
  const bookmarklet = buildTicketlinkBookmarklet().slice("javascript:".length);
  runInNewContext(bookmarklet, {
    location: { hostname: "www.ticketlink.co.kr", href: "https://www.ticketlink.co.kr/performance/14" },
    document: {
      querySelectorAll: () => [productCard, bookingButton],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Set, Map, JSON,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });
  const items = JSON.parse(blobParts[0]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "2026 도고 뮤직 포레스티벌");
  assert.equal(items[0].start_date, "2026-08-15");
});

test("상품명 요소를 먼저 찾고 같은 카드의 예매 링크를 연결한다", () => {
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const bookingAnchor = {
    href: "https://www.ticketlink.co.kr/product/888",
    innerText: "티켓링크 김천 예매",
    textContent: "",
    parentElement: null,
    querySelector: () => null,
    matches: () => true,
  };
  const card = {
    innerText: "[김천] 2026 김천 합창 페스티벌 8월의 환희 김천문화예술회관 2026.08.20 ~ 2026.08.20",
    textContent: "",
    parentElement: null,
    children: [],
    querySelector: () => bookingAnchor,
    matches: () => false,
  };
  const titleElement = {
    innerText: "[김천] 2026 김천 합창 페스티벌 8월의 환희",
    textContent: "",
    parentElement: card,
    children: [],
    querySelector: () => null,
    matches: () => false,
  };
  const bookmarklet = buildTicketlinkBookmarklet().slice("javascript:".length);
  runInNewContext(bookmarklet, {
    location: { hostname: "www.ticketlink.co.kr", href: "https://www.ticketlink.co.kr/performance/14" },
    document: {
      querySelectorAll: (selector: string) => selector === "body *" ? [titleElement] : [bookingAnchor],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Set, Map, JSON,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });
  const items = JSON.parse(blobParts[0]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "[김천] 2026 김천 합창 페스티벌 8월의 환희");
  assert.equal(items[0].source_url, "https://www.ticketlink.co.kr/product/888");
  assert.equal(items[0].start_date, "2026-08-20");
});

test("다음 페이지를 자동으로 넘기며 상품을 누적한다", async () => {
  let page = 1;
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const makeProduct = (id: string, title: string) => {
    const card = {
      innerText: title + " 2026.08.01 ~ 2026.08.02 서울",
      textContent: "",
      parentElement: null,
    };
    return {
      href: "https://www.ticketlink.co.kr/product/" + id,
      innerText: title,
      textContent: "",
      parentElement: card,
      querySelector: () => null,
    };
  };
  const firstProduct = makeProduct("100", "첫 페이지 페스티벌");
  const secondProduct = makeProduct("200", "두 번째 페이지 페스티벌");
  const nextButton = {
    innerText: "",
    textContent: "",
    className: "pagination-next",
    disabled: false,
    getAttribute: (name: string) => name === "aria-label" ? "다음 페이지" : null,
    click: () => { page = 2; },
  };

  const result = runInNewContext(buildTicketlinkBookmarklet().slice("javascript:".length), {
    location: { hostname: "www.ticketlink.co.kr", href: "https://www.ticketlink.co.kr/performance/14" },
    document: {
      querySelectorAll: (selector: string) => {
        if (selector === 'a[href*="/product/"]') return [page === 1 ? firstProduct : secondProduct];
        if (selector === "a,button") return page === 1 ? [nextButton] : [];
        if (selector === "body *") return [];
        return [];
      },
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Set, Map, JSON, Promise,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });
  await result;

  const items = JSON.parse(blobParts[0]);
  assert.deepEqual(items.map((item: { source_url: string }) => item.source_url), [
    "https://www.ticketlink.co.kr/product/100",
    "https://www.ticketlink.co.kr/product/200",
  ]);
});

test("href가 없는 상품을 React 내부 productId로 복원한다", async () => {
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const card = {
    innerText: "2026 도고 뮤직 포레스티벌 2026.08.15 ~ 2026.08.15 도고",
    textContent: "",
  };
  const list = {
    tagName: "UL",
    __reactProps_test: {
      children: [{
        props: {
          item: {
            productId: "77777",
            productName: "2026 도고 뮤직 포레스티벌",
          },
        },
      }],
    },
    querySelectorAll: (selector: string) => selector === "a.product_link" ? [card] : [],
  };

  const result = runInNewContext(buildTicketlinkBookmarklet().slice("javascript:".length), {
    location: { hostname: "www.ticketlink.co.kr", href: "https://www.ticketlink.co.kr/performance/14" },
    document: {
      querySelectorAll: (selector: string) => selector === "ul.product_grid_list, li.product_grid_item" ? [list] : [],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Set, Map, JSON, Promise, Object, Array,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });
  await result;

  const items = JSON.parse(blobParts[0]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "2026 도고 뮤직 포레스티벌");
  assert.equal(items[0].source_url, "https://www.ticketlink.co.kr/product/77777");
  assert.equal(items[0].start_date, "2026-08-15");
});

test("카드의 React fiber key를 티켓링크 상품 ID로 복원한다", async () => {
  let blobParts: string[] = [];
  const download = { href: "", set download(_value: string) {}, click() {}, remove() {} };
  class TestBlob { constructor(parts: string[]) { blobParts = parts; } }
  class TestUrl extends URL { static createObjectURL() { return "blob:test"; } static revokeObjectURL() {} }
  const image = { getAttribute: (name: string) => name === "alt" ? "티켓링크 테스트 페스티벌 예매" : null };
  const cardContainer = {
    parentElement: null,
    __reactFiber_test: { key: "63100" },
  };
  const card = {
    innerText: "인천 테스트 페스티벌 2026.08.29 ~ 2026.08.30",
    textContent: "",
    parentElement: cardContainer,
    querySelector: (selector: string) => selector === "img[alt]" ? image : null,
  };
  const result = runInNewContext(buildTicketlinkBookmarklet().slice("javascript:".length), {
    location: { hostname: "www.ticketlink.co.kr", href: "https://www.ticketlink.co.kr/performance/14" },
    document: {
      querySelectorAll: (selector: string) => selector === "a.product_link" ? [card] : [],
      createElement: () => download,
      body: { appendChild() {} },
    },
    URL: TestUrl, Blob: TestBlob, Date, Set, Map, WeakMap, WeakSet, JSON, Promise, Object, Array,
    alert() {}, setTimeout: (callback: () => void) => callback(),
  });
  await result;

  const items = JSON.parse(blobParts[0]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "테스트 페스티벌");
  assert.equal(items[0].source_url, "https://www.ticketlink.co.kr/product/63100");
  assert.equal(items[0].start_date, "2026-08-29");
  assert.equal(items[0].end_date, "2026-08-30");
});
