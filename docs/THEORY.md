# Theory of Operations

This document explains how `metalsmith-section-pages` functions and why
it is built this way. Read this once before making non-trivial changes
to the plugin.

---

## 1. The job

The plugin turns an array of data records into virtual source files in
the structured-content format: a frontmatter-equivalent metadata object
whose `sections` array is composed of component-library sections. It
reads records from `metalsmith.metadata()[source]` (or an injected
async function) and writes one entry per record into the `files`
object, with empty `contents` and the page definition as metadata.

It deliberately does not fetch data (that is a data-loading concern
with its own failure modes: auth, caching, timeouts), does not render
anything (layouts do that), and does not know any section type by name
(the component manifests are the only source of truth).

The origin is a nonprofit class site where a Google Sheet, exposed
through an Apps Script web app, drives class pages. The site-specific
predecessor hand-rolled section objects with helper functions and
hoped they matched the components. This plugin replaces the hope with
the library's own contracts.

## 2. The central idea: manifests as the API

Component libraries in the nunjucks-components family describe each
component twice in machine-readable form: a `fields` block (the
authorable form schema, with defaults and `$use`/`$extends`
composition) and a `validation` block (what an instance must look
like). The bundler (`metalsmith-bundled-components`) already contains
the canonical code for both: `resolveFields` composes field trees, and
`validateSection` enforces validation blocks at build time.

This plugin reuses both through the bundler's subpath exports
(`metalsmith-bundled-components/schema` and `/validation`, added in
1.3.0) rather than reimplementing them. That is a deliberate
single-source-of-truth decision: a section this plugin constructs is
valid by exactly the rules the build enforces, and when the bundler's
semantics evolve, this plugin follows automatically. The one piece
implemented here is `materializeDefaults` (fields tree to defaults
object), which mirrors the semantics of the library's
schema-consistency tests: leaves emit their declared `default`, array
and multiselect widgets emit `[]`, checkboxes emit `false`, everything
else emits `''`.

## 3. The section builder

`section(type, overrides)` is the API the site's mapping function
uses. It materializes the manifest's defaults (cached per type,
deep-cloned per call so instances never share objects), deep-merges
the overrides (objects merge, arrays and scalars replace), re-asserts
`sectionType`, and validates. Structural keys every section carries
(`containerTag`, `classes`, `id`, `isDisabled`) are seeded before the
manifest defaults so they exist even for manifests that do not
`$extends` commons; when commons is extended, its declared defaults
win.

Validation throws rather than warns. The mapping function runs at
build time with author-controlled data; a wrong value is a bug in the
mapping or the payload, and the error message (component name, dotted
property path, expected values) is the debugging surface.

## 4. The generation pass

For each record, `path(record, index)` names the file and
`page(record, { section })` builds the page object. The plugin
enforces the invariants that data-driven generation tends to violate
silently:

- duplicate generated paths (unstable or colliding record ids) fail
  the build, naming the path;
- a generated path that collides with a real source file fails, so a
  record can never shadow hand-written content;
- every `sections` array is validated with `validateSections`, even
  hand-assembled objects that bypassed the builder;
- a missing or non-array records source fails with a pointer to the
  likely cause (data plugin not run yet).

Generated files get `layout` from options (overridable per page) and
empty contents; everything else on the page object passes through
untouched, so `seo`, `card`, `bodyClasses`, or anything a site's
layouts read works without this plugin knowing about it.

The component map is loaded fresh each run, so watch-mode edits to
manifests are picked up; the per-type defaults cache lives inside one
run only.

## 5. What stays outside

Fetching is the site's business (or a future companion plugin): auth
tokens, TTL caches, and timeout budgets have nothing to do with page
generation, and coupling them would force every consumer to adopt one
transport. The record-to-sections mapping is inherently application
code; no schema can decide which sections best present a class versus
an event versus a product. And the data source itself is held to a
written contract (docs/data-provider-contract.md) covering stable ids,
ISO text dates, publication gating, determinism, and failure
semantics, so the provider and the site can evolve independently.
