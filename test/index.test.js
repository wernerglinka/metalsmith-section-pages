import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Metalsmith from 'metalsmith';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sectionPages from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('metalsmith-section-pages', () => {
  let metalsmith;

  beforeEach(() => {
    metalsmith = Metalsmith(path.join(__dirname, 'fixtures', 'basic'));
  });

  it('should export a function', () => {
    assert.equal(typeof sectionPages, 'function');
  });

  it('should return a metalsmith plugin', () => {
    const plugin = sectionPages();
    assert.equal(typeof plugin, 'function');
    assert.equal(plugin.length, 3);
  });

  describe('basic functionality', () => {
    it('should process files with default options', (_t, done) => {
      metalsmith
        .use(sectionPages())
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          assert.equal(typeof files, 'object');
          assert.ok(Object.keys(files).length > 0);
          done();
        });
    });

    it('should handle empty file set', (_t, done) => {
      metalsmith = Metalsmith(path.join(__dirname, 'fixtures', 'empty'));

      metalsmith
        .use(sectionPages())
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          assert.equal(typeof files, 'object');
          done();
        });
    });
  });

  describe('options', () => {
    it('should accept pattern option', (_t, done) => {
      metalsmith
        .use(sectionPages({
          pattern: '**/*.html'
        }))
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          const htmlFiles = Object.keys(files).filter((f) => f.endsWith('.html'));
          assert.ok(htmlFiles.length > 0);
          done();
        });
    });

    it('should accept ignore option', (_t, done) => {
      metalsmith
        .use(sectionPages({
          ignore: ['**/ignore/**']
        }))
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          const ignoredFiles = Object.keys(files).filter((f) => f.includes('ignore/'));
          assert.equal(ignoredFiles.length, 0);
          done();
        });
    });

    it('should accept array patterns', (_t, done) => {
      metalsmith
        .use(sectionPages({
          pattern: ['**/*.html', '**/*.md']
        }))
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          const matchedFiles = Object.keys(files).filter(
            (f) => f.endsWith('.html') || f.endsWith('.md')
          );
          assert.ok(matchedFiles.length > 0);
          done();
        });
    });
  });



  describe('metadata generation', () => {
    it('should generate metadata for processed files', (_t, done) => {
      const metadataKey = '_test';

      metalsmith
        .use(sectionPages({
          metadata: true,
          metadataKey
        }))
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          const filesWithMetadata = Object.values(files).filter((f) => f[metadataKey]);
          assert.ok(filesWithMetadata.length > 0);
          done();
        });
    });
  });

  describe('error handling', () => {
    it('should handle invalid options gracefully', (_t, done) => {
      metalsmith
        .use(sectionPages({
          pattern: null
        }))
        .build((err) => {
          assert.ok(err instanceof Error);
          done();
        });
    });
  });

  describe('integration', () => {
    it('should work with other metalsmith plugins', (_t, done) => {
      metalsmith
        .use((files, _ms, next) => {
          // Simulate another plugin
          for (const file of Object.keys(files)) {
            files[file].processed = true;
          }
          next();
        })
        .use(sectionPages())
        .build((err, files) => {
          if (err) {
            return done(err);
          }
          const processedFiles = Object.values(files).filter((f) => f.processed);
          assert.ok(processedFiles.length > 0);
          done();
        });
    });
  });
});
