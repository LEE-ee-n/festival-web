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

type JsonObject = { [key: string]: Json | undefined };

function isJsonObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCountSummary(value: Json | undefined): AuditCountSummary | null {
  if (
    value === undefined
    || !isJsonObject(value)
    || typeof value.maintained !== "number"
    || typeof value.added !== "number"
    || typeof value.changed !== "number"
    || typeof value.deleted !== "number"
    || typeof value.skipped !== "number"
  ) {
    return null;
  }
  return {
    maintained: value.maintained,
    added: value.added,
    changed: value.changed,
    deleted: value.deleted,
    skipped: value.skipped,
  };
}

export function parseJsonAuditSummary(value: Json | null): JsonAuditSummary | null {
  if (!value || !isJsonObject(value)) {
    return null;
  }
  const sections = value.sections;
  if (sections === undefined || !isJsonObject(sections)) return null;
  const total = parseCountSummary(value.total);
  const basic = parseCountSummary(sections.basic);
  const lineup = parseCountSummary(sections.lineup);
  const ticket = parseCountSummary(sections.ticket);
  if (!total || !basic || !lineup || !ticket) return null;
  return { total, sections: { basic, lineup, ticket } };
}

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
import type { Json } from "@/lib/supabase/database";
