import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.ts',
  external: ['html2canvas', 'jspdf', 'html-docx-js-typescript', 'file-saver'], // 将 html2canvas 标记为外部依赖
  output: [
    {
      file: 'dist/html2Image-pdf-word.cjs.js',
      format: 'cjs',
      exports: 'named'
    },
    {
      file: 'dist/html2Image-pdf-word.esm.js',
      format: 'esm'
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env']
    })
  ]
};