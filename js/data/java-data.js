/**
 * java-data.js
 * In-depth Core & Advanced Java Revision Notes for Senior Engineers.
 * Enriched with Visual Mindmaps, Flow Diagrams & Mental Models.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.JAVA_TOPICS = [
  {
    id: "jmm-concurrency-barriers",
    title: "Java Memory Model & Happens-Before",
    category: "Concurrency & JVM",
    badge: "Senior Core",
    oneLiner: "How CPU Store Buffers cause stale reads and how 'volatile' memory barriers enforce hardware cache coherence.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Hardware Cache & Memory Barrier</div>
        <div class="flow-chain">
          <div class="flow-step-node node-orange">
            <span class="node-label">CPU Core 1</span>
            <span class="node-desc">L1/L2 Store Buffer</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-red">
            <span class="node-label">Memory Barrier</span>
            <span class="node-desc">StoreLoad (mfence)</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-blue">
            <span class="node-label">Shared Main RAM</span>
            <span class="node-desc">Coherent State</span>
          </div>
          <span class="flow-arrow-separator">◄──</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">CPU Core 2</span>
            <span class="node-desc">Invalidates Stale L1</span>
          </div>
        </div>
        <div style="margin-top: 10px; font-size: 0.76rem; color: var(--accent-cyan);">
          ⚡ <strong>Reordering Trap:</strong> <code>1. Allocate</code> ──► <code>3. Assign ref (non-null!)</code> ──► <code>2. Run Constructor</code> (Thread B sees uninitialized fields!)
        </div>
      </div>
    `,
    summary: "How modern multi-core CPUs reorder instructions, CPU cache coherence (MESI), volatile memory barriers, and the Happens-Before specification.",
    keyPoints: [
      "CPUs use Store Buffers and Invalid Queues: Writes by Thread A may stay in its L1/L2 cache and remain invisible to Thread B on another core without memory barriers.",
      "The 'Happens-Before' guarantee: If action X happens-before action Y, the memory results of X are guaranteed visible to Y, and X is ordered before Y.",
      "Volatile Semantics: A write to a volatile variable happens-before every subsequent read of that same variable. The JIT inserts a StoreLoad / mfence CPU instruction preventing reordering.",
      "Double-Checked Locking Trap: Without volatile, instance = new Singleton() is broken because the compiler/CPU can reorder memory allocation and assignment before constructor execution."
    ],
    codeSnippet: `// Thread-Safe Lazy Singleton using Volatile DCL
public class DoubleCheckedSingleton {
    // 'volatile' is MANDATORY to prevent instruction reordering
    private static volatile DoubleCheckedSingleton INSTANCE;

    private DoubleCheckedSingleton() { /* Init expensive resources */ }

    public static DoubleCheckedSingleton getInstance() {
        DoubleCheckedSingleton localRef = INSTANCE; // Single read from main memory
        if (localRef == null) {
            synchronized (DoubleCheckedSingleton.class) {
                localRef = INSTANCE;
                if (localRef == null) {
                    INSTANCE = localRef = new DoubleCheckedSingleton();
                }
            }
        }
        return localRef;
    }
}`,
    pitfall: "Never omit volatile in Double-Checked Locking! Without it, other threads can read a partially constructed object where constructor fields are still default zeroes.",
    interviewTip: "In interviews, explain *why* instruction reordering occurs at both the Compiler (JIT) and CPU (Out-of-Order execution) levels, and how memory barriers enforce hardware cache synchronization."
  },

  {
    id: "aqs-locks-synchronizers",
    title: "AQS (AbstractQueuedSynchronizer) & Locks",
    category: "Concurrency & Synchronization",
    badge: "Staff Level",
    oneLiner: "The atomic state + FIFO CLH wait-queue engine powering ReentrantLock, Semaphore, and CountDownLatch.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: AQS Lock Acquisition & Wait Queue</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Incoming Thread</span>
            <span class="node-desc">Calls lock()</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">CAS state (0 ➔ 1)</span>
            <span class="node-desc">Atomic Try</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Success ✅</span>
            <span class="node-desc">Owns Lock & Runs</span>
          </div>
          <span class="flow-arrow-separator">OR</span>
          <div class="flow-step-node node-red">
            <span class="node-label">Failed ❌</span>
            <span class="node-desc">Enqueue in CLH FIFO</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">LockSupport.park()</span>
            <span class="node-desc">Sleeps until unpark</span>
          </div>
        </div>
      </div>
    `,
    summary: "The backbone of Java concurrency: How ReentrantLock, Semaphore, CountDownLatch, and CompletableFuture manage lock contention without busy-waiting.",
    keyPoints: [
      "AQS Core Architecture: A volatile int state variable + a FIFO doubly-linked CLH wait queue of thread nodes.",
      "Lock Acquisition Flow: Thread attempts compareAndSetState(0, 1). If successful, it owns the lock. If failed, it encapsulates current thread in a Node and parks it via LockSupport.park().",
      "Unlocking Flow: Thread resets state to 0 and invokes LockSupport.unpark(node.next.thread) to awaken the head of the wait queue.",
      "Fair vs Non-Fair Locks: Non-fair locks (default) allow incoming threads to attempt CAS before checking the CLH queue, achieving up to 10x higher throughput by skipping context switch penalties."
    ],
    codeSnippet: `// ReentrantLock with tryLock & timeout to prevent deadlocks
ReentrantLock lockA = new ReentrantLock();
ReentrantLock lockB = new ReentrantLock();

public void safeTransfer(Account from, Account to, BigDecimal amount) {
    long timeout = 500;
    try {
        if (lockA.tryLock(timeout, TimeUnit.MILLISECONDS)) {
            try {
                if (lockB.tryLock(timeout, TimeUnit.MILLISECONDS)) {
                    try {
                        from.debit(amount);
                        to.credit(amount);
                    } finally { lockB.unlock(); }
                }
            } finally { lockA.unlock(); }
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt(); // Always restore interrupted flag!
    }
}`,
    pitfall: "Always call unlock() inside a finally block, and verify lock.isHeldByCurrentThread() if using conditional acquisitions to avoid IllegalMonitorStateException.",
    interviewTip: "Be ready to explain how CountDownLatch (state decrements to 0) vs CyclicBarrier (tripped when all arrive, reusable) differ in their AQS state management."
  },

  {
    id: "java21-virtual-threads",
    title: "Java 21 Virtual Threads & Loom",
    category: "Modern Java (Java 21 LTS)",
    badge: "Trending Architecture",
    oneLiner: "Lightweight user-mode heap threads multiplexed onto OS carrier threads with Continuation unmounting.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Virtual Threads vs OS Carrier Threads</div>
        <div class="flow-chain">
          <div class="flow-step-node node-purple">
            <span class="node-label">1,000,000 V-Threads</span>
            <span class="node-desc">Heap Continuations (~KB)</span>
          </div>
          <span class="flow-arrow-separator">──M:N──►</span>
          <div class="flow-step-node node-blue">
            <span class="node-label">ForkJoinPool</span>
            <span class="node-desc">Carrier OS Threads (~16)</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">CPU Cores</span>
            <span class="node-desc">Hardware Execution</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #f87171;">
          ⚠️ <strong>Pinning Hazard:</strong> Blocking I/O inside <code>synchronized</code> pins the carrier thread! Use <code>ReentrantLock</code> to allow clean unmounting.
        </div>
      </div>
    `,
    summary: "Lightweight user-mode threads managed by the JVM (Project Loom). Millions of concurrent threads without the 1MB OS stack overhead.",
    keyPoints: [
      "Platform Threads vs Virtual Threads: Platform threads map 1:1 to OS kernel threads (~1MB stack, expensive context switches). Virtual threads are cheap JVM objects stored on the Heap (~few hundred bytes).",
      "Carrier Threads: Virtual threads run on top of a small ForkJoinPool of OS 'carrier threads'. When a virtual thread performs blocking I/O, it unmounts from the carrier thread and parks its Continuation on heap.",
      "The Pinning Trap: If a virtual thread enters a synchronized block/method or native call, it gets pinned to the OS carrier thread, preventing other virtual threads from using it during blocking I/O!",
      "Best Practice: Replace synchronized with ReentrantLock in high-throughput Virtual Thread applications."
    ],
    codeSnippet: `// Starting 10,000 Virtual Threads with zero thread pool configuration
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            // Blocking I/O is now virtually free!
            String response = httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
            return response;
        });
    });
} // Automatically awaits completion via AutoCloseable executor!`,
    pitfall: "Do NOT pool Virtual Threads! Pooling virtual threads is an anti-pattern. Create them on-demand and let them discard after the task.",
    interviewTip: "Distinguish between CPU-bound tasks (where Virtual Threads give ZERO speedup and platform threads are needed) vs I/O-bound tasks (where throughput scales exponentially)."
  },

  {
    id: "hashmap-internals-treeification",
    title: "HashMap & ConcurrentHashMap Internals",
    category: "Collections & Data Structures",
    badge: "Hot Question",
    oneLiner: "Hash perturbation, bitmask bucket indexing, and O(log N) Red-Black Treeification thresholds.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: HashMap Bucket & Treeification Flow</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Key.hashCode()</span>
            <span class="node-desc">h ^ (h &gt;&gt;&gt; 16)</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">Index: (n-1) &amp; hash</span>
            <span class="node-desc">Power of 2 Bitmask</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Linked List</span>
            <span class="node-desc">Count &lt; 8 (O(N))</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Red-Black Tree</span>
            <span class="node-desc">Count &gt;= 8 &amp; Cap &gt;= 64 (O(log N))</span>
          </div>
        </div>
      </div>
    `,
    summary: "Bucket array, hashing, collision resolution, Java 8 Red-Black Treeification, and ConcurrentHashMap lock striping vs CAS.",
    keyPoints: [
      "Hash calculation: (h = key.hashCode()) ^ (h >>> 16) spreads higher bits down to lower bits to prevent bucket clustering when table length is a power of 2.",
      "Bucket Index: index = (n - 1) & hash (bitmask equivalent to hash % n when capacity n is power of 2).",
      "Treeification Rule: When bucket length reaches TREEIFY_THRESHOLD = 8 AND total table capacity >= MIN_TREEIFY_CAPACITY = 64, linked list transforms into a Red-Black Tree (TreeNode). Reduces collision search from O(N) to O(log N).",
      "ConcurrentHashMap (Java 8+): Replaced Java 7 Segment locks with CAS on empty buckets and synchronized lock on ONLY the single bucket head node."
    ],
    codeSnippet: `// Key Contract: If two objects are equal, their hashCodes MUST be equal!
public final class EmployeeId {
    private final String department;
    private final int id;

    public EmployeeId(String department, int id) {
        this.department = Objects.requireNonNull(department);
        this.id = id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof EmployeeId other)) return false;
        return id == other.id && department.equals(other.department);
    }

    @Override
    public int hashCode() {
        return Objects.hash(department, id); // Uses 31 * hash prime multiplication
    }
}`,
    pitfall: "Mutating an object after inserting it as a HashMap key corrupts its bucket position; subsequent get(key) calls return null because the hash changed!",
    interviewTip: "Why is 31 chosen in hashCode()? Because 31 * i == (i << 5) - i, allowing compiler JIT to replace expensive multiplication with a lightning-fast bit-shift and subtraction."
  },

  {
    id: "gc-safepoints-pause-tuning",
    title: "Garbage Collection, Safepoints & Leaks",
    category: "JVM Internals & Performance",
    badge: "Staff Diagnostic",
    oneLiner: "Generational hypothesis, Safepoint thread suspension, and ThreadLocal thread pool memory leak hazards.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: JVM Generational Heap & Safepoints</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: #f97316;">
            <div class="memory-block-title">Eden Space (80%)</div>
            <div class="memory-block-subtitle">New allocations; 98% die young</div>
          </div>
          <div class="memory-space-block" style="border-color: #3b82f6;">
            <div class="memory-block-title">Survivor S0 / S1</div>
            <div class="memory-block-subtitle">Age 1..15; copied back & forth</div>
          </div>
          <div class="memory-space-block" style="border-color: #10b981;">
            <div class="memory-block-title">Old / Tenured Gen</div>
            <div class="memory-block-subtitle">Long-lived; G1GC Region sweeping</div>
          </div>
          <div class="memory-space-block" style="border-color: #a855f7;">
            <div class="memory-block-title">Metaspace (Off-Heap)</div>
            <div class="memory-block-subtitle">Native memory; Class definitions</div>
          </div>
        </div>
      </div>
    `,
    summary: "How G1GC and ZGC manage multi-gigabyte heaps, how Safepoints halt threads, and diagnosing production memory leaks.",
    keyPoints: [
      "Safepoints: Points during execution where all JVM thread registers and stack pointers are consistent. JVM injects polling instructions; during STW GC, threads pause at the nearest safepoint.",
      "Counted Loop Safepoint Bias (Java 8 Trap): In Java 8, long-running for int loops lacked safepoint polling, delaying GC pauses by seconds. Fixed via Loop Strip Mining in Java 10+.",
      "G1GC Mechanics: Divides heap into 2048 equal regions (1MB - 32MB). Dynamically assigns regions as Eden, Survivor, or Old. Prioritizes regions with the most garbage ('Garbage-First').",
      "ThreadLocal Memory Leaks: In thread pools (Tomcat, Netty), threads are reused. If remove() is not called in a finally block, objects remain pinned to the thread stack indefinitely!"
    ],
    codeSnippet: `// Safely using ThreadLocal in a Web/Worker Thread Pool
public class UserContextHolder {
    private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

    public static void set(UserContext ctx) { CONTEXT.set(ctx); }
    public static UserContext get() { return CONTEXT.get(); }

    // CRITICAL: Must be called in filter/interceptor finally block!
    public static void clear() {
        CONTEXT.remove(); // Prevents memory leaks in worker thread pools
    }
}`,
    pitfall: "Calling ThreadLocal.set(null) does NOT remove the entry! The ThreadLocalMap entry key remains a WeakReference, but the value is strongly referenced until remove() is called.",
    interviewTip: "Explain how to diagnose memory leaks using jcmd <pid> GC.heap_dump analyzed in Eclipse Memory Analyzer (MAT) or visualvm to find ClassLoader / static collection retention trees."
  },

  {
    id: "modern-java-features",
    title: "Java 17 & 21: Records & Sealed Types",
    category: "Language Architecture",
    badge: "Clean Code",
    oneLiner: "Transparent immutable data carriers, exhaustive domain modeling, and pattern matching dispatch.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Exhaustive Sealed Domain Matching</div>
        <div class="flow-chain">
          <div class="flow-step-node node-purple">
            <span class="node-label">sealed interface</span>
            <span class="node-desc">PaymentResult</span>
          </div>
          <span class="flow-arrow-separator">──permits──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">PaymentSuccess</span>
            <span class="node-desc">record (txId, amount)</span>
          </div>
          <div class="flow-step-node node-red">
            <span class="node-label">PaymentFailed</span>
            <span class="node-desc">record (reason, code)</span>
          </div>
          <div class="flow-step-node node-blue">
            <span class="node-label">PaymentPending</span>
            <span class="node-desc">record (checkUrl)</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #34d399;">
          ✅ <strong>Compiler Exhaustiveness:</strong> Switch statement covers all permitted records. If a new subclass is added, compiler immediately throws an error without needing a brittle <code>default</code> case!
        </div>
      </div>
    `,
    summary: "Exhaustive type hierarchies with Sealed Classes, immutable data transfer with Records, and pattern matching switch statements.",
    keyPoints: [
      "Records: Transparent, immutable data carriers. Generates final fields, constructor, getters, equals(), hashCode(), and toString(). No hidden mutable state.",
      "Sealed Classes/Interfaces: Constrain which subclasses are permitted to extend them via permits. Gives compile-time exhaustive checking in switch statements without default branch.",
      "Pattern Matching for Switch (Java 21): Express complex domain dispatch without brittle instanceof casts."
    ],
    codeSnippet: `// Domain modeling with Sealed Interfaces & Records
public sealed interface PaymentResult 
    permits PaymentSuccess, PaymentFailed, PaymentPending {}

public record PaymentSuccess(String txId, BigDecimal amount) implements PaymentResult {}
public record PaymentFailed(String reason, int errorCode) implements PaymentResult {}
public record PaymentPending(String checkUrl) implements PaymentResult {}

// Pattern Matching Switch (Exhaustive - Compiler guarantees no unhandled cases)
public String handleResult(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess s -> "Paid: " + s.amount() + " [TX: " + s.txId() + "]";
        case PaymentFailed f when f.errorCode() == 401 -> "Declined: Unauthorized";
        case PaymentFailed f -> "Failed: " + f.reason();
        case PaymentPending p -> "Pending: Check " + p.checkUrl();
    };
}`,
    pitfall: "Do not use Records as JPA/Hibernate @Entity classes! JPA entities require mutable state, proxyable no-arg constructors, and lazy-loading field interception which violates Record immutability.",
    interviewTip: "Highlight that Records are perfect as DTOs, Kafka message payloads, and value objects, while Sealed types replace fragile visitor patterns with clean functional polymorphism."
  },

  {
    id: "jvm-vtable-polymorphism",
    title: "JVM Polymorphism: V-Table, I-Table & Dynamic Dispatch Internals",
    category: "JVM Internals & OOPs",
    badge: "Staff-Level JVM Internals",
    oneLiner: "How the JVM executes runtime polymorphism in O(1) time via Metaspace V-Tables and HotSpot Monomorphic Inline Caching.",
    summary: "Dynamic method dispatch in Java does not traverse class inheritance hierarchies at runtime. Instead, during class loading, the JVM HotSpot engine builds a Virtual Method Table (V-Table) in Metaspace for every class. All virtual methods are assigned fixed array offsets. An invokevirtual instruction simply indexes into vtable[offset]. Furthermore, the JIT C2 compiler uses profiling to devirtualize and inline monomorphic calls, eliminating dispatch overhead completely.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 JVM Dynamic Dispatch: Object Header ➔ Klass ➔ V-Table</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Heap: Dog Object Instance</div>
            <div class="space-desc">Mark Word (8B) + Klass Word (8B pointer)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Klass Word points to Dog Klass metadata in Metaspace.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Metaspace: Dog Klass V-Table</div>
            <div class="space-desc">vtable[0]: &amp;Dog.makeSound() (Overridden!)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">vtable[1]: &amp;Animal.sleep() (Inherited from parent)</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 12px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Bytecode</span>
            <span class="node-label">invokevirtual #4</span>
            <span class="node-sub">Constant pool ref</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Dereference</span>
            <span class="node-label">Read Klass Word</span>
            <span class="node-sub">Locates Metaspace Klass</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">3. Fixed Offset</span>
            <span class="node-label">vtable[offset]</span>
            <span class="node-sub">O(1) Direct Lookup</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. JIT Fast Path</span>
            <span class="node-label">Inline Cache (MIC)</span>
            <span class="node-sub">Direct call / Inlined!</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "V-Table (Virtual Method Table): An array of pointers to method code stored in each class's Metaspace Klass instance. A subclass inherits its parent's vtable layout: inherited methods share the same index; overridden methods replace the pointer at that index.",
      "The 5 Bytecode Invocations: 1) invokestatic: static methods (static binding); 2) invokespecial: private methods, constructors, super (static binding); 3) invokevirtual: class-based instance methods (vtable O(1)); 4) invokeinterface: interface methods (uses I-Table stub search); 5) invokedynamic: lambda bootstrap methods.",
      "Why invokeinterface is Slower than invokevirtual: A class can implement multiple independent interfaces in any arbitrary order. The JVM cannot use fixed array offsets across unrelated classes, so it uses an Interface Table (I-Table) with stub caching.",
      "JIT HotSpot Optimization (Inline Caching): JIT monitors call site polymorphism: 1) Monomorphic (1 target type, 90%+ of calls): JIT removes vtable lookup and inlines the method directly! 2) Bimorphic (2 types): JIT emits a fast if-else type check; 3) Megamorphic (3+ types): JIT falls back to standard vtable lookup."
    ],
    codeSnippet: `// Demonstration of JVM Bytecode & Dynamic Dispatch
