import type { TokensList } from 'marked';
import { describe, expect, it } from 'vitest';
import type { SchemaDefinition, SchemaTokenDefinition } from '../src/schema/Schema';
import validateTokens from '../src/validateTokens';
import frontmatterExtension from '../src/extensions/frontmatter';

/**
 * Converts plain token arrays into a `TokensList` with a links map.
 * @param tokens - Runtime token array used by tests.
 * @returns Tokens list shape expected by `validateTokens`.
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
  return {
    type: 'root',
    children,
  };
}

describe('validateTokens', () => {
  it('supports all marked token definitions', () => {
    const tableToken = {
      type: 'table',
      raw: '|h|\n|-|\n|v|',
      align: ['left'],
      header: [{ text: 'h', tokens: [{ type: 'text', raw: 'h', text: 'h', escaped: false }], header: true, align: 'left' }],
      rows: [[{ text: 'v', tokens: [{ type: 'text', raw: 'v', text: 'v', escaped: false }], header: false, align: 'left' }]],
    };

    const cases: Array<{ definition: SchemaTokenDefinition; token: any }> = [
      {
        definition: { type: 'blockquote', text: 'quote', tokens: [{ type: 'paragraph' }] },
        token: { type: 'blockquote', raw: '> quote', text: 'quote', tokens: [{ type: 'paragraph', raw: 'quote', text: 'quote', tokens: [] }] },
      },
      { definition: { type: 'br' }, token: { type: 'br', raw: '  \n' } },
      { definition: { type: 'checkbox', checked: true }, token: { type: 'checkbox', raw: '[x] ', checked: true } },
      { definition: { type: 'code', lang: 'ts', text: 'const a = 1;', escaped: false }, token: { type: 'code', raw: '```ts\nconst a = 1;\n```', lang: 'ts', text: 'const a = 1;', escaped: false } },
      { definition: { type: 'codespan', text: 'x' }, token: { type: 'codespan', raw: '`x`', text: 'x' } },
      { definition: { type: 'def', tag: 'ref', href: 'https://x', title: 't' }, token: { type: 'def', raw: '[ref]: https://x "t"', tag: 'ref', href: 'https://x', title: 't' } },
      {
        definition: { type: 'del', text: 'x', tokens: [{ type: 'text', text: 'x' }] },
        token: { type: 'del', raw: '~~x~~', text: 'x', tokens: [{ type: 'text', raw: 'x', text: 'x', escaped: false }] },
      },
      {
        definition: { type: 'em', text: 'x', tokens: [{ type: 'text', text: 'x' }] },
        token: { type: 'em', raw: '*x*', text: 'x', tokens: [{ type: 'text', raw: 'x', text: 'x', escaped: false }] },
      },
      { definition: { type: 'escape', text: '*' }, token: { type: 'escape', raw: '\\*', text: '*' } },
      {
        definition: { type: 'heading', depth: 2, text: 'Title', tokens: [{ type: 'text', text: 'Title' }] },
        token: { type: 'heading', raw: '## Title', depth: 2, text: 'Title', tokens: [{ type: 'text', raw: 'Title', text: 'Title', escaped: false }] },
      },
      { definition: { type: 'hr' }, token: { type: 'hr', raw: '---' } },
      { definition: { type: 'html', text: '<span>', block: false, inLink: false, inRawBlock: false }, token: { type: 'html', raw: '<span>', text: '<span>', block: false, inLink: false, inRawBlock: false } },
      {
        definition: { type: 'image', href: 'https://i', title: null, text: 'img', tokens: [{ type: 'text', text: 'img' }] },
        token: { type: 'image', raw: '![img](https://i)', href: 'https://i', title: null, text: 'img', tokens: [{ type: 'text', raw: 'img', text: 'img', escaped: false }] },
      },
      {
        definition: { type: 'link', href: 'https://x', title: null, text: 'lnk', tokens: [{ type: 'text', text: 'lnk' }] },
        token: { type: 'link', raw: '[lnk](https://x)', href: 'https://x', title: null, text: 'lnk', tokens: [{ type: 'text', raw: 'lnk', text: 'lnk', escaped: false }] },
      },
      {
        definition: {
          type: 'list',
          ordered: false,
          start: '',
          loose: false,
          items: [{ type: 'list_item', task: true, checked: true, text: 'task', tokens: [{ type: 'checkbox' }, { type: 'text' }] }],
        },
        token: {
          type: 'list',
          raw: '- [x] task',
          ordered: false,
          start: '',
          loose: false,
          items: [{
            type: 'list_item',
            raw: '- [x] task',
            task: true,
            checked: true,
            loose: false,
            text: 'task',
            tokens: [
              { type: 'checkbox', raw: '[x] ', checked: true },
              { type: 'text', raw: 'task', text: 'task', escaped: false },
            ],
          }],
        },
      },
      {
        definition: { type: 'list_item', task: false, loose: false, text: 'item', tokens: [{ type: 'text', text: 'item' }] },
        token: {
          type: 'list_item',
          raw: '- item',
          task: false,
          loose: false,
          text: 'item',
          tokens: [{ type: 'text', raw: 'item', text: 'item', escaped: false }],
        },
      },
      {
        definition: { type: 'paragraph', text: 'para', tokens: [{ type: 'text', text: 'para' }] },
        token: { type: 'paragraph', raw: 'para', text: 'para', tokens: [{ type: 'text', raw: 'para', text: 'para', escaped: false }] },
      },
      { definition: { type: 'space' }, token: { type: 'space', raw: '\n\n' } },
      {
        definition: { type: 'strong', text: 'x', tokens: [{ type: 'text', text: 'x' }] },
        token: { type: 'strong', raw: '**x**', text: 'x', tokens: [{ type: 'text', raw: 'x', text: 'x', escaped: false }] },
      },
      { definition: { type: 'table', align: ['left'], header: [{ text: 'h', header: true, align: 'left', tokens: [{ type: 'text', text: 'h' }] }], rows: [[{ text: 'v', header: false, align: 'left', tokens: [{ type: 'text', text: 'v' }] }]] }, token: tableToken },
      {
        definition: { type: 'text', text: 'x', escaped: false, tokens: [{ type: 'text', text: 'x' }] },
        token: { type: 'text', raw: 'x', text: 'x', escaped: false, tokens: [{ type: 'text', raw: 'x', text: 'x', escaped: false }] },
      },
    ];

    for (const current of cases) {
      const result = validateTokens(toSchema([current.definition]), toTokensList([current.token]));
      expect(result).toHaveLength(0);
    }
  });

  it('validates frontmatter tokens via the frontmatter extension', () => {
    const result = validateTokens(
      toSchema([{ type: 'frontmatter', text: 'title: x' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\ntitle: x\n---\n', text: 'title: x' }]),
      [frontmatterExtension]
    );
    expect(result).toHaveLength(0);
  });

  it('fails when top-level type does not match', () => {
    const errors = validateTokens(
      toSchema([{ type: 'paragraph' }]),
      toTokensList([{ type: 'heading', raw: '# t', depth: 1, text: 't', tokens: [] }])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("Expected a 'paragraph' token but got 'heading' at line 1, column 1");
  });

  it('fails on nested token mismatch', () => {
    const errors = validateTokens(
      toSchema([{ type: 'paragraph', tokens: [{ type: 'strong' }] }]),
      toTokensList([{ type: 'paragraph', raw: 'x', text: 'x', tokens: [{ type: 'em', raw: '*x*', text: 'x', tokens: [] }] }])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("Expected a 'strong' token but got 'em' at line 1, column 1");
  });

  it('fails when expected space token is missing', () => {
    const errors = validateTokens(
      toSchema([{ type: 'heading' }, { type: 'space' }, { type: 'paragraph' }]),
      toTokensList([
        { type: 'heading', raw: '# h', depth: 1, text: 'h', tokens: [] },
        { type: 'paragraph', raw: 'p', text: 'p', tokens: [] },
      ])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Expected 3 token(s) but got 2');
  });

  it('fails table align and row constraints when schema specifies them', () => {
    const tableToken = {
      type: 'table',
      raw: '|h|\n|-|\n|v|',
      align: ['left'],
      header: [{ text: 'h', tokens: [{ type: 'text', raw: 'h', text: 'h', escaped: false }], header: true, align: 'left' }],
      rows: [[{ text: 'v', tokens: [{ type: 'text', raw: 'v', text: 'v', escaped: false }], header: false, align: 'left' }]],
    };

    const alignErrors = validateTokens(
      toSchema([{ type: 'table', align: ['right'] }]),
      toTokensList([tableToken])
    );
    expect(alignErrors).toHaveLength(1);
    expect(alignErrors[0].message).toMatch(/Table align .* does not match expected/);

    const cellErrors = validateTokens(
      toSchema([{ type: 'table', rows: [[{ text: 'x' }]] }]),
      toTokensList([tableToken])
    );
    expect(cellErrors).toHaveLength(1);
    expect(cellErrors[0].message).toMatch(/Table cell text .* does not match expected/);
  });

  it('covers table header and row length branches', () => {
    const baseTableToken = {
      type: 'table',
      raw: '|h|\n|-|\n|v|',
      align: ['left'],
      header: [{ text: 'h', tokens: [{ type: 'text', raw: 'h', text: 'h', escaped: false }], header: true, align: 'left' }],
      rows: [[{ text: 'v', tokens: [{ type: 'text', raw: 'v', text: 'v', escaped: false }], header: false, align: 'left' }]],
    };

    expect(validateTokens(
      toSchema([{ type: 'table', header: [{ text: 'h', header: true, align: 'left' }] }]),
      toTokensList([baseTableToken])
    )).toHaveLength(0);

    // Table cell with no text constraint in schema (covers definition.text === undefined branch)
    expect(validateTokens(
      toSchema([{ type: 'table', header: [{ header: true, align: 'left' }] }]),
      toTokensList([baseTableToken])
    )).toHaveLength(0);

    const cellCountErrors = validateTokens(
      toSchema([{ type: 'table', header: [{ text: 'h' }, { text: 'extra' }] }]),
      toTokensList([baseTableToken])
    );
    expect(cellCountErrors).toHaveLength(1);
    expect(cellCountErrors[0].message).toContain('Expected 2 table cell(s) but got 1');

    const cellTextErrors = validateTokens(
      toSchema([{ type: 'table', header: [{ text: 'different' }] }]),
      toTokensList([baseTableToken])
    );
    expect(cellTextErrors).toHaveLength(1);
    expect(cellTextErrors[0].message).toMatch(/Table cell text .* does not match expected/);

    const rowCountErrors = validateTokens(
      toSchema([{ type: 'table', rows: [[{ text: 'v' }], [{ text: 'extra' }]] }]),
      toTokensList([baseTableToken])
    );
    expect(rowCountErrors).toHaveLength(1);
    expect(rowCountErrors[0].message).toContain('Expected 2 table row(s) but got 1');

    const tableAlignErrors = validateTokens(
      toSchema([{ type: 'table', align: ['left', 'right'] }]),
      toTokensList([baseTableToken])
    );
    expect(tableAlignErrors).toHaveLength(1);
    expect(tableAlignErrors[0].message).toMatch(/Table align .* does not match expected/);

    const headerErrors = validateTokens(
      toSchema([{ type: 'table', header: [{ text: 'h', header: false }] }]),
      toTokensList([baseTableToken])
    );
    expect(headerErrors).toHaveLength(1);
    expect(headerErrors[0].message).toContain("'table_cell' token has header true but expected false");

    const alignFieldErrors = validateTokens(
      toSchema([{ type: 'table', header: [{ text: 'h', align: 'right' }] }]),
      toTokensList([baseTableToken])
    );
    expect(alignFieldErrors).toHaveLength(1);
    expect(alignFieldErrors[0].message).toContain("'table_cell' token has align \"left\" but expected \"right\"");
  });

  it('fails when text token expects nested tokens but runtime has none', () => {
    const errors = validateTokens(
      toSchema([{ type: 'text', tokens: [{ type: 'text' }] }]),
      toTokensList([{ type: 'text', raw: 'x', text: 'x', escaped: false }])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Expected 1 token(s) but got 0');
  });

  it('throws a heading-specific message when depth does not match', () => {
    const errors = validateTokens(
      toSchema([{ type: 'heading', depth: 2 }]),
      toTokensList([{ type: 'heading', raw: '# t', depth: 1, text: 't', tokens: [] }])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Heading has depth 1 but expected 2 at line 1, column 1');
  });

  it('throws when an extension validator explicitly rejects a token', () => {
    const errors = validateTokens(
      toSchema([{ type: 'frontmatter', text: 'expected-text' }]),
      toTokensList([{ type: 'frontmatter', raw: '---\nactual\n---\n', text: 'actual-text' }]),
      [frontmatterExtension]
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });
});
