/* 模块3：内容创作 —— 内容日历 / 选题管理 / 脚本区 */
const {
  useState: ctUseState,
  useEffect: ctUseEffect,
  useMemo: ctUseMemo
} = React;
const TYPE_ICON = {
  '图文': '📝',
  '对谈长视频': '🎙️',
  '口播短视频': '📱'
};

// ---------- 选题表单 ----------
function TopicForm({
  initial,
  onDone,
  onCancel
}) {
  const [f, setF] = ctUseState(initial || {
    title: '',
    type: '图文',
    status: '选题中',
    platform: '',
    due: '',
    outline: '',
    content: '',
    imageNeeds: '',
    link: ''
  });
  const set = (k, v) => setF(x => ({
    ...x,
    [k]: v
  }));
  const submit = async () => {
    if (!f.title.trim()) return toast('请输入选题标题', 'error');
    try {
      if (f.id) {
        await API('/topics/' + f.id, 'PUT', f);
        toast('选题已更新');
      } else {
        await API('/topics', 'POST', f);
        toast('选题已创建');
      }
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Field, {
    label: "\u6807\u9898",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.title,
    onChange: e => set('title', e.target.value),
    placeholder: "\u9009\u9898\u6807\u9898"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u7C7B\u578B"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.type,
    onChange: e => set('type', e.target.value)
  }, TOPIC_TYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement(Field, {
    label: "\u72B6\u6001"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.status,
    onChange: e => set('status', e.target.value)
  }, Object.keys(TOPIC_STATUS_COLOR).map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement(Field, {
    label: "\u622A\u6B62\u65E5\u671F"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    value: f.due || '',
    onChange: e => set('due', e.target.value)
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "\u76EE\u6807\u5E73\u53F0"
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.platform || '',
    onChange: e => set('platform', e.target.value),
    placeholder: "\u5982\uFF1A\u516C\u4F17\u53F7 / \u5C0F\u7EA2\u4E66 / B\u7AD9 / \u6296\u97F3"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u5927\u7EB2"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "3",
    value: f.outline || '',
    onChange: e => set('outline', e.target.value),
    placeholder: "\u5185\u5BB9\u5927\u7EB2\u8981\u70B9\u2026"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u6B63\u6587 / \u811A\u672C\u8349\u7A3F"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "4",
    value: f.content || '',
    onChange: e => set('content', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u914D\u56FE\u9700\u6C42"
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.imageNeeds || '',
    onChange: e => set('imageNeeds', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u53D1\u5E03\u94FE\u63A5"
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.link || '',
    onChange: e => set('link', e.target.value),
    placeholder: "\u53D1\u5E03\u540E\u586B\u5199"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 mt-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: onCancel
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit
  }, f.id ? '保存' : '创建')));
}

// ---------- 内容日历 ----------
function ContentCalendar({
  topics,
  reload
}) {
  const [cur, setCur] = ctUseState(() => {
    const d = new Date();
    return [d.getFullYear(), d.getMonth()];
  });
  const [dayModal, setDayModal] = ctUseState(null); // 'YYYY-MM-DD'
  const [addModal, setAddModal] = ctUseState(null);
  const [y, m] = cur;
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(fmtDate(new Date(y, m, d)));
  const byDay = ctUseMemo(() => {
    const map = {};
    topics.forEach(t => {
      if (t.due) (map[t.due] = map[t.due] || []).push(t);
    });
    return map;
  }, [topics]);
  const nav = delta => {
    const d = new Date(y, m + delta, 1);
    setCur([d.getFullYear(), d.getMonth()]);
  };
  return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800"
  }, y, " \u5E74 ", m + 1, " \u6708"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: () => nav(-1)
  }, "\u2039 \u4E0A\u6708"), /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: () => {
      const d = new Date();
      setCur([d.getFullYear(), d.getMonth()]);
    }
  }, "\u4ECA\u5929"), /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: () => nav(1)
  }, "\u4E0B\u6708 \u203A"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-1.5 text-center text-xs text-gray-400 mb-1.5"
  }, ['一', '二', '三', '四', '五', '六', '日'].map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    className: "py-1"
  }, "\u5468", d))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-1.5"
  }, cells.map((ds, i) => ds === null ? /*#__PURE__*/React.createElement("div", {
    key: 'p' + i
  }) : /*#__PURE__*/React.createElement("div", {
    key: ds,
    onClick: () => setDayModal(ds),
    className: 'min-h-[72px] rounded-xl border p-1.5 cursor-pointer transition hover:border-primary hover:shadow-soft ' + (ds === today() ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white')
  }, /*#__PURE__*/React.createElement("div", {
    className: 'text-xs font-medium mb-1 ' + (ds === today() ? 'text-primary' : 'text-gray-500')
  }, Number(ds.slice(8))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-0.5"
  }, (byDay[ds] || []).slice(0, 3).map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: "text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-cream text-gray-600"
  }, TYPE_ICON[t.type], " ", t.title)), (byDay[ds] || []).length > 3 && /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-gray-400"
  }, "+", byDay[ds].length - 3, " \u66F4\u591A"))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!dayModal,
    title: '📅 ' + dayModal + ' 排期',
    onClose: () => setDayModal(null),
    footer: /*#__PURE__*/React.createElement(Btn, {
      onClick: () => {
        setAddModal(dayModal);
        setDayModal(null);
      }
    }, "\uFF0B \u6DFB\u52A0\u5F53\u65E5\u6392\u671F")
  }, (byDay[dayModal] || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-400 text-center py-4"
  }, "\u5F53\u5929\u6682\u65E0\u5185\u5BB9\u6392\u671F") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50"
  }, (byDay[dayModal] || []).map(t => /*#__PURE__*/React.createElement("li", {
    key: t.id,
    className: "py-2.5 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, TYPE_ICON[t.type]), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium text-gray-700"
  }, t.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400"
  }, t.type, t.platform ? ' · ' + t.platform : '')), /*#__PURE__*/React.createElement(Tag, {
    color: TOPIC_STATUS_COLOR[t.status]
  }, t.status))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!addModal,
    title: "\u5FEB\u6377\u6DFB\u52A0\u6392\u671F",
    onClose: () => setAddModal(null),
    wide: true
  }, addModal && /*#__PURE__*/React.createElement(TopicForm, {
    initial: {
      title: '',
      type: '图文',
      status: '选题中',
      platform: '',
      due: addModal,
      outline: '',
      content: '',
      imageNeeds: '',
      link: ''
    },
    onDone: () => {
      setAddModal(null);
      reload();
    },
    onCancel: () => setAddModal(null)
  })));
}

