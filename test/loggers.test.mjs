import assert from "node:assert/strict";
import test from "node:test";

import {
  createPinoAdapter,
  createWinstonAdapter,
  loggerLevelForSeverity,
  toLoggerMetadata
} from "../dist/index.js";

test("logger severity bridge is conservative and total", () => {
  assert.equal(loggerLevelForSeverity("info"), "info");
  assert.equal(loggerLevelForSeverity("success"), "info");
  assert.equal(loggerLevelForSeverity("warning"), "warn");
  assert.equal(loggerLevelForSeverity("error"), "error");
  assert.equal(loggerLevelForSeverity("critical"), "error");
  assert.equal(loggerLevelForSeverity("emergency"), "error");
});

test("Pino adapter preserves canonical text in structured metadata", () => {
  const calls = [];
  const logger = {
    info(bindings, message) {
      calls.push(["info", bindings, message]);
    },
    warn(bindings, message) {
      calls.push(["warn", bindings, message]);
    },
    error(bindings, message) {
      calls.push(["error", bindings, message]);
    }
  };

  const write = createPinoAdapter(logger);
  const canonical = "DNS lookup failed.";
  const result = write({
    code: "DNS_FAILURE",
    severity: "warning",
    canonical,
    profile: "sysadmin"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "warn");
  assert.equal(calls[0][2], result.message);
  assert.equal(calls[0][1].comicRelief.canonical, canonical);
  assert.equal(calls[0][1].comicRelief.presentation, result.message);
  assert.equal(result.canonical, canonical);
});

test("Pino adapter keeps critical events humor-free", () => {
  const calls = [];
  const logger = {
    info(bindings, message) {
      calls.push(["info", bindings, message]);
    },
    warn(bindings, message) {
      calls.push(["warn", bindings, message]);
    },
    error(bindings, message) {
      calls.push(["error", bindings, message]);
    }
  };

  const write = createPinoAdapter(logger);
  const canonical = "Database corruption detected.";
  const result = write({
    code: "UNKNOWN_ERROR",
    severity: "critical",
    canonical,
    profile: "absurdist"
  });

  assert.equal(calls[0][0], "error");
  assert.equal(calls[0][2], canonical);
  assert.equal(result.message, canonical);
  assert.equal(result.humorApplied, false);
  assert.equal(calls[0][1].comicRelief.humorApplied, false);
});

test("Winston adapter emits level/message plus namespaced metadata", () => {
  const calls = [];
  const logger = {
    log(info) {
      calls.push(info);
    }
  };

  const write = createWinstonAdapter(logger, {
    context: { requestId: "req-42" }
  });
  const canonical = "Connection timed out.";
  const result = write({
    code: "NETWORK_TIMEOUT",
    severity: "error",
    canonical,
    profile: "dry"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].level, "error");
  assert.equal(calls[0].message, result.message);
  assert.equal(calls[0].comicRelief.canonical, canonical);
  assert.deepEqual(calls[0].comicRelief.context, { requestId: "req-42" });
});

test("custom metadata key does not change renderer semantics", () => {
  const calls = [];
  const logger = {
    log(info) {
      calls.push(info);
    }
  };

  const write = createWinstonAdapter(logger, {
    metadataKey: "cr"
  });
  const result = write({
    code: "BUILD_FAILED",
    severity: "error",
    canonical: "Build failed.",
    profile: "deadpan"
  });

  assert.equal("comicRelief" in calls[0], false);
  assert.equal(calls[0].cr.canonical, result.canonical);
  assert.equal(calls[0].cr.presentation, result.message);
});

test("logger metadata keeps context nested so it cannot collide with framework fields", () => {
  const metadata = toLoggerMetadata({
    code: "SERVICE_UNAVAILABLE",
    severity: "warning",
    profile: "dry",
    canonical: "Service unavailable.",
    message: "Service unavailable.\nThe service is taking a personal day.",
    humorApplied: true,
    humor: "The service is taking a personal day.",
    context: {
      level: "emergency",
      message: "caller-owned text"
    }
  });

  assert.equal(metadata.severity, "warning");
  assert.equal(metadata.canonical, "Service unavailable.");
  assert.equal(metadata.context.level, "emergency");
  assert.equal(metadata.context.message, "caller-owned text");
});

test("logger failures propagate instead of being swallowed", () => {
  const expected = new Error("sink failed");
  const logger = {
    info() {
      throw expected;
    },
    warn() {
      throw expected;
    },
    error() {
      throw expected;
    }
  };

  const write = createPinoAdapter(logger);

  assert.throws(
    () =>
      write({
        code: "DNS_FAILURE",
        severity: "warning",
        canonical: "DNS lookup failed.",
        profile: "dry"
      }),
    expected
  );
});
