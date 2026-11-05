import { build } from 'esbuild';
await build({ entryPoints: ['src/app.jsx'], bundle: true, minify: true, sourcemap: false, outfile: 'Asset/dist/app.js', loader: { '.jsx': 'jsx' }, jsx: 'automatic', target: ['es2020'], define: { 'process.env.NODE_ENV': '"production"' } });
console.log('Portfolio built: index.html + Asset/dist/app.js + Asset/dist/app.css');
