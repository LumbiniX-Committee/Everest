// Focused regressions for area discovery and exact demo pause, without a phone.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
let tick;
function load(filename) {
  const resolved = [filename, `${filename}.ts`, path.join(filename, 'index.ts')].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!resolved) throw new Error(`Missing ${filename}`);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} };
  cache.set(resolved, module);
  const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const req = (name) => {
    if (name === '@/data') return { ...load(path.join(root, 'data/generated/sites')), ...load(path.join(root, 'data/demo/precincts')) };
    if (name.startsWith('@/')) return load(path.join(root, name.slice(2)));
    if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
    return require(name);
  };
  vm.runInNewContext(source, { module, exports: module.exports, require: req, console, __DEV__: false,
    setInterval: (callback) => { tick = callback; return 1; }, clearInterval: () => {},
  }, { filename: resolved });
  return module.exports;
}
const data = load(path.join(root, 'data/questExperiences'));
const { demoQuests } = load(path.join(root, 'data/demo/quests'));
const quests = demoQuests.map((quest) => ({ ...quest, progress: { status: 'not_started', completedTasks: [] } }));
const patan = data.questAreas.find((area) => area.id === 'patan-durbar-square');
const nearby = data.nearbyQuestAreas(patan.coordinate, quests);
assert.equal(nearby[0].id, patan.id);
assert.ok(nearby.every((area) => area.distanceM <= 5000));
assert.ok(nearby[0].quests.some((quest) => quest.tasks.some((task) => task.targetId === 'manga-hiti')));
assert.equal(data.nearbyQuestAreas({ latitude: 0, longitude: 0 }, quests).length, 0);
assert.equal(data.nearbyQuestAreas(null, quests).length, 0);
for (const quest of data.experienceQuests) {
  assert.ok(data.areaForQuest(quest), quest.id);
  assert.equal(quest.tasks.length, 1, 'One photo completes each visitor activity');
  assert.equal(data.isVantageTask(quest.tasks[0]), false, 'Ordinary experiences must use the memory camera');
}
assert.ok(demoQuests.find((q) => q.id === 'quest-patan-durbar-survey').tasks.some(data.isVantageTask));
const walk = load(path.join(root, 'services/location/demoWalk'));
walk.start();
tick();
const before = JSON.stringify(walk.currentStep());
walk.pause();
tick(); tick(); tick();
assert.equal(JSON.stringify(walk.currentStep()), before, 'Pause must retain the exact last emitted fix');
walk.resume(); tick();
assert.notEqual(JSON.stringify(walk.currentStep()), before, 'Resume must advance');
walk.pause();
walk.goToSite('patan-durbar-square');
const destination = JSON.stringify(walk.currentStep());
tick();
assert.equal(JSON.stringify(walk.currentStep()), destination, 'A selected paused place must stay selected');
walk.stop();
console.log(`PASS: ${data.experienceQuests.length} experiences, area discovery, vantage separation and exact pause/resume.`);
