# metalsmith-section-pages

[![metalsmith:plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![test coverage][coverage-badge]][coverage-url]
[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-section-pages/badge.svg)](https://snyk.io/test/npm/metalsmith-section-pages)

> Generate structured-content pages composed of validated library sections from data records

## Features

Add features here...

## Installation

```bash
npm install metalsmith-section-pages
```

## Requirements

Add requirements here...

## Usage

```js
import Metalsmith from 'metalsmith';
import sectionPages from 'metalsmith-section-pages';

Metalsmith(import.meta.dirname)
  .use(sectionPages({
    // options
  }))
  .build((err) => {
    if (err) throw err;
  });
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pattern` | `string \| string[]` | `'**/*'` | Pattern to match files. Uses Metalsmith's native pattern matching. |
| `ignore` | `string \| string[]` | `[]` | Patterns to ignore files. |

## How It Works

Add how it works explanation here...

## Examples

Add examples here...

### Basic Usage

```js
import Metalsmith from 'metalsmith';
import sectionPages from 'metalsmith-section-pages';

Metalsmith(import.meta.dirname)
  .source('./src')
  .destination('./build')
  .use(sectionPages())
  .build((err) => {
    if (err) throw err;
    console.log('Build complete!');
  });
```

### With Options

```js
import Metalsmith from 'metalsmith';
import sectionPages from 'metalsmith-section-pages';

Metalsmith(import.meta.dirname)
  .source('./src')
  .destination('./build')
  .use(sectionPages({
    pattern: ['**/*.html', '**/*.md'],
    ignore: ['drafts/**/*']
  }))
  .build((err) => {
    if (err) throw err;
  });
```


## Debug

To enable debug logs, set the DEBUG environment variable to `metalsmith-section-pages*`:

```javascript
metalsmith.env('DEBUG', 'metalsmith-section-pages*');
```

## CLI Usage

Add CLI usage instructions here...

## Testing and Coverage

```bash
# Run tests
npm test

# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

This project maintains 80% code coverage across branches, lines, functions, and statements.

## Automated CI/CD

This plugin includes professional GitHub workflows for automated quality assurance:

### GitHub Actions Workflows

- **`.github/workflows/test.yml`**: Runs on every push and pull request
  - Automated testing across Node.js versions
  - Coverage calculation and badge updates
  - Automatic README updates with coverage percentages

- **`.github/workflows/claude-code.yml`**: AI-assisted code review
  - Automatic code review on pull requests
  - Integration with Claude Code for intelligent feedback
  - Requires `ANTHROPIC_API_KEY` secret in repository settings

### Coverage Badges

Coverage badges are automatically updated by the test workflow. The badge color changes based on coverage percentage:
- 90%+ = bright green
- 80-89% = green  
- 70-79% = yellow-green
- 60-69% = yellow
- 50-59% = orange
- <50% = red

## Release Management

This plugin uses an improved release system that generates professional GitHub releases:

- **Clean Release Notes**: Each release shows only relevant changes
- **Automatic Formatting**: Proper GitHub markdown with commit links
- **Full Changelog Links**: Easy access to detailed comparisons
- **Consistent Quality**: No more messy "Unreleased" sections

Release process:

```bash
npm run release:patch  # Bug fixes (1.2.3 → 1.2.4)
npm run release:minor  # New features (1.2.3 → 1.3.0)
npm run release:major  # Breaking changes (1.2.3 → 2.0.0)
```

### Writing Commit Messages for Rich Release Notes

Since release notes are auto-generated from commit messages, write detailed commits that clearly explain what changed and why:

**Good Examples:**
```bash
feat: add HTML attribute minification support

- Implement advanced attribute optimization algorithm
- Add support for preserving custom elements
- Improve processing performance by 40% on large files
- Add configuration option for selective attribute handling

Closes #123, resolves #124
```

```bash
fix: resolve nested script tag processing issue

- Fix edge case where nested script tags caused parsing errors
- Add comprehensive test coverage for complex HTML structures
- Improve error messages for malformed HTML
- Update documentation with troubleshooting guide

Fixes #156
```

```bash
docs: update usage examples with new API patterns

- Add async/await examples for modern JavaScript patterns
- Include TypeScript usage examples
- Update configuration options table
- Add troubleshooting section for common issues
```

**Commit Message Format:**
- **type**: Brief description (50 chars or less)
- **body**: Detailed explanation with bullet points
- **footer**: Issue references and breaking change notices

**Commit Types:**
- `feat:` New features or enhancements
- `fix:` Bug fixes
- `docs:` Documentation updates
- `perf:` Performance improvements
- `refactor:` Code refactoring without functional changes
- `test:` Test additions or modifications
- `build:` Build system or dependency changes

**Why This Matters:**
- Each commit message becomes a release note entry
- Users see exactly what changed and the impact
- Links to issues/PRs are preserved in GitHub releases
- Breaking changes are clearly documented
- Professional release notes are generated automatically

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Your Name](https://github.com/yourusername)

[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[npm-badge]: https://img.shields.io/npm/v/metalsmith-section-pages.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-section-pages
[license-badge]: https://img.shields.io/github/license/yourusername/metalsmith-section-pages
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-100.0%25-brightgreen
[coverage-url]: https://github.com/yourusername/metalsmith-section-pages/actions/workflows/test.yml