// ---------- 选题管理 ----------
function TopicManage({
  topics,
  reload
}) {
  const [modal, setModal] = ctUseState(null);
  const [expand, setExpand] = ctUseState(null);
  const [delId, setDelId] = ctUseState(null);
  const [fType, setFType] = ctUseState('全部');
  const [fStatus, setFStatus] = ctUseState('全部');
  const [kw, setKw] = ctUseState('');
  const changeStatus = async (t, s) => {
    try {
      await API('/topics/' + t.id, 'PUT', {
        status: s
      });
      toast('状态已更新为「' + s + '」');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const del = async () => {
    try {
      await API('/topics/' + delId, 'DELETE');
      toast('已删除');
      setDelId(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const list = topics.filter(t => (fType === '全部' || t.type === fType) && (fStatus === '全部' || t.status === fStatus) && (!kw || (t.title + (t.outline || '')).includes(kw)));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 mb-4"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setModal({})
  }, "\uFF0B \u65B0\u589E\u9009\u9898"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-[140px]"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uD83D\uDD0D \u641C\u7D22\u9009\u9898\u2026",
    value: kw,
    onChange: e => setKw(e.target.value)
  })), /*#__PURE__*/React.createElement(Select, {
    className: "!w-32",
    value: fType,
    onChange: e => setFType(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), TOPIC_TYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t))), /*#__PURE__*/React.createElement(Select, {
    className: "!w-32",
    value: fStatus,
    onChange: e => setFStatus(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), Object.keys(TOPIC_STATUS_COLOR).map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), list.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u8FD8\u6CA1\u6709\u9009\u9898\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u521B\u5EFA\uFF0C\u6216\u5230\u7075\u611F\u94F6\u884C\u628A\u7075\u611F\u8F6C\u6210\u9009\u9898"
  })) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, list.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.id,
    className: "!p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 cursor-pointer",
    onClick: () => setExpand(expand === t.id ? null : t.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-lg"
  }, TYPE_ICON[t.type]), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold text-gray-800 truncate"
  }, t.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mt-0.5"
  }, t.type, t.platform ? ' · ' + t.platform : '', t.due ? ' · 截止 ' + t.due : '')), /*#__PURE__*/React.createElement(Tag, {
    color: TOPIC_STATUS_COLOR[t.status]
  }, t.status), /*#__PURE__*/React.createElement("span", {
    className: "text-gray-300 text-xs"
  }, expand === t.id ? '▲' : '▼')), expand === t.id && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 pt-4 border-t border-gray-50 fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-gray-400 mb-1"
  }, "\u5927\u7EB2"), /*#__PURE__*/React.createElement("div", {
    className: "text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3 min-h-[60px]"
  }, t.outline || '（未填写）')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-gray-400 mb-1"
  }, "\u6B63\u6587\u8349\u7A3F"), /*#__PURE__*/React.createElement("div", {
    className: "text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3 min-h-[60px] max-h-48 overflow-y-auto"
  }, t.content || '（未填写）'))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500"
  }, t.imageNeeds && /*#__PURE__*/React.createElement("span", null, "\uD83D\uDDBC\uFE0F \u914D\u56FE\uFF1A", t.imageNeeds), t.link && /*#__PURE__*/React.createElement("a", {
    href: t.link,
    target: "_blank",
    className: "text-primary hover:underline"
  }, "\uD83D\uDD17 \u53D1\u5E03\u94FE\u63A5")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2 mt-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, "\u66F4\u6539\u72B6\u6001\uFF1A"), Object.keys(TOPIC_STATUS_COLOR).map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => changeStatus(t, s),
    className: 'px-2.5 py-1 rounded-lg text-xs transition ' + (t.status === s ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')
  }, s)), /*#__PURE__*/React.createElement("span", {
    className: "flex-1"
  }), /*#__PURE__*/React.createElement(BtnGhost, {
    className: "!px-3 !py-1.5 !text-xs",
    onClick: () => setModal(t)
  }, "\u7F16\u8F91"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDelId(t.id),
    className: "px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-50"
  }, "\u5220\u9664")))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!modal,
    title: modal?.id ? '编辑选题' : '新增选题',
    onClose: () => setModal(null),
    wide: true
  }, modal && /*#__PURE__*/React.createElement(TopicForm, {
    initial: modal.id ? modal : null,
    onDone: () => {
      setModal(null);
      reload();
    },
    onCancel: () => setModal(null)
  })), /*#__PURE__*/React.createElement(Confirm, {
    open: !!delId,
    onClose: () => setDelId(null),
    onOk: del
  }));
}

