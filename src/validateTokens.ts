import type { TokensList } from 'marked';
import { SchemaDefinition } from './Schema';

/**
 * Validates that the markdown tokens match the schema definitions in order.
 * @param schema - The schema defining expected token types.
 * @param markdownTokens - The parsed markdown tokens to validate.
 * @returns `true` if the tokens exactly match the schema, `false` otherwise.
 */
export default function validateTokens(schema: SchemaDefinition, markdownTokens: TokensList): boolean {
  const tokens = [...markdownTokens].filter(token => token.type !== 'space');

  for (const definition of schema.children) {
    const token = tokens.shift();

    // if there are no more tokens, the markdown is invalid
    if (!token) {
      return false;
    }

    if (token.type !== definition.type) {
      return false;
    }
  }

  // if there are still tokens left, the markdown is invalid
  if (tokens.length > 0) {
    return false;
  }

  return true;
}