public class VTableDemo {
    static class Animal {
        void makeSound() { System.out.println("Animal sound"); }
    }
    static class Dog extends Animal {
        @Override void makeSound() { System.out.println("Bark"); }
    }
    static class Cat extends Animal {
        @Override void makeSound() { System.out.println("Meow"); }
    }

    public static void test(Animal a) {
        a.makeSound(); // invokevirtual #4 <Animal.makeSound>
    }

    public static void main(String[] args) {
        Animal dog = new Dog();
        Animal cat = new Cat();
        test(dog); // Prints "Bark"
        test(cat); // Prints "Meow"
    }
}

// Disassembled bytecode via 'javap -c VTableDemo':
// public static void test(VTableDemo$Animal);
//   Code:
//      0: aload_0          // Push Animal reference onto operand stack
//      1: invokevirtual #7  // Method VTableDemo$Animal.makeSound:()V
//      4: return`,
    pitfall: "Assuming virtual method dispatch in Java carries significant runtime overhead. In production HotSpot JVMs, over 95% of call sites are monomorphic and are completely inlined into native machine code by the C2 JIT compiler, with zero vtable lookup cost!",
    interviewTip: "When asked about polymorphism performance, explain the 3 inline cache states: Monomorphic (inlined direct jump), Bimorphic (conditional branch), and Megamorphic (full vtable lookup)."
  }
];


