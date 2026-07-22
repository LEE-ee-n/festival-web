export type AuditCountSummary = {
  maintained: number;
  added: number;
  changed: number;
  deleted: number;
  skipped: number;
};

export type JsonAuditSummary = {
  total: AuditCountSummary;
  sections: Record<"basic" | "lineup" | "ticket", AuditCountSummary>;
};

type PreviewItem = {
  id: string;
  section: "basic" | "lineup" | "ticket";
  status: "same" | "add" | "conflict";
};

export type AuditOperation = { operation: "insert" | "update" | "delete" };

export function emptyAuditCountSummary(): AuditCountSummary {
  return { maintained: 0, added: 0, changed: 0, deleted: 0, skipped: 0 };
}

export function buildJsonAuditSummary(
  items: PreviewItem[],
  selectedIds: ReadonlySet<string>,
): JsonAuditSummary {
  const sections = {
    basic: emptyAuditCountSummary(),
    lineup: emptyAuditCountSummary(),
    ticket: emptyAuditCountSummary(),
  };

  for (const item of items) {
    const target = sections[item.section];
    if (item.status === "same") target.maintained += 1;
    else if (item.status === "add") {
      if (selectedIds.has(item.id)) target.added += 1;
      else target.skipped += 1;
    } else if (selectedIds.has(item.id)) target.changed += 1;
    else target.maintained += 1;
  }

  const total = Object.values(sections).reduce((result, section) => ({
    maintained: result.maintained + section.maintained,
    added: result.added + section.added,
    changed: result.changed + section.changed,
    deleted: result.deleted + section.deleted,
    skipped: result.skipped + section.skipped,
  }), emptyAuditCountSummary());

  return { total, sections };
}

export function summarizeAuditOperations(changes: AuditOperation[]): AuditCountSummary {
  return changes.reduce((summary, change) => {
    if (change.operation === "insert") summary.added += 1;
    if (change.operation === "update") summary.changed += 1;
    if (change.operation === "delete") summary.deleted += 1;
    return summary;
  }, emptyAuditCountSummary());
}
