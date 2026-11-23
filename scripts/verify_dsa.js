/**
 * verify_dsa.js
 * End-to-end verification test for DSA Patterns, Decision Matrices & System Structures.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('🧪 Starting DSA Patterns & Problem Finding Master Test Suite...\n');

// 1. Setup mock browser environment
global.window = {
  REVISION_APP_DATA: {},
  location: { hash: '', origin: 'http://localhost:8000', pathname: '/' },
  addEventListener: () => {},
  scrollTo: () => {}
};
global.document = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        innerHTML: '',
        value: '',
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          toggle(c, val) { if (val) this.classes.add(c); else this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        querySelectorAll() { return []; },
        querySelector() { return null; },
        addEventListener() { },
        scrollIntoView() { },
        setAttribute() { }
      };
    }
    return this.elements[id];
  },
  querySelectorAll() { return []; },
  addEventListener() {},
  documentElement: {
    setAttribute() {},
    getAttribute() { return 'dark'; }
  },
  body: { style: {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// 2. Load Data Files
require('../js/data/topics.js');
require('../js/data/dsa-data.js');

const dsaTopics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
const dsaCategories = window.REVISION_APP_DATA?.DSA_CATEGORIES || [];

console.log(`✓ Loaded ${dsaTopics.length} DSA Topics across ${dsaCategories.length} Categories`);
assert(dsaTopics.length >= 29, `Expected at least 29 topics, found ${dsaTopics.length}`);

// 3. Verify Topic Schema and Technical Depth
dsaTopics.forEach(t => {
  assert(t.id, `Missing id on topic`);
  assert(t.title, `Missing title on ${t.id}`);
  assert(t.category, `Missing category on ${t.id}`);
  assert(t.whatIsIt || t.summary, `Missing whatIsIt/summary on ${t.id}`);
  assert(t.visualDiagram && t.visualDiagram.includes('visual-diagram-box'), `Missing visual diagram on ${t.id}`);
  assert(Array.isArray(t.keyPoints) && t.keyPoints.length >= 3, `Key points must have >= 3 items on ${t.id}`);
  assert(t.codeSnippet && t.codeSnippet.length > 20, `Missing codeSnippet on ${t.id}`);
  assert(t.pitfall, `Missing pitfall on ${t.id}`);
  assert(t.interviewTip, `Missing interviewTip on ${t.id}`);
});
console.log('✓ All DSA topics passed schema, code snippet & visual diagram verification');

// Verify Algorithmic Patterns specifically have Brute Force & Optimal Strategy
const algoPatterns = dsaTopics.filter(t => t.id.startsWith('dsa-'));
console.log(`✓ Validating ${algoPatterns.length} Core Algorithmic Patterns...`);
algoPatterns.forEach(p => {
  assert(Array.isArray(p.triggerSignals) && p.triggerSignals.length >= 3, `Missing trigger signals on ${p.id}`);
  assert(p.bruteForce && p.bruteForce.length > 30, `Missing brute force on ${p.id}`);
  assert(p.optimalStrategy && p.optimalStrategy.length > 30, `Missing optimal strategy on ${p.id}`);
  assert(p.canonicalProblems && p.canonicalProblems.length > 10, `Missing canonical problems on ${p.id}`);
});
console.log('✓ All Core Algorithmic Patterns contain trigger signals, brute force analysis, optimal strategy, and LeetCode problems');

// 4. Verify index.html Markup
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const requiredIds = [
  'section-dsa',
  'dsa-cards-container',
  'dsa-select',
  'dsa-search',
  'dsa-active-banner',
  'dsa-modal-overlay',
  'dsa-modal-title',
  'dsa-modal-body'
];

requiredIds.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `index.html missing required id="${id}"`);
});

assert(indexHtml.includes('js/data/dsa-data.js'), 'index.html missing script tag for dsa-data.js');
assert(indexHtml.includes('Input Size (N) to Target Big-O Complexity Mapping'), 'index.html missing Big-O constraint table');
assert(indexHtml.includes('Problem Keyword &amp; Signal Decision Matrix'), 'index.html missing Pattern finding decision matrix');

console.log('✓ All index.html containers, decision matrix tables & modal elements verified');

// 5. Test App Engine Methods
const MindMapVisualizer = function() { return { init() {}, renderMap() {} }; };
global.MindMapVisualizer = MindMapVisualizer;

const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
vm.runInThisContext(appContent);

const app = window.app || new RevisionApp();
app.buildSearchIndex();

// Verify search index
const indexedDsa = app.searchIndex.filter(i => i.section === 'dsa');
assert.strictEqual(indexedDsa.length, dsaTopics.length, `Expected ${dsaTopics.length} indexed DSA topics, got ${indexedDsa.length}`);
console.log(`✓ Search index properly indexed ${indexedDsa.length} DSA topics with keyword signals`);

// Test Selector
app.renderDsaPatternsSelector();
const selectElem = document.getElementById('dsa-select');
assert(selectElem.innerHTML.includes('optgroup'), 'DSA selector should contain optgroup elements');

// Test All & Category Rendering
app.renderDsaTopics('all');
const dsaContainer = document.getElementById('dsa-cards-container');
assert(dsaContainer.innerHTML.includes('dsa-two-pointers'), 'DSA container should render dsa-two-pointers');
assert(dsaContainer.innerHTML.includes('lru-cache-implementation'), 'DSA container should render lru-cache-implementation');

app.renderDsaTopics('pointers');
assert(dsaContainer.innerHTML.includes('dsa-sliding-window'), 'Pointers category should include Sliding Window');
assert(!dsaContainer.innerHTML.includes('dsa-graph-dijkstra'), 'Pointers category should NOT include Dijkstra');

app.renderDsaTopics('dp');
assert(dsaContainer.innerHTML.includes('dsa-dp-1d-kadane'), 'DP category should include Kadane');
assert(dsaContainer.innerHTML.includes('dsa-backtracking'), 'DP category should include Backtracking');

// Test Single Pattern Selection
app.selectDsaPattern('dsa-monotonic-stack');
assert(dsaContainer.innerHTML.includes('dsa-monotonic-stack'), 'selectDsaPattern should render Monotonic Stack');

// Test Modal Open / Close
app.openDsaModal('dsa-binary-search-answer');
assert(document.getElementById('dsa-modal-overlay').classList.contains('open'), 'Modal should open for Binary Search');
assert(document.getElementById('dsa-modal-title').textContent.includes('Binary Search'), 'Modal title should match');
app.closeDsaModal();
assert(!document.getElementById('dsa-modal-overlay').classList.contains('open'), 'Modal should close');

console.log('✓ All DSA selector, category filtering, search, and modal deep-dive methods verified');

console.log('\n🎉 ALL TESTS PASSED! DSA Pattern Finding & Master Blueprints are 100% complete and verified.\n');
