import globals from 'globals';

export default [
  // Server-side Node.js files use CommonJS
  { 
    files: ['**/*.js', '!client/**/*.js'], 
    languageOptions: { 
      sourceType: 'commonjs',
      globals: globals.node 
    } 
  },
  // Client-side React files use ES modules
  { 
    files: ['client/**/*.js', 'client/**/*.jsx'], 
    languageOptions: { 
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    } 
  }
];
