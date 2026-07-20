import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import Metalsmith from 'metalsmith';
import sectionPages from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'fixtures', 'site');

/**
 * A Metalsmith instance over the fixture site, with records in
 * metadata and no destination writes (tests use process(), not build()).
 * @param {Object[]} records - Records placed at metadata.classes
 * @returns {import('metalsmith')} Configured instance
 */
function fixtureMetalsmith(records) {
  return Metalsmith(FIXTURE).source('src').metadata({ classes: records });
}

/** Baseline plugin options against the fixture library. */
const baseOptions = {
  source: 'classes',
  path: (record) => `classes/${record.id}.md`,
  page: (record, { section }) => ({
    seo: { title: record.title },
    sections: [section('hero', { text: { title: record.title, titleTag: 'h1' } })]
  })
};

describe('metalsmith-section-pages', () => {
  it('exports a factory returning a metalsmith plugin', () => {
    assert.equal(typeof sectionPages, 'function');
    const plugin = sectionPages(baseOptions);
    assert.equal(typeof plugin, 'function');
  });

  it('requires the path and page options at configuration time', () => {
    assert.throws(() => sectionPages({}), /"path" option is required/);
    assert.throws(() => sectionPages({ path: () => 'x.md' }), /"page" option is required/);
  });

  it('generates one page per record with materialized manifest defaults', async () => {
    const files = await fixtureMetalsmith([{ id: 'weaving', title: 'Intro to Weaving' }])
      .use(sectionPages(baseOptions))
      .process();

    const page = files['classes/weaving.md'];
    assert.ok(page, 'generated page exists');
    assert.equal(page.layout, 'pages/sections.njk');
    assert.equal(page.seo.title, 'Intro to Weaving');

    const hero = page.sections[0];
    assert.equal(hero.sectionType, 'hero');
    // overrides applied
    assert.equal(hero.text.title, 'Intro to Weaving');
    assert.equal(hero.text.titleTag, 'h1');
    // untouched defaults from the text partial's fields
    assert.equal(hero.text.prose, '');
    assert.equal(hero.text.isCentered, false);
    // defaults pulled in through $extends: [commons]
    assert.equal(hero.containerTag, 'section');
    assert.equal(hero.containerFields.inContainer, true);
    assert.equal(hero.containerFields.noMargin.top, false);
    // array partial ($use: ctas) defaults to empty
    assert.deepEqual(hero.ctas, []);
    // own field default
    assert.equal(hero.isFullScreen, false);
  });

  it('lets a page override the default layout', async () => {
    const files = await fixtureMetalsmith([{ id: 'a', title: 'A' }])
      .use(
        sectionPages({
          ...baseOptions,
          page: (record, { section }) => ({
            layout: 'pages/custom.njk',
            sections: [section('hero', { text: { title: record.title } })]
          })
        })
      )
      .process();

    assert.equal(files['classes/a.md'].layout, 'pages/custom.njk');
  });

  it('accepts an async source function instead of a metadata key', async () => {
    const files = await Metalsmith(FIXTURE)
      .source('src')
      .use(
        sectionPages({
          ...baseOptions,
          source: async () => [{ id: 'from-fn', title: 'From Function' }]
        })
      )
      .process();

    assert.ok(files['classes/from-fn.md']);
  });

  it('strips a leading slash from generated paths', async () => {
    const files = await fixtureMetalsmith([{ id: 'b', title: 'B' }])
      .use(sectionPages({ ...baseOptions, path: (record) => `/classes/${record.id}.md` }))
      .process();

    assert.ok(files['classes/b.md']);
  });

  it('fails when the metadata key holds no array', async () => {
    await assert.rejects(
      Metalsmith(FIXTURE).source('src').use(sectionPages(baseOptions)).process(),
      /expected an array of records from metadata key "classes"/
    );
  });

  it('fails on an unknown section type, listing known sections', async () => {
    await assert.rejects(
      fixtureMetalsmith([{ id: 'x', title: 'X' }])
        .use(
          sectionPages({
            ...baseOptions,
            page: (_record, { section }) => ({ sections: [section('does-not-exist', {})] })
          })
        )
        .process(),
      /unknown section type "does-not-exist"[\s\S]*hero/
    );
  });

  it('fails with the manifest validation error for invalid overrides', async () => {
    await assert.rejects(
      fixtureMetalsmith([{ id: 'x', title: 'X' }])
        .use(
          sectionPages({
            ...baseOptions,
            page: (_record, { section }) => ({
              sections: [section('hero', { text: { titleTag: 'h7' } })]
            })
          })
        )
        .process(),
      /titleTag/
    );
  });

  it('validates hand-assembled sections against the manifests too', async () => {
    await assert.rejects(
      fixtureMetalsmith([{ id: 'x', title: 'X' }])
        .use(
          sectionPages({
            ...baseOptions,
            page: () => ({
              sections: [{ sectionType: 'hero', containerTag: 'nav' }]
            })
          })
        )
        .process(),
      /containerTag/
    );
  });

  it('fails when two records produce the same path', async () => {
    await assert.rejects(
      fixtureMetalsmith([
        { id: 'same', title: 'One' },
        { id: 'same', title: 'Two' }
      ])
        .use(sectionPages(baseOptions))
        .process(),
      /two records produced the same path/
    );
  });

  it('fails when a generated path collides with a source file', async () => {
    await assert.rejects(
      fixtureMetalsmith([{ id: 'existing', title: 'X' }])
        .use(sectionPages({ ...baseOptions, path: () => 'existing.md' }))
        .process(),
      /collides with an existing source file/
    );
  });

  it('fails when page() returns no sections array', async () => {
    await assert.rejects(
      fixtureMetalsmith([{ id: 'x', title: 'X' }])
        .use(sectionPages({ ...baseOptions, page: () => ({ seo: {} }) }))
        .process(),
      /must return an object with a sections array/
    );
  });

  it('does not share default objects between sections of the same type', async () => {
    const files = await fixtureMetalsmith([{ id: 'x', title: 'X' }])
      .use(
        sectionPages({
          ...baseOptions,
          page: (_record, { section }) => {
            const first = section('hero', { text: { title: 'First' } });
            first.containerFields.noMargin.top = true;
            const second = section('hero', { text: { title: 'Second' } });
            return { sections: [first, second] };
          }
        })
      )
      .process();

    const [first, second] = files['classes/x.md'].sections;
    assert.equal(first.containerFields.noMargin.top, true);
    assert.equal(second.containerFields.noMargin.top, false, 'mutating one section must not leak into the next');
  });
});
