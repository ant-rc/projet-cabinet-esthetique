/**
 * Sanitize user input by removing potentially dangerous characters.
 * Used as defense-in-depth alongside React's built-in escaping.
 */
export function sanitize(value: string): string {
  return value
    .replace(/[<>"'`]/g, '') // strip HTML/attribute injection chars
    .replace(/javascript:/gi, '') // strip javascript: protocol
    .replace(/on\w+=/gi, '') // strip inline event handlers
    .trim();
}
