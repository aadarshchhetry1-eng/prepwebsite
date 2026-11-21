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
    this.renderJavaTopics();
    this.renderStreamsTopics();
    this.renderSpringTopics();
    this.renderSqlTopics();
    this.renderKafkaTopics();
    this.renderReactTopics();
    this.renderDevopsTopics();
    this.renderRedisTopics();
    this.renderConcurrencyTopics();
    this.renderHldTopics();
    this.renderLldTopics();
    this.renderDsaTopics();
    this.renderQuestions();
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
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('java')">
          <span>☕ Core Java</span>
          <span class="badge-count">${javaTopics.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#jmm-concurrency-barriers" class="compact-mini-pill" onclick="app.navigateToTopic('java', 'jmm-concurrency-barriers'); return false;">JMM Barriers</a>
          <a href="#aqs-locks-synchronizers" class="compact-mini-pill" onclick="app.navigateToTopic('java', 'aqs-locks-synchronizers'); return false;">AQS Locks</a>
          <a href="#java21-virtual-threads" class="compact-mini-pill" onclick="app.navigateToTopic('java', 'java21-virtual-threads'); return false;">V-Threads</a>
          <a href="#hashmap-internals-treeification" class="compact-mini-pill" onclick="app.navigateToTopic('java', 'hashmap-internals-treeification'); return false;">HashMap</a>
          <a href="#jvm-vtable-polymorphism" class="compact-mini-pill" onclick="app.navigateToTopic('java', 'jvm-vtable-polymorphism'); return false;">V-Table &amp; OOPs</a>
          <a href="#gc-safepoints-pause-tuning" class="compact-mini-pill" onclick="app.navigateToTopic('java', 'gc-safepoints-pause-tuning'); return false;">GC Tuning</a>
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
    html += `
      <div class="compact-section-card">
        <button class="compact-section-header" onclick="app.switchSection('spring')">
          <span>🌱 Spring Boot</span>
          <span class="badge-count">${springTopics.length + springQuestions.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#spring-proxies-transactional-pitfalls" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-proxies-transactional-pitfalls'); return false;">Proxy Trap</a>
          <a href="#spring-transaction-propagation-internals" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-transaction-propagation-internals'); return false;">Propagation</a>
          <a href="#hibernate-persistence-context-dirty-checking" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'hibernate-persistence-context-dirty-checking'); return false;">Dirty Checking</a>
          <a href="#spring-security-filter-chain-delegating-proxy" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-security-filter-chain-delegating-proxy'); return false;">Security Chain</a>
          <a href="#spring-boot-autoconfiguration-internals" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-boot-autoconfiguration-internals'); return false;">Auto-Config</a>
          <a href="#circular-dependencies-three-level-cache" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'circular-dependencies-three-level-cache'); return false;">3-Level Cache</a>
          <a href="#jpa-hibernate-nplusone-osiv" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'jpa-hibernate-nplusone-osiv'); return false;">N+1 & OSIV</a>
          <a href="#spring-q1-nested-transaction-rollback-only" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q1-nested-transaction-rollback-only'); return false;">Rollback-Only</a>
          <a href="#spring-q2-kafka-event-published-before-db-commit" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q2-kafka-event-published-before-db-commit'); return false;">Kafka Dual-Write</a>
          <a href="#spring-q3-async-loses-security-context-tenant" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q3-async-loses-security-context-tenant'); return false;">Async Context</a>
          <a href="#spring-q4-high-concurrency-deadlocks-jpa" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q4-high-concurrency-deadlocks-jpa'); return false;">Deadlocks JPA</a>
          <a href="#spring-q5-lazyinitializationexception-osiv-false" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q5-lazyinitializationexception-osiv-false'); return false;">LazyInit Fix</a>
          <a href="#spring-q7-security-filter-exception-bypasses-controller-advice" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q7-security-filter-exception-bypasses-controller-advice'); return false;">Filter Error</a>
          <a href="#spring-q8-hibernate-batch-insert-memory-leak-first-level-cache" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q8-hibernate-batch-insert-memory-leak-first-level-cache'); return false;">Batch Flush</a>
          <a href="#spring-q9-optimistic-locking-collision-storms" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q9-optimistic-locking-collision-storms'); return false;">Optimistic Storm</a>
          <a href="#spring-q10-generationtype-identity-disables-jdbc-batching" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q10-generationtype-identity-disables-jdbc-batching'); return false;">IDENTITY Batch</a>
          <a href="#spring-q11-checked-exception-transaction-rollback-trap" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q11-checked-exception-transaction-rollback-trap'); return false;">Checked Ex Trap</a>
          <a href="#spring-q15-shedlock-distributed-scheduled-tasks" class="compact-mini-pill" onclick="app.navigateToTopic('spring', 'spring-q15-shedlock-distributed-scheduled-tasks'); return false;">ShedLock</a>
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
          <span>⚡ DSA & Systems</span>
          <span class="badge-count">${dsaTopics.length}</span>
        </button>
        <div class="compact-pills-row">
          <a href="#lru-cache-implementation" class="compact-mini-pill" onclick="app.navigateToTopic('dsa', 'lru-cache-implementation'); return false;">LRU Cache</a>
          <a href="#sliding-window-rate-limiter" class="compact-mini-pill" onclick="app.navigateToTopic('dsa', 'sliding-window-rate-limiter'); return false;">Rate Limiter</a>
          <a href="#monotonic-stack-queue" class="compact-mini-pill" onclick="app.navigateToTopic('dsa', 'monotonic-stack-queue'); return false;">Monotonic</a>
          <a href="#tree-graph-toposort-unionfind" class="compact-mini-pill" onclick="app.navigateToTopic('dsa', 'tree-graph-toposort-unionfind'); return false;">Union-Find</a>
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

  // -------------------------------------------------------------
  // Expandable Topic Cards Rendering (Java, Spring, DSA)
  // -------------------------------------------------------------
  renderJavaTopics() {
    const container = document.getElementById('java-cards-container');
    if (!container) return;
    const topics = window.REVISION_APP_DATA?.JAVA_TOPICS || [];
    container.innerHTML = this.renderTopicCardsHtml(topics, 'border-java');
  }

  renderSpringTopics(filterCategory = 'all') {
    const container = document.getElementById('spring-cards-container');
    if (!container) return;

    const archTopics = window.REVISION_APP_DATA?.SPRING_TOPICS || [];
    const scenarioQs = (window.REVISION_APP_DATA?.SPRING_QUESTIONS || []).map(q => this.formatQuestionAsTopic(q, 'Spring Scenario'));

    let list = [];
    if (filterCategory === 'architecture') {
      list = archTopics;
    } else if (filterCategory === 'scenarios' || filterCategory === 'questions') {
      list = scenarioQs;
    } else {
      list = [...archTopics, ...scenarioQs];
    }

    container.innerHTML = this.renderTopicCardsHtml(list, 'border-spring');
  }

  filterSpringCategory(cat) {
    const container = document.getElementById('section-spring');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event?.target?.classList.add('active');
    }
    this.renderSpringTopics(cat);
  }

  renderDsaTopics() {
    const container = document.getElementById('dsa-cards-container');
    if (!container) return;
    const topics = window.REVISION_APP_DATA?.DSA_TOPICS || [];
    container.innerHTML = this.renderTopicCardsHtml(topics, 'border-dsa');
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
      list = codingQs;
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
    if (q.problem) keyPoints.push(`🚨 Production Scenario: ${q.problem}`);
    if (q.innerWorking) keyPoints.push(`⚙️ Under the Hood / Inner Mechanics: ${q.innerWorking}`);
    if (Array.isArray(q.seniorAnswer)) {
      q.seniorAnswer.forEach(pt => keyPoints.push(`🎯 Staff-Level Resolution: ${pt}`));
    } else if (q.explanation) {
      keyPoints.push(`🎯 Senior Architectural Answer: ${q.explanation}`);
    }
    if (q.warStory) keyPoints.push(`🔥 Real Production War Story: ${q.warStory}`);

    return {
      id: q.id,
      title: q.title,
      category: q.category || defaultCategory,
      badge: q.difficulty || "Senior Scenario",
      oneLiner: q.summary || q.problem,
      summary: q.problem,
      keyPoints: keyPoints.length > 0 ? keyPoints : [
        `Scenario / Problem: ${q.problem}`,
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
                       (window.REVISION_APP_DATA?.STREAMS_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.STREAM_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.SPRING_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.SPRING_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.SQL_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.SQL_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.KAFKA_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.KAFKA_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.REACT_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.REACT_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.DEVOPS_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.DEVOPS_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.REDIS_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.REDIS_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.CONCURRENCY_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.CONCURRENCY_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.HLD_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.HLD_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.LLD_TOPICS?.length || 0) +
                       (window.REVISION_APP_DATA?.LLD_QUESTIONS?.length || 0) +
                       (window.REVISION_APP_DATA?.DSA_TOPICS?.length || 0) +
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

    // Java Core
    (window.REVISION_APP_DATA?.JAVA_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'java',
        title: t.title,
        category: 'Java Core',
        snippet: t.oneLiner || t.summary
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

    // DSA
    (window.REVISION_APP_DATA?.DSA_TOPICS || []).forEach(t => {
      this.searchIndex.push({
        id: t.id,
        section: 'dsa',
        title: t.title,
        category: 'DSA',
        snippet: t.oneLiner || t.summary
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
        this.closeMobileSidebar();
        this.mindmapViz?.closeDrawer();
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

    if (['mindmap', 'java', 'streams', 'spring', 'sql', 'kafka', 'react', 'devops', 'redis', 'concurrency', 'hld', 'lld', 'dsa', 'questions'].includes(hash)) {
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
