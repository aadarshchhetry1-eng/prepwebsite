/**
 * app.js
 * Main Controller for Senior Dev Revision Platform.
 * Features expandable visual topic cards, compact minimal sidebar, instant search, and progress tracking.
 */

class RevisionApp {
  constructor() {
    this.currentSection = 'mindmap';
    this.masteredItems = new Set(JSON.parse(localStorage.getItem('prep_mastered_items') || '[]'));
    this.customTopics = JSON.parse(localStorage.getItem('prep_custom_topics') || '[]');
    this.searchIndex = [];
    this.mindmapViz = null;
  }

  init() {
    this.initTheme();
    this.buildSearchIndex();
    this.renderSidebarNavigation();
    this.renderJavaSubtopicSelector();
    this.renderJavaInternalsSelector();
    this.renderJavaTopics('internals');
    this.renderJavaVersions();
    this.renderJavaPatternsSelector();
    this.renderJavaPatterns('all');
    this.renderStreamsTopics();
    this.renderSpringInternalsSelector();
    this.renderSpringTopics('internals');
    this.renderMicroservicesPatternsSelector();
    this.renderMicroservicesPatterns('all');
    this.renderSqlTopics();
    this.renderKafkaTopics();
    this.renderReactTopics();
    this.renderDevopsTopics();
    this.renderLifecycleSection();
    this.renderRedisTopics();
    this.renderConcurrencyTopics();
    this.renderHldTopics();
    this.renderLldTopics();
    this.renderDsaPatternsSelector();
    this.renderDsaTopics('all');
    this.renderAwsSelector();
    this.renderAwsTopics('all');
    this.renderGcpSelector();
    this.renderGcpTopics('all');
    this.renderQuestions();
    this.renderRapidFire();
    this.initMindMap();
    this.setupEventListeners();
    this.updateStats();
    this.handleInitialHash();
  }

