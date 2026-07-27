const B = 'http://localhost:3456';
const post = (p, body) => fetch(B + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
(async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await post('/api/records', { date: today, category: '本职工作', type: '心理咨询', minutes: 50, count: 2, note: '示例：个体咨询 2 例' });
    await post('/api/records', { date: today, category: '副业', type: '图文创作', minutes: 90, count: 1, note: '示例：公众号长文撰写' });
    await post('/api/todos', { title: '完成下周督导个案整理', category: '本职工作', priority: '高', due: today, done: false, note: '关联督导记录' });
    await post('/api/todos', { title: '剪辑本期对谈长视频', category: '副业', priority: '中', due: today, done: false });
    await post('/api/ideas', { content: '依恋理论如何解释成年人的"推拉"行为', tag: '心理学理论', status: '待孵化' });
    await post('/api/topics', { title: '为什么我们总在深夜 emo', type: '图文', status: '撰写中', platform: '公众号', due: today, outline: '1. 情绪与昼夜节律 2. 反刍思维 3. 三个小练习', script: '', link: '' });
    await post('/api/learnings', { date: today, type: '督导', topic: '危机个案的评估框架', gain: '学习了自杀风险的分层评估', minutes: 60 });
    console.log('seed data created OK');
  } catch (e) { console.error('seed failed', e.message); process.exit(1); }
})();
