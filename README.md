# Senior & Staff Dev Revision Hub: Systems, Java, Concurrency, HLD, LLD & Full-Stack

A production-grade, ultra-fast, offline-friendly interview revision and mental-model platform built specifically for **Senior and Staff Engineers**.

---

## 🌟 Comprehensive Revision Modules

1. **🧠 Interactive Visual Mind Maps (1-Glance Mental Models)**
   - Visual node trees for **SOLID Principles**, **OOPs Internals**, **Java Memory Model & GC**, **Spring Bean Lifecycle**, **Kafka Core**, **React/Redux**, **DevOps & K8s**, **Redis**, **Java Concurrency**, **High-Level Design (HLD)**, **Low-Level Design (LLD)**, and **14 DSA Patterns**.
   - Zoom in/out, pan, and click on any node to view its invariant rule, real-world analogy, violation smell, and drop-in code solution.
   - Fast Glance revision cards for rapid recall 30 minutes before an interview.

2. **☕ Senior Core & Advanced Java**
   - JVM Memory Model (JMM), instruction reordering, `volatile` memory barriers (`mfence`/`sfence`), and Happens-Before rules.
   - AbstractQueuedSynchronizer (AQS) mechanics, non-fair vs fair locks, CAS, and CLH wait queue.
   - Java 21 Virtual Threads (Project Loom), OS carrier threads, continuation parking, and the `synchronized` pinning trap.
   - Generational GC (G1GC vs ZGC), Safepoints, Counted loop bias, and diagnosing `ThreadLocal` / Metaspace memory leaks.

3. **🌊 Java Streams & Functional Pipelines**
   - Stream lifecycle pipeline, lazy evaluation, short-circuiting operations.
   - Spliterators, custom Collectors, and Comparator composition.
   - 25 medium-to-hard Stream interview coding challenges.

4. **🌱 Spring Boot & Enterprise Architecture**
   - Transaction propagation (`REQUIRED`, `REQUIRES_NEW`, `NESTED`), self-invocation CGLIB proxy bypass, and rollback rules.
   - Auto-Configuration engine (`AutoConfiguration.imports`, `DeferredImportSelector`).
   - Circular Dependency resolution via the Three-Level Cache.
   - Hibernate dirty checking, N+1 query solutions (`@EntityGraph`, `JOIN FETCH`), and Open Session in View (OSIV) pitfalls.
   - Spring Security Filter Chain (`SecurityFilterChain`, `AuthenticationManager`, JWT filter order).
   - 15 Staff-level microservice scenario runbooks.

5. **🗄️ SQL Engine & Relational Databases**
   - MySQL InnoDB vs PostgreSQL MVCC architectures.
   - B+Tree vs LSM-Tree storage engines, Clustered vs Secondary indexes.
   - Deep dive into `EXPLAIN ANALYZE`, index selectivity, composite index left-prefix rule.
   - Isolation levels (Dirty Read, Non-Repeatable Read, Phantom Read) and Lock Escalation.
   - 20 complex SQL interview coding problems.

6. **⚡ Apache Kafka Distributed Streaming**
   - Partition log storage, zero-copy `sendfile()`, Page Cache, and OS segment roll mechanics.
   - Producer reliability: `acks=all`, `min.insync.replicas`, idempotent producer sequence IDs.
   - Consumer group rebalance protocols (Eager vs Incremental Cooperative Rebalance).
   - 20 Senior/Staff scenario runbooks (triage partition hot spots, poison pills, consumer lag).

7. **⚛️ React & Redux Enterprise Architecture**
   - Fiber Reconciler, singly-linked tree (`child`, `sibling`, `return`), and Double-Buffering engine.
   - Virtual DOM O(N) diffing heuristics and reconciliation bailouts.
   - Redux store internals, curried middleware, and Immer.js ES6 draft proxies.
   - 30 commonly asked React interview questions (Controlled forms, Portals, Rules of Hooks, `forwardRef`, `useId`, Virtualization, SSR hydration, React 19 Actions).

8. **☸️ Cloud Native & DevOps (K8s, Docker, CI/CD, Terraform, Helm)**
   - Kubernetes Control Plane (`etcd` Raft quorum, API Server, Kubelet).
   - Linux namespaces & cgroups, Docker OverlayFS copy-on-write storage.
   - Terraform core engine: Directed Acyclic Graph (DAG), state locking with DynamoDB.
   - Helm 3 three-way strategic merge patch and Release secrets.
   - 15 Senior/Staff DevOps scenario runbooks.

9. **🟥 Redis In-Memory Architecture & Caching**
   - Single-threaded Reactor pattern, epoll multiplexing, SDS & Skiplist data structures.
   - Persistence engines: RDB snapshots, AOF log rewrite, and Linux `fork()` Copy-on-Write (CoW).
   - Redis Cluster with 16,384 virtual hash slots, `-MOVED` / `-ASK` redirections.
   - 20 Staff-level caching scenario runbooks (Stampede, Penetration, Avalanche, Big Keys, Redlock).

