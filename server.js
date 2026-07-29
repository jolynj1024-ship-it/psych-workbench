/* jolyn的工作台 - 后端服务（零依赖，纯 Node.js） */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3456;
const PUB = path.join(__dirname, 'public');
// 数据库文件路径：本地默认 db.json；云服务器上用挂载卷（如 DB_FILE=/data/db.json）保证重启不丢数据
const DBF = process.env.DB_FILE || path.join(__dirname, 'db.json');

const DEFAULT_DB = {
  sessions: {},
  records: [],   // 工作记录
  todos: [],     // 待办事项
  topics: [],    // 内容选题
  ideas: [],     // 灵感
  learnings: [], // 学习记录
  collabs: [],   // 协同项目
  scripts: [],   // 脚本
  workTypes: {
    '本职工作': ['危机干预管理', '跨部门协同', '心理咨询'],
    '副业': ['图文创作', '对谈长视频', '口播短视频']
  },
  archive: { records: [], todos: [] }
};

let db;
try {
  db = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DB)), JSON.parse(fs.readFileSync(DBF, 'utf8')));
} catch (e) {
  db = JSON.parse(JSON.stringify(DEFAULT_DB));
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(DBF, JSON.stringify(db, null, 2)); } catch (e) { console.error('save failed', e); }
  }, 80);
}

const COLS = ['records', 'todos', 'topics', 'ideas', 'learnings', 'collabs', 'scripts'];

function uid() { return Date.now().toString(36) + crypto.randomBytes(4).toString('hex'); }
const NO_CACHE = { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' };
function json(res, code, data) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, NO_CACHE));
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 5e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { resolve({}); } });
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

function serveStatic(req, res, p) {
  let fp = path.join(PUB, p === '/' ? 'index.html' : p);
  if (!fp.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(fp, (err, data) => {
    if (err) {
      // SPA 回退
      fs.readFile(path.join(PUB, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not Found'); }
        res.writeHead(200, Object.assign({ 'Content-Type': MIME['.html'] }, NO_CACHE));
        res.end(d2);
      });
      return;
    }
    res.writeHead(200, Object.assign({ 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }, NO_CACHE));
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(u.pathname);

  if (!p.startsWith('/api/')) return serveStatic(req, res, p);

  // 本工作台无需登录，打开链接即可使用；数据集中存储在服务端 db.json，访问同一地址即为同一份数据

  // ---------- 工作类型配置 ----------
  if (p === '/api/worktypes') {
    if (req.method === 'GET') return json(res, 200, db.workTypes);
    if (req.method === 'PUT') {
      const body = await readBody(req);
      if (body && typeof body === 'object') { db.workTypes = body; save(); }
      return json(res, 200, db.workTypes);
    }
  }

  // ---------- 全量同步（跨设备导出/导入） ----------
  if (p === '/api/sync') {
    if (req.method === 'GET') {
      const snap = { version: 1, exportedAt: new Date().toISOString(), workTypes: db.workTypes, archive: db.archive };
      COLS.forEach(c => { snap[c] = db[c]; });
      return json(res, 200, snap);
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      if (body && typeof body === 'object') {
        if (body.workTypes && typeof body.workTypes === 'object') db.workTypes = body.workTypes;
        COLS.forEach(c => { if (Array.isArray(body[c])) db[c] = body[c]; });
        if (body.archive && typeof body.archive === 'object') db.archive = body.archive;
        save();
      }
      return json(res, 200, { ok: true });
    }
  }

  // ---------- 归档 ----------
  if (p === '/api/archive') {
    if (req.method === 'GET') return json(res, 200, db.archive);
    if (req.method === 'POST') {
      const body = await readBody(req);
      const before = String(body.before || '');
      if (!before) return json(res, 400, { error: 'before required' });
      const keepR = [], moveR = [];
      db.records.forEach(r => (r.date < before ? moveR : keepR).push(r));
      const keepT = [], moveT = [];
      db.todos.forEach(t => (t.done ? moveT : keepT).push(t));
      db.records = keepR; db.todos = keepT;
      db.archive.records.push(...moveR);
      db.archive.todos.push(...moveT);
      save();
      return json(res, 200, { movedRecords: moveR.length, movedTodos: moveT.length });
    }
  }

  // ---------- 通用 CRUD：/api/<collection>[/<id>] ----------
  const m = p.match(/^\/api\/([a-z]+)(?:\/([\w]+))?$/);
  if (m && COLS.includes(m[1])) {
    const col = m[1], id = m[2];
    if (req.method === 'GET' && !id) return json(res, 200, db[col]);
    if (req.method === 'POST' && !id) {
      const body = await readBody(req);
      const item = Object.assign({}, body, { id: uid(), createdAt: new Date().toISOString() });
      db[col].unshift(item); save();
      return json(res, 200, item);
    }
    if (req.method === 'PUT' && id) {
      const idx = db[col].findIndex(x => x.id === id);
      if (idx < 0) return json(res, 404, { error: 'not found' });
      const body = await readBody(req);
      delete body.id; delete body.createdAt;
      db[col][idx] = Object.assign({}, db[col][idx], body, { updatedAt: new Date().toISOString() });
      save();
      return json(res, 200, db[col][idx]);
    }
    if (req.method === 'DELETE' && id) {
      const before = db[col].length;
      db[col] = db[col].filter(x => x.id !== id);
      save();
      return json(res, 200, { ok: db[col].length < before });
    }
  }

  json(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('jolyn的工作台 已启动:');
  console.log('  本机访问:  http://localhost:' + PORT);
  console.log('  手机访问:  请用同一 Wi-Fi，打开 http://<本机局域网IP>:' + PORT);
});
