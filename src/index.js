/**
 * @fileoverview metalsmith-section-pages
 *
 * Generates structured-content pages composed of validated library
 * sections from data records. Records come from global metadata (put
 * there by any data-loading step: a fetch plugin, a JSON file, app
 * code) or from an injected async function. For each record the plugin
 * builds a virtual source file whose `sections` array is constructed
 * with a manifest-aware section builder, then hands it to the normal
 * pipeline: layouts, permalinks, and the component bundler treat the
 * generated pages exactly like hand-written ones.
 *
 * The section builder reads the component library's own manifests
 * (validation and fields blocks) through metalsmith-bundled-components'
 * schema utilities, so every generated section is valid by the same
 * rules the build enforces, and a bad record fails the build with a
 * path-precise error instead of rendering wrong.
 *
 * See docs/data-provider-contract.md for what a data source feeding
 * this plugin must guarantee.
 */

import { validateSections } from 'metalsmith-bundled-components/validation';
import { loadComponentMap } from './manifests.js';
import { createSectionBuilder } from './section-builder.js';

/**
 * Default options
 * @type {Object}
 */
const defaults = {
  source: 'records',
  componentsPath: 'lib/layouts/components',
  layout: 'pages/sections.njk'
};

/**
 * Plugin options
 * @typedef {Object} Options
 * @property {string|Function} [source='records'] - Metadata key holding
 *   the records array, or an async function (metalsmith) => records
 * @property {string} [componentsPath='lib/layouts/components'] - Path
 *   (relative to the Metalsmith directory) holding _partials/ and
 *   sections/ with their manifest.json files
 * @property {string} [layout='pages/sections.njk'] - Layout for
 *   generated pages; a page object may override it per page
 * @property {Function} path - (record, index) => repo-relative file
 *   path for the generated page, e.g. `classes/${record.id}.md`
 * @property {Function} page - (record, helpers) => page object with a
 *   `sections` array; helpers is { section }. May be async.
 */

/**
 * Resolve the records array from the configured source.
 *
 * @param {string|Function} source - Metadata key or async function
 * @param {import('metalsmith')} metalsmith - Metalsmith instance
 * @returns {Promise<Object[]>} Records
 */
async function resolveRecords(source, metalsmith) {
  const records = typeof source === 'function' ? await source(metalsmith) : metalsmith.metadata()[source];

  if (!Array.isArray(records)) {
    const from = typeof source === 'function' ? 'the source function' : `metadata key "${source}"`;
    throw new Error(
      `metalsmith-section-pages: expected an array of records from ${from}, got ${records === undefined ? 'undefined' : typeof records}. ` +
        'Run a data-loading plugin before this one, or pass a source function.'
    );
  }

  return records;
}

/**
 * Generate structured-content pages composed of validated library
 * sections from data records.
 *
 * @param {Options} options - Plugin options
 * @returns {import('metalsmith').Plugin} Metalsmith plugin function
 */
export default function sectionPages(options = {}) {
  const config = { ...defaults, ...options };

  // Fail at configuration time, not build time: these two are the
  // plugin's contract with the site and have no usable default.
  if (typeof config.path !== 'function') {
    throw new Error(
      'metalsmith-section-pages: the "path" option is required and must be a function (record, index) => string'
    );
  }
  if (typeof config.page !== 'function') {
    throw new Error(
      'metalsmith-section-pages: the "page" option is required and must be a function (record, helpers) => page object'
    );
  }

  const plugin = async function sectionPagesPlugin(files, metalsmith) {
    const debug = metalsmith.debug('metalsmith-section-pages');

    // Loaded per run so watch-mode manifest edits are picked up.
    const componentMap = loadComponentMap(metalsmith.path(config.componentsPath));
    const section = createSectionBuilder(componentMap);
    const helpers = { section };

    const records = await resolveRecords(config.source, metalsmith);
    debug('generating pages for %d records', records.length);

    const generated = new Set();

    for (const [index, record] of records.entries()) {
      const rawPath = config.path(record, index);
      if (typeof rawPath !== 'string' || rawPath.trim() === '') {
        throw new Error(`metalsmith-section-pages: path() returned ${JSON.stringify(rawPath)} for record ${index}`);
      }
      const filePath = rawPath.replace(/^\/+/, '');

      if (generated.has(filePath)) {
        throw new Error(
          `metalsmith-section-pages: two records produced the same path "${filePath}". ` +
            'Record ids must be unique and stable; see docs/data-provider-contract.md.'
        );
      }
      if (filePath in files) {
        throw new Error(`metalsmith-section-pages: generated path "${filePath}" collides with an existing source file`);
      }
      generated.add(filePath);

      const page = await config.page(record, helpers);
      if (!page || typeof page !== 'object' || !Array.isArray(page.sections)) {
        throw new Error(
          `metalsmith-section-pages: page() must return an object with a sections array (record ${index}, ${filePath})`
        );
      }

      // Sections built with helpers.section are already valid; this
      // pass also catches hand-assembled section objects, so every
      // generated page is held to the manifests no matter how it was
      // constructed.
      const errors = validateSections(page.sections, (type) => componentMap.get(type), filePath);
      if (errors.length > 0) {
        throw new Error(`metalsmith-section-pages:\n${errors.map((e) => e.message).join('\n')}`);
      }

      files[filePath] = {
        layout: config.layout,
        ...page,
        contents: Buffer.from('')
      };
      debug('generated %s', filePath);
    }

    debug('generated %d pages', generated.size);
  };

  Object.defineProperty(plugin, 'name', {
    value: 'sectionPages',
    configurable: true
  });

  return plugin;
}
