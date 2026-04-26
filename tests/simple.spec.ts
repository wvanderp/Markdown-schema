import { describe, expect, it } from 'vitest';
import validate from '../src/index';

describe('simple cases', () => {
  it('simple case', () => {
    const markdown = 'hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'paragraph',
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(true);
  });

  it('should throw when the schema does not match', () => {
    const markdown = '# hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'paragraph',
        },
      ],
    };

    expect(() => validate(schema, markdown)).toThrow("Expected a 'paragraph' token but got 'heading'");
  });

  it('should handle multiple definitions', () => {
    const markdown = '# hallo world\n## hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'heading',
        },
        {
          type: 'heading',
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(true);
  });

  it('should throw when the schema does not match', () => {
    const markdown = '# hallo world\n\n hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'heading',
        },
        {
          type: 'heading',
        },
      ],
    };

    expect(() => validate(schema, markdown)).toThrow("Expected a 'heading' token but got 'paragraph'");
  });

  it('should return true if the schema matches with multiple children', () => {
    const markdown = '# hallo world\n\n hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'heading',
        },
        {
          type: 'paragraph',
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(true);
  });

  it('should throw when there are more definitions than tokens', () => {
    const markdown = '# hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'heading',
        },
        {
          type: 'paragraph',
        },
      ],
    };

    expect(() => validate(schema, markdown)).toThrow('Expected 2 token(s) but got 1');
  });

  it('should throw when there are more tokens than definitions', () => {
    const markdown = '# hallo world\n\n hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'heading',
        },
      ],
    };

    expect(() => validate(schema, markdown)).toThrow('Expected 1 token(s) but got 2');
  });
});
