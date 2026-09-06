import { builtInCatalog } from "./catalog.js";
import type {
  ActiveHumorProfile,
  ComicEventInput,
  ComicReliefOptions,
  ComicReliefResult,
  HumorCatalog,
  HumorProfile,
  Severity
} from "./types.js";

export { builtInCatalog } from "./catalog.js";
export type {
  ActiveHumorProfile,
  ComicEventInput,
  ComicReliefOptions,
  ComicReliefResult,
  HumorCatalog,
  HumorProfile,
  Severity
} from "./types.js";

const NO_HUMOR_SEVERITIES: ReadonlySet<Severity> = new Set([
  "critical",
  "emergency"
]);

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function activeProfile(profile: HumorProfile): profile is ActiveHumorProfile {
  return profile !== "off";
}

function resolveLines(
  code: string,
  profile: ActiveHumorProfile,
  customCatalog?: HumorCatalog
): readonly string[] | undefined {
  const customEvent = customCatalog?.[code];
  const customLines = customEvent?.[profile];

  // A custom event/profile entry is authoritative for presentation. An empty
  // array intentionally disables humor for that event/profile.
  if (customLines !== undefined) {
    return customLines;
  }

  return builtInCatalog[code]?.[profile];
}

function chooseLine(
  lines: readonly string[],
  input: ComicEventInput,
  profile: ActiveHumorProfile
): string | undefined {
  if (lines.length === 0) {
    return undefined;
  }

  const material = [
    input.code,
    profile,
    input.canonical,
    input.variantSeed === undefined ? "" : String(input.variantSeed)
  ].join("|");

  const index = stableHash(material) % lines.length;
  return lines[index];
}

/**
 * Render a canonical software message with optional deterministic humor.
 *
 * Safety invariant: the canonical message is always returned unchanged and,
 * when humor is applied, appears as the exact prefix of the presentation.
 * ComicRelief has no mechanism to mutate severity, authority, permissions,
 * actions, or control flow.
 */
export function comicRelief(
  input: ComicEventInput,
  options: ComicReliefOptions = {}
): ComicReliefResult {
  const profile = input.profile ?? "dry";

  const base: ComicReliefResult = {
    code: input.code,
    severity: input.severity,
    profile,
    canonical: input.canonical,
    message: input.canonical,
    humorApplied: false
  };

  if (
    input.canonical.length === 0 ||
    !activeProfile(profile) ||
    NO_HUMOR_SEVERITIES.has(input.severity)
  ) {
    return base;
  }

  const lines = resolveLines(input.code, profile, options.catalog);
  if (lines === undefined) {
    // Unknown event codes fail closed. We deliberately do not reuse
    // UNKNOWN_ERROR because doing so would invent semantics the caller did not
    // provide.
    return base;
  }

  const humor = chooseLine(lines, input, profile);
  if (humor === undefined || humor.length === 0) {
    return base;
  }

  const separator = options.separator ?? "\n";

  return {
    ...base,
    message: `${input.canonical}${separator}${humor}`,
    humorApplied: true,
    humor
  };
}

/**
 * Returns whether ComicRelief is permitted to add humor at this severity.
 * Useful to integrations that want to preview policy before rendering.
 */
export function humorAllowed(severity: Severity): boolean {
  return !NO_HUMOR_SEVERITIES.has(severity);
}
