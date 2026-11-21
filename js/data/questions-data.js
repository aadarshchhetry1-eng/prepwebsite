/**
 * questions-data.js
 * In-depth Tricky Senior & Staff Engineer Interview Questions.
 * Structured with Interviewer Intent, Junior Trap, Senior In-Depth Answer, Code & War Stories.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.QUESTIONS = [
  {
    id: "q-spring-transactional-self-invocation",
    category: "Spring Boot",
    difficulty: "Senior",
    question: "Why does @Transactional fail when methodA() calls methodB() in the same class, and how does Spring's CGLIB proxy actually execute?",
    interviewerIntent: "Testing deep understanding of Spring AOP proxy mechanism, CGLIB dynamic bytecode subclassing, and runtime stack dispatch.",
    juniorTrap: "Junior engineers assume adding @Transactional to any method magically guarantees a database transaction regardless of how it's called.",
    seniorAnswer: [
      "Spring creates a CGLIB subclass proxy at startup (e.g., UserService$$SpringCGLIB$$0) wrapping the target bean.",
      "When an external bean invokes `userService.methodA()`, the call hits the proxy's `MethodInterceptor` (TransactionInterceptor), which begins a JDBC transaction, opens a connection, and delegates to the target `methodA()`.",
      "Inside `methodA()`, when it calls `this.methodB()`, the `this` pointer in the JVM points directly to the underlying raw target object, NOT the proxy wrapper! The invocation executes directly in JVM stack memory, bypassing the proxy and all transaction/advice interceptors.",
      "Fix 1: Move `methodB()` to a separate service bean (`OrderAuditService`).",
      "Fix 2: Inject the service into itself via `@Autowired private UserService self;` and call `self.methodB()`.",
      "Fix 3: Use programmatic `TransactionTemplate.execute(status -> ...)`."
    ],
    codeSnippet: `@Service
public class OrderService {
    @Autowired
    @Lazy // Avoids circular dependency during bean creation
    private OrderService self;

    public void checkout(Order order) {
        // ... validate order ...
        // Calling via 'self' goes through the CGLIB proxy, activating REQUIRES_NEW!
        self.logAuditTrail(order);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditTrail(Order order) {
        // Runs in a brand-new independent DB transaction!
    }
}`,
    warStory: "A fintech app had an audit logger inside the same order service. When checkout failed with an exception, the audit log was rolled back with the order, leaving zero trace of who initiated the failed transfer!"
  },

  {
    id: "q-java-volatile-vs-synchronized-dcl",
    category: "Java Core & Concurrency",
    difficulty: "Staff",
    question: "Why does Double-Checked Locking without 'volatile' cause subtle production crashes on multi-core systems? Explain CPU cache and JMM reordering.",
    interviewerIntent: "Testing whether the candidate understands the difference between mutual exclusion (synchronized) and memory visibility + instruction reordering (volatile).",
    juniorTrap: "Assuming that because `synchronized` locks the block, only one thread enters at a time, so the object creation is fully thread-safe.",
    seniorAnswer: [
      "Creating an object `new Singleton()` is NOT an atomic operation in bytecode. It decomposes into 3 distinct steps: (1) Allocate memory on the heap, (2) Execute constructor to initialize fields, (3) Assign memory address to reference variable `INSTANCE`.",
      "The JIT compiler and CPU out-of-order execution engine are legally permitted to reorder step 3 before step 2 (as long as within the single thread the effect is unchanged: as-if-serial semantics).",
      "If Thread A executes step 1 and step 3, `INSTANCE` is now non-null! At this exact instant, Thread B enters the outer `if (INSTANCE == null)` check.",
      "Because Thread B checks `INSTANCE` outside the synchronized lock, it sees `INSTANCE != null` and immediately returns the reference. Thread B attempts to access object fields which are still zero/null because constructor step 2 hasn't finished!",
      "Declaring `private static volatile Singleton INSTANCE` introduces a `StoreLoad` barrier (memory fence), strictly forbidding the JIT and CPU from reordering write instructions across the barrier."
    ],
    codeSnippet: `// Bytecode breakdown of: instance = new Singleton();
// 0: new           #2  // Allocate memory for Singleton
// 3: dup
// 4: invokespecial #3  // Method "<init>":()V (Constructor)
// 7: putstatic     #4  // Field instance:LSingleton; (Assignment)
// CPU can reorder step 7 before step 4 without volatile!`
  },

  {
    id: "q-prototype-in-singleton",
    category: "Spring Boot",
    difficulty: "Senior",
    question: "What happens when you inject a @Scope('prototype') bean into a @Scope('singleton') bean, and how do you properly obtain fresh prototype instances?",
    interviewerIntent: "Testing knowledge of Spring bean lifecycle timing and resolving scope impedance mismatches.",
    juniorTrap: "Believing that every time a method on the Singleton bean is called, Spring will magically inject a new Prototype bean.",
    seniorAnswer: [
      "A Singleton bean is instantiated and initialized exactly ONCE during Spring container startup. Dependency injection happens during this initial startup phase.",
      "Spring injects ONE prototype instance during that initial creation. Afterwards, the singleton bean holds a permanent reference to that specific instance. The prototype bean behaves effectively like a singleton!",
      "Solution 1 (Recommended): Use `@Lookup` method injection. Spring dynamically overrides the method via CGLIB to query `applicationContext.getBean(PrototypeBean.class)` on each invocation.",
      "Solution 2: Inject `ObjectProvider<MyPrototypeBean>` or `Provider<MyPrototypeBean>` and call `provider.getObject()` when needed.",
      "Solution 3: In Web contexts, use scoped proxies: `@Scope(value = ConfigurableBeanFactory.SCOPE_PROTOTYPE, proxyMode = ScopedProxyMode.TARGET_CLASS)`."
    ],
    codeSnippet: `@Component
public class RequestHandlerSingleton {

    // Spring CGLIB overrides this method at runtime to fetch fresh prototype!
    @Lookup
    public WorkerPrototype getWorker() {
        return null; // Spring generates the implementation
    }

    public void processTask(Task task) {
        WorkerPrototype worker = getWorker(); // Brand new instance every single call!
        worker.execute(task);
    }
}`
  },

  {
    id: "q-hibernate-first-level-cache-dirty-checking",
    category: "Spring Boot",
    difficulty: "Senior",
    question: "Why does findById() hit the database only once within a transaction, while JPQL queries hit the DB every time? What are the implications for dirty checking?",
    interviewerIntent: "Testing deep knowledge of the JPA EntityManager / Hibernate Session Persistence Context, Entity Snapshotting, and SQL generation.",
    juniorTrap: "Assuming Hibernate caches all queries equally in memory.",
    seniorAnswer: [
      "Hibernate's First-Level Cache is bound to the `EntityManager` (the current transaction). It acts as an Identity Map keyed by `(EntityClass, PrimaryKey)`.",
      "When `findById(101L)` is called, Hibernate checks its 1st-level cache. If present, it returns the existing managed entity reference immediately without generating SQL.",
      "JPQL/HQL queries (e.g. `findByStatus('ACTIVE')`) bypass the 1st-level cache for query execution because SQL conditions cannot be evaluated in memory without full-table knowledge. Hibernate executes the SQL query against the database.",
      "However, when processing query results: if a returned row with ID 101 already exists in the 1st-level cache, Hibernate discards the newly fetched row data and returns the existing cached managed entity instance to maintain identity consistency!",
      "Dirty Checking: When an entity is loaded, Hibernate stores an internal Object[] snapshot of its state. At transaction commit (`flush()`), Hibernate compares current entity field values against the snapshot. If changed, an `UPDATE` statement is generated automatically."
    ],
    codeSnippet: `@Transactional
public void updateDiscount(Long customerId) {
    Customer c1 = customerRepo.findById(customerId).orElseThrow();
    c1.setVip(true); 
    // Notice: NO customerRepo.save(c1) is called!
    // At transaction commit, Hibernate's dirty checking detects c1.vip changed
    // and automatically executes: UPDATE customer SET vip = true WHERE id = ?
}`
  },

  {
    id: "q-concurrenthashmap-size-longadder",
    category: "DSA & Concurrency",
    difficulty: "Staff",
    question: "Why does AtomicLong bottleneck under high-concurrency writes, and how does LongAdder / Striped64 eliminate CPU cache bouncing (False Sharing)?",
    interviewerIntent: "Testing low-level hardware concurrency awareness, CPU L1/L2 cache line invalidations, and lock-free striping data structures.",
    juniorTrap: "Thinking AtomicLong is already lock-free and fast enough for all concurrent counting needs.",
    seniorAnswer: [
      "`AtomicLong` relies on a single `volatile long value` updated via CAS (`Unsafe.compareAndSwapLong`).",
      "Under high write contention (e.g. 64 threads incrementing metrics simultaneously), 63 threads fail their CAS loop every cycle and must retry. This causes massive CPU cache line bouncing (MESI protocol invalidations across CPU cores), killing throughput.",
      "Java 8 introduced `LongAdder` (extending `Striped64`). It maintains a `base` variable and an array of `Cell` objects.",
      "When contention is detected, threads hash their thread ID to different `Cell` slots in the array and update their private slot independently via CAS with zero contention!",
      "Summing (`sum()`) aggregates `base + sum(cells)`. It trades momentary precision for orders-of-magnitude higher write throughput.",
      "False Sharing Prevention: The `Cell` class is annotated with `@jdk.internal.vm.annotation.Contended`, which instructs the JVM to pad 128 bytes around each cell, preventing two cells from sharing the same 64-byte CPU cache line."
    ],
    codeSnippet: `// High-concurrency metrics counter:
LongAdder requestCounter = new LongAdder();

// In worker threads (thousands per second):
requestCounter.increment(); // Virtually zero contention!

// Periodic reporting:
long total = requestCounter.sum();`
  },

  {
    id: "q-finally-not-executing-and-suppressed",
    category: "Java Core",
    difficulty: "Senior",
    question: "Under what specific conditions will a 'finally' block NEVER execute in Java? What happens if both 'try' and 'finally' throw exceptions?",
    interviewerIntent: "Testing JVM lifecycle edge cases, exception propagation, and Java 7 try-with-resources suppressed exception handling.",
    juniorTrap: "Reciting the textbook answer: 'The finally block ALWAYS executes no matter what happens.'",
    seniorAnswer: [
      "Cases where `finally` will NEVER execute: (1) `System.exit(status)` is invoked, (2) The JVM crashes due to OS SIGKILL (`kill -9`) or hardware power failure, (3) An infinite loop or deadlock occurs in the `try` block, (4) A daemon thread is interrupted when all user threads terminate.",
      "Exception Masking Trap: If the `try` block throws `IOException` and the `finally` block throws `NullPointerException`, the `finally` exception completely OVERWRITES and destroys the original `try` exception! The stack trace of `IOException` is lost forever.",
      "Try-With-Resources Solution: Java 7+ `AutoCloseable` preserves the original exception. If `close()` in the implicit finally block throws an exception, it is attached to the primary exception as a Suppressed Exception (`e.getSuppressed()`)."
    ],
    codeSnippet: `// Exception masking in legacy finally:
try {
    throw new BusinessException("Primary error");
} finally {
    throw new RuntimeException("Secondary cleanup error"); 
    // The BusinessException is completely LOST! Caller never sees it!
}

// Modern Try-With-Resources preserves both:
try (var resource = new Resource()) {
    throw new BusinessException("Primary error");
} // If resource.close() fails, it is appended to e.getSuppressed()`
  },

  {
    id: "q-filter-vs-interceptor-exception",
    category: "Spring Boot",
    difficulty: "Senior",
    question: "Why does @ControllerAdvice fail to catch exceptions thrown inside a Spring Filter (e.g. JWT Auth Filter), and how do you handle them properly?",
    interviewerIntent: "Testing candidate's mental model of the Servlet container pipeline vs Spring's DispatcherServlet ecosystem.",
    juniorTrap: "Adding an @ExceptionHandler(JwtException.class) inside @RestControllerAdvice and wondering why the client receives HTTP 500 white-label error instead of JSON.",
    seniorAnswer: [
      "The Servlet Container pipeline order: Incoming HTTP Request -> Tomcat Servlet Filters (e.g. Spring Security / OncePerRequestFilter) -> DispatcherServlet -> Interceptors -> Controller.",
      "`@ControllerAdvice` and `@ExceptionHandler` are components of Spring MVC's `DispatcherServlet`. They only catch exceptions that occur WITHIN the DispatcherServlet boundary (Interceptors and Controllers).",
      "Since Servlet Filters execute BEFORE the request ever reaches `DispatcherServlet`, exceptions thrown in a Filter bubble directly back up to the Servlet Container (Tomcat / Jetty), completely bypassing `@ControllerAdvice`!",
      "Solution: Inject `HandlerExceptionResolver` into your filter and manually delegate the caught exception: `resolver.resolveException(request, response, null, ex);` so DispatcherServlet's advice catches it, OR use Spring Security's `AuthenticationEntryPoint`."
    ],
    codeSnippet: `@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    @Qualifier("handlerExceptionResolver")
    private HandlerExceptionResolver resolver;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) 
            throws ServletException, IOException {
        try {
            validateToken(req);
            chain.doFilter(req, res);
        } catch (JwtException ex) {
            // Forward exception directly to @ControllerAdvice!
            resolver.resolveException(req, res, null, ex);
        }
    }
}`
  },

  {
    id: "q-dual-write-kafka-outbox",
    category: "Distributed Systems & Cloud",
    difficulty: "Staff",
    question: "What is the Dual-Write Problem between a relational DB and Kafka, and why can't a local Spring @Transactional guarantee message delivery?",
    interviewerIntent: "Testing knowledge of distributed data consistency, two-phase commits vs eventual consistency, and the Transactional Outbox Pattern.",
    juniorTrap: "Putting `kafkaTemplate.send(\"orders\", event)` inside a `@Transactional` method right after `orderRepository.save(order)`.",
    seniorAnswer: [
      "The Dual-Write Problem: Writing to a local DB and sending a network message to Kafka are two separate distributed systems without a shared distributed transaction coordinator.",
      "Scenario 1: You call `kafkaTemplate.send()`, but the subsequent DB commit fails (e.g. unique constraint, lock timeout). Result: The Kafka consumer processes an order that does not exist in the database (Ghost message).",
      "Scenario 2: You commit to the DB, but Kafka is temporarily unreachable or the JVM crashes right before sending. Result: The order exists in DB, but no event is ever published (Lost message).",
      "Solution: The Transactional Outbox Pattern. Insert the message into an `outbox` table in the SAME relational database transaction as the business entity. Since it's a single database, ACID guarantees atomicity.",
      "An asynchronous background process (or Debezium CDC reading MySQL binlog / Postgres WAL) continuously tails the outbox table and streams events to Kafka with guaranteed at-least-once delivery."
    ],
    codeSnippet: `@Transactional
public Order createOrder(CreateOrderRequest req) {
    Order order = orderRepository.save(new Order(req));

    // Persist event in outbox table within SAME DB transaction
    OutboxEvent event = new OutboxEvent("OrderCreated", order.getId(), toJson(order));
    outboxRepository.save(event);

    return order;
    // Both commit atomically or both roll back! Zero dual-write risk!
}`
  },

  {
    id: "q-lfu-cache-vs-lru-o1",
    category: "DSA & Algorithms",
    difficulty: "Staff",
    question: "How do you implement an LFU (Least Frequently Used) Cache in O(1) time complexity for both get() and put()? What data structures are required?",
    interviewerIntent: "Testing mastery of multi-index coupled data structures (Two HashMaps + Doubly Linked Lists frequency buckets).",
    juniorTrap: "Suggesting a Min-Heap (PriorityQueue) for frequencies, which yields O(log N) operations, not O(1).",
    seniorAnswer: [
      "An LFU cache must evict the item with the minimum access frequency. If multiple items share the minimum frequency, the least recently used among them must be evicted.",
      "Data Structure 1: `Map<Integer, Node> keyToNode` for O(1) key-value lookup.",
      "Data Structure 2: `Map<Integer, DoublyLinkedList> freqToList` mapping each frequency count (1, 2, 3...) to a Doubly Linked List of nodes with that frequency.",
      "Tracking: Maintain a `minFrequency` integer.",
      "`get(key)`: Find node. Remove it from its current frequency list (`freqToList.get(node.freq)`). If that list becomes empty and its frequency was `minFrequency`, increment `minFrequency`. Increment `node.freq`. Add node to `freqToList.get(node.freq)`. Return value. All steps are O(1)!",
      "`put(key, val)`: If key exists, update value and run `get(key)` logic. If new and full: evict the tail of `freqToList.get(minFrequency)`. Insert new node with frequency 1 and set `minFrequency = 1`."
    ],
    codeSnippet: `// Key State for O(1) LFU:
Map<Integer, Node> cache = new HashMap<>();
Map<Integer, DoublyLinkedList> freqMap = new HashMap<>();
int minFreq = 0;
int capacity;`
  },

  {
    id: "q-virtual-thread-pinning",
    category: "Java Core",
    difficulty: "Senior",
    question: "What is Virtual Thread Pinning in Java 21, why does 'synchronized' cause it, and how does it degrade high-throughput systems?",
    interviewerIntent: "Testing real-world production readiness for Project Loom / Virtual Threads adoption.",
    juniorTrap: "Assuming Virtual Threads are drop-in replacements for standard threads that make everything faster without side effects.",
    seniorAnswer: [
      "Virtual Threads are mapped to a pool of OS carrier threads (ForkJoinPool). When a virtual thread performs blocking I/O (e.g. socket read, sleep), the JVM unmounts its stack frame (Continuation) to the heap, freeing the carrier thread for another virtual thread.",
      "Pinning: In Java 21, if a virtual thread performs blocking I/O while inside a `synchronized` block/method or native memory call, the JVM CANNOT unmount it. The virtual thread remains pinned to its underlying OS carrier thread.",
      "Impact: If 16 carrier threads are pinned waiting on slow network database calls, the entire carrier pool is exhausted! All other millions of virtual threads starve and the JVM grinds to a halt.",
      "Diagnostic: Run the JVM with `-Djdk.tracePinnedThreads=full` to print stack traces whenever pinning occurs.",
      "Remediation: Replace `synchronized` blocks that guard I/O operations with `java.util.concurrent.locks.ReentrantLock`, which supports clean unmounting in Loom."
    ],
    codeSnippet: `// PINNED (Dangerous in Virtual Threads):
public synchronized String fetchRemoteData() {
    return httpClient.send(req, BodyHandlers.ofString()).body(); // Pins carrier thread!
}

// SAFE (Unmounts cleanly):
private final ReentrantLock lock = new ReentrantLock();
public String fetchRemoteDataSafe() throws Exception {
    lock.lock();
    try {
        return httpClient.send(req, BodyHandlers.ofString()).body(); // Carrier freed!
    } finally {
        lock.unlock();
    }
}`
  },

  // =========================================================================
  // 30 Senior & Staff Level Tricky OOPs Interview Questions
  // =========================================================================

  {
    id: "q-oops-1-private-method-override",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can we override a private parent method in a subclass? What does bytecode do and why does adding @Override fail?",
    interviewerIntent: "Testing whether the candidate understands method inheritance, accessibility boundaries, and JVM method resolution (invokespecial vs invokevirtual).",
    juniorTrap: "Assuming that writing a method with the identical name and signature in a subclass overrides the private parent method.",
    seniorAnswer: [
      "No, private methods cannot be overridden! Private methods are not inherited by subclasses; they are strictly invisible outside the declaring class.",
      "If a subclass declares a method with the identical name and signature, it is declaring an entirely NEW, independent method that coincidentally shares the same name.",
      "Adding @Override causes a compilation error: 'Method does not override method from its superclass'.",
      "Bytecode Internals: Private methods are invoked using invokespecial (statically bound at compile time to the enclosing class). Overridable methods are invoked using invokevirtual (dynamically dispatched via the V-Table at runtime)."
    ],
    codeSnippet: `class Parent {
    private void secret() { System.out.println("Parent Secret"); }
    public void print() { secret(); } // Binds statically to Parent.secret via invokespecial!
}

class Child extends Parent {
    // @Override // COMPILE ERROR! Cannot override private method
    public void secret() { System.out.println("Child Secret"); } // Brand-new method!
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        p.print(); // PRINTS "Parent Secret"! NOT "Child Secret"!
    }
}`,
    warStory: "A developer tried to customize an internal authentication check by redeclaring a private validateCredentials() method in a subclass. Because the parent class called its own private method via invokespecial, the subclass customization was never invoked, silently leaving the default auth rules active."
  },

  {
    id: "q-oops-2-static-method-hiding",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can we override a static method? Explain Method Hiding vs Overriding and the bytecode difference.",
    interviewerIntent: "Testing knowledge of static vs dynamic binding, compile-time reference resolution, and invokestatic.",
    juniorTrap: "Believing that redeclaring a static method in a subclass overrides it polymorphically.",
    seniorAnswer: [
      "No, static methods CANNOT be overridden. They can only be HIDDEN ('Method Hiding').",
      "Overriding depends on the runtime instance object and is dynamically dispatched via invokevirtual using the V-Table.",
      "Static methods belong to the class, not instances. They are resolved at compile time based strictly on the variable's REFERENCE TYPE using invokestatic.",
      "If you invoke a static method via an object reference (parentRef.staticMethod()), the compiler emits bytecode referencing the parent class, completely ignoring the runtime object."
    ],
    codeSnippet: `class Super {
    public static void display() { System.out.println("Super Static"); }
    public void show() { System.out.println("Super Instance"); }
}

class Sub extends Super {
    // Method Hiding (NOT overriding! @Override will fail)
    public static void display() { System.out.println("Sub Static"); }
    @Override public void show() { System.out.println("Sub Instance"); }
}

public class Test {
    public static void main(String[] args) {
        Super obj = new Sub();
        obj.display(); // PRINTS "Super Static" (Resolved at compile-time by ref type!)
        obj.show();    // PRINTS "Sub Instance" (Dynamic dispatch via V-Table!)
    }
}`,
    warStory: "A team created a BaseReportExporter.export() static utility and re-implemented FinancialReportExporter.export(). When called via a generic collection holding BaseReportExporter references, the wrong export logic executed, dumping unformatted raw CSVs instead of signed PDFs."
  },

  {
    id: "q-oops-3-covariant-return-types-bridge",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "How do Covariant Return Types work in method overriding, and why does the javac compiler generate synthetic 'Bridge Methods' in bytecode?",
    interviewerIntent: "Assessing deep compiler knowledge: how Java language-level covariance reconciles with strict JVM bytecode method descriptors.",
    juniorTrap: "Knowing that covariant return types are permitted since Java 5, but having no idea how the JVM handles them without breaking backwards compatibility.",
    seniorAnswer: [
      "Covariant Returns: An overriding method may return a subtype of the return type declared in the superclass (e.g., ChildProducer.get(): String overriding ParentProducer.get(): Object).",
      "The JVM Bytecode Dilemma: In JVM bytecode class files, a method's signature (descriptor) includes its parameter types AND its return type! To the JVM, get()Ljava/lang/String; and get()Ljava/lang/Object; are two distinct, non-overriding methods.",
      "The Compiler Solution (Synthetic Bridge Method): The compiler generates a hidden 'bridge method' in the subclass: public Object get() { return this.get(); } that delegates to String get().",
      "Reflection Trap: Calling Class.getDeclaredMethods() on ChildProducer returns TWO get() methods! One is synthetic (method.isBridge() == true)."
    ],
    codeSnippet: `class ParentProducer {
    public Object produce() { return "Parent Object"; }
}

class ChildProducer extends ParentProducer {
    @Override
    public String produce() { return "Child String"; } // Covariant Return Type!
}

// Disassembled bytecode via 'javap -c ChildProducer':
// 1. The actual method:
// public java.lang.String produce();
//   Code: 0: ldc #2 // String Child String; 2: areturn
//
// 2. The compiler-generated SYNTHETIC BRIDGE method:
// public java.lang.Object produce();
//   flags: (0x1041) ACC_PUBLIC, ACC_BRIDGE, ACC_SYNTHETIC
//   Code:
//      0: aload_0
//      1: invokevirtual #3 // Method produce:()Ljava/lang/String;
//      4: areturn`,
    warStory: "A JSON serialization library scanning class methods via reflection crashed with AmbiguousMethodException because it found two methods named produce() on the same class, unaware that one was a synthetic compiler bridge."
  },

  {
    id: "q-oops-4-checked-exception-broadening",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "What are the exact rules for 'throws' clauses in method overriding? Can an overriding method throw broader checked exceptions?",
    interviewerIntent: "Testing whether the candidate understands the Liskov Substitution Principle (LSP) applied to exception specifications and caller contracts.",
    juniorTrap: "Thinking a subclass can declare any exception it wants as long as it handles it internally, or confusing checked with unchecked exceptions.",
    seniorAnswer: [
      "Rule 1 (Checked Exceptions): An overriding method CANNOT throw new or broader checked exceptions than the superclass method. It can only throw the same checked exceptions, narrower subclasses of them, fewer exceptions, or none at all.",
      "Why? Callers invoking parent.process() are written to catch only ParentException. If a runtime subclass could throw BroaderException, the caller's catch block would fail to intercept it, violating type safety and LSP.",
      "Rule 2 (Unchecked Exceptions): An overriding method CAN throw ANY unchecked exceptions (RuntimeException, Error), or subclasses thereof, regardless of the parent's throws declaration.",
      "Rule 3 (Parent throws nothing): If the parent method declares no throws, the subclass cannot declare ANY checked exceptions."
    ],
    codeSnippet: `class SuperService {
    public void execute() throws IOException { ... }
}

class SubService extends SuperService {
    // ✅ VALID: Narrower checked exception
    @Override public void execute() throws FileNotFoundException { ... }

    // ✅ VALID: No checked exceptions at all
    // @Override public void execute() { ... }

    // ✅ VALID: Any RuntimeException is allowed
    // @Override public void execute() throws IllegalArgumentException { ... }

    // ❌ COMPILE ERROR: Broader checked exception!
    // @Override public void execute() throws Exception { ... }

    // ❌ COMPILE ERROR: Unrelated checked exception!
    // @Override public void execute() throws SQLException { ... }
}`,
    warStory: "A junior developer changed a subclass DAO method to throw SQLException without checking the parent interface contract, breaking the build. To bypass it, they wrapped it in throw new RuntimeException(e), which bypassed caller rollback handlers."
  },

  {
    id: "q-oops-5-visibility-reduction-lsp",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can an overriding method reduce access modifier visibility (e.g. from public to protected or private)? Why or why not?",
    interviewerIntent: "Checking adherence to the Liskov Substitution Principle and understanding runtime method access boundaries.",
    juniorTrap: "Assuming visibility can be changed as long as the method logic remains identical.",
    seniorAnswer: [
      "No! An overriding method can NEVER reduce the visibility of the inherited method. It can only maintain it or expand it.",
      "Hierarchy of visibility: private < package-private (default) < protected < public.",
      "If a superclass declares a method protected, the subclass can declare it protected or public. If superclass declares public, the subclass MUST declare public.",
      "The Architectural Reason (LSP): If a caller holds a reference SuperClass ref = new SubClass(), the caller has the legal right to call ref.publicMethod(). If the subclass could secretly make it private, the JVM would have to throw an IllegalAccessError at runtime, completely breaking polymorphic substitutability."
    ],
    codeSnippet: `class BaseAPI {
    public void connect() { ... }
    protected void authenticate() { ... }
}

class CustomAPI extends BaseAPI {
    // ❌ COMPILE ERROR: 'cannot reduce the visibility of the inherited method'
    // @Override private void connect() { ... }

    // ❌ COMPILE ERROR:
    // @Override protected void connect() { ... }

    // ✅ VALID: Expanding visibility from protected to public!
    @Override public void authenticate() { ... }
}`,
    warStory: "An engineer tried to restrict access to a sensitive decryptPayload() method in a subclass by changing it to private. Because the parent class remained public, attackers holding a parent reference could still invoke the method freely via polymorphism."
  },

  {
    id: "q-oops-6-constructor-polymorphism-leak",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "What happens when a parent class constructor invokes an overridable method that is overridden in a subclass? (The Leaking Constructor Trap)",
    interviewerIntent: "Testing deep knowledge of the JVM object initialization sequence and memory layout before constructor completion.",
    juniorTrap: "Assuming that the parent constructor executes the parent's implementation of the method because the subclass constructor hasn't run yet.",
    seniorAnswer: [
      "The Trap: In Java, dynamic dispatch is ACTIVE even during constructor execution! If the parent constructor calls init(), and the subclass overrides init(), the SUBCLASS's init() executes!",
      "The Catastrophe: The subclass init() executes BEFORE the subclass fields and constructor have been initialized! All subclass instance fields will contain their default memory values (null, 0, false).",
      "Result: The subclass method dereferences an uninitialized field and throws NullPointerException, or stores corrupted data in state.",
      "The Senior Design Rule: NEVER call overridable methods inside constructors. Mark constructor-called helper methods as private or final."
    ],
    codeSnippet: `class SuperClass {
    public SuperClass() {
        System.out.println("Super constructor running...");
        setup(); // DANGEROUS! Overridable method called in constructor!
    }
    public void setup() { System.out.println("Super setup"); }
}

class SubClass extends SuperClass {
    private String databaseUrl; // Initialized in constructor

    public SubClass() {
        // super() runs first!
        this.databaseUrl = "jdbc:postgresql://localhost:5432/mydb";
    }

    @Override
    public void setup() {
        // Runs during super() BEFORE databaseUrl is assigned!
        System.out.println("SubClass setup with URL length: " + databaseUrl.length());
    }
}

public class Main {
    public static void main(String[] args) {
        new SubClass(); // THROWS NullPointerException at runtime!
    }
}`,
    warStory: "A security framework had BaseSecurityContext() constructor call initCipher(). A subclass initialized its cryptographic secret key in its field initializer. When instantiated, initCipher() ran against a null key, generating all encryption tokens using hardcoded zero-byte seeds."
  },

  {
    id: "q-oops-7-field-hiding-no-polymorphism",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Are instance fields polymorphic in Java? What happens when Parent and Child both declare a field with the same name ('Field Hiding')?",
    interviewerIntent: "Assessing understanding of compile-time early binding for fields vs runtime late binding for methods.",
    juniorTrap: "Believing that instance variables can be overridden just like methods.",
    seniorAnswer: [
      "Instance fields are NOT polymorphic in Java! Fields cannot be overridden; they can only be HIDDEN ('Field Hiding').",
      "Field access is resolved at compile time based strictly on the declared REFERENCE TYPE of the variable, not the actual runtime object.",
      "An instance of Child actually contains BOTH fields in memory on the heap: the parent's x and the child's x. Which one is read depends on the reference type.",
      "The Architectural Lesson: Always keep fields private and expose them via polymorphic getter methods (getX()), which ARE dynamically dispatched via the V-Table."
    ],
    codeSnippet: `class Parent {
    public int value = 10;
    public int getValue() { return value; }
}

class Child extends Parent {
    public int value = 20; // Hides Parent.value! Does NOT override it.
    @Override public int getValue() { return value; }
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        Child c = new Child();

        System.out.println(p.value); // PRINTS 10 (Resolved at compile time by ref type Parent!)
        System.out.println(c.value); // PRINTS 20 (Resolved by ref type Child)

        System.out.println(p.getValue()); // PRINTS 20 (Polymorphic method invocation!)
    }
}`,
    warStory: "An order management system accessed order.status directly as a public field across 40 classes. A subclass CancellableOrder declared its own status field. Financial reporting queries holding Order references read the parent status, leading to double-shipping cancelled items."
  },

  {
    id: "q-oops-8-overload-resolution-null-ambiguity",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "How does the Java compiler resolve overloaded methods when passed a 'null' literal? Explain the 'Most Specific Rule' and ambiguity errors.",
    interviewerIntent: "Testing comprehension of compile-time method overload resolution (JLS §15.12.2.5).",
    juniorTrap: "Assuming passing null is always ambiguous, or guessing that Object is chosen because 'null is an Object'.",
    seniorAnswer: [
      "Compile-Time Resolution: Method overloading is resolved entirely at COMPILE TIME based on argument types.",
      "The 'Most Specific' Rule: If multiple overloaded methods are applicable, the compiler selects the method with the MOST SPECIFIC parameter type (i.e. the subtype in the inheritance tree).",
      "Example 1: Between test(Object o) and test(String s), String is a subtype of Object. Therefore, String is more specific. test(null) calls test(String)!",
      "Example 2 (Ambiguity Error): If test(Integer i) is also added alongside test(String s), neither String nor Integer is a subtype of the other! The compiler cannot pick a winner and fails with: 'reference to test is ambiguous'."
    ],
    codeSnippet: `public class OverloadTrap {
    static void print(Object o) { System.out.println("Object"); }
    static void print(String s) { System.out.println("String"); }
    // static void print(Integer i) { System.out.println("Integer"); }

    public static void main(String[] args) {
        print(null); // PRINTS "String"! (String is more specific than Object)
        
        // If 'print(Integer i)' is uncommented:
        // print(null); 
        // ❌ COMPILE ERROR: reference to print is ambiguous
        
        // Resolution: Explicitly cast null:
        print((Integer) null); // PRINTS "Integer"
        print((Object) null);  // PRINTS "Object"
    }
}`,
    warStory: "A production logging utility had log(Object payload) and log(Throwable t). A caller wrote logger.log(null) intending to log an empty payload. The JVM invoked log(Throwable), which threw an unhandled NullPointerException inside the error reporter."
  },

  {
    id: "q-oops-9-interface-default-diamond-rules",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "How does Java 8 resolve the Diamond Problem when two interfaces provide conflicting 'default' methods? What are the 3 resolution rules?",
    interviewerIntent: "Testing understanding of multiple interface inheritance, default method conflict resolution, and the super syntax.",
    juniorTrap: "Thinking Java does not allow multiple interfaces with same default method signature, or not knowing the exact precedence rules.",
    seniorAnswer: [
      "Java avoids the Diamond Problem in interfaces using 3 strict resolution rules:",
      "Rule 1 (Classes Win): A superclass method ALWAYS wins over an interface default method. If a class extends SuperClass and implements InterfaceA, and both have void log(), SuperClass.log() is chosen.",
      "Rule 2 (Sub-interfaces Win): If Interface B extends Interface A, and both define default void hello(), Interface B is more specific and wins.",
      "Rule 3 (Explicit Disambiguation): If two unrelated sibling interfaces provide conflicting defaults, the compiler THROWS A COMPILATION ERROR! The implementing class MUST explicitly override the method and choose a winner using InterfaceName.super.method()."
    ],
    codeSnippet: `interface InterfaceA {
    default void greet() { System.out.println("Hello from A"); }
}

interface InterfaceB {
    default void greet() { System.out.println("Hello from B"); }
}

// ❌ COMPILE ERROR without override: 'inherits unrelated defaults for greet()'
class GreetingService implements InterfaceA, InterfaceB {
    @Override
    public void greet() {
        // Explicitly resolve the conflict:
        InterfaceA.super.greet(); // Dispatches to A's implementation
        // OR: InterfaceB.super.greet();
    }
}`,
    warStory: "A microservice implemented two third-party SDK interfaces (MetricsProducer and HealthCheckProvider) that both added a default void ping() in an updated version. The CI pipeline broke on build until an explicit override was introduced."
  },

  {
    id: "q-oops-10-interface-default-object-methods",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "Why can an interface default method NOT override equals(), hashCode(), or toString() from java.lang.Object?",
    interviewerIntent: "Testing knowledge of the language design philosophy behind default methods and the 'Classes Always Win' rule.",
    juniorTrap: "Thinking it is just an arbitrary syntax restriction with no technical reason.",
    seniorAnswer: [
      "The Rule: Attempting to declare default boolean equals(Object o) or default String toString() in an interface causes a COMPILE ERROR: 'default method equals overrides a member of java.lang.Object'.",
      "The Technical Reason ('Classes Always Win'): In Java's method resolution hierarchy, any concrete method implementation inherited from a class ALWAYS takes precedence over an interface default method.",
      "The Inevitable Shadowing: Since EVERY class in Java inherits from java.lang.Object, every class already has concrete implementations of equals(), hashCode(), and toString(). Therefore, the interface default method would ALWAYS be shadowed and could NEVER execute!",
      "Language Consistency: The Java language designers intentionally forbade declaring them to avoid confusing developers with dead code that looks valid but never runs."
    ],
    codeSnippet: `interface InvalidInterface {
    // ❌ COMPILE ERROR: default method equals overrides a member of java.lang.Object
    // default boolean equals(Object other) { return true; }

    // ❌ COMPILE ERROR: default method toString overrides a member of java.lang.Object
    // default String toString() { return "Custom"; }

    // ✅ VALID: Abstract declaration in interface is allowed (forces implementer contract)
    boolean equals(Object other); 
}`,
    warStory: "A developer tried to enforce standardized JSON logging by creating an interface JsonLoggable with default String toString() { return toJson(this); }. The code failed compilation, forcing them to adopt modern Java Records or explicit abstract classes."
  },

  {
    id: "q-oops-11-the-5-jvm-invocations",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "What are the 5 method invocation bytecodes in the JVM, and which ones use static vs dynamic binding?",
    interviewerIntent: "Assessing staff-level knowledge of JVM execution engine, bytecode dispatch, and Metaspace tables.",
    juniorTrap: "Only knowing that methods are 'invoked', without understanding the differences between invokevirtual, invokespecial, and invokeinterface.",
    seniorAnswer: [
      "1. invokestatic: Invokes class-level static methods. Resolved at compile-time (Static Binding). No object reference needed on the operand stack.",
      "2. invokespecial: Invokes private methods, instance constructors (<init>), and super.method() calls. Non-virtual (Static Binding) — no V-Table dynamic lookup.",
      "3. invokevirtual: Invokes public/protected instance methods. Dynamic dispatch using the class V-Table (O(1) fixed-offset lookup).",
      "4. invokeinterface: Invokes interface methods. Uses dynamic I-Table (Interface Table) lookup because unrelated classes implement interfaces in differing slot orders.",
      "5. invokedynamic (Indy): Introduced in Java 7. Uses runtime bootstrap methods (CallSite) to determine the target. Powers Java 8+ lambdas, method handles, and string concatenation."
    ],
    codeSnippet: `public class BytecodeDemo implements Runnable {
    public static void staticMethod() {}
    private void privateMethod() {}
    
    public void demo() {
        staticMethod();        // invokestatic #2
        privateMethod();       // invokespecial #3
        new BytecodeDemo();    // invokespecial #4 <init>
        super.toString();      // invokespecial #5 (super bypasses vtable!)
        this.toString();       // invokevirtual #6
        
        Runnable r = this;
        r.run();               // invokeinterface #7 (I-Table lookup)
        
        Runnable lambda = () -> System.out.println("Indy"); // invokedynamic #8
    }
    @Override public void run() {}
}`,
    warStory: "During a high-frequency trading latency optimization, profiling showed invokeinterface was taking 3ns longer than invokevirtual due to I-Table hash collisions. Casting the hot interface reference to the concrete class in the tight loop allowed JIT to use invokevirtual and inline the call completely."
  },

  {
    id: "q-oops-12-abstract-class-vs-interface-constructors",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can an abstract class have constructors? Can an interface have constructors? How does the JVM initialize them?",
    interviewerIntent: "Checking understanding of object lifecycle, state holding capability, and the super() execution chain.",
    juniorTrap: "Answering 'No, because you cannot instantiate an abstract class!'",
    seniorAnswer: [
      "Abstract classes CAN and DO have constructors! Even if you don't write one, the compiler inserts a default no-arg constructor.",
      "Why? Abstract classes can declare state (instance variables). Their constructor is executed via super() during subclass instantiation to initialize that state.",
      "Interfaces CANNOT have constructors! Interfaces cannot hold instance state or non-static fields, so there is no instance state to initialize.",
      "JVM Lifecycle: When new ConcreteChild() is invoked, memory is allocated on the heap, and constructors execute top-down: Object.<init> ➔ AbstractParent.<init> ➔ ConcreteChild.<init>."
    ],
    codeSnippet: `abstract class AbstractAccount {
    private final String accountId; // State held in abstract class!
    private BigDecimal balance;

    // Abstract class constructor!
    public AbstractAccount(String accountId, BigDecimal balance) {
        this.accountId = Objects.requireNonNull(accountId);
        this.balance = balance;
    }
    public abstract void applyInterest();
}

class SavingsAccount extends AbstractAccount {
    public SavingsAccount(String id, BigDecimal bal) {
        super(id, bal); // Mandatory call to abstract superclass constructor!
    }
    @Override public void applyInterest() { ... }
}`,
    warStory: "An engineer refactored an abstract class into an interface with default methods, but couldn't understand why they lost thread-safe encapsulated instance state and were forced to push state fields into every concrete subclass."
  },

  {
    id: "q-oops-13-interface-private-static-final",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can an interface have private, static, or final methods? Which combinations are legal and why?",
    interviewerIntent: "Testing currency with modern Java (Java 8 and Java 9+) interface evolutions and modifier invariants.",
    juniorTrap: "Stating interfaces only allow public abstract methods, unaware of Java 8 default/static and Java 9 private methods.",
    seniorAnswer: [
      "static methods: LEGAL (Java 8+). Belong to the interface namespace. Must have a body. Not inherited by implementing classes (called via InterfaceName.method()).",
      "private methods: LEGAL (Java 9+). Must have a body. Used to encapsulate and share reusable helper code between multiple default methods without exposing it publicly.",
      "private static methods: LEGAL (Java 9+). Helper methods for interface static methods.",
      "final methods: ILLEGAL! Interface methods cannot be final. Default methods cannot be final either because interface methods are meant to be overridden or implemented."
    ],
    codeSnippet: `public interface ResilientConnector {
    // 1. Static utility method (Java 8+)
    static String getStandardProtocol() { return "HTTPS/TLSv1.3"; }

    // 2. Default API method (Java 8+)
    default void connectWithRetry(int retries) {
        logAttempt("Connecting..."); // Reuses private helper!
    }

    // 3. Private helper method (Java 9+)
    private void logAttempt(String msg) {
        System.out.println("[AUDIT " + System.currentTimeMillis() + "] " + msg);
    }

    // ❌ COMPILE ERROR: Modifier 'final' not allowed here
    // default final void lockDown() {}
}`,
    warStory: "Prior to Java 9, developers had to duplicate 40 lines of boilerplate validation logic across 5 default methods in an interface because they couldn't create private helper methods, leading to copy-paste bugs."
  },

  {
    id: "q-oops-14-fragile-base-class-hashset",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "The Fragile Base Class Problem: Why does extending HashSet to count added elements break when calling addAll()? How does Composition fix it?",
    interviewerIntent: "Testing mastery of Effective Java Item 18 ('Favor composition over inheritance') and understanding self-use in superclasses.",
    juniorTrap: "Assuming that overriding add() and addAll() and calling super.addAll() is completely safe.",
    seniorAnswer: [
      "The Fragile Base Class Problem: Subclasses are vulnerable to changes or internal implementation details of the base class.",
      "The Bug: In JDK's HashSet, addAll() internally loops and calls add()! If your subclass overrides add() (increments count) AND overrides addAll() (adds collection size to count, then calls super.addAll()), the elements are counted TWICE!",
      "Result: Adding a collection of 3 elements reports a count of 6!",
      "The Fix: **Composition with Forwarding** (ForwardingSet). Hold an internal Set instance. The wrapper controls its own counting without relying on internal superclass self-invocation."
    ],
    codeSnippet: `// ❌ BROKEN INHERITANCE:
class BrokenInstrumentedSet<E> extends HashSet<E> {
    private int addCount = 0;
    @Override public boolean add(E e) { addCount++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); // Count = 3
        return super.addAll(c); // Internally calls this.add() 3 times! Count becomes 6!
    }
}

// ✅ CLEAN COMPOSITION (Forwarding Pattern):
class InstrumentedSet<E> implements Set<E> {
    private final Set<E> delegate;
    private int addCount = 0;

    public InstrumentedSet(Set<E> delegate) { this.delegate = delegate; }
    public boolean add(E e) { addCount++; return delegate.add(e); }
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); return delegate.addAll(c); // Safe from double counting!
    }
    // Forward other Set methods...
}`,
    warStory: "An audit library subclassed a third-party metrics cache. An innocent minor upgrade of the third-party library changed an internal private method to reuse an overridden public method, silently doubling all customer billing metrics."
  },

  {
    id: "q-oops-15-generic-type-erasure-clash",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "Why can a Java class NOT implement both Comparable<String> and Comparable<Integer> simultaneously?",
    interviewerIntent: "Assessing understanding of Generics Type Erasure and bytecode method signature clash.",
    juniorTrap: "Believing that generics exist at runtime and that the class can just overload compareTo(String) and compareTo(Integer).",
    seniorAnswer: [
      "The Cause (Type Erasure): In Java, generic type parameters are erased at compile time to their upper bounds (Object).",
      "The Conflict: Both Comparable<String> and Comparable<Integer> compile down to the exact same raw interface: Comparable, with method signature compareTo(Object).",
      "The Rule: A class cannot implement two interfaces that have the same raw erasure because it cannot provide two implementations of compareTo(Object) with different behaviors.",
      "Compiler Error: 'name clash: Comparable<String> and Comparable<Integer> have the same erasure'."
    ],
    codeSnippet: `// ❌ COMPILE ERROR: Cannot inherit both with type erasure!
// class AmbiguousEntity implements Comparable<String>, Comparable<Integer> {
//     @Override public int compareTo(String s) { return 0; }
//     @Override public int compareTo(Integer i) { return 0; }
// }

// ✅ SOLUTION: Use separate strategy objects (Comparator):
class Entity {
    public static final Comparator<Entity> BY_NAME = Comparator.comparing(e -> e.name);
    public static final Comparator<Entity> BY_ID = Comparator.comparingInt(e -> e.id);
    private String name;
    private int id;
}`,
    warStory: "A developer designing an API gateway tried to implement Consumer<UserEvent> and Consumer<OrderEvent> on the same Spring @Component, failing the maven build until they split it into distinct specialized event listener beans."
  },

  {
    id: "q-oops-16-marker-interfaces-vs-annotations",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Why did early Java use Marker Interfaces (Serializable, Cloneable) instead of Annotations? Why did modern Java evolve to Annotations?",
    interviewerIntent: "Testing architectural history, type-system design, and runtime reflection tradeoffs.",
    juniorTrap: "Assuming annotations are always better in every situation, or not knowing that marker interfaces define a compile-time type.",
    seniorAnswer: [
      "Marker Interface (Serializable, Cloneable, RandomAccess): An interface with 0 methods. It defines a REAL TYPE in the Java type system.",
      "Benefit: Compile-time type safety! You can declare a method: void save(Serializable obj) — the compiler guarantees at compile time that non-serializable objects cannot be passed. Annotations cannot enforce this parameter type check.",
      "Why Java moved to Annotations (@FunctionalInterface, @Deprecated): Marker interfaces cannot be added to a class without modifying its source code. Annotations allow attaching arbitrary metadata with values (parameters) without modifying the type hierarchy.",
      "Best Practice: Use Marker Interfaces if you want to define a type that is used in variable/parameter declarations. Use Annotations if you want to attach metadata for framework reflection."
    ],
    codeSnippet: `// Marker Interface defines a compile-time type constraint:
public void persistState(Serializable payload) {
    // Compiler guarantees payload is Serializable at compile time!
}

// Annotation attaches metadata with attributes:
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface AuditLogged {
    String channel() default "SECURITY";
}`,
    warStory: "A caching system accepted Object and checked @Cacheable via reflection. A developer passed a non-serializable object into a distributed Redis cluster, throwing runtime serialization errors that a Serializable parameter type would have caught at compile time."
  },

  {
    id: "q-oops-17-subclass-constructor-exceptions",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can a subclass constructor declare checked exceptions NOT declared by the superclass constructor? (Contrast with method overriding!)",
    interviewerIntent: "Catching candidates who blindly apply method overriding exception rules to constructors.",
    juniorTrap: "Applying the method overriding rule and claiming subclass constructors cannot throw broader checked exceptions.",
    seniorAnswer: [
      "YES! A subclass constructor CAN throw new or broader checked exceptions than the superclass constructor.",
      "The Mandatory Super Rule: If a superclass constructor declares throws IOException, the subclass constructor MUST declare throws IOException (or a broader superclass like throws Exception) because the subclass constructor is MANDATED to call super()!",
      "The Crucial Contrast: In method overriding, you cannot broaden checked exceptions (LSP constraint). In constructors, there is NO polymorphism — constructors are invoked directly, so the caller knows the exact concrete type being instantiated and can handle its specific exceptions."
    ],
    codeSnippet: `class SuperResource {
    public SuperResource() throws IOException {
        // May fail during initial file handle acquisition
    }
}

class SubResource extends SuperResource {
    // ✅ VALID: Must declare IOException (or broader), and can add new ones!
    public SubResource() throws IOException, SQLException {
        super(); // Calls super constructor
        // Connects to DB...
    }
}`,
    warStory: "A developer spent hours trying to catch IOException inside a subclass constructor around super(): try { super(); } catch... Java forbids any statements before super(), forcing the subclass constructor to declare the exception in its signature."
  },

  {
    id: "q-oops-18-overloading-by-return-type",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can we overload a method by changing ONLY its return type in Java source code vs in JVM class file bytecode?",
    interviewerIntent: "Assessing understanding of the difference between Java language specification and JVM class file format specification.",
    juniorTrap: "Saying 'No' without knowing that the JVM bytecode specification actually DOES permit it.",
    seniorAnswer: [
      "In Java Source Code: NO! A method signature consists strictly of: Method Name + Parameter Types. The return type is NOT part of the method signature for overload resolution.",
      "Why? Because callers can invoke methods without assigning the return value (doWork();). The compiler would have zero context to determine which overload to call.",
      "In JVM Bytecode: YES! In the JVM class file specification, a method descriptor includes the parameter types AND the return type (e.g. foo()Ljava/lang/String; vs foo()Ljava/lang/Object;).",
      "This JVM feature is the exact mechanism that enables synthetic bridge methods for covariant returns and generic type erasure."
    ],
    codeSnippet: `// ❌ COMPILE ERROR in Java source: 'method is already defined'
// public class Test {
//     public int compute() { return 1; }
//     public String compute() { return "1"; }
// }

// In Bytecode: The JVM has no problem with both existing in the same Klass:
// Method int compute:()I
// Method java.lang.String compute:()Ljava/lang/String;`,
    warStory: "A bytecode manipulation tool (ByteBuddy) generated two methods with the same name and arguments but different return types. Java reflection found both, but standard Java code couldn't invoke the second one without reflective Method.invoke()."
  },

  {
    id: "q-oops-19-abstract-method-modifiers-illegal",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Why can an abstract method never be static, private, final, or synchronized?",
    interviewerIntent: "Testing semantic contradictions among Java keywords and object-oriented principles.",
    juniorTrap: "Memorizing that they are illegal without understanding the inherent logical contradiction of each combination.",
    seniorAnswer: [
      "abstract static: ILLEGAL! Static methods cannot be overridden dynamically (resolved via invokestatic). abstract demands dynamic overriding.",
      "abstract private: ILLEGAL! Private methods are invisible to subclasses and cannot be inherited or overridden.",
      "abstract final: ILLEGAL! final explicitly forbids overriding, while abstract mandates overriding.",
      "abstract synchronized: ILLEGAL! Synchronization is an implementation detail of the method body, not a signature contract. An abstract method has no body to synchronize."
    ],
    codeSnippet: `abstract class InvariantCheck {
    // ❌ COMPILE ERROR: illegal combination of modifiers: abstract and static
    // abstract static void doStatic();

    // ❌ COMPILE ERROR: illegal combination of modifiers: abstract and private
    // abstract private void doPrivate();

    // ❌ COMPILE ERROR: illegal combination of modifiers: abstract and final
    // abstract final void doFinal();

    // ❌ COMPILE ERROR: illegal combination of modifiers: abstract and synchronized
    // abstract synchronized void doSync();
}`,
    warStory: "A candidate in an interview wrote abstract synchronized void process() intending to enforce that all subclass implementations are thread-safe. The interviewer probed how concurrency is an implementation detail that interfaces and abstract contracts cannot enforce."
  },

  {
    id: "q-oops-20-polymorphic-overload-vs-override",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "Polymorphic Overload vs Override: What does p.test(c) print when Parent p = new Child() and Child c = new Child()?",
    interviewerIntent: "The ultimate JVM method dispatch trap: evaluating the interaction between compile-time overload binding and runtime override dispatch.",
    juniorTrap: "Guessing 'C-C' (Child-Child) assuming runtime polymorphism applies to method parameter overloads.",
    seniorAnswer: [
      "It prints 'C-P' (Child-Parent)! Here is the step-by-step JVM resolution:",
      "Step 1 (Compile-Time Overload Selection): The reference type of variable p is Parent. The compiler looks ONLY at Parent class methods. Parent has only one method: test(Parent). The compiler binds the call to Parent.test(Parent) at compile time!",
      "Step 2 (Runtime Virtual Dispatch): At runtime, invokevirtual executes on the actual object (Child). The JVM looks up test(Parent) in Child's V-Table.",
      "Child overrides test(Parent). Therefore, Child.test(Parent) executes!",
      "Child.test(Child) is completely ignored because it was never selected during compile-time overload binding."
    ],
    codeSnippet: `class Parent {
    void test(Parent p) { System.out.println("P-P"); }
}

class Child extends Parent {
    @Override void test(Parent p) { System.out.println("C-P"); }
    void test(Child c) { System.out.println("C-C"); } // Overload, not override!
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        Child c = new Child();
        p.test(c); // PRINTS "C-P"! NOT "C-C"!
    }
}`,
    warStory: "An event processing engine had EventHandler.handle(Event e) overridden in a subclass that also added handle(OrderEvent e). Because events were dispatched via generic EventHandler references, the specialized handle(OrderEvent) was never called, routing all orders to generic fallback handlers."
  },

  {
    id: "q-oops-21-final-class-vs-private-constructor",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can a class with only private constructors be inherited? What is the edge case with nested static inner classes?",
    interviewerIntent: "Checking knowledge of constructor inheritance mechanics and Java inner class access boundaries.",
    juniorTrap: "Stating categorically that a class with only private constructors can never be inherited anywhere.",
    seniorAnswer: [
      "General Rule: A class with only private constructors CANNOT be subclassed by outside classes because any subclass constructor must call super(), which cannot access private members.",
      "The Exception (Nested Inner Classes): A nested static inner class inside that same outer class CAN extend it! In Java, enclosing classes and their nested classes share a nest-mate access boundary and can access each other's private constructors.",
      "Difference from final: A final class cannot be extended by ANY class, even inner classes."
    ],
    codeSnippet: `class Enclosing {
    private Enclosing() { System.out.println("Private Constructor"); }

    // ✅ VALID: Nested class can extend Enclosing because it has access to private constructor!
    public static class SubClass extends Enclosing {
        public SubClass() { super(); }
    }
}

// ❌ COMPILE ERROR in external class: Enclosing() has private access
// class ExternalChild extends Enclosing {}`,
    warStory: "The singleton pattern with private constructor was breached when a junior developer added a nested test stub class extending the singleton directly inside the production file, bypassing singleton instance constraints."
  },

  {
    id: "q-oops-22-sealed-classes-pattern-matching",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "How do Sealed Classes (Java 17+) solve the 'Unbounded Polymorphism' problem, and how do they enable compiler exhaustiveness checks in switch expressions?",
    interviewerIntent: "Testing modern Java architecture, domain modeling with Algebraic Data Types (ADT), and compiler-enforced pattern matching.",
    juniorTrap: "Assuming sealed classes are just a minor variation of final classes.",
    seniorAnswer: [
      "Unbounded Polymorphism Problem: When designing a library, making a class public allows ANY client in any package to extend it. This forces developers to write defensive default branches or throw runtime exceptions.",
      "Sealed Classes (sealed, permits): Restrict which specific classes are allowed to implement or extend a type.",
      "Subclass Constraints: Permitted subclasses must be in the same module/package and MUST explicitly declare: final, sealed, or non-sealed.",
      "Compiler Exhaustiveness: When switching over a sealed hierarchy in a Java 21 switch expression, the compiler verifies that all permitted subclasses are covered. No redundant default: branch is needed! If someone adds a new permitted subclass in the future, the compiler instantly flags all unhandled switch statements across the codebase."
    ],
    codeSnippet: `public sealed interface LoanApplication 
    permits ApprovedLoan, RejectedLoan, UnderReviewLoan {}

public record ApprovedLoan(String loanId, BigDecimal amount) implements LoanApplication {}
public record RejectedLoan(String loanId, String reason) implements LoanApplication {}
public record UnderReviewLoan(String loanId, int riskScore) implements LoanApplication {}

// Compiler guarantees all cases covered - NO 'default:' needed!
public String auditLoan(LoanApplication app) {
    return switch (app) {
        case ApprovedLoan a -> "Disburse funds: " + a.amount();
        case RejectedLoan r -> "Send rejection notice: " + r.reason();
        case UnderReviewLoan u -> "Assign to credit officer, risk: " + u.riskScore();
    };
}`,
    warStory: "An airline reservation system migrated payment statuses from enums to sealed records. When a new SplitPayment status was added, the Java compiler immediately caught 14 unhandled switch cases across billing, fraud, and accounting services, preventing production crashes."
  },

  {
    id: "q-oops-23-records-inheritance-constraints",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Can a Java Record extend another class or be extended? Can a Record implement interfaces?",
    interviewerIntent: "Checking understanding of Java Records design invariants, finality, and type restrictions.",
    juniorTrap: "Thinking records can extend other classes as long as fields match, or thinking records cannot implement interfaces.",
    seniorAnswer: [
      "Can a Record extend another class? NO! All records implicitly extend java.lang.Record. Because Java does not allow multiple class inheritance, a record cannot extend any other class.",
      "Can a Record be extended? NO! All records are implicitly final and cannot be subclassed.",
      "Can a Record implement interfaces? YES! A record can implement one or multiple interfaces, including sealed interfaces.",
      "Can a Record declare instance fields? NO! Records can only declare static fields. All instance state must be declared in the record header."
    ],
    codeSnippet: `public interface Auditable { String getAuditId(); }

// ✅ VALID: Implements interface, pure immutable data carrier
public record UserAuditRecord(String userId, Instant timestamp) implements Auditable {
    @Override
    public String getAuditId() { return userId + "-" + timestamp.toEpochMilli(); }
}

// ❌ COMPILE ERROR: Cannot extend another class
// public record InvalidRecord(String name) extends BaseEntity {}`,
    warStory: "A developer attempted to make JPA entities into Java Records. Hibernate failed on startup because JPA requires bytecode proxying (subclassing) and lazy loading field mutation, both of which are strictly forbidden by Record finality."
  },

  {
    id: "q-oops-24-inner-class-extending-outer",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "Can an inner class extend its own outer class? What does the resulting JVM object layout and 'this' pointer look like?",
    interviewerIntent: "Testing boundary-pushing knowledge of Java scoping, lexical vs inheritance hierarchies, and synthetic outer pointers.",
    juniorTrap: "Assuming it causes circular inheritance compiler error.",
    seniorAnswer: [
      "YES! An inner class can extend its outer class: class Outer { class Inner extends Outer {} }. It is 100% syntactically legal.",
      "Dual Identity: An instance of Inner is a subclass of Outer AND has an implicit enclosing reference to an instance of Outer (Outer.this).",
      "Memory Layout: The Inner object on the heap has: 1) Its own fields; 2) Inherited fields from Outer; 3) A compiler-generated synthetic reference this$0 pointing to the enclosing Outer instance.",
      "Disambiguation: this.field accesses the inherited field; Outer.this.field accesses the enclosing instance's field."
    ],
    codeSnippet: `class Outer {
    int value = 10;

    class Inner extends Outer {
        int value = 20;

        void printValues() {
            System.out.println(this.value);       // 20 (Inner's field)
            System.out.println(super.value);      // 10 (Inherited from Outer superclass)
            System.out.println(Outer.this.value); // 10 (Enclosing instance's field)
        }
    }
}`,
    warStory: "An esoteric design in a financial math DSL used inner classes extending outer calculation nodes. A circular memory leak occurred because inner calculation nodes held strong this$0 references to the entire enclosing pipeline, preventing garbage collection."
  },

  {
    id: "q-oops-25-downcasting-instanceof-pattern-matching",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Why is repeated downcasting an antipattern, and how does Java 16+ Pattern Matching (instanceof) optimize JVM bytecode execution?",
    interviewerIntent: "Assessing code quality principles, ClassCastException risks, and modern JVM pattern matching optimizations.",
    juniorTrap: "Relying on giant chains of if (x instanceof A) { ((A)x).doA(); } without knowing the performance and clean code impact.",
    seniorAnswer: [
      "The Antipattern: Giant if-else chains with instanceof and explicit casts violate the Open/Closed Principle (OCP). Adding a new subclass requires modifying all checking code.",
      "The Redundant Work in Legacy Java: if (obj instanceof String) { String s = (String) obj; } executes TWO separate runtime checks: 1) instanceof verifies the type; 2) checkcast bytecode verifies the type a second time and throws ClassCastException if invalid.",
      "Java 16+ Pattern Matching: if (obj instanceof String s) combines type checking and binding into a single atomic operation in bytecode, eliminating redundant checkcast overhead and scope pollution."
    ],
    codeSnippet: `// ❌ LEGACY (Double check in bytecode):
if (obj instanceof Order) {
    Order o = (Order) obj; // Redundant 'checkcast' bytecode!
    o.process();
}

// ✅ MODERN JAVA 16+ (Single check + localized scope):
if (obj instanceof Order o && o.isActive()) {
    o.process(); // 'o' in scope only when true!
}`,
    warStory: "A high-throughput message router spent 8% of its total CPU cycles performing redundant checkcast instructions in a 12-branch instanceof cascade. Refactoring to polymorphic visitor/strategy patterns eliminated the CPU bottleneck."
  },

  {
    id: "q-oops-26-object-slicing-cpp-vs-java",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "What is Object Slicing in C++, and why is Object Slicing physically impossible in Java?",
    interviewerIntent: "Assessing memory management across programming languages and the reference-pointer model of Java.",
    juniorTrap: "Thinking Java passes objects by value and can slice subclasses when passed to parent type parameters.",
    seniorAnswer: [
      "What is Object Slicing (in C++)? In C++, if a subclass object is assigned by value to a base class variable (Base b = derivedObj;), the compiler copies only the base part of the object, permanently slicing off all derived member variables.",
      "Why Object Slicing is Impossible in Java: In Java, objects themselves are NEVER stored directly in variables or passed by value. All non-primitive variables are REFERENCE POINTERS on the stack pointing to memory on the Heap.",
      "Heap Integrity: Assigning Parent p = new Child() merely copies the 64-bit reference address pointer. The underlying object on the heap remains a complete, intact Child instance with all its subclass fields and its Klass V-Table pointer!"
    ],
    codeSnippet: `class Parent { int a = 1; }
class Child extends Parent { int b = 2; }

public class SlicingDemo {
    public static void inspect(Parent p) {
        // 'p' is just an 8-byte reference pointer to the full Child object on heap!
        // No slicing occurred!
        if (p instanceof Child c) {
            System.out.println("Child field intact: " + c.b); // Prints 2!
        }
    }
}`,
    warStory: "A C++ engineer transitioning to Java wrote defensive cloning adapters before passing subclasses to service methods, fearing object slicing, which added 50ms of needless heap allocation overhead to every request."
  },

  {
    id: "q-oops-27-varargs-overloading-traps",
    category: "OOPs & Polymorphism",
    difficulty: "Senior",
    question: "Why does calling test() fail to compile when test(int... a) and test(Integer... a) coexist? How does the compiler resolve varargs?",
    interviewerIntent: "Testing subtle compiler overload resolution rules involving autoboxing, widening, and varargs phases.",
    juniorTrap: "Assuming the compiler picks primitive int because primitive types usually take precedence over boxed types.",
    seniorAnswer: [
      "The 3 Phases of Overload Resolution (JLS §15.12.2):",
      "Phase 1: Subtyping without boxing or varargs.",
      "Phase 2: Subtyping with boxing/unboxing, but NO varargs.",
      "Phase 3: Overloading with VARARGS.",
      "The Conflict: When calling test() with zero arguments, both int... and Integer... match in Phase 3 with an empty array. Neither int[] nor Integer[] is a subtype of the other!",
      "Result: The compiler throws: 'reference to test is ambiguous, both methods match'."
    ],
    codeSnippet: `public class VarargsTrap {
    static void test(int... a) { System.out.println("int varargs"); }
    static void test(Integer... a) { System.out.println("Integer varargs"); }

    public static void main(String[] args) {
        // test(); // ❌ COMPILE ERROR: reference to test is ambiguous!
        
        test(1, 2);           // PRINTS "int varargs" (Exact primitive match wins!)
        test(new Integer(1)); // PRINTS "Integer varargs"
    }
}`,
    warStory: "A telemetry logging library added an overloaded metric(String tag, double... values) alongside an existing metric(String tag, Double... values). Dozens of microservices calling metric('ping') with no values suddenly failed compilation upon library update."
  },

  {
    id: "q-oops-28-multiple-inheritance-state-vs-type",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "Why did Java strictly reject multiple inheritance of state (instance fields) while embracing multiple inheritance of behavior (default methods)?",
    interviewerIntent: "Assessing staff-level understanding of language architecture, memory layouts, and the true complexity of the Diamond Problem.",
    juniorTrap: "Believing that multiple inheritance of classes was rejected simply because of method name collisions (which Java 8 default methods already solved!).",
    seniorAnswer: [
      "The Real Complexity: Multiple inheritance of STATE (instance fields) creates catastrophic physical memory layout problems.",
      "In C++: If Class D inherits from B and C, which both inherit from A, does an instance of D contain ONE copy of A's fields or TWO? C++ requires 'Virtual Base Tables' (vbtable), adding pointer adjustments to every field access.",
      "Java's Rejection: Java chose simplicity and performance. By guaranteeing single class inheritance, every object on the Java heap has a single, linear, predictable memory layout: [Header][Super fields][Child fields]. Field offsets are fixed constants!",
      "Multiple Behavior is Safe: Interface default methods have NO instance state. Conflict resolution is purely a compile-time naming check with zero memory layout ambiguity."
    ],
    codeSnippet: `// Java's Clean Separation:
// 1. Single Inheritance of State (Predictable linear memory layout):
class ChildState extends ParentState { int childField; }

// 2. Multiple Inheritance of Behavior (No state conflict!):
class Worker extends ChildState implements Runnable, AutoCloseable, Comparable<Worker> {
    @Override public void run() {}
    @Override public void close() {}
    @Override public int compareTo(Worker o) { return 0; }
}`,
    warStory: "An architect in an enterprise committee proposed adding stateful traits to Java. The proposal was rejected when benchmark simulations proved that non-linear heap offsets would degrade CPU L1 cache prefetching by 30% across the JVM."
  },

  {
    id: "q-oops-29-jit-inline-caching-polymorphism",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "How does the HotSpot C2 JIT Compiler optimize virtual method calls via Monomorphic Inline Caching (MIC), Bimorphic Inline Caching (BIC), and Megamorphic fallbacks?",
    interviewerIntent: "Assessing deep knowledge of JVM runtime performance, JIT profiling, and speculative optimization.",
    juniorTrap: "Assuming polymorphism always requires a runtime V-Table memory lookup for every single call.",
    seniorAnswer: [
      "The Myth: Every virtual method call costs a V-Table lookup.",
      "The Reality (Inline Caching): The HotSpot JIT compiler profiles call sites at runtime:",
      "1. Monomorphic Call Site (1 receiver type seen, >90% of real code): JIT devirtualizes the call into a direct assembly jump or directly INLINES the method bytecode into the caller! V-Table cost is ZERO.",
      "2. Bimorphic Call Site (2 receiver types seen, e.g. Dog and Cat): JIT generates a fast conditional branch: if (obj.class == Dog) dog(); else if (obj.class == Cat) cat();.",
      "3. Megamorphic Call Site (3+ receiver types seen): JIT gives up on inlining and falls back to a standard V-Table array offset lookup.",
      "Safepoints & Deoptimization: If JIT inlined Dog under monomorphic assumption, and a new Wolf subclass is dynamically loaded, the JVM invalidates the compiled machine code at a safepoint and re-compiles!"
    ],
    codeSnippet: `// JIT Profiling Example:
public void loop(Animal a) {
    a.makeSound(); 
    // If only 'Dog' is passed for 10,000 iterations:
    // C2 JIT replaces virtual dispatch with inlined machine code:
    // System.out.println("Woof");
}`,
    warStory: "A payment gateway saw CPU usage spike by 40% after introducing a mock TestPaymentProcessor in production code. The call site transitioned from Monomorphic (inlined direct jump) to Megamorphic (vtable lookup), evicting hot native machine code from the JIT code cache."
  },

  {
    id: "q-oops-30-liskov-substitution-pre-post-conditions",
    category: "OOPs & Polymorphism",
    difficulty: "Staff",
    question: "Explain the Liskov Substitution Principle (LSP) in terms of Preconditions, Postconditions, and Invariants. Give a concrete Java contract violation.",
    interviewerIntent: "Testing formal software engineering design principles and defensive API contract architecture.",
    juniorTrap: "Only reciting 'Subtypes must be substitutable for base types' without knowing the formal rules on preconditions and postconditions.",
    seniorAnswer: [
      "Barbara Liskov's Formal Contract Rules for Subtyping:",
      "1. Preconditions cannot be strengthened in a subtype (Subclass cannot demand MORE than the parent).",
      "2. Postconditions cannot be weakened in a subtype (Subclass cannot guarantee LESS than the parent).",
      "3. Invariants of the supertype must be preserved in the subtype.",
      "Concrete Precondition Violation: If Parent.process(int val) accepts any integer >= 0, a Child override that throws an exception if val < 100 strengthens the precondition and breaks LSP!",
      "Concrete Postcondition Violation: If Parent.filter() guarantees a non-null List, a Child returning null weakens the postcondition and causes callers to crash with NPE."
    ],
    codeSnippet: `class OrderProcessor {
    // Contract: Accepts any amount >= 0. Returns non-null receipt.
    public Receipt process(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException();
        return new Receipt("APPROVED");
    }
}

class VipOrderProcessor extends OrderProcessor {
    // ❌ VIOLATES LSP (Strengthening Preconditions):
    // Refuses amounts under $1000! Callers expecting standard contract will fail!
    @Override
    public Receipt process(BigDecimal amount) {
        if (amount.compareTo(new BigDecimal("1000")) < 0) {
            throw new IllegalArgumentException("VIP minimum is $1000"); // Breaks LSP!
        }
        return new Receipt("VIP_APPROVED");
    }
}`,
    warStory: "A banking integration subclassed a generic AccountValidator. The subclass added a rule rejecting accounts without tax IDs. The generic batch payment processor, unaware of this tightened precondition, crashed mid-run, failing 12,000 commercial wire transfers."
  }
];
