/**
 * springboot-data.js
 * Senior Engineer & Staff Level Spring Boot, Transactions, JPA, Hibernate & Spring Security Architecture
 * Enriched with Visual Mindmaps, Flow Diagrams & Mental Models.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.SPRING_TOPICS = [
  {
    id: "spring-proxies-transactional-pitfalls",
    title: "Spring AOP & The @Transactional Proxy Trap",
    category: "Core Spring & AOP",
    badge: "Must Know Trap",
    oneLiner: "Why calling this.method() inside the same class bypasses CGLIB proxy transaction wrappers.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: The Self-Invocation Proxy Bypass</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">External Caller</span>
            <span class="node-desc">service.methodA()</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">CGLIB Proxy</span>
            <span class="node-desc">Begins JDBC Tx ✅</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">Target.methodA()</span>
            <span class="node-desc">Raw Java Object</span>
          </div>
          <span class="flow-arrow-separator">──this.methodB()──►</span>
          <div class="flow-step-node node-red">
            <span class="node-label">Target.methodB()</span>
            <span class="node-desc">NO PROXY! Tx Ignored ❌</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #34d399;">
          ✅ <strong>Solution:</strong> Inject self (<code>self.methodB()</code>), refactor into a dedicated service, or use <code>TransactionTemplate</code>.
        </div>
      </div>
    `,
    summary: "How CGLIB and JDK dynamic proxies intercept method calls, why internal self-invocation bypasses transactions, and production-tested solutions.",
    keyPoints: [
      "JDK Proxy vs CGLIB: JDK Proxy requires interfaces and uses java.lang.reflect.Proxy. CGLIB subclasses the concrete class using bytecode enhancement (default in Spring Boot 2 & 3).",
      "Why Private Methods Cannot Be @Transactional: CGLIB generates a subclass. Subclasses cannot override private methods! If you annotate a private method with @Transactional, Spring quietly ignores it without throwing an error.",
      "The Self-Invocation Pitfall: When methodA() calls this.methodB() inside the same class, the call is executed directly on the raw target object, completely bypassing the Spring proxy wrapper! @Transactional, @Async, and @Cacheable will NEVER execute.",
      "Solutions: (1) Refactor methodB into a dedicated collaborator service, (2) Self-inject the bean using @Autowired private MyService self;, or (3) Use TransactionTemplate programmatic transactions."
    ],
    codeSnippet: `// THE CLASSIC PRODUCTION DISASTER:
@Service
public class OrderService {

    // Non-transactional public entry point
    public void processOrder(Long orderId) {
        // ... some validation ...
        this.saveOrderWithAudit(orderId); // BUG: Bypasses @Transactional!
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveOrderWithAudit(Long orderId) {
        // DB changes here will NOT be wrapped in a transaction!
    }
}

// FIX 1: Dedicated Collaborator Service (Cleanest Architecture)
@Service
public class OrderWorkflowService {
    private final OrderPersistenceService persistenceService;
    // Calling persistenceService.saveOrderWithAudit() goes THROUGH proxy!
}`,
    pitfall: "Never rely on @Transactional when calling methods on 'this'. Always ensure external caller enters through the Spring proxy boundary.",
    interviewTip: "Explain what happens at runtime: Spring wraps the bean in a CGLIB proxy (OrderService$$SpringCGLIB$$0). External clients call the proxy, which begins the transaction via TransactionInterceptor, calls the target method, and commits/rollbacks upon return."
  },

  {
    id: "spring-transaction-propagation-internals",
    title: "Spring @Transactional Propagation & Logical vs Physical Transactions",
    category: "Transaction Architecture",
    badge: "Staff Transaction Engine",
    oneLiner: "Understanding the 7 transaction propagations (REQUIRED, REQUIRES_NEW, NESTED), how Spring maps multiple logical transactions to single or distinct physical JDBC connections, and rollback-only marking.",
    summary: "Spring decouples logical transaction boundaries in application code from physical JDBC database transactions. With default `Propagation.REQUIRED`, inner transactional methods join the caller's physical transaction. If an inner method throws an exception, it marks the physical transaction as 'rollback-only'. If the caller catches the exception in a try-catch, Spring still aborts the commit and throws `UnexpectedRollbackException`. `REQUIRES_NEW` suspends the outer transaction and binds a completely new physical JDBC connection to the thread.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚡ Logical vs Physical Transactions &amp; Rollback-Only Propagation</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Outer: @Transactional (REQUIRED)</div>
            <div class="space-desc">Physical Connection A (ThreadLocal)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Owns the commit/rollback lifecycle. Bound to TransactionSynchronizationManager.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #f87171;">Inner: REQUIRED (Fails!)</div>
            <div class="space-desc">Marks Connection A: rollbackOnly = true</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Even if outer catches exception in try-catch, commit MUST fail with UnexpectedRollbackException!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">REQUIRED</span>
            <span class="node-label">Joins Existing Tx</span>
            <span class="node-sub">1 Physical Connection</span>
          </div>
          <div class="flow-arrow-node">vs</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">REQUIRES_NEW</span>
            <span class="node-label">Suspends Outer Tx</span>
            <span class="node-sub">2 Physical Connections (Pool Starvation Risk!)</span>
          </div>
          <div class="flow-arrow-node">vs</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">NESTED</span>
            <span class="node-label">JDBC Savepoints</span>
            <span class="node-sub">Rollback to savepoint without killing outer</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The 7 Propagation Behaviors: 1) `REQUIRED` (Default: join existing or create new); 2) `REQUIRES_NEW` (Suspend current, create new independent physical transaction); 3) `NESTED` (Execute in a JDBC Savepoint within existing transaction); 4) `MANDATORY` (Must have existing transaction, else throw exception); 5) `SUPPORTS` (Execute in transaction if present, else non-transactional); 6) `NOT_SUPPORTED` (Suspend current transaction and run non-transactionally); 7) `NEVER` (Throw exception if transaction exists).",
      "Logical vs Physical Transactions: In a call chain `MethodA (REQUIRED) ➔ MethodB (REQUIRED)`, there are TWO logical transactions, but only ONE physical JDBC connection. MethodA owns the physical commit. If MethodB throws an exception, it marks the physical connection as `rollback-only`.",
      "The UnexpectedRollbackException Trap: If MethodA wraps MethodB in a `try-catch` block expecting to handle the error and commit other changes, MethodA will STILL fail! When MethodA tries to commit, the JDBC driver detects the `rollback-only` flag, aborts the commit, and throws `org.springframework.transaction.UnexpectedRollbackException`.",
      "Connection Pool Starvation with REQUIRES_NEW: Each `REQUIRES_NEW` suspends the outer connection and borrows a SECOND connection from HikariCP. If your thread pool size is 20 and HikariCP pool size is 20, 10 concurrent requests executing `REQUIRES_NEW` will cause a permanent connection pool deadlock!",
      "The Default Rollback Invariant: `@Transactional` rolls back ONLY on unchecked exceptions (`RuntimeException` and `Error`). Throwing a checked `Exception` (e.g. `IOException`, `SQLException`) will COMMIT the transaction unless explicitly specified: `@Transactional(rollbackFor = Exception.class)`."
    ],
    codeSnippet: `// 1. Solving the Inner Exception Rollback-Only Trap:
@Service
public class OrderService {
    private final AuditService auditService; // Separate Spring bean!

    @Transactional
    public void placeOrder(Order order) {
        orderRepository.save(order);
        try {
            // Must use REQUIRES_NEW so audit failure doesn't taint outer transaction!
            auditService.logAudit(order.getId());
        } catch (Exception e) {
            log.warn("Audit logging failed, but order should still commit: {}", e.getMessage());
        }
    }
}

@Service
public class AuditService {
    // Independent physical transaction with its own commit/rollback:
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(Long orderId) {
        auditRepository.save(new AuditLog(orderId, "ORDER_PLACED"));
    }
}`
  },

  {
    id: "hibernate-persistence-context-dirty-checking",
    title: "Hibernate Persistence Context Internals: 4 Entity States & Dirty Checking",
    category: "Data Persistence & Hibernate",
    badge: "Hibernate Internals",
    oneLiner: "Entities transition between Transient, Managed, Detached, and Removed states inside the First-Level Cache; Hibernate's snapshot dirty checking compares states on flush to generate minimal SQL UPDATEs automatically.",
    summary: "The Hibernate `Session` (JPA `EntityManager`) acts as the First-Level Cache and Persistence Context. Every managed entity has an in-memory snapshot taken when loaded from the database. When a transaction commits (or a query triggers a flush), Hibernate executes Dirty Checking: it iterates through all managed entities, compares their current property values against the initial snapshot, and schedules the minimal required SQL `UPDATE` statements automatically without requiring `repository.save()`.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧬 Hibernate Entity State Lifecycle &amp; Dirty Checking</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(14, 165, 233, 0.4); background: rgba(14, 165, 233, 0.08);">
            <div class="space-name" style="color: #38bdf8;">First-Level Cache (Session)</div>
            <div class="space-desc">Entity Instances (Map&lt;EntityKey, Object&gt;)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Guarantees Repeatable Reads: querying same ID twice returns the exact same Java memory reference (==).</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
            <div class="space-name" style="color: #fbbf24;">Snapshot Array (Object[])</div>
            <div class="space-desc">Deep copy of loaded database state</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Dirty Checking compares Entity vs Snapshot during session.flush() to detect modified columns.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Transient</span>
            <span class="node-label">new User()</span>
            <span class="node-sub">No ID, Not in Session</span>
          </div>
          <div class="flow-arrow-node">persist() ➔</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">2. Managed</span>
            <span class="node-label">Session Cache</span>
            <span class="node-sub">Dirty Checked ✅</span>
          </div>
          <div class="flow-arrow-node">detach() / commit ➔</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">3. Detached</span>
            <span class="node-label">Outside Session</span>
            <span class="node-sub">Mutations ignored</span>
          </div>
          <div class="flow-arrow-node">remove() ➔</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">4. Removed</span>
            <span class="node-label">Scheduled DELETE</span>
            <span class="node-sub">Deleted on flush</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The 4 Entity States: 1) `Transient`: Raw `new` Java object, has no database identity (@Id is null), unmanaged; 2) `Managed / Persistent`: Associated with the active Persistence Context, changes tracked via Dirty Checking; 3) `Detached`: Has a database ID, but the Session that loaded it is closed (mutations are NOT tracked); 4) `Removed`: Scheduled for SQL `DELETE` upon flush.",
      "How Dirty Checking Works: When an entity is loaded, Hibernate stores an array of its field values in an internal snapshot buffer (`EntityEntry`). At transaction commit (or before executing a JPQL query), Hibernate compares current entity field values against the snapshot. If any value differs, an `UPDATE` statement is queued.",
      "Why `repository.save()` is Redundant on Managed Entities: If you fetch an entity via `findById()` inside a `@Transactional` method and call `user.setEmail('new@corp.com')`, you DO NOT need to call `repository.save(user)`! Dirty checking flushes the update automatically.",
      "The Merge vs Persist Invariant: `entityManager.persist(entity)` makes the passed object managed. `entityManager.merge(detachedEntity)` DOES NOT make the passed object managed! It copies state from the detached object into a newly fetched managed instance and returns the NEW managed instance.",
      "Flush vs Commit: `flush()` executes pending SQL statements (INSERT, UPDATE, DELETE) to the database socket buffer. `commit()` commits the physical JDBC transaction. Flush DOES NOT commit (changes can still be rolled back)!"
    ],
    codeSnippet: `// 1. The Redundant save() Myth in Managed Transactions:
@Transactional
public void updateEmail(Long userId, String newEmail) {
    User user = userRepository.findById(userId).orElseThrow();
    user.setEmail(newEmail); // DIRTY CHECKING automatically executes UPDATE on commit!
    // userRepository.save(user); // <-- Completely unnecessary line of code!
}

// 2. The merge() Return Value Trap:
@Transactional
public User updateDetachedUser(User detachedUser) {
    // ❌ BUG: detachedUser is STILL DETACHED!
    // userRepository.save(detachedUser); 
    
    // ✅ CORRECT: Must use the RETURNED managed reference!
    User managedUser = entityManager.merge(detachedUser);
    managedUser.setLastActive(Instant.now()); // Tracks mutations on managed instance
    return managedUser;
}`
  },

  {
    id: "spring-security-filter-chain-delegating-proxy",
    title: "Spring Security Architecture: FilterChainProxy, SecurityContext & ThreadLocal",
    category: "Security Architecture",
    badge: "Staff Security Architecture",
    oneLiner: "DelegatingFilterProxy bridges the Servlet container to Spring's FilterChainProxy, executing an ordered pipeline of SecurityFilterChains while storing Authentication in ThreadLocal SecurityContextHolder.",
    summary: "Spring Security is implemented entirely as a chain of standard Servlet Filters. The Servlet Container knows nothing about Spring beans; it invokes `DelegatingFilterProxy`, which delegates to the Spring-managed `FilterChainProxy`. `FilterChainProxy` matches the HTTP request against configured `SecurityFilterChain` beans and executes filters in a strictly defined order (CorsFilter ➔ CsrfFilter ➔ AuthenticationFilter ➔ SecurityContextHolderFilter ➔ AuthorizationFilter). The authenticated user principal is stored in `SecurityContextHolder` using a `ThreadLocal` strategy.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🛡️ Spring Security Filter Chain &amp; Context Pipeline</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(220, 38, 38, 0.4); background: rgba(220, 38, 38, 0.08);">
            <div class="space-name" style="color: #f87171;">Servlet Container (Tomcat)</div>
            <div class="space-desc">DelegatingFilterProxy</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Standard web.xml / Servlet filter registered with Tomcat. Passes request into Spring ApplicationContext.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Spring Context (Bean)</div>
            <div class="space-desc">FilterChainProxy ("springSecurityFilterChain")</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Selects matching SecurityFilterChain. Routes request through ordered security filters.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Context Filter</span>
            <span class="node-label">SecurityContextFilter</span>
            <span class="node-sub">Populates ThreadLocal</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">2. Auth Filter</span>
            <span class="node-label">JWT / UsernamePassword</span>
            <span class="node-sub">AuthenticationManager</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">3. Authz Filter</span>
            <span class="node-label">AuthorizationFilter</span>
            <span class="node-sub">hasRole / hasAuthority</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. DispatcherServlet</span>
            <span class="node-label">@RestController</span>
            <span class="node-sub">Business Controller Method</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The DelegatingFilterProxy Bridge: Standard Servlet filters (in Tomcat) cannot easily inject Spring beans. `DelegatingFilterProxy` acts as a lazy bridge: it is registered in the Servlet container, looks up the `springSecurityFilterChain` bean in the `WebApplicationContext`, and delegates all `doFilter()` calls to it.",
      "The Filter Order Invariant: Security filters execute in strict, deterministic sequence: 1) `CorsFilter` ➔ 2) `SecurityContextHolderFilter` (restores authentication) ➔ 3) `CsrfFilter` ➔ 4) `AuthenticationFilter` (JWT/Basic/Form login) ➔ 5) `ExceptionTranslationFilter` (catches auth errors) ➔ 6) `AuthorizationFilter` (formerly `FilterSecurityInterceptor`: checks RBAC).",
      "SecurityContextHolder & ThreadLocal: By default, `SecurityContextHolder` stores the `SecurityContext` in a `ThreadLocal`. This means authentication is bound strictly to the current worker thread! If your service spawns a new thread or uses `@Async`, the new thread will have a `null` authentication unless context propagation is explicitly configured.",
      "Authentication vs Authorization: 1) **Authentication** (Who are you?): Handled by `AuthenticationManager` ➔ `AuthenticationProvider` ➔ sets `Authentication(principal, credentials, authorities)`; 2) **Authorization** (What can you do?): Handled by `AuthorizationManager` checking `hasRole('ADMIN')`.",
      "Modern Spring Security 6 Component-Based Config: `WebSecurityConfigurerAdapter` was completely removed in Spring Security 6 / Spring Boot 3. Configuration is now 100% component-based using `@Bean public SecurityFilterChain filterChain(HttpSecurity http)`."
    ],
    codeSnippet: `// Modern Spring Security 6 / Spring Boot 3 Architecture:
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize("hasRole('ADMIN')")
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable()) // Safe to disable for stateless Bearer JWT APIs
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            // Add custom JWT filter BEFORE standard username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}`
  },

  {
    id: "spring-boot-autoconfiguration-internals",
    title: "How Auto-Configuration Actually Works",
    category: "Spring Boot Internals",
    badge: "Senior Architecture",
    oneLiner: "The DeferredImportSelector discovery pipeline and conditional bean evaluation order.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Auto-Configuration Lifecycle Pipeline</div>
        <div class="flow-chain">
          <div class="flow-step-node node-purple">
            <span class="node-label">@SpringBootApplication</span>
            <span class="node-desc">@EnableAutoConfiguration</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-blue">
            <span class="node-label">AutoConfiguration.imports</span>
            <span class="node-desc">Reads candidates list</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">Condition Evaluation</span>
            <span class="node-desc">@ConditionalOnClass, Missing</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Bean Registration</span>
            <span class="node-desc">Instantiates defaults ✅</span>
          </div>
        </div>
      </div>
    `,
    summary: "From @SpringBootApplication to AutoConfigurationImportSelector, conditional evaluation, and custom Starter creation.",
    keyPoints: [
      "Composition of @SpringBootApplication: Combines @Configuration, @ComponentScan, and @EnableAutoConfiguration.",
      "Discovery Mechanism: In Spring Boot 3+, Spring reads auto-configuration classes listed in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.",
      "DeferredImportSelector: Ensures all user-defined @Configuration beans are registered and loaded FIRST before any auto-configuration classes are evaluated.",
      "Conditional Annotations: Auto-configurations use @ConditionalOnClass, @ConditionalOnMissingBean, and @ConditionalOnProperty to activate only if the user hasn't already defined a custom bean."
    ],
    codeSnippet: `// Anatomy of a Spring Auto-Configuration Class
@AutoConfiguration
@ConditionalOnClass(DataSource.class)
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean // Only creates HikariDataSource if user didn't supply one!
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }
}`,
    pitfall: "Running @ComponentScan with a wide base package can unintentionally scan and register beans before conditional logic evaluates, breaking custom starter overrides.",
    interviewTip: "To debug auto-configuration issues in production, run the app with --debug. Spring will print a detailed 'Conditions Evaluation Report' showing exactly which configs matched and which were skipped."
  },

  {
    id: "circular-dependencies-three-level-cache",
    title: "Circular Dependencies & The 3-Level Cache",
    category: "IoC Container Mechanics",
    badge: "JVM / Spring Internals",
    oneLiner: "How Spring decouples raw instantiation from proxying using singletonFactories to resolve cycles.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: The Three-Level Cache Resolution</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: #10b981;">
            <div class="memory-block-title">Level 1: singletonObjects</div>
            <div class="memory-block-subtitle">Fully initialized, ready-to-use beans</div>
          </div>
          <div class="memory-space-block" style="border-color: #3b82f6;">
            <div class="memory-block-title">Level 2: earlySingletonObjects</div>
            <div class="memory-block-subtitle">Partially initialized (breaks cycle)</div>
          </div>
          <div class="memory-space-block" style="border-color: #f97316;">
            <div class="memory-block-title">Level 3: singletonFactories</div>
            <div class="memory-block-subtitle">ObjectFactory (generates early proxy)</div>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #f87171;">
          🚫 <strong>Constructor Injection Trap:</strong> Level 3 cache requires calling the constructor first! If BeanA needs BeanB in its constructor, instantiation cannot even begin.
        </div>
      </div>
    `,
    summary: "How Spring resolves circular references in Singleton beans using singletonObjects, earlySingletonObjects, and singletonFactories.",
    keyPoints: [
      "Level 1: singletonObjects -> Map of fully initialized, ready-to-use singleton beans.",
      "Level 2: earlySingletonObjects -> Map of partially initialized beans (instantiated, but properties not yet injected) to break cycles.",
      "Level 3: singletonFactories -> Map of ObjectFactory<?>. Used to create early proxy references (e.g., if the bean has AOP aspects like @Transactional).",
      "Why Constructor Injection Cannot Resolve Cycles: Spring must call the constructor to instantiate the object before it can put anything into the level-3 cache! If BeanA needs BeanB in its constructor, instantiation cannot even begin.",
      "Spring Boot 2.6+ Default: Circular dependencies are disabled by default (spring.main.allow-circular-references=false) to enforce clean decoupled architecture."
    ],
    codeSnippet: `// How Three-Level Cache Resolves A -> B -> A:
// 1. Thread creates A (raw instance via constructor).
// 2. A places ObjectFactory into singletonFactories (Level 3).
// 3. A populates dependencies: needs B.
// 4. Thread creates B: needs A.
// 5. B checks Level 1 (null), Level 2 (null), Level 3 (found A's factory!).
// 6. Factory generates early reference of A, moves it to Level 2 (earlySingletonObjects).
// 7. B completes initialization, moves to Level 1.
// 8. A receives completed B, finishes initialization, moves to Level 1. Done!`,
    pitfall: "If BeanA and BeanB have constructor injection circularity, Spring will throw BeanCurrentlyInCreationException. Fix by refactoring design or using @Lazy as a temporary band-aid.",
    interviewTip: "Why are there THREE levels instead of two? The 3rd level (singletonFactories) avoids generating premature AOP proxies for beans that do NOT participate in a circular dependency."
  },

  {
    id: "jpa-hibernate-nplusone-osiv",
    title: "Hibernate Pitfalls: N+1 Queries & OSIV",
    category: "Data Persistence & Performance",
    badge: "Production Critical",
    oneLiner: "Query multiplication storms, JOIN FETCH fixes, and Open Session in View connection pool starvation.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: The N+1 Query Multiplier</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">1 Initial Query</span>
            <span class="node-desc">SELECT * FROM orders (100 rows)</span>
          </div>
          <span class="flow-arrow-separator">──looping──►</span>
          <div class="flow-step-node node-red">
            <span class="node-label">100 Extra Queries!</span>
            <span class="node-desc">SELECT * FROM customer WHERE id=?</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">HikariCP Pool Starved</span>
            <span class="node-desc">101 Queries Total ❌</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #34d399;">
          ✅ <strong>The Fix:</strong> Use <code>JOIN FETCH o.customer</code> or <code>@EntityGraph</code> to load both in <strong>1 single SQL query</strong>. Disable <code>spring.jpa.open-in-view=false</code> in production!
        </div>
      </div>
    `,
    summary: "Diagnosing and killing N+1 query storms, FetchType traps, Open Session in View (OSIV) database connection leaks, and read-only transaction benefits.",
    keyPoints: [
      "The N+1 Problem: Querying 100 Orders (1 query) followed by looping order.getCustomer().getName() triggers 100 additional queries to the Customer table if fetched lazily without joins. 101 queries total!",
      "Fixing N+1: Use @EntityGraph(attributePaths = {\"customer\"}) or explicit JPQL JOIN FETCH o.customer to fetch both in a single SQL query.",
      "Open Session In View (OSIV) Anti-Pattern: Spring Boot enables spring.jpa.open-in-view=true by default. It keeps the database connection open through the web controller and view layer! Under high load, slow network clients holding HTTP connections exhaust the HikariCP connection pool.",
      "@Transactional(readOnly = true) Optimization: Signals to Hibernate to disable Dirty Checking (no snapshot caching of entities), and allows JDBC drivers to route queries to DB Read Replicas."
    ],
    codeSnippet: `// 1. Fixing N+1 via JPQL JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.items JOIN FETCH o.customer WHERE o.status = :status")
List<Order> findActiveOrdersWithDetails(@Param("status") OrderStatus status);

// 2. Disabling Dangerous OSIV in application.yml:
/*
spring:
  jpa:
    open-in-view: false # Prevents DB connection pool exhaustion in web layer
  datasource:
    hikari:
      maximum-pool-size: 20
      connection-timeout: 30000
*/`,
    pitfall: "Never use FetchType.EAGER on @OneToMany or @ManyToMany! It cannot be overridden at query time and frequently causes Cartesian Product memory explosions.",
    interviewTip: "Always recommend disabling OSIV in production microservices and moving all data loading into service boundaries with explicit DTO projections."
  },

  {
    id: "microservice-resilience-patterns",
    title: "Resilience4j Circuit Breakers & Sagas",
    category: "Distributed Systems & Cloud",
    badge: "Staff Architecture",
    oneLiner: "Preventing cascading failures via state-machine circuit breaking and coordinating distributed transactions.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Circuit Breaker State Transitions</div>
        <div class="flow-chain">
          <div class="flow-step-node node-green">
            <span class="node-label">CLOSED</span>
            <span class="node-desc">Normal Traffic 100%</span>
          </div>
          <span class="flow-arrow-separator">──Failures &gt; 50%──►</span>
          <div class="flow-step-node node-red">
            <span class="node-label">OPEN</span>
            <span class="node-desc">Fail-Fast 0ms (Fallback)</span>
          </div>
          <span class="flow-arrow-separator">──Wait 10s──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">HALF-OPEN</span>
            <span class="node-desc">Canary Test Probes</span>
          </div>
          <span class="flow-arrow-separator">──Success──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">CLOSED ✅</span>
            <span class="node-desc">Service Restored</span>
          </div>
        </div>
      </div>
    `,
    summary: "Preventing cascading failures with Resilience4j (Circuit Breaker, RateLimiter, Bulkhead), and managing distributed transactions with Saga and Outbox patterns.",
    keyPoints: [
      "Circuit Breaker States: CLOSED (normal traffic) -> OPEN (failure rate exceeds threshold, calls fail fast immediately without hitting downstream service) -> HALF-OPEN (allows canary requests to test recovery).",
      "Bulkhead Pattern: Isolates thread pools/semaphores per downstream dependency so a slow payment gateway cannot consume all worker threads and starve auth endpoints.",
      "Transactional Outbox Pattern: Ensures dual-write consistency between DB commit and Kafka event publishing by writing the event to an outbox table in the SAME local DB transaction, then asynchronously polling/CDC streaming to Kafka.",
      "Saga Pattern (Choreography vs Orchestration): Coordinates distributed transactions across microservices using compensating transactions."
    ],
    codeSnippet: `// Resilience4j Circuit Breaker & Fallback in Spring Boot
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
@Bulkhead(name = "paymentService", type = Bulkhead.Type.THREADPOOL)
public PaymentResponse chargeCreditCard(PaymentRequest req) {
    return restTemplate.postForObject(paymentServiceUrl, req, PaymentResponse.class);
}

// Fallback method must have matching signature + Exception parameter
public PaymentResponse paymentFallback(PaymentRequest req, Throwable t) {
    log.error("Payment gateway failed, queuing for async retry: {}", t.getMessage());
    return PaymentResponse.queuedForRetry(req.orderId());
}`,
    pitfall: "A fallback that simply logs and returns null can cause unexpected NullPointerExceptions downstream. Always return a meaningful fallback object or a domain-specific error.",
    interviewTip: "Compare 2-Phase Commit (2PC) vs Saga: 2PC requires blocking distributed locks across all databases (horrible scalability and single point of failure), whereas Saga trades ACID for BASE (eventual consistency with compensations)."
  }
];

