/**
 * @fileoverview Component manifest loading.
 *
 * The component library (nunjucks-components or a starter derived from
 * it) declares each component's data contract in a manifest.json: a
 * `validation` block (what a section instance must look like) and a
 * `fields` block (the authorable form schema, including `$use` and
 * `$extends` composition). This module loads every manifest under a
 * components directory into the Map shape the bundler's schema
 * utilities expect.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load every component manifest (partials and sections) into a Map
 * keyed by component name.
 *
 * @param {string} componentsPath - Absolute path to the components
 *   directory, containing `_partials/` and `sections/` subdirectories
 * @returns {Map<string, Object>} Component name -> parsed manifest
 */
export function loadComponentMap(componentsPath) {
  if (!existsSync(componentsPath)) {
    throw new Error(
      `metalsmith-section-pages: components directory not found: ${componentsPath}. ` +
        'Set the componentsPath option to the directory holding _partials/ and sections/.'
    );
  }

  const map = new Map();

  for (const group of ['_partials', 'sections']) {
    const base = join(componentsPath, group);
    if (!existsSync(base)) {
      continue;
    }
    for (const name of readdirSync(base)) {
      const manifestPath = join(base, name, 'manifest.json');
      if (!existsSync(manifestPath)) {
        continue;
      }
      try {
        map.set(name, JSON.parse(readFileSync(manifestPath, 'utf8')));
      } catch (error) {
        throw new Error(`metalsmith-section-pages: invalid JSON in ${manifestPath}: ${error.message}`);
      }
    }
  }

  if (map.size === 0) {
    throw new Error(
      `metalsmith-section-pages: no component manifests found under ${componentsPath}. ` +
        'Expected component directories with manifest.json files in _partials/ and sections/.'
    );
  }

  return map;
}

/**
 * List the section component names in a component map, for error
 * messages.
 *
 * @param {Map<string, Object>} componentMap - Loaded component map
 * @returns {string[]} Sorted section names
 */
export function sectionNames(componentMap) {
  return [...componentMap.entries()]
    .filter(([, manifest]) => manifest.type === 'section')
    .map(([name]) => name)
    .sort();
}
