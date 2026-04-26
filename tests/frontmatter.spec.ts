import { describe, expect, it } from 'vitest';
import validate from '../src';

describe('simple presents tests', () => {
  it('markdown should throw if it has a frontmatter but the schema does not expect it', () => {
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

  it('markdown should throw when a frontmatter is expected but not present', () => {
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
      expect(validate(schema, markdown)).toHaveLength(0);
    });
  });
});
