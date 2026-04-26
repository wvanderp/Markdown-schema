import { describe, expect, it } from 'vitest';
import validate from '../src/index';

describe('invalid', () => {
  describe('should throw an error when markdown is not a string', () => {
    it('should throw an error when markdown is an array', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate({}, []);
      }).toThrow('The markdown needs to be a string');
    });

    it('should throw an error when markdown is an object', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate({}, {});
      }).toThrow('The markdown needs to be a string');
    });

    it('should throw an error when markdown is a number', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate({}, 1);
      }).toThrow('The markdown needs to be a string');
    });

    it('should throw an error when markdown is a boolean', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate({}, true);
      }).toThrow('The markdown needs to be a string');
    });
  });

  describe('should throw an error when schema is not an object', () => {
    it('should throw an error when schema is an array', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate([], '');
      }).toThrow('The schema needs to be an object');
    });

    it('should throw an error when schema is a string', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate('', '');
      }).toThrow('The schema needs to be an object');
    });

    it('should throw an error when schema is a number', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate(1, '');
      }).toThrow('The schema needs to be an object');
    });

    it('should throw an error when schema is a boolean', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        validate(true, '');
      }).toThrow('The schema needs to be an object');
    });
  });

  describe('should throw an error when schema shape is invalid', () => {
    it('should throw when children is missing', () => {
      expect(() => {
        validate({ type: 'ghf' } as any, '');
      }).toThrow('The schema is invalid');
    });

    it('should throw when child type is missing', () => {
      expect(() => {
        validate({ type: 'ghf', children: [{}] } as any, '');
      }).toThrow('The schema is invalid');
    });
  });
});
