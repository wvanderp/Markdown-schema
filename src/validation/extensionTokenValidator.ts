import type { SchemaTokenDefinition } from '../schema/Schema';
import type { RuntimeToken, TokenValidationContext, ValidationError } from './tokenTypes';
import { formatPosition } from './tokenUtils';

/**
 * Delegates non-core token types to extension validators.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line where this token appears.
 * @param context - Validation callbacks and extension validators.
 * @returns Validation errors for unsupported extension handling.
 */
export function validateExtensionToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const def = definition as unknown as Record<string, unknown>;
  const tok = token as Record<string, unknown>;

  for (const validator of context.extensionValidators) {
    const result = validator(def, tok);

    if (result !== undefined) {
      if (!result) {
        return [{
          line,
          message: `Extension validator rejected '${definition.type}' token ${formatPosition(line)}`,
        }];
      }

      return [];
    }
  }

  return [{
    line,
    message: `No extension validator handled '${definition.type}' token ${formatPosition(line)}`,
  }];
}
