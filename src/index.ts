export { builtInCatalog } from "./catalog.js";
export { comicRelief, humorAllowed } from "./core.js";
export {
  consoleMethodForSeverity,
  createConsoleAdapter,
  createStructuredAdapter,
  toStructuredRecord
} from "./adapters.js";
export {
  createPinoAdapter,
  createWinstonAdapter,
  loggerLevelForSeverity,
  toLoggerMetadata
} from "./loggers.js";

export type {
  ActiveHumorProfile,
  ComicEventInput,
  ComicReliefOptions,
  ComicReliefResult,
  HumorCatalog,
  HumorProfile,
  Severity
} from "./types.js";

export type {
  ConsoleAdapterOptions,
  ConsoleLike,
  StructuredComicRecord,
  StructuredRecordOptions,
  StructuredSink
} from "./adapters.js";

export type {
  LoggerAdapterOptions,
  LoggerLevel,
  LoggerMetadata,
  PinoLike,
  WinstonLike
} from "./loggers.js";
