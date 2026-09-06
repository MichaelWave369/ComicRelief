import { comicRelief } from "./index.js";
import type {
  ComicEventInput,
  ComicReliefOptions,
  ComicReliefResult,
  Severity
} from "./types.js";

/** Minimal console contract so callers can inject a test sink or custom console. */
export interface ConsoleLike {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}

export interface ConsoleAdapterOptions extends ComicReliefOptions {
  /** Optional console-compatible sink. Defaults to globalThis.console. */
  console?: ConsoleLike;
}

export interface StructuredRecordOptions extends ComicReliefOptions {
  /** Optional caller-owned metadata preserved beside the rendered result. */
  context?: Readonly<Record<string, unknown>>;
}

export interface StructuredComicRecord extends ComicReliefResult {
  /** Caller-owned metadata. ComicRelief does not interpret or mutate it. */
  context?: Readonly<Record<string, unknown>>;
}

export type StructuredSink = (record: StructuredComicRecord) => void;

function renderOptions(options: ComicReliefOptions): ComicReliefOptions {
  const rendered: ComicReliefOptions = {};

  if (options.catalog !== undefined) {
    rendered.catalog = options.catalog;
  }

  if (options.separator !== undefined) {
    rendered.separator = options.separator;
  }

  return rendered;
}

/**
 * Map operational severity to the normal console method without changing the
 * severity itself. The mapping only chooses the output channel.
 */
export function consoleMethodForSeverity(
  severity: Severity
): "log" | "info" | "warn" | "error" {
  switch (severity) {
    case "success":
      return "log";
    case "info":
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
 * Create a console writer around ComicRelief.
 *
 * The returned function renders presentation text, writes it to the
 * severity-appropriate console method, and returns the full result so callers
 * still have direct access to the untouched canonical message.
 */
export function createConsoleAdapter(
  options: ConsoleAdapterOptions = {}
): (input: ComicEventInput) => ComicReliefResult {
  const sink = options.console ?? globalThis.console;
  const comicOptions = renderOptions(options);

  return (input: ComicEventInput): ComicReliefResult => {
    const result = comicRelief(input, comicOptions);
    const method = consoleMethodForSeverity(result.severity);
    sink[method](result.message);
    return result;
  };
}

/**
 * Convert a ComicRelief event into a structured record.
 *
 * Machine-ingested logging should prefer this shape because canonical text and
 * presentation text remain separate fields instead of being collapsed into a
 * single formatted string.
 */
export function toStructuredRecord(
  input: ComicEventInput,
  options: StructuredRecordOptions = {}
): StructuredComicRecord {
  const result = comicRelief(input, renderOptions(options));

  if (options.context === undefined) {
    return result;
  }

  return {
    ...result,
    context: options.context
  };
}

/**
 * Create a generic structured-log adapter. This intentionally knows nothing
 * about Pino, Winston, Bunyan, or other frameworks; callers can bridge the
 * stable record into whichever logger they already use.
 */
export function createStructuredAdapter(
  sink: StructuredSink,
  options: StructuredRecordOptions = {}
): (input: ComicEventInput) => StructuredComicRecord {
  return (input: ComicEventInput): StructuredComicRecord => {
    const record = toStructuredRecord(input, options);
    sink(record);
    return record;
  };
}
