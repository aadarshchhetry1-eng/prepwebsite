"""
Spring Boot Internals - Module 1 (Topics 1 to 10)
Bootstrap, Auto-Configuration, Startup Flow & Embedded Server
"""

TOPICS_PART1 = [
    # -------------------------------------------------------------------------
    # Topic 1: @SpringBootApplication
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-springbootapplication",
        "title": "@SpringBootApplication Composition & Meta-Annotations",
        "category": "Bootstrap & Core Engine",
        "badge": "Core Meta-Annotation",
        "oneLiner": "The 3-in-1 meta-annotation bundling @SpringBootConfiguration, @EnableAutoConfiguration, and @ComponentScan.",
        "whatIsIt": "@SpringBootApplication is an umbrella meta-annotation that marks the primary entry point of a Spring Boot service. Rather than requiring developers to manually configure context scanning, Java configuration declarations, and opinionated starter bean synthesis, it bundles three foundational annotations into a single declaration.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: @SpringBootApplication Composition</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 170px;">
                <span class="node-label">@SpringBootApplication</span>
                <span class="node-desc">Target Class on Root Pkg</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">@SpringBootConfiguration</span>
                <span class="node-desc">Extends @Configuration (CGLIB Full)</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-green">
                <span class="node-label">@EnableAutoConfiguration</span>
                <span class="node-desc">Imports AutoConfig classes</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">@ComponentScan</span>
                <span class="node-desc">Recursive scan from package</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Key Invariant:</strong> Placing this annotation in a sub-package hides sibling packages from component scan!
            </div>
          </div>
        """,
        "internalWorking": "When SpringApplication boots, ConfigurationClassPostProcessor parses the main class: (1) @SpringBootConfiguration: Specializes @Configuration, telling Spring this class is a Java configuration class. Crucially, it enables proxyBeanMethods=true, wrapping the class in a CGLIB subclass to intercept @Bean calls for singleton preservation. (2) @EnableAutoConfiguration: Imports AutoConfigurationImportSelector via @Import. This selector reads configuration candidate classes from META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports (in Spring Boot 3+) or META-INF/spring.factories (Boot 2). (3) @ComponentScan: Configures ClassPathBeanDefinitionScanner with TypeFilter heuristics, scanning the declared package and all sub-packages for @Component, @Service, @Repository, @Controller.",
        "complexPart": "The package placement pitfall: Because @ComponentScan default basePackage is the package of the annotated class, placing the @SpringBootApplication class inside a sub-package (e.g., com.example.app.controller) causes Spring to completely miss beans located in sibling packages (com.example.app.service, com.example.app.repository). Also, proxyBeanMethods defaults to true in @SpringBootConfiguration, meaning the class itself undergoes CGLIB bytecode generation; setting proxyBeanMethods=false disables proxying for faster startup and native image compatibility (AOT).",
        "keyPoints": [
            "@SpringBootConfiguration: A specialized @Configuration allowing auto-detection of configuration classes by Spring test runners.",
            "@EnableAutoConfiguration: Enables opinionated bean synthesis via AutoConfigurationImportSelector and DeferredImportSelector.",
            "@ComponentScan: Recursively scans packages from the annotated class's package downwards, applying standard exclude filters (e.g. TypeFilter for AutoConfiguration).",
            "proxyBeanMethods=true: Generates a CGLIB proxy so direct calls to @Bean methods return singleton instances rather than new instances.",
            "Selective exclusions: Allows excluding specific auto-configurations directly: @SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})."
        ],
        "codeSnippet": "@SpringBootApplication(\n    scanBasePackages = \"com.example.app\", // Override default scan root\n    exclude = { DataSourceAutoConfiguration.class }, // Disable specific auto-config\n    proxyBeanMethods = true // CGLIB proxying enabled by default\n)\npublic class Application {\n    public static void main(String[] args) {\n        SpringApplication.run(Application.class, args);\n    }\n}",
        "pitfall": "Placing the Application class in default package (root without package declaration). This causes Spring to attempt scanning every single jar on the entire classpath, leading to startup stalls or scanning third-party dependencies as beans.",
        "interviewTip": "Highlight that @SpringBootApplication is a meta-annotation composed of 3 core annotations: @SpringBootConfiguration, @EnableAutoConfiguration, and @ComponentScan. Emphasize that @EnableAutoConfiguration uses DeferredImportSelector to ensure user beans are evaluated before auto-configuration beans."
    },

    # -------------------------------------------------------------------------
    # Topic 2: Auto-Configuration
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-autoconfiguration",
        "title": "Auto-Configuration Internal Engine & Evaluation Order",
        "category": "Bootstrap & Core Engine",
        "badge": "Core Engine",
        "oneLiner": "How Spring Boot synthesizes infrastructure beans based on classpath artifacts and environment properties.",
        "whatIsIt": "Auto-Configuration is Spring Boot's opinionated convention-over-configuration engine. It inspects what libraries exist on the application classpath (e.g., H2, HikariCP, Jackson), what configuration properties are set, and what beans developers have already declared, automatically instantiating and wiring all necessary infrastructure beans without boilerplate XML or manual Java configurations.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Auto-Configuration Two-Stage Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Phase 1: User Beans</span>
                <span class="node-desc">@ComponentScan runs first</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">DeferredImportSelector</span>
                <span class="node-desc">Collects candidate auto-configs</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Condition Evaluation</span>
                <span class="node-desc">@ConditionalOnClass, MissingBean</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Phase 2: Auto-Config Beans</span>
                <span class="node-desc">Only missing beans instantiated</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Golden Rule:</strong> User-defined beans ALWAYS win because auto-configuration runs second via DeferredImportSelector.
            </div>
          </div>
        """,
        "internalWorking": "Auto-configuration executes in two distinct phases: Phase 1 evaluates user configuration classes registered via @ComponentScan and explicit @Configuration classes. Phase 2 processes auto-configuration classes loaded via AutoConfigurationImportSelector, which implements DeferredImportSelector. Because it is 'deferred', its evaluation is postponed until all user-defined bean definitions have been fully registered into the BeanDefinitionRegistry. The engine then passes each candidate through ConditionEvaluator, running ASM-based bytecode checks on @Conditional annotations. Only classes whose conditions pass are parsed and added to the registry.",
        "complexPart": "Why DeferredImportSelector is mandatory: If auto-configuration ran at the same time as standard @ComponentScan, conditions like @ConditionalOnMissingBean(DataSource.class) would check an empty registry before the user's custom DataSource bean is discovered, incorrectly instantiating the auto-configured DataSource and triggering ConflictingBeanDefinitionException or dual connection pools. DeferredImportSelector guarantees user definitions take precedence.",
        "keyPoints": [
            "Deferred Execution: Implements DeferredImportSelector to ensure all user beans are registered before auto-configurations are evaluated.",
            "Condition Filtering: Uses OnClassCondition, OnBeanCondition, and OnPropertyCondition to evaluate eligibility before class loading.",
            "Ordering: Auto-configurations are ordered using @AutoConfigureOrder, @AutoConfigureBefore, and @AutoConfigureAfter.",
            "Condition Evaluation Report: Generated at startup; inspectable by running with --debug flag or accessing /actuator/conditions.",
            "Back-off Mechanism: Infrastructure beans use @ConditionalOnMissingBean, automatically stepping aside when user beans exist."
        ],
        "codeSnippet": "@AutoConfiguration\n@ConditionalOnClass(DataSource.class)\n@EnableConfigurationProperties(DataSourceProperties.class)\n@AutoConfigureBefore(HibernateJpaAutoConfiguration.class)\npublic class DataSourceAutoConfiguration {\n    @Bean\n    @ConditionalOnMissingBean\n    public DataSource dataSource(DataSourceProperties properties) {\n        return properties.initializeDataSourceBuilder().build();\n    }\n}",
        "pitfall": "Attempting to control auto-configuration evaluation order using @Order. @Order does NOT work on @AutoConfiguration classes; you must use @AutoConfigureBefore, @AutoConfigureAfter, or @AutoConfigureOrder.",
        "interviewTip": "Emphasize that auto-configuration is NOT magic; it is simply standard Spring @Configuration classes processed by a DeferredImportSelector that tests @Conditional predicates against the BeanDefinitionRegistry."
    },

    # -------------------------------------------------------------------------
    # Topic 3: META-INF/spring.factories / AutoConfiguration.imports
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-spring-factories",
        "title": "META-INF/spring.factories vs AutoConfiguration.imports",
        "category": "Bootstrap & Core Engine",
        "badge": "SPI Discovery",
        "oneLiner": "The SPI service loader mechanism for locating auto-configuration candidates across JARs.",
        "whatIsIt": "Spring Boot discovers external auto-configuration classes across all dependencies using an SPI (Service Provider Interface) registry file. In Spring Boot 1.x and 2.x, this was stored in META-INF/spring.factories. In Spring Boot 3.x, auto-configuration classes were migrated to META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports for performance and clarity.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Auto-Configuration SPI Discovery Migration</div>
            <div class="flow-chain">
              <div class="flow-step-node node-red">
                <span class="node-label">Spring Boot 2.x</span>
                <span class="node-desc">META-INF/spring.factories</span>
                <span style="font-size: 0.65rem; color: #fca5a5;">Key-Value Properties file</span>
              </div>
              <span class="flow-arrow-separator">──Migrated (Boot 3)──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Spring Boot 3.x</span>
                <span class="node-desc">AutoConfiguration.imports</span>
                <span style="font-size: 0.65rem; color: #86efac;">Plain class list (1 per line)</span>
              </div>
              <span class="flow-arrow-separator">──Loaded By──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">ImportCandidates.load()</span>
                <span class="node-desc">Classloader resource scan</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> <strong>Migration Trap:</strong> Custom starters declaring auto-configurations in spring.factories fail silently in Spring Boot 3!
            </div>
          </div>
        """,
        "internalWorking": "In Spring Boot 2.x, SpringFactoriesLoader.loadFactoryNames() used ClassLoader.getResources('META-INF/spring.factories') to read Java Properties files, looking for keys matching EnableAutoConfiguration.class. In Spring Boot 3.x, ImportCandidates.load(AutoConfiguration.class, classLoader) searches specifically for 'META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports'. This is a plain newline-delimited text file containing fully qualified class names. It bypasses the slower Properties parser and decouples auto-configuration from general factory hooks like ApplicationListener and EnvironmentPostProcessor.",
        "complexPart": "The silent migration failure: When upgrading from Spring Boot 2 to Spring Boot 3, custom internal starters or libraries that declare custom auto-configurations inside META-INF/spring.factories under org.springframework.boot.autoconfigure.EnableAutoConfiguration will be completely IGNORED by Spring Boot 3 with zero warnings. The custom beans simply will not load. Note that other SPI interfaces (e.g. ApplicationListener, EnvironmentPostProcessor) still use META-INF/spring.factories in Boot 3.",
        "keyPoints": [
            "Spring Boot 2.x: Used META-INF/spring.factories with EnableAutoConfiguration key parsed via SpringFactoriesLoader.",
            "Spring Boot 3.x: Uses META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports parsed via ImportCandidates.",
            "Format difference: spring.factories was a key-value properties file; AutoConfiguration.imports is a clean, line-separated text file.",
            "Separation of concerns: spring.factories still handles EnvironmentPostProcessor, FailureAnalyzer, and ApplicationContextInitializer in Boot 3.",
            "AOT / Native Image: Plain imports files drastically improve GraalVM native image compilation and build-time reflection scanning."
        ],
        "codeSnippet": "# Spring Boot 3.x file location:\n# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\ncom.example.autoconfigure.CustomSecurityAutoConfiguration\ncom.example.autoconfigure.CustomMetricsAutoConfiguration\ncom.example.autoconfigure.CustomDatabaseAutoConfiguration\n\n# Spring Boot 2.x legacy file location:\n# META-INF/spring.factories\n# org.springframework.boot.autoconfigure.EnableAutoConfiguration=\\\n#   com.example.autoconfigure.CustomSecurityAutoConfiguration",
        "pitfall": "Assuming spring.factories is completely deleted in Spring Boot 3. Only auto-configuration imports moved; EnvironmentPostProcessors and ApplicationListeners still reside in spring.factories.",
        "interviewTip": "Distinguish between Spring Boot 2 (spring.factories via SpringFactoriesLoader) and Spring Boot 3 (AutoConfiguration.imports via ImportCandidates.load()). Mention that the change improves startup performance and GraalVM AOT native compilation."
    },

    # -------------------------------------------------------------------------
    # Topic 4: Conditional Annotations
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-conditional-annotations",
        "title": "Conditional Annotations Mechanics (@ConditionalOnClass, MissingBean)",
        "category": "Bootstrap & Core Engine",
        "badge": "Bytecode Pre-flight",
        "oneLiner": "ASM bytecode inspection and registry querying that prevents NoClassDefFoundError during condition checks.",
        "whatIsIt": "Conditional annotations are Spring Boot's gatekeepers that control whether a configuration class or bean definition should be registered into the IoC container. They test conditions like class presence on classpath, existing bean registrations, configuration property values, or resource availability.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: ASM-Based Condition Evaluation</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">ConditionEvaluator</span>
                <span class="node-desc">Inspects @Conditional</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">ASM ClassReader</span>
                <span class="node-desc">Reads bytecode directly!</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Condition Outcome</span>
                <span class="node-desc">match() or noMatch()</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Registry Registration</span>
                <span class="node-desc">Bean registered if passed</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ec4899; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> <strong>Deep Bytecode Trick:</strong> Uses ASM to check class presence as strings to avoid triggering NoClassDefFoundError!
            </div>
          </div>
        """,
        "internalWorking": "Spring Boot uses ConditionEvaluator inside ConfigurationClassParser. When an auto-configuration class is evaluated, Spring does NOT load the referenced class with the ClassLoader immediately. Instead, OnClassCondition uses ASM (Spring's repackaged org.springframework.asm) to read raw class bytecode as streams. If the class named in @ConditionalOnClass is not found on classpath, ASM skips parsing that class. This prevents the JVM from throwing java.lang.NoClassDefFoundError. For @ConditionalOnMissingBean, OnBeanCondition queries the BeanDefinitionRegistry for matching bean names or assignable types.",
        "complexPart": "Configuration Phase matters: @ConditionalOnBean and @ConditionalOnMissingBean are sensitive to the phase in which they execute. When placed on user @Configuration classes, they only check beans that were processed BEFORE that class in bean definition ordering. If UserConfigA has @ConditionalOnBean(ServiceB.class), but UserConfigB declares ServiceB and is parsed second, the condition returns false! Hence, @ConditionalOnMissingBean should generally be reserved for auto-configurations that run during DeferredImportSelector.",
        "keyPoints": [
            "@ConditionalOnClass: Checks if specific classes are loadable without causing JVM ClassNotFoundException (via ASM).",
            "@ConditionalOnMissingBean: Checks BeanDefinitionRegistry and parent bean factories; skips registration if a bean matching type/name exists.",
            "@ConditionalOnProperty: Inspects Spring Environment properties with support for havingValue, matchIfMissing, and prefix.",
            "@ConditionalOnWebApplication: Verifies if the context is a SERVLET (blocking) or REACTIVE (webflux) application context.",
            "SpringBootCondition: Base class providing standardized ConditionOutcome with detailed human-readable match/mismatch reasons."
        ],
        "codeSnippet": "@Configuration\n@ConditionalOnClass(name = \"com.mongodb.client.MongoClient\") // String avoids compile dependency\npublic class MongoAutoConfiguration {\n    \n    @Bean\n    @ConditionalOnMissingBean\n    @ConditionalOnProperty(prefix = \"spring.data.mongodb\", name = \"uri\")\n    public MongoClient mongoClient(MongoProperties properties) {\n        return MongoClients.create(properties.getUri());\n    }\n}",
        "pitfall": "Placing @ConditionalOnBean on user @Configuration beans. Because user configuration classes are processed in arbitrary classpath order, condition results depend on JVM class discovery ordering and become flaky.",
        "interviewTip": "Explain that Spring evaluates @ConditionalOnClass safely using ASM bytecode inspection so that the JVM never attempts to load missing classes into memory, preventing NoClassDefFoundError."
    },

    # -------------------------------------------------------------------------
    # Topic 5: Starter Dependencies
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-starter-dependencies",
        "title": "Starter Dependencies Architecture & Transitive Resolution",
        "category": "Auto-Config & Dependencies",
        "badge": "Packaging Architecture",
        "oneLiner": "Curated descriptor POMs that package transitive libraries, matching auto-config jars, and sensible defaults.",
        "whatIsIt": "Spring Boot Starters are dependency descriptors (POM or Gradle modules) containing zero Java code. Their sole purpose is to aggregate all related transitive libraries, third-party frameworks, and official auto-configure modules into a single cohesive dependency with guaranteed version compatibility.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Starter Dependency Decomposition</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple">
                <span class="node-label">spring-boot-starter-web</span>
                <span class="node-desc">Empty Descriptor POM (0 code)</span>
              </div>
              <span class="flow-arrow-separator">──Pulls In──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">spring-boot-starter</span>
                <span class="node-desc">Core, Logging (Logback), YAML</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-green">
                <span class="node-label">starter-tomcat</span>
                <span class="node-desc">Embedded Tomcat core & websocket</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">spring-webmvc</span>
                <span class="node-desc">DispatcherServlet, Jackson</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #a78bfa; display: flex; align-items: center; gap: 6px;">
              <span>📦</span> <strong>Naming Rule:</strong> Official starters use spring-boot-starter-*, custom community starters must use *-spring-boot-starter!
            </div>
          </div>
        """,
        "internalWorking": "When you declare a dependency on `spring-boot-starter-web`, Maven/Gradle resolves an empty artifact whose POM lists dependencies: `spring-boot-starter`, `spring-boot-starter-json` (Jackson Databind), `spring-boot-starter-tomcat` (embedded servlet engine), and `spring-webmvc`. The presence of these classes on the runtime classpath triggers @ConditionalOnClass checks in `DispatcherServletAutoConfiguration`, `ServletWebServerFactoryAutoConfiguration`, and `JacksonAutoConfiguration`. Thus, adding one dependency activates dozens of conditional auto-configurations automatically.",
        "complexPart": "Exclusion and replacement mechanics: To replace embedded Tomcat with Undertow or Jetty, you must explicitly exclude `spring-boot-starter-tomcat` from `spring-boot-starter-web` and add `spring-boot-starter-undertow`. If Tomcat is not excluded, both servlet containers exist on classpath, causing `ServletWebServerFactoryAutoConfiguration` to encounter conflicting container factories or default to Tomcat because Tomcat condition checks execute first.",
        "keyPoints": [
            "Empty Descriptor: Starters contain no Java classes or bytecodes; they are pure dependency aggregators.",
            "Naming Conventions: Official starters follow `spring-boot-starter-{name}`; custom/third-party starters must follow `{name}-spring-boot-starter`.",
            "Separation of Autoconfigure: A complete custom starter consists of two modules: `foo-spring-boot-autoconfigure` (the code) and `foo-spring-boot-starter` (the POM that pulls it).",
            "Logging Defaults: `spring-boot-starter` transitively includes `spring-boot-starter-logging` (SLF4J + Logback), auto-excluding java.util.logging and commons-logging via bridges.",
            "Validation: `spring-boot-starter-validation` pulls in Hibernate Validator and automatically configures MethodValidationPostProcessor."
        ],
        "codeSnippet": "<!-- Swapping Embedded Tomcat for Undertow -->\n<dependency>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-web</artifactId>\n    <exclusions>\n        <exclusion>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-tomcat</artifactId>\n        </exclusion>\n    </exclusions>\n</dependency>\n<dependency>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-undertow</artifactId>\n</dependency>",
        "pitfall": "Forgetting that third-party starters should never begin with `spring-boot-starter-`. The Spring Boot team reserves this namespace to prevent collision with future official modules.",
        "interviewTip": "Clarify that starters contain no compiled code—they are curated dependency aggregates that place specific libraries on the classpath to trigger matching @Conditional auto-configurations."
    },

    # -------------------------------------------------------------------------
    # Topic 6: Spring Boot BOM / Dependency Management
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-bom-dependency-management",
        "title": "Spring Boot BOM & Dependency Management Internals",
        "category": "Auto-Config & Dependencies",
        "badge": "Build Governance",
        "oneLiner": "Bill of Materials (BOM) resolving version matrix conflicts without explicit version tags.",
        "whatIsIt": "The Spring Boot BOM (Bill of Materials) is an architectural dependency management artifact (`spring-boot-dependencies`) that defines curated, rigorously tested, and mutually compatible versions for hundreds of third-party Java libraries. It allows developers to declare dependencies without specifying `<version>` tags.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: BOM Dependency Management Tree</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Parent POM / BOM</span>
                <span class="node-desc">spring-boot-dependencies</span>
              </div>
              <span class="flow-arrow-separator">──Defines &lt;dependencyManagement&gt;──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">Curated Version Matrix</span>
                <span class="node-desc">Jackson, Netty, Hibernate, Kafka</span>
              </div>
              <span class="flow-arrow-separator">──Inherited By──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Application POM</span>
                <span class="node-desc">&lt;artifactId&gt; without &lt;version&gt;</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>🛡️</span> <strong>Diamond Dependency Killer:</strong> Eliminates runtime NoSuchMethodError caused by mismatched transitive versions.
            </div>
          </div>
        """,
        "internalWorking": "The BOM works via Maven's `<dependencyManagement>` section. In `spring-boot-dependencies`, Spring engineers maintain properties for versions (e.g. `<jackson-bom.version>2.15.2</jackson-bom.version>`) and map artifact coordinates. When an application either inherits from `spring-boot-starter-parent` or imports `spring-boot-dependencies` with `<scope>import</scope>`, Maven looks up the BOM's dependencyManagement table to determine the version for any declared dependency lacking an explicit `<version>` tag.",
        "complexPart": "Overriding BOM versions: If an application inherits from `spring-boot-starter-parent`, developers can override a specific library's version by redefining its property in `<properties>` (e.g. `<tomcat.version>10.1.18</tomcat.version>`). However, if the application uses `scope=import` in `<dependencyManagement>` instead of parent inheritance, properties overriding DOES NOT work! In that scenario, you must declare the dependency with an explicit version BEFORE the imported BOM in the `<dependencyManagement>` section (Maven's first-declaration-wins rule).",
        "keyPoints": [
            "spring-boot-dependencies: The root BOM containing hundreds of pre-tested, harmonized library versions.",
            "spring-boot-starter-parent: Extends `spring-boot-dependencies`, adds resource filtering, UTF-8 defaults, and pre-configured plugin executions.",
            "Version-less declarations: Developers omit `<version>` tags, preventing 'JAR Hell' and binary incompatibility across transitive dependencies.",
            "Overriding via Parent: When using starter-parent, override library versions by defining the corresponding property in POM `<properties>`.",
            "Overriding via Import: When using `<scope>import</scope>`, place your custom version declaration ABOVE the BOM declaration in `<dependencyManagement>`."
        ],
        "codeSnippet": "<!-- Importing BOM without inheriting spring-boot-starter-parent -->\n<dependencyManagement>\n    <dependencies>\n        <!-- Override Jackson specifically BEFORE the BOM -->\n        <dependency>\n            <groupId>com.fasterxml.jackson.core</groupId>\n            <artifactId>jackson-databind</artifactId>\n            <version>2.16.1</version>\n        </dependency>\n        <!-- Spring Boot BOM -->\n        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-dependencies</artifactId>\n            <version>3.2.2</version>\n            <type>pom</type>\n            <scope>import</scope>\n        </dependency>\n    </dependencies>\n</dependencyManagement>",
        "pitfall": "Hardcoding explicit `<version>` tags on standard dependencies. This defeats the BOM and frequently causes `NoSuchMethodError` or `ClassNotFoundException` due to subtle transitive version mismatches.",
        "interviewTip": "Explain how the BOM prevents diamond dependency hell and describe the critical difference in how to override versions when using spring-boot-starter-parent (via properties) versus using dependencyManagement scope=import (via declaration order)."
    },

    # -------------------------------------------------------------------------
    # Topic 7: SpringApplication.run() Startup Flow
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-springapplication-run-flow",
        "title": "SpringApplication.run() 12-Step Execution Pipeline",
        "category": "Bootstrap & Core Engine",
        "badge": "Core Engine Pipeline",
        "oneLiner": "The internal sequence from bootstrap timer to runner execution.",
        "whatIsIt": "SpringApplication.run() is the central orchestrator that bootstraps a Spring Boot application. It transitions through 12 deterministic phases: initializing listeners, preparing the Environment, creating the ApplicationContext, executing bean factory post-processors, starting the embedded web server, and firing runners.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: SpringApplication.run() 12-Phase Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">1. StopWatch Start</span>
                <span class="node-desc">Measure boot latency</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">2. RunListeners</span>
                <span class="node-desc">starting() fired</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">3. Prepare Environment</span>
                <span class="node-desc">Profiles, YAML, Properties</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">4. Print Banner</span>
                <span class="node-desc">banner.txt / ASCII</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-blue">
                <span class="node-label">5. Create Context</span>
                <span class="node-desc">ServletWebServer vs Reactive</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">6. Context Refresh</span>
                <span class="node-desc">IoC container & server boot</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">7. Call Runners</span>
                <span class="node-desc">ApplicationRunner, CommandLine</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>🚀</span> <strong>Critical Junction:</strong> Context Refresh (Phase 6) is where Tomcat starts and all singleton beans are created.
            </div>
          </div>
        """,
        "internalWorking": "Inside `SpringApplication.run(Class<?>[] primarySources, String[] args)`: (1) Instantiates `StopWatch` and fires `SpringApplicationRunListeners.starting()`. (2) `prepareEnvironment()` determines WebApplicationType (NONE, SERVLET, REACTIVE), binds command-line args, evaluates active profiles, and executes `EnvironmentPostProcessor` instances. (3) Prints banner. (4) `createApplicationContext()` creates `AnnotationConfigServletWebServerApplicationContext` for Servlet webapps. (5) `prepareContext()` applies `ApplicationContextInitializer` classes, registers arguments as singleton `springBootBanner`. (6) `refreshContext(context)` invokes `AbstractApplicationContext.refresh()`: scans components, runs BeanFactoryPostProcessors, starts embedded Tomcat on port, and initializes singletons. (7) `afterRefresh()` is invoked. (8) StopWatch stops. (9) `listeners.started()` fires. (10) Invokes `ApplicationRunner` and `CommandLineRunner` beans. (11) `listeners.ready()` fires.",
        "complexPart": "Failure handling during boot: If an exception is thrown in any phase, Spring catches `Throwable`, fires `listeners.failed(context, exception)`, invokes registered `FailureAnalyzer` instances (e.g., `PortInUseFailureAnalyzer`) to print clear diagnostic action messages to stderr, and calls `context.close()`. The thread finally exits or throws `IllegalStateException`.",
        "keyPoints": [
            "StopWatch & Timing: Starts latency measurement immediately upon entry into run().",
            "Environment Preparation: Resolves system properties, OS environment, application.yml, and dynamic profile bindings before context creation.",
            "Context Creation Factory: In Boot 3, uses `ApplicationContextFactory` to instantiate AnnotationConfigServletWebServerApplicationContext or AnnotationConfigReactiveWebServerApplicationContext.",
            "Embedded Server Binding: Embedded web servers (Tomcat) start during the onRefresh() phase of AbstractApplicationContext, NOT before.",
            "Runners: CommandLineRunner (raw String[] args) and ApplicationRunner (parsed ApplicationArguments) execute as the final step before marking the application 'ready'."
        ],
        "codeSnippet": "// Programmatic custom configuration of SpringApplication:\nSpringApplication app = new SpringApplication(MyApplication.class);\napp.setBannerMode(Banner.Mode.OFF);\napp.setWebApplicationType(WebApplicationType.SERVLET);\napp.addInitializers(new MyCustomContextInitializer());\napp.addListeners(new MyCustomApplicationListener());\nConfigurableApplicationContext context = app.run(args);",
        "pitfall": "Performing heavy blocking operations in an ApplicationContextInitializer. Initializers run before the environment is fully stable and before any beans are created.",
        "interviewTip": "Walk through the pipeline: (1) Prepare Environment, (2) Create Context based on WebApplicationType, (3) Refresh Context (where Tomcat boots and singletons instantiate), (4) Execute Runners, (5) Fire Ready event."
    },

    # -------------------------------------------------------------------------
    # Topic 8: ApplicationContext Creation and Refresh
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-context-refresh",
        "title": "ApplicationContext Creation & The 12-Step refresh() Method",
        "category": "Bootstrap & Core Engine",
        "badge": "Spring Core Foundation",
        "oneLiner": "The heart of Spring IoC container initialization inside AbstractApplicationContext.refresh().",
        "whatIsIt": "ApplicationContext creation determines which specialized Spring container is spun up. Once instantiated, `AbstractApplicationContext.refresh()` executes the legendary 12-step lifecycle template method that initializes every bean factory, post-processor, embedded web server, and pre-instantiated singleton bean in the application.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The AbstractApplicationContext.refresh() Cycle</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">1. prepareRefresh</span>
                <span class="node-desc">Validate properties</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">2. invokeBeanFactoryPP</span>
                <span class="node-desc">ConfigurationClassParser</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">3. registerBeanPP</span>
                <span class="node-desc">Autowire & AOP processors</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-red">
                <span class="node-label">4. onRefresh()</span>
                <span class="node-desc">Embedded Tomcat Starts!</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">5. finishBeanFactoryInit</span>
                <span class="node-desc">Instantiate all Singletons</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #ec4899; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> <strong>Synchronization Barrier:</strong> refresh() is protected by a synchronized(this.startupShutdownMonitor) mutex!
            </div>
          </div>
        """,
        "internalWorking": "Inside AbstractApplicationContext.refresh(): (1) prepareRefresh(): Set active flag, init property sources. (2) obtainFreshBeanFactory(): Tell subclass to refresh internal BeanFactory (DefaultListableBeanFactory). (3) prepareBeanFactory(): Register SpEL resolver, PropertyEditorRegistrars, ignore dependency interfaces (EnvironmentAware). (4) postProcessBeanFactory(): Subclass hooks. (5) invokeBeanFactoryPostProcessors(): Run BeanDefinitionRegistryPostProcessors (ConfigurationClassPostProcessor parses @Configuration, @ComponentScan). (6) registerBeanPostProcessors(): Sort and register BeanPostProcessors (AutowiredAnnotationBPP, CommonAnnotationBPP). (7) initMessageSource(): i18n support. (8) initApplicationEventMulticaster(): SimpleApplicationEventMulticaster. (9) onRefresh(): Template method! In Servlet context, ServletWebServerApplicationContext starts embedded Tomcat here! (10) registerListeners(): Register ApplicationListeners with multicaster. (11) finishBeanFactoryInitialization(): Instantiate all remaining non-lazy singletons! (12) finishRefresh(): Publish ContextRefreshedEvent, start LifecycleProcessor.",
        "complexPart": "BeanFactoryPostProcessor vs BeanPostProcessor timing: BeanFactoryPostProcessors (BFPPs) execute in step 5, before ANY application beans are instantiated. They can inspect and mutate BeanDefinition metadata (e.g. encrypting/decrypting property values). In contrast, BeanPostProcessors (BPPs) are registered in step 6 and execute on bean instances during step 11. If a BFPP mistakenly autowires or depends on a standard bean, that bean is instantiated prematurely in step 5, bypassing subsequent BeanPostProcessors like @Autowired and @Transactional proxying!",
        "keyPoints": [
            "Synchronized Mutex: `refresh()` synchronizes on `startupShutdownMonitor` to prevent concurrent startup/shutdown races.",
            "ConfigurationClassPostProcessor: The workhorse BFPP that discovers beans, scans components, and processes @Import auto-configurations.",
            "onRefresh() Web Hook: Embedded web servers (Tomcat/Jetty) boot inside `onRefresh()`, before singleton beans are instantiated.",
            "finishBeanFactoryInitialization: Resolves dependencies and instantiates all non-lazy singletons using `DefaultListableBeanFactory.preInstantiateSingletons()`.",
            "Idempotency Guard: A context cannot be refreshed twice; calling refresh() on an already active context resets or throws IllegalStateException."
        ],
        "codeSnippet": "// Conceptual core of AbstractApplicationContext.refresh():\nsynchronized (this.startupShutdownMonitor) {\n    prepareRefresh();\n    ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();\n    prepareBeanFactory(beanFactory);\n    \n    // 1. Process all @Configuration & @ComponentScan:\n    invokeBeanFactoryPostProcessors(beanFactory);\n    \n    // 2. Register interceptors (AOP, @Autowired):\n    registerBeanPostProcessors(beanFactory);\n    \n    // 3. Start embedded web server (Tomcat):\n    onRefresh();\n    \n    // 4. Instantiate all @Service, @Component singletons:\n    finishBeanFactoryInitialization(beanFactory);\n    \n    // 5. Publish ContextRefreshedEvent:\n    finishRefresh();\n}",
        "pitfall": "Injecting regular application beans into a BeanFactoryPostProcessor. This causes premature bean instantiation, preventing those beans from being enhanced by BeanPostProcessors (such as AOP transaction proxies or security validators).",
        "interviewTip": "Name the two biggest phases of refresh(): Step 5 (invokeBeanFactoryPostProcessors - parses definitions) and Step 11 (finishBeanFactoryInitialization - instantiates all singletons). Mention that embedded Tomcat starts in Step 9 (onRefresh)."
    },

    # -------------------------------------------------------------------------
    # Topic 9: Embedded Server Startup
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-embedded-server-startup",
        "title": "Embedded Web Server Startup (Tomcat / Jetty / Undertow)",
        "category": "Web & Server Engine",
        "badge": "Server Architecture",
        "oneLiner": "How Spring Boot embeds web engines into the ApplicationContext without external WAR deployment.",
        "whatIsIt": "Unlike traditional Java EE where an application is compiled to a WAR and deployed inside an external standalone application server, Spring Boot inverts the paradigm: the application embeds the web server (Tomcat, Jetty, or Undertow) as a standard Java object managed inside the Spring IoC container.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Embedded Tomcat Lifecycle in onRefresh()</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">ServletWebServerFactory</span>
                <span class="node-desc">TomcatServletWebServerFactory</span>
              </div>
              <span class="flow-arrow-separator">──getWebServer()──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">Tomcat Instance</span>
                <span class="node-desc">Connector, Host, StandardContext</span>
              </div>
              <span class="flow-arrow-separator">──Adds──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">DispatcherServlet</span>
                <span class="node-desc">Registered as Servlet at '/'</span>
              </div>
              <span class="flow-arrow-separator">──start()──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">Port Binding</span>
                <span class="node-desc">Tomcat starts listening on :8080</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>🔌</span> <strong>Zero External WAR:</strong> The web engine is just a Spring bean implementing WebServer!
            </div>
          </div>
        """,
        "internalWorking": "During ApplicationContext creation, Boot chooses `AnnotationConfigServletWebServerApplicationContext`. In `refresh() -> onRefresh()`, it calls `createWebServer()`. (1) Looks up the `ServletWebServerFactory` bean (e.g. `TomcatServletWebServerFactory`). (2) The factory instantiates a new `org.apache.catalina.startup.Tomcat()` instance. (3) Configures base directory, Connector, thread pools (`server.tomcat.threads.max`), and Host. (4) Creates a Tomcat `StandardContext`. (5) Registers `DispatcherServlet` via `ServletContextInitializer` (Spring ServletRegistrationBean). (6) Calls `tomcat.start()`. (7) Publishes `ServletWebServerInitializedEvent` containing the active port (important for dynamic port 0).",
        "complexPart": "Why port 0 works for dynamic testing: When setting `server.port=0`, the embedded Tomcat does not bind to port 0; it requests any ephemeral free port from the OS kernel. The actual assigned port is only known AFTER `tomcat.start()` executes. Spring catches the event, extracts `connector.getLocalPort()`, and updates the environment. Injecting `@LocalServerPort int port` in integration tests works because of this late binding event.",
        "keyPoints": [
            "ServletWebServerFactory: Strategy interface with implementations for Tomcat, Jetty, and Undertow.",
            "WebServer Interface: Encapsulates web server lifecycle methods: `start()`, `stop()`, and `getPort()`.",
            "onRefresh() Timing: The server instance is initialized during `onRefresh()`, but connectors start listening only at the end of the refresh lifecycle.",
            "Graceful Shutdown: Spring Boot 2.3+ supports `server.shutdown=graceful`, pausing the connector while active requests finish within `spring.lifecycle.timeout-per-shutdown-phase`.",
            "WebCustomizer Pipeline: `WebServerFactoryCustomizer<TomcatServletWebServerFactory>` beans can programmatically adjust valve, SSL, and thread pool internals."
        ],
        "codeSnippet": "@Configuration\npublic class CustomTomcatConfig {\n    @Bean\n    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {\n        return factory -> {\n            factory.setPort(8443);\n            factory.addConnectorCustomizers(connector -> {\n                Http11NioProtocol proto = (Http11NioProtocol) connector.getProtocolHandler();\n                proto.setMaxThreads(300);\n                proto.setConnectionTimeout(20000);\n            });\n        };\n    }\n}",
        "pitfall": "Assuming Servlet filters registered as Spring @Component beans only run once. If a Filter is both declared as a @Component and registered in a FilterRegistrationBean, it will be executed TWICE unless configured with disabled registration.",
        "interviewTip": "Emphasize that the web server is simply an instance of the `WebServer` interface created by a `ServletWebServerFactory` inside `onRefresh()`. In Spring Boot, the server is inside the application, not the application inside the server."
    },

    # -------------------------------------------------------------------------
    # Topic 10: ApplicationRunner / CommandLineRunner
    # -------------------------------------------------------------------------
    {
        "id": "sb-int-runners",
        "title": "ApplicationRunner vs CommandLineRunner Execution Mechanics",
        "category": "Bootstrap & Core Engine",
        "badge": "Startup Hooks",
        "oneLiner": "Post-startup callback interfaces executed right before the application is marked ready.",
        "whatIsIt": "ApplicationRunner and CommandLineRunner are Spring Boot callback interfaces used to execute initialization logic (e.g. database seeding, warm-up caches, pre-computing hash tables) immediately after the Spring ApplicationContext is fully refreshed and the embedded web server is listening.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Runner Execution at End of Boot Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue">
                <span class="node-label">Context Refreshed</span>
                <span class="node-desc">Beans initialized & WebServer running</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-purple">
                <span class="node-label">Discovery & Sorting</span>
                <span class="node-desc">Fetch beans by type & sort via @Order</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-orange">
                <span class="node-label">Runner Execution</span>
                <span class="node-desc">callRunners(context, args)</span>
              </div>
              <span class="flow-arrow-separator">──►</span>
              <div class="flow-step-node node-green">
                <span class="node-label">ApplicationReadyEvent</span>
                <span class="node-desc">App transitions to fully READY</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> <strong>Crash Hazard:</strong> An unhandled exception in any runner immediately aborts boot and crashes the JVM!
            </div>
          </div>
        """,
        "internalWorking": "At the very end of `SpringApplication.run()`, after `listeners.started(context)` is called, the private method `callRunners(context, args)` is invoked: (1) Queries `context.getBeansOfType(ApplicationRunner.class)` and `context.getBeansOfType(CommandLineRunner.class)`. (2) Merges all runners into a single collection and sorts them using `AnnotationAwareOrderComparator` based on `@Order` or `Ordered` interface. (3) Iterates sequentially over the sorted list: for `ApplicationRunner`, passes `DefaultApplicationArguments` (providing parsed options like `--foo=bar`); for `CommandLineRunner`, passes raw `String[] args`. (4) Only after all runners successfully return does the application fire `ApplicationReadyEvent`.",
        "complexPart": "The difference between argument parsing: CommandLineRunner receives raw `String... args` without parsing (e.g. `[\"--debug\", \"--env=prod\", \"file.txt\"]`). ApplicationRunner receives `ApplicationArguments`, which automatically parses arguments into option arguments (key-values accessed via `args.getOptionValues(\"env\")`) versus non-option arguments (`file.txt`). If a runner fails with an unhandled exception, `SpringApplication.run()` catches it, triggers failure analyzers, and terminates the application immediately.",
        "keyPoints": [
            "Execution Point: Runs after context refresh and web server startup, but before ApplicationReadyEvent.",
            "Ordering: Runners can be prioritized using `@Order(1)`, `@Order(2)` or implementing `Ordered`.",
            "CommandLineRunner: Receives raw varargs `String... args` directly from `public static void main`.",
            "ApplicationRunner: Receives parsed `ApplicationArguments` separating `--key=value` option flags from non-option arguments.",
            "Failure Semantics: An exception in a runner crashes application startup; wrap non-critical startup logic in try-catch."
        ],
        "codeSnippet": "@Component\n@Order(1)\npublic class CacheWarmupRunner implements ApplicationRunner {\n    @Override\n    public void run(ApplicationArguments args) throws Exception {\n        if (args.containsOption(\"warmup\")) {\n            List<String> env = args.getOptionValues(\"env\");\n            System.out.println(\"Warming up cache for env: \" + env);\n        }\n    }\n}\n\n@Component\n@Order(2)\npublic class RawArgsRunner implements CommandLineRunner {\n    @Override\n    public void run(String... args) throws Exception {\n        System.out.println(\"Raw CLI args count: \" + args.length);\n    }\n}",
        "pitfall": "Running long-lived blocking loops (like polling a message queue) inside a runner on the main thread. This prevents `callRunners()` from completing, meaning `ApplicationReadyEvent` is never published and health checks (Liveness/Readiness probes) fail.",
        "interviewTip": "Highlight the difference: `ApplicationRunner` provides structured key-value option parsing (`ApplicationArguments`), while `CommandLineRunner` passes raw `String[]`. Mention that both can be ordered using `@Order`."
    }
]
