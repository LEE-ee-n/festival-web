export function buildYes24TicketBookmarklet(): string {
  const source = `(() => {
    if (location.hostname !== "ticket.yes24.com") {
      alert("YES24 티켓 콘서트 또는 페스티벌 목록에서 실행해 주세요.");
      return;
    }
    const festivalKeyword = /페스티벌|포레스티벌|페스타|festival|\\bfes(?:t(?:a)?)?\\b/i;
    const datePattern = /((?:19|20)\\d{2})[.\\-/]\\s*(\\d{1,2})[.\\-/]\\s*(\\d{1,2})\\.?(?:\\s*(?:~|-)\\s*((?:19|20)\\d{2})[.\\-/]\\s*(\\d{1,2})[.\\-/]\\s*(\\d{1,2})\\.?)?/;
    const productId = (anchor) => {
      const raw = [anchor.getAttribute?.("href") || anchor.href || "", anchor.getAttribute?.("onclick") || ""].join(" ");
      return raw.match(/\\/Perf\\/(\\d+)/i)?.[1]
        || raw.match(/[?&]IdPerf=(\\d+)/i)?.[1]
        || raw.match(/(?:fn|go|view|open)[A-Za-z_]*(?:perf|detail)?[A-Za-z_]*\\s*\\(\\s*['"]?(\\d{4,})/i)?.[1];
    };
    const isoDate = (year, month, day) => year && month && day
      ? [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-")
      : undefined;
    const textOf = (node) => (node?.innerText || node?.textContent || "").replace(/\\s+/g, " ").trim();
    const findContext = (anchor) => {
      let node = anchor;
      for (let depth = 0; node && depth < 7; depth += 1, node = node.parentElement) {
        const text = textOf(node);
        if (text.length <= 700 && datePattern.test(text)) return text;
      }
      return textOf(anchor);
    };
    const itemsByUrl = new Map();
    const save = (anchor, preferredTitle, preferredContext, bonus) => {
      const id = productId(anchor);
      if (!id || !/^\\d+$/.test(id)) return;
      const context = preferredContext || findContext(anchor);
      const imageTitle = anchor.querySelector?.("img[alt]")?.getAttribute("alt") || "";
      const titleSource = preferredTitle || textOf(anchor) || imageTitle || context;
      const titleDateMatch = titleSource.match(datePattern);
      const title = (titleDateMatch ? titleSource.slice(0, titleDateMatch.index) : titleSource).trim();
      if (!title) return;
      const dateMatch = context.match(datePattern);
      const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
      const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
      const sourceUrl = "https://ticket.yes24.com/Perf/" + id;
      const item = {
        title,
        source_url: sourceUrl,
        raw_title: context,
        ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
      };
      const score = bonus + (startDate ? 1000 : 0) + Math.min(context.length, 700)
        + (festivalKeyword.test(title) ? 500 : 0);
      const existing = itemsByUrl.get(sourceUrl);
      if (!existing || score > existing.score) itemsByUrl.set(sourceUrl, { score, item });
    };

    for (const anchor of document.querySelectorAll("a")) save(anchor, "", "", 0);

    for (const element of document.querySelectorAll("body *")) {
      const leafText = textOf(element);
      if (!leafText || leafText.length > 260 || !festivalKeyword.test(leafText)) continue;
      const childHasKeyword = [...(element.children || [])].some((child) => festivalKeyword.test(textOf(child)));
      if (childHasKeyword) continue;
      let node = element;
      let title = leafText;
      for (let depth = 0; node && depth < 9; depth += 1, node = node.parentElement) {
        const nodeText = textOf(node);
        if (nodeText.length > 700) continue;
        const nodeDateMatch = nodeText.match(datePattern);
        if (!nodeDateMatch && nodeText.length > title.length && nodeText.length <= 260 && festivalKeyword.test(nodeText)) title = nodeText;
        const anchors = node.matches?.("a") ? [node] : [...(node.querySelectorAll?.("a") || [])];
        const anchor = anchors.find((candidate) => productId(candidate));
        if (!anchor) continue;
        save(anchor, title, nodeDateMatch ? nodeText : "", 3000);
        break;
      }
    }

    const items = [...itemsByUrl.values()].map((entry) => entry.item);
    if (items.length === 0) {
      alert("현재 화면에서 YES24 페스티벌 상품을 찾지 못했습니다.");
      return;
    }
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [String(now.getFullYear()).slice(-2), pad(now.getMonth() + 1), pad(now.getDate())].join("");
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = date + "-YES24-crwal.json";
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    alert("YES24 페스티벌 상품 " + items.length + "개를 JSON으로 저장했습니다.");
  })()`;
  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buildYes24InstallerHtml(): string {
  const bookmarklet = escapeHtmlAttribute(buildYes24TicketBookmarklet());
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YES24 목록 저장 설치</title><style>body{font-family:Arial,sans-serif;background:#f5f5f5;color:#171717}main{max-width:680px;margin:60px auto;padding:32px;background:#fff;border:1px solid #ddd;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.08)}.bookmarklet{display:inline-block;margin:16px 0;padding:14px 20px;color:#fff;background:#e11d48;border-radius:10px;font-weight:700;text-decoration:none;cursor:grab}ol{line-height:1.9}.note{color:#555;font-size:14px}</style></head><body><main><h1>YES24 목록 저장 설치</h1><p>아래 버튼을 즐겨찾기 표시줄로 끌어놓으세요.</p><a class="bookmarklet" href="${bookmarklet}">YES24 목록 저장</a><ol><li>즐겨찾기 표시줄이 없다면 <strong>Ctrl + Shift + B</strong>를 누릅니다.</li><li>버튼을 즐겨찾기 표시줄로 드래그합니다.</li><li>YES24 페스티벌 목록에서 북마크를 클릭합니다.</li></ol><p class="note">현재 화면만 읽으며 상세 상품 페이지를 자동 방문하지 않습니다.</p></main></body></html>`;
}
