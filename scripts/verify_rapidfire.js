const fs = require('fs');

console.log('🧪 Starting 140 Rapid-Fire Multi-Skill Rubric Verification Test Suite...');

// 1. Check index.html script tag & elements
const html = fs.readFileSync('index.html', 'utf8');
const includesScript = html.includes('js/data/rapidfire-rubric-data.js');
console.log('Includes js/data/rapidfire-rubric-data.js in index.html?', includesScript);
if (!includesScript) throw new Error('Missing script tag in index.html');

const includesNavTab = html.includes('data-target="rapidfire"');
console.log('Includes rapidfire nav tab button?', includesNavTab);
if (!includesNavTab) throw new Error('Missing rapidfire nav tab in index.html');

const includesSection = html.includes('id="section-rapidfire"');
console.log('Includes section-rapidfire container?', includesSection);
if (!includesSection) throw new Error('Missing section-rapidfire in index.html');

// 2. Mock DOM & load files
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {
  REVISION_APP_DATA: {},
  location: { hash: '' },
  localStorage: global.localStorage,
  addEventListener: () => {},
  scrollTo: () => {}
};
global.MindMapVisualizer = class {
  constructor() {}
  init() {}
};

let domContentLoadedCb = null;
global.document = {
  documentElement: { setAttribute: () => {} },
  getElementById: (id) => ({
    id,
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {},
    style: {},
    querySelectorAll: () => [],
    querySelector: () => null,
    scrollIntoView: () => {}
  }),
  querySelectorAll: () => [],
  addEventListener: (evt, cb) => {
    if (evt === 'DOMContentLoaded') domContentLoadedCb = cb;
  },
  body: { style: {} }
};

require('../js/data/rapidfire-rubric-data.js');

const categories = window.REVISION_APP_DATA.RAPIDFIRE_CATEGORIES;
const questions = window.REVISION_APP_DATA.RAPIDFIRE_QUESTIONS;

console.log('✓ Loaded', categories.length, 'categories');
console.log('✓ Loaded', questions.length, 'Rapid-Fire questions');

if (questions.length !== 140) {
  throw new Error(`Expected exactly 140 questions, found ${questions.length}`);
}

// 3. Verify each category has 20 questions
const expectedCats = ['java', 'spring', 'microservices', 'javascript', 'react', 'database', 'devops'];
expectedCats.forEach(catId => {
  const count = questions.filter(q => q.category === catId).length;
  console.log(`  - Category [${catId}]: ${count} questions`);
  if (count !== 20) throw new Error(`Category ${catId} does not have 20 questions (found ${count})`);
});

// 4. Validate schema of all 140 questions
questions.forEach((q, idx) => {
  const req = ['id', 'category', 'categoryName', 'skillNum', 'qNum', 'title', 'question', 'answer', 'targetSection', 'targetAnchor', 'status'];
  req.forEach(f => {
    if (q[f] === undefined || q[f] === null || q[f] === '') {
      throw new Error(`Question ${idx} (${q.id}) missing field: ${f}`);
    }
  });
});
console.log('✓ All 140 questions passed schema and integrity verification');

// 5. Test app methods
const appCode = fs.readFileSync('js/app.js', 'utf8');
eval(appCode);
if (domContentLoadedCb) domContentLoadedCb();
const app = window.app;

app.renderRapidFire();
app.filterRapidFireByCategory('java');
app.filterRapidFireByCategory('react');
app.searchRapidFire('intern');
app.buildSearchIndex();

const rfIndexEntries = app.searchIndex.filter(i => i.section === 'rapidfire');
console.log('✓ Search index properly indexed', rfIndexEntries.length, 'rapid-fire questions');
if (rfIndexEntries.length !== 140) {
  throw new Error(`Expected 140 search index entries for rapidfire, found ${rfIndexEntries.length}`);
}

console.log('\n🎉 ALL 140 RAPID-FIRE RUBRIC TESTS PASSED WITH 100% SUCCESS!');
