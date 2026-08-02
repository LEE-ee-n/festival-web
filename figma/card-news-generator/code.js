const API_URL = "https://festibom.com/api/figma/card-news?year=2026&month=8";
const TEMPLATE_NAMES = [
  "cover_template",
  "festival_card_template",
  "festival_list_template",
  "closing_template",
];

figma.showUI(__html__, { width: 320, height: 240, title: "Festibom 카드뉴스" });

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

  if (node.fontName === figma.mixed) {
    throw new Error(`글꼴이 섞여 있어 수정할 수 없습니다: ${name}`);
  }

  await figma.loadFontAsync(node.fontName);
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

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("포스터 이미지를 불러오지 못했습니다.");
  }

  const image = figma.createImage(new Uint8Array(await response.arrayBuffer()));
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
  await setText(card, "date_text", festival.dateText);
  await setText(card, "location_text", festival.locationText);
  await setText(card, "ticket_platform_text", festival.ticketPlatformText);
  await setText(card, "lineup_text", festival.lineupText);
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

  const cover = createDraftCopy(templates.cover_template, "draft_2026_08_cover", x, y);
  await setText(cover, "cover_eyebrow", draft.coverEyebrow);
  await setText(cover, "cover_title", draft.coverTitle);
  copies.push(cover);
  x += cover.width + 80;

  for (const festival of draft.festivalCards) {
    const card = createDraftCopy(
      templates.festival_card_template,
      `draft_2026_08_festival_${festival.id}`,
      x,
      y,
    );
    await fillFestivalCard(card, festival);
    copies.push(card);
    x += card.width + 80;
  }

  for (let index = 0; index < draft.festivalLists.length; index += 1) {
    const listCard = createDraftCopy(
      templates.festival_list_template,
      `draft_2026_08_list_${index + 1}`,
      x,
      y,
    );
    await fillFestivalList(listCard, draft.festivalLists[index]);
    copies.push(listCard);
    x += listCard.width + 80;
  }

  const closing = createDraftCopy(templates.closing_template, "draft_2026_08_closing", x, y);
  copies.push(closing);

  figma.currentPage.selection = copies;
  figma.viewport.scrollAndZoomIntoView(copies);

  return `${draft.totalFestivalCount}개 축제 초안을 만들었습니다.\n포스터 카드 ${draft.festivalCards.length}장 / 목록 카드 ${draft.festivalLists.length}장`;
}

figma.ui.onmessage = async (message) => {
  if (message.type !== "generate") return;

  try {
    const result = await generateDraft();
    post(result, false);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "초안 생성에 실패했습니다.";
    figma.notify(messageText, { error: true });
    post(messageText, true);
  }
};
