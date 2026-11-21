/**
 * redis-data.js
 * Senior / Staff Engineer Redis Architecture, Internals & Top Interview Scenarios
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.REDIS_TOPICS = [
  {
    id: "redis-event-loop-epoll-io-threads",
    title: "Redis Reactor Event Loop, epoll Multiplexing & Redis 6 I/O Threads",
    category: "Redis Core Architecture",
    badge: "Staff-Level Event Loop",
    oneLiner: "Redis achieves 100k+ OPS via an in-memory single-threaded Reactor pattern over non-blocking epoll sockets, offloading socket I/O to worker threads in Redis 6+ while command execution remains 100% thread-safe and lock-free.",
    summary: "Redis operates on a single-threaded Reactor pattern implemented via I/O multiplexing (`epoll` on Linux, `kqueue` on macOS/BSD). Because all data lives in RAM, memory access latency (~100ns) is dwarfed by network socket read/write syscalls (~10μs). By maintaining a single execution thread for command processing, Redis completely avoids thread context switching, race conditions, and locking overhead. In Redis 6.0+, multi-threaded I/O was introduced solely to parallelize socket read/write operations while the core execution engine remains strictly single-threaded.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚡ Redis Reactor Event Loop &amp; I/O Multiplexing Pipeline</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(220, 38, 38, 0.4); background: rgba(220, 38, 38, 0.08);">
            <div class="space-name" style="color: #f87171;">I/O Threads (Redis 6+)</div>
            <div class="space-desc">Parallel Socket Read &amp; Write</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Offloads read(fd) into query buffers and write(fd) output buffers across 4-8 CPU worker threads.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Main Execution Thread (Single-Threaded)</div>
            <div class="space-desc">100% Lock-Free Command Execution</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Executes GET, SET, HSET, Lua scripts sequentially against in-memory dictionary. Zero mutex contention!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Network Events</span>
            <span class="node-label">epoll_wait()</span>
            <span class="node-sub">Non-blocking sockets</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Parallel I/O</span>
            <span class="node-label">Read Query Buffer</span>
            <span class="node-sub">I/O Threads (Redis 6+)</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">3. Command Exec</span>
            <span class="node-label">processCommand()</span>
            <span class="node-sub">Single-Threaded Memory Mutate</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. Client Response</span>
            <span class="node-label">writeToClient()</span>
            <span class="node-sub">Parallel Socket Flush</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Why Single-Threaded: Redis is bound by memory bandwidth and network I/O, not CPU. A single CPU core can easily perform 100,000+ in-memory hash table lookups per second. Multithreading would introduce lock contention, cache line bouncing, and context-switching overhead that degrades performance.",
      "I/O Multiplexing via epoll: Instead of spawning a thread per client connection, Redis registers all client socket file descriptors (FDs) with Linux `epoll`. The kernel notifies Redis when an FD has readable data or writable buffer space.",
      "aeEventLoop Engine: Redis's internal event loop multiplexer (`ae.c`) processes two event types: 1) File Events (socket read/write); 2) Time Events (server cron tasks: active key expiration, stats aggregation, watchdog).",
      "Redis 6 Multi-Threaded I/O (`io-threads`): Offloads parsing client network requests and writing output buffers across worker threads (`io-threads 4`). The actual command execution on data structures remains 100% single-threaded on the main thread, preserving atomicity.",
      "The Single-Thread Trap: Any command running in $O(N)$ time (e.g. `KEYS *`, `FLUSHALL`, `HGETALL` on 1,000,000 keys, or slow Lua scripts) blocks the main execution thread completely, freezing all other clients and causing cluster failovers."
    ],
    codeSnippet: `# redis.conf configuration for Redis 6+ Multi-Threaded I/O:
# Number of I/O worker threads (typically 4 on an 8-core host, 8 on a 16-core host):
io-threads 4

# By default, I/O threads only handle writing socket buffers.
# Enable reading from sockets as well:
io-threads-do-reads yes

# Inspecting event loop metrics:
# redis-cli INFO stats
# instantaneous_ops_per_sec: 112450
# total_connections_received: 52310
# rejected_connections: 0`
  },

  {
    id: "redis-data-structures-internals",
    title: "Redis Core Data Structures Internals: SDS, Dict, Skiplist & Quicklist",
    category: "Redis Internals",
    badge: "C Data Structures",
    oneLiner: "Redis wraps raw C primitives with specialized memory-efficient structures: SDS prevents buffer overflows, Dict performs incremental rehashing, Skiplist powers ZSet $O(\\log N)$ ranking, and Quicklist/Listpack compresses sequential lists.",
    summary: "Redis does not use plain C strings or standard arrays. It implements custom C data structures engineered for $O(1)$ efficiency, binary safety, and minimal memory fragmentation. Strings use Simple Dynamic Strings (SDS) with pre-allocated capacity; Hashes and sets use Dict with dual-table incremental rehashing; Sorted Sets (ZSet) combine a Hash Table with a probabilistic Skip List for $O(\\log N)$ range queries; and Lists use Quicklist (a doubly-linked list of compressed Listpack/ziplist chunks).",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧬 Redis Internal Memory Representations</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">SDS (Simple Dynamic String)</div>
            <div class="space-desc">Binary-Safe String Header</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Stores len, alloc, flags, and buf[]. $O(1)$ strlen, zero buffer overflow, binary-safe (can store images/JSON).</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
            <div class="space-name" style="color: #fbbf24;">Dict (Dual Hash Tables)</div>
            <div class="space-desc">Incremental Rehashing (ht[0] ➔ ht[1])</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Rehashes 1 bucket per read/write/cron cycle. Eliminates long stop-the-world rehash pauses on 10M keys!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-purple">
            <span class="node-badge">ZSET (Sorted Set)</span>
            <span class="node-label">Dict + SkipList</span>
            <span class="node-sub">Dict: O(1) Score / SkipList: O(log N) Range</span>
          </div>
          <div class="flow-arrow-node">➕</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">LIST (Quicklist)</span>
            <span class="node-label">Linked List of Listpacks</span>
            <span class="node-sub">Eliminates pointer overhead via compression</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Simple Dynamic String (SDS): C strings are null-terminated (`\\0`), requiring $O(N)$ `strlen` and risking buffer overflows. SDS stores `len` (current length) and `alloc` (allocated capacity), providing $O(1)$ length lookups, binary safety (allows arbitrary byte sequences including null bytes), and space pre-allocation to amortize reallocations.",
      "Dict Incremental Rehashing: A Redis Dict contains two hash tables (`ht[0]` and `ht[1]`). When load factor exceeds 1 (or 5 during BGSAVE), Redis doubles the table size in `ht[1]`. Instead of rehashing millions of keys in one blocking pass, it rehashes incrementally: every client read/write and background cron step moves a small batch of buckets from `ht[0]` to `ht[1]`.",
      "SkipList for ZSet: Why not an AVL or Red-Black Tree? SkipLists achieve the same $O(\\log N)$ search and insertion via probabilistic multi-level forward pointers, but range queries (`ZRANGEBYSCORE`) are dramatically simpler (just traversing the bottom-level linked list) and concurrency/rebalancing is far less complex.",
      "Quicklist & Listpack: A pure linked list has 16-24 bytes of pointer overhead per node. Redis Lists use Quicklist: a doubly-linked list where each node is a contiguous, compressed Listpack chunk containing multiple entries, saving up to 70% RAM.",
      "Redis Object Model (`robj`): Every Redis value is wrapped in a `redisObject` header (16 bytes): `type` (4 bits: string, list, set, zset, hash), `encoding` (4 bits: raw, embstr, int, skiplist, hashtable), `lru` (24 bits: eviction timestamp), `refcount` (4 bytes), and `*ptr` to actual data."
    ],
    codeSnippet: `// C Representation of Redis SDS Header:
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len;         // Used bytes (excluding '\\0')
    uint8_t alloc;       // Total allocated memory
    unsigned char flags; // Header type (sdshdr5, 8, 16, 32, 64)
    char buf[];          // Actual character array
};

// Inspecting internal object encoding via redis-cli:
// 127.0.0.1:6379> SET user:age 25
// 127.0.0.1:6379> OBJECT ENCODING user:age
// "int" (Stored directly in the pointer field without allocating heap!)

// 127.0.0.1:6379> SET user:bio "Software Engineer"
// 127.0.0.1:6379> OBJECT ENCODING user:bio
// "embstr" (String <= 44 bytes: robj + sds allocated in 1 contiguous memory chunk!)`
  },

  {
    id: "redis-persistence-rdb-aof-cow",
    title: "Redis Persistence Engine: RDB, AOF & Linux Copy-on-Write (CoW)",
    category: "Persistence & Durability",
    badge: "Kernel CoW Internals",
    oneLiner: "RDB creates point-in-time binary snapshots using Linux fork() Copy-on-Write, while AOF records an append-only log with configurable fsync policies (always/everysec/no); modern Redis uses Hybrid RDB-AOF for fast recovery and minimal data loss.",
    summary: "Redis provides two complementary persistence mechanisms: RDB (Redis Database) and AOF (Append-Only File). RDB executes `bgsave` by calling Linux `fork()`, creating a child process that writes a compact binary snapshot using Copy-on-Write (CoW) page tables without blocking client operations. AOF logs every write command in RESP protocol format. In Redis 4.0+, Hybrid Persistence (`aof-use-rdb-preamble yes`) combines RDB's fast snapshot recovery with AOF's incremental tail log for near-zero recovery time.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">💾 Redis Persistence: RDB Fork CoW vs AOF Append-Only Log</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(14, 165, 233, 0.4); background: rgba(14, 165, 233, 0.08);">
            <div class="space-name" style="color: #38bdf8;">RDB Snapshot (bgsave)</div>
            <div class="space-desc">fork() Child Process via Copy-on-Write</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Instant fork duplicates page tables. If parent writes to a memory page, the OS clones that 4KB page. Fast restarts!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
            <div class="space-name" style="color: #fbbf24;">AOF (Append-Only File)</div>
            <div class="space-desc">appendfsync: everysec (Default)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Logs RESP writes. Flushes every second via background thread. Max 1-second data loss on host crash.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. RDB Preamble</span>
            <span class="node-label">Binary Dump</span>
            <span class="node-sub">Fast Bulk Load on boot</span>
          </div>
          <div class="flow-arrow-node">➕</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. AOF Tail</span>
            <span class="node-label">Incremental RESP</span>
            <span class="node-sub">Changes since snapshot</span>
          </div>
          <div class="flow-arrow-node">══►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Hybrid Persistence</span>
            <span class="node-label">Instant Start + 0 Loss</span>
            <span class="node-sub">Modern Redis Standard</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "RDB bgsave & Copy-on-Write (CoW): The main thread calls `fork()`. The child process inherits the parent's memory page table marked read-only. As long as keys aren't modified, zero memory is copied! If parent writes to a page, the OS kernel triggers a page fault and duplicates that 4KB page. Under heavy write spikes, CoW memory usage can approach 2x current memory!",
      "AOF appendfsync Policies: 1) `appendfsync always`: fsync after every write (slow, disk bound); 2) `appendfsync everysec` (Recommended): a background thread fsyncs every 1000ms (max 1 second data loss); 3) `appendfsync no`: delegates flushing to the OS kernel (fastest, up to 30s data loss).",
      "AOF Rewrite (BGREWRITEAOF): Over time, AOF grows massive (1,000 `INCR` commands can be reduced to 1 `SET`). A child process reads the current dataset in memory and writes the minimum required commands to a new file, swapping it atomically.",
      "The vm.overcommit_memory = 1 Requirement: If Linux `vm.overcommit_memory` is set to 0, `fork()` will fail if free RAM is less than the current Redis process size! Setting `vm.overcommit_memory = 1` in `/etc/sysctl.conf` tells the kernel to allow memory overcommit based on CoW behavior.",
      "Hybrid Persistence (`aof-use-rdb-preamble yes`): The new AOF rewrite format puts a binary RDB snapshot at the head of the file and appends recent RESP commands at the tail. On server restart, Redis loads the RDB head in seconds and replays the short AOF tail."
    ],
    codeSnippet: `# /etc/redis/redis.conf Production Persistence Settings:
# 1. Enable AOF with 1-second flush guarantee:
appendonly yes
appendfsync everysec

# 2. Modern Hybrid Persistence (Fastest crash recovery):
aof-use-rdb-preamble yes

# 3. Automated AOF Rewrite triggers:
auto-aof-rewrite-percentage 100 # Rewrite when file doubles in size
auto-aof-rewrite-min-size 64mb

# 4. Mandatory Linux Kernel Configuration (/etc/sysctl.conf):
# sysctl vm.overcommit_memory=1
# echo never > /sys/kernel/mm/transparent_hugepage/enabled # Disable THP to avoid 2MB CoW latency!`
  },

  {
    id: "redis-cluster-hash-slots-redirection",
    title: "Redis Cluster Architecture: 16,384 Hash Slots, Redirection & Failover",
    category: "Clustering & High Availability",
    badge: "Staff Distributed Systems",
    oneLiner: "Redis Cluster shards keys across 16,384 virtual hash slots using CRC16(key) mod 16384, coordinating nodes via a master-master Gossip protocol and routing clients using MOVED/ASK redirects without proxy bottlenecks.",
    summary: "Redis Cluster provides automatic sharding, fault tolerance, and linear scalability across up to 1,000 nodes without requiring a centralized proxy. Keyspace is divided into exactly 16,384 Hash Slots. Master nodes communicate over a binary Gossip protocol on the cluster bus (port + 10000). Clients route queries directly to the responsible master. If a client queries the wrong node, the node responds with a `MOVED` redirect. During slot migration, it responds with an `ASK` redirect.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🌐 Redis Cluster: 16,384 Hash Slots &amp; Smart Client Routing</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #f87171;">Node A (Master)</div>
            <div class="space-desc">Slots 0 - 5460</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Primary for keys hashing in slot range 0-5460. Has 1 Replica A1.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Node B (Master)</div>
            <div class="space-desc">Slots 5461 - 10922</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Primary for keys hashing in slot range 5461-10922. Has 1 Replica B1.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Node C (Master)</div>
            <div class="space-desc">Slots 10923 - 16383</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Primary for keys hashing in slot range 10923-16383. Has 1 Replica C1.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-purple">
            <span class="node-badge">Client Query</span>
            <span class="node-label">CRC16(key) % 16384</span>
            <span class="node-sub">Calculates target slot</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Routing Hit/Miss</span>
            <span class="node-label">Target Node</span>
            <span class="node-sub">If wrong: -MOVED &lt;slot&gt; &lt;ip:port&gt;</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Client Slot Cache</span>
            <span class="node-label">Updates local map</span>
            <span class="node-sub">Next query routes direct!</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Why Exactly 16,384 Slots: 16,384 ($2^{14}$) hash slots provide an optimal tradeoff between heartbeat payload size and cluster scalability. In cluster heartbeat packets, the slot bitmap consumes only 2 KB (16384 / 8 bytes). Using 65,536 slots would blow up the bitmap to 8 KB, causing excessive network overhead during Gossip.",
      "Hash Slot Algorithm: `HASH_SLOT = CRC16(key) mod 16384`. To force multiple keys into the same slot (for multi-key operations or transactions), use **Hash Tags**: `{user:100}:profile` and `{user:100}:orders` both hash ONLY the characters inside `{}` (`user:100`), guaranteeing they live on the same master node.",
      "MOVED vs ASK Redirection: 1) `MOVED <slot> <ip:port>`: Permanent redirect. The client updates its local slot cache and sends all future queries for that slot to the new master; 2) `ASK <slot> <ip:port>`: Temporary redirect during active slot resharding/migration. The client must send an `ASKING` command first to the target node for that single request, without updating its permanent cache.",
      "Gossip Protocol & Failure Detection: Nodes ping each other periodically over the cluster bus port (client port + 10000). If a node fails to respond within `cluster-node-timeout`, it is marked `PFAIL` (Possible Fail). When a majority of masters agree, it is broadcast as `FAIL`, and the replica initiates election.",
      "Asynchronous Replication & Split-Brain: Redis replication is asynchronous by default. If a master is network-partitioned, writes accepted by the old master before failover will be LOST when the old master rejoins as a replica. Prevent data loss using `min-replicas-to-write 1` and `min-replicas-max-lag 10`."
    ],
    codeSnippet: `# 1. Querying cluster slot topology via redis-cli:
CLUSTER SLOTS
# 1) 1) (integer) 0
#    2) (integer) 5460
#    3) 1) "10.0.1.10"
#       2) (integer) 6379 (Master A)
#    4) 1) "10.0.1.11"
#       2) (integer) 6379 (Replica A1)

# 2. Redis Cluster Hash Tag Example:
# Both keys guaranteed to land on the same master node:
MSET {tenant:42}:orders 15 {tenant:42}:revenue 45000

# 3. Redis Cluster Configuration (redis.conf):
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000`
  },

  {
    id: "redis-distributed-lock-redlock-lua",
    title: "Redis Distributed Locks: SETNX, Redlock & Lua Script Atomicity",
    category: "Distributed Concurrency",
    badge: "Distributed Locking",
    oneLiner: "Production distributed locks require atomic acquisition via SET key token NX PX with unique UUID tokens, atomic release via Lua scripts to avoid releasing other processes' locks, and watchdog renewal loops to handle long-running transactions.",
    summary: "Implementing distributed locks correctly in Redis requires strict adherence to distributed safety invariants. Naive implementations using `SETNX` followed by `EXPIRE` suffer from race conditions if the server crashes between the two commands. A correct lock acquisition uses `SET key uuid NX PX 30000`. Releasing the lock requires an atomic Lua script that verifies the caller's UUID matches before calling `DEL`. For multi-master high-availability clusters, the Redlock algorithm acquires locks across $N$ independent master nodes with majority quorum.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🔒 Safe Distributed Lock Lifecycle &amp; Watchdog Renewal</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">1. Atomic Lock Acquisition</div>
            <div class="space-desc">SET key &lt;UUID&gt; NX PX 30000</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">NX = Only if Not Exists; PX = Millisecond TTL; Value = Unique UUID token. Atomically guaranteed!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(220, 38, 38, 0.4); background: rgba(220, 38, 38, 0.08);">
            <div class="space-name" style="color: #f87171;">2. Atomic Release via Lua Script</div>
            <div class="space-desc">Check UUID == Token then DEL</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Prevents Process A from deleting Process B's lock if Process A's execution took longer than TTL!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Acquire Lock</span>
            <span class="node-label">SET resource:lock UUID NX PX</span>
            <span class="node-sub">Returns OK or nil</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Watchdog Loop</span>
            <span class="node-label">Redisson Auto-Renew</span>
            <span class="node-sub">Renews TTL every 10s</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Atomic Release</span>
            <span class="node-label">EVAL Lua Script</span>
            <span class="node-sub">if get(k)==uuid then del(k)</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Naive SETNX Pitfall: Calling `SETNX key val` and then `EXPIRE key 10` is NOT atomic. If your client dies or the network drops before `EXPIRE` executes, the lock key becomes immortal, causing permanent deadlock for all other workers. Always use the atomic single command: `SET key val NX PX 30000`.",
      "The Unintended Release Disaster: Process A acquires lock with 10s TTL. Process A pauses for 12s due to a Stop-the-World JVM GC pause. The lock expires. Process B acquires the lock. Process A wakes up and calls `DEL key` — deleting Process B's active lock! Now Process C acquires the lock, and both B and C execute concurrently. Solution: Store a unique UUID token, and verify the token via Lua script before deleting.",
      "Why Lua Script is Mandatory: Checking the token (`GET key == uuid`) and deleting (`DEL key`) involves two network round trips. Without Lua, a context switch between GET and DEL can still delete another process's lock. Lua scripts execute atomically in Redis's single thread.",
      "Redisson Watchdog Auto-Renewal: If a business operation takes longer than estimated, a client-side watchdog thread (like in Java's Redisson) periodically sends a heartbeat extending the lock's expiration by 30 seconds as long as the worker thread is alive.",
      "The Redlock Consensus Algorithm: Developed by Salvatore Sanfilippo (antirez) for multi-node Redis deployments. Acquires locks across 5 independent master nodes sequentially. If it acquires the lock on $\\ge 3$ nodes within timeout, and the total elapsed time is less than lock validity time, the lock is acquired."
    ],
    codeSnippet: `// 1. Safe Atomic Acquisition:
// String lockToken = UUID.randomUUID().toString();
// redis.set("lock:order:1001", lockToken, "NX", "PX", 30000);

// 2. Safe Atomic Release via Lua Script:
String luaScript = 
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
    "    return redis.call('del', KEYS[1]) " +
    "else " +
    "    return 0 " +
    "end";

// Execution:
// redis.eval(luaScript, 1, "lock:order:1001", lockToken);

// 3. Redisson Distributed Lock (Enterprise Java Standard):
RLock lock = redissonClient.getLock("order-lock");
try {
    // Watchdog automatically extends lock TTL until unlock() is called!
    if (lock.tryLock(5, 30, TimeUnit.SECONDS)) {
        processPayment();
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}`
  }
];

window.REVISION_APP_DATA.REDIS_QUESTIONS = [
  {
    id: "redis-q1-cache-stampede-thundering-herd",
    title: "1. Cache Stampede (Dog-Piling / Thundering Herd) Mitigation",
    difficulty: "Staff",
    category: "Caching Resilience",
    summary: "Preventing thousands of concurrent threads from crushing the primary SQL database when a hot cache key expires.",
    problem: "A high-traffic e-commerce homepage caches the product catalog under key 'home:catalog'. When this key expires at peak traffic (50,000 req/sec), thousands of concurrent threads experience cache misses and simultaneously execute the heavy SQL query against PostgreSQL, crashing the database within 5 seconds. How do you resolve this?",
    juniorTrap: "Simply increasing the cache TTL from 10 minutes to 1 hour, which just delays the catastrophic stampede until the next expiration.",
    interviewerIntent: "Assesses understanding of cache synchronization, distributed mutex locking, background asynchronous pre-fetching, and probabilistic early expiration (XFetch algorithm).",
    seniorAnswer: [
      "The Root Cause: When a hot cache key expires, $N$ concurrent client requests miss the cache at the exact same instant ($t_0$). All $N$ requests bypass the cache and hammer the backing database, exhausting database connection pools and CPU.",
      "Solution 1 - Distributed Mutex Lock: The first thread that encounters a cache miss attempts to acquire a distributed Redis lock (`SET lock:home:catalog uuid NX PX 5000`). If acquired, it queries the DB and repopulates Redis. The remaining 49,999 threads fail to get the lock, sleep for 50ms, and re-read from the cache.",
      "Solution 2 - Probabilistic Early Expiration (XFetch Algorithm): Instead of waiting for the key to expire, calculate an early refresh probability on read: `delta = compute_time * beta * ln(random())`. If `currentTime - delta > expiration`, the current thread refreshes the cache asynchronously while continuing to serve the existing cached value.",
      "Solution 3 - Background Scheduled Cron / Never Expire: Set the key with NO TTL in Redis, and run a background task (e.g. Spring `@Scheduled` or Kafka consumer) that updates the cache every 5 minutes out-of-band."
    ],
    innerWorking: "XFetch algorithm formula: $\\Delta t = -\\beta \\cdot \\delta \\cdot \\ln(\\text{rand}())$. As time approaches expiration, the probability of early background recalculation approaches 100%, guaranteeing the key is always refreshed before expiring.",
    solution: `// Solution 1: Distributed Mutex Lock Pattern:
public ProductCatalog getCatalog() {
    String cached = redis.get("home:catalog");
    if (cached != null) return deserialize(cached);

    String lockKey = "lock:home:catalog";
    String token = UUID.randomUUID().toString();
    
    // Attempt to acquire lock for 5 seconds
    if ("OK".equals(redis.set(lockKey, token, "NX", "PX", 5000))) {
        try {
            // Re-check cache in case another thread just populated it (Double-Checked Locking)
            cached = redis.get("home:catalog");
            if (cached != null) return deserialize(cached);

            ProductCatalog catalog = database.fetchHeavyCatalog();
            redis.setex("home:catalog", 600, serialize(catalog));
            return catalog;
        } finally {
            releaseLockLua(lockKey, token);
        }
    } else {
        // Fallback: Sleep 50ms and retry reading cache
        Thread.sleep(50);
        return getCatalog();
    }
}`,
    warStory: "During Cyber Monday, a major retailer cached their top banner deals with a 15-minute TTL. At 12:15 PM, the key expired during 80,000 req/sec traffic. 40,000 concurrent database connections were opened, maxing PostgreSQL CPU at 100% and causing a 12-minute sitewide outage. Implementing a 1-second mutex lock resolved the stampede completely."
  },

  {
    id: "redis-q2-cache-penetration-bloom-filter",
    title: "2. Cache Penetration Defense: Bloom Filters vs Empty Value Caching",
    difficulty: "Senior",
    category: "Caching Resilience",
    summary: "Protecting databases against malicious queries for non-existent keys using Bloom Filters and Null-Object caching with short TTLs.",
    problem: "An attacker targets your REST API by sending 100,000 requests per second with random, non-existent user IDs ('/api/users/-999999', '/api/users/null_attack'). Since the IDs do not exist in Redis, every single request misses the cache and hits the database, starving legitimate user traffic. How do you stop this?",
    juniorTrap: "Relying purely on rate limiting without solving the underlying architectural vulnerability.",
    interviewerIntent: "Tests understanding of Bloom Filter bit arrays, false positive rates, hash functions, and Null Object caching strategies.",
    seniorAnswer: [
      "Cache Penetration Definition: Cache Penetration occurs when requested keys exist NEITHER in the cache NOR in the database. Every request penetrates straight through to the persistent datastore.",
      "Strategy 1 - Caching Empty / Null Objects: When the database returns null for an ID, store a sentinel value in Redis: `SET user:-999999 'NULL' EX 60`. Future requests for that fake ID hit Redis and return immediately. Crucial: Always set a short TTL (e.g. 60s) so newly created valid records are not blocked indefinitely.",
      "Strategy 2 - Redis Bloom Filter (RedisBloom module): A Bloom Filter is a space-efficient probabilistic data structure. When a user is created in the DB, add their ID to the Bloom filter (`BF.ADD user_filter 1001`). When a request arrives, check `BF.EXISTS user_filter <id>`. If it returns false, the key 100% GUARANTEED DOES NOT EXIST! Reject the request immediately without touching Redis cache or the database.",
      "Bloom Filter Tradeoffs: Bloom filters have ZERO false negatives (if it says absent, it is definitely absent), but have a small configurable false positive rate (e.g. 1%). They do not support deletions unless a Counting Bloom Filter is used."
    ],
    innerWorking: "A Bloom Filter uses $m$ bits and $k$ independent hash functions. Setting an element hashes its value and sets $k$ bit positions to 1. Querying tests whether all $k$ bit positions are 1.",
    solution: `# 1. Using RedisBloom Module CLI:
BF.RESERVE user_filter 0.01 1000000 # 1% error rate for 1M keys (takes ~1.2 MB RAM!)
BF.ADD user_filter "user:1001"
BF.EXISTS user_filter "user:1001" # Returns 1
BF.EXISTS user_filter "user:-999" # Returns 0 (Reject immediately at API gateway!)

# 2. Application Logic with Null-Object Caching:
public User getUser(Long id) {
    String key = "user:" + id;
    String val = redis.get(key);
    
    if ("EMPTY_SENTINEL".equals(val)) return null; // Fast rejection
    if (val != null) return deserialize(val);

    User user = db.findById(id);
    if (user == null) {
        redis.setex(key, 60, "EMPTY_SENTINEL"); // Cache null with short 60s TTL
        return null;
    }
    redis.setex(key, 3600, serialize(user));
    return user;
}`,
    warStory: "A SaaS company was blackmailed by an attacker querying random UUIDs. The PostgreSQL RDS CPU hit 100% and crashed. The team deployed a RedisBloom filter at the API gateway layer taking only 4MB of RAM; 99% of malicious requests were rejected in 0.2ms before ever touching the database."
  },

  {
    id: "redis-q3-cache-breakdown-vs-cache-avalanche",
    title: "3. Cache Breakdown vs Cache Avalanche: Distinctions & Disaster Recovery",
    difficulty: "Senior",
    category: "Caching Resilience",
    summary: "Distinguishing between single hot-key breakdown and mass multi-key avalanche, and mitigating with TTL Jitter and Multi-Level Caching.",
    problem: "Interviewers frequently ask: 'What is the exact architectural difference between Cache Breakdown and Cache Avalanche, and what specific engineering techniques prevent each in high-scale systems?'",
    juniorTrap: "Confusing Breakdown (1 single ultra-hot key expiring) with Avalanche (thousands of different keys expiring at the exact same second).",
    interviewerIntent: "Assesses precision in caching terminology, understanding of synchronized expiration waves, and resilience patterns (TTL jitter, multi-level caching).",
    seniorAnswer: [
      "Cache Breakdown (Hotspot Invalidation): A single key that receives massive traffic (e.g. Michael Jackson passes away, breaking news headline) suddenly expires. The sudden void causes thousands of concurrent threads to hit the DB for that ONE key.",
      "Cache Avalanche (Mass Expiration): Thousands of different cache keys expire at the exact same wall-clock timestamp (e.g. a batch job inserted 1,000,000 product keys at midnight with `EXPIRE 86400`). At midnight the next day, all 1M keys expire in the same second, overwhelming the database across all tables.",
      "Preventing Breakdown: 1) Never expire hot keys (renew via background worker); 2) Mutex locking on cache miss; 3) Probabilistic early refresh.",
      "Preventing Avalanche: 1) **TTL Jitter**: Never set a uniform expiration time! Always add random jitter: `TTL = base_ttl + random(0, 300)`. This scatters expirations evenly across a 5-minute bell curve; 2) **Multi-Level Caching (L1/L2)**: Local in-memory Caffeine cache (L1, 30s) + Distributed Redis (L2, 1hr) absorbs expiration shocks; 3) Circuit breaking via Resilience4j to shed DB load if avalanche occurs."
    ],
    innerWorking: "Uniform TTLs create periodic spike waves in memory eviction and database read IOPS. Adding a uniform random variable $X \\sim U(0, W)$ flattens the delta function into a uniform distribution.",
    solution: `// Applying TTL Jitter to prevent Cache Avalanche:
public void cacheProduct(String productId, Product product) {
    int baseTtlSeconds = 3600; // 1 hour
    int randomJitter = ThreadLocalRandom.current().nextInt(0, 600); // 0 to 10 minutes jitter
    
    int finalTtl = baseTtlSeconds + randomJitter;
    redis.setex("product:" + productId, finalTtl, serialize(product));
}

// Multi-Level Caching (Caffeine L1 + Redis L2):
public Product getProductWithL1L2(String id) {
    // 1. Check ultra-fast L1 local memory (0.01ms):
    Product p = caffeineCache.getIfPresent(id);
    if (p != null) return p;

    // 2. Check distributed Redis L2 (1ms):
    p = redisClient.get("product:" + id);
    if (p != null) {
        caffeineCache.put(id, p); // Populate L1
        return p;
    }

    // 3. Fallback to DB:
    p = db.find(id);
    redisClient.setex("product:" + id, 3600 + jitter(), p);
    caffeineCache.put(id, p);
    return p;
}`,
    warStory: "An app deployed a daily midnight cron job caching 500,000 items with `expire: 86400`. Every night at exactly 00:00:00, the database crashed from 500,000 simultaneous cache evictions. Adding `+ random(300)` seconds of jitter dispersed the expiration curve and kept DB CPU below 15%."
  },

  {
    id: "redis-q4-big-keys-and-hot-keys-detection-lazyfree",
    title: "4. Big Keys & Hot Keys: Production Triage, Latency Spikes & UNLINK",
    difficulty: "Staff",
    category: "Performance Tuning",
    summary: "Detecting and eliminating Big Keys that block Redis's single thread, and safely deleting gigabyte collections via asynchronous UNLINK.",
    problem: "Redis latency metrics show sudden spikes up to 400ms, causing timeouts across microservices. Investigation reveals an engineer stored a Hash with 2,000,000 fields under a single key and executed 'DEL my_big_hash'. Why did DEL freeze Redis, and how do you triage and prevent Big Keys?",
    juniorTrap: "Using 'DEL' or 'HGETALL' on multi-megabyte collections, blocking the entire Redis server.",
    interviewerIntent: "Assesses mastery of Redis memory reclamation, asynchronous lazy-freeing (`UNLINK`), scan-based discovery, and sharding big collections.",
    seniorAnswer: [
      "Why DEL Freezes Redis: Memory deallocation in C is synchronous. Calling `DEL` on a key containing 2,000,000 elements requires Redis's single thread to traverse and free 2,000,000 memory pointers in sequence! This blocks the event loop for hundreds of milliseconds, dropping all other client connections.",
      "The UNLINK Solution (Lazy Freeing): Redis 4.0+ introduced `UNLINK`. Unlike `DEL`, `UNLINK` immediately removes the key from the keyspace namespace in $O(1)$ time, and hands off the heavy memory deallocation to a background worker thread (`bio.c`).",
      "Configuring Lazy Freeing in redis.conf: Enable `lazyfree-lazy-eviction yes`, `lazyfree-lazy-expire yes`, and `lazyfree-lazy-server-del yes` so automated evictions and expirations never block the main thread.",
      "How to Detect Big Keys Safely: NEVER run `KEYS *`. Use `redis-cli --bigkeys` (uses `SCAN` without blocking) or `redis-cli --memkeys`. For detailed inspection, run `MEMORY USAGE key`.",
      "Sharding Big Keys: If an entity needs 1,000,000 sub-items, shard the key into buckets: `user:1001:items:bucket_1`, `user:1001:items:bucket_2` using `hash(item_id) % 100`."
    ],
    innerWorking: "Redis's background I/O subsystem (`bio.c`) maintains background job queues (`BIO_LAZY_FREE`). `UNLINK` disassociates the `robj` and queues the pointer to the background thread's job list.",
    solution: `# 1. Safely find big keys without blocking production:
redis-cli -h 10.0.1.5 -p 6379 --bigkeys

# 2. Inspect memory footprint of a suspect key:
MEMORY USAGE user:activity:log

# 3. Always UNLINK instead of DEL:
UNLINK user:activity:log

# 4. Enable automatic asynchronous deallocation in redis.conf:
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
lazyfree-lazy-user-del yes`,
    warStory: "A gaming company stored global player leaderboards in a single Redis Sorted Set with 10 million players. Nightly batch reset called `DEL leaderboard`. The main thread froze for 3.2 seconds every night, triggering Redis Sentinel false-alarm failovers until `UNLINK` and lazy-freeing were enabled."
  },

  {
    id: "redis-q5-redis-dual-write-consistency-sql",
    title: "5. Redis Dual-Write Consistency with SQL Databases",
    difficulty: "Staff",
    category: "Data Consistency",
    summary: "Cache-Aside pattern invariants: why you should Delete rather than Update the cache, and mitigating race conditions via Delayed Double Deletion & CDC Debezium.",
    problem: "When updating a database record and its corresponding Redis cache, should you Update the cache or Delete the cache? Should you mutate DB first or Cache first? How do you prevent stale cache values under concurrent updates?",
    juniorTrap: "Updating the cache directly ('DB.update(); Redis.set()') or deleting the cache before updating the database.",
    interviewerIntent: "Tests deep knowledge of distributed dual-write fallacies, concurrency race conditions, Delayed Double Deletion, and Binlog/CDC-based cache invalidation.",
    seniorAnswer: [
      "Rule 1 - Delete Cache, Do NOT Update Cache: If Worker A and Worker B update the same entity concurrently: Worker A writes DB, Worker B writes DB, Worker A updates Cache, Worker B updates Cache. Due to network race conditions, Worker A's cache write might arrive AFTER Worker B's! The cache now permanently contains Worker A's stale data. Deleting the cache forces subsequent reads to reload the latest committed DB state.",
      "Rule 2 - Mutate DB First, THEN Delete Cache (Cache-Aside): If you delete the cache FIRST, a concurrent read thread will miss the cache, read the OLD uncommitted DB state, and repopulate Redis with stale data before the write thread finishes updating the DB!",
      "The Edge-Case Race Condition: Thread A reads DB (old value). Thread B updates DB and deletes Cache. Thread A repopulates Cache with old value. Although statistically rare (DB write is slower than cache read), it can occur.",
      "Solution A - Delayed Double Deletion: Mutate DB ➔ Delete Cache ➔ Sleep 500ms ➔ Delete Cache again. The second delete evicts any stale cache populated by concurrent reads during the write window.",
      "Solution B - Change Data Capture (CDC via Debezium/Canal): Decouple cache deletion entirely from the application! Applications ONLY write to the database. An asynchronous CDC pipeline reads PostgreSQL WAL / MySQL Binlog and streams cache deletion events to Redis, guaranteeing eventual consistency."
    ],
    innerWorking: "Cache-Aside read flow: `get(key) ➔ hit ? return : query_db() ➔ set(key, val)`. Cache-Aside write flow: `update_db() ➔ del(key)`.",
    solution: `// 1. Standard Cache-Aside Write (Update DB first, then evict):
@Transactional
public void updateUser(User user) {
    userRepository.save(user); // 1. Commit to SQL Database
    
    // 2. Invalidate cache AFTER DB commit
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
            redisTemplate.delete("user:" + user.getId());
        }
    });
}

// 2. Delayed Double Deletion Pattern:
public void updateUserWithDelayedDoubleDelete(User user) {
    redisTemplate.delete("user:" + user.getId()); // 1. Pre-evict
    userRepository.save(user);                     // 2. Write to DB
    
    // 3. Asynchronous second delete after 500ms:
    completableFuture.runAsync(() -> {
        Thread.sleep(500);
        redisTemplate.delete("user:" + user.getId());
    });
}`,
    warStory: "A banking microservice updated user balances with `userRepo.save()` followed by `redis.set(user)`. Under 1,000 concurrent transfers, network jitter inverted two cache writes. A user had $500 in PostgreSQL but their Redis cache showed $1,200, allowing fraudulent overdraft withdrawals until Cache-Aside deletion was enforced."
  },

  {
    id: "redis-q6-redis-distributed-lock-pitfalls-redisson",
    title: "6. Distributed Lock Pitfalls: GC Pauses, Split-Brain & Redisson Watchdog",
    difficulty: "Staff",
    category: "Distributed Concurrency",
    summary: "Why simple TTLs fail during JVM Stop-The-World GC pauses, handling lock renewal via Watchdog, and Martin Kleppmann's Redlock critique.",
    problem: "You implemented a distributed lock in Redis with a 10-second TTL. During a major Stop-the-World JVM GC pause (or long I/O call), your application freezes for 12 seconds. What disaster occurs, and how do you achieve distributed safety?",
    juniorTrap: "Assuming that setting a large TTL (e.g. 60 seconds) makes distributed locks bulletproof.",
    interviewerIntent: "Assesses understanding of asynchronous replication failover loss, timing assumptions in distributed systems, fencing tokens, and automated renewal loops.",
    seniorAnswer: [
      "The GC Pause Invariant Violation: 1) Client 1 acquires lock with 10s TTL; 2) Client 1 enters a 12s JVM GC pause; 3) At 10s, the lock expires in Redis; 4) Client 2 acquires the same lock; 5) Client 1 wakes up from GC pause believing it still holds the lock! Both Client 1 and Client 2 now execute critical section code concurrently, corrupting state.",
      "The Master-Replica Asynchronous Failover Trap: Client 1 acquires a lock on Redis Master. Master crashes BEFORE the write replicates to the replica! Sentinel promotes the replica to new Master. Client 2 requests the lock on the new master and succeeds! Two clients now hold the lock.",
      "Solution 1 - Automatic Watchdog Renewal (Redisson): Redisson sets a 30s TTL and runs a client-side background timer thread. Every 10 seconds (1/3 of TTL), if the thread is still executing, the watchdog issues a Lua script extending the lock TTL back to 30s. If the process crashes, the watchdog dies and the lock expires cleanly.",
      "Solution 2 - Fencing Tokens (Martin Kleppmann's Solution): Every lock acquisition returns a monotonically increasing sequence number (fencing token: e.g. 101, 102). When the client writes to the storage layer (DB/S3), the storage layer rejects any write with a token lower than the highest token seen so far."
    ],
    innerWorking: "Redisson's watchdog executes `scheduleExpirationRenewal`: calls `HEXISTS lockName threadId` in Redis via Lua every `lockWatchdogTimeout / 3` ms.",
    solution: `// Proper Distributed Lock with Redisson Watchdog & Fencing:
RLock lock = redissonClient.getLock("inventory:sku:9812");

try {
    // tryLock with leaseTime = -1 activates WATCHDOG auto-renewal!
    boolean acquired = lock.tryLock(5, -1, TimeUnit.SECONDS);
    if (acquired) {
        // Critical section: Watchdog renews lock every 10s indefinitely
        // until business execution finishes.
        performInventoryDeduction();
    }
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock(); // Safely cancels watchdog and releases lock
    }
}`,
    warStory: "An inventory deduction service held a 5-second Redis lock. A database bottleneck caused an order processing thread to block for 6 seconds. The lock expired, another worker picked up the same ticket, and 200 high-end laptops were double-sold during a flash sale. Redisson's watchdog auto-renewal eliminated the race condition."
  },

  {
    id: "redis-q7-memory-fragmentation-ratio-activedefrag",
    title: "7. Memory Fragmentation Ratio Triage & Active Defragmentation",
    difficulty: "Senior",
    category: "Memory Management",
    summary: "Diagnosing used_memory_rss vs used_memory (> 1.5), understanding jemalloc memory allocation slabs, and running active defrag online.",
    problem: "'redis-cli INFO memory' shows 'used_memory: 4GB' but 'used_memory_rss: 8.5GB', giving a fragmentation ratio of 2.12. The host is running out of physical RAM. Why is Redis consuming double its actual data size, and how do you fix it without restarting?",
    juniorTrap: "Assuming Redis has a memory leak and immediately restarting the production node, causing cache loss and downtime.",
    interviewerIntent: "Tests understanding of memory allocators (jemalloc), memory pages, slab allocation fragmentation, and Redis active defragmentation algorithms.",
    seniorAnswer: [
      "The Fragmentation Ratio Formula: `mem_fragmentation_ratio = used_memory_rss / used_memory`. 1) Ratio ~1.0 to 1.3: Normal and healthy; 2) Ratio > 1.5: Severe fragmentation (OS allocated 8.5GB, but Redis only holds 4GB of data); 3) Ratio < 1.0: Operating system has swapped Redis memory to disk (catastrophic latency).",
      "Why jemalloc Causes Fragmentation: Redis uses `jemalloc` as its memory allocator. jemalloc allocates memory in fixed-size power-of-two slabs (8, 16, 32, 64, 128 bytes...). If you store lots of variable-length strings and mutate/delete them repeatedly, jemalloc cannot return fragmented pages back to the Linux kernel even though the internal slots are empty.",
      "Online Remediation - Active Defragmentation: Redis 4.0+ includes an online memory defragmenter. It allocates a new memory chunk, copies data from fragmented pages into contiguous memory, updates pointers, and frees the fragmented pages back to the OS.",
      "Enabling Active Defrag: Run `CONFIG SET activedefrag yes` or configure `active-defrag-ignore-bytes 100mb` and `active-defrag-threshold-lower 10` in `redis.conf`."
    ],
    innerWorking: "Active defragmentation iterates over keys using a background timer. It inspects whether an object pointer resides in a fragmented memory page; if so, it reallocates the object into a packed page.",
    solution: `# 1. Inspect memory metrics via redis-cli:
127.0.0.1:6379> INFO memory
# used_memory: 4294967296 (4 GB actual data)
# used_memory_rss: 9126805504 (8.5 GB allocated from OS)
# mem_fragmentation_ratio: 2.12

# 2. Trigger active defragmentation dynamically without restarting:
127.0.0.1:6379> CONFIG SET activedefrag yes

# 3. Production tuning in redis.conf:
activedefrag yes
active-defrag-ignore-bytes 100mb     # Start defrag only if wasted memory > 100MB
active-defrag-threshold-lower 10    # Start defrag when fragmentation exceeds 10%
active-defrag-threshold-upper 30    # Maximum effort when fragmentation exceeds 30%
active-defrag-cycle-min 5           # Minimum CPU percentage dedicated to defrag
active-defrag-cycle-max 50          # Maximum CPU percentage dedicated to defrag`,
    warStory: "A real-time telemetry service wrote and deleted millions of ephemeral session tokens. Over 4 weeks, `used_memory_rss` climbed to 30GB while actual keys consumed only 8GB. The Linux OOM killer terminated Redis. Setting `activedefrag yes` maintained the fragmentation ratio at 1.15 permanently."
  },

  {
    id: "redis-q8-aof-rewrite-disk-spikes-fork-cow-exhaustion",
    title: "8. AOF Rewrite Disk Spikes & Linux fork() CoW Memory Exhaustion",
    difficulty: "Staff",
    category: "Persistence & OS Tuning",
    summary: "Preventing node crashes during background AOF rewrites (BGREWRITEAOF) caused by Copy-on-Write memory page bloat and disk I/O fsync blocking.",
    problem: "During an automated background AOF rewrite ('BGREWRITEAOF'), a 16GB Redis instance on a 32GB server crashes with 'Out of Memory: Kill process (redis-server)'. Concurrently, client request latencies spike to 500ms. What happened at the Linux kernel layer?",
    juniorTrap: "Assuming that background AOF rewrites have zero impact on host memory and disk I/O.",
    interviewerIntent: "Assesses expertise in Linux virtual memory page tables, Transparent Huge Pages (THP) pitfalls, and AOF rewrite write-buffer throttling.",
    seniorAnswer: [
      "The CoW Memory Explosion: When `BGREWRITEAOF` starts, Redis calls `fork()`. If the application sustains high write throughput during the rewrite, every write to an existing key causes the Linux kernel to duplicate the corresponding memory page (Copy-on-Write). If writes touch 50% of memory pages, total RAM usage surges from 16GB to 24GB+!",
      "The Transparent Huge Pages (THP) Disaster: Linux THP defaults to 2MB memory pages instead of standard 4KB pages. If a client mutates a tiny 10-byte string, the kernel must duplicate an ENTIRE 2MB page! This multiplies Copy-on-Write memory consumption by up to 500x and introduces severe kernel page-fault latency spikes.",
      "The Mandatory Linux Fix: Disable Transparent Huge Pages permanently: `echo never > /sys/kernel/mm/transparent_hugepage/enabled`.",
      "Disk I/O Contention: During rewrite, the child process writes hundreds of MBs of data to disk. If the main thread attempts to `fsync` normal client writes simultaneously, it blocks on disk I/O! Set `no-appendfsync-on-rewrite yes` to tell the main thread not to call fsync while a child BGSAVE/BGREWRITE is active."
    ],
    innerWorking: "When `no-appendfsync-on-rewrite yes` is set, Redis avoids calling `fsync()` from the main thread during child rewrite. If Redis crashes during this window, up to 30 seconds of writes could be lost, but latency spikes and main-thread disk blocks are completely avoided.",
    solution: `# 1. Disable Transparent Huge Pages (THP) on host:
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# 2. Add to /etc/rc.local or systemd startup script:
if test -f /sys/kernel/mm/transparent_hugepage/enabled; then
   echo never > /sys/kernel/mm/transparent_hugepage/enabled
fi

# 3. Optimize redis.conf for non-blocking AOF rewrite:
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 1gb`,
    warStory: "A production Redis cluster with 20GB memory kept getting OOMKilled every Tuesday at 2 AM during automated AOF rewrites. SREs discovered Transparent Huge Pages was set to `always`. Disabling THP dropped CoW memory allocation from 12GB down to 650MB during rewrites."
  },

  {
    id: "redis-q9-sentinel-split-brain-data-loss",
    title: "9. Redis Sentinel Split-Brain & Preventing Master Demotion Data Loss",
    difficulty: "Staff",
    category: "Clustering & High Availability",
    summary: "How network partitions isolate the old master, cause split-brain data writes, and how min-replicas-to-write prevents data loss.",
    problem: "A network partition separates Master M from Sentinel nodes and Replicas. Sentinels failover and promote Replica R1 to new Master M2. However, some application clients remain connected to old Master M and continue writing to it for 30 seconds. When the network heals, Master M is demoted to a replica and ALL writes sent to it are wiped out! How do you prevent this?",
    juniorTrap: "Believing that Redis Sentinel guarantees strong consistency and zero data loss out-of-the-box.",
    interviewerIntent: "Assesses understanding of CAP theorem tradeoffs in Redis Sentinel, asynchronous replication loss, and configuration fencing via min-replicas-to-write.",
    seniorAnswer: [
      "The Split-Brain Mechanism: During a network partition, the old master (M) and new master (M2) both accept writes simultaneously. When the partition heals, Sentinel instructs M to become a replica of M2. As part of replica synchronization, M executes `FLUSHALL` and downloads M2's RDB snapshot, destroying all writes accepted by M during the partition!",
      "The Solution - min-replicas-to-write: Configure `min-replicas-to-write 1` and `min-replicas-max-lag 10`. This tells Master M: 'If you do not have at least 1 healthy replica acknowledging heartbeats within 10 seconds, REJECT ALL WRITE COMMANDS with an error'.",
      "How It Prevents Data Loss: As soon as the network isolates Master M from its replicas for > 10s, M transitions into read-only mode. Clients attempting to write to M receive an error and fail over to M2, preventing uncommitted writes from being wiped out."
    ],
    innerWorking: "Replicas send periodic `REPLCONF ACK <offset>` pings to the master every second. The master tracks the elapsed time since the last ACK from each replica. If the count of replicas with `lag <= min-replicas-max-lag` is less than `min-replicas-to-write`, writes are blocked.",
    solution: `# /etc/redis/redis.conf on all Master and Replica nodes:

# Require at least 1 replica to be connected and acknowledged:
min-replicas-to-write 1

# Maximum acceptable replication lag in seconds:
min-replicas-max-lag 10

# Client behavior when master is isolated:
# Client writes fail fast with:
# (error) NOREPLICAS Not enough good replicas to write.`
  },

  {
    id: "redis-q10-transactions-multi-exec-lua-atomicity",
    title: "10. Redis Transactions: MULTI/EXEC vs Lua Scripting & No-Rollback Behavior",
    difficulty: "Senior",
    category: "Transactions & Concurrency",
    summary: "Why Redis transactions do NOT support rollback on runtime command errors, optimistic locking via WATCH, and when Lua scripts are mandatory.",
    problem: "A developer writes a Redis transaction using MULTI / EXEC: 1) SET user:1:balance 100; 2) HSET user:1:balance 'invalid_op'; 3) INCR user:1:tx_count. Command 2 throws a WRONGTYPE error at runtime. Does Redis roll back Command 1? Why does Redis NOT implement relational-style rollbacks?",
    juniorTrap: "Assuming that Redis MULTI/EXEC provides full ACID transactions with automatic rollback like PostgreSQL or MySQL.",
    interviewerIntent: "Tests understanding of Redis transaction mechanics, optimistic concurrency control via WATCH, and why Redis delegates complex atomicity to Lua.",
    seniorAnswer: [
      "No Rollback Invariant: Redis DOES NOT roll back on runtime command errors! In the scenario above, Command 1 succeeds, Command 2 fails with `WRONGTYPE`, and Command 3 SUCCEEDS! Redis executes all queued commands in sequence.",
      "Why Salvatore Sanfilippo Omitted Rollback: 1) Runtime errors in Redis are programming bugs (e.g. calling `HSET` on a string), which should be caught during testing; 2) Implementing rollback logic requires tracking rollback logs and undo buffers, drastically increasing complexity and degrading single-threaded execution speed.",
      "Optimistic Locking via WATCH: `WATCH key` monitors keys for modifications. If another client mutates `key` before `EXEC`, the entire transaction is discarded and `EXEC` returns `nil`.",
      "Why Lua Scripting is Superior: MULTI/EXEC cannot read values to make conditional branch decisions mid-transaction (you cannot say 'if GET x > 10 then DECR x'). A **Lua Script** executes atomically on the main thread, can read state and branch conditionally, and rolls back cleanly on script error before committing mutations."
    ],
    innerWorking: "Commands between `MULTI` and `EXEC` are appended to an internal client command queue. During `EXEC`, Redis loops through the queue. Syntax errors during queuing abort the transaction (`DISCARD`), but execution errors mid-run do not stop remaining commands.",
    solution: `// ❌ MULTI/EXEC Trap (Does NOT Rollback on Runtime Error):
// 127.0.0.1:6379> MULTI
// 127.0.0.1:6379(TX)> SET balance 100
// 127.0.0.1:6379(TX)> LPOP balance  <-- Fails with WRONGTYPE
// 127.0.0.1:6379(TX)> INCR tx_count <-- SUCCEEDS ANYWAY!
// 127.0.0.1:6379(TX)> EXEC

// ✅ Atomic Lua Script for Conditional Execution:
String luaScript = 
    "local current = tonumber(redis.call('get', KEYS[1]) or '0') " +
    "local amount = tonumber(ARGV[1]) " +
    "if current >= amount then " +
    "    redis.call('decrby', KEYS[1], amount) " +
    "    return 1 " + // Success
    "else " +
    "    return 0 " + // Insufficient funds: NO STATE MUTATED!
    "end";

Long result = (Long) redis.eval(luaScript, 1, "account:101", "50");`,
    warStory: "An online betting site used `MULTI`/`EXEC` to deduct user tokens and credit a tournament ticket. An unexpected string type on the tournament counter caused the second command to fail, but the token deduction succeeded. Users lost money without getting tickets until the flow was migrated to an atomic Lua script."
  },

  {
    id: "redis-q11-zset-skiplist-internal-mechanics",
    title: "11. Sorted Set (ZSet) Internals: Why SkipList Beats Balanced Trees",
    difficulty: "Staff",
    category: "Data Structures & Algorithms",
    summary: "SkipList probabilistic level assignment, forward pointers, level span for O(log N) rank computation, and memory efficiency vs Red-Black trees.",
    problem: "Why did Redis choose a SkipList over a Red-Black Tree or AVL Tree to implement Sorted Sets (ZSet)? How does ZSet compute rank (e.g. 'ZRANK key member') in O(log N) time?",
    juniorTrap: "Assuming that Red-Black trees are always superior to SkipLists for ordered data structures.",
    interviewerIntent: "Assesses deep data structure knowledge, understanding of pointer traversal, range queries, and augmented data structures.",
    seniorAnswer: [
      "Why SkipList Wins Over Balanced Trees: 1) **Simpler Range Queries**: In a SkipList, finding range boundaries (`ZRANGEBYSCORE min max`) takes $O(\\log N)$, after which you simply traverse the bottom-level forward linked list. In a Red-Black tree, finding ranges requires in-order tree traversal with complex parent pointer tracking; 2) **No Rebalancing Cascades**: Inserting into an AVL or Red-Black tree triggers tree rotations that can rebalance up to the root. A SkipList adjusts only local node pointers; 3) **Memory Tuning**: SkipList pointer overhead can be tuned via probability $p=0.25$ (averaging only 1.33 pointers per node).",
      "How ZSet Computes Rank in $O(\\log N)$ Time: Standard SkipLists only store forward pointers. Redis augments its SkipList nodes (`zskiplistNode`) with a `span` field on every level! `span` represents the number of intermediate nodes between the current node and the forward node.",
      "Rank Computation: To compute the rank of a member, Redis traverses from the top level down, accumulating the `span` of all traversed edges. The total sum is the exact 1-based rank in $O(\\log N)$ time without counting individual elements!"
    ],
    innerWorking: "Each node randomly chooses its level height using geometric distribution ($P=0.25$, max levels = 32). The dual structure includes a hash table mapping `member ➔ score` ($O(1)$ lookup) and the SkipList mapping `score ➔ member` ($O(\\log N)$ range and rank).",
    solution: `// Redis C implementation of SkipList Level with Span:
typedef struct zskiplistNode {
    sds ele;                          // Member string
    double score;                     // Sorted score
    struct zskiplistNode *backward;   // Level 0 backward pointer
    struct zskiplistLevel {
        struct zskiplistNode *forward;
        unsigned long span;           // CRITICAL: Number of nodes skipped!
    } level[];
} zskiplistNode;

// Inspecting rank in Redis:
// ZADD leaderboard 100 "Alice" 200 "Bob" 300 "Charlie"
// ZRANK leaderboard "Bob"   -> Returns 1 (0-indexed rank, O(log N) via span!)
// ZREVRANK leaderboard "Bob"-> Returns 1 (from top)`
  },

  {
    id: "redis-q12-redis-streams-vs-kafka",
    title: "12. Redis Streams vs Apache Kafka: Architecture & Tradeoffs",
    difficulty: "Senior",
    category: "Message Streaming & Queues",
    summary: "Comparing Redis Streams (XADD, XREADGROUP, PEL, ACK) against Kafka partitions, consumer rebalancing, and data retention.",
    problem: "Your team needs an asynchronous event bus for order processing. An engineer proposes Redis Streams instead of Apache Kafka to avoid operational complexity. What are the architectural differences, and when is Redis Streams appropriate vs Kafka?",
    juniorTrap: "Treating Redis Streams as a 1:1 replacement for Kafka at enterprise scale without considering RAM cost and consumer rebalancing.",
    interviewerIntent: "Tests understanding of message brokers, log-centric architectures, consumer groups, backpressure, and memory vs disk durability.",
    seniorAnswer: [
      "Core Similarities: Both Redis Streams and Kafka use append-only commit logs, assign monotonic IDs, support Consumer Groups (`XGROUP CREATE`), track offsets per consumer group, and require explicit ACKs (`XACK`).",
      "Key Advantage of Redis Streams: 1) **Sub-millisecond Latency**: Reads and writes occur in RAM (< 1ms vs Kafka's 5-15ms); 2) **Zero Operational Complexity**: No ZooKeeper/KRaft quorum, no broker clustering, no topic partition rebalancing latency; 3) **Pending Entries List (PEL)**: Redis natively tracks unacknowledged in-flight messages per consumer, making dead-letter retries (`XPENDING`, `XCLAIM`) trivial.",
      "Why Kafka Wins at Enterprise Scale: 1) **RAM vs Disk Cost**: Redis Streams store messages in RAM. Storing 1 TB of events costs thousands of dollars in memory! Kafka stores messages sequentially on cheap NVMe/HDD disks with OS page-cache page readahead; 2) **Throughput & Partitions**: Kafka easily scales to millions of msgs/sec across hundreds of partitions. Redis Streams are bounded by single-shard memory and single-threaded writes.",
      "The Decision Matrix: Use **Redis Streams** for lightweight microservice queues, real-time notifications, or short-lived event streams (< 100,000 items) where Redis is already deployed. Use **Kafka** for enterprise-wide event backbones, CDC data lakes, and high-retention (days/weeks) audit logs."
    ],
    innerWorking: "Redis Streams use Radix Trees (Rax) to index message IDs (`<timestamp>-<sequence>`). Each stream chunk stores multiple messages packed in a Listpack to conserve RAM.",
    solution: `# Redis Streams Consumer Group Workflow:
# 1. Producer writes event:
XADD orders_stream * order_id 1001 user "Alice" amount 450

# 2. Create consumer group:
XGROUP CREATE orders_stream billing_group $ MKSTREAM

# 3. Consumer reads new messages:
XREADGROUP GROUP billing_group consumer_1 COUNT 10 BLOCK 2000 STREAMS orders_stream >

# 4. Acknowledge processing:
XACK orders_stream billing_group 1672531199000-0

# 5. Handle crashed consumer via Pending Entries List (PEL):
XPENDING orders_stream billing_group - + 10
XCLAIM orders_stream billing_group consumer_2 60000 1672531199000-0`
  },

  {
    id: "redis-q13-client-side-caching-tracking-resp3",
    title: "13. Client-Side Caching (Redis 6 Tracking) & RESP3 Invalidation",
    difficulty: "Staff",
    category: "Advanced Caching Architecture",
    summary: "Eliminating Redis network round-trips by caching keys directly inside application process memory with server-assisted invalidation.",
    problem: "Even with sub-millisecond Redis responses, a high-throughput microservice making 200,000 Redis reads/sec suffers from network interface saturation and TCP socket overhead. How does Redis 6 Client-Side Tracking solve this?",
    juniorTrap: "Building a naive local in-memory HashMap in Java without an invalidation mechanism, serving stale data indefinitely.",
    interviewerIntent: "Assesses knowledge of modern RESP3 protocol features, Server-Assisted Client-Side Caching, and BCAST mode invalidation messages.",
    seniorAnswer: [
      "The Network Round-Trip Bottleneck: Accessing Redis over the network takes ~0.5ms to 1.5ms. Accessing local JVM memory (Caffeine/Guava) takes ~10 nanoseconds (100,000x faster)! Client-Side Caching stores read keys in the client's local memory.",
      "The Invalidation Challenge: If Client A caches key `user:100` locally, and Client B mutates `user:100` in Redis, Client A will serve stale data unless Redis actively invalidates Client A's local cache.",
      "How Redis 6 Tracking Works: Redis 6 (using RESP3 protocol) implements **Server-Assisted Client-Side Caching**: 1) When a client reads a key (`CLIENT TRACKING on`), Redis records that this connection cached that key in an internal Invalid Table; 2) When ANY client mutates that key, Redis pushes an asynchronous invalidation message to all connections that cached it; 3) The client driver evicts the key from its local memory.",
      "BCAST (Broadcast) Mode: In high-scale systems, tracking individual keys consumes too much Redis memory. BCAST mode allows clients to subscribe to key prefixes (e.g. `users:`); Redis sends an invalidation message whenever any key matching the prefix is modified."
    ],
    innerWorking: "Redis stores a 24-bit hash of the key in a global TrackingTable. When the key changes, it iterates over client pointers registered to that slot and sends a RESP3 out-of-band push message.",
    solution: `# Enabling Client-Side Tracking via Redis CLI / Driver:
# 1. Connect using RESP3 protocol:
HELLO 3

# 2. Turn on tracking:
CLIENT TRACKING on

# 3. When another client modifies a read key:
# Redis automatically pushes an invalidation message:
# -> invalidate: 'user:1001'`
  },

  {
    id: "redis-q14-eviction-policy-selection-lru-lfu",
    title: "14. Redis Eviction Policies: Why noeviction Crashes Apps & Tuning LFU",
    difficulty: "Senior",
    category: "Memory Management",
    summary: "Comparing allkeys-lru, volatile-lru, and volatile-lfu (Logarithmic Frequency Counter) to prevent OOM write rejections.",
    problem: "A production Redis instance hits 'maxmemory 8GB'. Suddenly, all application write operations fail with '(error) OOM command not allowed when used memory > maxmemory'. Why did Redis refuse writes instead of evicting old keys, and which policy should you choose?",
    juniorTrap: "Leaving the default 'noeviction' policy in production caching layers.",
    interviewerIntent: "Tests understanding of Redis eviction policies, approximated LRU sampling, and LFU frequency counters.",
    seniorAnswer: [
      "Why Writes Failed: The default `maxmemory-policy` in Redis is `noeviction`! When memory hits `maxmemory`, Redis rejects all write commands that consume memory (`SET`, `HSET`, `LPUSH`) while allowing read commands.",
      "Eviction Policy Archetypes: 1) `allkeys-lru`: Evicts least recently used keys across all keys (Ideal for general-purpose caching); 2) `volatile-lru`: Evicts LRU keys ONLY among keys that have an expiration (TTL) set; 3) `allkeys-lfu`: Evicts least frequently used keys; 4) `volatile-ttl`: Evicts keys with shortest remaining TTL.",
      "LRU vs LFU: LRU only considers the last access timestamp. If a key was accessed once 2 seconds ago, LRU keeps it even if it was never accessed before! **LFU (Least Frequently Used)** uses an 8-bit logarithmic counter combined with a decay interval, keeping truly hot keys regardless of recent momentary bursts.",
      "Approximated LRU/LFU: Redis DOES NOT maintain a global linked list of keys (which would consume massive memory). Instead, it uses **Random Sampling**: it samples $N$ random keys (default `maxmemory-samples 5`) and evicts the best candidate among the sample."
    ],
    innerWorking: "Redis embeds a 24-bit `lru` field in every `redisObject`. In LFU mode, the upper 16 bits store the last decrement time, and the lower 8 bits store the logarithmic access counter.",
    solution: `# /etc/redis/redis.conf Eviction Configuration:
# 1. Set hard memory limit:
maxmemory 8gb

# 2. Set optimal eviction policy for caching:
maxmemory-policy allkeys-lfu # Keeps hot keys, evicts cold keys

# 3. Increase sample size for near-exact LRU accuracy:
maxmemory-samples 10 # Default is 5; 10 provides ~99% true LRU curve`
  },

  {
    id: "redis-q15-redis-cluster-resharding-ask-vs-moved",
    title: "15. Redis Cluster Resharding: ASK vs MOVED & Zero-Downtime Slot Migration",
    difficulty: "Staff",
    category: "Clustering & High Availability",
    summary: "Internal mechanics of live hash slot migration, MIGRATING vs IMPORTING states, and the exact difference between ASK and MOVED.",
    problem: "During online scaling, a DBA resharded Hash Slot 4000 from Node A to Node B. During migration, clients querying keys in Slot 4000 receive both 'MOVED' and 'ASK' redirects. What is happening under the hood, and how must client drivers handle both?",
    juniorTrap: "Assuming that ASK and MOVED redirects can be handled identically by updating the client's local slot routing table.",
    interviewerIntent: "Assesses deep knowledge of Redis cluster migration protocol, cluster slot states, and distributed client routing mechanics.",
    seniorAnswer: [
      "The Resharding State Machine: During slot migration: 1) Node A sets slot 4000 to `MIGRATING to Node B`; 2) Node B sets slot 4000 to `IMPORTING from Node A`; 3) Keys are migrated one by one using the `MIGRATE` command.",
      "Why ASK is Needed: While slot 4000 is migrating, SOME keys have moved to Node B, while OTHER keys still reside on Node A. If a client queries Node A for a key that has ALREADY moved to Node B, Node A replies with: `-ASK 4000 10.0.1.12:6379`.",
      "The Critical Client Difference: 1) **MOVED Redirect**: The slot has permanently moved. The client updates its internal slot map (`slot 4000 = Node B`) and retries the command; 2) **ASK Redirect**: Only THIS SPECIFIC KEY has moved! The client MUST NOT update its permanent slot map (otherwise future queries for keys still on Node A will fail).",
      "The ASKING Protocol: The client connects to Node B, sends an `ASKING` command, and then immediately sends the query. The `ASKING` command tells Node B: 'Execute this single command even though slot 4000 is still in IMPORTING state'."
    ],
    innerWorking: "Node B normally rejects queries for slots in `IMPORTING` state unless the client's connection has the `CLIENT_ASKING` flag set by an immediate preceding `ASKING` command.",
    solution: `# Anatomy of an ASK redirect flow:
# Client -> Node A: GET user:1001 (hashing to slot 4000)
# Node A -> Client: -ASK 4000 10.0.1.12:6379

# Client opens connection to Node B:
# Client -> Node B: ASKING
# Node B -> Client: +OK
# Client -> Node B: GET user:1001
# Node B -> Client: "Alice" (Success!)`
  },

  {
    id: "redis-q16-slowlog-debugging-dangerous-commands",
    title: "16. Slowlog Debugging & Production-Banned Redis Commands",
    difficulty: "Senior",
    category: "Operations & Debugging",
    summary: "Configuring slowlog-log-slower-than, identifying latency spikes, and banning KEYS *, FLUSHALL, and HGETALL via rename-command.",
    problem: "A junior engineer ran 'KEYS *' on a production Redis instance with 20 million keys, freezing the single-threaded engine for 14 seconds and causing all microservices to trip circuit breakers. How do you disable dangerous commands and debug slow operations in production?",
    juniorTrap: "Leaving dangerous administrative commands accessible to standard application connections.",
    interviewerIntent: "Tests operational hygiene, familiarity with Redis Slowlog, `SCAN` cursors, and command renaming security practices.",
    seniorAnswer: [
      "Why KEYS * is Fatal: `KEYS *` has a time complexity of $O(N)$ where $N$ is the total keyspace. With 20M keys, Redis must iterate over 20M hash table entries in its single thread, blocking all client commands for seconds.",
      "The Safe Alternative - SCAN: Always use `SCAN cursor [MATCH pattern] [COUNT count]`. `SCAN` is an incremental cursor-based iterator that returns small batches of keys (~100 at a time) without blocking the server.",
      "Disabling Dangerous Commands in redis.conf: Use `rename-command` to disable or scramble dangerous commands: `rename-command KEYS ''` (completely disables KEYS), `rename-command FLUSHALL ''`, `rename-command FLUSHDB ''`, `rename-command CONFIG ''`.",
      "Slowlog Triage: Redis maintains an in-memory ring buffer tracking slow commands. Configure `slowlog-log-slower-than 10000` (logs commands taking > 10ms). Inspect using `SLOWLOG GET 10`."
    ],
    innerWorking: "Slowlog records execution duration only (excluding network I/O and queue wait time). It logs: unique ID, timestamp, duration in microseconds, and the full command array.",
    solution: `# /etc/redis/redis.conf Security & Debugging Hardening:
# 1. Ban dangerous commands completely:
rename-command KEYS ""
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command DEBUG ""

# 2. Configure Slowlog:
slowlog-log-slower-than 10000 # Log commands exceeding 10,000 microseconds (10ms)
slowlog-max-len 1024          # Keep last 1,024 entries in ring buffer

# 3. Inspecting slowlog in redis-cli:
SLOWLOG GET 10
# 1) 1) (integer) 42 (Entry ID)
#    2) (integer) 1672531199 (Timestamp)
#    3) (integer) 45000 (Duration: 45ms!)
#    4) 1) "HGETALL"
#       2) "large:tenant:hash"`
  },

  {
    id: "redis-q17-cross-slot-operations-hash-tags-cluster",
    title: "17. Cross-Slot Operations in Redis Cluster & Hash Tag Engineering",
    difficulty: "Senior",
    category: "Clustering & Data Modeling",
    summary: "Resolving 'CROSSSLOT Keys in request don't hash to the same slot' errors using curly brace Hash Tags for multi-key atomicity.",
    problem: "When running 'MGET user:100:profile user:100:settings' or executing a Lua script operating on two keys in Redis Cluster, Redis throws: '(error) CROSSSLOT Keys in request don't hash to the same slot'. How do you architect data models to allow multi-key operations in a sharded cluster?",
    juniorTrap: "Avoiding Redis Cluster or falling back to client-side multi-threading because of CROSSSLOT errors.",
    interviewerIntent: "Assesses mastery of Hash Tag parsing rules, cluster data modeling, and avoiding hot-slot imbalances.",
    seniorAnswer: [
      "Why CROSSSLOT Happens: In Redis Cluster, multi-key operations (`MGET`, `MSET`, transactions, Lua scripts) can ONLY operate on keys that reside on the EXACT SAME physical master node (same Hash Slot). If two keys map to different slots, Redis rejects the command.",
      "The Hash Tag Solution: Wrap the shard partition key in curly braces `{}`. When Redis encounters `{...}`, it hashes ONLY the substring inside the braces to determine the slot!",
      "Hash Tag Example: `user:{1001}:profile` and `user:{1001}:settings` both calculate `CRC16('1001') mod 16384`. Because the input to CRC16 is identical, both keys are guaranteed to reside in the exact same Hash Slot on the same node.",
      "The Hash Tag Hotspot Trap: If you put too many keys into the same hash tag (e.g. `{company_global}:orders`), all company orders will land on ONE master node, creating an extreme memory and CPU imbalance across the cluster. Scope hash tags to fine-grained entities (like individual user IDs)."
    ],
    innerWorking: "Redis cluster slot calculation logic: it searches for the first `{` and the first `}`. If `{` is found and followed by `}` with at least 1 character in between, it hashes only the enclosed string.",
    solution: `# 1. CROSSSLOT Failure:
# MSET user:100:name "Alice" user:100:email "alice@corp.com"
# (error) CROSSSLOT Keys in request don't hash to the same slot

# 2. Fixed with Hash Tags:
MSET {user:100}:name "Alice" {user:100}:email "alice@corp.com"
# +OK (Both keys map to the exact same hash slot!)

# 3. Multi-Key Lua script execution in Redis Cluster:
EVAL "return redis.call('mget', KEYS[1], KEYS[2])" 2 {cart:99}:items {cart:99}:total`
  },

  {
    id: "redis-q18-cpu-100-percent-single-thread-troubleshooting",
    title: "18. CPU 100% Saturation on Single Thread: Emergency Triage Runbook",
    difficulty: "Staff",
    category: "Operations & Incident Response",
    summary: "Root-cause triage of Redis maxing a single CPU core, identifying slow Lua scripts, complex regex, or massive collection iteration.",
    problem: "Production alerts trigger: Redis host CPU is at 100% on core 0, and all application requests are timing out. Redis is completely unresponsive. What is your step-by-step triage runbook to identify and kill the offending command?",
    juniorTrap: "Restarting the server without capturing diagnostic telemetry, allowing the problematic query to re-saturate CPU immediately upon restart.",
    interviewerIntent: "Assesses incident response capability under high pressure, understanding of `SCRIPT KILL`, `SLOWLOG`, and connection tracing.",
    seniorAnswer: [
      "Step 1 - Inspect Running Client Operations: Connect via `redis-cli` and run `CLIENT LIST`. Sort by `cmd` and `age`/`idle`. Look for clients with `idle=0` running long-lived commands.",
      "Step 2 - Check for Rogue Lua Scripts: If an infinite loop exists in a Lua script, Redis responds to commands with `(error) BUSY Redis is busy running a script`. Execute `SCRIPT KILL` to abort the script without data loss.",
      "Step 3 - If SCRIPT KILL Fails (Script Mutated State): If the Lua script already performed a write command, `SCRIPT KILL` will fail with an error! In this emergency scenario, you must run `SHUTDOWN NOSAVE` to terminate the process without persisting the corrupted state.",
      "Step 4 - Inspect Hot & Slow Commands: Run `SLOWLOG GET 10` and `redis-cli --latency` / `redis-cli --latency-history` to diagnose recurring latency patterns.",
      "Step 5 - Check Linux System Context: Use `perf top -p <redis_pid>` to see which C functions consume CPU: `dictFind` (huge hash table), `luaV_execute` (Lua loop), or `activeDefragCycle`."
    ],
    innerWorking: "Redis's event loop calls `luaAbort` during `SCRIPT KILL` only if the script has not called any write operations (`write_performed == 0`).",
    solution: `# Incident Response Runbook for 100% CPU:

# 1. Connect and inspect active clients:
redis-cli CLIENT LIST | tr ' ' '\\n' | grep -E '(addr|name|cmd|idle)'

# 2. Terminate a rogue read-only Lua script:
redis-cli SCRIPT KILL

# 3. Kill a specific abusive client connection by ID:
redis-cli CLIENT KILL ID 14205

# 4. Profile kernel syscalls:
perf top -p $(pgrep redis-server)`
  },

  {
    id: "redis-q19-session-management-redis-vs-jwt",
    title: "19. Enterprise Session Management: Redis Token Store vs Stateless JWT",
    difficulty: "Senior",
    category: "Security & Architecture",
    summary: "Architectural comparison of Redis-backed stateful sessions vs stateless JWTs, revocation guarantees, and multi-device session invalidation.",
    problem: "An architect proposes replacing Redis user session storage with 100% Stateless JWTs to eliminate Redis infrastructure costs. How do you evaluate this proposal from a security, revocation, and scalability perspective?",
    juniorTrap: "Believing stateless JWTs are always superior without considering immediate token revocation or replay attack vulnerabilities.",
    interviewerIntent: "Tests architectural maturity in authentication systems, token invalidation, and stateful vs stateless security tradeoffs.",
    seniorAnswer: [
      "The Stateless JWT Fallacy: Pure stateless JWTs cannot be revoked until they expire! If a user's phone is stolen, an admin revokes privileges, or credentials are compromised, an attacker can use the stolen JWT until its TTL expires.",
      "The Redis Session Store Advantage: 1) **Immediate Revocation**: Deleting `session:<uuid>` instantly invalidates the user session across all microservices; 2) **Active Session Management**: Enables 'Log out of all devices' by deleting all session keys for that user ID; 3) **Sliding Expiration**: Resets session TTL upon user activity effortlessly.",
      "The Best-of-Both-Worlds Hybrid Architecture: Use short-lived stateless JWTs (e.g. 5 minutes) for high-performance microservice authorization, combined with a Redis-backed **Refresh Token**: Refreshing the JWT requires checking Redis. If the user is banned or logged out, the refresh token in Redis is deleted, cutting off access within 5 minutes."
    ],
    innerWorking: "Spring Session Data Redis provides `@EnableRedisHttpSession`. It intercepts HTTP requests, replaces `JSESSIONID` with a Redis Hash storing session attributes, and uses Redis Keyspace Notifications to fire session expiration events.",
    solution: `// Hybrid Architecture: Short-Lived JWT + Redis Refresh Token Store:
public TokenPair login(User user) {
    String accessToken = jwtProvider.createToken(user, Duration.ofMinutes(5));
    String refreshToken = UUID.randomUUID().toString();

    // Store refresh token in Redis with 7-day TTL:
    redisTemplate.opsForValue().set(
        "refresh_token:" + user.getId() + ":" + refreshToken,
        "ACTIVE",
        7, TimeUnit.DAYS
    );

    return new TokenPair(accessToken, refreshToken);
}

// Immediate Revocation ("Logout from all devices"):
public void revokeAllUserSessions(Long userId) {
    Set<String> keys = redisTemplate.keys("refresh_token:" + userId + ":*");
    if (keys != null && !keys.isEmpty()) {
        redisTemplate.delete(keys); // Instantly kicks user off all devices!
    }
}`
  },

  {
    id: "redis-q20-rate-limiting-sliding-window-token-bucket",
    title: "20. Distributed Rate Limiting: Sliding Window Log vs Token Bucket in Redis",
    difficulty: "Staff",
    category: "Distributed Concurrency",
    summary: "Implementing accurate sliding window and token bucket rate limiters using Redis Sorted Sets and atomic Lua scripts.",
    problem: "Design a distributed API rate limiter in Redis allowing 100 requests per minute per IP address. Why does a naive 'INCR key' + 'EXPIRE key 60' fail, and how do you implement an exact Sliding Window Log via Redis ZSet?",
    juniorTrap: "Using Fixed Window counter (INCR + EXPIRE), which allows 2x traffic bursts at window boundaries (100 req at 00:59 + 100 req at 01:01 = 200 req in 2 seconds!).",
    interviewerIntent: "Assesses expertise in rate limiting algorithms (Fixed Window, Sliding Window Log, Token Bucket) and Lua script atomicity.",
    seniorAnswer: [
      "The Fixed Window Boundary Trap: With fixed windows (`key = ip:minute`), an attacker sends 100 requests at 00:59 (allowed) and another 100 requests at 01:00 (allowed). The system accepted 200 requests within a 2-second interval, violating the 100 req/min rule.",
      "The Sliding Window Log (ZSet Solution): Use a Redis Sorted Set (`ZSET`). For every request: 1) Remove timestamps older than `now - 60s` via `ZREMRANGEBYSCORE key 0 (now - 60000)`; 2) Query count of remaining requests via `ZCARD key`; 3) If count < 100, add current timestamp via `ZADD key now now` and allow; else reject. All wrapped in an atomic Lua script!",
      "The Token Bucket Algorithm: For ultra-high volume, ZSet sliding logs consume memory for every request. Token Bucket stores only two numbers: `last_refill_timestamp` and `available_tokens`. Tokens are added based on elapsed time, allowing bursts up to bucket capacity while maintaining a smooth average rate."
    ],
    innerWorking: "Sliding window log has memory complexity $O(M)$ where $M$ is request count. Token bucket has memory complexity $O(1)$ per client.",
    solution: `-- Atomic Sliding Window Rate Limiter Lua Script:
-- KEYS[1]: Rate limit key (e.g. rate:limit:ip:10.0.1.25)
-- ARGV[1]: Current timestamp in milliseconds
-- ARGV[2]: Window size in milliseconds (e.g. 60000)
-- ARGV[3]: Max requests allowed in window (e.g. 100)

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

-- 1. Remove all requests older than the sliding window:
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)

-- 2. Count requests in current sliding window:
local currentRequests = redis.call('ZCARD', key)

-- 3. Check threshold:
if currentRequests < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1 -- Allowed
else
    return 0 -- Rejected (HTTP 429 Too Many Requests)
end`
  }
];
