/* 应用外壳：登录 + 导航 + 路由 */
const { useState: apUseState, useEffect: apUseEffect } = React;

const NAVS = [
  ['dashboard', '今日工作台', '🏠'],
  ['workboard', '工作量看板', '📊'],
  ['todos', '待办与协同', '✅'],
  ['content', '内容创作', '🎬'],
  ['ideas', '灵感银行', '💡'],
  ['learning', '学习档案', '📚'],
  ['settings', '设置', '⚙️']
];

// 登录已移除：打开链接即可直接使用工作台

// ---------------- 晚间打卡 ----------------
function saveCheckin(date, mood, note) {
  return API('/checkins', 'POST', { date, mood, note, createdAt: new Date().toISOString() })
    .then(() => { toast('今日打卡完成 🌟', 'success'); localStorage.setItem('pw_checkin_' + date, '1'); })
    .catch(e => { toast('打卡保存失败：' + e.message, 'error'); throw e; });
}
window.CheckInModal = function CheckInModal({ open, date, onClose, onSnooze, onSkip }) {
  const [mood, setMood] = useState('😊 不错');
  const [note, setNote] = useState('');
  if (!open) return null;
  const moods = ['😊 不错', '😐 一般', '😟 疲惫', '🤒 生病', '🎉 高光时刻'];
  return (
    <Modal open={true} title="🌙 晚间打卡时间到" onClose={onSkip}
      footer={<>
        <BtnGhost onClick={onSkip}>今天不打卡</BtnGhost>
        <BtnGhost onClick={onSnooze}>稍后提醒</BtnGhost>
        <Btn onClick={async () => { await saveCheckin(date, mood, note); onClose(); }}>完成打卡</Btn>
      </>}>
      <p className="text-sm text-gray-500 mb-3">记录一下今天的你，帮助坚持每日复盘 🌿</p>
      <Field label="今日状态">
        <div className="flex flex-wrap gap-2">
          {moods.map(m => (
            <button key={m} onClick={() => setMood(m)}
              className={'px-3 py-2 rounded-xl text-sm border transition ' + (mood === m ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-gray-200 text-gray-500 hover:bg-cream')}>{m}</button>
          ))}
        </div>
      </Field>
      <Field label="今日记录 / 感悟（可选）">
        <TextArea rows={3} placeholder="今天完成了什么？有什么想记下的？" value={note} onChange={e => setNote(e.target.value)} />
      </Field>
      <p className="text-[11px] text-gray-400">打卡会保存到你的数据，并随 GitHub 云端同步到手机 / 电脑。</p>
    </Modal>
  );
};

// ---------- 主应用 ----------
function App() {
  const [page, setPage] = apUseState(localStorage.getItem('pw_page') || 'dashboard');
  const [workTypes, setWorkTypes] = apUseState(null);
  const [menuOpen, setMenuOpen] = apUseState(false);
  const [rev, setRev] = apUseState(0); // 远程数据变化时自增，触发当前视图刷新
  const [showCheckin, setShowCheckin] = apUseState(false);
  const [checkinDate, setCheckinDate] = apUseState('');

  // 晚间打卡提醒引擎：到点自动弹窗，每天只提醒一次（可稍后提醒）
  const remindEnabled = () => localStorage.getItem('pw_remind_enabled') !== '0';
  const remindHour = () => Number(localStorage.getItem('pw_remind_hour') || 22);
  apUseEffect(() => {
    const maybeRemind = () => {
      if (!remindEnabled()) return;
      const now = new Date();
      if (now.getHours() < remindHour()) return;            // 还没到点
      const t = fmtDate(now);
      if (localStorage.getItem('pw_remind_last') === t) return; // 今天已提醒过
      const snooze = Number(localStorage.getItem('pw_remind_snooze') || 0);
      if (snooze && Date.now() < snooze) return;            // 处于稍后提醒窗口内
      localStorage.setItem('pw_remind_last', t);
      localStorage.removeItem('pw_remind_snooze');
      setCheckinDate(t);
      setShowCheckin(true);
      // 系统通知（若已授权）：即便窗口最小化也能看到提醒
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🌙 晚间打卡时间到', { body: '记录一下今天的你，打开工作台完成打卡', tag: 'pw-checkin' });
        }
      } catch (e) {}
    };
    maybeRemind();
    const tid = setInterval(maybeRemind, 30000);
    const openH = () => { setCheckinDate(fmtDate(new Date())); setShowCheckin(true); };
    window.addEventListener('pw-open-checkin', openH);
    return () => { clearInterval(tid); window.removeEventListener('pw-open-checkin', openH); };
  }, []);
  const onCheckinClose = () => setShowCheckin(false);
  const onCheckinSnooze = () => { localStorage.removeItem('pw_remind_last'); localStorage.setItem('pw_remind_snooze', Date.now() + 10 * 60000); setShowCheckin(false); };
  const onCheckinSkip = () => { localStorage.setItem('pw_remind_last', fmtDate(new Date())); setShowCheckin(false); };

  const loadWorkTypes = () => API('/worktypes').then(setWorkTypes).catch(() => { });
  apUseEffect(() => { loadWorkTypes(); }, []);
  // 其他设备修改数据后，云端轮询会广播此事件 → 自动刷新当前视图
  apUseEffect(() => {
    const h = () => setRev(r => r + 1);
    window.addEventListener('pw-remote-update', h);
    return () => window.removeEventListener('pw-remote-update', h);
  }, []);

  apUseEffect(() => { localStorage.setItem('pw_page', page); }, [page]);

  return (
    <div className="min-h-screen pb-10">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-soft">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-2">
          <div className="font-bold text-gray-800 flex items-center gap-2 mr-2 shrink-0">
            <span className="text-xl">🧠</span>
            <span className="hidden sm:inline text-sm">jolyn的工作台</span>
          </div>
          {/* 桌面端导航 */}
          <nav className="hidden md:flex flex-1 gap-1 overflow-x-auto">
            {NAVS.map(([k, label, icon]) => (
              <button key={k} onClick={() => setPage(k)}
                className={'px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition ' +
                  (page === k ? 'bg-primary text-white shadow-soft' : 'text-gray-500 hover:bg-cream')}>
                {icon} {label}
              </button>
            ))}
          </nav>
          <div className="flex-1 md:hidden"></div>
          {/* 移动端菜单按钮 */}
          <button className="md:hidden px-3 py-1.5 rounded-xl bg-cream text-gray-600 text-sm" onClick={() => setMenuOpen(o => !o)}>☰ 菜单</button>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-xs text-gray-400">👋 jolyn</span>
          </div>
        </div>
        {/* 移动端下拉导航 */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-2 grid grid-cols-2 gap-1 fade-in">
            {NAVS.map(([k, label, icon]) => (
              <button key={k} onClick={() => { setPage(k); setMenuOpen(false); }}
                className={'px-3 py-2.5 rounded-xl text-sm font-medium text-left transition ' +
                  (page === k ? 'bg-primary text-white' : 'text-gray-600 hover:bg-cream')}>
                {icon} {label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-5">
        {page === 'dashboard' && <DashboardPage key={rev} workTypes={workTypes || {}} userName="" />}
        {page === 'workboard' && <WorkboardPage key={rev} workTypes={workTypes || {}} />}
        {page === 'todos' && <TodosPage key={rev} />}
        {page === 'content' && <ContentPage key={rev} />}
        {page === 'ideas' && <IdeasPage key={rev} />}
        {page === 'learning' && <LearningPage key={rev} />}
        {page === 'settings' && <SettingsPage key={rev} workTypes={workTypes || {}} reloadWorkTypes={loadWorkTypes} />}
      </main>

      <CheckInModal open={showCheckin} date={checkinDate} onClose={onCheckinClose} onSnooze={onCheckinSnooze} onSkip={onCheckinSkip} />
      <ToastHost />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
