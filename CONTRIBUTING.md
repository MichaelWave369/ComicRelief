# Contributing to ComicRelief

ComicRelief welcomes code, adapters, documentation, tests, and new humor lines. The one thing contributions may not negotiate away is the trust boundary.

> **Humor may alter presentation, but never truth, severity, authority, or action semantics.**

## Development

```bash
npm install
npm run check
```

`npm run check` must compile the TypeScript package and pass the full Node test suite.

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

## Severity policy

`critical` and `emergency` always suppress humor. Contributions must not add bypasses, exceptions, or alternate presentation paths around this rule.

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

Prefer optional peer integrations or dependency-free structural interfaces where practical.

## Tests

Every behavior change should include an invariant-focused test. In particular, new integrations should test that:

1. canonical text is preserved exactly;
2. severity is preserved exactly;
3. `critical` and `emergency` remain humor-free;
4. unknown event codes fail closed unless explicitly configured;
5. adapters emit what the core actually returned.

## Pull requests

Keep pull requests narrow and explain whether the change affects:

- core rendering;
- catalog content;
- adapters;
- public types;
- documentation only.

If a change makes the operational path more clever, it deserves extra suspicion. ComicRelief is allowed to be funny. The infrastructure underneath it is not.
