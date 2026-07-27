/* 本地构建脚本：用 Babel 把 js/*.jsx 预编译成 js/*.js（去除浏览器内 Babel 依赖） */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const Babel = require('./babel.standalone.min.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JS_DIR = path.join(__dirname, '..', 'public', 'js');
const OUT_DIR = path.join(__dirname, '..', 'public', 'dist3');
try { fs.mkdirSync(OUT_DIR, { recursive: true }); } catch (e) {}
const FILES = [
  'core', 'dashboard', 'workboard', 'todos', 'content',
  'ideas', 'learning', 'settings', 'app'
];

let ok = 0, fail = 0;
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of FILES) {
  const src = path.join(JS_DIR, f + '.jsx');
  const out = path.join(OUT_DIR, f + '.js');
  try {
    const code = fs.readFileSync(src, 'utf8');
    const res = Babel.transform(code, { presets: ['react'], filename: f + '.jsx' });
    fs.writeFileSync(out, res.code, 'utf8');
    ok++;
    console.log('compiled', f + '.jsx');
  } catch (e) {
    fail++;
    console.error('FAILED', f + '.jsx', e.message);
  }
}
console.log(`\n==> JSX 编译完成：${ok} 成功 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