window.REVISION_APP_DATA.SPRING_QUESTIONS = [
  {
    id: "spring-q1-nested-transaction-rollback-only",
    title: "1. The Inner Exception & UnexpectedRollbackException Trap",
    difficulty: "Staff",
    category: "Transactions & Concurrency",
    summary: "Why catching an exception from an inner @Transactional method in a try-catch still fails the outer transaction with UnexpectedRollbackException.",
    problem: "A developer writes an outer method `@Transactional public void process()`. It calls an inner method `@Transactional public void recordAudit()`. The audit method fails and throws a RuntimeException. The outer method catches the exception with `try-catch` and continues. But when `process()` completes, Spring throws `UnexpectedRollbackException: Transaction rolled back because it has been marked as rollback-only`. Why did Spring abort the commit?",
    juniorTrap: "Assuming that catching an exception inside a try-catch block prevents transaction rollback in Spring.",
    interviewerIntent: "Assesses understanding of logical vs physical transactions, Spring's `TransactionStatus.setRollbackOnly()` mechanics, and proper usage of `Propagation.REQUIRES_NEW`.",
    seniorAnswer: [
      "The Logical vs Physical Transaction Reality: With default `Propagation.REQUIRED`, both `process()` and `recordAudit()` participate in the EXACT SAME physical JDBC connection/transaction.",
      "Why the Commit Fails: When `recordAudit()` throws a `RuntimeException`, Spring's `TransactionAspectSupport` intercepts the error and flags the physical transaction as `rollbackOnly = true`. Even though the outer method caught the exception, the physical transaction has already been tainted!",
      "The UnexpectedRollbackException: When `process()` finishes, the outer transaction attempts to call `connection.commit()`. Spring's transaction manager inspects the status, sees `isRollbackOnly() == true`, rolls back the transaction, and throws `UnexpectedRollbackException` to notify the caller that their attempted commit was rejected.",
      "The Fix: Change `recordAudit()` to use `@Transactional(propagation = Propagation.REQUIRES_NEW)`. This creates an independent physical JDBC transaction with its own connection. If it fails, only the audit transaction rolls back, leaving the outer transaction unaffected."
    ],
    innerWorking: "Spring's `AbstractPlatformTransactionManager.processRollback()` marks `DefaultTransactionStatus.setRollbackOnly()`. In `processCommit()`, it checks `status.isGlobalRollbackOnly()` before issuing commit.",
    solution: `// ❌ THE BUGGY CODE:
@Service
public class OrderService {
    @Autowired private AuditService auditService;

    @Transactional
    public void createOrder(Order order) {
        orderRepository.save(order);
        try {
            auditService.logAudit(order); // Throws RuntimeException! Marks physical Tx as rollback-only!
        } catch (Exception e) {
            log.warn("Audit failed, but order should still commit..."); 
        }
        // Throws: UnexpectedRollbackException on method exit!
    }
}

// ✅ THE PRODUCTION FIX (REQUIRES_NEW in separate Bean):
@Service
public class AuditService {
    // Suspends outer transaction, opens fresh physical connection:
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(Order order) {
        auditRepository.save(new AuditRecord(order.getId()));
    }
}`,
    warStory: "An e-commerce company added an analytics tracking call inside their checkout transaction. The analytics database had a transient timeout. Developers caught the exception in a try-catch, yet 15% of Black Friday orders failed with `UnexpectedRollbackException`, causing $120k in lost revenue before `REQUIRES_NEW` was deployed."
  },

  {
    id: "spring-q2-kafka-event-published-before-db-commit",
    title: "2. The Dual-Write Disaster: Event Published but Database Rolled Back",
    difficulty: "Staff",
    category: "Distributed Transactions",
    summary: "Why publishing Kafka events or sending emails inside @Transactional methods causes ghost events, and resolving via @TransactionalEventListener & Transactional Outbox.",
    problem: "Inside a `@Transactional` method, a service executes `orderRepo.save(order)` and then immediately publishes an event to Kafka via `kafkaTemplate.send('order-created', order)`. The method then encounters a database constraint error and rolls back. But the Kafka message was ALREADY published! Downstream inventory services reserved stock for an order that does not exist in the database. How do you solve this?",
    juniorTrap: "Putting the Kafka send call after the database write inside the same method, thinking execution order guarantees consistency.",
    interviewerIntent: "Tests mastery of the distributed dual-write problem, phase-aware transaction listeners, and the Transactional Outbox Pattern.",
    seniorAnswer: [
      "The Dual-Write Fallacy: A relational database and an Apache Kafka cluster cannot participate in a single ACID transaction without heavy 2-Phase Commit (2PC / XA), which is slow, fragile, and not supported by Kafka producers.",
      "The Ghost Event Disaster: In `@Transactional`, the database `commit()` occurs ONLY when the method exits successfully! If you send a Kafka message inside the method body, the message hits the broker BEFORE the DB commits. If the DB commit fails (due to locks, constraints, or host crash), the event cannot be unsent.",
      "Solution 1 - @TransactionalEventListener(phase = AFTER_COMMIT): Publish an internal Spring `ApplicationEventPublisher.publishEvent()`. Listen using `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`. The Kafka call executes ONLY AFTER the physical database transaction has committed 100% successfully.",
      "Solution 2 - The Transactional Outbox Pattern: For critical financial operations where the app might crash between DB commit and Kafka send: write the event into an `OUTBOX` table in the SAME database transaction as the business entity. A CDC tool (Debezium) or polling worker reads the outbox table and streams to Kafka with guaranteed at-least-once delivery."
    ],
    innerWorking: "`TransactionSynchronizationManager.registerSynchronization()` registers callbacks for `afterCommit()`. If the transaction rolls back, `afterCommit()` is skipped entirely.",
    solution: `// Solution 1: Spring Phase-Aware Transactional Event Listener
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void placeOrder(Order order) {
        orderRepository.save(order); // 1. Save to DB
        // 2. Publish internal Spring event (Does NOT send to Kafka yet!)
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));
    }
}

@Component
public class OrderKafkaDispatcher {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // Fires ONLY AFTER the DB transaction has successfully committed!
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderCreated(OrderCreatedEvent event) {
        kafkaTemplate.send("order-created", event.orderId());
    }
}`,
    warStory: "A crypto exchange credited fiat balances and sent a Kafka event to buy Bitcoin. A database deadlock rolled back the fiat balance deduction, but the Kafka message already triggered the Bitcoin purchase. The exchange lost $85,000 in unbacked crypto until `@TransactionalEventListener(phase = AFTER_COMMIT)` was implemented."
  },

  {
    id: "spring-q3-async-loses-security-context-tenant",
    title: "3. @Async Context Loss: ThreadLocal Leaks & SecurityContext Propagation",
    difficulty: "Senior",
    category: "Multi-Threading & Security",
    summary: "Why @Async methods lose SecurityContextHolder and TenantContext ThreadLocals, and configuring DelegatingSecurityContextAsyncTaskExecutor.",
    problem: "A developer marks a method with `@Async`. Inside the method, calling `SecurityContextHolder.getContext().getAuthentication()` returns `null`, throwing NullPointerExceptions. In a multi-tenant application, `TenantContext.getTenantId()` is also empty. Why does this happen, and how do you cleanly propagate context across thread boundaries?",
    juniorTrap: "Switching SecurityContextHolder mode to MODE_GLOBAL, which shares one user's security context across all concurrent server threads!",
    interviewerIntent: "Assesses understanding of Java `ThreadLocal`, Spring's `TaskDecorator`, and asynchronous security context propagation.",
    seniorAnswer: [
      "The ThreadLocal Boundary: By default, `SecurityContextHolder` uses `MODE_THREADLOCAL`. ThreadLocal variables are stored in the `Thread` object of the calling thread. When `@Async` executes, Spring submits the task to a thread pool (`ThreadPoolTaskExecutor`). The pool worker thread is a completely different thread, so its ThreadLocal map is empty!",
      "The Naive Pitfall - MODE_INHERITABLETHREADLOCAL: Setting `SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL)` works only when threads are created freshly. In thread pools (where threads are recycled and reused), inherited values become stale or leak across different users!",
      "The Production Fix - TaskDecorator: Configure a `TaskDecorator` on the `ThreadPoolTaskExecutor`. When a task is submitted, the decorator captures the caller's `SecurityContext` and `TenantContext`. Inside the worker thread, it sets the context before execution, and CRITICALLY cleans it up in a `finally` block to prevent thread contamination."
    ],
    innerWorking: "`TaskDecorator.decorate(Runnable runnable)` wraps the submitted `Runnable`. It executes `SecurityContextHolder.setContext(callerContext)` before `runnable.run()`, and `SecurityContextHolder.clearContext()` in a `finally` block.",
    solution: `@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        
        // Context Propagation Decorator:
        executor.setTaskDecorator(runnable -> {
            // 1. Capture context from CALLING thread:
            SecurityContext securityContext = SecurityContextHolder.getContext();
            String tenantId = TenantContext.getTenantId();

            return () -> {
                try {
                    // 2. Bind context to WORKER thread:
                    SecurityContextHolder.setContext(securityContext);
                    TenantContext.setTenantId(tenantId);
                    runnable.run();
                } finally {
                    // 3. Clear context to prevent thread pool contamination!
                    SecurityContextHolder.clearContext();
                    TenantContext.clear();
                }
            };
        });
        
        executor.initialize();
        return executor;
    }
}`,
    warStory: "A SaaS healthcare platform used `@Async` to generate audit reports. In a reused thread pool without a TaskDecorator, Patient A's HIPAA-protected medical records were generated with Patient B's tenant ID and emailed to the wrong organization due to ThreadLocal leaking across recycled threads."
  },

  {
    id: "spring-q4-high-concurrency-deadlocks-jpa",
    title: "4. Database Deadlocks in Spring Boot: Lock Ordering & Unindexed Foreign Keys",
    difficulty: "Staff",
    category: "Data Persistence & Concurrency",
    summary: "Diagnosing MySQL/Postgres 'Deadlock found when trying to get lock' in concurrent Spring Boot services and enforcing deterministic lock ordering.",
    problem: "Under high concurrency, your Spring Boot billing service throws 'CannotAcquireLockException: Deadlock found when trying to get lock; try restarting transaction'. The method simply updates two account balances in a transaction. What causes this deadlock, and how do you guarantee it never happens again?",
    juniorTrap: "Adding a naive retry loop around the deadlocking method without fixing the underlying non-deterministic lock acquisition order.",
    interviewerIntent: "Tests understanding of relational database row-level locking (`X-locks`, `S-locks`), lock hierarchy cycles ($T_1 \\to T_2 \\to T_1$), and deterministic sorting.",
    seniorAnswer: [
      "The Classic Inverted Lock Cycle: Thread 1 transfers $100 from Account 1 to Account 2. It locks Account 1, then attempts to lock Account 2. Thread 2 transfers $50 from Account 2 to Account 1. It locks Account 2, then attempts to lock Account 1. A circular dependency forms: $T_1$ waits for $T_2$, and $T_2$ waits for $T_1$. The database engine detects the cycle and forcibly kills one transaction with a Deadlock error.",
      "The Deterministic Lock Ordering Invariant: Always acquire locks in a globally deterministic order (e.g. by sorting primary keys in ascending order: `min(idA, idB)` first, then `max(idA, idB)`). Regardless of transfer direction, both threads will ALWAYS acquire the lower ID first, making circular wait mathematically impossible!",
      "The Unindexed Foreign Key Culprit: In PostgreSQL and MySQL, updating or deleting a parent row can require a table-level share lock or gap lock on the child table if the child table's foreign key column is not indexed! Always index every foreign key column.",
      "Pessimistic Locking vs Atomic SQL: For balance updates, avoid `SELECT ... FOR UPDATE` altogether! Use an atomic single SQL statement: `UPDATE account SET balance = balance - :amount WHERE id = :id AND balance >= :amount`."
    ],
    innerWorking: "InnoDB uses strict two-phase locking (2PL). Row locks are held until transaction commit/rollback. When a cycle is detected in the waits-for graph, InnoDB rolls back the transaction with the fewest undo log records.",
    solution: `// 1. Enforcing Deterministic Lock Ordering:
@Transactional
public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
    // Sort IDs to guarantee both threads acquire locks in the EXACT SAME order!
    Long firstLockId = Math.min(fromId, toId);
    Long secondLockId = Math.max(fromId, toId);

    // Acquire locks in ascending order:
    Account firstAccount = accountRepository.findByIdForUpdate(firstLockId);
    Account secondAccount = accountRepository.findByIdForUpdate(secondLockId);

    Account from = fromId.equals(firstLockId) ? firstAccount : secondAccount;
    Account to = toId.equals(firstLockId) ? firstAccount : secondAccount;

    from.debit(amount);
    to.credit(amount);
}

// 2. Even Better: Atomic SQL Update without locking:
@Modifying
@Query("UPDATE Account a SET a.balance = a.balance - :amount WHERE a.id = :id AND a.balance >= :amount")
int deductBalance(@Param("id") Long id, @Param("amount") BigDecimal amount);`,
    warStory: "A peer-to-peer payment app saw 50 deadlocks per minute during a festival. Transfers between users frequently happened simultaneously in both directions. Enforcing `Math.min(id1, id2)` lock acquisition order eliminated deadlocks from 50/min to exactly 0."
  },

  {
    id: "spring-q5-lazyinitializationexception-osiv-false",
    title: "5. LazyInitializationException with OSIV Disabled: Clean Architecture Fixes",
    difficulty: "Senior",
    category: "Data Persistence & Hibernate",
    summary: "Why disabling spring.jpa.open-in-view causes 'could not initialize proxy - no Session' in web controllers, and fixing via DTO projections and EntityGraphs.",
    problem: "Your team disabled 'spring.jpa.open-in-view=false' to protect the database connection pool. Immediately, REST controllers throw 'LazyInitializationException: could not initialize proxy [Order#10.items] - no Session' when Jackson serializes the response. How do you resolve this cleanly without re-enabling OSIV?",
    juniorTrap: "Re-enabling OSIV or changing relationship FetchType to FetchType.EAGER on the entity model.",
    interviewerIntent: "Assesses understanding of Hibernate Session boundaries, detached proxies, N+1 query traps, DTO projections, and `@EntityGraph`.",
    seniorAnswer: [
      "Why the Exception Occurs: An entity with a `FetchType.LAZY` association holds a CGLIB/ByteBuddy proxy instead of real data. When the `@Transactional` service method returns, the Hibernate Session closes and releases the JDBC connection back to HikariCP. When Jackson attempts to serialize the entity to JSON, it invokes `order.getItems()`. Because the Session is closed, the proxy cannot fetch the data, throwing `LazyInitializationException`.",
      "The EAGER Fetch Anti-Pattern: Changing `FetchType.LAZY` to `FetchType.EAGER` is catastrophic! It forces Hibernate to load child collections everywhere in the application, causing Cartesian Product explosions and memory exhaustion.",
      "Fix 1 - DTO Projections: Never return Hibernate JPA entities directly from REST controllers! Fetch and map the required fields into a clean Java Record / DTO inside the service boundary.",
      "Fix 2 - Dynamic Fetching via @EntityGraph / JOIN FETCH: When the API endpoint requires related data, fetch it eagerly ONLY for that specific query using `@EntityGraph(attributePaths = {'items'})` or `JOIN FETCH o.items`."
    ],
    innerWorking: "Hibernate proxies implement `HibernateProxy`. When a getter is called on an uninitialized proxy, it delegates to `LazyInitializer.initialize()`. If `session.isOpen() == false`, it throws `LazyInitializationException`.",
    solution: `// Solution 1: Dynamic @EntityGraph for Specific Query:
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Overrides default LAZY fetch for THIS specific method call only:
    @EntityGraph(attributePaths = {"items", "customer"})
    Optional<Order> findWithDetailsById(Long id);
}

// Solution 2: Clean DTO Projection (Best Practice):
public record OrderDetailResponse(
    Long id,
    String status,
    List<OrderItemDto> items
) {}

@Service
public class OrderQueryService {
    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(Long id) {
        Order order = orderRepository.findWithDetailsById(id).orElseThrow();
        // Mapped INSIDE transaction boundary while Session is open:
        return new OrderDetailResponse(
            order.getId(),
            order.getStatus().name(),
            order.getItems().stream().map(OrderItemDto::from).toList()
        );
    }
}`,
    warStory: "A legacy monolith returned entities directly from controllers with OSIV enabled. Under 5,000 req/sec, threads held DB connections open while streaming large JSON payloads over slow mobile networks, exhausting HikariCP and causing a 30-minute outage. Migrating to DTO projections with OSIV disabled dropped pool utilization by 80%."
  },

  {
    id: "spring-q6-equals-hashcode-hibernate-id-transient",
    title: "6. The JPA Entity equals() and hashCode() Contract Trap",
    difficulty: "Staff",
    category: "Java & Hibernate Internals",
    summary: "Why generating equals() and hashCode() using database @Id breaks HashSet and Set<Entity> when an entity transitions from Transient to Persistent.",
    problem: "A developer generates 'equals()' and 'hashCode()' using Lombok '@EqualsAndHashCode' on the primary key '@Id Long id'. They create a new entity, add it to a 'Set<User>', and call 'userRepository.save(user)'. When they call 'set.contains(user)', it returns FALSE! Why does HashSet fail to find the exact same Java object?",
    juniorTrap: "Using Lombok @Data or @EqualsAndHashCode(of = 'id') on JPA entities.",
    interviewerIntent: "Assesses deep knowledge of the Java `Set` hash bucket contract, Hibernate entity state transitions, and business key identity.",
    seniorAnswer: [
      "The Hash Bucket Invariant Violation: 1) `new User()` is created: its `id` is `null`; 2) The user is added to a `HashSet`. `hashCode()` returns `0` (hash of null), placing the entity into bucket `0`; 3) `userRepository.save(user)` is called: the database generates an ID (e.g. `1045`), and Hibernate mutates the `id` field; 4) When you call `set.contains(user)`, `hashCode()` is calculated on the NEW id (`1045`), which maps to bucket `7`! The HashSet searches bucket `7`, finds nothing, and returns `false`!",
      "The Identity Rule in Hibernate: An entity represents a database row. Its identity should remain immutable throughout its entire lifecycle across all states (Transient, Managed, Detached).",
      "The Correct Implementation: 1) Best: Use a **Natural Business Key** (e.g. unique immutable `uuid`, `email`, or `isbn`); 2) Pragmatic Hibernate Standard: Implement `equals()` using `this == o` or checking `getClass() == o.getClass()` and ID equality only if both are non-null. CRITICALLY, `hashCode()` must return a CONSTANT value (e.g. `getClass().hashCode()`), ensuring the hash bucket never shifts after database ID generation."
    ],
    innerWorking: "A `HashSet` finds elements by: `bucketIndex = hash(key) & (n - 1)`. If the hash value changes while an object resides inside the set, the object becomes permanently lost in the wrong bucket.",
    solution: `// ❌ THE DANGEROUS IMPLEMENTATION:
// @EqualsAndHashCode(of = "id") // NEVER DO THIS ON JPA ENTITIES!

// ✅ THE ROBUST SENIOR HIBERNATE IMPLEMENTATION:
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Natural business key (UUID generated at object instantiation):
    @Column(nullable = false, unique = true, updatable = false)
    private String businessId = UUID.randomUUID().toString();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        // Compare immutable business ID:
        return businessId != null && businessId.equals(other.businessId);
    }

    @Override
    public int hashCode() {
        // Never changes, whether transient or persisted!
        return getClass().hashCode();
    }
}`,
    warStory: "An e-commerce order processing system placed new orders in a `Set<Order>` before batch persisting. After `saveAll()`, a downstream reconciliation check failed to find any orders in the set, triggering duplicate credit card charges for 400 customers."
  },

  {
    id: "spring-q7-security-filter-exception-bypasses-controller-advice",
    title: "7. Why Security Filter Exceptions Bypass @ControllerAdvice & Custom JSON Errors",
    difficulty: "Senior",
    category: "Spring Security Architecture",
    summary: "Understanding the boundary between Servlet Filters and DispatcherServlet, and delegating filter exceptions to HandlerExceptionResolver.",
    problem: "You configured a global '@RestControllerAdvice' with '@ExceptionHandler(JwtException.class)' to return uniform JSON errors. However, when an expired JWT token is passed, the client receives a raw Tomcat 401/500 HTML error page instead of your custom JSON! Why did @ControllerAdvice fail to catch the filter error?",
    juniorTrap: "Assuming @ControllerAdvice intercepts all exceptions across the entire HTTP request lifecycle.",
    interviewerIntent: "Assesses architectural understanding of the Servlet filter pipeline vs Spring MVC DispatcherServlet handling.",
    seniorAnswer: [
      "The Architectural Boundary: Spring Security filters run in the Servlet Container BEFORE the request ever reaches Spring MVC's `DispatcherServlet`! `@ControllerAdvice` is a component of `DispatcherServlet` and catches exceptions thrown ONLY by `@Controller` and `@RestController` methods.",
      "Why Filter Exceptions Escape: When your custom `JwtAuthFilter` throws an `ExpiredJwtException`, execution immediately unwinds through the Servlet Filter chain. Because `DispatcherServlet` was never invoked, `@ControllerAdvice` never gets a chance to run.",
      "The Production Solution - HandlerExceptionResolver: In your custom filter, inject Spring's `HandlerExceptionResolver`. Wrap the filter logic in a `try-catch` block. In the `catch` block, delegate the exception directly to the resolver: `handlerExceptionResolver.resolveException(request, response, null, ex)`. This forwards the error straight into your `@ControllerAdvice`!"
    ],
    innerWorking: "`HandlerExceptionResolver` is the core Spring MVC abstraction that invokes `@ExceptionHandler` methods. By manually delegating to it from a filter, you bridge the Servlet filter layer into the Spring MVC exception handling pipeline.",
    solution: `@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    @Qualifier("handlerExceptionResolver")
    private HandlerExceptionResolver resolver;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractJwt(request);
            if (token != null && jwtProvider.validate(token)) {
                Authentication auth = jwtProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            filterChain.doFilter(request, response);
        } catch (JwtException | AuthenticationException ex) {
            // Forward exception into @ControllerAdvice!
            resolver.resolveException(request, response, null, ex);
        }
    }
}

@RestControllerAdvice
public class GlobalSecurityExceptionHandler {
    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ErrorResponse> handleJwtError(JwtException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("INVALID_TOKEN", ex.getMessage()));
    }
}`,
    warStory: "A mobile banking app deployed an update requiring strict JSON error structures. Expired JWTs caused Spring Security to return Tomcat's default HTML 401 page. The mobile app crashed with JSON parse errors, locking out 200,000 mobile users on release morning."
  },

  {
    id: "spring-q8-hibernate-batch-insert-memory-leak-first-level-cache",
    title: "8. Hibernate Batch Insert Memory Leak: First-Level Cache Accumulation",
    difficulty: "Staff",
    category: "Performance Tuning",
    summary: "Why inserting 100,000 records via saveAll() exhausts JVM memory, and using session.flush() + session.clear() or StatelessSession.",
    problem: "A batch job imports 100,000 rows from a CSV into PostgreSQL using 'orderRepository.saveAll(records)'. At record 40,000, the application slows down to a crawl and crashes with 'java.lang.OutOfMemoryError: Java heap space'. How do you execute high-volume batch inserts efficiently in Hibernate?",
    juniorTrap: "Believing that setting 'spring.jpa.properties.hibernate.jdbc.batch_size=50' automatically manages JVM heap memory.",
    interviewerIntent: "Assesses understanding of Hibernate Session memory retention, dirty checking overhead during bulk operations, and StatelessSession alternatives.",
    seniorAnswer: [
      "The First-Level Cache Heap Explosion: Every entity saved via `repository.save()` is added to the Hibernate `Session` (First-Level Cache). In addition, Hibernate creates an internal snapshot copy of every entity for dirty checking. 100,000 entities means 200,000 complex Java objects pinned in memory! The JVM garbage collector cannot reclaim them because the active Session holds hard references.",
      "The Solution - Periodic Flush and Clear: Iterate in batches of 50. Every 50 items, execute `entityManager.flush()` (sends the JDBC batch to the database socket) followed by `entityManager.clear()`. `clear()` evicts all entities from the First-Level Cache, freeing memory for garbage collection.",
      "The Modern High-Performance Solution - StatelessSession: Hibernate provides `StatelessSession`. It bypasses the First-Level Cache, dirty checking, interceptors, and cascading completely! It acts as a lightweight command-oriented abstraction over JDBC with direct insert performance.",
      "The Batch Size Configuration: Ensure `hibernate.jdbc.batch_size=50` and `hibernate.order_inserts=true` are configured in `application.yml` so JDBC driver uses `addBatch()`."
    ],
    innerWorking: "`entityManager.clear()` clears the Session's `PersistenceContext` (the `entitiesByKey` and `entityEntries` maps), allowing the JVM young-gen and old-gen GC to collect the objects.",
    solution: `// Solution 1: Batch Processing with flush() and clear():
@Service
public class BulkImportService {
    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void importOrders(List<OrderDto> orderDtos) {
        int batchSize = 50;
        for (int i = 0; i < orderDtos.size(); i++) {
            Order order = OrderMapper.toEntity(orderDtos.get(i));
            entityManager.persist(order);

            if (i > 0 && i % batchSize == 0) {
                entityManager.flush(); // Send 50 INSERTs to DB in 1 network batch
                entityManager.clear(); // Free 50 entities from First-Level Cache!
            }
        }
    }
}

// Solution 2: Hibernate StatelessSession (Fastest):
public void importWithStatelessSession(SessionFactory sessionFactory, List<Order> orders) {
    try (StatelessSession session = sessionFactory.openStatelessSession()) {
        Transaction tx = session.beginTransaction();
        for (Order order : orders) {
            session.insert(order); // Zero cache, zero dirty checking overhead!
        }
        tx.commit();
    }
}`,
    warStory: "A payroll system processed monthly salaries for 250,000 employees using `saveAll()`. The server OOM-crashed 8 times during payroll run. Refactoring to batch `flush()` and `clear()` dropped execution time from 45 minutes to 90 seconds and cut heap usage from 8GB to 250MB."
  },

  {
    id: "spring-q9-optimistic-locking-collision-storms",
    title: "9. Optimistic Locking Collision Storms Under Flash Sale Concurrency",
    difficulty: "Staff",
    category: "Transactions & Concurrency",
    summary: "When @Version optimistic locking fails under extreme write contention, and transitioning to atomic database decrements or Redis pre-allocation.",
    problem: "During a flash sale with 1,000 units of a product in stock, 5,000 users attempt to purchase simultaneously. Your entity uses '@Version private Long version'. 4,900 requests fail with 'OptimisticLockException: Row was updated or deleted by another transaction'. Customers complain they could not purchase despite stock remaining. How do you re-architect this?",
    juniorTrap: "Adding an '@Retryable' annotation on optimistic lock failures, which causes 5,000 threads to spin in retry loops, crippling the database with CPU spikes.",
    interviewerIntent: "Assesses understanding of optimistic vs pessimistic concurrency control, retry storms, and atomic single-statement SQL updates.",
    seniorAnswer: [
      "Why Optimistic Locking Fails on Hotspots: Optimistic locking (`@Version`) assumes write collisions are RARE. When 5,000 threads read `version = 1`, only ONE thread succeeds in committing `SET version = 2 WHERE version = 1`. The remaining 4,999 threads fail immediately! Retrying simply repeats the collision with 4,998 failures.",
      "Solution 1 - Atomic SQL Update (No Locks, No Retries): Push the deduction into a single atomic relational update: `UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty`. Relational databases serialize updates to a single row at the row-lock level. The query returns the updated row count (1 if successful, 0 if out of stock). Zero version collisions!",
      "Solution 2 - Pessimistic Locking (PESSIMISTIC_WRITE): Use `SELECT ... FOR UPDATE`. Queues threads sequentially. While safe, it limits throughput to database disk I/O.",
      "Solution 3 - Redis Inventory Pre-Allocation: Store inventory in Redis (`stock:product:101 = 1000`). Deduct via atomic `DECRBY` or Lua script. Only requests that successfully deduct from Redis are permitted to write to the database asynchronously via Kafka."
    ],
    innerWorking: "Relational row locks are exclusive. An atomic `UPDATE ... WHERE stock >= :qty` leverages database row-level latching, avoiding application-side retries and version exceptions completely.",
    solution: `// 1. Clean Atomic SQL Update Pattern:
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
    int deductStockAtomic(@Param("id") Long id, @Param("qty") int qty);
}

@Service
public class OrderService {
    @Transactional
    public void purchase(Long productId, int quantity) {
        // Atomic single statement: returns 1 if stock was deducted, 0 if out of stock!
        int updated = productRepository.deductStockAtomic(productId, quantity);
        if (updated == 0) {
            throw new OutOfStockException("Item is sold out!");
        }
        // Proceed with order creation...
    }
}`,
    warStory: "A concert ticket vendor used `@Version` for seat allocation. 20,000 fans tried to buy 2,000 seats. 19,000 requests failed with OptimisticLockException on the first click. An atomic SQL update with `WHERE stock >= :qty` eliminated all exceptions and processed 2,000 checkouts in 1.8 seconds."
  },

  {
    id: "spring-q10-generationtype-identity-disables-jdbc-batching",
    title: "10. GenerationType.IDENTITY Silently Disables Hibernate JDBC Batching",
    difficulty: "Staff",
    category: "Data Persistence & Performance",
    summary: "Why MySQL auto_increment and GenerationType.IDENTITY force immediate INSERT execution, and switching to SEQUENCE / pooled-lo optimizer.",
    problem: "You configure 'hibernate.jdbc.batch_size=50' in application.yml. However, inspecting SQL logs shows Hibernate still executes 100 individual SQL INSERT statements one by one! Why is JDBC batching silently ignored when using GenerationType.IDENTITY?",
    juniorTrap: "Assuming that setting 'hibernate.jdbc.batch_size' works for all entity identifier generation strategies.",
    interviewerIntent: "Tests deep knowledge of the Hibernate Persistence Context entity key contract and database ID generation constraints.",
    seniorAnswer: [
      "The Persistence Context Invariant: Every managed entity inside the Hibernate `Session` MUST have a non-null, unique `EntityKey(id)`. Without an ID, Hibernate cannot store the entity in its First-Level Cache map (`Map<EntityKey, Object>`).",
      "The IDENTITY Dilemma: `GenerationType.IDENTITY` relies on database auto-increment columns (e.g. MySQL `AUTO_INCREMENT`). The database assigns the ID ONLY when the `INSERT` statement is physically executed! Therefore, Hibernate CANNOT delay the insert: it is forced to execute `INSERT` immediately during `persist()`, breaking JDBC batching.",
      "The Solution - GenerationType.SEQUENCE: Use database sequences (PostgreSQL, Oracle). Hibernate queries the sequence in advance, assigns the ID to the entity in memory, adds it to the Persistence Context, and queues the insert for batch execution upon flush.",
      "The pooled-lo Optimizer: With sequence allocation, fetching an ID per entity requires an extra SQL query. Use Hibernate's `pooled-lo` optimizer: Hibernate fetches 50 IDs in a single sequence call (`nextval * 50`), allocating the next 50 IDs purely in JVM memory!"
    ],
    innerWorking: "Hibernate's `IdentifierGenerator` for IDENTITY implements `PostInsertIdentifierGenerator`. It forces an immediate `executeInsert()` to retrieve the generated key via `Statement.getGeneratedKeys()`.",
    solution: `// ❌ THE BATCH-KILLING IDENTITY STRATEGY:
// @GeneratedValue(strategy = GenerationType.IDENTITY) // Disables batching!

// ✅ BATCH-ENABLED SEQUENCE WITH POOLED-LO OPTIMIZER:
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq_gen")
    @SequenceGenerator(
        name = "order_seq_gen",
        sequenceName = "order_seq",
        allocationSize = 50 // Fetches 50 IDs in 1 sequence call, batching 50 inserts!
    )
    private Long id;
}

// application.yml:
/*
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
*/`,
    warStory: "A logistics platform inserting 2 million tracking events per day was taking 4 hours on MySQL with `GenerationType.IDENTITY`. Migrating to PostgreSQL with `GenerationType.SEQUENCE` and `allocationSize = 100` enabled true JDBC batching, cutting runtime from 4 hours down to 11 minutes."
  },

  {
    id: "spring-q11-checked-exception-transaction-rollback-trap",
    title: "11. The Checked Exception Rollback Trap in Spring @Transactional",
    difficulty: "Senior",
    category: "Transactions & Concurrency",
    summary: "Why throwing a checked Exception (e.g. IOException, custom Exception) causes Spring to COMMIT the transaction by default, and rollbackFor rules.",
    problem: "A developer writes: '@Transactional public void billUser() throws PaymentFailedException'. If a payment gateway error occurs, the method throws 'PaymentFailedException' (which extends 'Exception'). The database transaction COMMITS instead of rolling back, leaving corrupted financial records! Why did Spring commit despite an exception?",
    juniorTrap: "Assuming that any exception thrown from a @Transactional method triggers automatic transaction rollback.",
    interviewerIntent: "Tests understanding of EJB heritage in Spring transaction design and the distinction between checked vs unchecked exceptions.",
    seniorAnswer: [
      "The EJB Heritage Rollback Rule: Spring's transaction infrastructure adheres to the EJB convention: 1) **Unchecked Exceptions** (`RuntimeException` and `Error`): Treated as unexpected system failures ➔ Triggers automatic ROLLBACK; 2) **Checked Exceptions** (`Exception`, `IOException`): Treated as expected business outcomes that the caller can handle ➔ Default behavior is to COMMIT!",
      "The Production Vulnerability: If a custom exception extends `Exception` instead of `RuntimeException`, Spring considers it a checked exception and quietly COMMITS the transaction!",
      "The Production Fix: 1) Always extend `RuntimeException` for business and application exceptions; 2) When using checked exceptions or to enforce safety, ALWAYS specify: `@Transactional(rollbackFor = Exception.class)`."
    ],
    innerWorking: "`DefaultTransactionAttribute.rollbackOn(Throwable ex)` checks: `return (ex instanceof RuntimeException || ex instanceof Error)`. If neither, it checks `rollbackRules` list.",
    solution: `// ❌ THE FINANCIAL DISASTER:
// PaymentFailedException extends Exception (Checked!)
@Transactional
public void processPayment(Order order) throws PaymentFailedException {
    orderRepository.deductBalance(order);
    if (!gateway.charge()) {
        throw new PaymentFailedException("Card declined"); // Spring COMMITS this! Balance deducted!
    }
}

// ✅ THE SAFE CODE:
@Transactional(rollbackFor = Exception.class) // Guarantees rollback on ALL exceptions!
public void processPaymentSafe(Order order) throws PaymentFailedException {
    orderRepository.deductBalance(order);
    if (!gateway.charge()) {
        throw new PaymentFailedException("Card declined"); // Safely rolls back!
    }
}`,
    warStory: "A SaaS invoicing engine threw `InvoiceGenerationException extends Exception` when PDF generation failed. Because it was a checked exception, Spring committed the invoice record in the database even though no PDF was created. 12,000 customers were charged without receipts until `rollbackFor = Exception.class` was mandated."
  },

  {
    id: "spring-q12-multipledatasources-distributed-transactions",
    title: "12. Multiple DataSources in Spring Boot: Deprecated ChainedTx vs Outbox",
    difficulty: "Staff",
    category: "Distributed Transactions",
    summary: "Managing multiple DataSources in a single Spring Boot application, why ChainedTransactionManager was deprecated, and modern outbox solutions.",
    problem: "A legacy Spring Boot application connects to two distinct databases: PostgreSQL (Order DB) and MySQL (User DB). An engineer configures 'ChainedTransactionManager' to achieve atomicity across both. Why was ChainedTransactionManager deprecated, and what architectural pattern replaces it?",
    juniorTrap: "Relying on ChainedTransactionManager and assuming it provides true ACID 2-Phase Commit across multiple databases.",
    interviewerIntent: "Assesses expertise in distributed multi-resource transactions, 2PC failure modes, and migration to modern asynchronous patterns.",
    seniorAnswer: [
      "Why ChainedTransactionManager Fails: `ChainedTransactionManager` simply commits transactions in sequence: Commit DB 1, then Commit DB 2. If DB 1 commits successfully, but DB 2 fails or crashes, DB 1 CANNOT be rolled back! It was a pseudo-distributed transaction that provided a false sense of security.",
      "The Heavyweight Solution - JTA / XA: Java Transaction API (JTA) with an XA-compliant transaction manager (like Atomikos or Bitronix) implements true Two-Phase Commit (2PC). However, 2PC requires global database locks, introduces high latency, and fails if the coordinator crashes mid-commit.",
      "The Modern Microservice Architecture - Transactional Outbox & Sagas: Modern systems decouple multi-database writes. Service A writes exclusively to its own database along with an Outbox event in the same transaction. An asynchronous event bus (Kafka) delivers the message to Service B, which updates its database with idempotent retry semantics."
    ],
    innerWorking: "Spring officially deprecated `ChainedTransactionManager` in Spring Data Lovelace / Spring 5.3 because of unavoidable partial-commit inconsistencies.",
    solution: `@Configuration
public class MultiDataSourceConfig {

    // 1. Primary DataSource (Order DB):
    @Primary
    @Bean(name = "orderDataSource")
    @ConfigurationProperties("spring.datasource.order")
    public DataSource orderDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean(name = "orderTransactionManager")
    public PlatformTransactionManager orderTransactionManager(
        @Qualifier("orderEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }

    // Explicitly specify which transaction manager handles which service:
    // @Transactional("orderTransactionManager")
}`
  },

  {
    id: "spring-q13-cascadetype-remove-vs-orphanremoval-traps",
    title: "13. CascadeType.REMOVE vs orphanRemoval = true vs ON DELETE CASCADE",
    difficulty: "Senior",
    category: "Data Persistence & Hibernate",
    summary: "The critical differences between CascadeType.REMOVE, orphanRemoval, and database ON DELETE CASCADE, and memory load traps.",
    problem: "What is the exact functional difference between 'CascadeType.REMOVE' and 'orphanRemoval = true' in JPA? What happens if you call 'order.getItems().remove(0)' under each? And why does CascadeType.REMOVE cause severe performance degradation on large collections?",
    juniorTrap: "Confusing CascadeType.REMOVE with orphanRemoval, or using CascadeType.REMOVE to delete parent rows with 100,000 child rows.",
    interviewerIntent: "Tests mastery of JPA collection lifecycle management, memory overhead of cascade operations, and database-level cascades.",
    seniorAnswer: [
      "The Core Difference: 1) `CascadeType.REMOVE`: If the PARENT entity is deleted (`entityManager.remove(order)`), Hibernate deletes all associated child items. BUT if you remove a child from the collection (`order.getItems().remove(item)`), Hibernate DOES NOT delete the child from the database!; 2) `orphanRemoval = true`: Does BOTH! If the parent is deleted, children are deleted. AND if a child is removed from the parent's collection, Hibernate deletes the dereferenced child row from the database.",
      "The CascadeType.REMOVE Performance Disaster: When deleting a parent entity with `CascadeType.REMOVE`, Hibernate DOES NOT issue a single `DELETE FROM items WHERE order_id = 5`! Instead, Hibernate fetches ALL child rows into JVM memory, executes entity lifecycle interceptors, and generates $N$ individual SQL `DELETE FROM items WHERE id = ?` statements!",
      "The Production Solution - Database-Level ON DELETE CASCADE: For high-volume parent-child relationships, configure foreign keys in DDL with `ON DELETE CASCADE`. In JPA, annotate with `@OnDelete(action = OnDeleteAction.CASCADE)`. Hibernate issues a single `DELETE FROM orders WHERE id = 5`, and the database engine cleans up all child rows in microseconds."
    ],
    innerWorking: "`orphanRemoval` sets `org.hibernate.engine.internal.Cascade` to delete orphaned keys during flush. `OnDeleteAction.CASCADE` tells Hibernate to omit cascade queries and let the DB trigger cascade.",
    solution: `// 1. orphanRemoval = true (Cleans up dereferenced items):
@Entity
public class Order {
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null); // Triggers DELETE FROM order_items WHERE id = ? on flush!
    }
}

// 2. High-Performance DB-Level Cascade for Large Collections:
@Entity
public class Parent {
    @OneToMany(mappedBy = "parent")
    @OnDelete(action = OnDeleteAction.CASCADE) // Single DELETE issued by DB!
    private List<Child> children;
}`
  },

  {
    id: "spring-q14-csrf-protection-rest-apis-when-to-disable",
    title: "14. Spring Security CSRF: Why Stateless REST APIs Can Safely Disable It",
    difficulty: "Senior",
    category: "Security Architecture",
    summary: "When to disable CSRF in Spring Security, how CSRF attacks exploit ambient browser cookie credentials, and why Bearer tokens are immune.",
    problem: "In Spring Boot microservice tutorials, developers frequently write 'http.csrf(csrf -> csrf.disable())'. Is this safe? Under what exact architectural conditions is disabling CSRF 100% secure, and when is it a catastrophic vulnerability?",
    juniorTrap: "Disabling CSRF in an application that uses HTTP Session cookies for browser authentication.",
    interviewerIntent: "Assesses deep knowledge of Cross-Site Request Forgery (CSRF) attack vectors, browser ambient credentials, and token-based authentication.",
    seniorAnswer: [
      "How a CSRF Attack Works: A malicious website (`evil.com`) includes an image or form: `<form action='https://bank.com/transfer' method='POST'>`. When a victim visits `evil.com`, their browser automatically attaches all ambient stored cookies (e.g. `JSESSIONID`) for `bank.com`! The bank server receives the cookie, validates the session, and executes the unauthorized transfer.",
      "Why Stateless Bearer Token APIs are IMMUNE to CSRF: If your API uses **Bearer JWT** tokens passed in the `Authorization: Bearer <token>` HTTP header, browsers DO NOT automatically attach headers on cross-site requests! Only JavaScript on your explicit origin has access to the token. Because ambient credentials are not sent, CSRF attacks are mathematically impossible, making `csrf.disable()` 100% safe.",
      "When Disabling CSRF is FATAL: If your frontend communicates with Spring Boot using Cookies (`Set-Cookie: JSESSIONID=...` or `Set-Cookie: jwt=...`), you MUST NEVER disable CSRF! You must configure `CookieCsrfTokenRepository.withHttpOnlyFalse()`."
    ],
    innerWorking: "CSRF exploits the browser's automatic credential transmission behavior for `Cookie` and `Authorization: Basic` headers. It cannot forge custom HTTP request headers like `Authorization: Bearer`.",
    solution: `// 1. Safe to Disable for Stateless REST APIs:
@Bean
public SecurityFilterChain statelessApiFilterChain(HttpSecurity http) throws Exception {
    return http
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .csrf(csrf -> csrf.disable()) // 100% SAFE: Client uses Authorization: Bearer JWT
        .build();
}

// 2. MANDATORY CSRF Configuration for Cookie/Session-based Web Apps:
@Bean
public SecurityFilterChain webAppFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) // Angular / React friendly
        )
        .build();
}`
  },

  {
    id: "spring-q15-shedlock-distributed-scheduled-tasks",
    title: "15. Clustered @Scheduled Tasks: Preventing Duplicate Execution with ShedLock",
    difficulty: "Senior",
    category: "Distributed Systems & Scheduling",
    summary: "Why Spring's native @Scheduled runs on every Kubernetes pod replica, and coordinating distributed singleton execution via ShedLock.",
    problem: "A Spring Boot service has a '@Scheduled(cron = '0 0 1 * * ?')' method that sends monthly invoices. When deployed to Kubernetes with 5 replica pods, users receive 5 duplicate invoice emails at 1:00 AM! How do you guarantee the scheduled task executes on EXACTLY ONE pod across the cluster?",
    juniorTrap: "Hardcoding the scheduler to run only on pod 0 or using an external cron server without distributed coordination.",
    interviewerIntent: "Assesses understanding of cloud-native horizontal scaling, clustered cron coordination, and distributed database lock managers like ShedLock.",
    seniorAnswer: [
      "The Inherent Statelessness of @Scheduled: Spring's `@Scheduled` annotation is completely local to the running JVM. It has zero awareness of other pods in the Kubernetes cluster. If 5 pods run the image, all 5 pods execute the cron job simultaneously.",
      "The Solution - ShedLock: **ShedLock** coordinates distributed execution by acquiring a short-lived lock in a shared database or Redis (`shedlock` table/key).",
      "ShedLock Annotations: Annotate the scheduled method with `@SchedulerLock(name = 'monthlyInvoices', lockAtMostFor = '15m', lockAtLeastFor = '5m')`.",
      "`lockAtMostFor` vs `lockAtLeastFor`: 1) `lockAtMostFor`: Guarantees that if the node holding the lock crashes mid-job, the lock automatically releases after 15 minutes, preventing permanent deadlock; 2) `lockAtLeastFor`: Guarantees the lock is held for at least 5 minutes, preventing a fast task (taking 2 seconds) from releasing the lock so quickly that clock drift allows a second pod to execute it again."
    ],
    innerWorking: "ShedLock creates an entry in a database table (`name`, `lock_until`, `locked_at`, `locked_by`). It uses atomic conditional SQL updates (`UPDATE shedlock SET lock_until = ... WHERE lock_until <= now()`) to acquire the lock.",
    solution: `// 1. Enable ShedLock in Spring Boot:
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class SchedulerConfig {
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(dataSource);
    }
}

// 2. Safe Distributed Scheduled Method:
@Service
public class BillingJob {

    @Scheduled(cron = "0 0 1 * * ?") // 1:00 AM daily
    @SchedulerLock(
        name = "sendMonthlyInvoices", 
        lockAtMostFor = "15m",  // Safety net if pod crashes
        lockAtLeastFor = "5m"   // Prevents clock-drift duplicate runs
    )
    public void executeInvoices() {
        // Runs on EXACTLY ONE POD across the entire Kubernetes cluster!
        invoiceService.processAllMonthlyInvoices();
    }
}`,
    warStory: "A financial fintech deployed 10 replicas in Kubernetes. A nightly cron job charged monthly subscription fees. Because `@Scheduled` had no distributed lock, customers were charged 10 times in 1 second! The company had to refund $400,000 in duplicate fees and pay bank chargeback penalties before ShedLock was merged."
  }
,
  {
    id: "spring-q16-distributed-dual-write-saga-outbox-idempotency",
    title: "16. Dual-Write Across Microservices: @Transactional Network Anti-Pattern, Outbox CDC & Idempotent Saga Compensation",
    difficulty: "Staff / Principal Trap",
    category: "Microservices & Distributed Transactions",
    summary: "Order Service calls Payment Service over HTTP inside @Transactional, then updates Order DB. Payment succeeds, but Order Service DB commit fails.",
    problem: "You have an Order Service and a Payment Service. Inside an Order Service method annotated with @Transactional, you call Payment Service over HTTP, then update the order status in the DB. Payment succeeds, but the Order Service DB commit fails afterward. What consistency problem does this create, why does @Transactional fail, and how do you redesign with Saga/Outbox/CDC/Idempotency?",
    juniorTrap: "Assuming Spring's @Transactional magically rolls back remote HTTP payment calls upon local DB commit failure, or assuming swapping the call order (committing DB first then calling HTTP) solves the issue.",
    interviewerIntent: "Evaluates distributed transaction boundaries, dual-write failure modes, why 2PC/XA is an anti-pattern in microservices, and mastery of Transactional Outbox with CDC (Debezium), Saga orchestration/choreography, and idempotent consumer deduplication.",
    seniorAnswer: [
      "1. The Core Distributed Problem: Non-atomic distributed transaction / dual write. There are two independent transactional resources (remote payment service state and local relational database). With no distributed 2PC atomicity across them, partial failure leaves money deducted with no order confirmed. The system is permanently inconsistent with zero automatic recovery.",
      "2. Why @Transactional Does Not Protect You: 1) It only demarcates a local JDBC Connection boundary on a single datasource; it cannot enlist or roll back remote HTTP calls. 2) Holding an open DB transaction across a network call is a severe anti-pattern: slow payment service latency exhausts the HikariCP connection pool and holds database row locks, cascading into service-wide timeouts. 3) The Ordering Paradox: Calling payment before commit leads to payment succeeding but commit failing; committing before payment leads to commit succeeding but payment HTTP call timing out or failing. There is NO safe synchronous ordering.",
      "3. The Architectural Redesign (Transactional Outbox + Asynchronous Saga): In the SAME local database transaction that writes the Order entity (in PENDING status), insert a row into an 'outbox' table. A CDC process (Debezium reading the database commit log/WAL) publishes the outbox event to Kafka with zero dual-write risk.",
      "4. Saga (Orchestration vs Choreography): Decompose into local transactions with compensating transactions. Orchestration uses a central state machine to drive steps; choreography reacts to events. If the order subsequently fails, emit a compensating 'RefundCommand' to Payment.",
      "5. Why Not kafkaTemplate.send() inside @Transactional: kafkaTemplate.send() is not transactional with the database! Either the DB commits and Kafka send fails (event lost forever), or Kafka send succeeds and DB rolls back (phantom irreversible event emitted). Furthermore, broker latency blocks the DB transaction.",
      "6. Idempotency Invariant: Producer attaches an idempotency key (orderId + step UUID). Consumer stores processed keys in a 'processed_messages' table in the same DB transaction as the business effect. A saga state machine ensures compensation transitions only once (e.g. REFUND_PENDING -> REFUNDED), preventing duplicate charges or duplicate refunds on Kafka redelivery."
    ],
    innerWorking: "Spring's TransactionInterceptor intercepts the method, requests a java.sql.Connection from HikariCP, and executes conn.setAutoCommit(false). If the remote Payment HTTP call hangs for 4 seconds, that physical DB connection sits completely idle on the thread while holding DB row locks. 30 concurrent requests will exhaust default pool size (maximumPoolSize=30), taking down the entire Order microservice.",
    solution: `// 1. ATOMIC LOCAL WRITE (Order + Outbox in ONE Local Transaction):
@Transactional
public Order createOrderWithOutbox(OrderRequest req) {
    Order order = orderRepository.save(new Order(req.getOrderId(), req.getAmount(), OrderStatus.PENDING));
    
    // Outbox table in the SAME database: 100% atomic with business write!
    OutboxEvent event = new OutboxEvent(
        UUID.randomUUID().toString(), // Event ID (Idempotency Key)
        "OrderCreated",
        order.getId(),
        objectMapper.writeValueAsString(new OrderCreatedPayload(order.getId(), req.getAmount()))
    );
    outboxRepository.save(event);
    return order;
    // Debezium CDC reads Postgres WAL / MySQL Binlog and streams event to Kafka!
}

// 2. IDEMPOTENT PAYMENT CONSUMER:
@KafkaListener(topics = "order-created", groupId = "payment-service")
@Transactional
public void handleOrderCreated(ConsumerRecord<String, String> record) {
    OrderCreatedPayload payload = parse(record.value());
    String idempotencyKey = "order-payment-" + payload.getOrderId();

    // Idempotency Guard: Unique constraint on processed_messages table
    if (processedMessageRepo.existsById(idempotencyKey)) {
        log.warn("Duplicate event received. Skipping payment for order: {}", payload.getOrderId());
        return;
    }

    try {
        PaymentReceipt receipt = paymentGateway.charge(payload.getAmount());
        processedMessageRepo.save(new ProcessedMessage(idempotencyKey, LocalDateTime.now()));
        outboxRepo.save(new OutboxEvent("PaymentSucceeded", payload.getOrderId()));
    } catch (PaymentException ex) {
        outboxRepo.save(new OutboxEvent("PaymentFailed", payload.getOrderId()));
    }
}

// 3. COMPENSATING TRANSACTION (REFUND) WITH SAGA STATE MACHINE GUARD:
@Transactional
public void executeCompensatingRefund(RefundCommand cmd) {
    Order order = orderRepository.findById(cmd.getOrderId()).orElseThrow();
    
    // State machine invariant prevents double-firing compensation
    if (order.getStatus() == OrderStatus.REFUNDED) {
        log.info("Compensation already executed for order: {}", cmd.getOrderId());
        return; 
    }
    
    paymentGateway.refund(order.getPaymentId(), cmd.getIdempotencyKey());
    order.setStatus(OrderStatus.REFUNDED);
    orderRepository.save(order);
}`,
    warStory: "A tier-1 airline booking system charged $1,200 flights via credit card gateway inside an active Spring @Transactional method. During a holiday flash sale, Postgres hit lock contention, causing transactions to time out during the commit phase after the credit card was charged. 3,400 customers had their cards charged but received no airline ticket, causing $4M in chargeback fees and an emergency FTC compliance audit before the Outbox pattern with Debezium CDC was deployed."
  }
];
