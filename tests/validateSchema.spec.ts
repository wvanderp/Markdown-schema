import { describe, expect, it } from 'vitest';
import validateSchema from '../src/validateSchema';

describe('validateSchema invalid_type error messages', () => {
  describe('children field', () => {
    it('returns a children-specific message when children is a string', () => {
      expect(() => {
        validateSchema({ type: 'doc', children: 'not-an-array' });
      }).toThrow('Expected children to be an array, got string');
    });

    it('returns a children-specific message when children is a number', () => {
      expect(() => {
        validateSchema({ type: 'doc', children: 42 });
      }).toThrow('Expected children to be an array, got number');
    });

    it('returns a children-specific message when children is null', () => {
      expect(() => {
        validateSchema({ type: 'doc', children: null });
      }).toThrow('Expected children to be an array, got null');
    });
  });

  describe('extensions field', () => {
    it('returns an extensions-specific message when extensions is a string', () => {
      expect(() => {
        validateSchema({ type: 'doc', extensions: 'not-an-array', children: [] });
      }).toThrow('Expected extensions to be an array, got string');
    });

    it('returns an extension-name message when an extension element is not a string', () => {
      expect(() => {
        validateSchema({ type: 'doc', extensions: [123], children: [] });
      }).toThrow('Expected extension name to be a string, got number');
    });

    it('returns an extension-name message when an extension element is null', () => {
      expect(() => {
        validateSchema({ type: 'doc', extensions: [null], children: [] });
      }).toThrow('Expected extension name to be a string, got null');
    });
  });

  describe('other fields', () => {
    it('returns a generic invalid field message when type is not a string', () => {
      expect(() => {
        validateSchema({ type: 99, children: [] });
      }).toThrow('Invalid type: expected string, got number');
    });
  });
});
