# ComicRelief

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
Application
    ↓
Canonical Event
    ↓
Severity Gate
    ↓
Canonical Human Message
    ↓
ComicRelief
    ├── Humor Profile
    ├── Context Filter
    ├── Deterministic Catalog
    └── Meaning-Preserving Renderer
    ↓
Presented Message
```

ComicRelief sits downstream of operational logic. **Presentation has zero authority upstream.**

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

The library currently enforces this as a hard gate: `critical` and `emergency` messages never receive humor, regardless of profile.

## Deterministic by default

ComicRelief does **not** send your errors to an LLM and hope the improvisational comedian in the telemetry pipeline behaves itself.

Messages come from a deterministic, auditable catalog keyed by event code and humor profile. Selection is stable for a given input unless you explicitly provide a variant seed.

## Design rules

1. The canonical message must always remain present and unchanged.
2. Humor is additive only.
3. `critical` and `emergency` severities disable humor.
4. `off` always returns the canonical message only.
5. Unknown event codes fail safely to the canonical message.
6. Humor text has no access to permissions, actions, control flow, or severity mutation.
7. The renderer returns both canonical and presentation text so callers can log the canonical form independently.

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

```ts
comicRelief(input, options?)
```

Returns:

```ts
{
  canonical: string;
  message: string;
  humorApplied: boolean;
  profile: HumorProfile;
  severity: Severity;
  code: string;
}
```

## Project status

**v0.1 foundation**: deterministic renderer, severity gate, built-in catalog, custom catalogs, tests, and CI.

Next sensible steps are adapters for popular logging frameworks and a CLI demo. The core rule stays boring on purpose: jokes decorate messages; they do not govern systems.

## License

MIT
