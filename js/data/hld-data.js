/**
 * hld-data.js
 * High-Level System Design (HLD) Architecture, Decision Matrices & Classic Problems.
 * Tailored for Senior/Staff Engineering Interview Preparation.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

// =========================================================================
// 1. HLD Architecture, Decision Matrices & Interview Frameworks
// =========================================================================
window.REVISION_APP_DATA.HLD_TOPICS = [
  {
    id: "hld-interview-roadmap-and-clarification-framework",
    title: "The 45-Minute HLD Interview Playbook: Clarification, Math & Framework",
    category: "HLD Framework",
    badge: "Staff-Level Playbook",
    oneLiner: "Structured 5-phase roadmap for pacing a 45-minute system design round: scoping, back-of-the-envelope estimation, high-level architecture, deep dive bottlenecks, and resilience.",
    summary: "System design interviews evaluate ambiguity resolution, trade-off analysis, and breadth of architectural knowledge. A senior candidate does not jump immediately into drawing boxes. Instead, they drive the conversation like a Tech Lead through a structured 5-phase playbook.",
    keyPoints: [
      "Phase 1 (0-5 min) - Scoping & Clarification: Explicitly separate Functional Requirements (3-4 core user actions) from Non-Functional Requirements (Latency SLAs, Availability 99.99%, Read/Write ratio, Consistency model, Geographic distribution).",
      "Phase 2 (5-10 min) - Back-of-the-Envelope Estimation: Calculate QPS (DAU * queries / 86400), Peak QPS (2-3x average), Daily & 5-Year Storage (QPS * payload * 86400 * 365 * 5), Network Bandwidth (ingress/egress MB/s), and Memory Cache Sizing (80/20 Pareto rule: cache 20% of daily reads).",
      "Phase 3 (10-15 min) - High-Level Block Diagram: Define API contracts (REST/gRPC/GraphQL) and lay out client -> DNS/CDN -> Load Balancer -> API Gateway -> Stateless Microservices -> Database & Cache Tier.",
      "Phase 4 (15-35 min) - Deep Dive into Critical Paths: Address database sharding, consistency anomalies, replication lag, race conditions, cache stampede, and message queue consumer lag.",
      "Phase 5 (35-45 min) - Resilience, Security & Observability: Discuss Circuit Breakers (Resilience4j), Rate Limiting (Token Bucket), Disaster Recovery (Multi-region active-active/active-passive), and Metrics/Logs/Distributed Tracing (OpenTelemetry)."
    ],
    codeSnippet: `// =========================================================================
// BACK-OF-THE-ENVELOPE ESTIMATION CHEATSHEET FOR SYSTEM DESIGN
// =========================================================================

/*
 1. Numbers Everyone Must Memorize:
    - 1 Day = 86,400 seconds ≈ 100,000 (10^5) seconds for fast mental math
    - 1 Million requests/day ≈ 12 QPS (10^6 / 86,400)
    - 100 Million requests/day ≈ 1,160 QPS (≈ 1,200 QPS)
    - 1 Billion requests/day ≈ 11,600 QPS (≈ 12,000 QPS)
    - Peak QPS = 2x to 3x Average QPS

 2. Storage Math:
    - 1 Byte = 8 bits
    - 1 KB = 10^3 Bytes (1,000)
    - 1 MB = 10^6 Bytes (1,000,000)
    - 1 GB = 10^9 Bytes
    - 1 TB = 10^12 Bytes
    - 1 PB = 10^15 Bytes
    - Example: 100M writes/day * 500 Bytes = 50 GB/day -> 18.25 TB/year -> ~90 TB in 5 years.

 3. Latency Comparison Numbers (Jeff Dean):
    - L1 cache reference:       0.5 ns
    - Branch mispredict:        5   ns
    - L2 cache reference:       7   ns
    - Mutex lock/unlock:       25   ns
    - Main memory reference:  100   ns
    - Compress 1KB with Snappy: 2,000 ns (2 µs)
    - Send 2KB over 1Gbps net:  20,000 ns (20 µs)
    - SSD random read:        150,000 ns (150 µs)
    - Read 1MB sequentially RAM: 250,000 ns (250 µs)
    - Round trip within datacenter: 500,000 ns (0.5 ms)
    - Disk seek (spinning HDD): 10,000,000 ns (10 ms)
    - Read 1MB sequentially disk: 20,000,000 ns (20 ms)
    - Packet round-trip CA to Netherlands: 150,000,000 ns (150 ms)
*/`,
    pitfall: "Junior trap: Asking 'What tech stack do you prefer?' or immediately jumping to drawing microservices and Kafka before understanding whether write volume is 100 QPS or 1,000,000 QPS.",
    interviewTip: "Proactively propose trade-offs rather than waiting to be prompted: 'Since this is a financial ledger, we will sacrifice availability for strong consistency (CP). For social timeline updates, we will favor high availability with eventual consistency (AP) using read-your-writes guarantees.'",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⏱️ The 45-Minute Senior HLD Interview Pacing Roadmap</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue">
            <span class="node-label">00 - 05 min</span>
            <small style="display:block;font-size:0.7rem;color:var(--text-muted);">Clarification &amp; FR/NFR Scoping</small>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">05 - 10 min</span>
            <small style="display:block;font-size:0.7rem;color:var(--text-muted);">Capacity &amp; QPS Math</small>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">10 - 20 min</span>
            <small style="display:block;font-size:0.7rem;color:var(--text-muted);">High-Level Diagram &amp; APIs</small>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">20 - 35 min</span>
            <small style="display:block;font-size:0.7rem;color:var(--text-muted);">Deep Dive Bottlenecks</small>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink">
            <span class="node-label">35 - 45 min</span>
            <small style="display:block;font-size:0.7rem;color:var(--text-muted);">Resilience &amp; Observability</small>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "hld-storage-decision-matrix-sql-vs-nosql-vs-newsql",
    title: "Database Decision Matrix: SQL vs NoSQL vs NewSQL vs Time-Series vs Graph",
    category: "Storage Architecture",
    badge: "Decision Matrix",
    oneLiner: "Comprehensive selection guide for choosing storage engines based on access patterns, data relationships, transaction semantics, and write/read scale.",
    summary: "A senior architect selects databases strictly based on data structure, query access patterns, volume, and consistency requirements. This matrix guides the exact trade-offs to present to interviewers.",
    keyPoints: [
      "Relational (RDBMS - PostgreSQL, MySQL): Best for structured relational schemas, multi-table JOINs, strong ACID transactions, and compliance (e.g., Banking, Orders, Inventory). Bottleneck: Vertical write scaling; horizontal sharding requires complex application logic.",
      "Document Stores (MongoDB, Couchbase): Best for hierarchical, semi-structured JSON objects with dynamic schemas (e.g., Product Catalogs, User Profiles). Supports secondary indexes, but cross-document multi-collection transactions carry performance overhead.",
      "Wide-Column Distributed (Cassandra, ScyllaDB): Best for massive write-heavy timeseries/append-only workloads (e.g., IoT telemetry, Chat history, Activity logs, Metrics). LSM-Tree engine enables millions of writes/sec; queries MUST be modeled strictly around the partition key (no JOINs, no secondary index scans).",
      "Key-Value Stores (Redis, AWS DynamoDB): Best for single-digit millisecond point lookups by primary key (e.g., Session stores, Caching, Shopping Carts, Leaderboards). In-memory or distributed hash ring.",
      "NewSQL (Google Spanner, CockroachDB): Best when you need global horizontal scale with full distributed ACID transactions. Uses Raft/Paxos consensus and atomic TrueTime API (GPS + Atomic clocks) to avoid distributed 2PC locking bottlenecks.",
      "Time-Series (TimescaleDB, InfluxDB): Optimized for timestamped metric streams, automated retention policies, and time-bucket aggregations (e.g., Server monitoring, Financial stock ticks).",
      "Graph Databases (Neo4j, AWS Neptune): Optimized for index-free adjacency graph traversals across dense relationships (e.g., Social graphs, Fraud rings, Recommendation networks)."
    ],
    codeSnippet: `// =========================================================================
// DATABASE SELECTION DECISION MATRIX
// =========================================================================

