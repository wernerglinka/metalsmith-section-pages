# Theory of Operations

<!--
  TODO: Replace this stub with a real theory-of-operations document for
  `metalsmith-section-pages` before the first non-trivial release. The headings
  below are a starting point — keep, drop, or rename them to fit the
  plugin. The point of this document is to capture the *why* of the
  design so future maintainers (including you, six months from now)
  don't have to re-derive it from the code.

  A good model is `metalsmith-seo`'s docs/THEORY.md. While the stub
  exists, the MCP validator will flag this plugin as needing work.
-->

This document explains how `metalsmith-section-pages` functions and why it is
built this way. Read this once before making non-trivial changes to the
plugin.

---

## 1. The job

<!--
  TODO: In a few short paragraphs, describe what this plugin does in
  terms of the Metalsmith pipeline. What does it consume from the
  `files` object and `metalsmith.metadata()`? What does it produce or
  mutate? What does it deliberately *not* do? Anchor the reader in
  concrete inputs and outputs before getting into architecture.
-->

## 2. Architecture

<!--
  TODO: Sketch the module layout (a tree of `src/` is usually enough)
  and describe the role of each layer. Call out which layers are pure
  and which are side-effecting. If the plugin is small enough that this
  feels like overkill, say so and skip to section 3 — but at least name
  the entry point and any helpers worth knowing about.
-->

## 3. Data flow

<!--
  TODO: Trace what happens to a single file (or unit of work) from the
  moment the plugin is invoked to the moment it returns. An ASCII
  diagram is fine. Highlight any place where order matters or where
  data is normalized between stages.
-->

## 4. Design invariants

<!--
  TODO: List the rules that must hold for the plugin to behave
  correctly, and *why* each one exists. Examples: "all HTML rewrites
  go through utils/html-injector.js, never regex"; "the config merge
  happens in exactly one place"; "errors are aggregated and thrown
  once at the end of the batch." Each invariant should name the file
  or function that enforces it.
-->

## 5. Deliberate non-features

<!--
  TODO: Document things that have been considered and rejected, with
  the reasoning. This is how you stop a future maintainer (or AI
  assistant) from re-introducing a "missing" feature that was
  intentionally left out. If nothing has been declined yet, leave a
  note that this section will grow as decisions accumulate.
-->

## 6. Testing notes

<!--
  TODO: Describe the testing philosophy for this plugin. What kind of
  fixtures does it use? Are tests hermetic (in-memory file objects) or
  fixture-directory-based? What's the policy on mocking? (Default for
  Metalsmith plugins: never mock Metalsmith itself — use a real
  instance. The plugin's contract is with the real framework.)
-->

## 7. Known sharp edges

<!--
  TODO: Document non-obvious gotchas a maintainer needs to know:
  ordering constraints with other plugins, dependency quirks,
  whitespace sensitivities, places where two passes share state, etc.
  If you discover one while debugging, add it here so the next person
  doesn't have to rediscover it.
-->
