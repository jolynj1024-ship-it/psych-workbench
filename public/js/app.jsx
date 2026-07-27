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

// ---------- 主应用 ----------
function App() {
  const [page, setPage] = apUseState(localStorage.getItem('pw_page') || 'dashboard');
  const [workTypes, setWorkTypes] = apUseState(null);
  const [menuOpen, setMenuOpen] = apUseState(false);

  const loadWorkTypes = () => API('/worktypes').then(setWorkTypes).catch(() => { });
  apUseEffect(() => { loadWorkTypes(); }, []);

  apUseEffect(() => { localStorage.setItem('pw_page', page); }, [page]);

  return (
    <div className="min-h-screen pb-10">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-soft">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-2">
          <div className="font-bold text-gray-800 flex items-center gap-2 mr-2 shrink-0">
            <span className="text-xl">🧠</span>
            <span className="hidden sm:inline text-sm">心理工作台</span>
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
            <span className="hidden sm:inline text-xs text-gray-400">👋 工作台</span>
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
        {page === 'dashboard' && <DashboardPage workTypes={workTypes || {}} userName="" />}
        {page === 'workboard' && <WorkboardPage workTypes={workTypes || {}} />}
        {page === 'todos' && <TodosPage />}
        {page === 'content' && <ContentPage />}
        {page === 'ideas' && <IdeasPage />}
        {page === 'learning' && <LearningPage />}
        {page === 'settings' && <SettingsPage workTypes={workTypes || {}} reloadWorkTypes={loadWorkTypes} />}
      </main>
      <ToastHost />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
