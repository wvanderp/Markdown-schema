import neostandard from 'neostandard';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  ...neostandard({ ts: true, semi: true }),
  jsdoc.configs['flat/recommended-typescript'],
  {
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
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
      '@stylistic/space-before-function-paren': ['error', 'never'],
      'max-len': ['error', { code: 100, ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    },
  },
];
