import type { TokensList } from 'marked';
import { describe, expect, it } from 'vitest';
import type { SchemaDefinition, SchemaTokenDefinition } from '../../../schema/Schema';
import validateTokens from '../../../validateTokens';
import frontmatterExtension from '../index';

/**
 * Converts plain token arrays into a TokensList with an empty links map.
 * @param tokens - Runtime token array used by the tests.
 * @returns Tokens list shape expected by validateTokens.
 */
function toTokensList(tokens: any[]): TokensList {
  return Object.assign(tokens, { links: {} }) as TokensList;
}

/**
 * Creates a root schema wrapper around provided token definitions.
 * @param children - Schema token definitions under the root.
 * @returns Root schema definition used by tests.
 */
function toSchema(children: SchemaTokenDefinition[]): SchemaDefinition {
  return { type: 'root', children };
}

describe('frontmatter extension token validation', () => {
  it('validates a frontmatter token when no text constraint is specified', () => {
    const result = validateTokens(
      toSchema([{ type: 'frontmatter' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\ntitle: x\n---\n', text: 'title: x' }]),
      [frontmatterExtension]
    );

    expect(result).toHaveLength(0);
  });

  it('returns an error when the frontmatter text does not match', () => {
    const errors = validateTokens(
      toSchema([{ type: 'frontmatter', text: 'expected-text' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\nactual\n---\n', text: 'actual-text' }]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('validates frontmatter key definitions via the extension validator', () => {
    const errors = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'title', type: 'string', required: true },
          { name: 'year', type: 'number', required: true },
          { name: 'published', type: 'boolean', required: true },
          { name: 'tags', type: 'array' },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ntitle: x\nyear: 2026\npublished: true\ntags: [a, b]\n---\n',
        text: 'title: x\nyear: 2026\npublished: true\ntags: [a, b]',
      }]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects frontmatter when an optional key pattern does not match', () => {
    const errors = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'slug', type: 'string', required: true, pattern: '[a-z0-9-]+' },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\nslug: Invalid-Slug\n---\n',
        text: 'slug: Invalid-Slug',
      }]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('allows missing optional frontmatter keys', () => {
    const result = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'slug', type: 'string', required: false },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ntitle: x\n---\n',
        text: 'title: x',
      }]),
      [frontmatterExtension]
    );

    expect(result).toHaveLength(0);
  });

  it('applies key patterns to non-string array entries', () => {
    const result = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'codes', type: 'array', required: true, pattern: '\\d+' },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ncodes: [1, 2]\n---\n',
        text: 'codes: [1, 2]',
      }]),
      [frontmatterExtension]
    );

    expect(result).toHaveLength(0);
  });

  it('applies key patterns to string array entries', () => {
    const result = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'tags', type: 'array', required: true, pattern: '[a-z]+' },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ntags: [alpha, beta]\n---\n',
        text: 'tags: [alpha, beta]',
      }]),
      [frontmatterExtension]
    );

    expect(result).toHaveLength(0);
  });

  it('applies key patterns to scalar non-string values', () => {
    const result = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'year', type: 'number', required: true, pattern: '\\d{4}' },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\nyear: 2026\n---\n',
        text: 'year: 2026',
      }]),
      [frontmatterExtension]
    );

    expect(result).toHaveLength(0);
  });

  it('rejects frontmatter key validation when token text is not a string', () => {
    const errors = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'title', type: 'string', required: true },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ntitle: x\n---\n',
        text: undefined,
      } as any]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('rejects frontmatter key validation when the parsed YAML root is not an object', () => {
    const errors = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'title', type: 'string', required: true },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\n- title\n- value\n---\n',
        text: '- title\n- value',
      }]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('rejects frontmatter key validation when YAML parsing fails', () => {
    const errors = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'title', type: 'string', required: true },
        ],
      }]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ntitle: [\n---\n',
        text: 'title: [',
      }]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('rejects unknown frontmatter key types defensively', () => {
    const errors = validateTokens(
      toSchema([{
        type: 'frontmatter',
        keys: [
          { name: 'title', type: 'unknown-type' },
        ],
      } as any]),
      toTokensList([{
        type: 'frontmatter',
        raw: '---\ntitle: x\n---\n',
        text: 'title: x',
      }]),
      [frontmatterExtension]
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('returns undefined for non-frontmatter token types so later extensions can handle them', () => {
    const customExtension = {
      name: 'custom',
      validateToken(definition: Record<string, unknown>, token: Record<string, unknown>) {
        if (definition['type'] !== 'custom-token' || token['type'] !== 'custom-token') {
          return undefined;
        }

        return true;
      },
    };

    const result = validateTokens(
      { type: 'root', children: [{ type: 'custom-token' } as any] },
      toTokensList([{ type: 'custom-token' }] as any),
      [frontmatterExtension, customExtension]
    );

    expect(result).toHaveLength(0);
  });
});