/*
 +------------------+---------------------+-----------------------+----------------------------------+
 | Database Family  | Primary Examples    | Optimal Workloads     | Key Constraints & Trade-Offs    |
 +------------------+---------------------+-----------------------+----------------------------------+
 | Relational RDBMS | PostgreSQL, MySQL   | ACID, Financial ledger| Write scaling limited to 1 node; |
 |                  |                     | Complex relational    | sharding adds operational burden |
 +------------------+---------------------+-----------------------+----------------------------------+
 | Wide-Column      | Cassandra, ScyllaDB | Heavy append writes,  | Query strictly by Partition Key; |
 | (LSM-Tree)       |                     | Chat logs, Telemetry  | No JOINs, no ad-hoc filters      |
 +------------------+---------------------+-----------------------+----------------------------------+
 | Document Store   | MongoDB, Couchbase  | Dynamic JSON schemas, | Cross-document ACID transactions |
 |                  |                     | Product catalogs      | are slow; memory-heavy indexes   |
 +------------------+---------------------+-----------------------+----------------------------------+
 | Key-Value        | Redis, DynamoDB     | Microsecond lookups,  | Simple query patterns (Get/Put); |
 |                  |                     | Sessions, Rate limits | Limited aggregation capability   |
 +------------------+---------------------+-----------------------+----------------------------------+
 | NewSQL           | CockroachDB,        | Global ACID scale,    | Higher write latency due to Paxos|
 |                  | Google Spanner      | Distributed banking   | consensus roundtrips             |
 +------------------+---------------------+-----------------------+----------------------------------+
 | Graph            | Neo4j, AWS Neptune  | Social connections,   | Hard to partition across shards; |
 |                  |                     | Fraud ring detection  | slow for non-traversal queries   |
 +------------------+---------------------+-----------------------+----------------------------------+
*/`,
    pitfall: "Interview Trap: Selecting Cassandra for an e-commerce checkout database because 'it scales infinitely', ignoring that financial order processing requires cross-table ACID transactions and constraints.",
    interviewTip: "Always formulate your decision as: 'Given our requirement for [Access Pattern X] and [Volume Y], I choose [Engine Z] because its underlying storage engine ([B-Tree vs LSM-Tree]) aligns perfectly with our read-to-write ratio.'",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🗄️ Storage Engine Decision Tree</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">ACID &amp; Relational?</span><small>PostgreSQL / MySQL</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Massive Append Writes?</span><small>Cassandra / ScyllaDB</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Sub-ms Key Lookup?</span><small>Redis / DynamoDB</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Global Distributed ACID?</span><small>CockroachDB / Spanner</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-caching-and-edge-tier-decisions",
    title: "Caching Strategies & Edge Tier: Patterns, Invalidation & Hazards",
    category: "Caching Architecture",
    badge: "Staff-Level Invariants",
    oneLiner: "Deep dive into Cache-Aside, Write-Through, Write-Behind, Refresh-Ahead patterns, cache consistency via CDC/Debezium, and mitigating Stampede, Penetration & Breakdown.",
    summary: "Caching is the primary mechanism for reducing database load and delivering single-digit millisecond read latencies. Choosing the wrong cache write strategy or failing to protect against thundering herds can cause cascading database collapses in high-traffic systems.",
    keyPoints: [
      "Cache-Aside (Lazy Loading): Application reads from cache; if miss, reads from DB, populates cache, returns data. Writes go to DB, then cache key is deleted (NOT updated, to prevent race conditions). Pros: Cache only holds requested data. Cons: Cache miss penalty on first request.",
      "Write-Through: Application writes to cache; cache synchronously writes to DB before returning success. Pros: Consistency guaranteed, cache never stale. Cons: Higher write latency as two systems are updated synchronously.",
      "Write-Behind (Write-Back): Application writes to cache; cache immediately returns success and asynchronously batches writes to DB. Pros: Insane write throughput, amortized I/O. Cons: Data loss if cache node crashes before flushing to durable DB.",
      "Cache Invalidation via CDC (Change Data Capture): In high-scale systems, application code does not invalidate cache. Instead, database binlog events are captured via Debezium and published to Kafka, where a cache-invalidator service evicts keys asynchronously.",
      "Cache Stampede (Thundering Herd): Thousands of concurrent requests hit the DB simultaneously when a hot key expires. Solution: Mutex lock on cache miss (only 1 thread queries DB; others wait), or Probabilistic Early Expiration (XFetch algorithm).",
      "Cache Penetration: Requests for non-existent keys bypass cache and hammer DB. Solution: Bloom filter at Gateway tier to reject non-existent IDs, or cache null values with a short TTL (30s).",
      "Cache Avalanche: Hundreds of thousands of keys expire at the exact same second. Solution: Add random jitter to TTLs (e.g., base TTL 3600s + rand(0, 300s))."
    ],
    codeSnippet: `// =========================================================================
// CACHE-ASIDE WITH MUTEX LOCK (PREVENTING THUNDERING HERD / BREAKDOWN)
// =========================================================================

public UserProfile getUserProfile(String userId) {
    String cacheKey = "user:" + userId;
    String cached = redis.get(cacheKey);
    if (cached != null) {
        return deserialize(cached);
    }

    // Cache Miss: Acquire distributed lock to ensure only 1 thread queries DB
    String lockKey = "lock:" + cacheKey;
    String lockToken = UUID.randomUUID().toString();
    boolean acquired = redis.set(lockKey, lockToken, "NX", "PX", 3000); // 3 sec TTL

    if (acquired) {
        try {
            UserProfile profile = database.findUserById(userId);
            if (profile != null) {
                // Add random jitter to prevent Cache Avalanche
                long jitterSeconds = ThreadLocalRandom.current().nextLong(300);
                redis.set(cacheKey, serialize(profile), "EX", 3600 + jitterSeconds);
            } else {
                // Prevent Cache Penetration: Cache null with short TTL
                redis.set(cacheKey, "EMPTY", "EX", 60);
            }
            return profile;
        } finally {
            // Atomic lock release via Lua script
            releaseLock(lockKey, lockToken);
        }
    } else {
        // Another thread is loading DB; sleep briefly and re-read cache
        try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return getUserProfile(userId); // Retry read from cache
    }
}`,
    pitfall: "Junior trap: Updating the cache directly on DB write (`redis.set(k, v)`). In concurrent systems, Thread 1 writes DB, Thread 2 writes DB, Thread 2 updates Cache, Thread 1 updates Cache -> Cache is now permanently out of sync with DB! Always DELETE the cache key on DB update.",
    interviewTip: "When asked how to scale read-heavy systems, start with CDN edge caching (Cloudflare/CloudFront) for static assets and public responses, followed by application-level Redis caching, read replicas with connection pooling (HikariCP), and DB query optimization.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚡ Caching Failure Modes &amp; Solutions</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-pink"><span class="node-label">Penetration (Fake Keys)</span><small>Bloom Filter + Null TTL</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Avalanche (Mass Expiry)</span><small>Random TTL Jitter</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Stampede (Hot Key Miss)</span><small>Distributed Mutex / XFetch</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-messaging-and-async-processing",
    title: "Asynchronous Pipelines & Event Streaming: Kafka vs RabbitMQ vs SQS",
    category: "Messaging Architecture",
    badge: "Decision Matrix",
    oneLiner: "Selection criteria for message brokers, guarantees (At-Least-Once, Exactly-Once), Transactional Outbox pattern, and handling consumer lag.",
    summary: "Asynchronous messaging decouples distributed microservices, absorbs traffic spikes (load leveling), and enables event-driven architectures. Choosing between an append-only distributed commit log (Kafka) and a smart broker (RabbitMQ/SQS) is a fundamental senior interview decision.",
    keyPoints: [
      "Kafka (Distributed Commit Log): Best for high-throughput stream processing, event sourcing, replayability, and pub/sub to multiple consumer groups. Pull-based model where consumers track their own offsets. Retention-based (messages kept after consumption).",
      "RabbitMQ (Smart Broker / AMQP): Best for complex routing (topic/direct/fanout exchanges), priority queues, and per-message acknowledgments with dead-lettering. Push-based model. Messages deleted immediately after consumer ACK.",
      "AWS SQS: Best for serverless, zero-maintenance task queues with automated scaling. SQS Standard offers nearly unlimited throughput with at-least-once delivery; SQS FIFO guarantees order up to 3,000 msgs/sec with message deduplication IDs.",
      "Dual-Write Problem: Updating the database and sending a Kafka message in the same method risks inconsistency if the app crashes between the DB commit and message send. Solution: Transactional Outbox Pattern.",
      "Transactional Outbox Pattern: Save the business entity AND an outbox record inside the SAME local database transaction. A separate Debezium CDC reader or poller reads the outbox table and publishes events reliably to Kafka.",
      "Idempotent Consumer: Because networks fail, message brokers guarantee At-Least-Once delivery, which means duplicate messages WILL arrive. Consumers MUST be idempotent using unique idempotency keys or database unique constraints (`INSERT INTO processed_events ... ON CONFLICT DO NOTHING`)."
    ],
    codeSnippet: `// =========================================================================
// TRANSACTIONAL OUTBOX PATTERN & IDEMPOTENT CONSUMER WORKFLOW
// =========================================================================

