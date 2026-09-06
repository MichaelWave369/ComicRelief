import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const siteDir = join(root, "site");
const port = Number.parseInt(process.env.PORT ?? "4173", 10);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const normalized = normalize(relative);

  if (normalized.startsWith("..") || normalized.includes("../")) {
    return undefined;
  }

  return join(siteDir, normalized);
}

const server = createServer(async (request, response) => {
  const path = safePath(request.url ?? "/");

  if (!path) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  try {
    const info = await stat(path);
    if (!info.isFile()) {
      throw new Error("Not a file");
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentTypes[extname(path)] ?? "application/octet-stream"
    });
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ComicRelief demo: http://127.0.0.1:${port}`);
});
