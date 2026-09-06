import { createPinoAdapter } from "../dist/index.js";

// This tiny object has the same method shape ComicRelief needs from Pino.
// In a real app, pass your actual `pino()` logger here instead.
const logger = {
  info(bindings, message) {
    console.log(JSON.stringify({ level: "info", ...bindings, msg: message }, null, 2));
  },
  warn(bindings, message) {
    console.log(JSON.stringify({ level: "warn", ...bindings, msg: message }, null, 2));
  },
  error(bindings, message) {
    console.log(JSON.stringify({ level: "error", ...bindings, msg: message }, null, 2));
  }
};

const log = createPinoAdapter(logger, {
  context: { service: "demo-api" }
});

log({
  code: "DNS_FAILURE",
  severity: "warning",
  canonical: "DNS lookup failed for api.example.com.",
  profile: "sysadmin"
});
