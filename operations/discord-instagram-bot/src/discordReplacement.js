const SOURCE_REPLACEMENT_PREFIX = "source-replace:";
const DISCORD_MESSAGE_ID = /^\d{10,25}$/;

export function canReplaceDiscordSourceDraft(candidateRows, updateRows) {
  const rows = [
    ...(Array.isArray(candidateRows) ? candidateRows : []),
    ...(Array.isArray(updateRows) ? updateRows : []),
  ];
  return rows.length > 0 && rows.every((row) => row?.status === "pending");
}

export function createSourceReplacementButtonId(messageId) {
  const value = String(messageId || "");
  if (!DISCORD_MESSAGE_ID.test(value)) {
    throw new Error("올바른 Discord 메시지 ID가 필요합니다.");
  }
  return `${SOURCE_REPLACEMENT_PREFIX}${value}`;
}

export function parseSourceReplacementButtonId(customId) {
  const value = String(customId || "");
  if (!value.startsWith(SOURCE_REPLACEMENT_PREFIX)) return null;
  const messageId = value.slice(SOURCE_REPLACEMENT_PREFIX.length);
  return DISCORD_MESSAGE_ID.test(messageId) ? messageId : null;
}