  // -------------------------------------------------------------
  // Theme Management
  // -------------------------------------------------------------
  initTheme() {
    const savedTheme = localStorage.getItem('prep_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('prep_theme', newTheme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  // -------------------------------------------------------------
  // Mobile Sidebar Drawer Management
  // -------------------------------------------------------------
  openMobileSidebar() {
    document.getElementById('app-sidebar')?.classList.add('open');
    document.getElementById('sidebar-backdrop')?.classList.add('active');
  }

  closeMobileSidebar() {
    document.getElementById('app-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('active');
  }

  // -------------------------------------------------------------
  // Section Navigation & Tab Switching
  // -------------------------------------------------------------
  switchSection(sectionId) {
    this.currentSection = sectionId;

    // Update top nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === sectionId);
    });

    // Update content visibility
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${sectionId}`);
    });

    // Scroll to top of main content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar if open
    this.closeMobileSidebar();
  }

  // -------------------------------------------------------------
  // Minimal Compact Sidebar Rendering
  // -------------------------------------------------------------
  renderSidebarNavigation() {
    const navContainer = document.getElementById('sidebar-nav-container');
    if (!navContainer) return;

    let html = '<div class="compact-nav-list">';

    // 1. Mind Maps Group
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('mindmap')">
          <span>🧠 Mind Maps</span>
          <span class="badge-count">5 Maps</span>
        </button>
        <div class="compact-pills-row">
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('solid'); return false;">📐 SOLID</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('oops'); return false;">🧩 OOPs</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('jmm'); return false;">⚙️ JVM/GC</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('streams'); return false;">🌊 Streams</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('spring_lifecycle'); return false;">🌱 Lifecycle</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('sql'); return false;">🗄️ SQL Engine</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('kafka'); return false;">⚡ Kafka Core</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('react'); return false;">⚛️ React/Redux</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('devops'); return false;">☸️ K8s/DevOps</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('redis'); return false;">🟥 Redis</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('concurrency'); return false;">🧵 Concurrency</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('hld'); return false;">🏗️ HLD System</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('lld'); return false;">📐 LLD Coding</a>
          <a href="#mindmap" class="compact-mini-pill" onclick="app.switchSection('mindmap'); app.mindmapViz?.renderMap('dsa_patterns'); return false;">⚡ 14 Patterns</a>
        </div>
      </div>
    `;

    // 2. Java Group
    const javaTopics = window.REVISION_APP_DATA?.JAVA_TOPICS || [];
    const javaQuestions = window.REVISION_APP_DATA?.JAVA_460_QUESTIONS || window.REVISION_APP_DATA?.JAVA_QUESTIONS || [];
    const javaInternals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    const javaVersions = window.REVISION_APP_DATA?.JAVA_VERSIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('java')">
          <span>☕ Core Java</span>
          <span class="badge-count">${javaTopics.length + javaQuestions.length + javaInternals.length + javaVersions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#java" class="compact-mini-pill" style="color: var(--accent-cyan); font-weight: 700; background: rgba(56, 189, 248, 0.15);" onclick="app.switchSection('java'); app.filterJavaCategory('internals'); return false;">⚙️ 55 Internals</a>
          <a href="#java-versions" class="compact-mini-pill" style="color: var(--accent-orange); font-weight: 700; background: rgba(249, 115, 22, 0.15);" onclick="app.switchSection('java'); app.filterJavaCategory('versions'); return false;">🚀 LTS Ladder (8-25)</a>
          <a href="#java-int-jvm-memory-structure" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-jvm-memory-structure'); return false;">JVM Memory</a>
          <a href="#java-int-gc-implementations" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-gc-implementations'); return false;">G1 vs ZGC</a>
          <a href="#java-int-parent-delegation" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-parent-delegation'); return false;">ClassLoaders</a>
          <a href="#java-int-jit-compilation" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-jit-compilation'); return false;">JIT Comp</a>
          <a href="#java-int-jmm" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-jmm'); return false;">JMM Barriers</a>
          <a href="#java-int-volatile" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-volatile'); return false;">volatile</a>
          <a href="#java-int-synchronized" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-synchronized'); return false;">synchronized</a>
          <a href="#java-int-virtual-threads" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-virtual-threads'); return false;">V-Threads</a>
          <a href="#java-int-aqs" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-aqs'); return false;">AQS Locks</a>
          <a href="#java-int-cas" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-cas'); return false;">CAS &amp; ABA</a>
          <a href="#java-int-hashmap" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-hashmap'); return false;">HashMap</a>
          <a href="#java-int-fail-fast-vs-fail-safe" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-fail-fast-vs-fail-safe'); return false;">modCount &amp; CME</a>
          <a href="#java-int-concurrenthashmap" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-concurrenthashmap'); return false;">ConcurrentHashMap</a>
          <a href="#java-int-string-immutability" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-string-immutability'); return false;">String Pool</a>
          <a href="#java-int-io-vs-nio" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-io-vs-nio'); return false;">NIO Selector</a>
          <a href="#java-int-serialization" class="compact-mini-pill" onclick="app.navigateToJavaInternal('java-int-serialization'); return false;">Serialization</a>
        </div>
      </div>
    `;

    // 2b. Java Design Patterns Group (GoF & Modern)
    const javaPatterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('design-patterns')">
          <span>📐 Java Design Patterns</span>
          <span class="badge-count">${javaPatterns.length} Patterns</span>
        </button>
        <div class="compact-pills-row">
          <a href="#pat-singleton" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-singleton'); return false;">Singleton DCL</a>
          <a href="#pat-factory-method" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-factory-method'); return false;">Factory Method</a>
          <a href="#pat-builder" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-builder'); return false;">Builder</a>
          <a href="#pat-adapter" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-adapter'); return false;">Adapter</a>
          <a href="#pat-decorator" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-decorator'); return false;">Decorator</a>
          <a href="#pat-proxy" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-proxy'); return false;">CGLIB Proxy</a>
          <a href="#pat-chain-of-responsibility" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-chain-of-responsibility'); return false;">Chain of Resp</a>
          <a href="#pat-observer" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-observer'); return false;">Observer Event</a>
          <a href="#pat-strategy" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-strategy'); return false;">Strategy</a>
          <a href="#pat-state" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-state'); return false;">State Machine</a>
          <a href="#pat-visitor" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-visitor'); return false;">Visitor</a>
          <a href="#pat-dependency-injection" class="compact-mini-pill" onclick="app.navigateToJavaPattern('pat-dependency-injection'); return false;">Dependency Inj</a>
        </div>
      </div>
    `;

    // 3. Streams Group
    const streamTopics = window.REVISION_APP_DATA?.STREAMS_TOPICS || [];
    const streamQuestions = window.REVISION_APP_DATA?.STREAM_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('streams')">
          <span>🌊 Java Streams</span>
          <span class="badge-count">${streamTopics.length + streamQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#stream-pipeline-lifecycle" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'stream-pipeline-lifecycle'); return false;">Pipeline</a>
          <a href="#stream-intermediate-ops" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'stream-intermediate-ops'); return false;">Intermediate</a>
          <a href="#stream-collectors-deep-dive" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'stream-collectors-deep-dive'); return false;">Collectors</a>
          <a href="#comparator-masterclass" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'comparator-masterclass'); return false;">Comparator</a>
          <a href="#parallel-streams-internals" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'parallel-streams-internals'); return false;">Parallel</a>
          <a href="#sq-1-dept-highest-earner" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'sq-1-dept-highest-earner'); return false;">Top Earner</a>
          <a href="#sq-2-second-highest-number" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'sq-2-second-highest-number'); return false;">2nd Highest</a>
          <a href="#sq-3-char-frequency-sorted" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'sq-3-char-frequency-sorted'); return false;">Frequency</a>
          <a href="#sq-8-multi-field-comparator-nulls" class="compact-mini-pill" onclick="app.navigateToTopic('streams', 'sq-8-multi-field-comparator-nulls'); return false;">Nulls Last</a>
        </div>
      </div>
    `;

    // 4. Spring Boot Group
    const springTopics = window.REVISION_APP_DATA?.SPRING_TOPICS || [];
    const springQuestions = window.REVISION_APP_DATA?.SPRING_QUESTIONS || [];
    const springInternals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('spring')">
          <span>🌱 Spring Boot</span>
          <span class="badge-count">${springTopics.length + springQuestions.length + springInternals.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#spring" class="compact-mini-pill" style="color: var(--accent-cyan); font-weight: 700; background: rgba(56, 189, 248, 0.15);" onclick="app.switchSection('spring'); app.filterSpringCategory('internals'); return false;">⚙️ 29 Internals</a>
          <a href="#sb-int-springbootapplication" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-springbootapplication'); return false;">@SpringBootApp</a>
          <a href="#sb-int-autoconfiguration" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-autoconfiguration'); return false;">Auto-Config</a>
          <a href="#sb-int-springapplication-run-flow" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-springapplication-run-flow'); return false;">run() Startup</a>
          <a href="#sb-int-embedded-server-startup" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-embedded-server-startup'); return false;">Tomcat Startup</a>
          <a href="#sb-int-circular-dependencies-three-level-cache" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-circular-dependencies-three-level-cache'); return false;">3-Level Cache</a>
          <a href="#sb-int-configuration-vs-component" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-configuration-vs-component'); return false;">CGLIB Proxy</a>
          <a href="#sb-int-transactional-self-invocation" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-transactional-self-invocation'); return false;">@Transactional Trap</a>
          <a href="#sb-int-dispatcher-servlet-flow" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-dispatcher-servlet-flow'); return false;">DispatcherServlet</a>
          <a href="#sb-int-beanpostprocessor" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-beanpostprocessor'); return false;">BeanPostProcessor</a>
          <a href="#sb-int-configurationproperties-binding" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-configurationproperties-binding'); return false;">ConfigProperties</a>
          <a href="#sb-int-test-slices" class="compact-mini-pill" onclick="app.navigateToSpringInternal('sb-int-test-slices'); return false;">Test Slices</a>
          <a href="#spring-proxies-transactional-pitfalls" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-proxies-transactional-pitfalls'); return false;">Proxy Trap</a>
          <a href="#spring-transaction-propagation-internals" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-transaction-propagation-internals'); return false;">Propagation</a>
          <a href="#hibernate-persistence-context-dirty-checking" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'hibernate-persistence-context-dirty-checking'); return false;">Dirty Checking</a>
          <a href="#spring-security-filter-chain-delegating-proxy" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-security-filter-chain-delegating-proxy'); return false;">Security Chain</a>
          <a href="#spring-q1-nested-transaction-rollback-only" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q1-nested-transaction-rollback-only'); return false;">Rollback-Only</a>
          <a href="#spring-q2-kafka-event-published-before-db-commit" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q2-kafka-event-published-before-db-commit'); return false;">Kafka Dual-Write</a>
          <a href="#spring-q3-async-loses-security-context-tenant" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q3-async-loses-security-context-tenant'); return false;">Async Context</a>
          <a href="#spring-q5-lazyinitializationexception-osiv-false" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q5-lazyinitializationexception-osiv-false'); return false;">LazyInit Fix</a>
        </div>
      </div>
    `;

    // 5. SQL Group
    const sqlTopics = window.REVISION_APP_DATA?.SQL_TOPICS || [];
    const sqlQuestions = window.REVISION_APP_DATA?.SQL_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('sql')">
          <span>🗄️ SQL Mastery</span>
          <span class="badge-count">${sqlTopics.length + sqlQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#sql-execution-order" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-execution-order'); return false;">10-Step Order</a>
          <a href="#sql-b-tree-indexing" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-b-tree-indexing'); return false;">B+Tree Index</a>
          <a href="#sql-window-functions-mastery" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-window-functions-mastery'); return false;">Window Funcs</a>
          <a href="#sql-joins-execution-plans" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-joins-execution-plans'); return false;">Join Plans</a>
          <a href="#sql-acid-isolation-locks" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-acid-isolation-locks'); return false;">MVCC Locks</a>
          <a href="#sql-q1-nth-highest-salary" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-q1-nth-highest-salary'); return false;">Nth Salary</a>
          <a href="#sql-q2-department-top-3-earners" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-q2-department-top-3-earners'); return false;">Top 3 Earners</a>
          <a href="#sql-q3-consecutive-logins-gaps-islands" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-q3-consecutive-logins-gaps-islands'); return false;">Gaps & Islands</a>
          <a href="#sql-q4-cumulative-running-total" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-q4-cumulative-running-total'); return false;">Running Total</a>
          <a href="#sql-q7-mom-revenue-growth" class="compact-mini-pill" onclick="app.navigateToTopic('sql', 'sql-q7-mom-revenue-growth'); return false;">MoM Growth</a>
        </div>
      </div>
    `;

    // 6. Apache Kafka Group
    const kafkaTopics = window.REVISION_APP_DATA?.KAFKA_TOPICS || [];
    const kafkaQuestions = window.REVISION_APP_DATA?.KAFKA_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('kafka')">
          <span>⚡ Apache Kafka</span>
          <span class="badge-count">${kafkaTopics.length + kafkaQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#kafka-storage-zero-copy" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-storage-zero-copy'); return false;">Zero-Copy</a>
          <a href="#kafka-producer-internals-idempotence" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-producer-internals-idempotence'); return false;">Idempotent PID</a>
          <a href="#kafka-consumer-rebalance-cooperative" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-consumer-rebalance-cooperative'); return false;">CooperativeSticky</a>
          <a href="#kafka-replication-isr-leader-epochs" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-replication-isr-leader-epochs'); return false;">Leader Epochs</a>
          <a href="#kafka-resilience-dlq-outbox" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-resilience-dlq-outbox'); return false;">Outbox & DLQ</a>
          <a href="#kafka-scen-1" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-1'); return false;">Zombie Consumer</a>
          <a href="#kafka-scen-2" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-2'); return false;">min.isr Data Loss</a>
          <a href="#kafka-scen-3" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-3'); return false;">Out-of-Order Retries</a>
          <a href="#kafka-scen-4" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-4'); return false;">Hot Partition</a>
          <a href="#kafka-scen-5" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-5'); return false;">Poison Pill DLT</a>
          <a href="#kafka-scen-7" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-7'); return false;">Dual-Write Problem</a>
          <a href="#kafka-scen-8" class="compact-mini-pill" onclick="app.navigateToTopic('kafka', 'kafka-scen-8'); return false;">Non-Blocking Retries</a>
        </div>
      </div>
    `;

    // 7. React & Redux Group
    const reactTopics = window.REVISION_APP_DATA?.REACT_TOPICS || [];
    const reactQuestions = window.REVISION_APP_DATA?.REACT_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('react')">
          <span>⚛️ React & Redux</span>
          <span class="badge-count">${reactTopics.length + reactQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#react-fiber-reconciler-architecture" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-fiber-reconciler-architecture'); return false;">Fiber Engine</a>
          <a href="#react-vdom-diffing-algorithm" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-vdom-diffing-algorithm'); return false;">O(N) Diffing</a>
          <a href="#react-hooks-linked-list-internals" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-hooks-linked-list-internals'); return false;">Hooks Linked List</a>
          <a href="#redux-core-middleware-immer-internals" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'redux-core-middleware-immer-internals'); return false;">Redux Middleware</a>
          <a href="#react-rerender-context-memoization" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-rerender-context-memoization'); return false;">Re-render & Context</a>
          <a href="#react-q1-key-index-disaster" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q1-key-index-disaster'); return false;">key={index} Trap</a>
          <a href="#react-q2-fiber-double-buffering-tearing" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q2-fiber-double-buffering-tearing'); return false;">Double-Buffering</a>
          <a href="#react-q4-stale-closures-useeffect-usecallback" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q4-stale-closures-useeffect-usecallback'); return false;">Stale Closures</a>
          <a href="#react-q5-automatic-batching-react-18" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q5-automatic-batching-react-18'); return false;">Auto Batching</a>
          <a href="#react-q9-context-api-vs-redux-cascading-renders" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q9-context-api-vs-redux-cascading-renders'); return false;">Context vs Redux</a>
          <a href="#react-q11-immer-proxies-redux-toolkit" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q11-immer-proxies-redux-toolkit'); return false;">Immer Proxies</a>
          <a href="#react-q13-react-18-transitions-concurrency" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q13-react-18-transitions-concurrency'); return false;">Transitions</a>
          <a href="#react-q21-controlled-vs-uncontrolled-forms" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q21-controlled-vs-uncontrolled-forms'); return false;">Controlled Forms</a>
          <a href="#react-q22-portals-event-bubbling" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q22-portals-event-bubbling'); return false;">Portals Bubbling</a>
          <a href="#react-q23-rules-of-hooks-internals" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q23-rules-of-hooks-internals'); return false;">Rules of Hooks</a>
          <a href="#react-q25-useid-ssr-hydration-mismatch" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q25-useid-ssr-hydration-mismatch'); return false;">useId &amp; SSR</a>
          <a href="#react-q26-virtualization-windowing-performance" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q26-virtualization-windowing-performance'); return false;">Virtual Windowing</a>
          <a href="#react-q30-react-19-actions-optimistic-updates" class="compact-mini-pill" onclick="app.navigateToTopic('react', 'react-q30-react-19-actions-optimistic-updates'); return false;">React 19 Actions</a>
        </div>
      </div>
    `;

    // 8. K8s & DevOps Group
    const devopsTopics = window.REVISION_APP_DATA?.DEVOPS_TOPICS || [];
    const devopsQuestions = window.REVISION_APP_DATA?.DEVOPS_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('devops')">
          <span>☸️ K8s & DevOps</span>
          <span class="badge-count">${devopsTopics.length + devopsQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#k8s-control-plane-etcd-internals" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'k8s-control-plane-etcd-internals'); return false;">Control Plane</a>
          <a href="#docker-cgroups-namespaces-overlayfs" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'docker-cgroups-namespaces-overlayfs'); return false;">cgroups &amp; OverlayFS</a>
          <a href="#terraform-engine-dag-state-locking" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'terraform-engine-dag-state-locking'); return false;">Terraform DAG</a>
          <a href="#helm3-template-engine-secrets-release" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'helm3-template-engine-secrets-release'); return false;">Helm 3 Secrets</a>
          <a href="#k8s-cni-iptables-cilium-ebpf" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'k8s-cni-iptables-cilium-ebpf'); return false;">Cilium eBPF</a>
          <a href="#devops-q1-oomkilled-exit-137-vs-crashloop" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q1-oomkilled-exit-137-vs-crashloop'); return false;">OOMKilled 137</a>
          <a href="#devops-q2-dns-resolution-timeout-ndots5" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q2-dns-resolution-timeout-ndots5'); return false;">ndots:5 Trap</a>
          <a href="#devops-q4-zero-downtime-rolling-deployments-pdb" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q4-zero-downtime-rolling-deployments-pdb'); return false;">Zero-Downtime PDB</a>
          <a href="#devops-q5-statefulsets-vs-deployments-persistent-identity" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q5-statefulsets-vs-deployments-persistent-identity'); return false;">StatefulSets</a>
          <a href="#devops-q7-terraform-state-lock-stuck-recovery" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q7-terraform-state-lock-stuck-recovery'); return false;">TF State Lock</a>
          <a href="#devops-q14-argocd-gitops-outofsync-loop-selfhealing" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q14-argocd-gitops-outofsync-loop-selfhealing'); return false;">GitOps ArgoCD</a>
          <a href="#devops-q20-canary-deployments-argo-rollouts-service-mesh" class="compact-mini-pill" onclick="app.navigateToTopic('devops', 'devops-q20-canary-deployments-argo-rollouts-service-mesh'); return false;">Canary Rollouts</a>
        </div>
      </div>
    `;

    // 8b. Application Lifecycle (Spring Boot to GCP & Apigee)
    const lifecycleStages = window.REVISION_APP_DATA?.LIFECYCLE_STAGES || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('lifecycle')">
          <span>🚀 App Lifecycle (GCP)</span>
          <span class="badge-count">${lifecycleStages.length} Stages</span>
        </button>
        <div class="compact-pills-row">
          <a href="#stage-1-local-dev" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(1); return false;">1. Local Dev</a>
          <a href="#stage-3-ci-trigger" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(3); return false;">3. Jenkins CI</a>
          <a href="#stage-4-build-and-test" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(4); return false;">4. Maven Build</a>
          <a href="#stage-5-containerization" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(5); return false;">5. Dockerfile</a>
          <a href="#stage-6-registry" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(6); return false;">6. Artifact Reg</a>
          <a href="#stage-7-configuration-manifests" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(7); return false;">7. Helm Values</a>
          <a href="#stage-8-gke-deployment" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(8); return false;">8. GKE Deploy</a>
          <a href="#stage-9-apigee-gateway" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(9); return false;">9. Apigee X</a>
          <a href="#stage-10-ingress-load-balancing" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(10); return false;">10. Ingress &amp; TLS</a>
          <a href="#stage-11-observability" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(11); return false;">11. Observability</a>
          <a href="#stage-12-rollback" class="compact-mini-pill" onclick="app.navigateToLifecycleStage(12); return false;">12. Rollback</a>
        </div>
      </div>
    `;

    // 8c. AWS Cloud Services Group
    const awsServices = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('aws')">
          <span>☁️ AWS Cloud</span>
          <span class="badge-count">${awsServices.length} Services</span>
        </button>
        <div class="compact-pills-row">
          <a href="#aws-iam" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-iam'); return false;">IAM &amp; IRSA</a>
          <a href="#aws-ec2" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-ec2'); return false;">EC2 &amp; Nitro</a>
          <a href="#aws-s3" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-s3'); return false;">S3 Object</a>
          <a href="#aws-rds" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-rds'); return false;">Aurora 6-Way</a>
          <a href="#aws-dynamodb" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-dynamodb'); return false;">DynamoDB</a>
          <a href="#aws-lambda" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-lambda'); return false;">Lambda SnapStart</a>
          <a href="#aws-eks" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-eks'); return false;">EKS &amp; CNI</a>
          <a href="#aws-sqs-sns" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-sqs-sns'); return false;">SNS-SQS Fanout</a>
          <a href="#aws-api-gateway" class="compact-mini-pill" onclick="app.navigateToAwsTopic('aws-api-gateway'); return false;">API Gateway</a>
        </div>
      </div>
    `;

    // 8d. Google Cloud Platform (GCP) Group
    const gcpServices = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('gcp')">
          <span>🌐 Google Cloud (GCP)</span>
          <span class="badge-count">${gcpServices.length} Services</span>
        </button>
        <div class="compact-pills-row">
          <a href="#gcp-iam" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-iam'); return false;">IAM &amp; Workload Id</a>
          <a href="#gcp-gce" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-gce'); return false;">GCE Migration</a>
          <a href="#gcp-gcs" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-gcs'); return false;">GCS Colossus</a>
          <a href="#gcp-cloud-sql" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-cloud-sql'); return false;">Spanner TrueTime</a>
          <a href="#gcp-gke" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-gke'); return false;">GKE Autopilot</a>
          <a href="#gcp-cloud-run" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-cloud-run'); return false;">Cloud Run 250x</a>
          <a href="#gcp-pubsub" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-pubsub'); return false;">Pub/Sub Stream</a>
          <a href="#gcp-bigquery" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-bigquery'); return false;">BigQuery Dremel</a>
          <a href="#gcp-apigee" class="compact-mini-pill" onclick="app.navigateToGcpTopic('gcp-apigee'); return false;">Apigee Gateway</a>
        </div>
      </div>
    `;

    // 8e. Microservices Architecture Patterns Group
    const microservicesPatterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('microservices')">
          <span>🌐 Microservices Patterns</span>
          <span class="badge-count">${microservicesPatterns.length} Patterns</span>
        </button>
        <div class="compact-pills-row">
          <a href="#ms-strangler-fig" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-strangler-fig'); return false;">Strangler Fig</a>
          <a href="#ms-saga-orchestration" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-saga-orchestration'); return false;">Saga Orch</a>
          <a href="#ms-saga-choreography" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-saga-choreography'); return false;">Choreography</a>
          <a href="#ms-transactional-outbox" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-transactional-outbox'); return false;">Outbox</a>
          <a href="#ms-cqrs" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-cqrs'); return false;">CQRS</a>
          <a href="#ms-event-sourcing" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-event-sourcing'); return false;">Event Sourcing</a>
          <a href="#ms-api-gateway" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-api-gateway'); return false;">API Gateway</a>
          <a href="#ms-backend-for-frontend" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-backend-for-frontend'); return false;">BFF</a>
          <a href="#ms-circuit-breaker" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-circuit-breaker'); return false;">Circuit Breaker</a>
          <a href="#ms-bulkhead" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-bulkhead'); return false;">Bulkhead</a>
          <a href="#ms-distributed-tracing" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-distributed-tracing'); return false;">Tracing</a>
          <a href="#ms-service-mesh" class="compact-mini-pill" onclick="app.navigateToMicroservicesPattern('ms-service-mesh'); return false;">Service Mesh</a>
        </div>
      </div>
    `;

    // 9. Redis Group
    const redisTopics = window.REVISION_APP_DATA?.REDIS_TOPICS || [];
    const redisQuestions = window.REVISION_APP_DATA?.REDIS_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('redis')">
          <span>🟥 Redis &amp; Caching</span>
          <span class="badge-count">${redisTopics.length + redisQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#redis-event-loop-epoll-io-threads" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-event-loop-epoll-io-threads'); return false;">Reactor Loop</a>
          <a href="#redis-data-structures-internals" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-data-structures-internals'); return false;">SDS &amp; Skiplist</a>
          <a href="#redis-persistence-rdb-aof-cow" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-persistence-rdb-aof-cow'); return false;">RDB/AOF CoW</a>
          <a href="#redis-cluster-hash-slots-redirection" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-cluster-hash-slots-redirection'); return false;">16,384 Slots</a>
          <a href="#redis-distributed-lock-redlock-lua" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-distributed-lock-redlock-lua'); return false;">Redlock &amp; Lua</a>
          <a href="#redis-q1-cache-stampede-thundering-herd" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q1-cache-stampede-thundering-herd'); return false;">Cache Stampede</a>
          <a href="#redis-q2-cache-penetration-bloom-filter" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q2-cache-penetration-bloom-filter'); return false;">Bloom Filter</a>
          <a href="#redis-q3-cache-breakdown-vs-cache-avalanche" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q3-cache-breakdown-vs-cache-avalanche'); return false;">Breakdown/Avalanche</a>
          <a href="#redis-q4-big-keys-and-hot-keys-detection-lazyfree" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q4-big-keys-and-hot-keys-detection-lazyfree'); return false;">Big Keys UNLINK</a>
          <a href="#redis-q5-redis-dual-write-consistency-sql" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q5-redis-dual-write-consistency-sql'); return false;">Dual-Write SQL</a>
          <a href="#redis-q6-redis-distributed-lock-pitfalls-redisson" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q6-redis-distributed-lock-pitfalls-redisson'); return false;">Watchdog Renew</a>
          <a href="#redis-q7-memory-fragmentation-ratio-activedefrag" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q7-memory-fragmentation-ratio-activedefrag'); return false;">Fragmentation Ratio</a>
          <a href="#redis-q8-aof-rewrite-disk-spikes-fork-cow-exhaustion" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q8-aof-rewrite-disk-spikes-fork-cow-exhaustion'); return false;">THP CoW Memory</a>
          <a href="#redis-q9-sentinel-split-brain-data-loss" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q9-sentinel-split-brain-data-loss'); return false;">Sentinel Split-Brain</a>
          <a href="#redis-q10-transactions-multi-exec-lua-atomicity" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q10-transactions-multi-exec-lua-atomicity'); return false;">No Rollback Lua</a>
          <a href="#redis-q11-zset-skiplist-internal-mechanics" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q11-zset-skiplist-internal-mechanics'); return false;">ZSet Span Rank</a>
          <a href="#redis-q12-redis-streams-vs-kafka" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q12-redis-streams-vs-kafka'); return false;">Redis Streams</a>
          <a href="#redis-q13-client-side-caching-tracking-resp3" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q13-client-side-caching-tracking-resp3'); return false;">Client Tracking</a>
          <a href="#redis-q20-rate-limiting-sliding-window-token-bucket" class="compact-mini-pill" onclick="app.navigateToTopic('redis', 'redis-q20-rate-limiting-sliding-window-token-bucket'); return false;">Sliding Rate Limit</a>
        </div>
      </div>
    `;

    // 10. Concurrency Group
    const concurrencyTopics = window.REVISION_APP_DATA?.CONCURRENCY_TOPICS || [];
    const concurrencyQuestions = window.REVISION_APP_DATA?.CONCURRENCY_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('concurrency')">
          <span>🧵 Concurrency</span>
          <span class="badge-count">${concurrencyTopics.length + concurrencyQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#jmm-memory-barriers-instruction-reordering" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'jmm-memory-barriers-instruction-reordering'); return false;">JMM Barriers</a>
          <a href="#jvm-lock-escalation-biased-lightweight-heavyweight" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'jvm-lock-escalation-biased-lightweight-heavyweight'); return false;">Lock Escalation</a>
          <a href="#aqs-framework-reentrantlock-internals" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'aqs-framework-reentrantlock-internals'); return false;">AQS &amp; CLH</a>
          <a href="#threadpoolexecutor-architecture-saturation" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'threadpoolexecutor-architecture-saturation'); return false;">ThreadPool ctl</a>
          <a href="#java21-virtual-threads-project-loom" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'java21-virtual-threads-project-loom'); return false;">Virtual Threads</a>
          <a href="#concurrency-q1-dcl-singleton-bytecode-reordering" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q1-dcl-singleton-bytecode-reordering'); return false;">DCL 1-3-2</a>
          <a href="#concurrency-q2-false-sharing-contended-cache-lines" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q2-false-sharing-contended-cache-lines'); return false;">False Sharing</a>
          <a href="#concurrency-q3-aba-problem-atomicstampedreference" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q3-aba-problem-atomicstampedreference'); return false;">ABA Problem</a>
          <a href="#concurrency-q4-deadlock-detection-thread-dumps-jstack" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q4-deadlock-detection-thread-dumps-jstack'); return false;">Deadlock jstack</a>
          <a href="#concurrency-q5-interrupted-exception-swallowing-pattern" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q5-interrupted-exception-swallowing-pattern'); return false;">Interrupt Trap</a>
          <a href="#concurrency-q6-threadlocal-memory-leak-threadpool" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q6-threadlocal-memory-leak-threadpool'); return false;">ThreadLocal Leak</a>
          <a href="#concurrency-q7-longadder-striped64-vs-atomiclong-contention" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q7-longadder-striped64-vs-atomiclong-contention'); return false;">LongAdder Striped64</a>
          <a href="#concurrency-q8-reentrantreadwritelock-vs-stampedlock-optimistic" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q8-reentrantreadwritelock-vs-stampedlock-optimistic'); return false;">StampedLock</a>
          <a href="#concurrency-q9-countdownlatch-vs-cyclicbarrier-vs-semaphore" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q9-countdownlatch-vs-cyclicbarrier-vs-semaphore'); return false;">Sync Primitives</a>
          <a href="#concurrency-q10-completablefuture-exception-handling" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q10-completablefuture-exception-handling'); return false;">CompletableFuture</a>
          <a href="#concurrency-q11-caller-runs-policy-backpressure" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q11-caller-runs-policy-backpressure'); return false;">CallerRuns</a>
          <a href="#concurrency-q16-virtual-thread-pinning-synchronized" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q16-virtual-thread-pinning-synchronized'); return false;">Carrier Pinning</a>
          <a href="#concurrency-q17-concurrenthashmap-resizing-forwarding-node" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q17-concurrenthashmap-resizing-forwarding-node'); return false;">CHM ForwardingNode</a>
          <a href="#concurrency-q19-bounded-buffer-producer-consumer-condition" class="compact-mini-pill" onclick="app.navigateToTopic('concurrency', 'concurrency-q19-bounded-buffer-producer-consumer-condition'); return false;">Producer-Consumer</a>
        </div>
      </div>
    `;

    // 11. HLD Group
    const hldTopics = window.REVISION_APP_DATA?.HLD_TOPICS || [];
    const hldQuestions = window.REVISION_APP_DATA?.HLD_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('hld')">
          <span>🏗️ System Design (HLD)</span>
          <span class="badge-count">${hldTopics.length + hldQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#hld-interview-roadmap-and-clarification-framework" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-interview-roadmap-and-clarification-framework'); return false;">45-Min Playbook</a>
          <a href="#hld-storage-decision-matrix-sql-vs-nosql-vs-newsql" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-storage-decision-matrix-sql-vs-nosql-vs-newsql'); return false;">Storage Matrix</a>
          <a href="#hld-caching-and-edge-tier-decisions" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-caching-and-edge-tier-decisions'); return false;">Caching Tiers</a>
          <a href="#hld-messaging-and-async-processing" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-messaging-and-async-processing'); return false;">Outbox &amp; Kafka</a>
          <a href="#hld-consistency-consensus-cap-pacelc" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-consistency-consensus-cap-pacelc'); return false;">CAP &amp; Saga</a>
          <a href="#hld-rate-limiting-and-gateway-patterns" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-rate-limiting-and-gateway-patterns'); return false;">Gateways &amp; LB</a>
          <a href="#hld-p1-url-shortener-tinyurl" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p1-url-shortener-tinyurl'); return false;">TinyURL</a>
          <a href="#hld-p2-rate-limiter-api-gateway" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p2-rate-limiter-api-gateway'); return false;">Rate Limiter</a>
          <a href="#hld-p3-whatsapp-messenger-chat" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p3-whatsapp-messenger-chat'); return false;">WhatsApp Chat</a>
          <a href="#hld-p4-netflix-youtube-video-streaming" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p4-netflix-youtube-video-streaming'); return false;">Video Streaming</a>
          <a href="#hld-p5-uber-lyft-geospatial-service" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p5-uber-lyft-geospatial-service'); return false;">Uber Geospatial</a>
          <a href="#hld-p6-twitter-x-newsfeed" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p6-twitter-x-newsfeed'); return false;">Twitter Feed</a>
          <a href="#hld-p7-flash-sale-ticket-booking" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p7-flash-sale-ticket-booking'); return false;">Flash Sale</a>
          <a href="#hld-p8-distributed-unique-id-generator" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p8-distributed-unique-id-generator'); return false;">Snowflake IDs</a>
          <a href="#hld-p9-distributed-key-value-store" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p9-distributed-key-value-store'); return false;">Dynamo KV</a>
          <a href="#hld-p10-distributed-web-crawler" class="compact-mini-pill" onclick="app.navigateToTopic('hld', 'hld-p10-distributed-web-crawler'); return false;">Web Crawler</a>
        </div>
      </div>
    `;

    // 12. LLD Group
    const lldTopics = window.REVISION_APP_DATA?.LLD_TOPICS || [];
    const lldQuestions = window.REVISION_APP_DATA?.LLD_QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('lld')">
          <span>📐 Low-Level Design (LLD)</span>
          <span class="badge-count">${lldTopics.length + lldQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#lld-machine-coding-roadmap-playbook" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-machine-coding-roadmap-playbook'); return false;">60-Min Playbook</a>
          <a href="#lld-design-pattern-decision-matrix" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-design-pattern-decision-matrix'); return false;">Patterns Matrix</a>
          <a href="#lld-solid-clean-architecture-principles" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-solid-clean-architecture-principles'); return false;">SOLID Rules</a>
          <a href="#lld-concurrency-thread-safety-in-lld" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-concurrency-thread-safety-in-lld'); return false;">Thread-Safety</a>
          <a href="#lld-p1-parking-lot-system" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p1-parking-lot-system'); return false;">Parking Lot</a>
          <a href="#lld-p2-elevator-system" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p2-elevator-system'); return false;">Elevator Fleet</a>
          <a href="#lld-p3-tic-tac-toe-game" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p3-tic-tac-toe-game'); return false;">Tic-Tac-Toe O(1)</a>
          <a href="#lld-p4-splitwise-expense-sharing" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p4-splitwise-expense-sharing'); return false;">Splitwise Debts</a>
          <a href="#lld-p5-snake-and-ladder" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p5-snake-and-ladder'); return false;">Snake &amp; Ladder</a>
          <a href="#lld-p6-bookmyshow-movie-booking" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p6-bookmyshow-movie-booking'); return false;">BookMyShow</a>
          <a href="#lld-p7-atm-machine-system" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p7-atm-machine-system'); return false;">ATM Machine</a>
          <a href="#lld-p8-vending-machine-system" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p8-vending-machine-system'); return false;">Vending Machine</a>
          <a href="#lld-p9-logging-framework-log4j" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p9-logging-framework-log4j'); return false;">Async Log4j</a>
          <a href="#lld-p10-in-memory-cache-lru-lfu" class="compact-mini-pill" onclick="app.navigateToTopic('lld', 'lld-p10-in-memory-cache-lru-lfu'); return false;">LRU/LFU Cache</a>
        </div>
      </div>
    `;

    // 4. DSA Group
    const dsaTopics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('dsa')">
          <span>⚡ DSA &amp; Patterns</span>
          <span class="badge-count">${dsaTopics.length} Patterns</span>
        </button>
        <div class="compact-pills-row">
          <a href="#dsa-two-pointers" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-two-pointers'); return false;">Two Pointers</a>
          <a href="#dsa-sliding-window" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-sliding-window'); return false;">Sliding Window</a>
          <a href="#dsa-fast-slow-pointers" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-fast-slow-pointers'); return false;">Fast &amp; Slow</a>
          <a href="#dsa-monotonic-stack" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-monotonic-stack'); return false;">Mono Stack</a>
          <a href="#dsa-monotonic-deque" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-monotonic-deque'); return false;">Mono Deque</a>
          <a href="#dsa-merge-intervals" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-merge-intervals'); return false;">Intervals</a>
          <a href="#dsa-cyclic-sort" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-cyclic-sort'); return false;">Cyclic Sort</a>
          <a href="#dsa-binary-search-answer" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-binary-search-answer'); return false;">BS on Answer</a>
          <a href="#dsa-top-k-heap" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-top-k-heap'); return false;">Top K Heap</a>
          <a href="#dsa-two-heaps" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-two-heaps'); return false;">Two Heaps</a>
          <a href="#dsa-k-way-merge" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-k-way-merge'); return false;">K-Way Merge</a>
          <a href="#dsa-bfs-graph" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-bfs-graph'); return false;">BFS Grid</a>
          <a href="#dsa-dfs-islands" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-dfs-islands'); return false;">DFS Islands</a>
          <a href="#dsa-topological-sort" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-topological-sort'); return false;">Kahn's Topo</a>
          <a href="#dsa-union-find" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-union-find'); return false;">Union-Find DSU</a>
          <a href="#dsa-graph-dijkstra" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-graph-dijkstra'); return false;">Dijkstra</a>
          <a href="#dsa-backtracking" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-backtracking'); return false;">Backtracking</a>
          <a href="#dsa-dp-1d-kadane" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-dp-1d-kadane'); return false;">Kadane 1D DP</a>
          <a href="#dsa-dp-2d-knapsack" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-dp-2d-knapsack'); return false;">0/1 Knapsack</a>
          <a href="#dsa-dp-strings-lcs" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-dp-strings-lcs'); return false;">LCS String DP</a>
          <a href="#dsa-tree-dp-lca" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-tree-dp-lca'); return false;">Tree DP &amp; LCA</a>
          <a href="#dsa-dp-bitmask" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-dp-bitmask'); return false;">Bitmask DP</a>
          <a href="#dsa-trie-prefix" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-trie-prefix'); return false;">Trie Prefix</a>
          <a href="#dsa-bit-manipulation" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-bit-manipulation'); return false;">Bit Manipulation</a>
          <a href="#dsa-segment-fenwick-tree" class="compact-mini-pill" onclick="app.navigateToDsaPattern('dsa-segment-fenwick-tree'); return false;">Fenwick Tree</a>
          <a href="#lru-cache-implementation" class="compact-mini-pill" onclick="app.navigateToDsaPattern('lru-cache-implementation'); return false;">LRU Cache</a>
          <a href="#lfu-cache-implementation" class="compact-mini-pill" onclick="app.navigateToDsaPattern('lfu-cache-implementation'); return false;">LFU Cache</a>
          <a href="#sliding-window-rate-limiter" class="compact-mini-pill" onclick="app.navigateToDsaPattern('sliding-window-rate-limiter'); return false;">Token Bucket</a>
        </div>
      </div>
    `;

    // 5. Tricky Questions Group
    const questions = window.REVISION_APP_DATA?.QUESTIONS || [];
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('questions')">
          <span>🔥 Tricky Q&A</span>
          <span class="badge-count">${questions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#q-spring-transactional-self-invocation" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-spring-transactional-self-invocation'); return false;">Self-Invocation</a>
          <a href="#q-oops-1-private-method-override" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-oops-1-private-method-override'); return false;">Private Override</a>
          <a href="#q-oops-2-static-method-hiding" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-oops-2-static-method-hiding'); return false;">Static Hiding</a>
          <a href="#q-oops-3-covariant-return-types-bridge" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-oops-3-covariant-return-types-bridge'); return false;">Covariant Bridge</a>
          <a href="#q-oops-6-constructor-polymorphism-leak" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-oops-6-constructor-polymorphism-leak'); return false;">Leaking Constructor</a>
          <a href="#q-oops-7-field-hiding-no-polymorphism" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-oops-7-field-hiding-no-polymorphism'); return false;">Field Hiding</a>
          <a href="#q-oops-9-interface-default-diamond-rules" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-oops-9-interface-default-diamond-rules'); return false;">Diamond Problem</a>
          <a href="#q-java-volatile-vs-synchronized-dcl" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-java-volatile-vs-synchronized-dcl'); return false;">Volatile DCL</a>
          <a href="#q-prototype-in-singleton" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-prototype-in-singleton'); return false;">@Lookup</a>
          <a href="#q-dual-write-kafka-outbox" class="compact-mini-pill" onclick="app.navigateToTopic('questions', 'q-dual-write-kafka-outbox'); return false;">Kafka Outbox</a>
        </div>
      </div>

      <!-- 20. 140 Rapid-Fire Multi-Skill Rubric Group -->
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('rapidfire')" style="border-left: 2px solid var(--accent-orange);">
          <span style="color: #fb923c;">⚡ 140 Rapid-Fire</span>
          <span class="badge-count" style="background: rgba(249, 115, 22, 0.2); color: #fb923c;">140</span>
        </button>
        <div class="compact-pills-row">
          <a href="#rf-java-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('java'); app.switchSection('rapidfire'); return false;">☕ Java (20)</a>
          <a href="#rf-spring-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('spring'); app.switchSection('rapidfire'); return false;">🍃 Spring (20)</a>
          <a href="#rf-micro-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('microservices'); app.switchSection('rapidfire'); return false;">🌐 Microservices (20)</a>
          <a href="#rf-js-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('javascript'); app.switchSection('rapidfire'); return false;">📜 JS/TS (20)</a>
          <a href="#rf-react-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('react'); app.switchSection('rapidfire'); return false;">⚛️ React (20)</a>
          <a href="#rf-db-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('database'); app.switchSection('rapidfire'); return false;">🗄️ DB/NoSQL (20)</a>
          <a href="#rf-devops-1" class="compact-mini-pill" onclick="app.filterRapidFireByCategory('devops'); app.switchSection('rapidfire'); return false;">🚀 DevOps (20)</a>
        </div>
      </div>
    `;

    html += '</div>';
    navContainer.innerHTML = html;
  }

  filterSidebarLinks(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.compact-section-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'block' : 'none';
    });
  }

  navigateToTopic(sectionId, topicId) {
    this.switchSection(sectionId);
    this.closeMobileSidebar();
    if (sectionId === 'spring' && topicId.startsWith('sb-int-')) {
      this.selectSpringInternalTopic(topicId);
      return;
    }
    if (sectionId === 'java' && topicId.startsWith('java-version-')) {
      this.filterJavaCategory('versions');
      setTimeout(() => {
        this.scrollToJavaVersion(topicId);
      }, 100);
      return;
    }
    if (sectionId === 'java' && topicId.startsWith('java-int-')) {
      this.selectJavaInternalTopic(topicId);
      return;
    }
    if (sectionId === 'design-patterns') {
      this.switchSection('design-patterns');
      this.closeMobileSidebar();
      this.selectJavaPattern(topicId);
      return;
    }
    if (sectionId === 'microservices') {
      this.switchSection('microservices');
      this.closeMobileSidebar();
      this.selectMicroservicesPattern(topicId);
      return;
    }
    if (sectionId === 'dsa') {
      this.switchSection('dsa');
      this.closeMobileSidebar();
      this.selectDsaPattern(topicId);
      return;
    }
    if (sectionId === 'aws') {
      this.switchSection('aws');
      this.closeMobileSidebar();
      this.selectAwsTopic(topicId);
      return;
    }
    if (sectionId === 'gcp') {
      this.switchSection('gcp');
      this.closeMobileSidebar();
      this.selectGcpTopic(topicId);
      return;
    }
    if (sectionId === 'lifecycle') {
      this.switchSection('lifecycle');
      this.closeMobileSidebar();
      setTimeout(() => {
        const el = document.getElementById(topicId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('open');
          const header = el.querySelector('.lifecycle-header');
          if (header) header.setAttribute('aria-expanded', 'true');
        }
      }, 120);
      return;
    }
    if (sectionId === 'rapidfire' || topicId.startsWith('rf-')) {
      this.switchSection('rapidfire');
      this.closeMobileSidebar();
      this.filterRapidFireByCategory('all');
      setTimeout(() => {
        const el = document.getElementById(topicId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('open');
          el.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.4)';
          setTimeout(() => el.style.boxShadow = '', 2000);
        }
      }, 120);
      return;
    }
    setTimeout(() => {
      const el = document.getElementById(topicId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.4)';
        setTimeout(() => el.style.boxShadow = '', 2000);

        // Open if expandable
        el.classList.add('open');
      }
    }, 120);
  }

  navigateToJavaInternal(topicId) {
    this.switchSection('java');
    this.closeMobileSidebar();
    this.selectJavaInternalTopic(topicId);
  }

  navigateToSpringInternal(topicId) {
    this.switchSection('spring');
    this.closeMobileSidebar();
    this.selectSpringInternalTopic(topicId);
  }

  navigateToJavaPattern(patternId) {
    this.switchSection('design-patterns');
    this.closeMobileSidebar();
    this.selectJavaPattern(patternId);
  }

  navigateToMicroservicesPattern(patternId) {
    this.switchSection('microservices');
    this.closeMobileSidebar();
    this.selectMicroservicesPattern(patternId);
  }

  navigateToDsaPattern(patternId) {
    this.switchSection('dsa');
    this.closeMobileSidebar();
    this.selectDsaPattern(patternId);
  }

  // -------------------------------------------------------------
  // Expandable Topic Cards Rendering (Java, Spring, DSA)
  // -------------------------------------------------------------
  renderJavaSubtopicSelector() {
    const select = document.getElementById('java-subtopic-select');
    if (!select) return;

    const topics = window.REVISION_APP_DATA?.JAVA_460_TOPICS || [];
    const categories = window.REVISION_APP_DATA?.JAVA_460_CATEGORIES || [
      { id: "oop", title: "OOP & Design (6 Topics, 60 Qs)" },
      { id: "strings", title: "Strings, Wrappers & Exceptions (7 Topics, 70 Qs)" },
      { id: "collections", title: "Collections Framework (6 Topics, 60 Qs)" },
      { id: "concurrency", title: "Multithreading & Concurrency (9 Topics, 90 Qs)" },
      { id: "java8", title: "Java 8+ Features & Loom (7 Topics, 70 Qs)" },
      { id: "jvm", title: "JVM Internals & Memory (6 Topics, 60 Qs)" },
      { id: "edge", title: "Tricky Edge Cases (5 Topics, 50 Qs)" }
    ];

    let html = '<option value="all">-- Jump to any of the 46 Subtopics (10 Qs each) --</option>';
    categories.forEach(cat => {
      const catTopics = topics.filter(t => t.category === cat.id);
      if (catTopics.length > 0) {
        html += `<optgroup label="${cat.title}">`;
        catTopics.forEach(t => {
          html += `<option value="${t.topicId}">${t.topicTitle} (10 Qs)</option>`;
        });
        html += `</optgroup>`;
      }
    });

    select.innerHTML = html;
  }

  selectJavaSubtopic(topicId) {
    const banner = document.getElementById('java-active-topic-banner');
    const container = document.getElementById('java-cards-container');
    const select = document.getElementById('java-subtopic-select');
    if (!container) return;

    if (select && topicId) select.value = topicId;

    if (!topicId || topicId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderJavaTopics('all');
      return;
    }

    const topics = window.REVISION_APP_DATA?.JAVA_460_TOPICS || [];
    const topic = topics.find(t => t.topicId === topicId);
    const questions = window.REVISION_APP_DATA?.JAVA_TOPIC_MAP?.[topicId] || topic?.questions || [];

    if (banner && topic) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
              <span class="hero-badge-pill highlight" style="font-size: 0.75rem;">Selected Subtopic</span>
              <strong style="color: var(--text-primary); font-size: 1.05rem;">${topic.topicTitle}</strong>
              <span style="font-size: 0.78rem; color: var(--text-link); font-weight: 700;">(10 Tricky Senior Questions)</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${topic.summary}</div>
          </div>
          <button class="btn-secondary" style="font-size: 0.75rem; padding: 4px 10px; white-space: nowrap;" onclick="app.selectJavaSubtopic('all')">✕ Clear Filter</button>
        </div>
      `;
    }

    const formattedList = questions.map(q => this.formatQuestionAsTopic(q, topic?.topicTitle || 'Java Topic'));
    container.innerHTML = this.renderTopicCardsHtml(formattedList, 'border-java');

    setTimeout(() => {
      const firstCard = container.querySelector('.cheat-card');
      if (firstCard) firstCard.classList.add('open');
    }, 50);
  }

  searchJavaQuestions(query) {
    const container = document.getElementById('java-cards-container');
    const banner = document.getElementById('java-active-topic-banner');
    if (!container) return;

    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      if (banner) banner.style.display = 'none';
      this.renderJavaTopics('all');
      return;
    }

    const allQuestions = window.REVISION_APP_DATA?.JAVA_460_QUESTIONS || [];
    const matches = allQuestions.filter(q => 
      (q.title || '').toLowerCase().includes(qLower) ||
      (q.question || '').toLowerCase().includes(qLower) ||
      (q.topicTitle || '').toLowerCase().includes(qLower) ||
      (q.innerWorking || '').toLowerCase().includes(qLower) ||
      (q.trap || '').toLowerCase().includes(qLower) ||
      (q.problem || '').toLowerCase().includes(qLower) ||
      (q.codeSnippet || '').toLowerCase().includes(qLower)
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <strong>Search Results:</strong> Found <strong>${matches.length}</strong> questions matching "<em>${this.escapeHtml(query)}</em>" across 46 subtopics.
          </div>
          <button class="btn-secondary" style="font-size: 0.75rem; padding: 4px 10px;" onclick="document.getElementById('java-question-search').value=''; app.searchJavaQuestions('');">Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(q => this.formatQuestionAsTopic(q, q.topicTitle || 'Search Match'));
    container.innerHTML = matches.length > 0 
      ? this.renderTopicCardsHtml(formattedList, 'border-java')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No questions found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>equals</em>, <em>volatile</em>, <em>virtual threads</em>, or <em>metaspace</em>.</div>
        </div>`;
  }

  // -------------------------------------------------------------
  // Java Core Engine Internals (55 Topics & Deep Dives)
  // -------------------------------------------------------------
  renderJavaInternalsSelector() {
    const select = document.getElementById('java-internals-select');
    if (!select) return;

    const internals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    const categories = window.REVISION_APP_DATA?.JAVA_INTERNALS_CATEGORIES || [
      { id: "jvm_memory", title: "☕ JVM Memory & GC" },
      { id: "classloading", title: "⚙️ Class Loading & JIT" },
      { id: "jmm", title: "🧵 Java Memory Model & Threads" },
      { id: "concurrency", title: "⚡ Concurrency & Synchronizers" },
      { id: "collections", title: "📦 Collections Framework" },
      { id: "strings", title: "🔤 Strings & Object Semantics" },
      { id: "io_nio", title: "💾 I/O, NIO & Serialization" }
    ];

    const isJavaCatMatch = (catId, tc) => {
      if (catId === 'jvm_memory') return tc === 'JVM Memory & Architecture';
      if (catId === 'classloading') return tc === 'Class Loading & JIT';
      if (catId === 'jmm') return tc === 'Java Memory Model & Threads';
      if (catId === 'concurrency') return tc === 'Advanced Concurrency & Synchronizers';
      if (catId === 'collections') return tc === 'Collections Framework Internals';
      if (catId === 'strings') return tc === 'Strings & Object Semantics';
      if (catId === 'io_nio') return tc === 'I/O, NIO & Serialization';
      return false;
    };

    let html = '<option value="all">-- Jump to any of the 55 Java Internals --</option>';
    categories.forEach(cat => {
      const catTopics = internals.filter(t => isJavaCatMatch(cat.id, t.category));
      if (catTopics.length > 0) {
        html += `<optgroup label="${cat.title} (${catTopics.length} Topics)">`;
        catTopics.forEach(t => {
          html += `<option value="${t.id}">${t.title}</option>`;
        });
        html += `</optgroup>`;
      }
    });

    select.innerHTML = html;
  }

  selectJavaInternalTopic(topicId) {
    const banner = document.getElementById('java-active-internal-banner');
    const container = document.getElementById('java-cards-container');
    const select = document.getElementById('java-internals-select');
    if (!container) return;

    if (select && topicId) select.value = topicId;

    if (!topicId || topicId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderJavaTopics('internals');
      return;
    }

    const internals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    const topic = internals.find(t => t.id === topicId);
    if (!topic) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap; width: 100%;">
          <div style="flex: 1 1 500px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
              <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected Core Internal Mechanic</span>
              <strong style="color: var(--text-primary); font-size: 1.05rem;">${topic.title}</strong>
              <span class="hero-badge-pill" style="font-size: 0.72rem;">${topic.badge}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${topic.whatIsIt}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #2563eb;" onclick="app.openJavaInternalModal('${topic.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectJavaInternalTopic('all')">✕ View All 55</button>
          </div>
        </div>
      `;
    }

    const formattedTopic = this.formatJavaInternalAsTopic(topic);
    container.innerHTML = this.renderTopicCardsHtml([formattedTopic], 'border-java');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }

  searchJavaInternals(query) {
    const container = document.getElementById('java-cards-container');
    const banner = document.getElementById('java-active-internal-banner');
    if (!container) return;

    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      if (banner) banner.style.display = 'none';
      this.renderJavaTopics('internals');
      return;
    }

    const internals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    const matches = internals.filter(t =>
      (t.title || '').toLowerCase().includes(qLower) ||
      (t.oneLiner || '').toLowerCase().includes(qLower) ||
      (t.whatIsIt || '').toLowerCase().includes(qLower) ||
      (t.internalWorking || '').toLowerCase().includes(qLower) ||
      (t.complexPart || '').toLowerCase().includes(qLower) ||
      (t.pitfall || '').toLowerCase().includes(qLower) ||
      (t.interviewTip || '').toLowerCase().includes(qLower) ||
      (t.category || '').toLowerCase().includes(qLower) ||
      (t.badge || '').toLowerCase().includes(qLower) ||
      (t.codeSnippet || '').toLowerCase().includes(qLower) ||
      (t.keyPoints || []).some(kp => kp.toLowerCase().includes(qLower))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> internal topic${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('java-internals-search').value = ''; app.searchJavaInternals('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(item => this.formatJavaInternalAsTopic(item));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-java')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No Java internals found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>AQS</em>, <em>ZGC</em>, <em>JMM</em>, <em>ClassLoader</em>, <em>Virtual Threads</em>, or <em>NIO</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatJavaInternalAsTopic(item) {
    return {
      id: item.id,
      title: item.title,
      category: `Java Internals: ${item.category}`,
      badge: item.badge || 'Engine Internals',
      oneLiner: item.oneLiner || item.whatIsIt,
      visualDiagram: `
        <!-- 1. What Is It Exactly (Elevator Pitch) -->
        <div class="callout-box callout-info" style="margin: 0 0 14px 0; background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8;">
          <span class="callout-icon">💡</span>
          <div>
            <strong style="color: #38bdf8; display: block; margin-bottom: 4px; font-size: 0.85rem;">What is it exactly? (Elevator Pitch)</strong>
            <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.55;">${this.escapeHtml(item.whatIsIt)}</div>
          </div>
        </div>

        <!-- 2. Visual Mental Model / Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 3. Under the Hood Execution Mechanics -->
        <div style="margin: 14px 0 12px 0;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>⚙️</span> Under the Hood (Internal Execution Mechanics):
          </div>
          <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #38bdf8;">
            ${this.escapeHtml(item.internalWorking)}
          </div>
        </div>

        <!-- 4. Complex Part You Must Know (Senior Trap) -->
        <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part You Must Know (Senior/Staff Level Trap):</strong>
            <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #1e3a8a; border-color: #3b82f6;" onclick="event.stopPropagation(); app.openJavaInternalModal('${item.id}')">
            🔍 Open Full-Screen Diagram &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openJavaInternalModal(topicId) {
    const internals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    const topic = internals.find(t => t.id === topicId);
    if (!topic) return;

    this.currentJavaInternalId = topicId;

    const overlay = document.getElementById('java-internals-modal-overlay');
    const catBadge = document.getElementById('java-modal-category-badge');
    const badge = document.getElementById('java-modal-badge');
    const title = document.getElementById('java-modal-title');
    const body = document.getElementById('java-modal-body');
    const footerCount = document.getElementById('java-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = internals.findIndex(t => t.id === topicId);
    if (catBadge) catBadge.textContent = topic.category;
    if (badge) badge.textContent = topic.badge;
    if (title) title.textContent = topic.title;
    if (footerCount) footerCount.textContent = `Topic ${currentIndex + 1} of ${internals.length}: ${topic.title}`;

    body.innerHTML = `
      <!-- 1. What Is It Exactly (Elevator Pitch) -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #38bdf8; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly?</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(topic.whatIsIt)}</div>
        </div>
      </div>

      <!-- 2. Visual Mental Model / Flow Diagram -->
      <div style="margin: 2px 0;">
        ${topic.visualDiagram || ''}
      </div>

      <!-- 3. Under the Hood Mechanics -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px;">
        <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.15rem;">⚙️</span>
          <span>Under the Hood (Internal Execution Mechanics):</span>
        </div>
        <div style="font-size: 0.88rem; line-height: 1.68; color: var(--text-secondary);">
          ${this.escapeHtml(topic.internalWorking)}
        </div>
      </div>

      <!-- 4. Complex Part You Must Know (Senior Trap) -->
      <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
        <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
        <div>
          <strong style="color: #f87171; display: block; font-size: 0.95rem; margin-bottom: 4px;">Complex Part You Must Know (Senior/Staff Trap):</strong>
          <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(topic.complexPart)}</div>
        </div>
      </div>

      <!-- 5. Core Architectural Invariants -->
      <div style="margin-top: 4px;">
        <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-link); margin-bottom: 8px;">
          📌 Core Architectural Invariants:
        </div>
        <ul class="key-points-list">
          ${topic.keyPoints.map(kp => `
            <li class="key-point-item">
              <span class="point-bullet">›</span>
              <span style="font-size: 0.86rem;">${this.escapeHtml(kp)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- 6. Production Code / Bytecode / HotSpot Details -->
      ${topic.codeSnippet ? `
        <div class="card-code-preview" style="margin-top: 4px;">
          <div class="code-header">
            <span>Production Code / Bytecode &amp; Engine Details</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
          </div>
          <pre><code>${this.escapeHtml(topic.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 7. Traps and Tips -->
      ${(topic.pitfall || topic.interviewTip) ? `
        <div class="card-callout-grid" style="margin-top: 4px;">
          ${topic.pitfall ? `
            <div class="callout-box callout-danger" style="margin: 0;">
              <span class="callout-icon">⚠️</span>
              <div><strong>Trap to Avoid:</strong> ${this.escapeHtml(topic.pitfall)}</div>
            </div>
          ` : ''}
          ${topic.interviewTip ? `
            <div class="callout-box callout-tip" style="margin: 0;">
              <span class="callout-icon">💡</span>
              <div><strong>Interview Strategy:</strong> ${this.escapeHtml(topic.interviewTip)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeJavaInternalModal() {
    const overlay = document.getElementById('java-internals-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navigateJavaInternalModal(direction) {
    const internals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    if (internals.length === 0) return;
    let idx = internals.findIndex(t => t.id === this.currentJavaInternalId);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + internals.length) % internals.length;
    this.openJavaInternalModal(internals[newIdx].id);
  }

  renderJavaTopics(filterCategory = 'internals') {
    const container = document.getElementById('java-cards-container');
    const banner = document.getElementById('java-active-internal-banner');
    const ladderSection = document.getElementById('java-versions-ladder-section');
    if (!container) return;

    if (banner && filterCategory !== 'custom') {
      banner.style.display = 'none';
    }

    if (filterCategory === 'versions') {
      if (ladderSection) {
        ladderSection.style.display = 'block';
        ladderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      container.style.display = 'none';
      return;
    } else {
      if (ladderSection) {
        ladderSection.style.display = 'none';
      }
      container.style.display = 'grid';
    }

    const archTopics = window.REVISION_APP_DATA?.JAVA_TOPICS || [];
    const all460Questions = window.REVISION_APP_DATA?.JAVA_460_QUESTIONS || window.REVISION_APP_DATA?.JAVA_QUESTIONS || [];
    const trickyQs = all460Questions.map(q => this.formatQuestionAsTopic(q, q.topicTitle || 'Java Tricky Q&A'));
    const rawInternals = window.REVISION_APP_DATA?.JAVA_INTERNALS || [];
    const formattedInternals = rawInternals.map(item => this.formatJavaInternalAsTopic(item));

    const isJavaCatMatch = (catId, tc) => {
      if (catId === 'jvm_memory') return tc === 'JVM Memory & Architecture';
      if (catId === 'classloading') return tc === 'Class Loading & JIT';
      if (catId === 'jmm') return tc === 'Java Memory Model & Threads';
      if (catId === 'concurrency') return tc === 'Advanced Concurrency & Synchronizers';
      if (catId === 'collections') return tc === 'Collections Framework Internals';
      if (catId === 'strings') return tc === 'Strings & Object Semantics';
      if (catId === 'io_nio') return tc === 'I/O, NIO & Serialization';
      return false;
    };

    let list = [];
    if (filterCategory === 'internals') {
      list = formattedInternals;
    } else if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'tricky-questions') {
      list = trickyQs;
    } else if (['jvm_memory', 'classloading', 'jmm', 'concurrency', 'collections', 'strings', 'io_nio'].includes(filterCategory)) {
      list = rawInternals.filter(t => isJavaCatMatch(filterCategory, t.category)).map(item => this.formatJavaInternalAsTopic(item));
    } else if (filterCategory === 'oop') {
      list = trickyQs.filter(t => (t.category || '').toLowerCase().includes('oop'));
    } else if (filterCategory === 'java8') {
      list = [...archTopics.filter(t => (t.id || '').includes('virtual-threads') || (t.id || '').includes('modern-java')), ...trickyQs.filter(t => (t.category || '').toLowerCase().includes('java 8') || (t.category || '').toLowerCase().includes('java8'))];
    } else if (filterCategory === 'edge-cases' || filterCategory === 'edge') {
      list = trickyQs.filter(t => (t.category || '').toLowerCase().includes('edge'));
    } else if (filterCategory === 'all') {
      list = [...formattedInternals, ...archTopics, ...trickyQs];
    } else {
      list = formattedInternals;
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-java');

    const totalEl = document.getElementById('java-total-count');
    const trickyEl = document.getElementById('java-tricky-count');
    if (totalEl) totalEl.textContent = (archTopics.length + all460Questions.length + rawInternals.length);
    if (trickyEl) trickyEl.textContent = all460Questions.length;
  }

  filterJavaCategory(cat) {
    const container = document.getElementById('section-java');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      if (typeof event !== 'undefined' && event?.target?.classList?.contains('filter-chip')) {
        event.target.classList.add('active');
      }
    }
    this.renderJavaTopics(cat);
  }

  // -------------------------------------------------------------
  // Java LTS Evolution Ladder (Java 8 -> 11 -> 17 -> 21 -> 25)
  // -------------------------------------------------------------
  renderJavaVersions() {
    const stepperContainer = document.getElementById('java-versions-stepper');
    const matrixContainer = document.getElementById('java-version-matrix-container');
    const cardsContainer = document.getElementById('java-version-cards-container');

    const versions = window.REVISION_APP_DATA?.JAVA_VERSIONS || [];
    const matrix = window.REVISION_APP_DATA?.JAVA_VERSION_MATRIX || [];

    if (stepperContainer) {
      stepperContainer.innerHTML = versions.map(v => `
        <div class="java-version-stepper-node" onclick="app.scrollToJavaVersion('${v.id}')" title="Click to inspect ${v.versionNumber} details">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 0.95rem; color: var(--accent-orange);">${v.versionNumber}</span>
            <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: var(--bg-tertiary); color: var(--text-muted); font-weight: 600;">${v.releaseYear}</span>
          </div>
          <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${v.badge}</span>
          <p style="margin: 0; font-size: 0.74rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${this.escapeHtml(v.oneLiner)}
          </p>
        </div>
      `).join('');
    }

    if (matrixContainer) {
      matrixContainer.innerHTML = `
        <table class="java-version-matrix-table">
          <thead>
            <tr>
              <th style="width: 13%;">LTS Version</th>
              <th style="width: 9%;">Release</th>
              <th style="width: 14%;">Ecosystem Status</th>
              <th style="width: 25%;">Flagship Features</th>
              <th style="width: 22%;">Classic Interview Trap</th>
              <th style="width: 17%;">JVM / Memory Evolution</th>
            </tr>
          </thead>
          <tbody>
            ${matrix.map(row => `
              <tr>
                <td>
                  <strong style="color: var(--accent-orange); font-size: 0.88rem;">${this.escapeHtml(row.version)}</strong>
                </td>
                <td>
                  <span style="font-size: 0.78rem; font-weight: 600; background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; color: var(--text-muted);">${this.escapeHtml(row.releaseYear)}</span>
                </td>
                <td>
                  <span style="font-size: 0.76rem; font-weight: 700; color: var(--accent-cyan);">${this.escapeHtml(row.status)}</span>
                </td>
                <td>
                  <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">${this.escapeHtml(row.flagshipFeatures)}</div>
                </td>
                <td>
                  <div style="font-size: 0.82rem; color: #f87171; line-height: 1.45; font-weight: 500;">⚠️ ${this.escapeHtml(row.classicTrap)}</div>
                </td>
                <td>
                  <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">${this.escapeHtml(row.jvmMemoryEvolution)}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (cardsContainer) {
      const formatted = versions.map(v => this.formatJavaVersionAsTopic(v));
      cardsContainer.innerHTML = this.renderTopicCardsHtml(formatted, 'border-java');
      cardsContainer.querySelectorAll('.cheat-card').forEach(card => card.classList.add('open'));
    }
  }

  formatJavaVersionAsTopic(item) {
    const flagshipHtml = (item.flagshipFeatures || []).map(f => {
      const parts = f.split(':');
      if (parts.length > 1) {
        return `<li style="margin-bottom: 6px;"><strong style="color: var(--accent-orange);">${this.escapeHtml(parts[0])}:</strong> ${this.escapeHtml(parts.slice(1).join(':'))}</li>`;
      }
      return `<li style="margin-bottom: 6px;">${this.escapeHtml(f)}</li>`;
    }).join('');

    const trapsHtml = (item.traps || []).map(t => {
      const parts = t.split(':');
      if (parts.length > 1) {
        return `<li style="margin-bottom: 6px;"><strong style="color: #f87171;">⚠️ ${this.escapeHtml(parts[0])}:</strong> ${this.escapeHtml(parts.slice(1).join(':'))}</li>`;
      }
      return `<li style="margin-bottom: 6px;">⚠️ ${this.escapeHtml(t)}</li>`;
    }).join('');

    return {
      id: item.id,
      title: item.title,
      category: `Java LTS Ladder: ${item.versionNumber}`,
      badge: item.badge,
      oneLiner: item.oneLiner,
      visualDiagram: `
        <!-- Elevator Pitch -->
        <div class="callout-box callout-info" style="margin: 0 0 14px 0; background: rgba(249, 115, 22, 0.08); border-left: 4px solid var(--accent-orange);">
          <span class="callout-icon">💡</span>
          <div>
            <strong style="color: var(--accent-orange); display: block; margin-bottom: 4px; font-size: 0.85rem;">What is it exactly? (Elevator Pitch)</strong>
            <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.55;">${this.escapeHtml(item.whatIsIt)}</div>
          </div>
        </div>

        <!-- Flagship Features -->
        <div style="margin: 14px 0 12px 0;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-orange); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>✨</span> Flagship Language &amp; API Features:
          </div>
          <ul style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 16px 12px 28px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-orange); margin: 0;">
            ${flagshipHtml}
          </ul>
        </div>

        <!-- Compiler & Runtime Traps -->
        <div class="version-trap-callout">
          <div style="font-size: 0.84rem; font-weight: 700; color: #f87171; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>🔥</span> Classic Compiler &amp; Runtime Traps (Senior Interview Gotchas):
          </div>
          <ul style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); margin: 0; padding-left: 20px;">
            ${trapsHtml}
          </ul>
        </div>

        <!-- JVM & Native Memory Changes -->
        <div class="version-jvm-callout">
          <div style="font-size: 0.84rem; font-weight: 700; color: #38bdf8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>⚙️</span> JVM &amp; Native Memory Architecture Evolution:
          </div>
          <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary);">
            ${this.escapeHtml(item.jvmMemoryChange)}
          </div>
        </div>

        <!-- Interviewer Strategy Pivot -->
        <div class="version-pivot-callout">
          <div style="font-size: 0.84rem; font-weight: 700; color: #10b981; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🎯</span> Interviewer Strategy Pivot:
          </div>
          <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary);">
            ${this.escapeHtml(item.interviewPivot)}
          </div>
        </div>
      `,
      keyPoints: item.flagshipFeatures || [],
      codeSnippet: item.codeSnippet,
      pitfall: (item.traps && item.traps[0]) || '',
      interviewTip: item.interviewPivot
    };
  }

  scrollToJavaVersion(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 2px var(--accent-orange), 0 8px 24px rgba(249, 115, 22, 0.25)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 2500);
    }
  }

  // -------------------------------------------------------------
  // Spring Boot 3 Engine Internals & Scenarios Section
  // -------------------------------------------------------------
  renderSpringInternalsSelector() {
    const select = document.getElementById('spring-internals-select');
    if (!select) return;

    const internals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
    const categories = window.REVISION_APP_DATA?.SPRING_INTERNALS_CATEGORIES || [
      { id: "bootstrap", title: "🚀 Bootstrap & Startup Engine" },
      { id: "dependencies", title: "🧩 Auto-Config & Dependencies" },
      { id: "ioc", title: "🔄 Core IoC, Lifecycle & Proxies" },
      { id: "config", title: "⚙️ Configuration & Properties" },
      { id: "web", title: "🌐 Web, Server, Observability & Testing" }
    ];

    const isCatMatch = (catId, tc) => {
      if (catId === 'bootstrap') return tc === 'Bootstrap & Core Engine';
      if (catId === 'dependencies') return tc === 'Auto-Config & Dependencies';
      if (catId === 'ioc') return tc === 'Core IoC & Proxies';
      if (catId === 'config') return tc === 'Configuration & Properties';
      if (catId === 'web') return tc === 'Web & Server Engine' || tc === 'Web, Server & Observability';
      return false;
    };

    let html = '<option value="all">-- Jump to any of the 29 Internal Mechanics --</option>';
    categories.forEach(cat => {
      const catTopics = internals.filter(t => isCatMatch(cat.id, t.category));
      if (catTopics.length > 0) {
        html += `<optgroup label="${cat.title} (${catTopics.length} Topics)">`;
        catTopics.forEach(t => {
          html += `<option value="${t.id}">${t.title}</option>`;
        });
        html += `</optgroup>`;
      }
    });

    select.innerHTML = html;
  }

  selectSpringInternalTopic(topicId) {
    const banner = document.getElementById('spring-active-topic-banner');
    const container = document.getElementById('spring-cards-container');
    const select = document.getElementById('spring-internals-select');
    if (!container) return;

    if (select && topicId) select.value = topicId;

    if (!topicId || topicId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderSpringTopics('internals');
      return;
    }

    const internals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
    const topic = internals.find(t => t.id === topicId);
    if (!topic) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap; width: 100%;">
          <div style="flex: 1 1 500px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
              <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected Internal Mechanic</span>
              <strong style="color: var(--text-primary); font-size: 1.05rem;">${topic.title}</strong>
              <span class="hero-badge-pill" style="font-size: 0.72rem;">${topic.badge}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${topic.whatIsIt}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #2563eb;" onclick="app.openSpringInternalModal('${topic.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectSpringInternalTopic('all')">✕ View All 29</button>
          </div>
        </div>
      `;
    }

    const formattedTopic = this.formatSpringInternalAsTopic(topic);
    container.innerHTML = this.renderTopicCardsHtml([formattedTopic], 'border-spring');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }

  searchSpringInternals(query) {
    const container = document.getElementById('spring-cards-container');
    const banner = document.getElementById('spring-active-topic-banner');
    if (!container) return;

    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      if (banner) banner.style.display = 'none';
      this.renderSpringTopics('internals');
      return;
    }

    const internals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
    const matches = internals.filter(t =>
      (t.title || '').toLowerCase().includes(qLower) ||
      (t.oneLiner || '').toLowerCase().includes(qLower) ||
      (t.whatIsIt || '').toLowerCase().includes(qLower) ||
      (t.internalWorking || '').toLowerCase().includes(qLower) ||
      (t.complexPart || '').toLowerCase().includes(qLower) ||
      (t.pitfall || '').toLowerCase().includes(qLower) ||
      (t.interviewTip || '').toLowerCase().includes(qLower) ||
      (t.category || '').toLowerCase().includes(qLower) ||
      (t.badge || '').toLowerCase().includes(qLower) ||
      (t.codeSnippet || '').toLowerCase().includes(qLower) ||
      (t.keyPoints || []).some(kp => kp.toLowerCase().includes(qLower))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> internal topic${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('spring-internals-search').value = ''; app.searchSpringInternals('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(item => this.formatSpringInternalAsTopic(item));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-spring')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No Spring Boot internals found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>three-level cache</em>, <em>CGLIB</em>, <em>DispatcherServlet</em>, <em>BOM</em>, or <em>BeanPostProcessor</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatSpringInternalAsTopic(item) {
    return {
      id: item.id,
      title: item.title,
      category: `Spring Internals: ${item.category}`,
      badge: item.badge || 'Engine Internals',
      oneLiner: item.oneLiner || item.whatIsIt,
      visualDiagram: `
        <!-- 1. What Is It Exactly (Elevator Pitch) -->
        <div class="callout-box callout-info" style="margin: 0 0 14px 0; background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8;">
          <span class="callout-icon">💡</span>
          <div>
            <strong style="color: #38bdf8; display: block; margin-bottom: 4px; font-size: 0.85rem;">What is it exactly? (Elevator Pitch)</strong>
            <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.55;">${this.escapeHtml(item.whatIsIt)}</div>
          </div>
        </div>

        <!-- 2. Visual Mental Model / Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 3. Under the Hood Execution Mechanics -->
        <div style="margin: 14px 0 12px 0;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>⚙️</span> Under the Hood (Internal Execution Mechanics):
          </div>
          <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #38bdf8;">
            ${this.escapeHtml(item.internalWorking)}
          </div>
        </div>

        <!-- 4. Complex Part You Must Know (Senior Trap) -->
        <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part You Must Know (Senior/Staff Level Trap):</strong>
            <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #1e3a8a; border-color: #3b82f6;" onclick="event.stopPropagation(); app.openSpringInternalModal('${item.id}')">
            🔍 Open Full-Screen Diagram &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openSpringInternalModal(topicId) {
    const internals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
    const topic = internals.find(t => t.id === topicId);
    if (!topic) return;

    this.currentSpringInternalId = topicId;

    const overlay = document.getElementById('spring-internals-modal-overlay');
    const catBadge = document.getElementById('sb-modal-category-badge');
    const badge = document.getElementById('sb-modal-badge');
    const title = document.getElementById('sb-modal-title');
    const body = document.getElementById('sb-modal-body');
    const footerCount = document.getElementById('sb-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = internals.findIndex(t => t.id === topicId);
    if (catBadge) catBadge.textContent = topic.category;
    if (badge) badge.textContent = topic.badge;
    if (title) title.textContent = topic.title;
    if (footerCount) footerCount.textContent = `Topic ${currentIndex + 1} of ${internals.length}: ${topic.title}`;

    body.innerHTML = `
      <!-- 1. What Is It Exactly (Elevator Pitch) -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #38bdf8; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly?</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(topic.whatIsIt)}</div>
        </div>
      </div>

      <!-- 2. Visual Mental Model / Flow Diagram -->
      <div style="margin: 2px 0;">
        ${topic.visualDiagram || ''}
      </div>

      <!-- 3. Under the Hood Mechanics -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px;">
        <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.15rem;">⚙️</span>
          <span>Under the Hood (Internal Execution Mechanics):</span>
        </div>
        <div style="font-size: 0.88rem; line-height: 1.68; color: var(--text-secondary);">
          ${this.escapeHtml(topic.internalWorking)}
        </div>
      </div>

      <!-- 4. Complex Part You Must Know (Senior Trap) -->
      <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
        <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
        <div>
          <strong style="color: #f87171; display: block; font-size: 0.95rem; margin-bottom: 4px;">Complex Part You Must Know (Senior/Staff Trap):</strong>
          <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(topic.complexPart)}</div>
        </div>
      </div>

      <!-- 5. Core Architectural Invariants -->
      <div style="margin-top: 4px;">
        <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-link); margin-bottom: 8px;">
          📌 Core Architectural Invariants:
        </div>
        <ul class="key-points-list">
          ${topic.keyPoints.map(kp => `
            <li class="key-point-item">
              <span class="point-bullet">›</span>
              <span style="font-size: 0.86rem;">${this.escapeHtml(kp)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- 6. Production Code / Configuration -->
      ${topic.codeSnippet ? `
        <div class="card-code-preview" style="margin-top: 4px;">
          <div class="code-header">
            <span>Production Code / Configuration</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
          </div>
          <pre><code>${this.escapeHtml(topic.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 7. Traps and Tips -->
      ${(topic.pitfall || topic.interviewTip) ? `
        <div class="card-callout-grid" style="margin-top: 4px;">
          ${topic.pitfall ? `
            <div class="callout-box callout-danger" style="margin: 0;">
              <span class="callout-icon">⚠️</span>
              <div><strong>Trap to Avoid:</strong> ${this.escapeHtml(topic.pitfall)}</div>
            </div>
          ` : ''}
          ${topic.interviewTip ? `
            <div class="callout-box callout-tip" style="margin: 0;">
              <span class="callout-icon">💡</span>
              <div><strong>Interview Strategy:</strong> ${this.escapeHtml(topic.interviewTip)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeSpringInternalModal() {
    const overlay = document.getElementById('spring-internals-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navigateSpringInternalModal(direction) {
    const internals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
    if (internals.length === 0) return;
    let idx = internals.findIndex(t => t.id === this.currentSpringInternalId);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + internals.length) % internals.length;
    this.openSpringInternalModal(internals[newIdx].id);
  }

  renderSpringTopics(filterCategory = 'internals') {
    const container = document.getElementById('spring-cards-container');
    const banner = document.getElementById('spring-active-topic-banner');
    if (!container) return;

    if (banner && filterCategory !== 'custom') {
      banner.style.display = 'none';
    }

    const archTopics = window.REVISION_APP_DATA?.SPRING_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.SPRING_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'Spring Scenario'));
    const internals = (window.REVISION_APP_DATA?.SPRING_INTERNALS || []).map(item => this.formatSpringInternalAsTopic(item));

    const isCatMatch = (catId, tc) => {
      if (catId === 'bootstrap') return tc === 'Bootstrap & Core Engine';
      if (catId === 'dependencies') return tc === 'Auto-Config & Dependencies';
      if (catId === 'ioc') return tc === 'Core IoC & Proxies';
      if (catId === 'config') return tc === 'Configuration & Properties';
      if (catId === 'web') return tc === 'Web & Server Engine' || tc === 'Web, Server & Observability';
      return false;
    };

    let list = [];
    if (filterCategory === 'internals') {
      list = internals;
    } else if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'scenarios' || filterCategory === 'questions') {
      list = scenarioQs;
    } else if (filterCategory === 'bootstrap' || filterCategory === 'dependencies' || filterCategory === 'ioc' || filterCategory === 'config' || filterCategory === 'web') {
      const rawInternals = window.REVISION_APP_DATA?.SPRING_INTERNALS || [];
      list = rawInternals.filter(t => isCatMatch(filterCategory, t.category)).map(item => this.formatSpringInternalAsTopic(item));
    } else {
      // 'all'
      list = [...internals, ...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-spring');

    const totalEl = document.getElementById('spring-total-count');
    if (totalEl) totalEl.textContent = (archTopics.length + scenarioQs.length + internals.length);
  }

  filterSpringCategory(cat) {
    const container = document.getElementById('section-spring');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderSpringTopics(cat);
  }

  // -------------------------------------------------------------
  // Java Design Patterns (24 GoF & Modern Patterns)
  // -------------------------------------------------------------
  renderJavaPatternsSelector() {
    const select = document.getElementById('patterns-select');
    if (!select) return;

    const patterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    const categories = window.REVISION_APP_DATA?.JAVA_PATTERN_CATEGORIES || [
      { id: "creational", title: "🏗️ Creational Patterns (5)" },
      { id: "structural", title: "🧩 Structural Patterns (7)" },
      { id: "behavioral", title: "🔄 Behavioral Patterns (11)" },
      { id: "modern", title: "⚡ Modern Idioms & DI (1)" }
    ];

    let html = '<option value="all">-- Jump to any of the 24 Design Patterns --</option>';
    categories.forEach(cat => {
      const catPatterns = patterns.filter(p => p.category.toLowerCase().includes(cat.id.toLowerCase()));
      if (catPatterns.length > 0) {
        html += `<optgroup label="${cat.title} (${catPatterns.length} Patterns)">`;
        catPatterns.forEach(p => {
          html += `<option value="${p.id}">${p.title}</option>`;
        });
        html += `</optgroup>`;
      }
    });

    select.innerHTML = html;
  }

  selectJavaPattern(patternId) {
    const banner = document.getElementById('patterns-active-banner');
    const container = document.getElementById('patterns-cards-container');
    const select = document.getElementById('patterns-select');
    if (!container) return;

    if (select && patternId) select.value = patternId;

    if (!patternId || patternId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderJavaPatterns('all');
      return;
    }

    const patterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap; width: 100%;">
          <div style="flex: 1 1 500px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
              <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected Pattern</span>
              <strong style="color: var(--text-primary); font-size: 1.05rem;">${pattern.title}</strong>
              <span class="hero-badge-pill" style="font-size: 0.72rem;">${pattern.badge}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${pattern.whatIsIt}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #8b5cf6;" onclick="app.openJavaPatternModal('${pattern.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectJavaPattern('all')">✕ View All 24</button>
          </div>
        </div>
      `;
    }

    const formattedTopic = this.formatJavaPatternAsTopic(pattern);
    container.innerHTML = this.renderTopicCardsHtml([formattedTopic], 'border-patterns');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }

  searchJavaPatterns(query) {
    const container = document.getElementById('patterns-cards-container');
    const banner = document.getElementById('patterns-active-banner');
    if (!container) return;

    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      if (banner) banner.style.display = 'none';
      this.renderJavaPatterns('all');
      return;
    }

    const patterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    const matches = patterns.filter(p =>
      (p.title || '').toLowerCase().includes(qLower) ||
      (p.whatIsIt || '').toLowerCase().includes(qLower) ||
      (p.internalWorking || '').toLowerCase().includes(qLower) ||
      (p.complexPart || '').toLowerCase().includes(qLower) ||
      (p.pitfall || '').toLowerCase().includes(qLower) ||
      (p.interviewTip || '').toLowerCase().includes(qLower) ||
      (p.category || '').toLowerCase().includes(qLower) ||
      (p.badge || '').toLowerCase().includes(qLower) ||
      (p.codeSnippet || '').toLowerCase().includes(qLower) ||
      (p.keyPoints || []).some(kp => kp.toLowerCase().includes(qLower))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> pattern${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('patterns-search').value = ''; app.searchJavaPatterns('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(item => this.formatJavaPatternAsTopic(item));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-patterns')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No Java patterns found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>Singleton</em>, <em>Builder</em>, <em>Decorator</em>, <em>Strategy</em>, or <em>Observer</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatJavaPatternAsTopic(item) {
    return {
      id: item.id,
      title: item.title,
      category: `Java Pattern: ${item.category}`,
      badge: item.badge || 'GoF Pattern',
      oneLiner: item.whatIsIt,
      visualDiagram: `
        <!-- 1. What Is It Exactly (Elevator Pitch) -->
        <div class="callout-box callout-info" style="margin: 0 0 14px 0; background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6;">
          <span class="callout-icon">💡</span>
          <div>
            <strong style="color: #a78bfa; display: block; margin-bottom: 4px; font-size: 0.85rem;">What is it exactly? (Elevator Pitch)</strong>
            <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.55;">${this.escapeHtml(item.whatIsIt)}</div>
          </div>
        </div>

        <!-- 2. Visual Mental Model / Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 3. Under the Hood Execution Mechanics -->
        <div style="margin: 14px 0 12px 0;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-patterns, #a78bfa); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>⚙️</span> Under the Hood (Internal Execution Mechanics):
          </div>
          <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #8b5cf6;">
            ${this.escapeHtml(item.internalWorking)}
          </div>
        </div>

        <!-- 4. Complex Part You Must Know (Senior Trap) -->
        <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part You Must Know (Senior/Staff Level Trap):</strong>
            <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #6d28d9; border-color: #8b5cf6;" onclick="event.stopPropagation(); app.openJavaPatternModal('${item.id}')">
            🔍 Open Full-Screen Diagram &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openJavaPatternModal(patternId) {
    const patterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;

    this.currentJavaPatternId = patternId;

    const overlay = document.getElementById('patterns-modal-overlay');
    const catBadge = document.getElementById('pattern-modal-category-badge');
    const badge = document.getElementById('pattern-modal-badge');
    const title = document.getElementById('pattern-modal-title');
    const body = document.getElementById('pattern-modal-body');
    const footerCount = document.getElementById('pattern-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = patterns.findIndex(p => p.id === patternId);
    if (catBadge) catBadge.textContent = pattern.category;
    if (badge) badge.textContent = pattern.badge;
    if (title) title.textContent = pattern.title;
    if (footerCount) footerCount.textContent = `Pattern ${currentIndex + 1} of ${patterns.length}: ${pattern.title}`;

    body.innerHTML = `
      <!-- 1. What Is It Exactly (Elevator Pitch) -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #a78bfa; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly?</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(pattern.whatIsIt)}</div>
        </div>
      </div>

      <!-- 2. Visual Mental Model / Flow Diagram -->
      <div style="margin: 2px 0;">
        ${pattern.visualDiagram || ''}
      </div>

      <!-- 3. Under the Hood Mechanics -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px;">
        <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-patterns, #a78bfa); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.15rem;">⚙️</span>
          <span>Under the Hood (Internal Execution Mechanics):</span>
        </div>
        <div style="font-size: 0.88rem; line-height: 1.68; color: var(--text-secondary);">
          ${this.escapeHtml(pattern.internalWorking)}
        </div>
      </div>

      <!-- 4. Complex Part You Must Know (Senior Trap) -->
      <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
        <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
        <div>
          <strong style="color: #f87171; display: block; font-size: 0.95rem; margin-bottom: 4px;">Complex Part You Must Know (Senior/Staff Trap):</strong>
          <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(pattern.complexPart)}</div>
        </div>
      </div>

      <!-- 5. Core Architectural Invariants -->
      <div style="margin-top: 4px;">
        <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-link); margin-bottom: 8px;">
          📌 Core Architectural Invariants:
        </div>
        <ul class="key-points-list">
          ${pattern.keyPoints.map(kp => `
            <li class="key-point-item">
              <span class="point-bullet">›</span>
              <span style="font-size: 0.86rem;">${this.escapeHtml(kp)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- 6. Production Code -->
      ${pattern.codeSnippet ? `
        <div class="card-code-preview" style="margin-top: 4px;">
          <div class="code-header">
            <span>Production Java 17+ Implementation</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
          </div>
          <pre><code>${this.escapeHtml(pattern.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 7. Traps and Tips -->
      ${(pattern.pitfall || pattern.interviewTip) ? `
        <div class="card-callout-grid" style="margin-top: 4px;">
          ${pattern.pitfall ? `
            <div class="callout-box callout-danger" style="margin: 0;">
              <span class="callout-icon">⚠️</span>
              <div><strong>Trap to Avoid:</strong> ${this.escapeHtml(pattern.pitfall)}</div>
            </div>
          ` : ''}
          ${pattern.interviewTip ? `
            <div class="callout-box callout-tip" style="margin: 0;">
              <span class="callout-icon">💡</span>
              <div><strong>Interview Strategy:</strong> ${this.escapeHtml(pattern.interviewTip)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeJavaPatternModal() {
    const overlay = document.getElementById('patterns-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navigateJavaPatternModal(direction) {
    const patterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    if (patterns.length === 0) return;
    let idx = patterns.findIndex(p => p.id === this.currentJavaPatternId);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + patterns.length) % patterns.length;
    this.openJavaPatternModal(patterns[newIdx].id);
  }

  renderJavaPatterns(filterCategory = 'all') {
    const container = document.getElementById('patterns-cards-container');
    const banner = document.getElementById('patterns-active-banner');
    if (!container) return;

    if (banner) {
      banner.style.display = 'none';
    }

    const patterns = window.REVISION_APP_DATA?.JAVA_PATTERNS || [];
    let list = patterns;
    if (filterCategory !== 'all') {
      list = patterns.filter(p => p.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    const formattedList = list.map(p => this.formatJavaPatternAsTopic(p));
    container.innerHTML = this.renderTopicCardsHtml(formattedList, 'border-patterns');
  }

  filterJavaPatternsCategory(cat) {
    const container = document.getElementById('section-design-patterns');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderJavaPatterns(cat);
  }

  // -------------------------------------------------------------
  // Microservices Design Patterns (25 Distributed Architecture Patterns)
  // -------------------------------------------------------------
  renderMicroservicesPatternsSelector() {
    const select = document.getElementById('microservices-select');
    if (!select) return;

    const patterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    const categories = window.REVISION_APP_DATA?.MICROSERVICES_PATTERN_CATEGORIES || [
      { id: "decomposition", title: "🧩 Decomposition Patterns (4)" },
      { id: "data", title: "💾 Data Management & Consistency (7)" },
      { id: "integration", title: "🚪 Integration & API Management (4)" },
      { id: "resilience", title: "🛡️ Reliability & Resilience (5)" },
      { id: "observability", title: "📊 Observability & Deployment (5)" }
    ];

    let html = '<option value="all">-- Jump to any of the 25 Microservices Patterns --</option>';
    categories.forEach(cat => {
      const catPatterns = patterns.filter(p => p.category.toLowerCase().includes(cat.id.toLowerCase()));
      if (catPatterns.length > 0) {
        html += `<optgroup label="${cat.title} (${catPatterns.length} Patterns)">`;
        catPatterns.forEach(p => {
          html += `<option value="${p.id}">${p.title}</option>`;
        });
        html += `</optgroup>`;
      }
    });

    select.innerHTML = html;
  }

  selectMicroservicesPattern(patternId) {
    const banner = document.getElementById('microservices-active-banner');
    const container = document.getElementById('microservices-cards-container');
    const select = document.getElementById('microservices-select');
    if (!container) return;

    if (select && patternId) select.value = patternId;

    if (!patternId || patternId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderMicroservicesPatterns('all');
      return;
    }

    const patterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap; width: 100%;">
          <div style="flex: 1 1 500px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
              <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected Pattern</span>
              <strong style="color: var(--text-primary); font-size: 1.05rem;">${pattern.title}</strong>
              <span class="hero-badge-pill" style="font-size: 0.72rem;">${pattern.badge}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${pattern.whatIsIt}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #0284c7;" onclick="app.openMicroservicesPatternModal('${pattern.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectMicroservicesPattern('all')">✕ View All 25</button>
          </div>
        </div>
      `;
    }

    const formattedTopic = this.formatMicroservicesPatternAsTopic(pattern);
    container.innerHTML = this.renderTopicCardsHtml([formattedTopic], 'border-microservices');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }

  searchMicroservicesPatterns(query) {
    const container = document.getElementById('microservices-cards-container');
    const banner = document.getElementById('microservices-active-banner');
    if (!container) return;

    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      if (banner) banner.style.display = 'none';
      this.renderMicroservicesPatterns('all');
      return;
    }

    const patterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    const matches = patterns.filter(p =>
      (p.title || '').toLowerCase().includes(qLower) ||
      (p.whatIsIt || '').toLowerCase().includes(qLower) ||
      (p.internalWorking || '').toLowerCase().includes(qLower) ||
      (p.complexPart || '').toLowerCase().includes(qLower) ||
      (p.pitfall || '').toLowerCase().includes(qLower) ||
      (p.interviewTip || '').toLowerCase().includes(qLower) ||
      (p.category || '').toLowerCase().includes(qLower) ||
      (p.badge || '').toLowerCase().includes(qLower) ||
      (p.codeSnippet || '').toLowerCase().includes(qLower) ||
      (p.keyPoints || []).some(kp => kp.toLowerCase().includes(qLower))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> pattern${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('microservices-search').value = ''; app.searchMicroservicesPatterns('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(item => this.formatMicroservicesPatternAsTopic(item));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-microservices')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No microservices patterns found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>Saga</em>, <em>Outbox</em>, <em>CQRS</em>, <em>Circuit Breaker</em>, or <em>Service Mesh</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatMicroservicesPatternAsTopic(item) {
    return {
      id: item.id,
      title: item.title,
      category: `Microservices: ${item.category}`,
      badge: item.badge || 'Cloud Architecture',
      oneLiner: item.whatIsIt,
      visualDiagram: `
        <!-- 1. What Is It Exactly (Elevator Pitch) -->
        <div class="callout-box callout-info" style="margin: 0 0 14px 0; background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9;">
          <span class="callout-icon">💡</span>
          <div>
            <strong style="color: #38bdf8; display: block; margin-bottom: 4px; font-size: 0.85rem;">What is it exactly? (Elevator Pitch)</strong>
            <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.55;">${this.escapeHtml(item.whatIsIt)}</div>
          </div>
        </div>

        <!-- 2. Visual Mental Model / Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 3. Under the Hood Execution Mechanics -->
        <div style="margin: 14px 0 12px 0;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-microservices, #38bdf8); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>⚙️</span> Under the Hood (Internal Execution Mechanics):
          </div>
          <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #0ea5e9;">
            ${this.escapeHtml(item.internalWorking)}
          </div>
        </div>

        <!-- 4. Complex Part You Must Know (Senior Trap) -->
        <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part You Must Know (Senior/Staff Level Trap):</strong>
            <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #0369a1; border-color: #0ea5e9;" onclick="event.stopPropagation(); app.openMicroservicesPatternModal('${item.id}')">
            🔍 Open Full-Screen Diagram &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openMicroservicesPatternModal(patternId) {
    const patterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;

    this.currentMicroservicesPatternId = patternId;

    const overlay = document.getElementById('microservices-modal-overlay');
    const catBadge = document.getElementById('ms-modal-category-badge');
    const badge = document.getElementById('ms-modal-badge');
    const title = document.getElementById('ms-modal-title');
    const body = document.getElementById('ms-modal-body');
    const footerCount = document.getElementById('ms-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = patterns.findIndex(p => p.id === patternId);
    if (catBadge) catBadge.textContent = pattern.category;
    if (badge) badge.textContent = pattern.badge;
    if (title) title.textContent = pattern.title;
    if (footerCount) footerCount.textContent = `Pattern ${currentIndex + 1} of ${patterns.length}: ${pattern.title}`;

    body.innerHTML = `
      <!-- 1. What Is It Exactly (Elevator Pitch) -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #38bdf8; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly?</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(pattern.whatIsIt)}</div>
        </div>
      </div>

      <!-- 2. Visual Mental Model / Flow Diagram -->
      <div style="margin: 2px 0;">
        ${pattern.visualDiagram || ''}
      </div>

      <!-- 3. Under the Hood Mechanics -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px;">
        <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-microservices, #38bdf8); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.15rem;">⚙️</span>
          <span>Under the Hood (Internal Execution Mechanics):</span>
        </div>
        <div style="font-size: 0.88rem; line-height: 1.68; color: var(--text-secondary);">
          ${this.escapeHtml(pattern.internalWorking)}
        </div>
      </div>

      <!-- 4. Complex Part You Must Know (Senior Trap) -->
      <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
        <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
        <div>
          <strong style="color: #f87171; display: block; font-size: 0.95rem; margin-bottom: 4px;">Complex Part You Must Know (Senior/Staff Trap):</strong>
          <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(pattern.complexPart)}</div>
        </div>
      </div>

      <!-- 5. Core Architectural Invariants -->
      <div style="margin-top: 4px;">
        <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-link); margin-bottom: 8px;">
          📌 Core Architectural Invariants:
        </div>
        <ul class="key-points-list">
          ${pattern.keyPoints.map(kp => `
            <li class="key-point-item">
              <span class="point-bullet">›</span>
              <span style="font-size: 0.86rem;">${this.escapeHtml(kp)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- 6. Production Code -->
      ${pattern.codeSnippet ? `
        <div class="card-code-preview" style="margin-top: 4px;">
          <div class="code-header">
            <span>Production Java 17+ / Spring Boot 3 Implementation</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
          </div>
          <pre><code>${this.escapeHtml(pattern.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 7. Traps and Tips -->
      ${(pattern.pitfall || pattern.interviewTip) ? `
        <div class="card-callout-grid" style="margin-top: 4px;">
          ${pattern.pitfall ? `
            <div class="callout-box callout-danger" style="margin: 0;">
              <span class="callout-icon">⚠️</span>
              <div><strong>Trap to Avoid:</strong> ${this.escapeHtml(pattern.pitfall)}</div>
            </div>
          ` : ''}
          ${pattern.interviewTip ? `
            <div class="callout-box callout-tip" style="margin: 0;">
              <span class="callout-icon">💡</span>
              <div><strong>Interview Strategy:</strong> ${this.escapeHtml(pattern.interviewTip)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeMicroservicesPatternModal() {
    const overlay = document.getElementById('microservices-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navigateMicroservicesPatternModal(direction) {
    const patterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    if (patterns.length === 0) return;
    let idx = patterns.findIndex(p => p.id === this.currentMicroservicesPatternId);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + patterns.length) % patterns.length;
    this.openMicroservicesPatternModal(patterns[newIdx].id);
  }

  renderMicroservicesPatterns(filterCategory = 'all') {
    const container = document.getElementById('microservices-cards-container');
    const banner = document.getElementById('microservices-active-banner');
    if (!container) return;

    if (banner) {
      banner.style.display = 'none';
    }

    const patterns = window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || [];
    let list = patterns;
    if (filterCategory !== 'all') {
      list = patterns.filter(p => p.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    const formattedList = list.map(p => this.formatMicroservicesPatternAsTopic(p));
    container.innerHTML = this.renderTopicCardsHtml(formattedList, 'border-microservices');
  }

  filterMicroservicesCategory(cat) {
    const container = document.getElementById('section-microservices');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderMicroservicesPatterns(cat);
  }

  // -------------------------------------------------------------
  // DSA Master Patterns & Blueprints (30 Topics)
  // -------------------------------------------------------------
  renderDsaPatternsSelector() {
    const select = document.getElementById('dsa-select');
    if (!select) return;

    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    const categories = window.REVISION_APP_DATA?.DSA_CATEGORIES || [
      { id: "pointers", title: "👉 Two Pointers & Window (3)" },
      { id: "stacks", title: "📚 Stacks, Queues & Intervals (4)" },
      { id: "binary_search", title: "🎯 Binary Search & Heaps (4)" },
      { id: "graphs", title: "🕸️ Trees, Graphs & DSU (5)" },
      { id: "dp", title: "⚡ Dynamic Programming & Backtracking (6)" },
      { id: "advanced", title: "🛠️ Advanced & System Structures (8)" }
    ];

    const isMatch = (catId, catStr) => {
      const c = (catStr || '').toLowerCase();
      if (catId === 'pointers') return c.includes('pointer') || c.includes('window');
      if (catId === 'stacks') return c.includes('stack') || c.includes('queue') || c.includes('interval');
      if (catId === 'binary_search') return c.includes('binary') || c.includes('heap');
      if (catId === 'graphs') return c.includes('graph') || c.includes('tree') || c.includes('dsu');
      if (catId === 'dp') return c.includes('dynamic') || c.includes('backtrack');
      if (catId === 'advanced') return c.includes('advanced') || c.includes('system');
      return false;
    };

    let html = '<option value="all">-- Jump to any of the 30 DSA Topics --</option>';
    categories.forEach(cat => {
      const catTopics = topics.filter(t => isMatch(cat.id, t.category));
      if (catTopics.length > 0) {
        html += `<optgroup label="${cat.title}">`;
        catTopics.forEach(t => {
          html += `<option value="${t.id}">${t.title}</option>`;
        });
        html += `</optgroup>`;
      }
    });

    select.innerHTML = html;
  }

  selectDsaPattern(patternId) {
    const banner = document.getElementById('dsa-active-banner');
    const container = document.getElementById('dsa-cards-container');
    const select = document.getElementById('dsa-select');
    if (!container) return;

    if (select && patternId) select.value = patternId;

    if (!patternId || patternId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderDsaTopics('all');
      return;
    }

    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    const item = topics.find(t => t.id === patternId);
    if (!item) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap; width: 100%;">
          <div style="flex: 1 1 500px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
              <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected Pattern</span>
              <strong style="color: var(--text-primary); font-size: 1.05rem;">${item.title}</strong>
              <span class="hero-badge-pill" style="font-size: 0.72rem;">${item.badge || 'DSA Pattern'}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${item.whatIsIt || item.summary}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #2563eb;" onclick="app.openDsaModal('${item.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectDsaPattern('all')">✕ View All 30</button>
          </div>
        </div>
      `;
    }

    const formattedTopic = this.formatDsaPatternAsTopic(item);
    container.innerHTML = this.renderTopicCardsHtml([formattedTopic], 'border-dsa');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }

  searchDsaPatterns(query) {
    const container = document.getElementById('dsa-cards-container');
    const banner = document.getElementById('dsa-active-banner');
    if (!container) return;

    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      if (banner) banner.style.display = 'none';
      this.renderDsaTopics('all');
      return;
    }

    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    const matches = topics.filter(t =>
      (t.title || '').toLowerCase().includes(qLower) ||
      (t.whatIsIt || '').toLowerCase().includes(qLower) ||
      (t.summary || '').toLowerCase().includes(qLower) ||
      (t.bruteForce || '').toLowerCase().includes(qLower) ||
      (t.optimalStrategy || '').toLowerCase().includes(qLower) ||
      (t.internalWorking || '').toLowerCase().includes(qLower) ||
      (t.complexPart || '').toLowerCase().includes(qLower) ||
      (t.pitfall || '').toLowerCase().includes(qLower) ||
      (t.interviewTip || '').toLowerCase().includes(qLower) ||
      (t.canonicalProblems || '').toLowerCase().includes(qLower) ||
      (t.category || '').toLowerCase().includes(qLower) ||
      (t.badge || '').toLowerCase().includes(qLower) ||
      (t.triggerSignals || []).some(sig => sig.toLowerCase().includes(qLower)) ||
      (t.keyPoints || []).some(kp => kp.toLowerCase().includes(qLower))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> DSA topic${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('dsa-search').value = ''; app.searchDsaPatterns('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(item => this.formatDsaPatternAsTopic(item));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-dsa')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No DSA topics found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>Sliding Window</em>, <em>Monotonic Stack</em>, <em>Knapsack</em>, <em>Koko</em>, <em>LRU</em>, or <em>Dijkstra</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatDsaPatternAsTopic(item) {
    const triggerSignalsHtml = (item.triggerSignals && item.triggerSignals.length > 0) ? `
      <!-- Trigger Signals Callout -->
      <div class="callout-box callout-tip" style="margin: 0 0 12px 0; background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8;">
        <span class="callout-icon">🔍</span>
        <div>
          <strong style="color: #38bdf8; display: block; margin-bottom: 4px; font-size: 0.85rem;">How to Identify in Problems (Trigger Keywords &amp; Clues):</strong>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.84rem; color: var(--text-primary); line-height: 1.55;">
            ${item.triggerSignals.map(sig => `<li>${this.escapeHtml(sig)}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : '';

    const bruteForceHtml = item.bruteForce ? `
      <!-- Step 1: Brute Force & Bottleneck -->
      <div class="callout-box callout-danger" style="margin: 0 0 12px 0; background: rgba(239, 68, 68, 0.08); border-left: 4px solid #f87171;">
        <span class="callout-icon">🚨</span>
        <div>
          <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Step 1: Brute Force Formulation &amp; Computational Bottleneck:</strong>
          <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.bruteForce)}</div>
        </div>
      </div>
    ` : '';

    const optimalHtml = item.optimalStrategy ? `
      <!-- Step 2: Optimal Invariant Elimination -->
      <div class="callout-box callout-info" style="margin: 0 0 12px 0; background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981;">
        <span class="callout-icon">⚡</span>
        <div>
          <strong style="color: #34d399; display: block; margin-bottom: 4px; font-size: 0.85rem;">Step 2: Optimal Bottleneck Elimination Strategy:</strong>
          <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.optimalStrategy)}</div>
        </div>
      </div>
    ` : '';

    const problemsHtml = item.canonicalProblems ? `
      <!-- Classic Problems Solved -->
      <div style="margin: 12px 0; background: var(--bg-tertiary); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid #6366f1;">
        <div style="font-size: 0.82rem; font-weight: 700; color: #a5b4fc; margin-bottom: 4px;">
          📚 Canonical LeetCode Problems Solved:
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; white-space: pre-line;">
          ${this.escapeHtml(item.canonicalProblems)}
        </div>
      </div>
    ` : '';

    return {
      id: item.id,
      title: item.title,
      category: `DSA: ${item.category}`,
      badge: item.badge || 'DSA Pattern',
      oneLiner: item.whatIsIt || item.summary,
      visualDiagram: `
        ${triggerSignalsHtml}
        ${bruteForceHtml}
        ${optimalHtml}

        <!-- 3. Visual Mental Model / Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 4. Under the Hood Mechanics -->
        ${item.internalWorking ? `
          <div style="margin: 14px 0 12px 0;">
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-dsa, #60a5fa); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> Algorithm Invariant Maintenance:
            </div>
            <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #3b82f6;">
              ${this.escapeHtml(item.internalWorking)}
            </div>
          </div>
        ` : ''}

        <!-- 5. Complex Part / Senior Trap -->
        ${item.complexPart ? `
          <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
            <span class="callout-icon">🔥</span>
            <div>
              <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part &amp; Edge Cases (Senior Trap):</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
            </div>
          </div>
        ` : ''}

        ${problemsHtml}

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #1d4ed8; border-color: #3b82f6;" onclick="event.stopPropagation(); app.openDsaModal('${item.id}')">
            🔍 Open Full-Screen Diagram &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openDsaModal(patternId) {
    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    const item = topics.find(t => t.id === patternId);
    if (!item) return;

    this.currentDsaPatternId = patternId;

    const overlay = document.getElementById('dsa-modal-overlay');
    const catBadge = document.getElementById('dsa-modal-category-badge');
    const badge = document.getElementById('dsa-modal-badge');
    const title = document.getElementById('dsa-modal-title');
    const body = document.getElementById('dsa-modal-body');
    const footerCount = document.getElementById('dsa-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = topics.findIndex(t => t.id === patternId);
    if (catBadge) catBadge.textContent = item.category;
    if (badge) badge.textContent = item.badge || 'DSA Pattern';
    if (title) title.textContent = item.title;
    if (footerCount) footerCount.textContent = `Pattern ${currentIndex + 1} of ${topics.length}: ${item.title}`;

    body.innerHTML = `
      <!-- 1. What Is It & Mental Model -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #38bdf8; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly? (Elevator Pitch)</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(item.whatIsIt || item.summary)}</div>
        </div>
      </div>

      <!-- Trigger Signals -->
      ${item.triggerSignals && item.triggerSignals.length > 0 ? `
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #38bdf8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🔍</span> Trigger Keywords &amp; Signals in Question Statement:
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
            ${item.triggerSignals.map(sig => `<li>${this.escapeHtml(sig)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Brute Force vs Optimal Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
        ${item.bruteForce ? `
          <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
            <span class="callout-icon">🚨</span>
            <div>
              <strong style="color: #f87171; display: block; font-size: 0.9rem; margin-bottom: 4px;">Step 1: Brute Force &amp; Bottleneck</strong>
              <div style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(item.bruteForce)}</div>
            </div>
          </div>
        ` : ''}

        ${item.optimalStrategy ? `
          <div class="callout-box callout-info" style="margin: 0; border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.08);">
            <span class="callout-icon">⚡</span>
            <div>
              <strong style="color: #34d399; display: block; font-size: 0.9rem; margin-bottom: 4px;">Step 2: Optimal Invariant Strategy</strong>
              <div style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(item.optimalStrategy)}</div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 2. Visual Mental Model / Flow Diagram -->
      <div style="margin: 2px 0;">
        ${item.visualDiagram || ''}
      </div>

      <!-- 3. Internal Working -->
      ${item.internalWorking ? `
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px;">
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-dsa, #60a5fa); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.15rem;">⚙️</span>
            <span>Algorithm Invariant Maintenance &amp; Mechanics:</span>
          </div>
          <div style="font-size: 0.88rem; line-height: 1.68; color: var(--text-secondary);">
            ${this.escapeHtml(item.internalWorking)}
          </div>
        </div>
      ` : ''}

      <!-- 4. Complex Part You Must Know -->
      ${item.complexPart ? `
        <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; font-size: 0.95rem; margin-bottom: 4px;">Complex Part You Must Know (Senior Trap):</strong>
            <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>
      ` : ''}

      <!-- 5. Core Architectural Invariants -->
      ${item.keyPoints && item.keyPoints.length > 0 ? `
        <div style="margin-top: 4px;">
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-link); margin-bottom: 8px;">
            📌 Core Architectural Invariants:
          </div>
          <ul class="key-points-list">
            ${item.keyPoints.map(kp => `
              <li class="key-point-item">
                <span class="point-bullet">›</span>
                <span style="font-size: 0.86rem;">${this.escapeHtml(kp)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- 6. Production Code Template -->
      ${item.codeSnippet ? `
        <div class="card-code-preview" style="margin-top: 4px;">
          <div class="code-header">
            <span>Canonical Java 17+ Production Template</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
          </div>
          <pre><code>${this.escapeHtml(item.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 7. Canonical LeetCode Problems -->
      ${item.canonicalProblems ? `
        <div style="background: var(--bg-tertiary); padding: 12px 16px; border-radius: var(--radius-md); border-left: 4px solid #6366f1;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">
            📚 Classic LeetCode Problems Solved With This Pattern:
          </div>
          <div style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-line;">
            ${this.escapeHtml(item.canonicalProblems)}
          </div>
        </div>
      ` : ''}

      <!-- 8. Traps and Tips -->
      ${(item.pitfall || item.interviewTip) ? `
        <div class="card-callout-grid" style="margin-top: 4px;">
          ${item.pitfall ? `
            <div class="callout-box callout-danger" style="margin: 0;">
              <span class="callout-icon">⚠️</span>
              <div><strong>Trap to Avoid:</strong> ${this.escapeHtml(item.pitfall)}</div>
            </div>
          ` : ''}
          ${item.interviewTip ? `
            <div class="callout-box callout-tip" style="margin: 0;">
              <span class="callout-icon">💡</span>
              <div><strong>Interview Strategy:</strong> ${this.escapeHtml(item.interviewTip)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeDsaModal() {
    const overlay = document.getElementById('dsa-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navigateDsaModal(direction) {
    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    if (topics.length === 0) return;
    let idx = topics.findIndex(t => t.id === this.currentDsaPatternId);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + topics.length) % topics.length;
    this.openDsaModal(topics[newIdx].id);
  }

  renderDsaTopics(filterCategory = 'all') {
    const container = document.getElementById('dsa-cards-container');
    const banner = document.getElementById('dsa-active-banner');
    if (!container) return;

    if (banner) {
      banner.style.display = 'none';
    }

    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    const isMatch = (catId, catStr) => {
      const c = (catStr || '').toLowerCase();
      if (catId === 'pointers') return c.includes('pointer') || c.includes('window');
      if (catId === 'stacks') return c.includes('stack') || c.includes('queue') || c.includes('interval');
      if (catId === 'binary_search') return c.includes('binary') || c.includes('heap');
      if (catId === 'graphs') return c.includes('graph') || c.includes('tree') || c.includes('dsu');
      if (catId === 'dp') return c.includes('dynamic') || c.includes('backtrack');
      if (catId === 'advanced') return c.includes('advanced') || c.includes('system');
      return false;
    };

    let list = topics;
    if (filterCategory !== 'all') {
      list = topics.filter(t => isMatch(filterCategory, t.category));
    }

    const formattedList = list.map(t => this.formatDsaPatternAsTopic(t));
    container.innerHTML = this.renderTopicCardsHtml(formattedList, 'border-dsa');
  }

  filterDsaCategory(cat) {
    const container = document.getElementById('section-dsa');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderDsaTopics(cat);
  }

  // -------------------------------------------------------------
  // AWS Cloud Services & IAM Architecture (9 Core Services)
  // -------------------------------------------------------------
  renderAwsSelector() {
    const select = document.getElementById('aws-select');
    if (!select) return;

    const services = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    const categories = window.REVISION_APP_DATA?.AWS_CATEGORIES || [
      "All Categories",
      "Security & Identity",
      "Compute & Containers",
      "Storage & Database",
      "Networking & Messaging",
      "Serverless & APIs"
    ];

    let html = '<option value="all">⚡ Jump to AWS Service / IAM Blueprint (All 9)...</option>';

    categories.forEach(cat => {
      if (cat === 'All Categories') return;
      const catServices = services.filter(s => s.category === cat);
      if (catServices.length === 0) return;

      html += `<optgroup label="☁️ ${cat} (${catServices.length})">`;
      catServices.forEach(s => {
        html += `<option value="${s.id}">${s.title}</option>`;
      });
      html += '</optgroup>';
    });

    select.innerHTML = html;
  }

  selectAwsTopic(serviceId) {
    const container = document.getElementById('aws-cards-container');
    const banner = document.getElementById('aws-active-banner');
    const select = document.getElementById('aws-select');
    if (!container) return;

    if (select) select.value = serviceId;

    if (serviceId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderAwsTopics('all');
      return;
    }

    const services = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    const item = services.find(s => s.id === serviceId);
    if (!item) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected AWS Service</span>
            <strong style="color: var(--text-primary); margin-left: 8px; font-size: 0.95rem;">${this.escapeHtml(item.title)}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 6px;">[${this.escapeHtml(item.category)}]</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #ea580c;" onclick="app.openAwsModal('${item.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectAwsTopic('all')">✕ View All 9</button>
          </div>
        </div>
      `;
    }

    const formatted = this.formatAwsAsTopic(item);
    container.innerHTML = this.renderTopicCardsHtml([formatted], 'border-aws');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 40);
  }

  searchAwsTopics(query) {
    const container = document.getElementById('aws-cards-container');
    const banner = document.getElementById('aws-active-banner');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      if (banner) banner.style.display = 'none';
      this.renderAwsTopics('all');
      return;
    }

    const services = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    const matches = services.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.whatIsIt && s.whatIsIt.toLowerCase().includes(q)) ||
      (s.internalWorking && s.internalWorking.toLowerCase().includes(q)) ||
      (s.iamConfiguration && s.iamConfiguration.toLowerCase().includes(q)) ||
      (s.realWorldUseCase && s.realWorldUseCase.toLowerCase().includes(q))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> AWS service${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('aws-search').value = ''; app.searchAwsTopics('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(s => this.formatAwsAsTopic(s));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-aws')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No AWS services found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>IAM</em>, <em>S3</em>, <em>Aurora</em>, <em>SnapStart</em>, or <em>IRSA</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatAwsAsTopic(item) {
    const whenAndWhyHtml = item.whenAndWhy ? `
      <div class="callout-box callout-info" style="margin: 0 0 12px 0; background: rgba(255, 153, 0, 0.08); border-left: 4px solid #ff9900;">
        <span class="callout-icon">💡</span>
        <div>
          <strong style="color: #ff9900; display: block; margin-bottom: 4px; font-size: 0.85rem;">When &amp; Why to Use (vs Alternatives &amp; Cost Model):</strong>
          <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.whenAndWhy)}</div>
        </div>
      </div>
    ` : '';

    const iamHtml = item.iamConfiguration ? `
      <div style="margin: 12px 0; background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #ff9900;">
        <div style="font-size: 0.84rem; font-weight: 700; color: #ff9900; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🔐</span> IAM Role &amp; Security Configuration:
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.55; white-space: pre-wrap; font-family: var(--font-mono);">${this.escapeHtml(item.iamConfiguration)}</div>
      </div>
    ` : '';

    const useCaseHtml = item.realWorldUseCase ? `
      <div style="margin: 12px 0; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-sm);">
        <div style="font-size: 0.84rem; font-weight: 700; color: #34d399; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🚀</span> Real-World Project Architecture &amp; Use Case:
        </div>
        <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55; white-space: pre-line;">${this.escapeHtml(item.realWorldUseCase)}</div>
      </div>
    ` : '';

    return {
      id: item.id,
      title: item.title,
      category: `AWS: ${item.category}`,
      badge: item.badge || 'AWS Core',
      oneLiner: item.whatIsIt,
      visualDiagram: `
        ${whenAndWhyHtml}

        <!-- 1. Visual Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 2. Under-the-Hood Engine Mechanics -->
        ${item.internalWorking ? `
          <div style="margin: 14px 0 12px 0;">
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-aws, #ff9900); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> Under-the-Hood Engine Mechanics:
            </div>
            <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #f97316; white-space: pre-line;">${this.escapeHtml(item.internalWorking)}</div>
          </div>
        ` : ''}

        ${iamHtml}
        ${useCaseHtml}

        <!-- 3. Complex Part / Senior Trap -->
        ${item.complexPart ? `
          <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
            <span class="callout-icon">🔥</span>
            <div>
              <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part &amp; Edge Cases (Staff Trap):</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #c2410c; border-color: #ea580c;" onclick="event.stopPropagation(); app.openAwsModal('${item.id}')">
            🔍 Open Full-Screen Architecture &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openAwsModal(serviceId) {
    const services = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    const item = services.find(s => s.id === serviceId);
    if (!item) return;

    this.currentAwsServiceId = serviceId;

    const overlay = document.getElementById('aws-modal-overlay');
    const catBadge = document.getElementById('aws-modal-category-badge');
    const badge = document.getElementById('aws-modal-badge');
    const title = document.getElementById('aws-modal-title');
    const body = document.getElementById('aws-modal-body');
    const footerCount = document.getElementById('aws-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = services.findIndex(s => s.id === serviceId);
    if (catBadge) catBadge.textContent = item.category;
    if (badge) badge.textContent = item.badge || 'AWS Core';
    if (title) title.textContent = item.title;
    if (footerCount) footerCount.textContent = `Service ${currentIndex + 1} of ${services.length}: ${item.title}`;

    body.innerHTML = `
      <!-- 1. What Is It & Architecture -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(255, 153, 0, 0.08); border-left: 4px solid #ff9900;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #ff9900; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly? (Elevator Pitch &amp; Core Architecture)</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(item.whatIsIt)}</div>
        </div>
      </div>

      <!-- 2. When & Why to Use -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px;">
        <div style="font-size: 0.9rem; font-weight: 700; color: #ff9900; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🎯</span> When to Use, Why to Use (vs Alternatives) &amp; Cost Model:
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
          ${this.escapeHtml(item.whenAndWhy)}
        </div>
      </div>

      <!-- 3. Visual Flow Diagram -->
      <div style="margin: 2px 0;">
        ${item.visualDiagram || ''}
      </div>

      <!-- 4. Under-the-Hood Engine Mechanics -->
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px; border-left: 4px solid #f97316;">
        <div style="font-size: 0.92rem; font-weight: 700; color: #f97316; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>⚙️</span> Under-the-Hood Engine Mechanics &amp; Execution Flow:
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; white-space: pre-line;">
          ${this.escapeHtml(item.internalWorking)}
        </div>
      </div>

      <!-- 5. IAM Role Configuration -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px; border-left: 4px solid #ff9900;">
        <div style="font-size: 0.92rem; font-weight: 700; color: #ff9900; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>🔐</span> IAM Role, Policy &amp; Trust Relationship Configuration:
        </div>
        <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; font-family: var(--font-mono); background: var(--bg-secondary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          ${this.escapeHtml(item.iamConfiguration)}
        </div>
      </div>

      <!-- 6. Real-World Production Project Use Case -->
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px; border-left: 4px solid #10b981;">
        <div style="font-size: 0.92rem; font-weight: 700; color: #34d399; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>🚀</span> Real-World Project Scenario &amp; Production Implementation:
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; white-space: pre-line;">
          ${this.escapeHtml(item.realWorldUseCase)}
        </div>
      </div>

      <!-- 7. Production Code Snippet / Manifest -->
      ${item.codeSnippet ? `
        <div class="card-code-preview" style="margin: 0;">
          <div class="code-header" style="background: var(--bg-secondary);">
            <span style="color: #ff9900; font-weight: 600;">💻 Production Java SDK / Manifest</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy Code</button>
          </div>
          <pre style="margin: 0; max-height: 380px; overflow-y: auto;"><code>${this.escapeHtml(item.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 8. Complex Part & Staff Edge Cases -->
      ${item.complexPart ? `
        <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; font-size: 0.92rem; margin-bottom: 4px;">Staff-Level Complex Part &amp; Edge Cases:</strong>
            <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>
      ` : ''}

      <!-- 9. Key Architectural Points -->
      ${item.keyPoints && item.keyPoints.length > 0 ? `
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">
            📌 Core Architectural Invariants:
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
            ${item.keyPoints.map(kp => `<li>${this.escapeHtml(kp)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- 10. Trap & Interview Tip Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
        ${item.pitfall ? `
          <div class="callout-box callout-danger" style="margin: 0;">
            <span class="callout-icon">⚠️</span>
            <div>
              <strong style="color: #f87171; display: block; font-size: 0.88rem; margin-bottom: 2px;">Production Trap / Pitfall:</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.pitfall)}</div>
            </div>
          </div>
        ` : ''}

        ${item.interviewTip ? `
          <div class="callout-box callout-tip" style="margin: 0;">
            <span class="callout-icon">💡</span>
            <div>
              <strong style="color: #38bdf8; display: block; font-size: 0.88rem; margin-bottom: 2px;">Staff Interview Strategy:</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.interviewTip)}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    overlay.classList.add('open');
  }

  closeAwsModal() {
    document.getElementById('aws-modal-overlay')?.classList.remove('open');
  }

  navigateAwsModal(direction) {
    const services = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    if (services.length === 0) return;
    const idx = services.findIndex(s => s.id === this.currentAwsServiceId);
    if (idx === -1) return;
    const newIdx = (idx + direction + services.length) % services.length;
    this.openAwsModal(services[newIdx].id);
  }

  renderAwsTopics(filterCategory = 'all') {
    const container = document.getElementById('aws-cards-container');
    const banner = document.getElementById('aws-active-banner');
    if (!container) return;

    if (banner) {
      banner.style.display = 'none';
    }

    const services = window.REVISION_APP_DATA?.AWS_SERVICES || [];
    let list = services;
    if (filterCategory !== 'all') {
      list = services.filter(s => s.category === filterCategory);
    }

    const formattedList = list.map(s => this.formatAwsAsTopic(s));
    container.innerHTML = this.renderTopicCardsHtml(formattedList, 'border-aws');
  }

  filterAwsCategory(cat) {
    const section = document.getElementById('section-aws');
    if (section) {
      section.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderAwsTopics(cat);
  }

  navigateToAwsTopic(serviceId) {
    this.switchSection('aws');
    this.closeMobileSidebar();
    this.selectAwsTopic(serviceId);
  }

  // -------------------------------------------------------------
  // Google Cloud Platform (GCP) Services & IAM Architecture (9 Core Services)
  // -------------------------------------------------------------
  renderGcpSelector() {
    const select = document.getElementById('gcp-select');
    if (!select) return;

    const services = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    const categories = window.REVISION_APP_DATA?.GCP_CATEGORIES || [
      "All Categories",
      "Security & Identity",
      "Compute & Containers",
      "Storage & Database",
      "Networking & Messaging",
      "Analytics & Enterprise API"
    ];

    let html = '<option value="all">⚡ Jump to GCP Service / Workload Identity Blueprint (All 9)...</option>';

    categories.forEach(cat => {
      if (cat === 'All Categories') return;
      const catServices = services.filter(s => s.category === cat);
      if (catServices.length === 0) return;

      html += `<optgroup label="🌐 ${cat} (${catServices.length})">`;
      catServices.forEach(s => {
        html += `<option value="${s.id}">${s.title}</option>`;
      });
      html += '</optgroup>';
    });

    select.innerHTML = html;
  }

  selectGcpTopic(serviceId) {
    const container = document.getElementById('gcp-cards-container');
    const banner = document.getElementById('gcp-active-banner');
    const select = document.getElementById('gcp-select');
    if (!container) return;

    if (select) select.value = serviceId;

    if (serviceId === 'all') {
      if (banner) banner.style.display = 'none';
      this.renderGcpTopics('all');
      return;
    }

    const services = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    const item = services.find(s => s.id === serviceId);
    if (!item) return;

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Selected GCP Service</span>
            <strong style="color: var(--text-primary); margin-left: 8px; font-size: 0.95rem;">${this.escapeHtml(item.title)}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 6px;">[${this.escapeHtml(item.category)}]</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" style="font-size: 0.78rem; padding: 6px 12px; background: #2563eb;" onclick="app.openGcpModal('${item.id}')">🔍 Open Modal Deep Dive</button>
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="app.selectGcpTopic('all')">✕ View All 9</button>
          </div>
        </div>
      `;
    }

    const formatted = this.formatGcpAsTopic(item);
    container.innerHTML = this.renderTopicCardsHtml([formatted], 'border-gcp');

    setTimeout(() => {
      const card = container.querySelector('.cheat-card');
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 40);
  }

  searchGcpTopics(query) {
    const container = document.getElementById('gcp-cards-container');
    const banner = document.getElementById('gcp-active-banner');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      if (banner) banner.style.display = 'none';
      this.renderGcpTopics('all');
      return;
    }

    const services = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    const matches = services.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.whatIsIt && s.whatIsIt.toLowerCase().includes(q)) ||
      (s.internalWorking && s.internalWorking.toLowerCase().includes(q)) ||
      (s.iamConfiguration && s.iamConfiguration.toLowerCase().includes(q)) ||
      (s.realWorldUseCase && s.realWorldUseCase.toLowerCase().includes(q))
    );

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <div>
            <span class="hero-badge-pill highlight" style="font-size: 0.74rem;">Search Filter</span>
            <span style="font-size: 0.88rem; color: var(--text-primary); margin-left: 8px;">
              Found <strong>${matches.length}</strong> GCP service${matches.length === 1 ? '' : 's'} matching "<strong>${this.escapeHtml(query)}</strong>"
            </span>
          </div>
          <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="document.getElementById('gcp-search').value = ''; app.searchGcpTopics('');">✕ Clear Search</button>
        </div>
      `;
    }

    const formattedList = matches.map(s => this.formatGcpAsTopic(s));
    container.innerHTML = formattedList.length > 0
      ? this.renderTopicCardsHtml(formattedList, 'border-gcp')
      : `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No GCP services found matching "<strong>${this.escapeHtml(query)}</strong>". Try searching for <em>IAM</em>, <em>GKE</em>, <em>Spanner</em>, <em>Cloud Run</em>, or <em>BigQuery</em>.</div>
        </div>`;

    if (formattedList.length > 0) {
      setTimeout(() => {
        const firstCard = container.querySelector('.cheat-card');
        if (firstCard) firstCard.classList.add('open');
      }, 40);
    }
  }

  formatGcpAsTopic(item) {
    const whenAndWhyHtml = item.whenAndWhy ? `
      <div class="callout-box callout-info" style="margin: 0 0 12px 0; background: rgba(66, 133, 244, 0.08); border-left: 4px solid #4285f4;">
        <span class="callout-icon">💡</span>
        <div>
          <strong style="color: #4285f4; display: block; margin-bottom: 4px; font-size: 0.85rem;">When &amp; Why to Use (vs Alternatives &amp; Cost Model):</strong>
          <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.whenAndWhy)}</div>
        </div>
      </div>
    ` : '';

    const iamHtml = item.iamConfiguration ? `
      <div style="margin: 12px 0; background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #4285f4;">
        <div style="font-size: 0.84rem; font-weight: 700; color: #4285f4; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🔐</span> IAM &amp; Workload Identity Configuration:
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.55; white-space: pre-wrap; font-family: var(--font-mono);">${this.escapeHtml(item.iamConfiguration)}</div>
      </div>
    ` : '';

    const useCaseHtml = item.realWorldUseCase ? `
      <div style="margin: 12px 0; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-sm);">
        <div style="font-size: 0.84rem; font-weight: 700; color: #34d399; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🚀</span> Real-World Project Architecture &amp; Use Case:
        </div>
        <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55; white-space: pre-line;">${this.escapeHtml(item.realWorldUseCase)}</div>
      </div>
    ` : '';

    return {
      id: item.id,
      title: item.title,
      category: `GCP: ${item.category}`,
      badge: item.badge || 'GCP Core',
      oneLiner: item.whatIsIt,
      visualDiagram: `
        ${whenAndWhyHtml}

        <!-- 1. Visual Flow Diagram -->
        ${item.visualDiagram || ''}

        <!-- 2. Under-the-Hood Engine Mechanics -->
        ${item.internalWorking ? `
          <div style="margin: 14px 0 12px 0;">
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--accent-gcp, #4285f4); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> Under-the-Hood Engine Mechanics:
            </div>
            <div style="font-size: 0.84rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid #3b82f6; white-space: pre-line;">${this.escapeHtml(item.internalWorking)}</div>
          </div>
        ` : ''}

        ${iamHtml}
        ${useCaseHtml}

        <!-- 3. Complex Part / Senior Trap -->
        ${item.complexPart ? `
          <div class="callout-box callout-danger" style="margin: 14px 0 14px 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
            <span class="callout-icon">🔥</span>
            <div>
              <strong style="color: #f87171; display: block; margin-bottom: 4px; font-size: 0.85rem;">Complex Part &amp; Edge Cases (Staff Trap):</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.complexPart)}</div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
          <button class="btn-primary" style="font-size: 0.76rem; padding: 5px 12px; background: #1d4ed8; border-color: #3b82f6;" onclick="event.stopPropagation(); app.openGcpModal('${item.id}')">
            🔍 Open Full-Screen Architecture &amp; Deep Dive Modal
          </button>
        </div>
      `,
      keyPoints: item.keyPoints || [],
      codeSnippet: item.codeSnippet,
      pitfall: item.pitfall,
      interviewTip: item.interviewTip
    };
  }

  openGcpModal(serviceId) {
    const services = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    const item = services.find(s => s.id === serviceId);
    if (!item) return;

    this.currentGcpServiceId = serviceId;

    const overlay = document.getElementById('gcp-modal-overlay');
    const catBadge = document.getElementById('gcp-modal-category-badge');
    const badge = document.getElementById('gcp-modal-badge');
    const title = document.getElementById('gcp-modal-title');
    const body = document.getElementById('gcp-modal-body');
    const footerCount = document.getElementById('gcp-modal-footer-count');
    if (!overlay || !body) return;

    const currentIndex = services.findIndex(s => s.id === serviceId);
    if (catBadge) catBadge.textContent = item.category;
    if (badge) badge.textContent = item.badge || 'GCP Core';
    if (title) title.textContent = item.title;
    if (footerCount) footerCount.textContent = `Service ${currentIndex + 1} of ${services.length}: ${item.title}`;

    body.innerHTML = `
      <!-- 1. What Is It & Architecture -->
      <div class="callout-box callout-info" style="margin: 0; background: rgba(66, 133, 244, 0.08); border-left: 4px solid #4285f4;">
        <span class="callout-icon" style="font-size: 1.3rem;">💡</span>
        <div>
          <strong style="color: #4285f4; display: block; font-size: 0.95rem; margin-bottom: 4px;">What Is It Exactly? (Elevator Pitch &amp; Core Architecture)</strong>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;">${this.escapeHtml(item.whatIsIt)}</div>
        </div>
      </div>

      <!-- 2. When & Why to Use -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px;">
        <div style="font-size: 0.9rem; font-weight: 700; color: #4285f4; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🎯</span> When to Use, Why to Use (vs Alternatives) &amp; Cost Model:
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
          ${this.escapeHtml(item.whenAndWhy)}
        </div>
      </div>

      <!-- 3. Visual Flow Diagram -->
      <div style="margin: 2px 0;">
        ${item.visualDiagram || ''}
      </div>

      <!-- 4. Under-the-Hood Engine Mechanics -->
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px; border-left: 4px solid #3b82f6;">
        <div style="font-size: 0.92rem; font-weight: 700; color: #3b82f6; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>⚙️</span> Under-the-Hood Engine Mechanics &amp; Execution Flow:
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; white-space: pre-line;">
          ${this.escapeHtml(item.internalWorking)}
        </div>
      </div>

      <!-- 5. IAM & Workload Identity Configuration -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px; border-left: 4px solid #4285f4;">
        <div style="font-size: 0.92rem; font-weight: 700; color: #4285f4; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>🔐</span> IAM Role, Service Account &amp; Workload Identity Configuration:
        </div>
        <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; font-family: var(--font-mono); background: var(--bg-secondary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          ${this.escapeHtml(item.iamConfiguration)}
        </div>
      </div>

      <!-- 6. Real-World Production Project Use Case -->
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 18px; border-left: 4px solid #10b981;">
        <div style="font-size: 0.92rem; font-weight: 700; color: #34d399; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>🚀</span> Real-World Project Scenario &amp; Production Implementation:
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; white-space: pre-line;">
          ${this.escapeHtml(item.realWorldUseCase)}
        </div>
      </div>

      <!-- 7. Production Code Snippet / Manifest -->
      ${item.codeSnippet ? `
        <div class="card-code-preview" style="margin: 0;">
          <div class="code-header" style="background: var(--bg-secondary);">
            <span style="color: #4285f4; font-weight: 600;">💻 Production Client Library / Manifest</span>
            <button class="copy-btn" onclick="app.copyCode(this)">Copy Code</button>
          </div>
          <pre style="margin: 0; max-height: 380px; overflow-y: auto;"><code>${this.escapeHtml(item.codeSnippet)}</code></pre>
        </div>
      ` : ''}

      <!-- 8. Complex Part & Staff Edge Cases -->
      ${item.complexPart ? `
        <div class="callout-box callout-danger" style="margin: 0; border-left: 4px solid #f87171; background: rgba(239, 68, 68, 0.08);">
          <span class="callout-icon" style="font-size: 1.3rem;">🔥</span>
          <div>
            <strong style="color: #f87171; display: block; font-size: 0.92rem; margin-bottom: 4px;">Staff-Level Complex Part &amp; Edge Cases:</strong>
            <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${this.escapeHtml(item.complexPart)}</div>
          </div>
        </div>
      ` : ''}

      <!-- 9. Key Architectural Points -->
      ${item.keyPoints && item.keyPoints.length > 0 ? `
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">
            📌 Core Architectural Invariants:
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
            ${item.keyPoints.map(kp => `<li>${this.escapeHtml(kp)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- 10. Trap & Interview Tip Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
        ${item.pitfall ? `
          <div class="callout-box callout-danger" style="margin: 0;">
            <span class="callout-icon">⚠️</span>
            <div>
              <strong style="color: #f87171; display: block; font-size: 0.88rem; margin-bottom: 2px;">Production Trap / Pitfall:</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.pitfall)}</div>
            </div>
          </div>
        ` : ''}

        ${item.interviewTip ? `
          <div class="callout-box callout-tip" style="margin: 0;">
            <span class="callout-icon">💡</span>
            <div>
              <strong style="color: #38bdf8; display: block; font-size: 0.88rem; margin-bottom: 2px;">Staff Interview Strategy:</strong>
              <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55;">${this.escapeHtml(item.interviewTip)}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    overlay.classList.add('open');
  }

  closeGcpModal() {
    document.getElementById('gcp-modal-overlay')?.classList.remove('open');
  }

  navigateGcpModal(direction) {
    const services = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    if (services.length === 0) return;
    const idx = services.findIndex(s => s.id === this.currentGcpServiceId);
    if (idx === -1) return;
    const newIdx = (idx + direction + services.length) % services.length;
    this.openGcpModal(services[newIdx].id);
  }

  renderGcpTopics(filterCategory = 'all') {
    const container = document.getElementById('gcp-cards-container');
    const banner = document.getElementById('gcp-active-banner');
    if (!container) return;

    if (banner) {
      banner.style.display = 'none';
    }

    const services = window.REVISION_APP_DATA?.GCP_SERVICES || [];
    let list = services;
    if (filterCategory !== 'all') {
      list = services.filter(s => s.category === filterCategory);
    }

    const formattedList = list.map(s => this.formatGcpAsTopic(s));
    container.innerHTML = this.renderTopicCardsHtml(formattedList, 'border-gcp');
  }

  filterGcpCategory(cat) {
    const section = document.getElementById('section-gcp');
    if (section) {
      section.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderGcpTopics(cat);
  }

  navigateToGcpTopic(serviceId) {
    this.switchSection('gcp');
    this.closeMobileSidebar();
    this.selectGcpTopic(serviceId);
  }

  // -------------------------------------------------------------
  // Java Streams & SQL Sections
  // -------------------------------------------------------------
  renderStreamsTopics(filterCategory = 'all') {
    const container = document.getElementById('streams-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.STREAMS_TOPICS || [];
    const codingQs = (window.REVISION_APP_DATA?.STREAM_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'Streams Coding'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'coding') {
      list = codingQs.filter(q => !q.id.includes('jpa'));
    } else if (filterCategory === 'jpa_hibernate' || filterCategory === 'jpa') {
      list = codingQs.filter(q => q.id.includes('jpa') || (q.category || '').toLowerCase().includes('jpa'));
    } else {
      list = [...archTopics, ...codingQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-streams');
  }

  filterStreamsCategory(cat) {
    const container = document.getElementById('section-streams');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderStreamsTopics(cat);
  }

  renderSqlTopics(filterCategory = 'all') {
    const container = document.getElementById('sql-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.SQL_TOPICS || [];
    const codingQs = (window.REVISION_APP_DATA?.SQL_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'SQL Query Challenge'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'coding') {
      list = codingQs;
    } else {
      list = [...archTopics, ...codingQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-sql');
  }

  filterSqlCategory(cat) {
    const container = document.getElementById('section-sql');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderSqlTopics(cat);
  }

  renderKafkaTopics(filterCategory = 'all') {
    const container = document.getElementById('kafka-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.KAFKA_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.KAFKA_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'Kafka Scenario'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'scenarios' || filterCategory === 'questions') {
      list = scenarioQs;
    } else {
      list = [...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-kafka');
  }

  filterKafkaCategory(cat) {
    const container = document.getElementById('section-kafka');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderKafkaTopics(cat);
  }

  renderReactTopics(filterCategory = 'all') {
    const container = document.getElementById('react-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.REACT_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.REACT_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'React Scenario'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'scenarios' || filterCategory === 'questions') {
      list = scenarioQs;
    } else {
      list = [...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-react');
  }

  filterReactCategory(cat) {
    const container = document.getElementById('section-react');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderReactTopics(cat);
  }

  renderDevopsTopics(filterCategory = 'all') {
    const container = document.getElementById('devops-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.DEVOPS_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.DEVOPS_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'DevOps Scenario'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'scenarios' || filterCategory === 'questions') {
      list = scenarioQs;
    } else {
      list = [...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-devops');
  }

  filterDevopsCategory(cat) {
    const container = document.getElementById('section-devops');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderDevopsTopics(cat);
  }

  // -------------------------------------------------------------
  // Application Lifecycle (Spring Boot to GCP & Apigee)
  // -------------------------------------------------------------
  renderLifecycleSection(filterPhase = 'all') {
    const stepperContainer = document.getElementById('lifecycle-stepper-container');
    const matrixContainer = document.getElementById('lifecycle-matrix-container');
    const cheatContainer = document.getElementById('lifecycle-cheat-sheet-container');
    if (!stepperContainer) return;

    const stages = window.REVISION_APP_DATA?.LIFECYCLE_STAGES || [];
    const matrix = window.REVISION_APP_DATA?.LIFECYCLE_MATRIX || [];
    const cheatSheet = window.REVISION_APP_DATA?.LIFECYCLE_CHEAT_SHEET || [];

    // Filter stages if needed
    const filteredStages = filterPhase === 'all' 
      ? stages 
      : stages.filter(s => s.phase === filterPhase);

    // Render stepper cards
    stepperContainer.innerHTML = filteredStages.map(stage => `
      <article class="lifecycle-card phase-${stage.phase}" id="${stage.id}" data-phase="${stage.phase}">
        <div class="lifecycle-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${stage.id}-content" onclick="app.toggleLifecycleStage('${stage.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); app.toggleLifecycleStage('${stage.id}');}">
          <div class="lifecycle-header-left">
            <div class="lifecycle-step-badge" style="background: ${stage.phaseBadgeColor};">
              <span style="font-size: 0.65rem; opacity: 0.85;">STEP</span>
              <span>${String(stage.step).padStart(2, '0')}</span>
            </div>
            <div class="lifecycle-icon-wrap" style="border-color: ${stage.phaseBadgeColor}55;">
              ${stage.svgIcon}
            </div>
            <div class="lifecycle-title-block">
              <div class="lifecycle-meta-tags">
                <span class="hero-badge-pill" style="font-size: 0.68rem; padding: 2px 8px; border-color: ${stage.phaseBadgeColor}66; color: ${stage.phaseBadgeColor};">${stage.phaseLabel}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">👤 Owner: ${stage.owner}</span>
              </div>
              <h3 class="lifecycle-title">${stage.title}</h3>
              <div class="lifecycle-subtitle">${stage.subtitle}</div>
            </div>
          </div>
          <svg class="lifecycle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        <div class="lifecycle-body" id="${stage.id}-content" role="region">
          <div class="lifecycle-section-title">🔍 (a) What Happens Here</div>
          <p class="lifecycle-text">${stage.whatHappens}</p>

          <div class="lifecycle-section-title">🛠️ (b) Key Tools &amp; Artifacts Involved</div>
          <div class="lifecycle-tools-list">
            ${stage.tools.map(t => `<span class="lifecycle-tool-badge">${this.escapeHtml(t)}</span>`).join('')}
          </div>

          <div class="callout-dev">
            <div class="callout-dev-header">
              <span>👤</span> DEVELOPER RESPONSIBILITY
            </div>
            <div style="font-size: 0.85rem; line-height: 1.55; color: var(--text-primary);">${stage.developerResponsibility}</div>
          </div>

          <div class="callout-pitfall">
            <div class="callout-pitfall-header">
              <span>⚠️</span> COMMON PITFALL TO AVOID
            </div>
            <div style="font-size: 0.85rem; line-height: 1.55; color: var(--text-secondary);">${stage.commonPitfall}</div>
          </div>

          ${stage.codeSnippet ? `
            <div class="lifecycle-section-title" style="margin-top: 14px;">📄 Production Blueprint / Configuration</div>
            <div class="card-code-preview" style="margin-top: 4px;">
              <div class="code-header">
                <span>Configuration / Manifest Blueprint</span>
                <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
              </div>
              <pre><code>${this.escapeHtml(stage.codeSnippet)}</code></pre>
            </div>
          ` : ''}
        </div>
      </article>
    `).join('');

    // Render Matrix Table if present
    if (matrixContainer && matrix.length > 0) {
      matrixContainer.innerHTML = `
        <div class="lifecycle-matrix-wrapper">
          <table class="lifecycle-matrix-table">
            <thead>
              <tr>
                <th style="width: 18%;">Lifecycle Stage</th>
                <th style="width: 32%;">👤 Developer Ownership</th>
                <th style="width: 28%;">🛡️ Platform / DevOps Ownership</th>
                <th style="width: 22%;">📄 Primary Files &amp; Config</th>
              </tr>
            </thead>
            <tbody>
              ${matrix.map(row => `
                <tr>
                  <td>
                    <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">${row.stage}</strong>
                    <span class="hero-badge-pill" style="font-size: 0.65rem;">${row.phase}</span>
                  </td>
                  <td>${row.developer}</td>
                  <td>${row.platform}</td>
                  <td><code style="font-size: 0.76rem; background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; color: var(--text-link);">${row.files}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Render Cheat Sheet
    if (cheatContainer && cheatSheet.length > 0) {
      cheatContainer.innerHTML = `
        <div class="lifecycle-cheat-sheet">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">⚡</span>
              <strong style="color: var(--text-primary); font-size: 1rem;">60-Second Interview Cheat Sheet: The Full 12-Stage Lifecycle</strong>
            </div>
            <span class="hero-badge-pill highlight" style="font-size: 0.72rem;">Memory Anchors</span>
          </div>
          <div class="cheat-sheet-grid">
            ${cheatSheet.map(item => `
              <div class="cheat-sheet-item">
                <span class="cheat-sheet-num">${item.step}</span>
                <div>
                  <strong style="color: var(--text-primary); font-size: 0.85rem; display: block; margin-bottom: 2px;">${item.name}</strong>
                  <span style="color: var(--text-secondary); font-size: 0.82rem;">${item.rule}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  toggleLifecycleStage(stageId) {
    const card = document.getElementById(stageId);
    if (!card) return;
    const isOpen = card.classList.contains('open');
    card.classList.toggle('open', !isOpen);
    const header = card.querySelector('.lifecycle-header');
    if (header) {
      header.setAttribute('aria-expanded', String(!isOpen));
    }
  }

  expandAllLifecycleStages(expand) {
    document.querySelectorAll('.lifecycle-card').forEach(card => {
      card.classList.toggle('open', expand);
      const header = card.querySelector('.lifecycle-header');
      if (header) {
        header.setAttribute('aria-expanded', String(expand));
      }
    });
  }

  jumpToLifecycleStage(stepNum) {
    const card = document.querySelector(`.lifecycle-card[id^="stage-${stepNum}-"]`) || document.getElementById(`stage-${stepNum}`);
    if (card) {
      card.classList.add('open');
      const header = card.querySelector('.lifecycle-header');
      if (header) header.setAttribute('aria-expanded', 'true');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.4)';
      setTimeout(() => card.style.boxShadow = '', 2000);
    }
  }

  filterLifecyclePhase(phaseKey) {
    const container = document.getElementById('section-lifecycle');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      if (typeof event !== 'undefined' && event?.target?.classList?.contains('filter-chip')) {
        event.target.classList.add('active');
      }
    }
    this.renderLifecycleSection(phaseKey);
  }

  navigateToLifecycleStage(stepNum) {
    this.switchSection('lifecycle');
    this.closeMobileSidebar();
    setTimeout(() => {
      this.jumpToLifecycleStage(stepNum);
    }, 120);
  }

  renderRedisTopics(filterCategory = 'all') {
    const container = document.getElementById('redis-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.REDIS_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.REDIS_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'Redis Scenario'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'scenarios' || filterCategory === 'questions') {
      list = scenarioQs;
    } else {
      list = [...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-redis');
  }

  filterRedisCategory(cat) {
    const container = document.getElementById('section-redis');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderRedisTopics(cat);
  }

  renderConcurrencyTopics(filterCategory = 'all') {
    const container = document.getElementById('concurrency-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.CONCURRENCY_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.CONCURRENCY_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'Concurrency Question'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'questions') {
      list = scenarioQs;
    } else {
      list = [...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-concurrency');
  }

  filterConcurrencyCategory(cat) {
    const container = document.getElementById('section-concurrency');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderConcurrencyTopics(cat);
  }

  renderHldTopics(filterCategory = 'all') {
    const container = document.getElementById('hld-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.HLD_TOPICS || [];
    const problemQs = (window.REVISION_APP_DATA?.HLD_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'HLD Problem'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'problems') {
      list = problemQs;
    } else {
      list = [...archTopics, ...problemQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-hld');
  }

  filterHldCategory(cat) {
    const container = document.getElementById('section-hld');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderHldTopics(cat);
  }

  renderLldTopics(filterCategory = 'all') {
    const container = document.getElementById('lld-cards-container');
    if (!container) return;

    const patternTopics = window.REVISION_APP_DATA?.LLD_TOPICS || [];
    const problemQs = (window.REVISION_APP_DATA?.LLD_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'LLD Problem'));

    let list = [];
    if (filterCategory === 'patterns') {
      list = patternTopics;
    } else if (filterCategory === 'problems') {
      list = problemQs;
    } else {
      list = [...patternTopics, ...problemQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-lld');
  }

  filterLldCategory(cat) {
    const container = document.getElementById('section-lld');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderLldTopics(cat);
  }

  formatQuestionAsTopic(q, defaultCategory) {
    const keyPoints = [];
    if (q.question && q.question !== q.title) keyPoints.push(`❓ Tricky Question: ${q.question}`);
    if (q.problem) keyPoints.push(`🚨 Production Dilemma / Trap: ${q.problem}`);
    if (q.innerWorking) keyPoints.push(`⚙️ Under the Hood / JVM Mechanics: ${q.innerWorking}`);
    if (Array.isArray(q.seniorAnswer)) {
      q.seniorAnswer.forEach(pt => keyPoints.push(`🎯 Staff-Level Resolution: ${pt}`));
    } else if (typeof q.seniorAnswer === 'string') {
      keyPoints.push(`🎯 Staff-Level Resolution: ${q.seniorAnswer}`);
    } else if (q.explanation) {
      keyPoints.push(`🎯 Senior Architectural Answer: ${q.explanation}`);
    }
    if (q.juniorTrap) keyPoints.push(`⚠️ Junior Trap to Avoid: ${q.juniorTrap}`);
    if (q.warStory) keyPoints.push(`🔥 Real Production War Story: ${q.warStory}`);

    return {
      id: q.id,
      title: q.title || q.question,
      category: q.topicTitle ? `Java: ${q.topicTitle}` : (q.category || defaultCategory),
      badge: q.difficulty || "Senior Trap",
      oneLiner: q.question || q.summary || q.problem,
      summary: q.problem || q.question,
      keyPoints: keyPoints.length > 0 ? keyPoints : [
        `Scenario / Problem: ${q.problem || q.question}`,
        `Senior Architectural Answer: ${q.explanation || ''}`
      ],
      codeSnippet: q.codeSnippet || q.solution || '',
      pitfall: q.trap || q.juniorTrap || '',
      interviewTip: q.interviewerIntent || q.explanation || '',
      visualDiagram: q.visualDiagram || ''
    };
  }

  renderTopicCardsHtml(topics, borderClass) {
    return topics.map((t, idx) => {
      const isMastered = this.masteredItems.has(t.id);
      return `
        <div class="cheat-card ${borderClass} expandable" id="${t.id}">
          <!-- Clickable Header to Expand / Collapse -->
          <div class="card-expand-header" onclick="app.toggleCard('${t.id}')">
            <div class="card-title-group">
              <div class="card-title-row">
                <span class="hero-badge-pill highlight">${t.badge}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${t.category}</span>
                ${isMastered ? '<span class="tag-badge tag-spring" style="background: rgba(16,185,129,0.2);">Mastered ✓</span>' : ''}
              </div>
              <div class="card-title">${t.title}</div>
              <div class="card-one-liner">${this.escapeHtml(t.oneLiner || t.summary)}</div>
            </div>
            <div class="expand-toggle-pill">
              <span>Visual Mindmap</span>
              <span class="arrow-icon">▼</span>
            </div>
          </div>

          <!-- Expandable Deep Dive Body -->
          <div class="card-expand-body">
            <!-- 1. Visual Flow Diagram / Mind Map -->
            ${t.visualDiagram || ''}

            <!-- 2. Architectural Key Points -->
            <div style="margin-top: 10px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-link); margin-bottom: 6px;">
                📌 Core Architectural Invariants:
              </div>
              <ul class="key-points-list">
                ${t.keyPoints.map(kp => `
                  <li class="key-point-item">
                    <span class="point-bullet">›</span>
                    <span>${this.escapeHtml(kp)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- 3. Code Implementation Preview -->
            ${t.codeSnippet ? `
              <div class="card-code-preview">
                <div class="code-header">
                  <span>Code / Implementation</span>
                  <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
                </div>
                <pre><code>${this.escapeHtml(t.codeSnippet)}</code></pre>
              </div>
            ` : ''}

            <!-- 4. Trap / Pitfall & Interview Strategy (Responsive Side-by-Side Grid) -->
            ${(t.pitfall || t.interviewTip) ? `
              <div class="card-callout-grid">
                ${t.pitfall ? `
                  <div class="callout-box callout-danger" style="margin: 0;">
                    <span class="callout-icon">⚠️</span>
                    <div><strong>Trap / Pitfall:</strong> ${this.escapeHtml(t.pitfall)}</div>
                  </div>
                ` : ''}
                ${t.interviewTip ? `
                  <div class="callout-box callout-tip" style="margin: 0;">
                    <span class="callout-icon">💡</span>
                    <div><strong>Interview Strategy:</strong> ${this.escapeHtml(t.interviewTip)}</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Card Footer: Mastered checkbox & quick share -->
            <div class="card-footer">
              <label class="mastered-checkbox-label">
                <input type="checkbox" class="mastered-checkbox" data-item-id="${t.id}" ${isMastered ? 'checked' : ''} onchange="app.toggleMastered('${t.id}')">
                <span>Mark as Mastered</span>
              </label>
              <button class="btn-secondary" style="font-size: 0.75rem; padding: 4px 10px;" onclick="app.quickShareTopic('${t.id}')">Share Link</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  toggleCard(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('open');
    }
  }

  toggleAllCardsInSection(sectionContainerId, expand) {
    const container = document.getElementById(sectionContainerId);
    if (!container) return;
    container.querySelectorAll('.cheat-card, .question-item').forEach(card => {
      if (expand) card.classList.add('open');
      else card.classList.remove('open');
    });
  }

  // -------------------------------------------------------------
  // Tricky Questions Accordion
  // -------------------------------------------------------------
  renderQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) return;

    const questions = window.REVISION_APP_DATA?.QUESTIONS || [];
    container.innerHTML = questions.map((q, idx) => {
      const isMastered = this.masteredItems.has(q.id);
      return `
        <div class="question-item" id="${q.id}" data-category="${q.category}">
          <div class="question-header" onclick="app.toggleQuestion('${q.id}')">
            <div class="question-title-area">
              <div class="question-tags-row">
                <span class="tag-badge tag-senior">${q.difficulty}</span>
                <span class="tag-badge tag-java">${q.category}</span>
                ${isMastered ? '<span class="tag-badge tag-spring" style="background: rgba(16,185,129,0.2);">Mastered ✓</span>' : ''}
              </div>
              <div class="question-title">${idx + 1}. ${q.question}</div>
            </div>
            <div class="question-toggle-icon">▼</div>
          </div>

          <div class="question-details">
            <div class="trap-breakdown-grid">
              <div class="trap-col trap-junior">
                <div class="col-title">🚫 Junior / Mid Answer (The Trap)</div>
                <p>${q.juniorTrap}</p>
              </div>

              <div class="trap-col trap-senior">
                <div class="col-title">🎯 Interviewer's Core Intent</div>
                <p>${q.interviewerIntent}</p>
              </div>
            </div>

            <div class="deep-dive-section">
              <div class="deep-dive-title">🧠 Senior Architectural Breakdown</div>
              <div class="deep-dive-content">
                <ul>
                  ${q.seniorAnswer.map(point => `<li>${point}</li>`).join('')}
                </ul>
              </div>

              ${q.codeSnippet ? `
                <div class="card-code-preview" style="margin-top: 14px;">
                  <div class="code-header">
                    <span>Code Demonstration</span>
                    <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
                  </div>
                  <pre><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
                </div>
              ` : ''}

              ${q.warStory ? `
                <div class="callout-box callout-danger" style="margin-top: 14px;">
                  <span class="callout-icon">🔥</span>
                  <div><strong>Real Production War Story:</strong> ${q.warStory}</div>
                </div>
              ` : ''}
            </div>

            <div class="card-footer" style="margin-top: 14px;">
              <label class="mastered-checkbox-label">
                <input type="checkbox" class="mastered-checkbox" data-item-id="${q.id}" ${isMastered ? 'checked' : ''} onchange="app.toggleMastered('${q.id}')">
                <span>Mark as Mastered</span>
              </label>
              <button class="btn-secondary" style="font-size: 0.75rem; padding: 4px 10px;" onclick="app.quickShareTopic('${q.id}')">Copy Link</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  toggleQuestion(questionId) {
    const el = document.getElementById(questionId);
    if (el) {
      el.classList.toggle('open');
    }
  }

  toggleAllQuestions(expand) {
    document.querySelectorAll('.question-item').forEach(q => {
      if (expand) q.classList.add('open');
      else q.classList.remove('open');
    });
  }

  filterQuestionsByCategory(category) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    event?.target?.classList.add('active');

    document.querySelectorAll('.question-item').forEach(q => {
      if (category === 'all' || q.dataset.category.toLowerCase().includes(category.toLowerCase())) {
        q.style.display = 'block';
      } else {
        q.style.display = 'none';
      }
    });
  }

  // -------------------------------------------------------------
  // 140 Rapid-Fire Multi-Skill Rubric (Onix Networking)
  // -------------------------------------------------------------
  renderRapidFire(filterCategory = 'all', searchQuery = '') {
    const container = document.getElementById('rapidfire-container');
    if (!container) return;

    let questions = window.REVISION_APP_DATA?.RAPIDFIRE_QUESTIONS || [];

    if (filterCategory && filterCategory !== 'all') {
      questions = questions.filter(q => q.category === filterCategory);
    }

    if (searchQuery && searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      questions = questions.filter(q =>
        (q.title || '').toLowerCase().includes(qLower) ||
        (q.question || '').toLowerCase().includes(qLower) ||
        (q.answer || '').toLowerCase().includes(qLower) ||
        (q.codeSnippet && q.codeSnippet.toLowerCase().includes(qLower)) ||
        (q.takeaway && q.takeaway.toLowerCase().includes(qLower)) ||
        (q.categoryName || '').toLowerCase().includes(qLower)
      );
    }

    if (questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">No Rapid-Fire Questions Found</div>
          <div style="font-size: 0.85rem; margin-top: 4px; color: var(--text-secondary);">No questions matched your current filter or search query.</div>
          <button class="btn-secondary" style="margin-top: 14px; font-size: 0.8rem; padding: 6px 14px;" onclick="document.getElementById('rapidfire-search-input').value = ''; app.filterRapidFireByCategory('all');">✕ Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = questions.map((q) => {
      const isMastered = this.masteredItems.has(q.id);
      return `
        <div class="question-item rapidfire-card" id="${q.id}" data-category="${q.category}" style="border-left: 3px solid var(--accent-orange); background: var(--bg-card); border-radius: var(--radius-md); border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); transition: all 0.2s ease;">
          <div class="question-header" onclick="app.toggleRapidFire('${q.id}')" style="cursor: pointer; padding: 14px 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div class="question-title-area" style="flex: 1;">
              <div class="question-tags-row" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 6px;">
                <span class="tag-badge tag-senior" style="background: rgba(249, 115, 22, 0.15); color: #fb923c; border-color: rgba(249, 115, 22, 0.3); font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; font-weight: 700;">Skill ${q.skillNum} • ${q.categoryName}</span>
                <span class="tag-badge" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; font-weight: 700;">Q${q.qNum}</span>
                <span class="tag-badge" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px;">${q.status}</span>
                ${isMastered ? '<span class="tag-badge" style="background: rgba(16,185,129,0.2); color: #34d399; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px;">Mastered ✓</span>' : ''}
              </div>
              <div class="question-title" style="color: var(--text-primary); font-size: 0.98rem; font-weight: 700; line-height: 1.4;">${q.qNum}. ${q.title}</div>
            </div>
            <div class="question-toggle-icon" style="color: var(--text-muted); font-size: 0.85rem; transition: transform 0.2s ease;">▼</div>
          </div>

          <div class="question-details" style="display: none; padding: 0 18px 18px 18px;">
            <!-- Prompt / Problem Box -->
            <div style="padding: 12px 14px; background: rgba(30, 41, 59, 0.6); border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 12px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Scenario / Output Prompt</div>
              <div style="font-size: 0.9rem; color: var(--text-primary); line-height: 1.5; font-weight: 500;">${this.escapeHtml(q.question)}</div>
              ${q.codeSnippet ? `
                <div class="card-code-preview" style="margin-top: 10px; background: #0f172a; border-radius: 6px; border: 1px solid #334155;">
                  <div class="code-header" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #1e293b; border-bottom: 1px solid #334155; font-size: 0.74rem; color: #94a3b8;">
                    <span>Code Demonstration</span>
                    <button class="copy-btn" style="font-size: 0.7rem; padding: 2px 8px;" onclick="app.copyCode(this)">Copy</button>
                  </div>
                  <pre style="margin: 0; padding: 12px; overflow-x: auto; font-family: monospace; font-size: 0.84rem; color: #e2e8f0;"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
                </div>
              ` : ''}
            </div>

            <!-- Rubric Answer Box -->
            <div style="padding: 14px 16px; background: rgba(16, 185, 129, 0.08); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.25); margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #34d399; text-transform: uppercase; margin-bottom: 6px;">
                <span>🎯</span> Panelist Rubric Answer
              </div>
              <div style="font-size: 0.9rem; color: #e2e8f0; line-height: 1.6;">${this.escapeHtml(q.answer)}</div>
            </div>

            <!-- Senior Debugging Takeaway -->
            ${q.takeaway ? `
              <div class="callout-box" style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
                <span class="callout-icon" style="font-size: 1.1rem; line-height: 1;">💡</span>
                <div style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.45;"><strong style="color: #38bdf8;">Production Takeaway:</strong> ${this.escapeHtml(q.takeaway)}</div>
              </div>
            ` : ''}

            <!-- Card Footer -->
            <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <a href="#${q.targetAnchor}" class="btn-primary" style="font-size: 0.74rem; padding: 5px 12px; text-decoration: none; background: #2563eb; color: #fff; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" onclick="app.navigateToTopic('${q.targetSection}', '${q.targetAnchor}'); return false;">🔍 Open Deep Dive in ${q.targetSection.toUpperCase()}</a>
                <button class="btn-secondary" style="font-size: 0.74rem; padding: 5px 10px;" onclick="app.quickShareTopic('${q.id}')">Copy Q&A</button>
              </div>
              <label class="mastered-checkbox-label" style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" class="mastered-checkbox" data-item-id="${q.id}" ${isMastered ? 'checked' : ''} onchange="app.toggleMastered('${q.id}')">
                <span>Mark as Evaluated</span>
              </label>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  toggleRapidFire(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('open');
    const details = el.querySelector('.question-details');
    const icon = el.querySelector('.question-toggle-icon');
    if (details) {
      const isOpen = el.classList.contains('open');
      details.style.display = isOpen ? 'block' : 'none';
      if (icon) icon.style.transform = isOpen ? 'rotate(180deg)' : '';
    }
  }

  toggleAllRapidFire(expand) {
    document.querySelectorAll('#rapidfire-container .question-item').forEach(q => {
      const details = q.querySelector('.question-details');
      const icon = q.querySelector('.question-toggle-icon');
      if (expand) {
        q.classList.add('open');
        if (details) details.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
      } else {
        q.classList.remove('open');
        if (details) details.style.display = 'none';
        if (icon) icon.style.transform = '';
      }
    });
  }

  filterRapidFireByCategory(catId) {
    this.rapidFireActiveCategory = catId;
    document.querySelectorAll('#rapidfire-filter-chips .filter-chip').forEach(btn => {
      const text = btn.textContent.toLowerCase();
      let isMatch = false;
      if (catId === 'all') isMatch = text.includes('all');
      else if (catId === 'java') isMatch = text.includes('java');
      else if (catId === 'spring') isMatch = text.includes('spring');
      else if (catId === 'microservices') isMatch = text.includes('microservices');
      else if (catId === 'javascript') isMatch = text.includes('js');
      else if (catId === 'react') isMatch = text.includes('react');
      else if (catId === 'database') isMatch = text.includes('db');
      else if (catId === 'devops') isMatch = text.includes('devops');
      btn.classList.toggle('active', isMatch);
    });
    const searchVal = document.getElementById('rapidfire-search-input')?.value || '';
    this.renderRapidFire(catId, searchVal);
  }

  searchRapidFire(query) {
    const cat = this.rapidFireActiveCategory || 'all';
    this.renderRapidFire(cat, query);
  }

  // -------------------------------------------------------------
  // Progress & Mastery Tracking
  // -------------------------------------------------------------
  toggleMastered(id) {
    if (this.masteredItems.has(id)) {
      this.masteredItems.delete(id);
    } else {
      this.masteredItems.add(id);
    }
    localStorage.setItem('prep_mastered_items', JSON.stringify([...this.masteredItems]));
    this.updateStats();
  }

  updateStats() {
    const totalCount = (window.REVISION_APP_DATA?.JAVA_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.JAVA_460_QUESTIONS?.length || window.REVISION_APP_DATA?.JAVA_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.JAVA_INTERNALS?.length || 0) +
                       (window.REVISION_APP_DATA?.STREAMS_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.STREAM_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.SPRING_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.SPRING_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.SPRING_INTERNALS?.length || 0) +
                       (window.REVISION_APP_DATA?.SQL_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.SQL_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.KAFKA_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.KAFKA_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.REACT_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.REACT_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.DEVOPS_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.DEVOPS_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.LIFECYCLE_STAGES?.length || 0) +
                       (window.REVISION_APP_DATA?.REDIS_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.REDIS_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.CONCURRENCY_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.CONCURRENCY_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.HLD_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.HLD_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.LLD_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.LLD_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.JAVA_PATTERNS?.length || 0) +
                       (window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS?.length || 0) +
                       (window.REVISION_APP_DATA?.DSA_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.AWS_SERVICES?.length || 0) +
                       (window.REVISION_APP_DATA?.GCP_SERVICES?.length || 0) +
                       (window.REVISION_APP_DATA?.RAPIDFIRE_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.QUESTIONS?.length || 0);
    const masteredCount = this.masteredItems.size;
    const percentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    const statsText = document.getElementById('sidebar-stats-count');
    const progressBar = document.getElementById('sidebar-progress-fill');
    if (statsText) statsText.textContent = `${masteredCount} / ${totalCount} (${percentage}%)`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
  }

  // -------------------------------------------------------------
  // Search Index & Global Quick Jump (Ctrl + K)
  // -------------------------------------------------------------
  buildSearchIndex() {
    this.searchIndex = [];

    // Java Core Architecture
    (window.REVISION_APP_DATA?.JAVA_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'java',
        title: t.title,
        category: 'Java Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // Java Version Ladder (Java 8 -> 25 LTS)
    (window.REVISION_APP_DATA?.JAVA_VERSIONS || []).forEach(v => {
      this.searchIndex.push({
        id: v.id,
        section: 'java',
        title: `${v.versionNumber}: ${v.title}`,
        category: 'Java LTS Evolution Ladder',
        snippet: (v.oneLiner || v.whatIsIt || '').slice(0, 160)
      });
    });

    // Java 55 Core Internals Deep Dives
    (window.REVISION_APP_DATA?.JAVA_INTERNALS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'java',
        title: t.title,
        category: `Java Internals: ${t.category}`,
        snippet: (t.whatIsIt || t.oneLiner || t.internalWorking || '').slice(0, 160)
      });
    });

    // Java 460 Tricky Questions across 46 Subtopics
    const javaQuestions = window.REVISION_APP_DATA?.JAVA_460_QUESTIONS || window.REVISION_APP_DATA?.JAVA_QUESTIONS || [];
    javaQuestions.forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'java',
        title: q.title || q.question,
        category: q.topicTitle ? `Java: ${q.topicTitle}` : (q.category || 'Java Tricky Q&A'),
        snippet: (q.summary || q.problem || q.question || '').slice(0, 160)
      });
    });

    // Java Streams Architecture
    (window.REVISION_APP_DATA?.STREAMS_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'streams',
        title: t.title,
        category: 'Java Streams',
        snippet: t.oneLiner || t.summary
      });
    });

    // Java Streams Coding Questions
    (window.REVISION_APP_DATA?.STREAM_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'streams',
        title: q.title,
        category: 'Streams Coding',
        snippet: q.summary || q.problem
      });
    });

    // Spring Boot 29 Internal Working Deep Dives
    (window.REVISION_APP_DATA?.SPRING_INTERNALS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'spring',
        title: t.title,
        category: `Spring Internals: ${t.category}`,
        snippet: (t.whatIsIt || t.oneLiner || t.internalWorking || '').slice(0, 160)
      });
    });

    // Spring Boot Architecture
    (window.REVISION_APP_DATA?.SPRING_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'spring',
        title: t.title,
        category: 'Spring Boot Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // Spring Boot Scenario Questions
    (window.REVISION_APP_DATA?.SPRING_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'spring',
        title: q.title,
        category: 'Spring Scenario',
        snippet: q.summary || q.problem
      });
    });

    // SQL Architecture
    (window.REVISION_APP_DATA?.SQL_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'sql',
        title: t.title,
        category: 'SQL Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // SQL Coding Questions
    (window.REVISION_APP_DATA?.SQL_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'sql',
        title: q.title,
        category: 'SQL Coding',
        snippet: q.summary || q.problem
      });
    });

    // Kafka Architecture
    (window.REVISION_APP_DATA?.KAFKA_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'kafka',
        title: t.title,
        category: 'Kafka Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // Kafka Scenario Questions
    (window.REVISION_APP_DATA?.KAFKA_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'kafka',
        title: q.title,
        category: 'Kafka Scenario',
        snippet: q.summary || q.problem
      });
    });

    // React & Redux Architecture
    (window.REVISION_APP_DATA?.REACT_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'react',
        title: t.title,
        category: 'React Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // React & Redux Scenario Questions
    (window.REVISION_APP_DATA?.REACT_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'react',
        title: q.title,
        category: 'React Scenario',
        snippet: q.summary || q.problem
      });
    });

    // DevOps & Cloud Native Architecture
    (window.REVISION_APP_DATA?.DEVOPS_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'devops',
        title: t.title,
        category: 'DevOps Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // DevOps Scenario Questions
    (window.REVISION_APP_DATA?.DEVOPS_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'devops',
        title: q.title,
        category: 'DevOps Scenario',
        snippet: q.summary || q.problem
      });
    });

    // Application Lifecycle (Spring Boot to GCP & Apigee)
    (window.REVISION_APP_DATA?.LIFECYCLE_STAGES || []).forEach(s => {
      this.searchIndex.push({
        id: s.id,
        section: 'lifecycle',
        title: `${s.step}. ${s.title}`,
        category: `App Lifecycle: ${s.phaseLabel}`,
        snippet: (s.subtitle + ' ' + s.whatHappens).slice(0, 160)
      });
    });

    // Redis Architecture
    (window.REVISION_APP_DATA?.REDIS_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'redis',
        title: t.title,
        category: 'Redis Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // Redis Scenario Questions
    (window.REVISION_APP_DATA?.REDIS_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'redis',
        title: q.title,
        category: 'Redis Scenario',
        snippet: q.summary || q.problem
      });
    });

    // Concurrency Architecture
    (window.REVISION_APP_DATA?.CONCURRENCY_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'concurrency',
        title: t.title,
        category: 'Concurrency Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // Concurrency Scenario Questions
    (window.REVISION_APP_DATA?.CONCURRENCY_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'concurrency',
        title: q.title,
        category: 'Concurrency Question',
        snippet: q.summary || q.problem
      });
    });

    // HLD Architecture
    (window.REVISION_APP_DATA?.HLD_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'hld',
        title: t.title,
        category: 'HLD Architecture',
        snippet: t.oneLiner || t.summary
      });
    });

    // HLD Problems
    (window.REVISION_APP_DATA?.HLD_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'hld',
        title: q.title,
        category: 'HLD Problem',
        snippet: q.summary || q.problem
      });
    });

    // LLD Patterns
    (window.REVISION_APP_DATA?.LLD_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'lld',
        title: t.title,
        category: 'LLD Design Pattern',
        snippet: t.oneLiner || t.summary
      });
    });

    // LLD Problems
    (window.REVISION_APP_DATA?.LLD_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'lld',
        title: q.title,
        category: 'LLD Problem',
        snippet: q.summary || q.problem
      });
    });

    // Java Design Patterns (24 GoF & Modern Patterns)
    (window.REVISION_APP_DATA?.JAVA_PATTERNS || []).forEach(p => {
      this.searchIndex.push({
        id: p.id,
        section: 'design-patterns',
        title: p.title,
        category: `Java Pattern: ${p.category}`,
        snippet: (p.whatIsIt || p.internalWorking || '').slice(0, 160)
      });
    });

    // Microservices Architecture Patterns (25 Distributed Patterns)
    (window.REVISION_APP_DATA?.MICROSERVICES_PATTERNS || []).forEach(p => {
      this.searchIndex.push({
        id: p.id,
        section: 'microservices',
        title: p.title,
        category: `Microservices: ${p.category}`,
        snippet: (p.whatIsIt || p.internalWorking || '').slice(0, 160)
      });
    });

    // AWS Cloud Services & IAM Architecture
    (window.REVISION_APP_DATA?.AWS_SERVICES || []).forEach(s => {
      this.searchIndex.push({
        id: s.id,
        section: 'aws',
        title: s.title,
        category: `AWS: ${s.category}`,
        snippet: (s.whatIsIt || s.whenAndWhy || '').slice(0, 160)
      });
    });

    // Google Cloud Platform (GCP) Services & IAM Architecture
    (window.REVISION_APP_DATA?.GCP_SERVICES || []).forEach(s => {
      this.searchIndex.push({
        id: s.id,
        section: 'gcp',
        title: s.title,
        category: `GCP: ${s.category}`,
        snippet: (s.whatIsIt || s.whenAndWhy || '').slice(0, 160)
      });
    });

    // DSA
    (window.REVISION_APP_DATA?.DSA_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'dsa',
        title: t.title,
        category: `DSA: ${t.category}`,
        snippet: ((t.triggerSignals ? t.triggerSignals.join(', ') + ' | ' : '') + (t.whatIsIt || t.summary || '')).slice(0, 160)
      });
    });

    // Questions
    (window.REVISION_APP_DATA?.QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'questions',
        title: q.question,
        category: 'Tricky Q&A',
        snippet: q.juniorTrap
      });
    });

    // 140 Rapid-Fire Multi-Skill Rubric (Onix Networking)
    (window.REVISION_APP_DATA?.RAPIDFIRE_QUESTIONS || []).forEach(q => {
      this.searchIndex.push({
        id: q.id,
        section: 'rapidfire',
        title: `${q.qNum}. [${q.categoryName}] ${q.title}`,
        category: `Rapid-Fire: ${q.categoryName}`,
        snippet: (q.question + ' ' + q.answer).slice(0, 160)
      });
    });

    // Mind maps
    const mindmaps = window.REVISION_APP_DATA?.MINDMAPS || {};
    Object.values(mindmaps).forEach(map => {
      map.branches.forEach(b => {
        this.searchIndex.push({
          id: 'mindmap',
          section: 'mindmap',
          title: `${map.title}: ${b.name}`,
          category: 'Mind Map',
          snippet: `${b.mnemonic} - ${b.rule}`
        });
      });
    });
  }

  openSearchModal() {
    const modal = document.getElementById('search-modal-overlay');
    const input = document.getElementById('global-search-input');
    if (modal && input) {
      modal.classList.add('open');
      input.value = '';
      input.focus();
      this.performSearch('');
    }
  }

  closeSearchModal() {
    document.getElementById('search-modal-overlay')?.classList.remove('open');
  }

  performSearch(query) {
    const resultsContainer = document.getElementById('search-results-list');
    if (!resultsContainer) return;

    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.innerHTML = '<div style="padding: 16px; color: var(--text-muted); text-align: center; font-size: 0.88rem;">Type to search any Java, Spring, DSA concept or tricky question...</div>';
      return;
    }

    const matches = this.searchIndex.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.snippet.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 16px; color: var(--text-muted); text-align: center;">No matching topics found.</div>';
      return;
    }

    resultsContainer.innerHTML = matches.map((item, idx) => `
      <div class="search-result-item ${idx === 0 ? 'selected' : ''}" onclick="app.selectSearchResult('${item.section}', '${item.id}')">
        <div class="result-item-header">
          <span class="result-item-title">${item.title}</span>
          <span class="result-item-category">${item.category}</span>
        </div>
        <div class="result-item-snippet">${item.snippet}</div>
      </div>
    `).join('');
  }

  selectSearchResult(section, id) {
    this.closeSearchModal();
    if (section === 'mindmap') {
      this.switchSection('mindmap');
    } else {
      this.navigateToTopic(section, id);
    }
  }

  // -------------------------------------------------------------
  // Topic Creator Modal
  // -------------------------------------------------------------
  openCreatorModal() {
    document.getElementById('creator-modal-overlay')?.classList.add('open');
  }

  closeCreatorModal() {
    document.getElementById('creator-modal-overlay')?.classList.remove('open');
  }

  saveCustomTopic() {
    const type = document.getElementById('creator-type')?.value;
    const title = document.getElementById('creator-title')?.value.trim();
    const category = document.getElementById('creator-category')?.value.trim();
    const summary = document.getElementById('creator-summary')?.value.trim();
    const code = document.getElementById('creator-code')?.value.trim();

    if (!title || !summary) {
      alert('Please fill in at least the Title and Summary/Answer fields.');
      return;
    }

    const newId = 'custom-' + Date.now();

    if (type === 'question') {
      const newQuestion = {
        id: newId,
        category: category || 'Custom Senior Q&A',
        difficulty: 'Senior',
        question: title,
        interviewerIntent: 'Custom candidate evaluation topic',
        juniorTrap: 'Common superficial implementation understanding',
        seniorAnswer: summary.split('\n').filter(s => s.trim().length > 0),
        codeSnippet: code,
        warStory: ''
      };
      window.REVISION_APP_DATA.QUESTIONS.unshift(newQuestion);
      this.renderQuestions();
    this.renderRapidFire();
    } else {
      const newTopic = {
        id: newId,
        title: title,
        category: category || 'General',
        badge: 'Custom Topic',
        oneLiner: summary.split('\n')[0],
        summary: summary,
        keyPoints: summary.split('\n').filter(s => s.trim().length > 0),
        codeSnippet: code,
        pitfall: '',
        interviewTip: '',
        visualDiagram: `
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Custom Mental Model: ${title}</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue"><span class="node-label">Input / Trigger</span></div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green"><span class="node-label">${title}</span></div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple"><span class="node-label">Execution Result</span></div>
            </div>
          </div>
        `
      };

      if (type === 'java') {
        window.REVISION_APP_DATA.JAVA_TOPICS.unshift(newTopic);
        this.renderJavaTopics();
      } else if (type === 'streams') {
        window.REVISION_APP_DATA.STREAMS_TOPICS.unshift(newTopic);
        this.renderStreamsTopics();
      } else if (type === 'spring') {
        window.REVISION_APP_DATA.SPRING_TOPICS.unshift(newTopic);
        this.renderSpringTopics();
      } else if (type === 'sql') {
        window.REVISION_APP_DATA.SQL_TOPICS.unshift(newTopic);
        this.renderSqlTopics();
      } else if (type === 'kafka') {
        window.REVISION_APP_DATA.KAFKA_TOPICS.unshift(newTopic);
        this.renderKafkaTopics();
      } else if (type === 'react') {
        window.REVISION_APP_DATA.REACT_TOPICS.unshift(newTopic);
        this.renderReactTopics();
      } else if (type === 'devops') {
        window.REVISION_APP_DATA.DEVOPS_TOPICS.unshift(newTopic);
        this.renderDevopsTopics();
    this.renderLifecycleSection();
      } else if (type === 'redis') {
        window.REVISION_APP_DATA.REDIS_TOPICS.unshift(newTopic);
        this.renderRedisTopics();
      } else if (type === 'concurrency') {
        window.REVISION_APP_DATA.CONCURRENCY_TOPICS.unshift(newTopic);
        this.renderConcurrencyTopics();
      } else if (type === 'hld') {
        window.REVISION_APP_DATA.HLD_TOPICS.unshift(newTopic);
        this.renderHldTopics();
      } else if (type === 'lld') {
        window.REVISION_APP_DATA.LLD_TOPICS.unshift(newTopic);
        this.renderLldTopics();
      } else {
        window.REVISION_APP_DATA.DSA_TOPICS.unshift(newTopic);
        this.renderDsaTopics();
      }
    }

    // Refresh search & sidebar
    this.buildSearchIndex();
    this.renderSidebarNavigation();
    this.updateStats();
    this.closeCreatorModal();

    alert('🎉 Topic added successfully! It is now live in your revision hub.');
  }

  // -------------------------------------------------------------
  // Helpers & Event Listeners
  // -------------------------------------------------------------
  initMindMap() {
    this.mindmapViz = new MindMapVisualizer('mindmap-viewport');
    this.mindmapViz.init();
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    // Sidebar search filter input
    document.getElementById('sidebar-filter-input')?.addEventListener('input', (e) => {
      this.filterSidebarLinks(e.target.value);
    });

    // Mobile sidebar toggle & backdrop listeners
    document.getElementById('mobile-sidebar-toggle')?.addEventListener('click', () => this.openMobileSidebar());
    document.getElementById('mobile-sidebar-close')?.addEventListener('click', () => this.closeMobileSidebar());
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => this.closeMobileSidebar());

    // Global keyboard shortcut: Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearchModal();
      }
      if (e.key === 'Escape') {
        this.closeSearchModal();
        this.closeCreatorModal();
        this.closeSpringInternalModal();
        this.closeJavaInternalModal();
        this.closeJavaPatternModal();
        this.closeMicroservicesPatternModal();
        this.closeDsaModal();
        this.closeAwsModal();
        this.closeGcpModal();
        this.closeMobileSidebar();
        this.mindmapViz?.closeDrawer();
      }
      const awsModal = document.getElementById('aws-modal-overlay');
      if (awsModal && awsModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateAwsModal(-1);
        if (e.key === 'ArrowRight') this.navigateAwsModal(1);
      }
      const gcpModal = document.getElementById('gcp-modal-overlay');
      if (gcpModal && gcpModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateGcpModal(-1);
        if (e.key === 'ArrowRight') this.navigateGcpModal(1);
      }
      const jvModal = document.getElementById('java-internals-modal-overlay');
      if (jvModal && jvModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateJavaInternalModal(-1);
        if (e.key === 'ArrowRight') this.navigateJavaInternalModal(1);
      }
      const sbModal = document.getElementById('spring-internals-modal-overlay');
      if (sbModal && sbModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateSpringInternalModal(-1);
        if (e.key === 'ArrowRight') this.navigateSpringInternalModal(1);
      }
      const patModal = document.getElementById('patterns-modal-overlay');
      if (patModal && patModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateJavaPatternModal(-1);
        if (e.key === 'ArrowRight') this.navigateJavaPatternModal(1);
      }
      const msModal = document.getElementById('microservices-modal-overlay');
      if (msModal && msModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateMicroservicesPatternModal(-1);
        if (e.key === 'ArrowRight') this.navigateMicroservicesPatternModal(1);
      }
      const dsaModal = document.getElementById('dsa-modal-overlay');
      if (dsaModal && dsaModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') this.navigateDsaModal(-1);
        if (e.key === 'ArrowRight') this.navigateDsaModal(1);
      }
    });

    // Search input listener
    document.getElementById('global-search-input')?.addEventListener('input', (e) => {
      this.performSearch(e.target.value);
    });

    // Handle hash change
    window.addEventListener('hashchange', () => this.handleInitialHash());
  }

  handleInitialHash() {
    let hash = window.location.hash.replace('#', '');
    if (!hash) return;
    if (hash === 'springboot') hash = 'spring';
    if (hash === 'stream') hash = 'streams';
    if (hash === 'mysql' || hash === 'postgres') hash = 'sql';
    if (hash === 'multithreading' || hash === 'threads') hash = 'concurrency';
    if (hash === 'systemdesign' || hash === 'system-design' || hash === 'system') hash = 'hld';
    if (hash === 'machinecoding' || hash === 'machine-coding' || hash === 'ood') hash = 'lld';
    if (hash === 'app-lifecycle') hash = 'lifecycle';
    if (hash === 'patterns' || hash === 'java-patterns' || hash === 'design-pattern' || hash === 'designpatterns' || hash === 'java-design-patterns') hash = 'design-patterns';
    if (hash === 'ms' || hash === 'microservice' || hash === 'ms-patterns' || hash === 'microservice-patterns' || hash === 'microservices-patterns') hash = 'microservices';

    if (hash === 'aws-cloud' || hash === 'amazon' || hash === 'aws-services') hash = 'aws';
    if (hash === 'gcp-cloud' || hash === 'google' || hash === 'google-cloud' || hash === 'gcp-services') hash = 'gcp';

    if (['mindmap', 'java', 'streams', 'spring', 'sql', 'kafka', 'react', 'devops', 'lifecycle', 'redis', 'concurrency', 'hld', 'lld', 'dsa', 'questions', 'design-patterns', 'microservices', 'aws', 'gcp'].includes(hash)) {
      this.switchSection(hash);
    } else {
      // Find which section it belongs to
      const item = this.searchIndex.find(i => i.id === hash);
      if (item) {
        this.navigateToTopic(item.section, hash);
      }
    }
  }

  copyCode(btn) {
    const code = btn.closest('.card-code-preview').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      btn.style.color = '#34d399';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.color = '';
      }, 1500);
    });
  }

  quickShareTopic(topicId) {
    const url = `${window.location.origin}${window.location.pathname}#${topicId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`Link copied to clipboard!\n${url}`);
    });
  }

  truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new RevisionApp();
  window.app.init();
});
