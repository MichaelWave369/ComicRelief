import assert from "node:assert/strict";
import test from "node:test";

import {
  consoleMethodForSeverity,
  createConsoleAdapter,
  createStructuredAdapter,
  toStructuredRecord
} from "../dist/index.js";

function fakeConsole() {
  const calls = [];
  return {
    calls,
    sink: {
      log: (...data) => calls.push(["log", ...data]),
      info: (...data) => calls.push(["info", ...data]),
      warn: (...data) => calls.push(["warn", ...data]),
      error: (...data) => calls.push(["error", ...data])
    }
  };
}

test("console severity mapping is deterministic and presentation-only", () => {
  assert.equal(consoleMethodForSeverity("success"), "log");
  assert.equal(consoleMethodForSeverity("info"), "info");
  assert.equal(consoleMethodForSeverity("warning"), "warn");
  assert.equal(consoleMethodForSeverity("error"), "error");
  assert.equal(consoleMethodForSeverity("critical"), "error");
  assert.equal(consoleMethodForSeverity("emergency"), "error");
});

test("console adapter writes rendered warning to warn and preserves canonical", () => {
  const { calls, sink } = fakeConsole();
  const write = createConsoleAdapter({ console: sink });
  const canonical = "DNS lookup failed.";

  const result = write({
    code: "DNS_FAILURE",
    severity: "warning",
    canonical,
    profile: "sysadmin"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "warn");
  assert.equal(calls[0][1], result.message);
  assert.equal(result.canonical, canonical);
  assert.equal(result.message.startsWith(`${canonical}\n`), true);
});

test("console adapter never adds humor to critical events", () => {
  const { calls, sink } = fakeConsole();
  const write = createConsoleAdapter({ console: sink });
  const canonical = "Database corruption detected. Immediate recovery action required.";

  const result = write({
    code: "UNKNOWN_ERROR",
    severity: "critical",
    canonical,
    profile: "absurdist"
  });

  assert.deepEqual(calls, [["error", canonical]]);
  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
});

test("structured record keeps canonical and presentation in separate fields", () => {
  const canonical = "Build failed.";
  const context = { service: "api", build: 42 };

  const record = toStructuredRecord(
    {
      code: "BUILD_FAILED",
      severity: "error",
      canonical,
      profile: "deadpan"
    },
    { context }
  );

  assert.equal(record.canonical, canonical);
  assert.equal(record.message.startsWith(`${canonical}\n`), true);
  assert.equal(record.context, context);
  assert.equal(record.severity, "error");
});

test("structured adapter emits exactly the record it returns", () => {
  const emitted = [];
  const write = createStructuredAdapter((record) => emitted.push(record), {
    context: { component: "worker" }
  });

  const returned = write({
    code: "NETWORK_TIMEOUT",
    severity: "warning",
    canonical: "Connection timed out.",
    profile: "dry",
    variantSeed: "stable"
  });

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0], returned);
  assert.equal(returned.context.component, "worker");
});

test("structured adapter preserves no-humor policy for emergency events", () => {
  const emitted = [];
  const write = createStructuredAdapter((record) => emitted.push(record));
  const canonical = "Emergency shutdown required.";

  const returned = write({
    code: "BUILD_FAILED",
    severity: "emergency",
    canonical,
    profile: "sysadmin"
  });

  assert.equal(returned.message, canonical);
  assert.equal(returned.humorApplied, false);
  assert.equal(emitted[0].canonical, canonical);
});
