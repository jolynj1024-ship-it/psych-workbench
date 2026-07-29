/* 核心工具与通用组件 */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------------- 数据存储（双模式：服务端优先 + localStorage 降级） ----------------
const LS_PREFIX = 'pw_';
const COLS = ['records', 'todos', 'topics', 'ideas', 'learnings', 'collabs', 'scripts', 'checkins'];
const DEFAULT_WORKTYPES = { '本职工作': ['危机干预管理', '跨部门协同', '心理咨询'], '副业': ['图文创作', '对谈长视频', '口播短视频'] };

let serverOk = null; // null=未检测, true=可用, false=不可用

function lsKey(col) { return LS_PREFIX + col; }
function lsGet(col) { try { return JSON.parse(localStorage.getItem(lsKey(col))) || []; } catch(e) { return []; } }
function lsSet(col, data) { try { localStorage.setItem(lsKey(col), JSON.stringify(data)); } catch(e) {} }
function lsGetWT() { try { return JSON.parse(localStorage.getItem(LS_PREFIX + 'worktypes')) || DEFAULT_WORKTYPES; } catch(e) { return DEFAULT_WORKTYPES; } }
function lsSetWT(data) { try { localStorage.setItem(LS_PREFIX + 'worktypes', JSON.stringify(data)); } catch(e) {} }

// 检测服务端是否可用（静默，不抛错）
async function checkServer() {
  if (serverOk !== null) return serverOk;
  try {
    const r = await fetch('/api/worktypes', { method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000) });
    serverOk = r.ok;
  } catch(e) {
    serverOk = false;
  }
  return serverOk;
}

