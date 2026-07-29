/* 模块4：灵感银行 */
const {
  useState: idUseState,
  useEffect: idUseEffect
} = React;
const IDEA_TAG_COLOR = {
  '心理学理论': 'purple',
  '热点话题': 'red',
  '生活观察': 'green',
  '读者提问': 'blue',
  '其他': 'gray'
};
const IDEA_ST_COLOR = {
  '待孵化': 'yellow',
  '已采用': 'green',
  '已归档': 'gray'
};
window.IdeasPage = function IdeasPage() {
  const [ideas, setIdeas] = idUseState([]);
  const [content, setContent] = idUseState('');
  const [tag, setTag] = idUseState(IDEA_TAGS[0]);
  const [editModal, setEditModal] = idUseState(null);
  const [delId, setDelId] = idUseState(null);
  const [kw, setKw] = idUseState('');
  const [fTag, setFTag] = idUseState('全部');
  const [fSt, setFSt] = idUseState('全部');
  const load = () => API('/ideas').then(setIdeas).catch(() => {});
  idUseEffect(() => {
    load();
  }, []);
  const add = async () => {
    if (!content.trim()) return toast('先写点什么再存入吧', 'error');
    try {
      await API('/ideas', 'POST', {
        content: content.trim(),
        tag,
        status: '待孵化'
      });
      toast('灵感已存入银行 💡');
      setContent('');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const update = async (idea, patch, msg) => {
    try {
      await API('/ideas/' + idea.id, 'PUT', patch);
      toast(msg || '已更新');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const del = async () => {
    try {
      await API('/ideas/' + delId, 'DELETE');
      toast('已删除');
      setDelId(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const toTopic = async idea => {
    try {
      await API('/topics', 'POST', {
        title: idea.content.slice(0, 50),
        type: '图文',
        status: '选题中',
        platform: '',
        due: '',
        outline: '来自灵感银行：' + idea.content,
        content: '',
        imageNeeds: '',
        link: ''
      });
      await API('/ideas/' + idea.id, 'PUT', {
        status: '已采用'
      });
      toast('已转为选题，可到「内容创作 · 选题管理」查看 🎉');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const list = ideas.filter(i => (fTag === '全部' || i.tag === fTag) && (fSt === '全部' || i.status === fSt) && (!kw || i.content.includes(kw)));
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-4"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-3"
  }, "\uD83D\uDCA1 \u7075\u611F\u901F\u8BB0"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\u95EA\u8FC7\u7684\u5FF5\u5934\u3001\u89C2\u5BDF\u5230\u7684\u73B0\u8C61\u3001\u60F3\u804A\u7684\u8BDD\u9898\u2026\u2026",
    value: content,
    onChange: e => setContent(e.target.value),
    onKeyDown: e => e.key === 'Enter' && add()
  })), /*#__PURE__*/React.createElement(Select, {
    className: "sm:!w-36",
    value: tag,
    onChange: e => setTag(e.target.value)
  }, IDEA_TAGS.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t))), /*#__PURE__*/React.createElement(BtnAccent, {
    onClick: add,
    className: "shrink-0"
  }, "\u5B58 \u5165"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800"
  }, "\u7075\u611F\u5217\u8868\uFF08", list.length, "\uFF09"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-[140px]"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uD83D\uDD0D \u641C\u7D22\u7075\u611F\u2026",
    value: kw,
    onChange: e => setKw(e.target.value)
  })), /*#__PURE__*/React.createElement(Select, {
    className: "!w-32",
    value: fTag,
    onChange: e => setFTag(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), IDEA_TAGS.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t))), /*#__PURE__*/React.createElement(Select, {
    className: "!w-28",
    value: fSt,
    onChange: e => setFSt(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5168\u90E8"), IDEA_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), list.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u7075\u611F\u94F6\u884C\u8FD8\u662F\u7A7A\u7684\uFF0C\u628A\u7B2C\u4E00\u4E2A\u5FF5\u5934\u5B58\u8FDB\u6765\u5427"
  }) : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-gray-50"
  }, list.map(i => /*#__PURE__*/React.createElement("li", {
    key: i.id,
    className: "py-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-700"
  }, i.content), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-1.5 flex-wrap"
  }, /*#__PURE__*/React.createElement(Tag, {
    color: IDEA_TAG_COLOR[i.tag]
  }, i.tag), /*#__PURE__*/React.createElement(Tag, {
    color: IDEA_ST_COLOR[i.status]
  }, i.status), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-300"
  }, (i.createdAt || '').slice(0, 16).replace('T', ' ')))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1 justify-end shrink-0"
  }, i.status === '待孵化' && /*#__PURE__*/React.createElement("button", {
    onClick: () => toTopic(i),
    className: "px-2.5 py-1 rounded-lg text-xs bg-accent/10 text-accent hover:bg-accent hover:text-white transition font-medium"
  }, "\u8F6C\u9009\u9898"), i.status !== '已采用' && /*#__PURE__*/React.createElement("button", {
    onClick: () => update(i, {
      status: '已采用'
    }, '已标记为采用'),
    className: "px-2.5 py-1 rounded-lg text-xs text-emerald-500 hover:bg-emerald-50"
  }, "\u91C7\u7528"), i.status !== '已归档' && /*#__PURE__*/React.createElement("button", {
    onClick: () => update(i, {
      status: '已归档'
    }, '已归档'),
    className: "px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:bg-gray-50"
  }, "\u5F52\u6863"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditModal({
      ...i
    }),
    className: "px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:text-primary"
  }, "\u7F16\u8F91"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDelId(i.id),
    className: "px-2.5 py-1 rounded-lg text-xs text-gray-300 hover:text-red-400"
  }, "\u5220\u9664"))))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!editModal,
    title: "\u7F16\u8F91\u7075\u611F",
    onClose: () => setEditModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BtnGhost, {
      onClick: () => setEditModal(null)
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Btn, {
      onClick: async () => {
        if (!editModal.content.trim()) return toast('内容不能为空', 'error');
        await update(editModal, {
          content: editModal.content,
          tag: editModal.tag,
          status: editModal.status
        }, '灵感已更新');
        setEditModal(null);
      }
    }, "\u4FDD\u5B58"))
  }, editModal && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Field, {
    label: "\u5185\u5BB9"
  }, /*#__PURE__*/React.createElement(TextArea, {
    rows: "3",
    value: editModal.content,
    onChange: e => setEditModal(m => ({
      ...m,
      content: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u6807\u7B7E"
  }, /*#__PURE__*/React.createElement(Select, {
    value: editModal.tag,
    onChange: e => setEditModal(m => ({
      ...m,
      tag: e.target.value
    }))
  }, IDEA_TAGS.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement(Field, {
    label: "\u72B6\u6001"
  }, /*#__PURE__*/React.createElement(Select, {
    value: editModal.status,
    onChange: e => setEditModal(m => ({
      ...m,
      status: e.target.value
    }))
  }, IDEA_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))))))), /*#__PURE__*/React.createElement(Confirm, {
    open: !!delId,
    onClose: () => setDelId(null),
    onOk: del
  }));
};