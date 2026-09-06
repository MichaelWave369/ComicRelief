import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cli = fileURLToPath(new URL("../bin/comicrelief.mjs", import.meta.url));

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8"
  });
}

test("help command prints usage and exits successfully", () => {
  const result = run(["help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /ComicRelief CLI/);
  assert.match(result.stdout, /catalog validate/);
});

test("render command emits canonical text plus deterministic humor", () => {
  const result = run([
    "render",
    "--code",
    "DNS_FAILURE",
    "--severity",
    "warning",
    "--profile",
    "sysadmin",
    "--message",
    "DNS lookup failed."
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^DNS lookup failed\./);
  assert.match(result.stdout, /DNS/);
});

test("render command preserves high-severity humor suppression", () => {
  const canonical = "Database corruption detected. Immediate recovery action required.";
  const result = run([
    "render",
    "--code",
    "UNKNOWN_ERROR",
    "--severity",
    "critical",
    "--profile",
    "absurdist",
    "--message",
    canonical
  ]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), canonical);
});

test("render --json emits the full structured result", () => {
  const result = run([
    "render",
    "--code",
    "MERGE_CONFLICT",
    "--severity",
    "warning",
    "--profile",
    "dry",
    "--message",
    "Merge conflict detected.",
    "--json"
  ]);

  assert.equal(result.status, 0);
  const value = JSON.parse(result.stdout);
  assert.equal(value.canonical, "Merge conflict detected.");
  assert.equal(value.severity, "warning");
  assert.equal(value.humorApplied, true);
});

test("events and profiles expose runtime discovery", () => {
  const events = run(["events", "--json"]);
  assert.equal(events.status, 0);
  assert.ok(JSON.parse(events.stdout).includes("DNS_FAILURE"));

  const profiles = run(["profiles", "--json"]);
  assert.equal(profiles.status, 0);
  const values = JSON.parse(profiles.stdout);
  assert.ok(values.includes("off"));
  assert.ok(values.includes("sysadmin"));
});

test("catalog sample emits valid starter JSON", () => {
  const result = run(["catalog", "sample"]);
  assert.equal(result.status, 0);
  const value = JSON.parse(result.stdout);
  assert.ok(value.MY_APP_EVENT);
});

test("catalog validate accepts a valid custom catalog", async () => {
  const dir = await mkdtemp(join(tmpdir(), "comicrelief-"));
  const file = join(dir, "catalog.json");
  await writeFile(
    file,
    JSON.stringify({
      MY_EVENT: {
        dry: ["A custom line."],
        sysadmin: []
      }
    }),
    "utf8"
  );

  const result = run(["catalog", "validate", file, "--json"]);
  assert.equal(result.status, 0);
  const value = JSON.parse(result.stdout);
  assert.equal(value.valid, true);
  assert.deepEqual(value.eventCodes, ["MY_EVENT"]);
});

test("catalog validate rejects malformed catalog content with a useful path", async () => {
  const dir = await mkdtemp(join(tmpdir(), "comicrelief-"));
  const file = join(dir, "catalog.json");
  await writeFile(
    file,
    JSON.stringify({
      MY_EVENT: {
        chaos: ["Nope."]
      }
    }),
    "utf8"
  );

  const result = run(["catalog", "validate", file]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\$\.MY_EVENT\.chaos/);
});

test("render can use a custom catalog file without mutating canonical text", async () => {
  const dir = await mkdtemp(join(tmpdir(), "comicrelief-"));
  const file = join(dir, "catalog.json");
  await writeFile(
    file,
    JSON.stringify({
      MY_EVENT: {
        dry: ["Custom presentation line."]
      }
    }),
    "utf8"
  );

  const result = run([
    "render",
    "--code",
    "MY_EVENT",
    "--severity",
    "warning",
    "--profile",
    "dry",
    "--message",
    "Canonical event text.",
    "--catalog",
    file
  ]);

  assert.equal(result.status, 0);
  assert.equal(
    result.stdout.trim(),
    "Canonical event text.\nCustom presentation line."
  );
});

test("unknown commands fail closed with a nonzero exit code", () => {
  const result = run(["summon-clown"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command/);
});
