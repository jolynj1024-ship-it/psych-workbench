/* 首页：今日工作台 */
const {
  useState: dsUseState,
  useEffect: dsUseEffect,
  useRef: dsUseRef,
  useMemo: dsUseMemo
} = React;

// ---------- 打卡表单（也被番茄钟复用） ----------
window.PunchForm = function PunchForm({
  workTypes,
  initial,
  onDone,
  onCancel
}) {
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
        date,
        category: cat,
        type,
        minutes: Number(minutes),
        count: Number(count) || 0,
        note: note.trim()
      });
      toast('打卡成功，今日又前进了一步 ✨');
      onDone && onDone();
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u65E5\u671F",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u5DE5\u4F5C\u7C7B\u522B",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    value: cat,
    onChange: e => setCat(e.target.value)
  }, cats.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))))), /*#__PURE__*/React.createElement(Field, {
    label: "\u5DE5\u4F5C\u7C7B\u578B",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    value: type,
    onChange: e => setType(e.target.value)
  }, (workTypes?.[cat] || []).map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u65F6\u957F\uFF08\u5206\u949F\uFF09",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    min: "1",
    placeholder: "\u5982 50",
    value: minutes,
    onChange: e => setMinutes(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u6570\u91CF\uFF08\u4E2A\u6848\u6570 / \u6761\u6570\uFF09"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    min: "0",
    placeholder: "\u5982 1",
    value: count,
    onChange: e => setCount(e.target.value)
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "\u5907\u6CE8"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "2",
    placeholder: "\u4ECA\u5929\u8FD9\u9879\u5DE5\u4F5C\u7684\u8865\u5145\u8BF4\u660E\u2026",
    value: note,
    onChange: e => setNote(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 mt-2"
  }, onCancel && /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: onCancel
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit,
    disabled: saving
  }, saving ? '记录中…' : '记 录')));
};

// ---------- 番茄钟 ----------
const POMO_TOTAL = 25 * 60;
window.Pomodoro = function Pomodoro({
  onFinish
}) {
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
  return /*#__PURE__*/React.createElement(Card, {
    className: "flex flex-col sm:flex-row items-center gap-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-24 h-24 shrink-0"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    className: "w-full h-full -rotate-90"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "44",
    fill: "none",
    stroke: "#F5F0EB",
    strokeWidth: "8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "44",
    fill: "none",
    stroke: "#F5A623",
    strokeWidth: "8",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 44,
    strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100)
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex items-center justify-center font-bold text-gray-700 text-lg"
  }, mm, ":", ss)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 text-center sm:text-left"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83C\uDF45 \u4E13\u6CE8\u756A\u8304\u949F"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-3"
  }, "25 \u5206\u949F\u4E13\u6CE8\u4E00\u4EF6\u4E8B\uFF0C\u5B8C\u6210\u540E\u81EA\u52A8\u5F39\u51FA\u6253\u5361\u7A97\u53E3"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 justify-center sm:justify-start"
  }, /*#__PURE__*/React.createElement(BtnAccent, {
    onClick: () => setRunning(r => !r)
  }, running ? '暂停' : left < POMO_TOTAL ? '继续' : '开始专注'), /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: () => {
      setRunning(false);
      setLeft(POMO_TOTAL);
    }
  }, "\u91CD\u7F6E"))));
};

