const API_URL = "https://festibom.com/api/figma/card-news?year=2026&month=8";
const TEMPLATE_NAMES = [
  "cover_template",
  "festival_card_template",
  "festival_list_template",
  "closing_template",
];

const UI_HTML = `
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #090A1A; }
    main { padding: 20px; }
    h1 { margin: 0; font-size: 18px; }
    p { color: #505050; font-size: 13px; line-height: 1.5; }
    button { width: 100%; border: 0; border-radius: 8px; padding: 11px; color: white; background: #312E81; font-weight: 700; cursor: pointer; }
    button:disabled { background: #999; cursor: default; }
    #result { min-height: 20px; margin: 14px 0 0; font-size: 13px; white-space: pre-wrap; }
    .error { color: #C0364A; }
  </style>
  <main>
    <h1>2026년 8월 카드뉴스</h1>
    <p>현재 파일의 템플릿을 복제해 Festibom 축제 정보로 초안을 만듭니다.</p>
    <button id="generate" type="button">8월 초안 생성</button>
    <div id="result"></div>
  </main>
  <script>
    const button = document.getElementById("generate");
    const result = document.getElementById("result");
    button.addEventListener("click", () => {
      button.disabled = true;
      result.className = "";
      result.textContent = "데이터를 불러오는 중...";
      parent.postMessage({ pluginMessage: { type: "generate" } }, "*");
    });
    function blobToPngBytes(blob) {
      return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          if (!context) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("이미지 변환 화면을 만들지 못했습니다."));
            return;
          }
          context.drawImage(image, 0, 0);
          URL.revokeObjectURL(objectUrl);
          canvas.toBlob(async (pngBlob) => {
            if (!pngBlob) {
              reject(new Error("PNG 변환에 실패했습니다."));
              return;
            }
            resolve(new Uint8Array(await pngBlob.arrayBuffer()));
          }, "image/png");
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("포스터 이미지를 해석하지 못했습니다."));
        };
        image.src = objectUrl;
      });
    }
    window.onmessage = async (event) => {
      const message = event.data.pluginMessage;
      if (!message) return;

      if (message.type === "convert-image") {
        try {
          const response = await fetch(message.url);
          if (!response.ok) throw new Error("포스터 다운로드에 실패했습니다.");
          const bytes = await blobToPngBytes(await response.blob());
          parent.postMessage({
            pluginMessage: {
              type: "image-converted",
              requestId: message.requestId,
              bytes,
            },
          }, "*");
        } catch (error) {
          parent.postMessage({
            pluginMessage: {
              type: "image-converted",
              requestId: message.requestId,
              error: String(error && error.message ? error.message : error),
            },
          }, "*");
        }
        return;
      }

      button.disabled = false;
      result.className = message.type === "error" ? "error" : "";
      result.textContent = message.message;
    };
  </script>`;

figma.showUI(UI_HTML, { width: 320, height: 240, title: "Festibom 카드뉴스" });

let imageRequestSequence = 0;
const pendingImageRequests = new Map();

