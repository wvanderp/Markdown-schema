import type { TokensList } from 'marked';
import { describe, expect, it } from 'vitest';
import validate from '../src';
import type { SchemaDefinition, SchemaTokenDefinition } from '../src/schema/Schema';
import validateTokens from '../src/validateTokens';
import validateSchema from '../src/validateSchema';
import type { Extension } from '../src/Extension';

/**
 * Converts a plain token array into a TokensList with an empty links map.
 * @param tokens - Array of token-shaped objects.
 * @returns TokensList expected by validateTokens.
 */
function toTokensList(tokens: any[]): TokensList {
  return Object.assign(tokens, { links: {} }) as TokensList;
}

/**
 * Creates a root schema wrapper around provided token definitions.
 * @param children - Token definitions under the root.
 * @returns Root schema definition used by tests.
 */
function toSchema(children: SchemaTokenDefinition[]): SchemaDefinition {
  return { type: 'root', children };
}

describe('extension registry', () => {
  it('throws for an unknown extension name', () => {
    expect(() => {
      validate({ type: 'x', extensions: ['no-such-extension'], children: [] }, '');
    }).toThrow('Unknown extension: "no-such-extension"');
  });
});

describe('validateSchema with extensions', () => {
  it('accepts an extension that contributes no tokenSchema', () => {
    // Exercises the `ext.tokenSchema ? [...] : []` false branch.
    const extensionWithoutSchema: Extension = {
      name: 'no-schema',
      validateToken() { return undefined; },
    };

    const parsed = validateSchema({ type: 'doc', children: [] }, [extensionWithoutSchema]);
    expect(parsed.type).toBe('doc');
  });
});

describe('validateTokens extension delegation', () => {
  it('returns an error when a token type is not handled by any extension validator', () => {
    // Exercises the `return false` fallback in the validateToken default branch.
    const noOpExtension: Extension = {
      name: 'noop',
      validateToken() {
        return undefined; // explicitly declines to handle every token
      },
    };

    const errors = validateTokens(
      toSchema([{ type: 'custom-token' as any }]),
      toTokensList([{ type: 'custom-token' as any }]),
      [noOpExtension]
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("No extension validator handled 'custom-token' token");
  });

  it('skips an extension that has no validateToken when collecting validators', () => {
    // Exercises the `ext.validateToken ? [...] : []` false branch in validateTokens.
    const extensionWithoutValidator: Extension = {
      name: 'no-validator',
    };

    // Falls through to default case; extensionWithoutValidator is skipped, throws.
    const errors = validateTokens(
      toSchema([{ type: 'custom-token' as any }]),
      toTokensList([{ type: 'custom-token' as any }]),
      [extensionWithoutValidator]
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("No extension validator handled 'custom-token' token");
  });

  it('continues to the next extension validator when an earlier one declines a token', () => {
    const decliningExtension: Extension = {
      name: 'declining',
      validateToken() {
        return undefined;
      },
    };

    const handlingExtension: Extension = {
      name: 'handling',
      validateToken(definition, token) {
        if (definition['type'] !== 'custom-token' || token['type'] !== 'custom-token') {
          return undefined;
        }

        return true;
      },
    };

    const result = validateTokens(
      { type: 'root', children: [{ type: 'custom-token' } as any] },
      toTokensList([{ type: 'custom-token' }] as any),
      [decliningExtension, handlingExtension]
    );

    expect(result).toHaveLength(0);
  });

  it('returns an error when an extension validator explicitly rejects a token', () => {
    const rejectingExtension: Extension = {
      name: 'rejecting',
      validateToken(definition, token) {
        if (definition['type'] !== 'custom-token' || token['type'] !== 'custom-token') {
          return undefined;
        }

        return false;
      },
    };

    const errors = validateTokens(
      toSchema([{ type: 'custom-token' as any }]),
      toTokensList([{ type: 'custom-token' as any }]),
      [rejectingExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'custom-token' token");
  });
});
