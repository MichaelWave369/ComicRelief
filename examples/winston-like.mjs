import { createWinstonAdapter } from "../dist/index.js";

// This object matches the small surface ComicRelief needs from Winston.
// In a real app, pass your actual Winston logger here instead.
const logger = {
  log(info) {
    console.log(JSON.stringify(info, null, 2));
  }
};

const log = createWinstonAdapter(logger, {
  context: { service: "demo-worker" }
});

log({
  code: "MERGE_CONFLICT",
  severity: "error",
  canonical: "Merge conflict detected in 4 files.",
  profile: "deadpan"
});
