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

  it('should return false if the schema does not match', () => {
    const markdown = '# hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'paragraph',
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(false);
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

  it('should return false if the schema does not match', () => {
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

    expect(validate(schema, markdown)).toBe(false);
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

  it('should return false when there are more definitions than tokens', () => {
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

    expect(validate(schema, markdown)).toBe(false);
  });

  it('should return false when there are more tokens than definitions', () => {
    const markdown = '# hallo world\n\n hallo world';

    const schema = {
      type: 'ghf',
      children: [
        {
          type: 'heading',
        },
      ],
    };

    expect(validate(schema, markdown)).toBe(false);
  });
});