function convertImageToPng(url) {
  return new Promise((resolve, reject) => {
    imageRequestSequence += 1;
    const requestId = `image-${imageRequestSequence}`;
    const timeoutId = setTimeout(() => {
      pendingImageRequests.delete(requestId);
      reject(new Error("포스터 PNG 변환 시간이 초과되었습니다."));
    }, 30000);

    pendingImageRequests.set(requestId, {
      resolve: (bytes) => {
        clearTimeout(timeoutId);
        resolve(bytes);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    });
    figma.ui.postMessage({ type: "convert-image", requestId, url });
  });
}

function post(message, isError) {
  figma.ui.postMessage({ type: isError ? "error" : "success", message });
}

function findTemplate(name) {
  return figma.currentPage.findOne((node) => node.name === name) || null;
}

function findNamedNode(root, name) {
  return root.findOne((node) => node.name === name) || null;
}

async function setText(root, name, value) {
  const node = findNamedNode(root, name);

  if (!node) {
    throw new Error(`필수 텍스트 레이어가 없습니다: ${name}`);
  }

  if (node.type !== "TEXT") {
    throw new Error(`텍스트 레이어가 아닙니다: ${name}`);
  }

  const fontNames = node.fontName === figma.mixed
    ? node.getRangeAllFontNames(0, node.characters.length)
    : [node.fontName];

  for (const fontName of fontNames) {
    await figma.loadFontAsync(fontName);
  }

  node.characters = value;
}

function setVisible(root, name, visible) {
  const nodes = root.findAll((node) => node.name.startsWith(name));
  nodes.forEach((node) => {
    node.visible = visible;
  });
}

function setColor(root, name, colorHex) {
  const node = findNamedNode(root, name);

  if (!node || !("fills" in node)) {
    throw new Error(`색상 레이어가 없습니다: ${name}`);
  }

  const hex = colorHex.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;

  node.fills = [{ type: "SOLID", color: { r: red, g: green, b: blue } }];
}

async function setImage(root, name, url) {
  const node = findNamedNode(root, name);

  if (!node || !("fills" in node)) {
    throw new Error(`포스터 레이어가 없습니다: ${name}`);
  }

  const image = figma.createImage(await convertImageToPng(url));
  node.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
}

function rightMostX() {
  return figma.currentPage.children.reduce(
    (right, node) => Math.max(right, node.x + node.width),
    0,
  );
}

function createDraftCopy(template, name, x, y) {
  const copy = template.clone();
  copy.name = name;
  copy.x = x;
  copy.y = y;
  return copy;
}

async function fillFestivalCard(card, festival) {
  await setText(card, "festival_name", festival.name);
  await setText(card, "date_value", festival.dateText);
  await setText(card, "location_value", festival.locationText);
  await setText(card, "ticket_platform_value", festival.ticketPlatformText);
  await setText(card, "lineup_value", festival.lineupText);
  setColor(card, "festival_color_bar", festival.colorHex);

  if (!festival.thumbnailUrl) {
    throw new Error(`${festival.name}: 포스터 URL이 없습니다.`);
  }

  await setImage(card, "poster_image", festival.thumbnailUrl);
}

async function fillFestivalList(listCard, festivals) {
  for (let index = 0; index < 3; index += 1) {
    const itemNumber = index + 1;
    const festival = festivals[index];

    if (!festival) {
      setVisible(listCard, `item_${itemNumber}_`, false);
      continue;
    }

    await setText(listCard, `item_${itemNumber}_name`, festival.name);
    await setText(listCard, `item_${itemNumber}_date_value`, festival.dateText);
    await setText(listCard, `item_${itemNumber}_location_value`, festival.locationText);
    await setText(listCard, `item_${itemNumber}_lineup_value`, festival.lineupText);
    setColor(listCard, `item_${itemNumber}_header`, festival.colorHex);
  }
}

function getTemplateMap() {
  const missing = TEMPLATE_NAMES.filter((name) => !findTemplate(name));

  if (missing.length > 0) {
    throw new Error(`현재 페이지에 템플릿이 없습니다:\n${missing.join("\n")}`);
  }

  return Object.fromEntries(
    TEMPLATE_NAMES.map((name) => [name, findTemplate(name)]),
  );
}

async function generateDraft() {
  const templates = getTemplateMap();
  const response = await fetch(API_URL);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Festibom 데이터를 불러오지 못했습니다.");
  }

  const draft = await response.json();
  if (draft.totalFestivalCount === 0) {
    throw new Error("2026년 8월에 생성할 페스티벌이 없습니다.");
  }

  let x = rightMostX() + 160;
  const y = Math.min(...figma.currentPage.children.map((node) => node.y));
  const copies = [];

  try {
    const cover = createDraftCopy(templates.cover_template, "draft_2026_08_cover", x, y);
    copies.push(cover);
    await setText(cover, "cover_eyebrow", draft.coverEyebrow);
    await setText(cover, "cover_title", draft.coverTitle);
    x += cover.width + 80;

    for (const festival of draft.festivalCards) {
      const card = createDraftCopy(
        templates.festival_card_template,
        `draft_2026_08_festival_${festival.id}`,
        x,
        y,
      );
      copies.push(card);
      await fillFestivalCard(card, festival);
      x += card.width + 80;
    }

    for (let index = 0; index < draft.festivalLists.length; index += 1) {
      const listCard = createDraftCopy(
        templates.festival_list_template,
        `draft_2026_08_list_${index + 1}`,
        x,
        y,
      );
      copies.push(listCard);
      await fillFestivalList(listCard, draft.festivalLists[index]);
      x += listCard.width + 80;
    }

    const closing = createDraftCopy(templates.closing_template, "draft_2026_08_closing", x, y);
    copies.push(closing);
  } catch (error) {
    copies.forEach((copy) => copy.remove());
    throw error;
  }

  figma.currentPage.selection = copies;
  figma.viewport.scrollAndZoomIntoView(copies);

  return `${draft.totalFestivalCount}개 축제 초안을 만들었습니다.\n포스터 카드 ${draft.festivalCards.length}장 / 목록 카드 ${draft.festivalLists.length}장`;
}

figma.ui.onmessage = async (message) => {
  if (message.type === "image-converted") {
    const pendingRequest = pendingImageRequests.get(message.requestId);
    if (!pendingRequest) return;

    pendingImageRequests.delete(message.requestId);
    if (message.error) {
      pendingRequest.reject(new Error(message.error));
    } else {
      pendingRequest.resolve(new Uint8Array(message.bytes));
    }
    return;
  }

  if (message.type !== "generate") return;

  try {
    const result = await generateDraft();
    post(result, false);
  } catch (error) {
    const messageText = typeof error === "object" && error && "message" in error
      ? String(error.message)
      : String(error || "초안 생성에 실패했습니다.");
    figma.notify(messageText, { error: true });
    post(messageText, true);
  }
};
