# ComicRelief

[![CI](https://github.com/MichaelWave369/ComicRelief/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelWave369/ComicRelief/actions/workflows/ci.yml)

**Serious software. Unnecessarily entertaining error messages.**

ComicRelief is a tiny, deterministic presentation layer for adding humor to software messages **without changing what the software means or does**.

> **Humor may alter presentation, but never truth, severity, authority, or action semantics.**

The canonical message always remains intact. ComicRelief can append a joke, but it cannot suppress an error, downgrade severity, change permissions, alter an action, or turn uncertainty into certainty.

## Why

Software errors are already annoying. They do not also need to sound like they were written by a filing cabinet.

```text
Canonical:
Connection to api.example.com timed out after 30 seconds.

ComicRelief / sysadmin:
Connection to api.example.com timed out after 30 seconds.
Networking remains a collaborative exercise in disappointment.
```

For serious events, humor automatically backs off:

```text
Database corruption detected. Immediate recovery action required.
```

No joke. The database is turning into soup. We have priorities.

## Architecture

```text
Application / Domain Logic
        ↓
Canonical Event
        ↓
ComicRelief Core
  ├── Severity Gate
  ├── Humor Profile
  ├── Deterministic Catalog
  └── Stable Variant Selection
        ↓
Canonical + Presentation Result
        ↓
Adapters / Tools
  ├── Console
  ├── Structured Logging
  ├── Pino-compatible
  ├── Winston-compatible
  └── CLI
```

ComicRelief sits downstream of operational logic. **Presentation has zero authority upstream.**

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the trust boundary and [`docs/CATALOGS.md`](docs/CATALOGS.md) for custom catalog rules.

## Install

```bash
npm install comicrelief
```

Until the first npm release, install from GitHub or clone the repository directly.

## Quick start

```ts
import { comicRelief } from "comicrelief";

const result = comicRelief({
  code: "NETWORK_TIMEOUT",
  severity: "warning",
  canonical: "Connection to api.example.com timed out after 30 seconds.",
  profile: "sysadmin"
});

console.log(result.message);
```

## CLI

The package exposes a `comicrelief` executable. In the repository you can run the same CLI with `npm run cli -- ...` after installing dependencies.

### Render a message

```bash
comicrelief render \
  --code DNS_FAILURE \
  --severity warning \
  --profile sysadmin \
  --message "DNS lookup failed."
```

Example output:

```text
DNS lookup failed.
It is DNS. It was always going to be DNS.
```

Machine-readable output:

```bash
comicrelief render \
  --code MERGE_CONFLICT \
  --severity warning \
  --profile dry \
  --message "Merge conflict detected." \
  --json
```

### Discover built-ins

```bash
comicrelief events
comicrelief profiles
```

Both commands also accept `--json`.

### Catalog tools

Generate a valid starter catalog:

```bash
comicrelief catalog sample
```

Validate a custom JSON catalog:

```bash
comicrelief catalog validate ./comicrelief.catalog.json
```

Render with it:

```bash
comicrelief render \
  --code MY_APP_EVENT \
  --severity warning \
  --profile dry \
  --message "Canonical event text." \
  --catalog ./comicrelief.catalog.json
```

Validation failures return a nonzero exit code and include a path to the invalid value. See [`docs/CATALOGS.md`](docs/CATALOGS.md) for the full format.

## Profiles

- `off`
- `dry`
- `deadpan`
- `absurdist`
- `nerdy`
- `sarcasm-light`
- `sysadmin`

Runtime discovery is also exported through `HUMOR_PROFILES` and `ACTIVE_HUMOR_PROFILES`.

## Severity policy

| Severity | Humor budget |
| --- | --- |
| `info` | full |
| `success` | full |
| `warning` | moderate |
| `error` | mild |
| `critical` | none |
| `emergency` | none |

`critical` and `emergency` are hard gates. They never receive humor regardless of profile, CLI options, or catalog contents.

## Catalog tooling API

```ts
import {
  catalogEventCodes,
  isHumorCatalog,
  starterCatalog,
  validateCatalog
} from "comicrelief";
```

`validateCatalog(value)` performs runtime validation for JSON and other untyped sources. `isHumorCatalog(value)` is the matching TypeScript type guard.

An empty profile array is intentionally valid and disables humor for that exact event/profile pair.

## Console adapter

```ts
import { createConsoleAdapter } from "comicrelief";

const write = createConsoleAdapter();

write({
  code: "DNS_FAILURE",
  severity: "warning",
  canonical: "DNS lookup failed.",
  profile: "sysadmin"
});
```

Severity chooses the output channel without changing the original severity.

| Severity | Console method |
| --- | --- |
| `success` | `console.log` |
| `info` | `console.info` |
| `warning` | `console.warn` |
| `error` | `console.error` |
| `critical` | `console.error` |
| `emergency` | `console.error` |

Run the example:

```bash
npm run example:console
```

## Structured logging

For machine-ingested logs, keep canonical and presentation text separate:

```ts
import { toStructuredRecord } from "comicrelief";

const record = toStructuredRecord(
  {
    code: "BUILD_FAILED",
    severity: "error",
    canonical: "Build failed.",
    profile: "deadpan"
  },
  {
    context: {
      service: "api",
      build: 42
    }
  }
);
```

Run the example:

```bash
npm run example:structured
```

## Pino-compatible adapter

ComicRelief does not depend on Pino. It accepts the tiny `info` / `warn` / `error` surface Pino already exposes.

```ts
import pino from "pino";
import { createPinoAdapter } from "comicrelief";

const logger = pino();
const log = createPinoAdapter(logger, {
  context: { service: "api" }
});

log({
  code: "DNS_FAILURE",
  severity: "warning",
  canonical: "DNS lookup failed.",
  profile: "sysadmin"
});
```

ComicRelief metadata stays under a `comicRelief` namespace instead of colliding with Pino-owned fields.

```bash
npm run example:pino
```

## Winston-compatible adapter

ComicRelief also accepts Winston's `logger.log(info)` shape without importing Winston itself.

```ts
import winston from "winston";
import { createWinstonAdapter } from "comicrelief";

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const log = createWinstonAdapter(logger);

log({
  code: "MERGE_CONFLICT",
  severity: "error",
  canonical: "Merge conflict detected in 4 files.",
  profile: "deadpan"
});
```

```bash
npm run example:winston
```

## Logger severity bridge

| ComicRelief severity | Logger level |
| --- | --- |
| `info` | `info` |
| `success` | `info` |
| `warning` | `warn` |
| `error` | `error` |
| `critical` | `error` |
| `emergency` | `error` |

The original severity remains preserved in ComicRelief metadata. The mapping chooses an output channel; it does not reinterpret operational severity.

## Deterministic by default

ComicRelief does **not** send your errors to an LLM and hope the improvisational comedian in the telemetry pipeline behaves itself.

Messages come from a deterministic, auditable catalog keyed by event code and humor profile. Selection is stable for a given input unless you explicitly provide a variant seed.

No network request. No random selection. No hidden model call.

## Design rules

1. The canonical message must always remain present and unchanged.
2. Humor is additive only.
3. `critical` and `emergency` severities disable humor.
4. `off` always returns the canonical message only.
5. Unknown event codes fail safely to the canonical message.
6. Humor text has no access to permissions, actions, control flow, or severity mutation.
7. The renderer returns canonical and presentation text separately.
8. Adapters may choose output channels or record shapes, but do not alter core results.
9. Framework adapters keep ComicRelief metadata namespaced.
10. Logger exceptions propagate normally.
11. CLI catalog validation rejects malformed untyped input before rendering.
12. CLI commands do not infer severity, event codes, or canonical text on the caller's behalf.

## Built-in event codes

- `NETWORK_TIMEOUT`
- `DNS_FAILURE`
- `TLS_EXPIRED`
- `DISK_FULL`
- `DEPENDENCY_FAILURE`
- `MERGE_CONFLICT`
- `BUILD_FAILED`
- `RATE_LIMITED`
- `SERVICE_UNAVAILABLE`
- `AUTH_FAILED`
- `PRINTER_OFFLINE`
- `UNKNOWN_ERROR`

Use `comicrelief events` or `catalogEventCodes()` rather than hard-coding this list in tooling.

## API

### Core

```ts
comicRelief(input, options?)
humorAllowed(severity)
```

### Catalog tooling

```ts
validateCatalog(value)
isHumorCatalog(value)
catalogEventCodes(catalog?)
starterCatalog()
HUMOR_PROFILES
ACTIVE_HUMOR_PROFILES
```

### Generic adapters

```ts
createConsoleAdapter(options?)
consoleMethodForSeverity(severity)
toStructuredRecord(input, options?)
createStructuredAdapter(sink, options?)
```

### Logger adapters

```ts
createPinoAdapter(logger, options?)
createWinstonAdapter(logger, options?)
loggerLevelForSeverity(severity)
toLoggerMetadata(record)
```

## Development

```bash
npm install
npm run check
npm run cli -- help
```

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md), especially before adding new catalog lines or adapters.

## Project status

**v0.4 candidate**

- deterministic renderer;
- hard severity gate;
- built-in and custom catalogs;
- runtime catalog validation;
- catalog discovery and starter tooling;
- CLI rendering and JSON output;
- CLI catalog validation;
- console and structured adapters;
- Pino- and Winston-compatible adapters;
- namespaced logger metadata;
- invariant and CLI integration tests;
- CI;
- documented trust boundary.

Likely next steps: a small browser demo, catalog authoring ergonomics, package/release hardening, and broader compatibility testing. The core rule stays boring on purpose: jokes decorate messages; they do not govern systems.

## License

MIT
