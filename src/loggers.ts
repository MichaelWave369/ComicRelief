import { toStructuredRecord } from "./adapters.js";
import type {
  StructuredComicRecord,
  StructuredRecordOptions
} from "./adapters.js";
import type { ComicEventInput, Severity } from "./types.js";

export type LoggerLevel = "info" | "warn" | "error";

/**
 * Minimal Pino-compatible surface. ComicRelief intentionally does not import
 * Pino or require it as a dependency.
 */
export interface PinoLike {
  info(bindings: Readonly<Record<string, unknown>>, message?: string): unknown;
  warn(bindings: Readonly<Record<string, unknown>>, message?: string): unknown;
  error(bindings: Readonly<Record<string, unknown>>, message?: string): unknown;
}

/**
 * Minimal Winston-compatible surface. Winston accepts an info object with at
 * least `level` and `message`, plus arbitrary metadata fields.
 */
export interface WinstonLike {
  log(info: Readonly<Record<string, unknown>> & { level: string; message: string }): unknown;
}

export interface LoggerAdapterOptions extends StructuredRecordOptions {
  /**
   * Namespace used for ComicRelief metadata in framework log objects.
   * Defaults to `comicRelief` to avoid collisions with framework-owned fields.
   */
  metadataKey?: string;
}

export interface LoggerMetadata {
  code: string;
  severity: Severity;
  profile: StructuredComicRecord["profile"];
  canonical: string;
  presentation: string;
  humorApplied: boolean;
  humor?: string;
  context?: Readonly<Record<string, unknown>>;
}

/**
 * Frameworks have many levels, but ComicRelief only needs a conservative
 * three-channel bridge. Operational severity is preserved separately.
 */
export function loggerLevelForSeverity(severity: Severity): LoggerLevel {
  switch (severity) {
    case "info":
    case "success":
      return "info";
    case "warning":
      return "warn";
    case "error":
    case "critical":
    case "emergency":
      return "error";
  }
}

/**
 * Build collision-resistant framework metadata from a rendered record.
 * Canonical and presentation text remain explicit, separate fields.
 */
export function toLoggerMetadata(record: StructuredComicRecord): LoggerMetadata {
  const metadata: LoggerMetadata = {
    code: record.code,
    severity: record.severity,
    profile: record.profile,
    canonical: record.canonical,
    presentation: record.message,
    humorApplied: record.humorApplied
  };

  if (record.humor !== undefined) {
    metadata.humor = record.humor;
  }

  if (record.context !== undefined) {
    metadata.context = record.context;
  }

  return metadata;
}

function metadataEnvelope(
  record: StructuredComicRecord,
  options: LoggerAdapterOptions
): Readonly<Record<string, unknown>> {
  return {
    [options.metadataKey ?? "comicRelief"]: toLoggerMetadata(record)
  };
}

/**
 * Create a thin Pino-compatible adapter.
 *
 * Pino conventionally accepts `logger.info(bindings, message)`. ComicRelief
 * writes its structured metadata under one namespace and uses the rendered
 * presentation as the Pino message. The authoritative canonical text remains
 * available inside the namespaced metadata.
 */
export function createPinoAdapter(
  logger: PinoLike,
  options: LoggerAdapterOptions = {}
): (input: ComicEventInput) => StructuredComicRecord {
  return (input: ComicEventInput): StructuredComicRecord => {
    const record = toStructuredRecord(input, options);
    const level = loggerLevelForSeverity(record.severity);
    logger[level](metadataEnvelope(record, options), record.message);
    return record;
  };
}

/**
 * Create a thin Winston-compatible adapter.
 *
 * Winston consumes info objects with `level` and `message`. ComicRelief keeps
 * its own metadata nested under one key so caller context cannot overwrite
 * Winston-owned fields such as `level` or `message`.
 */
export function createWinstonAdapter(
  logger: WinstonLike,
  options: LoggerAdapterOptions = {}
): (input: ComicEventInput) => StructuredComicRecord {
  return (input: ComicEventInput): StructuredComicRecord => {
    const record = toStructuredRecord(input, options);
    const level = loggerLevelForSeverity(record.severity);

    logger.log({
      level,
      message: record.message,
      ...metadataEnvelope(record, options)
    });

    return record;
  };
}
