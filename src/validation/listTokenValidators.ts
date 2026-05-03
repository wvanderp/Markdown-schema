import type { Tokens } from 'marked';
import type { SchemaTokenDefinition } from '../schema/Schema';
import type { RuntimeToken, TokenValidationContext, TokenValidator, ValidationError } from './tokenTypes';
import { checkField, validateNestedTokens } from './tokenUtils';

/**
 * Validates a list token and its nested items.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateListToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.List;
  const listDefinition = definition as Tokens.List & { items?: SchemaTokenDefinition[] };

  for (const [field, expected, actual] of [
    ['ordered', listDefinition.ordered, markedToken.ordered],
    ['start', listDefinition.start, markedToken.start],
    ['loose', listDefinition.loose, markedToken.loose],
  ] as const) {
    errors.push(...checkField('list', field, expected, actual, line));
  }

  errors.push(...validateNestedTokens(listDefinition.items, markedToken.items, line, context));

  return errors;
}

/**
 * Validates a list item token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateListItemToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.ListItem;
  const listItemDefinition = definition as Tokens.ListItem;

  for (const [field, expected, actual] of [
    ['task', listItemDefinition.task, markedToken.task],
    ['checked', listItemDefinition.checked, markedToken.checked],
    ['loose', listItemDefinition.loose, markedToken.loose],
    ['text', listItemDefinition.text, markedToken.text],
  ] as const) {
    errors.push(...checkField('list_item', field, expected, actual, line));
  }

  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

export const listTokenValidators: Record<string, TokenValidator> = {
  list: validateListToken,
  list_item: validateListItemToken,
};
