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
                      v
                 Adapters
           - console output
           - structured records
           - Pino-compatible
           - Winston-compatible
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

Example output shape:

```json
{
  "msg": "DNS lookup failed.\nIt is DNS. It was always going to be DNS.",
  "comicRelief": {
    "code": "DNS_FAILURE",
    "severity": "warning",
    "canonical": "DNS lookup failed.",
    "presentation": "DNS lookup failed.\nIt is DNS. It was always going to be DNS.",
    "humorApplied": true
  }
}
```

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
- a mechanism for hiding unpleasant system state.

If the core system does not know what happened, ComicRelief should not pretend it does.

## Adapter rule

Framework integrations remain thin translations around the stable core. Pino and Winston adapters map a `StructuredComicRecord` into each logger's native call shape; they do not teach the ComicRelief core about framework-specific lifecycle, transport, serialization, or configuration concepts.

That separation keeps the joke layer replaceable and the operational layer boring, which is exactly how we want it.
