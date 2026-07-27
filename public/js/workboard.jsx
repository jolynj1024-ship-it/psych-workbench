/* 模块1：工作量看板 */
const { useState: wbUseState, useEffect: wbUseEffect, useMemo: wbUseMemo } = React;

window.WorkboardPage = function WorkboardPage({ workTypes }) {
  const [period, setPeriod] = wbUseState('week'); // week | month | year
  const [records, setRecords] = wbUseState([]);

  wbUseEffect(() => { API('/records').then(setRecords).catch(() => { }); }, []);

  const [start, end] = period === 'week' ? weekRange() : period === 'month' ? monthRange() : yearRange();
  const inRange = records.filter(r => r.date >= start && r.date <= end);
  const main = inRange.filter(r => r.category === '本职工作');
  const side = inRange.filter(r => r.category === '副业');

  const sumMin = (list, type) => list.filter(r => r.type === type).reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const sumCnt = (list, type) => list.filter(r => r.type === type).reduce((s, r) => s + (Number(r.count) || 0), 0);
  const toH = (m) => Math.round(m / 60 * 10) / 10;

  const mainTypes = workTypes?.['本职工作'] || [];
  const sideTypes = workTypes?.['副业'] || [];

  // 趋势数据：周/月按天，年按月
  const trend = wbUseMemo(() => {
    const labels = [], buckets = [];
    if (period === 'year') {
      for (let m = 0; m < 12; m++) {
        labels.push((m + 1) + '月');
        const pre = new Date().getFullYear() + '-' + String(m + 1).padStart(2, '0');
        buckets.push(r => r.date.startsWith(pre));
      }
    } else {
      const s = new Date(start), e = new Date(end);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const ds = fmtDate(d);
        labels.push(period === 'week' ? ['一', '二', '三', '四', '五', '六', '日'][(d.getDay() + 6) % 7] : d.getDate() + '');
        buckets.push(r => r.date === ds);
      }
    }
    return { labels, buckets };
  }, [period, start, end]);

  const COLORS = ['#2D9CDB', '#7B61FF', '#27AE60', '#F5A623', '#EB5757', '#56CCF2'];

  const mainTrendDatasets = mainTypes.map((t, i) => ({
    label: t,
    data: trend.buckets.map(f => toH(main.filter(f).filter(r => r.type === t).reduce((s, r) => s + (Number(r.minutes) || 0), 0))),
    borderColor: COLORS[i % COLORS.length], backgroundColor: COLORS[i % COLORS.length]
  }));
  const sideBarDatasets = sideTypes.map((t, i) => ({
    label: t,
    data: trend.buckets.map(f => side.filter(f).filter(r => r.type === t).reduce((s, r) => s + (Number(r.count) || 0), 0)),
    backgroundColor: COLORS[(i + 3) % COLORS.length], borderRadius: 6
  }));

  const PERIODS = [['week', '本周'], ['month', '本月'], ['year', '本年']];

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">📊 工作量看板 <span className="text-xs font-normal text-gray-400 ml-2">{start} ~ {end}</span></h2>
        <div className="flex bg-white rounded-xl shadow-soft p-1">
          {PERIODS.map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={'px-4 py-1.5 rounded-lg text-sm font-medium transition ' + (period === k ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 本职工作 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-4">🏥 本职工作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {mainTypes.map((t, i) => (
            <div key={t} className="bg-cream rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{t}</div>
              <div className="text-xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>{toH(sumMin(main, t))} <span className="text-xs font-normal text-gray-400">小时</span></div>
              {t === '心理咨询' && <div className="text-xs text-gray-400 mt-1">个案数：{sumCnt(main, t)}</div>}
            </div>
          ))}
          <div className="bg-cream rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">本职合计</div>
            <div className="text-xl font-bold text-gray-700">{toH(main.reduce((s, r) => s + (Number(r.minutes) || 0), 0))} <span className="text-xs font-normal text-gray-400">小时</span></div>
          </div>
        </div>
        {main.length === 0 ? <EmptyState text="该时间段还没有本职工作打卡记录" /> :
          <LineChart labels={trend.labels} datasets={mainTrendDatasets} height={240} />}
      </Card>

      {/* 副业 */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-4">🎬 副业创作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {sideTypes.map((t, i) => (
            <div key={t} className="bg-cream rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{t}</div>
              <div className="text-xl font-bold" style={{ color: COLORS[(i + 3) % COLORS.length] }}>{sumCnt(side, t)} <span className="text-xs font-normal text-gray-400">个</span></div>
              <div className="text-xs text-gray-400 mt-1">投入 {toH(sumMin(side, t))} 小时</div>
            </div>
          ))}
          <div className="bg-cream rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">副业总投入</div>
            <div className="text-xl font-bold text-gray-700">{toH(side.reduce((s, r) => s + (Number(r.minutes) || 0), 0))} <span className="text-xs font-normal text-gray-400">小时</span></div>
          </div>
        </div>
        {side.length === 0 ? <EmptyState text="该时间段还没有副业打卡记录" /> :
          <BarChart labels={trend.labels} datasets={sideBarDatasets} height={240} stacked />}
      </Card>

      <div className="text-xs text-gray-400 text-center pb-2">💡 所有数据由「今日工作台」的打卡记录自动汇总，无需重复录入</div>
    </div>
  );
};
