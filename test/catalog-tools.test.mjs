import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIVE_HUMOR_PROFILES,
  HUMOR_PROFILES,
  catalogEventCodes,
  isHumorCatalog,
  starterCatalog,
  validateCatalog
} from "../dist/index.js";

test("built-in catalog event codes are stable sorted output", () => {
  const codes = catalogEventCodes();
  assert.ok(codes.includes("DNS_FAILURE"));
  assert.ok(codes.includes("NETWORK_TIMEOUT"));
  assert.deepEqual([...codes].sort((a, b) => a.localeCompare(b)), codes);
});

test("runtime profile lists expose off only at the presentation level", () => {
  assert.ok(HUMOR_PROFILES.includes("off"));
  assert.equal(ACTIVE_HUMOR_PROFILES.includes("off"), false);
  assert.ok(ACTIVE_HUMOR_PROFILES.includes("sysadmin"));
});

test("valid catalog accepts empty arrays as explicit humor disables", () => {
  const value = {
    DNS_FAILURE: {
      dry: [],
      sysadmin: ["Still DNS."]
    }
  };

  const result = validateCatalog(value);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(isHumorCatalog(value), true);
});

test("catalog validator rejects unknown profiles", () => {
  const result = validateCatalog({
    DNS_FAILURE: {
      chaos: ["Nope."]
    }
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0].path, "$.DNS_FAILURE.chaos");
});

test("catalog validator rejects non-array profile values", () => {
  const result = validateCatalog({
    DNS_FAILURE: {
      dry: "Not an array."
    }
  });

  assert.equal(result.valid, false);
  assert.match(result.errors[0].message, /array of strings/i);
});

test("catalog validator rejects non-string and blank lines with exact paths", () => {
  const result = validateCatalog({
    MY_EVENT: {
      dry: ["Good.", 42, "   "]
    }
  });

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.errors.map((entry) => entry.path),
    ["$.MY_EVENT.dry[1]", "$.MY_EVENT.dry[2]"]
  );
});

test("catalog validator rejects non-object roots and event entries", () => {
  const root = validateCatalog([]);
  assert.equal(root.valid, false);
  assert.equal(root.errors[0].path, "$");

  const event = validateCatalog({ DNS_FAILURE: [] });
  assert.equal(event.valid, false);
  assert.equal(event.errors[0].path, "$.DNS_FAILURE");
});

test("starter catalog is valid and includes an application-owned event", () => {
  const catalog = starterCatalog();
  assert.equal(validateCatalog(catalog).valid, true);
  assert.ok(catalogEventCodes(catalog).includes("MY_APP_EVENT"));
});
