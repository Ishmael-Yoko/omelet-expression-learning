const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'models/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['main.js', 'main/**/*.js', 'services/**/*.js', 'config/**/*.js', 'lib/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', 'preload.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        module: 'readonly',
        require: 'readonly',
        globalThis: 'readonly',
      },
    },
  },
];
