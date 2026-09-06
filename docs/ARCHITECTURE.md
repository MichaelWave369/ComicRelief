# ComicRelief Architecture

ComicRelief is intentionally narrow: it transforms **presentation**, not operational meaning.

The core architectural rule is:

> **Presentation has zero authority upstream.**

## Data flow

```text
Application / Domain Logic
        |
        v
Canonical Event
(code, severity, canonical text)
        |
        v
ComicRelief Core
  - severity gate
  - profile selection
  - deterministic catalog lookup
  - stable variant selection
        |
        +--------------------------+
        |                          |
        v                          v
Canonical Message            Presentation Message
(unchanged)                  (canonical + optional humor)
        |                          |
        +-------------+------------+
                      |
          +-----------+-----------+
          |                       |
          v                       v
       Adapters                 CLI / Tools
  - console output          - render messages
  - structured records     - discover events/profiles
  - Pino-compatible        - validate catalogs
  - Winston-compatible     - emit starter catalogs
```

## Trust boundary

ComicRelief treats the caller-provided `canonical` message and `severity` as authoritative inputs. It does not infer either value and does not expose any API for changing them.

The library may select a humor string, but that string has no authority to:

- suppress an event;
- downgrade or upgrade severity;
- grant or revoke permissions;
- change a return value;
- alter control flow;
- trigger retries, shutdowns, deployments, or recovery actions;
- rewrite the canonical message;
- convert uncertainty into certainty.

## Hard invariants

### 1. Canonical preservation

`result.canonical` is exactly the caller-provided canonical string.

When humor is applied, `result.message` begins with the exact canonical string and only appends presentation text.

### 2. High-severity fail-closed behavior

`critical` and `emergency` events receive no humor regardless of profile or catalog contents.

### 3. Unknown-code fail-closed behavior

Unknown event codes receive no humor unless the caller supplies an explicit custom catalog entry for that code.

ComicRelief does not fall back to a generic joke because doing so would invent presentation semantics the caller did not request.

### 4. Deterministic selection

Built-in and custom humor lines are selected deterministically from stable input material. No network call, random generator, or language model is involved in the default path.

### 5. Adapter confinement

Adapters may choose an output channel or record shape. They do not change the ComicRelief core result.

For example, the console adapter maps `warning` to `console.warn` and `critical` to `console.error`, but the `severity` field itself remains unchanged.

### 6. Logger metadata confinement

Framework adapters place ComicRelief data under a dedicated metadata namespace, `comicRelief` by default.

Caller-owned context remains nested beneath that metadata instead of being spread across framework-owned top-level fields. This prevents caller data such as `level`, `message`, `msg`, or similar names from silently replacing logger semantics.

The framework-facing message may contain humor, but the exact canonical text remains separately addressable as `comicRelief.canonical`.

### 7. Logger failure transparency

ComicRelief does not catch, suppress, reinterpret, or retry exceptions thrown by a logger sink.

If Pino, Winston, a transport, or a caller-provided compatible logger fails, that failure propagates according to the logger's normal behavior. Presentation code does not become an accidental recovery policy.

### 8. Untyped catalog validation

Custom catalogs may arrive from JSON files or other untyped sources. Runtime validation occurs before CLI rendering when a catalog file is supplied.

Validation rejects malformed roots, malformed event entries, unknown profile names, non-array profile values, non-string lines, and empty or whitespace-only lines.

Empty arrays remain valid because they have an explicit meaning: disable humor for that exact event/profile pair.

Catalog validation does not grant a custom catalog authority over severity, canonical text, or control flow. A valid catalog is still only presentation data.

### 9. CLI confinement

The CLI collects caller-provided values and invokes the same public core used by library consumers.

It may:

- render a caller-supplied event;
- emit JSON output;
- list built-in event codes and profiles;
- validate custom catalog JSON;
- emit a starter catalog.

It does not:

- infer severity from text;
- invent an event code;
- rewrite canonical text;
- bypass high-severity suppression;
- convert malformed catalog input into a successful render;
- swallow CLI validation failures behind a zero exit code.

The CLI is a developer convenience surface, not an alternate policy engine.

## Logger severity bridge

The Pino- and Winston-compatible adapters use a conservative three-channel mapping:

| ComicRelief severity | Framework level |
| --- | --- |
| `info` | `info` |
| `success` | `info` |
| `warning` | `warn` |
| `error` | `error` |
| `critical` | `error` |
| `emergency` | `error` |

This mapping selects a framework output level only. The authoritative ComicRelief severity remains preserved in the structured metadata.

## Pino-compatible boundary

ComicRelief uses only this conceptual Pino surface:

```ts
logger.info(bindings, message)
logger.warn(bindings, message)
logger.error(bindings, message)
```

The adapter does not import Pino, configure transports, create child loggers, change serializers, or control Pino lifecycle.

## Winston-compatible boundary

ComicRelief uses only Winston's normal info-object concept:

```ts
logger.log({
  level: "warn",
  message: "...",
  comicRelief: { ... }
});
```

The adapter does not import Winston, construct transports, mutate formats, or own logger configuration.

## Structured logging guidance

For framework-neutral machine-ingested logs, prefer `toStructuredRecord` or `createStructuredAdapter`.

```json
{
  "code": "DNS_FAILURE",
  "severity": "warning",
  "canonical": "DNS lookup failed.",
  "message": "DNS lookup failed.\nIt is DNS. It was always going to be DNS.",
  "humorApplied": true,
  "profile": "sysadmin"
}
```

This keeps the operational message independently addressable even when the human-facing presentation contains humor.

## What ComicRelief is not

ComicRelief is not:

- an error classifier;
- a logging framework;
- a logger configuration system;
- a transport manager;
- an incident-management system;
- a safety monitor;
- an LLM prompt wrapper;
- a replacement for canonical error messages;
- a mechanism for hiding unpleasant system state;
- a policy engine for deciding whether an event is serious.

If the core system does not know what happened, ComicRelief should not pretend it does.

## Extension rule

Adapters and tools remain thin translations around the stable core. Pino and Winston adapters map a `StructuredComicRecord` into each logger's native call shape. The CLI maps explicit command-line values into the same public renderer and catalog validator.

Neither layer teaches the ComicRelief core about framework lifecycle, transport, serialization, application policy, or incident response.

That separation keeps the joke layer replaceable and the operational layer boring, which is exactly how we want it.