// ---------- 今日工作台页面 ----------
window.DashboardPage = function DashboardPage({
  workTypes,
  userName
}) {
  const [records, setRecords] = dsUseState([]);
  const [todos, setTodos] = dsUseState([]);
  const [checkin, setCheckin] = dsUseState(null);
  const [pomoModal, setPomoModal] = dsUseState(false);
  const [delId, setDelId] = dsUseState(null);
  const [refreshKey, setRefreshKey] = dsUseState(0);
  const load = async () => {
    try {
      const [r, t] = await Promise.all([API('/records'), API('/todos')]);
      setRecords(r);
      setTodos(t);
    } catch (e) {}
  };
  dsUseEffect(() => {
    load();
  }, [refreshKey]);
  dsUseEffect(() => {
    API('/checkins').then(list => {
      const t = today();
      setCheckin((list || []).filter(c => c.date === t).slice(-1)[0] || null);
    }).catch(() => {});
  }, [refreshKey]);
  const hour = new Date().getHours();
  const greet = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安';
  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const todayRecords = records.filter(r => r.date === today());
  const mainMin = todayRecords.filter(r => r.category === '本职工作').reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const sideMin = todayRecords.filter(r => r.category === '副业').reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const doneToday = todos.filter(t => t.done && t.doneAt && t.doneAt.slice(0, 10) === today()).length;
  const del = async () => {
    try {
      await API('/records/' + delId, 'DELETE');
      toast('已删除该条打卡');
      setDelId(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-primary to-primarydark rounded-2xl px-6 py-6 text-white shadow-soft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm opacity-80 mb-1"
  }, todayStr), /*#__PURE__*/React.createElement("h2", {
    className: "text-xl md:text-2xl font-bold"
  }, greet, userName ? '，' + userName : '', "\uFF0C\u4ECA\u5929\u51C6\u5907\u4ECE\u54EA\u91CC\u5F00\u59CB\uFF1F")), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-2 gap-5"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-4"
  }, "\u26A1 \u5FEB\u901F\u6253\u5361"), /*#__PURE__*/React.createElement(PunchForm, {
    workTypes: workTypes,
    onDone: () => setRefreshKey(k => k + 1)
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "text-center !p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mb-1"
  }, "\u672C\u804C\u5DE5\u4F5C"), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-primary"
  }, fmtMin(mainMin))), /*#__PURE__*/React.createElement(Card, {
    className: "text-center !p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mb-1"
  }, "\u526F\u4E1A"), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-accent"
  }, fmtMin(sideMin))), /*#__PURE__*/React.createElement(Card, {
    className: "text-center !p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mb-1"
  }, "\u4ECA\u65E5\u5B8C\u6210\u5F85\u529E"), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-emerald-500"
  }, doneToday, " \u9879"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-3"
  }, "\uD83D\uDCCB \u4ECA\u65E5\u5DF2\u6253\u5361\uFF08", todayRecords.length, "\uFF09"), todayRecords.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u4ECA\u5929\u8FD8\u6CA1\u6709\u6253\u5361\u8BB0\u5F55\uFF0C\u4ECE\u5DE6\u4FA7\u8BB0\u5F55\u7B2C\u4E00\u6761\u5427"
  }) : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50 max-h-72 overflow-y-auto"
  }, todayRecords.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.id,
    className: "py-2.5 flex items-center gap-3"
  }, /*#__PURE__*/React.createElement(Tag, {
    color: r.category === '本职工作' ? 'primary' : 'orange'
  }, r.category), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium text-gray-700 truncate"
  }, r.type), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400"
  }, fmtMin(r.minutes), r.count ? ' · ' + r.count + ' 个/条' : '', r.note ? ' · ' + r.note : '')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDelId(r.id),
    className: "text-xs text-gray-300 hover:text-red-400 px-2"
  }, "\u5220\u9664"))))))), /*#__PURE__*/React.createElement(Pomodoro, {
    onFinish: () => {
      toast('专注完成！记录一下这个番茄吧 🍅', 'info');
      setPomoModal(true);
    }
  }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83C\uDF19 \u4ECA\u65E5\u5FC3\u60C5\u6253\u5361"), checkin ? /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600 truncate"
  }, checkin.mood, checkin.note ? ' · ' + checkin.note : '') : /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400"
  }, "\u4ECA\u5929\u8FD8\u6CA1\u6253\u5361\uFF0C\u8BB0\u5F97\u665A\u4E0A\u6765\u8BB0\u5F55\u4E00\u4E0B\u5427")), /*#__PURE__*/React.createElement(BtnGhost, {
    className: "shrink-0",
    onClick: () => window.dispatchEvent(new CustomEvent('pw-open-checkin'))
  }, "\u53BB\u6253\u5361"))), /*#__PURE__*/React.createElement(Modal, {
    open: pomoModal,
    title: "\uD83C\uDF45 \u756A\u8304\u949F\u5B8C\u6210 \xB7 \u4E13\u6CE8\u5DE5\u4F5C\u6253\u5361",
    onClose: () => setPomoModal(false)
  }, /*#__PURE__*/React.createElement(PunchForm, {
    workTypes: workTypes,
    initial: {
      minutes: 25,
      note: '番茄钟 · 专注工作'
    },
    onDone: () => {
      setPomoModal(false);
      setRefreshKey(k => k + 1);
    },
    onCancel: () => setPomoModal(false)
  })), /*#__PURE__*/React.createElement(Confirm, {
    open: !!delId,
    onClose: () => setDelId(null),
    onOk: del,
    text: "\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u6253\u5361\u8BB0\u5F55\u5417\uFF1F"
  }));
};