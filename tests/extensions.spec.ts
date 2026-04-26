import type { TokensList } from 'marked';
import { describe, expect, it } from 'vitest';
import validate from '../src';
import type { SchemaDefinition, SchemaTokenDefinition } from '../src/schema/Schema';
import validateTokens from '../src/validateTokens';
import validateSchema from '../src/validateSchema';
import frontmatterExtension from '../src/extensions/frontmatter';
import type { Extension } from '../src/extensions/types';

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

describe('frontmatter extension', () => {
  it('validates a frontmatter token when no text constraint is specified', () => {
    const result = validateTokens(
      toSchema([{ type: 'frontmatter' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\ntitle: x\n---\n', text: 'title: x' }]),
      [frontmatterExtension]
    );

    expect(result).toHaveLength(0);
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
      toSchema([{ type: 'frontmatter' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\n---\n', text: '' }]),
      [noOpExtension]
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("No extension validator handled 'frontmatter' token");
  });

  it('skips an extension that has no validateToken when collecting validators', () => {
    // Exercises the `ext.validateToken ? [...] : []` false branch in validateTokens.
    const extensionWithoutValidator: Extension = {
      name: 'no-validator',
    };

    // Falls through to default case; extensionWithoutValidator is skipped, throws.
    const errors = validateTokens(
      toSchema([{ type: 'frontmatter' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\n---\n', text: '' }]),
      [extensionWithoutValidator]
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("No extension validator handled 'frontmatter' token");
  });

  it('frontmatter validateToken returns undefined for non-frontmatter types', () => {
    // Exercises the `return undefined` branch in frontmatter.ts validateToken
    // when called alongside another extension that handles the actual token type.
    const customExtension: Extension = {
      name: 'custom',
      validateToken(def) {
        if (def['type'] === 'custom-token') return true;
        return undefined;
      },
    };

    // Both definition and token have type 'custom-token'. The switch default case is reached.
    // frontmatterExtension.validateToken sees type !== 'frontmatter' → returns undefined (line 55).
    // customExtension.validateToken then handles it and returns true.

    // definition.type ('frontmatter') !== token.type ('custom-token') → returns error before extensions run.
    const errors1 = validateTokens(
      toSchema([{ type: 'frontmatter' as any }]),
      toTokensList([{ type: 'custom-token' as any }] as any),
      [frontmatterExtension, customExtension]
    );
    expect(errors1).toHaveLength(1);
    expect(errors1[0].message).toContain("Expected a 'frontmatter' token but got 'custom-token'");

    // We must use matching types to reach extension validators.
    const resultMatchingTypes = validateTokens(
      { type: 'root', children: [{ type: 'custom-token' } as any] },
      toTokensList([{ type: 'custom-token' }] as any),
      [frontmatterExtension, customExtension]
    );

    expect(resultMatchingTypes).toHaveLength(0);
  });
});
