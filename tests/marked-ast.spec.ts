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

    expect(validate(schema, markdown)).toHaveLength(0);
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

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates blockquote token with nested paragraph', () => {
    const markdown = '> quoted text';

    const schema = {
      type: 'root',
      children: [
        { type: 'blockquote', text: 'quoted text', tokens: [{ type: 'paragraph' }] },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates fenced code block token', () => {
    const markdown = '```js\nconst x = 1;\n```';

    const schema = {
      type: 'root',
      children: [
        { type: 'code', lang: 'js', text: 'const x = 1;' },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates indented code block token', () => {
    const markdown = '    hello code';

    const schema = {
      type: 'root',
      children: [
        { type: 'code', codeBlockStyle: 'indented', text: 'hello code' },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates codespan token inside paragraph', () => {
    const markdown = 'use `console.log`';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'text' },
            { type: 'codespan', text: 'console.log' },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates def token', () => {
    const markdown = '[ref]: https://x "t"';

    const schema = {
      type: 'root',
      children: [
        { type: 'def', tag: 'ref', href: 'https://x', title: 't' },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates del token inside paragraph', () => {
    const markdown = '~~strike~~';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'del', text: 'strike', tokens: [{ type: 'text' }] },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates em token inside paragraph', () => {
    const markdown = '*emphasis*';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'em', text: 'emphasis', tokens: [{ type: 'text' }] },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates escape token inside paragraph', () => {
    const markdown = '\\*';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'escape', text: '*' },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates hr token', () => {
    const markdown = '---';

    const schema = {
      type: 'root',
      children: [
        { type: 'hr' },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates html block token', () => {
    const markdown = '<div>content</div>\n';

    const schema = {
      type: 'root',
      children: [
        { type: 'html', pre: false },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates image token inside paragraph', () => {
    const markdown = '![alt text](https://example.com/img.png)';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'image', href: 'https://example.com/img.png', title: null, text: 'alt text' },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates link token inside paragraph', () => {
    const markdown = '[click here](https://example.com)';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'link', href: 'https://example.com', title: null, text: 'click here', tokens: [{ type: 'text' }] },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates space token between block elements', () => {
    const markdown = '# heading one\n\n# heading two';

    const schema = {
      type: 'root',
      children: [
        { type: 'heading', depth: 1 },
        { type: 'space' },
        { type: 'heading', depth: 1 },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates strong token inside paragraph', () => {
    const markdown = '**bold text**';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          tokens: [
            { type: 'strong', text: 'bold text', tokens: [{ type: 'text' }] },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates text token inside paragraph', () => {
    const markdown = 'plain text content';

    const schema = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          text: 'plain text content',
          tokens: [
            { type: 'text', text: 'plain text content' },
          ],
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });
});
