const DISCORD_SAFE_CONTENT_LIMIT = 1900;
const TRUNCATION_NOTICE = "\n…(내용 생략)";

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function truncateDiscordContent(value, maxLength = DISCORD_SAFE_CONTENT_LIMIT) {
  const content = String(value);
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength - TRUNCATION_NOTICE.length)}${TRUNCATION_NOTICE}`;
}

export function formatDiscordError(prefix, error) {
  return truncateDiscordContent(`${prefix}: ${getErrorMessage(error)}`);
}
