# Senior & Staff Dev Revision Hub: Systems, Java, Concurrency, HLD, LLD & Full-Stack

A production-grade, ultra-fast, offline-friendly interview revision and mental-model platform built specifically for **Senior and Staff Engineers**.

> **Deployment Status:** 🚀 **Ready for deploy** — 100% standalone zero-dependency static web application, ready for instant hosting on GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

---

## 🌟 Comprehensive Revision Modules

1. **🧠 Interactive Visual Mind Maps (1-Glance Mental Models)**
   - Visual node trees for **SOLID Principles**, **OOPs Internals**, **Java Memory Model & GC**, **Spring Bean Lifecycle**, **Kafka Core**, **React/Redux**, **DevOps & K8s**, **Redis**, **Java Concurrency**, **High-Level Design (HLD)**, **Low-Level Design (LLD)**, and **14 DSA Patterns**.
   - Zoom in/out, pan, and click on any node to view its invariant rule, real-world analogy, violation smell, and drop-in code solution.
   - Fast Glance revision cards for rapid recall 30 minutes before an interview.

2. **☕ Senior Core & Advanced Java**
   - **55 Core Engine Internal Working Deep Dives** with visual flow diagrams, "What is it exactly?" elevator pitches, under-the-hood HotSpot/bytecode mechanics, and senior staff traps:
     - *JVM Memory & Garbage Collection (6)*: JVM Memory Structure & Runtime Data Areas, Heap vs. Stack Memory, Garbage Collection Roots (GC Roots), Garbage Collection Algorithms, Generational Garbage Collection, GC Implementations (CMS, G1, ZGC)
     - *Class Loading & JIT Execution (8)*: Class Loading Mechanism, Parent-Delegation Model & Breaking Scenarios, Class Loading Stages (Loading, Linking, Initialization), Class Loaders Hierarchy & Custom Loaders, JIT Compilation & Tiered Compilation, JIT Deoptimization & Uncommon Traps, Escape Analysis & Scalar Replacement, Bytecode Execution & HotSpot Interpreter Loop
     - *Java Memory Model & Threads (7)*: Java Memory Model (JMM) Architecture, `volatile` Keyword & Hardware Memory Barriers, `synchronized` Keyword & Object Monitor Internals, Happens-Before Rules & Transitivity, Atomicity, Visibility & Ordering, Thread Lifecycle & OS Native States, Thread vs. Process (OS Scheduling & Memory Context)
     - *Advanced Concurrency & Synchronizers (10)*: Thread Stack Size & Xss Memory Sizing, ConcurrentHashMap Internals (Java 8+ CAS + Synchronized), CompletableFuture Internals & Completion Stages, ThreadPoolExecutor Internals & Rejection Policies, AbstractQueuedSynchronizer (AQS) Mechanics, Intrinsic vs. Explicit Locks (Synchronized vs ReentrantLock), Deadlock Detection & Avoidance Strategies, CAS (Compare-And-Swap) Hardware Primitives, ABA Problem & AtomicStampedReference, Java 21 Virtual Threads & Loom Continuation Engine
     - *Collections Framework Internals (9)*: ArrayList Internals & Growth Factor, LinkedList Internals & Cache Locality Tradeoffs, HashMap Internals (Hashing, Resizing & Treeification), HashSet Internals & Dummy Value Mapping, Fail-Fast vs. Fail-Safe Iterators, CopyOnWriteArrayList Internals, PriorityQueue Internals (Binary Min-Heap), ArrayDeque Internals (Circular Array Buffer), Comparable vs. Comparator Internals & TimSort
     - *Strings & Object Semantics (9)*: String Immutability & Compact Strings, String Constant Pool (SCP) Internals, `String.intern()` Engine Mechanics, `equals()` and `hashCode()` Contract & Violations, Object Creation Internals (Allocation to Initialization), Reflection API Internals & Inflation Mechanics, Annotation Processing & Runtime Retention, Generics and Type Erasure (Bridge Methods), `final` Keyword Semantics & JMM Freezing
     - *I/O, NIO & Serialization (6)*: Java Classic I/O (BIO) vs. Java NIO, NIO Channel, Buffer & Selector Multiplexing Model, Java Serialization Internals, `serialVersionUID` Evolution & Incompatible Changes, `transient` Keyword & Custom Serialization Protocols, `Externalizable` vs. `Serializable` Performance
   - 460 Senior & Staff tricky interview questions across 46 individual subtopics (10 tricky questions each) covering OOP, Strings & Exceptions, Collections Framework, Multithreading & Concurrency, Java 8+ / Virtual Threads, JVM Memory & Internals, and Tricky Edge Traps.
   - Interactive UX: Inline expandable cards + Full-Screen Deep Dive Modal with sequential keyboard navigation (`←`/`→`), category filter toolbar, and instant search filter.

