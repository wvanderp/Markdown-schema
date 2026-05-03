import type { Tokens } from 'marked';
import type { SchemaTokenDefinition } from '../schema/Schema';
import type { RuntimeToken, TokenValidator, ValidationError } from './tokenTypes';
import { checkField } from './tokenUtils';

/**
 * Returns an empty validation error array for tokens with no validatable fields.
 * @returns An empty validation error array.
 */
function validateNoopToken(): ValidationError[] { return []; }

/**
 * Validates a checkbox token's checked field.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @returns Array of validation errors.
 */
function validateCheckboxToken(
  definition: SchemaTokenDefinition, token: RuntimeToken, line: number
): ValidationError[] {
  const markedToken = token as Tokens.Checkbox;
  return checkField('checkbox', 'checked', (definition as Tokens.Checkbox).checked, markedToken.checked, line);
}

/**
 * Validates a codespan token's text field.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @returns Array of validation errors.
 */
function validateCodespanToken(
  definition: SchemaTokenDefinition, token: RuntimeToken, line: number
): ValidationError[] {
  const markedToken = token as Tokens.Codespan;
  return checkField('codespan', 'text', (definition as Tokens.Codespan).text, markedToken.text, line);
}

/**
 * Validates an escape token's text field.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @returns Array of validation errors.
 */
function validateEscapeToken(
  definition: SchemaTokenDefinition, token: RuntimeToken, line: number
): ValidationError[] {
  const markedToken = token as Tokens.Escape;
  return checkField('escape', 'text', (definition as Tokens.Escape).text, markedToken.text, line);
}

export const leafTokenValidators: Record<string, TokenValidator> = {
  br: validateNoopToken,
  checkbox: validateCheckboxToken,
  codespan: validateCodespanToken,
  escape: validateEscapeToken,
  hr: validateNoopToken,
  space: validateNoopToken,
};
