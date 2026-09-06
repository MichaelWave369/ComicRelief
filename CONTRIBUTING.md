# Contributing to ComicRelief

ComicRelief welcomes code, adapters, documentation, tests, CLI improvements, browser demo work, catalog tooling, and new humor lines. The one thing contributions may not negotiate away is the trust boundary.

> **Humor may alter presentation, but never truth, severity, authority, or action semantics.**

## Development

```bash
npm install
npm run check
npm run cli -- help
npm run demo:serve
```

`npm run check` must compile the TypeScript package and pass the full Node test suite, including executable-level CLI integration tests and browser demo build invariants.

## Adding humor

Built-in humor lives in `src/catalog.ts` and is keyed by stable event code and profile.

A good catalog line should:

- preserve the meaning and urgency of the canonical message;
- be short enough to work in terminals and developer tooling;
- avoid insulting the user or blaming a specific person;
- avoid implying that an action succeeded or failed when the canonical event did not say so;
- avoid fake remediation instructions;
- avoid jokes that could obscure safety-critical information;
- remain useful after repeated exposure.

If a line needs operational context to be safe or accurate, it probably does not belong in the built-in deterministic catalog.

## Custom catalog tooling

Runtime catalog validation lives in `src/catalog-tools.ts`. The JSON boundary is intentionally stricter than a TypeScript annotation because custom catalogs can arrive from files and other untyped sources.

Changes to validation must preserve these rules:

- the root is an object;
- each event entry is an object;
- only active humor profile names are catalog keys;
- profile values are arrays of strings;
- empty or whitespace-only strings are rejected;
- empty arrays remain valid because they explicitly disable humor for that event/profile.

Use the CLI to inspect starter output or validate a file:

```bash
npm run cli -- catalog sample
npm run cli -- catalog validate ./comicrelief.catalog.json
```

See [`docs/CATALOGS.md`](docs/CATALOGS.md) for the public format.

## Severity policy

`critical` and `emergency` always suppress humor. Contributions must not add bypasses, exceptions, CLI flags, browser controls, catalog rules, or alternate presentation paths around this rule.

## Adding an adapter

Adapters should be thin. They may:

- choose an output channel;
- shape a structured record;
- translate ComicRelief output into a logger/framework API.

Adapters should not:

- classify severity;
- alter canonical text;
- suppress events;
- change application control flow;
- introduce hidden network calls;
- make the ComicRelief core depend on a logging framework.

Prefer dependency-free structural interfaces where practical.

## CLI changes

The CLI is a presentation and developer-tooling surface. It may collect caller input, validate catalog files, render output, and expose discovery commands.

It must not:

- infer severity from message text;
- invent an event code;
- rewrite the caller's canonical message;
- bypass core severity gates;
- silently accept malformed custom catalogs;
- turn rendering or validation failures into successful exit codes.

CLI behavior changes should be tested by invoking `bin/comicrelief.mjs` as a child process, not only by unit-testing internal helpers.

## Browser demo changes

The browser playground is a consumer of the compiled package, not a second implementation.

Changes must preserve these rules:

- `demo/app.js` imports the generated package graph from `./lib/index.js`;
- do not duplicate `comicRelief`, stable hashing, severity gates, or catalog validation in demo code;
- custom catalog text must pass the exported runtime validator before use;
- untrusted catalog/result strings must be rendered with text-only DOM APIs;
- do not add remote runtime JavaScript or stylesheet dependencies;
- do not add analytics or hidden network calls;
- browser controls collect explicit inputs but do not infer operational facts.

Build or serve the demo with:

```bash
npm run demo:build
npm run demo:serve
```

See [`docs/DEMO.md`](docs/DEMO.md) for the browser-specific architecture.

## Tests

Every behavior change should include an invariant-focused test. In particular, new integrations should test that:

1. canonical text is preserved exactly;
2. severity is preserved exactly;
3. `critical` and `emergency` remain humor-free;
4. unknown event codes fail closed unless explicitly configured;
5. adapters emit what the core actually returned;
6. malformed untyped catalog data is rejected before rendering;
7. CLI failures return nonzero exit status;
8. browser builds consume the compiled package rather than a duplicated renderer.

## Pull requests

Keep pull requests narrow and explain whether the change affects:

- core rendering;
- catalog content or validation;
- CLI behavior;
- browser demo behavior;
- adapters;
- public types;
- documentation only.

If a change makes the operational path more clever, it deserves extra suspicion. ComicRelief is allowed to be funny. The infrastructure underneath it is not.
