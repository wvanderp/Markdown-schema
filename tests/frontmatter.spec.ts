import { describe, expect, it } from 'vitest';
import validate from '../src';

describe('simple presents tests', () => {
  it('markdown should fail validation if it has a frontmatter but the schema does not expect it', () => {
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

    expect(validate(schema, markdown)).toBe(false);
  });

  it('markdown should have a frontmatter if the schema expects it', () => {
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
    expect(validate(schema, markdown)).toBe(false);
  });

  describe('markdown should be valid if it has a frontmatter and the schema expects it', () => {
    it('markdown should be valid if it has a frontmatter and the schema expects it', () => {
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
      expect(validate(schema, markdown)).toBe(true);
    });
  });
});
