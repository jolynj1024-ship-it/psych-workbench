/* 应用外壳：登录 + 导航 + 路由 */
const {
  useState: apUseState,
  useEffect: apUseEffect
} = React;
const NAVS = [['dashboard', '今日工作台', '🏠'], ['workboard', '工作量看板', '📊'], ['todos', '待办与协同', '✅'], ['content', '内容创作', '🎬'], ['ideas', '灵感银行', '💡'], ['learning', '学习档案', '📚'], ['settings', '设置', '⚙️']];

// 登录已移除：打开链接即可直接使用工作台

// ---------------- 晚间打卡 ----------------
function saveCheckin(date, mood, note) {
  return API('/checkins', 'POST', {
    date,
    mood,
    note,
    createdAt: new Date().toISOString()
  }).then(() => {
    toast('今日打卡完成 🌟', 'success');
    localStorage.setItem('pw_checkin_' + date, '1');
  }).catch(e => {
    toast('打卡保存失败：' + e.message, 'error');
    throw e;
  });
}
window.CheckInModal = function CheckInModal({
  open,
  date,
  onClose,
  onSnooze,
  onSkip
}) {
  const [mood, setMood] = useState('😊 不错');
  const [note, setNote] = useState('');
  if (!open) return null;
  const moods = ['😊 不错', '😐 一般', '😟 疲惫', '🤒 生病', '🎉 高光时刻'];
  return /*#__PURE__*/React.createElement(Modal, {
    open: true,
    title: "\uD83C\uDF19 \u665A\u95F4\u6253\u5361\u65F6\u95F4\u5230",
    onClose: onSkip,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BtnGhost, {
      onClick: onSkip
    }, "\u4ECA\u5929\u4E0D\u6253\u5361"), /*#__PURE__*/React.createElement(BtnGhost, {
      onClick: onSnooze
    }, "\u7A0D\u540E\u63D0\u9192"), /*#__PURE__*/React.createElement(Btn, {
      onClick: async () => {
        await saveCheckin(date, mood, note);
        onClose();
      }
    }, "\u5B8C\u6210\u6253\u5361"))
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mb-3"
  }, "\u8BB0\u5F55\u4E00\u4E0B\u4ECA\u5929\u7684\u4F60\uFF0C\u5E2E\u52A9\u575A\u6301\u6BCF\u65E5\u590D\u76D8 \uD83C\uDF3F"), /*#__PURE__*/React.createElement(Field, {
    label: "\u4ECA\u65E5\u72B6\u6001"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, moods.map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    onClick: () => setMood(m),
    className: 'px-3 py-2 rounded-xl text-sm border transition ' + (mood === m ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-gray-200 text-gray-500 hover:bg-cream')
  }, m)))), /*#__PURE__*/React.createElement(Field, {
    label: "\u4ECA\u65E5\u8BB0\u5F55 / \u611F\u609F\uFF08\u53EF\u9009\uFF09"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: 3,
    placeholder: "\u4ECA\u5929\u5B8C\u6210\u4E86\u4EC0\u4E48\uFF1F\u6709\u4EC0\u4E48\u60F3\u8BB0\u4E0B\u7684\uFF1F",
    value: note,
    onChange: e => setNote(e.target.value)
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-gray-400"
  }, "\u6253\u5361\u4F1A\u4FDD\u5B58\u5230\u4F60\u7684\u6570\u636E\uFF0C\u5E76\u968F GitHub \u4E91\u7AEF\u540C\u6B65\u5230\u624B\u673A / \u7535\u8111\u3002"));
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
      if (now.getHours() < remindHour()) return; // 还没到点
      const t = fmtDate(now);
      if (localStorage.getItem('pw_remind_last') === t) return; // 今天已提醒过
      const snooze = Number(localStorage.getItem('pw_remind_snooze') || 0);
      if (snooze && Date.now() < snooze) return; // 处于稍后提醒窗口内
      localStorage.setItem('pw_remind_last', t);
      localStorage.removeItem('pw_remind_snooze');
      setCheckinDate(t);
      setShowCheckin(true);
    };
    maybeRemind();
    const tid = setInterval(maybeRemind, 30000);
    const openH = () => {
      setCheckinDate(fmtDate(new Date()));
      setShowCheckin(true);
    };
    window.addEventListener('pw-open-checkin', openH);
    return () => {
      clearInterval(tid);
      window.removeEventListener('pw-open-checkin', openH);
    };
  }, []);
  const onCheckinClose = () => setShowCheckin(false);
  const onCheckinSnooze = () => {
    localStorage.removeItem('pw_remind_last');
    localStorage.setItem('pw_remind_snooze', Date.now() + 10 * 60000);
    setShowCheckin(false);
  };
  const onCheckinSkip = () => {
    localStorage.setItem('pw_remind_last', fmtDate(new Date()));
    setShowCheckin(false);
  };
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
  })), /*#__PURE__*/React.createElement(CheckInModal, {
    open: showCheckin,
    date: checkinDate,
    onClose: onCheckinClose,
    onSnooze: onCheckinSnooze,
    onSkip: onCheckinSkip
  }), /*#__PURE__*/React.createElement(ToastHost, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));