/**
 * verify_patterns.js
 * End-to-end verification test for Java Design Patterns & Microservices Architecture Patterns.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('🧪 Starting Design Patterns & Microservices Test Suite...\n');

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
require('../js/data/java-data.js');
require('../js/data/java-patterns-data.js');
require('../js/data/microservices-patterns-data.js');

const javaPatterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
const microservicesPatterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];

console.log(`✓ Loaded ${javaPatterns.length} Java Design Patterns`);
console.log(`✓ Loaded ${microservicesPatterns.length} Microservices Patterns`);

// 3. Verify Java Design Patterns Data Integrity
assert.strictEqual(javaPatterns.length, 24, `Expected 24 Java patterns, got ${javaPatterns.length}`);
const expectedJavaCats = ['Creational', 'Structural', 'Behavioral', 'Modern'];
expectedJavaCats.forEach(cat => {
  const count = javaPatterns.filter(p => p.category.toLowerCase().includes(cat.toLowerCase())).length;
  assert(count > 0, `Expected patterns in category "${cat}", found 0`);
  console.log(`  - Java Category [${cat}]: ${count} patterns`);
});

javaPatterns.forEach(p => {
  assert(p.id && p.id.startsWith('pat-'), `Invalid pattern id: ${p.id}`);
  assert(p.title, `Missing title for ${p.id}`);
  assert(p.whatIsIt && p.whatIsIt.length > 20, `Missing or short whatIsIt for ${p.id}`);
  assert(p.visualDiagram && p.visualDiagram.includes('visual-diagram-box'), `Missing visual diagram box for ${p.id}`);
  assert(p.internalWorking && p.internalWorking.length > 50, `Missing internalWorking for ${p.id}`);
  assert(p.complexPart && p.complexPart.length > 30, `Missing complexPart for ${p.id}`);
  assert(Array.isArray(p.keyPoints) && p.keyPoints.length >= 3, `Key points must have >= 3 items for ${p.id}`);
  assert(p.codeSnippet && p.codeSnippet.length > 30, `Missing codeSnippet for ${p.id}`);
  assert(p.pitfall && p.pitfall.length > 10, `Missing pitfall for ${p.id}`);
  assert(p.interviewTip && p.interviewTip.length > 10, `Missing interviewTip for ${p.id}`);
});
console.log('✓ All 24 Java patterns passed schema & visual diagram verification');

// 4. Verify Microservices Patterns Data Integrity
assert.strictEqual(microservicesPatterns.length, 25, `Expected 25 Microservices patterns, got ${microservicesPatterns.length}`);
const expectedMsCats = ['Decomposition', 'Data', 'Integration', 'Resilience', 'Observability'];
expectedMsCats.forEach(cat => {
  const count = microservicesPatterns.filter(p => p.category.toLowerCase().includes(cat.toLowerCase())).length;
  assert(count > 0, `Expected patterns in category "${cat}", found 0`);
  console.log(`  - Microservices Category [${cat}]: ${count} patterns`);
});

microservicesPatterns.forEach(p => {
  assert(p.id && p.id.startsWith('ms-'), `Invalid ms pattern id: ${p.id}`);
  assert(p.title, `Missing title for ${p.id}`);
  assert(p.whatIsIt && p.whatIsIt.length > 20, `Missing or short whatIsIt for ${p.id}`);
  assert(p.visualDiagram && p.visualDiagram.includes('visual-diagram-box'), `Missing visual diagram box for ${p.id}`);
  assert(p.internalWorking && p.internalWorking.length > 50, `Missing internalWorking for ${p.id}`);
  assert(p.complexPart && p.complexPart.length > 30, `Missing complexPart for ${p.id}`);
  assert(Array.isArray(p.keyPoints) && p.keyPoints.length >= 3, `Key points must have >= 3 items for ${p.id}`);
  assert(p.codeSnippet && p.codeSnippet.length > 30, `Missing codeSnippet for ${p.id}`);
  assert(p.pitfall && p.pitfall.length > 10, `Missing pitfall for ${p.id}`);
  assert(p.interviewTip && p.interviewTip.length > 10, `Missing interviewTip for ${p.id}`);
});
console.log('✓ All 25 Microservices patterns passed schema & visual diagram verification');

// 5. Verify index.html markup
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const requiredIds = [
  'section-design-patterns',
  'patterns-cards-container',
  'patterns-select',
  'patterns-search',
  'patterns-active-banner',
  'patterns-modal-overlay',
  'pattern-modal-title',
  'pattern-modal-body',
  'section-microservices',
  'microservices-cards-container',
  'microservices-select',
  'microservices-search',
  'microservices-active-banner',
  'microservices-modal-overlay',
  'ms-modal-title',
  'ms-modal-body'
];

requiredIds.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `index.html missing required id="${id}"`);
});

assert(indexHtml.includes('js/data/java-patterns-data.js'), 'index.html missing script tag for java-patterns-data.js');
assert(indexHtml.includes('js/data/microservices-patterns-data.js'), 'index.html missing script tag for microservices-patterns-data.js');
assert(indexHtml.includes('data-target="design-patterns"'), 'index.html missing nav tab for design-patterns');
assert(indexHtml.includes('data-target="microservices"'), 'index.html missing nav tab for microservices');

console.log('✓ All required index.html containers, modals, script tags & nav tabs verified');

// 6. Test App Engine Methods
const MindMapVisualizer = function() { return { init() {}, renderMap() {} }; };
global.MindMapVisualizer = MindMapVisualizer;

// Load app class
const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
vm.runInThisContext(appContent);

const app = window.app || new RevisionApp();
app.buildSearchIndex();

// Verify search index
const indexedJavaPatterns = app.searchIndex.filter(i => i.section === 'design-patterns');
const indexedMsPatterns = app.searchIndex.filter(i => i.section === 'microservices');
assert.strictEqual(indexedJavaPatterns.length, 24, `Search index should have 24 Java patterns, got ${indexedJavaPatterns.length}`);
assert.strictEqual(indexedMsPatterns.length, 25, `Search index should have 25 Microservices patterns, got ${indexedMsPatterns.length}`);
console.log(`✓ Search index properly indexed ${indexedJavaPatterns.length} Java patterns and ${indexedMsPatterns.length} Microservices patterns`);

// Test Java Patterns Methods
app.renderJavaPatternsSelector();
const selectElem = document.getElementById('patterns-select');
assert(selectElem.innerHTML.includes('optgroup'), 'Java Patterns selector should contain optgroup elements');

app.renderJavaPatterns('all');
const javaContainer = document.getElementById('patterns-cards-container');
assert(javaContainer.innerHTML.includes('pat-singleton'), 'Java container should render pat-singleton');

app.renderJavaPatterns('creational');
assert(javaContainer.innerHTML.includes('pat-builder'), 'Creational filter should include Builder');
assert(!javaContainer.innerHTML.includes('pat-decorator'), 'Creational filter should NOT include Decorator');

app.selectJavaPattern('pat-strategy');
assert(javaContainer.innerHTML.includes('pat-strategy'), 'selectJavaPattern should render Strategy');

app.openJavaPatternModal('pat-decorator');
assert(document.getElementById('patterns-modal-overlay').classList.contains('open'), 'Modal should open for Decorator');
app.closeJavaPatternModal();
assert(!document.getElementById('patterns-modal-overlay').classList.contains('open'), 'Modal should close');

// Test Microservices Patterns Methods
app.renderMicroservicesPatternsSelector();
const msSelectElem = document.getElementById('microservices-select');
assert(msSelectElem.innerHTML.includes('optgroup'), 'Microservices selector should contain optgroup elements');

app.renderMicroservicesPatterns('all');
const msContainer = document.getElementById('microservices-cards-container');
assert(msContainer.innerHTML.includes('ms-saga-orchestration'), 'Microservices container should render Saga');

app.renderMicroservicesPatterns('resilience');
assert(msContainer.innerHTML.includes('ms-circuit-breaker'), 'Resilience filter should include Circuit Breaker');
assert(!msContainer.innerHTML.includes('ms-strangler-fig'), 'Resilience filter should NOT include Strangler Fig');

app.selectMicroservicesPattern('ms-transactional-outbox');
assert(msContainer.innerHTML.includes('ms-transactional-outbox'), 'selectMicroservicesPattern should render Outbox');

app.openMicroservicesPatternModal('ms-circuit-breaker');
assert(document.getElementById('microservices-modal-overlay').classList.contains('open'), 'Modal should open for Circuit Breaker');
app.closeMicroservicesPatternModal();
assert(!document.getElementById('microservices-modal-overlay').classList.contains('open'), 'Modal should close');

console.log('✓ All selector, filtering, modal deep-dive & rendering methods verified successfully');

console.log('\n🎉 ALL TESTS PASSED! Design Patterns & Microservices features are 100% complete and verified.\n');
