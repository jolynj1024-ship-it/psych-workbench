/* 首页：今日工作台 */
const { useState: dsUseState, useEffect: dsUseEffect, useRef: dsUseRef, useMemo: dsUseMemo } = React;

// ---------- 打卡表单（也被番茄钟复用） ----------
window.PunchForm = function PunchForm({ workTypes, initial, onDone, onCancel }) {
  const cats = Object.keys(workTypes || {});
  const [cat, setCat] = dsUseState(initial?.category || cats[0] || '本职工作');
  const [type, setType] = dsUseState(initial?.type || (workTypes?.[cats[0]] || [])[0] || '');
  const [minutes, setMinutes] = dsUseState(initial?.minutes || '');
  const [count, setCount] = dsUseState(initial?.count || '');
  const [note, setNote] = dsUseState(initial?.note || '');
  const [date, setDate] = dsUseState(initial?.date || today());
  const [saving, setSaving] = dsUseState(false);

  dsUseEffect(() => {
    const list = workTypes?.[cat] || [];
    if (!list.includes(type)) setType(list[0] || '');
  }, [cat, workTypes]);

  const submit = async () => {
    if (!type) return toast('请选择工作类型', 'error');
    if (!minutes || Number(minutes) <= 0) return toast('请输入有效时长（分钟）', 'error');
    setSaving(true);
    try {
      await API('/records', 'POST', {
        date, category: cat, type,
        minutes: Number(minutes), count: Number(count) || 0, note: note.trim()
      });
      toast('打卡成功，今日又前进了一步 ✨');
      onDone && onDone();
    } catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="日期" required><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="工作类别" required>
          <Select value={cat} onChange={e => setCat(e.target.value)}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="工作类型" required>
        <Select value={type} onChange={e => setType(e.target.value)}>
          {(workTypes?.[cat] || []).map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="时长（分钟）" required><Input type="number" min="1" placeholder="如 50" value={minutes} onChange={e => setMinutes(e.target.value)} /></Field>
        <Field label="数量（个案数 / 条数）"><Input type="number" min="0" placeholder="如 1" value={count} onChange={e => setCount(e.target.value)} /></Field>
      </div>
      <Field label="备注"><TextArea rows="2" placeholder="今天这项工作的补充说明…" value={note} onChange={e => setNote(e.target.value)} /></Field>
      <div className="flex justify-end gap-3 mt-2">
        {onCancel && <BtnGhost onClick={onCancel}>取消</BtnGhost>}
        <Btn onClick={submit} disabled={saving}>{saving ? '记录中…' : '记 录'}</Btn>
      </div>
    </div>
  );
};

// ---------- 番茄钟 ----------
const POMO_TOTAL = 25 * 60;
window.Pomodoro = function Pomodoro({ onFinish }) {
  const [left, setLeft] = dsUseState(POMO_TOTAL);
  const [running, setRunning] = dsUseState(false);
  const timer = dsUseRef(null);

  dsUseEffect(() => {
    if (running) {
      timer.current = setInterval(() => {
        setLeft(l => {
          if (l <= 1) {
            clearInterval(timer.current);
            setRunning(false);
            setTimeout(() => onFinish && onFinish(), 100);
            return POMO_TOTAL;
          }
          return l - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer.current);
  }, [running]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const pct = (1 - left / POMO_TOTAL) * 100;

  return (
    <Card className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#F5F0EB" strokeWidth="8" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#F5A623" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - pct / 100)} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-700 text-lg">{mm}:{ss}</div>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-bold text-gray-800 mb-1">🍅 专注番茄钟</h3>
        <p className="text-xs text-gray-400 mb-3">25 分钟专注一件事，完成后自动弹出打卡窗口</p>
        <div className="flex gap-2 justify-center sm:justify-start">
          <BtnAccent onClick={() => setRunning(r => !r)}>{running ? '暂停' : left < POMO_TOTAL ? '继续' : '开始专注'}</BtnAccent>
          <BtnGhost onClick={() => { setRunning(false); setLeft(POMO_TOTAL); }}>重置</BtnGhost>
        </div>
      </div>
    </Card>
  );
};

// ---------- 今日工作台页面 ----------
window.DashboardPage = function DashboardPage({ workTypes, userName }) {
  const [records, setRecords] = dsUseState([]);
  const [todos, setTodos] = dsUseState([]);
  const [pomoModal, setPomoModal] = dsUseState(false);
  const [delId, setDelId] = dsUseState(null);
  const [refreshKey, setRefreshKey] = dsUseState(0);

  const load = async () => {
    try {
      const [r, t] = await Promise.all([API('/records'), API('/todos')]);
      setRecords(r); setTodos(t);
    } catch (e) { }
  };
  dsUseEffect(() => { load(); }, [refreshKey]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安';
  const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const todayRecords = records.filter(r => r.date === today());
  const mainMin = todayRecords.filter(r => r.category === '本职工作').reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const sideMin = todayRecords.filter(r => r.category === '副业').reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const doneToday = todos.filter(t => t.done && t.doneAt && t.doneAt.slice(0, 10) === today()).length;

  const del = async () => {
    try {
      await API('/records/' + delId, 'DELETE');
      toast('已删除该条打卡');
      setDelId(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="fade-in space-y-5">
      <div className="bg-gradient-to-r from-primary to-primarydark rounded-2xl px-6 py-6 text-white shadow-soft">
        <div className="text-sm opacity-80 mb-1">{todayStr}</div>
        <h2 className="text-xl md:text-2xl font-bold">{greet}{userName ? '，' + userName : ''}，今天准备从哪里开始？</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* 左：快速打卡 */}
        <Card>
          <h3 className="font-bold text-gray-800 mb-4">⚡ 快速打卡</h3>
          <PunchForm workTypes={workTypes} onDone={() => setRefreshKey(k => k + 1)} />
        </Card>

        {/* 右：今日统计 */}
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center !p-4">
              <div className="text-xs text-gray-400 mb-1">本职工作</div>
              <div className="text-lg font-bold text-primary">{fmtMin(mainMin)}</div>
            </Card>
            <Card className="text-center !p-4">
              <div className="text-xs text-gray-400 mb-1">副业</div>
              <div className="text-lg font-bold text-accent">{fmtMin(sideMin)}</div>
            </Card>
            <Card className="text-center !p-4">
              <div className="text-xs text-gray-400 mb-1">今日完成待办</div>
              <div className="text-lg font-bold text-emerald-500">{doneToday} 项</div>
            </Card>
          </div>
          <Card>
            <h3 className="font-bold text-gray-800 mb-3">📋 今日已打卡（{todayRecords.length}）</h3>
            {todayRecords.length === 0 ? <EmptyState text="今天还没有打卡记录，从左侧记录第一条吧" /> :
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {todayRecords.map(r => (
                  <li key={r.id} className="py-2.5 flex items-center gap-3">
                    <Tag color={r.category === '本职工作' ? 'primary' : 'orange'}>{r.category}</Tag>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">{r.type}</div>
                      <div className="text-xs text-gray-400">{fmtMin(r.minutes)}{r.count ? ' · ' + r.count + ' 个/条' : ''}{r.note ? ' · ' + r.note : ''}</div>
                    </div>
                    <button onClick={() => setDelId(r.id)} className="text-xs text-gray-300 hover:text-red-400 px-2">删除</button>
                  </li>
                ))}
              </ul>}
          </Card>
        </div>
      </div>

      <Pomodoro onFinish={() => { toast('专注完成！记录一下这个番茄吧 🍅', 'info'); setPomoModal(true); }} />

      <Modal open={pomoModal} title="🍅 番茄钟完成 · 专注工作打卡" onClose={() => setPomoModal(false)}>
        <PunchForm workTypes={workTypes} initial={{ minutes: 25, note: '番茄钟 · 专注工作' }}
          onDone={() => { setPomoModal(false); setRefreshKey(k => k + 1); }} onCancel={() => setPomoModal(false)} />
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} text="确定删除这条打卡记录吗？" />
    </div>
  );
};
