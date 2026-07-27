/* 模块3：内容创作 —— 内容日历 / 选题管理 / 脚本区 */
const { useState: ctUseState, useEffect: ctUseEffect, useMemo: ctUseMemo } = React;

const TYPE_ICON = { '图文': '📝', '对谈长视频': '🎙️', '口播短视频': '📱' };

// ---------- 选题表单 ----------
function TopicForm({ initial, onDone, onCancel }) {
  const [f, setF] = ctUseState(initial || { title: '', type: '图文', status: '选题中', platform: '', due: '', outline: '', content: '', imageNeeds: '', link: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => {
    if (!f.title.trim()) return toast('请输入选题标题', 'error');
    try {
      if (f.id) { await API('/topics/' + f.id, 'PUT', f); toast('选题已更新'); }
      else { await API('/topics', 'POST', f); toast('选题已创建'); }
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div>
      <Field label="标题" required><Input value={f.title} onChange={e => set('title', e.target.value)} placeholder="选题标题" /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="类型"><Select value={f.type} onChange={e => set('type', e.target.value)}>{TOPIC_TYPES.map(t => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="状态"><Select value={f.status} onChange={e => set('status', e.target.value)}>{Object.keys(TOPIC_STATUS_COLOR).map(s => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="截止日期"><Input type="date" value={f.due || ''} onChange={e => set('due', e.target.value)} /></Field>
      </div>
      <Field label="目标平台"><Input value={f.platform || ''} onChange={e => set('platform', e.target.value)} placeholder="如：公众号 / 小红书 / B站 / 抖音" /></Field>
      <Field label="大纲"><TextArea rows="3" value={f.outline || ''} onChange={e => set('outline', e.target.value)} placeholder="内容大纲要点…" /></Field>
      <Field label="正文 / 脚本草稿"><TextArea rows="4" value={f.content || ''} onChange={e => set('content', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="配图需求"><Input value={f.imageNeeds || ''} onChange={e => set('imageNeeds', e.target.value)} /></Field>
        <Field label="发布链接"><Input value={f.link || ''} onChange={e => set('link', e.target.value)} placeholder="发布后填写" /></Field>
      </div>
      <div className="flex justify-end gap-3 mt-2">
        <BtnGhost onClick={onCancel}>取消</BtnGhost>
        <Btn onClick={submit}>{f.id ? '保存' : '创建'}</Btn>
      </div>
    </div>
  );
}

// ---------- 内容日历 ----------
function ContentCalendar({ topics, reload }) {
  const [cur, setCur] = ctUseState(() => { const d = new Date(); return [d.getFullYear(), d.getMonth()]; });
  const [dayModal, setDayModal] = ctUseState(null); // 'YYYY-MM-DD'
  const [addModal, setAddModal] = ctUseState(null);

  const [y, m] = cur;
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(fmtDate(new Date(y, m, d)));

  const byDay = ctUseMemo(() => {
    const map = {};
    topics.forEach(t => { if (t.due) (map[t.due] = map[t.due] || []).push(t); });
    return map;
  }, [topics]);

  const nav = (delta) => {
    const d = new Date(y, m + delta, 1);
    setCur([d.getFullYear(), d.getMonth()]);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{y} 年 {m + 1} 月</h3>
        <div className="flex gap-2">
          <BtnGhost onClick={() => nav(-1)}>‹ 上月</BtnGhost>
          <BtnGhost onClick={() => { const d = new Date(); setCur([d.getFullYear(), d.getMonth()]); }}>今天</BtnGhost>
          <BtnGhost onClick={() => nav(1)}>下月 ›</BtnGhost>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-gray-400 mb-1.5">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="py-1">周{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((ds, i) => ds === null ? <div key={'p' + i}></div> : (
          <div key={ds} onClick={() => setDayModal(ds)}
            className={'min-h-[72px] rounded-xl border p-1.5 cursor-pointer transition hover:border-primary hover:shadow-soft ' +
              (ds === today() ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white')}>
            <div className={'text-xs font-medium mb-1 ' + (ds === today() ? 'text-primary' : 'text-gray-500')}>{Number(ds.slice(8))}</div>
            <div className="space-y-0.5">
              {(byDay[ds] || []).slice(0, 3).map(t => (
                <div key={t.id} className="text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-cream text-gray-600">
                  {TYPE_ICON[t.type]} {t.title}
                </div>
              ))}
              {(byDay[ds] || []).length > 3 && <div className="text-[10px] text-gray-400">+{byDay[ds].length - 3} 更多</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!dayModal} title={'📅 ' + dayModal + ' 排期'} onClose={() => setDayModal(null)}
        footer={<Btn onClick={() => { setAddModal(dayModal); setDayModal(null); }}>＋ 添加当日排期</Btn>}>
        {(byDay[dayModal] || []).length === 0 ? <div className="text-sm text-gray-400 text-center py-4">当天暂无内容排期</div> :
          <ul className="divide-y divide-gray-50">
            {(byDay[dayModal] || []).map(t => (
              <li key={t.id} className="py-2.5 flex items-center gap-2">
                <span>{TYPE_ICON[t.type]}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{t.title}</div>
                  <div className="text-xs text-gray-400">{t.type}{t.platform ? ' · ' + t.platform : ''}</div>
                </div>
                <Tag color={TOPIC_STATUS_COLOR[t.status]}>{t.status}</Tag>
              </li>
            ))}
          </ul>}
      </Modal>
      <Modal open={!!addModal} title="快捷添加排期" onClose={() => setAddModal(null)} wide>
        {addModal && <TopicForm initial={{ title: '', type: '图文', status: '选题中', platform: '', due: addModal, outline: '', content: '', imageNeeds: '', link: '' }}
          onDone={() => { setAddModal(null); reload(); }} onCancel={() => setAddModal(null)} />}
      </Modal>
    </Card>
  );
}

// ---------- 选题管理 ----------
function TopicManage({ topics, reload }) {
  const [modal, setModal] = ctUseState(null);
  const [expand, setExpand] = ctUseState(null);
  const [delId, setDelId] = ctUseState(null);
  const [fType, setFType] = ctUseState('全部');
  const [fStatus, setFStatus] = ctUseState('全部');
  const [kw, setKw] = ctUseState('');

  const changeStatus = async (t, s) => {
    try { await API('/topics/' + t.id, 'PUT', { status: s }); toast('状态已更新为「' + s + '」'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const del = async () => {
    try { await API('/topics/' + delId, 'DELETE'); toast('已删除'); setDelId(null); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const list = topics.filter(t =>
    (fType === '全部' || t.type === fType) &&
    (fStatus === '全部' || t.status === fStatus) &&
    (!kw || (t.title + (t.outline || '')).includes(kw)));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Btn onClick={() => setModal({})}>＋ 新增选题</Btn>
        <div className="flex-1 min-w-[140px]"><Input placeholder="🔍 搜索选题…" value={kw} onChange={e => setKw(e.target.value)} /></div>
        <Select className="!w-32" value={fType} onChange={e => setFType(e.target.value)}><option>全部</option>{TOPIC_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
        <Select className="!w-32" value={fStatus} onChange={e => setFStatus(e.target.value)}><option>全部</option>{Object.keys(TOPIC_STATUS_COLOR).map(s => <option key={s}>{s}</option>)}</Select>
      </div>
      {list.length === 0 ? <Card><EmptyState text="还没有选题，点击上方按钮创建，或到灵感银行把灵感转成选题" /></Card> :
        <div className="space-y-3">
          {list.map(t => (
            <Card key={t.id} className="!p-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpand(expand === t.id ? null : t.id)}>
                <span className="text-lg">{TYPE_ICON[t.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">{t.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.type}{t.platform ? ' · ' + t.platform : ''}{t.due ? ' · 截止 ' + t.due : ''}</div>
                </div>
                <Tag color={TOPIC_STATUS_COLOR[t.status]}>{t.status}</Tag>
                <span className="text-gray-300 text-xs">{expand === t.id ? '▲' : '▼'}</span>
              </div>
              {expand === t.id && (
                <div className="mt-4 pt-4 border-t border-gray-50 fade-in">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><div className="text-xs font-bold text-gray-400 mb-1">大纲</div><div className="text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3 min-h-[60px]">{t.outline || '（未填写）'}</div></div>
                    <div><div className="text-xs font-bold text-gray-400 mb-1">正文草稿</div><div className="text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3 min-h-[60px] max-h-48 overflow-y-auto">{t.content || '（未填写）'}</div></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                    {t.imageNeeds && <span>🖼️ 配图：{t.imageNeeds}</span>}
                    {t.link && <a href={t.link} target="_blank" className="text-primary hover:underline">🔗 发布链接</a>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-xs text-gray-400">更改状态：</span>
                    {Object.keys(TOPIC_STATUS_COLOR).map(s => (
                      <button key={s} onClick={() => changeStatus(t, s)}
                        className={'px-2.5 py-1 rounded-lg text-xs transition ' + (t.status === s ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')}>{s}</button>
                    ))}
                    <span className="flex-1"></span>
                    <BtnGhost className="!px-3 !py-1.5 !text-xs" onClick={() => setModal(t)}>编辑</BtnGhost>
                    <button onClick={() => setDelId(t.id)} className="px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-50">删除</button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>}
      <Modal open={!!modal} title={modal?.id ? '编辑选题' : '新增选题'} onClose={() => setModal(null)} wide>
        {modal && <TopicForm initial={modal.id ? modal : null} onDone={() => { setModal(null); reload(); }} onCancel={() => setModal(null)} />}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} />
    </div>
  );
}

// ---------- 脚本区 ----------
function ScriptForm({ initial, onDone, onCancel, defaultType }) {
  const [f, setF] = ctUseState(initial || { title: '', type: defaultType || '对谈长视频', duration: '', status: '构思中', direction: '', points: '', draft: '', guest: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => {
    if (!f.title.trim()) return toast('请输入脚本标题', 'error');
    try {
      if (f.id) { await API('/scripts/' + f.id, 'PUT', f); toast('脚本已更新'); }
      else { await API('/scripts', 'POST', f); toast('脚本已创建'); }
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div>
      <Field label="标题" required><Input value={f.title} onChange={e => set('title', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="类型"><Select value={f.type} onChange={e => set('type', e.target.value)}><option>对谈长视频</option><option>口播短视频</option></Select></Field>
        <Field label="时长预估"><Input value={f.duration || ''} onChange={e => set('duration', e.target.value)} placeholder="如 30分钟 / 60秒" /></Field>
        <Field label="状态"><Select value={f.status} onChange={e => set('status', e.target.value)}><option>构思中</option><option>撰写中</option><option>已定稿</option><option>已拍摄</option></Select></Field>
      </div>
      <Field label="话题方向"><Input value={f.direction || ''} onChange={e => set('direction', e.target.value)} placeholder="如：职场焦虑 / 亲密关系" /></Field>
      <Field label="提纲要点"><TextArea rows="3" value={f.points || ''} onChange={e => set('points', e.target.value)} /></Field>
      <Field label="口播文案草稿"><TextArea rows="4" value={f.draft || ''} onChange={e => set('draft', e.target.value)} /></Field>
      {f.type === '对谈长视频' && <Field label="嘉宾信息"><TextArea rows="2" value={f.guest || ''} onChange={e => set('guest', e.target.value)} placeholder="嘉宾姓名、背景、联系方式…" /></Field>}
      <div className="flex justify-end gap-3 mt-2">
        <BtnGhost onClick={onCancel}>取消</BtnGhost>
        <Btn onClick={submit}>{f.id ? '保存' : '创建'}</Btn>
      </div>
    </div>
  );
}

function ScriptZone() {
  const [scripts, setScripts] = ctUseState([]);
  const [sub, setSub] = ctUseState('对谈长视频');
  const [modal, setModal] = ctUseState(null);
  const [expand, setExpand] = ctUseState(null);
  const [delId, setDelId] = ctUseState(null);

  const load = () => API('/scripts').then(setScripts).catch(() => { });
  ctUseEffect(() => { load(); }, []);

  const del = async () => {
    try { await API('/scripts/' + delId, 'DELETE'); toast('已删除'); setDelId(null); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const list = scripts.filter(s => s.type === sub);
  const stColor = { '构思中': 'gray', '撰写中': 'blue', '已定稿': 'green', '已拍摄': 'purple' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex bg-white rounded-xl shadow-soft p-1">
          {['对谈长视频', '口播短视频'].map(t => (
            <button key={t} onClick={() => setSub(t)}
              className={'px-4 py-1.5 rounded-lg text-sm font-medium transition ' + (sub === t ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50')}>{TYPE_ICON[t]} {t}</button>
          ))}
        </div>
        <Btn onClick={() => setModal({})}>＋ 新增脚本</Btn>
      </div>
      {list.length === 0 ? <Card><EmptyState text={'还没有' + sub + '脚本，点击上方按钮创建第一份'} /></Card> :
        <div className="space-y-3">
          {list.map(s => (
            <Card key={s.id} className="!p-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpand(expand === s.id ? null : s.id)}>
                <span className="text-lg">{TYPE_ICON[s.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">{s.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.type}{s.duration ? ' · 预估 ' + s.duration : ''}{s.direction ? ' · ' + s.direction : ''}</div>
                </div>
                <Tag color={stColor[s.status] || 'gray'}>{s.status}</Tag>
                <span className="text-gray-300 text-xs">{expand === s.id ? '▲' : '▼'}</span>
              </div>
              {expand === s.id && (
                <div className="mt-4 pt-4 border-t border-gray-50 fade-in text-sm space-y-3">
                  <div><div className="text-xs font-bold text-gray-400 mb-1">提纲要点</div><div className="text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3">{s.points || '（未填写）'}</div></div>
                  <div><div className="text-xs font-bold text-gray-400 mb-1">口播文案草稿</div><div className="text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3 max-h-48 overflow-y-auto">{s.draft || '（未填写）'}</div></div>
                  {s.type === '对谈长视频' && <div><div className="text-xs font-bold text-gray-400 mb-1">嘉宾信息</div><div className="text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3">{s.guest || '（未填写）'}</div></div>}
                  <div className="flex justify-end gap-2">
                    <BtnGhost className="!px-3 !py-1.5 !text-xs" onClick={() => setModal(s)}>编辑</BtnGhost>
                    <button onClick={() => setDelId(s.id)} className="px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-50">删除</button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>}
      <Modal open={!!modal} title={modal?.id ? '编辑脚本' : '新增脚本'} onClose={() => setModal(null)} wide>
        {modal && <ScriptForm initial={modal.id ? modal : null} defaultType={sub} onDone={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} />
    </div>
  );
}

// ---------- 页面 ----------
window.ContentPage = function ContentPage() {
  const [tab, setTab] = ctUseState('calendar');
  const [topics, setTopics] = ctUseState([]);
  const reload = () => API('/topics').then(setTopics).catch(() => { });
  ctUseEffect(() => { reload(); }, []);

  return (
    <div className="fade-in space-y-4">
      <div className="flex bg-white rounded-xl shadow-soft p-1 w-fit flex-wrap">
        {[['calendar', '📅 内容日历'], ['topics', '💡 选题管理'], ['scripts', '🎬 脚本区']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={'px-5 py-2 rounded-lg text-sm font-medium transition ' + (tab === k ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50')}>{label}</button>
        ))}
      </div>
      {tab === 'calendar' && <ContentCalendar topics={topics} reload={reload} />}
      {tab === 'topics' && <TopicManage topics={topics} reload={reload} />}
      {tab === 'scripts' && <ScriptZone />}
    </div>
  );
};
