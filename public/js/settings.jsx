/* 模块6：设置 —— 工作类别自定义 / 数据归档 / 数据导出 */
const { useState: stUseState, useEffect: stUseEffect } = React;

window.SettingsPage = function SettingsPage({ workTypes, reloadWorkTypes }) {
  const [wt, setWt] = stUseState(workTypes || {});
  const [newType, setNewType] = stUseState({});
  const [archBefore, setArchBefore] = stUseState('');
  const [archive, setArchive] = stUseState(null);
  const [showArchive, setShowArchive] = stUseState(false);
  const [confirmArch, setConfirmArch] = stUseState(false);
  const [records, setRecords] = stUseState([]);
  const [showExport, setShowExport] = stUseState(false);
  const [syncText, setSyncText] = stUseState('');
  const [importText, setImportText] = stUseState('');
  const [notifPerm, setNotifPerm] = stUseState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [canInstall, setCanInstall] = stUseState(false);
  stUseEffect(() => {
    const h = () => setCanInstall(!!window.__deferredPrompt);
    window.addEventListener('pw-installable', h);
    window.addEventListener('pw-installed', h);
    setCanInstall(!!window.__deferredPrompt);
    return () => { window.removeEventListener('pw-installable', h); window.removeEventListener('pw-installed', h); };
  }, []);
  const isInstalled = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;

  // 云端同步（GitHub）配置
  const [gh, setGh] = stUseState({
    enabled: localStorage.getItem('pw_gh_enabled') === '1',
    token: localStorage.getItem('pw_gh_token') || '',
    repo: localStorage.getItem('pw_gh_repo') || '',
    branch: localStorage.getItem('pw_gh_branch') || 'main'
  });
  const [ghStatus, setGhStatus] = stUseState('');
  const [ghBusy, setGhBusy] = stUseState(false);
  const saveGh = async () => {
    setGhBusy(true); setGhStatus('');
    localStorage.setItem('pw_gh_enabled', gh.enabled ? '1' : '0');
    localStorage.setItem('pw_gh_token', gh.token.trim());
    localStorage.setItem('pw_gh_repo', gh.repo.trim());
    localStorage.setItem('pw_gh_branch', (gh.branch.trim() || 'main'));
    try {
      await window.GHSync.test();
      setGhStatus('✅ 连接成功，数据已拉取并启用同步');
      toast('GitHub 同步已启用', 'success');
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      setGhStatus('❌ 连接失败：' + e.message + '（请检查仓库名 / 令牌权限）');
      toast(e.message, 'error');
    } finally { setGhBusy(false); }
  };
  const uploadLocal = async () => {
    setGhBusy(true);
    try { await window.GHSync.uploadLocal(); toast('本地数据已上传到云端', 'success'); setGhStatus('✅ 本地数据已上传'); }
    catch (e) { toast(e.message, 'error'); setGhStatus('❌ 上传失败：' + e.message); }
    finally { setGhBusy(false); }
  };

  stUseEffect(() => { setWt(workTypes || {}); }, [workTypes]);
  stUseEffect(() => { API('/records').then(setRecords).catch(() => { }); }, []);

  const saveWt = async (next) => {
    try {
      await API('/worktypes', 'PUT', next);
      setWt(next); reloadWorkTypes && reloadWorkTypes();
      toast('工作类型已更新');
    } catch (e) { toast(e.message, 'error'); }
  };
  const addType = (cat) => {
    const name = (newType[cat] || '').trim();
    if (!name) return toast('请输入类型名称', 'error');
    if ((wt[cat] || []).includes(name)) return toast('该类型已存在', 'error');
    saveWt({ ...wt, [cat]: [...(wt[cat] || []), name] });
    setNewType(n => ({ ...n, [cat]: '' }));
  };
  const removeType = (cat, name) => saveWt({ ...wt, [cat]: wt[cat].filter(x => x !== name) });
  const renameType = (cat, oldName) => {
    const name = prompt('修改类型名称：', oldName);
    if (!name || !name.trim() || name === oldName) return;
    saveWt({ ...wt, [cat]: wt[cat].map(x => x === oldName ? name.trim() : x) });
  };

  const doArchive = async () => {
    try {
      const r = await API('/archive', 'POST', { before: archBefore });
      toast('归档完成：移入 ' + r.movedRecords + ' 条打卡记录、' + r.movedTodos + ' 条已完成待办');
      setConfirmArch(false);
      API('/records').then(setRecords).catch(() => { });
    } catch (e) { toast(e.message, 'error'); }
  };
  const loadArchive = async () => {
    try { setArchive(await API('/archive')); setShowArchive(true); }
    catch (e) { toast(e.message, 'error'); }
  };

  // 导出统计：按月份 x 类型 汇总
  const exportData = (() => {
    const map = {};
    records.forEach(r => {
      const month = (r.date || '').slice(0, 7);
      const key = month + '|' + r.category + '|' + r.type;
      if (!map[key]) map[key] = { month, category: r.category, type: r.type, minutes: 0, count: 0, times: 0 };
      map[key].minutes += Number(r.minutes) || 0;
      map[key].count += Number(r.count) || 0;
      map[key].times += 1;
    });
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
  })();

  return (
    <div className="fade-in space-y-5">
      {/* 云端同步（GitHub） */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">☁️ 云端同步（GitHub · 多设备实时）</h3>
        <p className="text-xs text-gray-400 mb-4">启用后，所有数据集中保存在你 GitHub 仓库的 <code>data.json</code>。手机和电脑打开同一个网址，改一处约 20 秒内其他设备自动刷新。</p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={gh.enabled} onChange={e => setGh(g => ({ ...g, enabled: e.target.checked }))} className="w-4 h-4" />
            启用 GitHub 云端同步
          </label>
          <Field label="GitHub 仓库（格式：用户名/仓库名）">
            <Input placeholder="例如 jolynj1024-ship-it/psych-workbench" value={gh.repo} onChange={e => setGh(g => ({ ...g, repo: e.target.value }))} />
          </Field>
          <Field label="分支（默认 main）">
            <Input placeholder="main" value={gh.branch} onChange={e => setGh(g => ({ ...g, branch: e.target.value }))} />
          </Field>
          <Field label="访问令牌（Fine-grained PAT，需 Contents 读写权限）">
            <Input type="password" placeholder="github_pat_..." value={gh.token} onChange={e => setGh(g => ({ ...g, token: e.target.value }))} />
            <p className="text-[11px] text-gray-400 mt-1">在 GitHub → Settings → Developer settings → Fine-grained tokens 新建，仅授权本仓库的 Contents 读写。<a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noreferrer" className="text-primary underline">去创建</a></p>
          </Field>
          <div className="flex flex-wrap gap-2 items-center">
            <Btn onClick={saveGh} disabled={ghBusy}>💾 保存并连接测试</Btn>
            <BtnGhost onClick={uploadLocal} disabled={ghBusy}>⬆️ 上传本地暂存到云端</BtnGhost>
            {ghStatus && <span className="text-xs text-gray-500">{ghStatus}</span>}
          </div>
          <p className="text-[11px] text-gray-400">最后同步：{window.GHSync.lastSync() ? new Date(window.GHSync.lastSync()).toLocaleString() : '尚未同步'}</p>
        </div>
      </Card>

      {/* 晚间打卡提醒 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">🌙 晚间打卡提醒</h3>
        <p className="text-xs text-gray-400 mb-4">每天到点自动弹出打卡窗口，提醒你记录当天状态与感悟。需保持工作台标签页处于打开状态。</p>
        <label className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <input type="checkbox" checked={localStorage.getItem('pw_remind_enabled') !== '0'} onChange={e => localStorage.setItem('pw_remind_enabled', e.target.checked ? '1' : '0')} className="w-4 h-4" />
          启用每晚打卡提醒（默认开启）
        </label>
        <Field label="提醒时间（24 小时制）">
          <Select value={Number(localStorage.getItem('pw_remind_hour') || 22)} onChange={e => localStorage.setItem('pw_remind_hour', e.target.value)} className="!w-32">
            {[17, 18, 19, 20, 21, 22, 23].map(h => <option key={h} value={h}>{String(h).padStart(2, '0') + ':00'}</option>)}
          </Select>
        </Field>
        <div className="mt-1">
          {notifPerm === 'granted'
            ? <span className="text-xs text-emerald-600">🔔 系统通知已开启（到点会弹系统提醒）</span>
            : notifPerm === 'unsupported'
              ? <span className="text-xs text-gray-400">当前浏览器不支持系统通知</span>
              : <BtnGhost onClick={async () => { try { const p = await Notification.requestPermission(); setNotifPerm(p); if (p === 'granted') toast('已开启系统通知，到点会弹提醒', 'success'); } catch (e) {} }}>🔔 允许系统通知（让提醒更显眼）</BtnGhost>}
        </div>
        <p className="text-[11px] text-gray-400">说明：网页在浏览器完全关闭时无法弹出提醒，请让标签页保持打开；若到点时页面开着，会自动弹出打卡窗口。</p>
      </Card>

      {/* 安装到设备 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">📲 安装到桌面 / 手机</h3>
        <p className="text-xs text-gray-400 mb-4">把工作台安装成 App：手机「添加到主屏幕」、电脑浏览器点「安装」，之后像原生应用一样直接从图标打开，不必再输入网址。</p>
        {isInstalled
          ? <p className="text-sm text-emerald-600">✅ 已安装为独立应用</p>
          : canInstall
            ? <Btn onClick={async () => { const ok = await window.promptInstall(); if (!ok) toast('已取消安装', 'info'); }}>📲 点击安装到本设备</Btn>
            : <p className="text-xs text-gray-400">若未出现「安装」按钮，请在浏览器菜单里选「安装应用 / 添加到主屏幕」（Chrome / Edge / Safari 均支持）。</p>}
      </Card>

      {/* 工作类别自定义 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">🏷️ 工作类别自定义</h3>
        <p className="text-xs text-gray-400 mb-4">增删改各类别下的工作类型，将同步应用到打卡表单和工作量看板</p>
        <div className="grid md:grid-cols-2 gap-5">
          {Object.keys(wt).map(cat => (
            <div key={cat} className="bg-cream rounded-xl p-4">
              <div className="text-sm font-bold text-gray-700 mb-3">{cat}</div>
              <div className="space-y-2 mb-3">
                {(wt[cat] || []).map(t => (
                  <div key={t} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm text-gray-700">{t}</span>
                    <button onClick={() => renameType(cat, t)} className="text-xs text-gray-400 hover:text-primary">改名</button>
                    <button onClick={() => removeType(cat, t)} className="text-xs text-gray-300 hover:text-red-400">删除</button>
                  </div>
                ))}
                {(wt[cat] || []).length === 0 && <div className="text-xs text-gray-400 text-center py-2">暂无类型</div>}
              </div>
              <div className="flex gap-2">
                <Input placeholder="新类型名称" value={newType[cat] || ''} onChange={e => setNewType(n => ({ ...n, [cat]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addType(cat)} />
                <Btn onClick={() => addType(cat)} className="shrink-0">添加</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 数据归档 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">📦 数据归档</h3>
        <p className="text-xs text-gray-400 mb-4">将某日期之前的所有打卡记录和已完成待办移入归档区，归档区可查看但不在主界面显示</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">归档此日期之前的数据：</span>
          <Input type="date" className="!w-44" value={archBefore} onChange={e => setArchBefore(e.target.value)} />
          <BtnAccent onClick={() => archBefore ? setConfirmArch(true) : toast('请先选择日期', 'error')}>执行归档</BtnAccent>
          <BtnGhost onClick={loadArchive}>查看归档区</BtnGhost>
        </div>
      </Card>

      {/* 数据导出 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">📊 工作量统计</h3>
        <p className="text-xs text-gray-400 mb-4">按「月份 × 工作类型」汇总的工作量统计表（仅展示）</p>
        <Btn onClick={() => setShowExport(s => !s)}>{showExport ? '收起统计表' : '生成统计表'}</Btn>
        {showExport && (
          exportData.length === 0 ? <EmptyState text="暂无打卡数据可统计" /> :
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream text-gray-500 text-xs">
                    <th className="px-3 py-2.5 text-left rounded-l-lg">月份</th>
                    <th className="px-3 py-2.5 text-left">工作类别</th>
                    <th className="px-3 py-2.5 text-left">工作类型</th>
                    <th className="px-3 py-2.5 text-right">打卡次数</th>
                    <th className="px-3 py-2.5 text-right">总时长</th>
                    <th className="px-3 py-2.5 text-right rounded-r-lg">总数量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {exportData.map((r, i) => (
                    <tr key={i} className="text-gray-600 hover:bg-cream/50">
                      <td className="px-3 py-2.5">{r.month}</td>
                      <td className="px-3 py-2.5"><Tag color={r.category === '本职工作' ? 'primary' : 'orange'}>{r.category}</Tag></td>
                      <td className="px-3 py-2.5">{r.type}</td>
                      <td className="px-3 py-2.5 text-right">{r.times}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{fmtMin(r.minutes)}</td>
                      <td className="px-3 py-2.5 text-right">{r.count || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </Card>

      {/* 数据同步（跨设备） */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-1">☁️ 数据同步（跨设备 / 远程）</h3>
        <p className="text-xs text-gray-400 mb-4">在手机与电脑间同步全部数据。推荐用「方式一·复制文本」，可直接粘贴进微信/邮件，彻底避开手机找不到文件的问题。</p>

        {/* 方式一：文本 */}
        <div className="bg-cream rounded-xl p-4 mb-3">
          <div className="text-sm font-bold text-gray-700 mb-2">方式一：复制文本（推荐，适合微信 / 邮件）</div>
          <ol className="text-xs text-gray-500 list-decimal list-inside space-y-1 mb-3">
            <li>在本设备点「生成导出文本」，再点「复制文本」</li>
            <li>粘贴到微信发给另一台设备（或邮件等任意渠道）</li>
            <li>在另一台设备，把文本粘进下方输入框，点「粘贴并导入」</li>
          </ol>
          <div className="flex flex-wrap gap-2 mb-2">
            <Btn onClick={async () => {
              try { const d = await window.exportData(); setSyncText(JSON.stringify(d, null, 2)); toast('已生成，请点「复制文本」', 'success'); }
              catch (e) { toast(e.message, 'error'); }
            }}>📋 生成导出文本</Btn>
            <BtnGhost onClick={() => {
              if (!syncText) return toast('请先生成文本', 'error');
              try { navigator.clipboard.writeText(syncText); toast('已复制到剪贴板，去微信粘贴吧', 'success'); }
              catch (e) { toast('复制失败，请手动长按文本框全选复制', 'error'); }
            }} disabled={!syncText}>📄 复制文本</BtnGhost>
          </div>
          {syncText && <textarea readOnly value={syncText} onFocus={e => e.target.select()}
            className="w-full h-24 text-[11px] font-mono bg-white border border-gray-200 rounded-xl p-2" />}
          <div className="mt-3">
            <TextArea rows={4} placeholder="把从另一台设备复制来的文本，粘贴到这里…" value={importText}
              onChange={e => setImportText(e.target.value)} />
            <BtnAccent className="mt-2" onClick={async () => {
              if (!importText.trim()) return toast('请先粘贴文本', 'error');
              try { const data = JSON.parse(importText); await API('/sync', 'POST', data); setImportText(''); toast('导入成功，请刷新页面', 'success'); }
              catch (err) { toast('导入失败：文本格式不正确', 'error'); }
            }}>📥 粘贴并导入</BtnAccent>
          </div>
        </div>

        {/* 方式二：文件 */}
        <div className="bg-cream rounded-xl p-4">
          <div className="text-sm font-bold text-gray-700 mb-2">方式二：导出 / 导入文件</div>
          <p className="text-xs text-gray-400 mb-3">若手机能直接访问下载的 .json 文件（如通过手机文件管理器），可用此方式。</p>
          <div className="flex flex-wrap gap-3">
            <Btn onClick={() => window.exportData()}>📤 导出文件</Btn>
            <label className="px-4 py-2 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium cursor-pointer hover:bg-primary/5 transition">
              📥 选择文件导入
              <input type="file" accept=".json,application/json" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) window.importData(f); }} />
            </label>
          </div>
        </div>
      </Card>

      {/* 归档确认 */}
      <Modal open={confirmArch} title="⚠️ 归档确认" onClose={() => setConfirmArch(false)}
        footer={<>
          <BtnGhost onClick={() => setConfirmArch(false)}>取消</BtnGhost>
          <BtnAccent onClick={doArchive}>确认归档</BtnAccent>
        </>}>
        <p className="text-sm text-gray-600">将把 <b>{archBefore}</b> 之前的所有打卡记录和全部已完成待办移入归档区。归档后主界面与看板将不再统计这些数据，确定继续吗？</p>
      </Modal>

      {/* 归档区查看 */}
      <Modal open={showArchive} title="📦 归档区" onClose={() => setShowArchive(false)} wide>
        {archive && <div className="space-y-5">
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2">已归档打卡记录（{archive.records.length}）</h4>
            {archive.records.length === 0 ? <div className="text-xs text-gray-400">暂无</div> :
              <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {archive.records.map(r => (
                  <li key={r.id} className="py-2 text-sm text-gray-600 flex gap-3 items-center">
                    <span className="text-xs text-gray-400 shrink-0">{r.date}</span>
                    <Tag color={r.category === '本职工作' ? 'primary' : 'orange'}>{r.category}</Tag>
                    <span className="flex-1 truncate">{r.type}</span>
                    <span className="text-xs text-gray-400">{fmtMin(r.minutes)}</span>
                  </li>
                ))}
              </ul>}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2">已归档待办（{archive.todos.length}）</h4>
            {archive.todos.length === 0 ? <div className="text-xs text-gray-400">暂无</div> :
              <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {archive.todos.map(t => (
                  <li key={t.id} className="py-2 text-sm text-gray-500 flex gap-3 items-center">
                    <span className="line-through flex-1 truncate">{t.title}</span>
                    <Tag color={PRIORITY_COLOR[t.priority]}>{t.priority}</Tag>
                    <span className="text-xs text-gray-400">{t.due || ''}</span>
                  </li>
                ))}
              </ul>}
          </div>
        </div>}
      </Modal>
    </div>
  );
};
