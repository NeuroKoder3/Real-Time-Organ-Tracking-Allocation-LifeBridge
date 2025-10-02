export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// auto-fix: provide default export for compatibility with default imports
export default isUnauthorizedError;
