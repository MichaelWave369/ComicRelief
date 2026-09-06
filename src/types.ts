export type Severity =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "critical"
  | "emergency";

export type HumorProfile =
  | "off"
  | "dry"
  | "deadpan"
  | "absurdist"
  | "nerdy"
  | "sarcasm-light"
  | "sysadmin";

export type ActiveHumorProfile = Exclude<HumorProfile, "off">;

export interface ComicEventInput {
  /** Stable event code used to look up humor, e.g. NETWORK_TIMEOUT. */
  code: string;
  /** Operational severity. Critical and emergency fail closed to no humor. */
  severity: Severity;
  /** Authoritative human-readable message. ComicRelief never changes this text. */
  canonical: string;
  /** Presentation profile. Defaults to dry. */
  profile?: HumorProfile;
  /** Optional value used to choose a stable alternate line from a catalog. */
  variantSeed?: string | number;
}

export type HumorCatalog = Readonly<
  Record<
    string,
    Partial<Readonly<Record<ActiveHumorProfile, readonly string[]>>>
  >
>;

export interface ComicReliefOptions {
  /** Optional custom catalog. Custom event/profile entries override built-ins. */
  catalog?: HumorCatalog;
  /** Separator inserted between canonical text and humor. Defaults to a newline. */
  separator?: string;
}

export interface ComicReliefResult {
  code: string;
  severity: Severity;
  profile: HumorProfile;
  canonical: string;
  message: string;
  humorApplied: boolean;
  humor?: string;
}