// ---------------- GitHub 云端同步（最高优先级数据源） ----------------
const GH_PREFIX = 'pw_gh_';
function ghConf() {
  return {
    enabled: localStorage.getItem(GH_PREFIX + 'enabled') === '1',
    token: (localStorage.getItem(GH_PREFIX + 'token') || '').trim(),
    repo: (localStorage.getItem(GH_PREFIX + 'repo') || '').trim(),
    branch: (localStorage.getItem(GH_PREFIX + 'branch') || 'main').trim() || 'main',
    path: (localStorage.getItem(GH_PREFIX + 'path') || 'data.json').trim() || 'data.json',
    sha: localStorage.getItem(GH_PREFIX + 'sha') || ''
  };
}
function ghSetSha(s) { if (s) localStorage.setItem(GH_PREFIX + 'sha', s); }
function ghSetLast() { localStorage.setItem(GH_PREFIX + 'last', new Date().toISOString()); }
function ghApiUrl(conf) { return 'https://api.github.com/repos/' + conf.repo + '/contents/' + conf.path; }
function ghHeaders(conf, extra) {
  return Object.assign({ 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + conf.token, 'X-GitHub-Api-Version': '2022-11-28' }, extra || {});
}
function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64dec(b64) { return decodeURIComponent(escape(atob(String(b64).replace(/\s/g, '')))); }
function ghDefaults() {
  return { version: 1, workTypes: DEFAULT_WORKTYPES, records: [], todos: [], topics: [], ideas: [], learnings: [], collabs: [], scripts: [], archive: { records: [], todos: [] } };
}
function ghNormalize(d) {
  const base = ghDefaults();
  if (!d || typeof d !== 'object') return base;
  if (d.workTypes && typeof d.workTypes === 'object') base.workTypes = d.workTypes;
  COLS.forEach(c => { base[c] = Array.isArray(d[c]) ? d[c] : []; });
  if (d.archive && typeof d.archive === 'object') {
    base.archive = { records: Array.isArray(d.archive.records) ? d.archive.records : [], todos: Array.isArray(d.archive.todos) ? d.archive.todos : [] };
  }
  return base;
}
function ghMirror(data) {
  try {
    if (data.workTypes) lsSetWT(data.workTypes);
    COLS.forEach(c => { if (Array.isArray(data[c])) lsSet(c, data[c]); });
    if (data.archive) localStorage.setItem(LS_PREFIX + 'archive', JSON.stringify(data.archive));
  } catch (e) {}
}
function localSnapshot() {
  const d = { version: 1, workTypes: lsGetWT() };
  COLS.forEach(c => d[c] = lsGet(c));
  d.archive = JSON.parse(localStorage.getItem(LS_PREFIX + 'archive') || '{"records":[],"todos":[]}');
  return d;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function byTs(x) { return x && (x.updatedAt || x.createdAt || ''); }
function unionById(a, b) {
  const map = new Map();
  a.concat(b).forEach(x => { if (x && x.id) { const p = map.get(x.id); if (!p || byTs(x) > byTs(p)) map.set(x.id, x); } });
  return Array.from(map.values());
}
function ghMerge(local, remote) {
  const out = ghNormalize(local);
  COLS.forEach(c => { out[c] = unionById(local[c] || [], remote[c] || []); });
  out.archive = {
    records: unionById((local.archive && local.archive.records) || [], (remote.archive && remote.archive.records) || []),
    todos: unionById((local.archive && local.archive.todos) || [], (remote.archive && local.archive && remote.archive.todos) || [])
  };
  out.workTypes = Object.assign({}, remote.workTypes || {}, local.workTypes || {});
  return out;
}

let ghCache = null, ghCacheSha = null, ghLoading = null, ghPushChain = Promise.resolve();

async function ghFetch() {
  const conf = ghConf();
  if (!conf.token || !conf.repo) throw new Error('GitHub 未配置');
  const res = await fetch(ghApiUrl(conf) + '?ref=' + conf.branch, { headers: ghHeaders(conf), signal: AbortSignal.timeout(8000) });
  if (res.status === 404) { ghCache = ghNormalize(null); ghCacheSha = ''; ghSetLast(); return ghCache; }
  if (!res.ok) throw new Error('GitHub 读取失败 (' + res.status + ')');
  const j = await res.json();
  ghCache = ghNormalize(JSON.parse(b64dec(j.content)));
  ghCacheSha = j.sha; ghSetSha(j.sha); ghMirror(ghCache); ghSetLast();
  return ghCache;
}
function ghEnsure() { if (!ghLoading) ghLoading = ghFetch().catch(e => { ghLoading = null; throw e; }); return ghLoading; }

async function ghPush() {
  const conf = ghConf();
  if (!conf.token || !conf.repo) throw new Error('GitHub 未配置');
  const content = b64enc(JSON.stringify(ghCache));
  const put = async (sha) => {
    const body = { message: '🧠 工作台数据更新 ' + new Date().toISOString(), content, branch: conf.branch };
    if (sha) body.sha = sha;
    const r = await fetch(ghApiUrl(conf), { method: 'PUT', headers: ghHeaders(conf, { 'Content-Type': 'application/json' }), body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    if (r.ok) { const j = await r.json(); ghCacheSha = j.content.sha; ghSetSha(j.content.sha); ghSetLast(); return true; }
    return r;
  };
  ghPushChain = ghPushChain.then(async () => {
    for (let i = 0; i < 4; i++) {
      const r = await put(ghCacheSha || undefined);
      if (r === true) { ghMirror(ghCache); return; }
      if (r && r.status === 409) { // 冲突：合并远端后再提交
        const j = await (await fetch(ghApiUrl(conf) + '?ref=' + conf.branch, { headers: ghHeaders(conf), signal: AbortSignal.timeout(8000) })).json();
        ghCache = ghMerge(ghCache, ghNormalize(JSON.parse(b64dec(j.content))));
        ghCacheSha = j.sha; ghSetSha(j.sha); ghMirror(ghCache);
        continue;
      }
      if (r && r.status === 404) { ghCacheSha = ''; continue; } // 远端被删，重建
      throw new Error('GitHub 写入失败 (' + (r && r.status) + ')');
    }
    throw new Error('GitHub 同步重试失败');
  });
  return ghPushChain;
}

async function ghApi(path, method, body) {
  await ghEnsure();
  const m = path.match(/^\/([a-z]+)(?:\/([\w]+))?$/);
  const col = m && m[1], id = m && m[2];
  if (path === '/sync' && method === 'GET') return JSON.parse(JSON.stringify(ghCache));
  if (path === '/sync' && method === 'POST') { ghCache = ghNormalize(body); await ghPush(); return { ok: true }; }
  if (col === 'worktypes') {
    if (method === 'GET') return ghCache.workTypes;
    if (method === 'PUT') { ghCache.workTypes = body || DEFAULT_WORKTYPES; await ghPush(); return ghCache.workTypes; }
  }
  if (col === 'archive') {
    if (method === 'GET') return ghCache.archive || { records: [], todos: [] };
    if (method === 'POST') {
      const before = String((body && body.before) || '');
      const recs = ghCache.records || [];
      const moveR = before ? recs.filter(r => (r.date || '') < before) : [];
      const keepR = before ? recs.filter(r => (r.date || '') >= before) : recs;
      const todos = ghCache.todos || [];
      const moveT = todos.filter(t => t.done), keepT = todos.filter(t => !t.done);
      ghCache.archive = ghCache.archive || { records: [], todos: [] };
      ghCache.archive.records = moveR.concat(ghCache.archive.records || []);
      ghCache.archive.todos = moveT.concat(ghCache.archive.todos || []);
      ghCache.records = keepR; ghCache.todos = keepT;
      await ghPush();
      return { movedRecords: moveR.length, movedTodos: moveT.length };
    }
  }
  if (COLS.includes(col)) {
    if (method === 'GET' && !id) return ghCache[col] || [];
    if (method === 'GET' && id) return (ghCache[col] || []).find(x => x.id === id);
    if (method === 'POST' && !id) {
      const item = Object.assign({}, body, { id: uid(), createdAt: new Date().toISOString() });
      ghCache[col] = ghCache[col] || []; ghCache[col].unshift(item); await ghPush(); return item;
    }
    if (method === 'PUT' && id) {
      const arr = ghCache[col] || []; const idx = arr.findIndex(x => x.id === id);
      if (idx < 0) throw new Error('未找到记录');
      delete body.id; delete body.createdAt;
      arr[idx] = Object.assign({}, arr[idx], body, { updatedAt: new Date().toISOString() });
      await ghPush(); return arr[idx];
    }
    if (method === 'DELETE' && id) {
      const before = (ghCache[col] || []).length;
      ghCache[col] = (ghCache[col] || []).filter(x => x.id !== id);
      await ghPush(); return { ok: (ghCache[col] || []).length < before };
    }
  }
  throw new Error('不支持的操作: ' + path);
}

// 后台轮询：检测其他设备的修改并自动刷新
function startGhPoller() {
  if (window.__ghPoller) return; window.__ghPoller = true;
  setInterval(async () => {
    const conf = ghConf();
    if (!(conf.enabled && conf.token && conf.repo) || !ghCache || ghLoading) return;
    try {
      const res = await fetch(ghApiUrl(conf) + '?ref=' + conf.branch, { headers: ghHeaders(conf), signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const j = await res.json();
      if (j.sha !== ghCacheSha) {
        ghCache = ghNormalize(JSON.parse(b64dec(j.content)));
        ghCacheSha = j.sha; ghSetSha(j.sha); ghMirror(ghCache); ghSetLast();
        window.dispatchEvent(new CustomEvent('pw-remote-update', { detail: { sha: j.sha } }));
      }
    } catch (e) {}
  }, 20000);
}
startGhPoller();

// ---------------- 统一 API 调度：GitHub > 服务端 > localStorage ----------------
function localApi(path, method, body) {
  if (path === '/sync' && method === 'GET') {
    const data = { version: 1, workTypes: lsGetWT() };
    COLS.forEach(c => { data[c] = lsGet(c); });
    data.archive = JSON.parse(localStorage.getItem(LS_PREFIX + 'archive') || '{"records":[],"todos":[]}');
    return data;
  }
  if (path === '/sync' && method === 'POST') {
    if (body && body.workTypes) lsSetWT(body.workTypes);
    COLS.forEach(c => { if (body && Array.isArray(body[c])) lsSet(c, body[c]); });
    if (body && body.archive) localStorage.setItem(LS_PREFIX + 'archive', JSON.stringify(body.archive));
    return { ok: true };
  }
  const colMatch = path.match(/^\/([a-z]+)(?:\/([\w]+))?$/);
  if (!colMatch) throw new Error('离线模式不支持此操作');
  const col = colMatch[1], id = colMatch[2];
  if (!COLS.includes(col) && col !== 'worktypes' && col !== 'archive') throw new Error('未知数据类型');
  if (col === 'worktypes') {
    if (method === 'GET') return lsGetWT();
    if (method === 'PUT') { lsSetWT(body); return body; }
  }
  if (col === 'archive') {
    if (method === 'GET') return JSON.parse(localStorage.getItem(LS_PREFIX + 'archive') || '{"records":[],"todos":[]}');
    if (method === 'POST') {
      const before = String((body && body.before) || '');
      const recs = lsGet('records'); const moveR = before ? recs.filter(r => (r.date || '') < before) : []; const keepR = before ? recs.filter(r => (r.date || '') >= before) : recs;
      const todos = lsGet('todos'); const moveT = todos.filter(t => t.done), keepT = todos.filter(t => !t.done);
      const arch = JSON.parse(localStorage.getItem(LS_PREFIX + 'archive') || '{"records":[],"todos":[]}');
      arch.records = moveR.concat(arch.records || []); arch.todos = moveT.concat(arch.todos || []);
      localStorage.setItem(LS_PREFIX + 'archive', JSON.stringify(arch));
      lsSet('records', keepR); lsSet('todos', keepT);
      return { movedRecords: moveR.length, movedTodos: moveT.length };
    }
  }
  let data = lsGet(col);
  if (method === 'GET' && !id) return data;
  if (method === 'POST' && !id) {
    const item = Object.assign({}, body, { id: uid(), createdAt: new Date().toISOString() });
    data.unshift(item); lsSet(col, data);
    return item;
  }
  if (method === 'PUT' && id) {
    const idx = data.findIndex(x => x.id === id); if (idx < 0) throw new Error('未找到记录');
    delete body.id; delete body.createdAt;
    data[idx] = Object.assign({}, data[idx], body, { updatedAt: new Date().toISOString() });
    lsSet(col, data); return data[idx];
  }
  if (method === 'DELETE' && id) {
    const before = data.length; data = data.filter(x => x.id !== id); lsSet(col, data);
    return { ok: data.length < before };
  }
  throw new Error('不支持的操作');
}

window.API = async function (path, method = 'GET', body) {
  const conf = ghConf();
  if (conf.enabled && conf.token && conf.repo) {
    try { return await ghApi(path, method, body); }
    catch (e) {
      if (method === 'GET') return await localApi(path, method, body); // 离线降级：读本地镜像
      throw e;
    }
  }
  const online = await checkServer();
  if (online) {
    try {
      const opt = { method, headers: { 'Content-Type': 'application/json' } };
      if (body !== undefined) opt.body = JSON.stringify(body);
      const r = await fetch('/api' + path, opt);
      if (!r.ok) throw new Error('请求失败 (' + r.status + ')');
      return await r.json();
    } catch (e) { serverOk = false; }
  }
  return await localApi(path, method, body);
};

// 暴露云端同步控制给设置页
window.GHSync = {
  async test() { const c = ghConf(); if (!c.token || !c.repo) throw new Error('请先填写仓库与令牌'); ghLoading = null; ghCache = null; ghCacheSha = null; await ghEnsure(); return ghCache; },
  async uploadLocal() { const c = ghConf(); if (!c.token || !c.repo) throw new Error('请先配置 GitHub'); ghCache = ghNormalize(localSnapshot()); ghCacheSha = c.sha || ''; await ghPush(); return true; },
  isConfigured() { const c = ghConf(); return c.enabled && !!c.token && !!c.repo; },
  lastSync() { return localStorage.getItem(GH_PREFIX + 'last') || ''; }
};

// ---------------- 数据导出 / 导入（用于跨设备同步，统一走 /sync 通道） ----------------
window.exportData = async function() {
  // 从当前生效的数据源（服务端或本地）全量读取
  const data = await API('/sync', 'GET');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = '心理工作台数据_' + today() + '.json'; a.click(); URL.revokeObjectURL(url);
  toast('数据文件已导出', 'success');
  return data;
};

window.importData = async function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await API('/sync', 'POST', data);
        toast('数据导入成功，请刷新页面', 'success');
        resolve(data);
      } catch(err) { toast('导入失败：' + err.message, 'error'); reject(err); }
    };
    reader.onerror = () => { toast('文件读取失败', 'error'); reject(new Error('read error')); };
    reader.readAsText(file);
  });
};

