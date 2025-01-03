import next from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname
      }
    },
    ignores: [
      '**/*.config.js',
      '**/*.config.mjs',
      'tailwind.config.js',
      'postcss.config.js',
      'postcss.config.mjs',
      'next.config.js'
    ],
    plugins: {
      '@next/next': next,
      'unused-imports': unusedImports,
      'react-hooks': reactHooks,
      react: react,
      '@typescript-eslint': typescriptEslint,
      '@typescript-eslint/eslint-plugin': typescriptEslint
    },
    rules: {
      ...next.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-typos': 'error',
      'unused-imports/no-unused-imports': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/jsx-key': 'error',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  prettier,
];
