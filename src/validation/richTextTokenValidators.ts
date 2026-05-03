import type { Tokens } from 'marked';
import type { SchemaTokenDefinition } from '../schema/Schema';
import type { RuntimeToken, TokenValidationContext, TokenValidator, ValidationError } from './tokenTypes';
import { checkField, formatPosition, validateNestedTokens } from './tokenUtils';

/**
 * Validates a blockquote token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateBlockquoteToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number, context:
  TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Blockquote;

  errors.push(...checkField('blockquote', 'text', (definition as Tokens.Blockquote).text, markedToken.text, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates a del token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateDelToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Del;

  errors.push(...checkField('del', 'text', (definition as Tokens.Del).text, markedToken.text, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates an em (italic) token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateEmToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Em;

  errors.push(...checkField('em', 'text', (definition as Tokens.Em).text, markedToken.text, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates a heading token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateHeadingToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Heading;
  const headingDefinition = definition as Tokens.Heading;

  if (
    headingDefinition.depth !== undefined &&
    !Object.is(headingDefinition.depth, markedToken.depth)
  ) {
    errors.push({
      line,
      message: `Heading has depth ${markedToken.depth} but expected ${headingDefinition.depth} ${formatPosition(line)}`,
    });
  }

  errors.push(...checkField('heading', 'text', headingDefinition.text, markedToken.text, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates a paragraph token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateParagraphToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Paragraph;

  errors.push(...checkField('paragraph', 'pre', (definition as { pre?: unknown }).pre, (markedToken as unknown as { pre?: unknown }).pre, line));
  errors.push(...checkField('paragraph', 'text', (definition as Tokens.Paragraph).text, markedToken.text, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates a strong (bold) token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateStrongToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Strong;

  errors.push(...checkField('strong', 'text', (definition as Tokens.Strong).text, markedToken.text, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

/**
 * Validates a text token and its nested tokens.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateTextToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const markedToken = token as Tokens.Text;
  const textDefinition = definition as Tokens.Text;

  errors.push(...checkField('text', 'text', textDefinition.text, markedToken.text, line));
  errors.push(...checkField('text', 'escaped', textDefinition.escaped, markedToken.escaped, line));
  errors.push(...validateNestedTokens(
    (definition as { tokens?: SchemaTokenDefinition[] }).tokens,
    markedToken.tokens, line, context
  ));

  return errors;
}

export const richTextTokenValidators: Record<string, TokenValidator> = {
  blockquote: validateBlockquoteToken,
  del: validateDelToken,
  em: validateEmToken,
  heading: validateHeadingToken,
  paragraph: validateParagraphToken,
  strong: validateStrongToken,
  text: validateTextToken,
};
