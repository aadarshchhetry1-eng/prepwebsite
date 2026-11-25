/**
 * concurrency-data.js
 * Senior / Staff Engineer Java Multithreading & Concurrency Architecture, Core Internals & Tricky Questions
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.CONCURRENCY_TOPICS = [
  {
    id: "jmm-memory-barriers-instruction-reordering",
    title: "Java Memory Model Deep Dive: Instruction Reordering, Volatile & Hardware Barriers",
    category: "Memory Model & JMM",
    badge: "Staff JMM Internals",
    oneLiner: "The JMM reconciles compiler optimizations and multi-core CPU cache hierarchies via Happens-Before relationships and hardware memory barriers (StoreStore, StoreLoad, LoadLoad, LoadStore).",
    summary: "Modern CPUs and optimizing JIT compilers aggressively reorder instructions and buffer writes in private L1/L2 store buffers to maximize execution pipeline throughput. Without synchronization, one CPU core's writes are completely invisible to other cores. The Java Memory Model (JMM, JSR-133) defines formal Happens-Before rules. Marking a variable `volatile` forces the compiler to emit memory fences (e.g. `lock addl` on x86), preventing compiler reordering and flushing CPU write buffers immediately.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 CPU Cache Coherence, Memory Barriers &amp; JMM Boundaries</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(168, 85, 247, 0.4); background: rgba(168, 85, 247, 0.08);">
            <div class="space-name" style="color: #c084fc;">CPU Core 1 (Thread A)</div>
            <div class="space-desc">L1/L2 Store Buffer &amp; Registers</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Write to volatile: StoreStore fence (flushes prior writes) + StoreLoad fence (lock addl).</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">CPU Core 2 (Thread B)</div>
            <div class="space-desc">L1/L2 Cache &amp; Invalidation Queue</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Read from volatile: LoadLoad + LoadStore fence (invalidates local cache, forces read from bus).</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-purple">
            <span class="node-badge">1. StoreStore</span>
            <span class="node-label">Prior writes committed</span>
            <span class="node-sub">Flushes normal writes</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">2. Volatile Write</span>
            <span class="node-label">lock addl $0,0(%esp)</span>
            <span class="node-sub">Full hardware bus lock</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-blue">
            <span class="node-badge">3. Volatile Read</span>
            <span class="node-label">LoadLoad Barrier</span>
            <span class="node-sub">Subsequent reads wait</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Happens-Before</span>
            <span class="node-label">Guaranteed Visibility</span>
            <span class="node-sub">Zero stale cache reads</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Three Concurrency Tenets: 1) **Atomicity** (all-or-nothing execution); 2) **Visibility** (changes made by Thread 1 are seen by Thread 2); 3) **Ordering** (instructions execute in apparent program order). `volatile` guarantees Visibility and Ordering, but NOT Atomicity (e.g. `count++` is not atomic!).",
      "Hardware Memory Barriers: 1) `StoreStore`: Ensures all prior normal writes are flushed before the volatile write; 2) `StoreLoad`: The most expensive barrier (on x86: `lock addl`), prevents volatile write from being reordered with subsequent reads; 3) `LoadLoad` & `LoadStore`: Ensures volatile read occurs before subsequent reads/writes.",
      "The Double-Checked Locking (DCL) Disaster: `new Singleton()` compiles to: 1) allocate memory; 2) invoke constructor `<init>`; 3) assign memory address to `instance`. The JIT can reorder to 1 ➔ 3 ➔ 2. Thread B sees `instance != null` at the outer check before the constructor completes, reading partially initialized fields! Marking `instance` as `volatile` prevents step 3 from jumping before step 2.",
      "Final Field Freeze Semantics: The JMM provides a special guarantee for `final` fields: when an object's constructor finishes, a `StoreStore` barrier freezes final fields. Any thread receiving the reference is 100% guaranteed to see initialized final values without volatile or synchronization (if the `this` reference did not escape during construction).",
      "Happens-Before Rules: Program Order Rule, Monitor Lock Rule (`unlock` happens-before `lock`), Volatile Variable Rule (write happens-before read), Thread Start Rule (`start()` happens-before any action in thread), Thread Termination Rule (`join()`)."
    ],
    codeSnippet: `// 1. Thread-Safe Double-Checked Locking with volatile:
public class SafeDCLSingleton {
    // MUST BE VOLATILE to prevent instruction reordering (1 -> 3 -> 2)!
    private static volatile SafeDCLSingleton instance;

    private SafeDCLSingleton() {
        // Heavy field initialization...
    }

    public static SafeDCLSingleton getInstance() {
        if (instance == null) { // 1st check (no lock)
            synchronized (SafeDCLSingleton.class) {
                if (instance == null) { // 2nd check (with lock)
                    instance = new SafeDCLSingleton();
                }
            }
        }
        return instance;
    }
}

// 2. Even Better: Bill Pugh Initialization-on-demand Holder Idiom:
// (Thread-safe, lazy, and zero synchronization overhead via ClassLoader lock!)
public class BillPughSingleton {
    private BillPughSingleton() {}

    private static class Holder {
        private static final BillPughSingleton INSTANCE = new BillPughSingleton();
    }

    public static BillPughSingleton getInstance() {
        return Holder.INSTANCE; // ClassLoader guarantees thread-safe single initialization!
    }
}`
  },

  {
    id: "jvm-lock-escalation-biased-lightweight-heavyweight",
    title: "JVM Synchronized Lock Escalation: Biased, Lightweight (CAS) & Heavyweight (OS Mutex)",
    category: "JVM Synchronization",
    badge: "JVM Object Header Internals",
    oneLiner: "Synchronized locks dynamically escalate from Biased (0 CAS) to Lightweight (CAS stack lock record with adaptive spinning) to Heavyweight (ObjectMonitor in OS kernel mode) to maximize single-thread and low-contention performance.",
    summary: "Prior to Java 6, `synchronized` was always a Heavyweight Lock, requiring a transition from User Mode to Kernel Mode (`pthread_mutex_lock`), costing ~2-5 microseconds per acquisition. HotSpot Java 6+ introduced Lock Escalation based on the 64-bit Mark Word in object headers. Locks progress monotonically: Biased Lock ➔ Lightweight Lock (Thin Lock) ➔ Heavyweight Lock (Fat Lock). Once inflated to Heavyweight, locks cannot be downgraded during normal runtime.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🔒 HotSpot 64-Bit Mark Word Lock Escalation Lifecycle</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">1. Biased Lock (Tag: 101)</div>
            <div class="space-desc">Thread ID stored directly in Mark Word</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Zero CAS operations! Thread acquires lock by checking if its thread ID matches the header.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">2. Lightweight Lock (Tag: 000)</div>
            <div class="space-desc">Lock Record on Thread Stack via CAS</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Low contention: thread creates Displaced Mark Word and spins adaptively. Zero kernel transitions!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #f87171;">3. Heavyweight Lock (Tag: 010)</div>
            <div class="space-desc">ObjectMonitor in C++ Heap &amp; OS Mutex</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">High contention: spins expire. Thread parks into OS kernel wait-queue (pthread_mutex).</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-green">
            <span class="node-badge">Unlocked (001)</span>
            <span class="node-label">HashCode + Age</span>
            <span class="node-sub">Clean object header</span>
          </div>
          <div class="flow-arrow-node">Single Thread ➔</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Biased (101)</span>
            <span class="node-label">ThreadID</span>
            <span class="node-sub">Zero sync overhead</span>
          </div>
          <div class="flow-arrow-node">Alternate Access ➔</div>
          <div class="flow-step-node node-blue">
            <span class="node-badge">Lightweight (000)</span>
            <span class="node-label">CAS Lock Record</span>
            <span class="node-sub">Adaptive spin</span>
          </div>
          <div class="flow-arrow-node">Contention ➔</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">Heavyweight (010)</span>
            <span class="node-label">ObjectMonitor</span>
            <span class="node-sub">OS Kernel Sleep</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The 64-bit Mark Word Bits: Unlocked (`001`), Biased (`101`), Lightweight (`000`), Heavyweight (`010`), Marked for GC (`011`).",
      "Biased Locking Mechanics: When Thread 1 enters `synchronized`, the JVM writes Thread 1's ID into the object's Mark Word using a single CAS. Subsequent entries check the thread ID: if matching, execution proceeds with zero CAS, zero bus locks! (Note: Deprecated in Java 15+ due to complex revocation safepoints).",
      "Lightweight Locking (Thin Lock): When Thread 2 attempts to acquire a biased lock, the bias is revoked. Thread 2 allocates a `BasicObjectLock` on its private execution stack, copies the object's Mark Word to its stack (Displaced Mark Word), and executes CAS to point the object's header to its stack record.",
      "Adaptive Spinning: Instead of immediately putting threads to sleep when CAS fails, HotSpot spins in a loop for a few hundred clock cycles. If the lock was recently acquired and released quickly, spinning succeeds without an expensive OS context switch.",
      "Heavyweight Inflation (Fat Lock): If spinning times out or multiple threads contend simultaneously, the lock inflates to Heavyweight (`010`). HotSpot allocates a C++ `ObjectMonitor` structure containing `_owner`, `_WaitSet` (threads calling `wait()`), and `_EntryList` (threads blocked on enter). Waiting threads are parked via OS `pthread_mutex`."
    ],
    codeSnippet: `// C++ HotSpot ObjectMonitor Structure representation (hotspot/src/share/vm/runtime/objectMonitor.hpp):
class ObjectMonitor {
    void*            _header;       // Displaced mark word
    void*            _object;       // Backward pointer to Java Object
    void* volatile   _owner;        // Current owner Thread*
    Thread* volatile _WaitSet;      // Doubly-linked list of threads calling wait()
    Thread* volatile _EntryList;    // Doubly-linked list of threads waiting for lock
    intptr_t         _count;        // Lock recursion count
};

// Viewing Lock Escalation in Java using JOL (Java Object Layout):
// Object obj = new Object();
// System.out.println(ClassLayout.parseInstance(obj).toPrintable()); // 001 (Unlocked)
// synchronized(obj) {
//     System.out.println(ClassLayout.parseInstance(obj).toPrintable()); // 000 (Lightweight)
// }`
  },

  {
    id: "aqs-framework-reentrantlock-internals",
    title: "AQS Framework Architecture: Volatile State, CLH Queue & LockSupport",
    category: "Locking & Synchronization",
    badge: "AQS Core Mechanics",
    oneLiner: "AbstractQueuedSynchronizer implements a FIFO queue of waiting threads using a volatile state integer, CAS transitions, and LockSupport park/unpark primitives.",
    summary: "AbstractQueuedSynchronizer (AQS) is the foundational framework behind `java.util.concurrent` locks: `ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock`, and `CompletableFuture`. AQS eliminates busy-waiting spinning by maintaining a 32-bit volatile `state` integer manipulated via atomic CAS, and an in-memory variant of the Craig, Landin, and Hagersten (CLH) doubly-linked list queue of waiting threads. Threads that fail to acquire state are safely parked using `LockSupport.park()`.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚙️ AbstractQueuedSynchronizer (AQS) CLH Queue Pipeline</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(168, 85, 247, 0.4); background: rgba(168, 85, 247, 0.08);">
            <div class="space-name" style="color: #c084fc;">volatile int state</div>
            <div class="space-desc">ReentrantLock: 0 = Free, &gt;= 1 = Locked</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Modified via CAS: compareAndSetState(0, 1). State &gt; 1 represents reentrant acquisition count.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">ExclusiveOwnerThread</div>
            <div class="space-desc">Thread holding current lock</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Allows reentrant calls from the same thread without blocking (state++).</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Head Node</span>
            <span class="node-label">Dummy / Sentinel</span>
            <span class="node-sub">Current Lock Holder</span>
          </div>
          <div class="flow-arrow-node">prev ◄──► next</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Node 1 (Parked)</span>
            <span class="node-label">waitStatus: SIGNAL (-1)</span>
            <span class="node-sub">Thread B (LockSupport.park)</span>
          </div>
          <div class="flow-arrow-node">prev ◄──► next</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Tail Node (Parked)</span>
            <span class="node-label">waitStatus: SIGNAL (-1)</span>
            <span class="node-sub">Thread C (CAS enqueued)</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Volatile State Variable: AQS represents synchronization state with `private volatile int state`. For `ReentrantLock`, `0` = unlocked, `1` = locked, `>1` = reentrancy depth. For `Semaphore`, state = available permits. For `CountDownLatch`, state = remaining countdown.",
      "The CLH Queue & waitStatus: When CAS fails, the thread is wrapped in a `Node` and appended to the tail of the doubly-linked queue via CAS. Key waitStatus values: `SIGNAL (-1)` indicates the successor thread needs to be unparked when the current node releases; `CANCELLED (1)` indicates the thread timed out or was interrupted.",
      "Fair vs Non-Fair Locks: 1) **Non-Fair Lock** (Default): When a thread calls `lock()`, it immediately attempts a CAS on `state`. If successful, it 'barges' and steals the lock without joining the queue! This delivers 10x higher throughput because it avoids thread park/unpark latency; 2) **Fair Lock**: Checks `hasQueuedPredecessors()`. If threads are already waiting in the queue, it MUST join the queue in FIFO order.",
      "LockSupport.park() & unpark(): Unlike `Object.wait()` which requires a synchronized monitor, `LockSupport.park()` can be called anywhere. It uses a binary permit (1 or 0). Calling `unpark(thread)` before `park()` grants a permit, so the subsequent `park()` does NOT block (eliminates Lost Wake-Up!).",
      "ConditionObject & Waiting Queues: Each `Condition` created via `lock.newCondition()` maintains its own separate single-linked FIFO queue (`firstWaiter` $\to$ `lastWaiter`). Calling `await()` releases the AQS state and moves the node to the condition queue; `signal()` moves the node back into the main AQS CLH queue."
    ],
    codeSnippet: `// Anatomy of AQS Acquire (Exclusive Mode Blueprint):
public final void acquire(int arg) {
    // 1. Try CAS on state
    // 2. If failed, wrap thread in Node and enqueue at tail
    // 3. Park thread until predecessor unparks it
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}

// Proper ReentrantLock Usage Blueprint:
ReentrantLock lock = new ReentrantLock(false); // Non-fair (high performance)
lock.lock(); // Never put lock() inside the try block!
try {
    // Critical Section: Mutate shared state
} finally {
    lock.unlock(); // Always release in finally block!
}`
  },

  {
    id: "threadpoolexecutor-architecture-saturation",
    title: "ThreadPoolExecutor Internals: Worker Lifecycle, Queueing & Saturation Policies",
    category: "Thread Pools & Schedulers",
    badge: "Staff Thread Pool Architecture",
    oneLiner: "The worker state machine packs runState and workerCount into a single 32-bit AtomicInteger, routing tasks to core threads, workQueue, maximumPool, and rejection handlers.",
    summary: "ThreadPoolExecutor is the core engine for task parallelism in Java. To execute concurrent state changes without heavyweight locks, HotSpot packs both the pool's operational lifecycle state (`RUNNING`, `SHUTDOWN`, `STOP`, `TIDYING`, `TERMINATED`) and the active worker thread count into a single 32-bit `AtomicInteger ctl`. Tasks flow through a strictly ordered 4-phase submission pipeline: Core Threads ➔ Work Queue ➔ Max Threads ➔ RejectedExecutionHandler.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🏭 ThreadPoolExecutor Task Submission &amp; Saturation Pipeline</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. execute(task)</span>
            <span class="node-label">workerCount &lt; corePoolSize</span>
            <span class="node-sub">Spawns core Worker thread</span>
          </div>
          <div class="flow-arrow-node">False ➔</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">2. workQueue</span>
            <span class="node-label">workQueue.offer(task)</span>
            <span class="node-sub">Enqueues in BlockingQueue</span>
          </div>
          <div class="flow-arrow-node">Queue Full ➔</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">3. maxPoolSize</span>
            <span class="node-label">workerCount &lt; maxPoolSize</span>
            <span class="node-sub">Spawns non-core Worker</span>
          </div>
          <div class="flow-arrow-node">Max Exceeded ➔</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">4. Saturation</span>
            <span class="node-label">RejectedExecutionHandler</span>
            <span class="node-sub">CallerRuns / AbortPolicy</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The 32-bit `ctl` Bit Packing: HotSpot uses `AtomicInteger ctl` where the upper 3 bits store the `runState` (RUNNING -1, SHUTDOWN 0, STOP 1, TIDYING 2, TERMINATED 3) and the lower 29 bits store `workerCount` (max $2^{29}-1 \\approx 536$ million threads). This allows atomic check-and-update of both state and count in a single CAS.",
      "The 4-Step Submission Pipeline: 1) If running threads < `corePoolSize`, create a new worker; 2) If running >= `corePoolSize`, attempt to enqueue into `workQueue`; 3) If `workQueue.offer()` fails (queue is full), spawn new worker up to `maximumPoolSize`; 4) If running >= `maximumPoolSize`, invoke `RejectedExecutionHandler`.",
      "The 4 Built-In Rejection Policies: 1) `AbortPolicy` (Default): Throws `RejectedExecutionException`; 2) `CallerRunsPolicy`: The calling thread executes the task itself (provides natural backpressure!); 3) `DiscardPolicy`: Silently drops the task; 4) `DiscardOldestPolicy`: Drops the oldest unhandled task in the queue and retries submission.",
      "Why `Executors.newFixedThreadPool` is Banned: `newFixedThreadPool` uses `new LinkedBlockingQueue<Runnable>()` without specifying capacity (default is `Integer.MAX_VALUE`). Under heavy burst traffic, tasks queue infinitely in RAM until `OutOfMemoryError: Java heap space` crashes the JVM.",
      "Graceful 2-Phase Shutdown: Call `pool.shutdown()` (stops accepting new tasks, finishes queued tasks) followed by `pool.awaitTermination(30, TimeUnit.SECONDS)`. If timeout expires, call `pool.shutdownNow()` to interrupt stubborn threads."
    ],
    codeSnippet: `// Production ThreadPoolExecutor Configuration Blueprint:
int cores = Runtime.getRuntime().availableProcessors();

ThreadPoolExecutor executor = new ThreadPoolExecutor(
    cores * 2,                         // corePoolSize (e.g. 16 for I/O bound)
    cores * 4,                         // maximumPoolSize (e.g. 32)
    60L, TimeUnit.SECONDS,             // keepAliveTime for idle non-core threads
    new ArrayBlockingQueue<>(500),     // BOUNDED QUEUE: Prevents heap OOM!
    new CustomNamedThreadFactory("payment-worker"),
    new ThreadPoolExecutor.CallerRunsPolicy() // Graceful backpressure: caller slows down!
);

// Graceful Shutdown Hook:
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    executor.shutdown();
    try {
        if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
            executor.shutdownNow();
        }
    } catch (InterruptedException e) {
        executor.shutdownNow();
    }
}));`
  },

  {
    id: "java21-virtual-threads-project-loom",
    title: "Java 21 Virtual Threads & Project Loom: Continuations, Carrier Pinning & Scalability",
    category: "Modern Concurrency (Java 21)",
    badge: "Project Loom Architecture",
    oneLiner: "Virtual threads decouple Java threads from 1:1 OS threads by scheduling millions of user-mode threads onto carrier platform threads via Continuations and ForkJoinPool, parking stack frames in JVM heap.",
    summary: "Traditional Java platform threads are 1:1 wrappers around operating system (OS) kernel threads, consuming ~1MB of off-heap stack memory and costing ~2-5 microseconds per context switch. This limited concurrent thread counts to ~5,000 before memory exhaustion. Java 21 Virtual Threads (Project Loom) introduce user-mode lightweight threads managed by the JVM runtime. When a virtual thread executes blocking I/O (socket read, JDBC query, sleep), the JVM yields its Continuation to the heap and unmounts it from the carrier OS thread, allowing millions of concurrent tasks.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🚀 Virtual Threads M:N Scheduling onto Carrier OS Threads</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Virtual Threads (Millions in Heap)</div>
            <div class="space-desc">User-Mode Continuations (~1 KB RAM)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Created in nanoseconds. Stack frames stored in Java heap memory. Never pooled!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Carrier Threads (ForkJoinPool)</div>
            <div class="space-desc">Platform OS Threads (Count == CPU Cores)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Executes virtual threads. When virtual thread blocks on I/O, carrier thread switches immediately!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Virtual Thread 1</span>
            <span class="node-label">Mounts Carrier 1</span>
            <span class="node-sub">Executes business code</span>
          </div>
          <div class="flow-arrow-node">Socket Read ➔</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Continuation.yield()</span>
            <span class="node-label">Unmounts to Heap</span>
            <span class="node-sub">Carrier 1 Freed</span>
          </div>
          <div class="flow-arrow-node">Immediate ➔</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Virtual Thread 2</span>
            <span class="node-label">Mounts Carrier 1</span>
            <span class="node-sub">100% CPU Utilization!</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The $M:N$ Scheduling Model: $M$ virtual threads are scheduled onto $N$ carrier platform threads (default $N$ = `Runtime.getRuntime().availableProcessors()`). Scheduling is managed by a shared `ForkJoinPool` working in FIFO async mode.",
      "Continuation Mechanics: When a virtual thread calls a blocking API (e.g. `SocketChannel.read()` or `Thread.sleep()`), the JVM runtime intercepts the call. It copies the execution stack frames into a heap-allocated `Continuation` object and calls `Continuation.yield()`. The underlying carrier OS thread is instantly freed to run another virtual thread.",
      "The Carrier Pinning Trap: If a virtual thread blocks inside a `synchronized` block or executes a native C method via JNI, the virtual thread CANNOT unmount from its carrier! It is 'pinned' to the OS thread. If 16 virtual threads block on database queries inside `synchronized` methods, all 16 carrier threads freeze, grinding the entire application to a halt. Solution: replace `synchronized` with `ReentrantLock`.",
      "Never Pool Virtual Threads: Pooling virtual threads (`new FixedThreadPool(100)`) is a major anti-pattern! Virtual threads are cheap and disposable (~1 KB of heap memory). Always use `Executors.newVirtualThreadPerTaskExecutor()` or create them on-demand via `Thread.ofVirtual().start(task)`.",
      "ThreadLocal vs ScopedValue: In a cluster running 1,000,000 virtual threads, `ThreadLocal` creates 1M mutable hash maps, exhausting memory. Java 21 introduces `ScopedValue`: immutable, bound to a lexical execution block, and shared safely across child virtual threads with zero copy overhead."
    ],
    codeSnippet: `// 1. Modern High-Throughput HTTP Service with Virtual Threads:
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Spawns 100,000 concurrent tasks effortlessly in < 200MB RAM!
    IntStream.range(0, 100_000).forEach(i -> {
        executor.submit(() -> {
            // Blocking I/O unmounts virtual thread cleanly from carrier:
            String response = httpClient.send(request, BodyHandlers.ofString()).body();
            processResponse(response);
            return response;
        });
    });
} // Auto-closes: waits for all tasks to complete!

// 2. Diagnosing Carrier Pinning in Production:
// java -Djdk.tracePinnedThreads=full -jar app.jar
// Prints stack traces whenever a virtual thread blocks while pinned to its carrier!`
  }
];

window.REVISION_APP_DATA.CONCURRENCY_QUESTIONS = [
  {
    id: "concurrency-q1-dcl-volatile-half-initialized",
    title: "1. Double-Checked Locking (DCL) & The Half-Initialized Object Trap",
    difficulty: "Staff",
    category: "Memory Model & JMM",
    summary: "Why DCL without volatile allows other threads to observe partially constructed objects due to instruction reordering.",
    problem: "A developer writes a classic Double-Checked Locking singleton: 'if (instance == null) { synchronized(Lock.class) { if (instance == null) { instance = new Singleton(); } } }'. They did NOT declare 'instance' as volatile. The interviewer asks: 'Can another thread observe a non-null instance whose constructor hasn't finished executing? Explain the exact CPU/compiler instruction sequence.'",
    juniorTrap: "Assuming that synchronized guarantees visibility and atomicity for threads checking the outer 'if (instance == null)' condition.",
    interviewerIntent: "Assesses deep knowledge of JIT compiler instruction reordering, object allocation bytecode分解, and memory barrier placement.",
    seniorAnswer: [
      "The 3-Step Bytecode Decomposition: Instantiating an object (`instance = new Singleton()`) breaks down into three low-level JVM operations: 1) `0: new #2` (Allocate raw memory on heap); 2) `4: invokespecial #3` (Invoke `<init>` constructor to initialize fields); 3) `7: putstatic #4` (Assign memory address to `instance` reference).",
      "The Reordering Disaster: The JIT compiler and CPU out-of-order execution engine are permitted to reorder instructions as long as single-threaded behavior (as-if-serial) is preserved. Instructions can reorder to: 1 ➔ 3 ➔ 2! (Memory allocated ➔ reference assigned to `instance` ➔ constructor runs).",
      "The Race Condition: Thread A executes steps 1 and 3. `instance` is now non-null, but its fields are NOT yet initialized! Thread B enters `getInstance()`. It checks `if (instance == null)`. Since `instance != null`, Thread B skips the synchronized block and returns the half-initialized object. Thread B calls `instance.getName()`, reading default nulls/zeros or crashing with NullPointerExceptions!",
      "The Fix: Declare `private static volatile Singleton instance`. In the JMM, a volatile write emits a `StoreStore` barrier, guaranteeing steps 1 and 2 complete BEFORE step 3 assigns the reference."
    ],
    innerWorking: "Volatile write forces a StoreStore barrier (flushing prior writes) and a StoreLoad barrier (preventing write from floating after reads). This strictly enforces: Object Allocation ➔ Constructor ➔ Reference Assignment.",
    solution: `// Proper Thread-Safe Double-Checked Locking:
public class SafeSingleton {
    // MANDATORY: volatile prevents instruction reordering (1 -> 3 -> 2)
    private static volatile SafeSingleton instance;

    private final String config;

    private SafeSingleton() {
        this.config = loadHeavyConfig(); // Step 2: Must finish before Step 3!
    }

    public static SafeSingleton getInstance() {
        SafeSingleton localRef = instance; // Local read optimization
        if (localRef == null) {
            synchronized (SafeSingleton.class) {
                localRef = instance;
                if (localRef == null) {
                    instance = localRef = new SafeSingleton();
                }
            }
        }
        return localRef;
    }
}`,
    warStory: "A high-throughput payment processor initialized their cryptographic key manager with non-volatile DCL. Under 20,000 req/sec, ~0.01% of requests received a non-null KeyManager whose encryption key array was still all zeros, decrypting transactions with blank keys and failing authorizations."
  },

  {
    id: "concurrency-q2-false-sharing-contended-padding",
    title: "2. False Sharing & CPU Cache Line Invalidation (@Contended)",
    difficulty: "Staff",
    category: "Hardware & Cache Coherence",
    summary: "How independent variables sharing a 64-byte CPU cache line cause cross-core invalidation storms, and solving via @Contended padding.",
    problem: "In a high-frequency trading (HFT) matching engine, two independent threads update two distinct atomic long counters on separate CPU cores: 'Thread 1: counterA++' and 'Thread 2: counterB++'. Profiler shows both cores spending 80% of their time stalled waiting on memory bus cache invalidations. What is False Sharing and how do you eliminate it?",
    juniorTrap: "Assuming that because counterA and counterB are independent variables on different threads, they never interfere at the hardware level.",
    interviewerIntent: "Tests understanding of multi-core CPU architecture (L1/L2/L3 caches), MESI cache coherence protocols, 64-byte Cache Lines, and cache line padding.",
    seniorAnswer: [
      "The 64-Byte Cache Line Reality: Modern CPUs do not read or write individual bytes to RAM; they transfer memory in chunks of 64 bytes called **Cache Lines**. If two variables (`counterA` and `counterB`) reside within the same 64 contiguous bytes in heap memory, they share the exact same Cache Line.",
      "The MESI Invalidation Storm: When Core 1 modifies `counterA`, the CPU's MESI protocol marks that entire 64-byte cache line as `Modified (M)` on Core 1 and `Invalid (I)` across all other cores. When Core 2 tries to read/write `counterB`, its L1 cache misses! Core 2 must freeze execution, flush Core 1's cache line over the interconnect bus, and reload the line into its own cache.",
      "The Performance Impact: Even though the threads touch completely different variables, they bounce the cache line back and forth across CPU cores, degrading throughput by 10x to 100x.",
      "The Fix - Cache Line Padding / @Contended: Ensure variables reside in separate 64-byte cache lines. Java 8+ provides `@jdk.internal.vm.annotation.Contended` (or `@Contended`), which automatically adds 128 bytes of padding before and after the field. Alternatively, pad manually using 7 dummy `long` fields (`long p1, p2, p3, p4, p5, p6, p7`)."
    ],
    innerWorking: "L1 cache access takes ~1ns. A cache miss due to cross-core invalidation over QPI/UPI bus takes ~40-80ns. Padding prevents two fields from occupying the same 64-byte aligned boundary.",
    solution: `// 1. Modern Solution: @Contended annotation (JVM flag: -XX:-RestrictContended)
public class ContendedCounters {
    @jdk.internal.vm.annotation.Contended
    public volatile long counterA; // Padded with 128 bytes on both sides

    @jdk.internal.vm.annotation.Contended
    public volatile long counterB; // Resides in completely separate cache line!
}

// 2. Manual Padding Pattern (Disruptor RingBuffer approach):
public class PaddedAtomicLong {
    // 7 longs * 8 bytes = 56 bytes padding
    public volatile long p1, p2, p3, p4, p5, p6, p7;
    public volatile long value = 0L; // 64-byte isolated line
    public volatile long q1, q2, q3, q4, q5, q6, q7;
}`,
    warStory: "The LMAX Disruptor architecture achieved 6 million orders/sec on a single thread. Early prototypes suffered from false sharing between the producer sequence head and consumer sequence tail, dropping throughput to 800k orders/sec. Adding 56-byte dummy long padding restored maximum wire-speed performance."
  },

  {
    id: "concurrency-q3-aba-problem-atomicstampedreference",
    title: "3. The ABA Problem in Lock-Free CAS & AtomicStampedReference",
    difficulty: "Staff",
    category: "Lock-Free Algorithms",
    summary: "Why compareAndSet on raw pointers fails when state mutates from A to B and back to A, corrupting lock-free Treiber stacks.",
    problem: "A thread performs a lock-free CAS on a pointer 'A'. During its operation, another thread preempts, changes 'A' -> 'B' -> 'A', and recycles node B. The first thread resumes: its CAS check 'compareAndSet(A, C)' evaluates to true and succeeds! Why can this corrupt lock-free data structures, and how do you solve it?",
    juniorTrap: "Assuming that if a CAS comparison matches, the intervening state must not have changed.",
    interviewerIntent: "Assesses mastery of lock-free data structures (Treiber Stack / Michael-Scott Queue), memory recycling, and version stamping.",
    seniorAnswer: [
      "The ABA Disaster in a Treiber Stack: 1) Stack contains `Top -> A -> B -> C`; 2) Thread 1 reads `Top = A` and `next = B`, preparing to pop `A` via `CAS(Top, A, B)`; 3) Thread 1 is preempted; 4) Thread 2 pops `A` and pops `B` (stack is now `Top -> C`); 5) Thread 2 recycles node `A` and pushes it back onto the stack (`Top -> A -> C`); 6) Thread 1 wakes up and runs `CAS(Top, A, B)`. Since `Top == A`, CAS succeeds! But node `B` was already popped and freed! The stack is now corrupted pointing to dangling pointer `B`.",
      "The Root Cause: CAS checks **Value Equality**, NOT **Historical Progression**. An entity can change state, execute destructive operations, and return to its original value.",
      "The Solution - AtomicStampedReference: Pair the reference with an integer version stamp / sequence number: `AtomicStampedReference<Node>`. Both the reference AND the version stamp must match: `compareAndSet(expectedRef, newRef, expectedStamp, newStamp)`. Even if the pointer cycles $A \\to B \\to A$, the stamp monotonically increases ($1 \\to 2 \\to 3$), causing the stale CAS to fail cleanly.",
      "Alternative - AtomicMarkableReference: Uses a boolean mark (e.g. for marking deleted nodes in Harris's lock-free linked list)."
    ],
    innerWorking: "`AtomicStampedReference` wraps the reference and integer into an immutable internal `Pair<T>` object. The CAS operates atomically on the `Pair` reference.",
    solution: `// Fixing ABA with AtomicStampedReference:
public class LockFreeStack<T> {
    private static class Node<T> {
        final T value;
        Node<T> next;
        Node(T val) { this.value = val; }
    }

    // Stores (Node reference, Integer version stamp):
    private final AtomicStampedReference<Node<T>> top = new AtomicStampedReference<>(null, 0);

    public void push(T value) {
        Node<T> newNode = new Node<>(value);
        int[] stampHolder = new int[1];
        while (true) {
            Node<T> currentTop = top.get(stampHolder);
            int currentStamp = stampHolder[0];
            newNode.next = currentTop;
            // Increments stamp on every mutation, preventing ABA:
            if (top.compareAndSet(currentTop, newNode, currentStamp, currentStamp + 1)) {
                return;
            }
        }
    }
}`
  },

  {
    id: "concurrency-q4-deadlock-triage-thread-dumps-jstack",
    title: "4. Production Deadlock Triage: Capturing Thread Dumps & JStack Analysis",
    difficulty: "Senior",
    category: "Production Incident Response",
    summary: "Capturing and diagnosing Java-level deadlocks using jcmd, jstack, and analyzing inverted lock cycles in thread dump outputs.",
    problem: "Production alerts fire: all Tomcat worker threads are busy, API response latency spikes to infinity, and CPU drops to near 0%. You suspect a deadlock. How do you capture thread dumps and pinpoint the exact offending Java lines?",
    juniorTrap: "Restarting the application server immediately without taking diagnostic thread dumps, destroying forensic evidence.",
    interviewerIntent: "Tests operational discipline under pressure, understanding of thread states (BLOCKED, WAITING, TIMED_WAITING), and analyzing Java monitor deadlocks.",
    seniorAnswer: [
      "Step 1 - Capture 3 Consecutive Thread Dumps: Never take just one dump! Capture 3 thread dumps spaced 10 seconds apart to distinguish between deadlocks (permanently stuck) and slow transactions (moving state): `jcmd <PID> Thread.dump_to_file /tmp/threads_1.td` or `jstack -l <PID> > /tmp/threads_1.td`.",
      "Step 2 - Search for the JVM Deadlock Detector: JVM HotSpot automatically detects monitor deadlocks. Scroll to the very bottom of the thread dump and look for: `Found one Java-level deadlock:`.",
      "Step 3 - Analyze the Lock Cycle: The thread dump displays the exact cycle: `Thread-1` holds lock `<0x000000076b>` waiting for `<0x000000076c>` held by `Thread-2`, which is waiting for `<0x000000076b>`.",
      "Step 4 - Inspect Thread States: Check threads in `BLOCKED (on object monitor)` state waiting on `java.lang.Object` monitors, or `WAITING (parking)` state in AQS `ReentrantLock`.",
      "Step 5 - Prevention: Enforce globally deterministic lock ordering (sort keys before locking), replace blocking locks with `tryLock(timeout)` with backoff, or eliminate locks using actor-based concurrency."
    ],
    innerWorking: "The JVM thread dump engine iterates over the HotSpot `ObjectMonitor` list and builds a directed graph of thread lock allocations and waiters. It runs Tarjan's or Kosaraju's cycle detection algorithm to identify deadlocks.",
    solution: `# Command line runbook for capturing thread dumps:

# 1. Find Java process ID:
jps -v
# Output: 4812 app.jar

# 2. Capture 3 thread dumps:
jcmd 4812 Thread.dump_to_file /tmp/td_1.txt
sleep 10
jcmd 4812 Thread.dump_to_file /tmp/td_2.txt

# 3. Search for deadlocks in thread dump:
grep -A 25 "Found one Java-level deadlock" /tmp/td_1.txt

# Sample output:
# Found one Java-level deadlock:
# "pool-1-thread-1":
#   waiting to lock monitor 0x00007f (object 0x0000000712a, a OrderService)
#   which is held by "pool-1-thread-2"
# "pool-1-thread-2":
#   waiting to lock monitor 0x00007e (object 0x0000000712b, a AccountService)
#   which is held by "pool-1-thread-1"`
  },

  {
    id: "concurrency-q5-thread-interrupt-swallowed-trap",
    title: "5. The InterruptedException Swallowing Trap & Thread.interrupt()",
    difficulty: "Senior",
    category: "Thread Lifecycle & Interruption",
    summary: "Why catching InterruptedException clears the thread's interrupt status flag, causing infinite loops, and how to properly handle it.",
    problem: "A developer writes: 'while (!Thread.currentThread().isInterrupted()) { try { Thread.sleep(1000); } catch (InterruptedException e) { log.error(e); } }'. When an administrator calls 'thread.interrupt()', the thread refuses to terminate and continues looping forever! Why did thread.interrupt() fail?",
    juniorTrap: "Assuming that calling thread.interrupt() forcefully kills the thread or keeps the interrupt flag set after an exception is caught.",
    interviewerIntent: "Assesses understanding of cooperative thread cancellation in Java, `Thread.sleep` interrupt semantics, and preserving the interrupt status.",
    seniorAnswer: [
      "The Automatic Reset Invariant: In Java, thread interruption is **cooperative**, not preemptive. A thread cannot be killed from the outside. Calling `thread.interrupt()` simply sets a boolean interrupt flag.",
      "The Swallowed Interrupt Bug: When a thread is blocked in `Thread.sleep()`, `Object.wait()`, or `SocketChannel.read()` and receives an interrupt, the JVM throws `InterruptedException` AND AUTOMATICALLY CLEARS THE INTERRUPT STATUS FLAG (resets it back to `false`)! Catching the exception and just logging it swallows the signal. The next iteration checks `isInterrupted()`, sees `false`, and continues looping!",
      "Rule 1 - Re-Interrupt the Thread: If you catch `InterruptedException` and cannot re-throw it, you MUST re-assert the interrupt status: `Thread.currentThread().interrupt()`. This restores the flag so upstream callers can detect cancellation.",
      "Rule 2 - Differentiating Methods: 1) `isInterrupted()`: Checks the flag WITHOUT modifying it; 2) `Thread.interrupted()`: Checks the flag AND CLEARS IT (static method)."
    ],
    innerWorking: "HotSpot's `os::sleep` intercepts the OS signal, sets `_interrupted = false`, and throws `java.lang.InterruptedException` into the Java stack frame.",
    solution: `// ❌ THE BUGGY CODE (Infinite Loop):
while (!Thread.currentThread().isInterrupted()) {
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        log.error("Interrupted!"); // BUG: Flag was CLEARED! Loop never exits!
    }
}

// ✅ THE CORRECT CODE (Option A: Re-assert Interrupt):
while (!Thread.currentThread().isInterrupted()) {
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        // Restore interrupt status flag!
        Thread.currentThread().interrupt();
        break; // Cleanly exit loop
    }
}

// ✅ THE CORRECT CODE (Option B: Propagate Exception):
public void processBatch() throws InterruptedException {
    while (true) {
        Thread.sleep(1000); // Let caller decide how to handle cancellation
    }
}`,
    warStory: "A Kubernetes microservice failed to shut down during pod rolling updates, blocking deployment for 10 minutes until `SIGKILL` killed the container. SREs discovered a background polling thread was catching `InterruptedException` without re-interrupting, ignoring the JVM shutdown hook's cancellation request."
  },

  {
    id: "concurrency-q6-threadlocal-memory-leaks-tomcat",
    title: "6. ThreadLocal Memory Leaks in Thread Pools & Tomcat Workers",
    difficulty: "Senior",
    category: "Memory Management",
    summary: "Why pooled worker threads retain ThreadLocal references indefinitely, causing ClassLoader memory leaks, and mandatory cleanups.",
    problem: "A Spring Boot application running on Tomcat experiences slow memory leaks over weeks, eventually dying with 'java.lang.OutOfMemoryError: Metaspace' or 'Java heap space'. Heap dump analysis shows thousands of instances of 'ThreadLocalMap$Entry' holding references to loaded classes. Why did ThreadLocal leak memory?",
    juniorTrap: "Believing that ThreadLocal variables are automatically collected when an HTTP request finishes.",
    interviewerIntent: "Tests understanding of `ThreadLocal.ThreadLocalMap`, `WeakReference` keys vs strong values, thread pool worker reuse, and WebAppClassLoader leaks.",
    seniorAnswer: [
      "The Thread Pool Worker Invariant: In Tomcat, worker threads are NOT destroyed when an HTTP request completes! They are returned to a pool (`StandardThreadExecutor`) and reused across millions of subsequent requests for days or weeks.",
      "The WeakReference Weakness: `ThreadLocalMap.Entry` extends `WeakReference<ThreadLocal<?>>`. The KEY is weak, but the VALUE is a STRONG reference! If the `ThreadLocal` object itself is collected, the key becomes `null`, but the value remains pinned in memory as long as the worker thread is alive.",
      "The ClassLoader Leak Disaster: If the stored value is an application class (e.g. `UserContext` or `SecurityContext`), it holds a reference to its `Class`, which references the `WebAppClassLoader`. When you redeploy the web app, the old ClassLoader cannot be unloaded from Metaspace because Tomcat's worker threads still hold references to it in their `threadLocals` map!",
      "The Mandatory Fix: Always call `threadLocal.remove()` in a `finally` block or in a Spring `HandlerInterceptor.afterCompletion()` callback."
    ],
    innerWorking: "Each `Thread` object has a field `ThreadLocal.ThreadLocalMap threadLocals`. The map is garbage collected ONLY when the `Thread` object itself dies. Since pooled threads never die, stale entries remain forever unless explicitly removed.",
    solution: `// 1. Safe ThreadLocal Context Pattern:
public class UserContextHolder {
    private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

    public static void set(UserContext ctx) { CONTEXT.set(ctx); }
    public static UserContext get() { return CONTEXT.get(); }

    // CRITICAL: Always provide a remove method!
    public static void clear() {
        CONTEXT.remove();
    }
}

// 2. Guaranteed Cleanup in Spring Web MVC Interceptor:
@Component
public class UserContextInterceptor implements HandlerInterceptor {
    @Override
    public void afterCompletion(HttpServletRequest request, 
                                HttpServletResponse response, 
                                Object handler, Exception ex) {
        // ALWAYS CLEAR IN afterCompletion! Guarantees cleanup even if controller threw exception!
        UserContextHolder.clear();
    }
}`,
    warStory: "A SaaS fintech deployed hot-reloads every Tuesday. After 4 redeployments, Tomcat crashed with `OutOfMemoryError: Metaspace`. SREs found 4 duplicate `WebAppClassLoader` instances pinned by 200 Tomcat worker threads holding stale `ThreadLocal` tenant contexts. Enforcing `remove()` in an interceptor cured the leak permanently."
  },

  {
    id: "concurrency-q7-longadder-vs-atomiclong-contention",
    title: "7. LongAdder vs AtomicLong: Striped 64-Bit Counter Internals",
    difficulty: "Staff",
    category: "Lock-Free Algorithms",
    summary: "How LongAdder distributes high-contention writes across an array of Cell objects using thread hash probes to eliminate CAS retry storms.",
    problem: "An application tracks request metrics with 1,000 concurrent threads executing 'counter.incrementAndGet()'. CPU metrics show 90% CPU consumption on AtomicLong's CAS loop. Switching to 'LongAdder.increment()' drops CPU to 5% and boosts throughput 10x. How does LongAdder achieve this under the hood?",
    juniorTrap: "Assuming AtomicLong is always the most efficient lock-free counter in Java.",
    interviewerIntent: "Assesses understanding of cache line bouncing, CAS contention loops, striped data structures (Striped64), and eventual consistency of counts.",
    seniorAnswer: [
      "The AtomicLong Bottleneck: `AtomicLong` maintains a single `volatile long value`. Under high concurrency, 1,000 threads execute `compareAndSet(expected, update)` simultaneously. Only ONE thread succeeds; the other 999 threads fail and spin in tight retry loops, repeatedly issuing cache line invalidations across all CPU cores (cache bouncing).",
      "The LongAdder Philosophy (Striped64): `LongAdder` extends `Striped64`. It maintains a `base` variable AND an array of cell counters (`Cell[] cells`).",
      "How LongAdder Operates: 1) Under zero/low contention: updates mutate the `base` counter via CAS; 2) Under high contention: the thread calculates a hash probe (`Thread.probe`). It hashes to a specific slot in `cells[hash & (n-1)]` and updates that cell via CAS! Threads are partitioned across different cells, eliminating contention.",
      "Dynamic Cell Resizing: If CAS fails on a specific cell, LongAdder doubles the cell array size (up to the number of CPU cores).",
      "Tradeoff: `AtomicLong` provides atomic read-and-modify (`compareAndSet`, `getAndIncrement`). `LongAdder` is optimized purely for writing (`increment()`, `add()`). Calling `sum()` aggregates `base + sum(cells)` without locking, providing an eventual snapshot."
    ],
    innerWorking: "Each `Cell` inside `Striped64` is annotated with `@jdk.internal.vm.annotation.Contended` to prevent adjacent cells from sharing the same 64-byte cache line (eliminating False Sharing between worker threads).",
    solution: `// High-Contention Metrics Counter:
public class MetricsCollector {
    // ❌ SLOW UNDER HIGH CONTENTION (CAS Retry Storm):
    // private final AtomicLong requestCounter = new AtomicLong();

    // ✅ ULTRA-FAST UNDER HIGH CONTENTION (Striped Cells):
    private final LongAdder requestCounter = new LongAdder();

    public void onRequest() {
        requestCounter.increment(); // Distributes writes across CPU-aligned Cells
    }

    public long getTotalRequests() {
        return requestCounter.sum(); // Aggregates base + cells
    }
}`
  },

  {
    id: "concurrency-q8-reentrantreadwritelock-vs-stampedlock",
    title: "8. ReentrantReadWriteLock Write Starvation & StampedLock Optimistic Reads",
    difficulty: "Staff",
    category: "Locking & Synchronization",
    summary: "How StampedLock eliminates writer starvation using lock-free optimistic reads (tryOptimisticRead) and stamp validation.",
    problem: "In an in-memory caching system with 99% reads and 1% writes, using 'ReentrantReadWriteLock' causes writes to stall for seconds because a continuous stream of readers keeps the read lock active. How does Java 8 StampedLock solve write starvation?",
    juniorTrap: "Believing ReentrantReadWriteLock is always optimal for read-heavy systems without understanding pessimistic read locks.",
    interviewerIntent: "Assesses mastery of reader-writer lock starvation, StampedLock optimistic reading protocol, and reentrancy limitations.",
    seniorAnswer: [
      "The ReentrantReadWriteLock Flaw: RRWL's read lock is fully **pessimistic**. If 10,000 threads hold the read lock concurrently, a writer thread calling `writeLock.lock()` is blocked. If new readers continuously arrive, the writer is starved indefinitely.",
      "The StampedLock Revolution: `StampedLock` (Java 8) introduces a third mode: **Optimistic Reading** (`tryOptimisticRead()`).",
      "How Optimistic Reads Work: 1) Thread calls `long stamp = lock.tryOptimisticRead()`. This DOES NOT acquire a lock! It simply reads a version stamp from a volatile integer; 2) The thread reads the shared fields into local variables without any lock; 3) The thread calls `lock.validate(stamp)`. If no writer intervened during the read, the stamp is valid and the read is complete with ZERO locking overhead!; 4) If a writer intervened, `validate(stamp)` returns `false`. The thread falls back to a standard pessimistic read lock (`lock.readLock()`).",
      "Non-Reentrancy Warning: Unlike `ReentrantLock`, `StampedLock` is **NOT reentrant**! If a thread holding a write lock attempts to acquire it again, it will self-deadlock. It also does not support `Condition`."
    ],
    innerWorking: "StampedLock's state uses bits 0-7 for read counts, and bits 8-63 for the write version. `tryOptimisticRead()` checks if the write bit is 0 and returns the current version.",
    solution: `// StampedLock Optimistic Read Pattern (High-Performance 2D Point):
public class Point {
    private double x, y;
    private final StampedLock sl = new StampedLock();

    public void move(double deltaX, double deltaY) {
        long stamp = sl.writeLock(); // Exclusive write lock
        try {
            x += deltaX;
            y += deltaY;
        } finally {
            sl.unlockWrite(stamp);
        }
    }

    public double distanceFromOrigin() {
        // 1. Try Optimistic Read (NO LOCK ACQUIRED!):
        long stamp = sl.tryOptimisticRead();
        double currentX = x, currentY = y;

        // 2. Validate if a writer intervened:
        if (!sl.validate(stamp)) {
            // 3. Fallback to Pessimistic Read Lock if invalidated:
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }
}`
  },

  {
    id: "concurrency-q9-countdownlatch-vs-cyclicbarrier-semaphore",
    title: "9. CountDownLatch vs CyclicBarrier vs Semaphore: The Synchronization Triad",
    difficulty: "Senior",
    category: "Concurrency Utilities",
    summary: "Clear structural, operational, and lifecycle distinctions between CountDownLatch, CyclicBarrier, and Semaphore.",
    problem: "Interviewers frequently ask: 'What are the exact functional and architectural differences between CountDownLatch, CyclicBarrier, and Semaphore? When is CountDownLatch inappropriate for cyclic tasks?'",
    juniorTrap: "Confusing CountDownLatch (one-time countdown) with CyclicBarrier (reusable mutual barrier).",
    interviewerIntent: "Tests understanding of multi-thread coordination primitives, thread rendezvous, and resource throttling.",
    seniorAnswer: [
      "CountDownLatch (One-Shot Coordination): A latch initialized with count $N$. Threads call `await()` to block until $N$ events occur (`countDown()`). Crucial: **It is NOT reusable**! Once count hits 0, it cannot be reset. Best for: waiting for $N$ services to finish startup before serving traffic.",
      "CyclicBarrier (Reusable Mutual Rendezvous): A barrier where $N$ worker threads wait for EACH OTHER at a common rendezvous point (`barrier.await()`). Once all $N$ threads arrive, an optional `barrierAction` executes, the barrier trips, and it automatically resets for the next round! Best for: multi-phase parallel simulations or batch chunk processing.",
      "Semaphore (Permit-Based Concurrency Limiter): Manages a pool of $K$ permits. Threads call `acquire()` to claim a permit and `release()` to return it. If permits are exhausted, callers block. Unlike latches, permits can be released by threads that did not acquire them! Best for: rate limiting database connections or external API calls."
    ],
    innerWorking: "CountDownLatch uses AQS shared mode (state = count; `countDown()` decrements state; `await()` parks if state > 0). CyclicBarrier uses a single `ReentrantLock` and a `Condition` internally.",
    solution: `// 1. CountDownLatch (Master waits for 3 workers):
CountDownLatch latch = new CountDownLatch(3);
// Worker threads call: latch.countDown();
// Main thread calls: latch.await(); // Proceeds when count reaches 0!

// 2. CyclicBarrier (3 Workers wait for each other repeatedly):
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("Phase complete!"));
// Worker 1: barrier.await();
// Worker 2: barrier.await();
// Worker 3: barrier.await(); // Trips barrier, runs action, resets automatically!

// 3. Semaphore (Rate limit max 10 concurrent requests):
Semaphore semaphore = new Semaphore(10);
semaphore.acquire();
try {
    callThirdPartyApi();
} finally {
    semaphore.release();
}`
  },

  {
    id: "concurrency-q10-completablefuture-exception-handling",
    title: "10. CompletableFuture Exception Handling: exceptionally vs handle vs whenComplete",
    difficulty: "Senior",
    category: "Asynchronous Pipelines",
    summary: "Mastering non-blocking asynchronous exception handling in CompletableFuture pipelines without swallowing errors.",
    problem: "In an asynchronous CompletableFuture pipeline, an exception occurs in an upstream 'supplyAsync' task. How do 'exceptionally()', 'handle()', and 'whenComplete()' differ in their ability to recover, transform, or log the error?",
    juniorTrap: "Using whenComplete() expecting it to transform the result or return a fallback value.",
    interviewerIntent: "Assesses expertise in monadic functional async composition and error recovery in reactive pipelines.",
    seniorAnswer: [
      "`exceptionally(fn)` (Fallback Recovery): Invoked ONLY if an upstream stage threw an exception. Takes `Throwable` and returns a fallback value of the SAME type: `T`. The downstream pipeline continues with the fallback value as if no error occurred.",
      "`handle(biFn)` (Universal Transformation): Always executed, whether the upstream succeeded or failed. Takes `(result, throwable)`. It can return a NEW value or type, transforming both errors and success outputs into a unified response.",
      "`whenComplete(biConsumer)` (Pure Side-Effect): Always executed. Takes `(result, throwable)`, but returns `void`. It CANNOT alter the result or recover from the exception! The original result or exception passes through untouched to the next stage. Best for: logging metrics or closing resources."
    ],
    innerWorking: "CompletableFuture stages are linked as `UniCompletion` or `BiCompletion` nodes. When a stage completes exceptionally, it skips standard `thenApply` nodes and executes only exception-aware completion nodes.",
    solution: `CompletableFuture<String> pipeline = CompletableFuture.supplyAsync(() -> {
    if (new Random().nextBoolean()) throw new RuntimeException("DB Connection Timeout");
    return "User Profile Data";
})
// 1. whenComplete: Side-effect only (logging):
.whenComplete((res, ex) -> {
    if (ex != null) log.warn("Fetch attempt encountered error: {}", ex.getMessage());
})
// 2. exceptionally: Fallback recovery:
.exceptionally(ex -> {
    log.error("Falling back to cached profile");
    return "Cached Guest Profile"; // Fallback value
})
// 3. handle: Final transformation:
.handle((res, ex) -> {
    return "HTTP 200: " + res;
});`
  },

  {
    id: "concurrency-q11-caller-runs-policy-backpressure",
    title: "11. ThreadPoolExecutor CallerRunsPolicy & Graceful Backpressure",
    difficulty: "Senior",
    category: "Thread Pools & Schedulers",
    summary: "How CallerRunsPolicy turns the submitting thread into a temporary worker to throttle incoming workload without dropping requests.",
    problem: "Under a traffic surge, your thread pool's bounded queue fills to 100% capacity. Which RejectedExecutionHandler should you configure to prevent dropping tasks while naturally slowing down the upstream traffic producer?",
    juniorTrap: "Using AbortPolicy (which throws exceptions and breaks callers) or DiscardOldestPolicy (which loses customer orders).",
    interviewerIntent: "Tests understanding of distributed backpressure, thread saturation mechanics, and production resiliency.",
    seniorAnswer: [
      "The Backpressure Mechanism: `ThreadPoolExecutor.CallerRunsPolicy` mandates that if the queue is full and threads are at `maximumPoolSize`, the task is executed by the **CALLING thread** (e.g. the thread that called `executor.execute(task)`).",
      "Why This Creates Automatic Backpressure: If the caller is an HTTP request thread in Tomcat, executing a heavy 200ms task causes the Tomcat thread to block for 200ms. Because that thread is busy, Tomcat's connector cannot read new HTTP requests from the network socket buffer! The TCP window shrinks, forcing the client / load balancer to slow down transmission naturally.",
      "Zero Dropped Tasks: Unlike `DiscardPolicy`, zero tasks are lost. Unlike `AbortPolicy`, no exceptions are thrown.",
      "The Caveat: If the calling thread is a GUI event dispatch thread (JavaFX/Swing) or an event-loop thread (Netty), running a heavy task on the caller will freeze the UI or Netty event loop! In event-loop systems, offload rejections to a secondary fallback queue instead."
    ],
    innerWorking: "In `CallerRunsPolicy.rejectedExecution(Runnable r, ThreadPoolExecutor e)`: `if (!e.isShutdown()) { r.run(); }`. The task's `run()` method is called synchronously on the current thread stack.",
    solution: `ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10,                                  // corePoolSize
    20,                                  // maximumPoolSize
    60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),       // Bounded capacity
    new ThreadPoolExecutor.CallerRunsPolicy() // Caller executes task when saturated!
);`
  },

  {
    id: "concurrency-q12-why-concurrenthashmap-bans-null",
    title: "12. Why ConcurrentHashMap Bans Null Keys & Values: Doug Lea's Invariant",
    difficulty: "Senior",
    category: "Concurrent Collections",
    summary: "Why HashMap allows null but ConcurrentHashMap throws NullPointerException: the race condition of map.contains(null).",
    problem: "Standard 'java.util.HashMap' permits one null key and multiple null values. Why did Doug Lea strictly prohibit null keys and null values in 'ConcurrentHashMap', throwing NullPointerException?",
    juniorTrap: "Assuming it was an oversight or stylistic choice by the language designers.",
    interviewerIntent: "Assesses understanding of concurrency race conditions, atomic state interrogation, and disambiguation in concurrent collections.",
    seniorAnswer: [
      "The Ambiguity in get(key) == null: In single-threaded `HashMap`, if `map.get(key) == null`, there are two possibilities: 1) The key does not exist; 2) The key exists and its mapped value is literally `null`. You can disambiguate by calling `map.containsKey(key)`.",
      "The Concurrent Race Condition: In a multi-threaded `ConcurrentHashMap`, calling `get(k)` followed by `containsKey(k)` IS NOT ATOMIC! Between the two method calls, another thread can insert, delete, or mutate key `k`. You cannot reliably determine whether the key was absent or null.",
      "Doug Lea's Rule: In concurrent collections, `map.get(key) != null` MUST be an atomic, 100% reliable guarantee that the key exists. Banning null values eliminates the ambiguity completely.",
      "Null Keys: Storing a null key requires an arbitrary special-cased bucket index (like bucket 0 in HashMap), adding branch prediction penalties and complexity to lock-free CAS bucket lookups."
    ],
    innerWorking: "In `ConcurrentHashMap.putVal(key, value)`: `if (key == null || value == null) throw new NullPointerException();`. This check occurs on the very first line before hashing.",
    solution: `// ❌ THROWS NullPointerException:
ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
// map.put(null, "val");   // NPE!
// map.put("key", null);   // NPE!

// ✅ Proper representation of optionality:
// Use a sentinel object or Java Optional:
map.put("key", "OPTIONAL_EMPTY_SENTINEL");`
  },

  {
    id: "concurrency-q13-lost-wakeup-problem-synchronized-wait",
    title: "13. The Lost Wake-Up Problem: Why wait() Mandates a Monitor Lock",
    difficulty: "Staff",
    category: "Low-Level Synchronization",
    summary: "Why invoking wait() or notify() outside synchronized throws IllegalMonitorStateException to prevent Lost Wake-Ups.",
    problem: "Why does Java throw 'IllegalMonitorStateException' if you invoke 'obj.wait()' or 'obj.notify()' without holding the monitor lock for 'obj'? What exact race condition would occur if Java allowed wait() without synchronized?",
    juniorTrap: "Believing it is purely a syntax restriction enforced by the compiler without understanding the race condition.",
    interviewerIntent: "Tests deep knowledge of OS synchronization theory, condition variables, and the classic Lost Wake-Up race condition.",
    seniorAnswer: [
      "The Lost Wake-Up Race Sequence: Assume `wait()` could be called without `synchronized`: 1) Thread A evaluates `while (!ready)`; 2) Condition is false, so Thread A prepares to call `wait()`; 3) Just before Thread A executes `wait()`, a context switch occurs; 4) Thread B runs, sets `ready = true`, and calls `notify()`; 5) Because Thread A hasn't called `wait()` yet, Thread B's notification hits nothing and is LOST FOREVER!; 6) Thread A resumes and calls `wait()`. Thread A now sleeps permanently, even though `ready == true`!",
      "How synchronized Prevents It: By forcing both Thread A (checker/waiter) and Thread B (setter/notifier) to hold the monitor lock, checking the condition and calling `wait()` becomes ATOMIC with respect to `notify()`. Thread B cannot mutate `ready` or call `notify()` while Thread A is between checking the condition and entering `wait()`.",
      "Atomic Release of Lock: When a thread executes `wait()`, the JVM atomically puts the thread to sleep AND releases the monitor lock, allowing the notifying thread to acquire it."
    ],
    innerWorking: "In HotSpot `ObjectMonitor::wait()`, the thread must be the `_owner`. It adds itself to `_WaitSet` and calls `exit()` to drop ownership before invoking OS sleep.",
    solution: `// Proper Wait/Notify Protocol:
final Object lock = new Object();
boolean condition = false;

// WAITER THREAD:
synchronized (lock) {
    while (!condition) { // Must be in while loop!
        lock.wait();     // Atomically releases lock and sleeps
    }
    // Condition is true, proceed...
}

// NOTIFIER THREAD:
synchronized (lock) {
    condition = true;
    lock.notifyAll();    // Must hold lock to notify
}`
  },

  {
    id: "concurrency-q14-why-wait-in-while-loop-not-if",
    title: "14. Spurious Wakeups: Why wait() Must ALWAYS Be Inside a 'while' Loop",
    difficulty: "Senior",
    category: "Low-Level Synchronization",
    summary: "Why checking conditions with 'if (condition) wait()' causes catastrophic race conditions due to spurious wakeups and notifyAll competition.",
    problem: "Why does Joshua Bloch's Effective Java mandate 'while (!condition) { wait(); }' and strictly prohibit 'if (!condition) { wait(); }'? What two separate mechanisms wake up a waiting thread when the condition is still false?",
    juniorTrap: "Assuming that a thread woken from wait() can immediately proceed without re-checking the condition.",
    interviewerIntent: "Assesses understanding of Spurious Wakeups in POSIX thread implementations and competition between multiple threads awakened by notifyAll().",
    seniorAnswer: [
      "Reason 1 - Spurious Wakeups: In Linux and POSIX thread libraries (`pthreads`), a waiting thread can wake up WITHOUT any thread calling `notify()` or `notifyAll()`. This is an unavoidable consequence of multi-core interrupt handling at the OS kernel layer. If you use `if`, the thread wakes up spuriously and executes critical section code while the condition is still false!",
      "Reason 2 - Competition from notifyAll(): Thread A and Thread B are waiting for an item in a queue. Thread C pushes 1 item and calls `notifyAll()`. Both A and B wake up and contend for the lock. Thread A acquires the lock first, pops the item, and leaves the queue empty. When Thread B acquires the lock, the queue is EMPTY again! If Thread B used `if`, it would attempt to pop from an empty queue and throw an exception.",
      "The Invariant: Always re-test the condition in a `while` loop upon waking up. If the condition is still false, the thread immediately re-enters `wait()`."
    ],
    innerWorking: "POSIX `pthread_cond_wait` documentation explicitly warns that spurious wakeups may occur as a result of signal deliveries. Loops are required to re-evaluate predicates.",
    solution: `// ❌ DANGEROUS CODE (if condition):
synchronized (lock) {
    if (queue.isEmpty()) { // BUG: Spurious wakeup or another thread will crash this!
        lock.wait();
    }
    return queue.remove(); // Throws NoSuchElementException!
}

// ✅ SAFE PRODUCTION CODE (while loop):
synchronized (lock) {
    while (queue.isEmpty()) { // Re-evaluates predicate upon EVERY wakeup!
        lock.wait();
    }
    return queue.remove();
}`
  },

  {
    id: "concurrency-q15-blocking-queue-implementations-comparison",
    title: "15. SynchronousQueue vs ArrayBlockingQueue vs LinkedBlockingQueue",
    difficulty: "Senior",
    category: "Concurrency Utilities",
    summary: "Internal data structures, locking profiles, and memory tradeoffs between the three core BlockingQueue implementations.",
    problem: "Compare the internal architecture, capacity limits, and concurrency lock profiles of SynchronousQueue, ArrayBlockingQueue, and LinkedBlockingQueue. Which minimizes GC pressure, and which maximizes throughput?",
    juniorTrap: "Assuming SynchronousQueue is simply an ArrayBlockingQueue with capacity 1.",
    interviewerIntent: "Tests deep knowledge of queue data structures, two-lock concurrent queues, and garbage collection overhead.",
    seniorAnswer: [
      "SynchronousQueue: Capacity = ZERO! It is a direct thread-to-thread rendezvous handoff. A producer cannot insert unless a consumer is waiting to take, and vice-versa. Internally implemented as a dual-stack / dual-queue using lock-free CAS. Zero buffer, zero element queueing.",
      "ArrayBlockingQueue: Bounded circular array of fixed capacity. Uses a SINGLE `ReentrantLock` with two `Condition`s (`notEmpty`, `notFull`). Because producers and consumers contend for the SAME single lock, throughput drops under high concurrent thread counts. However, because it pre-allocates an array, it creates **zero GC garbage** during operation!",
      "LinkedBlockingQueue: Optionally bounded linked list. Uses **TWO separate locks**: a `takeLock` for consumers and a `putLock` for producers! Producers and consumers never block each other, delivering much higher throughput than ArrayBlockingQueue. Tradeoff: Each inserted item creates a `Node` object, increasing JVM heap allocation and GC pressure."
    ],
    innerWorking: "LinkedBlockingQueue's two-lock algorithm utilizes an `AtomicInteger count` to coordinate between producers and consumers while allowing simultaneous `enqueue` and `dequeue` operations.",
    solution: `// 1. ArrayBlockingQueue: Single Lock, Bounded, Zero GC Allocations:
BlockingQueue<Order> abq = new ArrayBlockingQueue<>(1000);

// 2. LinkedBlockingQueue: Two Locks (takeLock & putLock), Higher Concurrency:
BlockingQueue<Order> lbq = new LinkedBlockingQueue<>(1000);

// 3. SynchronousQueue: 0 Capacity, Direct Handoff (used in newCachedThreadPool):
BlockingQueue<Runnable> sq = new SynchronousQueue<>();`
  },

  {
    id: "concurrency-q16-virtual-thread-pinning-synchronized-trap",
    title: "16. Virtual Thread Carrier Pinning: Why synchronized Kills Project Loom",
    difficulty: "Staff",
    category: "Modern Concurrency (Java 21)",
    summary: "How synchronized blocks pin virtual threads to OS carrier threads, starving the carrier pool, and migrating to ReentrantLock.",
    problem: "A high-scale microservice migrated to Java 21 Virtual Threads expecting 50,000 concurrent requests. Instead, latency spiked to 30 seconds and the application froze under 100 requests. Diagnostic logs show 'Thread pinned to carrier'. What happened, and how do you resolve it?",
    juniorTrap: "Assuming all synchronized blocks automatically unmount cleanly in Java 21 Virtual Threads.",
    interviewerIntent: "Assesses expertise in Java 21 Project Loom internals, Continuation unmounting limitations, and carrier thread pool starvation.",
    seniorAnswer: [
      "What is Carrier Pinning: Virtual threads are scheduled onto a small pool of OS platform threads called **Carrier Threads** (typically count = CPU cores). When a virtual thread blocks on I/O, the JVM unmounts its Continuation, freeing the carrier thread. However, when a virtual thread is inside a `synchronized` block/method or native call (JNI), the virtual thread is **pinned** to its carrier thread!",
      "The Starvation Cascade: If a virtual thread enters `synchronized` and then executes a blocking I/O operation (e.g. JDBC database query or HTTP call), it CANNOT unmount! The carrier OS thread is forced to sleep. If all 16 carrier threads become pinned by 16 virtual threads waiting on databases, the ENTIRE carrier pool is exhausted! All other 49,984 virtual threads are starved of CPU time.",
      "The Production Fix: Replace `synchronized` with `ReentrantLock`. `ReentrantLock` is built on AQS and parks using `LockSupport.park()`, which unmounts from the carrier thread cleanly without pinning.",
      "Detecting Pinning: Run the JVM with `-Djdk.tracePinnedThreads=full` to print stack traces of pinned threads."
    ],
    innerWorking: "In HotSpot, the Continuation unwinder cannot serialize stack frames containing C++ `ObjectMonitor` monitor frames. It marks the carrier as pinned and blocks the underlying kernel thread.",
    solution: `// ❌ DISASTER IN VIRTUAL THREADS (Carrier Pinning):
public synchronized String fetchUserData(String userId) {
    // Blocking HTTP call while holding synchronized monitor pins carrier thread!
    return httpClient.get("/users/" + userId);
}

// ✅ SAFE IN VIRTUAL THREADS (Unmounts cleanly):
private final ReentrantLock lock = new ReentrantLock();

public String fetchUserDataSafe(String userId) {
    lock.lock();
    try {
        // Virtual thread unmounts from carrier cleanly during blocking I/O!
        return httpClient.get("/users/" + userId);
    } finally {
        lock.unlock();
    }
}`
  },

  {
    id: "concurrency-q17-concurrenthashmap-resizing-forwarding-nodes",
    title: "17. ConcurrentHashMap Resizing: ForwardingNodes & Collaborative Transfer",
    difficulty: "Staff",
    category: "Concurrent Collections",
    summary: "How Java 8+ ConcurrentHashMap resizes tables concurrently across multiple worker threads using ForwardingNodes with MOVED hash (-1).",
    problem: "When a ConcurrentHashMap hits its load factor threshold (0.75), does one thread lock the entire map to resize? How do multiple reader and writer threads cooperate simultaneously to migrate buckets to the new table?",
    juniorTrap: "Assuming ConcurrentHashMap blocks all writes during resizing or uses a single thread to rehash.",
    interviewerIntent: "Tests deep understanding of lock-free data structure migration, ForwardingNodes, and stride-based multi-threaded rehashing.",
    seniorAnswer: [
      "No Global Lock: ConcurrentHashMap in Java 8+ NEVER locks the entire table. Resizing is collaborative and non-blocking for readers.",
      "The Resizing Trigger: When `size >= sizeCtl`, a thread initiates resizing by creating `nextTable` with double the capacity (`n << 1`).",
      "Stride Partitioning: The initiating thread divides the old table into chunks called **strides** (minimum 16 buckets). It assigns strides to helper threads using CAS on `transferIndex`.",
      "The ForwardingNode Invariant: When a thread finishes migrating a bucket, it places a `ForwardingNode` at the head of that bucket in the old table. A ForwardingNode has a special hash value of `-1` (`MOVED`) and holds a pointer to `nextTable`.",
      "How Other Threads Cooperate: 1) **Readers**: Encounter a ForwardingNode and seamlessly find the key in `nextTable` without waiting!; 2) **Writers**: If a thread calls `put()` on a bucket that has a ForwardingNode, it does NOT wait idly — it calls `helpTransfer()`, claims an unmigrated stride, and helps transfer buckets until resizing completes!"
    ],
    innerWorking: "The `sizeCtl` volatile integer tracks the resizing state. When negative, the upper 16 bits encode the table size stamp, and the lower 16 bits encode the number of active helper threads.",
    solution: `// Java 8 ConcurrentHashMap ForwardingNode representation:
static final class ForwardingNode<K,V> extends Node<K,V> {
    final Node<K,V>[] nextTable;
    ForwardingNode(Node<K,V>[] tab) {
        super(MOVED, null, null, null); // MOVED = -1
        this.nextTable = tab;
    }
    // ForwardingNode.find() routes lookups directly to nextTable!
}`
  },

  {
    id: "concurrency-q18-livelock-vs-deadlock-vs-starvation",
    title: "18. Livelock vs Deadlock vs Starvation: Distinctions & Code Demonstrations",
    difficulty: "Senior",
    category: "Concurrency Theory",
    summary: "Understanding thread lock pathologies: 0% CPU Deadlock vs 100% CPU Livelock vs Thread Priority Starvation.",
    problem: "Define Livelock, Deadlock, and Starvation. How can an overzealous retry loop in 'tryLock()' create a Livelock? How does CPU utilization differ between Deadlock and Livelock?",
    juniorTrap: "Confusing Livelock (active state oscillation consuming 100% CPU) with Deadlock (dormant sleep consuming 0% CPU).",
    interviewerIntent: "Assesses theoretical and practical mastery of multi-threaded failure modes and randomized backoff recovery.",
    seniorAnswer: [
      "Deadlock: Two or more threads are permanently BLOCKED waiting on locks held by each other. Neither thread executes instructions. **CPU utilization drops to 0%**.",
      "Livelock: Threads are NOT blocked; they are actively running instructions, but constantly changing state in response to each other without making any forward progress. **CPU utilization spikes to 100%**! Example: Two threads attempt `lockA.tryLock()` and `lockB.tryLock()`. When the second lock is unavailable, both threads politely release their first lock simultaneously, sleep for the exact same fixed time, and retry, repeatedly colliding forever.",
      "Starvation: A thread is perpetually ready to run, but is continuously denied CPU time or lock acquisition because unfair locks or higher-priority threads monopolize the resource.",
      "Curing Livelock: Introduce **Randomized Jitter / Exponential Backoff** (similar to Ethernet CSMA/CD or AWS SDK retries). If `tryLock()` fails, sleep for `random(10ms, 50ms)` before retrying."
    ],
    innerWorking: "Livelock occurs when transaction aborts trigger deterministic immediate compensation loops that re-collide synchronously.",
    solution: `// Livelock Demonstration & Exponential Backoff Fix:
public void safeTransfer(Lock lockA, Lock lockB) {
    while (true) {
        if (lockA.tryLock()) {
            try {
                if (lockB.tryLock()) {
                    try {
                        // Critical Section
                        return;
                    } finally { lockB.unlock(); }
                }
            } finally { lockA.unlock(); }
        }
        // FIX: Randomized Jitter breaks livelock lockstep!
        int jitter = ThreadLocalRandom.current().nextInt(10, 50);
        try { Thread.sleep(jitter); } catch (InterruptedException e) { break; }
    }
}`
  },

  {
    id: "concurrency-q19-producer-consumer-two-conditions",
    title: "19. Bounded Buffer Producer-Consumer: ReentrantLock & Two Conditions",
    difficulty: "Staff",
    category: "Locking & Synchronization",
    summary: "Implementing a thread-safe BoundedBuffer from scratch using 1 ReentrantLock and 2 Conditions (notFull & notEmpty) to avoid lost wakeups.",
    problem: "Write a complete, thread-safe BoundedBuffer from scratch using ReentrantLock and Condition. Why is using TWO Conditions ('notFull' and 'notEmpty') vastly superior to a single Condition or wait/notify?",
    juniorTrap: "Using a single Condition and calling signal(), which wakes up another producer when a producer needs to wake up a consumer, causing deadlocks.",
    interviewerIntent: "Tests ability to write bug-free concurrent data structures, understanding condition queues, and targeted thread signaling.",
    seniorAnswer: [
      "The Single Condition Flaw: If you use a single condition `cond = lock.newCondition()` and call `cond.signal()`, the JVM picks an arbitrary waiting thread from the condition queue. A producer might signal another waiting producer! The signaled producer wakes up, sees the buffer is still full, and goes back to sleep. The waiting consumers never receive the signal, resulting in deadlock.",
      "The Two Condition Architecture: 1) `notFull`: Producers wait here when buffer is full; signaled by consumers when an item is removed; 2) `notEmpty`: Consumers wait here when buffer is empty; signaled by producers when an item is added.",
      "Targeted Signaling: Producers signal ONLY `notEmpty` (waking up a consumer). Consumers signal ONLY `notFull` (waking up a producer). Zero wasted context switches, zero cross-signaling deadlocks!",
      "While Loop Mandate: Always wrap `condition.await()` in a `while` loop to guard against spurious wakeups."
    ],
    innerWorking: "Each `ConditionObject` maintains its own FIFO queue of waiting nodes. Calling `signal()` moves the first node from the condition queue to the main AQS lock queue.",
    solution: `// Production Implementation of BoundedBuffer:
public class BoundedBuffer<T> {
    private final Object[] items;
    private int putIndex, takeIndex, count;

    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition(); // Producer wait queue
    private final Condition notEmpty = lock.newCondition(); // Consumer wait queue

    public BoundedBuffer(int capacity) {
        this.items = new Object[capacity];
    }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) {
                notFull.await(); // Buffer full: wait for consumer to take!
            }
            items[putIndex] = item;
            if (++putIndex == items.length) putIndex = 0;
            count++;
            notEmpty.signal(); // Wake up waiting consumer!
        } finally {
            lock.unlock();
        }
    }

    @SuppressWarnings("unchecked")
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                notEmpty.await(); // Buffer empty: wait for producer to put!
            }
            T item = (T) items[takeIndex];
            items[takeIndex] = null; // Prevent memory leak
            if (++takeIndex == items.length) takeIndex = 0;
            count--;
            notFull.signal(); // Wake up waiting producer!
            return item;
        } finally {
            lock.unlock();
        }
    }
}`
  },

  {
    id: "concurrency-q20-scopedvalue-vs-threadlocal-java21",
    title: "20. ScopedValue vs ThreadLocal in Java 21: Eliminating Memory Footprints",
    difficulty: "Staff",
    category: "Modern Concurrency (Java 21)",
    summary: "Why ThreadLocal fails with millions of virtual threads, and how Java 21 ScopedValue provides immutable, zero-allocation context sharing.",
    problem: "When adopting millions of Virtual Threads, why does ThreadLocal become a dangerous memory bottleneck? How does Java 21 'ScopedValue' resolve mutability, inheritance overhead, and memory bloat?",
    juniorTrap: "Assuming ThreadLocal works equally well with platform threads and virtual threads.",
    interviewerIntent: "Assesses awareness of modern Java 21 Loom innovations, immutability benefits, and context propagation in massive concurrency.",
    seniorAnswer: [
      "The ThreadLocal Crisis with Virtual Threads: When running 1,000,000 virtual threads: 1) If each virtual thread allocates a `ThreadLocalMap`, millions of heap objects are created, consuming hundreds of MBs of memory; 2) `InheritableThreadLocal` deeply copies the entire map for every child thread, causing massive allocation spikes; 3) `ThreadLocal.set()` is mutable anywhere in the codebase, making data flow unpredictable.",
      "The ScopedValue Solution (JEP 446): `ScopedValue` is an immutable, bounded data carrier designed specifically for virtual threads.",
      "Key Advantages of ScopedValue: 1) **Immutability**: Once bound via `ScopedValue.where(KEY, value).run(...)`, it CANNOT be mutated; 2) **Bounded Lifetime**: The value is valid ONLY within the lexical scope of the `run()` or `call()` method; 3) **Zero-Copy Inheritance**: Child virtual threads created via Structured Concurrency share the exact same parent pointer with zero memory copying!"
    ],
    innerWorking: "ScopedValue is implemented directly inside the HotSpot JVM using a single compact array linked to the thread's execution frame. When the frame exits, the binding disappears automatically.",
    solution: `// Java 21 ScopedValue Blueprint:
public class SecurityContextService {
    // 1. Declare ScopedValue:
    public static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

    public void handleRequest(User user) {
        // 2. Bind value to lexical scope (Immutable & auto-cleared on exit!):
        ScopedValue.where(CURRENT_USER, user).run(() -> {
            processPayment();
            sendConfirmation();
            // Child virtual threads inherit CURRENT_USER with zero allocation overhead!
        });
    }

    private void processPayment() {
        User user = CURRENT_USER.get(); // Read securely anywhere in call chain
        System.out.println("Processing for: " + user.name());
    }
}`
  },

  {
    id: "concurrency-q21-cas-spin-cost-cache-coherence",
    title: "21. Lock-Free CAS Spin Costs & CPU Bus Lock Contention",
    difficulty: "Staff",
    category: "Lock-Free Algorithms",
    summary: "Hardware cost of failed CAS retry loops, cache coherence invalidation bus storms, and pause instruction optimizations.",
    problem: "In lock-free algorithms, developers frequently write 'while (!compareAndSet(expected, update)) {}'. Under 500 threads, why does this loop cause severe CPU thermal throttling and memory bus saturation? How does the 'Thread.onSpinWait()' instruction help?",
    juniorTrap: "Assuming that because CAS is lock-free, spinning in a loop has zero negative performance consequences.",
    interviewerIntent: "Assesses deep understanding of hardware instruction pipelines, CPU bus protocols, and the x86 PAUSE instruction.",
    seniorAnswer: [
      "The Hardware Cost of CAS: On x86 processors, CAS compiles to `lock cmpxchg`. The `lock` prefix asserts a hardware lock signal on the system bus or locks the cache line, preventing other CPU cores from accessing memory during the read-modify-write cycle.",
      "The Bus Storm Disaster: In a tight `while (!CAS)` loop, 500 CPU cores issue hundreds of thousands of bus lock signals per millisecond. This saturates the CPU memory controller, starves other cores of memory bandwidth, and causes CPU pipelining mispredictions.",
      "The Solution - Thread.onSpinWait() (Java 9+): HotSpot maps `Thread.onSpinWait()` directly to the x86 `PAUSE` instruction! The `PAUSE` instruction hints to the CPU that it is in a spin-wait loop. It introduces a tiny delay (~10-14 cycles), prevents pipeline memory order violations on exit, and reduces power/thermal consumption by 80%."
    ],
    innerWorking: "Without `PAUSE`, exiting a spin loop triggers a pipeline flush because the CPU speculatively executed subsequent instructions with stale memory values.",
    solution: `// High-Performance Lock-Free Spin Loop with Thread.onSpinWait():
public void spinWaitLock() {
    while (!state.compareAndSet(0, 1)) {
        // CRITICAL: Tells the CPU hardware we are spinning!
        // Generates x86 'pause' instruction, eliminating bus storms:
        Thread.onSpinWait();
    }
}`
  },

  {
    id: "concurrency-q22-threadpool-graceful-shutdown-runbook",
    title: "22. The 2-Phase ThreadPoolExecutor Graceful Shutdown Runbook",
    difficulty: "Senior",
    category: "Thread Pools & Schedulers",
    summary: "Preventing data corruption and abrupt job termination during Kubernetes pod SIGTERM via shutdown() and awaitTermination().",
    problem: "When a Kubernetes pod terminates, it sends SIGTERM. A Spring Boot batch service using ThreadPoolExecutor abruptly terminates mid-task, leaving uncommitted database rows and corrupted state. What is the standard 2-phase shutdown protocol?",
    juniorTrap: "Calling executor.shutdownNow() immediately upon shutdown.",
    interviewerIntent: "Assesses operational knowledge of cloud-native termination lifecycles, POSIX SIGTERM handling, and graceful thread draining.",
    seniorAnswer: [
      "The 2-Phase Shutdown Pattern: Recommended by Java Concurrency in Practice: 1) Phase 1: Call `executor.shutdown()`. This rejects new incoming tasks while allowing already queued and running tasks to complete; 2) Wait for completion via `executor.awaitTermination(timeout, TimeUnit.SECONDS)`; 3) Phase 2: If the timeout expires and tasks are still stuck, call `executor.shutdownNow()`, which sends `Thread.interrupt()` to all active worker threads; 4) Await termination one last time to allow interrupted tasks to clean up resources.",
      "Spring Boot Configuration: Configure `spring.lifecycle.timeout-per-shutdown-phase=30s` and enable `server.shutdown=graceful`."
    ],
    innerWorking: "`shutdown()` sets `runState` to `SHUTDOWN`. `shutdownNow()` sets `runState` to `STOP`, drains the queue into a list, and interrupts workers.",
    solution: `public static void shutdownAndAwaitTermination(ExecutorService pool, int timeoutSeconds) {
    pool.shutdown(); // Disable new tasks from being submitted
    try {
        // Wait up to timeoutSeconds for existing tasks to terminate:
        if (!pool.awaitTermination(timeoutSeconds, TimeUnit.SECONDS)) {
            pool.shutdownNow(); // Cancel currently executing tasks
            // Wait again for tasks to respond to interruption:
            if (!pool.awaitTermination(timeoutSeconds, TimeUnit.SECONDS)) {
                System.err.println("Pool did not terminate!");
            }
        }
    } catch (InterruptedException ie) {
        // Re-cancel if current thread also interrupted
        pool.shutdownNow();
        Thread.currentThread().interrupt();
    }
}`
  },

  {
    id: "concurrency-q23-thread-priorities-platform-dependence",
    title: "23. Why You Should Never Rely on Java Thread Priorities",
    difficulty: "Senior",
    category: "Thread Lifecycle & OS Scheduling",
    summary: "How Linux completely ignores Java thread priorities, priority inversion risks, and why priority-based architectures fail.",
    problem: "A developer sets 'thread.setPriority(Thread.MAX_PRIORITY)' on critical transaction threads and 'Thread.MIN_PRIORITY' on report generation threads. When deployed to a Linux production server, both tasks run at the exact same speed! Why?",
    juniorTrap: "Assuming that Java's 1-10 priority scale strictly controls OS CPU scheduling.",
    interviewerIntent: "Tests understanding of JVM thread-to-OS mapping, completely fair scheduler (CFS), and platform dependence.",
    seniorAnswer: [
      "The Platform Dependence Trap: The JVM has 10 priority levels (1 to 10), but operating systems do not map them uniformly: 1) **Linux**: The Completely Fair Scheduler (CFS) maps all Java thread priorities to the exact same normal `nice` value (0)! Unless the JVM runs as root with real-time permissions (`SCHED_FIFO` / `SCHED_RR`), thread priority is completely ignored by the Linux kernel; 2) **Windows**: Maps 10 priorities to 7 priority levels, leading to non-linear behavior.",
      "The Priority Inversion Disaster: A low-priority thread acquires a lock. A high-priority thread attempts to acquire the lock and blocks. A medium-priority thread with no lock preempts the low-priority thread! The high-priority thread is now delayed by the medium-priority thread indefinitely (the exact bug that froze the Mars Pathfinder spacecraft in 1997!).",
      "The Solution: Never rely on thread priorities! Use separate dedicated thread pools with bounded capacities, or assign different worker pool thread counts."
    ],
    innerWorking: "HotSpot maps `Thread.setPriority()` to OS native calls (`SetThreadPriority` on Windows, `pthread_setschedparam` on Linux). On Linux, non-root processes are forbidden from modifying priority.",
    solution: `// ❌ UNRELIABLE IN PRODUCTION (Ignored on Linux):
Thread t1 = new Thread(task);
t1.setPriority(Thread.MAX_PRIORITY);

// ✅ RELIABLE PRODUCTION ARCHITECTURE:
// Dedicate separate thread pools to isolate high-priority traffic!
ExecutorService highPriorityPool = Executors.newFixedThreadPool(16);
ExecutorService lowPriorityBatchPool = Executors.newFixedThreadPool(4);`
  },

  {
    id: "concurrency-q24-locksupport-park-unpark-advantages",
    title: "24. LockSupport.park() & unpark() vs wait() & notify()",
    difficulty: "Staff",
    category: "Low-Level Synchronization",
    summary: "Why LockSupport is the core primitive of AQS: permit-based unblocking, targeted unparking, and zero monitor requirements.",
    problem: "Why did Doug Lea base the entirety of AQS and java.util.concurrent on 'LockSupport.park()' and 'unpark()' rather than Java's built-in 'wait()' and 'notify()'?",
    juniorTrap: "Thinking LockSupport is just a wrapper around Object.wait().",
    interviewerIntent: "Assesses mastery of low-level synchronization primitives, permit mechanisms, and eliminating race conditions in custom locks.",
    seniorAnswer: [
      "Advantage 1 - No Monitor Lock Required: `Object.wait()` throws `IllegalMonitorStateException` if not inside `synchronized`. `LockSupport.park()` can be called anywhere without acquiring any locks.",
      "Advantage 2 - unpark() Before park() Solves Lost Wake-Ups: In `wait()` / `notify()`, if `notify()` executes before `wait()`, the signal is lost forever! `LockSupport` uses a **Binary Permit**: calling `unpark(thread)` grants a permit (1). When that thread later calls `park()`, it consumes the permit and continues immediately without blocking!",
      "Advantage 3 - Targeted Thread Unparking: `Object.notify()` wakes up an arbitrary thread chosen by the JVM. `LockSupport.unpark(Thread t)` wakes up the EXACT, specific thread passed as an argument.",
      "Advantage 4 - Blockers for Debugging: `LockSupport.park(Object blocker)` records which object caused the thread to block. In thread dumps (`jstack`), the blocker object is clearly displayed, dramatically simplifying deadlock triage."
    ],
    innerWorking: "Each thread has a Parker object in HotSpot C++ (`Parker::_counter`). `unpark` sets counter to 1; `park` checks counter: if 1, sets to 0 and returns; if 0, calls `pthread_cond_wait`.",
    solution: `// Demonstrating unpark() BEFORE park() (Zero Lost Wake-Up):
Thread worker = new Thread(() -> {
    try { Thread.sleep(500); } catch (InterruptedException e) {}
    System.out.println("Worker calling park()...");
    // Because main thread already called unpark(), this DOES NOT BLOCK!
    LockSupport.park();
    System.out.println("Worker resumed immediately!");
});

worker.start();

// Main thread unparks worker BEFORE worker even calls park():
LockSupport.unpark(worker); // Grants permit!`
  },

  {
    id: "concurrency-q25-copyonwritearraylist-read-heavy-traps",
    title: "25. CopyOnWriteArrayList: Zero-Lock Reads vs The $O(N)$ Mutation Trap",
    difficulty: "Senior",
    category: "Concurrent Collections",
    summary: "How CopyOnWriteArrayList achieves lock-free concurrent iteration, and why write-heavy workloads cause severe memory churn.",
    problem: "When is CopyOnWriteArrayList appropriate, and why is it a catastrophic performance trap if used in write-heavy workloads (e.g. 500 writes/sec)? How does its Iterator guarantee zero ConcurrentModificationException without locking?",
    juniorTrap: "Using CopyOnWriteArrayList as a general-purpose replacement for synchronized ArrayList.",
    interviewerIntent: "Tests understanding of copy-on-write semantics, iterator snapshot isolation, and memory allocation overhead.",
    seniorAnswer: [
      "How It Works: `CopyOnWriteArrayList` stores elements in an internal `volatile Object[] array`. On every write operation (`add()`, `set()`, `remove()`), it acquires an internal `ReentrantLock`, allocates a completely NEW array of size $N+1$, copies all existing elements over, appends the new element, and points the volatile array reference to the new array.",
      "The Read Advantage: Reads (`get(index)`, iterating) DO NOT acquire any locks! They read directly from the volatile array. It delivers 100% lock-free, ultra-fast read throughput.",
      "Snapshot Iterator: When you call `list.iterator()`, the iterator holds a reference to the array snapshot AT THAT EXACT INSTANT. Even if other threads mutate the list, the iterator reads its own immutable snapshot! It NEVER throws `ConcurrentModificationException`.",
      "The Write-Heavy Disaster: If a list has 100,000 items and you perform 500 writes/sec, the JVM allocates 500 new 100k-element arrays per second (50 million object references copied per second!). The garbage collector will choke on Young-Gen allocations and trigger continuous Full GC pauses.",
      "Best Use Case: Small collections with 99.9% reads and rare writes (e.g. event listener registries, plugin lists, observer patterns)."
    ],
    innerWorking: "In `add(E e)`: `lock.lock(); Object[] elements = getArray(); Object[] newElements = Arrays.copyOf(elements, len + 1); setArray(newElements); lock.unlock();`.",
    solution: `// Ideal Use Case: Observer / Event Listener Registry:
public class EventDispatcher {
    // Perfect: Listeners are registered on startup, invoked millions of times:
    private final CopyOnWriteArrayList<EventListener> listeners = new CopyOnWriteArrayList<>();

    public void register(EventListener l) {
        listeners.add(l); // Rare write
    }

    public void dispatch(Event e) {
        // 100% Lock-Free Iteration! Zero ConcurrentModificationException:
        for (EventListener l : listeners) {
            l.onEvent(e);
        }
    }
}`
  }
,
  {
    id: "concurrency-q26-volatile-dcl-reentrantlock-deep-dive",
    title: "26. Volatile Compound Assignment Trap, Double-Checked Locking Safe Publication & ReentrantLock Advantages (Interview Deep Dive Q4.1)",
    difficulty: "Staff / Principal",
    category: "Memory Model, Synchronization & Locks",
    summary: "volatile count++ thread safety, happens-before rules, Double-Checked Locking memory reordering & safe publication, and synchronized vs ReentrantLock.",
    problem: "1) volatile int count; count++ from 10 threads: thread-safe? What does volatile guarantee vs not guarantee? What is the happens-before rule? 2) Why must instance be volatile in double-checked locking? What can a thread observe without it? 3) synchronized vs ReentrantLock: 2 concrete reasons to pick ReentrantLock and what tryLock(timeout) is for.",
    juniorTrap: "Assuming volatile makes compound operations like count++ atomic, or assuming double-checked locking without volatile is safe on modern multi-core x86/ARM processors.",
    interviewerIntent: "Tests precision on Java Memory Model (JMM) happens-before rules, instruction reordering, safe publication of object references, and explicit lock semantics.",
    seniorAnswer: [
      "1. volatile int count; count++ Is NOT Thread-Safe: count++ compiles to 3 distinct bytecode instructions: (1) getfield (read from memory), (2) iadd (increment on operand stack), (3) putfield (write back to memory). If two threads read count=5 simultaneously, both write count=6, causing lost updates. Volatile guarantees VISIBILITY (reads always see latest write directly from main memory) and ORDERING (forbids instruction reordering via memory barriers), but guarantees ZERO ATOMICITY for compound read-modify-write actions. Fix: AtomicInteger, LongAdder, or locks.",
      "2. The JMM Volatile Happens-Before Rule: 'A write to a volatile field happens-before every subsequent read of that same field.' Furthermore, all writes made by thread A prior to writing to the volatile field are guaranteed visible to thread B after reading the volatile field.",
      "3. Why DCL Requires volatile (Safe Publication): The statement 'instance = new Singleton()' consists of 3 distinct JVM bytecode/CPU steps: [A] Allocate memory on heap; [B] Invoke constructor to initialize fields; [C] Assign heap memory address to 'instance' variable. Without volatile, the JIT compiler and CPU out-of-order execution pipeline may reorder step [C] before step [B]! Thread B enters the outer null-check, observes instance != null, skips synchronization, and returns an uninitialized, partially constructed object! Thread B reading fields encounters null pointers or corrupt default values. volatile injects a Store-Store memory barrier preventing [C] from being reordered before [B].",
      "4. Concrete Reasons to Choose ReentrantLock over synchronized: Reason 1: tryLock(timeout) allows bounded, timed waiting. It prevents deadlocks (if lock B cannot be acquired within 500ms, back off, release lock A, and retry) and enables fail-fast load shedding. Reason 2: lockInterruptibly() allows threads waiting for a lock to respond to Thread.interrupt() and shut down cleanly (synchronized is completely uninterruptible). Reason 3: Multiple Condition instances (e.g. notEmpty vs notFull) on a single lock, avoiding spurious notifyAll() wakeup storms. Reason 4: Lock inspection metrics (isLocked(), getQueueLength(), isHeldByCurrentThread()).",
      "5. The ReentrantLock Tradeoff: With ReentrantLock, you MUST manually unlock in a finally block: 'lock.lock(); try { ... } finally { lock.unlock(); }'. A missed unlock is a permanent production deadlock; synchronized is automatically released by JVM monitor exit."
    ],
    innerWorking: "On x86 architectures, volatile writes generate a 'lock addl $0,0(%%esp)' instruction which flushes the processor's store buffer to L1/L2 cache and invalidates other cores' caches via MESI cache coherence protocols. On ARM64 (Apple Silicon, AWS Graviton), volatile generates explicit 'dmb ish' (Data Memory Barrier Inner Shareable) instructions.",
    solution: `// 1. Double-Checked Locking (DCL) with volatile:
public class SafeSingleton {
    // MUST be volatile to prevent instruction reordering (Step C before Step B)!
    private static volatile SafeSingleton instance;

    private SafeSingleton() {
        // initialization
    }

    public static SafeSingleton getInstance() {
        if (instance == null) { // 1st check: Avoids synchronization once initialized
            synchronized (SafeSingleton.class) {
                if (instance == null) { // 2nd check: Inside monitor
                    instance = new SafeSingleton(); // Safe publication!
                }
            }
        }
        return instance;
    }
}

// 2. ReentrantLock with tryLock(timeout) Deadlock Avoidance:
public class AccountTransferService {
    private final Lock lockA = new ReentrantLock();
    private final Lock lockB = new ReentrantLock();

    public boolean transferFunds(Account from, Account to, double amount) throws InterruptedException {
        // Attempt to acquire both locks within 500ms:
        if (lockA.tryLock(500, TimeUnit.MILLISECONDS)) {
            try {
                if (lockB.tryLock(500, TimeUnit.MILLISECONDS)) {
                    try {
                        from.debit(amount);
                        to.credit(amount);
                        return true;
                    } finally {
                        lockB.unlock();
                    }
                }
            } finally {
                lockA.unlock();
            }
        }
        // Failed to acquire locks in time: Back off, do NOT deadlock!
        return false;
    }
}`,
    warStory: "An ad-tech bidding engine used Double-Checked Locking without volatile for a shared GeoIP lookup index. On AWS c5 (Intel) instances it worked by coincidence due to strong x86 TSO (Total Store Order) memory models. When the team migrated to AWS Graviton (ARM64) instances, ARM's weakly-ordered memory model immediately reordered the constructor allocation, causing 15% of all ad bids to throw NullPointerExceptions from partially constructed objects, costing $80,000 in lost revenue in 4 hours."
  },
  {
    id: "concurrency-q27-threadpool-sizing-completablefuture-virtualthreads",
    title: "27. Thread Pool Sizing & OOM Traps, CompletableFuture Composition Pitfalls & Virtual Thread Carrier Pinning (Interview Deep Dive Q4.2)",
    difficulty: "Staff / Principal",
    category: "Executor Architecture & Concurrency Evolution",
    summary: "Thread pool mathematical sizing, Executors factory OOM traps, CompletableFuture composition nuances, and Virtual Thread carrier pinning mechanics.",
    problem: "1) How do you size a thread pool for mixed CPU/IO workloads? Why are Executors.newFixedThreadPool and newCachedThreadPool traps in production? 2) CompletableFuture: thenApply vs thenCompose vs thenCombine and their production pitfalls? 3) Virtual Threads (Java 21): when do they help, when not, and what is carrier pinning?",
    juniorTrap: "Using Executors.newFixedThreadPool(200) without realizing it uses an unbounded LinkedBlockingQueue that causes OutOfMemoryError under load, or running blocking database calls inside CompletableFuture.thenApply().",
    interviewerIntent: "Assesses capacity planning formulas, ExecutorService failure modes, modern asynchronous functional programming, and Java 21 Project Loom runtime internals.",
    seniorAnswer: [
      "1. Thread Pool Sizing Formulas: CPU-Bound Tasks: threads = CPU_cores + 1. (Extra thread covers minor page faults). I/O-Bound Tasks: threads = CPU_cores * (1 + Wait_Time / Service_Time). Example: 8 cores with tasks spending 90% waiting on DB (Wait=90ms, Service=10ms): threads = 8 * (1 + 90/10) = 80 threads. Measure under actual load with Micrometer metrics (activeCount, queueSize).",
      "2. Why Executors Factory Methods Are Production Traps: Executors.newFixedThreadPool(N): Uses an UNBOUNDED LinkedBlockingQueue (capacity Integer.MAX_VALUE). Under load spikes, requests queue up endlessly until heap exhaustion (OutOfMemoryError: Java heap space); tasks never trigger rejection policies. Executors.newCachedThreadPool(): Uses SynchronousQueue but allows UNBOUNDED max threads (Integer.MAX_VALUE). Under load, it spawns thousands of OS platform threads (~1MB stack each), crashing the JVM with OutOfMemoryError: unable to create new native thread and OS context-switch thrashing. Rule: ALWAYS construct explicit ThreadPoolExecutor with bounded queue, named thread factory, and CallerRunsPolicy.",
      "3. CompletableFuture Composition Mechanics: thenApply(Function<T,R>): Map synchronous transformation on the completing thread. thenCompose(Function<T, CompletableFuture<R>>): FlatMap async chaining; chains a dependent async stage without nesting CompletableFuture<CompletableFuture<R>>. thenCombine(otherFuture, BiFunction): Fan-in parallel merge; executes two independent futures concurrently and combines results when both complete.",
      "4. CompletableFuture Production Pitfalls: Pitfall 1: Calling blocking I/O (JDBC/HTTP) inside thenApply() blocks the completing thread or the global ForkJoinPool.commonPool(), starving the entire JVM! Always use thenApplyAsync(fn, customExecutor). Pitfall 2: Silently swallowed exceptions: if a future throws an exception and downstream stages lack .exceptionally() or .handle(), the exception is lost and threads hang waiting on join(). Pitfall 3: Calling future.get() without a timeout.",
      "5. Virtual Threads (Project Loom - Java 21): When They Help: High-throughput I/O-bound workloads (HTTP servers, JDBC database queries, socket operations). Virtual threads are user-mode threads (~1KB heap memory vs ~1MB OS stack); spawn millions with Executors.newVirtualThreadPerTaskExecutor(). Never pool virtual threads! When They Do NOT Help: CPU-bound tasks (cryptography, video rendering; still bound by N physical CPU cores).",
      "6. Carrier Thread Pinning: A virtual thread is mounted onto an OS carrier thread (from a ForkJoinPool). If a virtual thread executes blocking I/O inside a 'synchronized' block/method or native JNI call, it PINNNS to the underlying OS carrier thread! The carrier thread cannot unmount or run other virtual threads, leading to carrier pool starvation and deadlocks. Fix: Replace synchronized with ReentrantLock around blocking calls (JDK 24+ relaxes synchronized pinning, but ReentrantLock remains best practice). Also avoid ThreadLocal memory bloat with millions of virtual threads."
    ],
    innerWorking: "Virtual threads use HotSpot Continuations. When a virtual thread performs blocking socket I/O, the JVM unmounts the continuation from the carrier OS thread, saves its call stack to the heap, and reassigns the carrier thread to another virtual thread. When the OS epoll/kqueue notification arrives, the continuation is rescheduled on any available carrier thread.",
    solution: `// 1. PRODUCTION-GRADE THREAD POOL CONFIGURATION:
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    8,                                                   // Core pool size
    32,                                                  // Max pool size
    60L, TimeUnit.SECONDS,                               // Keep-alive time
    new ArrayBlockingQueue<>(1000),                      // BOUNDED queue (Prevents OOM!)
    new CustomizableThreadFactory("order-worker-"),      // Named threads
    new ThreadPoolExecutor.CallerRunsPolicy()            // Natural backpressure: caller thread executes!
);

// 2. COMPLETABLEFUTURE FAN-IN COMPOSITION:
CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(
    () -> userService.fetchUser(userId), executor);

CompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(
    () -> orderService.fetchOrders(userId), executor);

CompletableFuture<UserProfile> profileFuture = userFuture.thenCombineAsync(ordersFuture, 
    (user, orders) -> new UserProfile(user, orders), executor)
    .orTimeout(3, TimeUnit.SECONDS) // Avoids hanging forever
    .exceptionally(ex -> UserProfile.fallback(userId));

// 3. JAVA 21 VIRTUAL THREADS (NO POOLING!):
try (var virtualExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        virtualExecutor.submit(() -> {
            // Safe non-pinning lock:
            reentrantLock.lock();
            try {
                return callPaymentGateway(i); // Continuation unmounts from carrier!
            } finally {
                reentrantLock.unlock();
            }
        });
    });
} // Auto-closes and joins all tasks`,
    warStory: "A SaaS analytics provider processed webhooks with Executors.newCachedThreadPool(). During an external customer data migration, 25,000 webhook POST requests arrived in 10 seconds. The JVM attempted to spawn 25,000 OS platform threads. The Linux host ran out of PIDs, throwing 'java.lang.OutOfMemoryError: unable to create new native thread', taking down all customer microservices on the same EC2 instance."
  }
];
