/* 模块1：工作量看板 */
const {
  useState: wbUseState,
  useEffect: wbUseEffect,
  useMemo: wbUseMemo
} = React;
window.WorkboardPage = function WorkboardPage({
  workTypes
}) {
  const [period, setPeriod] = wbUseState('week'); // week | month | year
  const [records, setRecords] = wbUseState([]);
  wbUseEffect(() => {
    API('/records').then(setRecords).catch(() => {});
  }, []);
  const [start, end] = period === 'week' ? weekRange() : period === 'month' ? monthRange() : yearRange();
  const inRange = records.filter(r => r.date >= start && r.date <= end);
  const main = inRange.filter(r => r.category === '本职工作');
  const side = inRange.filter(r => r.category === '副业');
  const sumMin = (list, type) => list.filter(r => r.type === type).reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const sumCnt = (list, type) => list.filter(r => r.type === type).reduce((s, r) => s + (Number(r.count) || 0), 0);
  const toH = m => Math.round(m / 60 * 10) / 10;
  const mainTypes = workTypes?.['本职工作'] || [];
  const sideTypes = workTypes?.['副业'] || [];

  // 趋势数据：周/月按天，年按月
  const trend = wbUseMemo(() => {
    const labels = [],
      buckets = [];
    if (period === 'year') {
      for (let m = 0; m < 12; m++) {
        labels.push(m + 1 + '月');
        const pre = new Date().getFullYear() + '-' + String(m + 1).padStart(2, '0');
        buckets.push(r => r.date.startsWith(pre));
      }
    } else {
      const s = new Date(start),
        e = new Date(end);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const ds = fmtDate(d);
        labels.push(period === 'week' ? ['一', '二', '三', '四', '五', '六', '日'][(d.getDay() + 6) % 7] : d.getDate() + '');
        buckets.push(r => r.date === ds);
      }
    }
    return {
      labels,
      buckets
    };
  }, [period, start, end]);
  const COLORS = ['#2D9CDB', '#7B61FF', '#27AE60', '#F5A623', '#EB5757', '#56CCF2'];
  const mainTrendDatasets = mainTypes.map((t, i) => ({
    label: t,
    data: trend.buckets.map(f => toH(main.filter(f).filter(r => r.type === t).reduce((s, r) => s + (Number(r.minutes) || 0), 0))),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length]
  }));
  const sideBarDatasets = sideTypes.map((t, i) => ({
    label: t,
    data: trend.buckets.map(f => side.filter(f).filter(r => r.type === t).reduce((s, r) => s + (Number(r.count) || 0), 0)),
    backgroundColor: COLORS[(i + 3) % COLORS.length],
    borderRadius: 6
  }));
  const PERIODS = [['week', '本周'], ['month', '本月'], ['year', '本年']];
  return /*#__PURE__*/React.createElement("div", {
    className: "fade-in space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold text-gray-800"
  }, "\uD83D\uDCCA \u5DE5\u4F5C\u91CF\u770B\u677F ", /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-gray-400 ml-2"
  }, start, " ~ ", end)), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-white rounded-xl shadow-soft p-1"
  }, PERIODS.map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setPeriod(k),
    className: 'px-4 py-1.5 rounded-lg text-sm font-medium transition ' + (period === k ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50')
  }, label)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-4"
  }, "\uD83C\uDFE5 \u672C\u804C\u5DE5\u4F5C"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
  }, mainTypes.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "bg-cream rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500 mb-1"
  }, t), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: COLORS[i % COLORS.length]
    }
  }, toH(sumMin(main, t)), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-gray-400"
  }, "\u5C0F\u65F6")), t === '心理咨询' && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mt-1"
  }, "\u4E2A\u6848\u6570\uFF1A", sumCnt(main, t)))), /*#__PURE__*/React.createElement("div", {
    className: "bg-cream rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500 mb-1"
  }, "\u672C\u804C\u5408\u8BA1"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold text-gray-700"
  }, toH(main.reduce((s, r) => s + (Number(r.minutes) || 0), 0)), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-gray-400"
  }, "\u5C0F\u65F6")))), main.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u8BE5\u65F6\u95F4\u6BB5\u8FD8\u6CA1\u6709\u672C\u804C\u5DE5\u4F5C\u6253\u5361\u8BB0\u5F55"
  }) : /*#__PURE__*/React.createElement(LineChart, {
    labels: trend.labels,
    datasets: mainTrendDatasets,
    height: 240
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800 mb-4"
  }, "\uD83C\uDFAC \u526F\u4E1A\u521B\u4F5C"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
  }, sideTypes.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "bg-cream rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500 mb-1"
  }, t), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: COLORS[(i + 3) % COLORS.length]
    }
  }, sumCnt(side, t), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-gray-400"
  }, "\u4E2A")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 mt-1"
  }, "\u6295\u5165 ", toH(sumMin(side, t)), " \u5C0F\u65F6"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-cream rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500 mb-1"
  }, "\u526F\u4E1A\u603B\u6295\u5165"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold text-gray-700"
  }, toH(side.reduce((s, r) => s + (Number(r.minutes) || 0), 0)), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-gray-400"
  }, "\u5C0F\u65F6")))), side.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    text: "\u8BE5\u65F6\u95F4\u6BB5\u8FD8\u6CA1\u6709\u526F\u4E1A\u6253\u5361\u8BB0\u5F55"
  }) : /*#__PURE__*/React.createElement(BarChart, {
    labels: trend.labels,
    datasets: sideBarDatasets,
    height: 240,
    stacked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-400 text-center pb-2"
  }, "\uD83D\uDCA1 \u6240\u6709\u6570\u636E\u7531\u300C\u4ECA\u65E5\u5DE5\u4F5C\u53F0\u300D\u7684\u6253\u5361\u8BB0\u5F55\u81EA\u52A8\u6C47\u603B\uFF0C\u65E0\u9700\u91CD\u590D\u5F55\u5165"));
};