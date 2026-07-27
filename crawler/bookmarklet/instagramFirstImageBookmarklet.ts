export function buildInstagramFirstImageBookmarklet(): string {
  const source = `(async () => {
    if (!/(^|\\.)instagram\\.com$/i.test(location.hostname)) {
      alert("Instagram 게시물 상세 화면에서 실행해주세요.");
      return;
    }

    const dialog = [...document.querySelectorAll('[role="dialog"]')]
      .find((element) => element.querySelector("img"));
    const scope = dialog;
    if (!scope) {
      alert("게시물 상세 팝업을 찾지 못했습니다. 게시물을 상세 화면으로 연 뒤 다시 실행해주세요.");
      return;
    }

    const scopeRect = scope.getBoundingClientRect();
    const candidates = [...scope.querySelectorAll("img")]
      .map((image) => {
        const rect = image.getBoundingClientRect();
        const visibleWidth = Math.max(
          0,
          Math.min(rect.right, scopeRect.right, window.innerWidth)
            - Math.max(rect.left, scopeRect.left, 0),
        );
        const visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, scopeRect.bottom, window.innerHeight)
            - Math.max(rect.top, scopeRect.top, 0),
        );
        const sourceSet = (image.srcset || "")
          .split(",")
          .map((item) => item.trim().split(/\\s+/)[0])
          .filter(Boolean);

        return {
          url: sourceSet.at(-1) || image.currentSrc || image.src,
          width: image.naturalWidth,
          height: image.naturalHeight,
          visibleArea: visibleWidth * visibleHeight,
        };
      })
      .filter((item) => item.width >= 300 && item.height >= 300)
      .filter((item) => /^https?:/i.test(item.url) && item.visibleArea > 0)
      .sort((a, b) => b.visibleArea - a.visibleArea);

    const imageUrl = candidates[0]?.url;
    if (!imageUrl) {
      alert("현재 상세 화면에서 저장할 첫 번째 사진을 찾지 못했습니다.");
      return;
    }

    const linkedPostPath = [...scope.querySelectorAll(
      'a[href*="/p/"], a[href*="/reel/"]',
    )]
      .map((anchor) => new URL(anchor.href, location.href).pathname)
      .find((pathname) => /^\\/(?:p|reel)\\/[^/]+\\/?$/i.test(pathname));
    const postId = (linkedPostPath || location.pathname)
      .match(/^\\/(?:p|reel)\\/([^/]+)/i)?.[1]
      ?.replace(/[^a-zA-Z0-9_-]/g, "") || "post";
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
    ].join("");
    const filename = date + "-instagram-" + postId + ".webp";

    try {
      const response = await fetch(imageUrl, {
        mode: "cors",
        credentials: "omit",
      });
      if (!response.ok) {
        throw new Error("image download failed");
      }

      const imageBlob = await response.blob();
      const bitmap = await createImageBitmap(imageBlob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("canvas context unavailable");
      }
      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      const webpBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob
            ? resolve(blob)
            : reject(new Error("webp conversion failed")),
          "image/webp",
          0.92,
        );
      });
      const objectUrl = URL.createObjectURL(webpBlob);
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = filename;
      document.body.appendChild(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      alert("첫 번째 사진을 WebP로 저장했습니다.");
    } catch {
      const opened = window.open(imageUrl, "_blank", "noopener,noreferrer");
      alert(opened
        ? "WebP 자동 변환이 차단되어 원본 사진을 새 탭으로 열었습니다."
        : "WebP 자동 변환이 차단됐고 새 탭도 열지 못했습니다. 팝업 허용 후 다시 실행해주세요.");
    }
  })()`;

  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buildInstagramFirstImageInstallerHtml(): string {
  const bookmarklet = escapeHtmlAttribute(
    buildInstagramFirstImageBookmarklet(),
  );

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Instagram 첫 사진 WebP 저장 북마클릿</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; color: #171717; }
    main { max-width: 680px; margin: 60px auto; padding: 32px; background: white; border: 1px solid #ddd; border-radius: 18px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    h1 { margin-top: 0; font-size: 26px; }
    ol { line-height: 1.9; padding-left: 22px; }
    .bookmarklet { display: inline-block; margin: 16px 0; padding: 14px 20px; color: white; background: #d62976; border-radius: 10px; font-weight: 700; text-decoration: none; cursor: grab; }
    .note { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>Instagram 첫 사진 WebP 저장</h1>
    <p>아래 버튼을 브라우저의 즐겨찾기 표시줄로 끌어놓으세요.</p>
    <a class="bookmarklet" href="${bookmarklet}">Instagram 첫 사진 저장</a>
    <ol>
      <li>Instagram 게시물을 상세 팝업으로 엽니다.</li>
      <li>캐러셀 첫 번째 사진이 보이는 상태인지 확인합니다.</li>
      <li>즐겨찾기 표시줄의 북마클릿을 클릭합니다.</li>
    </ol>
    <p class="note">첫 사진 한 장만 WebP로 저장합니다. 변환이 차단되면 원본 사진을 새 탭으로 엽니다.</p>
  </main>
</body>
</html>`;
}
