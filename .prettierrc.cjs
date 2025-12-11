module.exports = {
  tabWidth: 2,
  singleQuote: true,
  // to not break non-transpiled code
  trailingComma: 'es5',
  overrides: [
    {
      files: 'websrc/**/*.js',
      options: {
        trailingComma: 'all',
      },
    },
    {
      files: 'websrc/**/*.ts?(x)',

      options: {
        trailingComma: 'all',
        parser: 'typescript',
      },
    },
  ],
};
