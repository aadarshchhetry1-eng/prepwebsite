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
