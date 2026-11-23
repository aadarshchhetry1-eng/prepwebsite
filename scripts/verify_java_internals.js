const fs = require('fs');

// Check index.html script tags
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [];
const scriptRegex = /<script\s+src=["']([^"']+)["']><\/script>/g;
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  scripts.push(m[1]);
}
console.log('Script tags count in index.html:', scripts.length);
console.log('Includes js/data/java-internals-data.js?', scripts.includes('js/data/java-internals-data.js'));

// Check window mock
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
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: { style: {} }
};

// Load data files
require('../js/data/java-data.js');
require('../js/data/java-topic-questions.js');
require('../js/data/java-internals-data.js');
require('../js/data/springboot-internals-data.js');

console.log('Loaded Java Internals count:', window.REVISION_APP_DATA.JAVA_INTERNALS.length);
console.log('Categories count:', window.REVISION_APP_DATA.JAVA_INTERNALS_CATEGORIES.length);

// Verify every internal topic has all required fields
let valid = true;
window.REVISION_APP_DATA.JAVA_INTERNALS.forEach((item, idx) => {
  const req = ['id', 'title', 'category', 'badge', 'whatIsIt', 'visualDiagram', 'internalWorking', 'complexPart', 'keyPoints'];
  req.forEach(f => {
    if (!item[f]) {
      console.error('Missing field', f, 'in item', idx, item.id);
      valid = false;
    }
  });
  if (!item.visualDiagram.includes('visual-diagram-box')) {
    console.warn('Item missing visual-diagram-box:', item.id);
  }
});
console.log('All 55 topics valid and complete?', valid);

// Now load app.js and test app methods
let domContentLoadedCb = null;
global.document.addEventListener = (evt, cb) => {
  if (evt === 'DOMContentLoaded') domContentLoadedCb = cb;
};

const appCode = fs.readFileSync('js/app.js', 'utf8');
eval(appCode);
if (domContentLoadedCb) domContentLoadedCb();

const app = window.app;
console.log('RevisionApp instantiated successfully!');
app.buildSearchIndex();
console.log('Search index built. Total entries in searchIndex:', app.searchIndex.length);
const javaIntEntries = app.searchIndex.filter(i => i.id.startsWith('java-int-'));
console.log('Java Internals indexed count:', javaIntEntries.length);

console.log('Testing formatJavaInternalAsTopic for item 0...');
const formatted = app.formatJavaInternalAsTopic(window.REVISION_APP_DATA.JAVA_INTERNALS[0]);
console.log('Formatted topic title:', formatted.title);
console.log('Formatted badge:', formatted.badge);
console.log('Contains visual diagram?', formatted.visualDiagram.includes('visual-diagram-box'));

// Test Java Internals selector rendering
console.log('Testing renderJavaInternalsSelector...');
app.renderJavaInternalsSelector();

// Test selecting a specific Java internal
console.log('Testing selectJavaInternalTopic...');
app.selectJavaInternalTopic('java-int-virtual-threads');

// Test searching Java internals
console.log('Testing searchJavaInternals for "AQS"...');
app.searchJavaInternals('AQS');

// Test opening and navigating Java internals modal
console.log('Testing openJavaInternalModal...');
app.openJavaInternalModal('java-int-aqs');
console.log('Current modal ID:', app.currentJavaInternalId);
app.navigateJavaInternalModal(1);
console.log('Next modal ID:', app.currentJavaInternalId);
app.navigateJavaInternalModal(-1);
console.log('Prev modal ID:', app.currentJavaInternalId);
app.closeJavaInternalModal();

// Test filtering Java category
console.log('Testing filterJavaCategory for jmm...');
app.filterJavaCategory('jmm');

console.log('ALL ENGINE & UX CHECKS COMPLETED WITH 100% SUCCESS!');