// ---------- 脚本区 ----------
function ScriptForm({
  initial,
  onDone,
  onCancel,
  defaultType
}) {
  const [f, setF] = ctUseState(initial || {
    title: '',
    type: defaultType || '对谈长视频',
    duration: '',
    status: '构思中',
    direction: '',
    points: '',
    draft: '',
    guest: ''
  });
  const set = (k, v) => setF(x => ({
    ...x,
    [k]: v
  }));
  const submit = async () => {
    if (!f.title.trim()) return toast('请输入脚本标题', 'error');
    try {
      if (f.id) {
        await API('/scripts/' + f.id, 'PUT', f);
        toast('脚本已更新');
      } else {
        await API('/scripts', 'POST', f);
        toast('脚本已创建');
      }
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Field, {
    label: "\u6807\u9898",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.title,
    onChange: e => set('title', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u7C7B\u578B"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.type,
    onChange: e => set('type', e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5BF9\u8C08\u957F\u89C6\u9891"), /*#__PURE__*/React.createElement("option", null, "\u53E3\u64AD\u77ED\u89C6\u9891"))), /*#__PURE__*/React.createElement(Field, {
    label: "\u65F6\u957F\u9884\u4F30"
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.duration || '',
    onChange: e => set('duration', e.target.value),
    placeholder: "\u5982 30\u5206\u949F / 60\u79D2"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u72B6\u6001"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.status,
    onChange: e => set('status', e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u6784\u601D\u4E2D"), /*#__PURE__*/React.createElement("option", null, "\u64B0\u5199\u4E2D"), /*#__PURE__*/React.createElement("option", null, "\u5DF2\u5B9A\u7A3F"), /*#__PURE__*/React.createElement("option", null, "\u5DF2\u62CD\u6444")))), /*#__PURE__*/React.createElement(Field, {
    label: "\u8BDD\u9898\u65B9\u5411"
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.direction || '',
    onChange: e => set('direction', e.target.value),
    placeholder: "\u5982\uFF1A\u804C\u573A\u7126\u8651 / \u4EB2\u5BC6\u5173\u7CFB"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u63D0\u7EB2\u8981\u70B9"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "3",
    value: f.points || '',
    onChange: e => set('points', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u53E3\u64AD\u6587\u6848\u8349\u7A3F"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "4",
    value: f.draft || '',
    onChange: e => set('draft', e.target.value)
  })), f.type === '对谈长视频' && /*#__PURE__*/React.createElement(Field, {
    label: "\u5609\u5BBE\u4FE1\u606F"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "2",
    value: f.guest || '',
    onChange: e => set('guest', e.target.value),
    placeholder: "\u5609\u5BBE\u59D3\u540D\u3001\u80CC\u666F\u3001\u8054\u7CFB\u65B9\u5F0F\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 mt-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: onCancel
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit
  }, f.id ? '保存' : '创建')));
}
function ScriptZone() {
  const [scripts, setScripts] = ctUseState([]);
  const [sub, setSub] = ctUseState('对谈长视频');
  const [modal, setModal] = ctUseState(null);
  const [expand, setExpand] = ctUseState(null);
  const [delId, setDelId] = ctUseState(null);
  const load = () => API('/scripts').then(setScripts).catch(() => {});
  ctUseEffect(() => {
    load();
  }, []);
  const del = async () => {
    try {
      await API('/scripts/' + delId, 'DELETE');
      toast('已删除');
      setDelId(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const list = scripts.filter(s => s.type === sub);
  const stColor = {
    '构思中': 'gray',
    '撰写中': 'blue',
    '已定稿': 'green',
    '已拍摄': 'purple'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-4 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex bg-white rounded-xl shadow-soft p-1"
  }, ['对谈长视频', '口播短视频'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setSub(t),
    className: 'px-4 py-1.5 rounded-lg text-sm font-medium transition ' + (sub === t ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50')
  }, TYPE_ICON[t], " ", t))), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setModal({})
  }, "\uFF0B \u65B0\u589E\u811A\u672C")), list.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    text: '还没有' + sub + '脚本，点击上方按钮创建第一份'
  })) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, list.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.id,
    className: "!p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 cursor-pointer",
    onClick: () => setExpand(expand === s.id ? null : s.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-lg"
  }, TYPE_ICON[s.type]), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold text-gray-800 truncate"
  }, s.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mt-0.5"
  }, s.type, s.duration ? ' · 预估 ' + s.duration : '', s.direction ? ' · ' + s.direction : '')), /*#__PURE__*/React.createElement(Tag, {
    color: stColor[s.status] || 'gray'
  }, s.status), /*#__PURE__*/React.createElement("span", {
    className: "text-gray-300 text-xs"
  }, expand === s.id ? '▲' : '▼')), expand === s.id && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 pt-4 border-t border-gray-50 fade-in text-sm space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-gray-400 mb-1"
  }, "\u63D0\u7EB2\u8981\u70B9"), /*#__PURE__*/React.createElement("div", {
    className: "text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3"
  }, s.points || '（未填写）')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-gray-400 mb-1"
  }, "\u53E3\u64AD\u6587\u6848\u8349\u7A3F"), /*#__PURE__*/React.createElement("div", {
    className: "text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3 max-h-48 overflow-y-auto"
  }, s.draft || '（未填写）')), s.type === '对谈长视频' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-gray-400 mb-1"
  }, "\u5609\u5BBE\u4FE1\u606F"), /*#__PURE__*/React.createElement("div", {
    className: "text-gray-600 whitespace-pre-wrap bg-cream rounded-xl p-3"
  }, s.guest || '（未填写）')), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    className: "!px-3 !py-1.5 !text-xs",
    onClick: () => setModal(s)
  }, "\u7F16\u8F91"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDelId(s.id),
    className: "px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-50"
  }, "\u5220\u9664")))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!modal,
    title: modal?.id ? '编辑脚本' : '新增脚本',
    onClose: () => setModal(null),
    wide: true
  }, modal && /*#__PURE__*/React.createElement(ScriptForm, {
    initial: modal.id ? modal : null,
    defaultType: sub,
    onDone: () => {
      setModal(null);
      load();
    },
    onCancel: () => setModal(null)
  })), /*#__PURE__*/React.createElement(Confirm, {
    open: !!delId,
    onClose: () => setDelId(null),
    onOk: del
  }));
}

// ---------- 页面 ----------
window.ContentPage = function ContentPage() {
  const [tab, setTab] = ctUseState('calendar');
  const [topics, setTopics] = ctUseState([]);
  const reload = () => API('/topics').then(setTopics).catch(() => {});
  ctUseEffect(() => {
    reload();
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex bg-white rounded-xl shadow-soft p-1 w-fit flex-wrap"
  }, [['calendar', '📅 内容日历'], ['topics', '💡 选题管理'], ['scripts', '🎬 脚本区']].map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    className: 'px-5 py-2 rounded-lg text-sm font-medium transition ' + (tab === k ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50')
  }, label))), tab === 'calendar' && /*#__PURE__*/React.createElement(ContentCalendar, {
    topics: topics,
    reload: reload
  }), tab === 'topics' && /*#__PURE__*/React.createElement(TopicManage, {
    topics: topics,
    reload: reload
  }), tab === 'scripts' && /*#__PURE__*/React.createElement(ScriptZone, null));
};