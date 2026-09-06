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

## Core pipeline

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
Adapters
  ├── Console
  ├── Structured Logging
  ├── Pino-compatible
  └── Winston-compatible
```

ComicRelief sits downstream of operational logic. **Presentation has zero authority upstream.**

For the full trust boundary and invariants, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

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

Example output:

```text
Connection to api.example.com timed out after 30 seconds.
Networking remains a collaborative exercise in disappointment.
```

## Console adapter

For human-facing CLI or terminal output:

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

The adapter maps severity to a normal console channel without changing the severity itself:

| Severity | Console method |
| --- | --- |
| `success` | `console.log` |
| `info` | `console.info` |
| `warning` | `console.warn` |
| `error` | `console.error` |
| `critical` | `console.error` |
| `emergency` | `console.error` |

The complete `ComicReliefResult` is still returned, including the untouched canonical message.

Run the included example:

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

Result shape:

```json
{
  "code": "BUILD_FAILED",
  "severity": "error",
  "profile": "deadpan",
  "canonical": "Build failed.",
  "message": "Build failed.\nThe build has reconsidered its commitment to existing.",
  "humorApplied": true,
  "humor": "The build has reconsidered its commitment to existing.",
  "context": {
    "service": "api",
    "build": 42
  }
}
```

You can also bridge into any logger without adding a ComicRelief dependency on that framework:

```ts
import { createStructuredAdapter } from "comicrelief";

const write = createStructuredAdapter((record) => {
  myLogger.log(record.severity, record.canonical, record);
});
```

Run the included example:

```bash
npm run example:structured
```

## Pino-compatible adapter

ComicRelief does not depend on Pino. It accepts the tiny `info` / `warn` / `error` method surface Pino already exposes.

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

The rendered message becomes the Pino message while ComicRelief metadata stays namespaced:

```json
{
  "msg": "DNS lookup failed.\nIt is DNS. It was always going to be DNS.",
  "comicRelief": {
    "code": "DNS_FAILURE",
    "severity": "warning",
    "profile": "sysadmin",
    "canonical": "DNS lookup failed.",
    "presentation": "DNS lookup failed.\nIt is DNS. It was always going to be DNS.",
    "humorApplied": true,
    "context": {
      "service": "api"
    }
  }
}
```

Caller context stays nested instead of being spread into Pino's top-level object, avoiding collisions with framework-owned fields such as `level`, `time`, or `msg`.

Run the dependency-free shape example:

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

const log = createWinstonAdapter(logger, {
  context: { service: "worker" }
});

log({
  code: "MERGE_CONFLICT",
  severity: "error",
  canonical: "Merge conflict detected in 4 files.",
  profile: "deadpan"
});
```

The adapter emits a normal Winston info object with `level` and `message`, plus a namespaced `comicRelief` metadata object. Caller context never gets to overwrite the framework's `level` or `message` fields.

Run the dependency-free shape example:

```bash
npm run example:winston
```

## Logger severity bridge

Framework adapters use a deliberately conservative three-level bridge:

| ComicRelief severity | Logger level |
| --- | --- |
| `info` | `info` |
| `success` | `info` |
| `warning` | `warn` |
| `error` | `error` |
| `critical` | `error` |
| `emergency` | `error` |

The original ComicRelief severity remains preserved in structured metadata. This mapping chooses an output channel; it does not reinterpret operational severity.

## Profiles

- `off`
- `dry`
- `deadpan`
- `absurdist`
- `nerdy`
- `sarcasm-light`
- `sysadmin`

## Severity policy

| Severity | Humor budget |
| --- | --- |
| `info` | full |
| `success` | full |
| `warning` | moderate |
| `error` | mild |
| `critical` | none |
| `emergency` | none |

The library enforces the last two as a hard gate: `critical` and `emergency` messages never receive humor, regardless of profile or catalog contents.

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
7. The renderer returns both canonical and presentation text so callers can log the canonical form independently.
8. Adapters may choose output channels or record shapes, but do not alter core results.
9. Framework adapters keep ComicRelief metadata namespaced instead of merging caller data into logger-owned fields.
10. Logger exceptions propagate normally; ComicRelief does not swallow or reinterpret sink failures.

## Built-in event codes

The first catalog includes:

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

You can also supply your own catalog entries without changing the safety model.

## API

### Core

```ts
comicRelief(input, options?)
humorAllowed(severity)
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

Both logger adapters return the complete structured ComicRelief record after writing it.

### Core result

```ts
{
  canonical: string;
  message: string;
  humorApplied: boolean;
  humor?: string;
  profile: HumorProfile;
  severity: Severity;
  code: string;
}
```

## Development

```bash
npm install
npm run check
```

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md), especially before adding new catalog lines or adapters.

## Project status

**v0.3 candidate**

- deterministic renderer;
- hard severity gate;
- built-in and custom catalogs;
- stable variant selection;
- console adapter;
- structured record adapter;
- generic structured sink bridge;
- Pino-compatible adapter;
- Winston-compatible adapter;
- namespaced logger metadata;
- invariant tests;
- CI;
- documented trust boundary.

Likely next steps: CLI ergonomics, catalog tooling, a small browser demo, and optional framework-specific examples. The core rule stays boring on purpose: jokes decorate messages; they do not govern systems.

## License

MIT
