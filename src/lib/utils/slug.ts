/**
 * Slug utilities for story management
 * Format: TK-{number} (e.g., TK-1, TK-42, TK-123)
 */

/**
 * Formats a number into a story slug
 * @param number - The story number (from project counter)
 * @returns Formatted slug (e.g., "TK-42")
 */
export function formatStorySlug(number: number): string {
  return `TK-${number}`;
}

/**
 * Parses a story slug to extract the number
 * @param slug - The slug to parse (e.g., "TK-42")
 * @returns The extracted number, or null if invalid
 */
export function parseStorySlug(slug: string): number | null {
  const match = slug.match(/^TK-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Validates a story slug format
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidStorySlug(slug: string): boolean {
  return /^TK-\d+$/.test(slug);
}
