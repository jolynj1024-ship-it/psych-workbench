const B = 'http://localhost:3456';
(async () => {
  try {
    // 1) index references dist3
    const html = await (await fetch(B + '/')).text();
    console.log('index refs dist3:', html.includes('dist3/'));
    console.log('index has cdn:', /cdn\./.test(html));

    // 2) dist3/core.js reachable
    const core = await fetch(B + '/dist3/core.js');
    console.log('dist3/core.js status:', core.status);

    // 3) /api/sync GET (should return object with workTypes)
    const snap = await (await fetch(B + '/api/sync')).json();
    console.log('sync GET has workTypes:', !!snap.workTypes, '| records:', Array.isArray(snap.records));

    // 4) POST a record via normal CRUD, then verify it appears in /sync snapshot
    const created = await (await fetch(B + '/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: '2026-07-27', category: '本职工作', type: '心理咨询', minutes: 40, count: 1, note: 'sync-test' }) })).json();
    console.log('created record id:', created.id);
    const snap2 = await (await fetch(B + '/api/sync')).json();
    console.log('sync GET reflects new record:', snap2.records.some(r => r.id === created.id));

    // 5) POST /api/sync to replace records with a known set, then confirm
    const payload = { workTypes: snap.workTypes, records: [{ id: 'x1', date: '2026-07-27', category: '副业', type: '图文创作', minutes: 20, count: 1 }], todos: [], topics: [], ideas: [], learnings: [], collabs: [], scripts: [], archive: { records: [], todos: [] } };
    const r = await (await fetch(B + '/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
    console.log('sync POST ok:', r.ok);
    const snap3 = await (await fetch(B + '/api/sync')).json();
    console.log('sync replaced records count:', snap3.records.length, '| has x1:', snap3.records.some(x => x.id === 'x1'));

    // 6) restore empty-ish state
    const restore = { workTypes: snap.workTypes, records: [], todos: [], topics: [], ideas: [], learnings: [], collabs: [], scripts: [], archive: { records: [], todos: [] } };
    await fetch(B + '/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restore) });
    console.log('restored clean state ok');
  } catch (e) {
    console.error('FAIL', e.message);
    process.exit(1);
  }
})();
