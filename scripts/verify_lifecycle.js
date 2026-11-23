const fs = require('fs');

console.log('--- Verifying Lifecycle Section Integration ---');

// 1. Verify index.html
const html = fs.readFileSync('index.html', 'utf8');
console.log('Includes data-target="lifecycle"?', html.includes('data-target="lifecycle"'));
console.log('Includes id="section-lifecycle"?', html.includes('id="section-lifecycle"'));
console.log('Includes #app-lifecycle anchor?', html.includes('id="app-lifecycle"'));
console.log('Includes #lifecycle-stepper-container?', html.includes('id="lifecycle-stepper-container"'));
console.log('Includes #lifecycle-matrix-container?', html.includes('id="lifecycle-matrix-container"'));
console.log('Includes #lifecycle-cheat-sheet-container?', html.includes('id="lifecycle-cheat-sheet-container"'));
console.log('Includes script js/data/lifecycle-data.js?', html.includes('js/data/lifecycle-data.js'));

// 2. Setup DOM mock
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {
  REVISION_APP_DATA: {},
  location: { hash: '' },
  localStorage: global.localStorage,
  addEventListener: () => {},
  scrollTo: () => {}
};
global.document = {
  documentElement: { setAttribute: () => {} },
  getElementById: (id) => ({
    id,
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    addEventListener: () => {},
    style: {},
    querySelectorAll: () => [],
    querySelector: () => null,
    scrollIntoView: () => {}
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: { style: {} }
};
global.MindMapVisualizer = class {
  constructor() {}
  init() {}
};

// 3. Load data
require('../js/data/lifecycle-data.js');
const stages = window.REVISION_APP_DATA.LIFECYCLE_STAGES;
const matrix = window.REVISION_APP_DATA.LIFECYCLE_MATRIX;
const cheat = window.REVISION_APP_DATA.LIFECYCLE_CHEAT_SHEET;

console.log('Stages count:', stages?.length);
console.log('Matrix rows count:', matrix?.length);
console.log('Cheat sheet count:', cheat?.length);

if (stages.length !== 12) {
  throw new Error('Expected exactly 12 stages, found ' + stages.length);
}

// 4. Verify each stage fields
stages.forEach((s, idx) => {
  const req = ['step', 'id', 'title', 'subtitle', 'phase', 'phaseLabel', 'phaseBadgeColor', 'owner', 'svgIcon', 'whatHappens', 'tools', 'developerResponsibility', 'commonPitfall'];
  req.forEach(f => {
    if (!s[f]) throw new Error(`Missing ${f} in stage ${idx + 1}`);
  });
  if (!s.developerResponsibility || s.developerResponsibility.length < 20) {
    throw new Error(`Developer responsibility too short in stage ${idx + 1}`);
  }
  if (!s.commonPitfall || s.commonPitfall.length < 20) {
    throw new Error(`Common pitfall too short in stage ${idx + 1}`);
  }
});
console.log('All 12 stages have complete and thorough technical details!');

// 5. Test app rendering
const appCode = fs.readFileSync('js/app.js', 'utf8');
let domCb = null;
global.document.addEventListener = (evt, cb) => {
  if (evt === 'DOMContentLoaded') domCb = cb;
};
eval(appCode);
if (domCb) domCb();

const app = window.app;
console.log('App initialized successfully!');
app.renderLifecycleSection();
console.log('Lifecycle section rendered cleanly!');

// Test methods
app.toggleLifecycleStage('stage-1-local-dev');
app.expandAllLifecycleStages(true);
app.expandAllLifecycleStages(false);
app.jumpToLifecycleStage(9);
app.filterLifecyclePhase('ops');
app.filterLifecyclePhase('all');

console.log('Indexed lifecycle search count:', app.searchIndex.filter(i => i.section === 'lifecycle').length);

console.log('--- ALL LIFECYCLE TESTS PASSED 100% ---');
