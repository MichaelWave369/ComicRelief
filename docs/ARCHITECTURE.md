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
           - future logger bridges
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

## Structured logging guidance

For machine-ingested logs, prefer `toStructuredRecord` or `createStructuredAdapter`.

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
- an incident-management system;
- a safety monitor;
- an LLM prompt wrapper;
- a replacement for canonical error messages;
- a mechanism for hiding unpleasant system state.

If the core system does not know what happened, ComicRelief should not pretend it does.

## Future adapters

Framework integrations should remain thin translations around the stable core. A Pino or Winston adapter, for example, should map a `StructuredComicRecord` into that logger's native call shape rather than teaching the ComicRelief core about framework-specific concepts.

That separation keeps the joke layer replaceable and the operational layer boring, which is exactly how we want it.
