export function buildTicketlinkBookmarklet(): string {
  const source = `(async () => {
    if (location.hostname !== "ticketlink.co.kr" && !location.hostname.endsWith(".ticketlink.co.kr")) {
      alert("티켓링크 검색 결과 페이지에서 실행해 주세요.");
      return;
    }
    const productPath = /^\\/product\\/(\\d+)\\/?$/;
    const festivalKeyword = /페스티벌|포레스티벌|페스타|festival|\\bfes(?:t(?:a)?)?\\b/i;
    const datePattern = /((?:19|20)\\d{2})[.\\-/]\\s*(\\d{1,2})[.\\-/]\\s*(\\d{1,2})\\.?(?:\\s*(?:~|-)\\s*((?:19|20)\\d{2})[.\\-/]\\s*(\\d{1,2})[.\\-/]\\s*(\\d{1,2})\\.?)?/;
    const isoDate = (year, month, day) => year && month && day
      ? [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-")
      : undefined;
    const findContext = (anchor) => {
      let node = anchor;
      for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
        const text = (node.innerText || node.textContent || "").replace(/\\s+/g, " ").trim();
        if (text.length <= 600 && datePattern.test(text)) return text;
      }
      return (anchor.innerText || anchor.textContent || "").replace(/\\s+/g, " ").trim();
    };
    const itemsByUrl = new Map();
    const reactProductIds = new Set();
    const matchedCardIds = new Set();
    const fiberMatchedCardIds = new Set();
    const fiberKeyCardIds = new Set();
    let scrollScanCount = 0;
    let networkResponseCount = 0;
    const networkProductsById = new Map();
    const pendingNetworkReads = [];
    const collectReactProducts = (value, products, seen = new WeakSet(), depth = 0) => {
      if (!value || typeof value !== "object" || depth > 10 || seen.has(value)) return;
      seen.add(value);
      if (/^\\d+$/.test(String(value.productId || "")) && typeof value.productName === "string") {
        products.push(value);
        return;
      }
      for (const key of ["item", "productBanner", "props", "children"]) {
        const child = value[key];
        if (Array.isArray(child)) {
          for (const entry of child) collectReactProducts(entry, products, seen, depth + 1);
        } else {
          collectReactProducts(child, products, seen, depth + 1);
        }
      }
    };
    const collectNetworkProducts = (value, seen = new WeakSet(), depth = 0) => {
      if (!value || typeof value !== "object" || depth > 15 || seen.has(value)) return;
      seen.add(value);
      if (/^\\d+$/.test(String(value.productId || "")) && typeof value.productName === "string") {
        networkProductsById.set(String(value.productId), value);
      }
      if (Array.isArray(value)) {
        for (const child of value) collectNetworkProducts(child, seen, depth + 1);
      } else {
        for (const child of Object.values(value)) collectNetworkProducts(child, seen, depth + 1);
      }
    };
    const recordNetworkPayload = (payload) => {
      networkResponseCount += 1;
      collectNetworkProducts(payload);
    };
    const normalizeProductText = (value) => String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\\p{L}\\p{N}]+/gu, "");
    const getCardFiberProductId = (card) => {
      let node = card;
      for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
        for (const key of Object.keys(node).filter((name) => name.startsWith("__reactFiber"))) {
          const fiberKey = String(node[key]?.key || "");
          if (/^\\d{4,}$/.test(fiberKey)) return fiberKey;
        }
      }
      return null;
    };
    const getCardTitle = (card, context) => {
      const imageAlt = card.querySelector?.("img[alt]")?.getAttribute("alt") || "";
      const altTitle = imageAlt
        .replace(/^티켓링크\\s*/i, "")
        .replace(/\\s*예매\\s*$/i, "")
        .trim();
      if (altTitle) return altTitle;
      const dateMatch = context.match(datePattern);
      return (dateMatch ? context.slice(0, dateMatch.index) : context).trim();
    };
    let productsByNode = new WeakMap();
    let productsByFiber = new WeakMap();
    const getNodeProducts = (node) => {
      if (productsByNode.has(node)) return productsByNode.get(node);
      const products = [];
      for (const key of Object.keys(node).filter((name) => name.startsWith("__react"))) {
        const value = node[key];
        const root = key.startsWith("__reactFiber")
          ? { memoizedProps: value?.memoizedProps, pendingProps: value?.pendingProps }
          : value;
        collectReactProducts(root, products);
      }
      const unique = [...new Map(products.map((product) => [String(product.productId), product])).values()];
      productsByNode.set(node, unique);
      return unique;
    };
    const getFiberProducts = (fiber) => {
      if (!fiber || typeof fiber !== "object") return [];
      if (productsByFiber.has(fiber)) return productsByFiber.get(fiber);
      const products = [];
      collectReactProducts({ memoizedProps: fiber.memoizedProps, pendingProps: fiber.pendingProps }, products);
      const unique = [...new Map(products.map((product) => [String(product.productId), product])).values()];
      productsByFiber.set(fiber, unique);
      return unique;
    };
    const collectCurrentPage = () => {
    productsByNode = new WeakMap();
    productsByFiber = new WeakMap();
    for (const list of document.querySelectorAll("ul.product_grid_list, li.product_grid_item")) {
      if (list.tagName !== "UL" && list.tagName !== "LI") continue;
      const reactPropsKey = Object.keys(list).find((key) => key.startsWith("__reactProps"));
      const products = [];
      if (reactPropsKey) collectReactProducts(list[reactPropsKey], products);
      const cards = [...list.querySelectorAll("a.product_link")];
      const cardTexts = cards.map((card) => (card.innerText || card.textContent || "").replace(/\\s+/g, " ").trim());
      products.forEach((product, index) => {
        reactProductIds.add(String(product.productId));
        const matchingContext = cardTexts.find((text) => text.includes(product.productName));
        const context = (matchingContext || cardTexts[index] || product.productName)
          .replace(/\\s+/g, " ")
          .trim();
        const dateMatch = context.match(datePattern);
        const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
        const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
        const sourceUrl = "https://www.ticketlink.co.kr/product/" + product.productId;
        const candidate = {
          title: product.productName.replace(/\\s+/g, " ").trim(),
          source_url: sourceUrl,
          raw_title: context,
          ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
        };
        const existing = itemsByUrl.get(sourceUrl);
        if (!existing || existing.score < 5000) itemsByUrl.set(sourceUrl, { score: 5000, item: candidate });
      });
    }
    for (const card of document.querySelectorAll("a.product_link")) {
      const context = (card.innerText || card.textContent || "").replace(/\\s+/g, " ").trim();
      const contextKey = normalizeProductText(context);
      const fiberProductId = getCardFiberProductId(card);
      if (fiberProductId) {
        const dateMatch = context.match(datePattern);
        const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
        const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
        const sourceUrl = "https://www.ticketlink.co.kr/product/" + fiberProductId;
        const title = getCardTitle(card, context);
        if (title) {
          fiberKeyCardIds.add(fiberProductId);
          itemsByUrl.set(sourceUrl, {
            score: 6500,
            item: {
              title,
              source_url: sourceUrl,
              raw_title: context,
              ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
            },
          });
        }
      }
      let node = card;
      let matchedProduct = null;
      for (let depth = 0; node && depth < 8 && !matchedProduct; depth += 1, node = node.parentElement) {
        matchedProduct = getNodeProducts(node).find((product) => {
          const productKey = normalizeProductText(product.productName);
          return productKey.length >= 4 && contextKey.includes(productKey);
        }) || null;
      }
      if (!matchedProduct) {
        const fiberKey = Object.keys(card).find((key) => key.startsWith("__reactFiber"));
        let fiber = fiberKey ? card[fiberKey] : null;
        for (let depth = 0; fiber && depth < 16 && !matchedProduct; depth += 1, fiber = fiber.return) {
          matchedProduct = getFiberProducts(fiber).find((product) => {
            const productKey = normalizeProductText(product.productName);
            return productKey.length >= 4 && contextKey.includes(productKey);
          }) || null;
        }
        if (matchedProduct) fiberMatchedCardIds.add(String(matchedProduct.productId));
      }
      if (!matchedProduct) continue;
      matchedCardIds.add(String(matchedProduct.productId));
      reactProductIds.add(String(matchedProduct.productId));
      const dateMatch = context.match(datePattern);
      const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
      const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
      const sourceUrl = "https://www.ticketlink.co.kr/product/" + matchedProduct.productId;
      itemsByUrl.set(sourceUrl, {
        score: 6000,
        item: {
          title: matchedProduct.productName.replace(/\\s+/g, " ").trim(),
          source_url: sourceUrl,
          raw_title: context || matchedProduct.productName,
          ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
        },
      });
    }
    for (const anchor of document.querySelectorAll('a[href*="/product/"]')) {
      const url = new URL(anchor.href, location.href);
      if (url.hostname !== "www.ticketlink.co.kr") continue;
      const match = url.pathname.match(productPath);
      if (!match) continue;
      const context = findContext(anchor);
      const imageTitle = anchor.querySelector?.("img[alt]")?.getAttribute("alt") || "";
      const anchorText = (anchor.innerText || anchor.textContent || imageTitle).replace(/\\s+/g, " ").trim();
      const dateMatch = context.match(datePattern);
      const titleSource = anchorText || context;
      const titleDateMatch = titleSource.match(datePattern);
      const title = (titleDateMatch ? titleSource.slice(0, titleDateMatch.index) : titleSource).trim();
      if (!title) continue;
      const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
      const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
      const sourceUrl = "https://www.ticketlink.co.kr/product/" + match[1];
      const candidate = {
        title,
        source_url: sourceUrl,
        raw_title: context,
        ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
      };
      const score = (startDate ? 1000 : 0)
        + (context ? Math.min(context.length, 600) : 0)
        + (/페스티벌|포레스티벌|페스타|festival|\\bfes(?:t(?:a)?)?\\b/i.test(title) ? 500 : 0)
        - (/^티켓링크\s+.*예매$/i.test(title) ? 1000 : 0);
      const existing = itemsByUrl.get(sourceUrl);
      if (!existing || score > existing.score) {
        itemsByUrl.set(sourceUrl, { score, item: candidate });
      }
    }
    for (const element of document.querySelectorAll("body *")) {
      const leafText = (element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim();
      if (!leafText || leafText.length > 240 || !festivalKeyword.test(leafText)) continue;
      const childHasKeyword = [...(element.children || [])].some((child) =>
        festivalKeyword.test((child.innerText || child.textContent || "").replace(/\\s+/g, " ").trim())
      );
      if (childHasKeyword) continue;

      let node = element;
      let title = leafText;
      for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
        const nodeText = (node.innerText || node.textContent || "").replace(/\\s+/g, " ").trim();
        const nodeDateMatch = nodeText.match(datePattern);
        if (!nodeDateMatch && nodeText.length > title.length && nodeText.length <= 240 && festivalKeyword.test(nodeText)) {
          title = nodeText;
        }
        const anchor = (node.matches?.('a[href*="/product/"]') ? node : null)
          || node.querySelector?.('a[href*="/product/"]');
        if (!anchor) continue;
        const url = new URL(anchor.href, location.href);
        const match = url.pathname.match(productPath);
        if (url.hostname !== "www.ticketlink.co.kr" || !match) break;
        const context = nodeDateMatch ? nodeText : findContext(anchor);
        const dateMatch = context.match(datePattern);
        const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
        const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
        const sourceUrl = "https://www.ticketlink.co.kr/product/" + match[1];
        const candidate = {
          title,
          source_url: sourceUrl,
          raw_title: context,
          ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
        };
        const score = 3000 + (startDate ? 1000 : 0) + Math.min(context.length, 600);
        const existing = itemsByUrl.get(sourceUrl);
        if (!existing || score > existing.score) {
          itemsByUrl.set(sourceUrl, { score, item: candidate });
        }
        break;
      }
    }
    };
    const pageSignature = () => [...document.querySelectorAll('a[href*="/product/"]')]
      .map((anchor) => {
        try {
          return new URL(anchor.href, location.href).pathname.match(productPath)?.[1] || "";
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join(",");
    const controlText = (element) => [
      element.innerText || element.textContent || "",
      element.getAttribute?.("aria-label") || "",
      element.getAttribute?.("title") || "",
    ].join(" ").replace(/\s+/g, " ").trim();
    const findNextPage = () => {
      const controls = [...document.querySelectorAll("a,button")].filter((element) => {
        if (element.disabled || element.getAttribute?.("aria-disabled") === "true") return false;
        const text = controlText(element);
        const className = typeof element.className === "string" ? element.className : "";
        return /(^|\s)(다음(?:\s*페이지)?|next|[>›»])(\s|$)/i.test(text)
          || /(^|[-_\s])next($|[-_\s])/i.test(className);
      });
      return controls.at(-1) || null;
    };
    const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

    if (typeof globalThis.scrollTo === "function" && document.documentElement) {
      const originalFetch = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;
      if (originalFetch) {
        globalThis.fetch = async (...args) => {
          const response = await originalFetch(...args);
          const read = response.clone().json().then(recordNetworkPayload).catch(() => {});
          pendingNetworkReads.push(read);
          return response;
        };
      }
      const xhrPrototype = globalThis.XMLHttpRequest?.prototype;
      const originalXhrSend = xhrPrototype?.send;
      if (xhrPrototype && originalXhrSend) {
        xhrPrototype.send = function (...args) {
          this.addEventListener("load", () => {
            try {
              const payload = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
              recordNetworkPayload(payload);
            } catch {}
          }, { once: true });
          return originalXhrSend.apply(this, args);
        };
      }
      const originalY = globalThis.scrollY || 0;
      globalThis.scrollTo(0, 0);
      await delay(500);
      let position = 0;
      let stableBottomCount = 0;
      let previousHeight = 0;
      for (let step = 0; step < 160; step += 1) {
        collectCurrentPage();
        scrollScanCount += 1;
        const pageHeight = Math.max(document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0);
        const viewportHeight = globalThis.innerHeight || 800;
        if (position + viewportHeight >= pageHeight - 10) {
          stableBottomCount = pageHeight === previousHeight ? stableBottomCount + 1 : 0;
          if (stableBottomCount >= 5) break;
        }
        previousHeight = pageHeight;
        position = Math.min(position + Math.max(500, Math.floor(viewportHeight * 0.8)), pageHeight);
        globalThis.scrollTo(0, position);
        await delay(700);
      }
      collectCurrentPage();
      await delay(1000);
      await Promise.allSettled(pendingNetworkReads);
      if (originalFetch) globalThis.fetch = originalFetch;
      if (xhrPrototype && originalXhrSend) xhrPrototype.send = originalXhrSend;
      globalThis.scrollTo(0, originalY);
    }

    if (networkProductsById.size > 0) {
      const cardTexts = [...document.querySelectorAll("a.product_link")]
        .map((card) => (card.innerText || card.textContent || "").replace(/\\s+/g, " ").trim());
      for (const product of networkProductsById.values()) {
        const productKey = normalizeProductText(product.productName);
        const context = cardTexts.find((text) => text.includes(product.productName)
          || normalizeProductText(text).includes(productKey)) || product.productName;
        const dateMatch = context.match(datePattern);
        const startDate = isoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
        const endDate = isoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) || startDate;
        const sourceUrl = "https://www.ticketlink.co.kr/product/" + product.productId;
        itemsByUrl.set(sourceUrl, {
          score: 7000,
          item: {
            title: product.productName.replace(/\\s+/g, " ").trim(),
            source_url: sourceUrl,
            raw_title: context,
            ...(startDate ? { start_date: startDate, end_date: endDate } : {}),
          },
        });
      }
    }

    for (let page = 0; page < 20; page += 1) {
      collectCurrentPage();
      const nextPage = findNextPage();
      if (!nextPage) break;
      const before = pageSignature();
      nextPage.click();
      let changed = false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await delay(250);
        const after = pageSignature();
        if (after && after !== before) {
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }
    const items = [...itemsByUrl.values()].map((entry) => entry.item);
    if (items.length === 0) {
      alert("현재 화면에서 티켓링크 상품을 찾지 못했습니다. 검색 결과가 보이는지 확인해 주세요.");
      return;
    }
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [String(now.getFullYear()).slice(-2), pad(now.getMonth() + 1), pad(now.getDate())].join("");
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = date + "-TICKETLINK-crwal.json";
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    alert("티켓링크 수집 v10: 현재 카드 " + document.querySelectorAll("a.product_link").length
      + "개, 스크롤 " + scrollScanCount + "회, API 응답 " + networkResponseCount
      + "개, API 상품 " + networkProductsById.size + "개, DOM 매칭 " + matchedCardIds.size
      + "개, Fiber 추가 " + fiberMatchedCardIds.size
      + "개, 카드 ID " + fiberKeyCardIds.size
      + "개, 내부값 " + reactProductIds.size
      + "개, 최종 " + items.length + "개를 저장했습니다.");
  })()`;

  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

export function buildTicketlinkPaginationDiagnosticBookmarklet(): string {
  const source = `(() => {
    if (location.hostname !== "ticketlink.co.kr" && !location.hostname.endsWith(".ticketlink.co.kr")) {
      alert("티켓링크 목록 페이지에서 실행해 주세요.");
      return;
    }
    const controls = [...document.querySelectorAll('button,a,[role="button"]')]
      .filter((element) => !(element.getAttribute?.("href") || "").includes("/product/"))
      .map((element, index) => {
        const rect = element.getBoundingClientRect?.();
        return {
          index,
          tag: element.tagName,
          text: (element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 100),
          aria_label: element.getAttribute?.("aria-label"),
          title: element.getAttribute?.("title"),
          role: element.getAttribute?.("role"),
          class_name: typeof element.className === "string" ? element.className : "",
          href: element.getAttribute?.("href"),
          disabled: Boolean(element.disabled) || element.getAttribute?.("aria-disabled") === "true",
          parent_class: typeof element.parentElement?.className === "string" ? element.parentElement.className : "",
          grandparent_class: typeof element.parentElement?.parentElement?.className === "string"
            ? element.parentElement.parentElement.className
            : "",
          position: rect ? { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
          html: (element.outerHTML || "").slice(0, 800),
        };
      })
      .filter((item) => item.tag === "BUTTON"
        || item.role === "button"
        || /다음|이전|더보기|next|prev|more|page|pagination|^[0-9]+$|^[<>›»]+$/i.test(
          [item.text, item.aria_label, item.title, item.class_name, item.parent_class, item.grandparent_class].join(" "),
        ));
    const result = {
      page_url: location.href,
      product_count: document.querySelectorAll('a[href*="/product/"]').length,
      controls,
    };
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [String(now.getFullYear()).slice(-2), pad(now.getMonth() + 1), pad(now.getDate())].join("");
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = date + "-TICKETLINK-controls.json";
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    alert("티켓링크 페이지 버튼 구조를 저장했습니다.");
  })()`;
  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

export function buildTicketlinkProductInternalDiagnosticBookmarklet(): string {
  const source = `(() => {
    if (location.hostname !== "ticketlink.co.kr" && !location.hostname.endsWith(".ticketlink.co.kr")) {
      alert("티켓링크 목록 페이지에서 실행해 주세요.");
      return;
    }
    const interestingKey = /product|perf|performance|item|goods|id$|no$|code$|seq$|url|link|path/i;
    const blockedKey = /^(return|child|sibling|alternate|stateNode|_owner)$/;
    const inspectValue = (root) => {
      const matches = [];
      const seen = new WeakSet();
      let visited = 0;
      const walk = (value, path, depth) => {
        if (matches.length >= 160 || visited >= 2000 || depth > 7 || value == null) return;
        if (typeof value !== "object") return;
        if (seen.has(value)) return;
        seen.add(value);
        visited += 1;
        for (const key of Object.keys(value)) {
          if (blockedKey.test(key)) continue;
          let child;
          try { child = value[key]; } catch { continue; }
          const childPath = path ? path + "." + key : key;
          if (["string", "number", "boolean"].includes(typeof child) && interestingKey.test(key)) {
            matches.push({ path: childPath, value: String(child).slice(0, 500) });
          }
          if (child && typeof child === "object") walk(child, childPath, depth + 1);
        }
      };
      walk(root, "", 0);
      return matches;
    };
    const cards = [...document.querySelectorAll("a.product_link")].slice(0, 10).map((card, cardIndex) => {
      const elements = [];
      let node = card;
      for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
        const reactKeys = Object.keys(node).filter((key) => key.startsWith("__react"));
        elements.push({
          depth,
          tag: node.tagName,
          class_name: typeof node.className === "string" ? node.className : "",
          attributes: [...(node.attributes || [])].reduce((result, attribute) => {
            result[attribute.name] = attribute.value;
            return result;
          }, {}),
          react: reactKeys.map((key) => {
            const value = node[key];
            const roots = key.startsWith("__reactFiber")
              ? { memoizedProps: value?.memoizedProps, pendingProps: value?.pendingProps, key: value?.key }
              : value;
            return { key, matches: inspectValue(roots) };
          }),
        });
      }
      return {
        card_index: cardIndex,
        text: (card.innerText || card.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 500),
        elements,
      };
    });
    const result = { page_url: location.href, card_count: document.querySelectorAll("a.product_link").length, cards };
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [String(now.getFullYear()).slice(-2), pad(now.getMonth() + 1), pad(now.getDate())].join("");
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = date + "-TICKETLINK-product-internals.json";
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    alert("티켓링크 상품 카드 내부값을 저장했습니다.");
  })()`;
  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

export function buildTicketlinkDataSourceDiagnosticBookmarklet(): string {
  const source = `(() => {
    if (location.hostname !== "ticketlink.co.kr" && !location.hostname.endsWith(".ticketlink.co.kr")) {
      alert("티켓링크 목록 페이지에서 실행해 주세요.");
      return;
    }
    const sampleAround = (text, keyword) => {
      const samples = [];
      let position = 0;
      while (samples.length < 5) {
        const index = text.indexOf(keyword, position);
        if (index < 0) break;
        samples.push(text.slice(Math.max(0, index - 350), Math.min(text.length, index + 900)));
        position = index + keyword.length;
      }
      return samples;
    };
    const scriptSources = [...document.scripts].map((script, index) => {
      const text = script.textContent || "";
      if (!/productId|productName|productBanner/.test(text)) return null;
      return {
        index,
        id: script.id || null,
        type: script.type || null,
        length: text.length,
        product_id_count: (text.match(/productId/g) || []).length,
        samples: sampleAround(text, "productId"),
      };
    }).filter(Boolean);
    let nextFlightText = "";
    try { nextFlightText = JSON.stringify(globalThis.__next_f || []); } catch {}
    const cards = [...document.querySelectorAll("a.product_link")];
    const sampleIndexes = [...new Set([0, 20, 21, 40, 80, 120, 160, cards.length - 1])]
      .filter((index) => index >= 0 && index < cards.length);
    const cardSamples = sampleIndexes.map((index) => {
      const card = cards[index];
      const levels = [];
      let node = card;
      for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
        const react = Object.keys(node).filter((key) => key.startsWith("__react")).map((key) => {
          const value = node[key];
          const props = key.startsWith("__reactFiber") ? value?.memoizedProps : value;
          return {
            key_type: key.startsWith("__reactFiber") ? "fiber" : "props",
            prop_keys: props && typeof props === "object" ? Object.keys(props).slice(0, 60) : [],
            on_click: typeof props?.onClick === "function" ? String(props.onClick).slice(0, 1000) : null,
            fiber_key: key.startsWith("__reactFiber") ? value?.key ?? null : null,
            component: key.startsWith("__reactFiber")
              ? value?.elementType?.displayName || value?.elementType?.name || value?.type?.displayName || value?.type?.name || null
              : null,
          };
        });
        levels.push({ depth, tag: node.tagName, class_name: typeof node.className === "string" ? node.className : "", react });
      }
      return {
        index,
        text: (card.innerText || card.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 700),
        image_alt: card.querySelector?.("img")?.getAttribute("alt") || null,
        image_src: card.querySelector?.("img")?.getAttribute("src") || null,
        levels,
      };
    });
    const result = {
      page_url: location.href,
      card_count: cards.length,
      script_sources: scriptSources,
      next_flight: {
        length: nextFlightText.length,
        product_id_count: (nextFlightText.match(/productId/g) || []).length,
        samples: sampleAround(nextFlightText, "productId"),
      },
      related_global_keys: Object.keys(globalThis).filter((key) => /next|query|react|ticket|product/i.test(key)).slice(0, 200),
      card_samples: cardSamples,
    };
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const date = [String(now.getFullYear()).slice(-2), pad(now.getMonth() + 1), pad(now.getDate())].join("");
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = date + "-TICKETLINK-data-sources.json";
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    alert("티켓링크 데이터 원본 진단 파일을 저장했습니다.");
  })()`;
  return `javascript:${source.replace(/\s+/g, " ").trim()}`;
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buildTicketlinkInstallerHtml(): string {
  const bookmarklet = escapeHtmlAttribute(buildTicketlinkBookmarklet());
  const diagnosticBookmarklet = escapeHtmlAttribute(buildTicketlinkPaginationDiagnosticBookmarklet());
  const productInternalBookmarklet = escapeHtmlAttribute(buildTicketlinkProductInternalDiagnosticBookmarklet());
  const dataSourceBookmarklet = escapeHtmlAttribute(buildTicketlinkDataSourceDiagnosticBookmarklet());
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>티켓링크 목록 저장 북마클릿</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; color: #171717; }
    main { max-width: 680px; margin: 60px auto; padding: 32px; background: white; border: 1px solid #ddd; border-radius: 18px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    h1 { margin-top: 0; font-size: 26px; }
    ol { line-height: 1.9; padding-left: 22px; }
    .bookmarklet { display: inline-block; margin: 16px 0; padding: 14px 20px; color: white; background: #ef4444; border-radius: 10px; font-weight: 700; text-decoration: none; cursor: grab; }
    .note { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>티켓링크 목록 저장 설치</h1>
    <p>아래 버튼을 브라우저 즐겨찾기 표시줄로 끌어놓으세요.</p>
    <a class="bookmarklet" href="${bookmarklet}">티켓링크 목록 저장</a>
    <a class="bookmarklet" href="${diagnosticBookmarklet}">티켓링크 구조 확인</a>
    <a class="bookmarklet" href="${productInternalBookmarklet}">티켓링크 상품 내부값 확인</a>
    <a class="bookmarklet" href="${dataSourceBookmarklet}">티켓링크 데이터 원본 확인</a>
    <ol>
      <li>즐겨찾기 표시줄이 없다면 <strong>Ctrl + Shift + B</strong>를 누릅니다.</li>
      <li>위 버튼을 즐겨찾기 표시줄로 드래그합니다.</li>
      <li>티켓링크 페스티벌 검색 결과에서 북마크를 클릭합니다.</li>
      <li>목록이 27개에서 멈추면 구조 확인 버튼으로 진단 JSON을 저장합니다.</li>
      <li>상품 링크에 URL이 없으면 상품 내부값 확인 버튼으로 숨겨진 상품 번호를 확인합니다.</li>
      <li>상품 ID가 일부만 나오면 데이터 원본 확인 버튼으로 페이지 데이터·캐시·클릭 함수를 분류합니다.</li>
    </ol>
    <p class="note">화면의 상품 카드 내부 ID를 읽어 URL이 없는 상품까지 저장하며, 상세 상품 페이지는 방문하지 않습니다.</p>
  </main>
</body>
</html>`;
}
