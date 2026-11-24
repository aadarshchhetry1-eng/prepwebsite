/**
 * java-versions-data.js
 * Comprehensive Version-by-Version LTS Evolution Ladder (Java 8 -> 11 -> 17 -> 21 -> 25)
 * Version-specific features, internal JVM changes, compiler/runtime traps, and interviewer pivot strategies.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.JAVA_VERSION_MATRIX = [
  {
    version: "Java 8 (LTS)",
    releaseYear: "2014",
    status: "Legacy Baseline",
    flagshipFeatures: "Lambdas, Streams API, Optional<T>, CompletableFuture, java.time (JSR-310), default/static interface methods",
    classicTrap: "Reusing a consumed Stream; blocking I/O in parallelStream() starving common ForkJoinPool; Optional.orElse() eager execution; mutating variables outside lambda (must be effectively final).",
    jvmMemoryEvolution: "PermGen completely removed and replaced by Metaspace (native OS memory, auto-resizing), eliminating OutOfMemoryError: PermGen space."
  },
  {
    version: "Java 11 (LTS)",
    releaseYear: "2018",
    status: "Modernized Core",
    flagshipFeatures: "var (Local-Variable Type Inference), standard HttpClient (HTTP/2 & WebSockets), String helper methods (.isBlank(), .strip(), .repeat()), List.of() / Map.of() / Set.of() immutable collections",
    classicTrap: "List.of(null) throws NPE immediately; List.of() is strictly immutable (add/set throws UnsupportedOperationException); 'var' cannot be used for class fields, method params, or uninitialized variables.",
    jvmMemoryEvolution: "G1GC becomes the default garbage collector (replacing Parallel GC); ZGC introduced as experimental ultra-low-latency collector; Java Modules (JPMS) enforced (--add-opens needed for reflection)."
  },
  {
    version: "Java 17 (LTS)",
    releaseYear: "2021",
    status: "Spring Boot 3 Baseline",
    flagshipFeatures: "Records (immutable data carriers), Sealed Classes & Interfaces ('permits'), Pattern Matching for instanceof, Switch Expressions (arrow syntax), Text Blocks (\"\"\"...\"\"\")",
    classicTrap: "Using a Record as a Hibernate/JPA @Entity (fails because JPA requires no-arg constructor, non-final class, and mutable state for dirty checking & proxies); forgetting exhaustive switch branches.",
    jvmMemoryEvolution: "Strong encapsulation of JDK internals by default (cannot access sun.misc.Unsafe via reflection without --add-opens); macOS/AArch64 (Apple Silicon) native port; removal of Applet API & RMI Activation."
  },
  {
    version: "Java 21 (LTS)",
    releaseYear: "2023",
    status: "Loom & Data-Oriented",
    flagshipFeatures: "Virtual Threads (Project Loom), Pattern Matching for switch, Record Patterns (deconstruction), Sequenced Collections (SequencedCollection/Set/Map), Key Encapsulation Mechanism API",
    classicTrap: "Assuming Virtual Threads speed up CPU-bound tasks (they only boost I/O-bound concurrency); Pinning Virtual Threads to OS carrier threads by doing blocking I/O inside synchronized blocks instead of ReentrantLock.",
    jvmMemoryEvolution: "Generational ZGC introduced (separate young & old generations in ZGC, maintaining <1ms pause times with significantly lower CPU and memory overhead)."
  },
  {
    version: "Java 25 (LTS)",
    releaseYear: "Sept 2025",
    status: "Latest LTS Benchmark",
    flagshipFeatures: "Scoped Values (ScopedValue - immutable, lightweight ThreadLocal replacement), Structured Concurrency (StructuredTaskScope), Compact Object Headers (Project Lilliput 8-byte headers), Flexible Constructor Bodies",
    classicTrap: "ThreadLocal memory leaks in high-throughput Virtual Thread pools (fixed by Scoped Values); unhandled subtask failures leaking orphan threads (fixed by StructuredTaskScope).",
    jvmMemoryEvolution: "Project Lilliput compacts JVM object headers from 12-16 bytes down to 8 bytes, shrinking heap footprint by 10-20% and improving CPU L1/L2/L3 cache locality."
  }
];

window.REVISION_APP_DATA.JAVA_VERSIONS = [
  // =========================================================================
  // 1. JAVA 8
  // =========================================================================
  {
    id: "java-version-8",
    versionNumber: "Java 8",
    title: "Java 8: The Baseline Everyone Assumes You Know",
    badge: "LTS Baseline (2014)",
    releaseYear: "2014",
    oneLiner: "Functional programming foundation: Lambdas, Streams, CompletableFuture, Optional, java.time, and Metaspace.",
    whatIsIt: "Even if your project runs on Java 21, interviewers treat Java 8 as the non-negotiable foundation. They will test whether you understand the closures, stream pipeline mechanics, asynchronous threading models, and JVM native memory allocation that transformed modern Java.",
    flagshipFeatures: [
      "Lambda Expressions & Functional Interfaces: @FunctionalInterface with SAM (Single Abstract Method). Core interfaces: Predicate<T> (test), Function<T, R> (apply), Consumer<T> (accept), Supplier<T> (get).",
      "Streams API: Declarative data processing using lazy intermediate operations (filter, map, flatMap, sorted, peek) and eager terminal operations (collect, reduce, count, findFirst, forEach).",
      "Optional<T>: Value-based container to represent presence or absence of a return value without throwing NullPointerException.",
      "CompletableFuture<T>: Non-blocking asynchronous event-driven pipeline composition (supplyAsync, thenApply, thenCompose, allOf, exceptionally).",
      "java.time (JSR-310): Immutable, thread-safe date and time domain model (LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Instant, Duration, Period) replacing mutable java.util.Date and SimpleDateFormat.",
      "Default & Static Interface Methods: Allows adding new methods to interfaces without breaking backward compatibility for implementing classes."
    ],
    traps: [
      "Effectively Final Variable Trap: Lambdas can only capture local variables that are final or 'effectively final' (never modified after assignment). Reason: Local primitive/reference variables live on the thread stack frame; lambdas capture their values by copying them. If they were mutable, stack copy and lambda copy would desynchronize.",
      "Stream Re-use Trap: A Stream pipeline can only be traversed and consumed ONCE. Attempting to call another terminal operation on a consumed stream throws 'IllegalStateException: stream has already been operated upon or closed'.",
      "Parallel Stream Starvation Trap: parallelStream() defaults to ForkJoinPool.commonPool(), which is shared across the ENTIRE JVM. Never run blocking I/O (REST HTTP calls, slow DB queries) inside parallelStream(), or you will starve all other threads in the JVM.",
      "Optional.orElse() Eager Evaluation Trap: opt.orElse(expensiveMethod()) ALWAYS calls expensiveMethod() even if opt is present! Always use opt.orElseGet(() -> expensiveMethod()) for lazy evaluation.",
      "Optional Misuse Trap: Never use Optional as a method parameter, Map key, or entity field; it is not Serializable and incurs 16-24 bytes of heap wrapper overhead."
    ],
    jvmMemoryChange: "PermGen Removed ➔ Metaspace Added: Permanent Generation (PermGen), which resided in the contiguous JVM heap with fixed max size (-XX:MaxPermSize), was completely removed. It was replaced by Metaspace, which allocates class metadata in native OS memory. Metaspace auto-sizes by default up to available OS RAM (constrained via -XX:MaxMetaspaceSize), eliminating classic 'java.lang.OutOfMemoryError: PermGen space'.",
    codeSnippet: `// 1. Effectively Final Trap
int counter = 0;
// Runnable r = () -> System.out.println(counter++); // COMPILE ERROR! Variable must be effectively final.

// 2. Parallel Stream Common Pool Starvation Trap
// DANGEROUS: Saturated commonPool() blocks entire JVM!
list.parallelStream().forEach(url -> hitExternalHttpApi(url));

// 3. Optional Eager vs Lazy Trap
Optional<User> userOpt = Optional.of(currentUser);
userOpt.orElse(queryDatabaseForFallback());    // WRONG: Always hits database!
userOpt.orElseGet(() -> queryDatabaseForFallback()); // CORRECT: Queries DB ONLY if empty!`,
    interviewPivot: "When an interviewer asks about Java 8, they usually want to see if you understand why lambdas require effectively final variables and whether you know better than to run blocking I/O in parallel streams."
  },

  // =========================================================================
  // 2. JAVA 11
  // =========================================================================
  {
    id: "java-version-11",
    versionNumber: "Java 11",
    title: "Java 11 (LTS): Modernizing HTTP, Strings & Memory Management",
    badge: "LTS Standard (2018)",
    releaseYear: "2018",
    oneLiner: "Local-variable type inference ('var'), standard reactive HttpClient, immutable collection factories, and G1GC default.",
    whatIsIt: "Java 11 solidified the 6-month release cadence and represented the first major LTS release after the Java 9 modularity overhaul. It modernized daily developer ergonomics with 'var', introduced a clean reactive HTTP client, and shifted the production GC default.",
    flagshipFeatures: [
      "Local-Variable Type Inference ('var' - from Java 10): Static compile-time type inference for local variables with initializers (var list = new ArrayList<String>()). Eliminates visual ceremony while preserving 100% compile-time type safety.",
      "Standard java.net.http.HttpClient: Modern, non-blocking HTTP client supporting HTTP/1.1, HTTP/2, WebSockets, and asynchronous reactive pipelines via CompletableFuture and Flow.Publisher.",
      "Convenience String APIs: .isBlank() (checks whitespace), .strip() (Unicode-aware whitespace removal, unlike .trim() which only checks <= U+0020), .lines() (returns Stream<String>), .repeat(n).",
      "Collection Factory Methods (Java 9+): List.of(), Set.of(), Map.of(), Map.ofEntries() for constructing truly immutable, compact collections.",
      "Running Single-File Source Programs: Direct execution of scripts via 'java Application.java' without explicit javac compilation step."
    ],
    traps: [
      "'var' Scope Limitations: 'var' CANNOT be used for class fields, method parameter types, method return types, or uninitialized variables. It is NOT dynamic typing like JavaScript; the type is permanently resolved by javac at compile time.",
      "Immutable Collections Null Rejection Trap: List.of(), Set.of(), and Map.of() explicitly REJECT null elements. Passing null throws NullPointerException immediately. Furthermore, Set.of('A', 'A') throws IllegalArgumentException on duplicate keys.",
      "Immutable Collections Mutation Trap: List.of() returns an unmodifiable internal collection; calling .add(), .remove(), or .set() throws UnsupportedOperationException at runtime.",
      "String .trim() vs .strip() Trap: .trim() only removes ASCII whitespace characters (code <= 32). .strip() removes all Unicode whitespace (e.g. non-breaking space \\u00A0, zero-width space). In internationalized applications, always use .strip()."
    ],
    jvmMemoryChange: "G1GC Default & Experimental ZGC: G1GC (Garbage-First) became the default garbage collector, replacing Parallel GC. Java 11 also introduced ZGC (Z Garbage Collector) experimentally—pioneering colored pointers and load barriers to keep GC pause times under 10ms for multi-terabyte heaps. Java Modules (JPMS) enforced strong encapsulation: reflective access to JDK internal packages requires explicit '--add-opens' JVM launch flags.",
    codeSnippet: `// 1. var Compile-time Inference
var client = HttpClient.newHttpClient();
var request = HttpRequest.newBuilder(URI.create("https://api.onix.com/health"))
    .GET()
    .build();

// 2. Reactive Asynchronous HTTP/2 Call
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println);

// 3. Immutable Collection Trap
List<String> list = List.of("A", "B");
// list.add("C"); // THROWS UnsupportedOperationException!
// List<String> nullList = List.of("A", null); // THROWS NullPointerException!`,
    interviewPivot: "Expect interviewers to probe whether you understand that 'var' is static typing, how List.of() differs from Collections.unmodifiableList() (shallow wrapper vs true immutable), and why upgrading to Java 11 breaks reflection without --add-opens."
  },

  // =========================================================================
  // 3. JAVA 17
  // =========================================================================
  {
    id: "java-version-17",
    versionNumber: "Java 17",
    title: "Java 17 (LTS): Modern Domain Modeling & Spring Boot 3 Baseline",
    badge: "LTS Standard (2021)",
    releaseYear: "2021",
    oneLiner: "Domain modeling leap: Records, Sealed Classes, Pattern Matching for instanceof, Switch Expressions, and Text Blocks.",
    whatIsIt: "Java 17 is the mandatory baseline for Spring Boot 3 and modern enterprise development. It brought Algebraic Data Types (sum types via sealed classes + product types via records), dramatically reducing boilerplate while making code expressive and secure.",
    flagshipFeatures: [
      "Records: Concise immutable data carriers (record UserDto(Long id, String email) {}). Compiler auto-generates canonical constructor, getters (id(), email()), equals(), hashCode(), and toString(). Supports compact constructors for validation.",
      "Sealed Classes & Interfaces ('sealed' ... 'permits'): Restricts inheritance to an explicit whitelist of permitted subclasses. Permitted classes must be declared final, sealed, or non-sealed.",
      "Pattern Matching for instanceof: Eliminates boilerplate casting: 'if (obj instanceof String s && s.length() > 5)' automatically casts and binds 's' within scope.",
      "Switch Expressions: Modern switch returning values with arrow syntax ('case MON -> 1;'). Eliminates break statements and accidental fall-through; enforces compile-time branch exhaustiveness.",
      "Text Blocks (\"\"\" ... \"\"\"): Clean multi-line string literals that preserve indentation without '\\n' or '\\\"' escaping, ideal for JSON, SQL/JPQL, and HTML."
    ],
    traps: [
      "The Record as JPA @Entity Disaster Trap: NEVER annotate a Java Record with JPA @Entity! Hibernate requires: 1) A default no-argument constructor; 2) Non-final classes and methods to generate runtime dynamic proxies (ByteBuddy); 3) Mutable state for dirty checking. Records are final and immutable, completely breaking JPA entity lifecycles. (Use Records for DTOs and projections only!).",
      "Record Component Accessor Naming Trap: Records do NOT use JavaBean conventions. The accessor for field 'name' is 'user.name()', NOT 'user.getName()'. Older serialization libraries or reflection utilities expecting 'get...' fail unless configured.",
      "Record Compact Constructor Assignment Trap: In a compact constructor 'public UserDto { ... }', never assign 'this.id = id;'. Parameter validation occurs directly on the bare parameter names; javac handles assignment automatically.",
      "Sealed Hierarchy Exhaustiveness Trap: When switching over a sealed hierarchy, omitting a permitted subclass causes a compile-time error unless a 'default:' branch is provided."
    ],
    jvmMemoryChange: "Strong Encapsulation Default & Deprecation Removals: JDK internals are strongly encapsulated by default (JEP 403). Sun.misc.Unsafe and internal packages can no longer be accessed reflectively without explicit '--add-opens' JVM arguments. Native Apple Silicon (M1/M2/M3 AArch64) port was officially integrated.",
    codeSnippet: `// 1. Record with Compact Constructor Validation (Ideal DTO)
public record OrderDto(String orderId, double amount) {
    public OrderDto { // Compact constructor: NO parameter list!
        if (amount < 0) throw new IllegalArgumentException("Amount cannot be negative");
        // No 'this.amount = amount;' needed! Compiler handles it.
    }
}

// 2. Sealed Classes & Exhaustive Switch Pattern
public sealed interface Payment permits CreditCard, PayPal, Crypto {}
public final record CreditCard(String pan) implements Payment {}
public final record PayPal(String email) implements Payment {}
public final record Crypto(String wallet) implements Payment {}

// 3. Text Blocks for Clean SQL
String query = """
    SELECT o.id, o.total_amount
    FROM orders o
    WHERE o.status = :status
    ORDER BY o.created_at DESC
    """;`,
    interviewPivot: "The classic senior interview trap: 'Can we use a Java Record as a JPA entity?' A senior engineer immediately says NO and explains why Hibernate's proxy generation and dirty checking require mutable POJOs."
  },

  // =========================================================================
  // 4. JAVA 21
  // =========================================================================
  {
    id: "java-version-21",
    versionNumber: "Java 21",
    title: "Java 21 (LTS): High-Throughput Concurrency & Project Loom",
    badge: "LTS Standard (2023)",
    releaseYear: "2023",
    oneLiner: "Concurrency revolution: Virtual Threads (Project Loom), Record Patterns, Sequenced Collections, and Generational ZGC.",
    whatIsIt: "Java 21 is the most significant LTS release since Java 8. Project Loom's Virtual Threads replace reactive programming complexity with lightweight user-mode threads, enabling synchronous, readable code that scales to millions of concurrent requests.",
    flagshipFeatures: [
      "Virtual Threads (Project Loom): Lightweight user-mode threads managed by the JVM instead of OS kernel threads (~1KB memory stack vs ~1MB for platform threads). Spawn millions using Executors.newVirtualThreadPerTaskExecutor() or Spring Boot 'spring.threads.virtual.enabled=true'.",
      "Record Patterns & Pattern Matching for Switch: Deconstructs records directly inside switch expressions: 'case Order(String id, Amount(double val)) when val > 1000 -> ...', bringing Data-Oriented Programming to Java.",
      "Sequenced Collections: Unified hierarchy (SequencedCollection, SequencedSet, SequencedMap) with standard .getFirst(), .getLast(), .addFirst(), .addLast(), and .reversed() across List, Deque, LinkedHashSet, and TreeMap.",
      "Generational ZGC: Separates young and old generation collections in ZGC, maintaining <1ms pause times while slashing CPU and memory overhead by 4x.",
      "Key Encapsulation Mechanism (KEM) API: Cryptographic foundation for Post-Quantum Cryptography (PQC)."
    ],
    traps: [
      "Virtual Threads CPU-Bound Task Trap: Virtual Threads DO NOT make CPU-bound computations faster! A CPU-bound task (e.g. video rendering, crypto hashing) requires raw CPU cores; spawning millions of virtual threads on CPU tasks causes scheduling thrashing. Virtual threads only boost throughput for I/O-bound tasks (waiting on DB, network, or disk).",
      "Virtual Thread Pinning Trap: In Java 21, if a virtual thread executes blocking I/O inside a 'synchronized' block or JNI native method, the virtual thread is PINNED to its OS carrier thread, preventing the carrier thread from executing other virtual threads. (Always use ReentrantLock instead of synchronized around I/O!).",
      "Virtual Thread Pooling Anti-Pattern: NEVER pool Virtual Threads (e.g. Executors.newFixedThreadPool with virtual threads)! Platform threads were pooled because OS thread creation was expensive (~1MB stack). Virtual threads are cheap and disposable (~1KB); create a new virtual thread per task and let it terminate.",
      "ThreadLocal Memory Bloat Trap: Virtual threads inherit ThreadLocal variables. If millions of virtual threads hold large ThreadLocal objects, heap memory will exhaust rapidly."
    ],
    jvmMemoryChange: "Generational ZGC: Prior to Java 21, ZGC was single-generational, requiring significant CPU cycles to scan all objects. Generational ZGC honors the Weak Generational Hypothesis (most objects die young) by splitting regions into Young and Old generations, reducing GC CPU overhead by ~75% while keeping max pause times under 1 millisecond.",
    codeSnippet: `// 1. Spawning 100,000 Virtual Threads with zero thread pooling
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -> {
        executor.submit(() -> {
            // Non-blocking sleep: Continuation unmounts from OS carrier thread!
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
} // Auto-closes and waits for all tasks to finish!

// 2. Pattern Matching with Record Deconstruction & Guards
static String processTransaction(Object obj) {
    return switch (obj) {
        case Order(String id, double amt) when amt > 10_000 -> "VIP Order: " + id;
        case Order(String id, double amt) -> "Standard Order: " + id;
        case Refund(String refId) -> "Refund: " + refId;
        default -> "Unknown Transaction";
    };
}`,
    interviewPivot: "Interviewers will ask: 'Does Virtual Threads make my code execute faster?' The senior answer is NO: it increases system THROUGHPUT for I/O-bound tasks by unmounting waiting threads, but does not improve latency of CPU tasks."
  },

  // =========================================================================
  // 5. JAVA 25
  // =========================================================================
  {
    id: "java-version-25",
    versionNumber: "Java 25",
    title: "Java 25 (LTS): The Latest Enterprise Benchmark (Sept 2025)",
    badge: "Latest LTS (Sept 2025)",
    releaseYear: "2025",
    oneLiner: "Scoped Values, Structured Concurrency, Project Lilliput Compact Headers (8 bytes), and Carrier Pinning Resolution.",
    whatIsIt: "Released in September 2025, Java 25 is the newest LTS milestone. Mentioning one or two Java 25 features instantly proves to interviewers that you stay on the cutting edge beyond daily sprint tasks.",
    flagshipFeatures: [
      "Scoped Values (ScopedValue): Finalized modern replacement for ThreadLocal tailored specifically for Virtual Threads. Scoped values are immutable, have a strictly bounded lexical lifetime, and are shared efficiently across parent and child virtual threads with zero memory leak risk.",
      "Structured Concurrency (StructuredTaskScope): Coordinates concurrent subtasks as a single unit of work. If one subtask fails or times out, sibling subtasks are automatically cancelled, eliminating thread leaks and orphaned background tasks.",
      "Compact Object Headers (Project Lilliput): Shrinks JVM object headers on 64-bit architectures from 12-16 bytes down to a single 8-byte (64-bit) word. Slashes application heap memory footprint by 10-20% and significantly enhances CPU L1/L2/L3 cache hit ratios.",
      "Flexible Constructor Bodies: Allows statements to appear before super(...) in constructors (e.g. argument validation and calculation) provided they do not access 'this' before the superclass constructor completes.",
      "Resolution of Virtual Thread Pinning: Java 24/25 (JEP 491) re-architected ObjectMonitor in HotSpot, allowing virtual threads to unmount from carrier threads even when blocked inside 'synchronized' methods/blocks!"
    ],
    traps: [
      "ThreadLocal vs ScopedValue Mental Model: ThreadLocal is mutable and has an unbounded lifecycle (surviving until thread termination, causing leaks in thread pools). ScopedValue is strictly immutable, scoped to a try-with-resources or run() block, and cannot be modified once bound.",
      "StructuredTaskScope Fork-Join Invariant: Subtasks spawned via scope.fork() must be joined via scope.join() within the same lexical block; failing to call join() throws an IllegalStateException upon scope exit.",
      "Pre-super() 'this' Reference Trap: While flexible constructor bodies allow code before super(), you CANNOT read fields of 'this' or invoke instance methods on 'this' before super() completes."
    ],
    jvmMemoryChange: "Project Lilliput 64-bit Object Headers: Every object in HotSpot previously had a 16-byte header (8-byte Mark Word + 8-byte Klass Word, or 12 bytes with Compressed Class Pointers). Lilliput compresses the Mark Word and Klass pointer into a single 64-bit (8-byte) header. In memory-intensive services with hundreds of millions of objects, this immediately saves gigabytes of RAM without changing a line of application code.",
    codeSnippet: `// 1. Scoped Values (Safe, Lightweight ThreadLocal Alternative)
private static final ScopedValue<UserContext> CURRENT_USER = ScopedValue.newInstance();

// Bounded to this execution scope only:
ScopedValue.where(CURRENT_USER, new UserContext("OnixAdmin")).run(() -> {
    // Child virtual threads inherit CURRENT_USER with zero allocation overhead
    processUserRequest();
});

// 2. Structured Concurrency (StructuredTaskScope)
Response handleOrder(String orderId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        Supplier<Order> orderSubtask = scope.fork(() -> fetchOrder(orderId));
        Supplier<Customer> customerSubtask = scope.fork(() -> fetchCustomer(orderId));

        scope.join();           // Wait for both subtasks
        scope.throwIfFailed();  // Cancel siblings and rethrow if either fails!

        return new Response(orderSubtask.get(), customerSubtask.get());
    }
}`,
    interviewPivot: "Mentioning Scoped Values and Project Lilliput proves you understand the future of Java memory and concurrency architecture. It shows you know that Java solved the ThreadLocal leak issue and object header memory overhead."
  }
];
