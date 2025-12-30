import { server } from '@duke-hq/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(...server, {
  ignores: ['.build/**', 'dist/**', 'node_modules/**'],
  linterOptions: {
    noInlineConfig: true,
  },
  rules: {
    '@typescript-eslint/consistent-type-assertions': [
      'warn',
      {
        assertionStyle: 'never',
      },
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    'no-unused-expressions': 'error',
  },
});
