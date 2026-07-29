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
  const [syncText, setSyncText] = stUseState('');
  const [importText, setImportText] = stUseState('');
  const [notifPerm, setNotifPerm] = stUseState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [canInstall, setCanInstall] = stUseState(false);
  stUseEffect(() => {
    const h = () => setCanInstall(!!window.__deferredPrompt);
    window.addEventListener('pw-installable', h);
    window.addEventListener('pw-installed', h);
    setCanInstall(!!window.__deferredPrompt);
    return () => {
      window.removeEventListener('pw-installable', h);
      window.removeEventListener('pw-installed', h);
    };
  }, []);
  const isInstalled = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;

  // 云端同步（GitHub）配置
  const [gh, setGh] = stUseState({
    enabled: localStorage.getItem('pw_gh_enabled') === '1',
    token: localStorage.getItem('pw_gh_token') || '',
    repo: localStorage.getItem('pw_gh_repo') || '',
    branch: localStorage.getItem('pw_gh_branch') || 'main'
  });
  const [ghStatus, setGhStatus] = stUseState('');
  const [ghBusy, setGhBusy] = stUseState(false);
  const saveGh = async () => {
    setGhBusy(true);
    setGhStatus('');
    localStorage.setItem('pw_gh_enabled', gh.enabled ? '1' : '0');
    localStorage.setItem('pw_gh_token', gh.token.trim());
    localStorage.setItem('pw_gh_repo', gh.repo.trim());
    localStorage.setItem('pw_gh_branch', gh.branch.trim() || 'main');
    try {
      await window.GHSync.test();
      setGhStatus('✅ 连接成功，数据已拉取并启用同步');
      toast('GitHub 同步已启用', 'success');
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      setGhStatus('❌ 连接失败：' + e.message + '（请检查仓库名 / 令牌权限）');
      toast(e.message, 'error');
    } finally {
      setGhBusy(false);
    }
  };
  const uploadLocal = async () => {
    setGhBusy(true);
    try {
      await window.GHSync.uploadLocal();
      toast('本地数据已上传到云端', 'success');
      setGhStatus('✅ 本地数据已上传');
    } catch (e) {
      toast(e.message, 'error');
      setGhStatus('❌ 上传失败：' + e.message);
    } finally {
      setGhBusy(false);
    }
  };
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
  }, "\u2601\uFE0F \u4E91\u7AEF\u540C\u6B65\uFF08GitHub \xB7 \u591A\u8BBE\u5907\u5B9E\u65F6\uFF09"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u542F\u7528\u540E\uFF0C\u6240\u6709\u6570\u636E\u96C6\u4E2D\u4FDD\u5B58\u5728\u4F60 GitHub \u4ED3\u5E93\u7684 ", /*#__PURE__*/React.createElement("code", null, "data.json"), "\u3002\u624B\u673A\u548C\u7535\u8111\u6253\u5F00\u540C\u4E00\u4E2A\u7F51\u5740\uFF0C\u6539\u4E00\u5904\u7EA6 20 \u79D2\u5185\u5176\u4ED6\u8BBE\u5907\u81EA\u52A8\u5237\u65B0\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-gray-600"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: gh.enabled,
    onChange: e => setGh(g => ({
      ...g,
      enabled: e.target.checked
    })),
    className: "w-4 h-4"
  }), "\u542F\u7528 GitHub \u4E91\u7AEF\u540C\u6B65"), /*#__PURE__*/React.createElement(Field, {
    label: "GitHub \u4ED3\u5E93\uFF08\u683C\u5F0F\uFF1A\u7528\u6237\u540D/\u4ED3\u5E93\u540D\uFF09"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\u4F8B\u5982 jolynj1024-ship-it/psych-workbench",
    value: gh.repo,
    onChange: e => setGh(g => ({
      ...g,
      repo: e.target.value
    }))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u5206\u652F\uFF08\u9ED8\u8BA4 main\uFF09"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "main",
    value: gh.branch,
    onChange: e => setGh(g => ({
      ...g,
      branch: e.target.value
    }))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u8BBF\u95EE\u4EE4\u724C\uFF08Fine-grained PAT\uFF0C\u9700 Contents \u8BFB\u5199\u6743\u9650\uFF09"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "password",
    placeholder: "github_pat_...",
    value: gh.token,
    onChange: e => setGh(g => ({
      ...g,
      token: e.target.value
    }))
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-gray-400 mt-1"
  }, "\u5728 GitHub \u2192 Settings \u2192 Developer settings \u2192 Fine-grained tokens \u65B0\u5EFA\uFF0C\u4EC5\u6388\u6743\u672C\u4ED3\u5E93\u7684 Contents \u8BFB\u5199\u3002", /*#__PURE__*/React.createElement("a", {
    href: "https://github.com/settings/tokens?type=beta",
    target: "_blank",
    rel: "noreferrer",
    className: "text-primary underline"
  }, "\u53BB\u521B\u5EFA"))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 items-center"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: saveGh,
    disabled: ghBusy
  }, "\uD83D\uDCBE \u4FDD\u5B58\u5E76\u8FDE\u63A5\u6D4B\u8BD5"), /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: uploadLocal,
    disabled: ghBusy
  }, "\u2B06\uFE0F \u4E0A\u4F20\u672C\u5730\u6682\u5B58\u5230\u4E91\u7AEF"), ghStatus && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500"
  }, ghStatus)), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-gray-400"
  }, "\u6700\u540E\u540C\u6B65\uFF1A", window.GHSync.lastSync() ? new Date(window.GHSync.lastSync()).toLocaleString() : '尚未同步'))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83C\uDF19 \u665A\u95F4\u6253\u5361\u63D0\u9192"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u6BCF\u5929\u5230\u70B9\u81EA\u52A8\u5F39\u51FA\u6253\u5361\u7A97\u53E3\uFF0C\u63D0\u9192\u4F60\u8BB0\u5F55\u5F53\u5929\u72B6\u6001\u4E0E\u611F\u609F\u3002\u9700\u4FDD\u6301\u5DE5\u4F5C\u53F0\u6807\u7B7E\u9875\u5904\u4E8E\u6253\u5F00\u72B6\u6001\u3002"), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-gray-600 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: localStorage.getItem('pw_remind_enabled') !== '0',
    onChange: e => localStorage.setItem('pw_remind_enabled', e.target.checked ? '1' : '0'),
    className: "w-4 h-4"
  }), "\u542F\u7528\u6BCF\u665A\u6253\u5361\u63D0\u9192\uFF08\u9ED8\u8BA4\u5F00\u542F\uFF09"), /*#__PURE__*/React.createElement(Field, {
    label: "\u63D0\u9192\u65F6\u95F4\uFF0824 \u5C0F\u65F6\u5236\uFF09"
  }, /*#__PURE__*/React.createElement(Select, {
    value: Number(localStorage.getItem('pw_remind_hour') || 22),
    onChange: e => localStorage.setItem('pw_remind_hour', e.target.value),
    className: "!w-32"
  }, [17, 18, 19, 20, 21, 22, 23].map(h => /*#__PURE__*/React.createElement("option", {
    key: h,
    value: h
  }, String(h).padStart(2, '0') + ':00')))), /*#__PURE__*/React.createElement("div", {
    className: "mt-1"
  }, notifPerm === 'granted' ? /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-emerald-600"
  }, "\uD83D\uDD14 \u7CFB\u7EDF\u901A\u77E5\u5DF2\u5F00\u542F\uFF08\u5230\u70B9\u4F1A\u5F39\u7CFB\u7EDF\u63D0\u9192\uFF09") : notifPerm === 'unsupported' ? /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u7CFB\u7EDF\u901A\u77E5") : /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: async () => {
      try {
        const p = await Notification.requestPermission();
        setNotifPerm(p);
        if (p === 'granted') toast('已开启系统通知，到点会弹提醒', 'success');
      } catch (e) {}
    }
  }, "\uD83D\uDD14 \u5141\u8BB8\u7CFB\u7EDF\u901A\u77E5\uFF08\u8BA9\u63D0\u9192\u66F4\u663E\u773C\uFF09")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-gray-400"
  }, "\u8BF4\u660E\uFF1A\u7F51\u9875\u5728\u6D4F\u89C8\u5668\u5B8C\u5168\u5173\u95ED\u65F6\u65E0\u6CD5\u5F39\u51FA\u63D0\u9192\uFF0C\u8BF7\u8BA9\u6807\u7B7E\u9875\u4FDD\u6301\u6253\u5F00\uFF1B\u82E5\u5230\u70B9\u65F6\u9875\u9762\u5F00\u7740\uFF0C\u4F1A\u81EA\u52A8\u5F39\u51FA\u6253\u5361\u7A97\u53E3\u3002")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\uD83D\uDCF2 \u5B89\u88C5\u5230\u684C\u9762 / \u624B\u673A"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u628A\u5DE5\u4F5C\u53F0\u5B89\u88C5\u6210 App\uFF1A\u624B\u673A\u300C\u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D\u3001\u7535\u8111\u6D4F\u89C8\u5668\u70B9\u300C\u5B89\u88C5\u300D\uFF0C\u4E4B\u540E\u50CF\u539F\u751F\u5E94\u7528\u4E00\u6837\u76F4\u63A5\u4ECE\u56FE\u6807\u6253\u5F00\uFF0C\u4E0D\u5FC5\u518D\u8F93\u5165\u7F51\u5740\u3002"), isInstalled ? /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-emerald-600"
  }, "\u2705 \u5DF2\u5B89\u88C5\u4E3A\u72EC\u7ACB\u5E94\u7528") : canInstall ? /*#__PURE__*/React.createElement(Btn, {
    onClick: async () => {
      const ok = await window.promptInstall();
      if (!ok) toast('已取消安装', 'info');
    }
  }, "\uD83D\uDCF2 \u70B9\u51FB\u5B89\u88C5\u5230\u672C\u8BBE\u5907") : /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400"
  }, "\u82E5\u672A\u51FA\u73B0\u300C\u5B89\u88C5\u300D\u6309\u94AE\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u83DC\u5355\u91CC\u9009\u300C\u5B89\u88C5\u5E94\u7528 / \u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D\uFF08Chrome / Edge / Safari \u5747\u652F\u6301\uFF09\u3002")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
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
  }, "\uD83D\uDCCA \u5DE5\u4F5C\u91CF\u7EDF\u8BA1"), /*#__PURE__*/React.createElement("p", {
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
  }, r.count || '—')))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-1"
  }, "\u2601\uFE0F \u6570\u636E\u540C\u6B65\uFF08\u8DE8\u8BBE\u5907 / \u8FDC\u7A0B\uFF09"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, "\u5728\u624B\u673A\u4E0E\u7535\u8111\u95F4\u540C\u6B65\u5168\u90E8\u6570\u636E\u3002\u63A8\u8350\u7528\u300C\u65B9\u5F0F\u4E00\xB7\u590D\u5236\u6587\u672C\u300D\uFF0C\u53EF\u76F4\u63A5\u7C98\u8D34\u8FDB\u5FAE\u4FE1/\u90AE\u4EF6\uFF0C\u5F7B\u5E95\u907F\u5F00\u624B\u673A\u627E\u4E0D\u5230\u6587\u4EF6\u7684\u95EE\u9898\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "bg-cream rounded-xl p-4 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold text-gray-700 mb-2"
  }, "\u65B9\u5F0F\u4E00\uFF1A\u590D\u5236\u6587\u672C\uFF08\u63A8\u8350\uFF0C\u9002\u5408\u5FAE\u4FE1 / \u90AE\u4EF6\uFF09"), /*#__PURE__*/React.createElement("ol", {
    className: "text-xs text-gray-500 list-decimal list-inside space-y-1 mb-3"
  }, /*#__PURE__*/React.createElement("li", null, "\u5728\u672C\u8BBE\u5907\u70B9\u300C\u751F\u6210\u5BFC\u51FA\u6587\u672C\u300D\uFF0C\u518D\u70B9\u300C\u590D\u5236\u6587\u672C\u300D"), /*#__PURE__*/React.createElement("li", null, "\u7C98\u8D34\u5230\u5FAE\u4FE1\u53D1\u7ED9\u53E6\u4E00\u53F0\u8BBE\u5907\uFF08\u6216\u90AE\u4EF6\u7B49\u4EFB\u610F\u6E20\u9053\uFF09"), /*#__PURE__*/React.createElement("li", null, "\u5728\u53E6\u4E00\u53F0\u8BBE\u5907\uFF0C\u628A\u6587\u672C\u7C98\u8FDB\u4E0B\u65B9\u8F93\u5165\u6846\uFF0C\u70B9\u300C\u7C98\u8D34\u5E76\u5BFC\u5165\u300D")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-2"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: async () => {
      try {
        const d = await window.exportData();
        setSyncText(JSON.stringify(d, null, 2));
        toast('已生成，请点「复制文本」', 'success');
      } catch (e) {
        toast(e.message, 'error');
      }
    }
  }, "\uD83D\uDCCB \u751F\u6210\u5BFC\u51FA\u6587\u672C"), /*#__PURE__*/React.createElement(BtnGhost, {
    onClick: () => {
      if (!syncText) return toast('请先生成文本', 'error');
      try {
        navigator.clipboard.writeText(syncText);
        toast('已复制到剪贴板，去微信粘贴吧', 'success');
      } catch (e) {
        toast('复制失败，请手动长按文本框全选复制', 'error');
      }
    },
    disabled: !syncText
  }, "\uD83D\uDCC4 \u590D\u5236\u6587\u672C")), syncText && /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: syncText,
    onFocus: e => e.target.select(),
    className: "w-full h-24 text-[11px] font-mono bg-white border border-gray-200 rounded-xl p-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: 4,
    placeholder: "\u628A\u4ECE\u53E6\u4E00\u53F0\u8BBE\u5907\u590D\u5236\u6765\u7684\u6587\u672C\uFF0C\u7C98\u8D34\u5230\u8FD9\u91CC\u2026",
    value: importText,
    onChange: e => setImportText(e.target.value)
  }), /*#__PURE__*/React.createElement(BtnAccent, {
    className: "mt-2",
    onClick: async () => {
      if (!importText.trim()) return toast('请先粘贴文本', 'error');
      try {
        const data = JSON.parse(importText);
        await API('/sync', 'POST', data);
        setImportText('');
        toast('导入成功，请刷新页面', 'success');
      } catch (err) {
        toast('导入失败：文本格式不正确', 'error');
      }
    }
  }, "\uD83D\uDCE5 \u7C98\u8D34\u5E76\u5BFC\u5165"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-cream rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold text-gray-700 mb-2"
  }, "\u65B9\u5F0F\u4E8C\uFF1A\u5BFC\u51FA / \u5BFC\u5165\u6587\u4EF6"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-3"
  }, "\u82E5\u624B\u673A\u80FD\u76F4\u63A5\u8BBF\u95EE\u4E0B\u8F7D\u7684 .json \u6587\u4EF6\uFF08\u5982\u901A\u8FC7\u624B\u673A\u6587\u4EF6\u7BA1\u7406\u5668\uFF09\uFF0C\u53EF\u7528\u6B64\u65B9\u5F0F\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => window.exportData()
  }, "\uD83D\uDCE4 \u5BFC\u51FA\u6587\u4EF6"), /*#__PURE__*/React.createElement("label", {
    className: "px-4 py-2 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium cursor-pointer hover:bg-primary/5 transition"
  }, "\uD83D\uDCE5 \u9009\u62E9\u6587\u4EF6\u5BFC\u5165", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json,application/json",
    className: "hidden",
    onChange: e => {
      const f = e.target.files[0];
      if (f) window.importData(f);
    }
  }))))), /*#__PURE__*/React.createElement(Modal, {
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