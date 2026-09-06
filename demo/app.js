import {
  HUMOR_PROFILES,
  builtInCatalog,
  catalogEventCodes,
  comicRelief,
  starterCatalog,
  validateCatalog
} from "./lib/index.js";

const SEVERITIES = [
  "info",
  "success",
  "warning",
  "error",
  "critical",
  "emergency"
];

const EXAMPLE_MESSAGES = {
  NETWORK_TIMEOUT: "Connection to api.example.com timed out after 30 seconds.",
  DNS_FAILURE: "DNS lookup failed.",
  TLS_EXPIRED: "TLS certificate expired 14 days ago.",
  DISK_FULL: "Disk space critically low: 98.7% used.",
  DEPENDENCY_FAILURE: "Dependency installation failed.",
  MERGE_CONFLICT: "Merge conflict detected in 4 files.",
  BUILD_FAILED: "Build failed.",
  RATE_LIMITED: "Request rate limit exceeded.",
  SERVICE_UNAVAILABLE: "The requested service is unavailable.",
  AUTH_FAILED: "Authentication failed.",
  PRINTER_OFFLINE: "Printer unavailable.",
  UNKNOWN_ERROR: "An unknown error occurred."
};

const DEFAULTS = {
  code: "DNS_FAILURE",
  severity: "warning",
  profile: "sysadmin",
  canonical: EXAMPLE_MESSAGES.DNS_FAILURE,
  variantSeed: ""
};

const elements = {
  form: document.querySelector("#playground-form"),
  eventCode: document.querySelector("#event-code"),
  severity: document.querySelector("#severity"),
  profile: document.querySelector("#profile"),
  variantSeed: document.querySelector("#variant-seed"),
  canonical: document.querySelector("#canonical"),
  useCustomCatalog: document.querySelector("#use-custom-catalog"),
  resetPlayground: document.querySelector("#reset-playground"),
  canonicalOutput: document.querySelector("#canonical-output"),
  presentationOutput: document.querySelector("#presentation-output"),
  structuredOutput: document.querySelector("#structured-output"),
  humorStatus: document.querySelector("#humor-status"),
  catalogEditor: document.querySelector("#catalog-editor"),
  catalogStarter: document.querySelector("#catalog-starter"),
  catalogBuiltIn: document.querySelector("#catalog-built-in"),
  catalogFormat: document.querySelector("#catalog-format"),
  catalogValidate: document.querySelector("#catalog-validate"),
  catalogStatus: document.querySelector("#catalog-status"),
  catalogSummary: document.querySelector("#validation-summary"),
  catalogErrors: document.querySelector("#validation-errors")
};

let validatedCatalog;
let validationTimer;

function assertElements() {
  for (const [name, element] of Object.entries(elements)) {
    if (!element) {
      throw new Error(`ComicRelief demo is missing required element: ${name}`);
    }
  }
}

function titleFromCode(code) {
  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function exampleForCode(code) {
  return EXAMPLE_MESSAGES[code] ?? `${titleFromCode(code)} occurred.`;
}

function replaceOptions(select, values, selectedValue) {
  const fragment = document.createDocumentFragment();

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    fragment.append(option);
  });

  select.replaceChildren(fragment);

  if (values.includes(selectedValue)) {
    select.value = selectedValue;
  }
}

function currentEventCodes() {
  const codes = new Set(catalogEventCodes(builtInCatalog));

  if (validatedCatalog) {
    catalogEventCodes(validatedCatalog).forEach((code) => codes.add(code));
  }

  return [...codes].sort((left, right) => left.localeCompare(right));
}

function refreshEventOptions() {
  const current = elements.eventCode.value || DEFAULTS.code;
  const codes = currentEventCodes();
  replaceOptions(elements.eventCode, codes, current);
}

function setChip(element, text, tone) {
  element.textContent = text;
  element.classList.remove("good", "warn", "bad");
  if (tone) {
    element.classList.add(tone);
  }
}

function noHumorReason(result) {
  if (result.humorApplied) {
    return { text: "humor applied", tone: "good" };
  }

  if (result.severity === "critical" || result.severity === "emergency") {
    return { text: "policy suppressed", tone: "warn" };
  }

  if (result.profile === "off") {
    return { text: "profile off", tone: "warn" };
  }

  if (result.canonical.length === 0) {
    return { text: "empty canonical", tone: "warn" };
  }

  return { text: "canonical only", tone: "warn" };
}

