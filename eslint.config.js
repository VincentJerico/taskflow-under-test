import js from '@eslint/js';
import globals from 'globals';

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
];
