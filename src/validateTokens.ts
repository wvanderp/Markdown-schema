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

interface PositionedToken {
  token: RuntimeToken;
  line: number;
}

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
 * Associates each runtime token with the source line used for error reporting.
 * @param tokens - Runtime tokens in document order.
 * @param startLine - 1-based line where the token list begins.
 * @returns Positioned runtime tokens and the next line after the list.
 */
function positionTokens(
  tokens: TokensWithOptionalSpace,
  startLine: number
): { positionedTokens: PositionedToken[]; nextLine: number } {
  const positionedTokens: PositionedToken[] = [];
  let currentLine = startLine;

  for (const token of tokens) {
    positionedTokens.push({ token: token as RuntimeToken, line: currentLine });
    currentLine += countLines((token as { raw?: string }).raw ?? '');
  }

  return { positionedTokens, nextLine: currentLine };
}

/**
 * Validates a token list using exact positional matching.
 * @param definitions - Expected schema token definitions.
 * @param positionedTokens - Runtime tokens paired with source lines.
 * @param context - Validation callbacks and extension validators.
 * @param startLine - 1-based line number of the first token in this list.
 * @returns Validation errors produced by strict matching.
 */
function validateStrictTokenList(
  definitions: SchemaTokenDefinition[],
  positionedTokens: PositionedToken[],
  context: TokenValidationContext,
  startLine: number
): ValidationError[] {
  if (definitions.length !== positionedTokens.length) {
    return [{
      line: startLine,
      message: `Expected ${definitions.length} token(s) but got ${positionedTokens.length}`,
    }];
  }

  const errors: ValidationError[] = [];

  for (let i = 0; i < definitions.length; i++) {
    const positionedToken = positionedTokens[i];
    errors.push(
      ...validateToken(definitions[i], positionedToken.token, positionedToken.line, context)
    );
  }

  return errors;
}

/**
 * Validates a token list using ordered-subsequence matching.
 * @param definitions - Expected schema token definitions.
 * @param positionedTokens - Runtime tokens paired with source lines.
 * @param context - Validation callbacks and extension validators.
 * @param nextLine - 1-based line used when no runtime tokens remain.
 * @returns Validation errors produced by non-strict matching.
 */
function validateNonStrictTokenList(
  definitions: SchemaTokenDefinition[],
  positionedTokens: PositionedToken[],
  context: TokenValidationContext,
  nextLine: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  let searchIndex = 0;

  for (const definition of definitions) {
    let matched = false;

    for (let i = searchIndex; i < positionedTokens.length; i++) {
      const candidate = positionedTokens[i];
      const candidateErrors = validateToken(definition, candidate.token, candidate.line, context);

      if (candidateErrors.length === 0) {
        matched = true;
        searchIndex = i + 1;
        break;
      }
    }

    if (!matched) {
      if (searchIndex < positionedTokens.length) {
        const blockingToken = positionedTokens[searchIndex];
        return validateToken(definition, blockingToken.token, blockingToken.line, context);
      }

      return [{
        line: nextLine,
        message: `Expected a '${definition.type}' token but none matched ${formatPosition(nextLine)}`,
      }];
    }
  }

  return errors;
}

/**
 * Validates an ordered runtime token list against schema token definitions.
 * @param definitions - Expected schema token definitions.
 * @param tokens - Runtime tokens from marked.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param strict - Whether this token list requires exact matching.
 * @param startLine - 1-based line number of the first token in this list.
 * @returns Array of validation errors found in the list.
 */
function validateTokenList(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace,
  extensionValidators: TokenValidationContext['extensionValidators'],
  strict: boolean,
  startLine: number = 1
): ValidationError[] {
  const context: TokenValidationContext = {
    extensionValidators,
    validateTokenList: (nestedDefinitions, nestedTokens, nestedStartLine = 1) =>
      validateTokenList(
        nestedDefinitions,
        nestedTokens,
        extensionValidators,
        strict,
        nestedStartLine
      ),
  };

  const normalizedTokens = normalizeTokensForDefinitions(definitions, tokens);
  const { positionedTokens, nextLine } = positionTokens(normalizedTokens, startLine);

  if (strict) {
    return validateStrictTokenList(definitions, positionedTokens, context, startLine);
  }

  return validateNonStrictTokenList(definitions, positionedTokens, context, nextLine);
}

/**
 * Validates that the markdown tokens match the schema definitions in order.
 * @param schema - The schema defining expected token types.
 * @param markdownTokens - The parsed markdown tokens to validate.
 * @param extensions - Active extensions that may handle custom token types.
 * @returns Array of validation errors. An empty array means the markdown matches
 * the schema exactly in strict mode, or contains the schema token sequence in
 * non-strict mode.
 * @example
 * validateTokens(
 *   {
 *     type: 'doc',
 *     strict: false,
 *     children: [{ type: 'heading' }, { type: 'paragraph' }],
 *   },
 *   marked.lexer('# Title\n\n---\n\nBody')
 * );
 */
export default function validateTokens(
  schema: SchemaDefinition,
  markdownTokens: TokensList,
  extensions: Extension[] = []
): ValidationError[] {
  const extensionValidators = extensions.flatMap(
    ext => ext.validateToken ? [ext.validateToken.bind(ext)] : []
  );
  return validateTokenList(
    schema.children,
    [...markdownTokens],
    extensionValidators,
    schema.strict ?? false
  );
}
