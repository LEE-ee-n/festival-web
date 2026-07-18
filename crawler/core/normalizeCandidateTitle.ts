export function normalizeCandidateTitle(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s·,:;!?\-_/\\|()[\]{}"'`~@#$%^*+=<>]/g, "")
    .trim();
}
