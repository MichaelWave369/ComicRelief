import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const demoDir = resolve(root, "demo");
const distDir = resolve(root, "dist");
const siteDir = resolve(root, "site");
const libDir = resolve(siteDir, "lib");

await rm(siteDir, { recursive: true, force: true });
await mkdir(siteDir, { recursive: true });

await Promise.all([
  cp(resolve(demoDir, "index.html"), resolve(siteDir, "index.html")),
  cp(resolve(demoDir, "styles.css"), resolve(siteDir, "styles.css")),
  cp(resolve(demoDir, "app.js"), resolve(siteDir, "app.js"))
]);

await cp(distDir, libDir, { recursive: true });

console.log("ComicRelief demo built at ./site");
