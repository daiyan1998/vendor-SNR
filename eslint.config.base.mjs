// Shared ESLint flat-config base, imported and extended by each app's own
// eslint.config.{js,mjs}. Kept framework-agnostic on purpose: Nest- and
// Next-specific rules belong in the app-level config, not here.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['**/dist/**', '**/.next/**', '**/coverage/**', '**/node_modules/**'],
  },
);

export default baseConfig;
