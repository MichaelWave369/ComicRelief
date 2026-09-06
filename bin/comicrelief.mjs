#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  HUMOR_PROFILES,
  catalogEventCodes,
  comicRelief,
  starterCatalog,
  validateCatalog
} from "../dist/index.js";

const SEVERITIES = [
  "info",
  "success",
  "warning",
  "error",
  "critical",
  "emergency"
];

const HELP = `ComicRelief CLI

Serious software. Unnecessarily entertaining error messages.

Usage:
  comicrelief render --code CODE --severity LEVEL --message TEXT [options]
  comicrelief events [--json]
  comicrelief profiles [--json]
  comicrelief catalog validate FILE [--json]
  comicrelief catalog sample
  comicrelief help

Render options:
  --profile PROFILE   Humor profile. Defaults to dry.
  --seed VALUE        Stable variant seed.
  --catalog FILE      Custom catalog JSON file.
  --json              Emit the full ComicRelief result as JSON.

Examples:
  comicrelief render --code DNS_FAILURE --severity warning \
    --profile sysadmin --message "DNS lookup failed."

  comicrelief catalog validate ./comicrelief.catalog.json
`;

function fail(message, code = 1) {
  console.error(`ComicRelief: ${message}`);
  process.exitCode = code;
}

function parseFlags(args) {
  const flags = new Map();
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const name = value.slice(2);
    if (name === "json") {
      flags.set(name, true);
      continue;
    }

    const next = args[index + 1];
    if (next === undefined || next.startsWith("--")) {
      throw new Error(`--${name} requires a value.`);
    }

    flags.set(name, next);
    index += 1;
  }

  return { flags, positionals };
}

function requireStringFlag(flags, name) {
  const value = flags.get(name);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`--${name} is required.`);
  }
  return value;
}

async function loadCatalog(path) {
  let text;
  try {
    text = await readFile(resolve(path), "utf8");
  } catch (error) {
    throw new Error(`Could not read catalog ${path}: ${error.message}`);
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`Catalog is not valid JSON: ${error.message}`);
  }

  const validation = validateCatalog(value);
  if (!validation.valid) {
    const details = validation.errors
      .map((entry) => `${entry.path}: ${entry.message}`)
      .join("\n");
    throw new Error(`Catalog validation failed:\n${details}`);
  }

  return value;
}

async function render(args) {
  const { flags, positionals } = parseFlags(args);
  if (positionals.length > 0) {
    throw new Error(`Unexpected positional arguments: ${positionals.join(" ")}`);
  }

  const code = requireStringFlag(flags, "code");
  const severity = requireStringFlag(flags, "severity");
  const canonical = requireStringFlag(flags, "message");
  const profile = flags.get("profile") ?? "dry";

  if (!SEVERITIES.includes(severity)) {
    throw new Error(`Unknown severity: ${severity}.`);
  }

  if (typeof profile !== "string" || !HUMOR_PROFILES.includes(profile)) {
    throw new Error(`Unknown humor profile: ${String(profile)}.`);
  }

  const catalogPath = flags.get("catalog");
  const catalog =
    typeof catalogPath === "string" ? await loadCatalog(catalogPath) : undefined;

  const variantSeed = flags.get("seed");
  const options = catalog === undefined ? {} : { catalog };
  const input = {
    code,
    severity,
    canonical,
    profile,
    ...(typeof variantSeed === "string" ? { variantSeed } : {})
  };

  const result = comicRelief(input, options);

  if (flags.get("json") === true) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(result.message);
}

function listValues(values, json) {
  if (json) {
    console.log(JSON.stringify(values, null, 2));
    return;
  }

  for (const value of values) {
    console.log(value);
  }
}

async function catalogCommand(args) {
  const subcommand = args[0];

  if (subcommand === "sample") {
    if (args.length !== 1) {
      throw new Error("catalog sample does not accept additional arguments.");
    }
    console.log(JSON.stringify(starterCatalog(), null, 2));
    return;
  }

  if (subcommand === "validate") {
    const { flags, positionals } = parseFlags(args.slice(1));
    if (positionals.length !== 1) {
      throw new Error("catalog validate requires exactly one JSON file path.");
    }

    const catalog = await loadCatalog(positionals[0]);
    const result = {
      valid: true,
      file: resolve(positionals[0]),
      eventCodes: catalogEventCodes(catalog)
    };

    if (flags.get("json") === true) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`Valid catalog: ${result.file}`);
    console.log(`Events: ${result.eventCodes.length}`);
    for (const code of result.eventCodes) {
      console.log(`  ${code}`);
    }
    return;
  }

  throw new Error("catalog requires either 'validate' or 'sample'.");
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case undefined:
      case "help":
      case "--help":
      case "-h":
        console.log(HELP);
        return;
      case "render":
        await render(args);
        return;
      case "events": {
        const { flags, positionals } = parseFlags(args);
        if (positionals.length > 0) {
          throw new Error("events does not accept positional arguments.");
        }
        listValues(catalogEventCodes(), flags.get("json") === true);
        return;
      }
      case "profiles": {
        const { flags, positionals } = parseFlags(args);
        if (positionals.length > 0) {
          throw new Error("profiles does not accept positional arguments.");
        }
        listValues(HUMOR_PROFILES, flags.get("json") === true);
        return;
      }
      case "catalog":
        await catalogCommand(args);
        return;
      default:
        fail(`Unknown command: ${command}. Run 'comicrelief help'.`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

await main();