/*
 +-------------------------------------------------------------------------+
 | Step 1: Atomic Local Transaction                                        |
 |   BEGIN TRANSACTION;                                                    |
 |     INSERT INTO orders (id, user_id, amount) VALUES (101, 42, 99.99);   |
 |     INSERT INTO outbox_events (id, aggregate_id, event_type, payload)   |
 |       VALUES (gen_random_uuid(), '101', 'ORDER_CREATED', '{"amount":99.99}'); |
 |   COMMIT;                                                               |
 +-------------------------------------------------------------------------+
                                    │
                                    ▼ (Debezium CDC tailing WAL / Binlog)
 +-------------------------------------------------------------------------+
 | Step 2: Reliable Publisher to Kafka Topic 'order-events'                |
 |   Key: '101' -> Partition Hash -> Sent to Kafka Broker                  |
 +-------------------------------------------------------------------------+
                                    │
                                    ▼ (Network re-transmission creates duplicates)
 +-------------------------------------------------------------------------+
 | Step 3: Idempotent Payment Consumer                                     |
 |   BEGIN TRANSACTION;                                                    |
 |     -- Attempt to claim idempotency lock                                |
 |     INSERT INTO processed_messages (message_id) VALUES (event.getId()); |
 |     -- If unique constraint violation -> duplicate message, abort safely|
 |     processPayment(event.getPayload());                                 |
 |   COMMIT;                                                               |
 +-------------------------------------------------------------------------+
*/`,
    pitfall: "Junior trap: Assuming Kafka guarantees 'Exactly-Once Processing' end-to-end automatically. Kafka's idempotent producer and transactional API only guarantee exactly-once write to Kafka itself; end-to-end exactly-once REQUIRES idempotent consumers at the destination database.",
    interviewTip: "Mention the 'Compensating Transaction' pattern when discussing distributed microservice failures where two-phase commit (2PC) is rejected due to performance and coordinator lock-up risks.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📨 Transactional Outbox Pattern Architecture</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">App Service</span><small>Single ACID Tx</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">DB Outbox Table</span><small>WAL / Binlog</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Debezium CDC</span><small>Reliable Reader</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Kafka Cluster</span><small>Partition Log</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">Consumer</span><small>Idempotent DB Insert</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-consistency-consensus-cap-pacelc",
    title: "Distributed Consistency & Consensus: CAP, PACELC, 2PC vs Saga",
    category: "Distributed Systems",
    badge: "Core Architecture",
    oneLiner: "Mastering CAP & PACELC theorems, Strong vs Eventual consistency, Quorum math (R + W > N), Raft/Paxos consensus, and Saga orchestration vs choreography.",
    summary: "Distributed systems operate over unreliable networks where network partitions (netsplit) are inevitable. A senior architect must clearly articulate why consistency and availability trade off against each other, and how modern systems maintain consistency without blocking on distributed locks.",
    keyPoints: [
      "CAP Theorem: In the presence of a Network Partition (P), a distributed system MUST choose between Consistency (C - every read receives the most recent write or an error) and Availability (A - every non-failing node returns a response, but it may be stale).",
      "PACELC Theorem (Extends CAP): If there is a Partition (P), how does the system trade off Availability (A) and Consistency (C)? ELSE (E - normal operation), how does the system trade off Latency (L) and Consistency (C)? (e.g., DynamoDB is PA/EL: high availability during partition, low latency over strong consistency normally).",
      "Quorum Consistency Math: For a cluster with N replicas, where W is the write quorum (nodes that must ACK a write) and R is the read quorum: If R + W > N, you get Strong Consistency (at least one node in the read quorum contains the latest write). If R + W <= N, you have Eventual Consistency.",
      "Sloppy Quorum & Hinted Handoff: When primary replicas are unreachable, writes are accepted by temporary healthy nodes ('hinted handoff') and forwarded once primaries recover, prioritizing availability.",
      "2-Phase Commit (2PC): Heavyweight synchronous protocol (Prepare phase -> Commit phase) coordinated by a transaction manager. Major flaw: If coordinator crashes during commit phase, resource managers remain locked indefinitely (blocking protocol). Avoid in microservices.",
      "Saga Pattern: Long-running business transaction split into local transactions. If Step 3 fails, the system executes compensating transactions (undo actions) in reverse order for Step 2 and Step 1. Implemented via Orchestration (central workflow coordinator) or Choreography (event-driven)."
    ],
    codeSnippet: `// =========================================================================
// SAGA ORCHESTRATION VS CHOREOGRAPHY COMPARISON
// =========================================================================

/*
 1. SAGA ORCHESTRATION (Best for complex multi-step workflows):
    [Order Orchestrator]
          │ 1. Create Pending Order
          ├──► [Order Service] -> OK
          │ 2. Authorize Payment
          ├──► [Payment Service] -> OK
          │ 3. Reserve Stock
          ├──► [Inventory Service] -> FAIL (Out of Stock!)
          │ 4. Compensating Action: Refund
          ├──► [Payment Service] -> Refund Issued!
          │ 5. Compensating Action: Cancel Order
          └──► [Order Service] -> Order Status = CANCELLED

 2. SAGA CHOREOGRAPHY (Best for simple 2-3 step workflows):
    [Order Service] ──(OrderCreatedEvent)──► [Payment Service]
                                                   │
                         (PaymentFailedEvent) ◄────┘
                                   │
                                   ▼
                            [Order Service] ──► Cancel Order Locally
*/`,
    pitfall: "Junior trap: Claiming 'Our system is CA (Consistent and Available)' in a distributed cloud architecture. In real-world networks, partitions WILL occur (fiber cuts, router reboots, GC pauses), so P is mandatory; you can only choose CP or AP.",
    interviewTip: "Whenever an interviewer asks how to handle distributed transactions across microservices, immediately reject 2PC due to latency and single-point-of-failure risks, and explain the Saga Pattern with compensating actions.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚖️ CAP vs PACELC Distributed Trade-Offs</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">CP System</span><small>HBase, Spanner, ZK</small></div>
          <span class="flow-arrow-separator">◄──►</span>
          <div class="flow-step-node node-green"><span class="node-label">AP System</span><small>Cassandra, DynamoDB, Couchbase</small></div>
          <span class="flow-arrow-separator">◄──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Saga Pattern</span><small>Compensating Rollbacks</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-rate-limiting-and-gateway-patterns",
    title: "Traffic Shaping & Gateway Architecture: Rate Limiters, L4/L7 LB & Circuit Breakers",
    category: "Traffic Shaping",
    badge: "Edge Architecture",
    oneLiner: "Algorithmic comparison of Token Bucket, Leaky Bucket, Sliding Window Counter, L4 vs L7 load balancing, and Circuit Breaker state transitions.",
    summary: "API Gateways serve as the front door of enterprise systems, handling TLS termination, authentication, load balancing, rate limiting, and circuit breaking to prevent cascading microservice outages.",
    keyPoints: [
      "Token Bucket: Tokens added to bucket at constant rate up to capacity. Each request consumes 1 token. Pros: Allows bursts of traffic up to bucket capacity while enforcing average rate. Used by AWS API Gateway and Guava RateLimiter.",
      "Leaky Bucket: Requests enter FIFO queue and leak out at a strictly fixed constant rate. Pros: Perfectly smooth egress traffic without bursts. Cons: Drops bursts if bucket is full even if downstream services have idle capacity.",
      "Sliding Window Counter: Combines fixed window memory efficiency with sliding log precision. Calculates: Requests in Current Window + Requests in Previous Window * (1 - Elapsed Time %). Best balance of precision and low memory footprint in Redis.",
      "L4 vs L7 Load Balancing: L4 (Transport Layer - TCP/UDP, IP, Port) routes packets without inspecting payload; extremely high throughput, low CPU (e.g., AWS NLB, HAProxy TCP mode). L7 (Application Layer - HTTP headers, cookies, URL path) parses HTTP requests to make intelligent routing decisions (e.g., AWS ALB, NGINX, Envoy).",
      "Circuit Breaker Pattern (Resilience4j): Protects callers from failing dependencies. States: CLOSED (normal traffic) -> OPEN (fail rate exceeds threshold e.g. 50%, immediately throws CallNotPermittedException without calling downstream) -> HALF-OPEN (after sleep window, lets limited probe calls through to test recovery)."
    ],
    codeSnippet: `// =========================================================================
// SLIDING WINDOW COUNTER IN REDIS VIA LUA SCRIPT (ATOMIC & BURST-SAFE)
// =========================================================================

