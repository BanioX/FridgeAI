// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      '**/playwright-report/',
      '**/test-results/',
      '**/dev-dist/',
      '.claude/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    // packages/core must stay free of browser and Node APIs (see CLAUDE.md).
    files: ['packages/core/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'indexedDB',
        'fetch',
        'navigator',
        'process',
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    // Three layers (ADR-0034): the presentation talks to the logic only through the contract;
    // storage (src/data, Dexie) stays behind it. Tests may set up data directly.
    files: ['apps/web/src/features/**/*.{ts,tsx}', 'apps/web/src/ui/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'dexie', message: 'Storage belongs to the data layer (ADR-0034).' }],
          patterns: [
            {
              group: ['**/data/*', '!**/data/test-helpers'],
              message: 'Use the contract via useAppData(), not the data layer (ADR-0034).',
            },
          ],
        },
      ],
    },
  },
  {
    // The logic layer knows neither the UI nor a database (ADR-0034).
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom', 'dexie', 'dexie-react-hooks'],
          patterns: [
            { group: ['**/apps/**'], message: 'packages/core must not depend on apps (ADR-0034).' },
          ],
        },
      ],
    },
  },
  {
    // The data layer serves the logic and never reaches up into the presentation (ADR-0034).
    files: ['apps/web/src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/*', '**/ui/*'],
              message: 'The data layer must not import the UI (ADR-0034).',
            },
          ],
        },
      ],
    },
  },
  {
    // Axe waits for transitions to end before it measures colours (L-19).
    files: ['apps/web/e2e/**/*.ts'],
    ignores: ['apps/web/e2e/test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@axe-core/playwright',
              message: "Import AxeBuilder from './test': it waits until animations have ended.",
            },
          ],
        },
      ],
    },
  },
);
