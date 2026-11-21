/**
 * kafka-data.js
 * Senior / Staff Engineer Apache Kafka Architecture, Core Internals & 20 Most Asked Scenario Questions
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.KAFKA_TOPICS = [
  {
    id: "kafka-storage-zero-copy",
    title: "Storage Engine: OS PageCache, Log Segments & Zero-Copy (sendfile)",
    category: "Broker & Storage Internals",
    badge: "Staff-Level Storage Engine",
    oneLiner: "Kafka achieves multi-gigabyte throughput by avoiding JVM heap memory entirely: relying on OS PageCache, sequential append-only disk I/O, and the Linux sendfile() Zero-Copy syscall.",
    summary: "Kafka is not fast because it is written in Java/Scala; it is fast because it bypasses the JVM entirely for data storage and transit! Instead of caching messages in JVM heap (which triggers catastrophic GC pauses and double-buffering), Kafka delegates caching to the Linux OS PageCache. When serving consumers, Kafka uses the Linux `sendfile()` system call (Zero-Copy) to transfer bytes directly from the pagecache to the Network Interface Card (NIC) buffer without copying bytes into user-space RAM.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Linux OS PageCache vs Zero-Copy (sendfile) Architecture</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #ef4444;">❌ Traditional JVM I/O (4 Copies, 4 Context Switches)</div>
            <div class="space-desc">Disk ➔ OS Buffer ➔ JVM Heap RAM ➔ Socket Buffer ➔ NIC Buffer</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">Massive CPU overhead, double-buffering in RAM, and Stop-the-World GC pauses under heavy load.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">✅ Kafka Zero-Copy (sendfile syscall: 0 CPU Copies!)</div>
            <div class="space-desc">Disk ➔ OS PageCache ➔ (DMA Direct Transfer) ➔ NIC Buffer</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">Zero context switches into JVM user-space. JVM heap stays small (6-8 GB) while OS caches 100+ GB of hot log segments.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Segment File</span>
            <span class="node-label">000000.log</span>
            <span class="node-sub">Append-only raw bytes</span>
          </div>
          <div class="flow-arrow-node">◄─►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Sparse Index</span>
            <span class="node-label">000000.index</span>
            <span class="node-sub">Offset ➔ Physical Byte Pos</span>
          </div>
          <div class="flow-arrow-node">◄─►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Time Index</span>
            <span class="node-label">000000.timeindex</span>
            <span class="node-sub">Timestamp ➔ Offset</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Sequential Disk I/O vs Random I/O: Sequential disk writes on modern NVMe drives reach 3,000+ MB/s, rivaling random memory access. Kafka guarantees append-only writes at the tail of active segments.",
      "Log Segment Structure: Partitions are split into segments (default 1GB or 7 days). Each segment consists of: `.log` (raw messages), `.index` (sparse index mapping logical offset to physical file byte position every 4KB), and `.timeindex` (maps millisecond timestamp to offset for time-based lookups).",
      "Sparse Indexing: Instead of indexing every single message, Kafka indexes an offset entry every `index.interval.bytes` (default 4096 bytes). Binary search in memory on the index finds the nearest lower byte offset, followed by a fast sequential scan of < 4KB in the log.",
      "Linux Zero-Copy (`sendfile`): Data transfers from the OS PageCache directly into the Network socket via DMA (Direct Memory Access). The CPU never touches the payload bytes, eliminating JVM GC pressure entirely.",
      "Log Compaction Mechanics: Background cleaner threads scan dirty portions of compacted topics. For each key, only the latest record is retained. Deletes are represented as Tombstones (`value = null`). Tombstones are permanently cleaned after `delete.retention.ms`."
    ],
    codeSnippet: `// Inspecting Kafka Log Segments & Indexes via Official CLI Tools:
// 1. Dump and inspect the sparse offset index:
kafka-run-class.sh kafka.tools.DumpLogSegments \\
  --files /var/lib/kafka/data/orders-0/00000000000000000000.index \\
  --verify-index-only

// 2. Dump actual message payloads and verify deep records:
kafka-run-class.sh kafka.tools.DumpLogSegments \\
  --files /var/lib/kafka/data/orders-0/00000000000000000000.log \\
  --print-data-log \\
  --deep-iteration

// Output:
// offset: 1042 position: 4096 isvalid: true payloadsize: 256 magic: 2 compresscodec: NONE
// offset: 1043 position: 4352 isvalid: true payloadsize: 180 magic: 2 compresscodec: NONE`,
    pitfall: "Allocating 64GB+ RAM to the Kafka broker JVM heap. This is an anti-pattern! Large heaps trigger massive Stop-the-World garbage collection pauses. Production brokers should allocate 6GB-8GB to the JVM heap and leave the remaining 85%+ of system RAM to the Linux OS PageCache.",
    interviewTip: "When asked 'Why is Kafka so fast?', emphasize the triad: 1) Sequential append-only I/O, 2) OS PageCache utilization without JVM GC overhead, and 3) Linux kernel Zero-Copy (`sendfile` syscall)."
  },

  {
    id: "kafka-producer-internals-idempotence",
    title: "Producer Internals: RecordAccumulator, Batching & Idempotent Exactly-Once",
    category: "Producer Architecture",
    badge: "Must-Know Internals",
    oneLiner: "Producers buffer messages in a per-partition RecordAccumulator pool; idempotence assigns a 64-bit PID and monotonic sequence numbers to guarantee zero duplicates even across network retries.",
    summary: "A Kafka producer does not send records immediately. Calling `producer.send()` serializes the key/value, computes the target partition, and appends the record into an in-memory `RecordAccumulator`. A background I/O `Sender` thread batches these buffers based on `batch.size` and `linger.ms`. With `enable.idempotence=true`, the broker assigns a Producer ID (`PID`) and validates that incoming sequence numbers increment monotonically per partition, eliminating duplicate writes on network retries without sacrificing throughput.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Producer Threading Model & Idempotent Broker Deduplication</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">User Thread</span>
            <span class="node-label">producer.send()</span>
            <span class="node-sub">Serialize + Partition</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Buffer Pool</span>
            <span class="node-label">RecordAccumulator</span>
            <span class="node-sub">batch.size &amp; linger.ms</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">I/O Thread</span>
            <span class="node-label">Sender Thread</span>
            <span class="node-sub">NetworkClient to Broker</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Broker Invariant</span>
            <span class="node-label">PID + SeqNumber</span>
            <span class="node-sub">Deduplicates Retries!</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "RecordAccumulator & MemoryPool: Messages are placed into 16KB `ProducerBatch` buffers inside `RecordAccumulator`. Reusable memory blocks (`buffer.memory=32MB`) avoid JVM garbage collection churn.",
      "The Batching Equation: `linger.ms` (e.g. 10-20ms) allows the producer to wait slightly so more records accumulate into `batch.size` (e.g. 32KB-64KB). Under heavy load, batching increases network throughput by 10x-50x.",
      "Partitioning Strategy: If a key is present, default is Murmur2 hash `hash(key) % numPartitions`. If key is null, Kafka 2.4+ uses `UniformStickyPartitioner`, batching records to one partition until full before switching, reducing latency.",
      "Idempotent Producer (`enable.idempotence=true`): Broker assigns a 64-bit `PID` (Producer ID) upon init. Each batch carries a monotonically increasing `SequenceNumber`. If the broker receives a duplicate sequence number (e.g. due to retry on network timeout), it writes the ACK but discards the duplicate record in the log!",
      "Max In-Flight Invariant: Even with `max.in.flight.requests.per.connection=5`, idempotence prevents out-of-order writes because the broker buffers out-of-order sequence numbers in memory until the missing sequence arrives."
    ],
    codeSnippet: `// Production Enterprise Idempotent & Resilient Producer Config
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka-1:9092,kafka-2:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class.getName());

// 1. Durability & Idempotence Triad:
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");      // Guarantees no duplicates & in-order
props.put(ProducerConfig.ACKS_CONFIG, "all");                     // Waits for full ISR commit
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);      // Retry indefinitely on ephemeral errors
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, "5"); // Safe with idempotence!

// 2. High-Throughput Batching Tuning:
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 64 * 1024);           // 64 KB batches
props.put(ProducerConfig.LINGER_MS_CONFIG, 20);                   // Wait up to 20ms to batch records
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");      // Snappy or zstd: 60%+ network compression

Producer<String, OrderEvent> producer = new KafkaProducer<>(props);`,
    pitfall: "Setting `acks=all` without enabling idempotence or setting `max.in.flight.requests.per.connection > 1`. If Batch 1 fails and retries while Batch 2 succeeds, Batch 2 is committed before Batch 1, causing silent out-of-order corruption!",
    interviewTip: "Always mention that starting in Kafka 3.0, `enable.idempotence=true` and `acks=all` are enabled by default on Java producers."
  },

  {
    id: "kafka-consumer-rebalance-cooperative",
    title: "Consumer Internals: Rebalance Protocol, Heartbeats & CooperativeSticky",
    category: "Consumer Architecture",
    badge: "Senior Systems",
    oneLiner: "Heartbeat threads run independently of poll loops; CooperativeStickyAssignor replaces legacy stop-the-world eager rebalances with smooth incremental migration.",
    summary: "In a consumer group, partitions are assigned among members by a designated Group Coordinator broker. Traditionally, any consumer joining, dying, or taking too long triggered an 'Eager Rebalance', which revoked all partitions across all consumers, pausing all consumption. The modern 'Cooperative Sticky' protocol introduces incremental 2-phase rebalances where only re-assigned partitions pause, while unaffected consumers continue processing uninterrupted.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Eager Rebalance vs Cooperative Sticky Rebalance</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #ef4444;">❌ Eager Protocol (Stop-The-World)</div>
            <div class="space-desc">1 Pod restarts ➔ ALL 50 Pods revoke ALL partitions ➔ Zero processing for 30s!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">✅ CooperativeSticky (Incremental KIP-429)</div>
            <div class="space-desc">Phase 1: Revoke only moved partitions ➔ Phase 2: Assign moved partitions. 48 Pods keep processing!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Background Thread</span>
            <span class="node-label">HeartbeatThread</span>
            <span class="node-sub">heartbeat.interval.ms (3s)</span>
          </div>
          <div class="flow-arrow-node">vs</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">User Application</span>
            <span class="node-label">poll() Loop</span>
            <span class="node-sub">max.poll.interval.ms (300s)</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Decoupled Heartbeat vs Polling: The background `HeartbeatThread` sends heartbeats to the Group Coordinator every `heartbeat.interval.ms` (default 3s). If the broker misses heartbeats for `session.timeout.ms` (45s), the consumer is marked dead (e.g. process crash or machine failure).",
      "The Zombie Consumer Trap: If the main thread's message processing takes longer than `max.poll.interval.ms` (default 5 min), the consumer is deemed a zombie and ejected from the group—even if its heartbeat thread is still alive!",
      "CooperativeStickyAssignor (KIP-429): Replaces `RangeAssignor`. Instead of revoking all partitions during rebalance, consumers continue working on unaffected partitions. Only migrated partitions are revoked and assigned in a seamless two-round handshake.",
      "Commit Strategies: Auto-commit (`enable.auto.commit=true`) risks duplicate processing or data loss if crashes happen between poll intervals. Senior systems use manual immediate acknowledgment (`AckMode.MANUAL_IMMEDIATE`) paired with idempotent business keys.",
      "Partition Lag Formula: `Lag = HighWatermark (HW) - CurrentCommittedOffset`. Monitored via Prometheus `kafka_consumergroup_lag`."
    ],
    codeSnippet: `// Spring Boot Kafka Listener with CooperativeSticky & Manual Immediate ACK
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, OrderEvent> consumerFactory) {
        
        ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        
        // 1. Manual Immediate Acknowledgment (Zero Data Loss)
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        
        // 2. Set Concurrency equal to partition count
        factory.setConcurrency(6);
        return factory;
    }
}

// Consumer Component with CooperativeSticky Assignor in application.yml:
// spring.kafka.consumer.properties.partition.assignment.strategy: \\
//    org.apache.kafka.clients.consumer.CooperativeStickyAssignor
@Component
public class OrderConsumer {

    @KafkaListener(topics = "orders-topic", groupId = "order-processing-group")
    public void consume(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
        try {
            processOrder(record.value());
            ack.acknowledge(); // Explicit offset commit after DB write
        } catch (TransientException e) {
            throw e; // Triggers non-blocking retry or error handler
        }
    }
}`,
    pitfall: "Running slow REST API calls or heavy batch database operations synchronously inside `@KafkaListener` without tuning `max.poll.interval.ms` or `max.poll.records`. When processing exceeds 5 minutes, a rebalance storm brings down the whole consumer group.",
    interviewTip: "Always explain the difference between `session.timeout.ms` (handled by the heartbeat background thread) and `max.poll.interval.ms` (handled by the main application execution loop)."
  },

  {
    id: "kafka-replication-isr-leader-epochs",
    title: "Replication Internals: ISR, High Watermark & Leader Epochs (KIP-101)",
    category: "Consensus & Replication",
    badge: "Principal Architect",
    oneLiner: "In-Sync Replicas (ISR) track the leader within lag limits; Leader Epochs eliminate the legacy High Watermark truncation bug that caused silent replica divergence.",
    summary: "Kafka replicates partitions across brokers using a primary-backup model. One broker is designated Partition Leader, and remaining brokers are Follower Replicas. The leader maintains the ISR (In-Sync Replicas) list. A message is considered committed once written to all ISR members up to the High Watermark (HW). In earlier Kafka versions, recovering replicas truncated their logs to their local HW upon restart, leading to silent data loss and replica divergence upon leader crashes. KIP-101 introduced Leader Epochs to completely solve this flaw.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 High Watermark (HW), Log End Offset (LEO) & Leader Epoch</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Leader Broker</span>
            <span class="node-label">LEO: 105</span>
            <span class="node-sub">HW: 100 (Committed)</span>
          </div>
          <div class="flow-arrow-node">Replicates ➔</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Follower 1 (ISR)</span>
            <span class="node-label">LEO: 100</span>
            <span class="node-sub">In-Sync (lag &lt; 30s)</span>
          </div>
          <div class="flow-arrow-node">Replicates ➔</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">Follower 2 (Out of ISR)</span>
            <span class="node-label">LEO: 60</span>
            <span class="node-sub">Lagging &gt; replica.lag.time</span>
          </div>
        </div>
        <div class="diagram-header-label" style="margin-top: 14px;">🛡️ The Zero-Loss Banking Formula:</div>
        <div style="font-size: 0.82rem; color: var(--text-primary); text-align: center; font-family: var(--font-mono);">
          Replication Factor = 3 &nbsp;|&nbsp; min.insync.replicas = 2 &nbsp;|&nbsp; acks = all &nbsp;|&nbsp; unclean.leader.election = false
        </div>
      </div>
    `,
    keyPoints: [
      "LEO vs HW: `LEO` (Log End Offset) is the offset of the next record to be written in a replica. `HW` (High Watermark) is the highest offset replicated across ALL replicas currently in the ISR. Consumers can ONLY read up to the High Watermark.",
      "ISR Eviction Rule: If a follower fails to send a fetch request within `replica.lag.time.max.ms` (default 30s), the leader evicts it from ISR. The broker notifies the KRaft controller to update metadata.",
      "The Legacy HW Truncation Flaw: In Kafka < 0.11, when a crashed follower rebooted, it truncated its log to its stored HW before fetching from the leader. If the leader then crashed, un-replicated messages were silently deleted or overwritten with divergent records.",
      "Leader Epochs Solution (KIP-101): Each log segment directory stores a `leader-epoch-checkpoint` file with `(epoch, start_offset)` tuples. When a follower reboots, instead of truncating to HW, it asks the current leader: 'What was your end offset for Epoch X?' The leader returns the exact boundary, preventing data truncation.",
      "Unclean Leader Election (`unclean.leader.election.enable`): If all ISR nodes crash, setting this to `true` allows an out-of-sync replica to become leader, choosing Availability over Consistency (causing data loss). In banking and commerce, it MUST ALWAYS be `false`."
    ],
    codeSnippet: `// Zero Data Loss Production Topic Configuration:
kafka-topics.sh --bootstrap-server kafka-1:9092 \\
  --create --topic critical-payments \\
  --partitions 12 \\
  --replication-factor 3 \\
  --config min.insync.replicas=2 \\
  --config unclean.leader.election.enable=false

// Inspecting Leader Epoch Checkpoint file on broker disk:
// Path: /var/lib/kafka/data/critical-payments-0/leader-epoch-checkpoint
// File Content:
// 0           <- format version
// 2           <- number of entries
// 0  0        <- epoch 0 started at offset 0
// 1  10420    <- epoch 1 started at offset 10420 (new leader elected!)`,
    pitfall: "Setting `min.insync.replicas=1` while using `acks=all`. If 2 of the 3 brokers go down for maintenance, the ISR shrinks to 1. The remaining broker accepts writes and commits them. If that broker suffers hardware failure, those writes are lost forever despite `acks=all`!",
    interviewTip: "State clearly: '`acks=all` only guarantees writes to the current ISR. True zero loss requires `acks=all` PLUS `min.insync.replicas=2` and `replication.factor=3`.'"
  },

  {
    id: "kafka-resilience-dlq-outbox",
    title: "Enterprise Resilience: Non-Blocking Retries, DLQ & Transactional Outbox",
    category: "Distributed Architecture",
    badge: "Production Battle-Tested",
    oneLiner: "Avoid head-of-line blocking using progressive delayed retry topics (@RetryableTopic); eliminate DB-Kafka dual-write inconsistencies using the Transactional Outbox Pattern.",
    summary: "In mission-critical enterprise systems, two massive challenges arise: 1) The Dual-Write Problem (saving to a relational database and publishing to Kafka without distributed transactions risks data drift); 2) Poison Pills & Head-of-Line Blocking (retrying a failing message synchronously halts the entire partition). Senior architectures solve these with the Transactional Outbox Pattern (CDC via Debezium) and Non-Blocking Delayed Retry Topics with Dead Letter Queues (DLQ).",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Transactional Outbox & Non-Blocking Retry Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Local ACID Txn</span>
            <span class="node-label">Postgres DB</span>
            <span class="node-sub">Orders + Outbox Table</span>
          </div>
          <div class="flow-arrow-node">pg_wal CDC ➔</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Kafka Connect</span>
            <span class="node-label">Debezium CDC</span>
            <span class="node-sub">Reads WAL &amp; Publishes</span>
          </div>
          <div class="flow-arrow-node">➔</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Kafka Topic</span>
            <span class="node-label">orders-topic</span>
            <span class="node-sub">Zero Dual-Write Loss!</span>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 12px;">
          <div class="flow-step-node node-orange">
            <span class="node-badge">Main Consumer</span>
            <span class="node-label">orders</span>
            <span class="node-sub">Fails ➔ Commit Offset</span>
          </div>
          <div class="flow-arrow-node">➔ Forward ➔</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Retry Topic 1</span>
            <span class="node-label">orders-retry-5s</span>
            <span class="node-sub">Delayed Consumer</span>
          </div>
          <div class="flow-arrow-node">➔ Forward ➔</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">Dead Letter Queue</span>
            <span class="node-label">orders-dlt</span>
            <span class="node-sub">Alerting + Manual Triage</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Dual-Write Hazard: Writing to Postgres and Kafka in one API call is not atomic. If DB commits but Kafka network drops, events are lost. If Kafka sends first but DB rolls back, ghost events are published.",
      "Transactional Outbox Solution: Save the business entity and an `outbox_record` in the same Postgres transaction. A CDC connector (Debezium) streams the Postgres WAL (`pg_wal`) directly into Kafka with guaranteed at-least-once delivery.",
      "Head-of-Line Blocking Trap: Sleeping inside a consumer to retry a failed third-party API call blocks all healthy records in that partition from progressing.",
      "Non-Blocking Delayed Retry Topics: Forward the failed message to `orders-retry-5s`, then `orders-retry-30s`, and commit the main topic offset immediately! Other customer orders proceed without interruption.",
      "ErrorHandlingDeserializer: Catches malformed JSON / poisoned byte payloads in the consumer deserialization layer before `poll()` throws, routing the bad payload directly to the DLT without crashing the pod."
    ],
    codeSnippet: `// Spring Kafka Non-Blocking Retry with Exponential Backoff & DLT Handler
@Component
public class PaymentProcessingListener {

    @RetryableTopic(
        attempts = "4",
        backoff = @Backoff(delay = 1000, multiplier = 2.0, maxDelay = 10000),
        autoCreateTopics = "true",
        include = { TransientApiException.class, SocketTimeoutException.class },
        exclude = { InvalidPaymentException.class } // Fatal errors go straight to DLT
    )
    @KafkaListener(topics = "payments-topic", groupId = "payment-settlement-group")
    public void processPayment(PaymentEvent event) {
        log.info("Processing payment for transaction: {}", event.transactionId());
        paymentGatewayClient.authorize(event); // May throw TransientApiException
    }

    // Dead Letter Topic Handler (Alerts & Ops Dashboard)
    @DltHandler
    public void handleDlt(PaymentEvent event, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.error("PAYMENT EXHAUSTED ALL RETRIES! Routed to DLT: {}. Event: {}", topic, event);
        pagerDutyService.triggerIncident("PaymentProcessingFailed", event.transactionId());
    }
}`,
    pitfall: "Using in-memory retries (`DefaultErrorHandler` with fixed backoff) for long outages (e.g. 10 minutes). This blocks the partition consumer thread, eventually triggering `max.poll.interval.ms` timeout and throwing the entire consumer group into a rebalance storm!",
    interviewTip: "Highlight the Transactional Outbox pattern as the industry-standard solution for Microservices Dual-Write, and Spring's `@RetryableTopic` for non-blocking partitioned retries."
  }
];

window.REVISION_APP_DATA.KAFKA_QUESTIONS = [
  {
    id: "kafka-scen-1",
    title: "1. The Zombie Consumer & Rebalance Storm (Stop-the-World GC & Slow External API)",
    difficulty: "Senior",
    category: "Rebalance & Polling Internals",
    summary: "A consumer processing a batch of payment authorizations encounters slow 3rd-party gateway response times. Total batch time hits 6 minutes, exceeding `max.poll.interval.ms` (5 mins). Group Coordinator assumes consumer died, kicks it out, and triggers a rebalance. The partition is reassigned to Consumer B, which also hits the 6-minute timeout, triggering another rebalance. The entire consumer group enters a perpetual rebalance storm where zero messages get processed!",
    problem: "A high-throughput payment consumer group begins cascading rebalance storms every few minutes. Logs show `CommitFailedException` and `Consumer coordinator ... marked member as dead`. Downstream consumers repeatedly crash and rebalance, causing consumer lag to climb into the millions while CPU sits at 15%.",
    juniorTrap: "Assuming the consumer process actually crashed or died, and simply restarting the Kubernetes pod or increasing CPU/RAM limits.",
    interviewerIntent: "Evaluates whether the candidate understands the critical decoupling between `heartbeat.interval.ms` (background thread) and `max.poll.interval.ms` (main processing loop), batch sizing, and how slow downstream processing triggers cascading rebalances.",
    seniorAnswer: [
      "Root Cause: The heartbeat background thread was alive, but the main application thread spent > 300,000ms (5 minutes) executing slow external calls on a batch of 500 records. Because `poll()` was not called within `max.poll.interval.ms`, the Group Coordinator declared the consumer a 'zombie' and evicted it from the group.",
      "Cascading Failure: The coordinator reassigns the uncommitted partition to Consumer B. Consumer B attempts to process the exact same 500 records, also times out after 6 minutes, gets evicted, and triggers another rebalance—cascading across all nodes in the cluster.",
      "Immediate Resolution 1: Decrease `max.poll.records` from 500 to 50, ensuring any batch can easily finish within 60 seconds even during downstream latency spikes.",
      "Immediate Resolution 2: Increase `max.poll.interval.ms` to safely exceed worst-case batch latency (e.g. 600,000ms / 10 minutes).",
      "Architectural Long-Term Fix: Decouple message polling from execution: use an internal worker thread pool or Parallel Consumer, and adopt `CooperativeStickyAssignor` to avoid stop-the-world partition revoking."
    ],
    innerWorking: "Kafka 0.10.1+ runs heartbeats on a separate daemon thread. But `max.poll.interval.ms` tracks the timer between successive invocations of `KafkaConsumer.poll()`. If the timer expires before the next poll, the client sends a `LeaveGroup` request and throws `CommitFailedException` when the thread finally tries to commit offsets.",
    solution: `// Spring Boot Application Configuration Fix:
spring:
  kafka:
    consumer:
      max-poll-records: 50 # Reduced from default 500
      properties:
        max.poll.interval.ms: 600000 # 10 Minutes (comfortably above max batch latency)
        session.timeout.ms: 45000     # 45 Seconds for heartbeat failure detection
        heartbeat.interval.ms: 10000  # 10 Seconds (1/3 of session timeout)
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor`,
    warStory: "During a Black Friday spike, a merchant payment gateway latency jumped from 80ms to 900ms. With 500 records per poll, a batch took 450 seconds (7.5 mins). All 12 consumer pods simultaneously got evicted for missing `max.poll.interval.ms`, creating a 4-hour rebalance loop that took down order processing until `max-poll-records` was hotfixed to 25."
  },

  {
    id: "kafka-scen-2",
    title: "2. Silent Data Loss with acks=all (The min.insync.replicas=1 Trap)",
    difficulty: "Staff / Architect",
    category: "Data Loss & Replication",
    summary: "Team configured `acks=all` thinking zero data loss is guaranteed. During rolling restart, broker 1 is leader, broker 2 & 3 are restarting. Broker 1 accepts message, commits, then immediately suffers hardware kernel panic. Message lost! Why?",
    problem: "A banking application team is furious: a customer fund deposit disappeared after a cluster rolling restart, despite producer setting `acks=all` (`-1`). Prometheus metrics show the producer received an HTTP 200 SUCCESS acknowledgment for the message, yet the message does not exist on any broker disk after reboot.",
    juniorTrap: "Believing that `acks=all` waits for ALL replicas across the entire cluster. It does NOT!",
    interviewerIntent: "Tests deep knowledge of the In-Sync Replicas (ISR) dynamic protocol and the relationship between `acks=all` and `min.insync.replicas`.",
    seniorAnswer: [
      "`acks=all` strictly means: 'Wait for acknowledgment from all replicas currently present in the ISR (In-Sync Replicas) list.'",
      "If Brokers 2 and 3 are restarting or down for patching, the Leader (Broker 1) detects their absence and shrinks the ISR to just `[Broker 1]`.",
      "Because `min.insync.replicas` was left at default `1`, Broker 1 satisfies the condition all by itself! It writes to its local log and immediately returns SUCCESS to the producer.",
      "When Broker 1 suffered a kernel panic before Brokers 2 and 3 resumed replication, the only copy of that record was destroyed.",
      "The Production Rule: For true durability, you MUST set `replication.factor=3`, `min.insync.replicas=2`, and `acks=all`. If the ISR shrinks below 2, the broker will fail the write with `NotEnoughReplicasException`, preventing false success."
    ],
    innerWorking: "The partition leader evaluates: `if (current_isr.size < topic.min_insync_replicas) throw NotEnoughReplicasException()`. If `min.insync.replicas` is 1, a single surviving leader writes alone with `acks=all` degenerating to `acks=1`.",
    solution: `// Enforcing Zero Data Loss Invariants via Topic Configuration:
kafka-topics.sh --bootstrap-server kafka:9092 --alter \\
  --topic bank-transactions \\
  --config min.insync.replicas=2

// Producer Retry Logic to Handle NotEnoughReplicasException:
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 250);`,
    warStory: "An online brokerage had a 3-node Kafka cluster with default `min.insync.replicas=1`. During a routine Linux kernel security patch rolling reboot, a hypervisor host crashed while holding partition leadership. 42 stock trade execution events were lost forever because the producer thought `acks=all` guaranteed multi-broker replication."
  },

  {
    id: "kafka-scen-3",
    title: "3. Out-of-Order Delivery During Retries with Multiple In-Flight Requests",
    difficulty: "Senior",
    category: "Ordering Guarantees",
    summary: "Producer sends Batch 1 then Batch 2 for user 101. Network timeout on Batch 1. Batch 2 succeeds. Producer retries Batch 1, which lands after Batch 2! How to prevent this without bottlenecking throughput to 1 request at a time?",
    problem: "An e-commerce order workflow requires strict sequential processing per order (`CREATED` ➔ `PAID` ➔ `SHIPPED`). The producer retried a failed batch during a network blip. As a result, the `SHIPPED` event arrived at offset 200 before the `PAID` event at offset 201, crashing downstream order fulfillment state machines.",
    juniorTrap: "Setting `max.in.flight.requests.per.connection=1`. While this prevents out-of-order retries, it cripples producer throughput by forcing synchronous stop-and-wait network round trips.",
    interviewerIntent: "Evaluates understanding of `enable.idempotence=true`, `PID`, monotonic sequence numbers, and broker-side deduplication/reordering buffers.",
    seniorAnswer: [
      "Root Cause: With `max.in.flight.requests.per.connection = 5`, the client pipeline sends Request A and Request B concurrently. If Request A drops on the wire but Request B succeeds, the broker commits B. The client retries A, which writes after B, inverting the order.",
      "The Solution: Enable `enable.idempotence=true` (enabled by default in Kafka 3.0+).",
      "Under the Hood: The broker assigns each producer instance a 64-bit Producer ID (`PID`). For every partition, the producer tags batches with monotonically increasing `SequenceNumber` (0, 1, 2, ...).",
      "Broker Invariant: The broker only commits a batch if its sequence number is exactly `last_committed_seq + 1`. If it receives Sequence 2 before Sequence 1, the broker buffers Sequence 2 in memory and waits for Sequence 1. If it receives a duplicate Sequence 1 on retry, it writes the ACK but discards the duplicate record!"
    ],
    innerWorking: "The broker maintains the last 5 sequence numbers per PID per partition in memory and appends them to the segment index. If `incoming_seq <= last_seq`, it's an idempotent duplicate. If `incoming_seq == last_seq + 1`, it is accepted. If `incoming_seq > last_seq + 1`, broker throws `OutOfOrderSequenceException`.",
    solution: `// Idempotent In-Order Producer Configuration:
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka:9092");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true"); // Mandates acks=all & retries=MAX
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, "5"); // High throughput + strict ordering!
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class.getName());`,
    warStory: "A delivery tracking app saw rider GPS updates jumping backward in time. A driver appeared in New York, then New Jersey, then New York 5 seconds later. Network retries without idempotence were inverting GPS ping batches."
  },

  {
    id: "kafka-scen-4",
    title: "4. Hot Partition Skew (The Celebrity Problem in E-commerce)",
    difficulty: "Staff / Architect",
    category: "Partitioning & Throughput",
    summary: "16 partitions, but 1 merchant generates 85% of orders. Partition 4 has massive lag and disk exhaustion, while 15 partitions sit idle at 2% utilization. How to fix?",
    problem: "A SaaS multi-tenant logistics platform partitions events by `tenant_id`. A massive enterprise customer ('MegaCorp') joins the platform. Partition 7 is overwhelmed with 15,000 msg/sec, consumer lag hits 2 million, and broker disk is 92% full. The other 15 partitions process 50 msg/sec and sit completely idle.",
    juniorTrap: "Adding more partitions or adding more consumer pods to the consumer group. (If all MegaCorp records use key `'MegaCorp'`, `hash('MegaCorp') % numPartitions` will ALWAYS land on the exact same single partition!)",
    interviewerIntent: "Assesses understanding of the Murmur2 hashing algorithm, key design, consumer concurrency limits, and architectural mitigation techniques for skewed keys.",
    seniorAnswer: [
      "Why Scaling Fails: Adding partitions does not redistribute records with the exact same key. Murmur2 hashing is deterministic: identical keys map to the identical partition.",
      "Strategy 1: Composite Key Salting: For skewed keys, append a random salt: `tenantId + '_' + (ThreadLocalRandom.current().nextInt(8))`. This evenly spreads MegaCorp's traffic across 8 designated partitions.",
      "Strategy 2: Multi-Tier Topic Architecture: Low-volume tenants route to a shared 16-partition topic. MegaCorp routes to a dedicated high-throughput 64-partition topic (`orders.megacorp`).",
      "Strategy 3: Custom Partitioner: Implement `Partitioner` to detect high-frequency keys and dynamically distribute them in round-robin, while hashing normal keys deterministically."
    ],
    innerWorking: "Default partitioner calculates: `Utils.toPositive(Utils.murmur2(keyBytes)) % numPartitions`. When key is identical, partition index never changes.",
    solution: `// Key Salting Implementation in Producer:
public class OrderEventProducer {
    public void sendOrder(String tenantId, Order order) {
        String partitionKey = tenantId;
        
        // Salt hot tenants across 8 partitions
        if ("MEGACORP_ID".equals(tenantId)) {
            int salt = ThreadLocalRandom.current().nextInt(8);
            partitionKey = tenantId + "_" + salt;
        }
        
        kafkaTemplate.send("orders-topic", partitionKey, order);
    }
}`,
    warStory: "During an Amazon Prime Day integration, an electronics retailer routed all SKU updates keyed by brand name. The brand 'Sony' saturated partition 3, causing a 6-hour backlog that delayed pricing updates while the other 31 partitions sat at 0 lag."
  },

  {
    id: "kafka-scen-5",
    title: "5. Poison Pill & Deserialization Infinite Crash Loop",
    difficulty: "Senior",
    category: "Consumer Error Handling",
    summary: "Upstream producer pushes an invalid Protobuf/JSON payload. Downstream consumer's poll() throws SerializationException, preventing offset commit. Pod crashes, restarts, polls same poison pill, and loops forever!",
    problem: "A Kafka consumer pod crashes with `SerializationException: Can't deserialize data on offset 42`. Kubernetes restarts the container. On boot, the consumer polls offset 42 again, crashes immediately, and enters a `CrashLoopBackOff` state. Entire partition consumption is halted.",
    juniorTrap: "Catching the exception inside the `@KafkaListener` business method. (The exception is thrown inside `poll()` during deserialization BEFORE your listener method is ever called!)",
    interviewerIntent: "Tests whether the engineer understands where deserialization occurs in the Kafka client lifecycle and how to configure `ErrorHandlingDeserializer` with Dead Letter Topics.",
    seniorAnswer: [
      "Root Cause: Deserialization occurs inside `KafkaConsumer.poll()`, not in the business method. If Jackson/Avro/Protobuf fails to parse bytes, `poll()` throws `SerializationException`. The consumer thread dies before committing, leaving the offset pointing at the corrupt record.",
      "The Solution: Spring Kafka's `ErrorHandlingDeserializer`.",
      "How it Works: Instead of throwing an exception, `ErrorHandlingDeserializer` wraps the deserialization failure in a `DeserializationException` record and places it in the record headers, returning a record with `null` value.",
      "Recovery: The `CommonErrorHandler` (e.g. `DefaultErrorHandler` paired with `DeadLetterPublishingRecoverer`) intercepts this header, publishes the raw unparseable bytes to an `orders.DLT` topic, and commits the consumer offset past the poison pill!"
    ],
    innerWorking: "The delegate deserializer throws an exception which `ErrorHandlingDeserializer` captures, storing deserialization exception metadata in `DeserializationException.HEADER_NAME` headers so downstream interceptors can triage without crashing the poll loop.",
    solution: `// Spring Boot application.yml Configuration:
spring:
  kafka:
    consumer:
      key-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.key.delegate.class: org.apache.kafka.common.serialization.StringDeserializer
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
        spring.json.trusted.packages: "com.company.models.*"

// ErrorHandler Bean routing to DLT:
@Bean
public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    return new DefaultErrorHandler(
        new DeadLetterPublishingRecoverer(template), 
        new FixedBackOff(0L, 0L) // Route poison pills to DLT immediately
    );
}`,
    warStory: "A legacy Python script pushed raw ASCII text 'PING' to an orders topic expecting JSON payloads. 6 Java microservices crashed simultaneously into infinite restart loops. It took 45 minutes to manually advance consumer group offsets using `kafka-consumer-groups.sh --reset-offsets --shift-by 1`."
  },

  {
    id: "kafka-scen-6",
    title: "6. Consumer Lag Spike When Consumer Count Already Equals Partition Count",
    difficulty: "Staff / Architect",
    category: "Scaling & Concurrency",
    summary: "Consumer lag hits 8 million. Adding new consumer pods does nothing because consumer pod count already equals partition count (16 pods for 16 partitions). How to scale?",
    problem: "During a flash sale, lag on `order-fulfillment` reaches 8 million messages. The DevOps team scales the Kubernetes Deployment from 16 replicas to 32 replicas. However, lag continues to rise at the exact same rate. `kubectl` shows 16 pods consuming, and 16 pods completely idle.",
    juniorTrap: "Believing that Kafka allows multiple consumers in the SAME group to share a partition. It is physically impossible by design!",
    interviewerIntent: "Assesses deep knowledge of the 1:1 partition-to-consumer assignment rule, partition scaling constraints, and client-side parallel concurrency solutions.",
    seniorAnswer: [
      "The Invariant: In a single consumer group, a partition can ONLY be assigned to ONE consumer instance at a time. Consumers beyond partition count remain completely idle.",
      "Solution 1: Dynamic Partition Expansion: Run `kafka-topics.sh --alter --topic orders --partitions 32`. Caveat: Existing key hashing order breaks for new keys; historical order is only preserved within original partitions.",
      "Solution 2: Parallel Consumer Pattern (`org.apache.kafka:parallel-consumer`): A single partition is read by one consumer thread, which dispatches records into an in-memory thread pool keyed by `orderId`. This allows 50+ concurrent worker threads per partition while strictly preserving ordering per key!",
      "Solution 3: Batch Processing & Vectorized DB Writes: Switch from single-row JDBC inserts to `batch` processing: consume 100 records per poll and execute `INSERT ... ON CONFLICT DO UPDATE` in bulk."
    ],
    innerWorking: "The Partition Assignment Strategy (e.g. `RangeAssignor` or `CooperativeStickyAssignor`) divides partitions among group members: `numPartitions / numConsumers`. If `numConsumers > numPartitions`, remaining members receive an empty assignment list `[]`.",
    solution: `// Using Parallel Consumer for 100x Concurrency per Partition:
ParallelStreamProcessor<String, OrderEvent> parallelConsumer = 
    ParallelConsumerOptions.<String, OrderEvent>builder()
        .ordering(ParallelConsumerOptions.ProcessingOrder.KEY) // Strict ordering per key!
        .maxConcurrency(64) // 64 concurrent threads per pod
        .consumer(kafkaConsumer)
        .build();

parallelConsumer.poll(context -> {
    processOrder(context.getSingleRecord().value());
});`,
    warStory: "An insurance claims processor was limited to 8 partitions. Each claim took 1.2 seconds to process via an external PDF OCR engine. Lag reached 3 days during Hurricane Ian. Implementing key-based parallel consumer in each pod increased throughput from 6 claims/sec to 380 claims/sec without altering Kafka partition count."
  },

  {
    id: "kafka-scen-7",
    title: "7. Distributed Dual-Write Problem (Postgres DB vs Kafka Inconsistency)",
    difficulty: "Staff / Architect",
    category: "Distributed Transactions",
    summary: "Service saves Order to Postgres and sends OrderCreated to Kafka. If DB commits but Kafka network fails, event is lost. If Kafka sends first but DB transaction rollbacks, ghost event fires! Fix?",
    problem: "A fintech startup notices that 0.05% of paid orders in Postgres never triggered inventory deduction events in Kafka. Code review reveals: `@Transactional public void checkout() { db.save(); kafka.send(); }`. If the Kafka broker times out, the client gets an error, but the DB already committed; if Kafka succeeds but DB fails on commit, ghost events are published.",
    juniorTrap: "Wrapping the Kafka send and DB call inside a single Spring `@Transactional` and assuming two-phase commit works automatically.",
    interviewerIntent: "Tests mastery of the Dual-Write distributed systems hazard and the Transactional Outbox Pattern with Change Data Capture (CDC).",
    seniorAnswer: [
      "The Dual-Write Anti-Pattern: A single machine cannot atomically commit to two separate distributed storage systems (Postgres and Kafka) without expensive 2-Phase Commit (XA transactions, which Kafka does not support with external DBs).",
      "The Solution: **Transactional Outbox Pattern**.",
      "Architecture: 1) Within the SAME local Postgres ACID transaction, save the `Order` entity and write an event record into an `outbox_events` table; 2) A Change Data Capture (CDC) engine like **Debezium** tailing Postgres Write-Ahead Logs (`pg_wal`) streams outbox records directly into Kafka; 3) Zero dual-write hazard: if the DB transaction commits, the outbox record is guaranteed to exist; if it rolls back, no outbox record exists!",
      "Alternative for lighter stacks: A scheduled polling worker (`SELECT ... FOR UPDATE SKIP LOCKED`) publishing to Kafka and marking rows as processed."
    ],
    innerWorking: "Debezium connects to Postgres via replication slots (`pgoutput`). It reads transaction commit records directly from disk WAL logs, guaranteeing at-least-once delivery to Kafka without application-level network dual-writes.",
    solution: `// Transactional Outbox Pattern in Spring Boot:
@Service
public class OrderService {

    @Autowired private OrderRepository orderRepo;
    @Autowired private OutboxRepository outboxRepo;

    @Transactional // Pure Local Postgres ACID Transaction!
    public Order createOrder(CreateOrderRequest req) {
        Order order = orderRepo.save(new Order(req));
        
        OutboxEvent event = new OutboxEvent(
            "ORDER_CREATED", 
            order.getId().toString(), 
            toJson(new OrderCreatedPayload(order))
        );
        outboxRepo.save(event); // Written to same DB transaction!
        
        return order;
    }
}
// Debezium Kafka Connect automatically streams outbox_events to Kafka!`,
    warStory: "An online crypto exchange sent withdrawal confirmation emails via Kafka inside a DB transaction. A unique index constraint violation rolled back the Postgres withdrawal, but the Kafka message had already been pushed over the wire. Users received confirmation emails for withdrawals that never occurred, flooding customer support."
  },

  {
    id: "kafka-scen-8",
    title: "8. Non-Blocking Retries vs Head-of-Line Partition Blocking",
    difficulty: "Senior",
    category: "Resilience & Retry Architecture",
    summary: "Payment consumer fails because bank API returns 503 (30s downtime). Retrying in-place blocks the partition, stalling 50,000 unaffected customers behind it. How to build non-blocking retries?",
    problem: "When processing payment events, a third-party bank gateway goes down for 2 minutes. The consumer code catches `Http503Exception`, sleeps for 10 seconds, and retries in-place up to 5 times. As a result, all 40,000 other customers whose payments use different banks on that partition are completely blocked.",
    juniorTrap: "Putting `Thread.sleep()` inside the listener or using synchronous retry templates that block the partition consumer thread.",
    interviewerIntent: "Evaluates knowledge of partition head-of-line blocking and how to design multi-tier delayed retry topics (`@RetryableTopic`) with Dead Letter Queues.",
    seniorAnswer: [
      "The Inherent Partition Constraint: A partition is a sequential log. If consumer pauses at offset 100, offsets 101-50,000 cannot be consumed without advancing the offset.",
      "The Solution: **Non-Blocking Retry Topics Ladder**.",
      "Mechanics: When an ephemeral failure occurs on `orders-topic`, immediately publish the failed record to a delayed retry topic: `orders-retry-1m`, and commit offset 100 on the main topic immediately!",
      "The main consumer proceeds to process offset 101 without delay.",
      "A dedicated retry listener consumes from `orders-retry-1m`. If it fails again, it forwards to `orders-retry-5m`, and finally to `orders-dlq`.",
      "Spring Kafka provides this out of the box using `@RetryableTopic` with backoff multiplier and DLT routing."
    ],
    innerWorking: "Spring's `@RetryableTopic` creates internal topics `topic-retry-1000`, `topic-retry-2000`, etc., using custom headers (`kafka_original-offset`, `kafka_retry-count`) and delays consumption via container pause/resume without blocking the primary topic.",
    solution: `// Spring Boot Non-Blocking Retry Architecture:
@Component
public class PaymentOrderConsumer {

    @RetryableTopic(
        attempts = "4",
        backoff = @Backoff(delay = 2000, multiplier = 2.0, maxDelay = 15000),
        autoCreateTopics = "true",
        include = { BankUnavailableException.class, TimeoutException.class }
    )
    @KafkaListener(topics = "payments-topic", groupId = "payments-group")
    public void process(PaymentEvent event) {
        bankGateway.process(event); // Fails ➔ Forwarded to retry topic, main topic advances!
    }

    @DltHandler
    public void onDlt(PaymentEvent event, @Header(KafkaHeaders.ORIGINAL_OFFSET) long offset) {
        log.error("Payment definitively failed at original offset {}: {}", offset, event);
    }
}`,
    warStory: "A flight booking engine processed seat selections. One airline's reservation API timed out for 4 minutes. Because the consumer retried synchronously in a while-loop, seat reservations for 80 other airlines on the same partition were blocked, causing passengers' session carts to expire."
  },

  {
    id: "kafka-scen-9",
    title: "9. High Watermark Truncation Bug & Why Leader Epochs Were Introduced (KIP-101)",
    difficulty: "Staff / Architect",
    category: "Replication Internals",
    summary: "Why did older Kafka versions with ZooKeeper suffer silent data loss after replica power cycles, and how did Leader Epochs (KIP-101) eliminate this bug?",
    problem: "In an architectural interview, the principal architect asks: 'In Kafka 0.10, two brokers A and B are in ISR. Both wrote message X at offset 10, but Broker B crashed before receiving the updated High Watermark. Explain how a subsequent crash of Broker A caused message X to be permanently lost or divergent, and how Leader Epochs solved it.'",
    juniorTrap: "Stating that High Watermark alone is sufficient to prevent replica divergence.",
    interviewerIntent: "Assesses deep knowledge of the KIP-101 Leader Epoch specification, log truncation edge cases, and distributed replication consensus.",
    seniorAnswer: [
      "The Flaw in HW Truncation: In older Kafka, when Broker B crashed and rebooted, its rule was: 'Truncate local log to local High Watermark (HW=9)'. Broker B threw away offset 10.",
      "The Divergence: If Broker A (Leader) immediately crashed before B could catch up, Broker B became the new Leader. Broker B accepted a new message Y at offset 10. When Broker A came back online, its offset 10 (message X) had to be overwritten by message Y!",
      "The Result: Message X was permanently lost, and replica logs diverged silently.",
      "How Leader Epochs Solved It: Instead of truncating to HW upon restart, recovering followers inspect their `leader-epoch-checkpoint` file. The follower contacts the new leader and asks: 'What is your end offset for Leader Epoch X?'",
      "If the leader has records from that epoch, the follower does NOT truncate; it only truncates if the leader explicitly confirms those offsets belong to an uncommitted epoch."
    ],
    innerWorking: "Each segment maintains leader epoch metadata: `(epoch_id, start_offset)`. Whenever a partition leader changes, the epoch increments. Followers query the leader's `OffsetsForLeaderEpoch` API to determine the exact divergence point rather than guessing via High Watermark.",
    solution: `// Verify Leader Epoch Checkpoint file on broker:
cat /var/lib/kafka/data/orders-0/leader-epoch-checkpoint
// Output:
// 0     <- Format Version
// 3     <- Number of Epoch Transitions
// 0 0   <- Epoch 0 started at offset 0
// 1 500 <- Epoch 1 (Leader crash, Broker 2 elected) started at offset 500
// 2 920 <- Epoch 2 (New Leader elected) started at offset 920`,
    warStory: "Before Kafka 0.11, a multi-tenant European bank suffered unexplained transaction ledger mismatches after an automated AWS host maintenance reboot. High Watermark truncation had silently dropped 18 reconciled ledger transactions."
  },

  {
    id: "kafka-scen-10",
    title: "10. Log Compaction Failing & Topic Disk Growing Out of Control",
    difficulty: "Senior",
    category: "Storage Engine Internals",
    summary: "Topic has cleanup.policy=compact, but disk usage keeps ballooning to 500GB. Deleted records never vanish. Why?",
    problem: "A customer profile topic has `cleanup.policy=compact`. You expect it to store only the latest state per customer (~20 million keys, ~5GB). However, broker disk alerts report the topic has grown to 480GB and continues climbing. Deletes sent by the application are not removing old records.",
    juniorTrap: "Assuming that setting `cleanup.policy=compact` immediately compacts records upon write.",
    interviewerIntent: "Tests understanding of active segment immutability, cleaner thread ratios, tombstones (`value=null`), and `delete.retention.ms`.",
    seniorAnswer: [
      "Reason 1: Active Segment Immutability: Kafka NEVER compacts the active segment (`*.log` currently being appended to). If `segment.ms` or `segment.bytes` is too large, data sits uncompacted for weeks.",
      "Reason 2: Missing Tombstones: To delete a key in a compacted topic, the producer MUST send a message with `key = customerId` and `value = null`. If the producer sends an empty JSON `{}` or `{ \"deleted\": true }`, Kafka treats it as a new value and preserves it!",
      "Reason 3: `delete.retention.ms` (default 24h): Tombstones are kept for this duration to allow consumers to read the deletion event before the cleaner permanently removes the key.",
      "Reason 4: Cleaner Thread Configuration: Check if `log.cleaner.enable=true` and tune `min.cleanable.dirty.ratio` (default 0.5: at least 50% of the log must be dirty before cleaner runs)."
    ],
    innerWorking: "The Log Cleaner thread builds an in-memory SkimpyOffsetMap of the latest offset for each key in the dirty segment. It then rewrites the clean segment, skipping any record whose offset is strictly older than the map's offset.",
    solution: `// 1. Correct Tombstone Deletion in Java Producer:
public void deleteCustomer(String customerId) {
    // Crucial: Value MUST BE NULL to generate a Tombstone!
    kafkaTemplate.send("customer-profiles", customerId, null);
}

// 2. Topic Tuning for Faster Compaction:
kafka-configs.sh --bootstrap-server kafka:9092 --alter \\
  --entity-type topics --entity-name customer-profiles \\
  --add-config cleanup.policy=compact \\
  --add-config segment.bytes=104857600 \\         # Roll segment at 100MB instead of 1GB
  --add-config min.cleanable.dirty.ratio=0.2 \\   # Clean when 20% dirty
  --add-config delete.retention.ms=86400000        # Purge tombstones after 24 hours`,
    warStory: "A user GDPR compliance service sent `{ \"status\": \"DELETED\" }` to a compacted user topic. Because values were non-null, millions of supposedly deleted records remained on disk for 2 years, failing an external privacy audit."
  },

  {
    id: "kafka-scen-11",
    title: "11. Exactly-Once Processing (EOS) in a Read-Process-Write Stream",
    difficulty: "Staff / Architect",
    category: "Transactions & Exactly-Once",
    summary: "How to build an end-to-end exactly-once pipeline reading from Topic A, transforming, and writing to Topic B with consumer offset commit?",
    problem: "A billing microservice reads usage ticks from `metered-events`, aggregates billable amounts, and writes invoices to `invoices-topic`. If the pod crashes during execution, downstream consumers must NEVER receive duplicate invoices, and input offsets must not be double-processed.",
    juniorTrap: "Claiming that setting `enable.idempotence=true` on the producer is enough for end-to-end exactly-once processing.",
    interviewerIntent: "Assesses mastery of the Kafka 2-Phase Commit Transactional API (`sendOffsetsToTransaction`), the Transaction Coordinator, and `isolation.level=read_committed`.",
    seniorAnswer: [
      "Why Idempotence Alone is Insufficient: Idempotent producers only prevent duplicate writes from a single producer session to a single partition. They do not bind consumer offset commits to producer output writes atomically.",
      "The Solution: **Kafka Transactions (2PC)**.",
      "Architecture: 1) Producer requires a unique `transactional.id`; 2) Coordinates with the broker's Transaction Coordinator (backed by internal `__transaction_state` topic); 3) The producer sends output records AND consumer offsets together inside the transaction using `sendOffsetsToTransaction()`; 4) The coordinator writes `COMMIT` or `ABORT` marker messages.",
      "Consumer Requirement: Downstream consumers MUST configure `isolation.level=read_committed`. This ensures consumers filter out and skip aborted transactional messages and only read committed data."
    ],
    innerWorking: "When `commitTransaction()` is called, the Transaction Coordinator writes a `PREPARE_COMMIT` marker to `__transaction_state`, writes `COMMIT` markers to all involved partition logs, and marks the transaction `COMPLETE`.",
    solution: `// Spring Kafka Exactly-Once Transactional Listener:
@Configuration
public class KafkaTxConfig {
    @Bean
    public KafkaTransactionManager<String, String> kafkaTransactionManager(
            ProducerFactory<String, String> pf) {
        return new KafkaTransactionManager<>(pf);
    }
}

@Service
public class BillingStreamService {

    @Autowired private KafkaTemplate<String, Invoice> kafkaTemplate;

    @Transactional("kafkaTransactionManager") // Binds consumer offset commit to producer output!
    @KafkaListener(topics = "metered-events", groupId = "billing-group")
    public void process(MeteredEvent event) {
        Invoice invoice = calculateInvoice(event);
        kafkaTemplate.send("invoices-topic", invoice.getCustomerId(), invoice);
        // Offsets are committed atomically with the message send!
    }
}`,
    warStory: "A credit card reward points service crashed during peak Black Friday traffic without transactions enabled. Upon restart, it re-processed the last 15 minutes of uncommitted offsets, awarding duplicate reward points to 14,000 cardholders."
  },

  {
    id: "kafka-scen-12",
    title: "12. Zero-Copy Broken by TLS/SSL Encryption: Diagnosing CPU Spike",
    difficulty: "Staff / Architect",
    category: "Performance & Networking",
    summary: "After enabling TLS/SSL encryption on a Kafka cluster, broker CPU jumped from 15% to 85% and throughput collapsed by 60%. Why?",
    problem: "A cybersecurity mandate requires end-to-end mTLS encryption on a 12-node Kafka cluster. Within minutes of switching listener from `PLAINTEXT` to `SSL`, broker CPU spikes to 90%, network throughput plummets from 800 MB/s to 250 MB/s, and producer p99 latency skyrockets.",
    juniorTrap: "Assuming that Kafka brokers need larger EC2 instances or more CPU cores.",
    interviewerIntent: "Tests understanding of how TLS encryption breaks the Linux `sendfile()` Zero-Copy system call, forcing payloads into JVM user space.",
    seniorAnswer: [
      "The Root Cause: In `PLAINTEXT`, Kafka uses Linux kernel `sendfile()` (Zero-Copy): bytes move directly from OS PageCache into the Network Interface Card (NIC) buffer via DMA. The CPU never touches the payload.",
      "The TLS Bottleneck: TLS requires encryption before sending data over the wire. Because the Linux kernel `sendfile()` syscall does not encrypt by default, data MUST be copied from OS PageCache into JVM user space RAM, processed by the Java `SSLEngine` via CPU crypto loops, and written back to socket buffers. Zero-Copy is completely bypassed!",
      "Remediation 1: Enable **Kernel TLS (kTLS)** on Linux 5.x+ to allow the kernel to encrypt directly in the socket buffer.",
      "Remediation 2: Enable CPU hardware cryptographic instruction sets via JVM flags: `-XX:+UseAES -XX:+UseAESIntrinsics`.",
      "Remediation 3: Use fast ciphers: configure `ssl.cipher.suites = TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` (128-bit AES-GCM is hardware-accelerated on modern CPUs).",
      "Remediation 4: Terminate TLS at an ingress reverse proxy (Envoy / F5) in private data centers, keeping intra-mesh traffic on private networks."
    ],
    innerWorking: "Without Zero-Copy, every gigabyte of consumer egress requires 4 memory copies and 4 context switches between kernel and user mode, saturating CPU L1/L2 caches and memory bus bandwidth.",
    solution: `// Broker server.properties SSL Performance Tuning:
ssl.cipher.suites=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
ssl.enabled.protocols=TLSv1.3,TLSv1.2

// JVM Options in kafka-env.sh:
export KAFKA_JVM_PERFORMANCE_OPTS="-XX:+UseAES -XX:+UseAESIntrinsics -XX:+UseNUMA"`,
    warStory: "A tier-1 bank enabled 256-bit CBC ciphers on Kafka brokers. All 24 broker nodes hit 100% CPU utilization with only 15% bandwidth utilized. Switching to 128-bit AES-GCM with hardware AES-NI instructions dropped CPU to 24%."
  },

  {
    id: "kafka-scen-13",
    title: "13. Under-Replicated Partitions (URP) Alerting in Production: Triage Runbook",
    difficulty: "Senior",
    category: "Operations & Incident Triage",
    summary: "PagerDuty alert fires: UnderReplicatedPartitions > 0 on Broker 4. Partitions falling out of ISR. What is your systematic triage runbook?",
    problem: "At 3:00 AM, PagerDuty alerts: `kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions` is reporting 38 under-replicated partitions. Broker 4 appears to be lagging behind the leaders. How do you triage whether it's disk failure, network saturation, or JVM GC pauses?",
    juniorTrap: "Immediately running partition reassignment scripts or restarting random brokers.",
    interviewerIntent: "Assesses operational maturity, metrics fluency, and step-by-step diagnostic runbooks for production cluster degradation.",
    seniorAnswer: [
      "Step 1: Identify Impacted Topics & Brokers: Run `kafka-topics.sh --bootstrap-server ... --describe --under-replicated-partitions` to isolate the affected partition IDs and leader/follower broker IDs.",
      "Step 2: Check Disk I/O Saturation on Broker 4: Run `iostat -xz 1`. If `%util` is 100% or `await` > 50ms, Broker 4's underlying disk/EBS volume is bottlenecked and cannot keep up with append writes.",
      "Step 3: Check JVM GC Pauses: Check Broker 4 GC logs: `jstat -gcutil <pid> 1000` or look for Stop-the-World pauses > `replica.lag.time.max.ms` (30s) which cause followers to miss fetch deadlines.",
      "Step 4: Check Network Bottlenecks: Run `nload` or `sar -n DEV 1` to verify if the broker's 10Gbps/25Gbps NIC bandwidth is saturated.",
      "Step 5: Remediation: If disk is failing, isolate broker by marking it degraded, and rebalance partitions using `kafka-reassign-partitions.sh`."
    ],
    innerWorking: "Followers send `FetchRequest` to the partition leader. If a follower's fetch offset lags behind the leader's LEO for longer than `replica.lag.time.max.ms`, the leader removes the follower from the ISR and increments `UnderReplicatedPartitions` metric.",
    solution: `// 1. Find all under-replicated partitions:
kafka-topics.sh --bootstrap-server kafka:9092 \\
  --describe --under-replicated-partitions

// 2. Output sample:
// Topic: orders  Partition: 3  Leader: 1  Replicas: 1,4,2  Isr: 1,2  <-- Broker 4 missing!

// 3. Generate throttle reassignment to reduce I/O pressure:
kafka-reassign-partitions.sh --bootstrap-server kafka:9092 \\
  --execute --reassignment-json-file reassign.json \\
  --throttle 50000000 # Throttle migration to 50 MB/s`,
    warStory: "An AWS EBS gp2 burst balance hit 0% on a Kafka broker. Disk IOPS collapsed from 3,000 to 100 IOPS. The broker could not write replication batches, causing 80 partitions to become under-replicated. Migrating to gp3 with provisioned throughput resolved the issue permanently."
  },

  {
    id: "kafka-scen-14",
    title: "14. Rebalance Storms: Eager Protocol vs Cooperative Sticky Assignor",
    difficulty: "Senior",
    category: "Consumer Architecture",
    summary: "When 1 consumer restarts in a 50-consumer cluster, all 50 consumers pause processing for 15-20 seconds. Why, and how to fix?",
    problem: "A Kubernetes deployment of 50 consumer pods runs smoothly until a single pod crashes or performs a rolling update. Immediately, all 50 pods stop consuming messages. Total consumption drops to 0 for 25 seconds, consumer lag spikes, and downstream services starve.",
    juniorTrap: "Tuning `session.timeout.ms` and `heartbeat.interval.ms` to very small values (which actually makes false-positive rebalances even worse!).",
    interviewerIntent: "Tests understanding of the difference between the legacy Eager Rebalance Protocol and modern Incremental Cooperative Rebalancing (KIP-429).",
    seniorAnswer: [
      "The Flaw of Eager Protocol: Default legacy assignors (`RangeAssignor`, `RoundRobinAssignor`) use the Eager Rebalance Protocol. Upon ANY group membership change, ALL consumers must revoke ALL assigned partitions, send `JoinGroup`, and wait for partition reassignment. It is a Stop-the-World pause!",
      "The Solution: **CooperativeStickyAssignor** (KIP-429).",
      "How it Works: Incremental 2-Phase Rebalance: Phase 1: Unaffected consumers keep processing their current partitions without pausing! Only the specific partitions being moved are revoked. Phase 2: Those specific partitions are assigned to their new owners.",
      "Result: 49 pods continue consuming at full speed with ZERO downtime while 1 pod restarts."
    ],
    innerWorking: "CooperativeSticky assigns partitions while preserving existing assignments ('stickiness'). It uses `COOPERATIVE` protocol type, exchanging `SyncGroup` requests without revoking unassigned partitions.",
    solution: `// Spring Boot Configuration for CooperativeSticky Assignor:
spring:
  kafka:
    consumer:
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor`,
    warStory: "A fintech fraud detection engine had 64 consumer pods. A rolling deployment of a new code version took 45 minutes because every single pod restart triggered a 30-second eager stop-the-world rebalance. Switching to `CooperativeStickyAssignor` reduced total deployment time to 3 minutes with zero processing interruption."
  },

  {
    id: "kafka-scen-15",
    title: "15. Handling Large Payloads (10MB-50MB Blobs) in Kafka",
    difficulty: "Senior",
    category: "System Design & Architecture",
    summary: "Team wants to stream 30MB medical imaging scans through Kafka. Broker crashes with OOM and latency spikes across all topics. How to architect large payloads?",
    problem: "A radiology PACS application streams 25MB DICOM medical scan files. Developers increased `message.max.bytes = 50000000` on the broker and `max.request.size = 50000000` on producers. Within hours, broker memory collapsed with OOM, disk replication lagged by hours, and small 1KB message latency on other topics went from 2ms to 800ms.",
    juniorTrap: "Just bumping `message.max.bytes`, `replica.fetch.max.bytes`, and JVM heap to accommodate huge blobs.",
    interviewerIntent: "Assesses architectural patterns for blob storage, OS PageCache pollution, and the Claim Check Pattern.",
    seniorAnswer: [
      "Why Large Blobs Kill Kafka: 1) JVM Buffer Churn: 50MB byte buffers put immense allocation pressure on JVM memory; 2) PageCache Pollution: Reading 50MB files evicts thousands of small index and hot topic pages from the Linux OS PageCache; 3) Network Saturation: 3-way replication of 50MB files chokes inter-broker network links.",
      "The Architectural Solution: **The Claim Check Pattern**.",
      "Architecture: 1) Producer uploads the 25MB scan file directly to an object store (AWS S3, MinIO, GCS); 2) Producer publishes a lightweight JSON pointer event (< 1KB) to Kafka containing `{ fileId, s3Uri, checksum, sizeBytes }`; 3) Downstream consumer reads the lightweight event from Kafka and downloads the file from S3 asynchronously.",
      "Benefits: Kafka stays ultra-fast, PageCache remains pristine, and storage costs decrease by 80% (S3 vs high-performance NVMe broker disk)."
    ],
    innerWorking: "Kafka's buffer pool divides memory into chunks based on `batch.size`. Messages larger than `batch.size` allocate raw byte arrays outside the pool, triggering immediate JVM garbage collection and cache evictions.",
    solution: `// Claim Check Pattern Implementation:
@Service
public class MedicalScanProducer {

    @Autowired private AmazonS3 s3Client;
    @Autowired private KafkaTemplate<String, ScanMetadataEvent> kafkaTemplate;

    public void publishScan(String scanId, byte[] dicomBytes) {
        String s3Key = "scans/" + scanId + ".dcm";
        
        // 1. Upload heavy blob to S3
        s3Client.putObject("hospital-scans-bucket", s3Key, new ByteArrayInputStream(dicomBytes), null);
        
        // 2. Publish lightweight metadata pointer to Kafka
        ScanMetadataEvent event = new ScanMetadataEvent(
            scanId, "s3://hospital-scans-bucket/" + s3Key, dicomBytes.length, Instant.now()
        );
        kafkaTemplate.send("scan-events", scanId, event);
    }
}`,
    warStory: "An insurance portal pushed 15MB PDF crash damage photos through Kafka. A batch of 100 uploads triggered broker OutOfMemoryError and dropped inter-broker heartbeat pings, triggering an emergency failover. Refactoring to S3 Claim Check reduced broker bandwidth by 99.4%."
  },

  {
    id: "kafka-scen-16",
    title: "16. Broker Hits 95% Disk Full Emergency: Instant Runbook",
    difficulty: "Staff / Architect",
    category: "Emergency Operations",
    summary: "At 2:00 AM, Broker 2 disk hits 96% full. You have 15 minutes before the broker goes into read-only crash mode. How to resolve immediately without data loss?",
    problem: "An alert wakes you: Broker 2 `/var/lib/kafka/data` is at 96% utilization. If it hits 100%, Kafka will crash with `KafkaStorageException` and corrupt active index files. You cannot restart the broker right now.",
    juniorTrap: "Logging into the Linux terminal and running `rm -rf *.log` on old segment files. (This corrupts Kafka's in-memory index maps and causes fatal crashes upon next checkpoint!).",
    interviewerIntent: "Tests production crisis management, understanding of dynamic broker configs, segment rolling, and safe disk remediation.",
    seniorAnswer: [
      "Rule #1: NEVER delete `.log` or `.index` files manually using Linux `rm` commands!",
      "Action 1: Dynamically Reduce Retention on High-Volume Topics (No Restart Required): Run `kafka-configs.sh` to lower `retention.ms` on debug/telemetry topics (e.g. from 7 days to 2 hours). Kafka cleaner threads will immediately delete expired segments.",
      "Action 2: Force Immediate Segment Rollover: Reduce `segment.bytes` so large active segments roll into closed segments, making them eligible for immediate retention deletion.",
      "Action 3: Trigger Log Compaction: For compacted topics, reduce `min.cleanable.dirty.ratio` to 0.1 to force the cleaner thread to compact immediately.",
      "Action 4: Shed Load via Partition Reassignment: Use `kafka-reassign-partitions.sh` to migrate partition replicas away from Broker 2 onto brokers with available disk capacity."
    ],
    innerWorking: "Kafka's log retention cleaner thread scans inactive segment files every `log.retention.check.interval.ms` (default 5 min). Altering `retention.ms` via dynamic configs signals the thread to immediately purge eligible closed segments.",
    solution: `// Emergency Retention Override via CLI (Instant Execution, No Restart):
kafka-configs.sh --bootstrap-server kafka:9092 --alter \\
  --entity-type topics --entity-name raw-clickstream-logs \\
  --add-config retention.ms=7200000 \\          # Reduce to 2 hours
  --add-config segment.bytes=104857600          # Force segment roll at 100MB

// Verify disk freeing in real-time:
watch -n 2 df -h /var/lib/kafka/data`,
    warStory: "A junior sysadmin ran `rm -f 000000*.log` directly in `/var/lib/kafka/data/orders-0` to free disk space. The broker crashed 2 minutes later with `NoSuchFileException` during checkpoint flush, leaving the partition in an unrecoverable corrupted state that required manual hex-editing of index headers."
  },

  {
    id: "kafka-scen-17",
    title: "17. Multi-Region Disaster Recovery & Active-Active MirrorMaker 2 Traps",
    difficulty: "Staff / Architect",
    category: "Disaster Recovery & High Availability",
    summary: "Replicating Kafka between US-East and US-West using MirrorMaker 2. In active-active, how to avoid circular replication loops and split-brain consumer offsets?",
    problem: "A multinational bank implements multi-region disaster recovery between `us-east` (Primary) and `us-west` (Secondary) using MirrorMaker 2 (MM2). In an active-active test, messages replicated from East to West are replicated back to East, causing an infinite circular replication storm that exhausts network bandwidth.",
    juniorTrap: "Replicating topics with identical names across clusters without topic namespace prefixes or replication blacklists.",
    interviewerIntent: "Assesses mastery of MirrorMaker 2 architecture, cyclic replication prevention, and consumer offset translation across heterogeneous clusters.",
    seniorAnswer: [
      "The Cyclic Replication Loop: If Cluster A replicates `orders` to Cluster B as `orders`, Cluster B's MM2 will detect new records in `orders` and replicate them back to Cluster A, creating an infinite loop.",
      "Solution 1: **Topic Namespace Prefixing**: MM2 automatically prefixes replicated topics with the source cluster alias: `us-east.orders` on West, and `us-west.orders` on East. MM2's default regex excludes topics containing cluster alias prefixes, stopping cycles.",
      "Solution 2: **Consumer Offset Translation**: Offsets in Cluster B do not match offsets in Cluster A! MM2 emits internal `checkpoint` topics mapping source-to-target offsets.",
      "Failover Strategy: When failing over consumers from East to West, use `RemoteClusterUtils.translateOffsets()` to compute the exact corresponding target partition offset before resuming consumption."
    ],
    innerWorking: "MirrorMaker 2 runs on Kafka Connect framework. It periodically polls source cluster consumer offsets, computes timestamp mappings via `offset-syncs` internal topic, and commits translated offsets into target cluster's `__consumer_offsets`.",
    solution: `// MirrorMaker 2 Configuration (mm2.properties):
clusters = us-east, us-west
us-east.bootstrap.servers = east-kafka:9092
us-west.bootstrap.servers = west-kafka:9092

// Enable replication in both directions:
us-east->us-west.enabled = true
us-east->us-west.topics = orders.*, payments.*
us-west->us-east.enabled = true
us-west->us-east.topics = orders.*, payments.*

// Automatic topic rename prevents loops:
// 'orders' replicated to us-west becomes 'us-east.orders'
replication.policy.class = org.apache.kafka.connect.mirror.DefaultReplicationPolicy`,
    warStory: "An entertainment streaming service replicated user watch history between AWS Ireland and Frankfurt without topic prefixing. An infinite replication loop generated 200 TB of duplicate messages in 4 hours, costing \$45,000 in cross-region AWS egress bandwidth."
  },

  {
    id: "kafka-scen-18",
    title: "18. Unclean Leader Election vs Availability in Financial Systems",
    difficulty: "Staff / Architect",
    category: "CAP Theorem & Consensus",
    summary: "All ISR replicas crash. Only 1 out-of-sync replica remains, 10,000 offsets behind. What happens if unclean.leader.election.enable=true vs false?",
    problem: "In an architectural review for a real-time clearing house, an auditor asks: 'If all in-sync replicas for the `settlement-ledger` partition suffer a hardware failure, leaving only one out-of-sync replica that is 50,000 offsets behind, what is the impact of `unclean.leader.election.enable=true` vs `false`?'",
    juniorTrap: "Always enabling unclean leader election to maximize uptime and availability.",
    interviewerIntent: "Assesses clear understanding of the CAP theorem in distributed streaming: Consistency vs Availability tradeoffs in disaster scenarios.",
    seniorAnswer: [
      "If `unclean.leader.election.enable = true` (Availability Priority):",
      "The out-of-sync broker is elected leader. It can immediately accept new reads and writes.",
      "The Catastrophic Cost: All 50,000 messages that were acknowledged to clients on the dead ISR replicas are PERMANENTLY LOST! When new messages arrive, they overwrite those offsets. In financial ledgers, this causes silent balance discrepancies and regulatory violations.",
      "If `unclean.leader.election.enable = false` (Consistency Priority):",
      "The partition becomes completely UNAVAILABLE for both reads and writes. Producers get `LeaderNotAvailableException`.",
      "The Benefit: ZERO data loss. The system waits until one of the true ISR replicas recovers, preserving absolute ledger integrity.",
      "The Financial Rule: In payments, ledgers, and banking, `unclean.leader.election.enable` MUST ALWAYS BE `false`."
    ],
    innerWorking: "When `unclean.leader.election.enable=false`, the Controller refuses to elect any broker whose ID is not present in the ZooKeeper / KRaft ISR znode/metadata record.",
    solution: `// Enforce Zero Data Loss Invariants:
kafka-configs.sh --bootstrap-server kafka:9092 --alter \\
  --entity-type topics --entity-name settlement-ledger \\
  --add-config unclean.leader.election.enable=false \\
  --add-config min.insync.replicas=2

// Broker Global Default in server.properties:
unclean.leader.election.enable=false`,
    warStory: "A gaming casino platform had unclean leader election enabled. A power surge knocked out 2 rack units. The out-of-sync replica became leader, erasing \$120,000 in user slot machine balance updates. The casino spent 3 weeks reconciling transaction audit logs manually."
  },

  {
    id: "kafka-scen-19",
    title: "19. Graceful Zero-Downtime Rolling Upgrade of a 50-Broker Cluster",
    difficulty: "Senior",
    category: "Cluster Operations",
    summary: "You need to upgrade Kafka or patch the Linux kernel across 50 brokers in production with zero dropped messages and minimal consumer impact. Runbook?",
    problem: "You are tasked with executing a zero-downtime rolling restart of a 50-broker Kafka cluster handling 1.5 million msg/sec. How do you ensure no producer requests fail, consumer rebalance storms are avoided, and partition leadership moves gracefully?",
    juniorTrap: "Restarting multiple brokers simultaneously or running `kill -9` on broker processes.",
    interviewerIntent: "Evaluates production operational safety, controlled shutdown protocol, and ISR catch-up verification.",
    seniorAnswer: [
      "Prerequisite 1: Verify `controlled.shutdown.enable=true` on all brokers. When a broker receives `SIGTERM`, it proactively transfers partition leadership to other ISR members before shutting down sockets, eliminating client connection errors.",
      "Prerequisite 2: Verify `min.insync.replicas=2` and `replication.factor=3`. Never restart brokers if `min.insync.replicas == replication.factor`.",
      "Execution Loop (Strictly One Broker at a Time):",
      "1. Check cluster health: Verify `UnderReplicatedPartitions == 0`.",
      "2. Send graceful `SIGTERM` (e.g. `systemctl stop kafka`).",
      "3. Apply kernel patch / upgrade binaries, and start Kafka.",
      "4. Mandatory Wait: Do NOT touch the next broker until the restarted broker has caught up and `UnderReplicatedPartitions == 0`!",
      "5. Rebalance Leadership: Run `kafka-leader-election.sh` to restore preferred leader partitions."
    ],
    innerWorking: "Controlled shutdown sends a `ControlledShutdownRequest` to the KRaft Controller. The Controller migrates leaders one by one and updates ISR metadata before acknowledging the shutdown, reducing partition downtime from 30s to < 100ms.",
    solution: `// Automated Rolling Restart Verification Loop Script:
for broker_id in {1..50}; do
  echo ">>> Checking cluster health before stopping Broker $broker_id..."
  while [ $(kafka-run-class.sh kafka.tools.JmxTool --object-name kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions --one-time | tail -n 1) -ne 0 ]; do
    echo "Waiting for URP to return to 0..."
    sleep 5
  done
  
  echo ">>> Gracefully stopping Broker $broker_id..."
  ssh kafka-broker-$broker_id "sudo systemctl stop kafka"
  # Apply upgrade...
  ssh kafka-broker-$broker_id "sudo systemctl start kafka"
done`,
    warStory: "An infrastructure team used an automated Ansible playbook with `serial: 20%` (restarting 10 brokers at once). Because multiple replicas of the same partition lived on those 10 brokers, 400 partitions lost all their ISR replicas simultaneously, taking down production checkout for 35 minutes."
  },

  {
    id: "kafka-scen-20",
    title: "20. Kafka vs RabbitMQ / AWS SQS: The Senior Architectural Decision Framework",
    difficulty: "Staff / Architect",
    category: "System Design & Tradeoffs",
    summary: "An architect asks: 'Why should we use Kafka instead of RabbitMQ or AWS SQS for our system?' Provide the definitive trade-off framework.",
    problem: "During a system design interview, the interviewer asks: 'We are designing an asynchronous messaging system for order fulfillment, fraud alerts, and invoice generation. Should we use Kafka or RabbitMQ / AWS SQS? Defend your architectural choice.'",
    juniorTrap: "Defaulting to Kafka for everything because 'it is modern and handles millions of events.'",
    interviewerIntent: "Assesses whether the candidate understands the fundamental architectural difference: Smart Broker / Dumb Consumer (Queue) vs Dumb Broker / Smart Consumer (Append-Only Log).",
    seniorAnswer: [
      "Architectural Paradigm Difference:",
      "RabbitMQ / SQS (Message Queue): Smart Broker, Dumb Consumer. Messages are transient: once a consumer acknowledges a message, it is deleted from the broker. Pull/Push model. Supports complex routing (topic/headers exchanges), per-message acknowledgments, and priority queues.",
      "Kafka (Distributed Append-Only Commit Log): Dumb Broker, Smart Consumer. Messages are immutable and persistent on disk. Consumers pull records and maintain their own offset pointers. Messages can be replayed from any point in time.",
      "When to Choose Kafka: 1) Event Sourcing & CQRS (need historical replay); 2) High Throughput (> 100k msg/sec); 3) Multiple Independent Consumers reading the same data stream at different speeds; 4) Stream Processing (Kafka Streams, Flink); 5) CDC data pipelines.",
      "When to Choose RabbitMQ / SQS: 1) Complex task worker queues with individual message ACKs/NACKs; 2) Dynamic routing keys and exchange topologies; 3) Low throughput (< 50k msg/sec) with strict priority queuing; 4) Zero operational overhead requirement (AWS SQS fully managed)."
    ],
    innerWorking: "RabbitMQ tracks individual message states (`Ready`, `Unacked`) in Erlang memory tables, degrading as queues grow large. Kafka tracks a single 64-bit integer (offset) per partition per consumer group, ensuring constant O(1) performance regardless of topic size.",
    solution: `// Architectural Decision Matrix:
// Feature               | Apache Kafka                     | RabbitMQ / AWS SQS
// ----------------------|----------------------------------|-----------------------------
// Core Model            | Partitioned Append-Only Log      | Transient Message Queue
// Message Retention     | Days / Weeks / Forever (Replay)  | Deleted upon ACK
// Concurrency Unit      | 1 Consumer per Partition         | Many Consumers per Queue
// Throughput            | Millions of msgs / sec           | 10k - 50k msgs / sec
// Point-to-Point Queue  | Inefficient                      | Native & Ideal
// Event Sourcing        | Native & Ideal                   | Impossible (No Replay)`,
    warStory: "A logistics company selected Kafka for dispatching courier delivery jobs. Because individual delivery jobs had wild processing time variations (from 10 seconds to 45 minutes), slow jobs blocked entire partitions. They spent 6 months migrating worker dispatch queues back to RabbitMQ/SQS where individual message NACK and per-message routing work naturally."
  }
];