/*
 Lua script for atomic sliding window rate limiter:
 KEYS[1]: Rate limit key (e.g., "rate:user_101")
 ARGV[1]: Current timestamp in milliseconds
 ARGV[2]: Window size in milliseconds (e.g., 60,000 for 1 minute)
 ARGV[3]: Maximum allowed requests within window (e.g., 100)
*/
String luaScript = 
    "local key = KEYS[1] " +
    "local now = tonumber(ARGV[1]) " +
    "local window = tonumber(ARGV[2]) " +
    "local limit = tonumber(ARGV[3]) " +
    "local clearBefore = now - window " +
    // 1. Remove timestamps older than current window
    "redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore) " +
    // 2. Count current elements in sorted set
    "local currentRequests = redis.call('ZCARD', key) " +
    "if currentRequests < limit then " +
    "    redis.call('ZADD', key, now, now) " +
    "    redis.call('PEXPIRE', key, window) " +
    "    return 1 " + // Allowed
    "else " +
    "    return 0 " + // Rate Limited (HTTP 429)
    "end ";`,
    pitfall: "Junior trap: Storing rate limit state in local server memory. In a cluster of 50 API Gateway instances, a client hitting different servers through round-robin DNS can exceed their rate limit by 50x. Always store shared state in Redis or use consistent hashing.",
    interviewTip: "Always mention HTTP standard headers for rate limiting: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After: 60` on HTTP 429 Too Many Requests.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🛡️ Circuit Breaker State Transition Machine</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-green"><span class="node-label">CLOSED</span><small>Normal execution</small></div>
          <span class="flow-arrow-separator">──Failures &gt; 50%──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">OPEN</span><small>Fail fast (no call)</small></div>
          <span class="flow-arrow-separator">──Timeout Expires──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">HALF-OPEN</span><small>Trial probe traffic</small></div>
        </div>
      </div>
    `
  }
];

// =========================================================================
// 2. Top 10 Most-Asked HLD Problems in Senior Interviews
// =========================================================================
window.REVISION_APP_DATA.HLD_QUESTIONS = [
  {
    id: "hld-p1-url-shortener-tinyurl",
    title: "1. Design a Scalable URL Shortener (TinyURL / Bitly)",
    category: "HLD Classic",
    difficulty: "Senior HLD",
    problem: "Design a high-scale service that takes long URLs and returns unique 7-character short URLs (e.g., https://tiny.url/abc1234), redirects clients with low latency, tracks click analytics, and expires links after a specified TTL.",
    innerWorking: "Scale: 100M URLs created/month, 10B redirects/month (100:1 read-to-write ratio). Write QPS = 40, Read QPS = 4,000 (Peak = 8,000). Total URLs in 5 years = 6 Billion. A 7-character Base62 string ([a-z, A-Z, 0-9] = 62^7 ≈ 3.5 Trillion combinations) easily accommodates 6B IDs. Core components: 1) Key Generation Service (KGS) that pre-generates random unique Base62 strings into an in-memory queue, preventing collision checking at write time; 2) Redis Cache-Aside storing hot URLs (80/20 rule: 20% of 10B = 2B URLs in cache, ~1TB RAM); 3) HTTP 302 Temporary Redirect (or 301 Permanent Redirect if analytics tracking is offloaded to CDN edge); 4) Partitioned NoSQL DB (DynamoDB or MongoDB) with short_url as partition key.",
    seniorAnswer: [
      "Key Generation Service (KGS): Rather than hashing long URL (MD5/SHA256 has collisions requiring retry loops), a standalone KGS pre-generates random Base62 tokens and stores them in two tables: 'unused_keys' and 'used_keys'. When a write arrives, the worker pops an unused key in O(1) time.",
      "Redirection Status Code: Use HTTP 302 Found instead of 301 Moved Permanently. HTTP 301 is aggressively cached by browsers, meaning subsequent clicks bypass your servers and ruin analytics tracking. HTTP 302 forces all requests through your backend.",
      "High Availability & Cache Strategy: Read QPS is 8,000. Use Redis Cluster with LRU eviction. If a key misses, query DynamoDB and repopulate Redis. Use a Bloom Filter in front of Redis to reject random invalid slug probes in O(1) without touching DB.",
      "Database Schema: NoSQL Document Store (DynamoDB): PK: short_key (String), long_url (String), user_id (UUID), created_at (Timestamp), expires_at (TTL). DynamoDB native TTL automatically reaps expired records without background batch query load."
    ],
    codeSnippet: `// =========================================================================
// KEY GENERATION SERVICE (KGS) & BASE62 ENCODING UTILITY
// =========================================================================

public class Base62Encoder {
    private static final String BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static String encode(long id) {
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(BASE62.charAt((int) (id % 62)));
            id /= 62;
        }
        while (sb.length() < 7) {
            sb.append('0'); // Pad to fixed 7 characters
        }
        return sb.reverse().toString();
    }
}

// Controller Redirection Handler
@GetMapping("/{shortKey}")
public ResponseEntity<Void> redirect(@PathVariable String shortKey) {
    // 1. Check Bloom Filter -> If not present, return 404 immediately
    if (!bloomFilter.mightContain(shortKey)) {
        return ResponseEntity.notFound().build();
    }
    // 2. Check Redis Cache
    String longUrl = redisTemplate.opsForValue().get("url:" + shortKey);
    if (longUrl == null) {
        // 3. Fallback to DB
        UrlMapping mapping = urlRepository.findById(shortKey).orElse(null);
        if (mapping == null) return ResponseEntity.notFound().build();
        longUrl = mapping.getLongUrl();
        redisTemplate.opsForValue().set("url:" + shortKey, longUrl, Duration.ofDays(7));
    }
    // 4. Asynchronously publish click event to Kafka for analytics
    kafkaTemplate.send("url-clicks", new ClickEvent(shortKey, Instant.now()));
    // 5. 302 Redirect to destination
    return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(longUrl)).build();
}`,
    trap: "Candidate hashes MD5(longUrl), takes first 7 chars, hits a hash collision in DB, and enters a retry loop appending salts. Under high concurrency, hash collisions generate DB contention spikes. Pre-generating IDs via KGS or Snowflake eliminates collisions entirely.",
    interviewerIntent: "Evaluates understanding of URL hashing vs pre-generation, Base62 mathematics, HTTP 301 vs 302 redirect mechanics, and Redis cache sizing.",
    warStory: "A major marketing platform used HTTP 301 for shortened campaign links. After launching a 10M-user blast, their real-time dashboard showed zero clicks after minute 2 because corporate proxy servers and Chrome cached the 301 redirect locally. Switching to HTTP 302 restored real-time tracking.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🔗 TinyURL High-Level Architecture</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Client</span><small>GET /abc1234</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">API Gateway</span><small>Bloom Filter</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Redis Cache</span><small>Hit: 302 Redirect</small></div>
          <span class="flow-arrow-separator">──Miss──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">DynamoDB</span><small>PK: shortKey</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p2-rate-limiter-api-gateway",
    title: "2. Design a Distributed Rate Limiter for API Gateways",
    category: "HLD Classic",
    difficulty: "Senior HLD",
    problem: "Design a high-throughput, low-latency distributed rate limiter that throttles API abuse (e.g., 100 requests/minute per API key or IP address), scales across hundreds of gateway nodes, and handles Redis failure gracefully.",
    innerWorking: "Scale: 1,000,000 requests/sec across 200 API gateway pods. Latency SLA: Rate limit check must take < 2ms. Algorithms: Token Bucket (bursts allowed), Sliding Window Log (high memory), Sliding Window Counter (optimal compromise: tracks requests in current and previous window using weighted arithmetic). Storage: Redis cluster sharded by API key. High-availability fallback: Local in-memory Token Bucket (Guava/Caffeine) with circuit breaker if Redis latency spikes above 5ms.",
    seniorAnswer: [
      "Sliding Window Counter Algorithm: Track count of current 60s window and previous 60s window. Estimated Count = Current_Window_Count + Previous_Window_Count * ((60 - elapsed_seconds) / 60). Requires only 2 integer keys per client instead of thousands of log entries.",
      "Redis Lua Script for Atomicity: Execute window increment and TTL expiration in a single Redis Lua script to avoid race conditions between GET and INCR.",
      "Resilience & Fail-Open Policy: If Redis cluster experiences network partition or timeout (> 2ms), the API Gateway MUST FAIL OPEN (allow the request) while incrementing an alert metric. Crashing or blocking the entire API gateway because rate limiting is down is unacceptable.",
      "Multi-Tier Rate Limiting: 1) L4 firewall (IP-based DDoS mitigation via Cloudflare); 2) L7 API Gateway (Per-tenant API key rate limiting); 3) Downstream Service Level (Resource-specific limits e.g., OpenAI LLM tokens/min)."
    ],
    codeSnippet: `// Redis Lua Script executing Sliding Window Counter atomically
local key = KEYS[1]
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local window = tonumber(ARGV[3]) -- e.g. 60 sec

local currentWindow = math.floor(now / window)
local prevWindow = currentWindow - 1

local curKey = key .. ":" .. currentWindow
local prevKey = key .. ":" .. prevWindow

local curCount = tonumber(redis.call('GET', curKey) or "0")
local prevCount = tonumber(redis.call('GET', prevKey) or "0")