3. **🌊 Java Streams & Functional Pipelines**
   - Stream lifecycle pipeline, lazy evaluation, short-circuiting operations.
   - Spliterators, custom Collectors, and Comparator composition.
   - 25 medium-to-hard Stream interview coding challenges.

4. **🌱 Spring Boot & Enterprise Architecture**
   - **29 Engine Internal Working Deep Dives** with visual flow diagrams, "What is it exactly?" elevator pitches, under-the-hood execution mechanics, and senior staff traps:
     1. `@SpringBootApplication` Composition & Meta-Annotations
     2. `Auto-Configuration` Internal Engine & Evaluation Order
     3. `META-INF/spring.factories` vs `AutoConfiguration.imports`
     4. `Conditional Annotations` Mechanics (`@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`)
     5. `Starter Dependencies` Architecture & Transitive Resolution
     6. `Spring Boot BOM` & Dependency Management Internals
     7. `SpringApplication.run()` 12-Step Execution Pipeline
     8. `ApplicationContext` Creation & The 12-Step `refresh()` Method
     9. `Embedded Web Server Startup` (Tomcat / Jetty / Undertow)
     10. `ApplicationRunner` vs `CommandLineRunner` Execution Mechanics
     11. `Spring Boot Event & Listener` Internal Multicaster
     12. `Spring Bean Complete Lifecycle` (10 Distinct Stages)
     13. `Circular Dependency Resolution` & The Three-Level Cache
     14. `@Configuration` (Full) vs `@Component` (Lite) CGLIB Proxying
     15. `@Transactional Proxy` Mechanics & The Self-Invocation Trap
     16. `Component Scanning` Internals (ASM TypeFilters & Indexing)
     17. `Externalized Configuration` & The 17-Level Priority Order
     18. `Spring Profiles` Internal Activation & Multi-Document YAML
     19. `Spring Boot Actuator` Architecture & Endpoint Discovery
     20. `Spring Boot DevTools` ClassLoader Isolation & LiveReload
     21. `Spring Boot Logging System` & Logback Pre-Initialization
     22. `Exception Handling Architecture` (`@ControllerAdvice` vs `ErrorController`)
     23. `Spring MVC Request Flow` & `DispatcherServlet` Internals
     24. `Embedded Server Advanced Configuration` & Thread Pools
     25. `Auto-Configuration Back-off` & Graceful Surrender Mechanics
     26. `BeanPostProcessor` Internal Interception & Extension Points
     27. `Spring Environment Abstraction` & `MutablePropertySources`
     28. `@ConfigurationProperties` & `ConfigurationPropertiesBindingPostProcessor`
     29. `Spring Boot Test Slices` (`@SpringBootTest` vs Test Slices)
   - Interactive UX: Inline expandable cards + Full-Screen Deep Dive Modal with sequential keyboard navigation (`←`/`→`) and instant search.
   - Transaction propagation (`REQUIRED`, `REQUIRES_NEW`, `NESTED`), self-invocation CGLIB proxy bypass, and rollback rules.
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

13. **⚡ DSA & System Patterns (Problem Finding Master Blueprints)**
    - **3-Step Senior Interview Strategy**: Classify by Trigger Keywords ➔ Bound by Input Constraint N ➔ Formulate Brute Force then Eliminate Bottleneck.
    - Input Constraint ($N$) to Big-O Decision Matrix & Keyword Signal Decision Table.
    - 30 Comprehensive Topics: 25 Core Algorithmic Patterns (Two Pointers, Sliding Window, Monotonic Stack, Dijkstra, Bitmask DP, Segment Tree, etc.) and 5 Production System Data Structures (LRU, LFU, Token Bucket, Monotonic Deque, Graph/DSU).