10. **🧵 Java Multithreading & Modern Concurrency**
    - Hardware memory barriers (`StoreLoad`, `LoadLoad`, `StoreStore`) and CPU store buffers.
    - JVM HotSpot Lock Escalation: Mark Word bit transitions (Biased 01 -> Lightweight 00 -> Heavyweight 10).
    - AQS framework, `LockSupport.park()`, and `ThreadPoolExecutor` 32-bit `ctl` saturation policies.
    - 25 Senior/Staff tricky concurrency questions (DCL bytecode 1-3-2, False Sharing `@Contended`, ABA problem, Carrier Pinning).

11. **🏗️ High-Level System Design (HLD)**
    - The 45-Minute Interview Playbook: Scoping, back-of-the-envelope capacity estimation math.
    - Database Decision Matrix (SQL vs Document vs Wide-Column vs NewSQL).
    - Caching strategies, Asynchronous messaging, and CAP/PACELC distributed consensus.
    - 10 End-to-End System Designs: TinyURL, Rate Limiter, WhatsApp, Video Streaming, Uber, Twitter Feed, Flash Sale, Snowflake IDs, Dynamo KV, Web Crawler.

12. **📐 Low-Level Design & Machine Coding (LLD)**
    - The 60-90 Minute Machine Coding Playbook: Domain entity modeling, strategy interfaces, layered architecture.
    - GoF Design Pattern Decision Matrix: Strategy vs State, Factory vs Builder, Decorator, Chain of Responsibility.
    - Thread-safety mechanics and SOLID clean code execution.
    - 10 Runnable Machine Coding Implementations: Parking Lot, Elevator Fleet, Tic-Tac-Toe O(1), Splitwise, Snake & Ladder, BookMyShow, ATM Machine, Vending Machine, Async Log4j, In-Memory LRU Cache.

13. **⚡ DSA & System Patterns**
    - Big-O Complexity Matrix with CPU cache-line analysis.
    - Monotonic stacks/deques, Union-Find (Disjoint Set Union), Rate Limiters.

---

## 📂 Project Directory Structure

```text
prepwebsite/
├── index.html                   # Single-page application entry point with tab routing
├── README.md                    # Platform documentation & interview guide
├── .gitignore                   # Standard clean gitignore
├── css/
│   ├── styles.css               # Core design system, theme variables, cards, modal
│   └── mindmap.css              # Interactive node graph, visual tree, flashcards, drawer
└── js/
    ├── app.js                   # Application controller, routing, search index, progress
    ├── mindmap.js               # Interactive mind map visualizer (zoom, pan, inspect)
    └── data/
        ├── topics.js            # Section registry and metadata
        ├── mindmaps-data.js     # Visual mindmaps for all 12 modules
        ├── java-data.js         # Senior Java notes, JMM, AQS, Virtual Threads, GC
        ├── streams-data.js      # Stream pipeline & 25 coding questions
        ├── springboot-data.js   # Spring Boot proxies, autoconfig, transactions, JPA, security
        ├── sql-data.js          # B-Tree/LSM storage, EXPLAIN, locks, 20 coding questions
        ├── kafka-data.js        # Kafka architecture & 20 senior scenarios
        ├── react-data.js        # React 18/19 Fiber, Redux Toolkit & 30 interview questions
        ├── devops-data.js       # Kubernetes, Docker, Terraform, Helm & 15 scenarios
        ├── redis-data.js        # Redis reactor loop, 16k cluster slots, 20 cache scenarios
        ├── concurrency-data.js  # JMM fences, lock escalation, AQS, Loom, 25 tricky Qs
        ├── hld-data.js          # System Design framework, math, matrices & 10 full designs
        ├── lld-data.js          # Machine coding playbook, patterns & 10 complete models
        ├── dsa-data.js          # LRU, LFU, Rate Limiters, Monotonic stacks, Big-O
        └── questions-data.js    # Senior/Staff tricky interview questions with traps
```

---

## 🚀 How to Run

### Option 1: Direct File Open (Zero Dependencies)
Simply double-click `index.html` in your file explorer, or open it in any browser (Chrome, Edge, Firefox, Safari).
- Works 100% offline with zero external network calls or package installations required.

### Option 2: Local HTTP Server
```bash
python -m http.server 8085
```
Open [http://localhost:8085](http://localhost:8085) in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open global search modal |
| `ESC` | Close search modal, drawer, or creator dialog |
| Click Title / Header | Expand / Collapse tricky interview questions |
| `Copy` button | Copy any code snippet directly to clipboard |