local timeIntoCurWindow = now % window
local weight = (window - timeIntoCurWindow) / window
local estimatedCount = math.floor(prevCount * weight + curCount)

if estimatedCount < limit then
    redis.call('INCR', curKey)
    redis.call('EXPIRE', curKey, window * 2)
    return 1 -- Allowed
else
    return 0 -- Throttled (429)
end`,
    trap: "Running multiple individual Redis commands (`redis.get()`, followed by Java logic, followed by `redis.incr()`). In high-concurrency environments, 50 requests execute `get()` concurrently and all pass, completely blowing through the rate limit. Must use Lua scripts or Redis Transactions.",
    interviewerIntent: "Tests algorithm trade-offs (Token Bucket vs Sliding Window), atomic Redis operations, and critical production failure modes (fail-open vs fail-closed).",
    warStory: "An enterprise gateway had a strict fail-closed policy on their Redis rate limiter. During a Redis replica failover lasting 4 seconds, 100% of global user traffic was rejected with HTTP 500 errors. Modern systems configure a 2ms timeout that falls back to local in-memory token buckets.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🛡️ Distributed Rate Limiter Architecture</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Inbound Request</span><small>Headers: API-Key</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">API Gateway Node</span><small>Evaluate Limiter</small></div>
          <span class="flow-arrow-separator">──Lua Script──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Redis Cluster</span><small>Sliding Counter</small></div>
          <span class="flow-arrow-separator">──&gt; Limit──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">HTTP 429</span><small>Retry-After: 30s</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p3-whatsapp-messenger-chat",
    title: "3. Design a Real-Time Chat System (WhatsApp / Slack)",
    category: "HLD Classic",
    difficulty: "Staff HLD",
    problem: "Design a secure, real-time 1-on-1 and group messaging system supporting 500M Daily Active Users, sub-100ms message delivery latency, online/offline status presence, and reliable message history synchronization across devices.",
    innerWorking: "Scale: 500M DAU sending 50B messages/day = 580,000 messages/sec average (1.5M peak). Bi-directional communication mandates persistent WebSockets (or gRPC streaming) between client and WebSocket Gateway clusters. Ephemeral presence is tracked in Redis (Heartbeat key with 30s TTL). Offline messages queued in distributed store. Chat history requires append-only database (Cassandra/ScyllaDB partitioned by conversation_id).",
    seniorAnswer: [
      "Connection Tier: Maintain persistent WebSocket connections on a stateless WebSocket Gateway fleet. A Redis-backed 'User Session Registry' maps `user_id -> gateway_pod_ip`.",
      "Message Delivery Flow: User A sends message to Gateway 1. Gateway 1 writes message to Kafka topic `chat-messages`. Message Service consumes Kafka, writes to Cassandra, and queries Session Registry for User B. If User B is on Gateway 4, message is forwarded via internal RPC to Gateway 4 -> pushed over WebSocket to User B.",
      "Offline Delivery: If User B is offline (no active session), Message Service enqueues push notification to APNs/FCM and marks message as 'SENT' (single checkmark). When User B connects, their client requests `/sync?last_seq_id=X`, pulling all missed messages sequentially.",
      "Database Modeling in Cassandra: Table `messages`: PK `((conversation_id), message_id)` where `message_id` is a TimeUUID. This clusters messages on disk in chronological order, enabling fast range scans `WHERE conversation_id = ? AND message_id > ? LIMIT 50`.",
      "Group Chat Optimization: Small groups (up to 200 users) use fan-out on write to all member queues. Large broadcast channels (10,000+ users) use fan-out on read with Redis Pub/Sub channels to avoid write amplification."
    ],
    codeSnippet: `// Cassandra CQL Table Definition for Chronological Chat History
