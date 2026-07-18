export function buildNolTicketBookmarklet(): string {
  const source = `(() => {
    if (location.hostname !== "nol.yanolja.com") {
      alert("놀티켓 목록 페이지에서 실행해주세요.");
      return;
    }
    const productPath = /^\\/ticket\\/places\\/[^/]+\\/products\\/[^/]+$/;
    const itemsByUrl = new Map();
    for (const anchor of document.querySelectorAll('a[href*="/ticket/places/"][href*="/products/"]')) {
      const url = new URL(anchor.href, location.href);
      if (url.hostname !== "nol.yanolja.com" || !productPath.test(url.pathname)) continue;
      const title = (anchor.innerText || anchor.textContent || "").replace(/\\s+/g, " ").trim();
      if (!title) continue;
      url.hash = "";
      itemsByUrl.set(url.toString(), { title, source_url: url.toString() });
    }
    const items = [...itemsByUrl.values()];
    if (items.length === 0) {
      alert("현재 화면에서 놀티켓 상품을 찾지 못했습니다. 목록이 보인 뒤 다시 눌러주세요.");
      return;
    }
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [String(now.getFullYear()).slice(-2), pad(now.getMonth() + 1), pad(now.getDate())].join("");
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = \`\${date}-NOL-crwal.json\`;
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    alert(\`놀티켓 상품 \${items.length}개를 JSON으로 저장했습니다.\`);
  })()`;

  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buildNolBookmarkletInstallerHtml(): string {
  const bookmarklet = escapeHtmlAttribute(buildNolTicketBookmarklet());
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>놀티켓 목록 저장 북마클릿 설치</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; color: #171717; }
    main { max-width: 680px; margin: 60px auto; padding: 32px; background: white; border: 1px solid #ddd; border-radius: 18px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    h1 { margin-top: 0; font-size: 26px; }
    ol { line-height: 1.9; padding-left: 22px; }
    .bookmarklet { display: inline-block; margin: 16px 0; padding: 14px 20px; color: white; background: #6d28d9; border-radius: 10px; font-weight: 700; text-decoration: none; cursor: grab; }
    .note { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>놀티켓 목록 저장 설치</h1>
    <p>아래 보라색 버튼을 브라우저의 즐겨찾기 표시줄로 끌어놓으세요.</p>
    <a class="bookmarklet" href="${bookmarklet}">놀티켓 목록 저장</a>
    <ol>
      <li>즐겨찾기 표시줄이 없다면 <strong>Ctrl + Shift + B</strong>를 누릅니다.</li>
      <li>위 버튼을 즐겨찾기 표시줄로 드래그합니다.</li>
      <li>놀티켓 목록 페이지에서 해당 북마크를 클릭합니다.</li>
    </ol>
    <p class="note">현재 열린 화면의 상품 제목과 URL만 읽으며 다른 페이지를 자동 방문하지 않습니다.</p>
  </main>
</body>
</html>`;
}
