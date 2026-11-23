import json

def make_box(title, steps):
    chain_html = []
    for i, s in enumerate(steps):
        color = s.get('color', 'node-blue')
        min_w = s.get('min_w', '150px')
        chain_html.append(f"""              <div class="flow-step-node {color}" style="min-width: {min_w};">
                <span class="node-label">{s['label']}</span>
                <span class="node-desc">{s['desc']}</span>
              </div>""")
        if i < len(steps) - 1:
            chain_html.append('              <span class="flow-arrow-separator">──►</span>')
    joined = "\n".join(chain_html)
    return f"""<div class="visual-diagram-box">
            <div class="diagram-header-label">🌐 Visual Architecture Flow: {title}</div>
            <div class="flow-chain">
{joined}
            </div>
          </div>"""

categories = [
    {"id": "decomposition", "title": "🧩 Decomposition & Strangler", "count": 4},
    {"id": "data", "title": "💾 Data, Sagas & Outbox", "count": 7},
    {"id": "integration", "title": "🚪 Gateways & Integration", "count": 4},
    {"id": "resilience", "title": "🛡️ Resilience & Fault Tolerance", "count": 5},
    {"id": "observability", "title": "📊 Observability & Operations", "count": 5}
]

patterns = [
    # 1. Decompose by Business Capability
    {
        "id": "ms-decompose-business-capability",
        "title": "Decompose by Business Capability",
        "category": "Decomposition & Strangler",
        "badge": "Decomposition",
        "whatIsIt": "Organizes microservices around distinct, cohesive business functions (e.g., Order Management, Inventory, Billing, Shipping) derived from business architecture models. Ensures each service represents a stable business capability rather than a technical layer.",
        "visualDiagram": make_box("Business Capability Partitioning", [
            {"label": "Enterprise Capability Map", "desc": "Order, Inventory, Billing, Shipping", "color": "node-blue", "min_w": "180px"},
            {"label": "Autonomous Service Bounding", "desc": "OrderService / InventoryService", "color": "node-purple", "min_w": "180px"},
            {"label": "Independent Data Stores", "desc": "Order DB / Inventory DB (isolated)", "color": "node-orange", "min_w": "180px"},
            {"label": "Independent Delivery", "desc": "Autonomous two-pizza team deployment", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Business capabilities are stable business functions that generate enterprise value. Unlike technical tiers (UI, business layer, database layer), business capabilities rarely change unless the enterprise shifts its core business model. Services communicate across well-defined REST or asynchronous event contracts. Teams own the full lifecycle from requirements to production deployment (DevOps ownership).",
        "complexPart": "Distributed transactions and data fragmentation: When a single user action touches multiple capabilities (e.g. checkout requires order creation, inventory deduction, and credit card charge), atomic ACID transactions are lost. Teams must implement the Saga pattern or asynchronous eventual consistency.",
        "keyPoints": [
            "Aligns microservices boundaries directly with business organizational capabilities.",
            "Enables autonomous teams to release features independently without cross-team sync locks.",
            "Requires shifting from technical-tier thinking to capability-driven vertical slices.",
            "Must be paired with Database per Service to prevent shared data coupling."
        ],
        "codeSnippet": """// Vertical Slice Architecture: Order Capability Service
@RestController
@RequestMapping("/api/v1/orders")
public class OrderCapabilityController {
    private final OrderService orderService;
    public OrderCapabilityController(OrderService os) { this.orderService = os; }

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@RequestBody CreateOrderRequest req) {
        OrderResponse res = orderService.createOrder(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
}""",
        "pitfall": "Splitting by technical layers (e.g., 'Validation Service', 'Database Access Service') instead of true business capabilities.",
        "interviewTip": "Emphasize Conway's Law: 'Organizations design systems that mirror their communication structures.' Capability boundaries match autonomous team ownership."
    },
    # 2. Decompose by Subdomain (DDD)
    {
        "id": "ms-decompose-subdomain",
        "title": "Decompose by Subdomain (DDD Bounded Contexts)",
        "category": "Decomposition & Strangler",
        "badge": "Decomposition",
        "whatIsIt": "Decomposes a distributed system using Domain-Driven Design (DDD) principles. Identifies Core, Supporting, and Generic subdomains, defining strict Bounded Contexts with their own Ubiquitous Language to eliminate conflicting domain model meanings.",
        "visualDiagram": make_box("DDD Bounded Context Partitioning", [
            {"label": "Ubiquitous Language", "desc": "Domain definitions & workflows", "color": "node-blue", "min_w": "170px"},
            {"label": "Subdomain Identification", "desc": "Core (Ordering), Supporting, Generic", "color": "node-purple", "min_w": "180px"},
            {"label": "Bounded Context", "desc": "OrderContext vs CustomerContext", "color": "node-orange", "min_w": "180px"},
            {"label": "Context Mapping", "desc": "Anti-Corruption Layer (ACL) bridge", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "In a monolithic system, terms like 'Product' or 'Account' mean drastically different things to Sales, Billing, and Warehousing. DDD resolves this by establishing Bounded Contexts: inside the Ordering Context, 'Product' has an SKU and pricing; inside the Shipping Context, 'Product' has physical dimensions and weight. Services communicate across Context Maps via Anti-Corruption Layers (ACL).",
        "complexPart": "Boundary definition errors: Setting boundaries too small produces 'nanoservices' that cause extreme network latency and distributed transaction hell. Setting them too large creates mini-monoliths. Identifying aggregate roots and transactional consistency boundaries is critical.",
        "keyPoints": [
            "Core Domain provides competitive advantage; Generic Subdomains (auth, notification) should use off-the-shelf tools.",
            "Bounded Contexts establish linguistic boundaries: each concept has exactly 1 unambiguous meaning within its boundary.",
            "Context Mapping models relationships: Shared Kernel, Customer-Supplier, Anti-Corruption Layer (ACL).",
            "Prevents monolithic domain model bloat where an entity has 80 fields used by 6 different departments."
        ],
        "codeSnippet": """// Ordering Bounded Context - Product is a lightweight Value Object
public record OrderItem(String productSku, BigDecimal unitPrice, int quantity) {}

// Shipping Bounded Context - Product represents physical shipping dimensions
public record PackageItem(String productSku, double weightKg, double volumeCm3) {}

// Anti-Corruption Layer (ACL) translating external domain models
@Component
public class InventoryAclService {
    public PackageItem translateToShippingItem(ExternalInventoryDto dto) {
        return new PackageItem(dto.sku(), dto.grossWeight(), dto.cubicVolume());
    }
}""",
        "pitfall": "Attempting to create a single unified 'canonical data model' across the whole enterprise, which violates DDD Bounded Context isolation.",
        "interviewTip": "Explain how the meaning of 'Customer' or 'Order' changes between sales, fulfillment, and accounting bounded contexts."
    },
    # 3. Strangler Fig Pattern
    {
        "id": "ms-strangler-fig",
        "title": "Strangler Fig Pattern (Zero-Downtime Migration)",
        "category": "Decomposition & Strangler",
        "badge": "Decomposition",
        "whatIsIt": "Incrementally migrates a legacy monolithic application to microservices by gradually replacing specific features with new services. An API Gateway intercepts traffic and routes migrated endpoints to the new microservices while passing legacy calls to the monolith until the monolith is retired.",
        "visualDiagram": make_box("Strangler Fig Incremental Migration", [
            {"label": "1. Client Traffic", "desc": "All calls hit API Gateway / Proxy", "color": "node-blue", "min_w": "170px"},
            {"label": "2. Route Interception", "desc": "Gateway splits by endpoint path", "color": "node-purple", "min_w": "170px"},
            {"label": "3. New Microservice", "desc": "/api/v1/orders routed to GKE microservice", "color": "node-green", "min_w": "190px"},
            {"label": "4. Legacy Monolith", "desc": "Remaining unmigrated paths forwarded", "color": "node-orange", "min_w": "180px"}
        ]),
        "internalWorking": "The pattern is named after the Australian Strangler Fig tree, which germinates in the branches of a host tree, grows roots downward, and eventually strangles and replaces the host. In software, you place an API Gateway (Apigee / Envoy / NGINX) in front of the monolith. As vertical slices are rewritten into modern microservices, the gateway routes those paths to the new services. Database synchronization is maintained via Change Data Capture (CDC) or dual-writes.",
        "complexPart": "Data synchronization during migration: When a migrated service shares data with unmigrated monolith modules, keeping both databases in sync without distributed deadlocks or split-brain state is the hardest engineering challenge. CDC tools like Debezium are standard solutions.",
        "keyPoints": [
            "Avoids the catastrophic risks of 'Big Bang' rewrites.",
            "Delivers immediate business value by releasing high-priority features on modern tech stacks early.",
            "Requires an API Gateway or reverse proxy capable of dynamic URL path routing.",
            "When all capabilities are migrated, the legacy monolith container is gracefully decommissioned."
        ],
        "codeSnippet": """# Spring Cloud Gateway / Envoy Path-Based Strangler Routing
spring:
  cloud:
    gateway:
      routes:
      # Migrated microservice route
      - id: modern-order-service
        uri: http://order-service.prod.svc.cluster.local:8080
        predicates:
        - Path=/api/v1/orders/**

      # Legacy Monolith fallback route for unmigrated endpoints
      - id: legacy-monolith-fallback
        uri: http://legacy-monolith.internal.corp:8080
        predicates:
        - Path=/api/**""",
        "pitfall": "Attempting a 'Big Bang' monolith rewrite instead of incremental strangling; historical data shows over 70% of Big Bang rewrites fail.",
        "interviewTip": "Cite Martin Fowler's Strangler Fig concept and explain how Change Data Capture (CDC via Debezium) solves the dual-write database sync problem."
    },
    # 4. Micro Frontends
    {
        "id": "ms-micro-frontends",
        "title": "Micro Frontends Pattern (Independent UI Feature Teams)",
        "category": "Decomposition & Strangler",
        "badge": "Decomposition",
        "whatIsIt": "Extends the microservices architectural style to the frontend tier. Decomposes a monolithic frontend application into autonomous, independently deployable browser modules owned by cross-functional feature teams.",
        "visualDiagram": make_box("Micro Frontends Composition", [
            {"label": "App Shell / Container", "desc": "Header, Routing, Global Auth", "color": "node-blue", "min_w": "170px"},
            {"label": "Catalog MFE (Team A)", "desc": "Product search & grid component", "color": "node-purple", "min_w": "180px"},
            {"label": "Checkout MFE (Team B)", "desc": "Cart, Payment & Address widget", "color": "node-orange", "min_w": "180px"},
            {"label": "Independent CD Pipeline", "desc": "Each MFE deploys without shell rebuild", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "Micro Frontends can be integrated via: (1) Build-time integration (npm packages, risk of lockstep deployments), (2) Server-side routing/composition (Edge Side Includes / SSR), or (3) Client-side composition (Webpack Module Federation, Single-SPA, Web Components). The App Shell provides shared navigation, authentication state, and a decoupled custom event bus for cross-MFE communication.",
        "complexPart": "CSS collisions and bundle payload bloat: If each team bundles its own copy of React and heavy libraries, initial page load degrades severely. Webpack Module Federation resolves this via shared dependency singletons ('shared: { react: { singleton: true } }').",
        "keyPoints": [
            "Aligns UI development with backend microservice ownership (true vertical slicing).",
            "Module Federation enables dynamic runtime loading of remote JS bundles without shell redeployments.",
            "Cross-MFE communication must remain loosely coupled using browser CustomEvents or window.postMessage.",
            "Enforces strict CSS isolation using CSS Modules, Tailwind prefixes, or Shadow DOM."
        ],
        "codeSnippet": """// Webpack 5 Module Federation Configuration (checkout/webpack.config.js)
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "checkout_mfe",
      filename: "remoteEntry.js",
      exposes: {
        "./CheckoutWidget": "./src/components/CheckoutWidget",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
      },
    }),
  ],
};""",
        "pitfall": "Allowing micro frontends to directly access each other's internal DOM or global variables, creating fragile tight coupling.",
        "interviewTip": "Highlight Webpack 5 Module Federation and compare client-side composition vs SSR / Edge-Side Includes (ESI)."
    },
    # 5. Database per Service
    {
        "id": "ms-database-per-service",
        "title": "Database per Service Pattern",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "Each microservice must own and manage its own private persistent data store. No other service can access the database directly; all data access is mediated through public API contracts or event streams.",
        "visualDiagram": make_box("Database per Service Isolation", [
            {"label": "Order Service", "desc": "Connects strictly to Order DB", "color": "node-blue", "min_w": "160px"},
            {"label": "Private Order DB", "desc": "PostgreSQL instance / schema", "color": "node-purple", "min_w": "170px"},
            {"label": "Direct SQL Access BLOCKED", "desc": "Inventory Service CANNOT query Order DB", "color": "node-red", "min_w": "190px"},
            {"label": "Public API Interaction", "desc": "Communicates via REST / Kafka events", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Isolation can be enforced at three levels: (1) Private database server per service (maximum isolation, higher infrastructure cost), (2) Shared database server with separate schemas per service (logical isolation, cost-effective), or (3) Shared tables with private columns (antipattern, avoid). Loose coupling allows teams to choose Polyglot Persistence: OrderService uses Postgres (relational ACID), ProductCatalog uses MongoDB (document), and RecommendationService uses Neo4j (graph).",
        "complexPart": "Loss of ACID joins across tables: You cannot execute a single SQL query joining 'Orders' and 'Customers' across two services. Queries requiring combined data must use API composition or the CQRS pattern with a read-optimized projected view.",
        "keyPoints": [
            "Prevents database schema changes in one service from breaking other services.",
            "Enables Polyglot Persistence: choosing the optimal storage engine for each workload.",
            "Service database credentials must be strictly restricted via IAM / network firewalls.",
            "Eliminates distributed locking on database tables across independent bounded contexts."
        ],
        "codeSnippet": """# Kubernetes / Spring Boot Configuration enforcing isolated database credentials
spring:
  datasource:
    # Dedicated private database instance and credentials
    url: jdbc:postgresql://order-db.internal:5432/order_service_db
    username: ${ORDER_DB_USER}
    password: ${ORDER_DB_SECRET}
  jpa:
    hibernate:
      ddl-auto: validate # Schemas evolved independently via Flyway/Liquibase""",
        "pitfall": "Allowing another microservice's developer to write a 'quick SQL query' directly against your database, destroying service encapsulation.",
        "interviewTip": "Emphasize that isolation can be private database servers OR private schemas on a shared cluster, but never shared tables."
    },
    # 6. Shared Database Antipattern
    {
        "id": "ms-shared-database",
        "title": "Shared Database Antipattern (Pitfalls & Decoupling)",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "A notorious distributed systems antipattern where multiple microservices read and write directly to the same underlying database tables. Creates hidden coupling, coordinated deployments, and database-level deadlocks.",
        "visualDiagram": make_box("Shared Database Antipattern Flaws", [
            {"label": "Service A (Order)", "desc": "Writes to shared 'orders' table", "color": "node-red", "min_w": "160px"},
            {"label": "Shared Monolithic DB", "desc": "Single point of failure & contention", "color": "node-purple", "min_w": "180px"},
            {"label": "Service B (Billing)", "desc": "Reads & updates shared 'orders' table", "color": "node-red", "min_w": "170px"},
            {"label": "Cascading Lock Contention", "desc": "Row lock deadlocks & schema lockstep", "color": "node-orange", "min_w": "190px"}
        ]),
        "internalWorking": "When multiple services query and mutate the same tables, service boundaries become an illusion. A schema migration (e.g. renaming a column or adding a NOT NULL constraint) by Service A instantly crashes Service B in production. Furthermore, database-level row locks taken by one service block queries in completely unrelated services, causing cascading timeouts.",
        "complexPart": "How to break a shared database: (1) Identify aggregate ownership, (2) Split tables into separate logical schemas, (3) Expose APIs for data that was previously queried via SQL joins, (4) Replicate data asynchronously via Kafka or Transactional Outbox for read-heavy views.",
        "keyPoints": [
            "Results in 'distributed monolith': independent microservice deployments become impossible.",
            "Creates database connection pool exhaustion across multiple independent applications.",
            "Schema migrations require lockstep maintenance windows across multiple engineering teams.",
            "Breaks domain encapsulation by bypassing application business validation rules."
        ],
        "codeSnippet": """// ANTIPATTERN (DO NOT DO THIS):
// Service B directly querying Service A's private table
@Repository
public interface OrderSharedRepository extends JpaRepository<OrderEntity, Long> {
    // VIOLATION: Billing service directly updating Order table state!
    @Modifying
    @Query("UPDATE OrderEntity o SET o.status = 'PAID' WHERE o.id = :id")
    void markAsPaid(@Param("id") Long id);
}

// REMEDIATION:
// Service B notifies Service A over an event or API contract
orderServiceClient.notifyPaymentReceived(new PaymentNotification(orderId, "PAID"));""",
        "pitfall": "Creating microservices at the compute layer (containers) while leaving a single shared database at the storage layer.",
        "interviewTip": "Explain how shared databases create a 'Distributed Monolith'—all the operational complexity of microservices with none of the deployment independence."
    },
    # 7. Saga: Choreography
    {
        "id": "ms-saga-choreography",
        "title": "Saga Pattern: Choreography (Event-Driven Compensation)",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "Coordinates distributed transactions across multiple microservices without a central orchestrator. Each service executes a local transaction, publishes a domain event to a message broker (e.g., Kafka), and downstream services listen and execute their local transactions or compensating rollbacks.",
        "visualDiagram": make_box("Saga Choreography Event Chain", [
            {"label": "1. OrderCreated Event", "desc": "OrderService creates PENDING order", "color": "node-blue", "min_w": "170px"},
            {"label": "2. PaymentService", "desc": "Charges card -> publishes PaymentProcessed", "color": "node-purple", "min_w": "180px"},
            {"label": "3. InventoryService", "desc": "Out of stock! Publishes InventoryFailed", "color": "node-orange", "min_w": "180px"},
            {"label": "4. Compensating Actions", "desc": "Payment refunds card; Order set CANCELLED", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "Because 2-Phase Commit (2PC) does not scale across microservices, Sagas provide eventual consistency through a sequence of local transactions. If a step fails (e.g., Inventory out of stock), the failing service publishes a failure event. All preceding services listen for this failure and execute Compensating Transactions (semantically reversing previous actions: e.g., issuing a credit card refund).",
        "complexPart": "Cyclic dependencies and observability blindness: In complex workflows with 8+ services, choreography becomes impossible to trace. Services listen to events that trigger other events, creating spaghetti event loops where no single engineer understands the complete transaction flow.",
        "keyPoints": [
            "Decentralized and loosely coupled: no single point of failure or orchestration bottleneck.",
            "Ideal for simple workflows involving 2 to 4 microservices.",
            "Compensating transactions must be idempotent: executing a compensation twice must not corrupt state.",
            "Requires robust dead-letter queues (DLQ) and distributed tracing (OpenTelemetry)."
        ],
        "codeSnippet": """// Inventory Consumer executing Compensating Event in Choreography
@KafkaListener(topics = "payment-processed-topic")
public void handlePaymentProcessed(PaymentProcessedEvent event) {
    try {
        inventoryService.reserveStock(event.orderId(), event.items());
        kafkaTemplate.send("order-completed-topic", new OrderCompletedEvent(event.orderId()));
    } catch (OutOfStockException e) {
        // Publish failure event to trigger compensating rollbacks upstream
        kafkaTemplate.send("inventory-failed-topic", 
            new InventoryFailedEvent(event.orderId(), "Out of stock"));
    }
}""",
        "pitfall": "Forgetting that compensating transactions can fail, leaving the system in an inconsistent state unless handled by DLQs or human alert runbooks.",
        "interviewTip": "Recommend Choreography for simple 2-4 step flows, but state that Orchestration is mandatory for complex business transactions."
    },
    # 8. Saga: Orchestration
    {
        "id": "ms-saga-orchestration",
        "title": "Saga Pattern: Orchestration (Central State Coordinator)",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "Coordinates distributed transactions through a dedicated central orchestrator (state machine). The orchestrator sends command messages to participants, waits for replies, updates its persistent state machine, and explicitly executes compensating commands if failures occur.",
        "visualDiagram": make_box("Saga Orchestration Coordinator", [
            {"label": "Saga Orchestrator", "desc": "Temporal / Camunda / Custom FSM", "color": "node-blue", "min_w": "170px"},
            {"label": "Step 1: Execute Payment", "desc": "Sends command -> awaits SUCCESS reply", "color": "node-purple", "min_w": "180px"},
            {"label": "Step 2: Reserve Inventory", "desc": "Sends command -> receives FAILED reply", "color": "node-orange", "min_w": "180px"},
            {"label": "Step 3: Rollback Trigger", "desc": "Orchestrator invokes RefundPayment command", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "The orchestrator models the business transaction as an explicit finite state machine (FSM). Participants execute passive commands ('ProcessPaymentCommand') and reply with outcome messages ('PaymentSuccess' / 'PaymentFailed'). If any participant fails, the orchestrator consults its state machine and issues compensating commands in reverse order. Modern enterprise implementations use tools like Temporal.io, Camunda, or AWS Step Functions.",
        "complexPart": "Orchestrator state persistence: The orchestrator's state machine must be durably persisted to a database before sending commands. If the orchestrator pod crashes in the middle of a saga, upon reboot it must inspect persistent storage and resume the saga from the exact failed step without duplicate charges.",
        "keyPoints": [
            "Centralizes transaction logic: a single place defines the end-to-end business workflow.",
            "Avoids cyclic event spaghetti and simplifies monitoring and auditing.",
            "Participants are completely decoupled from each other; they only know how to execute commands.",
            "Orchestrator can become a bottleneck or bloated with domain logic if not designed cleanly."
        ],
        "codeSnippet": """// Temporal Workflow Interface for Saga Orchestration
@WorkflowInterface
public interface OrderFulfillmentWorkflow {
    @WorkflowMethod
    void fulfillOrder(OrderRequest request);
}

public class OrderFulfillmentWorkflowImpl implements OrderFulfillmentWorkflow {
    private final PaymentActivities payment = Workflow.newActivityStub(PaymentActivities.class);
    private final InventoryActivities inventory = Workflow.newActivityStub(InventoryActivities.class);

    @Override
    public void fulfillOrder(OrderRequest req) {
        Saga saga = new Saga(new Saga.Options.Builder().setParallelCompensation(false).build());
        try {
            payment.charge(req.orderId(), req.amount());
            saga.addCompensation(payment::refund, req.orderId(), req.amount()); // Register rollback

            inventory.reserve(req.orderId(), req.items());
            saga.addCompensation(inventory::release, req.orderId(), req.items());
        } catch (ActivityFailure e) {
            saga.compensate(); // Executes compensations in strict reverse order!
            throw e;
        }
    }
}""",
        "pitfall": "Putting too much business logic inside the orchestrator, turning it into a smart orchestrator with dumb anemic services.",
        "interviewTip": "Name-drop Temporal.io or Camunda as modern production orchestrator engines that handle durable state machines out-of-the-box."
    },
    # 9. CQRS Pattern
    {
        "id": "ms-cqrs",
        "title": "CQRS (Command Query Responsibility Segregation)",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "Separates read and write operations for a data store into distinct, optimized models. Commands handle mutations, state changes, and business invariant validations; Queries handle optimized, high-throughput read views without relational join penalties.",
        "visualDiagram": make_box("CQRS Command/Query Separation", [
            {"label": "Client Writes (Commands)", "desc": "POST /orders -> OrderCommandService", "color": "node-blue", "min_w": "170px"},
            {"label": "Write DB (Normalized)", "desc": "Postgres / Relational (ACID invariants)", "color": "node-purple", "min_w": "180px"},
            {"label": "Async Sync (Kafka / CDC)", "desc": "Publishes OrderCreated event stream", "color": "node-orange", "min_w": "180px"},
            {"label": "Read DB (Denormalized)", "desc": "Elasticsearch / MongoDB / Redis Read View", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "In enterprise applications, read and write workloads have radically asymmetric scalability and schema requirements (e.g. 100 reads for every 1 write). The Write Model focuses on domain validation, data consistency, and transactional integrity (normalized 3NF). When state mutates, domain events are published to update the Read Model. The Read Model is denormalized and pre-aggregated into documents (Elasticsearch / Mongo / Read Replica) for sub-millisecond retrieval.",
        "complexPart": "Eventual consistency lag (Read Your Own Writes): Because synchronization between the write model and read view is asynchronous, a user who submits an order and immediately refreshes their dashboard might not see the new order for 200ms! Solved via optimistic UI updates, version stamping, or querying write model on immediate redirect.",
        "keyPoints": [
            "Optimizes read and write data models independently based on access patterns.",
            "Eliminates complex, expensive multi-table SQL joins during read operations.",
            "Enables asymmetric scaling: scale 10 read replicas for every 1 write node.",
            "Increases architectural complexity: requires event pipelines to keep read models in sync."
        ],
        "codeSnippet": """// Command Side: Validates invariants and updates Write DB
@RestController
@RequestMapping("/api/v1/orders")
public class OrderCommandController {
    @PostMapping
    public OrderId handleCreateOrder(@RequestBody CreateOrderCommand cmd) {
        return commandHandler.handle(cmd); // Mutates relational DB and emits event
    }
}

// Query Side: Directly queries denormalized Read DB (Elasticsearch / MongoDB)
@RestController
@RequestMapping("/api/v1/order-views")
public class OrderQueryController {
    @GetMapping("/{id}")
    public OrderDashboardDto getOrderView(@PathVariable String id) {
        return orderReadRepository.findById(id); // Fast O(1) document read
    }
}""",
        "pitfall": "Applying CQRS to simple CRUD applications where reads and writes have similar shapes, creating unnecessary synchronization complexity.",
        "interviewTip": "Address the 'Eventual Consistency' trade-off immediately and explain the 'Read Your Own Writes' solution."
    },
    # 10. Event Sourcing
    {
        "id": "ms-event-sourcing",
        "title": "Event Sourcing Pattern (Immutable Append-Only Ledger)",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "Instead of storing the current state of an entity, Event Sourcing stores the state as an append-only sequence of immutable domain events. The current state is reconstructed dynamically by replaying all historical events from the beginning of time or from a recent snapshot.",
        "visualDiagram": make_box("Event Sourcing Ledger Replay", [
            {"label": "1. Append Events", "desc": "AccountOpened -> Deposited($100) -> Withdrew($40)", "color": "node-blue", "min_w": "190px"},
            {"label": "2. Event Store (Append-Only)", "desc": "Kafka / EventStoreDB (Never UPDATEd/DELETEd)", "color": "node-purple", "min_w": "190px"},
            {"label": "3. Periodic Snapshot", "desc": "Snapshot at Event #1000: Balance = $60", "color": "node-orange", "min_w": "180px"},
            {"label": "4. Reconstituted State", "desc": "Loads Snapshot + replays recent delta events", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Traditional databases overwrite state: when an account balance changes from $100 to $60 via an update, the previous state is permanently erased. Event Sourcing never overwrites; it appends 'MoneyWithdrawnEvent(amount=$40)'. This provides an infallible, 100% audit log. You can reconstruct state at any historical timestamp ('Temporal Query') and project new read views retrospectively.",
        "complexPart": "Event Schema Evolution and Replay Performance: Entities with millions of events take seconds to hydrate if replayed from event #1. Systems solve this by storing Periodic Snapshots (e.g. every 100 events). Furthermore, when event schemas evolve (v1 -> v2), upcasters are required to deserialize legacy events.",
        "keyPoints": [
            "Provides an unalterable audit log and regulatory compliance by design (vital for Fintech/Banking).",
            "Eliminates object-relational impedance mismatch: events directly represent domain business facts.",
            "Pairs natively with CQRS: Event Store acts as the write log; projections build read views.",
            "Requires Snapshots and Upcasters to maintain replay performance and schema evolution."
        ],
        "codeSnippet": """// Aggregate Root replaying events to build state
public class BankAccountAggregate {
    private String accountId;
    private BigDecimal balance = BigDecimal.ZERO;

    // Apply domain event to reconstruct internal state
    public void apply(DomainEvent event) {
        switch (event) {
            case AccountCreatedEvent e -> {
                this.accountId = e.accountId();
                this.balance = BigDecimal.ZERO;
            }
            case MoneyDepositedEvent e -> this.balance = this.balance.add(e.amount());
            case MoneyWithdrawnEvent e -> this.balance = this.balance.subtract(e.amount());
        }
    }
}""",
        "pitfall": "Failing to implement snapshots for long-lived aggregates, causing slow start times as millions of events replay.",
        "interviewTip": "Explain how Event Sourcing naturally solves auditing, compliance, and time-travel debugging ('What was the state last Tuesday at 2 PM?')."
    },
    # 11. Transactional Outbox
    {
        "id": "ms-transactional-outbox",
        "title": "Transactional Outbox Pattern (Dual-Write Resolution)",
        "category": "Data, Sagas & Outbox",
        "badge": "Distributed Data",
        "whatIsIt": "Guarantees reliable message publishing by atomically saving business entity changes and the corresponding outbound message into the SAME database using a local ACID transaction. A background process or Change Data Capture (CDC) tool reads the outbox table and publishes to Kafka.",
        "visualDiagram": make_box("Transactional Outbox CDC Pipeline", [
            {"label": "1. Local ACID Transaction", "desc": "INSERT into 'orders' & 'outbox' tables", "color": "node-blue", "min_w": "180px"},
            {"label": "2. Database Commit", "desc": "Zero distributed 2PC, guaranteed atomicity", "color": "node-purple", "min_w": "180px"},
            {"label": "3. Debezium CDC Engine", "desc": "Reads Postgres WAL (Write-Ahead Log)", "color": "node-orange", "min_w": "180px"},
            {"label": "4. Apache Kafka Cluster", "desc": "Reliable At-Least-Once message delivery", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "The 'Dual-Write Problem' occurs when a service must write to a database AND publish an event to Kafka. If the DB commits but Kafka is down, the event is lost. If the event publishes but the DB transaction rolls back, phantom events corrupt downstream services. Transactional Outbox solves this: the message is written to an 'outbox' table in the SAME local database transaction. Debezium tails the database transaction log (Postgres WAL / MySQL binlog) and streams events to Kafka with zero loss.",
        "complexPart": "At-Least-Once Delivery & Duplicate Messages: CDC engines guarantee at-least-once delivery. If the CDC connector restarts or network jitters occur, duplicate messages can be published to Kafka. Downstream consumers MUST be strictly idempotent (using unique message IDs or idempotency tables).",
        "keyPoints": [
            "Completely solves the Dual-Write distributed transaction problem without 2PC.",
            "Local ACID database transaction guarantees 100% atomicity between business state and messages.",
            "Tailing database WAL logs via Debezium CDC causes near-zero performance overhead on the primary DB.",
            "Consumers must be idempotent to handle occasional duplicate deliveries safely."
        ],
        "codeSnippet": """@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepo;
    private final OutboxRepository outboxRepo;

    public Order createOrder(OrderRequest req) {
        Order order = orderRepo.save(new Order(req));

        // Atomic write into outbox table in the SAME database transaction
        OutboxMessage outbox = new OutboxMessage(
            "OrderAggregate",
            order.getId().toString(),
            "OrderCreatedEvent",
            toJson(new OrderCreatedEvent(order.getId(), order.getTotal()))
        );
        outboxRepo.save(outbox);

        return order; // Debezium CDC reads Postgres WAL log and streams to Kafka!
    }
}""",
        "pitfall": "Writing an order to the database and immediately calling 'kafkaTemplate.send()' in Java code; if Kafka fails, data is permanently out of sync.",
        "interviewTip": "Clearly explain the 'Dual-Write Problem' and contrast Log-Tailing (Debezium CDC) with Polling Publisher (scheduled database polls)."
    },
    # 12. API Gateway Pattern
    {
        "id": "ms-api-gateway",
        "title": "API Gateway Pattern (Unified Entrypoint & Governance)",
        "category": "Gateways & Integration",
        "badge": "Gateways & Integration",
        "whatIsIt": "Provides a single, unified entry point for all external clients into an internal microservice architecture. Handles cross-cutting concerns including SSL termination, authentication/authorization, rate limiting, routing, and request protocol transformation.",
        "visualDiagram": make_box("API Gateway Reverse Proxy Flow", [
            {"label": "External Clients", "desc": "Web, Mobile, 3rd-Party Partners", "color": "node-blue", "min_w": "160px"},
            {"label": "API Gateway (Apigee / SCG)", "desc": "SSL, Auth, RateLimit, SpikeArrest", "color": "node-purple", "min_w": "180px"},
            {"label": "Internal Service Mesh", "desc": "Private VPC / mTLS communication", "color": "node-orange", "min_w": "170px"},
            {"label": "Target Pods", "desc": "OrderService / CatalogService pods", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Without an API Gateway, external clients must connect directly to dozens of internal microservices, exposing private IPs, requiring clients to handle multiple authentication tokens, and multiplying round-trip latency over cellular networks. The Gateway acts as a reverse proxy. It terminates TLS, validates JWTs, executes rate limiting (Token Bucket), and proxies requests to internal services via low-latency VPC connections.",
        "complexPart": "Gateway as a Single Point of Failure (SPOF) and bottleneck: If developers embed heavy business transformation logic or synchronous multi-service orchestrations inside the gateway, the gateway becomes a CPU bottleneck and hard to maintain.",
        "keyPoints": [
            "Hides internal microservice network topology and IP addresses from the public internet.",
            "Centralizes authentication, rate limiting, CORS headers, and DDoS mitigation.",
            "Translates external protocols (REST / WebSocket) to internal protocols (gRPC).",
            "Must be deployed in high-availability multi-zone clusters behind global load balancers."
        ],
        "codeSnippet": """# Spring Cloud Gateway Declarative Routing & Security Filter
spring:
  cloud:
    gateway:
      routes:
      - id: order-service-route
        uri: lb://order-service
        predicates:
        - Path=/api/v1/orders/**
        filters:
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 50
            redis-rate-limiter.burstCapacity: 100
        - AddRequestHeader=X-Gateway-Verified, true""",
        "pitfall": "Writing domain business logic inside the API Gateway, transforming it into a monolithic bottleneck.",
        "interviewTip": "Cite Apigee X or Spring Cloud Gateway and list cross-cutting concerns: Auth, Rate Limiting, TLS, CORS, Routing."
    },
    # 13. BFF (Backend for Frontend)
    {
        "id": "ms-bff",
        "title": "Backend for Frontend (BFF) Pattern",
        "category": "Gateways & Integration",
        "badge": "Gateways & Integration",
        "whatIsIt": "Creates separate, specialized API gateways tailored specifically to the requirements of individual frontend user experiences (e.g., Mobile BFF vs Desktop Web BFF vs Third-Party Public API BFF).",
        "visualDiagram": make_box("BFF Client-Specialized Gateways", [
            {"label": "iOS & Android Clients", "desc": "Bandwidth-constrained, small screens", "color": "node-blue", "min_w": "170px"},
            {"label": "Mobile BFF Service", "desc": "Aggregates, strips fields & compresses", "color": "node-purple", "min_w": "180px"},
            {"label": "Desktop Web Client", "desc": "Rich broadband screen experience", "color": "node-orange", "min_w": "170px"},
            {"label": "Web BFF Service", "desc": "Returns rich analytics & heavy graphs", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "A single generic API Gateway creates a 'one-size-fits-none' problem: mobile apps over-fetch massive JSON payloads that drain battery and bandwidth, while web apps require multiple round-trips. With BFF, the mobile team maintains their own lightweight Node.js or Spring Boot gateway that aggregates 5 backend microservice calls into 1 compact, filtered JSON response designed for mobile screens.",
        "complexPart": "Code duplication between BFFs: Different BFFs can end up duplicating authentication, logging, or proxying logic. Solution: Share common libraries or place an infrastructure gateway (Envoy/Apigee) in front of all BFFs for baseline security and rate limiting.",
        "keyPoints": [
            "Tailors payload shape, caching, and aggregation directly to specific client form factors.",
            "Empowers frontend teams to iterate and deploy their BFF rapidly without backend team dependencies.",
            "Reduces mobile cellular network round trips by aggregating multiple backend calls on fast datacenter networks.",
            "BFFs must remain stateless orchestrators; domain data ownership belongs strictly to core microservices."
        ],
        "codeSnippet": """// Mobile BFF Aggregator Controller: Compact payload for mobile UI
@RestController
@RequestMapping("/mobile/v1/product-detail")
public class MobileProductDetailBff {
    private final CatalogClient catalog;
    private final ReviewsClient reviews;

    public MobileProductDetailBff(CatalogClient c, ReviewsClient r) { this.catalog = c; this.reviews = r; }

    @GetMapping("/{id}")
    public MobileProductDto getMobileView(@PathVariable String id) {
        // Parallel calls over datacenter network
        var product = catalog.getProduct(id);
        var rating = reviews.getAverageRating(id);
        // Return stripped, minimal DTO without heavy desktop descriptions
        return new MobileProductDto(product.id(), product.name(), product.price(), rating);
    }
}""",
        "pitfall": "Allowing BFFs to own persistent databases, turning them into microservices themselves.",
        "interviewTip": "Explain how BFF solves over-fetching and under-fetching for mobile devices on cellular networks."
    },
    # 14. Aggregator Pattern
    {
        "id": "ms-aggregator",
        "title": "Aggregator Pattern (Scatter-Gather Fan-Out & Joins)",
        "category": "Gateways & Integration",
        "badge": "Gateways & Integration",
        "whatIsIt": "Collects and aggregates data from multiple independent microservices to satisfy a composite client request. Executes parallel asynchronous fan-out calls (Scatter-Gather) and merges the resulting datasets into a single cohesive response.",
        "visualDiagram": make_box("Scatter-Gather Parallel Fan-Out", [
            {"label": "1. Client Request", "desc": "GET /dashboard/user/101", "color": "node-blue", "min_w": "160px"},
            {"label": "2. Parallel Scatter", "desc": "CompletableFuture.allOf() 3 calls", "color": "node-purple", "min_w": "180px"},
            {"label": "3. Target Services", "desc": "OrderService, ProfileService, PaymentService", "color": "node-orange", "min_w": "190px"},
            {"label": "4. Gather & Merge", "desc": "Assembles UserDashboardView DTO", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "In a microservices architecture, data is partitioned across multiple services. When a page requires data from 4 services, calling them sequentially introduces 4x network latency. The Aggregator pattern dispatches non-blocking parallel HTTP or gRPC requests using 'CompletableFuture.allOf()' or Project Reactor 'Mono.zip()'. It implements strict timeouts and graceful fallbacks if an individual service fails.",
        "complexPart": "Tail-latency amplification: If 1 of the 4 fan-out services experiences a P99 latency spike (e.g. 2000ms), the entire aggregated response stalls for 2000ms. Aggregators must enforce strict timeouts (e.g. 300ms) and return partial/cached fallbacks for non-essential sections.",
        "keyPoints": [
            "Reduces total request latency by executing independent microservice calls in parallel.",
            "Must be protected by strict timeouts and Circuit Breakers to prevent cascading thread stalls.",
            "Can return degraded partial responses (e.g. show user profile even if recommendations service timed out).",
            "In modern Java, easily implemented using 'CompletableFuture' or Java 21 Structured Concurrency."
        ],
        "codeSnippet": """public UserDashboardDto aggregateUserDashboard(String userId) {
    CompletableFuture<UserProfile> profileFuture = CompletableFuture.supplyAsync(
        () -> profileService.getProfile(userId), executor);
    CompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(
        () -> orderService.getRecentOrders(userId), executor);
    CompletableFuture<RewardBalance> rewardsFuture = CompletableFuture.supplyAsync(
        () -> loyaltyService.getRewards(userId), executor)
        .completeOnTimeout(RewardBalance.EMPTY, 300, TimeUnit.MILLISECONDS); // Graceful fallback!

    CompletableFuture.allOf(profileFuture, ordersFuture, rewardsFuture).join();

    return new UserDashboardDto(profileFuture.join(), ordersFuture.join(), rewardsFuture.join());
}""",
        "pitfall": "Executing fan-out calls sequentially instead of asynchronously in parallel, compounding latency linearly.",
        "interviewTip": "Emphasize tail-latency amplification and demonstrate how to use timeouts and fallback defaults with CompletableFuture."
    },
    # 15. Service Discovery & Registry
    {
        "id": "ms-service-registry",
        "title": "Service Discovery & Registry Pattern",
        "category": "Gateways & Integration",
        "badge": "Gateways & Integration",
        "whatIsIt": "Tracks the dynamic, ephemeral IP addresses and health status of microservice instances in autoscaling, containerized environments. Enables microservices to discover and communicate with each other without hardcoded hostnames.",
        "visualDiagram": make_box("Service Discovery Lifecycle", [
            {"label": "1. Pod Startup", "desc": "Registers IP:Port with Service Registry", "color": "node-blue", "min_w": "170px"},
            {"label": "2. Heartbeat Health", "desc": "Periodically sends heartbeat keep-alive", "color": "node-purple", "min_w": "180px"},
            {"label": "3. Consumer Lookup", "desc": "Client queries registry for 'order-service'", "color": "node-orange", "min_w": "180px"},
            {"label": "4. Client-Side Load Balance", "desc": "Client routes traffic directly to healthy pod", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "There are two discovery models: (1) Client-side Discovery (Spring Cloud Netflix Eureka / HashiCorp Consul), where clients query the registry, cache healthy instance IPs, and load balance locally using Spring Cloud LoadBalancer; (2) Server-side Discovery (Kubernetes Services & CoreDNS), where clients invoke a stable DNS name ('order-service.default.svc'), and K8s kube-proxy/IPVS routes traffic to healthy pods.",
        "complexPart": "Stale registry cache: If an instance crashes abruptly, there is a delay (e.g. 15-30s) before heartbeat expiration removes it from the registry. Client-side load balancers must implement retries and circuit breakers to handle routing to recently deceased nodes.",
        "keyPoints": [
            "Essential for autoscaling clouds where container instances are created and destroyed continuously.",
            "Kubernetes CoreDNS has largely replaced application-level Eureka registries in modern cloud deployments.",
            "Decouples client configurations from volatile physical IP addresses.",
            "Health checks must distinguish between startup warm-up and actual instance failures."
        ],
        "codeSnippet": """# Kubernetes CoreDNS: Native Server-Side Service Discovery
# No Eureka required; K8s DNS provides stable internal virtual hostname
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
  - port: 8080
    targetPort: 8080
---
# In Java client code, simply call the DNS name:
# http://order-service:8080/api/v1/orders""",
        "pitfall": "Hardcoding IP addresses or static hostnames in configuration files inside cloud environments.",
        "interviewTip": "Contrast Client-Side Discovery (Eureka) vs Server-Side Discovery (Kubernetes DNS / Kube-proxy)."
    },
    # 16. Circuit Breaker
    {
        "id": "ms-circuit-breaker",
        "title": "Circuit Breaker Pattern (Resilience4j State Machine)",
        "category": "Resilience & Fault Tolerance",
        "badge": "Resilience & Reliability",
        "whatIsIt": "Prevents cascading failures in distributed systems by wrapping outbound network calls. If the failure rate of downstream calls exceeds a threshold, the circuit trips to 'OPEN', instantly failing fast without consuming thread pools, and attempts recovery in 'HALF-OPEN' state.",
        "visualDiagram": make_box("Circuit Breaker State Machine", [
            {"label": "CLOSED State", "desc": "Normal operation: calls pass through", "color": "node-green", "min_w": "160px"},
            {"label": "Failure Threshold > 50%", "desc": "Trips circuit breaker to OPEN state", "color": "node-red", "min_w": "180px"},
            {"label": "OPEN State", "desc": "Fails fast immediately; calls fallback", "color": "node-orange", "min_w": "170px"},
            {"label": "HALF-OPEN State", "desc": "Tests probe calls after wait duration", "color": "node-blue", "min_w": "170px"}
        ]),
        "internalWorking": "Downstream network calls fail due to timeouts, crashes, or overload. Without a circuit breaker, hundreds of threads block waiting on socket timeouts, exhausting the caller's thread pool and taking down the entire upstream system (cascading failure). Resilience4j tracks call outcomes in a sliding window (count-based or time-based). When OPEN, requests bypass the network and execute fallback logic instantly.",
        "complexPart": "Tuning sliding windows and thresholds: If the threshold is too sensitive, brief network blips trip the breaker; if too lenient, thread pools starve before it opens. Typical production configuration: sliding window of 100 calls, 50% failure rate, wait duration in open state of 10-30 seconds.",
        "keyPoints": [
            "Stops cascading failures across distributed microservice dependency graphs.",
            "Resilience4j has replaced Netflix Hystrix as the standard Java/Spring Boot circuit breaker.",
            "Three states: CLOSED (normal), OPEN (fail-fast), HALF-OPEN (testing recovery).",
            "Always provide meaningful fallback logic (cached data, degraded response, queued event)."
        ],
        "codeSnippet": """@Service
public class PaymentClient {
    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
    public PaymentResponse executePayment(PaymentRequest req) {
        return restTemplate.postForObject("http://payment-service/pay", req, PaymentResponse.class);
    }

    // Fallback executed immediately when Circuit Breaker is OPEN or call fails
    public PaymentResponse paymentFallback(PaymentRequest req, Throwable t) {
        log.warn("Payment service unavailable. Falling back to queued processing", t);
        return new PaymentResponse("QUEUED_FOR_OFFLINE_PROCESSING", req.orderId());
    }
}""",
        "pitfall": "Missing fallback methods or having fallback methods that throw unhandled exceptions, crashing the calling thread anyway.",
        "interviewTip": "Cite Resilience4j, explain the 3 states (Closed, Open, Half-Open), and emphasize sliding-window failure rate calculations."
    },
    # 17. Bulkhead Pattern
    {
        "id": "ms-bulkhead",
        "title": "Bulkhead Pattern (Cascading Failure Isolation)",
        "category": "Resilience & Fault Tolerance",
        "badge": "Resilience & Reliability",
        "whatIsIt": "Isolates elements of a system into pools so that if one fails, the others continue to function. Inspired by the watertight bulkheads of a ship hull that prevent an entire ship from sinking if a single compartment is breached.",
        "visualDiagram": make_box("Bulkhead Thread Pool Partitioning", [
            {"label": "Tomcat Thread Pool", "desc": "Shared incoming request pool (200)", "color": "node-blue", "min_w": "170px"},
            {"label": "Bulkhead A: Payment Pool", "desc": "Max 20 threads isolated strictly", "color": "node-purple", "min_w": "180px"},
            {"label": "Bulkhead B: Catalog Pool", "desc": "Max 50 threads (Unimpacted by Payment)", "color": "node-green", "min_w": "190px"},
            {"label": "Downstream Payment Outage", "desc": "Only Payment pool saturates; Catalog healthy", "color": "node-red", "min_w": "190px"}
        ]),
        "internalWorking": "Without bulkheads, if downstream PaymentService hangs, all 200 Tomcat container threads quickly become blocked waiting for responses. When a regular user tries to browse the home page or catalog, Tomcat rejects the connection because no threads are available! Bulkhead divides execution into isolated thread pools or semaphores: Payment gets 20 threads max; Search gets 50. If Payment fails, it cannot starve the rest of the application.",
        "complexPart": "Semaphore vs ThreadPool Bulkhead: Semaphore Bulkhead does not create extra threads (zero CPU context-switching overhead) but blocks the calling thread up to the semaphore limit. ThreadPool Bulkhead uses dedicated thread queues, enabling true asynchronous isolation and timeouts, but consumes more memory and context-switch CPU.",
        "keyPoints": [
            "Prevents a single slow or degraded downstream dependency from monopolizing all container threads.",
            "Two implementations in Resilience4j: ThreadPoolBulkhead and SemaphoreBulkhead.",
            "Can be applied at the infrastructure level: isolating GKE node pools per critical service.",
            "Crucial for multi-tenant SaaS systems to isolate 'noisy neighbor' enterprise tenants."
        ],
        "codeSnippet": """# Resilience4j Bulkhead Configuration in application.yml
resilience4j:
  bulkhead:
    instances:
      paymentBulkhead:
        maxConcurrentCalls: 20
        maxWaitDuration: 100ms
  thread-pool-bulkhead:
    instances:
      catalogBulkhead:
        maxThreadPoolSize: 30
        coreThreadPoolSize: 10
        queueCapacity: 50""",
        "pitfall": "Relying on a single global thread pool for all remote network calls, allowing one slow vendor API to crash the entire application.",
        "interviewTip": "Use the ship hull analogy: compartment flooding is contained; explain Semaphore vs ThreadPool bulkhead tradeoffs."
    },
    # 18. Retry with Exponential Backoff
    {
        "id": "ms-retry-backoff",
        "title": "Retry with Exponential Backoff & Jitter",
        "category": "Resilience & Fault Tolerance",
        "badge": "Resilience & Reliability",
        "whatIsIt": "Transparently retries failed operations caused by transient network glitches. Uses exponential backoff to progressively increase delay between attempts and introduces random Jitter to prevent the Thundering Herd problem from overwhelming recovering services.",
        "visualDiagram": make_box("Exponential Backoff & Jitter", [
            {"label": "Attempt 1: Failed", "desc": "Network blip / HTTP 503", "color": "node-red", "min_w": "160px"},
            {"label": "Backoff 1: 100ms + Jitter", "desc": "Random delay prevents synchronization", "color": "node-purple", "min_w": "180px"},
            {"label": "Attempt 2: Failed", "desc": "Still recovering", "color": "node-orange", "min_w": "160px"},
            {"label": "Backoff 2: 400ms + Jitter", "desc": "Exponentially longer wait -> SUCCESS", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Transient network faults (TCP drops, connection resets, load balancer restarts) often resolve within milliseconds. Immediate retries (tight loop) amplify traffic against a struggling server. Exponential Backoff increases the wait time exponentially: 100ms -> 200ms -> 400ms -> 800ms. Full Jitter adds randomized noise ('random_between(0, min(cap, base * 2^attempt))') so thousands of retrying clients do not synchronize and DDOS the recovering service at identical intervals.",
        "complexPart": "Retrying Non-Idempotent Operations: Retrying an HTTP GET is safe. Retrying a non-idempotent HTTP POST (e.g. charging a credit card) without an Idempotency-Key header can cause double-charging! Retries MUST only be applied to idempotent operations or operations secured with unique transaction tokens.",
        "keyPoints": [
            "Only retry transient errors (HTTP 503, 504, 429, SocketTimeoutException); NEVER retry HTTP 400, 401, or 404.",
            "Always add Jitter: without jitter, synchronized retries cause the 'Thundering Herd' effect.",
            "Ensure the operation is strictly idempotent before applying automated retries.",
            "Pair with Circuit Breaker: when a Circuit Breaker opens, retries must be cancelled immediately."
        ],
        "codeSnippet": """@Retryable(
    retryFor = { SocketTimeoutException.class, HttpServerErrorException.class },
    noRetryFor = { HttpClientErrorException.class }, // Never retry 4xx!
    maxAttempts = 3,
    backoff = @Backoff(delay = 200, multiplier = 2.0, random = true) // Exponential + Jitter
)
public OrderDto fetchOrderDetails(String orderId) {
    return restTemplate.getForObject("http://order-service/orders/" + orderId, OrderDto.class);
}""",
        "pitfall": "Retrying non-idempotent POST requests without idempotency keys, resulting in duplicated orders and duplicate credit card charges.",
        "interviewTip": "Explain 'Jitter' clearly: without random jitter, all failed clients retry at the exact same millisecond, hammering the struggling server repeatedly."
    },
    # 19. Rate Limiting & Throttling
    {
        "id": "ms-rate-limiting",
        "title": "Rate Limiting & Throttling (Token Bucket & Leaky Bucket)",
        "category": "Resilience & Fault Tolerance",
        "badge": "Resilience & Reliability",
        "whatIsIt": "Controls the rate of traffic sent or received by a microservice or API Gateway. Protects services against malicious denial-of-service (DoS) attacks, automated scrapers, and unexpected traffic spikes by shedding load with HTTP 429 (Too Many Requests).",
        "visualDiagram": make_box("Token Bucket Rate Limiting", [
            {"label": "Incoming Traffic", "desc": "Requests arrive at API Gateway", "color": "node-blue", "min_w": "160px"},
            {"label": "Token Refill Engine", "desc": "Refills bucket at 100 tokens/sec", "color": "node-purple", "min_w": "170px"},
            {"label": "Bucket Capacity (Cap: 200)", "desc": "Takes 1 token per request", "color": "node-orange", "min_w": "170px"},
            {"label": "Out of Tokens?", "desc": "Sheds load: returns HTTP 429 Too Many Requests", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "Common algorithms include: (1) Token Bucket (allows bursts up to bucket capacity, tokens refilled at steady rate), (2) Leaky Bucket (smooths traffic to a constant egress rate), and (3) Sliding Window Log / Counter (accurate rate limiting without burst boundaries). In distributed architectures, rate limiting is evaluated in Redis via Lua scripts to ensure atomic token decrement across multiple gateway instances.",
        "complexPart": "Distributed Rate Limiting with Redis: Storing rate counters in a central Redis instance introduces network latency on every single API request. In high-throughput architectures, gateways use local in-memory token buckets combined with periodic asynchronous synchronization to Redis, or use Envoy token bucket filters.",
        "keyPoints": [
            "Returns standardized HTTP 429 status code with 'Retry-After' header.",
            "Token Bucket allows controlled traffic bursts; Leaky Bucket forces constant rate smoothing.",
            "Distributed rate limiting requires atomic Redis Lua scripts to avoid race conditions.",
            "Can be applied at multiple tiers: IP-based, User/API-Key-based, or Endpoint-based."
        ],
        "codeSnippet": """// Bucket4j In-Memory Token Bucket Rate Limiter
public class RateLimiterService {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String apiKey) {
        Bucket bucket = buckets.computeIfAbsent(apiKey, k -> Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofSeconds(1)))) // 100 rps
            .build());
        return bucket.tryConsume(1);
    }
}""",
        "pitfall": "Using a non-atomic read-modify-write pattern in Redis, which allows race conditions to bypass the rate limit under concurrency.",
        "interviewTip": "Contrast Token Bucket (bursts allowed) vs Leaky Bucket (smooth rate), and cite Redis Lua script atomicity."
    },
    # 20. Fallback & Graceful Degradation
    {
        "id": "ms-fallback",
        "title": "Fallback & Graceful Degradation Pattern",
        "category": "Resilience & Fault Tolerance",
        "badge": "Resilience & Reliability",
        "whatIsIt": "Ensures that when a microservice or external vendor dependency fails, the calling application delivers a degraded but functional user experience rather than throwing an ugly HTTP 500 Internal Server Error.",
        "visualDiagram": make_box("Graceful Degradation Fallback", [
            {"label": "User Requests Home Page", "desc": "Requires Personalized Recommendations", "color": "node-blue", "min_w": "170px"},
            {"label": "Recommendation Service Fails", "desc": "Timeout / Circuit Breaker OPEN", "color": "node-red", "min_w": "180px"},
            {"label": "Fallback Activation", "desc": "Fetches static 'Top 10 Bestsellers' from Cache", "color": "node-orange", "min_w": "190px"},
            {"label": "Seamless Degraded UI", "desc": "User sees recommendations, zero 500 error", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Graceful degradation classifies service features into Tier-1 (critical: authentication, checkout, core data) and Tier-2 (non-critical: recommendations, reviews, user avatars). If a Tier-2 service fails or times out, the calling service catches the exception or trips the circuit breaker and serves a fallback: (1) Stale cached data, (2) Default static data (e.g. popular items), (3) Stub responses, or (4) Silent omission from the UI.",
        "complexPart": "Stale Cache Invalidation & Poisoning: Fallbacks that pull from cache must verify that the cached data is safe to serve and not corrupted by previous transaction failures. Furthermore, fallback paths must be tested regularly in CI or chaos engineering drills (Chaos Monkey) to ensure they actually work when outages occur.",
        "keyPoints": [
            "Prevents a non-critical feature outage from breaking the primary business workflow.",
            "Differentiates mission-critical flows from optional/decorative data.",
            "Fallbacks can return cached values, static defaults, or trigger offline queue processing.",
            "Must be tested continuously using Chaos Engineering to prevent bit-rot in fallback code."
        ],
        "codeSnippet": """@Service
public class ProductService {
    private final RecommendationClient recClient;
    private final CacheManager cacheManager;

    @CircuitBreaker(name = "recService", fallbackMethod = "fallbackRecommendations")
    public List<ProductDto> getPersonalizedPicks(String userId) {
        return recClient.fetchPersonalizedPicks(userId);
    }

    // Graceful Fallback: Serve top popular items from local cache
    public List<ProductDto> fallbackRecommendations(String userId, Throwable t) {
        log.warn("ML Recommendation engine failed. Serving static top 10 fallback", t);
        return cacheManager.getCache("top_popular_products").get(List.class);
    }
}""",
        "pitfall": "Having a fallback method that itself makes another un-isolated network call, which also fails and blows up the request.",
        "interviewTip": "Categorize features into Tier-1 (Must Work) and Tier-2 (Can Degrade), showing interviewers you understand business impact."
    },
    # 21. Distributed Tracing
    {
        "id": "ms-distributed-tracing",
        "title": "Distributed Tracing (W3C traceparent, OTel & Jaeger)",
        "category": "Observability & Operations",
        "badge": "Observability & SRE",
        "whatIsIt": "Tracks and visualizes the end-to-end journey of a single user request as it traverses dozens of independent microservices, message queues, and databases. Propagates unique Trace IDs and Span IDs across network boundaries.",
        "visualDiagram": make_box("Distributed Trace Propagation", [
            {"label": "1. Ingress Request", "desc": "Generates W3C traceparent header", "color": "node-blue", "min_w": "170px"},
            {"label": "2. OrderService (Span 1)", "desc": "TraceId: 4bf92f35... SpanId: 00f067aa", "color": "node-purple", "min_w": "190px"},
            {"label": "3. Kafka Propagation", "desc": "Injects traceparent into Kafka Record Header", "color": "node-orange", "min_w": "190px"},
            {"label": "4. PaymentService (Span 2)", "desc": "Extracts traceparent -> Links child span", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "Distributed tracing models a request lifecycle as a Directed Acyclic Graph (DAG) of Spans. A 'Trace' represents the whole transaction; a 'Span' represents work done in a single service. The W3C 'traceparent' header ('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01') is injected into outbound HTTP and Kafka headers. OpenTelemetry collectors collect spans and send them to backends like Jaeger or Google Cloud Trace.",
        "complexPart": "Context propagation across async thread boundaries: When code dispatches tasks to thread pools ('CompletableFuture', '@Async'), the ThreadLocal holding the trace context is not propagated automatically to the worker thread unless using Micrometer Tracing or OpenTelemetry Java Agent auto-instrumentation.",
        "keyPoints": [
            "W3C Trace Context standardizes header format: 'traceparent: {version}-{traceId}-{spanId}-{flags}'.",
            "OpenTelemetry (OTel) is the vendor-neutral industry standard for telemetry collection.",
            "Crucial for identifying latency bottlenecks in complex distributed microservice graphs.",
            "Async threads and reactive streams require explicit context propagation instrumentation."
        ],
        "codeSnippet": """// Spring Boot 3 + Micrometer Tracing (Replaces Spring Cloud Sleuth)
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private final Tracer tracer;

    public OrderController(Tracer tracer) { this.tracer = tracer; }

    @PostMapping
    public OrderResponse createOrder(@RequestBody OrderRequest req) {
        // TraceId and SpanId are automatically included in MDC and logged!
        log.info("Processing order placement: traceId={}", 
            tracer.currentSpan().context().traceId());
        return orderService.process(req);
    }
}""",
        "pitfall": "Losing trace context across asynchronous threads or Kafka message boundaries, resulting in disconnected trace graphs.",
        "interviewTip": "Cite the W3C traceparent header standard and explain how OpenTelemetry and Micrometer Tracing propagate context in Spring Boot 3."
    },
    # 22. Centralized Logging & Correlation ID
    {
        "id": "ms-centralized-logging",
        "title": "Centralized Logging & Correlation ID (MDC Pattern)",
        "category": "Observability & Operations",
        "badge": "Observability & SRE",
        "whatIsIt": "Aggregates structured JSON logs from hundreds of distributed container instances into a centralized searchable datastore (Elasticsearch / Cloud Logging / Grafana Loki). Injects a Correlation ID into SLF4J MDC to group all logs generated by a single user transaction.",
        "visualDiagram": make_box("Centralized Logging with Correlation ID", [
            {"label": "1. Incoming Request", "desc": "Gateway generates X-Correlation-ID", "color": "node-blue", "min_w": "170px"},
            {"label": "2. SLF4J MDC Binding", "desc": "MDC.put(\"correlationId\", id) in thread", "color": "node-purple", "min_w": "180px"},
            {"label": "3. Structured JSON Logs", "desc": "Emitted to stdout with timestamp & trace", "color": "node-orange", "min_w": "180px"},
            {"label": "4. Log Collector Daemon", "desc": "FluentBit / Vector ships to OpenSearch", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Logging to local files inside ephemeral Kubernetes containers causes immediate data loss when pods restart. Services must stream structured JSON logs to 'stdout'. A daemonset agent (FluentBit / Vector) tails container log files and ships them to a central cluster. The Correlation ID is extracted from the incoming 'X-Correlation-ID' header, injected into SLF4J's Mapped Diagnostic Context (MDC), and automatically appended to every single log statement.",
        "complexPart": "MDC memory leaks and thread pooling: In container servers like Tomcat, threads are pooled and reused across multiple HTTP requests. If a request finishes and fails to invoke 'MDC.clear()', subsequent unrelated requests handled by that thread will inherit the previous request's Correlation ID, corrupting log audits!",
        "keyPoints": [
            "Always log in structured JSON format with uniform fields: timestamp, level, service, traceId, message.",
            "Always clear MDC inside a 'finally' block in a Servlet filter to prevent thread pool contamination.",
            "Never use multi-line stack traces or 'System.out.println': it breaks log ingestion parsers.",
            "Centralized logging enables single-query triage: searching by Correlation ID shows the full story across 10 services."
        ],
        "codeSnippet": """@Component
public class CorrelationIdFilter implements Filter {
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String MDC_KEY = "correlationId";

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) 
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        String corrId = Optional.ofNullable(httpReq.getHeader(CORRELATION_ID_HEADER))
                                .orElse(UUID.randomUUID().toString());

        MDC.put(MDC_KEY, corrId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove(MDC_KEY); // CRITICAL: Prevent thread pool pollution!
        }
    }
}""",
        "pitfall": "Forgetting to call 'MDC.clear()' in a finally block, causing pooled threads to log the wrong correlation IDs on subsequent requests.",
        "interviewTip": "Mention SLF4J MDC, structured JSON logging, and the critical importance of clearing MDC in a finally block."
    },
    # 23. Health Check API Pattern
    {
        "id": "ms-health-check-api",
        "title": "Health Check API (Liveness & Readiness Probes)",
        "category": "Observability & Operations",
        "badge": "Observability & SRE",
        "whatIsIt": "Exposes dedicated HTTP endpoints that reveal whether a microservice is running, ready to accept traffic, or completely broken. Enables Kubernetes and load balancers to automatically restart dead containers and route traffic away from unready instances.",
        "visualDiagram": make_box("Kubernetes Health Probes Flow", [
            {"label": "startupProbe", "desc": "Waits 45s for Spring Boot & Flyway init", "color": "node-blue", "min_w": "170px"},
            {"label": "livenessProbe", "desc": "Checks JVM deadlock; restarts if failed", "color": "node-purple", "min_w": "170px"},
            {"label": "readinessProbe", "desc": "Checks DB & Kafka; sheds traffic if down", "color": "node-orange", "min_w": "180px"},
            {"label": "Zero-Downtime Traffic", "desc": "Traffic routed only to fully ready pods", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Spring Boot Actuator natively exposes health indicators at '/actuator/health'. In Kubernetes, probes have distinct semantic responsibilities: (1) 'startupProbe' gives slow-starting applications time to boot without being prematurely killed; (2) 'livenessProbe' verifies the JVM is not stuck in a deadlock or infinite loop (if it fails, K8s kills and restarts the pod); (3) 'readinessProbe' verifies external dependencies (DB, Kafka) are connected (if it fails, K8s removes the pod from the Service endpoints without restarting it).",
        "complexPart": "Cascading death spirals caused by readiness checks: If the primary PostgreSQL database suffers a brief spike, all 50 microservice instances fail their readiness checks simultaneously. K8s removes all pods from service load balancers, causing a 100% complete outage of the entire website!",
        "keyPoints": [
            "Spring Boot 3 natively partitions health into '/actuator/health/liveness' and '/actuator/health/readiness'.",
            "Liveness probe failure triggers a pod restart (kill + recreate container).",
            "Readiness probe failure stops routing traffic to the pod (does NOT restart the container).",
            "Be cautious about checking external databases in liveness probes; liveness should only check internal JVM health."
        ],
        "codeSnippet": """# Kubernetes Pod Spec mapping to Spring Boot Actuator Probes
containers:
- name: order-service
  image: order-service:v1
  ports:
  - containerPort: 8080
  startupProbe:
    httpGet:
      path: /actuator/health/liveness
      port: 8080
    failureThreshold: 30
    periodSeconds: 2
  livenessProbe:
    httpGet:
      path: /actuator/health/liveness
      port: 8080
    periodSeconds: 10
  readinessProbe:
    httpGet:
      path: /actuator/health/readiness
      port: 8080
    periodSeconds: 5""",
        "pitfall": "Checking external database connectivity inside a livenessProbe; if the DB has a brief outage, K8s restarts all your healthy app pods simultaneously.",
        "interviewTip": "Crucial distinction: Liveness kills and restarts the container; Readiness removes the pod from load balancer endpoints without restarting."
    },
    # 24. Externalized Configuration
    {
        "id": "ms-externalized-config",
        "title": "Externalized Configuration Pattern",
        "category": "Observability & Operations",
        "badge": "Observability & SRE",
        "whatIsIt": "Externalizes all application configuration (database URLs, thread pool sizes, feature toggles, credentials) out of the application source code and Docker container image, allowing the identical binary image to run across Dev, Staging, and Production environments without recompilation.",
        "visualDiagram": make_box("Externalized Config Injection", [
            {"label": "Immutable Docker Image", "desc": "Same binary deployed to Dev, Stage, Prod", "color": "node-blue", "min_w": "180px"},
            {"label": "K8s ConfigMap", "desc": "Injects non-sensitive environment variables", "color": "node-purple", "min_w": "180px"},
            {"label": "Secret Manager / Vault", "desc": "Injects encrypted database passwords", "color": "node-orange", "min_w": "180px"},
            {"label": "Spring Environment", "desc": "Resolves properties in strict priority order", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Adheres to the Twelve-Factor App methodology ('Factor III: Config'). A container image must be built once and promoted through environments unchanged. Spring Boot evaluates property sources in a strict 17-level hierarchy (command-line arguments -> OS environment variables -> application-{profile}.yml -> application.yml). Non-sensitive configs are mounted from Kubernetes ConfigMaps; sensitive secrets are injected via External Secrets Operator from Google Cloud Secret Manager or HashiCorp Vault.",
        "complexPart": "Dynamic hot-reloading: Changing a configuration property in production without restarting pods. Spring Cloud '@RefreshScope' enables reloading beans dynamically, but mutable state or open connection pools (HikariCP) can deadlock or fail to re-initialize unless restarted gracefully.",
        "keyPoints": [
            "Enforces Twelve-Factor App Principle III: Store configuration in the environment.",
            "Enables deploying the identical container artifact across all testing and production environments.",
            "Spring Boot property resolution order: OS environment variables override application.yml files.",
            "Sensitive credentials must NEVER be stored in plain text ConfigMaps; use Secret Manager / Vault."
        ],
        "codeSnippet": """# Kubernetes Deployment injecting externalized config & secrets
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: order-service
        image: order-service:sha-7b3a9c1
        envFrom:
        - configMapRef:
            name: order-service-config # Non-sensitive props
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: order-db-secrets   # Encrypted secret from Secret Manager
              key: password""",
        "pitfall": "Baking environment-specific configurations into the Docker container image, forcing image rebuilds for different environments.",
        "interviewTip": "Cite the Twelve-Factor App methodology (Config stored in environment) and explain Spring Boot's property override hierarchy."
    },
    # 25. Sidecar & Service Mesh
    {
        "id": "ms-sidecar-service-mesh",
        "title": "Sidecar & Service Mesh Pattern (Envoy & Istio)",
        "category": "Observability & Operations",
        "badge": "Observability & SRE",
        "whatIsIt": "Deploys a helper container (sidecar) alongside the primary application container in the same Kubernetes Pod, sharing the network namespace. A Service Mesh (Istio / Linkerd) injects Envoy proxy sidecars to handle mTLS encryption, traffic routing, retries, and telemetry transparently without touching application code.",
        "visualDiagram": make_box("Service Mesh Envoy Sidecar", [
            {"label": "App Container (Order)", "desc": "Java 17 Spring Boot (Business only)", "color": "node-blue", "min_w": "170px"},
            {"label": "Localhost Network Share", "desc": "Shares Pod loopback & iptables", "color": "node-purple", "min_w": "170px"},
            {"label": "Envoy Sidecar Proxy", "desc": "Handles mTLS, retries, OTel metrics", "color": "node-orange", "min_w": "170px"},
            {"label": "Mesh Control Plane (Istiod)", "desc": "Configures traffic rules & certs globally", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "In a Service Mesh, an Envoy sidecar proxy is automatically injected into every pod. Iptables rules redirect all inbound and outbound network packets through the local Envoy sidecar. Envoy handles mutual TLS (mTLS) with zero-trust cryptographic certificates, executes canary traffic splitting (90% v1 / 10% v2), and reports distributed traces to Jaeger. The application developer writes pure business logic and does not need to configure SSL or client-side retry libraries.",
        "complexPart": "Resource overhead and debugging latency: In a cluster with 500 pods, 500 Envoy sidecars consume gigabytes of memory and CPU. Additionally, network hops double (App -> Envoy -> Network -> Remote Envoy -> Remote App), adding 1-3ms of P99 latency. Teams must balance zero-trust security benefits against resource costs.",
        "keyPoints": [
            "Moves cross-cutting networking concerns out of application code into infrastructure.",
            "Enforces zero-trust mutual TLS (mTLS) encryption across all inter-service communication.",
            "Enables progressive canary delivery and traffic splitting (e.g., 95% stable / 5% canary).",
            "Adds CPU/memory overhead and microsecond latency hops for every HTTP call."
        ],
        "codeSnippet": """# Istio VirtualService: Canary Traffic Splitting via Envoy Sidecar
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90 # 90% traffic to stable version
    - destination:
        host: order-service
        subset: v2
      weight: 10 # 10% canary traffic to new version""",
        "pitfall": "Adopting a full-blown Service Mesh for a small cluster with 4 services, adding massive operational overhead with zero architectural benefit.",
        "interviewTip": "Explain how the Sidecar pattern works via shared Linux network namespaces (localhost loopback), and describe Istio's mTLS and traffic splitting."
    }
]

output_path = "js/data/microservices-patterns-data.js"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("""/**
 * microservices-patterns-data.js
 * Comprehensive Microservices Architecture & Distributed System Design Patterns
 * Includes: 25 Core Patterns across Decomposition, Data/Sagas, Gateways, Resilience, and SRE/Observability.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

""")
    f.write(f"window.REVISION_APP_DATA.MICROSERVICES_PATTERNS_CATEGORIES = {json.dumps(categories, indent=2)};\n\n")
    f.write(f"window.REVISION_APP_DATA.MICROSERVICES_PATTERNS = {json.dumps(patterns, indent=2)};\n")

print(f"Generated {len(patterns)} Microservices Design Patterns in {output_path} successfully!")
