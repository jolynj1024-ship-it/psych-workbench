/* 模块2：待办与协同 */
const { useState: tdUseState, useEffect: tdUseEffect } = React;

// ---------- 待办表单 ----------
function TodoForm({ initial, onDone, onCancel }) {
  const [f, setF] = tdUseState(initial || { title: '', category: '本职', priority: '中', due: today(), note: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => {
    if (!f.title.trim()) return toast('请输入待办标题', 'error');
    try {
      if (f.id) { await API('/todos/' + f.id, 'PUT', f); toast('待办已更新'); }
      else { await API('/todos', 'POST', { ...f, done: false }); toast('待办已添加'); }
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div>
      <Field label="标题" required><Input value={f.title} onChange={e => set('title', e.target.value)} placeholder="要做什么？" /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="类别"><Select value={f.category} onChange={e => set('category', e.target.value)}><option>本职</option><option>副业</option></Select></Field>
        <Field label="优先级"><Select value={f.priority} onChange={e => set('priority', e.target.value)}><option>高</option><option>中</option><option>低</option></Select></Field>
        <Field label="截止日期"><Input type="date" value={f.due} onChange={e => set('due', e.target.value)} /></Field>
      </div>
      <Field label="备注"><TextArea rows="2" value={f.note} onChange={e => set('note', e.target.value)} /></Field>
      <div className="flex justify-end gap-3 mt-2">
        <BtnGhost onClick={onCancel}>取消</BtnGhost>
        <Btn onClick={submit}>{f.id ? '保存' : '添加'}</Btn>
      </div>
    </div>
  );
}

// ---------- 待办清单 ----------
function TodoList() {
  const [todos, setTodos] = tdUseState([]);
  const [modal, setModal] = tdUseState(null); // null | {} | todo
  const [delId, setDelId] = tdUseState(null);
  const [fCat, setFCat] = tdUseState('全部');
  const [fPri, setFPri] = tdUseState('全部');
  const [kw, setKw] = tdUseState('');

  const load = () => API('/todos').then(setTodos).catch(() => { });
  tdUseEffect(() => { load(); }, []);

  const toggle = async (t) => {
    try {
      await API('/todos/' + t.id, 'PUT', { done: !t.done, doneAt: !t.done ? new Date().toISOString() : null });
      toast(!t.done ? '已完成 🎉' : '已恢复为未完成', 'info');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };
  const del = async () => {
    try { await API('/todos/' + delId, 'DELETE'); toast('已删除'); setDelId(null); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  let list = todos.filter(t =>
    (fCat === '全部' || t.category === fCat) &&
    (fPri === '全部' || t.priority === fPri) &&
    (!kw || (t.title + (t.note || '')).includes(kw)));
  const priOrder = { '高': 0, '中': 1, '低': 2 };
  list = [...list].sort((a, b) => (a.done - b.done) || (priOrder[a.priority] - priOrder[b.priority]) || String(a.due || '').localeCompare(b.due || ''));

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Btn onClick={() => setModal({})}>＋ 新增待办</Btn>
        <div className="flex-1 min-w-[140px]"><Input placeholder="🔍 搜索待办…" value={kw} onChange={e => setKw(e.target.value)} /></div>
        <Select className="!w-28" value={fCat} onChange={e => setFCat(e.target.value)}><option>全部</option><option>本职</option><option>副业</option></Select>
        <Select className="!w-28" value={fPri} onChange={e => setFPri(e.target.value)}><option>全部</option><option>高</option><option>中</option><option>低</option></Select>
      </div>
      {list.length === 0 ? <EmptyState text="还没有待办，点击上方按钮添加第一条" /> :
        <ul className="divide-y divide-gray-50">
          {list.map(t => (
            <li key={t.id} className={'py-3 flex items-center gap-3 ' + (t.done ? 'opacity-50' : '')}>
              <button onClick={() => toggle(t)}
                className={'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs transition ' + (t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-primary')}>
                {t.done ? '✓' : ''}
              </button>
              <div className="flex-1 min-w-0">
                <div className={'text-sm font-medium text-gray-700 ' + (t.done ? 'line-through' : '')}>{t.title}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                  <Tag color={t.category === '本职' ? 'primary' : 'orange'}>{t.category}</Tag>
                  <Tag color={PRIORITY_COLOR[t.priority]}>{t.priority}优先级</Tag>
                  {t.due && <span className={!t.done && t.due < today() ? 'text-red-400 font-medium' : ''}>截止 {t.due}{!t.done && t.due < today() ? ' · 已逾期' : ''}</span>}
                  {t.note && <span className="truncate max-w-[200px]">{t.note}</span>}
                </div>
              </div>
              <button onClick={() => setModal(t)} className="text-xs text-gray-400 hover:text-primary px-1">编辑</button>
              <button onClick={() => setDelId(t.id)} className="text-xs text-gray-300 hover:text-red-400 px-1">删除</button>
            </li>
          ))}
        </ul>}
      <Modal open={!!modal} title={modal?.id ? '编辑待办' : '新增待办'} onClose={() => setModal(null)}>
        {modal && <TodoForm initial={modal.id ? modal : null} onDone={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} />
    </Card>
  );
}

// ---------- 协同追踪 ----------
function CollabForm({ initial, onDone, onCancel }) {
  const [f, setF] = tdUseState(initial || { name: '', dept: '', progress: 0, next: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => {
    if (!f.name.trim()) return toast('请输入项目名称', 'error');
    try {
      if (f.id) { await API('/collabs/' + f.id, 'PUT', f); toast('项目已更新'); }
      else { await API('/collabs', 'POST', { ...f, logs: [] }); toast('协同项目已创建'); }
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div>
      <Field label="项目名称" required><Input value={f.name} onChange={e => set('name', e.target.value)} placeholder="如：校园心理危机联动机制" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="对接部门"><Input value={f.dept} onChange={e => set('dept', e.target.value)} placeholder="如：学工处 / 医务室" /></Field>
        <Field label={'当前进度：' + (f.progress || 0) + '%'}>
          <input type="range" min="0" max="100" step="5" value={f.progress || 0} onChange={e => set('progress', Number(e.target.value))} className="w-full accent-primary mt-2" />
        </Field>
      </div>
      <Field label="下一步行动"><TextArea rows="2" value={f.next} onChange={e => set('next', e.target.value)} placeholder="接下来要推进什么？" /></Field>
      <div className="flex justify-end gap-3 mt-2">
        <BtnGhost onClick={onCancel}>取消</BtnGhost>
        <Btn onClick={submit}>{f.id ? '保存' : '创建'}</Btn>
      </div>
    </div>
  );
}

function CollabTrack() {
  const [list, setList] = tdUseState([]);
  const [modal, setModal] = tdUseState(null);
  const [detail, setDetail] = tdUseState(null);
  const [delId, setDelId] = tdUseState(null);
  const [logText, setLogText] = tdUseState('');

  const load = () => API('/collabs').then(l => { setList(l); if (detail) setDetail(l.find(x => x.id === detail.id) || null); }).catch(() => { });
  tdUseEffect(() => { load(); }, []);

  const addLog = async () => {
    if (!logText.trim()) return toast('请输入沟通内容', 'error');
    try {
      const logs = [...(detail.logs || []), { time: new Date().toLocaleString('zh-CN'), text: logText.trim() }];
      await API('/collabs/' + detail.id, 'PUT', { logs });
      toast('沟通记录已添加'); setLogText(''); load();
    } catch (e) { toast(e.message, 'error'); }
  };
  const del = async () => {
    try { await API('/collabs/' + delId, 'DELETE'); toast('已删除'); setDelId(null); setDetail(null); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="mb-4"><Btn onClick={() => setModal({})}>＋ 新增协同项目</Btn></div>
      {list.length === 0 ? <Card><EmptyState text="还没有协同项目，点击上方按钮创建第一个" /></Card> :
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(c => (
            <Card key={c.id} className="hover:shadow-lift transition cursor-pointer" >
              <div onClick={() => setDetail(c)}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-800 text-sm">{c.name}</h4>
                  <Tag color={c.progress >= 100 ? 'green' : 'primary'}>{c.progress >= 100 ? '已完成' : '进行中'}</Tag>
                </div>
                <div className="text-xs text-gray-400 mb-3">对接：{c.dept || '未填写'}</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: (c.progress || 0) + '%' }}></div>
                  </div>
                  <span className="text-xs font-bold text-gray-600">{c.progress || 0}%</span>
                </div>
                {c.next && <div className="text-xs text-gray-500 bg-cream rounded-lg px-2.5 py-1.5">👉 {c.next}</div>}
                <div className="text-xs text-gray-300 mt-2">{(c.logs || []).length} 条沟通记录 · 点击查看详情</div>
              </div>
            </Card>
          ))}
        </div>}

      <Modal open={!!modal} title={modal?.id ? '编辑协同项目' : '新增协同项目'} onClose={() => setModal(null)}>
        {modal && <CollabForm initial={modal.id ? modal : null} onDone={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />}
      </Modal>

      <Modal open={!!detail} title={'📁 ' + (detail?.name || '')} onClose={() => setDetail(null)} wide
        footer={<>
          <button onClick={() => setDelId(detail.id)} className="mr-auto px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50">删除项目</button>
          <BtnGhost onClick={() => { setModal(detail); setDetail(null); }}>编辑</BtnGhost>
          <Btn onClick={() => setDetail(null)}>关闭</Btn>
        </>}>
        {detail && <div>
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
            <span>对接部门：{detail.dept || '未填写'}</span>
            <span>进度：<b className="text-primary">{detail.progress || 0}%</b></span>
          </div>
          {detail.next && <div className="text-sm text-gray-600 bg-cream rounded-xl px-3 py-2 mb-4">下一步：{detail.next}</div>}
          <h4 className="text-sm font-bold text-gray-700 mb-2">沟通记录时间线</h4>
          <div className="flex gap-2 mb-4">
            <Input placeholder="记录一次沟通内容摘要…" value={logText} onChange={e => setLogText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLog()} />
            <Btn onClick={addLog} className="shrink-0">添加</Btn>
          </div>
          {(detail.logs || []).length === 0 ? <div className="text-xs text-gray-400 text-center py-4">还没有沟通记录</div> :
            <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-gray-200">
              {[...(detail.logs || [])].reverse().map((l, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary"></div>
                  <div className="text-xs text-gray-400">{l.time}</div>
                  <div className="text-sm text-gray-700 mt-0.5">{l.text}</div>
                </div>
              ))}
            </div>}
        </div>}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} text="确定删除该协同项目及其全部沟通记录吗？" />
    </div>
  );
}

// ---------- 页面 ----------
window.TodosPage = function TodosPage() {
  const [tab, setTab] = tdUseState('todo');
  return (
    <div className="fade-in space-y-4">
      <div className="flex bg-white rounded-xl shadow-soft p-1 w-fit">
        {[['todo', '✅ 待办清单'], ['collab', '🤝 协同追踪']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={'px-5 py-2 rounded-lg text-sm font-medium transition ' + (tab === k ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50')}>{label}</button>
        ))}
      </div>
      {tab === 'todo' ? <TodoList /> : <CollabTrack />}
    </div>
  );
};
