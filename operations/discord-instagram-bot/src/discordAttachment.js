const NEW_REGISTRATION_COMMAND = /^\s*신규등록(?=\s|[:：-]|$)[\s:：-]*/i;
const SUPPORTED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const SUPPORTED_IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp|gif)$/i;

function isSupportedImageAttachment(attachment) {
  const contentType = typeof attachment?.contentType === "string"
    ? attachment.contentType.toLowerCase().split(";", 1)[0]
    : "";
  const name = typeof attachment?.name === "string" ? attachment.name : "";
  return Boolean(
    attachment?.url
      && (SUPPORTED_IMAGE_CONTENT_TYPES.has(contentType)
        || (!contentType && SUPPORTED_IMAGE_EXTENSIONS.test(name))),
  );
}

export function parseDiscordAttachmentRegistration(content, attachments) {
  const text = typeof content === "string" ? content : "";
  const command = text.match(NEW_REGISTRATION_COMMAND);
  if (!command) return null;

  const candidates = Array.isArray(attachments) ? attachments : [];
  const images = candidates.filter(isSupportedImageAttachment);
  return {
    caption: text.slice(command[0].length).trim(),
    images,
    rejectedCount: candidates.length - images.length,
  };
}

