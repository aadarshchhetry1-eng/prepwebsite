/**
 * mindmaps-data.js
 * Visual Mind Maps and Quick Glance revision data.
 * Structured for interactive node graph rendering and bite-sized visual cards.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.MINDMAPS = {
  solid: {
    id: "solid",
    title: "SOLID Principles in 1-Glance",
    subtitle: "5 Core Object-Oriented Design Rules for High-Cohesion, Low-Coupling Systems",
    centralNode: "SOLID Architecture",
    branches: [
      {
        key: "S",
        name: "Single Responsibility (SRP)",
        mnemonic: "1 Class = 1 Reason to Change",
        colorClass: "active-solid-s",
        rule: "A class should have one, and only one, reason to change — it should serve one actor/role.",
        analogy: "A Swiss Army Knife vs a Chef's Knife. If one blade breaks, the whole tool is compromised.",
        violationSmell: "God classes (e.g., UserService doing hashing, DB writes, PDF invoice generation, and email sending).",
        solutionPattern: "Split into UserAuthService, UserRepository, InvoicePdfGenerator, and NotificationDispatcher.",
        codeSnippet: `// BAD: 3 reasons to change (business logic, DB persistence, notifications)
class OrderProcessor {
    void process(Order o) { /* calculate tax */ /* db.save(o) */ /* emailClient.sendReceipt() */ }
}

// GOOD (SRP): Single reason to change per class
class OrderValidator { boolean isValid(Order o) { ... } }
class OrderRepository { void save(Order o) { ... } }
class ReceiptNotifier { void send(Order o) { ... } }`
      },
      {
        key: "O",
        name: "Open / Closed Principle (OCP)",
        mnemonic: "Open for Extension, Closed for Modification",
        colorClass: "active-solid-o",
        rule: "Software artifacts should be open for extension without modifying existing, tested source code.",
        analogy: "Adding an electric adapter or phone case instead of soldering new wires directly onto the motherboard.",
        violationSmell: "giant switch(paymentType) or if-else cascades every time a new business requirement arrives.",
        solutionPattern: "Strategy Pattern, Polymorphic Interfaces, Spring Plugin Architecture.",
        codeSnippet: `// BAD: Adding ApplePay requires editing this method and re-testing all types
void processPayment(String type) {
    if (type.equals("CREDIT")) { ... }
    else if (type.equals("PAYPAL")) { ... }
}

// GOOD (OCP): Add new PaymentStrategy class without touching existing ones
interface PaymentStrategy { void pay(BigDecimal amount); }
class CreditCardPayment implements PaymentStrategy { ... }
class ApplePayPayment implements PaymentStrategy { ... }`
      },
      {
        key: "L",
        name: "Liskov Substitution (LSP)",
        mnemonic: "Subtypes must be substitutable for Base types",
        colorClass: "active-solid-l",
        rule: "If S is a subtype of T, objects of type T may be replaced with objects of type S without breaking program correctness.",
        analogy: "If it looks like a duck and quacks like a duck but needs batteries, you probably have the wrong abstraction.",
        violationSmell: "Throwing UnsupportedOperationException in a subclass override (e.g. ReadOnlyList extending List.add()).",
        solutionPattern: "Contract enforcement: Subclasses must not strengthen preconditions or weaken postconditions.",
        codeSnippet: `// 1. THE CLASSIC VIOLATION:
class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int getArea() { return width * height; }
}

class Square extends Rectangle {
    @Override public void setWidth(int w) { this.width = w; this.height = w; }
    @Override public void setHeight(int h) { this.width = h; this.height = h; }
}

// Client relying on Rectangle's contract:
void verifyArea(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    // Invariant: area MUST be 20. But if r is Square, width becomes 4 => area is 16!
    assert r.getArea() == 20 : "LSP Violation! Got: " + r.getArea();
}
// verifyArea(new Rectangle()); // PASS (20)
// verifyArea(new Square());    // THROWS AssertionError (16)! Caller broken.

// 2. CLEAN ARCHITECTURAL FIX: Separate contracts / Immutability
interface Shape { int getArea(); }
record RectangleShape(int width, int height) implements Shape {
    public int getArea() { return width * height; }
}
record SquareShape(int side) implements Shape {
    public int getArea() { return side * side; }
}`
      },
      {
        key: "I",
        name: "Interface Segregation (ISP)",
        mnemonic: "Clients should not depend on methods they don't use",
        colorClass: "active-solid-i",
        rule: "Keep interfaces small, cohesive, and client-centric. Favor role-based interfaces over fat monoliths.",
        analogy: "A multi-function printer interface forcing a simple USB thermal receipt printer to implement scan() and fax().",
        violationSmell: "Empty or no-op method implementations: @Override void fax() { /* do nothing */ }.",
        solutionPattern: "Segregate into Printable, Scannable, Faxable. Composite interfaces where needed.",
        codeSnippet: `// BAD: Fat interface
interface Worker { void work(); void eat(); void sleep(); }
class RobotWorker implements Worker {
    void work() { ... }
    void eat() { throw new UnsupportedOperationException(); } // Polluted!
}

// GOOD (ISP): Role Interfaces
interface Workable { void work(); }
interface Feedable { void eat(); }
class HumanWorker implements Workable, Feedable { ... }
class RobotWorker implements Workable { ... }`
      },
      {
        key: "D",
        name: "Dependency Inversion (DIP)",
        mnemonic: "Depend on Abstractions, not Concretions",
        colorClass: "active-solid-d",
        rule: "High-level modules should not depend on low-level modules. Both should depend on abstractions (interfaces).",
        analogy: "Plugging a lamp into an electrical wall outlet (abstraction) rather than hardwiring the cord directly into the city power grid.",
        violationSmell: "Using new MySQLDatabase() directly inside business services, making unit testing and swapping impossible.",
        solutionPattern: "Inversion of Control (IoC), Dependency Injection (Spring @Autowired/@Bean constructor injection).",
        codeSnippet: `// BAD: Direct hard-coupling to MySQL
class OrderService {
    private MySqlRepository repo = new MySqlRepository(); // Tightly coupled
}

// GOOD (DIP): Depend on contract, inject implementation via constructor
interface OrderRepository { void save(Order o); }

