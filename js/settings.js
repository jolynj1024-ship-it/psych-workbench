/* 模块6：设置 —— 工作类别自定义 / 数据归档 / 数据导出 */
const {
  useState: stUseState,
  useEffect: stUseEffect
} = React;
window.SettingsPage = function SettingsPage({
  workTypes,
  reloadWorkTypes
}) {
  const [wt, setWt] = stUseState(workTypes || {});
  const [newType, setNewType] = stUseState({});
  const [archBefore, setArchBefore] = stUseState('');
  const [archive, setArchive] = stUseState(null);
  const [showArchive, setShowArchive] = stUseState(false);
  const [confirmArch, setConfirmArch] = stUseState(false);
  const [records, setRecords] = stUseState([]);
  const [showExport, setShowExport] = stUseState(false);
  stUseEffect(() => {
    setWt(workTypes || {});
  }, [workTypes]);
  stUseEffect(() => {
    API('/records').then(setRecords).catch(() => {});
  }, []);
  const saveWt = async next => {
    try {
      await API('/worktypes', 'PUT', next);
      setWt(next);
      reloadWorkTypes && reloadWorkTypes();
      toast('工作类型已更新');
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const addType = cat => {
    const name = (newType[cat] || '').trim();
    if (!name) return toast('请输入类型名称', 'error');
    if ((wt[cat] || []).includes(name)) return toast('该类型已存在', 'error');
    saveWt({
      ...wt,
      [cat]: [...(wt[cat] || []), name]
    });
    setNewType(n => ({
      ...n,
      [cat]: ''
    }));
  };
  const removeType = (cat, name) => saveWt({
    ...wt,
    [cat]: wt[cat].filter(x => x !== name)
  });
  const renameType = (cat, oldName) => {
    const name = prompt('修改类型名称：', oldName);
    if (!name || !name.trim() || name === oldName) return;
    saveWt({
      ...wt,
      [cat]: wt[cat].map(x => x === oldName ? name.trim() : x)
    });
  };
  const doArchive = async () => {
    try {
      const r = await API('/archive', 'POST', {
        before: archBefore
      });
      toast('归档完成：移入 ' + r.movedRecords + ' 条打卡记录、' + r.movedTodos + ' 条已完成待办');
      setConfirmArch(false);
      API('/records').then(setRecords).catch(() => {});
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const loadArchive = async () => {
    try {
      setArchive(await API('/archive'));
      setShowArchive(true);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  // 导出统计：按月份 x 类型 汇总
  const exportData = (() => {
    const map = {};
    records.forEach(r => {
      const month = (r.date || '').slice(0, 7);
      const key = month + '|' + r.category + '|' + r.type;
      if (!map[key]) map[key] = {
        month,
        category: r.category,
        type: r.type,
        minutes: 0,
        count: 0,
        times: 0
      };
      map[key].minutes += Number(r.minutes) || 0;
      map[key].count += Number(r.count) || 0;
      map[key].times += 1;
    });
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
  })();
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-5"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83C\uDFF7\uFE0F \u5DE5\u4F5C\u7C7B\u522B\u81EA\u5B9A\u4E49"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u589E\u5220\u6539\u5404\u7C7B\u522B\u4E0B\u7684\u5DE5\u4F5C\u7C7B\u578B\uFF0C\u5C06\u540C\u6B65\u5E94\u7528\u5230\u6253\u5361\u8868\u5355\u548C\u5DE5\u4F5C\u91CF\u770B\u677F"), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-2 gap-5"
  }, Object.keys(wt).map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat,
    className: "bg-cream rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold text-gray-700 mb-3"
  }, cat), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 mb-3"
  }, (wt[cat] || []).map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "flex items-center gap-2 bg-white rounded-lg px-3 py-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-sm text-gray-700"
  }, t), /*#__PURE__*/React.createElement("button", {
    onClick: () => renameType(cat, t),
    className: "text-xs text-gray-400 hover:text-primary"
  }, "\u6539\u540D"), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeType(cat, t),
    className: "text-xs text-gray-300 hover:text-red-400"
  }, "\u5220\u9664"))), (wt[cat] || []).length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 text-center py-2"
  }, "\u6682\u65E0\u7C7B\u578B")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\u65B0\u7C7B\u578B\u540D\u79F0",
    value: newType[cat] || '',
    onChange: e => setNewType(n => ({
      ...n,
      [cat]: e.target.value
    })),
    onKeyDown: e => e.key === 'Enter' && addType(cat)
  }), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => addType(cat),
    className: "shrink-0"
  }, "\u6DFB\u52A0")))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83D\uDCE6 \u6570\u636E\u5F52\u6863"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u5C06\u67D0\u65E5\u671F\u4E4B\u524D\u7684\u6240\u6709\u6253\u5361\u8BB0\u5F55\u548C\u5DF2\u5B8C\u6210\u5F85\u529E\u79FB\u5165\u5F52\u6863\u533A\uFF0C\u5F52\u6863\u533A\u53EF\u67E5\u770B\u4F46\u4E0D\u5728\u4E3B\u754C\u9762\u663E\u793A"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "\u5F52\u6863\u6B64\u65E5\u671F\u4E4B\u524D\u7684\u6570\u636E\uFF1A"), /*#__PURE__*/React.createElement(Input, {
    type: "date",
    className: "!w-44",
    value: archBefore,
    onChange: e => setArchBefore(e.target.value)
  }), /*#__PURE__*/React.createElement(BtnAccent, {
    onClick: () => archBefore ? setConfirmArch(true) : toast('请先选择日期', 'error')
  }, "\u6267\u884C\u5F52\u6863"), /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: loadArchive
  }, "\u67E5\u770B\u5F52\u6863\u533A"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83D\uDCCA \u6570\u636E\u5BFC\u51FA"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u6309\u300C\u6708\u4EFD \xD7 \u5DE5\u4F5C\u7C7B\u578B\u300D\u6C47\u603B\u7684\u5DE5\u4F5C\u91CF\u7EDF\u8BA1\u8868\uFF08\u4EC5\u5C55\u793A\uFF09"), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setShowExport(s => !s)
  }, showExport ? '收起统计表' : '生成统计表'), showExport && (exportData.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u6682\u65E0\u6253\u5361\u6570\u636E\u53EF\u7EDF\u8BA1"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto mt-4"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-cream text-gray-500 text-xs"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-left rounded-l-lg"
  }, "\u6708\u4EFD"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-left"
  }, "\u5DE5\u4F5C\u7C7B\u522B"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-left"
  }, "\u5DE5\u4F5C\u7C7B\u578B"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "\u6253\u5361\u6B21\u6570"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "\u603B\u65F6\u957F"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right rounded-r-lg"
  }, "\u603B\u6570\u91CF"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-gray-50"
  }, exportData.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "text-gray-600 hover:bg-cream/50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5"
  }, r.month), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5"
  }, /*#__PURE__*/React.createElement(Tag, {
    color: r.category === '本职工作' ? 'primary' : 'orange'
  }, r.category)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5"
  }, r.type), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-right"
  }, r.times), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-right font-medium"
  }, fmtMin(r.minutes)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-right"
  }, r.count || '—')))))))), /*#__PURE__*/React.createElement(Modal, {
    open: confirmArch,
    title: "\u26A0\uFE0F \u5F52\u6863\u786E\u8BA4",
    onClose: () => setConfirmArch(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BtnGhost, {
      onClick: () => setConfirmArch(false)
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(BtnAccent, {
      onClick: doArchive
    }, "\u786E\u8BA4\u5F52\u6863"))
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "\u5C06\u628A ", /*#__PURE__*/React.createElement("b", null, archBefore), " \u4E4B\u524D\u7684\u6240\u6709\u6253\u5361\u8BB0\u5F55\u548C\u5168\u90E8\u5DF2\u5B8C\u6210\u5F85\u529E\u79FB\u5165\u5F52\u6863\u533A\u3002\u5F52\u6863\u540E\u4E3B\u754C\u9762\u4E0E\u770B\u677F\u5C06\u4E0D\u518D\u7EDF\u8BA1\u8FD9\u4E9B\u6570\u636E\uFF0C\u786E\u5B9A\u7EE7\u7EED\u5417\uFF1F")), /*#__PURE__*/React.createElement(Modal, {
    open: showArchive,
    title: "\uD83D\uDCE6 \u5F52\u6863\u533A",
    onClose: () => setShowArchive(false),
    wide: true
  }, archive && /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-gray-700 mb-2"
  }, "\u5DF2\u5F52\u6863\u6253\u5361\u8BB0\u5F55\uFF08", archive.records.length, "\uFF09"), archive.records.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400"
  }, "\u6682\u65E0") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50 max-h-60 overflow-y-auto"
  }, archive.records.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.id,
    className: "py-2 text-sm text-gray-600 flex gap-3 items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400 shrink-0"
  }, r.date), /*#__PURE__*/React.createElement(Tag, {
    color: r.category === '本职工作' ? 'primary' : 'orange'
  }, r.category), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 truncate"
  }, r.type), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, fmtMin(r.minutes)))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-gray-700 mb-2"
  }, "\u5DF2\u5F52\u6863\u5F85\u529E\uFF08", archive.todos.length, "\uFF09"), archive.todos.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400"
  }, "\u6682\u65E0") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50 max-h-60 overflow-y-auto"
  }, archive.todos.map(t => /*#__PURE__*/React.createElement("li", {
    key: t.id,
    className: "py-2 text-sm text-gray-500 flex gap-3 items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "line-through flex-1 truncate"
  }, t.title), /*#__PURE__*/React.createElement(Tag, {
    color: PRIORITY_COLOR[t.priority]
  }, t.priority), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, t.due || ''))))))));
};