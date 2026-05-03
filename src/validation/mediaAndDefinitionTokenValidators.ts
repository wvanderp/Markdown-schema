import type { Tokens } from 'marked';
import type { SchemaTokenDefinition } from '../schema/Schema';
import type { RuntimeToken, TokenValidationContext, TokenValidator, ValidationError } from './tokenTypes';
import { asRecord, checkField, validateNestedTokens } from './tokenUtils';

/**
 * Validates a code block token's fields.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @returns Array of validation errors.
 */
function validateCodeToken(
  definition: SchemaTokenDefinition, token: RuntimeToken, line: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const defRec = asRecord(definition);
  const tokRec = asRecord(token);

  for (const field of ['codeBlockStyle', 'lang', 'text', 'escaped'] as const) {
    errors.push(...checkField('code', field, defRec[field], tokRec[field], line));
  }

  return errors;
}

/**
 * Validates a definition token's fields.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @returns Array of validation errors.
 */
function validateDefToken(
  definition: SchemaTokenDefinition, token: RuntimeToken, line: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Def;
  const defToken = definition as Tokens.Def;

  for (const [field, expected, actual] of [
    ['tag', defToken.tag, markedToken.tag],
    ['href', defToken.href, markedToken.href],
    ['title', defToken.title, markedToken.title],
  ] as const) {
    errors.push(...checkField('def', field, expected, actual, line));
  }

  return errors;
}

/**
 * Validates an HTML token's fields.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @returns Array of validation errors.
 */
function validateHtmlToken(
  definition: SchemaTokenDefinition, token: RuntimeToken, line: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const defRec = asRecord(definition);
  const tokRec = asRecord(token as Tokens.HTML & { inLink?: boolean; inRawBlock?: boolean });

  for (const field of ['pre', 'text', 'block', 'inLink', 'inRawBlock'] as const) {
    errors.push(...checkField('html', field, defRec[field], tokRec[field], line));
  }

  return errors;
}

/**
 * Validates an image token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateImageToken(
  definition: SchemaTokenDefinition, token: RuntimeToken,
  line: number, context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Image;
  const imageDefinition = definition as Tokens.Image;

  for (const [field, expected, actual] of [
    ['href', imageDefinition.href, markedToken.href],
    ['title', imageDefinition.title, markedToken.title],
    ['text', imageDefinition.text, markedToken.text],
  ] as const) {
    errors.push(...checkField('image', field, expected, actual, line));
  }

  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates a link token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateLinkToken(
  definition: SchemaTokenDefinition, token: RuntimeToken,
  line: number, context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Link;
  const linkDefinition = definition as Tokens.Link;

  for (const [field, expected, actual] of [
    ['href', linkDefinition.href, markedToken.href],
    ['title', linkDefinition.title, markedToken.title],
    ['text', linkDefinition.text, markedToken.text],
  ] as const) {
    errors.push(...checkField('link', field, expected, actual, line));
  }

  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

export const mediaAndDefinitionTokenValidators: Record<string, TokenValidator> = {
  code: validateCodeToken,
  def: validateDefToken,
  html: validateHtmlToken,
  image: validateImageToken,
  link: validateLinkToken,
};
