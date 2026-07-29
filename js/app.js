/* 应用外壳：登录 + 导航 + 路由 */
const {
  useState: apUseState,
  useEffect: apUseEffect
} = React;
const NAVS = [['dashboard', '今日工作台', '🏠'], ['workboard', '工作量看板', '📊'], ['todos', '待办与协同', '✅'], ['content', '内容创作', '🎬'], ['ideas', '灵感银行', '💡'], ['learning', '学习档案', '📚'], ['settings', '设置', '⚙️']];

// ---------- 登录页（Kimi 账号登录 - 模拟授权） ----------
function LoginPage({
  onLogin
}) {
  const [name, setName] = apUseState('');
  const [step, setStep] = apUseState(0);
  const [loading, setLoading] = apUseState(false);
  const doLogin = async () => {
    if (!name.trim()) return toast('请输入 Kimi 账号昵称', 'error');
    setLoading(true);
    try {
      const r = await API('/login', 'POST', {
        name: name.trim()
      });
      localStorage.setItem('pw_token', r.token);
      toast('欢迎回来，' + r.name + ' 🌿');
      onLogin(r.name);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center p-4",
    style: {
      background: 'linear-gradient(135deg,#F5F0EB 0%,#EAF4FB 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fade-in bg-white rounded-3xl shadow-lift p-8 w-full max-w-md text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-4"
  }, "\uD83E\uDDE0"), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-bold text-gray-800 mb-1"
  }, "\u5FC3\u7406\u5B66\u5DE5\u4F5C\u8005\u4E2A\u4EBA\u5DE5\u4F5C\u53F0"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-400 mb-8"
  }, "\u672C\u804C\u4E0E\u526F\u4E1A\uFF0C\u4E00\u7AD9\u5F0F\u8BB0\u5F55\u4F60\u7684\u6BCF\u4E00\u5206\u6295\u5165"), step === 0 ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(1),
    className: "w-full py-3 rounded-2xl text-white font-bold text-sm shadow-soft hover:opacity-90 transition",
    style: {
      background: 'linear-gradient(90deg,#2D9CDB,#1E7FB8)'
    }
  }, "\uD83C\uDF19 \u4F7F\u7528 Kimi \u8D26\u53F7\u767B\u5F55") : /*#__PURE__*/React.createElement("div", {
    className: "fade-in text-left"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Kimi \u8D26\u53F7\u6635\u79F0",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    autoFocus: true,
    placeholder: "\u8F93\u5165\u4F60\u7684 Kimi \u6635\u79F0\u5B8C\u6210\u6388\u6743",
    value: name,
    onChange: e => setName(e.target.value),
    onKeyDown: e => e.key === 'Enter' && doLogin()
  })), /*#__PURE__*/React.createElement("button", {
    onClick: doLogin,
    disabled: loading,
    className: "w-full py-3 rounded-2xl text-white font-bold text-sm shadow-soft hover:opacity-90 transition disabled:opacity-50 mt-2",
    style: {
      background: 'linear-gradient(90deg,#2D9CDB,#1E7FB8)'
    }
  }, loading ? '登录中…' : '授权并进入工作台'), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-300 mt-4 text-center"
  }, "\u6F14\u793A\u73AF\u5883\u4E3A\u6A21\u62DF\u6388\u6743\uFF0C\u8F93\u5165\u6635\u79F0\u5373\u53EF\u767B\u5F55\uFF0C\u6570\u636E\u4FDD\u5B58\u5728\u672C\u5730\u670D\u52A1\u7AEF"))));
}

// ---------- 主应用 ----------
function App() {
  const [user, setUser] = apUseState(null);
  const [checking, setChecking] = apUseState(true);
  const [page, setPage] = apUseState(localStorage.getItem('pw_page') || 'dashboard');
  const [workTypes, setWorkTypes] = apUseState(null);
  const [menuOpen, setMenuOpen] = apUseState(false);
  const loadWorkTypes = () => API('/worktypes').then(setWorkTypes).catch(() => {});
  apUseEffect(() => {
    const onUnauth = () => setUser(null);
    window.addEventListener('pw-unauth', onUnauth);
    (async () => {
      if (localStorage.getItem('pw_token')) {
        try {
          const me = await API('/me');
          setUser(me.name);
          loadWorkTypes();
        } catch (e) {}
      }
      setChecking(false);
    })();
    return () => window.removeEventListener('pw-unauth', onUnauth);
  }, []);
  apUseEffect(() => {
    localStorage.setItem('pw_page', page);
  }, [page]);
  const logout = async () => {
    try {
      await API('/logout', 'POST', {});
    } catch (e) {}
    localStorage.removeItem('pw_token');
    setUser(null);
    toast('已退出登录', 'info');
  };
  if (checking) return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center text-gray-400 text-sm"
  }, "\u52A0\u8F7D\u4E2D\u2026");
  if (!user) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LoginPage, {
    onLogin: n => {
      setUser(n);
      loadWorkTypes();
    }
  }), /*#__PURE__*/React.createElement(ToastHost, null));
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
  }, "\uD83D\uDC4B ", user), /*#__PURE__*/React.createElement("button", {
    onClick: logout,
    className: "text-xs text-gray-400 hover:text-red-400 px-2 py-1"
  }, "\u9000\u51FA"))), menuOpen && /*#__PURE__*/React.createElement("nav", {
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
    workTypes: workTypes || {},
    userName: user
  }), page === 'workboard' && /*#__PURE__*/React.createElement(WorkboardPage, {
    workTypes: workTypes || {}
  }), page === 'todos' && /*#__PURE__*/React.createElement(TodosPage, null), page === 'content' && /*#__PURE__*/React.createElement(ContentPage, null), page === 'ideas' && /*#__PURE__*/React.createElement(IdeasPage, null), page === 'learning' && /*#__PURE__*/React.createElement(LearningPage, null), page === 'settings' && /*#__PURE__*/React.createElement(SettingsPage, {
    workTypes: workTypes || {},
    reloadWorkTypes: loadWorkTypes
  })), /*#__PURE__*/React.createElement(ToastHost, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));