const typescriptLib = require('typescript');
const typescript = require('rollup-plugin-typescript2');
const json = require('rollup-plugin-json');
const pkg = require('./package.json');

module.exports = {
  input: './src/index.ts',
  plugins: [
    json(),
    typescript({
      exclude: [
        '**/tests/**',
      ],
      typescript: typescriptLib,
    }),
  ],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
};