function renderPlayground() {
  const input = {
    code: elements.eventCode.value,
    severity: elements.severity.value,
    canonical: elements.canonical.value,
    profile: elements.profile.value
  };

  if (elements.variantSeed.value.length > 0) {
    input.variantSeed = elements.variantSeed.value;
  }

  const options = {};
  if (elements.useCustomCatalog.checked && validatedCatalog) {
    options.catalog = validatedCatalog;
  }

  const result = comicRelief(input, options);
  const status = noHumorReason(result);

  elements.canonicalOutput.textContent = result.canonical || "(empty canonical message)";
  elements.presentationOutput.textContent = result.message || "(empty canonical message)";
  elements.structuredOutput.textContent = JSON.stringify(result, null, 2);
  setChip(elements.humorStatus, status.text, status.tone);
}

function applyDefaults() {
  elements.eventCode.value = DEFAULTS.code;
  elements.severity.value = DEFAULTS.severity;
  elements.profile.value = DEFAULTS.profile;
  elements.canonical.value = DEFAULTS.canonical;
  elements.variantSeed.value = DEFAULTS.variantSeed;
  renderPlayground();
}

function parseCatalogEditor() {
  try {
    return {
      parsed: JSON.parse(elements.catalogEditor.value),
      parseError: undefined
    };
  } catch (error) {
    return {
      parsed: undefined,
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

function renderValidationErrors(errors) {
  const fragment = document.createDocumentFragment();

  errors.forEach((error) => {
    const item = document.createElement("li");
    const path = document.createElement("code");
    path.textContent = error.path;
    item.append(path, document.createTextNode(` ${error.message}`));
    fragment.append(item);
  });

  elements.catalogErrors.replaceChildren(fragment);
}

function validateEditor() {
  const { parsed, parseError } = parseCatalogEditor();

  if (parseError) {
    validatedCatalog = undefined;
    setChip(elements.catalogStatus, "invalid JSON", "bad");
    elements.catalogSummary.textContent = "The editor does not currently contain parseable JSON.";
    renderValidationErrors([{ path: "$", message: parseError }]);
    elements.useCustomCatalog.checked = false;
    elements.useCustomCatalog.disabled = true;
    refreshEventOptions();
    renderPlayground();
    return false;
  }

  const validation = validateCatalog(parsed);

  if (!validation.valid) {
    validatedCatalog = undefined;
    setChip(elements.catalogStatus, `${validation.errors.length} issue${validation.errors.length === 1 ? "" : "s"}`, "bad");
    elements.catalogSummary.textContent = "The catalog is blocked from the playground until these errors are fixed.";
    renderValidationErrors(validation.errors);
    elements.useCustomCatalog.checked = false;
    elements.useCustomCatalog.disabled = true;
    refreshEventOptions();
    renderPlayground();
    return false;
  }

  validatedCatalog = parsed;
  const eventCount = catalogEventCodes(validatedCatalog).length;
  setChip(elements.catalogStatus, "valid catalog", "good");
  elements.catalogSummary.textContent = `${eventCount} event code${eventCount === 1 ? "" : "s"} validated. The catalog may now be used by the playground.`;
  elements.catalogErrors.replaceChildren();
  elements.useCustomCatalog.disabled = false;
  refreshEventOptions();
  renderPlayground();
  return true;
}

function scheduleValidation() {
  window.clearTimeout(validationTimer);
  validationTimer = window.setTimeout(validateEditor, 140);
}

function setCatalog(value) {
  elements.catalogEditor.value = JSON.stringify(value, null, 2);
  validateEditor();
}

function formatCatalog() {
  const { parsed, parseError } = parseCatalogEditor();
  if (parseError) {
    validateEditor();
    return;
  }
  elements.catalogEditor.value = JSON.stringify(parsed, null, 2);
  validateEditor();
}

function wireEvents() {
  elements.form.addEventListener("input", renderPlayground);
  elements.form.addEventListener("change", renderPlayground);

  elements.eventCode.addEventListener("change", () => {
    elements.canonical.value = exampleForCode(elements.eventCode.value);
    renderPlayground();
  });

  elements.resetPlayground.addEventListener("click", applyDefaults);
  elements.catalogStarter.addEventListener("click", () => setCatalog(starterCatalog()));
  elements.catalogBuiltIn.addEventListener("click", () => setCatalog(builtInCatalog));
  elements.catalogFormat.addEventListener("click", formatCatalog);
  elements.catalogValidate.addEventListener("click", validateEditor);
  elements.catalogEditor.addEventListener("input", scheduleValidation);
  elements.useCustomCatalog.addEventListener("change", renderPlayground);
}

function initialize() {
  assertElements();
  replaceOptions(elements.severity, SEVERITIES, DEFAULTS.severity);
  replaceOptions(elements.profile, [...HUMOR_PROFILES], DEFAULTS.profile);
  refreshEventOptions();
  setCatalog(starterCatalog());
  wireEvents();
  applyDefaults();
}

initialize();