14. **☁️ Amazon Web Services (AWS) Architecture & IAM Mastery**
    - **Under-the-Hood Engine Mechanics & IAM Blueprints** for the top 9 enterprise services:
      1. `aws-iam`: **AWS IAM & Role Architecture** (STS AssumeRole, Trust Policies, EC2 Instance Profiles, EKS IRSA with OIDC Federation, Least Privilege).
      2. `aws-ec2`: **Amazon EC2 & Auto Scaling** (Nitro hardware offload, IMDSv2 anti-SSRF security, gp3 EBS NVMe, Multi-AZ ASG target tracking).
      3. `aws-s3`: **Amazon S3 Object Storage** (Strong read-after-write consistency, S3 Presigned URLs for zero-backend offloading, Glacier lifecycle, Multipart upload).
      4. `aws-rds`: **Amazon RDS & Aurora** (Aurora 'The Log is the Database' 6-way storage quorum across 3 AZs, sub-10ms read replicas, IAM Database Authentication).
      5. `aws-dynamodb`: **Amazon DynamoDB** (O(1) MD5 partition hashing, Single-Table Design, GSI projection, 24-hr Change Data Capture Streams, ACID transactions).
      6. `aws-lambda`: **AWS Lambda & SnapStart** (Firecracker microVM isolation, Java 17+ CRaC memory snapshot restore in ~150ms, Event Source Mapping).
      7. `aws-eks`: **Amazon EKS & Cloud-Native Networking** (High-availability managed control plane, VPC CNI secondary ENI pod IPs, Karpenter JIT autoscaling, IRSA pod security).
      8. `aws-sqs-sns`: **Amazon SQS & SNS Messaging** (Pub/Sub fan-out architecture, visibility timeout heartbeats, FIFO deduplication, Dead Letter Queues).
      9. `aws-api-gateway`: **Amazon API Gateway** (REST vs HTTP APIs, Token Bucket rate limiting, Cognito JWT authorizers, VPC Link to private microservices).
    - Interactive UX: Category filter toolbar, dropdown quick selector, search filter, and Full-Screen Deep Dive Modal with visual flows and Java SDK v2 code snippets.

15. **🌐 Google Cloud Platform (GCP) Architecture & IAM Mastery**
    - **Under-the-Hood Engine Mechanics & IAM Blueprints** for the top 9 enterprise services:
      1. `gcp-iam`: **Google Cloud IAM & Workload Identity Federation** (Resource Hierarchy, GKE Workload Identity keyless KSA-to-GSA mapping, Workload Identity Federation for GitHub Actions, Impersonation).
      2. `gcp-gce`: **Google Compute Engine (GCE)** (Live Migration with zero downtime/reboot during maintenance, Regional MIGs, Regional Persistent Disks, Cloud NAT).
      3. `gcp-gcs`: **Google Cloud Storage (GCS)** (Colossus distributed file system, strong global consistency, Uniform Bucket-Level Access, GCS V4 Signed URLs).
      4. `gcp-cloud-sql`: **Cloud SQL & Cloud Spanner** (Cloud SQL regional HA failover; Cloud Spanner globally distributed ACID serializability powered by TrueTime GPS & atomic clocks).
      5. `gcp-gke`: **Google Kubernetes Engine (GKE)** (GKE Autopilot hands-off node management, VPC-native Alias IP networking, Dataplane V2 eBPF, Gateway API).
      6. `gcp-cloud-run`: **Google Cloud Run** (Serverless containers on Knative & gVisor sandboxing, multi-concurrency up to 250 req/instance, scale-to-zero, OIDC service-to-service auth).
      7. `gcp-pubsub`: **Cloud Pub/Sub** (Globally distributed streaming, Push vs Pull gRPC streaming, Exactly-Once Delivery, Ordering Keys, Direct BigQuery subscriptions).
      8. `gcp-bigquery`: **Google BigQuery** (Serverless analytics warehouse, Dremel multi-tier tree execution across slots, Capacitor columnar storage, Partitioning & Clustering block pruning).
      9. `gcp-apigee`: **Apigee API Management** (Enterprise API proxy pipeline, SpikeArrest micro-burst leveling, Quotas, JSONThreatProtection, Developer Portal).
    - Interactive UX: Category filter toolbar, dropdown quick selector, search filter, and Full-Screen Deep Dive Modal with visual flows and Google Cloud Client Library code snippets.

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
        ├── dsa-data.js          # 30 DSA topics, 3-step strategy, Big-O table, Decision Matrix
        ├── aws-data.js          # 9 AWS Core Services & IAM Role Architecture
        ├── gcp-data.js          # 9 GCP Core Services & Workload Identity Architecture
        ├── java-patterns-data.js # 24 Gang of Four & Modern Java Design Patterns
        ├── microservices-patterns-data.js # 25 Microservices Distributed Architecture Patterns
        ├── lifecycle-data.js    # 12-stage Spring Boot to GCP delivery lifecycle
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
