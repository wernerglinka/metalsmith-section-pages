/**
 * @fileoverview The section builder: constructs valid section objects
 * from component manifests.
 *
 * A section instance starts from the defaults the component's `fields`
 * block declares (the same data a fresh authoring form would emit),
 * gets the caller's overrides deep-merged on top, and is validated
 * against the component's `validation` block before it is returned.
 * Both the `$use`/`$extends` field resolution and the validation are
 * the bundler's own code (metalsmith-bundled-components subpath
 * exports), so a section built here is valid by the exact rules the
 * build enforces.
 */

import { resolveFields } from 'metalsmith-bundled-components/schema';
import { validateSection } from 'metalsmith-bundled-components/validation';
import { sectionNames } from './manifests.js';

/**
 * Top-level keys every section instance carries for structural
 * reasons; they are not declared in the fields block.
 * @type {Object}
 */
const STRUCTURAL_DEFAULTS = {
  containerTag: 'section',
  classes: '',
  id: '',
  isDisabled: false
};

/**
 * @param {*} value - Value to test
 * @returns {boolean} Whether value is a plain (non-array) object
 */
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * A field "leaf" is any fields node carrying a `widget` property;
 * plain objects without one are groups of nested fields.
 * @param {*} node - Fields node
 * @returns {boolean} Whether node is a widget leaf
 */
function isLeaf(node) {
  return isPlainObject(node) && typeof node.widget === 'string';
}

/**
 * The default value a single widget leaf emits.
 * @param {Object} leaf - Widget leaf
 * @returns {*} Default value
 */
function leafDefault(leaf) {
  if (leaf.widget === 'array' || leaf.widget === 'multiselect') {
    return Array.isArray(leaf.default) ? structuredClone(leaf.default) : [];
  }
  if ('default' in leaf) {
    return structuredClone(leaf.default);
  }
  if (leaf.widget === 'checkbox') {
    return false;
  }
  return '';
}

/**
 * Materialize a defaults object from a resolved field tree: the data a
 * fresh authoring form would emit before the user types anything.
 * Leaves contribute their declared default, groups recurse, array
 * widgets contribute an empty array.
 *
 * @param {Object} tree - Resolved field tree
 * @returns {Object} Nested defaults object
 */
export function materializeDefaults(tree) {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    if (isLeaf(value)) {
      out[key] = leafDefault(value);
    } else if (isPlainObject(value)) {
      out[key] = materializeDefaults(value);
    }
  }
  return out;
}

/**
 * Deep-merge overrides onto a base without mutating either. Plain
 * objects merge recursively; arrays and scalars replace.
 *
 * @param {Object} base - Base object
 * @param {Object} overrides - Values to lay on top
 * @returns {Object} New merged object
 */
export function deepMerge(base, overrides) {
  const out = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = Array.isArray(value) ? structuredClone(value) : value;
    }
  }
  return out;
}

/**
 * Create a section builder bound to a component map.
 *
 * The returned function builds one section instance:
 *   section('hero', { text: { title: 'Welcome' } })
 * materializes the hero manifest's field defaults, merges the
 * overrides, validates against the manifest's validation block, and
 * returns the section object. Invalid input throws with the
 * component's own validation message, so a bad mapping fails the build
 * with a path-precise error instead of rendering wrong.
 *
 * @param {Map<string, Object>} componentMap - Loaded component map
 * @returns {function(string, Object=): Object} The section builder
 */
export function createSectionBuilder(componentMap) {
  const defaultsCache = new Map();

  return function section(type, overrides = {}) {
    const manifest = componentMap.get(type);
    if (!manifest || manifest.type !== 'section') {
      throw new Error(
        `metalsmith-section-pages: unknown section type "${type}". ` +
          `Known sections: ${sectionNames(componentMap).join(', ')}`
      );
    }

    let defaults = defaultsCache.get(type);
    if (!defaults) {
      const fieldTree = isPlainObject(manifest.fields) ? resolveFields(manifest.fields, componentMap) : {};
      defaults = {
        sectionType: type,
        ...STRUCTURAL_DEFAULTS,
        ...materializeDefaults(fieldTree)
      };
      defaultsCache.set(type, defaults);
    }

    const merged = deepMerge(structuredClone(defaults), overrides);
    merged.sectionType = type;

    const result = validateSection(merged, manifest.validation, `section("${type}")`);
    if (!result.valid) {
      throw new Error(`metalsmith-section-pages: ${result.error}`);
    }

    return merged;
  };
}
