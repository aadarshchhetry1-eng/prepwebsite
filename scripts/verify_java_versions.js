/**
 * scripts/verify_java_versions.js
 * Verification test suite for Java Version Evolution Ladder (Java 8 -> 11 -> 17 -> 21 -> 25 LTS)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Java Version Evolution Ladder Test Suite...\n');

// 1. Verify Data File Exists and Loads
const dataFilePath = path.join(__dirname, '../js/data/java-versions-data.js');
assert(fs.existsSync(dataFilePath), 'java-versions-data.js must exist');

// Mock window and browser globals
global.window = {};
require(dataFilePath);

const versions = global.window.REVISION_APP_DATA?.JAVA_VERSIONS;
const matrix = global.window.REVISION_APP_DATA?.JAVA_VERSION_MATRIX;

assert(Array.isArray(versions), 'JAVA_VERSIONS must be an array');
assert.strictEqual(versions.length, 5, 'JAVA_VERSIONS must contain 5 LTS versions (8, 11, 17, 21, 25)');
console.log('✅ Found 5 LTS versions in JAVA_VERSIONS');

assert(Array.isArray(matrix), 'JAVA_VERSION_MATRIX must be an array');
assert.strictEqual(matrix.length, 5, 'JAVA_VERSION_MATRIX must contain 5 summary rows');
console.log('✅ Found 5 summary rows in JAVA_VERSION_MATRIX');

// 2. Validate Schema of JAVA_VERSIONS
const expectedVersions = ['Java 8', 'Java 11', 'Java 17', 'Java 21', 'Java 25'];
versions.forEach((v, idx) => {
  assert(v.id && v.id.startsWith('java-version-'), `Version[${idx}] must have id starting with java-version-`);
  assert.strictEqual(v.versionNumber, expectedVersions[idx], `Version[${idx}] versionNumber should be ${expectedVersions[idx]}`);
  assert(v.title && v.title.length > 5, `Version[${idx}] must have title`);
  assert(v.badge && v.badge.length > 0, `Version[${idx}] must have badge`);
  assert(v.releaseYear && v.releaseYear.length > 0, `Version[${idx}] must have releaseYear`);
  assert(v.oneLiner && v.oneLiner.length > 10, `Version[${idx}] must have oneLiner`);
  assert(v.whatIsIt && v.whatIsIt.length > 20, `Version[${idx}] must have whatIsIt elevator pitch`);
  assert(Array.isArray(v.flagshipFeatures) && v.flagshipFeatures.length >= 3, `Version[${idx}] must have at least 3 flagship features`);
  assert(Array.isArray(v.traps) && v.traps.length >= 2, `Version[${idx}] must have at least 2 classic traps`);
  assert(v.jvmMemoryChange && v.jvmMemoryChange.length > 20, `Version[${idx}] must have jvmMemoryChange explanation`);
  assert(v.codeSnippet && v.codeSnippet.length > 10, `Version[${idx}] must have codeSnippet`);
  assert(v.interviewPivot && v.interviewPivot.length > 10, `Version[${idx}] must have interviewPivot coaching`);
  console.log(`  ✓ ${v.versionNumber} (${v.releaseYear}) validated: ${v.flagshipFeatures.length} features, ${v.traps.length} traps, code + memory docs`);
});

// 3. Validate Schema of JAVA_VERSION_MATRIX
matrix.forEach((m, idx) => {
  assert(m.version, `Matrix row[${idx}] must have version`);
  assert(m.releaseYear, `Matrix row[${idx}] must have releaseYear`);
  assert(m.status, `Matrix row[${idx}] must have status`);
  assert(m.flagshipFeatures && m.flagshipFeatures.length > 10, `Matrix row[${idx}] must have flagshipFeatures`);
  assert(m.classicTrap && m.classicTrap.length > 10, `Matrix row[${idx}] must have classicTrap`);
  assert(m.jvmMemoryEvolution && m.jvmMemoryEvolution.length > 10, `Matrix row[${idx}] must have jvmMemoryEvolution`);
});
console.log('✅ All 5 Matrix summary rows validated');

// 4. Verify index.html Integration
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(html.includes('src="js/data/java-versions-data.js"'), 'index.html must include java-versions-data.js script');
assert(html.includes('id="java-versions-ladder-section"'), 'index.html must have #java-versions-ladder-section container');
assert(html.includes('id="java-versions-stepper"'), 'index.html must have #java-versions-stepper container');
assert(html.includes('id="java-version-matrix-container"'), 'index.html must have #java-version-matrix-container container');
assert(html.includes('id="java-version-cards-container"'), 'index.html must have #java-version-cards-container container');
assert(html.includes("app.filterJavaCategory('versions')"), 'index.html must have versions filter chip button');
console.log('✅ index.html integration verified');

// 5. Verify js/app.js Methods and Search Indexing
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appCode.includes('renderJavaVersions()'), 'js/app.js must implement renderJavaVersions()');
assert(appCode.includes('formatJavaVersionAsTopic('), 'js/app.js must implement formatJavaVersionAsTopic()');
assert(appCode.includes('scrollToJavaVersion('), 'js/app.js must implement scrollToJavaVersion()');
assert(appCode.includes("this.renderJavaVersions();"), 'init() must call this.renderJavaVersions()');
assert(appCode.includes("filterCategory === 'versions'"), 'renderJavaTopics() must handle versions filter');
assert(appCode.includes("category: 'Java LTS Evolution Ladder'"), 'buildSearchIndex() must index Java LTS versions');
assert(appCode.includes("🚀 LTS Ladder (8-25)"), 'renderSidebarNavigation() must include LTS Ladder pill');
console.log('✅ js/app.js methods and search indexing verified');

// 6. Verify Styles in css/styles.css
const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
assert(css.includes('.java-version-stepper-node'), 'css/styles.css must style .java-version-stepper-node');
assert(css.includes('.java-version-matrix-table'), 'css/styles.css must style .java-version-matrix-table');
assert(css.includes('.version-trap-callout'), 'css/styles.css must style .version-trap-callout');
console.log('✅ css/styles.css rules verified');

console.log('\n🎉 ALL JAVA VERSION TESTS PASSED SUCCESSFULLY! (100% compliant)');
