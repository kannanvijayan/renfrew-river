/* eslint-disable no-undef */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@stylistic/eol-last': ['error', 'always'],
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', '@stylistic', '@stylistic/ts'],
  root: true,
}
