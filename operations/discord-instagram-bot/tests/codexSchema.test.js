import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = JSON.parse(
  readFileSync(new URL("../src/codex-output.schema.json", import.meta.url), "utf8"),
);

function validateStrictObjects(node, path = "root") {
  if (!node || typeof node !== "object") return;

  if (node.type === "object" && node.additionalProperties === false) {
    assert.deepEqual(
      [...(node.required || [])].sort(),
      Object.keys(node.properties || {}).sort(),
      `${path}의 required는 모든 properties를 포함해야 합니다.`,
    );
  }

  for (const [name, child] of Object.entries(node.properties || {})) {
    validateStrictObjects(child, `${path}.${name}`);
  }
  validateStrictObjects(node.items, `${path}[]`);
}

test("Codex 출력 스키마의 모든 strict object는 전체 속성을 필수로 선언한다", () => {
  validateStrictObjects(schema);
});
