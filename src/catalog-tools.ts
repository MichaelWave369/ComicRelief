import { builtInCatalog } from "./catalog.js";
import type { ActiveHumorProfile, HumorCatalog, HumorProfile } from "./types.js";

export const HUMOR_PROFILES: readonly HumorProfile[] = [
  "off",
  "dry",
  "deadpan",
  "absurdist",
  "nerdy",
  "sarcasm-light",
  "sysadmin"
] as const;

export const ACTIVE_HUMOR_PROFILES: readonly ActiveHumorProfile[] = [
  "dry",
  "deadpan",
  "absurdist",
  "nerdy",
  "sarcasm-light",
  "sysadmin"
] as const;

const ACTIVE_PROFILE_SET = new Set<string>(ACTIVE_HUMOR_PROFILES);

export interface CatalogValidationError {
  path: string;
  message: string;
}

export interface CatalogValidationResult {
  valid: boolean;
  errors: readonly CatalogValidationError[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Runtime validation for custom catalogs loaded from JSON or other untyped
 * sources. Empty arrays are valid and intentionally disable humor for one
 * event/profile. Empty or whitespace-only strings are rejected.
 */
export function validateCatalog(value: unknown): CatalogValidationResult {
  const errors: CatalogValidationError[] = [];

  if (!isPlainObject(value)) {
    return {
      valid: false,
      errors: [{ path: "$", message: "Catalog must be a JSON object." }]
    };
  }

  for (const [eventCode, eventValue] of Object.entries(value)) {
    const eventPath = `$.${eventCode}`;

    if (eventCode.trim().length === 0) {
      errors.push({ path: "$", message: "Event codes must not be empty." });
      continue;
    }

    if (!isPlainObject(eventValue)) {
      errors.push({
        path: eventPath,
        message: "Event entry must be an object keyed by humor profile."
      });
      continue;
    }

    for (const [profile, lines] of Object.entries(eventValue)) {
      const profilePath = `${eventPath}.${profile}`;

      if (!ACTIVE_PROFILE_SET.has(profile)) {
        errors.push({
          path: profilePath,
          message: `Unknown active humor profile: ${profile}.`
        });
        continue;
      }

      if (!Array.isArray(lines)) {
        errors.push({
          path: profilePath,
          message: "Profile value must be an array of strings."
        });
        continue;
      }

      lines.forEach((line, index) => {
        const linePath = `${profilePath}[${index}]`;
        if (typeof line !== "string") {
          errors.push({
            path: linePath,
            message: "Catalog lines must be strings."
          });
          return;
        }

        if (line.trim().length === 0) {
          errors.push({
            path: linePath,
            message: "Catalog lines must not be empty or whitespace-only."
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/** Type guard companion to validateCatalog for untyped inputs. */
export function isHumorCatalog(value: unknown): value is HumorCatalog {
  return validateCatalog(value).valid;
}

/** Return sorted event codes for a catalog. */
export function catalogEventCodes(
  catalog: HumorCatalog = builtInCatalog
): readonly string[] {
  return Object.keys(catalog).sort((left, right) => left.localeCompare(right));
}

/**
 * Produce a small valid starter catalog suitable for JSON serialization.
 * It intentionally demonstrates both an override and an explicit disable.
 */
export function starterCatalog(): HumorCatalog {
  return {
    DNS_FAILURE: {
      sysadmin: ["It is DNS. It remains DNS."],
      dry: []
    },
    MY_APP_EVENT: {
      dry: ["The application has developed an opinion."],
      deadpan: ["The requested operation did not occur as requested."]
    }
  };
}
