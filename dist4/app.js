/* 应用外壳：登录 + 导航 + 路由 */
const {
  useState: apUseState,
  useEffect: apUseEffect
} = React;
const NAVS = [['dashboard', '今日工作台', '🏠'], ['workboard', '工作量看板', '📊'], ['todos', '待办与协同', '✅'], ['content', '内容创作', '🎬'], ['ideas', '灵感银行', '💡'], ['learning', '学习档案', '📚'], ['settings', '设置', '⚙️']];

// 登录已移除：打开链接即可直接使用工作台

// ---------- 主应用 ----------
function App() {
  const [page, setPage] = apUseState(localStorage.getItem('pw_page') || 'dashboard');
  const [workTypes, setWorkTypes] = apUseState(null);
  const [menuOpen, setMenuOpen] = apUseState(false);
  const [rev, setRev] = apUseState(0); // 远程数据变化时自增，触发当前视图刷新

  const loadWorkTypes = () => API('/worktypes').then(setWorkTypes).catch(() => {});
  apUseEffect(() => {
    loadWorkTypes();
  }, []);
  // 其他设备修改数据后，云端轮询会广播此事件 → 自动刷新当前视图
  apUseEffect(() => {
    const h = () => setRev(r => r + 1);
    window.addEventListener('pw-remote-update', h);
    return () => window.removeEventListener('pw-remote-update', h);
  }, []);
  apUseEffect(() => {
    localStorage.setItem('pw_page', page);
  }, [page]);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen pb-10"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto px-4 flex items-center h-14 gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-gray-800 flex items-center gap-2 mr-2 shrink-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\uD83E\uDDE0"), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline text-sm"
  }, "\u5FC3\u7406\u5DE5\u4F5C\u53F0")), /*#__PURE__*/React.createElement("nav", {
    className: "hidden md:flex flex-1 gap-1 overflow-x-auto"
  }, NAVS.map(([k, label, icon]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setPage(k),
    className: 'px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition ' + (page === k ? 'bg-primary text-white shadow-soft' : 'text-gray-500 hover:bg-cream')
  }, icon, " ", label))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 md:hidden"
  }), /*#__PURE__*/React.createElement("button", {
    className: "md:hidden px-3 py-1.5 rounded-xl bg-cream text-gray-600 text-sm",
    onClick: () => setMenuOpen(o => !o)
  }, "\u2630 \u83DC\u5355"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline text-xs text-gray-400"
  }, "\uD83D\uDC4B \u5DE5\u4F5C\u53F0"))), menuOpen && /*#__PURE__*/React.createElement("nav", {
    className: "md:hidden border-t border-gray-100 bg-white px-4 py-2 grid grid-cols-2 gap-1 fade-in"
  }, NAVS.map(([k, label, icon]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => {
      setPage(k);
      setMenuOpen(false);
    },
    className: 'px-3 py-2.5 rounded-xl text-sm font-medium text-left transition ' + (page === k ? 'bg-primary text-white' : 'text-gray-600 hover:bg-cream')
  }, icon, " ", label)))), /*#__PURE__*/React.createElement("main", {
    className: "max-w-6xl mx-auto px-4 pt-5"
  }, page === 'dashboard' && /*#__PURE__*/React.createElement(DashboardPage, {
    key: rev,
    workTypes: workTypes || {},
    userName: ""
  }), page === 'workboard' && /*#__PURE__*/React.createElement(WorkboardPage, {
    key: rev,
    workTypes: workTypes || {}
  }), page === 'todos' && /*#__PURE__*/React.createElement(TodosPage, {
    key: rev
  }), page === 'content' && /*#__PURE__*/React.createElement(ContentPage, {
    key: rev
  }), page === 'ideas' && /*#__PURE__*/React.createElement(IdeasPage, {
    key: rev
  }), page === 'learning' && /*#__PURE__*/React.createElement(LearningPage, {
    key: rev
  }), page === 'settings' && /*#__PURE__*/React.createElement(SettingsPage, {
    key: rev,
    workTypes: workTypes || {},
    reloadWorkTypes: loadWorkTypes
  })), /*#__PURE__*/React.createElement(ToastHost, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));