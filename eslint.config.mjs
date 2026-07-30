import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Next.js requires default exports for route files; everywhere else the code
 * standard is named exports only (CLAUDE.md "Code standards").
 */
const nextDefaultExportFiles = [
  'apps/web/**/app/**/page.tsx',
  'apps/web/**/app/**/layout.tsx',
  'apps/web/**/app/**/route.ts',
  'apps/web/**/app/**/error.tsx',
  'apps/web/**/app/**/loading.tsx',
  'apps/web/**/app/**/not-found.tsx',
  'apps/web/**/app/**/template.tsx',
  'apps/web/**/app/**/default.tsx',
  'apps/web/**/app/**/global-error.tsx',
  'apps/web/**/middleware.ts',
  '**/next.config.ts',
  '**/drizzle.config.ts',
  'eslint.config.mjs',
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
      'output/**',
      '**/next-env.d.ts',
    ],
  },

  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,

  {
    files: ['**/*.{ts,tsx,mts,cts,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-nested-ternary': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],

      'no-restricted-exports': [
        'error',
        { restrictDefaultExports: { direct: true, named: true } },
      ],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message:
            'Do not use enums. Use `as const` + a union type + Record — see ' +
            'JOB_STATUSES in packages/db/src/constants.ts.',
        },
      ],
    },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    files: nextDefaultExportFiles,
    rules: { 'no-restricted-exports': 'off' },
  },

  // Must stay last.
  prettier
);
