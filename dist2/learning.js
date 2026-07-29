/* 模块5：学习档案 */
const {
  useState: lnUseState,
  useEffect: lnUseEffect
} = React;
const LEARN_COLOR = {
  '督导': 'purple',
  '培训': 'blue',
  '个人体验': 'orange',
  '阅读': 'green'
};
function LearnForm({
  initial,
  onDone,
  onCancel
}) {
  const [f, setF] = lnUseState(initial || {
    date: today(),
    type: '督导',
    topic: '',
    gain: '',
    minutes: ''
  });
  const set = (k, v) => setF(x => ({
    ...x,
    [k]: v
  }));
  const submit = async () => {
    if (!f.topic.trim()) return toast('请输入学习主题', 'error');
    if (!f.minutes || Number(f.minutes) <= 0) return toast('请输入有效时长', 'error');
    try {
      if (f.id) {
        await API('/learnings/' + f.id, 'PUT', {
          ...f,
          minutes: Number(f.minutes)
        });
        toast('记录已更新');
      } else {
        await API('/learnings', 'POST', {
          ...f,
          minutes: Number(f.minutes)
        });
        toast('学习记录已保存 📚');
      }
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u65E5\u671F",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    value: f.date,
    onChange: e => set('date', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u7C7B\u578B"
  }, /*#__PURE__*/React.createElement(Select, {
    value: f.type,
    onChange: e => set('type', e.target.value)
  }, LEARN_TYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement(Field, {
    label: "\u65F6\u957F\uFF08\u5206\u949F\uFF09",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    min: "1",
    value: f.minutes,
    onChange: e => set('minutes', e.target.value)
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "\u4E3B\u9898",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    value: f.topic,
    onChange: e => set('topic', e.target.value),
    placeholder: "\u5982\uFF1ACBT \u6848\u4F8B\u7763\u5BFC / \u300A\u5B58\u5728\u4E3B\u4E49\u5FC3\u7406\u6CBB\u7597\u300B\u7B2C3\u7AE0"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u6536\u83B7"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "4",
    value: f.gain,
    onChange: e => set('gain', e.target.value),
    placeholder: "\u8FD9\u6B21\u5B66\u4E60\u6700\u5927\u7684\u6536\u83B7\u662F\u4EC0\u4E48\uFF1F"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3 mt-2"
  }, /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: onCancel
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit
  }, f.id ? '保存' : '添加')));
}
window.LearningPage = function LearningPage() {
  const [list, setList] = lnUseState([]);
  const [modal, setModal] = lnUseState(null);
  const [delId, setDelId] = lnUseState(null);
  const [fType, setFType] = lnUseState('全部');
  const [kw, setKw] = lnUseState('');
  const load = () => API('/learnings').then(setList).catch(() => {});
  lnUseEffect(() => {
    load();
  }, []);
  const del = async () => {
    try {
      await API('/learnings/' + delId, 'DELETE');
      toast('已删除');
      setDelId(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const [ms, me] = monthRange();
  const monthList = list.filter(l => l.date >= ms && l.date <= me);
  const monthTotal = monthList.reduce((s, l) => s + (Number(l.minutes) || 0), 0);
  const byType = LEARN_TYPES.map(t => ({
    t,
    min: monthList.filter(l => l.type === t).reduce((s, l) => s + (Number(l.minutes) || 0), 0)
  }));
  const shown = list.filter(l => (fType === '全部' || l.type === fType) && (!kw || (l.topic + (l.gain || '')).includes(kw))).sort((a, b) => String(b.date).localeCompare(a.date));
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-5 gap-3"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "text-center !p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mb-1"
  }, "\u672C\u6708\u5B66\u4E60\u603B\u65F6\u957F"), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-primary"
  }, fmtMin(monthTotal))), byType.map(x => /*#__PURE__*/React.createElement(Card, {
    key: x.t,
    className: "text-center !p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mb-1"
  }, x.t), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-gray-700"
  }, fmtMin(x.min))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 mb-4"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setModal({})
  }, "\uFF0B \u65B0\u589E\u5B66\u4E60\u8BB0\u5F55"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-[140px]"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uD83D\uDD0D \u641C\u7D22\u4E3B\u9898\u6216\u6536\u83B7\u2026",
    value: kw,
    onChange: e => setKw(e.target.value)
  })), /*#__PURE__*/React.createElement(Select, {
    className: "!w-32",
    value: fType,
    onChange: e => setFType(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), LEARN_TYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), shown.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u8FD8\u6CA1\u6709\u5B66\u4E60\u8BB0\u5F55\uFF0C\u6301\u7EED\u6210\u957F\u4ECE\u8BB0\u5F55\u5F00\u59CB"
  }) : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50"
  }, shown.map(l => /*#__PURE__*/React.createElement("li", {
    key: l.id,
    className: "py-3.5 flex items-start gap-3"
  }, /*#__PURE__*/React.createElement(Tag, {
    color: LEARN_COLOR[l.type]
  }, l.type), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium text-gray-700"
  }, l.topic), l.gain && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500 mt-1 whitespace-pre-wrap"
  }, l.gain), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-300 mt-1"
  }, l.date, " \xB7 ", fmtMin(l.minutes))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setModal(l),
    className: "text-xs text-gray-400 hover:text-primary px-1 shrink-0"
  }, "\u7F16\u8F91"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDelId(l.id),
    className: "text-xs text-gray-300 hover:text-red-400 px-1 shrink-0"
  }, "\u5220\u9664"))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!modal,
    title: modal?.id ? '编辑学习记录' : '新增学习记录',
    onClose: () => setModal(null)
  }, modal && /*#__PURE__*/React.createElement(LearnForm, {
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
};