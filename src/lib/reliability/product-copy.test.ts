import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  PRODUCT_LABELS,
  PRODUCT_COPY,
  FORBIDDEN_COPY,
} from "./product-copy";

/**
 * P4 — Product Professionalism and UX Precision invariants.
 *
 * These tests pin the user-facing language we ship in critical
 * surfaces. They are intentionally cheap, deterministic, and do not
 * render React. They scan source files as text.
 *
 * If a future edit changes the wording, the test fails and the author
 * has to update it intentionally. This prevents accidental drift into
 * overclaiming or unsafe copy.
 */

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  const abs = resolve(process.cwd(), dir);
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(tsx|ts)$/.test(entry.name) && !/\.test\.(t|j)sx?$/.test(entry.name)) {
        out.push(p);
      }
    }
  };
  walk(abs);
  return out;
}

describe("product-copy constants", () => {
  it("exposes a label for every safety concept we rely on", () => {
    for (const key of [
      "aiDraft",
      "humanApproval",
      "advisory",
      "publicPreview",
      "demoData",
      "notAudit",
      "verifyBeforePublishing",
      "draftRelease",
      "setupRequired",
      "liveRepository",
      "sensitiveRepoWarning",
    ] as const) {
      expect(PRODUCT_LABELS[key]).toBeTruthy();
    }
  });

  it("exposes copy strings for empty / setup / approval / advisory surfaces", () => {
    for (const key of [
      "advisoryHeuristic",
      "advisorySecurity",
      "advisoryReadiness",
      "demoBannerHeadline",
      "demoBannerBody",
      "publicPreviewNotice",
      "publishRequiresApproval",
      "releasesAreDraftsOnly",
      "aiCannotPublish",
      "setupRequiredHeadline",
      "setupRequiredBody",
      "noRepositoryBody",
      "aiUnavailableBody",
    ] as const) {
      expect(PRODUCT_COPY[key].length).toBeGreaterThan(10);
    }
  });
});

describe("forbidden overclaiming copy", () => {
  // Files that explicitly discuss forbidden terms (in a "we do NOT
  // claim X" or test/skill sense). They are exempt from the lint scan.
  const EXEMPT = [
    "src/lib/product-copy.ts",
    "src/lib/reliability/product-copy.test.ts",
  ];

  it("does not appear in any shipped src/ source file", () => {
    const files = listSourceFiles("src").filter(
      (p) => !EXEMPT.some((e) => p.endsWith(e.replace(/\//g, require("node:path").sep))),
    );
    const offenders: { file: string; phrase: string }[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8").toLowerCase();
      for (const phrase of FORBIDDEN_COPY) {
        if (text.includes(phrase.toLowerCase())) {
          offenders.push({ file, phrase });
        }
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });
});

describe("advisory wording on trust / security / readiness / health surfaces", () => {
  it("security page communicates advisory + not-a-substitute-for-review", () => {
    const src = read("src/routes/app.security.tsx");
    expect(src.toLowerCase()).toMatch(/advisory/);
    expect(src.toLowerCase()).toMatch(/not a substitute/);
  });

  it("readiness page communicates advisory + heuristic", () => {
    const src = read("src/routes/app.readiness.tsx");
    expect(src.toLowerCase()).toMatch(/advisory/);
    expect(src.toLowerCase()).toMatch(/heuristic/);
  });

  it("health page communicates advisory + heuristic", () => {
    const src = read("src/routes/app.health.tsx");
    expect(src.toLowerCase()).toMatch(/advisory/);
    expect(src.toLowerCase()).toMatch(/heuristic/);
  });

  it("trust page lists explicit-approval + never-automatic guarantees", () => {
    const src = read("src/routes/app.trust.tsx");
    expect(src).toMatch(/explicit approval/i);
    expect(src.toLowerCase()).toMatch(/never automatic|what is never automatic/);
  });
});

describe("empty repository state surfaces demo mode option", () => {
  it("offers a demo path alongside connect-repository", () => {
    const src = read("src/components/empty-states.tsx");
    expect(src).toMatch(/Try the demo/i);
    expect(src).toMatch(/to=\"\/demo\"/);
    expect(src.toLowerCase()).toMatch(/sample data only/);
  });
});
