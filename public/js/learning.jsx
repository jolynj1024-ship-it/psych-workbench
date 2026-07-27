/* 模块5：学习档案 */
const { useState: lnUseState, useEffect: lnUseEffect } = React;

const LEARN_COLOR = { '督导': 'purple', '培训': 'blue', '个人体验': 'orange', '阅读': 'green' };

function LearnForm({ initial, onDone, onCancel }) {
  const [f, setF] = lnUseState(initial || { date: today(), type: '督导', topic: '', gain: '', minutes: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const submit = async () => {
    if (!f.topic.trim()) return toast('请输入学习主题', 'error');
    if (!f.minutes || Number(f.minutes) <= 0) return toast('请输入有效时长', 'error');
    try {
      if (f.id) { await API('/learnings/' + f.id, 'PUT', { ...f, minutes: Number(f.minutes) }); toast('记录已更新'); }
      else { await API('/learnings', 'POST', { ...f, minutes: Number(f.minutes) }); toast('学习记录已保存 📚'); }
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="日期" required><Input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="类型"><Select value={f.type} onChange={e => set('type', e.target.value)}>{LEARN_TYPES.map(t => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="时长（分钟）" required><Input type="number" min="1" value={f.minutes} onChange={e => set('minutes', e.target.value)} /></Field>
      </div>
      <Field label="主题" required><Input value={f.topic} onChange={e => set('topic', e.target.value)} placeholder="如：CBT 案例督导 / 《存在主义心理治疗》第3章" /></Field>
      <Field label="收获"><TextArea rows="4" value={f.gain} onChange={e => set('gain', e.target.value)} placeholder="这次学习最大的收获是什么？" /></Field>
      <div className="flex justify-end gap-3 mt-2">
        <BtnGhost onClick={onCancel}>取消</BtnGhost>
        <Btn onClick={submit}>{f.id ? '保存' : '添加'}</Btn>
      </div>
    </div>
  );
}

window.LearningPage = function LearningPage() {
  const [list, setList] = lnUseState([]);
  const [modal, setModal] = lnUseState(null);
  const [delId, setDelId] = lnUseState(null);
  const [fType, setFType] = lnUseState('全部');
  const [kw, setKw] = lnUseState('');

  const load = () => API('/learnings').then(setList).catch(() => { });
  lnUseEffect(() => { load(); }, []);

  const del = async () => {
    try { await API('/learnings/' + delId, 'DELETE'); toast('已删除'); setDelId(null); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const [ms, me] = monthRange();
  const monthList = list.filter(l => l.date >= ms && l.date <= me);
  const monthTotal = monthList.reduce((s, l) => s + (Number(l.minutes) || 0), 0);
  const byType = LEARN_TYPES.map(t => ({ t, min: monthList.filter(l => l.type === t).reduce((s, l) => s + (Number(l.minutes) || 0), 0) }));

  const shown = list
    .filter(l => (fType === '全部' || l.type === fType) && (!kw || (l.topic + (l.gain || '')).includes(kw)))
    .sort((a, b) => String(b.date).localeCompare(a.date));

  return (
    <div className="fade-in space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center !p-4">
          <div className="text-xs text-gray-400 mb-1">本月学习总时长</div>
          <div className="text-lg font-bold text-primary">{fmtMin(monthTotal)}</div>
        </Card>
        {byType.map(x => (
          <Card key={x.t} className="text-center !p-4">
            <div className="text-xs text-gray-400 mb-1">{x.t}</div>
            <div className="text-lg font-bold text-gray-700">{fmtMin(x.min)}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Btn onClick={() => setModal({})}>＋ 新增学习记录</Btn>
          <div className="flex-1 min-w-[140px]"><Input placeholder="🔍 搜索主题或收获…" value={kw} onChange={e => setKw(e.target.value)} /></div>
          <Select className="!w-32" value={fType} onChange={e => setFType(e.target.value)}><option>全部</option>{LEARN_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
        </div>
        {shown.length === 0 ? <EmptyState text="还没有学习记录，持续成长从记录开始" /> :
          <ul className="divide-y divide-gray-50">
            {shown.map(l => (
              <li key={l.id} className="py-3.5 flex items-start gap-3">
                <Tag color={LEARN_COLOR[l.type]}>{l.type}</Tag>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700">{l.topic}</div>
                  {l.gain && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{l.gain}</div>}
                  <div className="text-xs text-gray-300 mt-1">{l.date} · {fmtMin(l.minutes)}</div>
                </div>
                <button onClick={() => setModal(l)} className="text-xs text-gray-400 hover:text-primary px-1 shrink-0">编辑</button>
                <button onClick={() => setDelId(l.id)} className="text-xs text-gray-300 hover:text-red-400 px-1 shrink-0">删除</button>
              </li>
            ))}
          </ul>}
      </Card>

      <Modal open={!!modal} title={modal?.id ? '编辑学习记录' : '新增学习记录'} onClose={() => setModal(null)}>
        {modal && <LearnForm initial={modal.id ? modal : null} onDone={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} />
    </div>
  );
};
