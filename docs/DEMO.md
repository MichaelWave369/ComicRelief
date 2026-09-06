# Browser Playground

ComicRelief v0.5 includes a zero-runtime-dependency browser playground and catalog authoring surface.

The demo is intentionally a **consumer of the compiled package**, not a second implementation of ComicRelief.

## Data flow

```text
src/*.ts
   |
   | npm run build
   v
dist/*.js
   |
   | scripts/build-demo.mjs
   v
site/lib/*.js
   |
   v
demo/app.js
   |
   +--> Live message playground
   |
   +--> Catalog Lab
```

`demo/app.js` imports:

```js
import { ... } from "./lib/index.js";
```

The build step copies the complete `dist/` module graph into `site/lib/`. The browser therefore executes the same renderer, severity gate, deterministic catalog selection, and runtime catalog validator as package consumers.

## Local use

Build the static site:

```bash
npm run demo:build
```

The generated output is written to `site/` and is intentionally ignored by Git.

Serve it locally:

```bash
npm run demo:serve
```

The default address is:

```text
http://127.0.0.1:4173
```

Set `PORT` to use another local port.

## Playground behavior

The live playground exposes caller-owned presentation inputs:

- event code;
- severity;
- canonical message;
- humor profile;
- optional variant seed;
- optional validated custom catalog.

It does **not** infer operational facts. In particular, the browser layer does not decide:

- what severity an event should have;
- what event code represents a system condition;
- whether an operation succeeded or failed;
- what the authoritative canonical message should say.

Those values remain caller inputs, just as they are in the library and CLI.

## Catalog Lab

The Catalog Lab uses the package's exported `validateCatalog()` function.

A custom catalog is not eligible for playground use until:

1. the editor contains valid JSON;
2. `validateCatalog()` returns `valid: true`.

When validation fails, the custom-catalog toggle is disabled and the playground falls back to the built-in catalog behavior.

The editor supports:

- a generated starter catalog;
- inspection of the current built-in catalog;
- JSON formatting;
- explicit validation;
- live validation while editing.

Empty arrays remain valid and mean "disable humor for this exact event/profile."

## Trust boundary

The browser adds no new operational authority.

```text
DOM controls
    |
    v
validated presentation inputs
    |
    v
ComicRelief compiled core
    |
    v
presentation result
```

The browser cannot bypass the core's `critical` / `emergency` severity gate. A matching catalog line may exist, but high-severity rendering still returns canonical text only.

The browser also does not execute catalog text as code. Catalog lines are passed to ComicRelief as strings and rendered into the DOM through text-only properties such as `textContent`.

## Dependency boundary

The demo uses no remote JavaScript or stylesheet dependency. It does not require a frontend framework, bundler, CDN, analytics script, or runtime API request.

That keeps the authoring surface easy to audit and preserves ComicRelief's small dependency story.

## Tests

`test/demo.test.mjs` verifies that:

- the static build contains the expected compiled package graph;
- the browser app imports `./lib/index.js` instead of duplicating the renderer;
- the page has no remote script or stylesheet dependency;
- the copied package still suppresses humor for critical events;
- the copied package still rejects malformed custom catalog profiles.

The browser experience is allowed to be entertaining. Its authority model is not.
