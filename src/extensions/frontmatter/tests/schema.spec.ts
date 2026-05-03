import { describe, expect, it } from 'vitest';
import validate from '../../../index';

describe('frontmatter extension schema validation', () => {
  it('rejects a frontmatter definition that mixes text and keys constraints', () => {
    expect(() => {
      validate(
        {
          type: 'ghf',
          extensions: ['frontmatter'],
          children: [{
            type: 'frontmatter',
            text: 'title: x',
            keys: [{ name: 'title', type: 'string', required: true }],
          }],
        },
        '---\ntitle: x\n---\n'
      );
    }).toThrow(/cannot define both 'text' and 'keys'/i);
  });

  it('rejects an invalid frontmatter key regex', () => {
    expect(() => {
      validate(
        {
          type: 'ghf',
          extensions: ['frontmatter'],
          children: [{
            type: 'frontmatter',
            keys: [{ name: 'slug', type: 'string', pattern: '[' }],
          }],
        },
        '---\nslug: x\n---\n'
      );
    }).toThrow(/valid regular expression/i);
  });
});
