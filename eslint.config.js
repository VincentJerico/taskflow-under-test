import js from '@eslint/js';
import globals from 'globals';
import playwright from 'eslint-plugin-playwright';

/** Flat ESLint config (ESLint v9). */
export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, fetch: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },
  {
    files: ['tests/e2e/**'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^expect[A-Z]'] }],
      'no-restricted-properties': [
        'error',
        {
          object: 'test',
          property: 'fail',
          message:
            'test.fail absorbs unrelated failures; assert the current behavior and annotate the issue.',
        },
      ],
    },
  },
];
