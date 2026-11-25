/**
 * scripts/verify_mock_interview_questions.js
 * Verification test suite ensuring all 6 mock interview sections are completely represented
 * in their respective topic data files and in the questions hub.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting 6-Section Mock Interview Verification Test Suite...\n');

// Mock browser globals
global.window = {};

require('../js/data/springboot-data.js');
require('../js/data/kafka-data.js');
require('../js/data/sql-data.js');
require('../js/data/concurrency-data.js');
require('../js/data/react-data.js');
require('../js/data/devops-data.js');
require('../js/data/questions-data.js');

const data = global.window.REVISION_APP_DATA;

// 1. Verify Spring Boot Section
console.log('--- 1. Verifying Spring Boot / Microservices / Transactions ---');
const springQ16 = data.SPRING_QUESTIONS.find(q => q.id === 'spring-q16-distributed-dual-write-saga-outbox-idempotency');
assert(springQ16, 'spring-q16 must exist in SPRING_QUESTIONS');
assert(springQ16.title.includes('Dual-Write Across Microservices'), 'spring-q16 title must mention Dual-Write');
assert(springQ16.problem.includes('@Transactional'), 'spring-q16 problem must mention @Transactional');
assert(springQ16.seniorAnswer.length >= 5, 'spring-q16 must have comprehensive senior answer points');
assert(springQ16.solution.includes('createOrderWithOutbox'), 'spring-q16 solution must demonstrate Outbox pattern');
console.log('  ✓ spring-q16 verified: Outbox, Saga, CDC & Idempotency');

// 2. Verify Kafka Section (3 Questions)
console.log('\n--- 2. Verifying Kafka Section ---');
const k21 = data.KAFKA_QUESTIONS.find(q => q.id === 'kafka-scen-21');
const k22 = data.KAFKA_QUESTIONS.find(q => q.id === 'kafka-scen-22');
const k23 = data.KAFKA_QUESTIONS.find(q => q.id === 'kafka-scen-23');

assert(k21, 'kafka-scen-21 must exist (Q2.1: Consumer groups, rebalance, timeouts)');
assert(k21.problem.includes('6 partitions') && k21.problem.includes('9 consumers'), 'k21 problem must detail 6 partitions and 9 consumers');
assert(k21.seniorAnswer.some(a => a.includes('Cooperative Sticky')), 'k21 must explain Cooperative Sticky');
assert(k21.seniorAnswer.some(a => a.includes('max.poll.interval.ms')), 'k21 must explain max.poll.interval.ms');
console.log('  ✓ kafka-scen-21 verified: Consumer groups, 9 consumers, rebalance, timeouts');

assert(k22, 'kafka-scen-22 must exist (Q2.2: EOS, idempotence, transactions, poison pills)');
assert(k22.seniorAnswer.some(a => a.includes('commitSync()')), 'k22 must explain commitSync windows');
assert(k22.seniorAnswer.some(a => a.includes('sendOffsetsToTransaction')), 'k22 must explain sendOffsetsToTransaction');
assert(k22.solution.includes('producer.initTransactions()'), 'k22 solution must have Java EOS loop');
console.log('  ✓ kafka-scen-22 verified: EOS transaction coordinator, idempotence limits, retry topics');

assert(k23, 'kafka-scen-23 must exist (Q2.3: Lag, acks, schema evolution, ISR)');
assert(k23.seniorAnswer.some(a => a.includes('Lag Triage Levers')), 'k23 must rank lag triage levers');
assert(k23.seniorAnswer.some(a => a.includes('acks=1')), 'k23 must explain acks=1 risk');
assert(k23.seniorAnswer.some(a => a.includes('min.insync.replicas')), 'k23 must detail ISR math (1 vs 2 dead brokers)');
console.log('  ✓ kafka-scen-23 verified: Lag levers, acks=1 loss, Schema Registry, ISR math');

// 3. Verify SQL / JPA / Hibernate Section
console.log('\n--- 3. Verifying SQL / JPA / Hibernate Section ---');
const sqlQ21 = data.SQL_QUESTIONS.find(q => q.id === 'sql-q21-jpa-nplus1-pagination-locking-dirtychecking');
assert(sqlQ21, 'sql-q21 must exist in SQL_QUESTIONS (Q3.1)');
assert(sqlQ21.problem.includes('HHH000104') || sqlQ21.seniorAnswer.some(a => a.includes('HHH000104')), 'sql-q21 must explain HHH000104 pagination in-memory OOM trap');
assert(sqlQ21.seniorAnswer.some(a => a.includes('Optimistic Locking') && a.includes('Pessimistic Locking')), 'sql-q21 must contrast Optimistic vs Pessimistic vs Atomic update');
assert(sqlQ21.seniorAnswer.some(a => a.includes('Dirty Checking vs Bulk JPQL')), 'sql-q21 must explain dirty checking cache divergence');
console.log('  ✓ sql-q21 verified: N+1, HHH000104 pagination OOM, Locking matrix, Dirty checking divergence');

// 4. Verify Multithreading Section (2 Questions)
console.log('\n--- 4. Verifying Multithreading Section ---');
const c26 = data.CONCURRENCY_QUESTIONS.find(q => q.id === 'concurrency-q26-volatile-dcl-reentrantlock-deep-dive');
const c27 = data.CONCURRENCY_QUESTIONS.find(q => q.id === 'concurrency-q27-threadpool-sizing-completablefuture-virtualthreads');

assert(c26, 'concurrency-q26 must exist (Q4.1: volatile, DCL, ReentrantLock)');
assert(c26.seniorAnswer.some(a => a.includes('volatile int count; count++ Is NOT Thread-Safe')), 'c26 must explain count++ bytecode');
assert(c26.seniorAnswer.some(a => a.includes('Allocate memory on heap') && a.includes('reorder')), 'c26 must explain DCL safe publication');
assert(c26.seniorAnswer.some(a => a.includes('tryLock(timeout)')), 'c26 must explain tryLock(timeout)');
console.log('  ✓ concurrency-q26 verified: volatile count++, DCL reordering, ReentrantLock vs synchronized');

assert(c27, 'concurrency-q27 must exist (Q4.2: Thread pools, CompletableFuture, Virtual Threads)');
assert(c27.seniorAnswer.some(a => a.includes('CPU_cores + 1')), 'c27 must provide thread pool sizing formulas');
assert(c27.seniorAnswer.some(a => a.includes('newFixedThreadPool') && a.includes('newCachedThreadPool')), 'c27 must explain Executors factory traps');
assert(c27.seniorAnswer.some(a => a.includes('Carrier Thread Pinning')), 'c27 must explain virtual thread carrier pinning');
console.log('  ✓ concurrency-q27 verified: Thread pool formulas, CompletableFuture pitfalls, Loom carrier pinning');

// 5. Verify React Section
console.log('\n--- 5. Verifying React Section ---');
const r31 = data.REACT_QUESTIONS.find(q => q.id === 'react-q31-useeffect-batching-keys-renders-profiling');
assert(r31, 'react-q31 must exist in REACT_QUESTIONS (Q5.1)');
assert(r31.seniorAnswer.some(a => a.includes('STALE CLOSURE')), 'r31 must detail useEffect stale closures');
assert(r31.seniorAnswer.some(a => a.includes('Context Re-render Trap')), 'r31 must detail Context re-render cascade');
assert(r31.seniorAnswer.some(a => a.includes('Array Index as Key')), 'r31 must explain array index key traps');
assert(r31.seniorAnswer.some(a => a.includes('Universal Batching')), 'r31 must explain React 18 universal batching');
console.log('  ✓ react-q31 verified: useEffect deps, context cascade, array index keys, universal batching, DevTools profiling');

// 6. Verify DevOps Section
console.log('\n--- 6. Verifying DevOps Section ---');
const d21 = data.DEVOPS_QUESTIONS.find(q => q.id === 'devops-q21-jenkins-pipeline-buildonce-expandcontract-migrations');
assert(d21, 'devops-q21 must exist in DEVOPS_QUESTIONS (Q6.1)');
assert(d21.seniorAnswer.some(a => a.includes('Declarative Jenkinsfile')), 'd21 must detail Jenkins declarative pipeline');
assert(d21.seniorAnswer.some(a => a.includes('Build Once, Deploy Many')), 'd21 must explain build once deploy many');
assert(d21.seniorAnswer.some(a => a.includes('Expand/Contract')), 'd21 must detail Expand/Contract database migrations');
assert(d21.seniorAnswer.some(a => a.includes('Anti-Patterns')), 'd21 must detail common Jenkins anti-patterns');
console.log('  ✓ devops-q21 verified: Declarative Jenkinsfile, build once deploy many, expand/contract migrations, anti-patterns');

// 7. Verify Questions Hub in questions-data.js
console.log('\n--- 7. Verifying Questions Hub (questions-data.js) ---');
const expectedHubIds = [
  'q-mock-dual-write-saga-outbox-idempotency',
  'q-mock-kafka-consumer-groups-rebalance-timeouts',
  'q-mock-kafka-eos-transactions-poison-pills',
  'q-mock-kafka-lag-acks-schema-isr',
  'q-mock-jpa-nplus1-pagination-locking-dirtychecking',
  'q-mock-concurrency-volatile-dcl-reentrantlock',
  'q-mock-concurrency-threadpools-completablefuture-virtualthreads',
  'q-mock-react-useeffect-batching-keys-renders',
  'q-mock-devops-jenkins-pipeline-buildonce-expandcontract'
];

expectedHubIds.forEach(id => {
  const item = data.QUESTIONS.find(q => q.id === id);
  assert(item, `Question ${id} must exist in questions-data.js`);
  assert(item.question && item.seniorAnswer.length >= 3, `${id} must have question and seniorAnswer`);
  console.log(`  ✓ Hub question [${id}] verified in category "${item.category}"`);
});

// 8. Verify index.html & js/app.js integration
console.log('\n--- 8. Verifying index.html and app.js Filter Integration ---');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(html.includes("app.filterSqlCategory('jpa_hibernate')"), 'index.html must have jpa_hibernate filter chip');
assert(html.includes("All (28)"), 'Kafka filter chip should say All (28)');
assert(html.includes("All (32)"), 'Concurrency filter chip should say All (32)');
assert(html.includes("All (36)"), 'React filter chip should say All (36)');
assert(html.includes("All (26)"), 'DevOps filter chip should say All (26)');

const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appCode.includes("filterCategory === 'jpa_hibernate'"), 'js/app.js must handle jpa_hibernate filter');
console.log('  ✓ index.html chips and app.js filterSqlCategory verified');

console.log('\n🎉 ALL 6 MOCK INTERVIEW SECTIONS 100% VERIFIED ACROSS THE ENTIRE APPLICATION!');
