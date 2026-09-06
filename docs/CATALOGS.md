# ComicRelief Catalogs

ComicRelief catalogs map stable application event codes to optional humor lines for each active profile.

The catalog changes **presentation only**. Event code, severity, canonical text, permissions, actions, and control flow remain caller-owned.

## JSON shape

```json
{
  "DNS_FAILURE": {
    "sysadmin": [
      "It is DNS. It remains DNS."
    ],
    "dry": []
  },
  "MY_APP_EVENT": {
    "dry": [
      "The application has developed an opinion."
    ],
    "deadpan": [
      "The requested operation did not occur as requested."
    ]
  }
}
```

Active profile keys are:

- `dry`
- `deadpan`
- `absurdist`
- `nerdy`
- `sarcasm-light`
- `sysadmin`

`off` is a valid presentation profile but is not a catalog key because it always disables humor.

## Empty arrays

An empty array is intentional and valid:

```json
{
  "DNS_FAILURE": {
    "dry": []
  }
}
```

That explicitly disables humor for `DNS_FAILURE` under the `dry` profile, even though the built-in catalog has a dry line for that event.

## Runtime validation

TypeScript types cannot protect JSON loaded from disk, APIs, environment configuration, or other untyped sources. Use `validateCatalog` before trusting external catalog data:

```ts
import { validateCatalog } from "comicrelief";

const result = validateCatalog(value);

if (!result.valid) {
  for (const error of result.errors) {
    console.error(error.path, error.message);
  }
}
```

The validator rejects:

- non-object catalog roots;
- non-object event entries;
- unknown profile names;
- profile values that are not arrays;
- non-string lines;
- empty or whitespace-only lines.

It accepts empty arrays because they are an explicit no-humor override.

`isHumorCatalog(value)` is provided as a type guard for TypeScript callers.

## Catalog discovery

```ts
import {
  ACTIVE_HUMOR_PROFILES,
  HUMOR_PROFILES,
  catalogEventCodes
} from "comicrelief";

console.log(catalogEventCodes());
console.log(HUMOR_PROFILES);
console.log(ACTIVE_HUMOR_PROFILES);
```

`catalogEventCodes()` sorts its output so generated documentation and tooling remain stable.

## Starter catalog

Programmatically:

```ts
import { starterCatalog } from "comicrelief";

console.log(JSON.stringify(starterCatalog(), null, 2));
```

From the CLI:

```bash
comicrelief catalog sample
```

Redirect it to a file if you want a starting point:

```bash
comicrelief catalog sample > comicrelief.catalog.json
```

## Validate a catalog file

```bash
comicrelief catalog validate ./comicrelief.catalog.json
```

Machine-readable result:

```bash
comicrelief catalog validate ./comicrelief.catalog.json --json
```

Validation failures return a nonzero exit code and include a path to the invalid value.

## Render with a custom catalog

```bash
comicrelief render \
  --code MY_APP_EVENT \
  --severity warning \
  --profile dry \
  --message "Canonical event text." \
  --catalog ./comicrelief.catalog.json
```

Custom event/profile entries override the built-in catalog for that exact pair. Missing custom entries still fall back to built-ins. Unknown event codes continue to fail closed to the canonical message unless the custom catalog explicitly defines them.

## Catalog contribution rule

A catalog line should decorate a fact, not reinterpret it.

Bad:

```text
Everything is fine.
```

when the canonical event says a build failed.

Acceptable:

```text
The build has reconsidered its commitment to existing.
```

because the canonical failure remains visible and unchanged.

The joke gets personality. The system keeps authority.
