/**
 * Configuration Utilities for Metalsmith Plugins
 * 
 * This file provides utilities for handling plugin configuration:
 * - Deep merging of configuration objects
 * - File pattern matching using Metalsmith's native methods
 * - Option validation and normalization
 * 
 * Philosophy: Use Metalsmith's built-in capabilities and local utility functions
 * instead of external dependencies to keep plugins lightweight.
 */

// No external imports needed - we use Metalsmith's built-in match() method for file patterns

/**
 * Deep merge configuration objects
 * 
 * Modern functional approach using reduce() and object spread.
 * This implementation:
 * - Creates new objects instead of mutating existing ones
 * - Handles nested objects recursively
 * - Uses constructor check for reliable object detection
 * - Utilizes optional chaining for safe property access
 * 
 * Based on the proven implementation from metalsmith-optimize-images.
 */
const deepMerge = (target, source) =>
  Object.keys(source).reduce(
    (acc, key) => ({
      ...acc,
      // If source value is a plain object, recursively merge it
      // Otherwise, use the source value directly (overwrites target)
      [key]: source[key]?.constructor === Object 
        ? deepMerge(target[key] || {}, source[key]) 
        : source[key]
    }),
    { ...target }  // Start with a copy of target to avoid mutation
  );

/**
 * Normalize plugin options
 * @param {Object} options - Raw options (already merged with defaults)
 * @returns {Object} Normalized options
 */
export function normalizeOptions(options) {
  const normalized = { ...options };
  
  // Ensure pattern is an array (it's guaranteed to exist from defaults)
  if (typeof normalized.pattern === 'string') {
    normalized.pattern = [normalized.pattern];
  }
  
  // Ensure ignore is an array (it's guaranteed to exist from defaults)
  if (typeof normalized.ignore === 'string') {
    normalized.ignore = [normalized.ignore];
  } else if (!Array.isArray(normalized.ignore)) {
    normalized.ignore = [];
  }
  
  return normalized;
}

/**
 * Get files that match patterns and are not ignored
 * 
 * Uses Metalsmith's built-in match() method instead of external glob libraries.
 * This approach:
 * - Leverages Metalsmith's native file matching capabilities
 * - Eliminates external dependencies 
 * - Ensures consistent behavior with other Metalsmith plugins
 * - Supports all glob patterns that Metalsmith supports
 * 
 * @param {Object} files - Metalsmith files object (all files in the build)
 * @param {Object} options - Normalized options with pattern and ignore arrays
 * @param {Object} metalsmith - Metalsmith instance (needed for match method)
 * @returns {string[]} Array of file paths to process
 */
export function validateFiles(files, options, metalsmith) {
  const { pattern, ignore } = options;
  const allFiles = Object.keys(files);  // Get all file paths in the build

  // Use Metalsmith's native match method to find files matching our patterns
  // This supports glob patterns like '**/*.md', 'src/*.js', etc.
  const matchedFiles = metalsmith.match(pattern, allFiles);

  // If no ignore patterns specified, return all matched files
  if (ignore.length === 0) {
    return matchedFiles;
  }

  // Find files that match ignore patterns
  const ignoredFiles = metalsmith.match(ignore, allFiles);
  
  // Return matched files minus ignored files
  return matchedFiles.filter(filename => !ignoredFiles.includes(filename));
}

// Export deepMerge for use in main plugin file
export { deepMerge };