CREATE TABLE messages_by_conversation (
    conversation_id uuid,
    message_id timeuuid, -- Guarantees time sorting and uniqueness
    sender_id uuid,
    content text,
    media_url text,
    status text, -- SENT, DELIVERED, READ
    created_at timestamp,
    PRIMARY KEY ((conversation_id), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

// Query latest 50 messages for conversation pagination
SELECT * FROM messages_by_conversation 
WHERE conversation_id = 7a8b9c0d-1234-5678-90ab-cdef12345678 
  AND message_id < maxTimeuuid('2026-11-20 00:00:00+0000') 
LIMIT 50;`,
    trap: "Candidate suggests HTTP polling or long polling for 500M users. 500M users polling every 1 second creates 500M HTTP handshakes per second, crushing load balancers. WebSockets maintain a lightweight TCP connection with minimal keepalive overhead.",
    interviewerIntent: "Evaluates handling of persistent stateful connections (WebSockets), session routing across gateway pods, distributed storage for append-heavy chat history, and online/offline synchronization.",
    warStory: "During a New Year's Eve traffic spike, a chat app's Presence Service failed because each user's disconnect sent a broadcast to all their 5,000 contacts. The $O(N^2)$ write storm to Redis caused cluster OOM. They redesigned Presence to use lazy polling: presence is only fetched when a user actively opens a chat window.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">💬 Real-Time Chat Architecture &amp; Delivery Flow</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">User A (App)</span><small>WebSocket</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">WS Gateway 1</span><small>Session Registry</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Kafka Queue</span><small>Order &amp; Durability</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Cassandra DB</span><small>Append History</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">WS Gateway 2</span><small>Push to User B</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p4-netflix-youtube-video-streaming",
    title: "4. Design a Video Streaming Platform (YouTube / Netflix)",
    category: "HLD Classic",
    difficulty: "Staff HLD",
    problem: "Design a global video ingestion, transcoding, and streaming platform capable of handling millions of uploaded videos daily, providing low-buffering adaptive bitrate playback across mobile/TV/desktop, and global CDN delivery.",
    innerWorking: "Scale: 1 Billion hours watched/day, 500 hours uploaded/minute. Video storage is petabyte-scale. Architecture separates into 1) Ingestion & Transcoding Pipeline (Asynchronous DAG converting raw video into HLS/DASH formats across multiple resolutions 1080p, 720p, 480p, and codecs H.264, VP9, AV1); 2) Chunking Engine (splitting video into 2-6 second `.ts`/`.m4s` chunks with an `.m3u8` master manifest playlist); 3) Content Delivery Network (CDN) with multi-tier caching (Edge Pops -> Origin Shield -> AWS S3).",
    seniorAnswer: [
      "Chunk-Based Asynchronous Transcoding: Raw uploaded video (e.g., 4GB `.mov`) is uploaded directly to S3 via presigned URLs. An S3 upload event triggers an Orchestrator (Temporal / AWS Step Functions) that splits the video into 5-second segments. Workers encode chunks in parallel across a spot-instance Kubernetes cluster, reducing transcoding time from 1 hour to 2 minutes.",
      "Adaptive Bitrate Streaming (ABR): Use HLS (HTTP Live Streaming) or MPEG-DASH. Client downloads master manifest file (`index.m3u8`) which lists available bitrates and segment URLs. The video player monitors current network bandwidth; if bandwidth drops, player seamlessly requests the next 5-second chunk in 480p instead of 1080p without buffering.",
      "CDN Edge Caching Strategy: 95% of traffic is served from CDN edges (Cloudflare/Akamai/Netflix Open Connect). Videos have long-tail distribution: Top 1% popular videos are pre-warmed to Edge caches; older long-tail videos stay in S3 Cold Storage (Glacier) and are pulled on demand.",
      "Database Architecture: Relational metadata (User, Video Title, Channel, Permissions) stored in CockroachDB/MySQL. Video views and analytics streamed via Kafka into ClickHouse/Snowflake OLAP."
    ],
    codeSnippet: `// Sample HLS Master Playlist Manifest (index.m3u8)
#EXTM3U
#EXT-X-VERSION:3

# High Bandwidth (1080p @ 5000kbps)
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8

# Medium Bandwidth (720p @ 2800kbps)
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p/playlist.m3u8

# Low Bandwidth (480p @ 1400kbps)
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p/playlist.m3u8`,
    trap: "Streaming full video files directly from a backend Spring Boot service to clients. Full video transfers blow up server bandwidth and memory, fail completely on intermittent mobile networks, and prevent adaptive bitrate downscaling.",
    interviewerIntent: "Evaluates distributed asynchronous pipeline design, chunking and transcoding workflows, CDN edge distribution, and understanding of HLS/DASH protocols.",
    warStory: "A streaming service launched without segment chunking during a major sporting event. Clients buffered the entire 2-hour file; when bandwidth fluctuated, players re-requested the entire file from byte 0, causing a 10x egress bandwidth spike and a $120,000 cloud egress bill overnight.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📺 Video Ingestion &amp; CDN Streaming Pipeline</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Creator Upload</span><small>Presigned S3 URL</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Chunker &amp; Worker</span><small>FFmpeg Transcode</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">S3 Bucket</span><small>.m3u8 &amp; .ts chunks</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Edge CDN POPs</span><small>Geo-Distributed</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">Client Player</span><small>ABR 1080p/720p</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p5-uber-lyft-geospatial-service",
    title: "5. Design a Ride-Hailing Geospatial Service (Uber / Lyft)",
    category: "HLD Classic",
    difficulty: "Staff HLD",
    problem: "Design a real-time ride-hailing backend supporting 1M active drivers sending GPS locations every 4 seconds, sub-second driver matching within a 5km radius, dynamic surge pricing, and ETA calculation.",
    innerWorking: "Scale: 1M drivers updating GPS (latitude, longitude) every 4 seconds = 250,000 write QPS. Searching for nearest drivers requires querying 2D spatial points. Relational databases using `WHERE latitude BETWEEN x AND y` require full table scans ($O(N)$) and choke. Solution: Geospatial Indexing using Uber H3 (Hexagonal hierarchical spatial index) or Google S2 (Hilbert curve space-filling cells).",
    seniorAnswer: [
      "Geospatial Sharding with Uber H3 / Google S2: Earth is divided into hierarchical hexagons. A lat/long coordinate is mapped to a 64-bit integer H3 index in $O(1)$ CPU time. Finding drivers within 5km is simply querying the center hexagon and its immediate 1-ring or 2-ring neighbors (`h3.kRing(origin, 2)`).",
      "High-Throughput Location Ingestion: Drivers stream GPS via WebSockets to Location Ingestion Workers. Workers write directly into Redis Geospatial (`GEOADD drivers:h3_cell lon lat driver_id`) or Redis Hashes with short TTLs. No relational DB writes in the hot path.",
      "Driver Matching Service: When a rider requests a trip at (lat, lon), the Matcher finds all active/available drivers in the rider's H3 cell and adjacent cells using `GEORADIUS`. A ranking algorithm scores candidates based on ETA, driver rating, and heading angle, and sends a dispatch offer via WebSocket to the top driver.",
      "Trip State Machine: Modeled in PostgreSQL with distributed locking. States: REQUESTED -> DRIVER_ASSIGNED -> ARRIVED -> IN_TRANSIT -> COMPLETED. State transitions require optimistic locking (`version` column) to prevent double-dispatch."
    ],
    codeSnippet: `// =========================================================================
// GEOSPATIAL DRIVER SEARCH USING REDIS GEO COMMANDS
// =========================================================================

// 1. Driver updates location every 4 seconds (In-Memory Redis Geospatial)
public void updateDriverLocation(String cellId, String driverId, double lon, double lat) {
    redisTemplate.opsForGeo().add("geo:drivers:" + cellId, new Point(lon, lat), driverId);
    // Track driver status in separate hash
    redisTemplate.opsForHash().put("driver:status", driverId, "AVAILABLE");
}

// 2. Rider requests nearby drivers within 3 km
public List<String> findNearestDrivers(double riderLon, double riderLat, double radiusKm) {
    Circle circle = new Circle(new Point(riderLon, riderLat), new Distance(radiusKm, Metrics.KILOMETERS));
    GeoResults<RedisGeoCommands.GeoLocation<String>> results = 
        redisTemplate.opsForGeo().radius("geo:drivers", circle);

    return results.getContent().stream()
        .map(r -> r.getContent().getName())
        .filter(this::isDriverAvailable)
        .limit(10)
        .collect(Collectors.toList());
}`,
    trap: "Candidate suggests storing continuous GPS updates in PostgreSQL/PostGIS. 250,000 spatial updates/sec will saturate PostgreSQL WAL and disk I/O immediately. GPS telemetry belongs in Redis in-memory spatial indexes; only trip start/end milestones are stored in durable relational DBs.",
    interviewerIntent: "Evaluates spatial indexing knowledge (QuadTree vs Geohash vs H3/S2), handling 250k write QPS without database death, and resilient matching state machines.",
    warStory: "An early ride-sharing startup used QuadTrees rebuilt in memory every 10 seconds. As driver count grew to 50,000, QuadTree re-indexing took 12 seconds, creating lock contention where drivers could neither update location nor receive ride requests. Migrating to Uber H3 integer keys in Redis eliminated the rebuild bottleneck.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🚖 Uber Geospatial Ingestion &amp; Dispatch Flow</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">1M Drivers (App)</span><small>GPS every 4s</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Location Ingestion</span><small>WebSocket Cluster</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Redis GEO / H3</span><small>250k Writes/sec</small></div>
          <span class="flow-arrow-separator">──Match──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Dispatch Engine</span><small>k-Ring Neighbors</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p6-twitter-x-newsfeed",
    title: "6. Design Twitter / X Newsfeed System",
    category: "HLD Classic",
    difficulty: "Senior HLD",
    problem: "Design a scalable social newsfeed timeline supporting 300M DAU, tweet posting, fast timeline generation (< 200ms), and efficient handling of high-follower 'celebrity' accounts (e.g., accounts with 100M followers).",
    innerWorking: "Scale: 300M DAU. 500M tweets/day = 6,000 write QPS (Peak 20,000). Read timeline requests = 300,000 QPS. Trade-off: Fan-Out on Write (Push) vs Fan-Out on Read (Pull). Push: When user tweets, write tweet ID to all followers' timeline caches. Pull: When user opens feed, query all followees' tweets and merge in memory. Hybrid: Push for normal users, Pull for celebrities.",
    seniorAnswer: [
      "The Fan-Out on Write Problem (The 'Elon Musk' Problem): If a celebrity with 100M followers tweets, a naive push model executes 100,000,000 Redis list writes (`LPUSH timeline:user_id tweet_id`). This creates severe write amplification and delays feed updates by minutes.",
      "Hybrid Fan-Out Architecture: 1) Normal users (< 25,000 followers) use Fan-out on Write: background Kafka workers push tweet ID into each follower's pre-computed Redis timeline list. 2) Celebrities (> 25,000 followers) use Fan-out on Read: their tweets are NOT pushed to followers; instead, when a user refreshes their timeline, the system fetches their pre-computed timeline from Redis AND pulls recent tweets from celebrities they follow, merging them on the fly.",
      "Redis Timeline Storage: Each user has a Redis Sorted Set (`ZSET`) or List storing the latest 800 tweet IDs (`tweet_id -> timestamp`). Max size capped to 800 items via `LTRIM` to prevent memory bloat.",
      "Pagination & Media Hydration: Timeline returns tweet IDs. The client queries a separate Tweet Hydration Service (backed by Redis cache + Memcached) to fetch tweet text, user profile, and media URLs in a single batch MGET."
    ],
    codeSnippet: `// Hybrid Timeline Merge on Read (Java Pseudo-code)
public List<Tweet> getUserTimeline(String userId, int limit) {
    // 1. Fetch pre-computed timeline (Normal followees) from Redis ZSET
    Set<String> tweetIds = redisTemplate.opsForZSet()
        .reverseRange("timeline:" + userId, 0, limit);

    // 2. Fetch list of celebrities followed by this user
    List<String> followedCelebs = followService.getFollowedCelebrities(userId);

    // 3. Pull recent tweets from celebrities from their individual tweet ZSETs
    for (String celebId : followedCelebs) {
        Set<String> celebTweetIds = redisTemplate.opsForZSet()
            .reverseRange("user_tweets:" + celebId, 0, 10);
        tweetIds.addAll(celebTweetIds);
    }

    // 4. Sort merged IDs by timestamp descending and take top 'limit'
    List<String> topTweetIds = tweetIds.stream()
        .sorted(Comparator.reverseOrder())
        .limit(limit)
        .collect(Collectors.toList());

    // 5. Hydrate tweet objects via batch MGET
    return tweetHydrationService.batchGet(topTweetIds);
}`,
    trap: "Proposing pure fan-out on read (querying relational DB with `WHERE user_id IN (SELECT followee_id FROM follows WHERE follower_id = 42) ORDER BY created_at DESC`). For users following 1,000 people, this query brings the database to its knees at 300,000 read QPS.",
    interviewerIntent: "Evaluates mastery of write vs read amplification, cache sizing, fan-out trade-offs, and handling power-law/celebrity skew.",
    warStory: "Twitter famously suffered from the 'Fail Whale' in its early architecture due to pure fan-out on read. Migrating to Redis-backed pre-computed timelines with the hybrid fan-out model reduced feed generation latencies from seconds to under 50 milliseconds.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🐦 Hybrid Newsfeed Fan-Out Architecture</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">User Posts Tweet</span><small>API Gateway</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Follower Count &gt; 25k?</span><small>Celebrity Check</small></div>
          <span class="flow-arrow-separator">──No (Push)──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Kafka Fan-Out</span><small>Push to 1k Followers</small></div>
          <span class="flow-arrow-separator">──Yes (Pull)──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Celeb Tweet Store</span><small>Merged on Feed Read</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p7-flash-sale-ticket-booking",
    title: "7. Design a High-Concurrency Flash Sale / Ticket Booking System",
    category: "HLD Classic",
    difficulty: "Staff HLD",
    problem: "Design an e-commerce flash sale (or BookMyShow / Ticketmaster seat booking) platform where 1,000,000 concurrent users attempt to purchase 10,000 limited inventory items at 12:00 PM without overselling, inventory leakage, or database collapse.",
    innerWorking: "Core challenges: 1) Extreme concurrency spike (1M users hitting 'Buy' within 5 seconds); 2) Preventing overselling (strict inventory count <= 10,000); 3) Preventing phantom inventory locks (user locks seat but never pays). Solution: Multi-tier defense line: Virtual Waiting Room (Cloudflare/Kafka queue), Redis atomic inventory pre-decrement via Lua, Asynchronous Order Creation via Kafka, and Payment Timeout auto-rollback.",
    seniorAnswer: [
      "Layer 1 - Virtual Waiting Room & Traffic Shaping: Rate limiter and Cloudflare Waiting Room throttle traffic, queuing users and admitting only 5,000 users/second into the checkout flow based on token cookies.",
      "Layer 2 - Redis In-Memory Inventory Pre-allocation: Stock is pre-loaded into Redis (`stock:item_101 = 10000`). A Lua script checks if stock > 0, executes `DECR`, and records `user_id -> order_id` in a Redis Set. This takes < 1ms and avoids hitting relational DB locks during peak traffic.",
      "Layer 3 - Async Order Processing via Kafka: Once Redis decrement succeeds, an `InventoryReservedEvent` is emitted to Kafka. Order Service workers consume the queue at a sustainable rate (e.g., 2,000 orders/sec) and insert records into PostgreSQL with status `PENDING_PAYMENT`.",
      "Layer 4 - Payment Expiration & Stock Reversal: A 10-minute payment countdown begins. If the user completes payment, status -> `PAID`. If payment fails or timeout expires, a Delay Queue (or Redis Keyspace Notification) triggers a compensating transaction: stock is incremented back in Redis (`INCR stock:item_101`) and order marked `EXPIRED`."
    ],
    codeSnippet: `// Redis Lua Script for Atomic Inventory Deduction
local stockKey = KEYS[1]
local userPurchasesKey = KEYS[2]
local userId = ARGV[1]
local quantity = tonumber(ARGV[2])

-- 1. Check if user already purchased
if redis.call('SISMEMBER', userPurchasesKey, userId) == 1 then
    return -1 -- Already purchased (prevent duplicate orders)
end

-- 2. Check current stock
local currentStock = tonumber(redis.call('GET', stockKey) or "0")
if currentStock >= quantity then
    redis.call('DECRBY', stockKey, quantity)
    redis.call('SADD', userPurchasesKey, userId)
    return 1 -- Success: Inventory reserved
else
    return 0 -- Sold out!
end`,
    trap: "Relying on database transactions with `SELECT * FROM inventory WHERE id = 1 FOR UPDATE`. 100,000 concurrent threads waiting on a single row lock in PostgreSQL/MySQL will cause connection pool exhaustion, transaction lock timeouts, and complete DB failure within seconds.",
    interviewerIntent: "Evaluates ability to protect databases from thundering herds, atomic in-memory state manipulation, asynchronous order queues, and compensating rollback mechanisms.",
    warStory: "A major concert ticketing platform used relational DB row locks for ticket sales. When tickets for a superstar went live, 800,000 requests locked the inventory table, causing DB connection pool exhaustion in 800ms. The site crashed for 4 hours. Migrating to Redis Lua pre-allocation allowed them to sell 50,000 tickets in 14 seconds with 0 DB overload.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🎟️ Flash Sale Multi-Tier Defense Architecture</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">1M Users</span><small>12:00 PM Spike</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Waiting Room</span><small>Token Bucket Traffic</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Redis Lua Script</span><small>Atomic DECR Stock</small></div>
          <span class="flow-arrow-separator">──Stock &gt; 0──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Kafka Queue</span><small>Order Ingestion</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">PostgreSQL</span><small>Sustainable Inserts</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p8-distributed-unique-id-generator",
    title: "8. Design a Distributed Unique ID Generator (Twitter Snowflake)",
    category: "HLD Classic",
    difficulty: "Senior HLD",
    problem: "Design a high-throughput, globally unique, roughly time-sortable 64-bit ID generator service capable of producing 100,000+ IDs/second with zero cross-datacenter coordination and immunity to NTP clock drift.",
    innerWorking: "Requirements: 64-bit integer IDs (fits in standard SQL `BIGINT`), sortable by timestamp, unique across multiple datacenters. Why UUIDv4 fails: 128 bits (double storage), completely random (ruins B-Tree index locality, causing mass page splits on insert). Solution: Twitter Snowflake 64-bit binary layout.",
    seniorAnswer: [
      "Snowflake 64-Bit Structure: 1) 1 Sign bit (always 0); 2) 41 Timestamp bits (milliseconds since custom epoch e.g., 2026-01-01 -> lasts 69 years); 3) 10 Machine/Datacenter bits (5 bits Datacenter ID + 5 bits Worker ID = 1,024 unique generator nodes); 4) 12 Sequence bits (rolls from 0 to 4,095 per millisecond per node).",
      "Throughput Capacity: Each generator node produces $2^{12} = 4,096$ IDs per millisecond = 4,096,000 IDs per second per machine. With 1,024 nodes, global capacity exceeds 4 Billion IDs/second.",
      "Handling NTP Clock Backward Skew: If local system clock rolls backward (NTP sync), generating an ID could produce duplicates. Resolution: If `currentTimestamp < lastTimestamp`, either wait if skew is < 5ms (`Thread.sleep()`), or reject with exception and failover to a peer node, or allocate from an extra backup worker ID range."
    ],
    codeSnippet: `public class SnowflakeIdGenerator {
    private static final long EPOCH = 1735689600000L; // 2026-01-01 00:00:00 UTC
    private static final long WORKER_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;

    private static final long MAX_WORKER_ID = (1L << WORKER_ID_BITS) - 1; // 1023
    private static final long MAX_SEQUENCE = (1L << SEQUENCE_BITS) - 1;   // 4095

    private final long workerId;
    private long lastTimestamp = -1L;
    private long sequence = 0L;

    public SnowflakeIdGenerator(long workerId) {
        if (workerId < 0 || workerId > MAX_WORKER_ID) {
            throw new IllegalArgumentException("Worker ID out of range");
        }
        this.workerId = workerId;
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();

        if (timestamp < lastTimestamp) {
            long offset = lastTimestamp - timestamp;
            if (offset <= 5) { // Small NTP drift: sleep until lastTimestamp
                try { Thread.sleep(offset); timestamp = System.currentTimeMillis(); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            } else {
                throw new IllegalStateException("Clock moved backwards! Refusing to generate ID for " + offset + "ms");
            }
        }

        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) { // Millisecond exhausted, spin until next ms
                while ((timestamp = System.currentTimeMillis()) <= lastTimestamp) {}
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        return ((timestamp - EPOCH) << (WORKER_ID_BITS + SEQUENCE_BITS))
             | (workerId << SEQUENCE_BITS)
             | sequence;
    }
}`,
    trap: "Using auto-incrementing database IDs (`AUTO_INCREMENT`) across multiple sharded databases. This creates a single point of failure and bottleneck, or requires complex multi-master step increments (`ID % N`) which breaks when adding shards.",
    interviewerIntent: "Tests binary bit-shifting skills, capacity planning, B-Tree index locality understanding, and distributed clock synchronization challenges.",
    warStory: "A financial service used UUIDv4 for their transaction ledger. As the table reached 100M rows, insert throughput crashed from 15,000 writes/sec to 400 writes/sec because random UUIDs caused constant random disk reads and InnoDB B-Tree page splits. Switching to Snowflake IDs restored 15,000 writes/sec instantly.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">❄️ Twitter Snowflake 64-Bit Binary Layout</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">1 Bit</span><small>Sign (0)</small></div>
          <span class="flow-arrow-separator">+</span>
          <div class="flow-step-node node-green"><span class="node-label">41 Bits</span><small>Epoch ms (69 Yrs)</small></div>
          <span class="flow-arrow-separator">+</span>
          <div class="flow-step-node node-purple"><span class="node-label">10 Bits</span><small>Machine ID (1024)</small></div>
          <span class="flow-arrow-separator">+</span>
          <div class="flow-step-node node-orange"><span class="node-label">12 Bits</span><small>Sequence (4096/ms)</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p9-distributed-key-value-store",
    title: "9. Design a Distributed Key-Value Store (Amazon Dynamo-style)",
    category: "HLD Classic",
    difficulty: "Staff HLD",
    problem: "Design a decentralized, highly available, partition-tolerant distributed Key-Value store supporting `get(key)` and `put(key, value)` with zero master coordinator, automated data partitioning, configurable consistency, and conflict resolution.",
    innerWorking: "Architecture based on the classic Amazon Dynamo paper. Core components: 1) Consistent Hashing with virtual nodes (VNodes) for uniform distribution and smooth rebalancing; 2) Sloppy Quorum and Hinted Handoff for high write availability during node failures; 3) Vector Clocks for concurrent write conflict detection; 4) Read Repair and Merkle Trees for background anti-entropy synchronization.",
    seniorAnswer: [
      "Consistent Hashing & Virtual Nodes: Hash space arranged in a $0$ to $2^{32}-1$ ring. Nodes are placed on the ring using MD5 hashes. Each physical machine is mapped to 256 virtual nodes (VNodes) to prevent non-uniform hot spots. A key is stored on the first node encountered clockwise, and replicated to the next $N-1$ distinct physical nodes.",
      "Tunable Quorum ($R + W > N$): Configurable parameters: $N$ (Replicas e.g. 3), $W$ (Write Quorum e.g. 2), $R$ (Read Quorum e.g. 2). Since $R + W = 4 > 3$, at least one node in any read quorum overlaps with the write quorum, guaranteeing strong consistency. Setting $W=1, R=1$ optimizes for low latency at the cost of eventual consistency.",
      "Vector Clocks & Versioning: Concurrent writes to divergent network partitions create multiple versions (siblings). A vector clock `[(NodeA, 1), (NodeB, 2)]` captures causality. When a client reads conflicting siblings, the conflict is returned to the client application for semantic resolution (e.g., merging shopping cart items).",
      "Anti-Entropy with Merkle Trees: Nodes exchange compact Merkle Trees (binary hash trees) to compare local key ranges in $O(\log N)$ time, synchronizing only the differing leaf keys without streaming gigabytes of raw data."
    ],
    codeSnippet: `// =========================================================================
// CONSISTENT HASH RING WITH VIRTUAL NODES IMPLEMENTATION
// =========================================================================

public class ConsistentHashRing<T> {
    private final int numberOfReplicas; // Number of VNodes per physical node
    private final SortedMap<Integer, T> circle = new ConcurrentSkipListMap<>();

    public ConsistentHashRing(int numberOfReplicas, Collection<T> nodes) {
        this.numberOfReplicas = numberOfReplicas;
        for (T node : nodes) { addNode(node); }
    }

    public void addNode(T node) {
        for (int i = 0; i < numberOfReplicas; i++) {
            circle.put(hash(node.toString() + "-vnode-" + i), node);
        }
    }

    public void removeNode(T node) {
        for (int i = 0; i < numberOfReplicas; i++) {
            circle.remove(hash(node.toString() + "-vnode-" + i));
        }
    }

    public T getNode(String key) {
        if (circle.isEmpty()) return null;
        int hash = hash(key);
        if (!circle.containsKey(hash)) {
            SortedMap<Integer, T> tailMap = circle.tailMap(hash);
            hash = tailMap.isEmpty() ? circle.firstKey() : tailMap.firstKey();
        }
        return circle.get(hash);
    }

    private int hash(String key) {
        return MurmurHash3.hash32x86(key.getBytes(StandardCharsets.UTF_8));
    }
}`,
    trap: "Describing a master-slave architecture with ZooKeeper/etcd leadership election. Dynamo is strictly DECENTRALIZED (masterless gossip protocol); every node can act as coordinator for any read/write request.",
    interviewerIntent: "Assesses deep knowledge of distributed systems fundamentals: consistent hashing, quorum mathematics, vector clocks, and gossip protocols.",
    warStory: "Amazon found that during early holiday shopping seasons, master-based databases suffered downtime during master failovers. Dynamo's masterless design with hinted handoff ensured that an Amazon customer could ALWAYS add an item to their shopping cart even if half the datacenter was experiencing network partition.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⭕ Consistent Hash Ring &amp; Replication</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Key Hash</span><small>Murmur3(key)</small></div>
          <span class="flow-arrow-separator">──Clockwise──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Node A (Primary)</span><small>Store Write</small></div>
          <span class="flow-arrow-separator">──Replicate──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Node B (Replica 1)</span><small>Quorum Ack</small></div>
          <span class="flow-arrow-separator">──Replicate──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Node C (Replica 2)</span><small>Quorum Ack</small></div>
        </div>
      </div>
    `
  },
  {
    id: "hld-p10-distributed-web-crawler",
    title: "10. Design a Distributed Web Crawler (Google / Search Engine)",
    category: "HLD Classic",
    difficulty: "Staff HLD",
    problem: "Design a distributed web crawler capable of downloading 1 Billion web pages per month, respecting website politeness (avoiding server overload), preventing duplicate page crawling, and storing petabytes of raw HTML and parsed links.",
    innerWorking: "Scale: 1B pages/month = 400 pages/sec continuous (Peak 1,000 pages/sec). Web size: 1B pages * 500 KB = 500 TB/month (6 PB in 1 year). Components: 1) URL Frontier (Priority Queue + Politeness Queue); 2) DNS Resolver Cache (avoiding DNS lookup latency); 3) Fetcher Engine with headless renderers; 4) Content Deduplication using SimHash (64-bit fingerprint); 5) Distributed Storage (HDFS/S3 for raw HTML, Bigtable/Cassandra for metadata).",
    seniorAnswer: [
      "URL Frontier Architecture (Priority + Politeness): 1) Priority Queues: Assigns priority based on PageRank or update frequency; 2) Politeness Queues: Each target domain (e.g., `cnn.com`) is mapped to its own queue. A worker thread fetches from a domain queue, then enforces a mandatory delay (e.g., 500ms) before the next fetch from that domain, honoring `robots.txt`.",
      "DNS Resolution Caching: Standard DNS lookups take 50-200ms. A crawler must maintain a local DNS cache with pre-resolved IP addresses to avoid saturating local DNS servers and choking the crawl loop.",
      "Content Deduplication via SimHash: 30% of web pages are duplicates or mirrors. Instead of hashing raw HTML (which changes if timestamp or banner changes), compute a 64-bit SimHash over tokenized text. Pages with a Hamming distance <= 3 are deemed duplicates and discarded.",
      "Spider Traps & Cycle Detection: Infinite URL generators (e.g., `/calendar?day=1`, `/calendar?day=2...`) are mitigated by max path depth limits (e.g., 10), URL length caps (e.g., 255 chars), and domain crawl budgets."
    ],
    codeSnippet: `// =========================================================================
// URL FRONTIER POLITENESS DISPATCHER ARCHITECTURE
// =========================================================================

public class PolitenessFrontier {
    // Maps host domain (e.g. "cnn.com") to its FIFO queue of URLs
    private final Map<String, Queue<String>> hostQueues = new ConcurrentHashMap<>();
    // Tracks the next allowed timestamp a host can be queried
    private final Map<String, Long> nextAllowedAccessTime = new ConcurrentHashMap<>();
    private static final long POLITENESS_DELAY_MS = 1000; // 1s delay per host

    public synchronized String getNextUrl(String host) {
        long now = System.currentTimeMillis();
        long allowedTime = nextAllowedAccessTime.getOrDefault(host, 0L);

        if (now < allowedTime) {
            return null; // Host is on politeness cooldown, try another host queue
        }

        Queue<String> queue = hostQueues.get(host);
        if (queue != null && !queue.isEmpty()) {
            String url = queue.poll();
            nextAllowedAccessTime.put(host, now + POLITENESS_DELAY_MS);
            return url;
        }
        return null;
    }
}`,
    trap: "Using a single global FIFO queue for URLs. A single crawler worker popping from a FIFO queue could hit `target-site.com` 500 times in 1 second, resulting in a DDoS attack on the site and getting the crawler's IP banned.",
    interviewerIntent: "Evaluates distributed queueing, politeness and rate-limiting design, DNS optimization, and large-scale deduplication algorithms.",
    warStory: "An enterprise indexing bot encountered an e-commerce calendar URL trap (`/events/2026/01/01...`). It crawled 40 million generated calendar pages, blowing up its S3 storage bill by $30,000 before the team implemented URL depth filters and path pattern anomaly detection.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🕷️ Distributed Web Crawler Pipeline</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">URL Frontier</span><small>Politeness Queues</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">HTML Fetcher</span><small>DNS Cache + robots.txt</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">SimHash Filter</span><small>Deduplicate</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Link Extractor</span><small>New URLs -> Frontier</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">S3 / Bigtable</span><small>Raw Storage</small></div>
        </div>
      </div>
    `
  }
];
