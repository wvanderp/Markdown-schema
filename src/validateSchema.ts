import buildSchemaDefinition from './schema/Schema';
import type { SchemaDefinition } from './schema/Schema';
import type { Extension } from './Extension';

/**
 * Formats a Zod error path into a readable field description
 * @param path - Array of path segments from a Zod issue.
 * @returns Human-readable dot/bracket notation string.
 */
function formatErrorPath(path: (string | number)[]): string {
  if (path.length === 0) return 'root';
  return path.map((p, i) => {
    if (typeof p === 'number') {
      return `[${p}]`;
    }
    // c8 ignore next - `.${p}` only needed for nested object paths not produced by this schema
    return i === 0 ? p : `.${p}`;
  }).join('');
}

/**
 * Generates a helpful error message from Zod validation errors
 * @param error - Zod error object containing issue details.
 * @returns A human-readable error message string.
 */
function buildErrorMessage(error: any): string {
  const firstIssue = error.issues[0];

  const { path, message, code } = firstIssue;
  const fieldPath = formatErrorPath(path);

  // Handle specific error patterns
  if (code === 'invalid_union') {
    // Find the union branch with the fewest errors — it most closely matched the type discriminator
    const branches: any[][] = firstIssue.errors;
    const bestBranch = branches.reduce<any[]>(
      (best, b) => b.length < best.length ? b : best,
      branches[0]
    );

    for (const err of bestBranch) {
      if (err.code === 'invalid_type') {
        return `Invalid ${formatErrorPath(err.path)}: expected ${err.expected}, got ${err.received}`;
      }
      if (err.code === 'invalid_value') {
        return `Invalid ${formatErrorPath(err.path)}: expected one of [${err.values.join(', ')}]`;
      }
      if (err.code === 'unrecognized_keys') {
        const keys: string[] = err.keys;
        return `Unexpected propert${keys.length > 1 ? 'ies' : 'y'}: ${keys.map((k: string) => `'${k}'`).join(', ')}`;
      }
    }

    return 'Unknown token type - none of the valid token types matched';
  }

  if (code === 'unrecognized_keys') {
    const keys: string[] = firstIssue.keys;
    const keyStr = keys.map((k: string) => `'${k}'`).join(', ');
    return `Unexpected propert${keys.length > 1 ? 'ies' : 'y'}: ${keyStr}`;
  }

  if (code === 'invalid_type') {
    const [, expected, received] = message.match(/expected (\w+), received (\w+)/i)!;
    if (fieldPath.includes('children')) {
      return `Expected children to be an array, got ${received}`;
    }
    if (fieldPath.includes('extensions')) {
      if (fieldPath.includes('[')) {
        return `Expected extension name to be a ${expected}, got ${received}`;
      }
      return `Expected extensions to be an array, got ${received}`;
    }
    return `Invalid ${fieldPath}: expected ${expected}, got ${received}`;
  }

  /* c8 ignore start - fallback for error codes not produced by the current schema */
  return `Invalid ${fieldPath}: ${message}`;
  /* c8 ignore end */
}

/**
 * Parses and validates inputs for markdown validation.
 * @param schema - The value to parse as a Schema object.
 * @param extensions - Resolved extension implementations whose token schemas are included.
 * @returns The parsed schema value.
 * @throws {Error} If schema is invalid.
 */
export default function validateSchema(
  schema: unknown,
  extensions: Extension[] = []
): SchemaDefinition {
  const extensionTokenSchemas = extensions.flatMap(ext => ext.tokenSchema ? [ext.tokenSchema] : []);
  const schemaValidator = buildSchemaDefinition(extensionTokenSchemas);
  const schemaResult = schemaValidator.safeParse(schema);

  if (!schemaResult.success) {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      throw new Error('The schema needs to be an object');
    }

    const errorMessage = buildErrorMessage(schemaResult.error);
    throw new Error(errorMessage);
  }

  return schemaResult.data;
}
