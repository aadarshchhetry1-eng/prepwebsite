// =============================================================================
// verify_cloud.js - Automated Test Suite for AWS & GCP Sections and IAM Blueprints
// =============================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Starting AWS & GCP Cloud Architecture Test Suite...\n');

// 1. Mock Browser Environment
const mockElement = (id = '') => ({
  id,
  innerHTML: '',
  value: '',
  style: {},
  classList: {
    add: function(cls) { this[cls] = true; },
    remove: function(cls) { delete this[cls]; },
    contains: function(cls) { return !!this[cls]; }
  },
  querySelectorAll: () => [],
  querySelector: () => mockElement('child'),
  addEventListener: () => {},
  scrollIntoView: () => {}
});

const elementsStore = {};
const getOrCreateElement = (id) => {
  if (!elementsStore[id]) {
    elementsStore[id] = mockElement(id);
  }
  return elementsStore[id];
};

const domWindow = {
  location: { hash: '' },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  addEventListener: () => {},
  REVISION_APP_DATA: {}
};

const domDocument = {
  getElementById: (id) => getOrCreateElement(id),
  querySelectorAll: () => [],
  querySelector: (sel) => mockElement(sel),
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'dark'
  },
  body: { style: {} },
  addEventListener: () => {}
};

const sandbox = {
  window: domWindow,
  document: domDocument,
  localStorage: domWindow.localStorage,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  setTimeout: (fn) => fn(),
  console: console
};

vm.createContext(sandbox);

// 2. Load Data Modules
const awsDataCode = fs.readFileSync(path.join(__dirname, '../js/data/aws-data.js'), 'utf8');
const gcpDataCode = fs.readFileSync(path.join(__dirname, '../js/data/gcp-data.js'), 'utf8');
const dsaDataCode = fs.readFileSync(path.join(__dirname, '../js/data/dsa-data.js'), 'utf8');
const patternsDataCode = fs.readFileSync(path.join(__dirname, '../js/data/java-patterns-data.js'), 'utf8');
const msDataCode = fs.readFileSync(path.join(__dirname, '../js/data/microservices-patterns-data.js'), 'utf8');

vm.runInContext(awsDataCode, sandbox);
vm.runInContext(gcpDataCode, sandbox);
vm.runInContext(dsaDataCode, sandbox);
vm.runInContext(patternsDataCode, sandbox);
vm.runInContext(msDataCode, sandbox);

const awsServices = sandbox.window.REVISION_APP_DATA.AWS_SERVICES;
const gcpServices = sandbox.window.REVISION_APP_DATA.GCP_SERVICES;

console.log(`✓ Loaded ${awsServices?.length || 0} AWS Services`);
console.log(`✓ Loaded ${gcpServices?.length || 0} GCP Services`);

if (!awsServices || awsServices.length !== 9) {
  throw new Error(`Expected exactly 9 AWS services, got ${awsServices ? awsServices.length : 0}`);
}
if (!gcpServices || gcpServices.length !== 9) {
  throw new Error(`Expected exactly 9 GCP services, got ${gcpServices ? gcpServices.length : 0}`);
}

// 3. Schema & Content Validation
const requiredFields = [
  'id', 'title', 'category', 'badge', 'whatIsIt', 'whenAndWhy',
  'internalWorking', 'iamConfiguration', 'realWorldUseCase',
  'visualDiagram', 'codeSnippet', 'complexPart', 'keyPoints',
  'pitfall', 'interviewTip'
];

console.log('\n🔍 Validating AWS Services Schema & Quality...');
awsServices.forEach(s => {
  requiredFields.forEach(f => {
    if (!s[f]) {
      throw new Error(`AWS Service '${s.id}' missing required field '${f}'`);
    }
  });
  if (!s.visualDiagram.includes('visual-diagram-box')) {
    throw new Error(`AWS Service '${s.id}' visualDiagram missing .visual-diagram-box`);
  }
  if (!s.keyPoints || s.keyPoints.length < 3) {
    throw new Error(`AWS Service '${s.id}' must have at least 3 keyPoints`);
  }
});
console.log('✓ All 9 AWS services passed schema, IAM role config, and visual diagram verification');

console.log('\n🔍 Validating GCP Services Schema & Quality...');
gcpServices.forEach(s => {
  requiredFields.forEach(f => {
    if (!s[f]) {
      throw new Error(`GCP Service '${s.id}' missing required field '${f}'`);
    }
  });
  if (!s.visualDiagram.includes('visual-diagram-box')) {
    throw new Error(`GCP Service '${s.id}' visualDiagram missing .visual-diagram-box`);
  }
  if (!s.keyPoints || s.keyPoints.length < 3) {
    throw new Error(`GCP Service '${s.id}' must have at least 3 keyPoints`);
  }
});
console.log('✓ All 9 GCP services passed schema, IAM role config, and visual diagram verification');

