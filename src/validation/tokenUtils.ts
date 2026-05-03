import type { Token } from 'marked';
import type { SchemaTokenDefinition } from '../schema/Schema';
import type {
  TokenValidationContext,
  TokensWithOptionalSpace,
  ValidationError,
} from './tokenTypes';

/**
 * Casts an unknown runtime value into a generic object record.
 * @param value - Runtime value expected to be object-like.
 * @returns Value cast as a string-keyed record.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/**
 * Counts the number of newline characters in a raw token string.
 * @param raw - Raw markdown source text of a token.
 * @returns Number of newlines, used to advance the running line counter.
 */
export function countLines(raw: string): number {
  let count = 0;

  for (const ch of raw) {
    if (ch === '\n') count++;
  }

  return count;
}

/**
 * Formats a source position as a human-readable string.
 * @param line - 1-based line number.
 * @returns Formatted position string.
 */
export function formatPosition(line: number): string {
  return `at line ${line}, column 1`;
}

/**
 * Compares an actual array with an optional expected array.
 * @param expected - Optional expected array from the schema.
 * @param actual - Runtime array extracted from a markdown token.
 * @returns `true` when expected is undefined or all entries match in order.
 */
export function equalsArrayIfDefined<T>(expected: T[] | undefined, actual: T[]): boolean {
  if (typeof expected === 'undefined') {
    return true;
  }

  if (expected.length !== actual.length) {
    return false;
  }

  return expected.every((value, index) => Object.is(value, actual[index]));
}

/**
 * Creates a validation error describing a field mismatch.
 * @param tokenType - Token type label for the error message.
 * @param field - Field name that mismatched.
 * @param expected - Expected value from the schema.
 * @param actual - Actual value from the runtime token.
 * @param line - Current source line.
 * @returns A ValidationError object.
 */
function createFieldMismatch(
  tokenType: string,
  field: string,
  expected: unknown,
  actual: unknown,
  line: number
): ValidationError {
  return {
    line,
    message: `'${tokenType}' token has ${field} ${JSON.stringify(actual)} but expected ${JSON.stringify(expected)} ${formatPosition(line)}`,
  };
}

/**
 * Checks a single scalar field and returns a ValidationError array when the schema expectation is not met.
 * @param tokenType - Token type label for the error message.
 * @param field - Field name to check.
 * @param expected - Optional expected value from the schema.
 * @param actual - Runtime value from the token.
 * @param line - Current source line.
 * @returns Array containing one error when there is a mismatch, or an empty array when the field matches.
 */
export function checkField(
  tokenType: string,
  field: string,
  expected: unknown,
  actual: unknown,
  line: number
): ValidationError[] {
  if (expected !== undefined && !Object.is(expected, actual)) {
    return [createFieldMismatch(tokenType, field, expected, actual, line)];
  }

  return [];
}

/**
 * Validates nested token lists for tokens that contain children.
 * @param definitions - Optional nested schema token definitions.
 * @param tokens - Optional nested runtime tokens.
 * @param line - Source line of the parent token.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors found in nested tokens.
 */
export function validateNestedTokens(
  definitions: SchemaTokenDefinition[] | undefined,
  tokens: Token[] | undefined,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  if (!definitions) {
    return [];
  }

  return context.validateTokenList(definitions, tokens ?? [], line);
}

/**
 * Indicates whether literal space tokens must be preserved for validation.
 * @param definitions - Token definitions for the current validation scope.
 * @returns `true` when any definition explicitly expects a `space` token.
 */
export function shouldKeepSpaceTokens(definitions: SchemaTokenDefinition[]): boolean {
  return definitions.some(definition => definition.type === 'space');
}

/**
 * Normalizes runtime tokens to align with schema space-token expectations.
 * @param definitions - Token definitions for the current validation scope.
 * @param tokens - Runtime tokens to normalize.
 * @returns Tokens unchanged when `space` is expected, otherwise with `space` tokens removed.
 */
export function normalizeTokensForDefinitions(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace
): TokensWithOptionalSpace {
  if (shouldKeepSpaceTokens(definitions)) {
    return tokens;
  }

  return tokens.filter(token => token.type !== 'space');
}
