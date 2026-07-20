# metalsmith-section-pages

[![metalsmith:plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![test coverage][coverage-badge]][coverage-url]
[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-section-pages/badge.svg)](https://snyk.io/test/npm/metalsmith-section-pages)

> Generate structured-content pages composed of validated library sections from data records

Turns data records (from a spreadsheet API, a headless CMS, a JSON
file, anything that produces an array) into pages built from a
component library's sections, the structured-content format used by
[nunjucks-components](https://github.com/wernerglinka/nunjucks-components)
and the Metalsmith2025 structured-content starter. Generated pages
flow through the normal pipeline: layouts, permalinks, and the
component bundler treat them exactly like hand-written pages.

The heart of the plugin is a manifest-aware section builder. Your
mapping function writes

```js
section('hero', { text: { title: record.title, titleTag: 'h1' } })
```

and the builder materializes every other property from the component's
own `manifest.json` fields block (including `$use` and `$extends`
composition), merges your overrides, and validates the result against
the manifest's validation block. The plugin does not know what a hero
is; it reads the manifests. A new section in the library is
constructible the moment its manifest lands, and a bad record fails
the build with a path-precise error instead of rendering wrong.

## Installation

```bash
npm install metalsmith-section-pages
```

Requires `metalsmith-bundled-components` >= 1.3.0 as a peer dependency
(its schema and validation utilities are the single source of truth
for what sections accept; any site using a section component library
already has it).

## Usage

Records are loaded into metadata by any earlier step (a fetch plugin,
a data file loader, inline code), then this plugin maps each record to
a page:

```js
import Metalsmith from 'metalsmith';
import sectionPages from 'metalsmith-section-pages';

Metalsmith(import.meta.dirname)
  .use(loadClassData()) // puts an array at metadata.classes
  .use(
    sectionPages({
      source: 'classes',
      path: (record) => `classes/${record.id}.md`,
      page: (record, { section }) => ({
        seo: { title: record.title, description: record.summary },
        card: { title: record.title, date: record.firstDate },
        sections: [
          section('hero', {
            text: { title: record.title, titleTag: 'h1', prose: record.summary }
          }),
          section('multi-media', {
            mediaType: 'iframe',
            isReverse: true,
            iframe: { src: record.registrationUrl, title: 'Registration form', allow: 'payment' },
            text: { title: 'What to expect', prose: record.whatToExpect },
            disclosures: [
              { title: 'Cancellation policy', prose: record.cancellationPolicy }
            ]
          })
        ]
      })
    })
  )
  .build((err) => {
    if (err) throw err;
  });
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | `string \| function` | `'records'` | Metadata key holding the records array, or an async function `(metalsmith) => records` |
| `path` | `function` | (required) | `(record, index) => string`: repo-relative file path for the generated page |
| `page` | `function` | (required) | `(record, helpers) => page object` with a `sections` array; may be async. `helpers` is `{ section }` |
| `componentsPath` | `string` | `'lib/layouts/components'` | Directory holding `_partials/` and `sections/` with their manifest.json files |
| `layout` | `string` | `'pages/sections.njk'` | Layout for generated pages; a page object may override it per page |

## The section builder

`section(type, overrides)`:

1. Loads the component's manifest and resolves its `fields` block with
   the bundler's own resolver (`$use` pulls in a partial's fields,
   `$extends` merges shared blocks like `commons`).
2. Materializes defaults: the data a fresh authoring form would emit.
3. Deep-merges your overrides (objects merge, arrays and scalars
   replace).
4. Validates the merged section with the bundler's own
   `validateSection`, the same code the build runs. Failures throw
   with the component's error message, naming the exact property.

Hand-assembled section objects in the `sections` array are validated
too, so every generated page is held to the manifests no matter how it
was constructed.

## Errors are the API

Everything about a data-driven site build that can go quietly wrong is
turned into a build failure with a specific message: a missing records
array, an unknown section type (listing the known ones), an invalid
property value (with its dotted path), duplicate record ids, a
generated path colliding with a real source file.

## Writing a data provider

If you are building the API that feeds this plugin, read
[docs/data-provider-contract.md](docs/data-provider-contract.md). It
covers stable ids, ISO dates as text, publication gating, determinism,
failure semantics, and the content/presentation boundary, each learned
from a production sheet-driven site.

## Debug

```bash
DEBUG=metalsmith-section-pages metalsmith
```

## License

MIT © [Werner Glinka](https://github.com/wernerglinka)

[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[npm-badge]: https://img.shields.io/npm/v/metalsmith-section-pages.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-section-pages
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-section-pages
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-100.0%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-section-pages/actions/workflows/test.yml