// ---------------- Toast ----------------
window.toast = function (msg, type = 'success') {
  window.dispatchEvent(new CustomEvent('pw-toast', { detail: { msg, type, id: Date.now() + Math.random() } }));
};

window.ToastHost = function ToastHost() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const h = (e) => {
      const t = e.detail;
      setList((l) => [...l, t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 2600);
    };
    window.addEventListener('pw-toast', h);
    return () => window.removeEventListener('pw-toast', h);
  }, []);
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none">
      {list.map((t) => (
        <div key={t.id} className={'toast-in px-4 py-2.5 rounded-xl shadow-lift text-white text-sm font-medium flex items-center gap-2 ' + (t.type === 'error' ? 'bg-red-500' : t.type === 'info' ? 'bg-primary' : 'bg-emerald-500')}>
          <span>{t.type === 'error' ? '✕' : t.type === 'info' ? 'ⓘ' : '✓'}</span>{t.msg}
        </div>
      ))}
    </div>
  );
};

// ---------------- Modal ----------------
window.Modal = function Modal({ open, title, onClose, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: 'rgba(40,50,60,0.45)' }}>
      <div className={'fade-in bg-white rounded-2xl shadow-lift w-full flex flex-col max-h-[88vh] ' + (wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 text-lg">×</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// ---------------- 确认对话框 ----------------
window.Confirm = function Confirm({ open, text, onOk, onClose }) {
  return (
    <Modal open={open} title="请确认" onClose={onClose}
      footer={<>
        <BtnGhost onClick={onClose}>取消</BtnGhost>
        <button onClick={onOk} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">确认删除</button>
      </>}>
      <p className="text-gray-600 text-sm">{text || '确定要删除这条数据吗？此操作不可恢复。'}</p>
    </Modal>
  );
};

// ---------------- 基础控件 ----------------
window.Btn = ({ children, onClick, className = '', disabled }) => (
  <button disabled={disabled} onClick={onClick}
    className={'px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primarydark transition disabled:opacity-50 ' + className}>
    {children}
  </button>
);
window.BtnAccent = ({ children, onClick, className = '' }) => (
  <button onClick={onClick} className={'px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition ' + className}>{children}</button>
);
window.BtnGhost = ({ children, onClick, className = '' }) => (
  <button onClick={onClick} className={'px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition ' + className}>{children}</button>
);
window.Input = (props) => (
  <input {...props} className={'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition ' + (props.className || '')} />
);
window.Select = ({ children, ...props }) => (
  <select {...props} className={'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition ' + (props.className || '')}>{children}</select>
);
window.TextArea = (props) => (
  <textarea {...props} className={'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition ' + (props.className || '')} />
);
window.Field = ({ label, children, required }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {children}
  </div>
);
window.Card = ({ children, className = '' }) => (
  <div className={'bg-white rounded-2xl shadow-soft p-5 ' + className}>{children}</div>
);
window.EmptyState = ({ text = '还没有记录，点击上方按钮添加第一条' }) => (
  <div className="py-12 text-center text-gray-400 text-sm">
    <div className="text-4xl mb-3">🌱</div>{text}
  </div>
);
window.Tag = ({ children, color = 'gray' }) => {
  const map = {
    gray: 'bg-gray-100 text-gray-600', blue: 'bg-blue-100 text-blue-600', purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600', green: 'bg-emerald-100 text-emerald-600', red: 'bg-red-100 text-red-600',
    yellow: 'bg-amber-100 text-amber-700', primary: 'bg-primary/10 text-primary'
  };
  return <span className={'inline-block px-2 py-0.5 rounded-full text-xs font-medium ' + (map[color] || map.gray)}>{children}</span>;
};

// ---------------- 日期工具 ----------------
window.fmtDate = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
window.today = () => fmtDate(new Date());
window.fmtMin = (m) => {
  m = Number(m) || 0;
  if (m < 60) return m + ' 分钟';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? h + ' 小时 ' + r + ' 分' : h + ' 小时';
};
window.weekRange = (d = new Date()) => {
  const day = (d.getDay() + 6) % 7; // 周一为一周开始
  const start = new Date(d); start.setDate(d.getDate() - day);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return [fmtDate(start), fmtDate(end)];
};
window.monthRange = (d = new Date()) => {
  const s = new Date(d.getFullYear(), d.getMonth(), 1);
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [fmtDate(s), fmtDate(e)];
};
window.yearRange = (d = new Date()) => [d.getFullYear() + '-01-01', d.getFullYear() + '-12-31'];

// ---------------- 常量 ----------------
window.PRIORITY_COLOR = { '高': 'red', '中': 'yellow', '低': 'gray' };
window.TOPIC_STATUS_COLOR = { '选题中': 'gray', '撰写中': 'blue', '拍摄中': 'purple', '剪辑中': 'orange', '已发布': 'green' };
window.TOPIC_TYPES = ['图文', '对谈长视频', '口播短视频'];
window.IDEA_TAGS = ['心理学理论', '热点话题', '生活观察', '读者提问', '其他'];
window.IDEA_STATUS = ['待孵化', '已采用', '已归档'];
window.LEARN_TYPES = ['督导', '培训', '个人体验', '阅读'];

// ---------------- 图表组件 ----------------
window.BarChart = function BarChart({ labels, datasets, height = 220, stacked = false }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          x: { stacked, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { stacked, beginAtZero: true, grid: { color: '#f0ece6' }, ticks: { font: { size: 10 } } }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);
  return <div style={{ height }}><canvas ref={ref}></canvas></div>;
};

window.LineChart = function LineChart({ labels, datasets, height = 220 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: datasets.map(d => Object.assign({ tension: 0.35, pointRadius: 2.5, borderWidth: 2 }, d)) },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, grid: { color: '#f0ece6' }, ticks: { font: { size: 10 } } }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);
  return <div style={{ height }}><canvas ref={ref}></canvas></div>;
};
