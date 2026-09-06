import assert from "node:assert/strict";
import test from "node:test";

import { comicRelief, humorAllowed } from "../dist/index.js";

test("adds humor after the exact canonical message", () => {
  const canonical = "Connection timed out after 30 seconds.";
  const result = comicRelief({
    code: "NETWORK_TIMEOUT",
    severity: "warning",
    canonical,
    profile: "sysadmin"
  });

  assert.equal(result.canonical, canonical);
  assert.equal(result.humorApplied, true);
  assert.equal(result.message.startsWith(`${canonical}\n`), true);
  assert.equal(result.message.slice(0, canonical.length), canonical);
});

test("off profile always returns canonical text only", () => {
  const canonical = "DNS lookup failed.";
  const result = comicRelief({
    code: "DNS_FAILURE",
    severity: "warning",
    canonical,
    profile: "off"
  });

  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
  assert.equal("humor" in result, false);
});

test("critical severity fails closed to no humor", () => {
  const canonical = "Database corruption detected. Immediate recovery action required.";
  const result = comicRelief({
    code: "UNKNOWN_ERROR",
    severity: "critical",
    canonical,
    profile: "absurdist"
  });

  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
});

test("emergency severity fails closed to no humor", () => {
  const canonical = "Emergency shutdown required.";
  const result = comicRelief({
    code: "BUILD_FAILED",
    severity: "emergency",
    canonical,
    profile: "sysadmin"
  });

  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
});

test("unknown event codes do not borrow UNKNOWN_ERROR humor", () => {
  const canonical = "A caller-defined event occurred.";
  const result = comicRelief({
    code: "CALLER_DEFINED_EVENT",
    severity: "warning",
    canonical,
    profile: "dry"
  });

  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
});

test("selection is deterministic for identical input", () => {
  const input = {
    code: "NETWORK_TIMEOUT",
    severity: "warning",
    canonical: "Connection timed out.",
    profile: "dry",
    variantSeed: "request-42"
  };

  const first = comicRelief(input);
  const second = comicRelief(input);

  assert.deepEqual(second, first);
});

test("custom catalog entries override built-ins without touching canonical text", () => {
  const canonical = "DNS lookup failed.";
  const result = comicRelief(
    {
      code: "DNS_FAILURE",
      severity: "warning",
      canonical,
      profile: "sysadmin"
    },
    {
      catalog: {
        DNS_FAILURE: {
          sysadmin: ["Custom line."]
        }
      }
    }
  );

  assert.equal(result.canonical, canonical);
  assert.equal(result.message, `${canonical}\nCustom line.`);
  assert.equal(result.humor, "Custom line.");
});

test("empty custom profile intentionally disables humor", () => {
  const canonical = "DNS lookup failed.";
  const result = comicRelief(
    {
      code: "DNS_FAILURE",
      severity: "warning",
      canonical,
      profile: "sysadmin"
    },
    {
      catalog: {
        DNS_FAILURE: {
          sysadmin: []
        }
      }
    }
  );

  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
});

test("custom separator changes presentation only", () => {
  const canonical = "Build failed.";
  const result = comicRelief(
    {
      code: "BUILD_FAILED",
      severity: "error",
      canonical,
      profile: "deadpan"
    },
    { separator: " | " }
  );

  assert.equal(result.canonical, canonical);
  assert.equal(result.message.startsWith(`${canonical} | `), true);
});

test("empty canonical messages never receive humor", () => {
  const result = comicRelief({
    code: "DNS_FAILURE",
    severity: "warning",
    canonical: "",
    profile: "sysadmin"
  });

  assert.equal(result.message, "");
  assert.equal(result.humorApplied, false);
});

test("severity policy helper matches the hard gate", () => {
  assert.equal(humorAllowed("info"), true);
  assert.equal(humorAllowed("success"), true);
  assert.equal(humorAllowed("warning"), true);
  assert.equal(humorAllowed("error"), true);
  assert.equal(humorAllowed("critical"), false);
  assert.equal(humorAllowed("emergency"), false);
});
