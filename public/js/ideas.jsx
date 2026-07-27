/* 模块4：灵感银行 */
const { useState: idUseState, useEffect: idUseEffect } = React;

const IDEA_TAG_COLOR = { '心理学理论': 'purple', '热点话题': 'red', '生活观察': 'green', '读者提问': 'blue', '其他': 'gray' };
const IDEA_ST_COLOR = { '待孵化': 'yellow', '已采用': 'green', '已归档': 'gray' };

window.IdeasPage = function IdeasPage() {
  const [ideas, setIdeas] = idUseState([]);
  const [content, setContent] = idUseState('');
  const [tag, setTag] = idUseState(IDEA_TAGS[0]);
  const [editModal, setEditModal] = idUseState(null);
  const [delId, setDelId] = idUseState(null);
  const [kw, setKw] = idUseState('');
  const [fTag, setFTag] = idUseState('全部');
  const [fSt, setFSt] = idUseState('全部');

  const load = () => API('/ideas').then(setIdeas).catch(() => { });
  idUseEffect(() => { load(); }, []);

  const add = async () => {
    if (!content.trim()) return toast('先写点什么再存入吧', 'error');
    try {
      await API('/ideas', 'POST', { content: content.trim(), tag, status: '待孵化' });
      toast('灵感已存入银行 💡'); setContent(''); load();
    } catch (e) { toast(e.message, 'error'); }
  };
  const update = async (idea, patch, msg) => {
    try { await API('/ideas/' + idea.id, 'PUT', patch); toast(msg || '已更新'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const del = async () => {
    try { await API('/ideas/' + delId, 'DELETE'); toast('已删除'); setDelId(null); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const toTopic = async (idea) => {
    try {
      await API('/topics', 'POST', { title: idea.content.slice(0, 50), type: '图文', status: '选题中', platform: '', due: '', outline: '来自灵感银行：' + idea.content, content: '', imageNeeds: '', link: '' });
      await API('/ideas/' + idea.id, 'PUT', { status: '已采用' });
      toast('已转为选题，可到「内容创作 · 选题管理」查看 🎉');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const list = ideas.filter(i =>
    (fTag === '全部' || i.tag === fTag) &&
    (fSt === '全部' || i.status === fSt) &&
    (!kw || i.content.includes(kw)));

  return (
    <div className="fade-in space-y-4">
      <Card>
        <h3 className="font-bold text-gray-800 mb-3">💡 灵感速记</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><Input placeholder="闪过的念头、观察到的现象、想聊的话题……" value={content}
            onChange={e => setContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} /></div>
          <Select className="sm:!w-36" value={tag} onChange={e => setTag(e.target.value)}>{IDEA_TAGS.map(t => <option key={t}>{t}</option>)}</Select>
          <BtnAccent onClick={add} className="shrink-0">存 入</BtnAccent>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-bold text-gray-800">灵感列表（{list.length}）</h3>
          <div className="flex-1 min-w-[140px]"><Input placeholder="🔍 搜索灵感…" value={kw} onChange={e => setKw(e.target.value)} /></div>
          <Select className="!w-32" value={fTag} onChange={e => setFTag(e.target.value)}><option>全部</option>{IDEA_TAGS.map(t => <option key={t}>{t}</option>)}</Select>
          <Select className="!w-28" value={fSt} onChange={e => setFSt(e.target.value)}><option>全部</option>{IDEA_STATUS.map(s => <option key={s}>{s}</option>)}</Select>
        </div>
        {list.length === 0 ? <EmptyState text="灵感银行还是空的，把第一个念头存进来吧" /> :
          <ul className="divide-y divide-gray-50">
            {list.map(i => (
              <li key={i.id} className="py-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700">{i.content}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Tag color={IDEA_TAG_COLOR[i.tag]}>{i.tag}</Tag>
                      <Tag color={IDEA_ST_COLOR[i.status]}>{i.status}</Tag>
                      <span className="text-xs text-gray-300">{(i.createdAt || '').slice(0, 16).replace('T', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {i.status === '待孵化' && <button onClick={() => toTopic(i)} className="px-2.5 py-1 rounded-lg text-xs bg-accent/10 text-accent hover:bg-accent hover:text-white transition font-medium">转选题</button>}
                    {i.status !== '已采用' && <button onClick={() => update(i, { status: '已采用' }, '已标记为采用')} className="px-2.5 py-1 rounded-lg text-xs text-emerald-500 hover:bg-emerald-50">采用</button>}
                    {i.status !== '已归档' && <button onClick={() => update(i, { status: '已归档' }, '已归档')} className="px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:bg-gray-50">归档</button>}
                    <button onClick={() => setEditModal({ ...i })} className="px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:text-primary">编辑</button>
                    <button onClick={() => setDelId(i.id)} className="px-2.5 py-1 rounded-lg text-xs text-gray-300 hover:text-red-400">删除</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>}
      </Card>

      <Modal open={!!editModal} title="编辑灵感" onClose={() => setEditModal(null)}
        footer={<>
          <BtnGhost onClick={() => setEditModal(null)}>取消</BtnGhost>
          <Btn onClick={async () => {
            if (!editModal.content.trim()) return toast('内容不能为空', 'error');
            await update(editModal, { content: editModal.content, tag: editModal.tag, status: editModal.status }, '灵感已更新');
            setEditModal(null);
          }}>保存</Btn>
        </>}>
        {editModal && <div>
          <Field label="内容"><TextArea rows="3" value={editModal.content} onChange={e => setEditModal(m => ({ ...m, content: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="标签"><Select value={editModal.tag} onChange={e => setEditModal(m => ({ ...m, tag: e.target.value }))}>{IDEA_TAGS.map(t => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="状态"><Select value={editModal.status} onChange={e => setEditModal(m => ({ ...m, status: e.target.value }))}>{IDEA_STATUS.map(s => <option key={s}>{s}</option>)}</Select></Field>
          </div>
        </div>}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} />
    </div>
  );
};
