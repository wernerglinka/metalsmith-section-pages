# Data Provider Contract

metalsmith-section-pages turns data records into pages. The records
can come from anywhere: a Google Apps Script web app reading a
spreadsheet, a headless CMS export, an Airtable base, a JSON file in
the repo. This document is for the developer building that data
source. It states what the site build assumes, so the provider and the
site can evolve independently without breaking each other.

The rules below were learned from a production system (a nonprofit
class site fed by a Google Sheet). Each one exists because its absence
caused, or would have caused, a real failure.

## 1. The payload contract

**Publish a schema.** Ship a JSON Schema for the payload and a fixture
file that conforms to it. The site's mapping is written against that
schema, not against whatever the endpoint happens to return today.
Include a `schemaVersion` field in the envelope so consumers can
detect a contract change instead of failing mysteriously.

**Stable, immutable ids.** Every record needs a URL-safe id that never
changes once the record is published. The id becomes the page's
permalink; changing it breaks bookmarks, search results, and anything
that references the page. Generate ids at record creation (for
example, slugified title plus a date), define the collision rule (append
`-2`, `-3`), and never regenerate them on edit.

**Dates and times are ISO text.** Dates are `YYYY-MM-DD`, times are
24-hour `HH:MM`, both plain strings. Never emit locale-formatted
values like `7/15/2026` or `6:00:00 PM`: every consumer would have to
re-parse them with locale guesswork. If your storage layer coerces
strings into date cells (spreadsheets do), format the cells as text
before writing.

**One empty-value convention.** Pick one representation for "no value"
and use it everywhere. Empty string is a good choice. A payload where
some absent values are `""`, some `null`, and some missing keys forces
every consumer to check three cases per field.

**Evolve additively.** New fields must have a sensible meaning when
absent, because published records predate them. A consumer reading a
missing `scheduleType` should be able to default it (for example, to
`sessions`). Never rename or repurpose an existing field; add a new
one and deprecate the old.

## 2. Publication and privacy

**Serve only published records.** If submissions are moderated, the
approval flag gates every payload the API produces, including the
authenticated build payload. Drafts must be unable to leak through any
endpoint.

**Approval is not status.** Keep the publication gate separate from
record state. A cancelled or sold-out class is still approved; it just
renders differently.

**Name the secret fields.** Decide which fields must never appear in
any payload (personal emails, internal notes) and strip them at the
API, not in the site templates. A field that never leaves the server
cannot be leaked by a template mistake.

**Document the auth split.** If there is a build token, state what it
grants (the full payload), how it travels, and how to rotate it. Public
endpoints serve the minimal data live pages need, nothing more.

## 3. Operational semantics

**Fail loudly.** A non-200 response or a malformed payload must fail
the site build. A class site built without classes is worse than a
failed build; the provider must never degrade silently to an empty
list. Return real HTTP status codes.

**Be deterministic.** The same data must produce the same payload:
identical field order is not required, but no per-request timestamps,
random ids, or unstated ordering. Define the sort order (or state that
the consumer sorts) so builds are reproducible.

**State the budgets.** Document the expected response time (the
consumer sets its fetch timeout from it), the expected payload size,
and any rate limits that affect CI builds or watch-mode rebuilds.

## 4. The content/presentation boundary

**Serve content facts only.** The payload carries what is true about a
record: titles, dates, prose, fees. Which sections render those facts,
in what order, with what styling, is the site mapping's business.
Presentation hints in the payload couple the provider to one site's
layout.

**Boilerplate lives in the site repo.** Organization-wide prose (an
accessibility statement, a cancellation policy, directions) belongs in
the site's data files, not duplicated into every record. Prose
repeated across records diverges the first time someone edits one
copy.

**Reference media, don't embed it.** Images travel outside the
payload: records carry bare file names (or full URLs), and the site
resolves file names against a repo folder. The build warns about and
omits a missing file rather than shipping a broken reference. Document
the folder convention.

## 5. Validation on both sides

**Provider side:** with the published schema and fixture, the API
developer can prove conformance without ever running a site build.

**Site side:** this plugin validates every generated section against
the component library's own manifests, so a payload that maps to an
invalid section fails the build with a path-precise error such as:

```
Section 1 (multi-media) in classes/weaving.md:
  Invalid value for "text.titleTag": expected one of h1, h2, h3, h4, h5, h6
```

That error names the record's page, the section, and the exact
property, which is usually enough to tell whether the payload or the
mapping is at fault.
