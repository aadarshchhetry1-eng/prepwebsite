"""
java_internals_data2.py
Topics 15 to 28:
15. Java Memory Model
16. volatile Keyword
17. synchronized Keyword
18. Happens-Before Rules
19. Atomicity, Visibility, Ordering
20. Thread Lifecycle and States
21. Thread vs. Process
22. Thread Stack Size
23. ConcurrentHashMap Internals
24. CompletableFuture Internals
25. ThreadPoolExecutor Internals
26. AQS (AbstractQueuedSynchronizer)
27. Intrinsic vs. Explicit Locks
28. Deadlock Detection and Avoidance
"""

TOPICS_15_TO_28 = [
    {
        "id": "java-int-jmm",
        "title": "Java Memory Model (JMM) & Hardware Coherency",
        "category": "Java Memory Model & Threads",
        "badge": "JMM Architecture",
        "oneLiner": "The formal specification bridging Java multi-threading semantics with CPU store buffers, caches, and memory barriers.",
        "whatIsIt": "The Java Memory Model (JMM, JSR-133) is the formal architectural specification defining how the JVM and hardware multi-core memory subsystems interact. It establishes the rules under which a write to a variable by one thread is guaranteed to be visible to a read by another thread, shielding Java developers from CPU-specific cache architectures and out-of-order execution pipelines.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: JMM Working Memory vs Main Memory & MESI</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Thread 1 Working Mem</span>
                <span class="node-desc">L1/L2 Cache + Store Buffer</span>
              </div>
              <span class="flow-arrow-separator">◄──Flush/Invalidate──►</span>
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">Main Memory (RAM)</span>
                <span class="node-desc">Shared Heap Object State</span>
              </div>
              <span class="flow-arrow-separator">◄──Flush/Invalidate──►</span>
              <div class="flow-step-node node-orange" style="min-width: 150px;">
                <span class="node-label">Thread 2 Working Mem</span>
                <span class="node-desc">L1/L2 Cache + Store Buffer</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Hardware Reality:</strong> JMM 'Working Memory' maps directly to CPU L1/L2 caches and write-combining store buffers!
            </div>
          </div>
        """,
        "internalWorking": "Modern multi-core CPUs use hierarchical caches (L1, L2, L3) and out-of-order execution pipelines to maximize instruction throughput. To prevent CPU stall cycles, writes go into a private hardware Store Buffer rather than directly to shared L3 or RAM. Without memory barriers, Thread 2's CPU core continues reading stale values from its private L1 cache, unaware that Thread 1 has updated the variable. JMM abstracts this by defining 'Main Memory' (shared variables) and 'Working Memory' (thread-local CPU cache registers). JMM dictates exactly when the JIT must insert native memory barriers (LoadLoad, LoadStore, StoreStore, StoreLoad) into the instruction stream to enforce MESI cache coherency protocols.",
        "complexPart": "Instruction Reordering across 3 Levels: Compilers, JIT, and CPUs aggressively reorder instructions for pipeline efficiency: (1) Compiler Reordering (javac/JIT rearranges operations with no data dependency). (2) Processor Instruction-Level Parallelism (ILP, out-of-order execution units). (3) Memory System Reordering (delayed store buffer drain). Under JMM, single-threaded execution appears sequential (as-if-serial semantics), but without barriers, multi-threaded execution can see effects occurring in impossible backwards orders!",
        "keyPoints": [
            "Hardware Mapping: Working memory is an abstraction representing CPU registers, store buffers, and L1/L2 hardware caches.",
            "As-if-serial Semantics: The compiler and hardware are permitted to reorder operations arbitrarily as long as single-threaded outcome is identical.",
            "JSR-133 Revision: Standardized in Java 5 to fix broken double-checked locking and formalize final field freeze semantics.",
            "4 Memory Barrier Types: LoadLoad, StoreStore, LoadStore, and StoreLoad (the most expensive full hardware fence).",
            "Coherency Protocol (MESI): Modified, Exclusive, Shared, Invalid state transitions across CPU cache lines."
        ],
        "codeSnippet": "// Demonstrating Instruction Reordering Potential\npublic class ReorderingObservation {\n    int a = 0, b = 0;\n    int x = 0, y = 0;\n\n    // Thread 1 runs:\n    public void writer() {\n        a = 1; // Can be reordered with b = 1!\n        b = 1;\n    }\n\n    // Thread 2 runs:\n    public void reader() {\n        if (b == 1) {\n            // Without volatile/happens-before, 'a' could still be observed as 0!\n            assert a == 1; // CAN FAIL DUE TO MEMORY REORDERING!\n        }\n    }\n}",
        "pitfall": "Relying on Thread.sleep(0) or System.out.println() to 'force' memory synchronization. While print statements contain synchronized blocks that happen to trigger barriers as a side-effect, this is non-deterministic and fails under production C2 JIT optimization.",
        "interviewTip": "Emphasize that the Java Memory Model is not about software locks, but about defining the contract between Java code and the CPU's memory hierarchy (store buffers, cache lines, and out-of-order execution)."
    },
    {
        "id": "java-int-volatile",
        "title": "volatile Keyword: Memory Visibility & Barrier Insertion",
        "category": "Java Memory Model & Threads",
        "badge": "Memory Barrier",
        "oneLiner": "Guarantees direct main-memory visibility and prevents instruction reordering via CPU memory barriers; does NOT guarantee atomicity.",
        "whatIsIt": "The volatile keyword is Java's lightest-weight synchronization primitive. When a field is declared volatile, the JVM guarantees two critical invariants: (1) Visibility: every read sees the most recent write across all threads, bypassing local CPU cache staleness; and (2) Ordering: the compiler and CPU are prohibited from reordering operations across volatile access points using memory barriers.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: JIT Memory Barrier Insertion for volatile</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">StoreStore Barrier</span>
                <span class="node-desc">Prior normal writes committed</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange" style="min-width: 160px;">
                <span class="node-label">volatile Write (flag = true)</span>
                <span class="node-desc">Pushed to Store Buffer</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">StoreLoad Barrier</span>
                <span class="node-desc">Full fence (e.g. lock addl)</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green" style="min-width: 140px;">
                <span class="node-label">volatile Read</span>
                <span class="node-desc">Invalidates cache; reads RAM</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #fb923c; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Crucial Distinction:</strong> volatile guarantees VISIBILITY, but 'count++' is NOT atomic (it is read-modify-write)!
            </div>
          </div>
        """,
        "internalWorking": "When a field is declared volatile, HotSpot injects native CPU hardware memory fences: Before a volatile write: StoreStore barrier (prevents prior ordinary writes from floating below the volatile write). After a volatile write: StoreLoad barrier (full hardware fence, emitted as 'lock addl $0, (%rsp)' on x86, which flushes CPU store buffers to cache and sends invalidation broadcasts to all cores). Before a volatile read: LoadLoad and LoadStore barriers (prevents subsequent reads/writes from being speculatively executed before the volatile read). On x86 TSO (Total Store Order) architectures, reads are inherently ordered, so volatile reads compile to plain MOV instructions with zero CPU barrier overhead, while volatile writes bear the cost of the lock prefix fence.",
        "complexPart": "Why volatile fails on compound operations ('volatile int count; count++'): 'count++' compiles into 3 separate bytecodes: getfield (read value onto operand stack), iadd (increment value by 1), putfield (write value back). While both getfield and putfield individually adhere to volatile visibility, a context switch between getfield and putfield allows competing threads to overwrite increments, losing updates!",
        "keyPoints": [
            "Visibility Guarantee: A write to a volatile variable is immediately flushed to cache and invalidates other cores' caches.",
            "Ordering Guarantee: Prevents instruction reordering across volatile boundaries using LoadLoad, LoadStore, StoreStore, and StoreLoad fences.",
            "No Atomicity: Non-atomic for compound operations (count++, check-then-act, compare-and-swap).",
            "x86 Asymmetry: Volatile reads are zero-cost on x86 (free plain reads); volatile writes require expensive 'lock addl' fences.",
            "64-bit Primitives: In 32-bit JVMs, writes to non-volatile long and double could tear into two 32-bit writes; volatile guarantees atomic 64-bit writes."
        ],
        "codeSnippet": "// Correct Usage of Volatile: State Flag (Status Signaling)\npublic class WorkerThread implements Runnable {\n    // Volatile guarantees immediate visibility across threads\n    private volatile boolean running = true;\n\n    public void stopWorker() {\n        this.running = false; // Immediately visible to running loop\n    }\n\n    @Override\n    public void run() {\n        while (running) {\n            // Perform background work\n        }\n        System.out.println(\"Worker cleanly terminated.\");\n    }\n}",
        "pitfall": "Using volatile for a counter ('private volatile int count; public void increment() { count++; }'). In high concurrency, count++ drops updates because read-modify-write is not atomic. Use AtomicInteger instead.",
        "interviewTip": "Highlight the x86 cost asymmetry: on modern Intel/AMD processors, reading a volatile variable has ZERO overhead compared to a plain variable, because x86 hardware already guarantees LoadLoad/LoadStore ordering; the entire overhead of volatile is paid during WRITES via StoreLoad barrier."
    },
    {
        "id": "java-int-synchronized",
        "title": "synchronized Keyword: Mark Word, Biased Locking, Thin Lock & Heavyweight Monitors",
        "category": "Java Memory Model & Threads",
        "badge": "Monitor Locks",
        "oneLiner": "The 4-stage lock escalation pipeline in HotSpot: Unlocked -> Biased -> Lightweight (CAS) -> Heavyweight (OS Mutex).",
        "whatIsIt": "The synchronized keyword provides mutual exclusion, visibility, and atomicity in Java. Rather than jumping straight to expensive operating system kernel mutexes, HotSpot employs an adaptive Lock Escalation mechanism encoded in the 64-bit Object Header Mark Word, escalating through Biased Locking, Lightweight Thin Locking (CAS), and Heavyweight ObjectMonitor.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: HotSpot 4-Stage Lock Escalation Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 130px;">
                <span class="node-label">01: Unlocked</span>
                <span class="node-desc">HashCode, Age bits</span>
              </div>
              <span class="flow-arrow-separator">──Thread Locks──►</span>
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">01: Biased Lock</span>
                <span class="node-desc">ThreadID in Mark Word</span>
              </div>
              <span class="flow-arrow-separator">──Contention──►</span>
              <div class="flow-step-node node-orange" style="min-width: 150px;">
                <span class="node-label">00: Lightweight</span>
                <span class="node-desc">CAS BasicObjectLock</span>
              </div>
              <span class="flow-arrow-separator">──Spin Fails──►</span>
              <div class="flow-step-node node-red" style="min-width: 150px;">
                <span class="node-label">10: Heavyweight</span>
                <span class="node-desc">OS Mutex / pthread_mutex</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>One-Way Escalation:</strong> In HotSpot, lock escalation is strictly one-way! Once escalated to Heavyweight, it never de-escalates.
            </div>
          </div>
        """,
        "internalWorking": "Every Java object has a 12-byte header (8-byte Mark Word + 4-byte Klass Word). The lowest 2-3 bits of Mark Word encode lock state: (1) Biased Locking (01): Optimized for single-thread locks. Thread ID is CAS-stamped into Mark Word. Re-entries require zero CAS, just comparing Thread ID. (Deprecated in Java 15). (2) Lightweight Locking (00): When a second thread competes without heavy contention, the lock disbiases. The thread allocates a Displaced Mark Word in its stack frame and attempts CAS swapping it into the object's Mark Word. (3) Adaptive Spinning: The competing thread spins in a tight CPU loop hoping the holder releases soon. (4) Heavyweight Locking (10): If spinning fails, an ObjectMonitor C++ structure is allocated in native memory. Competing threads are parked using OS kernel mutexes (pthread_mutex_lock / futex), entering _EntryList wait queues.",
        "complexPart": "The Cost of Biased Locking Revocation: While Biased Locking made single-threaded re-entry free, revoking a bias when a second thread arrives requires bringing the entire JVM to a Stop-The-World (STW) Safepoint to inspect the thread's stack frames! In modern cloud microservices with reactive and pooled threading models, the STW cost of bias revocations far exceeded the benefits, leading to Biased Locking being disabled by default in Java 15+ and removed in Java 21.",
        "keyPoints": [
            "Mark Word Bit Flags: 01 (Unlocked / Biased), 00 (Lightweight Lock), 10 (Heavyweight ObjectMonitor), 11 (Marked for GC).",
            "Bytecode Dual Nature: Synchronized blocks emit 'monitorenter' and 'monitorexit'; synchronized methods use ACC_SYNCHRONIZED method flag.",
            "Exception Safety: The compiler emits an implicit exception handler table guaranteeing 'monitorexit' executes even if exceptions are thrown.",
            "Adaptive Spinning: The duration of CPU spinning before parking is dynamically adjusted based on past lock acquisition success.",
            "ObjectMonitor Queues: Maintains _cxq (Contention Queue), _EntryList (Waiting Threads), and _WaitSet (Threads calling wait())."
        ],
        "codeSnippet": "// Bytecode Representation of synchronized block:\npublic void lockBlock() {\n    synchronized (this) {\n        // Critical Section\n    }\n}\n// Compiles to:\n// 1: monitorenter\n// 2: ... (critical section bytecodes)\n// 5: monitorexit\n// 6: goto 14\n// 9: any Exception -> monitorexit (guaranteed release!)",
        "pitfall": "Synchronizing on boxed primitive wrappers or interned Strings ('synchronized (\"LOCK\")' or 'synchronized (Integer.valueOf(1))'). Because String literals and low integers are pooled globally, unrelated libraries synchronizing on the same literal cause global application deadlock.",
        "interviewTip": "Know the exact transitions: Unlocked -> Biased -> Lightweight (CAS into Stack Frame) -> Heavyweight (OS Mutex). Explain that lock escalation is unidirectional—once inflated to Heavyweight, it does not downgrade."
    },
    {
        "id": "java-int-happens-before",
        "title": "Happens-Before Rules: Formalizing Concurrency Ordering",
        "category": "Java Memory Model & Threads",
        "badge": "JMM Ordering",
        "oneLiner": "The 6 core ordering guarantees ensuring that write operations by Action A are visible to read operations by Action B.",
        "whatIsIt": "Happens-Before is the foundational relationship defined by the Java Memory Model (JMM, JSR-133) to reason about memory visibility. If Action A 'happens-before' Action B (denoted A ≺ B), the JVM guarantees that all memory writes performed by Action A are completely visible to and not reordered past Action B. If no happens-before relation exists, the JVM is free to reorder them arbitrarily.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Happens-Before Transitive Visibility Chain</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Thread 1: Write data</span>
                <span class="node-desc">data = 42 (Program Order)</span>
              </div>
              <span class="flow-arrow-separator">──H-B 1──►</span>
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">Thread 1: Volatile Write</span>
                <span class="node-desc">ready = true</span>
              </div>
              <span class="flow-arrow-separator">──H-B 2──►</span>
              <div class="flow-step-node node-orange" style="min-width: 160px;">
                <span class="node-label">Thread 2: Volatile Read</span>
                <span class="node-desc">while (!ready)</span>
              </div>
              <span class="flow-arrow-separator">──H-B 3──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">Thread 2: Read data</span>
                <span class="node-desc">Guaranteed to see data == 42!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Transitivity Rule:</strong> (A ≺ B) and (B ≺ C) implies (A ≺ C) — Piggybacking on volatile establishes full visibility!
            </div>
          </div>
        """,
        "internalWorking": "The JMM specification formally defines 6 primary Happens-Before rules: (1) Program Order Rule: Within a single thread, each action happens-before any subsequent action in program order. (2) Monitor Lock Rule: An unlock on a monitor lock happens-before every subsequent lock on that SAME monitor. (3) Volatile Variable Rule: A write to a volatile field happens-before every subsequent read of that SAME field. (4) Thread Start Rule: A call to Thread.start() on a thread happens-before any action in the started thread. (5) Thread Termination Rule: Any action in a thread happens-before any other thread successfully detects that it has terminated (via Thread.join() or Thread.isAlive() == false). (6) Transitivity: If A happens-before B, and B happens-before C, then A happens-before C.",
        "complexPart": "Piggybacking on Happens-Before: Developers can achieve full visibility for a cluster of non-volatile variables without paying synchronization overhead by 'piggybacking' on a single volatile write. Because Program Order dictates ordinary writes precede the volatile write, and the Volatile Rule dictates the volatile write happens-before the volatile read, Transitivity guarantees that ANY ordinary write made before the volatile write is fully visible to the thread reading the volatile flag!",
        "keyPoints": [
            "Program Order: Sequential semantics within one thread are preserved.",
            "Monitor Unlock -> Lock: Exiting synchronized(lock) flushes changes to main memory; entering synchronized(lock) refreshes from main memory.",
            "Volatile Write -> Read: Establishes a synchronization barrier across threads.",
            "Thread.start() Barrier: State established before calling worker.start() is guaranteed visible to worker.run().",
            "Transitivity Power: Forms the theoretical backbone of concurrent libraries like java.util.concurrent without requiring locks."
        ],
        "codeSnippet": "// Piggybacking on Happens-Before Example\npublic class SafePublisher {\n    private int nonVolatileData = 0;\n    private volatile boolean ready = false;\n\n    // Thread 1:\n    public void publish() {\n        nonVolatileData = 42; // (1) Program Order: (1) ≺ (2)\n        ready = true;          // (2) Volatile Write\n    }\n\n    // Thread 2:\n    public void consume() {\n        if (ready) {           // (3) Volatile Read: (2) ≺ (3)\n            // By Transitivity: (1) ≺ (2) ≺ (3) ≺ (4)\n            // nonVolatileData is 100% GUARANTEED to be 42!\n            System.out.println(nonVolatileData); // (4)\n        }\n    }\n}",
        "pitfall": "Assuming happens-before implies temporal execution order in real time. Happens-before is NOT about when actions execute physically on CPU cores; it is strictly an agreement about MEMORY VISIBILITY of results.",
        "interviewTip": "Walk through the 6 rules methodically: Program Order, Monitor Lock, Volatile Variable, Thread Start, Thread Termination, and Transitivity. Give the 'piggybacking' example to prove senior-level comprehension."
    },
    {
        "id": "java-int-atomicity-visibility-ordering",
        "title": "Atomicity, Visibility, Ordering (AVO): The Concurrency Triad",
        "category": "Java Memory Model & Threads",
        "badge": "Concurrency Triad",
        "oneLiner": "The 3 distinct failure modes in concurrent systems: Atomicity (partial states), Visibility (stale caches), and Ordering (reordering).",
        "whatIsIt": "The Concurrency Triad (Atomicity, Visibility, Ordering) represents the three orthogonal challenges that must be controlled in any concurrent program. A thread-safe component must manage all three: Atomicity ensures operations complete indivisibly, Visibility ensures memory changes are broadcast across CPU caches, and Ordering prevents compiler and CPU hardware instruction reshuffling.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Concurrency Triad Matrix</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 170px;">
                <span class="node-label">1. Atomicity</span>
                <span class="node-desc">Indivisible; All-or-Nothing</span>
                <span style="font-size: 0.68rem; color: #38bdf8;">Lock / CAS / Atomic*</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange" style="min-width: 170px;">
                <span class="node-label">2. Visibility</span>
                <span class="node-desc">CPU Cache Invalidation</span>
                <span style="font-size: 0.68rem; color: #fb923c;">volatile / synchronized</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple" style="min-width: 170px;">
                <span class="node-label">3. Ordering</span>
                <span class="node-desc">Prevents CPU Reordering</span>
                <span style="font-size: 0.68rem; color: #a855f7;">Memory Barriers / H-B</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Primitive Capability:</strong> synchronized solves ALL THREE; volatile solves Visibility & Ordering, but NOT Atomicity!
            </div>
          </div>
        """,
        "internalWorking": "(1) Atomicity: An operation is atomic if it executes as a single indivisible step without intermediate states visible to other threads. Primitives: 32-bit read/writes are atomic by JVM spec; 64-bit long/double require volatile for atomic writes on 32-bit OS. Compound operations (check-then-act, increment) require CAS (Compare-And-Swap) hardware instructions (CMPXCHG) or lock acquisition. (2) Visibility: Caused by multi-level CPU cache hierarchies (L1/L2). Solved by cache invalidation and store buffer flushing via volatile or synchronized. (3) Ordering: Compilers and CPUs reorder instructions for pipelining. Solved by injecting hardware memory barriers (LoadLoad, StoreStore, LoadStore, StoreLoad).",
        "complexPart": "The Double-Checked Locking (DCL) Dilemma: In 'if (instance == null) { synchronized { if (instance == null) instance = new Helper(); } }', instantiating Helper takes 3 steps: (1) allocate memory, (2) run constructor, (3) assign pointer to instance. Due to instruction reordering, the CPU can execute (1) -> (3) -> (2). Thread B arrives, checks 'instance != null', and accesses the object BEFORE its constructor finishes, reading partially initialized corrupt state! Declaring instance 'volatile' prevents (3) from reordering before (2).",
        "keyPoints": [
            "The Triad: Atomicity (indivisibility), Visibility (freshness), Ordering (sequence).",
            "synchronized: Covers Atomicity, Visibility, and Ordering via monitor acquisition and lock fences.",
            "volatile: Covers Visibility and Ordering, but lacks Atomicity for multi-step mutations.",
            "AtomicInteger / CAS: Provides lock-free Atomicity, Visibility, and Ordering via CPU hardware bus locking.",
            "Final Field Freeze: JMM guarantees final fields are frozen upon constructor completion, offering safe publication without volatile."
        ],
        "codeSnippet": "// Correct Double-Checked Locking with volatile\npublic class ThreadSafeSingleton {\n    // 'volatile' is MANDATORY to prevent instruction reordering of constructor and assignment\n    private static volatile ThreadSafeSingleton INSTANCE;\n\n    private ThreadSafeSingleton() {\n        // Heavy initialization\n    }\n\n    public static ThreadSafeSingleton getInstance() {\n        if (INSTANCE == null) { // 1st Check (No lock overhead)\n            synchronized (ThreadSafeSingleton.class) {\n                if (INSTANCE == null) { // 2nd Check (Under lock)\n                    INSTANCE = new ThreadSafeSingleton();\n                }\n            }\n        }\n        return INSTANCE;\n    }\n}",
        "pitfall": "Omitting volatile from Double-Checked Locking. Without volatile, another thread can read an instance whose memory is allocated but whose constructor fields have not finished executing, leading to subtle NullPointerExceptions or data corruption.",
        "interviewTip": "Whenever asked why volatile is needed in Double-Checked Locking, explain the 3-step object creation lifecycle (allocate, construct, assign) and show how the compiler can reorder assignment before construction without the volatile StoreStore barrier."
    },
    {
        "id": "java-int-thread-lifecycle",
        "title": "Thread Lifecycle, States & OS Mapping Mechanics",
        "category": "Java Memory Model & Threads",
        "badge": "Thread States",
        "oneLiner": "The 6 Java thread states (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED) mapped to OS kernel threads.",
        "whatIsIt": "The Java Thread Lifecycle defines the operational state transitions of a java.lang.Thread instance as tracked by the JVM. While operating systems use Ready/Running/Blocked, Java 5+ explicitly formalizes exactly 6 states in java.lang.Thread.State: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, and TERMINATED.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The 6 Java Thread State Transitions</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 110px;">
                <span class="node-label">NEW</span>
                <span class="node-desc">new Thread()</span>
              </div>
              <span class="flow-arrow-separator">──start()──►</span>
              <div class="flow-step-node node-green" style="min-width: 130px;">
                <span class="node-label">RUNNABLE</span>
                <span class="node-desc">Ready / Running</span>
              </div>
              <span class="flow-arrow-separator">──Wait Lock──►</span>
              <div class="flow-step-node node-red" style="min-width: 120px;">
                <span class="node-label">BLOCKED</span>
                <span class="node-desc">synchronized wait</span>
              </div>
            </div>
            <div class="flow-chain" style="margin-top: 10px;">
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">WAITING</span>
                <span class="node-desc">wait() / join() / park()</span>
              </div>
              <span class="flow-arrow-separator">◄──Timeout──►</span>
              <div class="flow-step-node node-orange" style="min-width: 150px;">
                <span class="node-label">TIMED_WAITING</span>
                <span class="node-desc">sleep(ms) / wait(ms)</span>
              </div>
              <span class="flow-arrow-separator">──run() exits──►</span>
              <div class="flow-step-node node-blue" style="min-width: 120px;">
                <span class="node-label">TERMINATED</span>
                <span class="node-desc">Dead / Cleaned up</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Crucial Distinction:</strong> BLOCKED applies ONLY to entering a synchronized block/method; LockSupport.park() is WAITING!
            </div>
          </div>
        """,
        "internalWorking": "(1) NEW: Thread object instantiated, not yet started. (2) RUNNABLE: Thread.start() invoked. Under HotSpot 1:1 model, an OS native thread (pthread on Linux) is created via clone() syscall. RUNNABLE covers both OS Ready (waiting for CPU time slice) and OS Running (executing on CPU). (3) BLOCKED: Specifically waiting to acquire an intrinsic monitor lock to enter/re-enter a synchronized block or method. (4) WAITING: Waiting indefinitely for another thread via Object.wait(), Thread.join(), or LockSupport.park(). (5) TIMED_WAITING: Waiting with timeout via Thread.sleep(ms), Object.wait(ms), or LockSupport.parkNanos(). (6) TERMINATED: run() method completed normally or threw an unhandled exception.",
        "complexPart": "BLOCKED vs WAITING in Thread Dumps: In a jstack thread dump, developers frequently confuse BLOCKED and WAITING. If a thread is stuck waiting for a ReentrantLock (AQS), its state is WAITING (or TIMED_WAITING), NOT BLOCKED! The BLOCKED state is reserved EXCLUSIVELY for threads competing for an intrinsic 'synchronized' monitor lock. ReentrantLock parks threads via LockSupport.park(), which transitions threads to WAITING.",
        "keyPoints": [
            "Exactly 6 States: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED (no separate 'Running' or 'Ready').",
            "1:1 OS Thread Model: Standard platform threads in HotSpot map 1:1 directly to native OS kernel threads.",
            "BLOCKED Specificity: Only applies to synchronized monitor locks, never to java.util.concurrent locks.",
            "LockSupport.park(): Transitions thread directly to WAITING without requiring an object monitor.",
            "Interrupt Behavior: Calling interrupt() on a WAITING/TIMED_WAITING thread clears interrupt flag and throws InterruptedException."
        ],
        "codeSnippet": "// Inspecting Thread State Programmatically\nThread worker = new Thread(() -> {\n    try {\n        Thread.sleep(5000); // Transitions to TIMED_WAITING\n    } catch (InterruptedException e) {\n        Thread.currentThread().interrupt();\n    }\n});\n\nSystem.out.println(worker.getState()); // NEW\nworker.start();\nSystem.out.println(worker.getState()); // RUNNABLE\nThread.sleep(100); \nSystem.out.println(worker.getState()); // TIMED_WAITING",
        "pitfall": "Assuming ReentrantLock contention produces BLOCKED state in thread dumps. A thread waiting on ReentrantLock is in WAITING state (parked on AQS condition queue). Searching logs only for 'BLOCKED' will miss AQS lock bottlenecks entirely.",
        "interviewTip": "Differentiate Java's RUNNABLE state from the OS Ready/Running states: Java combines them because the JVM delegates thread scheduling entirely to the underlying OS kernel scheduler."
    },
    {
        "id": "java-int-thread-vs-process",
        "title": "Thread vs. Process & Context Switching Overhead",
        "category": "Java Memory Model & Threads",
        "badge": "OS Concurrency",
        "oneLiner": "Processes have isolated address spaces; Threads share process heap and memory, trading safety for low context-switch overhead.",
        "whatIsIt": "Processes and Threads are the two fundamental units of concurrent execution in modern operating systems. A Process is an independent executing program with its own private virtual address space, file descriptor tables, and security credentials. A Thread is the smallest schedulable unit of CPU execution living INSIDE a process, sharing the parent process's heap, Metaspace, and open sockets while maintaining its own private stack and register set.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Process Boundary vs Shared Thread Memory</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 170px;">
                <span class="node-label">OS Process A (JVM Instance)</span>
                <span class="node-desc">Page Tables, File Handles, Heap</span>
              </div>
              <span class="flow-arrow-separator">Contains ──►</span>
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">Thread 1</span>
                <span class="node-desc">Stack 1 + Registers</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">Thread 2</span>
                <span class="node-desc">Stack 2 + Registers</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Context Switch Cost:</strong> Process switch flushes TLB (Translation Lookaside Buffer); Thread switch keeps virtual memory intact!
            </div>
          </div>
        """,
        "internalWorking": "Context Switching Mechanics: (1) Thread Context Switch: When OS preempts Thread 1 for Thread 2 within the same JVM process, it saves CPU registers (program counter, stack pointer, general-purpose registers) to Thread 1's kernel stack and loads Thread 2's registers. Virtual memory mappings (CR3 register on x86) remain unchanged—the CPU L1/L2 caches and Translation Lookaside Buffer (TLB) stay valid, making it relatively fast (~1-2 microseconds). (2) Process Context Switch: Requires changing memory page tables (switching CR3). This completely invalidates the CPU TLB cache, causing catastrophic memory cache misses for hundreds of subsequent instructions until the cache warms up (~10-20x slower than a thread switch).",
        "complexPart": "Inter-Process Communication (IPC) vs Shared Memory Hazards: Processes communicate via IPC (sockets, pipes, shared memory segments, signals) with heavy serialization overhead but complete fault isolation (if Process A segfaults, Process B is unharmed). Threads communicate via shared heap objects at near-zero serialization latency, but lack fault isolation: an uncaught OutOfMemoryError or memory corruption in a native JNI thread immediately brings down the ENTIRE JVM process for all threads!",
        "keyPoints": [
            "Address Space: Processes have completely isolated virtual memory; threads share the heap and memory space of their parent process.",
            "Resource Ownership: Processes own OS resources (file handles, network sockets, memory pages); threads borrow them.",
            "TLB Invalidation: Process switches invalidate the CPU Translation Lookaside Buffer (TLB); thread switches preserve page tables.",
            "Creation Overhead: Spawning a process requires fork()/execve() duplicating page tables; spawning a thread is a lightweight clone() call.",
            "Fault Domain: A crash in a thread (e.g. SIGSEGV in JNI) kills the entire host JVM process."
        ],
        "codeSnippet": "// Demonstrating Shared State Communication Between Threads\npublic class SharedMemoryThreads {\n    // Shared heap state accessible by both threads without IPC\n    private static int sharedCounter = 0;\n\n    public static void main(String[] args) throws InterruptedException {\n        Thread t1 = new Thread(() -> sharedCounter++);\n        Thread t2 = new Thread(() -> sharedCounter++);\n        \n        t1.start();\n        t2.start();\n        t1.join();\n        t2.join();\n        \n        System.out.println(\"Counter: \" + sharedCounter); // 2\n    }\n}",
        "pitfall": "Attempting to achieve multi-tenancy inside a single JVM process by isolating customer code with custom ClassLoaders. Because all threads share native process memory, one customer allocating excessive memory or executing a native JNI crash brings down all tenants in the process.",
        "interviewTip": "Highlight the TLB (Translation Lookaside Buffer) when discussing context switching: explain that process switching changes the page table root register, invalidating the TLB and triggering hardware cache misses, whereas thread switching leaves page tables intact."
    },
    {
        "id": "java-int-thread-stack-size",
        "title": "Thread Stack Size (-Xss): Memory Calculation & StackOverflowError",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Thread Memory",
        "oneLiner": "How -Xss sets per-thread stack limits (default 1MB) and dictates maximum concurrent platform thread capacity.",
        "whatIsIt": "The Thread Stack Size (-Xss or -XX:ThreadStackSize) JVM parameter dictates the fixed virtual memory allocated to each platform thread's execution call stack. On 64-bit Linux/Windows/macOS, HotSpot defaults to 1024KB (1MB) per thread. This memory is allocated directly from native OS RAM, entirely outside the Java Heap.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Native RAM Division Between Heap and Thread Stacks</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 170px;">
                <span class="node-label">Total Process RAM (4GB)</span>
                <span class="node-desc">Host Physical / Container RAM</span>
              </div>
              <span class="flow-arrow-separator">──Allocated──►</span>
              <div class="flow-step-node node-green" style="min-width: 160px;">
                <span class="node-label">Java Heap (-Xmx 2GB)</span>
                <span class="node-desc">Managed by Garbage Collector</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-blue" style="min-width: 170px;">
                <span class="node-label">2,000 Threads * 1MB (-Xss)</span>
                <span class="node-desc">2GB Native Stack Memory!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>OOM Formula:</strong> Max Threads ≈ (Host RAM - Heap - Metaspace - Native Code) / -Xss
            </div>
          </div>
        """,
        "internalWorking": "When new Thread().start() executes: (1) The JVM issues a native pthread_create() syscall requesting -Xss bytes from the kernel. (2) The OS reserves virtual memory address space for the stack. (3) Guard Pages (Red Zone & Yellow Zone) are placed at the end of the stack. If deep recursion causes the stack pointer to collide with the Yellow Zone, the OS raises a page fault (SIGSEGV), and HotSpot traps it to throw java.lang.StackOverflowError. If stack allocations exhaust host OS address space or RAM, the JVM throws java.lang.OutOfMemoryError: unable to create native thread.",
        "complexPart": "Container Memory Limits & 'unable to create new native thread': Inside a Kubernetes Docker container with a 4GB memory limit, if you set -Xmx3g and create 1,500 platform threads with default -Xss1m: 3GB Heap + (1,500 * 1MB = 1.5GB Stacks) + Metaspace (256MB) = 4.75GB! The Linux cgroup OOM Killer instantly SIGKILLs the entire container without generating a heap dump or stack trace!",
        "keyPoints": [
            "Default Size: 1024KB (1MB) on 64-bit systems; 320KB on 32-bit systems.",
            "Off-Heap Allocation: Stacks are allocated from native OS memory, completely independent of -Xmx heap limits.",
            "StackOverflowError: Caused by runaway recursion or deeply nested method call chains exhausting the -Xss frame limit.",
            "OOM Unable to Create Thread: Caused by exhausting host RAM or OS kernel pid_max / max_map_count limits.",
            "Virtual Threads Advantage: Virtual threads eliminate -Xss constraints because their stack frames are stored dynamically as chunks on the Java heap."
        ],
        "codeSnippet": "// Demonstrating StackOverflowError via Unbounded Recursion\npublic class StackOverflowDemo {\n    private static int depth = 0;\n\n    public static void recursiveCall() {\n        depth++;\n        recursiveCall(); // Never terminates, pushes frames until -Xss is exhausted\n    }\n\n    public static void main(String[] args) {\n        try {\n            recursiveCall();\n        } catch (StackOverflowError e) {\n            System.out.println(\"Hit StackOverflowError at frame depth: \" + depth);\n            // Typically fails between 7,000 and 15,000 frames for -Xss1m\n        }\n    }\n}",
        "pitfall": "Increasing -Xmx to fix 'OutOfMemoryError: unable to create native thread'. Increasing the heap actually leaves LESS native memory for thread stacks, accelerating the native thread creation failure! You should REDUCE heap or -Xss.",
        "interviewTip": "Clearly contrast the two failures: StackOverflowError occurs when a SINGLE thread exhausts its own -Xss stack depth; OutOfMemoryError: unable to create native thread occurs when the JVM cannot allocate another native thread from host RAM."
    },
    {
        "id": "java-int-concurrenthashmap",
        "title": "ConcurrentHashMap Internals: Lock Striping (Java 7) to CAS + Synchronized Bins (Java 8+)",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Concurrent Data Structure",
        "oneLiner": "Evolution from 16 Segment ReentrantLocks to CAS first-node + synchronized per-bucket fine-grained locking.",
        "whatIsIt": "ConcurrentHashMap is Java's premier thread-safe, high-concurrency hash table implementation. In Java 7, it achieved concurrent throughput via Segmented Lock Striping (16 Segments). In Java 8+, it was completely re-architected to an array of Node buckets, using lock-free CAS for first-node insertion and synchronizing ONLY on the bucket head node during collisions, achieving near-linear multi-core scalability.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Java 8+ ConcurrentHashMap Bucket Locking & CAS</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">CAS First Node</span>
                <span class="node-desc">Empty bucket: CAS lock-free!</span>
              </div>
              <span class="flow-arrow-separator">──Collision──►</span>
              <div class="flow-step-node node-orange" style="min-width: 170px;">
                <span class="node-label">synchronized(HeadNode)</span>
                <span class="node-desc">Locks ONLY this bucket (O(1))</span>
              </div>
              <span class="flow-arrow-separator">──Count &gt;= 8──►</span>
              <div class="flow-step-node node-green" style="min-width: 160px;">
                <span class="node-label">TreeBin (Red-Black)</span>
                <span class="node-desc">O(log N) worst-case lookup</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Lock-Free Reads:</strong> get() operations use volatile Node.val and volatile Node.next — completely lock-free with zero synchronization!
            </div>
          </div>
        """,
        "internalWorking": "Java 8+ Architecture: (1) Storage: 'transient volatile Node<K,V>[] table'. (2) get(key): Lock-Free! Computes hash spread 'spread(key.hashCode())'. Reads table[i] via volatile 'tabAt()'. Because Node.val and Node.next are volatile, reads require zero locking. (3) putVal(key, value): If table is null, initializes via CAS on sizeCtl. If bucket table[i] is null, inserts a new Node via CAS ('casTabAt()') with zero locking. If bucket is non-empty, synchronizes ONLY on the bucket's head node: 'synchronized (f)'. (4) Treeification: If bucket collision chain reaches TREEIFY_THRESHOLD (8) and table.length >= 64, converts to TreeBin holding Red-Black Tree. (5) Concurrent Resizing: When size exceeds sizeCtl, threads helping resize transfer sub-ranges of buckets using ForwardingNode (hash = -1).",
        "complexPart": "Concurrent Multi-threaded Resizing with ForwardingNode: In HashMap, resizing freezes or corrupts the table. In ConcurrentHashMap, resizing is cooperative! A resizing thread creates 'nextTable' (2x size). When finished moving a bucket, it replaces the head with a 'ForwardingNode'. If a second thread arrives to write to a moved bucket, it detects ForwardingNode and immediately assists with transferring other bucket ranges ('helpTransfer()') before completing its own write!",
        "keyPoints": [
            "Java 7 vs 8: Java 7 used Segment[] (16 locks max concurrency); Java 8 uses synchronized per bucket head (thousands of concurrent writers).",
            "Zero-Lock Reads: Volatile value and next references guarantee lock-free get() operations under all conditions.",
            "Treeification Thresholds: Converts to Red-Black Tree when bucket chain >= 8 and capacity >= 64.",
            "CounterCell Size Tracking: Uses LongAdder-style CounterCell array to track size without atomic contention on a single variable.",
            "No Nulls Allowed: Rejects null keys and null values to prevent ambiguity in concurrent get() vs containsKey()."
        ],
        "codeSnippet": "// Under the Hood: CAS First-Node Insertion in putVal\nfinal V putVal(K key, V value, boolean onlyIfAbsent) {\n    if (key == null || value == null) throw new NullPointerException();\n    int hash = spread(key.hashCode());\n    int binCount = 0;\n    for (Node<K,V>[] tab = table;;) {\n        Node<K,V> f; int n, i, fh;\n        if (tab == null || (n = tab.length) == 0)\n            tab = initTable();\n        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {\n            // Bucket empty: Insert via lock-free CAS!\n            if (casTabAt(tab, i, null, new Node<K,V>(hash, key, value, null)))\n                break; // Successfully added without ANY lock!\n        }\n        // ... else synchronize on head node 'f'\n    }\n}",
        "pitfall": "Assuming compound operations on ConcurrentHashMap are automatically atomic ('if (!map.containsKey(k)) map.put(k, v);'). The individual calls are thread-safe, but the check-then-act sequence is not! Use 'map.putIfAbsent(k, v)' or 'map.computeIfAbsent(k, mappingFunction)'.",
        "interviewTip": "Explain why null keys and values are forbidden: in a concurrent map, if get(key) returned null, you could not tell whether the key is mapped to null or the key is absent, because a competing thread could have removed or added the key between get() and containsKey()."
    },
    {
        "id": "java-int-completablefuture",
        "title": "CompletableFuture Internals: Async Pipelines & ForkJoinPool",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Async Reactive",
        "oneLiner": "The non-blocking asynchronous pipeline engine powered by Completion Treiber Stacks and ForkJoinPool.commonPool().",
        "whatIsIt": "CompletableFuture (Java 8+) is the standard asynchronous reactive programming abstraction in the JDK. Implementing both Future<T> and CompletionStage<T>, it allows composing non-blocking dependency graphs (map, flatMap, join, anyOf) without blocking calling threads on Future.get(). Under the hood, dependent callbacks are queued in a lock-free Treiber Stack until the triggering future completes.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: CompletableFuture Callback Treiber Stack Dispatch</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">supplyAsync(...)</span>
                <span class="node-desc">Runs in ForkJoinPool worker</span>
              </div>
              <span class="flow-arrow-separator">──thenApply──►</span>
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">Completion Node Stack</span>
                <span class="node-desc">UniApply pushed to Treiber Stack</span>
              </div>
              <span class="flow-arrow-separator">──complete(result)──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">postComplete()</span>
                <span class="node-desc">Pops stack & fires callback!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Execution Thread Trap:</strong> thenApply() executes synchronously on the completing thread; thenApplyAsync() dispatches to the pool!
            </div>
          </div>
        """,
        "internalWorking": "Inside CompletableFuture: (1) State Representation: Object 'result' field holds the outcome (either the value T, or an AltResult wrapper containing the Throwable). (2) Completion Dependency Stack: Holds field 'volatile Completion stack'. Each downstream stage (thenApply, thenCompose, thenAccept) creates a Completion node (UniApply, UniCompose) pushed onto the head of the Treiber Stack via CAS. (3) Triggering: When complete(v) is called, it CAS-sets the 'result' field. It then invokes 'postComplete()', which pops all Completion nodes from the stack in a loop and triggers their 'tryFire()' method. (4) Execution: If the stage was registered with '*Async' (thenApplyAsync), tryFire() submits a task to the executor; if non-async (thenApply), tryFire() executes directly on the thread that completed the parent future!",
        "complexPart": "The ForkJoinPool.commonPool() Starvation Trap: By default, supplyAsync() and all *Async methods with no explicit executor pass tasks to ForkJoinPool.commonPool(). The common pool defaults to (CPU Cores - 1) worker threads. If developers execute blocking I/O (database queries, external REST calls) in supplyAsync(), all common pool threads block immediately. This starves the entire JVM, causing parallel streams, other CompletableFutures, and system timers to freeze!",
        "keyPoints": [
            "Treiber Stack: Manages downstream completion callbacks using lock-free CAS linked-list stacks.",
            "Async vs Non-Async: Non-async callbacks run on the thread that completed the future (which could be the main thread or a worker); async callbacks submit to an executor.",
            "Default Executor: Uses ForkJoinPool.commonPool(); always pass a custom ThreadPoolExecutor in production.",
            "Exception Handling: Supports exceptionally, handle, and whenComplete to catch and recover from pipeline errors.",
            "Composition: thenCompose() is equivalent to flatMap; thenApply() is equivalent to map."
        ],
        "codeSnippet": "// Production Best Practice: Always pass a dedicated ThreadPoolExecutor\nExecutorService ioExecutor = Executors.newFixedThreadPool(50);\n\nCompletableFuture.supplyAsync(() -> {\n    // Blocking HTTP call executed safely in dedicated I/O pool\n    return httpClient.fetchOrder(orderId);\n}, ioExecutor)\n.thenApplyAsync(order -> {\n    // Transformation stage\n    return orderService.enrich(order);\n}, ioExecutor)\n.exceptionally(ex -> {\n    log.error(\"Pipeline failed!\", ex);\n    return fallbackOrder;\n})\n.thenAccept(finalOrder -> System.out.println(\"Order processed: \" + finalOrder));",
        "pitfall": "Omitting a custom Executor in supplyAsync() for blocking operations. Blocking ForkJoinPool.commonPool() threads halts all parallel streams and other async pipelines across the entire application.",
        "interviewTip": "Explain how thenCompose differs from thenApply: thenApply takes a function returning a value T (like Stream.map), whereas thenCompose takes a function returning another CompletableFuture<T> (like Stream.flatMap), preventing nested CompletableFuture<CompletableFuture<T>>."
    },
    {
        "id": "java-int-threadpoolexecutor",
        "title": "ThreadPoolExecutor Internals: Worker Threads, WorkQueue & Rejection Policies",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Thread Pools",
        "oneLiner": "The 7-parameter engine: corePoolSize, maximumPoolSize, workQueue, keepAliveTime, and 4 rejection policies.",
        "whatIsIt": "ThreadPoolExecutor is the core thread pooling and task scheduling engine in Java. It manages a pool of reusable worker threads, decoupling task submission from thread lifecycle management. It enforces strict admission control: core pool scaling, queue buffering, maximum pool burst expansion, and graceful saturation rejection.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: ThreadPoolExecutor 4-Stage Task Admission Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">1. Core Pool</span>
                <span class="node-desc">Spawns until corePoolSize</span>
              </div>
              <span class="flow-arrow-separator">──Core Full──►</span>
              <div class="flow-step-node node-purple" style="min-width: 150px;">
                <span class="node-label">2. Work Queue</span>
                <span class="node-desc">Enqueues in BlockingQueue</span>
              </div>
              <span class="flow-arrow-separator">──Queue Full──►</span>
              <div class="flow-step-node node-orange" style="min-width: 150px;">
                <span class="node-label">3. Max Pool</span>
                <span class="node-desc">Spawns until maxPoolSize</span>
              </div>
              <span class="flow-arrow-separator">──Max Full──►</span>
              <div class="flow-step-node node-red" style="min-width: 130px;">
                <span class="node-label">4. Rejection</span>
                <span class="node-desc">Handler triggers</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Surprising Counter-Intuitive Order:</strong> Tasks fill the QUEUE completely BEFORE maximumPoolSize threads are ever created!
            </div>
          </div>
        """,
        "internalWorking": "Inside ThreadPoolExecutor: (1) AtomicInteger ctl: Encodes BOTH runState (high 3 bits: RUNNING, SHUTDOWN, STOP, TIDYING, TERMINATED) and workerCount (low 29 bits: up to 500 million threads). (2) Task Submission (execute()): If workerCount < corePoolSize, creates a new Worker(firstTask) via addWorker(). If workerCount >= corePoolSize, attempts to enqueue task via workQueue.offer(command). If queue is full, attempts to create a non-core Worker up to maximumPoolSize. If maximumPoolSize is reached, invokes RejectedExecutionHandler. (3) Worker Execution Loop: Worker wraps a Thread and implements Runnable. In runWorker(): loops while '(task = getTask()) != null', pulling tasks from workQueue. Core threads block indefinitely on workQueue.take(); non-core threads use workQueue.poll(keepAliveTime) and terminate when timed out.",
        "complexPart": "The Executors.newFixedThreadPool & CachedThreadPool OOM Pitfalls: (1) Executors.newFixedThreadPool(10) uses an UNBOUNDED LinkedBlockingQueue (capacity Integer.MAX_VALUE). If task production outpaces processing, millions of tasks buffer in memory, triggering java.lang.OutOfMemoryError: Java heap space. (2) Executors.newCachedThreadPool() uses a SynchronousQueue with UNBOUNDED maximumPoolSize (Integer.MAX_VALUE). If burst traffic arrives, it spawns thousands of OS threads, triggering OutOfMemoryError: unable to create native thread!",
        "keyPoints": [
            "The 4 Rejection Policies: AbortPolicy (throws exception), CallerRunsPolicy (calling thread executes), DiscardPolicy (silent drop), DiscardOldestPolicy (drops queue head).",
            "Atomic ctl Bit-packing: Combines 3-bit lifecycle state and 29-bit active thread count into a single 32-bit atomic integer.",
            "Admission Flow: Core Threads -> Work Queue -> Max Threads -> Rejection Handler.",
            "CallerRunsPolicy Backpressure: Automatically throttles fast producers by forcing them to execute the rejected task themselves.",
            "Worker Re-use: Worker threads never terminate while workQueue has tasks, eliminating thread creation syscall overhead."
        ],
        "codeSnippet": "// Production Best Practice: Bounded Queue + CallerRunsPolicy Backpressure\nThreadPoolExecutor executor = new ThreadPoolExecutor(\n    8,                       // corePoolSize\n    16,                      // maximumPoolSize\n    60L, TimeUnit.SECONDS,   // keepAliveTime for idle non-core threads\n    new ArrayBlockingQueue<>(500), // BOUNDED queue prevents OutOfMemoryError\n    new NamedThreadFactory(\"payment-worker\"), // Custom thread naming\n    new ThreadPoolExecutor.CallerRunsPolicy() // Backpressure: caller runs task if saturated\n);",
        "pitfall": "Using Executors factory methods in production. Both newFixedThreadPool (unbounded queue) and newCachedThreadPool (unbounded threads) lead directly to production OOM outages under load spikes.",
        "interviewTip": "Emphasize the counter-intuitive admission sequence: developers frequently assume threads scale from core to max BEFORE queueing. In reality, the queue must fill completely before threads expand past corePoolSize!"
    },
    {
        "id": "java-int-aqs",
        "title": "AQS (AbstractQueuedSynchronizer): State, CLH Queue & ConditionObject",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "AQS Synchronization",
        "oneLiner": "The skeletal framework powering ReentrantLock, Semaphore, and CountDownLatch via volatile state and a CLH FIFO wait queue.",
        "whatIsIt": "AbstractQueuedSynchronizer (AQS) is the foundational synchronization framework engineered by Doug Lea that powers almost all modern Java synchronizers (ReentrantLock, ReentrantReadWriteLock, CountDownLatch, Semaphore, ThreadPoolExecutor.Worker). It manages synchronization using an atomic 32-bit state integer, a variant of the CLH FIFO virtual wait queue, and park/unpark thread primitives.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: AQS State & Double-Linked CLH Wait Queue</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">volatile int state</span>
                <span class="node-desc">0 = Unlocked, 1 = Locked</span>
              </div>
              <span class="flow-arrow-separator">◄──CAS──►</span>
              <div class="flow-step-node node-blue" style="min-width: 130px;">
                <span class="node-label">Head Node</span>
                <span class="node-desc">Current Lock Holder</span>
              </div>
              <span class="flow-arrow-separator">◄──next/prev──►</span>
              <div class="flow-step-node node-orange" style="min-width: 140px;">
                <span class="node-label">Node (Thread B)</span>
                <span class="node-desc">Parked via LockSupport</span>
              </div>
              <span class="flow-arrow-separator">◄──next/prev──►</span>
              <div class="flow-step-node node-orange" style="min-width: 140px;">
                <span class="node-label">Tail Node (Thread C)</span>
                <span class="node-desc">Enqueued via CAS</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Self-Signaling Queue:</strong> When the lock releases, the Head node inspects its 'next' pointer and unparks Thread B!
            </div>
          </div>
        """,
        "internalWorking": "Inside AQS: (1) volatile int state: Represents the synchronization status. In ReentrantLock, 0 = unlocked, >=1 = locked (with re-entrant hold count). In Semaphore, state = available permits. In CountDownLatch, state = remaining countdown latch count. Subclasses implement tryAcquire() and tryRelease() using CAS on this state. (2) CLH Doubly-Linked Queue: When tryAcquire() fails, the thread is packaged into a Node(Thread.currentThread(), Node.EXCLUSIVE) and inserted at the tail of the queue via CAS ('enq()'). (3) Parking: The thread checks if its predecessor is the Head. If not, it sets predecessor's waitStatus to SIGNAL (-1) and parks via LockSupport.park(this). (4) Release: When holder calls unlock(), tryRelease() decrements state to 0. It checks head.waitStatus == SIGNAL and calls LockSupport.unpark(head.next.thread).",
        "complexPart": "Fair vs Non-Fair Locks in AQS: In Non-Fair ReentrantLock, when a thread calls lock(), it IMMEDIATELY attempts a CAS on state ('compareAndSetState(0, 1)') before looking at the queue! If a lock was just released at that exact nanosecond, the newly arrived thread 'barges' in front of threads that have been waiting in the CLH queue for 50ms! This barging delivers 10x-100x higher throughput by avoiding thread unparking delays, but risks starvation.",
        "keyPoints": [
            "Exclusive vs Shared Modes: Exclusive (Node.EXCLUSIVE for ReentrantLock) vs Shared (Node.SHARED for Semaphore / CountDownLatch).",
            "Template Method Pattern: AQS provides acquire/release skeleton; developers only override tryAcquire, tryRelease, tryAcquireShared, tryReleaseShared.",
            "waitStatus States: SIGNAL (-1, node must unpark successor), CANCELLED (1, timed out or interrupted), CONDITION (-2).",
            "ConditionObject: Implements Condition interface; maintains an independent single-linked condition queue until signal() moves it to the CLH queue.",
            "Zero Monitor Locks: AQS relies entirely on CAS, volatile state, and native LockSupport.park/unpark."
        ],
        "codeSnippet": "// Custom Mutex Built with AQS in 20 Lines\npublic class SimpleMutex extends AbstractQueuedSynchronizer {\n    @Override\n    protected boolean tryAcquire(int acquires) {\n        // CAS state from 0 (free) to 1 (acquired)\n        if (compareAndSetState(0, 1)) {\n            setExclusiveOwnerThread(Thread.currentThread());\n            return true;\n        }\n        return false;\n    }\n\n    @Override\n    protected boolean tryRelease(int releases) {\n        if (getState() == 0) throw new IllegalMonitorStateException();\n        setExclusiveOwnerThread(null);\n        setState(0); // Volatile write releases lock\n        return true;\n    }\n\n    public void lock() { acquire(1); }\n    public void unlock() { release(1); }\n}",
        "pitfall": "Attempting to inspect lock queue order in Non-Fair mode. Non-fair locks allow thread barging, so lock acquisition order does not match arrival sequence.",
        "interviewTip": "Explain how ReentrantLock uses AQS: the lock state represents reentrant depth; ReentrantLock has an inner Sync class extending AQS; lock() calls acquire(1), which invokes tryAcquire() to CAS the state from 0 to 1 and record the exclusive owner thread."
    },
    {
        "id": "java-int-intrinsic-vs-explicit-locks",
        "title": "Intrinsic vs. Explicit Locks: synchronized vs. ReentrantLock",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Locking Mechanisms",
        "oneLiner": "Language-level automatic monitor locks vs API-level explicit locks with tryLock, timed waits, and multiple Conditions.",
        "whatIsIt": "Java provides two primary mutual exclusion mechanisms: Intrinsic Locks (the built-in synchronized keyword backed by JVM ObjectMonitors) and Explicit Locks (the java.util.concurrent.locks.Lock interface, primarily ReentrantLock, backed by AQS). While synchronized offers syntactic simplicity, ReentrantLock provides advanced concurrency controls like timed lock acquisition, interruptible locking, fairness policies, and multiple wait condition queues.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: synchronized vs ReentrantLock Feature Matrix</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 170px;">
                <span class="node-label">synchronized (Intrinsic)</span>
                <span class="node-desc">Automatic release; single wait-set</span>
                <span style="font-size: 0.68rem; color: #c084fc;">No tryLock; Non-interruptible</span>
              </div>
              <span class="flow-arrow-separator">VS</span>
              <div class="flow-step-node node-blue" style="min-width: 170px;">
                <span class="node-label">ReentrantLock (Explicit)</span>
                <span class="node-desc">Manual unlock in finally; AQS</span>
                <span style="font-size: 0.68rem; color: #38bdf8;">tryLock(); Multiple Conditions</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Key Rule:</strong> ReentrantLock MUST always be paired with 'try { ... } finally { lock.unlock(); }' to prevent lock leaks!
            </div>
          </div>
        """,
        "internalWorking": "Comparison Across 5 Technical Dimensions: (1) Acquisition: synchronized blocks indefinitely if lock is held; ReentrantLock supports tryLock() (immediate boolean return without blocking) and tryLock(timeout) (timed wait). (2) Interruption: synchronized cannot be interrupted while blocked waiting to enter; ReentrantLock supports lockInterruptibly(), waking immediately with InterruptedException if another thread calls interrupt(). (3) Fairness: synchronized is strictly non-fair; ReentrantLock constructor accepts a boolean 'new ReentrantLock(true)' for strict FIFO ordering. (4) Condition Queues: synchronized has only ONE implicit wait set per object (wait(), notifyAll()); ReentrantLock supports multiple independent Condition objects ('lock.newCondition()', e.g. notFull and notEmpty in ArrayBlockingQueue). (5) Release: synchronized releases automatically on block exit or exception; ReentrantLock requires explicit unlock() in a finally block.",
        "complexPart": "Virtual Thread Pinning (Java 21): In Java 21, executing synchronized while performing blocking network I/O 'pins' the virtual thread to its underlying OS carrier thread, preventing the carrier thread from executing other virtual threads. ReentrantLock does NOT pin carrier threads—it cleanly unmounts virtual threads during lock waits and blocking calls!",
        "keyPoints": [
            "tryLock() Prevents Deadlocks: Allows implementing lock ordering algorithms that back off if a second lock cannot be acquired.",
            "Multiple Conditions: ReentrantLock allows separate notEmpty and notFull condition queues, avoiding thundering herd wakeups.",
            "Mandatory Finally: Failure to call lock.unlock() in a finally block permanently deadlocks the entire application.",
            "Performance Parity: Since Java 6 lock escalation optimizations, performance between synchronized and ReentrantLock is virtually identical under low-to-medium contention.",
            "Virtual Thread Advantage: ReentrantLock unmounts virtual threads safely, whereas synchronized pins carrier threads during blocking calls (until JEP 491)."
        ],
        "codeSnippet": "// ReentrantLock with Multiple Conditions (Bounded Buffer Pattern)\npublic class BoundedBuffer<T> {\n    private final Lock lock = new ReentrantLock();\n    private final Condition notFull  = lock.newCondition(); \n    private final Condition notEmpty = lock.newCondition(); \n    private final Object[] items = new Object[100];\n    private int count = 0, putptr = 0, takeptr = 0;\n\n    public void put(T x) throws InterruptedException {\n        lock.lock();\n        try {\n            while (count == items.length) notFull.await(); // Wait until space exists\n            items[putptr] = x;\n            if (++putptr == items.length) putptr = 0;\n            count++;\n            notEmpty.signal(); // Signal only waiting consumers, NOT producers!\n        } finally {\n            lock.unlock(); // Always release in finally block\n        }\n    }\n}",
        "pitfall": "Placing lock.lock() INSIDE the try block ('try { lock.lock(); ... } finally { lock.unlock(); }'). If lock() throws an exception (e.g. OutOfMemoryError), finally still attempts to call unlock() on an un-acquired lock, throwing IllegalMonitorStateException and masking the real exception.",
        "interviewTip": "Highlight the Virtual Threads (Java 21) implication: explain that synchronized pins OS carrier threads during blocking I/O, whereas ReentrantLock integrates with Continuation unmounting, making ReentrantLock preferable in high-throughput Virtual Thread applications."
    },
    {
        "id": "java-int-deadlock-detection",
        "title": "Deadlock Detection, Prevention & The 4 Coffman Conditions",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Deadlock Prevention",
        "oneLiner": "The 4 Coffman conditions for deadlock, detecting deadlocks via ThreadMXBean, and prevention via lock ordering.",
        "whatIsIt": "A Deadlock is a concurrency failure where two or more threads are permanently blocked, each holding a lock that another thread needs while waiting for a lock held by that other thread. A deadlock can only occur if all four Coffman Conditions are simultaneously met. Eliminating any single condition prevents deadlocks completely.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Classic Circular Wait Deadlock Cycle</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">Thread 1</span>
                <span class="node-desc">Holds Lock A</span>
              </div>
              <span class="flow-arrow-separator">──Wants Lock B──►</span>
              <div class="flow-step-node node-orange" style="min-width: 140px;">
                <span class="node-label">Thread 2</span>
                <span class="node-desc">Holds Lock B</span>
              </div>
              <span class="flow-arrow-separator">──Wants Lock A──►</span>
              <div class="flow-step-node node-red" style="min-width: 140px;">
                <span class="node-label">Deadlock Cycle</span>
                <span class="node-desc">Permanent Block!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>The Golden Prevention Rule:</strong> Break Circular Wait by enforcing a strict global lock acquisition ordering!
            </div>
          </div>
        """,
        "internalWorking": "The 4 Coffman Conditions: (1) Mutual Exclusion: At least one resource is held in non-shareable mode. (2) Hold and Wait: A thread holds a resource while requesting another. (3) No Preemption: Resources cannot be forcibly confiscated from a thread. (4) Circular Wait: A closed chain of threads exists where each waits for a lock held by the next. Runtime Detection via ThreadMXBean: The JVM maintains a Resource Allocation Graph. HotSpot's ThreadMXBean.findDeadlockedThreads() performs Cycle Detection on the wait graph. Programmatic Prevention: (a) Global Lock Ordering: Sort locks by unique IDs (e.g. System.identityHashCode()) before acquiring. (b) Timed Acquisition: Use ReentrantLock.tryLock(timeout) with exponential backoff.",
        "complexPart": "Livelock and Starvation vs Deadlock: Unlike Deadlock (where threads are suspended in BLOCKED/WAITING consuming 0% CPU), in a Livelock, threads actively change state in response to each other without making progress (e.g. two polite people in a hallway stepping side-to-side simultaneously). Livelock burns 100% CPU while achieving zero throughput!",
        "keyPoints": [
            "The 4 Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.",
            "Breaking Circular Wait: Enforce a global canonical lock acquisition sequence (e.g. always acquire Account A before Account B based on account ID).",
            "ThreadMXBean Detection: HotSpot can programmatically detect deadlocks at runtime without external APM tools.",
            "tryLock Backoff: Using tryLock with timeouts allows breaking the 'No Preemption' condition by rolling back and releasing held locks.",
            "Static Analysis: Tools like SonarQube and SpotBugs detect potential deadlock cycles by analyzing lock acquisition hierarchies."
        ],
        "codeSnippet": "// Deadlock-Free Transfer Using Canonical Lock Ordering\npublic void transfer(Account from, Account to, BigDecimal amount) {\n    Account first = from.getId() < to.getId() ? from : to;\n    Account second = from.getId() < to.getId() ? to : from;\n\n    // Always acquire locks in strict numerical ID order!\n    // Circular Wait condition is mathematically impossible.\n    synchronized (first) {\n        synchronized (second) {\n            from.debit(amount);\n            to.credit(amount);\n        }\n    }\n}",
        "pitfall": "Transferring funds between two accounts using 'synchronized(from) { synchronized(to) { ... } }'. If Thread 1 transfers from Alice to Bob, and Thread 2 transfers from Bob to Alice simultaneously, they acquire locks in opposing order and immediately deadlock.",
        "interviewTip": "Recite the 4 Coffman conditions smoothly: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Emphasize that enforcing a deterministic lock acquisition order is the standard enterprise defense because it mathematically eliminates Circular Wait."
    }
]