@Service
class OrderService {
    private final OrderRepository repo;
    public OrderService(OrderRepository repo) { this.repo = repo; } // DIP achieved
}`
      }
    ]
  },

  oops: {
    id: "oops",
    title: "OOPs Core & JVM Mechanics",
    subtitle: "From Fundamentals to V-Table Dispatch, Inline Caching & Composition",
    centralNode: "OOP Architecture",
    branches: [
      {
        key: "E",
        name: "Encapsulation",
        mnemonic: "State Protection & Invariant Defense",
        colorClass: "active-solid-s",
        rule: "Bundling data and the methods that operate on that data, while preventing unauthorized external state mutation.",
        analogy: "A bank account capsule where balance can only change via validated deposit/withdraw rules.",
        violationSmell: "Public mutable fields, or getters returning live references to internal collections (Arrays.asList, List).",
        solutionPattern: "Defensive copying (return Collections.unmodifiableList(list)), Java 14+ Records for pure immutability.",
        codeSnippet: `public record BankAccount(String accountId, BigDecimal balance) {
    // Compact constructor enforces invariants before instance creation
    public BankAccount {
        Objects.requireNonNull(accountId, "ID cannot be null");
        if (balance.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Negative balance");
    }
}`
      },
      {
        key: "A",
        name: "Abstraction",
        mnemonic: "Hiding Complexity Behind Clean Contracts",
        colorClass: "active-solid-o",
        rule: "Exposing essential characteristics while hiding low-level implementation details and protocol negotiation.",
        analogy: "The steering wheel and gas pedal of a car. You don't need to know fuel injection timing to drive.",
        violationSmell: "Leaky abstractions: Catching low-level SQLException inside web controllers instead of domain exceptions.",
        solutionPattern: "Domain-Driven Design (DDD) Ports & Adapters, Interface default/private methods (Java 9+).",
        codeSnippet: `// Abstract Contract
public interface MessagePublisher {
    void publish(String topic, EventPayload event);
}
// Implementation details (Kafka, SQS, RabbitMQ, In-Memory) are completely abstracted`
      },
      {
        key: "I",
        name: "Inheritance vs Composition",
        mnemonic: "Favor Composition over Class Inheritance",
        colorClass: "active-solid-l",
        rule: "Inheritance is 'IS-A' (breaks encapsulation across hierarchy). Composition is 'HAS-A' (flexible, swappable).",
        analogy: "Assembling a computer from interchangeable GPU/RAM modules rather than sculpting it out of a single piece of marble.",
        violationSmell: "Fragile Base Class problem: Subclass breaks when parent class refactors internal private method calls.",
        solutionPattern: "Forwarding classes, Decorator pattern, Delegate pattern.",
        codeSnippet: `// Favoring Composition:
public class InstrumentedSet<E> extends ForwardingSet<E> {
    private int addCount = 0;
    public InstrumentedSet(Set<E> s) { super(s); }
    @Override public boolean add(E e) { addCount++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); return super.addAll(c); // Safe from double counting!
    }
}`
      },
      {
        key: "P",
        name: "Polymorphism & JVM V-Table",
        mnemonic: "Dynamic Dispatch & Inline Caching",
        colorClass: "active-solid-d",
        rule: "Compile-time (Overloading) vs Runtime (Overriding via JVM invokevirtual instruction and Virtual Method Tables).",
        analogy: "Pressing the 'Play' button works whether the device is an audio cassette, CD player, or streaming app.",
        violationSmell: "Excessive instanceof checks and manual downcasting violating OCP.",
        solutionPattern: "V-Table (Virtual Method Table) lookup: In Metaspace, each Klass structure contains an array of method pointers. Subclasses inherit parent indices and override matching slots. HotSpot JIT optimizes via Monomorphic Inline Caching (MIC).",
        codeSnippet: `// 1. CLASS HIERARCHY
class Animal {
    void makeSound() { System.out.println("Generic sound"); }
    void sleep() { System.out.println("Zzz"); }
}

class Dog extends Animal {
    @Override void makeSound() { System.out.println("Woof"); } // Overrides vtable[0]
}

class Cat extends Animal {
    @Override void makeSound() { System.out.println("Meow"); } // Overrides vtable[0]
}

// 2. JVM V-TABLE LAYOUT IN METASPACE:
// Animal Klass vtable: [0: &Animal.makeSound, 1: &Animal.sleep, 2: &Object.toString, ...]
// Dog    Klass vtable: [0: &Dog.makeSound,    1: &Animal.sleep, 2: &Object.toString, ...]
// Cat    Klass vtable: [0: &Cat.makeSound,    1: &Animal.sleep, 2: &Object.toString, ...]

// 3. EXECUTION & BYTECODE (invokevirtual):
void triggerSound(Animal animal) {
    animal.makeSound(); 
    // Bytecode:
    // aload_1
    // invokevirtual #4 // Method Animal.makeSound:()V
    // Runtime JVM Steps:
    // 1. Reads 'animal' object header -> gets Klass pointer in Metaspace
    // 2. Looks up fixed index 0 in the Klass's vtable: vtable[0]
    // 3. Jumps directly to resolved address: Dog.makeSound() or Cat.makeSound() (O(1) time!)
}

// 4. JIT COMPILER OPTIMIZATION (INLINE CACHING):
// - Monomorphic Call Site: If profiling sees 100% of calls are Dog,
//   JIT C2 devirtualizes the call into a direct assembly jump or inlines Dog.makeSound() directly!
// - Bimorphic (2 types): JIT emits: if (animal.class == Dog) Dog.makeSound(); else Cat.makeSound();
// - Megamorphic (3+ types): Falls back to full vtable lookup.`
      }
    ]
  },

  jmm: {
    id: "jmm",
    title: "Java Memory Model & GC",
    subtitle: "Heap Generations, Thread Stacks, Metaspace, and Safepoint Mechanics",
    centralNode: "JVM Memory",
    branches: [
      {
        key: "HEAP",
        name: "Young Generation (Eden + S0 + S1)",
        mnemonic: "Weak Generational Hypothesis",
        colorClass: "active-solid-s",
        rule: "98% of objects die young. Minor GC collects Eden + From-Survivor, copying live survivors into To-Survivor.",
        analogy: "A temporary scratchpad: throw away everything discarded after each task, keep only what survived 15 cycles (Tenuring Threshold).",
        violationSmell: "Premature tenuring: Large byte arrays allocated directly into Old Gen if they exceed PretenureSizeThreshold.",
        solutionPattern: "Tune -XX:SurvivorRatio, -XX:MaxTenuringThreshold (default 15 in G1GC).",
        codeSnippet: `// Heap Allocation Flow:
// [Eden Space (80%)]  ---> Minor GC ---> [Survivor S0 / S1] 
// Live objects increment age ---> If age >= 15 ---> Promoted to [Old/Tenured Gen]`
      },
      {
        key: "OLD",
        name: "Old (Tenured) Gen & GC Collectors",
        mnemonic: "Serial -> Parallel -> G1 -> ZGC / Shenandoah",
        colorClass: "active-solid-o",
        rule: "Long-lived objects (Singletons, Spring beans, Caches). Major/Full GC runs here. G1 uses region-based concurrent marking.",
        analogy: "The long-term warehouse archive. Cleaning it requires careful index sweeping to prevent pausing factory operations.",
        violationSmell: "Full GC STW (Stop The World) freezes lasting seconds due to unbounded in-memory caches.",
        solutionPattern: "Use ZGC (-XX:+UseZGC) for sub-millisecond pauses across TB heaps via colored pointers & load barriers.",
        codeSnippet: `// Modern JVM GC flags (Java 17/21):
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:InitiatingHeapOccupancyPercent=45 -jar app.jar
// For ultra-low latency (< 1ms pause):
java -XX:+UseZGC -XX:+ZGenerational -jar app.jar`
      },
      {
        key: "STACK",
        name: "Thread Stack & Metaspace",
        mnemonic: "Execution Frames & Class Metadata",
        colorClass: "active-solid-l",
        rule: "Each thread gets its own private Stack (Local vars, operand stack, frame pointers). Metaspace lives in Native Memory (off-heap).",
        analogy: "Stack is the chef's personal cutting board; Metaspace is the restaurant's library of recipe books.",
        violationSmell: "java.lang.OutOfMemoryError: Metaspace caused by dynamic proxy class generators (CGLIB/ByteBuddy) leaking classloaders.",
        solutionPattern: "Set -XX:MaxMetaspaceSize=512m and monitor class unloading.",
        codeSnippet: `// StackOverflowError: Infinite recursion filling stack frames
// OutOfMemoryError: Java heap space vs OutOfMemoryError: Metaspace
// Thread stack default: -Xss1m (Virtual threads in Java 21 use tiny heap-allocated Continuation objects!)`
      }
    ]
  },

  spring_lifecycle: {
    id: "spring_lifecycle",
    title: "Spring Bean Lifecycle & Proxies",
    subtitle: "From Instantiation to CGLIB Proxy Wrapping & Destruction",
    centralNode: "Spring Bean Engine",
    branches: [
      {
        key: "1",
        name: "1. Instantiate & Populate",
        mnemonic: "Constructor -> Field / Setter DI",
        colorClass: "active-solid-s",
        rule: "Spring creates raw Java instance via Reflection/Constructor, then injects dependencies (@Autowired/@Value).",
        analogy: "Unboxing the blank chassis of a machine and bolting on the required input hoses.",
        violationSmell: "Field injection (@Autowired private Repo repo) makes unit tests impossible without reflection.",
        solutionPattern: "Always use Constructor Injection (enables final fields and easy mock injection).",
        codeSnippet: `@Service
public class UserService {
    private final UserRepository userRepo; // immutable & safe
    public UserService(UserRepository userRepo) { this.userRepo = userRepo; }
}`
      },
      {
        key: "2",
        name: "2. Aware Interfaces & BPP Before",
        mnemonic: "BeanNameAware -> BeanPostProcessor.postProcessBeforeInitialization",
        colorClass: "active-solid-o",
        rule: "Spring gives the bean its name and context (ApplicationContextAware), then applies custom before-init processors.",
        analogy: "Giving the machine an asset tag and calibrating its sensors before powering on.",
        violationSmell: "Overusing ApplicationContextAware in business code tightly couples domain logic to Spring framework.",
        solutionPattern: "Keep business logic pure Java; use factories or Spring configurations only on edges.",
        codeSnippet: `@Override
public Object postProcessBeforeInitialization(Object bean, String beanName) {
    // Intercept bean right before @PostConstruct runs
    return bean;
}`
      },
      {
        key: "3",
        name: "3. Init & Proxy Generation (BPP After)",
        mnemonic: "@PostConstruct -> InitializingBean -> CGLIB Proxy",
        colorClass: "active-solid-l",
        rule: "CRITICAL: AOP Proxies (@Transactional, @Async, @Cacheable, @Secured) are generated in postProcessAfterInitialization!",
        analogy: "Wrapping the machine in a safety cage with meters that intercept every push of the button.",
        violationSmell: "Calling @Transactional method from another method in SAME class! Proxies only intercept external calls.",
        solutionPattern: "Self-injection, refactoring into separate bean, or TransactionTemplate.",
        codeSnippet: `// WHY SELF-INVOCATION FAILS:
// Caller -> [Proxy (@Transactional)] -> target.methodA()
// target.methodA() calls this.methodB() directly in JVM! Bypasses proxy entirely!
// Solution: Move methodB to a separate service or inject self.`
      },
      {
        key: "4",
        name: "4. Transaction Propagation & Logical vs Physical Tx",
        mnemonic: "REQUIRED vs REQUIRES_NEW & Rollback-Only Marking",
        colorClass: "active-solid-i",
        rule: "Multiple logical transactions map to one physical JDBC connection under REQUIRED. Inner failures mark the physical transaction as rollback-only; catching inner exceptions in outer try-catch still throws UnexpectedRollbackException. REQUIRES_NEW suspends outer and opens a second physical connection.",
        analogy: "A co-signed joint bank account: if one partner triggers an overdraft penalty, the entire account is frozen even if the other partner had enough funds.",
        violationSmell: "Catching an inner transaction exception expecting the outer transaction to commit, resulting in UnexpectedRollbackException.",
        solutionPattern: "Use REQUIRES_NEW in a separate Spring Bean for isolated sub-tasks (audit, notifications), and register @TransactionalEventListener(phase = AFTER_COMMIT) for events.",
        codeSnippet: `// Independent physical transaction with isolated commit/rollback:
@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(Long orderId) {
        auditRepo.save(new AuditRecord(orderId));
    }
}`
      },
      {
        key: "5",
        name: "5. Hibernate Persistence Context & 4 Entity States",
        mnemonic: "Transient ➔ Managed ➔ Detached ➔ Removed & Dirty Checking",
        colorClass: "active-solid-d",
        rule: "The Session First-Level Cache tracks Managed entities via in-memory snapshots. Dirty checking automatically generates minimal SQL UPDATEs on commit without calling save(). Detached entities throw LazyInitializationException if accessed when OSIV is false.",
        analogy: "A Google Docs live collaboration session: edits are autosaved (dirty checking); if you disconnect (detached), you cannot see live comments or click linked subdocuments.",
        violationSmell: "Calling repository.save() redundantly on managed entities, or enabling OSIV in production which exhausts HikariCP connections.",
        solutionPattern: "Disable OSIV (spring.jpa.open-in-view=false), use DTO projections or @EntityGraph, and use session.flush() + session.clear() for batch operations.",
        codeSnippet: `// Automatic Dirty Checking on commit (No save() needed!):
@Transactional
public void updateEmail(Long id, String email) {
    User user = userRepo.findById(id).orElseThrow();
    user.setEmail(email); // Hibernate automatically issues UPDATE on commit!
}`
      },
      {
        key: "6",
        name: "6. Spring Security Filter Chain & SecurityContext",
        mnemonic: "DelegatingFilterProxy ➔ FilterChainProxy ➔ SecurityContext ThreadLocal",
        colorClass: "active-solid-p",
        rule: "DelegatingFilterProxy bridges Servlet container to Spring's FilterChainProxy, executing ordered SecurityFilterChains. Authenticated principals are stored in ThreadLocal SecurityContextHolder; @Async methods lose authentication unless a TaskDecorator propagates it.",
        analogy: "An airport security checkpoint: passport check (AuthenticationFilter) occurs before boarding gate check (AuthorizationFilter); passengers in different terminal shuttles (@Async) need boarding passes re-verified.",
        violationSmell: "Disabling CSRF when using session cookies, or expecting @ControllerAdvice to catch exceptions thrown inside Security Filters.",
        solutionPattern: "Stateless SessionCreationPolicy.STATELESS with Bearer JWTs, TaskDecorator for async context propagation, and HandlerExceptionResolver for filter error delegation.",
        codeSnippet: `// Modern Component-Based SecurityFilterChain (Spring Security 6):
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable()) // Safe for stateless Bearer JWT APIs
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
        .build();
}`
      }
    ]
  },

  dsa_patterns: {
    id: "dsa_patterns",
    title: "14 Master Algorithmic Patterns",
    subtitle: "Instantly Map Any LeetCode / System Problem to Its Core Skeleton",
    centralNode: "DSA Pattern Master",
    branches: [
      {
        key: "SLIDE",
        name: "Sliding Window",
        mnemonic: "Subarrays / Substrings with dynamic bounds",
        colorClass: "active-solid-s",
        rule: "Maintain left and right pointer over a contiguous slice. Expand right to satisfy condition, contract left to optimize.",
        analogy: "A magnifying glass sliding across a newspaper sentence, expanding and contracting to frame target words.",
        violationSmell: "Nested O(N^2) loops scanning all subarrays.",
        solutionPattern: "Keep track of frequencies/sum in window. Complexity: O(N) time, O(K) space.",
        codeSnippet: `int left = 0, maxLen = 0;
Map<Character, Integer> counts = new HashMap<>();
for (int right = 0; right < s.length(); right++) {
    counts.put(s.charAt(right), counts.getOrDefault(s.charAt(right), 0) + 1);
    while (/* window invalid */) {
        counts.put(s.charAt(left), counts.get(s.charAt(left)) - 1);
        left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
}`
      },
      {
        key: "MONO",
        name: "Monotonic Stack / Queue",
        mnemonic: "Next Greater Element / Sliding Window Extrema",
        colorClass: "active-solid-o",
        rule: "Maintain elements in strictly increasing or decreasing order. Pop when incoming element violates invariant. Amortized O(N)!",
        analogy: "People standing in a line where each tall person completely blocks the sight of anyone shorter behind them.",
        violationSmell: "O(N^2) backward scans to find next greater/smaller element.",
        solutionPattern: "Deque with monotonic order for Sliding Window Max, Daily Temperatures, Largest Rectangle in Histogram.",
        codeSnippet: `Deque<Integer> stack = new ArrayDeque<>();
for (int i = 0; i < nums.length; i++) {
    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
        int prevIdx = stack.pop();
        result[prevIdx] = nums[i]; // Found next greater element!
    }
    stack.push(i);
}`
      },
      {
        key: "TOPO",
        name: "Topological Sort (Kahn's / DFS)",
        mnemonic: "Dependency Ordering & Cycle Detection",
        colorClass: "active-solid-l",
        rule: "Compute in-degrees for DAG vertices. Enqueue nodes with in-degree 0. As nodes are processed, decrement neighbor in-degrees.",
        analogy: "Compiling a multi-module Java maven build where child modules must wait until parent JARs compile first.",
        violationSmell: "Deadlocks or missing dependency check in task schedulers.",
        solutionPattern: "Kahn's Algorithm (BFS) or Tarjan's / Kosaraju's for Strongly Connected Components (SCC).",
        codeSnippet: `int[] inDegree = new int[numCourses];
// build graph & count in-degrees...
Queue<Integer> q = new ArrayDeque<>();
for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.offer(i);
int processed = 0;
while (!q.isEmpty()) {
    int curr = q.poll();
    processed++;
    for (int next : adj.get(curr)) {
        if (--inDegree[next] == 0) q.offer(next);
    }
}
return processed == numCourses; // If false -> Cycle detected!`
      }
    ]
  },

  streams: {
    id: "streams",
    title: "Java Streams & Functional API",
    subtitle: "Pipeline Lifecycle, Stateless/Stateful Ops, Collectors & Comparators",
    centralNode: "Java Streams Engine",
    branches: [
      {
        key: "pipeline",
        name: "1. Pipeline & Lazy Loop Fusion",
        mnemonic: "Source ➔ Intermediate ➔ Terminal",
        colorClass: "active-solid-s",
        rule: "Streams are lazy pull-based traversals. Intermediate ops return a new Stream and execute zero bytecode until a terminal op triggers loop fusion.",
        analogy: "An assembly line where workers don't touch products until the shipping department yells 'Ship Item 1' (pull model).",
        violationSmell: "Calling terminal operations twice on the same stream instance causes IllegalStateException: stream has already been operated upon.",
        solutionPattern: "Construct a new stream from the source or use Supplier<Stream<T>> for repeated traversals.",
        codeSnippet: `// Loop fusion: filter and map fuse into 1 iteration pass
List<String> results = names.stream()
    .filter(n -> n.startsWith("A"))
    .map(String::toUpperCase)
    .limit(3) // Short-circuit halts source immediately
    .toList(); // Terminal op (Java 16+)`
      },
      {
        key: "intermediate",
        name: "2. Stateless vs Stateful Ops",
        mnemonic: "Stateless (O(1) space) vs Stateful (Buffers All)",
        colorClass: "active-solid-o",
        rule: "Stateless ops (filter, map, flatMap) process items independently. Stateful ops (sorted, distinct, limit) require buffering prior elements.",
        analogy: "Stateless: Airport security checking bags one-by-one. Stateful: A scale requiring ALL bags before sorting by weight.",
        violationSmell: "Calling .sorted() on an infinite stream (Stream.generate) causes OutOfMemoryError as it buffers infinitely.",
        solutionPattern: "Always place .limit(N) BEFORE .sorted() when consuming infinite or unbounded stream sources.",
        codeSnippet: `// flatMap: Flattens 1-to-N relationships
List<String> distinctSkills = employees.stream()
    .flatMap(e -> e.getSkills().stream()) // Flattens List<String> to Stream<String>
    .distinct()
    .sorted()
    .toList();`
      },
      {
        key: "collectors",
        name: "3. Collectors & Downstream Aggregations",
        mnemonic: "groupingBy -> mapping -> counting / maxBy",
        colorClass: "active-solid-l",
        rule: "Collectors transform stream outputs into Maps, Lists, or multi-level hierarchical reductions via downstream collectors.",
        analogy: "Sorting mail into department mailboxes, then counting or finding the heaviest letter in each box.",
        violationSmell: "Using Collectors.toMap(k, v) without a merge function throws IllegalStateException as soon as duplicate keys appear.",
        solutionPattern: "Always provide (existing, incoming) -> existing merge function to handle collisions safely.",
        codeSnippet: `// Department Highest Earner with collectingAndThen
Map<String, Employee> topEarners = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.collectingAndThen(
            Collectors.maxBy(Comparator.comparingDouble(Employee::getSalary)),
            Optional::get
        )
    ));`
      },
      {
        key: "comparators",
        name: "4. Modern Comparator Composition",
        mnemonic: "comparing -> thenComparing -> nullsLast",
        colorClass: "active-solid-i",
        rule: "Chain fluent declarative comparators. Use primitive specializations (comparingInt) to eliminate boxing overhead, and nullsFirst/nullsLast for null safety.",
        analogy: "Sorting a phonebook: First by Last Name, then by First Name, with missing names pushed to the back.",
        violationSmell: "Writing manual subtraction (a.getSalary() - b.getSalary()) causes arithmetic overflow with negative numbers.",
        solutionPattern: "Use Double.compare() or Comparator.comparingDouble(Employee::getSalary).reversed().",
        codeSnippet: `// Multi-key null-safe comparator
Comparator<Employee> comp = Comparator
    .comparing(Employee::getDepartment)
    .thenComparing(Comparator.comparingDouble(Employee::getSalary).reversed())
    .thenComparing(Employee::getName, Comparator.nullsLast(Comparator.naturalOrder()));`
      },
      {
        key: "parallel",
        name: "5. Parallel Streams & ForkJoinPool",
        mnemonic: "Spliterator.trySplit -> ForkJoinPool.commonPool",
        colorClass: "active-solid-d",
        rule: "Parallel streams split via Spliterators and execute on ForkJoinPool.commonPool(). Only use for CPU-bound tasks where N*Q > 10,000.",
        analogy: "Splitting a deck of cards across 4 workers; workers steal cards from each other's piles to stay busy.",
        violationSmell: "Mutating shared external collections (list.parallelStream().forEach(output::add)) causes silent race conditions.",
        solutionPattern: "Use built-in concurrent reductions (toList() or collect()) or isolate in a custom ForkJoinPool.",
        codeSnippet: `// Safe parallel reduction
List<Integer> safeResult = numbers.parallelStream()
    .filter(this::heavyCpuCalculation)
    .toList(); // Internal ForkJoin reduction guarantees thread-safety`
      }
    ]
  },

  sql: {
    id: "sql",
    title: "SQL Engine & Complex Analytics",
    subtitle: "Execution Order, B+Tree Indexing, Window Functions & ACID",
    centralNode: "SQL Database Engine",
    branches: [
      {
        key: "exec_order",
        name: "1. Logical Execution Order (10 Steps)",
        mnemonic: "FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> WINDOW -> ORDER BY",
        colorClass: "active-solid-s",
        rule: "SQL is declarative; queries execute in a strict 10-step sequence. WHERE runs at step 2, while SELECT runs at step 5.",
        analogy: "Filtering dirty apples at the orchard gate (WHERE) BEFORE putting them into shipping crates (GROUP BY).",
        violationSmell: "Trying to filter on a SELECT alias inside WHERE (WHERE total_price > 100) causes syntax error.",
        solutionPattern: "Use CTEs (WITH) or subqueries to filter on calculated aliases, or repeat the expression in WHERE.",
        codeSnippet: `SELECT dept_id, AVG(salary) AS avg_sal
FROM employees
WHERE is_active = 1          -- Step 2: Row filter (uses index)
GROUP BY dept_id             -- Step 3: Buckets formed
HAVING AVG(salary) > 80000   -- Step 4: Aggregate filter
ORDER BY avg_sal DESC;       -- Step 8: Aliases allowed here!`
      },
      {
        key: "b_tree",
        name: "2. B+Tree Indexing & Leftmost Prefix",
        mnemonic: "Clustered (PK Data) vs Secondary (PK Pointer)",
        colorClass: "active-solid-o",
        rule: "Composite indexes on (A, B, C) can only be traversed starting with column A. Range conditions on B stop index usage on C.",
        analogy: "A multi-volume physical dictionary sorted by (Last Name, First Name). You cannot lookup 'John' without knowing the last name.",
        violationSmell: "Using functions on indexed columns (WHERE YEAR(created_at) = 2024) disables index, causing full table scan.",
        solutionPattern: "Use range bounds: WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'.",
        codeSnippet: `-- Covering Index: Answers query directly from RAM index page
CREATE INDEX idx_user_status_date ON orders(user_id, status, created_at);
-- Eliminates table bookmark lookup entirely:
SELECT user_id, status, created_at FROM orders WHERE user_id = 42;`
      },
      {
        key: "windows",
        name: "3. Window Analytics & Tie-Breaking",
        mnemonic: "ROW_NUMBER (1,2,3) vs RANK (1,1,3) vs DENSE_RANK (1,1,2)",
        colorClass: "active-solid-l",
        rule: "Window functions calculate metrics across row partitions without collapsing rows like GROUP BY. DENSE_RANK() has no gaps.",
        analogy: "Awarding medals in an Olympic race: Ties in Gold mean both get Gold, and next runner gets Silver (Dense) or Bronze (Rank).",
        violationSmell: "Using LIMIT 1 OFFSET N-1 for Nth highest salary returns incorrect values when duplicate salaries exist.",
        solutionPattern: "Always use DENSE_RANK() OVER (ORDER BY salary DESC) for Nth salary questions.",
        codeSnippet: `WITH RankedSalaries AS (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
)
SELECT MAX(salary) AS NthHighestSalary FROM RankedSalaries WHERE rnk = :N;`
      },
      {
        key: "joins_plans",
        name: "4. Physical Join Algorithms & EXPLAIN",
        mnemonic: "Nested Loop vs Hash Join vs Merge Join",
        colorClass: "active-solid-i",
        rule: "Optimizers choose: Nested Loop for small/indexed sets, Hash Join for large unsorted sets in RAM, Sort-Merge for pre-sorted streams.",
        analogy: "Looking up contact cards (Nested Loop) vs creating a temporary phonebook in RAM (Hash Join).",
        violationSmell: "Hash joins spilling to disk (HashJoin Spill) when work_mem is too small for large analytical queries.",
        solutionPattern: "Inspect EXPLAIN ANALYZE for Seq Scan (Rows Removed by Filter) and tune work_mem or add missing indexes.",
        codeSnippet: `EXPLAIN ANALYZE
SELECT c.name, COUNT(o.id)
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.id, c.name;`
      },
      {
        key: "mvcc_locks",
        name: "5. ACID Isolation & Deadlock Prevention",
        mnemonic: "Read Committed (Snapshot per query) vs Repeatable Read (Snapshot per Tx)",
        colorClass: "active-solid-d",
        rule: "MVCC allows readers not to block writers and writers not to block readers. InnoDB uses Next-Key Locks to eliminate phantoms.",
        analogy: "Giving each reader a personal photocopy of the document as it looked when they started reading.",
        violationSmell: "Transactions acquiring row locks in random order cause circular deadlocks.",
        solutionPattern: "Always sort IDs deterministically (SELECT ... WHERE id IN (...) ORDER BY id FOR UPDATE) before locking.",
        codeSnippet: `-- Pessimistic Locking with deterministic ordering
SELECT stock FROM inventory 
WHERE product_id = 101 
FOR UPDATE; -- Prevents concurrent overselling in inventory`
      }
    ]
  },

  kafka: {
    id: "kafka",
    title: "⚡ Apache Kafka Internals",
    subtitle: "KRaft, Log Engine, Zero-Copy, RecordAccumulator & Exactly-Once Semantics",
    centralNode: "Kafka Core Engine",
    branches: [
      {
        key: "KRAFT",
        name: "1. KRaft & Metadata Quorum Controller",
        mnemonic: "Raft Quorum Metadata Engine (No ZooKeeper)",
        colorClass: "active-solid-s",
        rule: "Quorum Controller nodes using Raft consensus replace ZooKeeper completely. Active Controller handles partition leadership; metadata is stored in an internal replicated __cluster_metadata topic.",
        analogy: "A high-court bench with an active Chief Justice and quorum voting, replacing an external third-party registry agency.",
        violationSmell: "Depending on legacy ZooKeeper: metadata sync lag causes 10-minute controller failovers with 200k+ partitions and split-brain metadata desynchronization.",
        solutionPattern: "KRaft mode (process.roles=broker,controller): instantaneous sub-second metadata propagation without external dependencies.",
        codeSnippet: `// KRaft Broker & Controller Configuration (server.properties)
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
listeners=PLAINTEXT://kafka-1:9092,CONTROLLER://kafka-1:9093
controller.listener.names=CONTROLLER`
      },
      {
        key: "STORAGE",
        name: "2. Storage Engine: Zero-Copy & PageCache",
        mnemonic: "Append-Only Segments, Index & Linux sendfile()",
        colorClass: "active-solid-o",
        rule: "Partitions are split into immutable .log segments, sparse .index (offset to byte pos every 4KB), and .timeindex. Linux sendfile() transfers bytes directly from OS PageCache to NIC buffer (DMA), bypassing JVM heap.",
        analogy: "Writing into a physical ledger book in ink only, with an index ribbon bookmark for instant jump to page offsets, without ever reading the whole book into your head.",
        violationSmell: "Allocating 64GB RAM to broker JVM heap, triggering massive GC pauses and double-buffering in RAM.",
        solutionPattern: "Allocate 6-8GB to JVM heap, give 85%+ RAM to Linux OS PageCache + sequential append-only I/O.",
        codeSnippet: `// Zero-Copy Syscall Flow:
// OS PageCache ──(DMA Direct Transfer: sendfile)──► Network Socket NIC
// Zero CPU user-space memory copies! Zero JVM GC pressure!

// Inspecting segment sparse index:
kafka-run-class.sh kafka.tools.DumpLogSegments \\
  --files /var/lib/kafka/data/orders-0/00000000000000000000.index \\
  --verify-index-only`
      },
      {
        key: "PRODUCER",
        name: "3. Producer Internals & Exactly-Once Idempotence",
        mnemonic: "RecordAccumulator, PID & Monotonic Sequence Numbers",
        colorClass: "active-solid-l",
        rule: "Messages buffer in RecordAccumulator pools (linger.ms & batch.size). Idempotence assigns a 64-bit PID and monotonic sequence numbers per partition to deduplicate retries broker-side.",
        analogy: "Numbered shipping receipts; if courier re-submits parcel #42 after an ACK drop, the receiver sees #42 already accepted and discards the duplicate.",
        violationSmell: "Retries without idempotence causing duplicate payments/orders, or out-of-order records when max.in.flight > 1.",
        solutionPattern: "enable.idempotence=true with acks=all and retries=Integer.MAX_VALUE.",
        codeSnippet: `// Enterprise Idempotent & Resilient Producer:
Properties props = new Properties();
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");      // PID + SeqNumber
props.put(ProducerConfig.ACKS_CONFIG, "all");                     // Full ISR commit
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, "5"); // In-order!`
      },
      {
        key: "CONSUMER",
        name: "4. Consumer Groups & CooperativeSticky Rebalance",
        mnemonic: "Heartbeats, Offsets & CooperativeSticky (KIP-429)",
        colorClass: "active-solid-i",
        rule: "Group Coordinator assigns partitions. Heartbeat thread detects dead nodes (session.timeout.ms), while max.poll.interval.ms guards processing loops. CooperativeSticky rebalances incrementally without stop-the-world pauses.",
        analogy: "Workstation reassignments where only the moved station pauses for a second, while the rest of the factory keeps producing.",
        violationSmell: "Eager rebalance storms revoking all partitions across 50 pods; slow batch processing triggering zombie consumer evictions.",
        solutionPattern: "Tune max.poll.records (e.g. 50) and use CooperativeStickyAssignor.",
        codeSnippet: `// Spring Kafka Listener with CooperativeSticky & Manual Immediate ACK:
@Configuration
public class KafkaConfig {
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Order> factory(ConsumerFactory<String, Order> cf) {
        var f = new ConcurrentKafkaListenerContainerFactory<String, Order>();
        f.setConsumerFactory(cf);
        f.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return f;
    }
}`
      },
      {
        key: "REPLICATION",
        name: "5. Replication: ISR, High Watermark & Leader Epochs",
        mnemonic: "ISR, Leader Epochs & Zero-Loss Banking Formula",
        colorClass: "active-solid-d",
        rule: "Leader tracks ISR within replica.lag.time.max.ms. High Watermark (HW) marks committed offsets. Leader Epochs eliminate replica divergence during failovers.",
        analogy: "A bank vault requiring 2 of 3 physical keys to turn simultaneously before any receipt is final.",
        violationSmell: "min.insync.replicas=1 with acks=all, causing silent data loss on single-broker leader crashes.",
        solutionPattern: "replication.factor=3, min.insync.replicas=2, acks=all, unclean.leader.election.enable=false.",
        codeSnippet: `// Production Zero-Data-Loss Topic Configuration:
kafka-topics.sh --bootstrap-server kafka:9092 --alter \\
  --topic critical-payments \\
  --config min.insync.replicas=2 \\
  --config unclean.leader.election.enable=false`
      },
      {
        key: "RESILIENCE",
        name: "6. Enterprise Resilience: Outbox Pattern & Non-Blocking Retries",
        mnemonic: "CDC Outbox & Delayed Retry Topics Ladder",
        colorClass: "active-solid-s",
        rule: "Atomic DB-Kafka sync via Transactional Outbox + Debezium CDC; prevent head-of-line partition blocking via progressive delayed retry topics (orders-retry-5s, orders-retry-30s, orders-dlq).",
        analogy: "Moving a customer with a complicated visa issue to a side desk so the main airport security queue keeps moving.",
        violationSmell: "Retrying synchronously in-place with Thread.sleep(), halting 50,000 customers in the partition.",
        solutionPattern: "Spring @RetryableTopic with backoff multiplier and DLT handler.",
        codeSnippet: `// Spring Boot Non-Blocking Retries with @RetryableTopic:
@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 1000, multiplier = 2.0, maxDelay = 10000),
    include = { TransientApiException.class }
)
@KafkaListener(topics = "orders")
public void handle(OrderEvent event) {
    paymentService.charge(event); // Fails ➔ moves to retry topic, partition advances!
}`
      }
    ]
  },

  react: {
    id: "react",
    title: "⚛️ React & Redux Internals",
    subtitle: "Fiber Reconciler, Virtual DOM, Hooks Linked List & Redux Middleware",
    centralNode: "React & Redux Architecture",
    branches: [
      {
        key: "FIBER",
        name: "1. Fiber Architecture & Double Buffering",
        mnemonic: "Interruptible Cooperative Scheduling (Time-Slicing)",
        colorClass: "active-solid-s",
        rule: "Fiber transforms reconciliation into a virtual stack machine using a singly-linked tree (child, sibling, return). Double-Buffering maintains a 'current' tree on screen and builds a 'workInProgress' tree offscreen across 5ms time-slices without UI tearing.",
        analogy: "Video game rendering: frame 1 displays from buffer A while frame 2 renders silently in buffer B, swapping pointers atomically.",
        violationSmell: "Long synchronous loops blocking the main thread, dropping 60fps frames and freezing typing input.",
        solutionPattern: "Time-slicing via React 18 Concurrent Mode, useTransition for non-urgent work, and requestIdleCallback / MessageChannel scheduler.",
        codeSnippet: `// Fiber Node Structure & Work Loop:
// current.alternate === workInProgress (Twin Pointers)
function workLoopConcurrent() {
    while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress); // 5ms cooperative slice
    }
}
// Commit Phase: Atomic Pointer Swap
fiberRoot.current = finishedWork;`
      },
      {
        key: "VDOM",
        name: "2. Virtual DOM & Diffing Heuristics",
        mnemonic: "O(N) Diffing & Component Identity (Keys)",
        colorClass: "active-solid-o",
        rule: "Replaces O(N³) general tree diffing with O(N) linear heuristics: 1) Different element types destroy and rebuild subtrees; 2) Stable key props track identity across reorders; 3) Level-by-level comparison avoids cross-depth checks.",
        analogy: "Comparing two book drafts line-by-line where chapter IDs anchor paragraphs, rather than comparing every word to every word in the entire library.",
        violationSmell: "Using key={index} on dynamic lists: causes uncontrolled input state and checkboxes to bleed to the wrong row upon deletion or prepending.",
        solutionPattern: "Always use stable, unique business IDs (key={item.id}). Never use array indices or Math.random().",
        codeSnippet: `// ❌ INDEX AS KEY DISASTER:
{items.map((item, index) => <InputRow key={index} item={item} />)}
// Deleting index 0 leaves remaining items bound to old DOM input state!

// ✅ STABLE BUSINESS IDENTIFIER:
{items.map(item => <InputRow key={item.id} item={item} />)}`
      },
      {
        key: "HOOKS",
        name: "3. Hooks Dispatcher & memoizedState Linked List",
        mnemonic: "Singly-Linked List on Fiber.memoizedState",
        colorClass: "active-solid-l",
        rule: "Hooks are not identified by name. Each Fiber has a memoizedState pointing to a singly-linked list of Hook objects ({ memoizedState, queue, next }). React traverses this list in strict call order on every render.",
        analogy: "Passengers sitting in an exact assigned row on a plane; if passenger #2 skips their seat, everyone behind receives the wrong meal and seat assignment.",
        violationSmell: "Placing hooks inside 'if' statements or loops: causes the hook traversal pointer to desynchronize, corrupting state across hooks.",
        solutionPattern: "Strictly adhere to the Rules of Hooks: call hooks only at the top level of functional components.",
        codeSnippet: `// Fiber.memoizedState Linked List Traversal:
// useState ➔ .next ➔ useEffect ➔ .next ➔ useRef ➔ null
function updateWorkInProgressHook() {
    // Advances pointer: currentHook = currentHook.next
    // If skipped via 'if' condition, Hook N receives Hook N-1's state!
    if (isConditional) {
        throw new Error("Rendered fewer hooks than expected.");
    }
}`
      },
      {
        key: "REDUX",
        name: "4. Redux Store, Curried Middleware & Immer Proxies",
        mnemonic: "Unidirectional Data Flow & Composed Middleware",
        colorClass: "active-solid-i",
        rule: "Single source of truth with pure reducers. Middleware wraps dispatch via curried composition: store => next => action. Redux Toolkit uses Immer (ES6 Proxies) for mutating syntax with structural sharing.",
        analogy: "An assembly line conveyor belt where every action passes through quality-control and telemetry stations before stamping the master company ledger.",
        violationSmell: "Direct state mutation in vanilla Redux (state.items.push(x)): reference doesn't change (old === new), so useSelector bails out and the UI never re-renders.",
        solutionPattern: "Use Redux Toolkit createSlice (Immer handles immutability), and memoize derived calculations with createSelector (Reselect).",
        codeSnippet: `// Custom Redux Middleware (Curried 3-arrow signature):
const logger = store => next => action => {
    console.log('Dispatching:', action.type);
    return next(action); // Passes down the pipeline
};

// Redux Toolkit Immer Slice (Safe Mutating Syntax):
const slice = createSlice({
    name: 'cart',
    initialState: { items: [] },
    reducers: {
        addItem(state, action) {
            state.items.push(action.payload); // Immer Proxy creates immutable draft!
        }
    }
});`
      },
      {
        key: "PERF",
        name: "5. Render Lifecycle, Bailouts & Memoization",
        mnemonic: "Shallow Comparison & Component Colocation",
        colorClass: "active-solid-d",
        rule: "Components re-render on state change, parent render, or Context change. React.memo bails out if props are shallowly equal (Object.is). Context API causes cascading re-renders because it lacks selector-level bailouts.",
        analogy: "A courier checking if the delivery address actually changed before driving across town.",
        violationSmell: "Passing unmemoized inline functions (onClick={() => ...}) or inline objects (style={{...}}) to a React.memo child, breaking shallow equality on every render.",
        solutionPattern: "useCallback for stable function references, useMemo for expensive data, and State Colocation (push state down to leaf components).",
        codeSnippet: `// React.memo with Stable References:
const MemoList = React.memo(ListComponent);

function Parent() {
    // Stable references allow MemoList to bail out of render!
    const handleClick = useCallback((id) => selectItem(id), []);
    const memoData = useMemo(() => processData(raw), [raw]);
    return <MemoList onClick={handleClick} data={memoData} />;
}`
      },
      {
        key: "CONCURRENT",
        name: "6. Transitions, Suspense & Server Components (RSC)",
        mnemonic: "Urgent vs Transition & Streaming Architecture",
        colorClass: "active-solid-s",
        rule: "React 18 Concurrent features split work into Urgent updates (typing/clicking) and Non-urgent Transitions (startTransition). Suspense catches thrown Promises during render. React Server Components (RSC) execute exclusively on the server, streaming JSON/HTML with 0 client JS bundle size.",
        analogy: "High-priority ambulance sirens clearing traffic while moving freight trucks wait patiently at red lights.",
        violationSmell: "Freezing text input fields by updating large data visualizations in the same synchronous state tick.",
        solutionPattern: "useTransition to keep input responsive; Suspense boundaries for streaming data.",
        codeSnippet: `// useTransition for Lag-Free Search:
const [isPending, startTransition] = useTransition();

function handleChange(e) {
    setInput(e.target.value); // 1. Urgent: Immediate input update
    startTransition(() => {
        setQuery(e.target.value); // 2. Non-Urgent: Interruptible 10,000-row table filter!
    });
}`
      }
    ]
  },

  devops: {
    id: "devops",
    title: "☸️ K8s & DevOps Internals",
    subtitle: "Control Plane Raft, Linux cgroups/Namespaces, Terraform DAG, Helm 3 & GitOps",
    centralNode: "Cloud Native & DevOps",
    branches: [
      {
        key: "K8S_PLANE",
        name: "1. K8s Control Plane & Declarative Reconciliation",
        mnemonic: "etcd Raft Consensus & Level-Triggered Controller Loops",
        colorClass: "active-solid-s",
        rule: "The API Server is the only stateless component interacting with etcd. All controllers run infinite Level-Triggered reconciliation loops (Observed State vs Desired State). Raft consensus in etcd requires (N/2)+1 quorum.",
        analogy: "A thermostat: continuously measures room temperature against the target setting and turns the furnace on/off regardless of missed temperature events.",
        violationSmell: "Relying on edge-triggered notifications or imperative kubectl commands in production instead of declarative GitOps reconcilers.",
        solutionPattern: "Custom Controllers / Operators with Informers, WorkQueues, and Leader Election leases.",
        codeSnippet: `// Level-Triggered Controller Loop Blueprint:
func (c *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var deployment v1.Deployment
    if err := c.Get(ctx, req.NamespacedName, &deployment); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    // Compare Observed vs Desired:
    if len(runningPods) != *deployment.Spec.Replicas {
        c.ScaleReplicas(ctx, &deployment) // Reconcile state
    }
    return ctrl.Result{}, nil
}`
      },
      {
        key: "RUNTIME",
        name: "2. Container Runtime: Namespaces, cgroups v2 & OverlayFS",
        mnemonic: "7 Namespaces (Isolation) + cgroups v2 (Limits) + OverlayFS (Union)",
        colorClass: "active-solid-o",
        rule: "A container is a standard Linux host process isolated by 7 namespaces (PID, NET, MNT, IPC, UTS, USER, CGROUP) and metered by cgroups v2. Filesystem layers are unified via OverlayFS (lowerdir read-only, upperdir read-write).",
        analogy: "An apartment in a high-rise: shared building foundation (kernel), individual locks (namespaces), power meters (cgroups), and modular paint layers on walls (OverlayFS).",
        violationSmell: "Running containers as root (UID 0), leading to container breakouts via shared kernel syscalls (e.g., CAP_SYS_ADMIN, sysfs).",
        solutionPattern: "Rootless Podman/Docker, runAsNonRoot: true, readOnlyRootFilesystem: true, seccomp profile RuntimeDefault.",
        codeSnippet: `# 1. Linux Namespaces (create isolated process):
unshare --mount --net --pid --fork bash

# 2. cgroups v2 hard memory ceiling (triggers SIGKILL 137 if exceeded):
echo 1073741824 > /sys/fs/cgroup/kubepods.slice/memory.max

# 3. OverlayFS Union Mount:
mount -t overlay overlay -o lowerdir=img1:img0,upperdir=rw,workdir=wk merged/`
      },
      {
        key: "TERRAFORM",
        name: "3. Terraform Engine: Dependency DAG & State Locking",
        mnemonic: "Directed Acyclic Graph (DAG) + Distributed Mutex Lock",
        colorClass: "active-solid-l",
        rule: "Terraform builds a Directed Acyclic Graph (DAG) of cloud resources, executing independent branches in parallel (-parallelism=10). Remote backends (S3 + DynamoDB) enforce distributed mutex locks to prevent state corruption.",
        analogy: "A critical database migration with table locks: only one DBA can alter the schema at a time, ensuring zero race conditions.",
        violationSmell: "Editing terraform.tfstate manually or running concurrent CI pipeline applies without remote state locking, corrupting state and orphaning cloud resources.",
        solutionPattern: "Remote state in S3 with DynamoDB LockID table, modular DRY structure, and -refresh-only drift checks.",
        codeSnippet: `# Remote State with Distributed Mutex Lock:
terraform {
  backend "s3" {
    bucket         = "corp-tf-state-prod"
    key            = "vpc/terraform.tfstate"
    dynamodb_table = "tf-state-locks" # Enforces atomic LockID
    encrypt        = true
  }
}

# Declarative Resource Import (Terraform 1.5+):
import {
  to = aws_s3_bucket.prod
  id = "prod-data-bucket"
}`
      },
      {
        key: "HELM",
        name: "4. Helm 3 Architecture & 3-Way Strategic Merge Patch",
        mnemonic: "Tillerless Go Templates & K8s Release Secrets",
        colorClass: "active-solid-i",
        rule: "Helm 3 eliminated Tiller, storing release revisions directly as compressed Secrets in Kubernetes. Upgrades use a 3-way strategic merge patch (Base Chart vs Live Cluster State vs New Chart), preserving live mutations like HPA replica counts.",
        analogy: "Git 3-way merge: compares base commit, local branch modifications, and incoming remote changes without blindly overwriting live operational overrides.",
        violationSmell: "Hardcoding environment values inside template YAMLs or failing to use --atomic --timeout, leaving releases stuck in pending-upgrade.",
        solutionPattern: "Strict values.schema.json validation, atomic upgrades (--atomic --timeout 5m), and externalized values per environment.",
        codeSnippet: `# Decode Helm 3 Release Secret directly from cluster:
kubectl get secret -n prod sh.helm.release.v1.auth-svc.v3 -o jsonpath='{.data.release}' \\
  | base64 -d | base64 -d | gunzip | jq .info

# Safe Upgrade with Automatic Rollback on failure:
helm upgrade auth-svc ./charts/auth --atomic --timeout 5m -f values-prod.yaml`
      },
      {
        key: "NETWORKING",
        name: "5. K8s CNI, kube-proxy (iptables vs IPVS vs Cilium eBPF)",
        mnemonic: "Flat IP-per-Pod + Kernel Packet Filtering / eBPF Hooking",
        colorClass: "active-solid-d",
        rule: "Every Pod receives a unique routable IP. kube-proxy translates Virtual Service IPs (ClusterIP) via iptables (O(N) sequential search) or IPVS (O(1) hash table). Cilium eBPF bypasses iptables/conntrack entirely using BPF programs attached to tc/XDP for microsecond wire-speed routing.",
        analogy: "A receptionist checking a paper guestbook line by line (iptables O(N)) vs looking up an ID in an in-memory hashmap (IPVS O(1)) vs a dedicated automated express elevator (eBPF).",
        violationSmell: "Running 5,000+ Services on kube-proxy iptables mode, causing CPU exhaustion and high packet loss during rule rewrites.",
        solutionPattern: "Migrate to Cilium CNI with kube-proxy replacement enabled (BPF host routing) and implement strict Default-Deny NetworkPolicies.",
        codeSnippet: `# Zero-Trust Default-Deny NetworkPolicy:
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {} # Denies all Ingress and Egress across namespace
  policyTypes: [Ingress, Egress]`
      },
      {
        key: "GITOPS",
        name: "6. GitOps Reconciliation & Progressive Delivery (Argo)",
        mnemonic: "Git as Single Source of Truth + In-Cluster Pull Model",
        colorClass: "active-solid-p",
        rule: "CI builds immutable container images and pushes manifests; CD runs as an in-cluster agent (ArgoCD / Flux) continuously pulling and reconciling Git state into the cluster. Progressive delivery (Argo Rollouts) splits traffic using Service Mesh / Ingress weights with automated metric analysis.",
        analogy: "An automated flight autopilot: Git is the flight plan coordinates; the in-cluster agent detects wind drift and continuously trims control surfaces back to the plan.",
        violationSmell: "CI servers having root kubeconfig access to push to production clusters (security vulnerability and secret sprawl).",
        solutionPattern: "In-cluster pull-based ArgoCD with automated PR preview environments, External Secrets Operator, and Prometheus metric-based automated canary rollback.",
        codeSnippet: `# Argo Rollout with Istio Traffic Splitting:
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 10m } # Send 10% traffic for 10 minutes
        - analysis: { templates: [{ templateName: error-rate-check }] }`
      }
    ]
  },

  redis: {
    id: "redis",
    title: "🟥 Redis & In-Memory Caching",
    subtitle: "Single-Threaded Reactor, Data Structures, CoW Persistence, Cluster & Redlock",
    centralNode: "Redis Architecture",
    branches: [
      {
        key: "EVENT_LOOP",
        name: "1. Single-Threaded Reactor & I/O Multiplexing",
        mnemonic: "epoll Event Loop + Redis 6 Multi-Threaded I/O",
        colorClass: "active-solid-s",
        rule: "Redis processes all commands sequentially on a single thread over non-blocking epoll sockets, eliminating mutex contention. Redis 6+ offloads socket reads/writes to I/O threads while maintaining single-threaded lock-free command execution.",
        analogy: "A master chef in a restaurant kitchen: assistants chop vegetables and carry plates (I/O threads), but only the single master chef seasons and cooks the dishes.",
        violationSmell: "Executing O(N) commands (KEYS *, FLUSHALL, HGETALL on 1M items) or slow Lua scripts, freezing the entire server.",
        solutionPattern: "Use SCAN with cursors, UNLINK for asynchronous deallocation, and enable io-threads in redis.conf.",
        codeSnippet: `# Enable I/O threads in redis.conf:
io-threads 4
io-threads-do-reads yes`
      },
      {
        key: "DATA_STRUCTS",
        name: "2. Core Data Structures: SDS, Dict, Skiplist & Quicklist",
        mnemonic: "Binary-Safe Strings, Incremental Rehashing, Probabilistic Levels",
        colorClass: "active-solid-o",
        rule: "Custom C structures engineered for O(1) efficiency and minimal memory: SDS stores length/capacity preventing buffer overflows; Dict uses dual tables for incremental rehashing; Skiplist provides O(log N) range queries with span ranks; Quicklist compresses lists into listpack chunks.",
        analogy: "Specialized aerospace lightweight composite alloys designed for strength with zero wasted weight.",
        violationSmell: "Storing large JSON blobs in plain strings and updating single fields by reading and rewriting the entire string.",
        solutionPattern: "Use Hashes (HSET/HGET) for structured objects and Sorted Sets (ZSET) for priority queues and leaderboards.",
        codeSnippet: `# Inspect internal object encoding:
OBJECT ENCODING user:profile
# Output: embstr (compact <= 44 bytes), hashtable, or skiplist`
      },
      {
        key: "PERSISTENCE",
        name: "3. Persistence Engine: RDB, AOF & Linux CoW",
        mnemonic: "fork() Copy-on-Write + appendfsync everysec + Hybrid Preamble",
        colorClass: "active-solid-l",
        rule: "RDB creates point-in-time binary snapshots using Linux fork() Copy-on-Write (CoW). AOF records write logs with appendfsync everysec (max 1s data loss). Hybrid persistence writes an RDB snapshot header followed by incremental AOF logs.",
        analogy: "Taking a panoramic photo of a city (RDB) while keeping a receipt logbook of every new building built since the photo (AOF).",
        violationSmell: "Running Redis on Linux with Transparent Huge Pages (THP) enabled or vm.overcommit_memory=0, causing CoW memory bloat and OOM crashes during BGSAVE.",
        solutionPattern: "Disable THP (echo never > .../transparent_hugepage/enabled), set vm.overcommit_memory=1, and enable aof-use-rdb-preamble yes.",
        codeSnippet: `# redis.conf Hybrid Persistence:
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes`
      },
      {
        key: "CLUSTER",
        name: "4. Redis Cluster & Hash Slot Sharding",
        mnemonic: "16,384 Slots + CRC16 + MOVED/ASK Redirection",
        colorClass: "active-solid-i",
        rule: "Shards keys across 16,384 virtual hash slots (CRC16(key) mod 16384) with decentralized Gossip master-master coordination. Clients route directly; misplaced queries receive -MOVED (permanent) or -ASK (migrating slot) redirects.",
        analogy: "A post office with 16,384 PO boxes partitioned across 3 clerks: each clerk handles a range of boxes; letters with the same district code ({tag}) land in the same clerk's box.",
        violationSmell: "Running multi-key commands across different slots, triggering CROSSSLOT errors.",
        solutionPattern: "Use Hash Tags ({user:100}:profile, {user:100}:orders) to force co-location in the same hash slot.",
        codeSnippet: `# Force multi-key co-location via hash tags:
MSET {user:101}:name "Alice" {user:101}:role "Admin"`
      },
      {
        key: "EVICTION",
        name: "5. Eviction Policies & Memory Management",
        mnemonic: "allkeys-lru vs allkeys-lfu & Active Defragmentation",
        colorClass: "active-solid-d",
        rule: "When used_memory hits maxmemory, Redis evicts keys via sampled LRU or LFU (logarithmic frequency counter). Default noeviction rejects all writes. Fragmentation ratio (> 1.5) is resolved online via activedefrag.",
        analogy: "A warehouse shelf: when full, items that haven't been touched in a year (LRU) or items with the lowest popularity score (LFU) are discarded to make room.",
        violationSmell: "Leaving maxmemory-policy at default noeviction in caching environments, crashing write traffic with OOM errors.",
        solutionPattern: "Configure maxmemory-policy allkeys-lfu, maxmemory-samples 10, and activedefrag yes.",
        codeSnippet: `# Eviction and Active Defragmentation:
maxmemory 8gb
maxmemory-policy allkeys-lfu
activedefrag yes`
      },
      {
        key: "LOCKING",
        name: "6. Distributed Locks & Concurrency Control",
        mnemonic: "SET key token NX PX + Lua Script Atomic Release",
        colorClass: "active-solid-p",
        rule: "Distributed locks require atomic acquisition (SET key token NX PX), unique UUID tokens, atomic release via Lua script (verifying token matches before DEL), and watchdog auto-renewal (Redisson) to handle JVM GC pauses.",
        analogy: "A hotel electronic keycard: coded with your unique guest ID (token); expires automatically at checkout (TTL); will not open or cancel another guest's room.",
        violationSmell: "Calling DEL key without checking the token, accidentally deleting another thread's lock after a GC pause.",
        solutionPattern: "Use Redisson with watchdog auto-renewal or an atomic Lua check-and-delete script.",
        codeSnippet: `-- Atomic Lock Release Lua Script:
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end`
      }
    ]
  },
  concurrency: {
    id: "concurrency",
    title: "🧵 Java Concurrency & JMM",
    subtitle: "Happens-Before, Lock Escalation, AQS Queue, ThreadPools & Virtual Threads",
    centralNode: "Java Concurrency",
    branches: [
      {
        key: "JMM_HB",
        name: "1. Java Memory Model & Happens-Before",
        mnemonic: "Memory Barriers + Store Buffers + volatile Semantics",
        colorClass: "active-solid-s",
        rule: "Without synchronization, compilers and CPUs reorder instructions. JMM defines a partial ordering (Happens-Before) guaranteeing that memory writes by Thread A are visible to Thread B. Volatile variables enforce Acquire/Release semantics via hardware memory fences (StoreLoad, LoadLoad, StoreStore).",
        analogy: "Writing to a shared whiteboard behind a frosted glass window. Without a chime (Happens-Before barrier), observers outside see random scribbles out of order.",
        violationSmell: "Non-volatile Double-Checked Locking (DCL) singleton publishing half-initialized objects due to instruction reordering.",
        solutionPattern: "Declare instance field as private static volatile Singleton instance; or use static inner holder class.",
        codeSnippet: `// DCL with volatile: ensures writes happen-before reads
public class SafeDCL {
    private static volatile SafeDCL instance;
    public static SafeDCL getInstance() {
        if (instance == null) {
            synchronized (SafeDCL.class) {
                if (instance == null) {
                    instance = new SafeDCL(); // volatile prevents 1->3->2 reordering
                }
            }
        }
        return instance;
    }
}`
      },
      {
        key: "LOCK_ESCALATION",
        name: "2. JVM Lock Escalation Mechanics",
        mnemonic: "Biased (01) -> Lightweight (00) -> Heavyweight (10) + Adaptive Spin",
        colorClass: "active-solid-o",
        rule: "synchronized starts as Biased (thread ID in Mark Word, zero CAS). Upon multi-thread contention, HotSpot revokes bias and escalates to Lightweight lock (BasicObjectLock on caller stack, CAS spin). Under sustained contention, it escalates to Heavyweight OS mutex (ObjectMonitor: _cxq, _EntryList, _WaitSet) with thread suspension via futex/park.",
        analogy: "A personal office door: unlocked when only you work there (Biased); a rotating turnstile with brief spinning when two colleagues queue (Lightweight); an armed security guard with formal checkpoint and wait rooms when a crowd forms (Heavyweight OS Mutex).",
        violationSmell: "Long-running I/O or blocking operations inside synchronized blocks causing high CPU spin and mass escalation to heavyweight OS mutexes.",
        solutionPattern: "Keep critical sections minimal, or use virtual threads with ReentrantLock / non-blocking concurrent structures.",
        codeSnippet: `// Lock Escalation Path (HotSpot Object Mark Word):
// 1. Biased: [Thread ID | Epoch | 1 | 01] -> No CAS overhead for owner
// 2. Lightweight: [Stack Pointer to BasicObjectLock | 00] -> Adaptive CAS Spin
// 3. Heavyweight: [Pointer to OS ObjectMonitor | 10] -> Thread parked in _cxq/_EntryList`
      },
      {
        key: "AQS_LOCKS",
        name: "3. AbstractQueuedSynchronizer (AQS) & ReentrantLock",
        mnemonic: "Volatile State + CLH Doubly-Linked Queue + LockSupport.park()",
        colorClass: "active-solid-l",
        rule: "AQS forms the foundation of ReentrantLock, Semaphore, CountDownLatch, etc. It tracks synchronization state via a volatile int state managed by atomic CAS. Blocked threads are queued in a FIFO bidirectional CLH list of Node objects and suspended using LockSupport.park(). Upon unpark, predecessor threads hand off state.",
        analogy: "A deli ticket counter: customers take a numbered slip (CLH queue node) and sit in the waiting chairs (parked). When ticket #4 finishes, they yell next, tapping #5 on the shoulder (unpark).",
        violationSmell: "Acquiring ReentrantLock outside a try block or forgetting unlock() inside a mandatory finally block, causing permanent thread lockup.",
        solutionPattern: "Always use lock.lock(); try { ... } finally { lock.unlock(); } idiom; consider StampedLock for read-heavy workloads.",
        codeSnippet: `ReentrantLock lock = new ReentrantLock(false); // Non-fair (faster throughput)
lock.lock();
try {
    // Critical section guarded by AQS volatile state CAS
    processCriticalData();
} finally {
    lock.unlock(); // Must be in finally block to ensure release
}`
      },
      {
        key: "THREAD_POOLS",
        name: "4. ThreadPoolExecutor Lifecycle & Saturation",
        mnemonic: "32-bit ctl + Core -> WorkQueue -> Max -> RejectedExecutionHandler",
        colorClass: "active-solid-i",
        rule: "ThreadPoolExecutor uses an atomic ctl packing RUNNING/SHUTDOWN/STOP state (high 3 bits) and worker count (low 29 bits). Task dispatch order: 1. If workers < corePoolSize, spawn worker. 2. Else offer to workQueue. 3. If queue full & workers < maxPoolSize, spawn worker. 4. Else invoke RejectedExecutionHandler (AbortPolicy, CallerRunsPolicy, DiscardPolicy, DiscardOldestPolicy).",
        analogy: "A bank branch: 3 permanent tellers (corePoolSize). When busy, customers line up in waiting chairs (workQueue). If chairs fill up, up to 7 temporary tellers open (maxPoolSize). If the branch is packed, the bouncer turns people away or makes them wait outside (RejectedExecutionHandler).",
        violationSmell: "Using Executors.newCachedThreadPool() (unbounded threads -> OOM) or Executors.newFixedThreadPool() (unbounded LinkedBlockingQueue -> OOM).",
        solutionPattern: "Explicitly construct ThreadPoolExecutor with bounded ArrayBlockingQueue, custom thread factory, and CallerRunsPolicy for backpressure.",
        codeSnippet: `ThreadPoolExecutor executor = new ThreadPoolExecutor(
    8, 16, 60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(500),
    new CustomNamedThreadFactory("worker"),
    new ThreadPoolExecutor.CallerRunsPolicy() // Graceful backpressure
);`
      },
      {
        key: "CONCURRENT_COLLECTIONS",
        name: "5. Concurrent Collections & CAS Structures",
        mnemonic: "ConcurrentHashMap Treeify/Transfer + LongAdder Striped64 + CopyOnWrite",
        colorClass: "active-solid-d",
        rule: "ConcurrentHashMap uses CAS on empty bin heads and synchronized on individual bucket heads, splitting table resizing across concurrent threads using ForwardingNode (hash = -1). LongAdder mitigates CAS cache line contention via Striped64 cells. CopyOnWriteArrayList copies the array on mutation for zero-lock reads.",
        analogy: "A warehouse with 1,000 bins: instead of locking the warehouse door (Hashtable), clerks only lock the specific bucket they are placing an item into (ConcurrentHashMap), while inventory counts use individual counter registers per clerk (LongAdder).",
        violationSmell: "Calling map.putIfAbsent() or map.get() followed by map.put() thinking the compound operation is atomic, or using CopyOnWriteArrayList for write-heavy streams.",
        solutionPattern: "Use atomic compound methods: map.computeIfAbsent(), map.merge(), or LongAdder for high-throughput counters.",
        codeSnippet: `// Atomic compound update without external lock
ConcurrentHashMap<String, LongAdder> counters = new ConcurrentHashMap<>();
counters.computeIfAbsent("api_calls", k -> new LongAdder()).increment();`
      },
      {
        key: "VIRTUAL_THREADS",
        name: "6. Java 21 Virtual Threads & Project Loom",
        mnemonic: "Continuation + ForkJoinPool M:N Scheduling + Carrier Pinning Rules",
        colorClass: "active-solid-p",
        rule: "Virtual threads (fibers) decouple Java threads from 1:1 OS pthreads. Thousands/millions of virtual threads run on a small pool of carrier OS threads (ForkJoinPool). When a virtual thread performs blocking I/O, its JVM Continuation yields and unmounts from the carrier. Pinning occurs when blocking inside synchronized or JNI native frames.",
        analogy: "Actors (virtual threads) playing scenes on a stage: when an actor waits for a prop delivery (blocking I/O), they step backstage into green rooms (heap memory), letting another actor use the stage (carrier OS thread).",
        violationSmell: "Pooling virtual threads with ThreadLocal object pools or blocking on synchronized blocks causing carrier thread pinning and pool starvation.",
        solutionPattern: "Never pool virtual threads (Executors.newVirtualThreadPerTaskExecutor()), replace synchronized with ReentrantLock, and use ScopedValue instead of ThreadLocal.",
        codeSnippet: `// Modern Java 21 Virtual Thread Per Task
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> executor.submit(() -> {
        // Blocking I/O yields continuation cleanly without blocking OS thread
        var response = httpClient.send(request, BodyHandlers.ofString());
        return response.body();
    }));
} // Auto-closes and waits for completion`
      }
    ]
  },
  hld: {
    id: "hld",
    title: "🏗️ High-Level System Design (HLD)",
    subtitle: "Requirements, Capacity Math, Storage Decisions, Caching, Messaging & Resilience",
    centralNode: "System Design (HLD)",
    branches: [
      {
        key: "HLD_SCOPING",
        name: "1. 45-Min Pacing & Capacity Math",
        mnemonic: "FR vs NFR + QPS + Storage + 80/20 Memory Cache",
        colorClass: "active-solid-s",
        rule: "Structure the 45-minute interview into 5 distinct phases: Clarification (0-5m), Capacity Math (5-10m), High-Level Architecture (10-20m), Deep Dive Bottlenecks (20-35m), and Resilience (35-45m). Rule of thumb: 1M req/day ≈ 12 QPS; 100M req/day ≈ 1,200 QPS; Peak QPS = 2-3x average.",
        analogy: "Constructing a commercial skyscraper: you never start by laying bricks. You survey the soil, calculate structural load (capacity math), draft blueprints (high-level design), and plan emergency exits (resilience).",
        violationSmell: "Jumping directly to drawing microservices and Kafka before understanding whether write volume is 50 QPS or 500,000 QPS.",
        solutionPattern: "Lead with proactive scoping: 'Before choosing components, let us define our Functional Requirements (3 core user flows) and Non-Functional SLAs (p99 latency < 100ms, 99.99% availability, consistency vs availability).'",
        codeSnippet: `// Quick Mental Math for System Design:
// 1 Day = 86,400s ≈ 100,000s
// 100M Daily Active Requests = 100M / 86,400 ≈ 1,160 QPS (Avg)
// Peak QPS = 1,160 * 2.5 ≈ 3,000 QPS
// Daily Storage = 100M * 500 Bytes payload = 50 GB/day -> ~18 TB/year
// Memory Cache (80/20 Rule) = 20% of Daily Reads (100M * 0.20 * 500B) = 10 GB RAM`
      },
      {
        key: "HLD_STORAGE",
        name: "2. Storage & Database Decision Matrix",
        mnemonic: "RDBMS ACID vs Document vs Wide-Column LSM vs Key-Value vs NewSQL",
        colorClass: "active-solid-o",
        rule: "Choose databases strictly based on access patterns: Relational (PostgreSQL/MySQL) for ACID transactions & multi-table JOINs; Document (MongoDB) for dynamic hierarchical JSON; Wide-Column (Cassandra/ScyllaDB) for heavy append-only write streams; Key-Value (Redis/DynamoDB) for sub-millisecond point lookups; NewSQL (CockroachDB/Spanner) for global distributed ACID.",
        analogy: "Selecting vehicles: a Formula 1 car (Redis) for pure speed, a cargo freight train (Cassandra) for heavy volume, and an armored bank vault truck (PostgreSQL) for financial integrity.",
        violationSmell: "Choosing Cassandra for an e-commerce checkout ledger requiring atomic cross-table transactions and strict balance constraints.",
        solutionPattern: "Formulate decision as: 'For orders and payments, we require ACID guarantees, so we use PostgreSQL. For high-velocity chat history/telemetry, we use Cassandra partitioned by conversation_id.'",
        codeSnippet: `// Database Selection Matrix:
// Relational (RDBMS) -> PostgreSQL: Banking, Orders, Inventory (Strict ACID)
// Wide-Column (LSM)   -> Cassandra: Chat history, IoT telemetry (Write-Heavy)
// Document Store      -> MongoDB: Product catalog, Dynamic JSON
// Key-Value In-Memory -> Redis: Caching, Distributed Locks, Sessions
// NewSQL Distributed -> CockroachDB: Global Horizontal Scale + ACID`
      },
      {
        key: "HLD_CACHING",
        name: "3. Caching Tiers & Invalidation Strategies",
        mnemonic: "Cache-Aside vs Write-Through + CDC Debezium + Stampede Mitigation",
        colorClass: "active-solid-l",
        rule: "Cache-Aside (Lazy Loading): app reads cache; on miss, loads DB and populates cache; on DB write, app DELETES cache key (never updates it, preventing write-race corruption). Mitigate Cache Stampede with distributed mutex locks or probabilistic early expiration (XFetch). Mitigate Cache Penetration with Bloom filters.",
        analogy: "A library reserve shelf: popular textbooks sit on the front desk (cache); if missing, the librarian retrieves it from the deep warehouse (database) and leaves a copy on the desk.",
        violationSmell: "Updating the cache directly on database write (`redis.set(k, v)`). In concurrent systems, interleaved writes cause cache to diverge permanently from the DB.",
        solutionPattern: "Use Cache-Aside with cache key deletion on write, or async cache eviction driven by DB WAL Change Data Capture (Debezium + Kafka).",
        codeSnippet: `// Safe Cache-Aside Mutation:
public void updateUser(User user) {
    userRepository.save(user); // 1. Commit to durable DB
    redisTemplate.delete("user:" + user.getId()); // 2. EVICT from cache (never update!)
}`
      },
      {
        key: "HLD_MESSAGING",
        name: "4. Asynchronous Messaging & Streaming",
        mnemonic: "Kafka vs RabbitMQ + Transactional Outbox + Idempotent Consumer",
        colorClass: "active-solid-i",
        rule: "Kafka is a partitioned append-only distributed commit log (pull-based, retention-oriented, high-throughput stream processing). RabbitMQ is a smart broker with AMQP routing and per-message ACK. Guarantee At-Least-Once delivery via Transactional Outbox Pattern to solve the dual-write problem, and make consumers idempotent.",
        analogy: "A postal sorting facility: Kafka is a continuous conveyor belt with numbered boxes that multiple teams can inspect at their own pace; RabbitMQ is a clerk handing sealed envelopes to couriers one by one.",
        violationSmell: "Calling `kafkaTemplate.send()` inside a Spring `@Transactional` method, causing message loss if the DB rollback occurs after the network send.",
        solutionPattern: "Write business entity and outbox message in the same local DB transaction; tail DB WAL with Debezium CDC to publish reliably to Kafka.",
        codeSnippet: `// Transactional Outbox Pattern:
BEGIN TRANSACTION;
  INSERT INTO orders (id, user_id, amount) VALUES (101, 42, 99.99);
  INSERT INTO outbox_events (id, aggregate_id, event_type, payload) 
    VALUES (gen_random_uuid(), '101', 'ORDER_CREATED', '{"amount": 99.99}');
COMMIT; // Both committed atomically!`
      },
      {
        key: "HLD_CONSISTENCY",
        name: "5. Distributed Consistency & Consensus",
        mnemonic: "CAP/PACELC + Quorum (R + W > N) + Saga Orchestration",
        colorClass: "active-solid-d",
        rule: "Under network partition (P), choose Consistency (CP) or Availability (AP). PACELC extends this to normal latency trade-offs (PC/EC vs PA/EL). Enforce strong consistency via Quorum math: R + W > N. Replace blocking 2-Phase Commit (2PC) in microservices with the Saga Pattern using compensating rollback transactions.",
        analogy: "A group dinner reservation: 2PC is holding hands and refusing to sit until all 8 people arrive (one missing blocks everyone); Saga is ordering individually and sending back a dish (compensating refund) if someone cancels.",
        violationSmell: "Using distributed 2PC across microservices, creating high latency and locking resources indefinitely when a coordinator crashes.",
        solutionPattern: "Adopt Saga Orchestration: a central workflow service coordinates forward steps; on failure, it triggers compensating undo actions in reverse order.",
        codeSnippet: `// Quorum Consistency Formula:
// N = 3 (Replicas)
// W = 2 (Write Quorum: 2 nodes must acknowledge write)
// R = 2 (Read Quorum: 2 nodes must be queried on read)
// Since R + W (4) > N (3) -> Strong Consistency Guaranteed!`
      },
      {
        key: "HLD_RESILIENCE",
        name: "6. Traffic Shaping & Gateway Resilience",
        mnemonic: "Token Bucket vs Sliding Window + L4/L7 LB + Circuit Breaker",
        colorClass: "active-solid-p",
        rule: "Edge Tier protection: Token Bucket allows bursts up to capacity while enforcing average rate; Sliding Window Counter provides burst-safe precision in Redis with low memory. L4 Load Balancing (AWS NLB) routes TCP packets without inspecting payload; L7 (Envoy/ALB) routes HTTP headers/paths. Circuit Breakers (Resilience4j) prevent cascading microservice collapse.",
        analogy: "A nightclub bouncer: the bouncer (Rate Limiter) checks IDs and throttles entry queue; the triage door (Circuit Breaker) slams shut if smoke is detected inside, preventing more guests from entering danger.",
        violationSmell: "Configuring a rate limiter to fail closed: if Redis experiences a 2-second timeout, rejecting 100% of global API traffic with HTTP 500.",
        solutionPattern: "Configure rate limiters with a 2ms timeout that fails OPEN, falling back to local in-memory token buckets, while triggering an alert metric.",
        codeSnippet: `// Circuit Breaker State Transitions:
// CLOSED (Normal traffic)
//   |-- Error Rate > 50% --> OPEN (Fail fast, no calls to downstream)
//                              |-- Wait Duration (30s) --> HALF-OPEN (Test probe calls)`
      }
    ]
  },
  lld: {
    id: "lld",
    title: "📐 Low-Level Design & Machine Coding (LLD)",
    subtitle: "60-Min Playbook, GoF Design Patterns, SOLID Architecture & Thread-Safety",
    centralNode: "Machine Coding (LLD)",
    branches: [
      {
        key: "LLD_WORKFLOW",
        name: "1. 60-90 Min Machine Coding Flow",
        mnemonic: "Scope -> Models -> Strategy Interfaces -> Service -> Driver Main()",
        colorClass: "active-solid-s",
        rule: "Pacing is everything in machine coding: 0-10m Clarify scope & define enums; 10-20m Model domain entities (POJOs) and establish relationships; 20-30m Abstract variable logic into Strategy interfaces; 30-65m Implement business services and in-memory repositories; 65-80m Write a comprehensive Main() driver demonstrating test cases.",
        analogy: "Assembling flat-pack furniture: unbox parts and inspect screws (entities & enums), read assembly diagrams (interfaces), build frame (services), and test with weight (driver main).",
        violationSmell: "Writing all business logic, storage, and CLI inputs in one monolithic 600-line God class with zero interfaces.",
        solutionPattern: "Follow Layered Architecture: `model/` (pure entities), `enums/`, `strategy/` (algorithms), `repository/` (ConcurrentHashMaps), `service/` (orchestration), and `Main.java`.",
        codeSnippet: `// Standard Clean Layering:
public class Main {
    public static void main(String[] args) {
        SlotAllocationStrategy slotStrategy = new NearestSlotStrategy();
        PricingStrategy pricingStrategy = new HourlyPricingStrategy();
        ParkingLotService service = new ParkingLotService(slotStrategy, pricingStrategy);
        
        // Execute and verify test cases
        Ticket ticket = service.parkVehicle(new Car("KA-01-HH-1234"));
        assert ticket != null;
    }
}`
      },
      {
        key: "LLD_CREATIONAL",
        name: "2. Creational Patterns in Machine Coding",
        mnemonic: "Factory Method vs Abstract Factory vs Builder",
        colorClass: "active-solid-o",
        rule: "Factory Method creates one product via inheritance; Abstract Factory produces families of related objects (e.g. DarkThemeButton + DarkThemeCheckbox); Builder constructs complex objects with 5+ optional attributes step-by-step, avoiding telescoping constructors and mutable setters.",
        analogy: "Ordering food: Factory Method is asking for a 'Chef's Special Pizza'; Builder is customized Subway sandwich assembly step-by-step; Abstract Factory is an entire Italian Cuisine Combo (Pasta + Bread + Wine).",
        violationSmell: "Constructors with 9 parameters (`new Order(id, user, addr, billing, coupon, discount, notes, date, status)`) where 6 are null.",
        solutionPattern: "Use Builder pattern with private constructor and fluent `withX()` setters returning `this`, validating object invariants in `.build()`.",
        codeSnippet: `// Fluent Builder Pattern:
Order order = new Order.Builder("ORD-101", userId)
    .withCoupon("DISCOUNT20")
    .withDeliveryNotes("Leave at front door")
    .build(); // Validates constraints atomically!`
      },
      {
        key: "LLD_STRUCTURAL",
        name: "3. Structural Patterns: Decorator & Adapter",
        mnemonic: "Decorator (Runtime Stacking) vs Adapter (Interface Translation)",
        colorClass: "active-solid-l",
        rule: "Decorator attaches additional responsibilities dynamically at runtime via composition (e.g., Coffee with Milk and Sugar; Pizza with Extra Cheese), avoiding an exponential explosion of static subclasses ($2^N$). Adapter converts an incompatible interface into what a client expects.",
        analogy: "Decorator: wearing winter clothing (T-shirt + Sweater + Trench coat stacked dynamically); Adapter: a US-to-UK plug converter.",
        violationSmell: "Creating 30 subclasses like `CoffeeWithMilk`, `CoffeeWithSugar`, `CoffeeWithMilkAndSugar`, `EspressoWithMilk`.",
        solutionPattern: "Define an abstract `CoffeeDecorator implements Coffee` that wraps another `Coffee` reference and delegates with added cost/behavior.",
        codeSnippet: `// Decorator Pattern Composition:
Coffee coffee = new SimpleCoffee(); // $5
coffee = new MilkDecorator(coffee);  // +$2
coffee = new SugarDecorator(coffee); // +$1
System.out.println(coffee.getCost()); // $8`
      },
      {
        key: "LLD_BEHAVIORAL",
        name: "4. Behavioral Patterns: Strategy vs State",
        mnemonic: "Strategy (External Algorithm) vs State (Internal Lifecycle Shift)",
        colorClass: "active-solid-i",
        rule: "Strategy lets the caller inject an interchangeable algorithm (e.g., `PricingStrategy: Hourly vs Flat`; `PaymentProcessor: UPI vs Card`). State enables an object to alter its internal behavior automatically when its state transitions (e.g., `VendingMachine: Idle -> HasCoin -> Dispensing`).",
        analogy: "Strategy: choosing between taking a train, driving a car, or flying (interchangeable transport algorithm); State: water transitioning between Ice (solid), Water (liquid), and Steam (gas).",
        violationSmell: "Using a giant 50-line `switch(vendingState)` statement inside every method of `VendingMachine`.",
        solutionPattern: "Define `VendingState` interface with methods `insertCoin()`, `selectItem()`, `dispense()`, delegating directly to concrete state classes.",
        codeSnippet: `// State Pattern Delegation:
public class VendingMachine {
    private VendingState state = new IdleState();
    public void setState(VendingState state) { this.state = state; }
    public void insertCoin(Coin coin) { state.insertCoin(this, coin); }
}`
      },
      {
        key: "LLD_SOLID",
        name: "5. SOLID Clean Code Execution",
        mnemonic: "SRP Boundaries + OCP Extensibility + LSP Invariants",
        colorClass: "active-solid-d",
        rule: "Single Responsibility: separate Models, Repositories, Services, and Strategies. Open-Closed: new features added by creating new classes, not modifying existing ones. Liskov Substitution: child classes must never break parent invariants (Square extending Rectangle trap). Interface Segregation: split fat interfaces into lean contracts.",
        analogy: "A modular audio setup: you can swap standard headphones (LSP/OCP) without opening up the amplifier chassis or resoldering audio jacks.",
        violationSmell: "Calculating ticket fees inside the `Ticket` model class, coupling persistence, business math, and domain state in one file.",
        solutionPattern: "Keep models as clean POJOs/Records, and place calculations into dedicated Strategy implementations injected into Services.",
        codeSnippet: `// OCP Extensibility: Adding a new vehicle type requires ZERO changes to ParkingLotService
public class ElectricCar extends Vehicle {
    public ElectricCar(String licensePlate) {
        super(licensePlate, VehicleType.ELECTRIC_CAR);
    }
}`
      },
      {
        key: "LLD_CONCURRENCY",
        name: "6. Thread-Safety & Concurrency in LLD",
        mnemonic: "ConcurrentHashMap + Row-level ReentrantLock + Atomic Variables",
        colorClass: "active-solid-p",
        rule: "Machine coding systems (Parking Lot, Movie Booking, Elevator) must support concurrent access. Avoid synchronizing whole service methods (`public synchronized Ticket park()`). Instead, use row-level locking on individual entities (`spot.getLock().tryLock()`), `ConcurrentHashMap.computeIfAbsent()`, and atomic counters.",
        analogy: "A hotel registration desk: instead of locking the front door so only one guest enters the hotel at a time, clerks only lock the specific room keycard during check-in.",
        violationSmell: "Calling `if (!map.containsKey(id)) map.put(id, entity)` in a multi-threaded service, leading to check-then-act race conditions.",
        solutionPattern: "Use `ConcurrentHashMap` with atomic compound operations (`putIfAbsent`, `compute`), and explicit ReentrantLock on mutable entities with timeouts.",
        codeSnippet: `// Thread-Safe Atomic Reservation:
public boolean reserveSeat(String seatId, String userId) {
    ShowSeat seat = seatMap.get(seatId);
    if (seat == null) return false;
    return seat.tryLockAndReserve(userId, 100, TimeUnit.MILLISECONDS);
}`
      }
    ]
  }
};
