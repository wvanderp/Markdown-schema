import neostandard from 'neostandard';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  ...neostandard({ ts: true, semi: true }),
  jsdoc.configs['flat/recommended-typescript'],
  {
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      'jsdoc/require-description': 'error',
      // Enforce no space before function paren
      '@stylistic/space-before-function-paren': ['error', 'never'],
    },
  },
];
