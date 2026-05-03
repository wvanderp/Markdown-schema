import { describe, expect, it } from 'vitest';
import validate from '../../../index';

describe('frontmatter extension integration', () => {
  it('fails when markdown contains frontmatter the schema does not expect', () => {
    const markdown = `---
title: hallo world
---
# hallo world
`;

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'heading',
        },
      ],
    };

    const errors = validate(schema, markdown);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Expected 1 token(s) but got 2');
  });

  it('fails when the schema expects frontmatter but the markdown does not have it', () => {
    const markdown = '# hallo world';

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'frontmatter',
        },
        {
          type: 'heading',
        },
      ],
    };

    const errors = validate(schema, markdown);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Expected 2 token(s) but got 1');
  });

  it('accepts matching frontmatter and heading tokens', () => {
    const markdown = `---
title: hallo world
---
# hallo world
`;

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'frontmatter',
        },
        {
          type: 'heading',
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('validates required keys and supported key types', () => {
    const markdown = `---
title: hallo world
year: 2026
published: true
tags:
  - docs
  - release
---
# hallo world
`;

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'frontmatter',
          keys: [
            { name: 'title', type: 'string', required: true },
            { name: 'year', type: 'number', required: true },
            { name: 'published', type: 'boolean', required: true },
            { name: 'tags', type: 'array', required: false },
          ],
        },
        {
          type: 'heading',
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);
  });

  it('rejects frontmatter when a required key is missing', () => {
    const markdown = `---
title: hallo world
---
# hallo world
`;

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'frontmatter',
          keys: [
            { name: 'title', type: 'string', required: true },
            { name: 'year', type: 'number', required: true },
          ],
        },
        {
          type: 'heading',
        },
      ],
    };

    const errors = validate(schema, markdown);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('rejects frontmatter when a key type does not match', () => {
    const markdown = `---
title: hallo world
year: "2026"
---
# hallo world
`;

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'frontmatter',
          keys: [
            { name: 'title', type: 'string', required: true },
            { name: 'year', type: 'number', required: true },
          ],
        },
        {
          type: 'heading',
        },
      ],
    };

    const errors = validate(schema, markdown);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('applies regex constraints to frontmatter key values', () => {
    const markdown = `---
slug: release-note
---
# hallo world
`;

    const schema = {
      type: 'ghf',
      extensions: ['frontmatter'],
      children: [
        {
          type: 'frontmatter',
          keys: [
            {
              name: 'slug',
              type: 'string',
              required: true,
              pattern: '[a-z]+-[a-z]+',
            },
          ],
        },
        {
          type: 'heading',
        },
      ],
    };

    expect(validate(schema, markdown)).toHaveLength(0);

    const invalidMarkdown = `---
slug: Release-Note
---
# hallo world
`;

    const errors = validate(schema, invalidMarkdown);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Extension validator rejected 'frontmatter' token");
  });

  it('supports mixed frontmatter and core token validation', () => {
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

    expect(validate(schema, markdown)).toHaveLength(0);
  });
});
