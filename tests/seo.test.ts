import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSitemapRoutes,
  createArtistDescription,
  createArtistJsonLd,
  createArtistPagePath,
  createArtistTitle,
  createBreadcrumbJsonLd,
  createFestivalDescription,
  createFestivalEventJsonLd,
  createFestivalPagePath,
  createFestivalTitle,
  isSafeHttpUrl,
  parseWonPrice,
  serializeJsonLd,
  type ArtistSeoData,
  type FestivalSeoData,
} from "../lib/seo.ts";

const festival: FestivalSeoData = {
  id: 76,
  name: "2026 테스트 페스티벌",
  start_date: "2026-09-05",
  end_date: "2026-09-06",
  location: "테스트 공연장",
  address: "서울특별시 테스트로 1",
  region: "서울",
  description: null,
  status: "scheduled",
};

test("축제와 아티스트 메타데이터 문구를 생성한다", () => {
  assert.equal(
    createFestivalTitle(festival.name),
    "2026 테스트 페스티벌 일정·라인업·티켓 | 페스티봄",
  );
  assert.match(
    createFestivalDescription(festival),
    /2026년 9월 5일부터 2026년 9월 6일까지/,
  );
  assert.match(
    createFestivalDescription(festival),
    /일정, 라인업, 타임테이블, 티켓 예매 정보를 확인하세요/,
  );
  assert.equal(
    createArtistTitle("체리필터"),
    "체리필터 출연 페스티벌 | 페스티봄",
  );
  assert.equal(
    createArtistDescription("체리필터"),
    "체리필터의 출연 예정 및 지난 페스티벌 일정과 공연 정보를 확인하세요.",
  );
});

test("축제 description은 출연진 일부를 자연스럽게 포함한다", () => {
  const description = createFestivalDescription(festival, [
    "체리필터",
    "실리카겔",
    "잔나비",
    "데이식스",
  ]);

  assert.match(description, /체리필터, 실리카겔, 잔나비 등 출연\./);
  assert.ok(!description.includes("데이식스"));
});

test("아티스트 description은 출연 페스티벌 이름을 포함한다", () => {
  assert.equal(
    createArtistDescription("체리필터", ["인천펜타포트락페스티벌"]),
    "체리필터의 인천펜타포트락페스티벌 출연 일정과 공연 정보를 확인하세요.",
  );
  assert.match(
    createArtistDescription("체리필터", [
      "인천펜타포트락페스티벌",
      "부산국제록페스티벌",
      "서울재즈페스티벌",
      "그랜드민트페스티벌",
    ]),
    /인천펜타포트락페스티벌, 부산국제록페스티벌, 서울재즈페스티벌 등 출연 일정/,
  );
});

test("canonical 경로 헬퍼는 상세 페이지 URL을 만든다", () => {
  assert.equal(createFestivalPagePath(76), "/festival/76");
  assert.equal(createArtistPagePath(12), "/artist/12");
});

test("축제 Event 구조화 데이터는 공개 화면 정보를 사용한다", () => {
  const jsonLd = createFestivalEventJsonLd(festival);

  assert.equal(jsonLd["@type"], "Event");
  assert.equal(jsonLd.name, festival.name);
  assert.equal(jsonLd.startDate, "2026-09-05");
  assert.equal(jsonLd.endDate, "2026-09-06");
  assert.equal(
    jsonLd.url,
    "https://festibom.com/festival/76",
  );
  assert.equal(
    jsonLd.eventStatus,
    "https://schema.org/EventScheduled",
  );
  assert.match(serializeJsonLd(jsonLd), /"@type":"Event"/);
});

test("종료된 축제는 EventCompleted 상태를 사용한다", () => {
  const jsonLd = createFestivalEventJsonLd({
    ...festival,
    status: "ended",
  });

  assert.equal(
    jsonLd.eventStatus,
    "https://schema.org/EventCompleted",
  );
});

test("Event 구조화 데이터는 실제 데이터가 있을 때만 선택 필드를 넣는다", () => {
  const withoutOptions = createFestivalEventJsonLd({
    ...festival,
    location: null,
    address: null,
    region: null,
  });

  assert.ok(!("location" in withoutOptions));
  assert.ok(!("performer" in withoutOptions));
  assert.ok(!("offers" in withoutOptions));
  assert.ok(!("image" in withoutOptions));

  const withOptions = createFestivalEventJsonLd(festival, {
    imageUrl: "https://img.example.com/poster.jpg",
    performers: [
      { name: "체리필터", artist_type: "band" },
      { name: "아이유", artist_type: "singer" },
      { name: "페기굴리", artist_type: "dj" },
      { name: "  ", artist_type: "band" },
    ],
    offer: {
      url: "https://ticket.example.com/76",
      price: 88000,
    },
  });

  assert.equal(
    withOptions.image,
    "https://img.example.com/poster.jpg",
  );
  assert.deepEqual(withOptions.performer, [
    { "@type": "MusicGroup", name: "체리필터" },
    { "@type": "Person", name: "아이유" },
    { "@type": "Person", name: "페기굴리" },
  ]);
  assert.deepEqual(withOptions.offers, {
    "@type": "Offer",
    url: "https://ticket.example.com/76",
    price: 88000,
    priceCurrency: "KRW",
  });
});

