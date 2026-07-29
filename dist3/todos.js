/* 模块2：待办与协同 */
const {
  useState: tdUseState,
  useEffect: tdUseEffect
} = React;

// ---------- 待办表单 ----------
function TodoForm({
  initial,
  onDone,
  onCancel
}) {
  const [f, setF] = tdUseState(initial || {
    title: '',
    category: '本职',
    priority: '中',
    due: today(),
    note: ''
  });
  const set = (k, v) => setF(x => ({
    ...x,
    [k]: v
  }));
  const submit = async () => {
    if (!f.title.trim()) return toast('请输入待办标题', 'error');
    try {
      if (f.id) {
        await API('/todos/' + f.id, 'PUT', f);
        toast('待办已更新');
      } else {
        await API('/todos', 'POST', {
          ...f,
          done: false
        });
        toast('待办已添加');
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
    placeholder: "\u8981\u505A\u4EC0\u4E48\uFF1F"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u7C7B\u522B"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.category,
    onChange: e => set('category', e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u672C\u804C"), /*#__PURE__*/React.createElement("option", null, "\u526F\u4E1A"))), /*#__PURE__*/React.createElement(Field, {
    label: "\u4F18\u5148\u7EA7"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.priority,
    onChange: e => set('priority', e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u9AD8"), /*#__PURE__*/React.createElement("option", null, "\u4E2D"), /*#__PURE__*/React.createElement("option", null, "\u4F4E"))), /*#__PURE__*/React.createElement(Field, {
    label: "\u622A\u6B62\u65E5\u671F"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    value: f.due,
    onChange: e => set('due', e.target.value)
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "\u5907\u6CE8"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "2",
    value: f.note,
    onChange: e => set('note', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 mt-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: onCancel
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit
  }, f.id ? '保存' : '添加')));
}

// ---------- 待办清单 ----------
function TodoList() {
  const [todos, setTodos] = tdUseState([]);
  const [modal, setModal] = tdUseState(null); // null | {} | todo
  const [delId, setDelId] = tdUseState(null);
  const [fCat, setFCat] = tdUseState('全部');
  const [fPri, setFPri] = tdUseState('全部');
  const [kw, setKw] = tdUseState('');
  const load = () => API('/todos').then(setTodos).catch(() => {});
  tdUseEffect(() => {
    load();
  }, []);
  const toggle = async t => {
    try {
      await API('/todos/' + t.id, 'PUT', {
        done: !t.done,
        doneAt: !t.done ? new Date().toISOString() : null
      });
      toast(!t.done ? '已完成 🎉' : '已恢复为未完成', 'info');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const del = async () => {
    try {
      await API('/todos/' + delId, 'DELETE');
      toast('已删除');
      setDelId(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  let list = todos.filter(t => (fCat === '全部' || t.category === fCat) && (fPri === '全部' || t.priority === fPri) && (!kw || (t.title + (t.note || '')).includes(kw)));
  const priOrder = {
    '高': 0,
    '中': 1,
    '低': 2
  };
  list = [...list].sort((a, b) => a.done - b.done || priOrder[a.priority] - priOrder[b.priority] || String(a.due || '').localeCompare(b.due || ''));
  return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 mb-4"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setModal({})
  }, "\uFF0B \u65B0\u589E\u5F85\u529E"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-[140px]"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uD83D\uDD0D \u641C\u7D22\u5F85\u529E\u2026",
    value: kw,
    onChange: e => setKw(e.target.value)
  })), /*#__PURE__*/React.createElement(Select, {
    className: "!w-28",
    value: fCat,
    onChange: e => setFCat(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), /*#__PURE__*/React.createElement("option", null, "\u672C\u804C"), /*#__PURE__*/React.createElement("option", null, "\u526F\u4E1A")), /*#__PURE__*/React.createElement(Select, {
    className: "!w-28",
    value: fPri,
    onChange: e => setFPri(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), /*#__PURE__*/React.createElement("option", null, "\u9AD8"), /*#__PURE__*/React.createElement("option", null, "\u4E2D"), /*#__PURE__*/React.createElement("option", null, "\u4F4E"))), list.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u8FD8\u6CA1\u6709\u5F85\u529E\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u7B2C\u4E00\u6761"
  }) : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50"
  }, list.map(t => /*#__PURE__*/React.createElement("li", {
    key: t.id,
    className: 'py-3 flex items-center gap-3 ' + (t.done ? 'opacity-50' : '')
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => toggle(t),
    className: 'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs transition ' + (t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-primary')
  }, t.done ? '✓' : ''), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: 'text-sm font-medium text-gray-700 ' + (t.done ? 'line-through' : '')
  }, t.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap"
  }, /*#__PURE__*/React.createElement(Tag, {
    color: t.category === '本职' ? 'primary' : 'orange'
  }, t.category), /*#__PURE__*/React.createElement(Tag, {
    color: PRIORITY_COLOR[t.priority]
  }, t.priority, "\u4F18\u5148\u7EA7"), t.due && /*#__PURE__*/React.createElement("span", {
    className: !t.done && t.due < today() ? 'text-red-400 font-medium' : ''
  }, "\u622A\u6B62 ", t.due, !t.done && t.due < today() ? ' · 已逾期' : ''), t.note && /*#__PURE__*/React.createElement("span", {
    className: "truncate max-w-[200px]"
  }, t.note))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setModal(t),
    className: "text-xs text-gray-400 hover:text-primary px-1"
  }, "\u7F16\u8F91"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDelId(t.id),
    className: "text-xs text-gray-300 hover:text-red-400 px-1"
  }, "\u5220\u9664")))), /*#__PURE__*/React.createElement(Modal, {
    open: !!modal,
    title: modal?.id ? '编辑待办' : '新增待办',
    onClose: () => setModal(null)
  }, modal && /*#__PURE__*/React.createElement(TodoForm, {
    initial: modal.id ? modal : null,
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

// ---------- 协同追踪 ----------
function CollabForm({
  initial,
  onDone,
  onCancel
}) {
  const [f, setF] = tdUseState(initial || {
    name: '',
    dept: '',
    progress: 0,
    next: ''
  });
  const set = (k, v) => setF(x => ({
    ...x,
    [k]: v
  }));
  const submit = async () => {
    if (!f.name.trim()) return toast('请输入项目名称', 'error');
    try {
      if (f.id) {
        await API('/collabs/' + f.id, 'PUT', f);
        toast('项目已更新');
      } else {
        await API('/collabs', 'POST', {
          ...f,
          logs: []
        });
        toast('协同项目已创建');
      }
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Field, {
    label: "\u9879\u76EE\u540D\u79F0",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.name,
    onChange: e => set('name', e.target.value),
    placeholder: "\u5982\uFF1A\u6821\u56ED\u5FC3\u7406\u5371\u673A\u8054\u52A8\u673A\u5236"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u5BF9\u63A5\u90E8\u95E8"
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.dept,
    onChange: e => set('dept', e.target.value),
    placeholder: "\u5982\uFF1A\u5B66\u5DE5\u5904 / \u533B\u52A1\u5BA4"
  })), /*#__PURE__*/React.createElement(Field, {
    label: '当前进度：' + (f.progress || 0) + '%'
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "100",
    step: "5",
    value: f.progress || 0,
    onChange: e => set('progress', Number(e.target.value)),
    className: "w-full accent-primary mt-2"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "\u4E0B\u4E00\u6B65\u884C\u52A8"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "2",
    value: f.next,
    onChange: e => set('next', e.target.value),
    placeholder: "\u63A5\u4E0B\u6765\u8981\u63A8\u8FDB\u4EC0\u4E48\uFF1F"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 mt-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: onCancel
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit
  }, f.id ? '保存' : '创建')));
}
function CollabTrack() {
  const [list, setList] = tdUseState([]);
  const [modal, setModal] = tdUseState(null);
  const [detail, setDetail] = tdUseState(null);
  const [delId, setDelId] = tdUseState(null);
  const [logText, setLogText] = tdUseState('');
  const load = () => API('/collabs').then(l => {
    setList(l);
    if (detail) setDetail(l.find(x => x.id === detail.id) || null);
  }).catch(() => {});
  tdUseEffect(() => {
    load();
  }, []);
  const addLog = async () => {
    if (!logText.trim()) return toast('请输入沟通内容', 'error');
    try {
      const logs = [...(detail.logs || []), {
        time: new Date().toLocaleString('zh-CN'),
        text: logText.trim()
      }];
      await API('/collabs/' + detail.id, 'PUT', {
        logs
      });
      toast('沟通记录已添加');
      setLogText('');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const del = async () => {
    try {
      await API('/collabs/' + delId, 'DELETE');
      toast('已删除');
      setDelId(null);
      setDetail(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mb-4"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setModal({})
  }, "\uFF0B \u65B0\u589E\u534F\u540C\u9879\u76EE")), list.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u8FD8\u6CA1\u6709\u534F\u540C\u9879\u76EE\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u521B\u5EFA\u7B2C\u4E00\u4E2A"
  })) : /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-2 xl:grid-cols-3 gap-4"
  }, list.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.id,
    className: "hover:shadow-lift transition cursor-pointer"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setDetail(c)
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between mb-2"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-bold text-gray-800 text-sm"
  }, c.name), /*#__PURE__*/React.createElement(Tag, {
    color: c.progress >= 100 ? 'green' : 'primary'
  }, c.progress >= 100 ? '已完成' : '进行中')), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mb-3"
  }, "\u5BF9\u63A5\uFF1A", c.dept || '未填写'), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 h-2 bg-cream rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all",
    style: {
      width: (c.progress || 0) + '%'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-gray-600"
  }, c.progress || 0, "%")), c.next && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500 bg-cream rounded-lg px-2.5 py-1.5"
  }, "\uD83D\uDC49 ", c.next), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-300 mt-2"
  }, (c.logs || []).length, " \u6761\u6C9F\u901A\u8BB0\u5F55 \xB7 \u70B9\u51FB\u67E5\u770B\u8BE6\u60C5"))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!modal,
    title: modal?.id ? '编辑协同项目' : '新增协同项目',
    onClose: () => setModal(null)
  }, modal && /*#__PURE__*/React.createElement(CollabForm, {
    initial: modal.id ? modal : null,
    onDone: () => {
      setModal(null);
      load();
    },
    onCancel: () => setModal(null)
  })), /*#__PURE__*/React.createElement(Modal, {
    open: !!detail,
    title: '📁 ' + (detail?.name || ''),
    onClose: () => setDetail(null),
    wide: true,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDelId(detail.id),
      className: "mr-auto px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50"
    }, "\u5220\u9664\u9879\u76EE"), /*#__PURE__*/React.createElement(BtnGhost, {
      onClick: () => {
        setModal(detail);
        setDetail(null);
      }
    }, "\u7F16\u8F91"), /*#__PURE__*/React.createElement(Btn, {
      onClick: () => setDetail(null)
    }, "\u5173\u95ED"))
  }, detail && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-4 text-sm text-gray-500"
  }, /*#__PURE__*/React.createElement("span", null, "\u5BF9\u63A5\u90E8\u95E8\uFF1A", detail.dept || '未填写'), /*#__PURE__*/React.createElement("span", null, "\u8FDB\u5EA6\uFF1A", /*#__PURE__*/React.createElement("b", {
    className: "text-primary"
  }, detail.progress || 0, "%"))), detail.next && /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600 bg-cream rounded-xl px-3 py-2 mb-4"
  }, "\u4E0B\u4E00\u6B65\uFF1A", detail.next), /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-gray-700 mb-2"
  }, "\u6C9F\u901A\u8BB0\u5F55\u65F6\u95F4\u7EBF"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-4"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\u8BB0\u5F55\u4E00\u6B21\u6C9F\u901A\u5185\u5BB9\u6458\u8981\u2026",
    value: logText,
    onChange: e => setLogText(e.target.value),
    onKeyDown: e => e.key === 'Enter' && addLog()
  }), /*#__PURE__*/React.createElement(Btn, {
    onClick: addLog,
    className: "shrink-0"
  }, "\u6DFB\u52A0")), (detail.logs || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 text-center py-4"
  }, "\u8FD8\u6CA1\u6709\u6C9F\u901A\u8BB0\u5F55") : /*#__PURE__*/React.createElement("div", {
    className: "relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-gray-200"
  }, [...(detail.logs || [])].reverse().map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400"
  }, l.time), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-700 mt-0.5"
  }, l.text)))))), /*#__PURE__*/React.createElement(Confirm, {
    open: !!delId,
    onClose: () => setDelId(null),
    onOk: del,
    text: "\u786E\u5B9A\u5220\u9664\u8BE5\u534F\u540C\u9879\u76EE\u53CA\u5176\u5168\u90E8\u6C9F\u901A\u8BB0\u5F55\u5417\uFF1F"
  }));
}

// ---------- 页面 ----------
window.TodosPage = function TodosPage() {
  const [tab, setTab] = tdUseState('todo');
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex bg-white rounded-xl shadow-soft p-1 w-fit"
  }, [['todo', '✅ 待办清单'], ['collab', '🤝 协同追踪']].map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    className: 'px-5 py-2 rounded-lg text-sm font-medium transition ' + (tab === k ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50')
  }, label))), tab === 'todo' ? /*#__PURE__*/React.createElement(TodoList, null) : /*#__PURE__*/React.createElement(CollabTrack, null));
};