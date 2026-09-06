import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, test } from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const site = resolve(root, "site");

before(() => {
  execFileSync(process.execPath, ["scripts/build-demo.mjs"], {
    cwd: root,
    stdio: "pipe"
  });
});

after(async () => {
  await rm(site, { recursive: true, force: true });
});

test("demo build emits static shell plus compiled package graph", async () => {
  await Promise.all([
    access(resolve(site, "index.html")),
    access(resolve(site, "styles.css")),
    access(resolve(site, "app.js")),
    access(resolve(site, "lib/index.js")),
    access(resolve(site, "lib/core.js")),
    access(resolve(site, "lib/catalog-tools.js"))
  ]);
});

test("demo app imports the built package instead of duplicating the renderer", async () => {
  const source = await readFile(resolve(site, "app.js"), "utf8");

  assert.match(source, /from "\.\/lib\/index\.js"/);
  assert.doesNotMatch(source, /function\s+comicRelief\s*\(/);
  assert.doesNotMatch(source, /function\s+stableHash\s*\(/);
});

test("demo shell has no remote script or stylesheet dependency", async () => {
  const html = await readFile(resolve(site, "index.html"), "utf8");

  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:\/\//i);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
});

test("compiled package copied into the demo preserves critical no-humor policy", async () => {
  const moduleUrl = `${pathToFileURL(resolve(site, "lib/index.js")).href}?demo-test=critical`;
  const { comicRelief } = await import(moduleUrl);

  const result = comicRelief({
    code: "DNS_FAILURE",
    severity: "critical",
    canonical: "DNS infrastructure unavailable.",
    profile: "sysadmin"
  });

  assert.equal(result.humorApplied, false);
  assert.equal(result.canonical, "DNS infrastructure unavailable.");
  assert.equal(result.message, result.canonical);
});

test("compiled package copied into the demo validates custom catalogs before use", async () => {
  const moduleUrl = `${pathToFileURL(resolve(site, "lib/index.js")).href}?demo-test=catalog`;
  const { validateCatalog } = await import(moduleUrl);

  const invalid = validateCatalog({
    MY_EVENT: {
      surprise: ["This profile does not exist."]
    }
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors[0]?.path, "$.MY_EVENT.surprise");
});
