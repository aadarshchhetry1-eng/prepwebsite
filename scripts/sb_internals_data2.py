"""
Spring Boot Internals - Module 2 (Topics 11 to 20)
Events, IoC Lifecycle, Circular Dependencies, CGLIB, @Transactional, Config & DevTools
"""

TOPICS_PART2 = [
    # -------------------------------------------------------------------------
    # Topic 11: Spring Boot Event and Listener Mechanism
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-events-listeners",
        "title": "Spring Boot Event & Listener Internal Multicaster",
        "category": "Bootstrap & Core Engine",
        "badge": "Event-Driven Engine",
        "oneLiner": "The chronological event lifecycle dispatched via SimpleApplicationEventMulticaster.",
        "whatIsIt": "Spring Boot utilizes a robust internal event-and-listener publishing mechanism to broadcast milestone lifecycle events (starting, environment prepared, context prepared, started, ready, failed). It decouples subsystems and allows custom initializers to react to bootstrap phases.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Spring Boot Event Timeline (Chronological)</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">1. Starting</span>
                <span class="node-desc">ApplicationStartingEvent</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">2. Env Prepared</span>
                <span class="node-desc">ApplicationEnvironmentPreparedEvent</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">3. Context Prepared</span>
                <span class="node-desc">ApplicationContextInitializedEvent</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">4. Context Loaded</span>
                <span class="node-desc">ApplicationPreparedEvent</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">5. Started</span>
                <span class="node-desc">ApplicationStartedEvent</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">6. Ready</span>
                <span class="node-desc">ApplicationReadyEvent</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Early Listener Trap:</strong> Listeners for ApplicationStartingEvent cannot be Spring @Bean components because the IoC container does not exist yet!
            </div>
          </div>
        """,
        "internalWorking": "Events are managed by `SpringApplicationRunListeners` wrapping `EventPublishingRunListener`. It uses `SimpleApplicationEventMulticaster` to route events to registered `ApplicationListener<E>` instances: (1) `ApplicationStartingEvent`: Fired immediately when run() starts. (2) `ApplicationEnvironmentPreparedEvent`: Fired after properties and profiles are parsed but before context creation; used by logging and cloud bootstrap. (3) `ApplicationContextInitializedEvent`: Fired after context is created and initializers run. (4) `ApplicationPreparedEvent`: Fired after bean definitions are loaded but before singleton creation. (5) `ApplicationStartedEvent`: Fired after context refresh and runners execute. (6) `ApplicationReadyEvent`: Fired when app is ready to accept traffic. If boot crashes, `ApplicationFailedEvent` is broadcast.",
        "complexPart": "Why @EventListener fails for early events: Many developers annotate a method with `@EventListener(ApplicationStartingEvent.class)`. This method will NEVER be called! Why? Because `@EventListener` beans are discovered during BeanPostProcessor registration in context refresh. `ApplicationStartingEvent` and `ApplicationEnvironmentPreparedEvent` occur long before the bean container is created. To listen to early events, the listener MUST be registered in `META-INF/spring.factories` under `org.springframework.context.ApplicationListener` or added via `SpringApplication.addListeners()`.",
        "keyPoints": [
            "Event Chronology: Starting -> EnvironmentPrepared -> ContextInitialized -> Prepared -> Started -> Ready.",
            "Multicaster Threading: SimpleApplicationEventMulticaster executes listeners synchronously on the calling thread by default; can be configured with an Executor for asynchronous dispatch.",
            "Early Event Registration: Events occurring before context creation require registration in `META-INF/spring.factories` or programmatic `app.addListeners()`.",
            "Transactional Event Listeners: `@TransactionalEventListener` defers listener execution until the current database transaction reaches `AFTER_COMMIT`, `AFTER_ROLLBACK`, etc.",
            "Failure Broadcast: Any unhandled exception during startup triggers `ApplicationFailedEvent`."
        ],
        "codeSnippet": "// Early event listener: MUST be registered in spring.factories or app.addListeners!\npublic class EarlyBootListener implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {\n    @Override\n    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {\n        ConfigurableEnvironment env = event.getEnvironment();\n        System.out.println(\"Active profiles detected: \" + Arrays.toString(env.getActiveProfiles()));\n    }\n}\n\n// Transactional event listener (runs after DB commit):\n@Component\npublic class OrderNotificationService {\n    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)\n    public void handleOrderCreated(OrderCreatedEvent event) {\n        // Safe: DB transaction is 100% committed before sending email/Kafka event!\n        emailService.sendConfirmation(event.orderId());\n    }\n}",
        "pitfall": "Attempting to listen to `ApplicationEnvironmentPreparedEvent` with a standard `@Component @EventListener`. The bean does not exist yet, so the event is missed completely.",
        "interviewTip": "Emphasize the timeline: Early events (Starting, EnvironmentPrepared) occur before the Spring container exists, so listeners must be registered via SPI (spring.factories) or `SpringApplication.addListeners()`, whereas late events (Started, Ready) can be handled via `@EventListener`."
    },

    # -------------------------------------------------------------------------
    # Topic 12: Bean Lifecycle
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-bean-lifecycle",
        "title": "Spring Bean Complete Lifecycle (10 Distinct Stages)",
        "category": "Core IoC & Proxies",
        "badge": "IoC Core Mechanics",
        "oneLiner": "From BeanDefinition to destruction: the exact 10-stage lifecycle managed by DefaultListableBeanFactory.",
        "whatIsIt": "The Spring Bean Lifecycle represents the complete journey of a managed object from its raw metadata declaration (`BeanDefinition`) through instantiation, dependency injection, aware callbacks, post-processing, custom initialization, and graceful destruction.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The 10 Stages of Spring Bean Lifecycle</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">1. BeanDefinition</span>
                <span class="node-desc">Metadata parsed</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">2. Instantiation</span>
                <span class="node-desc">Reflection / CGLIB constructor</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">3. Populate Properties</span>
                <span class="node-desc">@Autowired, setters injected</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">4. Aware Callbacks</span>
                <span class="node-desc">BeanName, BeanFactory, Context</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">5. BPP Before Init</span>
                <span class="node-desc">@PostConstruct executed</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">6. InitializingBean</span>
                <span class="node-desc">afterPropertiesSet() & initMethod</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">7. BPP After Init</span>
                <span class="node-desc">AOP Proxy wrapping occurs!</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-red">
                <span class="node-label">8. Ready & Destroy</span>
                <span class="node-desc">Live use -> @PreDestroy -> destroy()</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ec4899; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> <strong>AOP Proxy Warning:</strong> AOP proxies (CGLIB/JDK) are created in BPP postProcessAfterInitialization (Stage 7), AFTER @PostConstruct!
            </div>
          </div>
        """,
        "internalWorking": "Inside `AbstractAutowireCapableBeanFactory.doCreateBean()`: (1) `createBeanInstance()`: Invokes constructor via reflection (or CGLIB). (2) `applyMergedBeanDefinitionPostProcessors()`: Finds @Autowired and @Value annotations. (3) `populateBean()`: Injects dependencies into fields and setters. (4) `initializeBean()`: (a) Aware interfaces: `BeanNameAware`, `BeanFactoryAware`, `ApplicationContextAware`. (b) `applyBeanPostProcessorsBeforeInitialization()`: CommonAnnotationBeanPostProcessor invokes `@PostConstruct`. (c) `invokeInitMethods()`: Checks if bean implements `InitializingBean.afterPropertiesSet()` and runs `@Bean(initMethod=\"init\")`. (d) `applyBeanPostProcessorsAfterInitialization()`: `AbstractAutoProxyCreator` wraps target bean in CGLIB or JDK Dynamic Proxy if AOP/@Transactional applies! (5) Bean is registered in singleton cache. (6) On shutdown: `@PreDestroy` -> `DisposableBean.destroy()` -> custom `destroyMethod`.",
        "complexPart": "Why calling proxy-dependent methods in @PostConstruct fails: In @PostConstruct (Stage 5), the bean is still raw target object! The AOP proxy is only generated in postProcessAfterInitialization (Stage 7). If your `@PostConstruct` method calls an asynchronous `@Async` or security-checked method on `this`, the proxy does not exist yet; the call executes synchronously and bypasses all proxy interception!",
        "keyPoints": [
            "Instantiation vs Initialization: Instantiation allocates memory via constructor; Initialization runs post-processors, Aware hooks, and @PostConstruct.",
            "@PostConstruct Mechanism: Invoked by `InitDestroyAnnotationBeanPostProcessor`, NOT by the Java runtime natively.",
            "AOP Creation Stage: `AbstractAutoProxyCreator` wraps the bean in an AOP proxy in `postProcessAfterInitialization`, returning the proxy reference.",
            "Destruction Hierarchy: `@PreDestroy` -> `DisposableBean.destroy()` -> custom `destroyMethod`.",
            "Prototype Scope Exception: Spring instantiates and configures prototype beans, but does NOT track or execute their destruction callbacks."
        ],
        "codeSnippet": "@Component\npublic class ComprehensiveLifecycleBean implements \n        BeanNameAware, ApplicationContextAware, InitializingBean, DisposableBean {\n    \n    // 1. Constructor\n    public ComprehensiveLifecycleBean() { System.out.println(\"1. Instantiation\"); }\n    \n    // 2. Aware Callbacks\n    @Override public void setBeanName(String name) { System.out.println(\"2. BeanNameAware: \" + name); }\n    @Override public void setApplicationContext(ApplicationContext ctx) { System.out.println(\"3. ContextAware\"); }\n    \n    // 3. PostConstruct (BPP Before Init)\n    @PostConstruct public void postConstruct() { System.out.println(\"4. @PostConstruct\"); }\n    \n    // 4. InitializingBean\n    @Override public void afterPropertiesSet() { System.out.println(\"5. afterPropertiesSet()\"); }\n    \n    // 5. PreDestroy\n    @PreDestroy public void preDestroy() { System.out.println(\"6. @PreDestroy\"); }\n    @Override public void destroy() { System.out.println(\"7. DisposableBean destroy()\"); }\n}",
        "pitfall": "Assuming `@PostConstruct` methods run with active transaction or async proxies. Because proxy creation happens after `@PostConstruct`, self-invoked transactional methods in `@PostConstruct` execute without transactions.",
        "interviewTip": "Recite the core order: Constructor -> Populate Properties (DI) -> Aware Interfaces -> BeanPostProcessor Before (@PostConstruct) -> InitializingBean (afterPropertiesSet) -> BeanPostProcessor After (AOP Proxy Wrapping) -> Ready for Use -> Destruction."
    },

    # -------------------------------------------------------------------------
    # Topic 13: Circular Dependency Resolution / Three-Level Cache
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-circular-dependencies-three-level-cache",
        "title": "Circular Dependency Resolution & The Three-Level Cache",
        "category": "Core IoC & Proxies",
        "badge": "Core IoC Algorithm",
        "oneLiner": "How DefaultSingletonBeanRegistry uses 3 maps to resolve circular references and early AOP exposure.",
        "whatIsIt": "Circular dependency occurs when Bean A requires Bean B, and Bean B requires Bean A. Spring resolves circular dependencies for setter/field-injected singleton beans using an intricate Three-Level Cache algorithm in `DefaultSingletonBeanRegistry`.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Three-Level Cache Architecture</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Level 3: singletonFactories</span>
                <span class="node-desc">Map&lt;String, ObjectFactory&lt;?&gt;&gt;</span>
                <span style="font-size: 0.65rem; color: #93c5fd;">Early Object Factory (AOP hook)</span>
              </div>
              <span class="flow-arrow-separator">──Promoted On Circular Read──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Level 2: earlySingletonObjects</span>
                <span class="node-desc">Map&lt;String, Object&gt;</span>
                <span style="font-size: 0.65rem; color: #fdba74;">Early Exposed Unfinished Instance</span>
              </div>
              <span class="flow-arrow-separator">──Fully Initialized──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Level 1: singletonObjects</span>
                <span class="node-desc">Map&lt;String, Object&gt;</span>
                <span style="font-size: 0.65rem; color: #86efac;">Ready Singleton Cache</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
              <span>🚫</span> <strong>Constructor Limitation:</strong> Constructor circular dependencies CANNOT be resolved by the 3-level cache because instantiation itself is blocked!
            </div>
          </div>
        """,
        "internalWorking": "Inside `DefaultSingletonBeanRegistry`: Level 1: `singletonObjects` (fully initialized singletons). Level 2: `earlySingletonObjects` (semi-initialized beans exposed to resolve cycles). Level 3: `singletonFactories` (holds `ObjectFactory` lambda with `getEarlyBeanReference()`). Steps when A depends on B and B depends on A: (1) Bean A is instantiated. Before populating properties, A adds an `ObjectFactory` into Level 3 cache. (2) A populates properties, finds it needs B. A calls `getBean(B)`. (3) B is instantiated. B needs A. (4) B calls `getBean(A)` -> checks Level 1 (miss), checks Level 2 (miss), checks Level 3 (HIT!). (5) Level 3 factory invokes `getEarlyBeanReference()`. If A needs an AOP proxy, the proxy is generated HERE early. The early reference is stored in Level 2, and removed from Level 3. (6) B injects early A and finishes initialization, moving into Level 1. (7) A continues, injects B, finishes, and moves to Level 1.",
        "complexPart": "Why Level 3 is necessary (Why 2 levels are not enough): Why not just put the early instance directly into Level 2? Because of AOP! If you only had 2 caches, you would have to generate AOP proxies for EVERY bean eagerly upon instantiation, even if there is no circular dependency. Level 3 uses an `ObjectFactory` lambda that defers proxy generation: only if a circular dependency actually occurs is `getEarlyBeanReference()` invoked to create the proxy early. Otherwise, proxy creation is deferred until Stage 7 of the normal lifecycle.",
        "keyPoints": [
            "Level 1 (singletonObjects): Final storage for fully initialized, dependency-injected beans.",
            "Level 2 (earlySingletonObjects): Stores partially constructed beans to prevent duplicate early proxy generation.",
            "Level 3 (singletonFactories): Stores `ObjectFactory` lambdas containing `getEarlyBeanReference()` for lazy AOP evaluation.",
            "Constructor Injection Failure: Constructor circular dependency fails with `BeanCurrentlyInCreationException` because neither bean can instantiate to register in Level 3.",
            "Spring Boot 2.6+ Ban: Circular dependencies are disabled by default (`spring.main.allow-circular-references=false`) to encourage clean decoupled architectures."
        ],
        "codeSnippet": "// How Level 3 Cache is queried in DefaultSingletonBeanRegistry:\nprotected Object getSingleton(String beanName, boolean allowEarlyReference) {\n    // 1. Check Level 1\n    Object singletonObject = this.singletonObjects.get(beanName);\n    if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {\n        // 2. Check Level 2\n        singletonObject = this.earlySingletonObjects.get(beanName);\n        if (singletonObject == null && allowEarlyReference) {\n            synchronized (this.singletonObjects) {\n                // 3. Check Level 3\n                ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);\n                if (singletonFactory != null) {\n                    singletonObject = singletonFactory.getObject(); // Triggers getEarlyBeanReference()\n                    this.earlySingletonObjects.put(beanName, singletonObject); // Promote to Level 2\n                    this.singletonFactories.remove(beanName); // Evict from Level 3\n                }\n            }\n        }\n    }\n    return singletonObject;\n}",
        "pitfall": "Constructor circular dependencies cannot be resolved by the Three-Level cache; they require refactoring or `@Lazy` injection.",
        "interviewTip": "The ultimate senior question: 'Why 3 levels instead of 2?' Answer: To support AOP cleanly. Level 3 defers AOP proxy generation so proxies are only generated early IF a circular dependency exists; otherwise, proxies are created during standard post-processing."
    },

    # -------------------------------------------------------------------------
    # Topic 14: @Configuration vs @Component / CGLIB Proxying
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-configuration-vs-component",
        "title": "@Configuration (Full) vs @Component (Lite) CGLIB Proxying",
        "category": "Core IoC & Proxies",
        "badge": "CGLIB Bytecode",
        "oneLiner": "The critical difference between Full configuration proxying and Lite bean invocation.",
        "whatIsIt": "In Spring, classes annotated with `@Configuration` are treated as 'Full' configuration classes, whereas classes annotated with `@Component` (or plain classes with `@Bean` methods) are treated as 'Lite' mode. The distinction dictates whether calling an inter-bean `@Bean` method returns a shared singleton or instantiates duplicate objects.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: CGLIB Proxying in @Configuration (Full Mode)</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple">
                <span class="node-label">@Configuration Class</span>
                <span class="node-desc">proxyBeanMethods = true</span>
              </div>
              <span class="flow-arrow-separator">──Enhanced By CGLIB──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">AppConfig$$SpringCGLIB</span>
                <span class="node-desc">Subclass intercepts @Bean method</span>
              </div>
              <span class="flow-arrow-separator">──Inter-bean call──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">BeanMethodInterceptor</span>
                <span class="node-desc">Checks beanFactory.getBean()</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>🛡️</span> <strong>Singleton Guarantee:</strong> Calling userRepo() 10 times in Full mode returns the exact same bean instance!
            </div>
          </div>
        """,
        "internalWorking": "ConfigurationClassPostProcessor scans for `@Configuration`. If `proxyBeanMethods=true` (the default), `ConfigurationClassEnhancer` uses CGLIB to generate a dynamic subclass `AppConfig$$SpringCGLIB`. It injects `BeanMethodInterceptor`. When Java code invokes an inter-bean method (e.g. `dataSource()` called inside `transactionManager()`), the CGLIB interceptor intercepts the call: instead of executing the method body to create a new object, it checks `beanFactory.getBean(\"dataSource\")`. If the bean exists, it returns the existing singleton. In Lite mode (`@Component` or `proxyBeanMethods=false`), no CGLIB subclass is generated; calling `dataSource()` executes pure Java, creating a brand new object and breaking the singleton guarantee!",
        "complexPart": "Why proxyBeanMethods=false is used in modern Spring: CGLIB enhancement adds reflection overhead, increases startup latency, and is incompatible with ahead-of-time (AOT) GraalVM native images without reflection hints. In Spring Boot 3 / Spring Native, `proxyBeanMethods=false` is heavily recommended when `@Bean` methods do not call each other directly, instead passing dependencies as method arguments: `@Bean public TxManager txManager(DataSource ds)`.",
        "keyPoints": [
            "Full Mode: `@Configuration` with `proxyBeanMethods=true` triggers CGLIB enhancement.",
            "Lite Mode: `@Component` with `@Bean` methods does NOT enhance classes; direct method calls create new instances.",
            "BeanMethodInterceptor: The CGLIB callback intercepting `@Bean` calls and routing them to `beanFactory.getBean()`.",
            "Constructor Arguments: In Lite mode or with `proxyBeanMethods=false`, inject dependencies as method arguments to maintain singletons safely.",
            "AOT / Native Image: Setting `proxyBeanMethods=false` avoids CGLIB proxy generation, speeding up startup and native compilation."
        ],
        "codeSnippet": "@Configuration // FULL MODE (CGLIB Enhanced)\npublic class FullConfig {\n    @Bean\n    public DataSource dataSource() { return new HikariDataSource(); }\n\n    @Bean\n    public JdbcTemplate jdbcTemplate() {\n        // SAFE in Full mode: dataSource() call is intercepted by CGLIB, returning singleton!\n        return new JdbcTemplate(dataSource());\n    }\n}\n\n@Component // LITE MODE (No CGLIB!)\npublic class LiteConfig {\n    @Bean\n    public DataSource dataSource() { return new HikariDataSource(); }\n\n    @Bean\n    public JdbcTemplate jdbcTemplate() {\n        // DANGEROUS in Lite mode: creates a SECOND, unmanaged HikariDataSource instance!\n        // FIX: Inject DataSource as parameter: public JdbcTemplate jdbcTemplate(DataSource ds)\n        return new JdbcTemplate(dataSource());\n    }\n}",
        "pitfall": "Calling `@Bean` methods directly inside a `@Component` class or a `@Configuration(proxyBeanMethods=false)` class. This causes duplicate object instantiation and unmanaged resource pools (like dual database connection pools).",
        "interviewTip": "State clearly: `@Configuration` uses CGLIB to intercept `@Bean` method calls and route them through `beanFactory.getBean()`, ensuring singleton semantics. `@Component` runs in 'Lite' mode without CGLIB proxying, meaning direct `@Bean` method calls execute normal Java instantiation."
    },

    # -------------------------------------------------------------------------
    # Topic 15: @Transactional Proxy and Self-Invocation Pitfall
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-transactional-self-invocation",
        "title": "@Transactional Proxy Mechanics & The Self-Invocation Trap",
        "category": "Core IoC & Proxies",
        "badge": "AOP Proxy Traps",
        "oneLiner": "Why this.method() bypasses CGLIB proxy interceptors and how to solve it.",
        "whatIsIt": "Spring's declarative transaction management operates strictly through dynamic AOP proxies (CGLIB or JDK Dynamic Proxies). When a method inside a class calls another method within the same class via `this.method()`, the call executes directly on the raw Java object, completely bypassing the transaction proxy.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Self-Invocation Transaction Bypass</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">External Client</span>
                <span class="node-desc">Calls orderService.create()</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">CGLIB Proxy</span>
                <span class="node-desc">TransactionInterceptor begins Tx</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Target: create()</span>
                <span class="node-desc">Raw Java Object execution</span>
              </div>
              <span class="flow-arrow-separator">──this.sendEmail()──►</span>
              <div class="flow-step-node node-red">
                <span class="node-label">Target: sendEmail()</span>
                <span class="node-desc">NO PROXY! @Transactional Ignored!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ef4444; display: flex; align-items: center; gap: 6px;">
              <span>🚨</span> <strong>Production Bug:</strong> Requires_new on an internal method NEVER opens a new transaction due to self-invocation!
            </div>
          </div>
        """,
        "internalWorking": "When `@EnableTransactionManagement` is active, `InfrastructureAdvisorAutoProxyCreator` wraps transactional beans in a CGLIB subclass. The proxy contains a `TransactionInterceptor` (MethodInterceptor). When an external client calls a method, the proxy intercepts the invocation: (1) `TransactionAspectSupport.invokeWithinTransaction()` calls `PlatformTransactionManager.getTransaction()`. (2) Obtains or binds database connection to `TransactionSynchronizationManager`. (3) Calls `methodInvocation.proceed()` to run target code. (4) Catches exceptions: if `RuntimeException` or `Error`, calls `rollback()`; otherwise `commit()`. BUT if methodA() calls `this.methodB()`, the invocation is executed on the inner raw instance `this`, bypassing the `TransactionInterceptor` completely!",
        "complexPart": "Why private methods ignore @Transactional: CGLIB generates a subclass. In Java, private methods cannot be overridden by subclasses. Therefore, the CGLIB proxy subclass cannot override or intercept a private method. If you annotate a `private` method with `@Transactional`, Spring quietly ignores the annotation without throwing an error. The method runs with NO transaction context.",
        "keyPoints": [
            "AOP Proxy Interception: Transactions only execute when calls pass through the outer Spring proxy object.",
            "Self-Invocation Trap: Calling `this.method()` bypasses proxy interceptors; `@Transactional`, `@Async`, and `@Cacheable` are ignored.",
            "Private Method Limitation: CGLIB cannot override private methods; `@Transactional` on private methods is silently ignored.",
            "Rollback Rules: By default, Spring only rolls back on unchecked exceptions (`RuntimeException` and `Error`), NOT checked `Exception` (use rollbackFor = Exception.class).",
            "Solutions: (1) Refactor method into a separate service, (2) Self-inject `@Autowired private OrderService self;`, or (3) Use `TransactionTemplate`."
        ],
        "codeSnippet": "@Service\npublic class OrderService {\n    @Autowired\n    private OrderService self; // Solution 1: Self-injection\n    \n    public void placeOrder() {\n        // this.chargePayment(); // BUG: Bypasses @Transactional!\n        self.chargePayment();     // FIXED: Calls through proxy!\n    }\n    \n    @Transactional(propagation = Propagation.REQUIRES_NEW)\n    public void chargePayment() {\n        // Runs in isolated transaction\n    }\n}",
        "pitfall": "Expecting `@Transactional(propagation = Propagation.REQUIRES_NEW)` to create a new transaction when called from another method in the same class.",
        "interviewTip": "Explain the mechanics: Spring transactions rely on dynamic proxies. Internal method calls (`this.method()`) execute on the raw target instance, bypassing the `TransactionInterceptor`. Mention self-injection, separate service refactoring, or `TransactionTemplate` as solutions."
    },

    # -------------------------------------------------------------------------
    # Topic 16: Component Scanning
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-component-scanning",
        "title": "Component Scanning Internals (ASM TypeFilters & Indexing)",
        "category": "Core IoC & Proxies",
        "badge": "Discovery Mechanics",
        "oneLiner": "How ClassPathBeanDefinitionScanner uses ASM bytecode readers and candidate filters.",
        "whatIsIt": "Component scanning is the mechanism by which Spring automatically detects, parses, and registers beans annotated with `@Component`, `@Service`, `@Repository`, and `@Controller` without explicit XML or `@Bean` declarations.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Classpath Scanning via ASM TypeFilter</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">PathMatchingResolver</span>
                <span class="node-desc">Finds .class resources</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">SimpleMetadataReader</span>
                <span class="node-desc">ASM reads bytecode directly!</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">AnnotationTypeFilter</span>
                <span class="node-desc">Checks for @Component</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">ScannedGenericBeanDef</span>
                <span class="node-desc">Registered in BeanDefinitionRegistry</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Bytecode Safety:</strong> Spring uses ASM to inspect annotations without loading classes into the JVM ClassLoader!
            </div>
          </div>
        """,
        "internalWorking": "Inside `ClassPathBeanDefinitionScanner.doScan()`: (1) Converts base package into an Ant-style path pattern: `classpath*:com/example/app/**/*.class`. (2) Uses `PathMatchingResourcePatternResolver` to locate all matching `.class` files in JARs and directories. (3) Iterates through resources using `CachingMetadataReaderFactory`. Crucially, it uses `SimpleMetadataReaderFactory` backed by ASM `ClassReader` to inspect annotations without loading classes into the JVM ClassLoader! (4) Evaluates include/exclude `TypeFilter` heuristics (`AnnotationTypeFilter` checking `@Component`). (5) For candidates, creates `ScannedGenericBeanDefinition`. (6) Computes bean name via `BeanNameGenerator` (default `AnnotationBeanNameGenerator`). (7) Applies scope, lazy-init, primary, and qualifier metadata. (8) Registers in `BeanDefinitionRegistry`.",
        "complexPart": "Spring Components Indexer (`spring-context-indexer`): In massive enterprise applications with 50,000 classes, scanning disk directories and unzipping JARs via ASM adds several seconds to startup latency. Adding `spring-context-indexer` generates a compile-time metadata index file `META-INF/spring.components`. When present, `ClassPathBeanDefinitionScanner` skips disk scanning entirely and loads candidate bean class names directly from the index file!",
        "keyPoints": [
            "ASM Bytecode Reading: Inspects class annotations from raw byte streams without triggering JVM class loading.",
            "Meta-Annotation Support: `@Service`, `@Repository`, and `@Controller` are detected because they are meta-annotated with `@Component`.",
            "TypeFilter Strategies: Supports filtering candidates via regex, custom AspectJ expressions, or custom `TypeFilter` implementations.",
            "spring-context-indexer: Replaces runtime classpath scanning with a compile-time index file `META-INF/spring.components`.",
            "Base Package Resolution: Omitting `basePackages` defaults to scanning the package of the declaring `@Configuration` class."
        ],
        "codeSnippet": "@Configuration\n@ComponentScan(\n    basePackages = \"com.example.app\",\n    includeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = \".*Service\"),\n    excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Deprecated.class)\n)\npublic class ScanConfig {\n    // Scans custom packages with explicit filters\n}",
        "pitfall": "Overly broad basePackages (e.g. `basePackages = \"com\"`). This scans hundreds of unrelated classes across all vendor JARs, adding huge memory and startup latency overhead.",
        "interviewTip": "Highlight that component scanning uses ASM (bytecode manipulation) to inspect class metadata without loading the `.class` file into the JVM ClassLoader, keeping memory footprint low."
    },

    # -------------------------------------------------------------------------
    # Topic 17: Externalized Configuration
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-externalized-configuration",
        "title": "Externalized Configuration & The 17-Level Priority Order",
        "category": "Configuration & Properties",
        "badge": "Environment Pipeline",
        "oneLiner": "The strict 17-level property resolution hierarchy evaluated by ConfigDataEnvironment.",
        "whatIsIt": "Externalized configuration allows developers to run the exact same compiled application JAR across multiple environments (Dev, QA, Staging, Prod) by externalizing settings into properties files, YAML, OS environment variables, and CLI arguments.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Property Hierarchy (Highest Overrides Lowest)</div>
            <div class="flow-chain">
              <div class="flow-step-node node-red" style="min-width: 170px;">
                <span class="node-label">1. CLI Arguments</span>
                <span class="node-desc">--server.port=9090 (Highest)</span>
              </div>
              <span class="flow-arrow-separator">──Overrides──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">2. OS Environment</span>
                <span class="node-desc">SERVER_PORT=8081</span>
              </div>
              <span class="flow-arrow-separator">──Overrides──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">3. Profile YAML</span>
                <span class="node-desc">application-prod.yml</span>
              </div>
              <span class="flow-arrow-separator">──Overrides──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">4. Default YAML</span>
                <span class="node-desc">application.yml (Lowest)</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Golden Rule:</strong> Command-line arguments always win; internal packaged application.yml is the lowest fallback.
            </div>
          </div>
        """,
        "internalWorking": "In Spring Boot 2.4+, configuration loading was redesigned around `ConfigDataEnvironment` and `ConfigDataLocationResolvers`. Spring constructs a `MutablePropertySources` list inside the `StandardEnvironment`. Properties are resolved in strict top-down order: (1) DevTools global settings. (2) `@TestPropertySource` on tests. (3) CLI arguments (`--server.port=9090`). (4) `SPRING_APPLICATION_JSON` properties. (5) `ServletConfig` / `ServletContext` init parameters. (6) JNDI attributes. (7) Java System properties (`System.getProperties()`). (8) OS Environment variables (`SERVER_PORT`). (9) Profile-specific config outside JAR (`config/application-prod.yml`). (10) Profile-specific config inside JAR (`application-prod.yml`). (11) Default config outside JAR. (12) Default config inside JAR (`application.yml`).",
        "complexPart": "Relaxed Binding 2.0: Spring Boot normalizes property keys across sources. For example, `spring.datasource.max-active`, `spring.datasource.maxActive`, `SPRING_DATASOURCE_MAX_ACTIVE`, and `spring.datasource.MAX_ACTIVE` all map to the exact same field `maxActive` on `@ConfigurationProperties`. OS environment variables convert dots to underscores and dashes to underscores to comply with Linux shell environment variable restrictions.",
        "keyPoints": [
            "17-Level Priority: CLI arguments -> OS environment variables -> Profile files -> Default files.",
            "Relaxed Binding: Seamlessly binds kebab-case, camelCase, snake_case, and UPPERCASE_UNDERSCORE.",
            "Spring Boot 2.4+ ConfigData: Replaced legacy PropertySourceLoader with `ConfigDataLocationResolver` supporting `spring.config.import`.",
            "External File Overrides: Files placed in `./config/` directory outside the JAR automatically override internal packaged properties.",
            "RandomValuePropertySource: Generates random values on the fly: `${random.int}`, `${random.uuid}`."
        ],
        "codeSnippet": "# application.yml (Packaged inside JAR - Default fallback)\nserver:\n  port: 8080\napp:\n  timeout: 5000\n\n# CLI Override (Overrides everything):\n# java -jar app.jar --server.port=9090\n\n# OS Environment Override (Docker/Kubernetes):\n# export SERVER_PORT=8081\n# export APP_TIMEOUT=10000",
        "pitfall": "Assuming YAML lists merge across profiles. In Spring Boot, profile-specific configurations REPLACE entire YAML lists rather than appending elements to default lists.",
        "interviewTip": "Remember the big 4 priority levels: (1) CLI arguments override (2) OS environment variables, which override (3) profile-specific YAML/properties, which override (4) default packaged application.yml."
    },

    # -------------------------------------------------------------------------
    # Topic 18: Profiles
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-profiles",
        "title": "Spring Profiles Internal Activation & Multi-Document YAML",
        "category": "Configuration & Properties",
        "badge": "Environment Isolation",
        "oneLiner": "Environment segregation mechanisms driving @Profile condition evaluation.",
        "whatIsIt": "Spring Profiles provide a way to segregate parts of your application configuration and make it available only in certain environments (e.g. dev, test, staging, production).",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Profile-Driven Bean Activation</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Profile Activation</span>
                <span class="node-desc">spring.profiles.active=prod</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">Environment Match</span>
                <span class="node-desc">env.acceptsProfiles(profiles)</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">ProfileCondition</span>
                <span class="node-desc">Evaluates @Profile("prod")</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Bean Registration</span>
                <span class="node-desc">ProdDataSource registered</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #a78bfa; display: flex; align-items: center; gap: 6px;">
              <span>🔀</span> <strong>Multi-Document YAML:</strong> Use --- separators with spring.config.activate.on-profile to keep all profiles in one file!
            </div>
          </div>
        """,
        "internalWorking": "Profiles are stored inside `ConfigurableEnvironment.getActiveProfiles()`. When a class or bean is annotated with `@Profile(\"prod\")`, Spring uses `ProfileCondition` (a specialized `Condition`): (1) Extracts profile strings from annotation attributes. (2) Supports complex boolean expressions: `@Profile(\"dev & !cloud\")`. (3) Evaluates expression against `environment.acceptsProfiles(Profiles.of(...))`. (4) If false, the bean definition is skipped and never enters the registry. In Spring Boot 2.4+, multi-document YAML uses `spring.config.activate.on-profile` to segment configuration blocks within a single `application.yml`.",
        "complexPart": "Profile Grouping (`spring.profiles.group`): Modern Spring Boot allows creating composite profile groups. For example: `spring.profiles.group.production=proddb,prodmetrics,prodsecurity`. Activating `--spring.profiles.active=production` automatically activates all 3 underlying sub-profiles in a single step. Furthermore, if no active profile is declared, Spring activates the `default` profile.",
        "keyPoints": [
            "Activation Precedence: Activated via `spring.profiles.active` property, OS environment `SPRING_PROFILES_ACTIVE`, or CLI `--spring.profiles.active=prod`.",
            "Boolean Logic: `@Profile` supports expressions like `@Profile(\"dev | test\")`, `@Profile(\"prod & cloud\")`, and `@Profile(\"!dev\")`.",
            "Multi-Document YAML: Separate documents with `---` and filter using `spring.config.activate.on-profile`.",
            "Profile Groups: Allows bundling multiple modular sub-profiles under a single profile alias via `spring.profiles.group`.",
            "Default Profile: If no profile is specified, Spring assigns the `default` profile; override via `spring.profiles.default`."
        ],
        "codeSnippet": "# Single application.yml using multi-document syntax:\nspring:\n  profiles:\n    group:\n      prod-cluster: [\"proddb\", \"prodmetrics\", \"prodauth\"]\n---\nspring:\n  config:\n    activate:\n      on-profile: dev\nserver:\n  port: 8080\n---\nspring:\n  config:\n    activate:\n      on-profile: prod\nserver:\n  port: 443",
        "pitfall": "Using `@Profile` on beans that are dependencies of BeanFactoryPostProcessors. Since BFPPs run before the environment is finalized, profile-conditional beans can fail to resolve.",
        "interviewTip": "Mention multi-document YAML with `spring.config.activate.on-profile` (Spring Boot 2.4+) and boolean profile operators like `@Profile(\"prod & !test\")`."
    },

    # -------------------------------------------------------------------------
    # Topic 19: Actuator
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-actuator",
        "title": "Spring Boot Actuator Architecture & Endpoint Discovery",
        "category": "Web, Server & Observability",
        "badge": "Production Observability",
        "oneLiner": "Micrometer metrics, health group aggregates, and technology-agnostic endpoint mappers.",
        "whatIsIt": "Spring Boot Actuator provides production-ready operational monitoring features, exposing health checks, metrics, thread dumps, heap dumps, environment properties, and log levels over HTTP and JMX.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Actuator Endpoint Exposure Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple">
                <span class="node-label">@Endpoint Bean</span>
                <span class="node-desc">@ReadOperation, @WriteOperation</span>
              </div>
              <span class="flow-arrow-separator">──Discovered By──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">WebEndpointDiscoverer</span>
                <span class="node-desc">Exposes endpoints to Web & JMX</span>
              </div>
              <span class="flow-arrow-separator">──Filtered By──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Exposure Filter</span>
                <span class="node-desc">management.endpoints.web.exposure</span>
              </div>
              <span class="flow-arrow-separator">──Routes To──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">/actuator/* HTTP</span>
                <span class="node-desc">Health, Metrics, Env, Prometheus</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ef4444; display: flex; align-items: center; gap: 6px;">
              <span>🔒</span> <strong>Security Rule:</strong> By default, ONLY /actuator/health is exposed over web; all other endpoints are masked!
            </div>
          </div>
        """,
        "internalWorking": "Actuator endpoints are declared using `@Endpoint(id = \"custom\")` (or `@WebEndpoint`). Operations are annotated with `@ReadOperation` (GET), `@WriteOperation` (POST), or `@DeleteOperation` (DELETE). `WebEndpointDiscoverer` scans for these annotations. Crucially, Actuator endpoints are technology-agnostic: the same `@Endpoint` class is mapped to Web MVC, WebFlux, and JMX simultaneously! For Health checks, `HealthEndpoint` delegates to `HealthContributorRegistry`, querying individual `HealthIndicator` beans (DiskSpace, DataSource, Redis, Ping) and aggregating status using `StatusAggregator`.",
        "complexPart": "Kubernetes Liveness and Readiness Probes: In containerized environments, a simple `/actuator/health` is insufficient. Spring Boot Actuator automatically exposes `/actuator/health/liveness` (checks if JVM is healthy; if DOWN, Kubernetes restarts the pod) and `/actuator/health/readiness` (checks if database, caches, and queues are reachable; if DOWN, Kubernetes temporarily routes traffic away from the pod).",
        "keyPoints": [
            "Technology Agnostic: `@Endpoint` annotations map seamlessly across HTTP REST and JMX MBeans.",
            "Default Security: Only `/health` is exposed via web by default; others must be explicitly enabled via `management.endpoints.web.exposure.include`.",
            "Health Groups: Group indicators into specialized endpoints (e.g. `management.endpoint.health.group.readiness.include=db,redis`).",
            "Micrometer Integration: Standardized metrics facade exporting to Prometheus, Datadog, Influx, and CloudWatch.",
            "Runtime Log Level Mutation: `/actuator/loggers` allows changing log level to DEBUG at runtime without restarting the service."
        ],
        "codeSnippet": "# Exposing Actuator Endpoints securely:\nmanagement:\n  endpoints:\n    web:\n      exposure:\n        include: [\"health\", \"info\", \"prometheus\", \"metrics\"]\n  endpoint:\n    health:\n      show-details: when-authorized\n      probes:\n        enabled: true # Enables /liveness and /readiness for Kubernetes\n\n# Custom Endpoint in Java:\n@Component\n@Endpoint(id = \"features\")\npublic class FeatureFlagEndpoint {\n    @ReadOperation\n    public Map<String, Boolean> getFlags() { return Map.of(\"newCheckout\", true); }\n}",
        "pitfall": "Exposing `include: \"*\"` in production without Spring Security protection. This leaks database credentials, heap dumps, and environment variables via `/actuator/env` and `/actuator/heapdump`.",
        "interviewTip": "Emphasize Kubernetes probes (`/health/liveness` vs `/health/readiness`), Micrometer metrics export, and the technology-agnostic nature of `@Endpoint`."
    },

    # -------------------------------------------------------------------------
    # Topic 20: Spring Boot DevTools
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-devtools",
        "title": "Spring Boot DevTools ClassLoader Isolation & LiveReload",
        "category": "Web, Server & Observability",
        "badge": "Developer Productivity",
        "oneLiner": "Two-classloader architecture (Base vs Restart) enabling instant application restarts.",
        "whatIsIt": "Spring Boot DevTools provides rapid development feedback loops, offering automatic restart, LiveReload browser refresh, property overrides (disabling template caching), and remote debugging.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: DevTools Dual-ClassLoader Architecture</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Base ClassLoader</span>
                <span class="node-desc">Third-Party JARs (Never changes)</span>
                <span style="font-size: 0.65rem; color: #93c5fd;">Spring, Hibernate, Jackson, JDK</span>
              </div>
              <span class="flow-arrow-separator">──Parent Of──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Restart ClassLoader</span>
                <span class="node-desc">Your Application Code</span>
                <span style="font-size: 0.65rem; color: #86efac;">Controllers, Services, DTOs</span>
              </div>
              <span class="flow-arrow-separator">──Code Change──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Instant Reload</span>
                <span class="node-desc">Discard & Recreate RestartLoader!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>10x Speedup:</strong> Third-party libraries remain cached in Base ClassLoader; only your code is re-instantiated!
            </div>
          </div>
        """,
        "internalWorking": "DevTools implements a Two-ClassLoader Strategy: (1) `Base ClassLoader`: Loads all external JARs (Spring, Jackson, Tomcat, Hibernate). Because third-party JARs never change during coding, this classloader is initialized once and cached. (2) `Restart ClassLoader`: Loads your project's compiled `.class` files. When you recompile (or press Save in IDE), `FileSystemWatcher` detects file changes, immediately discards the `Restart ClassLoader`, creates a fresh one, and refreshes the ApplicationContext. Because 95% of classes remain loaded in memory in the Base ClassLoader, restarting takes ~500ms instead of 15 seconds.",
        "complexPart": "ClassCastException across ClassLoaders: If an object is deserialized or cached across a restart boundary (e.g., stored in an unmanaged static field or ThreadLocal), casting `(MyUser) obj` throws `ClassCastException: MyUser cannot be cast to MyUser`. Why? Because the old instance was loaded by the old `RestartClassLoader`, while the cast target class was loaded by the new `RestartClassLoader`! In Java, class identity is strictly `(ClassName, ClassLoader)`.",
        "keyPoints": [
            "Dual ClassLoader Architecture: Base ClassLoader (caches dependencies) + Restart ClassLoader (reloads your classes).",
            "Automatic Disabling in Production: DevTools automatically excludes itself when building production packages (`bootJar` / `bootWar`).",
            "Template Cache Disabling: Auto-configures `spring.thymeleaf.cache=false` and static resource caching to false during development.",
            "LiveReload Server: Built-in WebSocket server on port 35729 triggering browser tab refresh upon resource compilation.",
            "ClassCastException Pitfall: Objects held across restarts cause classloader mismatch exceptions."
        ],
        "codeSnippet": "// DevTools configuration in application.yml:\nspring:\n  devtools:\n    restart:\n      enabled: true\n      additional-paths: src/main/java\n      exclude: static/**,public/**\n    livereload:\n      enabled: true\n      port: 35729",
        "pitfall": "Storing classes in long-lived static variables or thread pools across restarts. The old classes stay pinned in memory, leading to ClassCastException and Metaspace memory leaks.",
        "interviewTip": "Explain the Dual ClassLoader model: Base ClassLoader caches the heavy third-party JARs, while Restart ClassLoader only reloads your project classes, making restarts nearly instantaneous."
    }
]