// =========================================================================
// JAVA TRICKY INTERVIEW QUESTIONS (Senior & Staff Level)
// =========================================================================
window.REVISION_APP_DATA.JAVA_QUESTIONS = [
  {
    "id": "q-java-equals-hashcode-contract",
    "category": "OOP & Design",
    "difficulty": "Senior",
    "title": "equals() and hashCode() Contract: Mutable Keys, Hash Bucket Dislocation & Silent Memory Leaks",
    "question": "What happens when a mutable object is used as a key in HashMap/HashSet and its fields are modified after insertion?",
    "interviewerIntent": "Testing whether the candidate understands hash bucket addressing, invariant enforcement in collections, and memory leak diagnosis.",
    "juniorTrap": "Assuming that because the exact same object reference (==) is passed to map.get(key), the map will find it regardless of field mutations.",
    "problem": "An object inserted into a HashMap becomes unretrievable after mutating its fields, while map.size() still reports 1 and keys cannot be removed.",
    "innerWorking": "HashMap computes bucket index via (n - 1) & hash(key.hashCode()). If a key's fields are mutated, hashCode() changes. A subsequent get(key) computes a completely different bucket index. Even if by coincidence it maps to the same bucket, equals() may now fail. The entry becomes a phantom zombie object in heap memory.",
    "seniorAnswer": [
      "Contract Invariant: If a.equals(b) is true, then a.hashCode() MUST equal b.hashCode(). Consistency: If state doesn't change, hashCode() must return the exact same integer.",
      "Bucket Dislocation: When key fields mutate, map.get(key) searches the new bucket index and returns null. map.containsKey(key) returns false.",
      "Zombie Entry: The old entry remains trapped inside the original bucket. Over time, mutating keys causes severe memory leaks that survive Garbage Collection because the Table array holds strong references.",
      "Resolution: 1) Keys in HashMaps and elements in HashSets MUST be immutable (e.g. Java 14+ Records or final fields). 2) If mutability is unavoidable, use IdentityHashMap which uses System.identityHashCode() and reference equality (==)."
    ],
    "codeSnippet": "import java.util.*;\n\nclass UserKey {\n    private int id;\n    public UserKey(int id) { this.id = id; }\n    public void setId(int id) { this.id = id; }\n\n    @Override public int hashCode() { return this.id; }\n    @Override public boolean equals(Object o) {\n        if (this == o) return true;\n        if (!(o instanceof UserKey k)) return false;\n        return this.id == k.id;\n    }\n}\n\npublic class MutableKeyTrap {\n    public static void main(String[] args) {\n        Map<UserKey, String> map = new HashMap<>();\n        UserKey user = new UserKey(100);\n        map.put(user, \"Active Session\");\n\n        // Mutating key field after insertion:\n        user.setId(200);\n\n        System.out.println(\"Get user: \" + map.get(user)); // Prints: null!\n        System.out.println(\"Contains: \" + map.containsKey(user)); // Prints: false!\n        System.out.println(\"Size: \" + map.size()); // Prints: 1 (Trapped memory leak!)\n    }\n}",
    "trap": "Mutating key state after insertion breaks bucket addressing, creating unreachable zombie entries in heap memory."
  },
  {
    "id": "q-java-composition-vs-inheritance",
    "category": "OOP & Design",
    "difficulty": "Senior",
    "title": "Composition vs Inheritance: The Fragile Base Class Problem & HashSet.addAll() Trap",
    "question": "Why does extending a class like HashSet and overriding add() and addAll() double-count elements, and how does composition solve it?",
    "interviewerIntent": "Testing awareness of the Fragile Base Class problem, self-use inside library methods, and Joshua Bloch's 'Favor Composition over Inheritance' principle.",
    "juniorTrap": "Assuming that overriding both add() and addAll() is standard polymorphism, unaware that HashSet's addAll() internally calls this.add().",
    "problem": "A custom InstrumentedHashSet counts 6 additions when only 3 elements are added via addAll().",
    "innerWorking": "In java.util.HashSet, addAll() iterates over the collection and invokes this.add(e) dynamically. When a subclass overrides both methods and increments its counter in both, adding via addAll() increments once in addAll() and then again for each item in the overridden add(). Subclassing breaks when base classes change their internal self-use.",
    "seniorAnswer": [
      "Inheritance breaches encapsulation because a subclass depends on the implementation details of its superclass, not just its public contract.",
      "If HashSet later changes its internal implementation of addAll() to use a batch-native call rather than this.add(), the subclass silently breaks in production without any compile warning.",
      "Composition Solution: Create a ForwardingSet that wraps a Set instance and implements Set by delegating. This Decorator pattern is immune to superclass internal refactoring."
    ],
    "codeSnippet": "import java.util.*;\n\n// BROKEN INHERITANCE:\nclass BrokenInstrumentedSet<E> extends HashSet<E> {\n    private int addCount = 0;\n    @Override public boolean add(E e) { addCount++; return super.add(e); }\n    @Override public boolean addAll(Collection<? extends E> c) {\n        addCount += c.size(); // Increments count by 3\n        return super.addAll(c); // super.addAll() internally calls this.add(), incrementing another 3!\n    }\n    public int getAddCount() { return addCount; }\n}\n\n// PROPER COMPOSITION (Decorator / Forwarding):\nclass SafeInstrumentedSet<E> implements Set<E> {\n    private final Set<E> delegate;\n    private int addCount = 0;\n    public SafeInstrumentedSet(Set<E> delegate) { this.delegate = delegate; }\n    \n    public boolean add(E e) { addCount++; return delegate.add(e); }\n    public boolean addAll(Collection<? extends E> c) {\n        addCount += c.size();\n        return delegate.addAll(c); // Safe! delegate.addAll() does NOT call SafeInstrumentedSet.add()\n    }\n    public int getAddCount() { return addCount; }\n    // ... delegate all other Set methods ...\n}",
    "trap": "Subclassing libraries exposes you to hidden internal self-use loops. Always prefer composition with forwarding interfaces."
  },
  {
    "id": "q-java-abstract-vs-interface-java8",
    "category": "OOP & Design",
    "difficulty": "Staff Level",
    "title": "Abstract Class vs Interface Post-Java 8: The Diamond Problem & State Invariants",
    "question": "Now that interfaces support default, static, and private methods, do we still need abstract classes? Explain the Diamond Problem resolution.",
    "interviewerIntent": "Testing architectural understanding of state encapsulation vs behavior contracts, and the exact JLS rules for resolving interface method conflicts.",
    "juniorTrap": "Claiming abstract classes are completely obsolete since interfaces now support code implementation.",
    "problem": "When a class implements two interfaces containing identical default methods void log(String msg), what does the compiler do, and how is it resolved?",
    "innerWorking": "Abstract classes can hold mutable instance state (fields) and constructors to enforce lifecycle invariants. Interfaces CANNOT hold instance fields (only public static final constants) and have no constructors. In conflicts, JLS rule: 1) Classes win over interfaces. 2) More specific sub-interfaces win over super-interfaces. 3) If unrelated, compilation fails with duplicate default methods.",
    "seniorAnswer": [
      "State vs Contract: Abstract classes define 'what an object IS' and encapsulate mutable state and constructors. Interfaces define 'what an object CAN DO' (capabilities/roles).",
      "Diamond Conflict Resolution: If InterfaceA and InterfaceB have default void run(), class C MUST explicitly override run() and disambiguate via InterfaceA.super.run(); or provide its own logic.",
      "Evolvability: Interfaces allow multiple inheritance of type and behavior. Abstract classes allow controlled template method lifecycles (e.g. final templateMethod() calling protected abstract hooks)."
    ],
    "codeSnippet": "interface Engine {\n    default void start() { System.out.println(\"Engine started\"); }\n}\ninterface ElectricSystem {\n    default void start() { System.out.println(\"Electric power online\"); }\n}\n\n// MUST explicitly resolve collision or compiler throws error:\nclass HybridVehicle implements Engine, ElectricSystem {\n    @Override\n    public void start() {\n        // Disambiguate using Interface.super syntax:\n        Engine.super.start();\n        ElectricSystem.super.start();\n        System.out.println(\"Hybrid powertrain ready!\");\n    }\n}",
    "trap": "Interfaces can never replace abstract classes when state initialization or protected template lifecycles are required."
  },
  {
    "id": "q-java-overload-vs-override-null",
    "category": "OOP & Design",
    "difficulty": "Senior",
    "title": "Method Overloading vs Overriding: The Ambiguous null & Boxing vs Widening Precedence",
    "question": "Which method is invoked for test(null), and what happens when an int primitive matches both long widening and Integer autoboxing?",
    "interviewerIntent": "Verifying exact knowledge of JLS overload resolution phases (compile-time static binding) vs overriding (runtime dynamic vtable dispatch).",
    "juniorTrap": "Thinking test(null) calls Object because null matches anything, or thinking int autoboxes to Integer before widening to long.",
    "problem": "A developer calls test(null) with overloaded methods test(String) and test(Integer) and gets a compilation failure.",
    "innerWorking": "JLS §15.12.2 specifies a 3-phase overload resolution: Phase 1 (widening primitive without boxing), Phase 2 (boxing/unboxing), Phase 3 (varargs). Widening ALWAYS beats autoboxing. For null arguments, the compiler searches for the most specific subtype. If two sibling types are equally specific, it fails as ambiguous.",
    "seniorAnswer": [
      "Overloading is resolved at COMPILE TIME based on compile-time reference types.",
      "Overriding is resolved at RUNTIME based on the actual heap object instance type (vtable lookup).",
      "Widening beats Boxing: test(10) calls test(long) over test(Integer). Primitive conversion does not incur heap allocation.",
      "Ambiguous null: test(Object) vs test(String) invokes test(String) because String is more specific. But test(String) vs test(Integer) throws compile error because neither is a subtype of the other."
    ],
    "codeSnippet": "public class OverloadDemo {\n    static void test(Object o) { System.out.println(\"Object\"); }\n    static void test(String s) { System.out.println(\"String\"); }\n    // If you uncomment Integer, test(null) becomes ambiguous!\n    // static void test(Integer i) { System.out.println(\"Integer\"); }\n\n    static void choose(long val) { System.out.println(\"Widened to long\"); }\n    static void choose(Integer val) { System.out.println(\"Autoboxed to Integer\"); }\n\n    public static void main(String[] args) {\n        test(null); // Prints: String (more specific than Object)\n        int x = 42;\n        choose(x);  // Prints: Widened to long (Phase 1 beats Phase 2 boxing!)\n    }\n}",
    "trap": "Primitive widening always beats wrapper autoboxing. Overload resolution happens strictly at compile time."
  },
  {
    "id": "q-java-final-keyword-internals",
    "category": "OOP & Design",
    "difficulty": "Senior",
    "title": "final Keyword Mechanics: Blank Finals, JIT Constant Folding & Immutability Pitfall",
    "question": "Does making a reference 'final' guarantee immutability, and how does the JMM treat final field publication in constructors?",
    "interviewerIntent": "Testing whether the candidate distinguishes between reference immutability vs object state immutability, and understanding JMM final field freeze semantics.",
    "juniorTrap": "Confusing a final reference with an immutable collection (e.g. thinking final List cannot have elements added).",
    "problem": "A developer marks private final List<String> list = new ArrayList<>() and assumes the list is thread-safe and immutable.",
    "innerWorking": "The final keyword only makes the variable pointer reassignment impossible (it cannot point to a new heap address). It provides ZERO protection against internal mutation of the referenced object. JMM Special Guarantee: The JMM ensures that after a constructor finishes, all final fields are 'frozen' and safely visible to all other threads without synchronization.",
    "seniorAnswer": [
      "Final Reference != Immutability: final List<T> list allows list.add() and list.clear(). To achieve true immutability, use List.copyOf() or Collections.unmodifiableList().",
      "JMM Final Field Freeze: Under JSR-133, a write to a final field inside a constructor has a memory freeze barrier at the end of the constructor. Other threads are guaranteed to see the initialized final field without needing volatile or locks (provided 'this' reference did not escape during construction).",
      "JIT Constant Folding: static final primitive/String constants are inlined directly into class bytecode by javac (compile-time constants)."
    ],
    "codeSnippet": "public class FinalTrap {\n    private final List<String> names = new ArrayList<>(); // NOT immutable!\n\n    public void addName(String name) {\n        names.add(name); // Perfectly legal! Mutates underlying object\n    }\n\n    // TRUE Immutability:\n    public static class ImmutableHolder {\n        private final List<String> safeList;\n        public ImmutableHolder(List<String> input) {\n            // Defensive copy + unmodifiable wrapper:\n            this.safeList = List.copyOf(input);\n        }\n        public List<String> getSafeList() { return safeList; }\n    }\n}",
    "trap": "final on a reference variable only freezes the pointer; it does not protect the underlying object from mutation."
  },
  {
    "id": "q-java-solid-lsp-violation",
    "category": "OOP & Design",
    "difficulty": "Staff Level",
    "title": "SOLID Liskov Substitution Principle (LSP): The Rectangle/Square Anti-Pattern & Invariant Defense",
    "question": "Why does class Square extends Rectangle violate the Liskov Substitution Principle, and how do you detect LSP violations in code reviews?",
    "interviewerIntent": "Evaluating real-world clean architecture skills and the ability to distinguish mathematical subtyping from behavioral subtyping.",
    "juniorTrap": "Arguing that because a Square is mathematically a Rectangle with equal sides, Square extends Rectangle is valid OOP.",
    "problem": "A client writes a method resize(Rectangle r) that sets width to 10 and height to 20 and asserts area == 200. Passing a Square fails the test or breaks invariants.",
    "innerWorking": "LSP states: Functions that use pointers or references to base classes must be able to use objects of derived classes without knowing it and without breaking invariants. In Rectangle, width and height vary independently. In Square, changing width implicitly changes height. A subtype cannot strengthen preconditions or weaken postconditions.",
    "seniorAnswer": [
      "LSP Violation Smells in Code Reviews: 1) Derived classes overriding methods with empty bodies or throwing UnsupportedOperationException. 2) Subclasses modifying class invariants assumed by client code. 3) Clients using if (obj instanceof Child) checks before calling methods.",
      "Solution: Separate mutable models from common read-only interfaces (Shape), or use composition rather than inheritance."
    ],
    "codeSnippet": "// BAD: Violates LSP\nclass Rectangle {\n    protected int width, height;\n    public void setWidth(int w) { this.width = w; }\n    public void setHeight(int h) { this.height = h; }\n    public int getArea() { return width * height; }\n}\n\nclass Square extends Rectangle {\n    @Override public void setWidth(int w) { this.width = this.height = w; }\n    @Override public void setHeight(int h) { this.width = this.height = h; }\n}\n\n// Client method that fails:\nvoid verifyArea(Rectangle r) {\n    r.setWidth(5);\n    r.setHeight(4);\n    // Assumes independent dimensions! For Square, this asserts 20 == 16 (FAILS!)\n    assert r.getArea() == 20 : \"LSP Violation detected!\";\n}",
    "trap": "Subclasses must preserve the behavioral contracts and invariants of their parents, not just their method signatures."
  },
  {
    "id": "q-java-string-pool-intern",
    "category": "Strings & Exceptions",
    "difficulty": "Senior",
    "title": "String Immutability, String Pool & String.intern() Memory Mechanics",
    "question": "How many objects are created by String s = new String(\"abc\"), and how does String.intern() interact with JVM heap memory?",
    "interviewerIntent": "Testing bytecode-level understanding of StringTable native hashtable, JVM String literal caching, and GC behavior across Java versions.",
    "juniorTrap": "Saying it creates only 1 object, or not knowing where the string pool resides in modern JVMs (Heap vs PermGen).",
    "problem": "Developers frequently misuse new String(str) or call str.intern() on millions of random strings, causing severe StringTable bucket collisions and GC pauses.",
    "innerWorking": "new String(\"abc\") creates TWO objects: 1) The literal \"abc\" is placed in the StringTable (String Pool) at class load time if not already present. 2) new String() allocates a distinct object instance on the heap. String.intern() queries the JVM's StringTable: if an equal string exists, it returns the pooled reference; otherwise, it adds the reference to the table and returns it.",
    "seniorAnswer": [
      "Memory Allocation: new String(\"hello\") allocates on normal heap and references the pooled char[]/byte[] array.",
      "StringTable Location: In Java 6, StringTable was in PermGen (fixed size, prone to java.lang.OutOfMemoryError: PermGen space). Since Java 7+, StringTable resides in the main Java Heap and is garbage collected.",
      "Modern Alternative: In Java 9+, Compact Strings use byte[] instead of char[] with LATIN1/UTF16 coder flag. In G1 GC, use -XX:+UseStringDeduplication to automatically deduplicate identical char/byte arrays in the background without intern() overhead."
    ],
    "codeSnippet": "public class StringPoolDemo {\n    public static void main(String[] args) {\n        String s1 = \"Hello\";\n        String s2 = new String(\"Hello\");\n        String s3 = s2.intern();\n\n        System.out.println(s1 == s2);        // false (Heap instance vs Pooled literal)\n        System.out.println(s1 == s3);        // true (Both point to StringTable entry)\n        System.out.println(s1.equals(s2));   // true (Value comparison)\n        \n        // Literal concatenation (folded at compile time):\n        String a = \"ab\";\n        String b = \"a\" + \"b\";\n        System.out.println(a == b);          // true (javac compiler constant folding!)\n    }\n}",
    "trap": "Avoid calling .intern() on unbounded dynamic user inputs; it pollutes the JVM native StringTable hashtable."
  },
  {
    "id": "q-java-integer-cache-traps",
    "category": "Strings & Exceptions",
    "difficulty": "Senior",
    "title": "IntegerCache Trap: == Identity Comparison Bounds (-128 to 127) & Reflection Tampering",
    "question": "Why does Integer a = 100, b = 100 evaluate a == b to true, but Integer c = 200, d = 200 evaluates to false? Can reflection break this?",
    "interviewerIntent": "Verifying whether the candidate understands wrapper caching, JLS §5.1.7 autoboxing specifications, and defensive JVM programming.",
    "juniorTrap": "Using == on wrapper types instead of .equals() because it 'worked fine in local unit tests' with small numbers.",
    "problem": "Code using == for IDs or quantities works in dev environments with small numbers but silently fails in production when values exceed 127.",
    "innerWorking": "Integer.valueOf(int) caches objects for the range [-128, 127]. When autoboxing Integer x = 100, javac generates Integer.valueOf(100) which returns a reference from IntegerCache.cache[]. For values >= 128, it invokes new Integer(val), creating distinct heap objects. Using reflection, one can modify the underlying cache array, corrupting JVM math globally!",
    "seniorAnswer": [
      "Cache Bounds: [-128, 127] is mandatory per JLS. High bound can be tuned via -XX:AutoBoxCacheMax=<size>.",
      "Other Caches: Byte, Short, Long cache [-128, 127]. Character caches [0, 127]. Float and Double are NEVER cached.",
      "Golden Rule: NEVER use == for object wrappers unless checking for null. Always use .equals() or primitive intValue()."
    ],
    "codeSnippet": "import java.lang.reflect.Field;\n\npublic class IntegerCacheHacking {\n    public static void main(String[] args) throws Exception {\n        Integer a = 127, b = 127;\n        System.out.println(a == b); // true (Shared cached reference)\n\n        Integer c = 128, d = 128;\n        System.out.println(c == d); // false (Distinct heap objects!)\n\n        // REFLECTION ATTACK (Demonstrating cache mutability):\n        Class<?> cacheClass = Class.forName(\"java.lang.Integer$IntegerCache\");\n        Field cacheField = cacheClass.getDeclaredField(\"cache\");\n        cacheField.setAccessible(true);\n        Integer[] cache = (Integer[]) cacheField.get(null);\n        \n        // Mutate cached value for 4 (index: 4 + 128 = 132):\n        cache[132] = 42;\n\n        Integer x = 2 + 2;\n        System.out.println(\"2 + 2 = \" + x); // Prints: 2 + 2 = 42!\n    }\n}",
    "trap": "Never compare wrapper types with ==. Small values fool unit tests because of IntegerCache."
  },
  {
    "id": "q-java-stringbuilder-vs-buffer",
    "category": "Strings & Exceptions",
    "difficulty": "Mid-Senior",
    "title": "StringBuilder vs StringBuffer: Synchronization Overhead & Capacity Growth Math",
    "question": "When should you ever use StringBuffer over StringBuilder in modern Java, and how does the internal char[]/byte[] buffer expand?",
    "interviewerIntent": "Testing candidate's practical performance instincts and memory allocation awareness.",
    "juniorTrap": "Defaulting to StringBuffer out of habit thinking thread-safety is always desirable.",
    "problem": "Excessive object allocation and lock contention in high-throughput string manipulation routines.",
    "innerWorking": "StringBuffer synchronizes almost every method using synchronized monitor locks. In 99.9% of use cases, string assembly occurs locally within a single thread/method stack, rendering synchronization completely redundant. Capacity expansion formula in both classes: newCapacity = (oldCapacity * 2) + 2.",
    "seniorAnswer": [
      "Modern Reality: StringBuffer is a legacy Java 1.0 relic. StringBuilder (Java 5) is non-synchronized, faster, and standard for single-threaded string construction.",
      "Pre-sizing Optimization: Default initial capacity is 16 characters. If building a 5,000-character JSON/XML payload without initial sizing, the JVM repeatedly allocates new arrays, copies contents via System.arraycopy, and discards old buffers, causing GC allocation churn.",
      "Best Practice: Always pre-size: new StringBuilder(estimatedSize)."
    ],
    "codeSnippet": "// BAD: Triggers multiple reallocations and array copies\nStringBuilder sb = new StringBuilder(); // Default capacity = 16\nfor (int i = 0; i < 1000; i++) {\n    sb.append(\"data,\"); // Repeatedly resizes: 16 -> 34 -> 70 -> 142 -> 286...\n}\n\n// GOOD: Single allocation, zero arraycopy churn\nStringBuilder optimized = new StringBuilder(5000);\nfor (int i = 0; i < 1000; i++) {\n    optimized.append(\"data,\");\n}",
    "trap": "Never use StringBuffer unless sharing a buffer across multiple threads (which is an architectural anti-pattern anyway)."
  },
  {
    "id": "q-java-autoboxing-ternary-npe",
    "category": "Strings & Exceptions",
    "difficulty": "Senior",
    "title": "Autoboxing/Unboxing Pitfall: Silent NullPointerException in Ternary Conditional Expressions",
    "question": "Why does boolean flag = true; Integer val = null; int result = flag ? val : 0.0 == 0.0 ? val : 0; throw a NullPointerException at runtime?",
    "interviewerIntent": "Testing deep knowledge of JLS conditional operator type coercion rules (§15.25).",
    "juniorTrap": "Assuming that because the ternary operator is conditional, wrapper types remain unboxed until assigned.",
    "problem": "Production code throwing NullPointerException on lines containing simple ternary null-checks.",
    "innerWorking": "According to JLS §15.25, if one operand of the ternary operator is a numeric wrapper (Integer) and the other is a primitive (int or double), the type of the entire ternary expression is determined by binary numeric promotion to the PRIMITIVE type. Therefore, the compiler inserts an implicit val.intValue() unboxing call on the branch, throwing NPE if val is null!",
    "seniorAnswer": [
      "Type Coercion Rule: In condition ? wrapper : primitive, the wrapper is ALWAYS unboxed to primitive.",
      "Loop Performance Trap: Integer sum = 0; for(int i=0; i<1M; i++) sum += i; creates 1,000,000 temporary Integer objects due to autoboxing/unboxing churn.",
      "Defense: When using ternary operators with nullables, ensure both return branches have identical wrapper types: condition ? val : Integer.valueOf(0)."
    ],
    "codeSnippet": "public class TernaryNPETrap {\n    public static void main(String[] args) {\n        Integer nullableValue = null;\n        boolean condition = false;\n\n        // Tricky Trap: Mixing Integer and int primitive:\n        // Even when condition is false, compiler types this as 'int'!\n        int safe = condition ? nullableValue : 0; // Evaluates to 0 safely\n\n        boolean conditionTrue = true;\n        // When conditionIsTrue is true:\n        // The JVM executes: nullableValue.intValue() -> THROWS NullPointerException!\n        try {\n            int broken = conditionTrue ? nullableValue : 0;\n        } catch (NullPointerException e) {\n            System.out.println(\"NPE thrown due to implicit primitive unboxing coercion!\");\n        }\n    }\n}",
    "trap": "Mixing wrapper types with primitives in ternary expressions causes implicit unboxing, triggering unexpected NPEs."
  },
  {
    "id": "q-java-checked-vs-unchecked-sneaky",
    "category": "Strings & Exceptions",
    "difficulty": "Staff Level",
    "title": "Checked vs Unchecked Exceptions: Generic Type Erasure 'SneakyThrows' & Lambda Boundaries",
    "question": "Can Java throw a checked exception without declaring it in a 'throws' clause at compile time without bytecode manipulation? How does Lombok's @SneakyThrows work?",
    "interviewerIntent": "Testing whether the candidate understands that checked exceptions are purely a compiler fiction and do NOT exist in JVM bytecode.",
    "juniorTrap": "Believing that the JVM runtime refuses to execute or throw a checked exception unless declared on the method signature.",
    "problem": "Java 8 Streams and Lambdas do not accept methods throwing checked exceptions (e.g. Function<T,R> cannot throw IOException).",
    "innerWorking": "At the JVM bytecode level, there is NO distinction between checked and unchecked exceptions (the athrow bytecode instruction handles all Throwable objects identically). The javac compiler enforces checked exceptions. By exploiting Generic Type Erasure, a method can cast any Throwable to an unchecked type <T extends Throwable> and throw it, bypassing the compiler's check completely!",
    "seniorAnswer": [
      "JVM Reality: Checked exceptions exist ONLY in the Java compiler. The JVM runtime treats all exceptions uniformly.",
      "SneakyThrows Mechanism: Using <E extends Throwable> void sneakyThrow(Throwable t) throws E { throw (E) t; } tricks javac into erasing E to RuntimeException.",
      "Functional Boundaries: Used extensively in modern frameworks (Lombok, Vavr, Spring) to wrap checked exceptions without polluting functional pipelines with try-catch blocks."
    ],
    "codeSnippet": "import java.io.IOException;\n\npublic class SneakyThrowsDemo {\n    // Exploiting Generics Type Erasure to bypass javac checked exception check:\n    @SuppressWarnings(\"unchecked\")\n    public static <E extends Throwable> void sneakyThrow(Throwable e) throws E {\n        throw (E) e; // Erased to: throw (Throwable) e; at runtime!\n    }\n\n    // Notice: NO 'throws IOException' on this method!\n    public static void doNastyWork() {\n        sneakyThrow(new IOException(\"Checked IO failure thrown sneakily!\"));\n    }\n\n    public static void main(String[] args) {\n        try {\n            doNastyWork();\n        } catch (Exception e) {\n            System.out.println(\"Caught checked exception without throws clause: \" + e);\n        }\n    }\n}",
    "trap": "Checked exceptions are a compiler construct; bytecode treats all exceptions identically."
  },
  {
    "id": "q-java-try-with-resources-finally",
    "category": "Strings & Exceptions",
    "difficulty": "Senior",
    "title": "Try-With-Resources Exception Suppression vs finally Block Hijacking",
    "question": "What happens if both the try block and AutoCloseable.close() throw exceptions? What happens if finally executes return or throw?",
    "interviewerIntent": "Testing mastery of Java 7+ exception suppression mechanics and dangerous finally control-flow traps.",
    "juniorTrap": "Assuming the close() exception overwrites the try block exception, or not realizing that finally { return; } wipes out in-flight exceptions.",
    "problem": "Crucial root-cause exceptions disappearing from production logs because a finally block returned or threw an auxiliary exception.",
    "innerWorking": "In classic try-finally, an exception in finally suppresses and obliterates the original exception from try. In try-with-resources, the try block exception is PRIMARY; the close() exception is caught and appended to the primary exception's suppressed list via Throwable.addSuppressed(). However, an explicit return in finally will completely silence all exceptions!",
    "seniorAnswer": [
      "Suppression Guarantee: Try-with-resources preserves the primary root cause and attaches close() failures to e.getSuppressed().",
      "Order of Closure: Resources declared in try (R1, R2) are closed in REVERSE order of declaration (R2 first, then R1).",
      "Finally Antipattern: NEVER put return, break, or throw inside a finally block. It unconditionally discards in-flight exceptions and corrupts call stack propagation."
    ],
    "codeSnippet": "class FaultyResource implements AutoCloseable {\n    private final String name;\n    public FaultyResource(String name) { this.name = name; }\n    @Override public void close() { throw new RuntimeException(\"Error closing \" + name); }\n}\n\npublic class SuppressionDemo {\n    public static int dangerousMethod() {\n        try (var r1 = new FaultyResource(\"R1\");\n             var r2 = new FaultyResource(\"R2\")) {\n            throw new IllegalStateException(\"Primary business failure\");\n        } catch (Exception e) {\n            System.out.println(\"Primary: \" + e.getMessage());\n            for (Throwable s : e.getSuppressed()) {\n                System.out.println(\"Suppressed: \" + s.getMessage());\n            }\n            throw e; // Re-throwing...\n        } finally {\n            return 999; // DANGER! Silently swallows and erases the re-thrown exception!\n        }\n    }\n\n    public static void main(String[] args) {\n        System.out.println(\"Result: \" + dangerousMethod()); // Prints 999! No exception thrown!\n    }\n}",
    "trap": "Never place a return or throw statement inside a finally block; it permanently erases in-flight exceptions."
  },
  {
    "id": "q-java-hashmap-treeification-resize",
    "category": "Collections",
    "difficulty": "Staff Level",
    "title": "HashMap Internals: Bitwise Spread (h ^ (h >>> 16)), Resizing & Treeification Rules (8 / 6 / 64)",
    "question": "Walk through HashMap.put() step by step: bitwise hash spread, bucket index calculation, treeification criteria, and power-of-2 resize mechanics.",
    "interviewerIntent": "Evaluating comprehensive understanding of data structure mechanics, CPU-level bitwise math, Red-Black tree conversions, and hash collision defense.",
    "juniorTrap": "Saying a bucket treeifies to a Red-Black tree as soon as the 8th item collides, ignoring the MIN_TREEIFY_CAPACITY = 64 check.",
    "problem": "High collision rates in poorly hashed keys causing O(N) performance degradation down to O(log N).",
    "innerWorking": "1) Hash spread formula: (h = key.hashCode()) ^ (h >>> 16) XORs the top 16 bits with lower 16 bits to ensure higher-order bits influence lower-order bucket indices. 2) Index: index = (n - 1) & hash. 3) Collision: LinkedList node added. When chain length reaches 8, treeifyBin() is called. IF table.length < 64, it RESIZES instead of treeifying! Only if table.length >= 64 does it convert to a Red-Black TreeNode. 4) Untreeify: during resize, if tree count drops to <= 6, it reverts to a LinkedList.",
    "seniorAnswer": [
      "Why Power of 2: Table size is always 2^n so that modulus hash % n can be computed using lightning-fast bitwise AND: (n - 1) & hash.",
      "Resize Mechanics: In Java 8, elements do not need hash recomputation on resize. Because capacity doubles (e.g. 16 -> 32), an element either stays at the exact same index i or moves to i + oldCap, determined purely by (hash & oldCap) == 0.",
      "Treeification Cost: TreeNodes consume roughly double the memory of standard Node entries. The 8/6 hysteresis gap prevents continuous conversion thrashing around the threshold."
    ],
    "codeSnippet": "// Key internal constants in java.util.HashMap:\n// static final int TREEIFY_THRESHOLD = 8;\n// static final int UNTREEIFY_THRESHOLD = 6;\n// static final int MIN_TREEIFY_CAPACITY = 64;\n\n// Bitwise Hash Spread in Java 8:\nstatic final int hash(Object key) {\n    int h;\n    // XORs higher 16 bits into lower 16 bits to prevent poor hash distributions\n    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);\n}\n\n// Power of 2 Index Calculation:\n// index = (table.length - 1) & hash(key);",
    "trap": "A bucket only converts to a Red-Black tree if chain length >= 8 AND total map capacity >= 64; otherwise it resizes."
  },
  {
    "id": "q-java-concurrenthashmap-null-philosophy",
    "category": "Collections",
    "difficulty": "Senior",
    "title": "ConcurrentHashMap vs Collections.synchronizedMap: Lock Striping & Why null is Strictly Forbidden",
    "question": "Why does HashMap permit null keys and values, while ConcurrentHashMap strictly throws NullPointerException for both?",
    "interviewerIntent": "Testing concurrency design philosophy and deep understanding of Doug Lea's concurrent data structure invariants.",
    "juniorTrap": "Saying null was disallowed in ConcurrentHashMap 'by mistake' or 'to keep code cleaner'.",
    "problem": "Concurrent code suffering race conditions when checking for null presence via map.get(key) == null.",
    "innerWorking": "In a single-threaded HashMap, if map.get(key) returns null, you can call map.containsKey(key) to disambiguate whether the key mapped to null or was absent. In a concurrent map, between the call to get() and containsKey(), another thread could have inserted, updated, or removed the key! The state cannot be atomically validated. Doug Lea explicitly disallowed null to eliminate this concurrency ambiguity.",
    "seniorAnswer": [
      "Locking Architecture: Collections.synchronizedMap wraps a standard map in a single mutex (synchronized(mutex)), creating a severe thread contention bottleneck.",
      "ConcurrentHashMap Architecture (Java 8+): Uses Lock-Free CAS (Compare-And-Swap) for empty bucket insertion, and synchronized(firstNodeOfBucket) for bucket-level locking (Node-level striping). It offers full O(1) concurrent reads without locking.",
      "Recursive computeIfAbsent Deadlock: Calling computeIfAbsent recursively on the same bucket hash causes a silent thread deadlock/hang."
    ],
    "codeSnippet": "// Single mutex bottleneck:\nMap<String, String> syncMap = Collections.synchronizedMap(new HashMap<>());\n\n// High concurrency, striped locks, CAS insertion:\nConcurrentHashMap<String, String> chm = new ConcurrentHashMap<>();\n\n// THE NULL TRAP:\ntry {\n    chm.put(\"key\", null); // THROWS NullPointerException!\n    chm.put(null, \"val\"); // THROWS NullPointerException!\n} catch (NullPointerException e) {\n    System.out.println(\"ConcurrentHashMap strictly forbids null keys & values!\");\n}",
    "trap": "ConcurrentHashMap strictly forbids null keys and values to prevent race conditions during key presence verification."
  },
  {
    "id": "q-java-linkedhashmap-lru",
    "category": "Collections",
    "difficulty": "Senior",
    "title": "LinkedHashMap: Building an O(1) In-Memory LRU Cache via accessOrder & removeEldestEntry",
    "question": "How do you implement an O(1) Least Recently Used (LRU) Cache in 10 lines of Java using LinkedHashMap?",
    "interviewerIntent": "Checking knowledge of doubly-linked list ordering inside HashMaps and custom eviction policies.",
    "juniorTrap": "Building a complex custom doubly-linked list and HashMap from scratch or forgetting accessOrder = true.",
    "problem": "Creating an LRU cache where elements are evicted by insertion order rather than actual read/access order.",
    "innerWorking": "LinkedHashMap maintains a doubly-linked list running through all its entries. By default, it orders by insertion-order (accessOrder = false). When instantiated with accessOrder = true, every get() or put() removes the accessed entry from its current position in the linked list and appends it to the tail (most recently used). The hook removeEldestEntry() is evaluated during put() to automatically prune the head (least recently used).",
    "seniorAnswer": [
      "Constructor: new LinkedHashMap<>(capacity, loadFactor, true /* accessOrder */).",
      "Eviction Hook: Override protected boolean removeEldestEntry(Map.Entry eldest) { return size() > maxEntries; }.",
      "Thread Safety: LinkedHashMap is NOT thread-safe. For concurrent LRU, wrap with Collections.synchronizedMap() or use Caffeine Cache."
    ],
    "codeSnippet": "import java.util.*;\n\npublic class LRUCache<K, V> extends LinkedHashMap<K, V> {\n    private final int maxCapacity;\n\n    public LRUCache(int maxCapacity) {\n        // initialCapacity, loadFactor, accessOrder = true (CRUCIAL for LRU!)\n        super(maxCapacity, 0.75f, true);\n        this.maxCapacity = maxCapacity;\n    }\n\n    @Override\n    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {\n        // Automatically evicts the least recently accessed item when capacity is exceeded\n        return size() > maxCapacity;\n    }\n\n    public static void main(String[] args) {\n        LRUCache<Integer, String> cache = new LRUCache<>(2);\n        cache.put(1, \"A\");\n        cache.put(2, \"B\");\n        cache.get(1);      // Access 1 -> Order is now: [2, 1]\n        cache.put(3, \"C\"); // Evicts 2!\n        System.out.println(cache.keySet()); // Prints: [1, 3]\n    }\n}",
    "trap": "Forgetting to set accessOrder = true turns LinkedHashMap into a FIFO queue rather than an LRU cache."
  },
  {
    "id": "q-java-arraylist-vs-linkedlist-cpu",
    "category": "Collections",
    "difficulty": "Senior",
    "title": "ArrayList vs LinkedList: CPU Cache Locality, Spatial Prefetching & The False 'Fast Insertion' Myth",
    "question": "Why does ArrayList outperform LinkedList in almost all real-world benchmarks, even for random insertions in the middle of a list?",
    "interviewerIntent": "Testing hardware sympathy, CPU L1/L2 cache-line prefetching, memory layout, and real-world algorithmic tradeoffs.",
    "juniorTrap": "Claiming LinkedList is faster for insertions because 'it is O(1) pointer swap while ArrayList is O(N) array copy'.",
    "problem": "Junior developers using LinkedList for performance-sensitive lists, inadvertently increasing latency and memory footprint.",
    "innerWorking": "1) Traversal to index: In LinkedList, to insert at index i, you must traverse i pointers from head/tail (O(N) pointer chasing). 2) Hardware Cache Locality: ArrayList elements reside in contiguous memory; the CPU prefetcher loads entire 64-byte cache lines into L1/L2 data cache. LinkedList nodes are scattered across the heap, causing continuous L1/L2 CPU cache misses. 3) Memory Overhead: Each LinkedList node costs 24 bytes (12 header + 4 item + 8 prev/next refs) compared to ArrayList's compact pointer array.",
    "seniorAnswer": [
      "ArrayCopy Speed: ArrayList insertion uses System.arraycopy(), which maps directly to hardware memmove assembly instructions moving blocks of memory in single CPU microcode bursts.",
      "Memory Footprint: LinkedList consumes 4x-6x more RAM than ArrayList for the same number of elements.",
      "Verdict: LinkedList is virtually never the right choice in modern JVMs. If you need double-ended queue operations, use ArrayDeque (circular array backed)."
    ],
    "codeSnippet": "// MEMORY FOOTPRINT COMPARISON (64-bit HotSpot JVM with CompressedOOPs):\n// ArrayList<Integer> holding 1,000,000 elements:\n// ~4MB array buffer + 16-24MB Integer objects\n\n// LinkedList<Integer> holding 1,000,000 elements:\n// 1,000,000 Node objects * 24 bytes = 24MB raw node overhead!\n// Plus 16-24MB Integer objects = ~48MB total (2x-3x higher memory!)\n\n// BENCHMARK REALITY:\n// ArrayList.add(index, elem) with System.arraycopy often beats LinkedList.add(index, elem)\n// up to 100,000 elements because pointer chasing cache misses cost more CPU cycles \n// than hardware-accelerated memory block copies!",
    "trap": "LinkedList's pointer chasing destroys CPU cache prefetching. Always default to ArrayList or ArrayDeque."
  },
  {
    "id": "q-java-comparable-vs-comparator-overflow",
    "category": "Collections",
    "difficulty": "Mid-Senior",
    "title": "Comparable vs Comparator: The Integer Subtraction Underflow Bug (a - b)",
    "question": "Why is (a, b) -> a.value - b.value a dangerous bug in Comparator implementations, and how should it be written?",
    "interviewerIntent": "Checking numerical safety, comparison contract invariants (reflexivity, antisymmetry, transitivity), and modern Comparator composition APIs.",
    "juniorTrap": "Writing (a, b) -> a - b because it's quick and works for small positive integers.",
    "problem": "Sorting routines crashing or producing scrambled order when handling negative numbers or large values.",
    "innerWorking": "If a = Integer.MIN_VALUE (-2,147,483,648) and b = 1, then a - b underflows to +2,147,483,647. The comparator returns a positive integer, claiming that Integer.MIN_VALUE is GREATER than 1! This violates the Comparator transitivity contract and causes TimSort to throw IllegalArgumentException: Comparison method violates its general contract!",
    "seniorAnswer": [
      "Safe Comparison: Use Integer.compare(a.value, b.value) or Comparator.comparingInt(Obj::getValue).",
      "Comparable vs Comparator: Comparable defines the NATURAL ordering intrinsic to the class (compareTo). Comparator defines an EXTERNAL, pluggable ordering strategy.",
      "Null-safe Chaining: Use Comparator.nullsFirst(Comparator.comparing(...)).reversed()."
    ],
    "codeSnippet": "import java.util.*;\n\npublic class ComparatorOverflowBug {\n    public static void main(String[] args) {\n        int a = Integer.MIN_VALUE;\n        int b = 1;\n\n        // BROKEN: Underflow bug\n        int brokenResult = a - b;\n        System.out.println(\"Broken (a - b): \" + brokenResult); // Prints +2147483647 (WRONG!)\n\n        // SAFE:\n        int safeResult = Integer.compare(a, b);\n        System.out.println(\"Safe compare: \" + safeResult);     // Prints -1 (CORRECT!)\n\n        // Modern Idiomatic Java Comparator Composition:\n        Comparator<String> comp = Comparator\n            .nullsLast(Comparator.comparingInt(String::length))\n            .thenComparing(String::compareToIgnoreCase);\n    }\n}",
    "trap": "Never subtract integers in a comparator (a - b); integer overflow/underflow violates transitivity."
  },
  {
    "id": "q-java-fail-fast-vs-fail-safe",
    "category": "Collections",
    "difficulty": "Senior",
    "title": "Fail-Fast vs Fail-Safe Iterators: modCount Verification & CopyOnWrite Snapshots",
    "question": "How does an iterator detect ConcurrentModificationException, and why does CopyOnWriteArrayList not throw it?",
    "interviewerIntent": "Testing knowledge of collection modification tracking (modCount) and thread-safe iterator mechanics.",
    "juniorTrap": "Believing ConcurrentModificationException only occurs in multi-threaded programs.",
    "problem": "Single-threaded code modifying a list inside a standard for-each loop and crashing with ConcurrentModificationException.",
    "innerWorking": "Every collection maintains an internal int modCount incremented on every structural change (add/remove). When an iterator is created, it stores expectedModCount = modCount. On each next(), it verifies if (modCount != expectedModCount) throw new ConcurrentModificationException(). In CopyOnWriteArrayList, the iterator operates on an immutable snapshot of the underlying array at the instant the iterator was created.",
    "seniorAnswer": [
      "Single-Threaded Trigger: Calling list.remove(item) inside a for (Item item : list) loop triggers CME because for-each uses an Iterator under the hood, and list.remove() bypasses the iterator's expectedModCount.",
      "Safe Removal: Use iterator.remove() or collection.removeIf(predicate).",
      "Fail-Safe / Weakly Consistent: CopyOnWriteArrayList, ConcurrentHashMap iterators reflect state at creation time or subsequent changes without throwing CME."
    ],
    "codeSnippet": "import java.util.*;\nimport java.util.concurrent.CopyOnWriteArrayList;\n\npublic class FailFastDemo {\n    public static void main(String[] args) {\n        List<String> list = new ArrayList<>(List.of(\"A\", \"B\", \"C\"));\n\n        // FAIL-FAST TRAP (Single-threaded CME):\n        try {\n            for (String s : list) {\n                if (s.equals(\"B\")) list.remove(s); // Modifies collection directly!\n            }\n        } catch (ConcurrentModificationException e) {\n            System.out.println(\"Fail-Fast: modCount != expectedModCount!\");\n        }\n\n        // CORRECT WAY:\n        list.removeIf(s -> s.equals(\"B\")); // Safe single-pass removal\n\n        // FAIL-SAFE (CopyOnWrite):\n        var cowList = new CopyOnWriteArrayList<>(List.of(\"X\", \"Y\"));\n        for (String s : cowList) {\n            cowList.add(\"Z\"); // Mutates new array copy; iterator reads original snapshot!\n        }\n        System.out.println(\"COW List size: \" + cowList.size()); // Prints 4 safely!\n    }\n}",
    "trap": "Never mutate a collection directly during for-each iteration; use iterator.remove() or removeIf()."
  },
  {
    "id": "q-java-sync-volatile-reentrantlock",
    "category": "Multithreading",
    "difficulty": "Staff Level",
    "title": "synchronized vs volatile vs ReentrantLock: CPU Store Buffers, Mutual Exclusion & Fairness",
    "question": "Compare synchronized, volatile, and ReentrantLock across memory visibility, mutual exclusion, thread parking, and lock acquisition fairness.",
    "interviewerIntent": "Evaluating mastery of the Java Concurrency Model, AQS internals, and lock-free vs monitor-based synchronization.",
    "juniorTrap": "Believing volatile is 'just a lightweight synchronized' that makes compound operations like count++ thread-safe.",
    "problem": "High-concurrency systems suffering from race conditions due to volatile count++, or thread starvation due to unfair synchronized locks.",
    "innerWorking": "1) volatile: Guarantees visibility and ordering (Happens-Before) via StoreLoad memory barriers, but ZERO mutual exclusion. 2) synchronized: Built into JVM HotSpot object headers (Mark Word). Supports lock escalation (Biased -> Lightweight CAS -> Heavyweight OS Mutex). Implicit lock release on exception. 3) ReentrantLock: Java-level synchronizer backed by AQS. Supports timed tryLock(timeout), interruptible locks, fairness policies, and multiple Condition queues (await/signal).",
    "seniorAnswer": [
      "When to use volatile: Single writer, multiple reader status flags (e.g. volatile boolean shutdownRequested).",
      "When to use synchronized: Simple block-level mutual exclusion where JVM lock elision and biased locking optimizations can apply.",
      "When to use ReentrantLock: Advanced features needed: tryLock() to prevent deadlocks, fair queuing to prevent starvation, or multiple condition variables."
    ],
    "codeSnippet": "import java.util.concurrent.locks.ReentrantLock;\n\npublic class ConcurrencyPrims {\n    // 1. volatile: Visibility ONLY (count++ is BROKEN!)\n    private volatile boolean running = true;\n\n    // 2. synchronized: JVM Monitor lock\n    public synchronized void syncMethod() { /* Mutex */ }\n\n    // 3. ReentrantLock: AQS-backed explicit lock with tryLock timeout\n    private final ReentrantLock lock = new ReentrantLock(true); // Fair lock\n    public void safePerform() {\n        if (lock.tryLock()) { // Non-blocking attempt to prevent deadlocks!\n            try {\n                // Critical section\n            } finally {\n                lock.unlock(); // Always unlock in finally!\n            }\n        }\n    }\n}",
    "trap": "volatile does NOT provide mutual exclusion; volatile count++ suffers from lost updates."
  },
  {
    "id": "q-java-wait-notify-synchronization",
    "category": "Multithreading",
    "difficulty": "Senior",
    "title": "wait() / notify() Mechanics: Why Monitor Ownership is Mandatory & Spurious Wakeups",
    "question": "Why must wait() and notify() be called inside a synchronized block, and why must wait() ALWAYS be in a while loop rather than an if statement?",
    "interviewerIntent": "Verifying deep understanding of condition synchronization, the Lost Wakeup race condition, and POSIX thread spurious wakeups.",
    "juniorTrap": "Calling wait() outside synchronized, or wrapping wait() in an if (condition) check.",
    "problem": "Threads freezing forever due to lost notifications, or resuming with unfulfilled conditions after spurious wakeups.",
    "innerWorking": "1) Why synchronized is mandatory: If wait() could be called without holding the lock, a race condition occurs: Thread A checks condition (false), but before calling wait(), Thread B changes condition to true and calls notify(). Thread A then calls wait() and sleeps FOREVER (Lost Wake-up). JVM enforces holding the monitor, throwing IllegalMonitorStateException otherwise. 2) Why while loop: Operating systems allow threads to wake up without notify() (spurious wakeups), or another thread may consume the condition before this thread wakes up.",
    "seniorAnswer": [
      "Lost Wakeup: Atomically releases the monitor and puts the thread to sleep in the Object's Wait Set.",
      "Spurious Wakeup Defense: while (!condition) { wait(); } guarantees the condition predicate is re-evaluated upon awakening.",
      "Modern Alternative: Use java.util.concurrent abstractions (BlockingQueue, CountDownLatch, CompletableFuture) rather than low-level wait/notify."
    ],
    "codeSnippet": "class MessageQueue {\n    private String message;\n    private boolean hasMessage = false;\n\n    public synchronized void produce(String msg) throws InterruptedException {\n        // ALWAYS use while loop to guard against spurious wakeups!\n        while (hasMessage) {\n            wait(); // Releases lock and sleeps\n        }\n        this.message = msg;\n        this.hasMessage = true;\n        notifyAll(); // Wake up waiting consumers\n    }\n\n    public synchronized String consume() throws InterruptedException {\n        // NEVER use 'if (hasMessage)'!\n        while (!hasMessage) {\n            wait();\n        }\n        hasMessage = false;\n        notifyAll();\n        return message;\n    }\n}",
    "trap": "Never call wait() inside an 'if' check; always wrap in a 'while' loop to guard against spurious wakeups."
  },
  {
    "id": "q-java-executors-completablefuture",
    "category": "Multithreading",
    "difficulty": "Staff Level",
    "title": "ExecutorService & CompletableFuture: Thread Pool Starvation & Non-Blocking Async Composition",
    "question": "How does thread pool starvation occur when chaining dependent tasks in a bounded ExecutorService, and how does CompletableFuture prevent it?",
    "interviewerIntent": "Evaluating candidate's architectural ability to design deadlock-free reactive and asynchronous enterprise pipelines.",
    "juniorTrap": "Calling future.get() inside a task running on the same thread pool, blocking threads while waiting for sub-tasks to complete.",
    "problem": "A web service with a 20-thread pool crashes under moderate load with all threads stuck in WAITING state.",
    "innerWorking": "If Parent tasks are submitted to a fixed thread pool of size N, and each Parent task submits a Child task to the SAME pool and blocks via childFuture.get(): when N concurrent requests arrive, all N threads are occupied by Parent tasks waiting for Child tasks. But no threads remain in the pool to execute the Child tasks! The entire system deadlocks permanently (Thread Pool Starvation Deadlock).",
    "seniorAnswer": [
      "Resolution with CompletableFuture: Use asynchronous callbacks (thenApply, thenCompose) which do NOT block worker threads. When the child task finishes, the continuation is scheduled dynamically.",
      "Custom Executors: Always isolate blocking I/O tasks from CPU-bound computation by using dedicated, isolated thread pools.",
      "thenApply vs thenCompose: thenApply maps T -> R (like Stream.map). thenCompose maps T -> CompletableFuture<R> (like Stream.flatMap), preventing nested CompletableFuture<CompletableFuture<R>>."
    ],
    "codeSnippet": "// BAD: Thread Pool Starvation Deadlock\nExecutorService pool = Executors.newFixedThreadPool(2);\npool.submit(() -> {\n    // Submits sub-task to the SAME pool and blocks:\n    Future<String> sub = pool.submit(() -> \"Child Result\");\n    return sub.get(); // BLOCKS! If 2 parent tasks run simultaneously -> PERMANENT DEADLOCK!\n});\n\n// GOOD: Non-blocking CompletableFuture chaining\nCompletableFuture.supplyAsync(() -> fetchUserData(userId), customIoPool)\n    .thenCompose(user -> CompletableFuture.supplyAsync(() -> fetchOrders(user), customIoPool))\n    .thenApply(orders -> processOrders(orders))\n    .thenAccept(result -> renderUI(result))\n    .exceptionally(ex -> {\n        log.error(\"Async pipeline failed\", ex);\n        return null;\n    });",
    "trap": "Never call .get() or block inside tasks executed by the same thread pool; it causes permanent thread pool starvation."
  },
  {
    "id": "q-java-deadlock-conditions-prevention",
    "category": "Multithreading",
    "difficulty": "Senior",
    "title": "Deadlock: The 4 Coffman Conditions, Lock Ordering & Timed tryLock Backoff",
    "question": "What are the 4 Coffman conditions required for a deadlock, and how do you programmatically prevent or break them?",
    "interviewerIntent": "Testing fundamental concurrency theory and practical distributed/multithreaded lock ordering patterns.",
    "juniorTrap": "Believing deadlocks can be resolved by increasing thread pool sizes or CPU resources.",
    "problem": "Production microservices freezing due to circular wait conditions when transferring money between accounts.",
    "innerWorking": "The 4 Coffman conditions: 1) Mutual Exclusion (exclusive resource control). 2) Hold and Wait (holding one lock while requesting another). 3) No Preemption (locks cannot be forcibly confiscated). 4) Circular Wait (Thread 1 waits for Thread 2, which waits for Thread 1). Eliminating ANY ONE condition guarantees deadlock freedom.",
    "seniorAnswer": [
      "Global Lock Ordering: Break Circular Wait by enforcing a strict global acquisition order (e.g. acquire locks by comparing System.identityHashCode(account) or account.getId()).",
      "Timed Preemption: Use ReentrantLock.tryLock(timeout, unit) to break No Preemption. If acquiring the second lock times out, release the first lock, back off randomly, and retry.",
      "Deadlock Detection: JVM jstack or ThreadMXBean.findDeadlockedThreads() can identify active cycle graphs in production."
    ],
    "codeSnippet": "public class SafeTransfer {\n    // Enforcing strict global lock ordering breaks Circular Wait:\n    public static void transfer(Account from, Account to, double amount) {\n        Account firstLock = from.getId() < to.getId() ? from : to;\n        Account secondLock = from.getId() < to.getId() ? to : from;\n\n        synchronized (firstLock) {\n            synchronized (secondLock) {\n                from.debit(amount);\n                to.credit(amount);\n            }\n        }\n    }\n}",
    "trap": "Always acquire multiple locks in a globally consistent order (e.g. sorted by ID) to break the circular wait condition."
  },
  {
    "id": "q-java-threadlocal-leaks",
    "category": "Multithreading",
    "difficulty": "Staff Level",
    "title": "ThreadLocal Internals: ThreadLocalMap, WeakReference Keys & Thread Pool Memory Leaks",
    "question": "How does ThreadLocal work internally, why are its Map keys WeakReferences, and how does it cause severe memory leaks in Web application servers?",
    "interviewerIntent": "Testing JVM thread memory model, garbage collection reference reachability, and thread pool lifecycle management.",
    "juniorTrap": "Assuming that because ThreadLocalMap uses WeakReference keys, the thread-local values are automatically garbage collected.",
    "problem": "Tomcat / Spring Boot application servers running out of memory (OutOfMemoryError) or leaking SecurityContext across user HTTP requests.",
    "innerWorking": "Each Thread object has an internal field: ThreadLocal.ThreadLocalMap threadLocals. The ThreadLocalMap uses WeakReference<ThreadLocal<?>> for its entry keys. When the ThreadLocal instance itself is dereferenced, the key is GC'd and becomes null. HOWEVER, the Entry value is a STRONG reference! Because threads in a web server thread pool NEVER die, the Entry value remains strongly reachable from Thread -> ThreadLocalMap -> Entry -> Value indefinitely!",
    "seniorAnswer": [
      "The Leak: Thread pool threads live forever. Even if the ThreadLocal variable is unreachable, its value object remains trapped in the thread's map.",
      "Cross-User Data Pollution: If Thread A processes User 1's request and sets ThreadLocal<User>, when User 2's request reuses Thread A, User 2 could inherit User 1's security context if not cleaned up!",
      "The Invariant Fix: ALWAYS invoke threadLocal.remove() inside a finally block."
    ],
    "codeSnippet": "public class SecurityContextFilter {\n    private static final ThreadLocal<UserContext> contextHolder = new ThreadLocal<>();\n\n    public void doFilter(Request req, Response res) {\n        try {\n            UserContext ctx = authenticate(req);\n            contextHolder.set(ctx);\n            proceed(req, res);\n        } finally {\n            // MANDATORY IN THREAD POOLS!\n            // Prevents both Memory Leaks AND Cross-Tenant Data Contamination!\n            contextHolder.remove();\n        }\n    }\n}",
    "trap": "ThreadLocalMap Entry keys are Weak, but Values are Strong. Always call .remove() in a finally block."
  },
  {
    "id": "q-java-callable-vs-runnable",
    "category": "Multithreading",
    "difficulty": "Mid-Senior",
    "title": "Callable<V> vs Runnable: Checked Exception Signatures & Future Return Types",
    "question": "What are the core functional differences between Runnable and Callable, and how does ExecutorService adapt between them?",
    "interviewerIntent": "Checking knowledge of functional interfaces, exception handling across thread boundaries, and concurrent task abstraction.",
    "juniorTrap": "Trying to throw checked exceptions from Runnable.run() or trying to directly return values from Runnable.",
    "problem": "Needing to return calculated data from an asynchronous background thread while cleanly handling checked exceptions.",
    "innerWorking": "Runnable: public void run() — returns nothing and cannot throw checked exceptions. Callable<V>: public V call() throws Exception — returns a generic value V and is declared to throw checked Exception. FutureTask<V> implements RunnableFuture<V>, adapting Callable to run on an underlying thread and capturing any thrown exception to re-throw inside future.get() wrapped in ExecutionException.",
    "seniorAnswer": [
      "Signature: Callable returns T and throws Exception; Runnable returns void and cannot throw checked exceptions.",
      "Future Interaction: When submitting Callable to an ExecutorService, future.get() returns the computed value or unpacks exceptions.",
      "Adapters: Executors.callable(runnable, result) adapts a Runnable to a Callable."
    ],
    "codeSnippet": "import java.util.concurrent.*;\n\npublic class CallableDemo {\n    public static void main(String[] args) throws Exception {\n        ExecutorService pool = Executors.newSingleThreadExecutor();\n\n        Callable<Integer> task = () -> {\n            if (Math.random() > 0.5) throw new java.io.IOException(\"Network fail\");\n            return 42; // Returns typed value!\n        };\n\n        Future<Integer> future = pool.submit(task);\n        try {\n            Integer result = future.get(); // Blocks until done\n            System.out.println(\"Result: \" + result);\n        } catch (ExecutionException e) {\n            // Checked IOException is captured and wrapped inside ExecutionException:\n            System.out.println(\"Underlying cause: \" + e.getCause());\n        } finally {\n            pool.shutdown();\n        }\n    }\n}",
    "trap": "Runnable cannot return values or throw checked exceptions; Callable returns generics and throws Exception."
  },
  {
    "id": "q-java-atomic-vs-sync-counter",
    "category": "Multithreading",
    "difficulty": "Staff Level",
    "title": "AtomicInteger vs synchronized Counter: CAS Loops, Cache Line Bouncing & LongAdder",
    "question": "Why does AtomicInteger outperform synchronized under low-to-medium contention, but collapse under ultra-high multi-core contention? How does LongAdder fix it?",
    "interviewerIntent": "Testing hardware cache coherency (MESI protocol), CPU Compare-And-Swap (CAS) spin loops, and striping solutions.",
    "juniorTrap": "Assuming AtomicInteger is always the fastest counter implementation regardless of thread count.",
    "problem": "High-throughput telemetry metric counters causing CPU spikes due to CAS loop spinning on a single memory address.",
    "innerWorking": "AtomicInteger uses CPU-native CAS (cmpxchg on x86) in an optimistic lock-free spin loop. Under intense contention across 64+ cores, multiple threads repeatedly attempt to CAS the same single memory address. When one thread succeeds, all other CPU cores experience L1/L2 cache-line invalidation (Cache Line Bouncing). Threads spin continuously in while(!compareAndSet()), burning 100% CPU. LongAdder solves this by maintaining a striped array of Cell objects (@Contended to prevent false sharing) where threads hash to independent cells and sum them up only on read.",
    "seniorAnswer": [
      "AtomicInteger: Great for low-to-medium contention or when atomic read-and-update return values are immediately needed.",
      "Synchronized: High overhead due to thread descheduling and OS context switching.",
      "LongAdder (Java 8+): Striped internal counters. Eliminates cache-line bouncing by allowing threads to increment distinct memory cells. Up to 10x faster under extreme write contention."
    ],
    "codeSnippet": "import java.util.concurrent.atomic.AtomicInteger;\nimport java.util.concurrent.atomic.LongAdder;\n\npublic class HighContentionCounter {\n    // Slower under extreme contention (CAS spin loop + cache line bouncing):\n    private final AtomicInteger atomicCounter = new AtomicInteger();\n\n    // 10x Faster under 64+ concurrent threads (Striped cells):\n    private final LongAdder highThroughputCounter = new LongAdder();\n\n    public void increment() {\n        // Distributes increments across independent CPU cache lines:\n        highThroughputCounter.increment(); \n    }\n\n    public long getTotal() {\n        // Aggregates across all striped cells:\n        return highThroughputCounter.sum();\n    }\n}",
    "trap": "Under massive multi-threaded contention, AtomicInteger burns CPU in CAS spin-loops. Use LongAdder for high-throughput counters."
  },
  {
    "id": "q-java-happens-before-dcl",
    "category": "Multithreading",
    "difficulty": "Staff Level",
    "title": "Happens-Before Relationship & Double-Checked Locking: Instruction Reordering 1-3-2",
    "question": "Explain the exact bytecode instructions of new Object() and why omitting volatile in Double-Checked Locking publishes partially constructed objects.",
    "interviewerIntent": "Testing precise understanding of the Java Memory Model (JSR-133), JIT out-of-order execution, and hardware memory barriers.",
    "juniorTrap": "Thinking that synchronized protects the entire creation, forgetting that the outer if (instance == null) check is completely UNSYNCHRONIZED.",
    "problem": "Production crashes where threads read uninitialized, null, or zeroed fields from a singleton that was presumed fully constructed.",
    "innerWorking": "Object creation compiles to 3 bytecode instructions: 1) new #2 (allocate heap memory), 2) invokespecial #3 (execute constructor body), 3) putstatic #4 (assign address to reference). Under as-if-serial rules, the JIT/CPU can reorder instructions to: 1 -> 3 -> 2. If Thread A executes 1 and 3, instance is non-null before constructor 2 finishes! Thread B checks outer if (instance == null), sees non-null, and immediately consumes the half-baked object.",
    "seniorAnswer": [
      "The Volatile Fix: Declaring private static volatile Singleton INSTANCE forces a StoreStore barrier before the write and a StoreLoad barrier after it, strictly forbidding reordering step 3 before step 2.",
      "Happens-Before Guarantee: A write to a volatile variable happens-before every subsequent read of that variable.",
      "Holder Idiom Alternative: Use the Bill Pugh Initialization-on-demand holder idiom: static class Holder { static final Singleton INSTANCE = new Singleton(); } which relies on thread-safe JVM ClassLoader initialization locks without volatile overhead."
    ],
    "codeSnippet": "// Thread-Safe Double-Checked Locking (DCL)\npublic class SafeDCLSingleton {\n    // 'volatile' is MANDATORY to prevent 1-3-2 instruction reordering!\n    private static volatile SafeDCLSingleton INSTANCE;\n\n    private SafeDCLSingleton() {\n        // Complex state initialization\n    }\n\n    public static SafeDCLSingleton getInstance() {\n        SafeDCLSingleton local = INSTANCE; // Read volatile once into CPU register\n        if (local == null) {\n            synchronized (SafeDCLSingleton.class) {\n                local = INSTANCE;\n                if (local == null) {\n                    INSTANCE = local = new SafeDCLSingleton();\n                }\n            }\n        }\n        return local;\n    }\n}",
    "trap": "Without volatile, CPU instruction reordering publishes a non-null reference before the constructor runs."
  },
  {
    "id": "q-java-stream-pipeline-fusion",
    "category": "Java 8+ Features",
    "difficulty": "Senior",
    "title": "Stream Pipeline: Loop Fusion, Stateless vs Stateful Operations & Stream Re-Use Exception",
    "question": "How does the Stream engine execute intermediate operations under loop fusion, and why does attempting to reuse a Stream throw an IllegalStateException?",
    "interviewerIntent": "Testing deep understanding of lazy evaluation, internal iteration pipelines, and stream terminal consumption.",
    "juniorTrap": "Believing each intermediate operation (.filter(), .map()) creates a full intermediate collection in memory.",
    "problem": "Developers expecting streams to execute intermediate steps before terminal operations, or caching Stream instances for multiple reads.",
    "innerWorking": "Streams are lazy pull-based pipelines. Intermediate operations do zero work until a terminal operation (collect, forEach, reduce) is invoked. Loop fusion combines chained stateless operations (filter, map) into a single pass over the elements without allocating intermediate buffers. Stateful operations (sorted, distinct) break loop fusion because they must process all upstream elements before emitting downstream. Once a terminal operation completes, the stream is marked consumed; reusing it throws IllegalStateException.",
    "seniorAnswer": [
      "Stateless vs Stateful: filter() and map() are stateless (process 1 element at a time). sorted() and distinct() are stateful (must buffer data into temporary arrays).",
      "Short-Circuiting: findFirst(), anyMatch(), limit(n) stop upstream iteration as soon as conditions are met.",
      "Stream Lifecycle: Streams cannot be stored or reused. To reuse, create a Supplier<Stream<T>>."
    ],
    "codeSnippet": "import java.util.List;\nimport java.util.stream.Stream;\n\npublic class StreamFusionDemo {\n    public static void main(String[] args) {\n        List<String> names = List.of(\"Alice\", \"Bob\", \"Charlie\", \"David\");\n\n        // Loop Fusion in Action:\n        // Elements are processed vertically one-by-one, NOT horizontally in batches!\n        names.stream()\n            .filter(s -> {\n                System.out.println(\"Filter: \" + s);\n                return s.length() > 3;\n            })\n            .map(s -> {\n                System.out.println(\"Map: \" + s);\n                return s.toUpperCase();\n            })\n            .findFirst(); // Short-circuits! \"Charlie\" and \"David\" are NEVER evaluated!\n\n        // STREAM RE-USE TRAP:\n        Stream<String> stream = names.stream();\n        stream.forEach(System.out::println);\n        // stream.forEach(System.out::println); // THROWS: IllegalStateException!\n    }\n}",
    "trap": "Streams cannot be reused once consumed; intermediate operations do zero work until a terminal operation is called."
  },
  {
    "id": "q-java-optional-orelse-vs-orelseget",
    "category": "Java 8+ Features",
    "difficulty": "Senior",
    "title": "Optional Best Practices: orElse() Eager Evaluation vs orElseGet() Lazy Supplier",
    "question": "Why should you almost never pass a method call to orElse(), and what are the strict anti-patterns when using Optional?",
    "interviewerIntent": "Evaluating functional API hygiene, eager vs lazy evaluation tradeoffs, and performance vigilance.",
    "juniorTrap": "Using orElse(fetchFromDb()) assuming it will only execute when the Optional is empty.",
    "problem": "High database loads and unintended side effects because orElse() executes its parameter eagerly on EVERY single invocation.",
    "innerWorking": "Method arguments in Java are evaluated EAGERLY before method entry. When calling opt.orElse(computeDefault()), computeDefault() is evaluated immediately on the caller stack, regardless of whether opt contains a value or not! In contrast, opt.orElseGet(() -> computeDefault()) accepts a Supplier functional interface and evaluates it LAZILY only when opt.isEmpty().",
    "seniorAnswer": [
      "orElse vs orElseGet: Use orElse(constantValue) only for pre-computed constants (e.g. \"UNKNOWN\"). Use orElseGet(Supplier) whenever computing fallback values involves method calls or I/O.",
      "Optional Anti-Patterns: 1) Calling opt.get() without isPresent() (use ifPresent, map, or orElseThrow). 2) Passing Optional as a method parameter (pollutes signatures with null checks). 3) Storing Optional in fields or Collections (Optional is not Serializable).",
      "Primary Purpose: Optional was created strictly as a method return type to represent possible absence without null."
    ],
    "codeSnippet": "import java.util.Optional;\n\npublic class OptionalTrap {\n    static String expensiveDatabaseQuery() {\n        System.out.println(\"🚨 CRITICAL: Database queried!\");\n        return \"fallback\";\n    }\n\n    public static void main(String[] args) {\n        Optional<String> cachedUser = Optional.of(\"Aadarsh\");\n\n        System.out.println(\"--- Testing orElse ---\");\n        // EAGER: Queries database even though user IS ALREADY PRESENT!\n        String r1 = cachedUser.orElse(expensiveDatabaseQuery());\n\n        System.out.println(\"--- Testing orElseGet ---\");\n        // LAZY: Supplier is NEVER executed because cachedUser is present!\n        String r2 = cachedUser.orElseGet(() -> expensiveDatabaseQuery());\n    }\n}",
    "trap": "orElse() evaluates its parameter eagerly even when the Optional has a value; always use orElseGet() for method calls."
  },
  {
    "id": "q-java-functional-interfaces-sam",
    "category": "Java 8+ Features",
    "difficulty": "Mid-Senior",
    "title": "Functional Interfaces & SAM: @FunctionalInterface Rules, Default Methods & Lambda Types",
    "question": "Can an interface with 10 methods still be a @FunctionalInterface? Explain the Single Abstract Method (SAM) rule.",
    "interviewerIntent": "Testing precise understanding of Java functional typing and bytecode lambda invocation.",
    "juniorTrap": "Believing an interface can only have exactly 1 total method to be functional.",
    "problem": "Developers unsure whether adding default or static utility methods invalidates an interface for lambda expressions.",
    "innerWorking": "A functional interface has exactly ONE abstract method (Single Abstract Method - SAM). It can contain ANY number of default methods, static methods, and public abstract methods that override methods from java.lang.Object (such as boolean equals(Object obj)). The @FunctionalInterface annotation is optional, but instructs javac to generate a compile error if the interface violates SAM criteria.",
    "seniorAnswer": [
      "SAM Rule: Only non-Object abstract methods count toward the single abstract method total.",
      "Default / Static: Can have unlimited default and static methods without breaking functional compatibility.",
      "Lambda Dispatch: Lambdas do NOT compile to anonymous inner classes; they compile to invokedynamic bytecode instructions using LambdaMetafactory for zero-classloader overhead."
    ],
    "codeSnippet": "@FunctionalInterface\npublic interface SmartProcessor<T, R> {\n    // 1. The SINGLE Abstract Method (SAM):\n    R process(T input);\n\n    // 2. Default methods do NOT count toward SAM:\n    default SmartProcessor<T, R> logBefore() {\n        return input -> {\n            System.out.println(\"Processing: \" + input);\n            return process(input);\n        };\n    }\n\n    // 3. Static helper methods do NOT count:\n    static <T> SmartProcessor<T, T> identity() {\n        return t -> t;\n    }\n\n    // 4. Object public methods do NOT count:\n    @Override\n    boolean equals(Object obj);\n}",
    "trap": "Functional interfaces require exactly ONE abstract method; default, static, and Object overrides do not count."
  },
  {
    "id": "q-java-method-references-dispatch",
    "category": "Java 8+ Features",
    "difficulty": "Senior",
    "title": "Method References: Static vs Bound vs Unbound Instance References",
    "question": "Explain the difference between bound instance references (inst::method) and unbound instance references (Class::method).",
    "interviewerIntent": "Testing how lambdas map parameter arguments to method receivers under the hood.",
    "juniorTrap": "Getting confused why String::compareToIgnoreCase takes 2 arguments when compareToIgnoreCase is an instance method taking 1 argument.",
    "problem": "Compilation errors when trying to pass method references to higher-order functional interfaces.",
    "innerWorking": "There are 4 kinds of method references: 1) Static: Math::max -> (x, y) -> Math.max(x, y). 2) Bound Instance: System.out::println -> x -> System.out.println(x) (receiver is bound to specific instance). 3) Unbound Instance: String::length -> s -> s.length() (the first argument to the lambda becomes the instance receiver on which the method is called!). 4) Constructor: ArrayList::new -> () -> new ArrayList().",
    "seniorAnswer": [
      "Unbound Receiver Binding: In (s1, s2) -> s1.compareToIgnoreCase(s2), the method reference is written String::compareToIgnoreCase. The first parameter s1 acts as the target receiver.",
      "Performance: Method references are cleaner syntactic sugar for lambdas and are optimized identically via invokedynamic bootstrap calls."
    ],
    "codeSnippet": "import java.util.function.*;\n\npublic class MethodRefDemo {\n    public static void main(String[] args) {\n        // 1. Static Reference:\n        Function<String, Integer> f1 = Integer::parseInt; // s -> Integer.parseInt(s)\n\n        // 2. Bound Instance Reference (receiver is 'System.out'):\n        Consumer<String> f2 = System.out::println;        // s -> System.out.println(s)\n\n        // 3. Unbound Instance Reference:\n        // Notice: takes TWO strings, first is target receiver!\n        BiPredicate<String, String> f3 = String::equalsIgnoreCase; \n        // Equivalent to: (s1, s2) -> s1.equalsIgnoreCase(s2)\n\n        // 4. Constructor Reference:\n        Supplier<StringBuilder> f4 = StringBuilder::new;\n    }\n}",
    "trap": "In unbound instance references (Class::method), the first lambda parameter becomes the target object receiver."
  },
  {
    "id": "q-java-completablefuture-exceptions",
    "category": "Java 8+ Features",
    "difficulty": "Staff Level",
    "title": "CompletableFuture Exception Handling: exceptionally() vs handle() vs whenComplete()",
    "question": "How do exceptionally(), handle(), and whenComplete() differ in error propagation, result transformation, and thread execution?",
    "interviewerIntent": "Evaluating mastery of asynchronous resilience patterns, error recovery, and non-blocking pipeline completion.",
    "juniorTrap": "Thinking exceptionally() halts pipeline execution instead of providing a fallback value to downstream stages.",
    "problem": "Uncaught asynchronous exceptions disappearing silently into ForkJoinPool background threads without alerting.",
    "innerWorking": "1) exceptionally(fn): Catches exceptions and returns a fallback value of type T. Subsequent stages receive this fallback value as if nothing went wrong. 2) handle(biFn): Always executes (success or failure) receiving (result, exception). Can transform the result or recover to a different type R. 3) whenComplete(biConsumer): A terminal observer hook receiving (result, exception). Does NOT transform data; simply passes the original result or re-throws the original exception downstream.",
    "seniorAnswer": [
      "handle() vs exceptionally(): Use handle() when you want to transform either the successful value or the exception into a unified outcome. Use exceptionally() for simple fallback defaults.",
      "Thread Switching: exceptionallyAsync() and handleAsync() allow shifting recovery logic to a dedicated fallback thread pool.",
      "Missing Logging: If neither get(), join(), nor exception handlers are registered, an uncaught exception inside a CompletableFuture is silently swallowed!"
    ],
    "codeSnippet": "import java.util.concurrent.CompletableFuture;\n\npublic class AsyncExceptionPipeline {\n    public static void main(String[] args) {\n        CompletableFuture<String> pipeline = CompletableFuture.supplyAsync(() -> {\n            if (true) throw new RuntimeException(\"Payment Gateway Timeout\");\n            return \"SUCCESS\";\n        })\n        // 1. exceptionally: Recovery Fallback\n        .exceptionally(ex -> {\n            System.out.println(\"Recovering from error: \" + ex.getMessage());\n            return \"FALLBACK_PAYMENT_QUEUED\"; // Recovers downstream!\n        })\n        // 2. handle: BiFunction transforming result or error\n        .handle((res, ex) -> {\n            if (ex != null) return \"FAILED_RECOVERY\";\n            return \"FINAL_STATUS: \" + res;\n        })\n        // 3. whenComplete: Side-effect observer (logging)\n        .whenComplete((res, ex) -> {\n            System.out.println(\"Pipeline finished with: \" + res);\n        });\n\n        System.out.println(pipeline.join());\n    }\n}",
    "trap": "Uncaught exceptions in CompletableFuture are silently swallowed unless joined, chained with handle/exceptionally, or logged."
  },
  {
    "id": "q-java-records-sealed-pattern",
    "category": "Java 8+ Features",
    "difficulty": "Senior",
    "title": "Modern Java: Records, Sealed Classes & Exhaustive Pattern Matching Without default",
    "question": "Why should you avoid adding a 'default:' branch when pattern matching over a sealed class hierarchy in modern Java?",
    "interviewerIntent": "Testing familiarity with modern Java (Java 17 / 21) algebraic data types (sum and product types) and compile-time exhaustiveness checking.",
    "juniorTrap": "Adding default: out of old habit, which completely disables compiler warnings when new subclasses are introduced.",
    "problem": "Adding a new transaction type to a sealed hierarchy does not trigger compile-time errors in business logic because default: silently handles it.",
    "innerWorking": "Sealed classes (permits clause) restrict subclassing to an explicit whitelist known at compile time. When used with Java 21 Pattern Matching for switch, the javac compiler performs Exhaustiveness Analysis: it verifies that all permitted subtypes are covered. If you omit default:, adding a new subclass in the future causes a COMPILE ERROR at all switch sites, forcing developers to implement the new case explicitly!",
    "seniorAnswer": [
      "Records: Pure product types. Automatically generate canonical constructor, private final fields, equals, hashCode, and toString. Cannot extend classes, but can implement interfaces.",
      "Sealed Hierarchies: Pure sum types. sealed interface Payment permits CreditCard, PayPal, Crypto {}.",
      "Compiler Invariant: Pattern switch over sealed hierarchies is exhaustively checked. Adding default: destroys this architectural safety net."
    ],
    "codeSnippet": "// Algebraic Data Type in Modern Java:\nsealed interface PaymentResult permits Success, Failure, Pending {}\n\nrecord Success(String txId, double amount) implements PaymentResult {}\nrecord Failure(String errorCode, String reason) implements PaymentResult {}\nrecord Pending(String trackingUrl) implements PaymentResult {}\n\npublic class ModernJavaPatternDemo {\n    public static String handlePayment(PaymentResult result) {\n        // NO 'default:' branch! Compiler enforces exhaustiveness!\n        // If a new record 'Refunded' is added to PaymentResult, this line FAILS TO COMPILE!\n        return switch (result) {\n            case Success s -> \"Processed \" + s.amount() + \" with TX: \" + s.txId();\n            case Failure f -> \"Failed: \" + f.reason() + \" (Code: \" + f.errorCode() + \")\";\n            case Pending p -> \"Pending: \" + p.trackingUrl();\n        };\n    }\n}",
    "trap": "Never add a 'default:' branch to a sealed pattern matching switch; it destroys compiler exhaustiveness checking."
  },
  {
    "id": "q-java-virtual-threads-pinning",
    "category": "Java 8+ Features",
    "difficulty": "Staff Level",
    "title": "Java 21 Virtual Threads (Loom): Carrier Thread Pinning Trap (synchronized vs ReentrantLock)",
    "question": "What is Virtual Thread Carrier Pinning, why does synchronized cause it, and how does ReentrantLock fix it?",
    "interviewerIntent": "Evaluating knowledge of Project Loom, M:N user-space scheduling, OS carrier threads, and migration gotchas for Java 21.",
    "juniorTrap": "Assuming Virtual Threads make all legacy multithreaded code magically 100x faster without checking synchronization constructs.",
    "problem": "A high-concurrency microservice upgraded to Java 21 Virtual Threads experiences total throughput collapse and server hangs under load.",
    "innerWorking": "Virtual threads run mounted on an underlying pool of OS carrier threads (ForkJoinPool). When a virtual thread executes blocking I/O (e.g. Thread.sleep, socket read), it unmounts from the carrier thread so other virtual threads can run. However, if the blocking call occurs inside a synchronized block or native method, the virtual thread is PINNED to its carrier thread. The carrier thread cannot unmount. If all carrier threads get pinned, the entire system stalls.",
    "seniorAnswer": [
      "Pinning Cause: JVM monitor implementation ties the lock state directly to the OS carrier thread stack frame.",
      "Solution: Replace synchronized blocks with ReentrantLock around blocking I/O operations.",
      "Diagnostics: Run with -Djdk.tracePinnedThreads=full to detect pinned threads in production.",
      "Pool Rule: NEVER pool virtual threads (e.g. with Executors.newFixedThreadPool). Virtual threads are cheap and short-lived; spawn new ones freely using Executors.newVirtualThreadPerTaskExecutor()."
    ],
    "codeSnippet": "import java.util.concurrent.locks.ReentrantLock;\n\npublic class VirtualThreadPinningTrap {\n    private final Object monitorLock = new Object();\n    private final ReentrantLock reentrantLock = new ReentrantLock();\n\n    // BAD (Pins the OS Carrier Thread!):\n    public void badTask() {\n        synchronized (monitorLock) {\n            try {\n                // Blocking I/O inside synchronized pins carrier thread!\n                Thread.sleep(1000); \n            } catch (InterruptedException e) {}\n        }\n    }\n\n    // GOOD (Safely unmounts carrier thread!):\n    public void goodTask() {\n        reentrantLock.lock();\n        try {\n            // Virtual thread cleanly unmounts; carrier thread executes other tasks!\n            Thread.sleep(1000); \n        } catch (InterruptedException e) {}\n        finally {\n            reentrantLock.unlock();\n        }\n    }\n}",
    "trap": "synchronized blocks pin Java 21 Virtual Threads to OS carrier threads during blocking I/O. Use ReentrantLock instead."
  },
  {
    "id": "q-java-jvm-memory-architecture",
    "category": "JVM Internals & Memory",
    "difficulty": "Staff Level",
    "title": "JVM Memory Architecture: Heap, Thread Stacks, Metaspace & Off-Heap Direct Memory",
    "question": "Break down the exact memory regions of HotSpot JVM: Heap, Stacks, Metaspace, CodeCache, and Direct Off-Heap Native Memory.",
    "interviewerIntent": "Testing whether the candidate can diagnose complex Linux memory issues where a container gets OOMKilled despite heap usage being low.",
    "juniorTrap": "Assuming the JVM only consumes memory configured by -Xmx.",
    "problem": "A Kubernetes pod with memory limit 4GB and -Xmx2g gets SIGKILL (OOMKilled) by the Linux kernel.",
    "innerWorking": "Total JVM Memory = Heap (-Xmx) + Metaspace + Thread Stacks (numThreads * -Xss) + CodeCache + Direct ByteBuffers + GC Native Overhead + JIT Buffers. Metaspace stores class metadata in native memory (unbounded by default). Thread stacks consume 1MB each by default (-Xss1m). Off-heap memory (ByteBuffer.allocateDirect) bypasses the JVM heap and GC entirely, allocated directly from OS virtual memory.",
    "seniorAnswer": [
      "Metaspace: Replaced PermGen in Java 8. Resides in native memory. Bound it with -XX:MaxMetaspaceSize to prevent unbounded memory growth.",
      "Thread Stacks: 1,000 threads with default 1MB stack = 1GB of raw native RAM outside the heap.",
      "Off-Heap / Netty: High-performance frameworks use Unsafe / DirectByteBuffer for zero-copy socket I/O. Track with -XX:NativeMemoryTracking=summary."
    ],
    "codeSnippet": "// DIRECT OFF-HEAP MEMORY:\n// Allocates 1GB outside JVM heap via OS malloc()\nByteBuffer directBuffer = ByteBuffer.allocateDirect(1024 * 1024 * 1024);\n\n// LINUX OOMKILLED FORMULA:\n// Max RAM = Heap (-Xmx)\n//         + Thread Stacks (Threads * -Xss)\n//         + Metaspace (-XX:MaxMetaspaceSize)\n//         + Direct Memory (-XX:MaxDirectMemorySize)\n//         + JIT CodeCache (-XX:ReservedCodeCacheSize)\n//         + GC native bookkeeping (Remembered Sets, Mark Stacks)\n// If Total > K8s Container Limit -> Linux Kernel triggers OOMKiller (SIGKILL 137)!",
    "trap": "The JVM consumes significant native memory outside the heap; setting -Xmx equal to container memory guarantees OOMKill."
  },
  {
    "id": "q-java-gc-algorithms-comparison",
    "category": "JVM Internals & Memory",
    "difficulty": "Staff Level",
    "title": "Garbage Collection Comparison: G1 Region-Based vs ZGC Low-Latency Load Barriers",
    "question": "How does ZGC achieve sub-millisecond pause times regardless of heap size, and how does it compare mechanically to G1 GC?",
    "interviewerIntent": "Evaluating production GC tuning skills, concurrent marking/relocation algorithms, and colored pointer mechanics.",
    "juniorTrap": "Recommending Parallel GC for low-latency web microservices or believing ZGC has longer stop-the-world pauses on 1TB heaps.",
    "problem": "A high-frequency trading or real-time banking system experiencing 500ms Stop-The-World (STW) pauses during minor GC cycles.",
    "innerWorking": "G1 GC divides the heap into 2,048 equal regions (Eden, Survivor, Old, Humongous). It uses incremental copying and target pause times (-XX:MaxGCPauseMillis), but still requires Stop-The-World pauses during phase boundaries. ZGC (Z Garbage Collector) performs virtually ALL phases concurrently (concurrent mark, concurrent prepare for relocate, concurrent relocate) using Colored Pointers (metadata encoded in 64-bit reference address bits) and Load Barriers (JIT-inserted read intercepts that self-heal old pointers on the fly).",
    "seniorAnswer": [
      "Colored Pointers: ZGC encodes Marked0, Marked1, and Remapped flags directly into the upper bits of reference addresses.",
      "Load Barrier: When application code dereferences an object during relocation, the load barrier detects the stale address, relocates the object immediately, updates the reference, and continues without pausing the world.",
      "Tradeoff: ZGC optimizes for ultra-low latency (<1ms pause) at the expense of ~2-5% throughput overhead from load barriers."
    ],
    "codeSnippet": "// GC Decision Matrix:\n// 1. ZGC (-XX:+UseZGC):\n//    Use when: Sub-millisecond pause time is critical (<1ms), heaps from 16MB to 16TB.\n//    Cost: Slight throughput penalty (~2-5%) due to JIT load barriers.\n\n// 2. G1 GC (-XX:+UseG1GC):\n//    Use when: Balanced throughput and latency, heap size > 4GB, pause targets ~200ms.\n//    Default in Java 9+.\n\n// 3. Parallel GC (-XX:+UseParallelGC):\n//    Use when: Batch processing, offline crunching where throughput is king and pauses don't matter.",
    "trap": "ZGC pause times are independent of heap size because marking and relocation happen concurrently via load barriers."
  },
  {
    "id": "q-java-classloader-delegation",
    "category": "JVM Internals & Memory",
    "difficulty": "Senior",
    "title": "ClassLoader Delegation Model: Parent-First Hierarchy & How Web Containers Invert It",
    "question": "Explain the ClassLoader delegation hierarchy, what triggers ClassCastException across loaders, and why Tomcat inverts delegation to Child-First.",
    "interviewerIntent": "Testing classloader isolation, ClassCastException root causes in modular/plugin systems, and enterprise container architectures.",
    "juniorTrap": "Assuming that if two classes have the exact same package and class name, they are identical to the JVM.",
    "problem": "ClassCastException: class com.example.User cannot be cast to class com.example.User.",
    "innerWorking": "In the standard delegation model, a ClassLoader delegates class loading to its parent before searching itself: Bootstrap -> Platform (Extensions) -> Application (System). Tomcat inverts this for web applications (Child-First): WebAppClassLoader searches /WEB-INF/classes and /WEB-INF/lib FIRST. If not found, it delegates to the Shared parent. Two classes loaded by different ClassLoaders are completely distinct types to the JVM, even if loaded from the exact same .class bytes!",
    "seniorAnswer": [
      "JVM Class Identity: An object's runtime class is defined by the tuple: (Fully Qualified Class Name, ClassLoader Instance).",
      "Why Invert Delegation: Web application isolation. App A can bundle Spring 5 while App B bundles Spring 6 in the same servlet container without library version conflicts.",
      "Bootstrap Loader: Native C++ loader in JVM; returns null if queried via String.class.getClassLoader()."
    ],
    "codeSnippet": "public class ClassLoaderIdentity {\n    public static void main(String[] args) {\n        // String is loaded by Bootstrap ClassLoader (returns null in Java):\n        System.out.println(\"String loader: \" + String.class.getClassLoader()); // null\n\n        // App classes loaded by AppClassLoader:\n        System.out.println(\"App loader: \" + ClassLoaderIdentity.class.getClassLoader());\n\n        // CLASS IDENTITY TRAP:\n        // Class A loaded by Loader 1\n        // Class B loaded by Loader 2\n        // A obj = (A) loader2.loadClass(\"com.example.User\").newInstance();\n        // THROWS: ClassCastException (Different classloader identities!)\n    }\n}",
    "trap": "Two classes are identical to the JVM ONLY if they share the exact same name AND the exact same ClassLoader instance."
  },
  {
    "id": "q-java-heap-regions-aging",
    "category": "JVM Internals & Memory",
    "difficulty": "Senior",
    "title": "Heap Regions & Object Aging: Eden, Survivor S0/S1 Copying & Tenuring Thresholds",
    "question": "Why does the Young Generation have TWO survivor spaces (S0 and S1), and how does the HotSpot JVM determine when to promote an object to Old Gen?",
    "interviewerIntent": "Testing knowledge of generational garbage collection mechanics, copying collectors, and tuning tenuring thresholds.",
    "juniorTrap": "Believing objects go directly from Eden to Old Generation, or not understanding why S0/S1 ping-pong.",
    "problem": "Premature promotion of short-lived objects directly into the Old Generation, causing frequent, costly Full GC / Major GC pauses.",
    "innerWorking": "Young Gen uses a Copying Garbage Collector. Eden is where new objects are allocated via thread-local allocation buffers (TLAB). When Eden fills, a Minor GC occurs: live objects from Eden and the 'From' Survivor space are copied contiguously into the 'To' Survivor space. The roles of From and To then swap. Each survival increments the object's age bit in its Mark Word header. When age reaches -XX:MaxTenuringThreshold (default 15) or dynamic tenuring threshold is met, it promotes to Old Gen.",
    "seniorAnswer": [
      "Why Two Survivor Spaces: Copying to an empty space eliminates memory fragmentation without needing an expensive compaction pass.",
      "Max Tenuring Threshold: Max age is 15 because only 4 bits are allocated for age in the 64-bit Mark Word header (2^4 - 1 = 15).",
      "Premature Promotion Smell: If survivor spaces are too small, objects spill directly into Old Gen (Tenured), causing Old Gen fragmentation and frequent Major GCs."
    ],
    "codeSnippet": "// Object Header (Mark Word) bit layout in 64-bit JVM:\n// [Unused: 25 bits] [HashCode: 31 bits] [CMS Free: 1 bit] [Age: 4 bits] [BiasedLock: 1 bit] [Lock Tag: 2 bits]\n// Notice: 'Age' has exactly 4 bits -> Maximum age is 1111 in binary = 15!\n\n// JVM Flag:\n// -XX:MaxTenuringThreshold=15 (Valid range: 1 to 15)\n// -XX:SurvivorRatio=8 (Eden is 8x the size of each Survivor space S0/S1)",
    "trap": "The maximum tenuring threshold is 15 because the HotSpot Mark Word allocates exactly 4 bits for object age."
  },
  {
    "id": "q-java-oom-scenarios",
    "category": "JVM Internals & Memory",
    "difficulty": "Staff Level",
    "title": "OutOfMemoryError Scenarios: Java heap space vs Metaspace vs GC Overhead Limit vs Direct Buffer",
    "question": "Identify the 4 primary OutOfMemoryError variants in Java, their underlying root causes, and how to triage each in production.",
    "interviewerIntent": "Testing production incident response, memory profiler triage, and JVM troubleshooting depth.",
    "juniorTrap": "Blindly increasing -Xmx every time any OutOfMemoryError occurs.",
    "problem": "Production crashes with OutOfMemoryError: Metaspace or Direct buffer memory, where increasing heap space fails to solve the issue.",
    "innerWorking": "1) java.lang.OutOfMemoryError: Java heap space: Heap cannot allocate object; root cause: memory leak or undersized heap. 2) java.lang.OutOfMemoryError: GC overhead limit exceeded: JVM spent >98% of total CPU time doing GC and recovered <2% of heap. 3) java.lang.OutOfMemoryError: Metaspace: Native memory for class metadata exhausted; root cause: dynamic class generation (CGLIB, ByteBuddy, proxies) without class unloading. 4) java.lang.OutOfMemoryError: Direct buffer memory: JVM direct native buffers exceeded -XX:MaxDirectMemorySize.",
    "seniorAnswer": [
      "Triage Heap OOM: Capture heap dump on crash via -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/heap.hprof and analyze with Eclipse Memory Analyzer (MAT) for dominator tree retainers.",
      "Triage GC Overhead: Signals catastrophic heap starvation. The application is thrashing.",
      "Triage Metaspace: Inspect ClassLoader leaks. In web apps, repeatedly redeploying without restarting the JVM leaks WebAppClassLoaders.",
      "Triage Native Threads: java.lang.OutOfMemoryError: unable to create new native thread means Linux kernel pid/max_user_watches limit reached or OS exhausted virtual memory."
    ],
    "codeSnippet": "// ESSENTIAL PRODUCTION JVM FLAGS FOR OOM DIAGNOSIS:\n// 1. Automatically dump heap on fatal OOM:\n//    -XX:+HeapDumpOnOutOfMemoryError \n//    -XX:HeapDumpPath=/var/log/dumps/oom.hprof\n\n// 2. Kill container immediately on OOM to allow Kubernetes auto-restart:\n//    -XX:+ExitOnOutOfMemoryError\n\n// 3. Bound native metaspace:\n//    -XX:MaxMetaspaceSize=512m\n\n// 4. Bound direct off-heap memory:\n//    -XX:MaxDirectMemorySize=1g",
    "trap": "Not all OOM errors come from the heap; increasing -Xmx does nothing for Metaspace, DirectBuffer, or native thread OOMs."
  },
  {
    "id": "q-java-escape-analysis-scalar",
    "category": "JVM Internals & Memory",
    "difficulty": "Staff Level",
    "title": "Escape Analysis & HotSpot Optimization: Stack Allocation via Scalar Replacement & Lock Elision",
    "question": "Can Java objects ever be allocated on the Stack instead of the Heap? Explain how C2 JIT Escape Analysis works.",
    "interviewerIntent": "Verifying cutting-edge understanding of JIT C2 compiler optimizations and memory layout optimization.",
    "juniorTrap": "Answering definitively that 'ALL objects in Java are strictly allocated on the Heap without exception'.",
    "problem": "High allocation rates causing unnecessary GC pressure for purely local temporary objects.",
    "innerWorking": "The JIT compiler analyzes the scope of an object reference: 1) GlobalEscape (escapes method and thread), 2) ArgEscape (passed as argument but doesn't escape thread), 3) NoEscape (confined entirely inside creating method). When NoEscape is proven, HotSpot performs Scalar Replacement: it decomposes the object into its individual primitive fields (scalars) and allocates them directly on the CPU Stack or registers, bypassing the Heap entirely! It also performs Lock Elision (removing synchronized locks if the object never escapes the thread).",
    "seniorAnswer": [
      "Scalar Replacement: Java does not allocate raw object headers on the stack; it replaces the object with scalar primitive variables in stack frames.",
      "Zero GC Cost: When the method returns, stack frames pop, instantly reclaiming memory with zero garbage collection overhead.",
      "Verification: Enabled by default (-XX:+DoEscapeAnalysis). Disable via -XX:-DoEscapeAnalysis to observe dramatic GC allocation spikes."
    ],
    "codeSnippet": "public class EscapeAnalysisDemo {\n    static class Point {\n        int x, y;\n        Point(int x, int y) { this.x = x; this.y = y; }\n    }\n\n    public static int compute() {\n        // 'p' NEVER escapes this method!\n        // JIT C2 Compiler detects 'NoEscape' and performs SCALAR REPLACEMENT:\n        // It converts Point p into two local stack variables: int p_x = 10; int p_y = 20;\n        // ZERO heap allocation occurs! Zero GC overhead!\n        Point p = new Point(10, 20);\n        return p.x + p.y;\n    }\n\n    public static void main(String[] args) {\n        for (int i = 0; i < 100_000_000; i++) {\n            compute(); // Runs in nanoseconds with scalar replacement!\n        }\n    }\n}",
    "trap": "HotSpot does not allocate objects on the stack; it decomposes non-escaping objects into primitive stack variables via Scalar Replacement."
  },
  {
    "id": "q-java-edge-reflection-integer-cache",
    "category": "Tricky Edge Cases",
    "difficulty": "Senior",
    "title": "Tricky Edge Case: Modifying IntegerCache via Reflection (Making 2 + 2 == 5)",
    "question": "How can low-level reflection rewrite the IntegerCache to make 2 + 2 == 5, and how does Java 17+ Strong Encapsulation prevent this?",
    "interviewerIntent": "Testing depth of Java reflection, internal class structures, and Java 9+ JPMS module boundary defenses.",
    "juniorTrap": "Believing that private final fields in wrapper classes are physically immutable against all runtime reflection.",
    "problem": "Malicious libraries or poorly written agent interceptors mutating JVM-wide cached literals.",
    "innerWorking": "Integer has an internal private static class IntegerCache containing an array Integer[] cache. Using setAccessible(true) on Field, code can access the cache array and overwrite the element corresponding to integer 4. Since autoboxing reuses cached references, any subsequent Integer x = 4 evaluates to whatever was overwritten. In Java 17+, JEP 403 (Strongly Encapsulate JDK Internals) blocks setAccessible on java.base packages, throwing InaccessibleObjectException unless overridden with --add-opens.",
    "seniorAnswer": [
      "Autoboxing Mechanism: Integer.valueOf(4) indexes directly into IntegerCache.cache[4 + 128]. Overwriting that element corrupts all autoboxed 4s globally.",
      "Modern JVM Defense: Java 17+ forbids deep reflection on JDK internals by default, throwing java.lang.reflect.InaccessibleObjectException.",
      "Security Best Practice: Run applications under SecurityManager or modern modular isolation flags."
    ],
    "codeSnippet": "import java.lang.reflect.Field;\n\npublic class IntegerCacheTampering {\n    public static void main(String[] args) throws Exception {\n        // Pre-Java 17 (or with --add-opens java.base/java.lang=ALL-UNNAMED):\n        Class<?> cacheClass = Class.forName(\"java.lang.Integer$IntegerCache\");\n        Field field = cacheClass.getDeclaredField(\"cache\");\n        field.setAccessible(true);\n        Integer[] cache = (Integer[]) field.get(null);\n\n        // Rewrite value for 4 (index: 4 + 128 = 132) to 5:\n        cache[132] = 5;\n\n        Integer twoPlusTwo = 2 + 2; // Autoboxes to Integer.valueOf(4)\n        System.out.println(\"2 + 2 = \" + twoPlusTwo); // PRINTS: 5!\n    }\n}",
    "trap": "Prior to Java 17, IntegerCache could be mutated via reflection to alter arithmetic results globally."
  },
  {
    "id": "q-java-finalize-resurrection",
    "category": "Tricky Edge Cases",
    "difficulty": "Senior",
    "title": "The finalize() Trap: Object Resurrection, Finalizer Thread Starvation & Modern Cleaner",
    "question": "How can an object resurrect itself from the dead inside finalize(), why is finalize() deprecated, and how does the Cleaner API replace it?",
    "interviewerIntent": "Testing object lifecycle edge cases, GC finalization queue risks, and modern resource management.",
    "juniorTrap": "Relying on finalize() for mission-critical native memory or connection cleanup.",
    "problem": "Production applications crashing with OOM because the single low-priority Finalizer thread gets backlogged by slow finalize() calls.",
    "innerWorking": "When an object with a non-empty finalize() becomes unreachable, the GC does NOT immediately reclaim it. It appends the object to a java.lang.ref.Finalizer queue. Inside finalize(), if the object assigns this to a live static variable, the object becomes reachable again (Resurrected!). However, the JVM guarantees finalize() will NEVER run a second time. If it becomes unreachable again, finalize() is skipped. Deprecated in Java 9, scheduled for removal in modern Java.",
    "seniorAnswer": [
      "Finalizer Thread Bottleneck: HotSpot runs a single Finalizer daemon thread. If any finalize() method blocks or runs slowly, the queue grows infinitely, causing OutOfMemoryError.",
      "Performance Overhead: Objects with finalizers take at least 2 full GC cycles to be collected and degrade allocation throughput.",
      "Modern Replacement: Use java.lang.ref.Cleaner (Java 9+) or AutoCloseable with try-with-resources."
    ],
    "codeSnippet": "public class ZombieResurrection {\n    public static ZombieResurrection liveInstance;\n\n    @Override\n    @SuppressWarnings(\"deprecation\")\n    protected void finalize() {\n        System.out.println(\"finalize() running... Resurrecting object!\");\n        // RESURRECTION: Re-assigns 'this' to an active GC root!\n        liveInstance = this; \n        // Note: The JVM will NEVER invoke finalize() again for this object!\n    }\n\n    public static void main(String[] args) throws Exception {\n        new ZombieResurrection();\n        System.gc(); // Trigger GC\n        Thread.sleep(100);\n\n        if (liveInstance != null) {\n            System.out.println(\"Object resurrected from the dead!\");\n        }\n    }\n}",
    "trap": "Never rely on finalize(); it degrades GC performance, causes memory leaks, and only runs once per instance."
  },
  {
    "id": "q-java-serialization-transient-singleton",
    "category": "Tricky Edge Cases",
    "difficulty": "Staff Level",
    "title": "Serialization & transient: Non-Serializable Superclass Constructor & Singleton Destruction",
    "question": "What constructor executes when deserializing a subclass whose superclass is NOT Serializable? How does serialization destroy singletons?",
    "interviewerIntent": "Testing serialization protocol specifications, constructor execution during deserialization, and singleton protection.",
    "juniorTrap": "Assuming deserialization calls the subclass constructor, or that inline transient field initializers execute.",
    "problem": "Deserializing an object resets superclass fields to default values and creates duplicate singleton instances, breaking singleton guarantees.",
    "innerWorking": "1) Non-Serializable Superclass: During deserialization, the subclass constructor is NEVER called. Instead, the JVM walks up the hierarchy to find the first non-serializable superclass and invokes its NO-ARG constructor. If that superclass lacks a no-arg constructor, InvalidClassException is thrown at runtime! 2) transient: transient fields are restored to primitive defaults (0, null), ignoring inline field assignments. 3) Singleton Destruction: Deserialization bypasses constructors and allocates a brand-new heap object, violating singleton uniqueness. Fix: Implement readResolve().",
    "seniorAnswer": [
      "readResolve() Contract: protected Object readResolve() { return INSTANCE; } ensures the deserializer substitutes the cached singleton reference.",
      "Enum Defense: Enum singletons are immune to serialization attacks; the JVM guarantees only one instance per enum constant.",
      "serialVersionUID: Explicitly declare serialVersionUID to prevent InvalidClassException when compilers generate differing hashes."
    ],
    "codeSnippet": "import java.io.*;\n\nclass ParentNotSerializable {\n    int parentVal;\n    // MANDATORY: First non-serializable superclass MUST have no-arg constructor!\n    public ParentNotSerializable() {\n        System.out.println(\"ParentNotSerializable() called\");\n        this.parentVal = 10;\n    }\n}\n\nclass ChildSerializable extends ParentNotSerializable implements Serializable {\n    private static final long serialVersionUID = 1L;\n    int childVal;\n    transient int secret = 999; // Ignored on deserialization (defaults to 0)!\n\n    public ChildSerializable(int a, int b) {\n        this.parentVal = a;\n        this.childVal = b;\n    }\n\n    // SINGLETON PROTECTION:\n    protected Object readResolve() {\n        // Return existing singleton instance rather than deserialized duplicate!\n        return this;\n    }\n}",
    "trap": "Deserialization invokes the first non-serializable superclass no-arg constructor, resetting superclass state."
  },
  {
    "id": "q-java-main-static-overload",
    "category": "Tricky Edge Cases",
    "difficulty": "Mid-Senior",
    "title": "Why main() Must Be static, Method Overloading & Reflection Entry Points",
    "question": "Why must public static void main(String[] args) be static, can main() be overloaded or marked final/synchronized, and what changed in Java 21?",
    "interviewerIntent": "Testing foundational knowledge of JVM bootstrap mechanics, entry point requirements, and Java 21 compact main features.",
    "juniorTrap": "Thinking main() cannot be overloaded with other parameter types, or not knowing why static is required.",
    "problem": "Confusion regarding JVM class initialization and launch requirements.",
    "innerWorking": "The JVM entry point is called before any objects exist on the heap. If main() were non-static, the JVM would have to instantiate the containing class, requiring decisions about which constructor to call. Overloading main is completely legal in Java, but the JVM launcher looks specifically for the exact signature: public static void main(String[] args). It CAN be marked final, synchronized, or strictfp.",
    "seniorAnswer": [
      "Why Static: Enables the JVM C-based launcher to call the method directly via Class.getMethod() without instantiating heap state.",
      "Modifiable Modifiers: main() can be final (prevents hiding in subclasses) or synchronized (synchronizes on Class object).",
      "Java 21 JEP 445 / 463: Unnamed classes and instance main methods allow void main() without String[] or static in launch scripts."
    ],
    "codeSnippet": "public class MainMechanics {\n    // Valid entry point (can be final and synchronized!):\n    public static final synchronized void main(String[] args) {\n        System.out.println(\"JVM Entry Point!\");\n        main(42); // Calling overloaded version\n    }\n\n    // Overloading main is 100% legal!\n    public static void main(int number) {\n        System.out.println(\"Overloaded main: \" + number);\n    }\n    public static void main(String arg1, String arg2) {\n        System.out.println(\"Overloaded dual string main\");\n    }\n}",
    "trap": "main() can be overloaded, final, or synchronized, but the JVM launcher requires public static void main(String[])."
  },
  {
    "id": "q-java-reference-types-phantom",
    "category": "Tricky Edge Cases",
    "difficulty": "Staff Level",
    "title": "Strong vs Soft vs Weak vs Phantom References: Memory Mechanics & ReferenceQueue",
    "question": "Compare Strong, Soft, Weak, and Phantom references across GC collection cycles, and explain how PhantomReference powers off-heap cleaners.",
    "interviewerIntent": "Evaluating mastery of advanced JVM reference reachability, caching strategies, and native off-heap memory reclamation.",
    "juniorTrap": "Confusing SoftReference (reclaimed only during memory pressure before OOM) with WeakReference (reclaimed on the very next GC cycle).",
    "problem": "Caches causing OutOfMemoryError because they hold Strong references, or native off-heap buffers leaking memory.",
    "innerWorking": "1) StrongReference: Default reference. Never GC'd while reachable from GC roots. 2) SoftReference: GC reclaims ONLY when memory is low (before throwing OutOfMemoryError). Ideal for memory-sensitive caches. 3) WeakReference: GC reclaims eagerly on the very next GC run, regardless of memory headroom. Ideal for canonical mappings (WeakHashMap). 4) PhantomReference: get() ALWAYS returns null. Enqueued to a ReferenceQueue AFTER the object has been finalized and memory is ready to be reclaimed. Used to safely deallocate native off-heap memory (like DirectByteBuffer Cleaner) without resurrection bugs.",
    "seniorAnswer": [
      "SoftReference Tuning: Governed by -XX:SoftRefLRUPolicyMSPerMB (default 1000ms per free megabyte).",
      "WeakHashMap: Entry keys are WeakReferences. When keys lose strong references, the GC enqueues them and the map purges stale entries on subsequent operations.",
      "Phantom Cleaners: Replaces dangerous finalize(). Used in modern Java's java.lang.ref.Cleaner to free OS handles and native C pointers."
    ],
    "codeSnippet": "import java.lang.ref.*;\n\npublic class ReferenceTypesDemo {\n    public static void main(String[] args) {\n        Object strong = new Object();\n\n        // 1. Soft Reference: Collected ONLY before OutOfMemoryError\n        SoftReference<Object> soft = new SoftReference<>(new Object());\n\n        // 2. Weak Reference: Collected on the VERY NEXT GC cycle\n        WeakReference<Object> weak = new WeakReference<>(new Object());\n\n        // 3. Phantom Reference: get() ALWAYS returns null!\n        ReferenceQueue<Object> refQueue = new ReferenceQueue<>();\n        PhantomReference<Object> phantom = new PhantomReference<>(new Object(), refQueue);\n\n        System.out.println(\"Phantom.get(): \" + phantom.get()); // ALWAYS prints null!\n\n        // Force GC:\n        System.gc();\n\n        System.out.println(\"Weak after GC: \" + weak.get()); // null (Collected!)\n        System.out.println(\"Soft after GC: \" + soft.get()); // Still alive (Memory is ample!)\n    }\n}",
    "trap": "PhantomReference.get() always returns null; its purpose is post-mortem notification via ReferenceQueue."
  }
];
