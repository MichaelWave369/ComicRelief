import { createStructuredAdapter } from "../dist/index.js";

const records = [];
const write = createStructuredAdapter((record) => records.push(record), {
  context: {
    service: "example-api",
    environment: "development"
  }
});

write({
  code: "NETWORK_TIMEOUT",
  severity: "warning",
  canonical: "Connection to upstream API timed out after 30 seconds.",
  profile: "dry",
  variantSeed: "request-42"
});

console.log(JSON.stringify(records[0], null, 2));