test("Event 구조화 데이터는 잘못된 URL과 가격 없는 예매를 넣지 않는다", () => {
  const jsonLd = createFestivalEventJsonLd(festival, {
    imageUrl: "javascript:alert(1)",
    offer: { url: "not a url", price: 10000 },
  });

  assert.ok(!("image" in jsonLd));
  assert.ok(!("offers" in jsonLd));
});

test("아티스트 구조화 데이터는 실제 데이터만 사용한다", () => {
  const artist: ArtistSeoData = {
    id: 12,
    name: "체리필터",
    artist_type: "band",
    image_url: "https://img.example.com/artist.png",
    instagram_url: "https://instagram.com/cherryfilter",
    featured_playlist_url:
      "https://www.youtube.com/playlist?list=PL123",
  };
  const jsonLd = createArtistJsonLd(artist);

  assert.equal(jsonLd["@type"], "MusicGroup");
  assert.equal(jsonLd.url, "https://festibom.com/artist/12");
  assert.equal(jsonLd.image, "https://img.example.com/artist.png");
  assert.deepEqual(jsonLd.sameAs, [
    "https://instagram.com/cherryfilter",
  ]);

  const singerJsonLd = createArtistJsonLd({
    ...artist,
    artist_type: "singer",
    image_url: null,
    instagram_url: null,
  });

  assert.equal(singerJsonLd["@type"], "Person");
  assert.ok(!("image" in singerJsonLd));
  assert.ok(!("sameAs" in singerJsonLd));
});

test("BreadcrumbList 구조화 데이터는 위치와 절대 URL을 만든다", () => {
  const jsonLd = createBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "전체 페스티벌", path: "/festivals" },
    { name: "2026 테스트 페스티벌", path: "/festival/76" },
  ]);

  assert.equal(jsonLd["@type"], "BreadcrumbList");
  assert.deepEqual(jsonLd.itemListElement, [
    {
      "@type": "ListItem",
      position: 1,
      name: "홈",
      item: "https://festibom.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "전체 페스티벌",
      item: "https://festibom.com/festivals",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "2026 테스트 페스티벌",
      item: "https://festibom.com/festival/76",
    },
  ]);
});

test("sitemap은 정적 페이지와 공개 데이터를 중복 없이 묶는다", () => {
  const routes = buildSitemapRoutes(
    [
      {
        id: 76,
        updated_at: "2026-08-01T00:00:00Z",
        created_at: "2026-07-01T00:00:00Z",
      },
      { id: 76, updated_at: null, created_at: null },
      { id: 77, updated_at: null, created_at: "2026-07-02T00:00:00Z" },
    ],
    [
      { id: 12, last_modified: "2026-08-02T00:00:00Z" },
      { id: 12, last_modified: null },
    ],
  );

  const urls = routes.map((route) => route.url);

  assert.ok(urls.includes("https://festibom.com"));
  assert.ok(urls.includes("https://festibom.com/festivals"));
  assert.ok(urls.includes("https://festibom.com/artists"));
  assert.equal(urls.length, new Set(urls).size);
  assert.equal(
    urls.filter((url) => url.endsWith("/festival/76")).length,
    1,
  );

  const festivalRoute = routes.find((route) =>
    route.url.endsWith("/festival/76"),
  );
  assert.equal(
    festivalRoute?.lastModified,
    "2026-08-01T00:00:00Z",
  );

  const fallbackRoute = routes.find((route) =>
    route.url.endsWith("/festival/77"),
  );
  assert.equal(
    fallbackRoute?.lastModified,
    "2026-07-02T00:00:00Z",
  );

  const artistRoute = routes.find((route) =>
    route.url.endsWith("/artist/12"),
  );
  assert.equal(
    artistRoute?.lastModified,
    "2026-08-02T00:00:00Z",
  );
});

test("URL·가격 파서는 안전한 값만 반환한다", () => {
  assert.equal(isSafeHttpUrl("https://festibom.com"), true);
  assert.equal(isSafeHttpUrl("http://festibom.com"), true);
  assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpUrl("not a url"), false);
  assert.equal(isSafeHttpUrl(null), false);

  assert.equal(parseWonPrice("1일권 88,000원"), 88000);
  assert.equal(parseWonPrice("얼리버드 99000원 / 현매 110,000원"), 99000);
  assert.equal(parseWonPrice("무료"), null);
  assert.equal(parseWonPrice(null), null);
});

test("JSON-LD 직렬화는 스크립트 태그를 이스케이프하고 undefined가 없다", () => {
  const serialized = serializeJsonLd({
    "@type": "Event",
    name: "<script>alert(1)</script>",
    missing: undefined,
  });

  assert.ok(serialized.includes("\\u003c"));
  assert.ok(!serialized.includes("<script>"));
  assert.ok(!serialized.includes("undefined"));
});
