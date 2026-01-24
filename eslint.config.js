import eslintConfig from '@stheine/helpers/eslint.config';

export default [
  ...eslintConfig,
  {
    rules: {
      'linebreak-style': 0,
      'sort-imports': 0,
      'space-before-function-paren': 0,
      'object-shorthand': 0,
      'unicorn/no-lonely-if': 0,
      'unicorn/consistent-destructuring': 0,
      'default-param-last': 0,
      'prefer-template': 0,
      'unicorn/consistent-function-scoping': 0,
      'no-underscore-dangle': 0,
      'max-len': 0,
      'no-param-reassign': 0,
      'unicorn/prefer-at': 0,
      camelcase: 0,
      'no-lonely-if': 0,
    },
  },
];
