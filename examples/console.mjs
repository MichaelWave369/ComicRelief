import { createConsoleAdapter } from "../dist/index.js";

const write = createConsoleAdapter();

write({
  code: "DNS_FAILURE",
  severity: "warning",
  canonical: "DNS lookup failed.",
  profile: "sysadmin"
});

write({
  code: "MERGE_CONFLICT",
  severity: "error",
  canonical: "Merge conflict detected in 4 files.",
  profile: "deadpan"
});

write({
  code: "UNKNOWN_ERROR",
  severity: "critical",
  canonical: "Database corruption detected. Immediate recovery action required.",
  profile: "absurdist"
});
