import { describe, expect, it } from 'vitest';
import validate from '../src/index';

describe('invalid schemas', () => {
  describe('invalid root type field', () => {
    it('should throw a descriptive error when the root type is not a string', () => {
      expect(() => {
        validate(
          { type: 123, children: [] },
          'test'
        );
      }).toThrow(/Invalid type: expected string, got number/i);
    });
  });

  describe('invalid token types', () => {
    it('should throw an error for unknown token type', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'unknown_token' }],
          },
          'test'
        );
      }).toThrow(/Unknown token type|expected one of/);
    });

    it('should throw an error for empty string token type', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: '' }],
          },
          'test'
        );
      }).toThrow(/Unknown token type|expected one of/);
    });
  });

  describe('invalid token properties', () => {
    it('should throw an error for invalid heading depth', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'heading', depth: 'invalid' }],
          },
          '# test'
        );
      }).toThrow(/Invalid.*depth.*expected number/i);
    });

    it('should throw an error for invalid checkbox checked value', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'checkbox', checked: 'yes' }],
          },
          '- [x] task'
        );
      }).toThrow(/Invalid.*checked.*expected boolean/i);
    });

    it('should throw an error for invalid list ordered value', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'list', ordered: 'yes' }],
          },
          '- item'
        );
      }).toThrow(/Invalid.*ordered.*expected boolean/i);
    });

    it('should throw an error for invalid table align value', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'table', align: ['invalid'] }],
          },
          '| a |'
        );
      }).toThrow(/Invalid.*align.*expected one of/i);
    });
  });

  describe('nested invalid schemas', () => {
    it('should throw an error for invalid nested children', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [
              {
                type: 'paragraph',
                tokens: [{ type: 'invalid_nested' }],
              },
            ],
          },
          'test'
        );
      }).toThrow(/Unknown token type|expected one of/);
    });

    it('should throw an error for invalid table cell tokens', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [
              {
                type: 'table',
                header: [{ type: 'invalid_cell' }],
              },
            ],
          },
          '| a |'
        );
      }).toThrow(/Unexpected property|Unknown token type/);
    });
  });

  describe('extra properties not allowed', () => {
    it('should throw an error for extra properties on token', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'paragraph', extraProp: 'not allowed' }],
          },
          'test'
        );
      }).toThrow(/Unexpected property.*extraProp/i);
    });

    it('should throw an error for multiple extra properties on token', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'paragraph', extra1: 'a', extra2: 'b' }],
          },
          'test'
        );
      }).toThrow(/Unexpected properties.*extra/i);
    });

    it('should throw an error for extra properties on root schema', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [{ type: 'paragraph' }],
            extraProp: 'not allowed',
          },
          'test'
        );
      }).toThrow(/Unexpected property.*extraProp/i);
    });

    it('should throw an error for multiple extra properties on root schema', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [],
            extra1: 'a',
            extra2: 'b',
          },
          'test'
        );
      }).toThrow(/Unexpected properties.*extra/i);
    });
  });

  describe('invalid children array', () => {
    it('should throw an error for non-array children', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: 'not an array',
          },
          'test'
        );
      }).toThrow(/Expected children to be an array|Expected array/i);
    });

    it('should throw an error for null children', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: null,
          },
          'test'
        );
      }).toThrow(/Expected children to be an array|Expected array/i);
    });

    it('should accept empty children array', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            children: [],
          },
          'test'
        );
      }).not.toThrow();
    });
  });

  describe('invalid extensions', () => {
    it('should throw an error for non-array extensions', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            extensions: 'not-an-array',
            children: [{ type: 'paragraph' }],
          },
          'test'
        );
      }).toThrow(/Expected extensions to be an array|Expected array/i);
    });

    it('should throw an error for extensions with non-string values', () => {
      expect(() => {
        validate(
          {
            type: 'ghf',
            extensions: [123],
            children: [{ type: 'paragraph' }],
          },
          'test'
        );
      }).toThrow(/Expected extension name to be a string|expected string/i);
    });
  });
});
