"""
Spring Boot Internals - Module 3 (Topics 21 to 29)
Logging, Exception Handling, DispatcherServlet, Server Config, Back-off, BPP, Environment, Binding & Test Slices
"""

TOPICS_PART3 = [
    # -------------------------------------------------------------------------
    # Topic 21: Logging Configuration
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-logging-configuration",
        "title": "Spring Boot Logging System & Logback Pre-Initialization",
        "category": "Web, Server & Observability",
        "badge": "Subsystem Initialization",
        "oneLiner": "How LoggingApplicationListener initializes SLF4J bridges before Spring Environment is fully ready.",
        "whatIsIt": "Spring Boot provides out-of-the-box unified logging using SLF4J backed by Logback. It routes all legacy Java logging frameworks (Java Util Logging, Commons Logging, Log4j) into SLF4J bridges without code changes and allows configuring levels via properties or XML.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Spring Boot Logging Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">ApplicationStartingEvent</span>
                <span class="node-desc">Default console formatting</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">LoggingSystem.get()</span>
                <span class="node-desc">Locates LogbackLoggingSystem</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Environment Prepared</span>
                <span class="node-desc">Loads logging.level.* & logback-spring.xml</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">MDC & ANSI Color</span>
                <span class="node-desc">TraceId, SpanId, colored console</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Logback-Spring vs Logback:</strong> Always name file logback-spring.xml so Spring can parse &lt;springProfile&gt; tags!
            </div>
          </div>
        """,
        "internalWorking": "Logging initializes earlier than any other subsystem via `LoggingApplicationListener`. (1) On `ApplicationStartingEvent`, before the Environment exists, it configures basic console logging. (2) On `ApplicationEnvironmentPreparedEvent`, it invokes `LoggingSystem.get(ClassLoader)` to detect the backend (Logback, Log4j2, or JavaUtilLogging). (3) It parses `logging.level.*`, `logging.file.name`, and search for `logback-spring.xml`. (4) Using `logback-spring.xml` allows Spring's `JoranConfigurator` to parse custom tags like `<springProfile name=\"prod\">` and `<springProperty>`. Standard `logback.xml` cannot evaluate Spring profiles because it is loaded by Logback directly before Spring boots.",
        "complexPart": "Why logback.xml breaks Spring Profile integration: If you name your configuration file `logback.xml`, native Logback discovers it on the classpath and initializes itself BEFORE Spring Boot starts. Consequently, `<springProfile>` and `<springProperty>` tags will fail with parsing errors. Naming the file `logback-spring.xml` hides it from vanilla Logback, allowing `LoggingApplicationListener` to take over and inject Spring Environment variables and profiles.",
        "keyPoints": [
            "LoggingSystem SPI: Abstract facade supporting Logback, Log4j2, and JUL.",
            "Early Initialization: Configured by `LoggingApplicationListener` during environment preparation.",
            "logback-spring.xml: Mandatory name for custom logback configs to enable `<springProfile>` filtering.",
            "Bridges: Auto-configures `jul-to-slf4j` and `jcl-over-slf4j` to prevent split logging across libraries.",
            "MDC Propagation: Compatible with Micrometer Tracing to automatically inject `traceId` and `spanId` into log formats."
        ],
        "codeSnippet": "<!-- logback-spring.xml (Supports Spring Profiles!) -->\n<configuration>\n    <include resource=\"org/springframework/boot/logging/logback/defaults.xml\"/>\n    \n    <springProfile name=\"dev\">\n        <appender name=\"CONSOLE\" class=\"ch.qos.logback.core.ConsoleAppender\">\n            <encoder><pattern>%clr(%d{HH:mm:ss.SSS}){faint} %clr(%-5level) %logger{36} - %msg%n</pattern></encoder>\n        </appender>\n        <root level=\"INFO\"><appender-ref ref=\"CONSOLE\"/></root>\n    </springProfile>\n    \n    <springProfile name=\"prod\">\n        <root level=\"WARN\"><appender-ref ref=\"CONSOLE\"/></root>\n    </springProfile>\n</configuration>",
        "pitfall": "Naming the logging file `logback.xml` instead of `logback-spring.xml`. This causes `<springProfile>` tags to fail because raw Logback initializes before Spring Boot is alive.",
        "interviewTip": "Explain that `LoggingApplicationListener` sets up logging in two passes (basic console first, full configuration on EnvironmentPrepared), and emphasize why `logback-spring.xml` is necessary for profile support."
    },

    # -------------------------------------------------------------------------
    # Topic 22: Exception Handling
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-exception-handling",
        "title": "Exception Handling Architecture (ControllerAdvice vs ErrorController)",
        "category": "Web, Server & Observability",
        "badge": "Error Dispatching",
        "oneLiner": "Dual-tier error pipeline: HandlerExceptionResolver for MVC vs BasicErrorController for container errors.",
        "whatIsIt": "Spring Boot handles exceptions via a dual-tier architecture: (1) In-application business errors handled via `@ExceptionHandler` inside `@RestControllerAdvice`, and (2) Low-level container errors (404, unhandled filter crashes) routed to embedded Tomcat's `/error` endpoint handled by `BasicErrorController`.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Dual-Tier Exception Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Exception Thrown</span>
                <span class="node-desc">Inside Controller or Filter</span>
              </div>
              <span class="flow-arrow-separator">──Inside Controller──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">HandlerExceptionResolver</span>
                <span class="node-desc">@RestControllerAdvice catches!</span>
              </div>
              <span class="flow-arrow-separator">──Uncaught / Filter Crash──►</span>
              <div class="flow-step-node node-red">
                <span class="node-label">Container Error Page</span>
                <span class="node-desc">Tomcat redirects to /error</span>
              </div>
              <span class="flow-arrow-separator">──Handled By──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">BasicErrorController</span>
                <span class="node-desc">Emits standardized JSON / HTML</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ef4444; display: flex; align-items: center; gap: 6px;">
              <span>🚨</span> <strong>Filter Exception Warning:</strong> Exceptions thrown in Servlet Filters or Spring Security CANNOT be caught by @ControllerAdvice!
            </div>
          </div>
        """,
        "internalWorking": "Tier 1 (Inside DispatcherServlet): When a controller method throws an exception, `DispatcherServlet.processHandlerException()` iterates through `HandlerExceptionResolverComposite`. `ExceptionHandlerExceptionResolver` matches the exception against `@RestControllerAdvice` methods. The matched method executes and serializes response. Tier 2 (Outside DispatcherServlet / Filters): If an exception escapes DispatcherServlet (e.g., in a Servlet Filter, Spring Security, or a 404 NoHandlerFoundException), the embedded Tomcat container catches it, executes a forward dispatch to `/error`, which is mapped by `BasicErrorController`. It uses `DefaultErrorAttributes` to return `{ timestamp, status, error, path }`.",
        "complexPart": "Why @ControllerAdvice cannot catch Spring Security Filter exceptions: Servlet Filters execute BEFORE DispatcherServlet is reached. If a JWT token is expired or `OncePerRequestFilter` throws an exception, `DispatcherServlet` is never entered. Because `@ControllerAdvice` is an MVC interceptor managed by `DispatcherServlet`, it cannot intercept filter exceptions. To handle filter errors cleanly, the filter must catch the error and invoke `HandlerExceptionResolver.resolveException(request, response, null, ex)` manually.",
        "keyPoints": [
            "ExceptionHandlerExceptionResolver: Discovers and executes `@ExceptionHandler` methods in `@ControllerAdvice`.",
            "BasicErrorController: Handles container-level errors routed to `/error` when DispatcherServlet is bypassed.",
            "Filter Exemption: Servlet Filters run outside DispatcherServlet; their exceptions do NOT reach `@ControllerAdvice`.",
            "RFC 7807 Problem Details: Spring Boot 3 natively supports Problem Details specification via `spring.mvc.problemdetails.enabled=true`.",
            "ErrorAttributes: Custom bean implementing `ErrorAttributes` can customize the standardized error response payload."
        ],
        "codeSnippet": "// Catching Filter exceptions via HandlerExceptionResolver delegate:\n@Component\npublic class JwtAuthFilter extends OncePerRequestFilter {\n    @Autowired\n    @Qualifier(\"handlerExceptionResolver\")\n    private HandlerExceptionResolver resolver;\n\n    @Override\n    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {\n        try {\n            validateToken(req);\n            chain.doFilter(req, res);\n        } catch (JwtException ex) {\n            // Bridges filter exception into @ControllerAdvice!\n            resolver.resolveException(req, res, null, ex);\n        }\n    }\n}",
        "pitfall": "Assuming `@RestControllerAdvice` is a global catch-all for all exceptions. It only catches exceptions thrown within DispatcherServlet (controllers and interceptors), NOT servlet filters.",
        "interviewTip": "Differentiate clearly between `@ControllerAdvice` (handles exceptions inside the MVC DispatcherServlet) and `BasicErrorController` (handles container-level `/error` redirects for filters and 404s)."
    },

    # -------------------------------------------------------------------------
    # Topic 23: Spring MVC Request Flow
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-dispatcher-servlet-flow",
        "title": "Spring MVC Request Flow & DispatcherServlet Internals",
        "category": "Web, Server & Observability",
        "badge": "Web Engine Flow",
        "oneLiner": "The 7-stage HTTP request execution pipeline from TCP socket to HandlerAdapter.",
        "whatIsIt": "DispatcherServlet is the Front Controller of Spring MVC. It orchestrates the entire HTTP request lifecycle, mapping URLs to handler methods, executing interceptor pre/post hooks, binding arguments, invoking controllers, and converting responses via HttpMessageConverters.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: DispatcherServlet 7-Step Request Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">1. Request Inbound</span>
                <span class="node-desc">HttpServletRequest arrives</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">2. HandlerMapping</span>
                <span class="node-desc">RequestMappingHandlerMapping</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">3. HandlerExecutionChain</span>
                <span class="node-desc">Runs preHandle() on interceptors</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">4. HandlerAdapter</span>
                <span class="node-desc">RequestMappingHandlerAdapter</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">5. ArgumentResolvers</span>
                <span class="node-desc">@RequestBody, @PathVariable</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">6. Controller Invoked</span>
                <span class="node-desc">Target business method runs</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">7. MessageConverter</span>
                <span class="node-desc">Jackson writes JSON to response</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Interceptor Contract:</strong> If preHandle() returns false, the chain halts immediately and controller is never called!
            </div>
          </div>
        """,
        "internalWorking": "Inside `DispatcherServlet.doDispatch(request, response)`: (1) `getHandler(request)`: Queries `RequestMappingHandlerMapping` to find matching `HandlerMethod`. Returns `HandlerExecutionChain` (handler + `HandlerInterceptor` list). (2) `applyPreHandle()`: Iterates interceptors calling `preHandle()`. If any returns false, execution aborts. (3) `getHandlerAdapter(handler)`: Selects `RequestMappingHandlerAdapter`. (4) Parameter Resolution: `HandlerMethodArgumentResolverComposite` resolves `@PathVariable`, `@RequestParam`, and `@RequestBody` (using `MappingJackson2HttpMessageConverter`). (5) Invokes controller method via reflection. (6) Return Value Handling: `HandlerMethodReturnValueHandlerComposite` processes `@ResponseBody`, using Jackson to stream JSON directly to `HttpServletResponse.getOutputStream()`. (7) `triggerAfterCompletion()`: Executes interceptor completion callbacks.",
        "complexPart": "Why HandlerInterceptor is NOT a Servlet Filter: Filters belong to the Servlet container (Tomcat) and run on raw `HttpServletRequest` before Spring MVC is engaged. Interceptors belong to Spring MVC and run inside `DispatcherServlet`. Interceptors have direct access to the parsed `HandlerMethod` (allowing inspection of controller method annotations), but CANNOT wrap or replace the request/response input streams like a Filter can.",
        "keyPoints": [
            "Front Controller Pattern: DispatcherServlet centralizes routing, conversion, and exception handling.",
            "RequestMappingHandlerMapping: Maintains routing table mapping URL patterns and HTTP methods to controller methods.",
            "HandlerAdapter: Decouples DispatcherServlet from diverse handler types (controllers, HTTP endpoints, WebSocket handlers).",
            "ArgumentResolvers: 30+ built-in resolvers dynamically inject parameters (`Principal`, `HttpServletRequest`, `@Valid`).",
            "HttpMessageConverter: Reads JSON/XML from input streams and writes serialized payloads directly to HTTP responses."
        ],
        "codeSnippet": "@Configuration\npublic class WebMvcConfig implements WebMvcConfigurer {\n    @Autowired private AuditInterceptor auditInterceptor;\n    \n    @Override\n    public void addInterceptors(InterceptorRegistry registry) {\n        registry.addInterceptor(auditInterceptor)\n                .addPathPatterns(\"/api/**\")\n                .excludePathPatterns(\"/api/auth/**\");\n    }\n}",
        "pitfall": "Attempting to modify the HTTP request body inside a `HandlerInterceptor`. The input stream can only be read once; to inspect or modify the body, use a `ServletFilter` with `ContentCachingRequestWrapper`.",
        "interviewTip": "Walk through the 7 steps: (1) DispatcherServlet receives request, (2) HandlerMapping locates HandlerExecutionChain, (3) Interceptors preHandle(), (4) HandlerAdapter resolves arguments, (5) Controller executes, (6) MessageConverter writes response, (7) Interceptors afterCompletion()."
    },

    # -------------------------------------------------------------------------
    # Topic 24: Embedded Server Configuration
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-embedded-server-configuration",
        "title": "Embedded Server Advanced Configuration & Thread Pools",
        "category": "Web & Server Engine",
        "badge": "Production Sizing",
        "oneLiner": "Tomcat connector tuning, worker thread pool sizing, and OS keep-alive timeouts.",
        "whatIsIt": "Embedded Server Configuration governs how Tomcat, Jetty, or Undertow manages OS TCP connections, acceptor threads, worker thread pools, request queue limits, and SSL termination directly via `server.*` properties.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Tomcat Thread Pool & Connection Queue Architecture</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">OS TCP Socket</span>
                <span class="node-desc">accept-count (100)</span>
                <span style="font-size: 0.65rem; color: #93c5fd;">OS SYN Backlog Queue</span>
              </div>
              <span class="flow-arrow-separator">──Accepts──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">max-connections (8192)</span>
                <span class="node-desc">Active TCP Sockets</span>
                <span style="font-size: 0.65rem; color: #d8b4fe;">NIO Selector Multiplexing</span>
              </div>
              <span class="flow-arrow-separator">──Dispatches──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Worker Thread Pool</span>
                <span class="node-desc">threads.min-spare (10)</span>
                <span style="font-size: 0.65rem; color: #86efac;">threads.max (200)</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Capacity Cliff:</strong> When 200 worker threads are busy AND accept-count is full, Tomcat refuses TCP connections with 'Connection Refused'!
            </div>
          </div>
        """,
        "internalWorking": "In `TomcatServletWebServerFactory`, properties under `server.tomcat.*` are bound to Tomcat's `Connector` and `Http11NioProtocol`: (1) `server.tomcat.threads.max` (default 200): Sets the maximum worker threads executing servlet requests. (2) `server.tomcat.threads.min-spare` (default 10): Core threads kept alive. (3) `server.tomcat.max-connections` (default 8192): Total concurrent TCP connections the NIO Poller can multiplex using non-blocking epoll. (4) `server.tomcat.accept-count` (default 100): The OS-level TCP listen backlog queue. When all 200 threads are busy, incoming requests wait in the accept-count queue. Once the queue overflows, incoming TCP connections are actively refused by the OS.",
        "complexPart": "Tomcat ThreadPool vs Standard ThreadPoolExecutor: Standard Java `ThreadPoolExecutor` fills its queue FIRST before creating threads up to `maxPoolSize`. Tomcat reverses this behavior: its custom `ThreadPoolExecutor` prefers creating threads up to `maxThreads` FIRST to handle immediate burst traffic, and only queues requests in its TaskQueue once `maxThreads` has been completely reached!",
        "keyPoints": [
            "threads.max: Maximum worker threads servicing HTTP requests simultaneously (default 200).",
            "max-connections: Total open TCP sockets managed by NIO selectors without blocking worker threads (default 8192).",
            "accept-count: OS-level socket backlog queue for pending connection requests when all worker threads are busy (default 100).",
            "Tomcat Queue Logic: Unlike JDK ThreadPoolExecutor, Tomcat expands threads up to max BEFORE queuing tasks.",
            "Virtual Threads (Java 21): In Spring Boot 3.2+, setting `spring.threads.virtual.enabled=true` replaces Tomcat's 200 platform thread pool with an unbounded virtual thread executor!"
        ],
        "codeSnippet": "# Production Embedded Tomcat Sizing:\nserver:\n  port: 8080\n  tomcat:\n    threads:\n      min-spare: 25\n      max: 300\n    max-connections: 10000\n    accept-count: 200\n    connection-timeout: 20000\n  shutdown: graceful # Graceful shutdown support\n\n# Java 21 Loom Virtual Threads (Boot 3.2+):\nspring:\n  threads:\n    virtual:\n      enabled: true # Eliminates 200 thread ceiling!",
        "pitfall": "Setting `server.tomcat.threads.max` too high (e.g. 5000) on a 4-core container. This causes severe OS thread context switching overhead, starving CPU cores and increasing request latency.",
        "interviewTip": "Explain the 3-tier capacity pipeline: (1) max-connections (active sockets), (2) worker threads (processing requests), (3) accept-count (OS backlog queue for overflows)."
    },

    # -------------------------------------------------------------------------
    # Topic 25: Auto-Configuration Back-off Behavior
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-autoconfig-backoff",
        "title": "Auto-Configuration Back-off & Graceful Surrender Mechanics",
        "category": "Auto-Config & Dependencies",
        "badge": "Non-Invasive IoC",
        "oneLiner": "How @ConditionalOnMissingBean guarantees user customizations silently replace defaults.",
        "whatIsIt": "Back-off behavior is Spring Boot's foundational non-invasive design principle: auto-configuration classes provide sensible default infrastructure beans, but gracefully and silently step aside ('back off') the moment a developer declares their own custom bean.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Graceful Back-Off Resolution</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">User Declares Bean</span>
                <span class="node-desc">@Bean public ObjectMapper customMapper()</span>
              </div>
              <span class="flow-arrow-separator">──Phase 1: Registered──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">BeanDefinitionRegistry</span>
                <span class="node-desc">customMapper registered</span>
              </div>
              <span class="flow-arrow-separator">──Phase 2: Deferred──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">JacksonAutoConfiguration</span>
                <span class="node-desc">@ConditionalOnMissingBean(ObjectMapper)</span>
              </div>
              <span class="flow-arrow-separator">──Checks Registry──►</span>
              <div class="flow-step-node node-red">
                <span class="node-label">Auto-Config BACKS OFF!</span>
                <span class="node-desc">Default bean skipped cleanly</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>🛡️</span> <strong>Non-Invasive Contract:</strong> You never need to disable auto-configuration to customize a bean—just declare your own!
            </div>
          </div>
        """,
        "internalWorking": "Inside `JacksonAutoConfiguration`: The default `ObjectMapper` bean is declared with `@Bean @ConditionalOnMissingBean`. During ApplicationContext refresh, user configuration classes are processed in Phase 1 via `ConfigurationClassPostProcessor`. If the user declared an `ObjectMapper` bean, its `BeanDefinition` is entered into the `DefaultListableBeanFactory`. When Phase 2 runs (`DeferredImportSelector` executing auto-configurations), `OnBeanCondition` queries the registry. Because a bean of type `ObjectMapper` is already registered, the condition evaluates to `ConditionOutcome.noMatch()`. The auto-configured bean method is skipped cleanly without error.",
        "complexPart": "Back-off by type vs by name: `@ConditionalOnMissingBean` defaults to checking the return type of the `@Bean` method. If you define a custom bean returning a subtype (e.g. `CustomObjectMapper extends ObjectMapper`), `@ConditionalOnMissingBean(ObjectMapper.class)` correctly backs off. However, if an auto-configuration checks by NAME (`@ConditionalOnMissingBean(name = \"redisTemplate\")`), declaring a bean with a different method name (`myRedisTemplate()`) will FAILS to back off, causing TWO conflicting RedisTemplate beans in the context!",
        "keyPoints": [
            "Non-Invasive Architecture: Spring Boot auto-configurations are designed to never fight user-declared beans.",
            "@ConditionalOnMissingBean: The primary weapon of back-off behavior, checking type and name in BeanDefinitionRegistry.",
            "Deferred Processing: Back-off works because auto-configuration runs in DeferredImportSelector, AFTER user beans exist in the registry.",
            "Subtype Recognition: ConditionEvaluator correctly matches subclasses and implementing interfaces.",
            "Condition Evaluation Report: Run with `--debug` to view the exact list of auto-configured beans that backed off."
        ],
        "codeSnippet": "// Spring Boot's internal JacksonAutoConfiguration:\n@AutoConfiguration\n@ConditionalOnClass(ObjectMapper.class)\npublic class JacksonAutoConfiguration {\n    @Bean\n    @Primary\n    @ConditionalOnMissingBean // BACK-OFF HOOK!\n    public ObjectMapper jacksonObjectMapper(Jackson2ObjectMapperBuilder builder) {\n        return builder.createXmlMapper(false).build();\n    }\n}\n\n// User application code:\n@Configuration\npublic class MyConfig {\n    @Bean\n    public ObjectMapper objectMapper() {\n        // Spring Boot's jacksonObjectMapper silently backs off!\n        return new ObjectMapper().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);\n    }\n}",
        "pitfall": "Assuming `@ConditionalOnMissingBean` checks bean instances. It checks `BeanDefinition` metadata; it works even before beans are actually instantiated.",
        "interviewTip": "Explain that back-off behavior is powered by the combination of `@ConditionalOnMissingBean` and `DeferredImportSelector`, ensuring user configurations are always registered first so auto-configurations can safely step aside."
    },

    # -------------------------------------------------------------------------
    # Topic 26: BeanPostProcessor
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-beanpostprocessor",
        "title": "BeanPostProcessor Internal Interception & Extension Points",
        "category": "Core IoC & Proxies",
        "badge": "IoC Extension Engine",
        "oneLiner": "The supreme Spring extension point intercepting every bean before and after initialization.",
        "whatIsIt": "BeanPostProcessor (BPP) is the most powerful extension point in the Spring Framework. It allows custom inspection, modification, property injection, validation, and proxy wrapping of every bean instance created by the Spring container.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: BeanPostProcessor Execution Bracket</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Raw Instance</span>
                <span class="node-desc">new OrderService()</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">BPP: BeforeInit</span>
                <span class="node-desc">@PostConstruct, @Autowired</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">InitializingBean</span>
                <span class="node-desc">afterPropertiesSet() runs</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">BPP: AfterInit</span>
                <span class="node-desc">AOP Proxy wrapping occurs!</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">Final Bean In Cache</span>
                <span class="node-desc">Proxy returned to container</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ec4899; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> <strong>Proxy Substitution:</strong> postProcessAfterInitialization can return a completely different object (a CGLIB proxy) than what was passed in!
            </div>
          </div>
        """,
        "internalWorking": "Inside `AbstractAutowireCapableBeanFactory.initializeBean()`: (1) `applyBeanPostProcessorsBeforeInitialization(existingBean, beanName)`: Loops through all registered BPPs calling `postProcessBeforeInitialization()`. For example, `CommonAnnotationBeanPostProcessor` invokes `@PostConstruct`. (2) `invokeInitMethods(bean)`: Executes `InitializingBean.afterPropertiesSet()` and `@Bean(initMethod)`. (3) `applyBeanPostProcessorsAfterInitialization(existingBean, beanName)`: Loops through BPPs calling `postProcessAfterInitialization()`. Here, `AbstractAutoProxyCreator` checks if the bean has `@Transactional`, `@Async`, or AspectJ pointcuts. If so, it creates a CGLIB or JDK Dynamic Proxy, substituting the raw instance with the proxy wrapper! (4) Returns the proxy object to be stored in the singleton cache.",
        "complexPart": "Premature Instantiation Hazard: BeanPostProcessor beans MUST be instantiated very early during context refresh (Step 6 of `refresh()`). If your custom BPP depends on or autowires a regular service bean (e.g. `@Autowired private UserService userService;`), Spring is forced to instantiate `UserService` prematurely to inject it into the BPP. Because `UserService` is instantiated before BPP registration is complete, `UserService` itself CANNOT be processed by other BPPs (like AOP proxying or validation), breaking its transactional annotations!",
        "keyPoints": [
            "Two Interception Hooks: `postProcessBeforeInitialization` (pre-init) and `postProcessAfterInitialization` (post-init).",
            "AOP Proxy Mechanism: All Spring AOP proxies are created inside `postProcessAfterInitialization` by `AbstractAutoProxyCreator`.",
            "Autowired Annotation: `@Autowired` and `@Value` field injections are handled by `AutowiredAnnotationBeanPostProcessor`.",
            "Return Value Substitution: A BPP can return the original bean, a wrapped proxy, or even `null` to suppress bean creation.",
            "Ordering: Implement `Ordered` or `@Order` to control the sequence of BPP execution chains."
        ],
        "codeSnippet": "@Component\npublic class CustomValidationPostProcessor implements BeanPostProcessor {\n    @Override\n    public Object postProcessBeforeInitialization(Object bean, String beanName) {\n        // Inspect or mutate raw bean before @PostConstruct\n        return bean;\n    }\n\n    @Override\n    public Object postProcessAfterInitialization(Object bean, String beanName) {\n        // Wrap target bean in custom dynamic proxy if annotated:\n        if (bean.getClass().isAnnotationPresent(AuditLogged.class)) {\n            return Proxy.newProxyInstance(\n                bean.getClass().getClassLoader(),\n                bean.getClass().getInterfaces(),\n                new AuditInvocationHandler(bean)\n            );\n        }\n        return bean; // Return original if no proxy needed\n    }\n}",
        "pitfall": "Autowiring standard application service beans inside a BeanPostProcessor. This causes premature initialization warnings in logs and prevents the autowired service from receiving AOP transaction proxies.",
        "interviewTip": "Remember: `postProcessBeforeInitialization` runs BEFORE `@PostConstruct`/`afterPropertiesSet()`, while `postProcessAfterInitialization` runs AFTER and is where Spring AOP wraps the raw bean in a proxy."
    },

    # -------------------------------------------------------------------------
    # Topic 27: Environment Abstraction
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-environment-abstraction",
        "title": "Spring Environment Abstraction & MutablePropertySources",
        "category": "Configuration & Properties",
        "badge": "Core Architecture",
        "oneLiner": "The unified facade managing profiles and property resolution across all backing stores.",
        "whatIsIt": "The Spring `Environment` is a core architectural abstraction that represents the environment in which the current application is running. It models two distinct aspects of the application runtime: (1) Profiles (which beans are active), and (2) Properties (resolving values from configuration files, OS env, CLI, JNDI).",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Environment & MutablePropertySources Architecture</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">StandardServletEnvironment</span>
                <span class="node-desc">Central Facade Interface</span>
              </div>
              <span class="flow-arrow-separator">──Maintains──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">MutablePropertySources</span>
                <span class="node-desc">CopyOnWriteArrayList of Sources</span>
              </div>
              <span class="flow-arrow-separator">──Searches First-Match──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">PropertyResolver</span>
                <span class="node-desc">Resolves ${app.timeout:5000}</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Composite Resolution:</strong> Supports recursive placeholder expansion like ${app.base-dir}/${app.filename}!
            </div>
          </div>
        """,
        "internalWorking": "Inside `StandardEnvironment`: Maintains an internal `MutablePropertySources` collection which wraps a `CopyOnWriteArrayList<PropertySource<?>>`. When code invokes `environment.getProperty(\"app.timeout\")`: (1) Iterates sequentially through property sources in priority order. (2) Each `PropertySource` queries its underlying store (e.g. `MapPropertySource`, `SystemEnvironmentPropertySource`). (3) Returns the first non-null match. (4) Passes the raw value through `PropertySourcesPropertyResolver` to recursively resolve nested placeholders: `${app.root}/${app.dir}`. (5) If a target type is requested (`getProperty(\"timeout\", Integer.class)`), uses `DefaultConversionService` to convert strings to numbers, booleans, or durations.",
        "complexPart": "EnvironmentPostProcessor Extension: Spring Boot allows mutating the Environment before the ApplicationContext even exists. Implementing `EnvironmentPostProcessor` (registered in `META-INF/spring.factories`) allows intercepting the `ConfigurableEnvironment` to decrypt secrets (e.g. HashiCorp Vault), inject dynamic AWS credentials, or re-order property sources before any bean definitions are loaded.",
        "keyPoints": [
            "Two Core Responsibilities: Profiles management (`getActiveProfiles()`) and Property resolution (`getProperty()`).",
            "MutablePropertySources: Priority-ordered list where sources can be added first (`addFirst`), last (`addLast`), or before/after specific sources.",
            "Placeholder Resolution: Automatically evaluates recursive `${...}` expressions with support for default fallback values: `${key:defaultValue}`.",
            "ConversionService Integration: Coerces raw string values into typed objects, enums, dates, and `java.time.Duration` instances.",
            "EnvironmentPostProcessor: SPI allowing developers to customize property sources before ApplicationContext creation."
        ],
        "codeSnippet": "// Custom EnvironmentPostProcessor to inject dynamic secret at boot:\npublic class VaultSecretEnvironmentPostProcessor implements EnvironmentPostProcessor {\n    @Override\n    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {\n        Map<String, Object> secrets = fetchSecretsFromVault();\n        // Add as HIGHEST priority source:\n        environment.getPropertySources().addFirst(\n            new MapPropertySource(\"vaultSecrets\", secrets)\n        );\n    }\n}",
        "pitfall": "Assuming `@Autowired Environment env` can be mutated safely in regular beans. By the time beans are created, property resolution order is fixed; use `EnvironmentPostProcessor` for dynamic injection.",
        "interviewTip": "Emphasize that the Environment combines two key abstractions: Profiles and Properties, and that property lookup stops at the FIRST matching PropertySource in the priority-ordered `MutablePropertySources` list."
    },

    # -------------------------------------------------------------------------
    # Topic 28: Property Binding (@ConfigurationProperties)
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-configurationproperties-binding",
        "title": "@ConfigurationProperties & ConfigurationPropertiesBindingPostProcessor",
        "category": "Configuration & Properties",
        "badge": "Type-Safe Binding",
        "oneLiner": "The Binder API that binds hierarchical external configuration into strongly typed Java beans or Records.",
        "whatIsIt": "@ConfigurationProperties provides type-safe, validated, and structured hierarchical binding of configuration properties into strongly typed Java classes or immutable Java Records, eliminating error-prone individual `@Value` annotations.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: ConfigurationProperties Binding Engine</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">External Configuration</span>
                <span class="node-desc">app.security.jwt.ttl=30s</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">ConfigurationProperties BPP</span>
                <span class="node-desc">Discovers @ConfigurationProperties</span>
              </div>
              <span class="flow-arrow-separator">──Invokes──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Binder Engine</span>
                <span class="node-desc">Relaxed binding & ConversionService</span>
              </div>
              <span class="flow-arrow-separator">──Validates──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Validated Config Bean</span>
                <span class="node-desc">Injected into services</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>🛡️</span> <strong>Immutable Records:</strong> Supports modern Java Records using constructor binding without getters or setters!
            </div>
          </div>
        """,
        "internalWorking": "Inside `ConfigurationPropertiesBindingPostProcessor`: When a bean is annotated with `@ConfigurationProperties(prefix = \"app\")`: (1) Invokes `ConfigurationPropertiesBinder`. (2) Obtains the `Binder` instance from the `Environment`. (3) Resolves the target `Bindable<T>`. (4) Performs Relaxed Binding: normalizes dashes, underscores, and camelCase. (5) Leverages `ApplicationConversionService` to convert complex types (e.g., `30s` into `Duration.ofSeconds(30)`, `10MB` into `DataSize.ofMegabytes(10)`). (6) If annotated with `@Validated`, runs JSR-380 Validator (Hibernate Validator); if validation fails, throws `ConfigurationPropertiesBindException` and aborts boot with a human-readable diagnosis.",
        "complexPart": "Constructor Binding vs JavaBean Setter Binding: Historically, `@ConfigurationProperties` required mutable classes with no-arg constructors and public getters/setters. In modern Spring Boot, `@ConfigurationProperties` natively supports **Constructor Binding** (and Java Records!). If the class has a single parameterized constructor (or is a Record), the Binder maps properties directly to constructor arguments, creating completely immutable configuration objects with compile-time safety.",
        "keyPoints": [
            "ConfigurationPropertiesBindingPostProcessor: The BeanPostProcessor responsible for orchestrating binding during bean initialization.",
            "Type-Safe Conversion: Automatically converts human-friendly strings like `500ms`, `2h`, `50MB` to `Duration` and `DataSize`.",
            "Immutable Records: First-class support for Java Records via constructor binding without setters.",
            "Validation: Pair with `@Validated` and JSR-380 annotations (`@NotNull`, `@Min`) to fail-fast on startup if misconfigured.",
            "IDE Auto-Completion: Compiling with `spring-boot-configuration-processor` generates `META-INF/spring-configuration-metadata.json` for IDE autocomplete."
        ],
        "codeSnippet": "// Modern Immutable Configuration Properties Record:\n@ConfigurationProperties(prefix = \"app.security\")\n@Validated\npublic record SecurityProperties(\n    @NotBlank String jwtSecret,\n    @DurationMin(seconds = 60) Duration tokenTtl,\n    @DataSizeMax(megabytes = 10) DataSize maxUploadSize,\n    List<String> allowedOrigins\n) {}\n\n// Activating in Configuration:\n@Configuration\n@EnableConfigurationProperties(SecurityProperties.class)\npublic class SecurityConfig {\n    // Inject SecurityProperties directly!\n}",
        "pitfall": "Forgetting getters/setters on standard classes when not using constructor binding. The Binder silently fails to inject values into private fields without public setters or constructors.",
        "interviewTip": "Highlight the advantages over `@Value`: Type-safe hierarchical mapping, support for immutable Java Records, automated `Duration`/`DataSize` conversion, relaxed binding, and compile-time validation via `@Validated`."
    },

    # -------------------------------------------------------------------------
    # Topic 29: Spring Boot Test Slices
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-test-slices",
        "title": "Spring Boot Test Slices (@SpringBootTest vs Slices)",
        "category": "Web, Server & Observability",
        "badge": "Testing Architecture",
        "oneLiner": "Targeted slice annotations that boot only a fraction of the IoC container for high-speed testing.",
        "whatIsIt": "Spring Boot Test Slices are specialized testing annotations (`@WebMvcTest`, `@DataJpaTest`, `@JsonTest`, `@DataMongoTest`) that selectively configure and bootstrap only a specific slice of the Spring IoC container, executing isolated component tests in milliseconds rather than loading the entire application.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Test Slice Container Filtering</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">@SpringBootTest</span>
                <span class="node-desc">Boots 100% of Context (Slow)</span>
                <span style="font-size: 0.65rem; color: #93c5fd;">All @Services, @Repos, Kafka, Security</span>
              </div>
              <span class="flow-arrow-separator">──VS──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">@WebMvcTest</span>
                <span class="node-desc">Boots Web Layer Only (Fast!)</span>
                <span style="font-size: 0.65rem; color: #86efac;">DispatcherServlet, Controllers, MockMvc</span>
              </div>
              <span class="flow-arrow-separator">──VS──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">@DataJpaTest</span>
                <span class="node-desc">Boots Persistence Only (Fast!)</span>
                <span style="font-size: 0.65rem; color: #fdba74;">Entities, Repositories, Embedded H2</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>10x Test Speedup:</strong> @WebMvcTest skips database, cache, and message broker initialization completely!
            </div>
          </div>
        """,
        "internalWorking": "How a slice works under the hood: `@WebMvcTest` is meta-annotated with `@TypeExcludeFilters(WebMvcTypeExcludeFilter.class)` and `@AutoConfigureCache`, `@AutoConfigureWebMvc`, `@AutoConfigureMockMvc`. (1) `WebMvcTypeExcludeFilter` excludes all classes annotated with `@Service`, `@Repository`, `@Component`, and general `@Configuration` during component scanning. (2) Only `@Controller`, `@ControllerAdvice`, and `WebMvcConfigurer` beans are included. (3) `ServletWebServerFactoryAutoConfiguration` is skipped (no Tomcat startup). (4) `MockMvc` is configured and injected. (5) Collaborating services are mocked using `@MockBean` (or `@MockitoBean` in Spring Boot 3.4+).",
        "complexPart": "Spring Test Context Caching & DirtyContext: The Spring Test framework caches `ApplicationContext` instances between test classes across a test run. If TestClassA and TestClassB use the exact same test configuration, the context is created ONCE and reused. However, using `@MockBean` creates a unique configuration footprint! If TestClassA mocks `UserService` and TestClassB mocks `PaymentService`, Spring CANNOT share the cache; it must boot a separate ApplicationContext for each, causing test suite execution times to balloon.",
        "keyPoints": [
            "@SpringBootTest: Loads the complete application context; ideal for end-to-end integration testing.",
            "@WebMvcTest: Slices the web layer; disables Tomcat, auto-configures MockMvc, excludes @Service and @Repository.",
            "@DataJpaTest: Slices JPA/Hibernate; configures an in-memory database (H2), enables SQL logging, rolls back after each test.",
            "TypeExcludeFilters: The internal mechanism that strips unrelated beans from the component scan.",
            "Context Caching: Spring caches test contexts; excessive variance in `@MockBean` destroys test suite performance."
        ],
        "codeSnippet": "@WebMvcTest(OrderController.class)\nclass OrderControllerTest {\n    @Autowired\n    private MockMvc mockMvc;\n    \n    // In Spring Boot 3.4+, use @MockitoBean instead of legacy @MockBean\n    @MockBean\n    private OrderService orderService;\n    \n    @Test\n    void shouldReturnOrder() throws Exception {\n        when(orderService.getOrder(1L)).thenReturn(new OrderResponse(1L, \"CONFIRMED\"));\n        \n        mockMvc.perform(get(\"/orders/1\"))\n               .andExpect(status().isOk())\n               .andExpect(jsonPath(\"$.status\").value(\"CONFIRMED\"));\n    }\n}",
        "pitfall": "Attempting to inject a `@Repository` inside a `@WebMvcTest`. It will fail with `NoSuchBeanDefinitionException` because `@DataJpa` repositories are excluded by `WebMvcTypeExcludeFilter`.",
        "interviewTip": "Explain how `@TypeExcludeFilter` restricts component scanning to specific architectural layers, and mention how Spring Test Context Caching optimizes test execution across multiple test classes."
    }
]
