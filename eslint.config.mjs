import next from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

export default [
  {
    plugins: {
      '@next/next': next,
      'unused-imports': unusedImports,
      'react-hooks': reactHooks,
      react: react,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      'unused-imports/no-unused-imports': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/jsx-key': 'error',
    },
  },
  prettier,
];
