import type { TokensList } from 'marked';
import type { SchemaDefinition, SchemaTokenDefinition } from './schema/Schema';
import type { Extension } from './Extension';
import type {
  RuntimeToken,
  TokenValidationContext,
  TokensWithOptionalSpace,
  ValidationError,
} from './validation/tokenTypes';
import { validateExtensionToken } from './validation/extensionTokenValidator';
import { tokenValidators } from './validation/tokenValidatorMap';
import {
  countLines,
  formatPosition,
  normalizeTokensForDefinitions,
} from './validation/tokenUtils';

export type { ValidationError };

/**
 * Validates a single token against its schema definition.
 * @param definition - Expected schema token definition.
 * @param token - Runtime token from marked.
 * @param line - 1-based source line where this token appears.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors found in the token.
 */
function validateToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const actualType = (token as { type: string }).type;

  if (definition.type !== actualType) {
    return [{
      line,
      message: `Expected a '${definition.type}' token but got '${actualType}' ${formatPosition(line)}`,
    }];
  }

  const validator = tokenValidators[definition.type];

  if (!validator) {
    return validateExtensionToken(definition, token, line, context);
  }

  return validator(definition, token, line, context);
}

/**
 * Validates an ordered runtime token list against schema token definitions.
 * @param definitions - Expected schema token definitions.
 * @param tokens - Runtime tokens from marked.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param startLine - 1-based line number of the first token in this list.
 * @returns Array of validation errors found in the list.
 */
function validateTokenList(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace,
  extensionValidators: TokenValidationContext['extensionValidators'],
  startLine: number = 1
): ValidationError[] {
  const context: TokenValidationContext = {
    extensionValidators,
    validateTokenList: (nestedDefinitions, nestedTokens, nestedStartLine = 1) =>
      validateTokenList(nestedDefinitions, nestedTokens, extensionValidators, nestedStartLine),
  };

  const normalizedTokens = normalizeTokensForDefinitions(definitions, tokens);

  if (definitions.length !== normalizedTokens.length) {
    return [{ line: startLine, message: `Expected ${definitions.length} token(s) but got ${normalizedTokens.length}` }];
  }

  const errors: ValidationError[] = [];
  let currentLine = startLine;

  for (let i = 0; i < definitions.length; i++) {
    const token = normalizedTokens[i] as RuntimeToken;
    errors.push(...validateToken(definitions[i], token, currentLine, context));
    currentLine += countLines((token as { raw?: string }).raw ?? '');
  }

  return errors;
}

/**
 * Validates that the markdown tokens match the schema definitions in order.
 * @param schema - The schema defining expected token types.
 * @param markdownTokens - The parsed markdown tokens to validate.
 * @param extensions - Active extensions that may handle custom token types.
 * @returns Array of validation errors. An empty array means the tokens exactly match the schema.
 */
export default function validateTokens(
  schema: SchemaDefinition,
  markdownTokens: TokensList,
  extensions: Extension[] = []
): ValidationError[] {
  const extensionValidators = extensions.flatMap(
    ext => ext.validateToken ? [ext.validateToken.bind(ext)] : []
  );
  return validateTokenList(schema.children, [...markdownTokens], extensionValidators);
}
