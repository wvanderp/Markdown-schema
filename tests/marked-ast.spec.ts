import { describe, expect, it } from 'vitest';
import validate from '../src';

describe('marked ast integration', () => {
  it('validates list items with nested tokens', () => {
    const markdown = '- [x] task\n- item';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          items: [
            {
              type: 'list_item',
              task: true,
              checked: true,
              tokens: [
                { type: 'checkbox', checked: true },
                { type: 'text' },
              ],
            },
            {
              type: 'list_item',
              task: false,
              tokens: [{ type: 'text' }],
            },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(true);
  });

  it('validates table cells with nested text tokens', () => {
    const markdown = '|h1|h2|\n|:-|:-:|\n|a|b|';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'table',
          align: ['left', 'center'],
          header: [
            { text: 'h1', header: true, align: 'left', tokens: [{ type: 'text', text: 'h1' }] },
            { text: 'h2', header: true, align: 'center', tokens: [{ type: 'text', text: 'h2' }] },
          ],
          rows: [
            [
              { text: 'a', header: false, align: 'left', tokens: [{ type: 'text', text: 'a' }] },
              { text: 'b', header: false, align: 'center', tokens: [{ type: 'text', text: 'b' }] },
            ],
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(true);
  });

  it('supports full frontmatter and mixed token validation with vague constraints', () => {
    const markdown = '---\ntitle: demo\n---\n## H\n\nline one  \nline two';

    const schema = {
      type: 'root',
      extensions: ['frontmatter'],
      children: [
        { type: 'frontmatter' },
        { type: 'heading', depth: 2, tokens: [{ type: 'text' }] },
        {
          type: 'paragraph',
          tokens: [
            { type: 'text' },
            { type: 'br' },
            { type: 'text' },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(true);
  });
});
