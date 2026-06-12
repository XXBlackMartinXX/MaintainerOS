import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  RLS_RUNTIME_FIXTURES,
  RLS_RUNTIME_COVERED_INVARIANTS,
  isUuid,
} from "./rls-runtime-fixtures";

const HARNESS = readFileSync(
  path.resolve(process.cwd(), "scripts/rls-runtime-tests.sql"),
  "utf8",
);

describe("RLS runtime harness fixtures", () => {
  it("exposes valid, distinct UUIDs", () => {
    const values = Object.values(RLS_RUNTIME_FIXTURES);
    for (const v of values) expect(isUuid(v)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });

  it("SQL harness references the documented fixture UUIDs", () => {
    for (const v of Object.values(RLS_RUNTIME_FIXTURES)) {
      expect(HARNESS, `harness should reference ${v}`).toContain(v);
    }
  });

  it("SQL harness asserts every documented invariant", () => {
    for (const id of RLS_RUNTIME_COVERED_INVARIANTS) {
      expect(HARNESS, `harness should assert ${id}`).toContain(id);
    }
  });

  it("SQL harness refuses to run against suspected production DBs", () => {
    expect(HARNESS).toMatch(/Refusing to run/i);
    expect(HARNESS).toMatch(/ROLLBACK/);
  });
});