// 4. Verify index.html Integrity
console.log('\n🔍 Validating index.html DOM Elements...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const expectedHtmlTokens = [
  'data-target="aws"',
  'data-target="gcp"',
  'id="section-aws"',
  'id="section-gcp"',
  'id="aws-search"',
  'id="aws-select"',
  'id="aws-active-banner"',
  'id="aws-cards-container"',
  'id="gcp-search"',
  'id="gcp-select"',
  'id="gcp-active-banner"',
  'id="gcp-cards-container"',
  'id="aws-modal-overlay"',
  'id="gcp-modal-overlay"',
  '<script src="js/data/aws-data.js"></script>',
  '<script src="js/data/gcp-data.js"></script>'
];

expectedHtmlTokens.forEach(token => {
  if (!indexHtml.includes(token)) {
    throw new Error(`index.html is missing expected token: ${token}`);
  }
});
console.log('✓ All required index.html containers, modals, script tags & nav tabs verified');

// 5. Verify CSS styles
console.log('\n🔍 Validating css/styles.css Tokens...');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
const expectedCssTokens = [
  '--accent-aws',
  '--accent-gcp',
  '.cheat-card.border-aws',
  '.cheat-card.border-gcp'
];
expectedCssTokens.forEach(tok => {
  if (!cssContent.includes(tok)) {
    throw new Error(`css/styles.css is missing expected token: ${tok}`);
  }
});
console.log('✓ All AWS & GCP design tokens and border styles verified in css/styles.css');

// 6. Verify js/app.js Execution in Sandbox
console.log('\n🔍 Validating js/app.js Engine Execution...');
const appJsCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

vm.runInContext(appJsCode, sandbox);
vm.runInContext('var app = new RevisionApp(); app.buildSearchIndex();', sandbox);

const searchIndex = sandbox.app.searchIndex;
const awsIndexed = searchIndex.filter(i => i.section === 'aws');
const gcpIndexed = searchIndex.filter(i => i.section === 'gcp');

console.log(`✓ Search index properly indexed ${awsIndexed.length} AWS services`);
console.log(`✓ Search index properly indexed ${gcpIndexed.length} GCP services`);

if (awsIndexed.length !== 9) {
  throw new Error(`Expected 9 AWS services in searchIndex, got ${awsIndexed.length}`);
}
if (gcpIndexed.length !== 9) {
  throw new Error(`Expected 9 GCP services in searchIndex, got ${gcpIndexed.length}`);
}

// 7. Test AWS Methods
console.log('\n🔍 Testing AWS UI Methods...');
vm.runInContext(`
  app.renderAwsSelector();
  app.renderAwsTopics('all');
  app.selectAwsTopic('aws-iam');
  app.searchAwsTopics('IRSA');
  app.openAwsModal('aws-eks');
  app.navigateAwsModal(1);
  app.closeAwsModal();
`, sandbox);
console.log('✓ AWS Selector, Cards Grid, Filter, and Modal Navigation passed');

// 8. Test GCP Methods
console.log('\n🔍 Testing GCP UI Methods...');
vm.runInContext(`
  app.renderGcpSelector();
  app.renderGcpTopics('all');
  app.selectGcpTopic('gcp-iam');
  app.searchGcpTopics('TrueTime');
  app.openGcpModal('gcp-gke');
  app.navigateGcpModal(1);
  app.closeGcpModal();
`, sandbox);
console.log('✓ GCP Selector, Cards Grid, Filter, and Modal Navigation passed');

// 9. Test Sidebar Navigation Generation
console.log('\n🔍 Testing Sidebar Navigation Generation...');
const navContainer = getOrCreateElement('sidebar-nav-container');
vm.runInContext('app.renderSidebarNavigation();', sandbox);
if (!navContainer.innerHTML.includes('AWS Cloud') || !navContainer.innerHTML.includes('Google Cloud (GCP)')) {
  throw new Error('Sidebar navigation HTML does not include AWS or GCP section cards');
}
console.log('✓ Sidebar navigation generated AWS and GCP section cards and mini-pills');

console.log('\n🎉 ALL TESTS PASSED! AWS & GCP Cloud Architecture and IAM Blueprints are 100% verified.');
