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
            <div class="diagram-header-label">📐 Visual Pattern Flow: {title}</div>
            <div class="flow-chain">
{joined}
            </div>
          </div>"""

categories = [
    {"id": "creational", "title": "🏗️ Creational Patterns", "count": 5},
    {"id": "structural", "title": "🧩 Structural Patterns", "count": 7},
    {"id": "behavioral", "title": "🔄 Behavioral Patterns", "count": 11},
    {"id": "modern", "title": "⚡ Modern Java Idioms", "count": 1}
]

patterns = [
    # 1. Singleton
    {
        "id": "pat-singleton",
        "title": "Singleton Pattern (Thread-Safe DCL, Enum & Bill Pugh)",
        "category": "Creational Patterns",
        "badge": "GoF Creational",
        "whatIsIt": "Ensures a class has only one instance while providing a global access point to this instance. In high-concurrency Java systems, implementation requires strict guarantees against race conditions, reflection attacks, serialization tampering, and instruction reordering.",
        "visualDiagram": make_box("Thread-Safe Double-Checked Locking (DCL)", [
            {"label": "1. First Check", "desc": "instance == null without lock", "color": "node-blue", "min_w": "160px"},
            {"label": "2. Synchronized Block", "desc": "Lock Singleton.class monitor", "color": "node-purple", "min_w": "170px"},
            {"label": "3. Second Check", "desc": "Confirm null inside lock", "color": "node-orange", "min_w": "160px"},
            {"label": "4. Volatile Write", "desc": "Prevent instruction reorder", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Without the 'volatile' keyword, JVM JIT compilers can reorder object allocation: (1) allocate memory, (2) assign pointer to reference variable, (3) call constructor. A concurrent thread executing the first check would observe a non-null reference before field initialization completes, reading half-initialized state! Alternatively, the 'Bill Pugh' holder leverages the JVM ClassLoader lock to guarantee lazy, thread-safe initialization without synchronized overhead, while 'Enum Singleton' provides native JVM serialization and reflection protection.",
        "complexPart": "Reflection and Serialization attacks: Using 'Constructor.setAccessible(true)' allows instantiating private constructors unless an exception is thrown on duplicate instantiation. In standard serialization, 'readObject()' bypasses constructors and instantiates a new object unless 'readResolve()' is implemented. Enums are immune to both attacks by JVM specification.",
        "keyPoints": [
            "Always declare the instance field 'volatile' in Double-Checked Locking to enforce memory barrier write-before-read.",
            "Enum Singleton is Joshua Bloch's recommended approach: 100% thread-safe, reflection-immune, serialization-safe.",
            "Bill Pugh Static Inner Class holder combines zero-synchronization performance with true lazy-loading initialization.",
            "Avoid Singletons for components requiring stateful lifecycle testing; prefer Spring singleton-scoped beans with dependency injection."
        ],
        "codeSnippet": """// 1. Double-Checked Locking with volatile
public class SafeDclSingleton {
    private static volatile SafeDclSingleton instance;
    private SafeDclSingleton() {
        if (instance != null) throw new IllegalStateException("Already initialized");
    }
    public static SafeDclSingleton getInstance() {
        if (instance == null) {
            synchronized (SafeDclSingleton.class) {
                if (instance == null) {
                    instance = new SafeDclSingleton();
                }
            }
        }
        return instance;
    }
}

// 2. Bill Pugh ClassHolder (Lazy + Zero Sync Overhead)
public class BillPughSingleton {
    private BillPughSingleton() {}
    private static class Holder {
        private static final BillPughSingleton INSTANCE = new BillPughSingleton();
    }
    public static BillPughSingleton getInstance() {
        return Holder.INSTANCE;
    }
}

// 3. Enum Singleton (Effective Java Recommendation)
public enum EnumSingleton {
    INSTANCE;
    public void executeBusinessLogic() { /* 100% safe */ }
}""",
        "pitfall": "Forgetting 'volatile' in DCL, which causes other threads to see a non-null reference to a half-constructed object during JIT instruction reordering.",
        "interviewTip": "Explain all 3 approaches: DCL with volatile, Bill Pugh static inner class, and Enum singleton. Mention reflection bypass ('setAccessible') and serialization bypass ('readResolve')."
    },
    # 2. Factory Method
    {
        "id": "pat-factory-method",
        "title": "Factory Method Pattern (Polymorphic Instantiation)",
        "category": "Creational Patterns",
        "badge": "GoF Creational",
        "whatIsIt": "Defines an interface or abstract method for creating an object, but lets subclasses decide which specific class to instantiate. Decouples client code from concrete implementation classes, adhering strictly to the Open/Closed Principle.",
        "visualDiagram": make_box("Factory Method Polymorphic Creation", [
            {"label": "Client Code", "desc": "Invokes notification.notifyUser()", "color": "node-blue", "min_w": "160px"},
            {"label": "NotificationFactory", "desc": "createNotification() abstract", "color": "node-purple", "min_w": "170px"},
            {"label": "Concrete Factories", "desc": "EmailFactory / SmsFactory / Push", "color": "node-orange", "min_w": "180px"},
            {"label": "Product Hierarchy", "desc": "Instantiates target concrete product", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Client code interacts solely with the abstract Creator and Product interfaces. When business requirements demand a new product (e.g., SlackNotification), the developer implements a new 'SlackNotificationFactory' without touching or recompiling existing factory logic or client callers. In Spring Framework, 'FactoryBean<T>' and 'BeanFactory.getBean()' represent standard Factory Method implementations.",
        "complexPart": "Class explosion: Adding a single new product requires adding both a concrete Product class and a concrete Creator class. If the product family grows rapidly, developers often mix Factory Method with Reflection, ServiceLoader, or Spring Map-based injection ('Map<String, NotificationService>') to avoid subclass sprawl.",
        "keyPoints": [
            "Encapsulates object creation logic, isolating volatile constructor parameters.",
            "Complies with Open/Closed Principle: introduces new products without modifying existing client code.",
            "In Spring Boot, autowiring a 'Map<String, PaymentStrategy>' acts as a modern dynamic factory method pattern.",
            "Differs from Simple Factory: Simple Factory uses a static switch/if-else statement; Factory Method relies on inheritance/polymorphism."
        ],
        "codeSnippet": """public interface Notification {
    void notifyUser(String message);
}
public class EmailNotification implements Notification {
    public void notifyUser(String msg) { System.out.println("Email: " + msg); }
}
public class SmsNotification implements Notification {
    public void notifyUser(String msg) { System.out.println("SMS: " + msg); }
}

public abstract class NotificationFactory {
    public abstract Notification createNotification();
    public void send(String msg) {
        Notification notification = createNotification();
        notification.notifyUser(msg);
    }
}
public class EmailNotificationFactory extends NotificationFactory {
    public Notification createNotification() { return new EmailNotification(); }
}
public class SmsNotificationFactory extends NotificationFactory {
    public Notification createNotification() { return new SmsNotification(); }
}""",
        "pitfall": "Creating a static class with 20 'if-else' statements and calling it 'Factory Method'. That is a Simple Factory and violates the Open/Closed Principle.",
        "interviewTip": "Highlight how Spring Framework uses Factory Method via 'FactoryBean<T>' and how Map-based dependency injection in Spring Boot replaces verbose subclass factories."
    },
    # 3. Abstract Factory
    {
        "id": "pat-abstract-factory",
        "title": "Abstract Factory Pattern (Families of Related Objects)",
        "category": "Creational Patterns",
        "badge": "GoF Creational",
        "whatIsIt": "Provides an interface for creating families of related or dependent objects without specifying their concrete classes. Ensures that product variants created by a client are mutually compatible and never accidentally mixed.",
        "visualDiagram": make_box("Abstract Factory Families", [
            {"label": "GUIFactory (Abstract)", "desc": "createButton() & createCheckbox()", "color": "node-blue", "min_w": "170px"},
            {"label": "DarkThemeFactory", "desc": "Creates DarkButton & DarkCheckbox", "color": "node-purple", "min_w": "180px"},
            {"label": "LightThemeFactory", "desc": "Creates LightButton & LightCheckbox", "color": "node-orange", "min_w": "180px"},
            {"label": "Client Component", "desc": "Renders UI without knowing theme type", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "The abstract factory declares creation methods for each distinct product category in the family. Each concrete factory implements these methods to produce matching product variants (e.g., WindowsButton + WindowsCheckbox vs MacButton + MacCheckbox). The client is passed an AbstractFactory instance at startup, guaranteeing it cannot accidentally pair a DarkButton with a LightCheckbox.",
        "complexPart": "Extending the factory interface: If a new product category is added (e.g., 'createScrollBar()'), EVERY existing concrete factory subclass in the system must be updated and recompiled, violating the Interface Segregation Principle unless default interface methods or generic factory registries are used.",
        "keyPoints": [
            "Guarantees consistency across an entire family of related objects.",
            "Isolates concrete classes from client code; switching product families requires changing only 1 factory instance.",
            "Commonly used in cross-platform UI toolkits, multi-cloud storage abstractions (AWS S3 vs GCP Cloud Storage vs Azure Blob), and database driver providers.",
            "Difference from Factory Method: Factory Method creates 1 product via inheritance; Abstract Factory creates families of products via composition."
        ],
        "codeSnippet": """// Product Family Interfaces
public interface Button { void render(); }
public interface Checkbox { void render(); }

// Concrete Product Family 1: Mac
public class MacButton implements Button { public void render() { System.out.println("Mac Button"); } }
public class MacCheckbox implements Checkbox { public void render() { System.out.println("Mac Checkbox"); } }

// Concrete Product Family 2: Windows
public class WindowsButton implements Button { public void render() { System.out.println("Win Button"); } }
public class WindowsCheckbox implements Checkbox { public void render() { System.out.println("Win Checkbox"); } }

// Abstract Factory
public interface UIFactory {
    Button createButton();
    Checkbox createCheckbox();
}
public class MacUIFactory implements UIFactory {
    public Button createButton() { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}
public class WindowsUIFactory implements UIFactory {
    public Button createButton() { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}""",
        "pitfall": "Using Abstract Factory when products do not belong to cohesive families. If products are independent, prefer independent Factory Methods or Builders.",
        "interviewTip": "Contrast Abstract Factory with Factory Method clearly: Abstract Factory is composed of multiple Factory Methods working on a cohesive product family."
    },
    # 4. Builder Pattern
    {
        "id": "pat-builder",
        "title": "Builder Pattern (Fluent API, Immutability & Step Builder)",
        "category": "Creational Patterns",
        "badge": "GoF Creational",
        "whatIsIt": "Separates the construction of a complex object from its representation, allowing the same construction process to create different representations. Solves the telescoping constructor problem while enforcing object immutability and compile-time validation.",
        "visualDiagram": make_box("Builder Fluent Construction", [
            {"label": "1. Initialize Builder", "desc": "Order.builder().id(\"ORD-1\")", "color": "node-blue", "min_w": "160px"},
            {"label": "2. Stepwise Attributes", "desc": ".customer(\"Alice\").item(\"Laptop\")", "color": "node-purple", "min_w": "180px"},
            {"label": "3. Validation Checks", "desc": "Verify required non-null fields", "color": "node-orange", "min_w": "170px"},
            {"label": "4. Immutable Object", "desc": "new Order(this) with final fields", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Constructors with many parameters suffer from accidental argument inversion (e.g., passing two consecutive Strings in wrong order). Setters introduce unwanted mutability and expose partially initialized objects to concurrent threads. The Builder pattern provides a static inner class with fluent setter-like methods that return 'this', followed by a final 'build()' method that validates invariants and constructs an unmodifiable, fully initialized object.",
        "complexPart": "Step-Builder (Wizard) pattern: When fields must be set in a strict sequential order (e.g., step 1: customer -> step 2: address -> step 3: payment -> build), standard builders cannot enforce this at compile time. Step-Builder uses a series of chained interface types to enforce that the developer cannot invoke 'payment()' before 'address()' is set.",
        "keyPoints": [
            "Eliminates telescoping constructors with 8+ parameters.",
            "Produces 100% immutable objects with all 'final' fields and defensive copies of collections.",
            "Enables centralized cross-field validation rules inside the 'build()' method before instantiation.",
            "In modern Java, compare with Java 16+ Records (immutable data carriers) and Lombok '@Builder'."
        ],
        "codeSnippet": """public final class HttpClientConfig {
    private final String url;
    private final int timeoutMs;
    private final boolean followRedirects;
    private final Map<String, String> defaultHeaders;

    private HttpClientConfig(Builder builder) {
        this.url = Objects.requireNonNull(builder.url, "URL cannot be null");
        this.timeoutMs = builder.timeoutMs;
        this.followRedirects = builder.followRedirects;
        this.defaultHeaders = Map.copyOf(builder.headers); // Defensive copy
    }

    public static class Builder {
        private String url;
        private int timeoutMs = 5000; // sensible default
        private boolean followRedirects = true;
        private Map<String, String> headers = new HashMap<>();

        public Builder url(String url) { this.url = url; return this; }
        public Builder timeout(int ms) { this.timeoutMs = ms; return this; }
        public Builder header(String k, String v) { this.headers.put(k, v); return this; }
        public HttpClientConfig build() {
            if (timeoutMs < 0) throw new IllegalArgumentException("Timeout must be > 0");
            return new HttpClientConfig(this);
        }
    }
}""",
        "pitfall": "Permitting mutable collection references to escape the builder without defensive copying ('Map.copyOf()' or 'Collections.unmodifiableMap()').",
        "interviewTip": "Explain how Builder achieves immutability compared to JavaBean getters/setters, and how it differs from Java Records."
    },
    # 5. Prototype Pattern
    {
        "id": "pat-prototype",
        "title": "Prototype Pattern (Deep vs Shallow Cloning & Copy Constructors)",
        "category": "Creational Patterns",
        "badge": "GoF Creational",
        "whatIsIt": "Specifies the kinds of objects to create using a prototypical instance, and creates new objects by copying this prototype. Useful when object creation is expensive (database hydration, complex calculations) or when the exact concrete class is unknown at runtime.",
        "visualDiagram": make_box("Prototype Cloning Flow", [
            {"label": "Original Prototype", "desc": "Expensive config/graph hydrated", "color": "node-blue", "min_w": "170px"},
            {"label": "clone() / Copy Ctor", "desc": "Allocates duplicate memory block", "color": "node-purple", "min_w": "170px"},
            {"label": "Deep Copy Traversal", "desc": "Recursively clones inner objects", "color": "node-orange", "min_w": "180px"},
            {"label": "Cloned Instance", "desc": "Independent mutable copy ready", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Java's native 'Cloneable' interface and 'Object.clone()' perform a shallow field-by-field memory copy. If the prototype contains reference fields (e.g. lists, child objects), both the original and cloned instances point to the identical child object in heap! Modifying the clone mutates the original prototype. Senior engineers avoid 'Cloneable' and instead use Copy Constructors, Copy Factories, or serialization-based deep cloning.",
        "complexPart": "The Cloneable broken contract: 'Cloneable' is a marker interface that contains no methods; 'clone()' is protected on Object. Calling 'super.clone()' throws 'CloneNotSupportedException' if Cloneable is omitted, and bypasses constructors completely, potentially violating constructor invariants.",
        "keyPoints": [
            "Shallow copy copies primitive values and object references; deep copy recursively copies the entire object graph.",
            "Prefer Copy Constructors ('public User(User other)') or static copy methods over 'Object.clone()'.",
            "Used in game engines (spawning monster prototypes), document templates, and complex state caching.",
            "Deep cloning circular references requires an identity map (tracking already-cloned objects) to prevent infinite loops."
        ],
        "codeSnippet": """public class ServerConfiguration {
    private String host;
    private int port;
    private List<String> securityPolicies;

    public ServerConfiguration(String host, int port, List<String> policies) {
        this.host = host;
        this.port = port;
        this.securityPolicies = new ArrayList<>(policies);
    }

    // Recommended Copy Constructor for Deep Copy Prototype
    public ServerConfiguration(ServerConfiguration prototype) {
        this.host = prototype.host;
        this.port = prototype.port;
        // Deep copy of mutable list to prevent shared state mutations
        this.securityPolicies = new ArrayList<>(prototype.securityPolicies);
    }

    public ServerConfiguration cloneConfig() {
        return new ServerConfiguration(this);
    }
}""",
        "pitfall": "Relying on 'super.clone()' without deep-copying nested mutable objects, causing silent cross-instance state pollution bugs in production.",
        "interviewTip": "Quote Joshua Bloch (Effective Java Item 13): 'Extending Cloneable is largely broken in Java; prefer Copy Constructors or Copy Factories.'"
    },
    # 6. Adapter Pattern
    {
        "id": "pat-adapter",
        "title": "Adapter Pattern (Interface Adaptation & Wrappers)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Converts the interface of a class into another interface that clients expect. Adapter lets classes work together that could not otherwise because of incompatible interfaces, bridging third-party or legacy code with modern system contracts.",
        "visualDiagram": make_box("Adapter Translation Flow", [
            {"label": "Client Interface", "desc": "PaymentProcessor.pay(amount)", "color": "node-blue", "min_w": "160px"},
            {"label": "PaymentAdapter", "desc": "Implements PaymentProcessor", "color": "node-purple", "min_w": "170px"},
            {"label": "Adaptee (Legacy/3rd-Party)", "desc": "StripeApi.makeCharge(cents, curr)", "color": "node-orange", "min_w": "180px"},
            {"label": "Payment Success", "desc": "Converts response to client model", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "There are two forms: Class Adapter (uses multiple inheritance/extends adaptee and implements target) and Object Adapter (uses composition, holding a private reference to the adaptee). In Java, Object Adapter is universally preferred because it allows adapting any subclass of the adaptee. JDK examples include 'Arrays.asList()' (adapts an array to a List) and 'InputStreamReader' (adapts an InputStream to a Reader).",
        "complexPart": "Two-Way Adapters: When an adapter must satisfy both client interfaces simultaneously, bidirectional mapping and exception translation can become brittle. Additionally, wrapping large APIs can incur performance overhead if data conversion between object models requires deep copying.",
        "keyPoints": [
            "Enables legacy or third-party SDK integration without altering client contracts.",
            "Object Adapter leverages composition over inheritance (favor composition).",
            "Translates data formats, method names, parameter orders, and checked exceptions.",
            "Differs from Decorator (Decorator adds new behavior; Adapter changes the interface without adding behavior)."
        ],
        "codeSnippet": """// Target Interface expected by our modern application
public interface ModernPaymentGateway {
    void processPayment(String customerId, double amountInDollars);
}

// Incompatible Third-Party Adaptee SDK
public class LegacyStripeSdk {
    public void executeCharge(long amountInCents, String stripeToken) {
        System.out.println("Charged cents: " + amountInCents + " on token: " + stripeToken);
    }
}

// Object Adapter
public class StripePaymentAdapter implements ModernPaymentGateway {
    private final LegacyStripeSdk stripeSdk;

    public StripePaymentAdapter(LegacyStripeSdk stripeSdk) {
        this.stripeSdk = stripeSdk;
    }

    @Override
    public void processPayment(String customerId, double amountInDollars) {
        long cents = (long) (amountInDollars * 100);
        String token = lookupStripeToken(customerId);
        stripeSdk.executeCharge(cents, token);
    }
    private String lookupStripeToken(String id) { return "tok_" + id; }
}""",
        "pitfall": "Adding new business logic inside the Adapter. An adapter should strictly translate protocols and types; business logic belongs in the domain layer.",
        "interviewTip": "Mention JDK examples like 'Arrays.asList()' and 'InputStreamReader(InputStream)'. Clearly contrast Adapter (interface change) vs Decorator (behavior extension)."
    },
    # 7. Bridge Pattern
    {
        "id": "pat-bridge",
        "title": "Bridge Pattern (Decoupling Abstraction from Implementation)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Decouples an abstraction from its implementation so that the two can vary independently. Prevents a Cartesian product explosion of subclasses when orthogonal dimensions of variation exist (e.g., UI shapes vs rendering engines, or notifications vs delivery channels).",
        "visualDiagram": make_box("Bridge Orthogonal Separation", [
            {"label": "Abstraction Hierarchy", "desc": "Message (AlertMessage, OrderMessage)", "color": "node-blue", "min_w": "180px"},
            {"label": "Bridge Reference", "desc": "protected MessageSender sender;", "color": "node-purple", "min_w": "170px"},
            {"label": "Implementor Hierarchy", "desc": "MessageSender (EmailSender, SmsSender)", "color": "node-orange", "min_w": "180px"},
            {"label": "Orthogonal Growth", "desc": "M abstractions * N implementors = M+N classes", "color": "node-green", "min_w": "190px"}
        ]),
        "internalWorking": "Without Bridge, combining 3 types of messages with 3 delivery channels requires 3 * 3 = 9 concrete classes (UrgentEmailMessage, UrgentSmsMessage, etc.). With Bridge, the Abstraction ('Message') holds a composition reference to the Implementor ('MessageSender'). Adding a new message type requires 1 subclass; adding a new channel requires 1 implementor. Complexity drops from M * N to M + N classes.",
        "complexPart": "Identifying the abstraction vs implementor boundary: Developers often confuse Bridge with Strategy. While structurally similar, Strategy is behavioral (swapping algorithms at runtime), whereas Bridge is structural (organizing orthogonal class hierarchies during architecture design).",
        "keyPoints": [
            "Replaces multi-inheritance combinatorial explosion with clean composition.",
            "JDBC is the quintessential Java Bridge: 'DriverManager' / 'Connection' is the abstraction; DB vendor drivers ('ojdbc', 'mysql-connector') are the implementors.",
            "Allows swapping or testing implementations independently from high-level business abstractions.",
            "Enforces Open/Closed Principle along multiple axes of variation simultaneously."
        ],
        "codeSnippet": """// Implementor Hierarchy
public interface MessageSender {
    void sendMessage(String header, String body);
}
public class EmailMessageSender implements MessageSender {
    public void sendMessage(String h, String b) { System.out.println("Email -> " + h + ": " + b); }
}
public class SmsMessageSender implements MessageSender {
    public void sendMessage(String h, String b) { System.out.println("SMS -> " + h + ": " + b); }
}

// Abstraction Hierarchy
public abstract class NotificationMessage {
    protected final MessageSender sender; // The Bridge
    protected NotificationMessage(MessageSender sender) { this.sender = sender; }
    public abstract void send();
}
public class UrgentAlertMessage extends NotificationMessage {
    private final String alert;
    public UrgentAlertMessage(MessageSender sender, String alert) {
        super(sender);
        this.alert = alert;
    }
    public void send() { sender.sendMessage("CRITICAL ALERT", alert); }
}""",
        "pitfall": "Over-engineering simple hierarchies where orthogonal dimensions do not actually exist or will never expand.",
        "interviewTip": "Cite JDBC as the ultimate production example: java.sql.Connection is the Abstraction, Oracle/Postgres JDBC drivers are Implementors."
    },
    # 8. Composite Pattern
    {
        "id": "pat-composite",
        "title": "Composite Pattern (Tree Hierarchies & Uniform Invocation)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Composes objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects (leaf nodes) and compositions of objects (composite nodes) uniformly through a common interface.",
        "visualDiagram": make_box("Composite Tree Execution", [
            {"label": "Component Interface", "desc": "FileSystemItem.calculateSize()", "color": "node-blue", "min_w": "160px"},
            {"label": "Leaf Node", "desc": "File: returns file byte size directly", "color": "node-purple", "min_w": "170px"},
            {"label": "Composite Node", "desc": "Directory: iterates child items", "color": "node-orange", "min_w": "170px"},
            {"label": "Recursive Rollup", "desc": "Returns sum of all nested children", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Both single items ('File') and containers ('Directory') implement the identical interface ('FileSystemItem'). When the client calls 'calculateSize()', it does not check 'if (item instanceof Directory)'. If it is a leaf, it returns its size; if it is a composite, it recursively invokes 'calculateSize()' across its internal 'List<FileSystemItem>' and aggregates the result.",
        "complexPart": "Transparency vs Type Safety trade-off: Should child management methods ('add()', 'remove()', 'getChildren()') be declared in the base Component interface (Transparency) or only in the Composite class (Type Safety)? If placed in Component, Leaf nodes must throw UnsupportedOperationException. If placed only in Composite, clients must cast to Composite, losing uniform treatment.",
        "keyPoints": [
            "Simplifies client code by eliminating conditional branch checks ('if-instanceof').",
            "Naturally models hierarchical structures: organizational charts, DOM trees, menu bars, product bundles.",
            "Can be paired with the Visitor pattern to perform complex operations across heterogeneous trees without modifying node classes.",
            "Cycles in the tree will trigger StackOverflowError during recursive calls; circular graph detection must be enforced."
        ],
        "codeSnippet": """public interface FileSystemNode {
    long getSizeInBytes();
    void print(String indent);
}

// Leaf
public class FileNode implements FileSystemNode {
    private final String name;
    private final long size;
    public FileNode(String name, long size) { this.name = name; this.size = size; }
    public long getSizeInBytes() { return size; }
    public void print(String indent) { System.out.println(indent + "- File: " + name + " (" + size + "B)"); }
}

// Composite
public class DirectoryNode implements FileSystemNode {
    private final String name;
    private final List<FileSystemNode> children = new ArrayList<>();
    public DirectoryNode(String name) { this.name = name; }
    public void add(FileSystemNode node) { children.add(node); }
    public long getSizeInBytes() {
        return children.stream().mapToLong(FileSystemNode::getSizeInBytes).sum();
    }
    public void print(String indent) {
        System.out.println(indent + "+ Directory: " + name);
        children.forEach(c -> c.print(indent + "  "));
    }
}""",
        "pitfall": "Permitting cyclic references in parent-child links, which causes infinite recursive loops during aggregation calls.",
        "interviewTip": "Discuss the fundamental GoF trade-off: Transparency (declaring add/remove in Component) vs Safety (declaring add/remove only in Composite)."
    },
    # 9. Decorator Pattern
    {
        "id": "pat-decorator",
        "title": "Decorator Pattern (Dynamic Behavior Wrapping & Java I/O)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality, avoiding class explosion caused by static inheritance combinations.",
        "visualDiagram": make_box("Decorator Layered Wrapping", [
            {"label": "1. Base Component", "desc": "SimpleCoffee (cost: $2)", "color": "node-blue", "min_w": "160px"},
            {"label": "2. MilkDecorator", "desc": "Wraps base: +$0.50 milk", "color": "node-purple", "min_w": "170px"},
            {"label": "3. CaramelDecorator", "desc": "Wraps milk: +$0.75 caramel", "color": "node-orange", "min_w": "170px"},
            {"label": "4. Final Invocation", "desc": "Total cost: $3.25 returned", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "A Decorator implements the identical interface as the target component AND holds a private reference to a wrapped component of that interface. When the client invokes a method, the decorator delegates to the wrapped instance and adds its own behavior before or after. Because decorators share the same interface, they can be stacked indefinitely at runtime: 'new GzipDecorator(new EncryptionDecorator(new FileDataSource()))'.",
        "complexPart": "Identity and type checking: The outer decorator is not an instance of the inner wrapped class. If client code uses 'instanceof' or reflection to check internal properties, it fails. Java's 'java.io' streams ('new BufferedReader(new InputStreamReader(new FileInputStream()))') are the classic Decorator implementation in the JDK.",
        "keyPoints": [
            "Adheres to the Open/Closed Principle: extends behavior without modifying existing classes.",
            "Eliminates exponential subclassing: 3 add-ons without decorator require 2^3 = 8 subclasses.",
            "Order of wrapping matters: 'Encrypt(Compress(data))' is radically different from 'Compress(Encrypt(data))'.",
            "Differs from Adapter (changes interface) and Proxy (controls access; Decorator enhances behavior)."
        ],
        "codeSnippet": """public interface DataSource {
    void writeData(String data);
    String readData();
}

public class FileDataSource implements DataSource {
    public void writeData(String data) { System.out.println("Writing raw: " + data); }
    public String readData() { return "raw data"; }
}

public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrappee;
    public DataSourceDecorator(DataSource source) { this.wrappee = source; }
    public void writeData(String data) { wrappee.writeData(data); }
    public String readData() { return wrappee.readData(); }
}

public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) { super(source); }
    public void writeData(String data) {
        String encrypted = Base64.getEncoder().encodeToString(data.getBytes());
        super.writeData(encrypted);
    }
}""",
        "pitfall": "Creating fragile decorators where removal of an intermediate decorator in the middle of a runtime stack is impossible without rebuilding the wrapper chain.",
        "interviewTip": "Use 'java.io' (BufferedReader, InputStreamReader, FileInputStream) as the primary JDK example. Contrast clearly with Proxy and Adapter."
    },
    # 10. Facade Pattern
    {
        "id": "pat-facade",
        "title": "Facade Pattern (Simplified Unified Subsystem Interface)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Provides a unified, simplified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use, reducing coupling between clients and complex internal subsystems.",
        "visualDiagram": make_box("Facade Subsystem Simplification", [
            {"label": "Client Layer", "desc": "orderFacade.checkout(cartId)", "color": "node-blue", "min_w": "160px"},
            {"label": "OrderFacade", "desc": "Orchestrates complex subsystems", "color": "node-purple", "min_w": "180px"},
            {"label": "Internal Subsystems", "desc": "Inventory, Payment, Tax, Shipping", "color": "node-orange", "min_w": "180px"},
            {"label": "Clean Output", "desc": "OrderConfirmation DTO returned", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Complex subsystems often involve dozens of classes with rigid initialization orders, configuration flags, and dependency graphs. A Facade exposes a handful of ergonomic methods tailored to common client use cases. The subsystem classes remain accessible for advanced clients who need fine-grained control; the facade does not hide them, it just provides a convenient default doorway.",
        "complexPart": "God Object antipattern: Facades can easily bloat into massive 'God Objects' if developers route every subsystem interaction through a single monolithic class. Keep facades focused on cohesive workflows, or split into multiple domain-specific facades.",
        "keyPoints": [
            "Promotes loose coupling by shielding clients from volatile subsystem classes.",
            "Spring's 'JdbcTemplate' is a classic Facade: shields developers from raw 'Connection', 'Statement', 'ResultSet', and SQLException handling.",
            "Does not encapsulate or seal the subsystem: advanced callers can still access lower-level classes directly.",
            "Differs from Adapter: Adapter bridges two existing incompatible interfaces; Facade defines a new, simpler interface over multiple classes."
        ],
        "codeSnippet": """public class CheckoutFacade {
    private final InventoryService inventory;
    private final PaymentGateway payment;
    private final ShippingService shipping;
    private final NotificationService notification;

    public CheckoutFacade(InventoryService i, PaymentGateway p, ShippingService s, NotificationService n) {
        this.inventory = i; this.payment = p; this.shipping = s; this.notification = n;
    }

    public OrderReceipt placeOrder(String userId, String itemId, int qty, String cardToken) {
        if (!inventory.checkStock(itemId, qty)) throw new OutOfStockException();
        inventory.reserve(itemId, qty);
        String txId = payment.charge(cardToken, 99.99);
        String trackingNum = shipping.schedulePickup(itemId, qty, userId);
        notification.sendReceipt(userId, txId);
        return new OrderReceipt(txId, trackingNum);
    }
}""",
        "pitfall": "Turning the Facade into an all-knowing God Object that violates the Single Responsibility Principle.",
        "interviewTip": "Cite Spring's 'JdbcTemplate' or 'RestTemplate' as standard Java facades that simplify multi-step native APIs."
    },
    # 11. Flyweight Pattern
    {
        "id": "pat-flyweight",
        "title": "Flyweight Pattern (Intrinsic State Sharing & Memory Optimization)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Minimizes memory usage by sharing as much data as possible with other similar objects. Splits object state into Intrinsic (immutable, shared across all instances) and Extrinsic (mutable, passed into methods from context).",
        "visualDiagram": make_box("Flyweight State Partitioning", [
            {"label": "100,000 Forest Trees", "desc": "Avoids 100k full object allocations", "color": "node-blue", "min_w": "170px"},
            {"label": "Intrinsic State (Shared)", "desc": "TreeType: Texture, Mesh, Color", "color": "node-purple", "min_w": "170px"},
            {"label": "FlyweightFactory", "desc": "Returns cached TreeType from Map", "color": "node-orange", "min_w": "170px"},
            {"label": "Extrinsic State (Context)", "desc": "X, Y coordinates passed at render", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Intrinsic state is constant, immutable, and context-independent; it is stored inside the Flyweight object. Extrinsic state changes with the caller's context and is passed as method arguments rather than stored in fields. Java's 'String.intern()' and 'Integer.valueOf()' (-128 to 127 caching) are prime JDK flyweights.",
        "complexPart": "Thread-safety of intrinsic state: Because thousands of threads may share a single Flyweight instance simultaneously, all intrinsic fields must be strictly 'final' and immutable. Any mutable shared field causes catastrophic race conditions.",
        "keyPoints": [
            "Drastically slashes JVM heap consumption when managing millions of similar objects.",
            "JDK Integer cache (-128 to 127) and String Pool are built-in Flyweight implementations.",
            "Requires careful division: Intrinsic = internal, immutable; Extrinsic = external, contextual.",
            "Flyweight Factory uses a concurrent map to guarantee identity sharing."
        ],
        "codeSnippet": """// Intrinsic State (Shared, Immutable)
public final class TreeType {
    private final String name;
    private final byte[] texture; // Heavy 50KB asset
    public TreeType(String name, byte[] texture) { this.name = name; this.texture = texture; }
    public void draw(int x, int y) { // Extrinsic state passed into method
        System.out.println("Draw " + name + " at coords (" + x + "," + y + ")");
    }
}

// Flyweight Factory
public class TreeFactory {
    private static final Map<String, TreeType> cache = new ConcurrentHashMap<>();
    public static TreeType getTreeType(String name, byte[] texture) {
        return cache.computeIfAbsent(name, n -> new TreeType(n, texture));
    }
}""",
        "pitfall": "Accidentally modifying intrinsic state inside a Flyweight, which corrupts the state across all callers in the entire application.",
        "interviewTip": "Point directly to 'Integer.valueOf(int)' caching -128 to 127 and the String Constant Pool as standard Java Flyweights."
    },
    # 12. Proxy Pattern
    {
        "id": "pat-proxy",
        "title": "Proxy Pattern (JDK Dynamic Proxy, CGLIB & Lazy Loading)",
        "category": "Structural Patterns",
        "badge": "GoF Structural",
        "whatIsIt": "Provides a surrogate or placeholder for another object to control access to it. Enables lazy initialization, security checks, distributed access (RMI/gRPC stubs), logging, and Spring AOP cross-cutting transaction interceptors.",
        "visualDiagram": make_box("Proxy Interception Architecture", [
            {"label": "Caller / Client", "desc": "Calls orderService.createOrder()", "color": "node-blue", "min_w": "160px"},
            {"label": "Proxy Interceptor", "desc": "JDK Proxy or CGLIB subclass", "color": "node-purple", "min_w": "170px"},
            {"label": "Cross-Cutting Logic", "desc": "Begin TX, Security, Caching check", "color": "node-orange", "min_w": "180px"},
            {"label": "Target Object", "desc": "Executes real business method", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "A Proxy implements the target's interface (JDK Dynamic Proxy) or subclasses the target class (CGLIB / ByteBuddy). When a method is called, the proxy intercepts execution. It can verify permissions (Protection Proxy), load an expensive object from disk on first call (Virtual/Lazy Proxy), or open and commit a database transaction (Spring '@Transactional' proxy).",
        "complexPart": "The Self-Invocation Pitfall: When a method inside a proxy-wrapped class calls another method in the SAME class ('this.internalMethod()'), the call bypasses the proxy and executes directly against 'this'. Any '@Transactional' or '@Cacheable' annotations on the inner method are silently ignored!",
        "keyPoints": [
            "Forms the foundational architecture of Spring AOP, Hibernate lazy-loading proxies, and security filters.",
            "JDK Dynamic Proxy requires interfaces; CGLIB/ByteBuddy subclasses concrete classes (cannot proxy 'final' classes or methods).",
            "Virtual Proxy defers expensive object creation until actual method invocation.",
            "Differs from Decorator: Decorator enhances behavior; Proxy controls access, lifecycle, and security."
        ],
        "codeSnippet": """public interface DocumentService {
    void viewDocument(String user, String docId);
}

// Target
public class RealDocumentService implements DocumentService {
    public void viewDocument(String user, String docId) {
        System.out.println("Rendering secret document: " + docId);
    }
}

// Protection Proxy
public class SecurityDocumentProxy implements DocumentService {
    private final DocumentService realService;
    public SecurityDocumentProxy(DocumentService realService) { this.realService = realService; }

    public void viewDocument(String user, String docId) {
        if (!"ADMIN".equals(user)) {
            throw new SecurityException("Access Denied for user: " + user);
        }
        realService.viewDocument(user, docId);
    }
}""",
        "pitfall": "Self-invocation bypass: Calling a method within the same class bypasses Spring proxy interceptors.",
        "interviewTip": "Explain how Spring Boot uses JDK Dynamic Proxies (for interfaces) vs CGLIB (for concrete classes) and mention the self-invocation trap."
    },
    # 13. Chain of Responsibility
    {
        "id": "pat-chain-of-responsibility",
        "title": "Chain of Responsibility (Pipelines & Filter Chains)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Avoids coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chains the receiving objects and passes the request along the chain until an object handles it or the end is reached.",
        "visualDiagram": make_box("Chain of Responsibility Pipeline", [
            {"label": "Incoming Request", "desc": "HTTP Request / Order Payload", "color": "node-blue", "min_w": "160px"},
            {"label": "AuthFilter", "desc": "Validates JWT -> calls next.handle()", "color": "node-purple", "min_w": "180px"},
            {"label": "RateLimitFilter", "desc": "Checks TokenBucket -> next.handle()", "color": "node-orange", "min_w": "180px"},
            {"label": "SanitizerFilter", "desc": "Strips XSS/SQLi -> passes to controller", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Each handler holds a reference to the 'next' handler in the chain. When a request arrives, the handler evaluates if it can or should process it. It can terminate the chain early (short-circuiting on validation failure) or execute pre-processing, forward the call to 'next.handle(request)', and execute post-processing on the return trip. Servlet Filters, Spring Security 'FilterChain', and Netty ChannelPipelines use this pattern.",
        "complexPart": "Unhandled requests and performance latency: If no handler in the chain processes the request, it can silently fall off the end of the chain without any error unless a default tail-handler is registered. Long chains also accumulate stack frame depth and latency.",
        "keyPoints": [
            "Decouples request senders from concrete receiver types.",
            "Allows adding, reordering, or removing handlers dynamically at runtime without altering existing handlers.",
            "Standard implementation in Servlet 'FilterChain.doFilter()' and Spring Security.",
            "Supports short-circuiting: any link can immediately reject the request and abort the pipeline."
        ],
        "codeSnippet": """public abstract class OrderValidationHandler {
    private OrderValidationHandler next;
    public OrderValidationHandler setNext(OrderValidationHandler next) {
        this.next = next;
        return next;
    }
    public void handle(Order order) {
        if (next != null) next.handle(order);
    }
}

public class BalanceCheckHandler extends OrderValidationHandler {
    public void handle(Order order) {
        if (order.getBalance() < order.getTotal()) {
            throw new IllegalStateException("Insufficient funds");
        }
        super.handle(order);
    }
}
public class InventoryCheckHandler extends OrderValidationHandler {
    public void handle(Order order) {
        if (!order.isItemInStock()) {
            throw new IllegalStateException("Item out of stock");
        }
        super.handle(order);
    }
}""",
        "pitfall": "Unintentionally breaking the chain by forgetting to invoke 'next.handle()' in a custom handler subclass.",
        "interviewTip": "Cite javax.servlet.Filter and Spring Security FilterChain as ubiquitous real-world Java examples."
    },
    # 14. Command Pattern
    {
        "id": "pat-command",
        "title": "Command Pattern (Encapsulating Requests & Undo/Redo)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Encapsulates a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations. Decouples the invoker from the receiver that performs the action.",
        "visualDiagram": make_box("Command Invocation & Undo", [
            {"label": "Client UI / Trigger", "desc": "Invokes command.execute()", "color": "node-blue", "min_w": "160px"},
            {"label": "Command Object", "desc": "Encapsulates Receiver + Parameters", "color": "node-purple", "min_w": "180px"},
            {"label": "History Stack", "desc": "Pushes command onto undo stack", "color": "node-orange", "min_w": "170px"},
            {"label": "Receiver Execution", "desc": "TextEditor.insertText(offset, text)", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "The Command interface declares 'execute()' and optional 'undo()'. Concrete command classes hold a reference to the business Receiver and all arguments needed to perform the operation. An Invoker (e.g. a UI button or task queue) executes the command without knowing the receiver's concrete type. In Java, 'Runnable' and 'Callable' are foundational command objects executed by ThreadPoolExecutor.",
        "complexPart": "State restoration in undo operations: Storing previous state can consume massive memory if commands store full object snapshots. Developers must record delta changes or inverse operations rather than entire domain graphs.",
        "keyPoints": [
            "Parameterizes objects with operations; enables queuing, scheduling, and asynchronous execution.",
            "Provides clean foundation for Undo/Redo operations and transaction logs.",
            "JDK 'java.lang.Runnable' is the most ubiquitous command interface in Java.",
            "Pairs cleanly with Memento pattern for complex state restoration."
        ],
        "codeSnippet": """public interface Command {
    void execute();
    void undo();
}

public class InsertTextCommand implements Command {
    private final Document document;
    private final String textToInsert;
    private final int position;

    public InsertTextCommand(Document doc, String text, int pos) {
        this.document = doc; this.textToInsert = text; this.position = pos;
    }
    public void execute() { document.insert(position, textToInsert); }
    public void undo() { document.delete(position, textToInsert.length()); }
}

public class CommandHistory {
    private final Deque<Command> history = new ArrayDeque<>();
    public void executeCommand(Command c) {
        c.execute();
        history.push(c);
    }
    public void undoLast() {
        if (!history.isEmpty()) history.pop().undo();
    }
}""",
        "pitfall": "Creating proliferation of tiny command classes for every minor variation instead of parameterizing commands or using lambdas.",
        "interviewTip": "Point to 'Runnable', 'Callable', and database transactional redo logs as prime Command pattern implementations."
    },
    # 15. Interpreter Pattern
    {
        "id": "pat-interpreter",
        "title": "Interpreter Pattern (Domain Grammars, SpEL & Rule Engines)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Given a language, defines a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language. Used in domain-specific languages (DSLs), SQL parsers, and Spring Expression Language (SpEL).",
        "visualDiagram": make_box("Interpreter AST Evaluation", [
            {"label": "Expression: (A AND B) OR C", "desc": "Domain DSL input string", "color": "node-blue", "min_w": "170px"},
            {"label": "Abstract Syntax Tree (AST)", "desc": "OrExpression(AndExpression, Terminal)", "color": "node-purple", "min_w": "190px"},
            {"label": "Context Evaluation", "desc": "Passes runtime variable bindings", "color": "node-orange", "min_w": "170px"},
            {"label": "Result: Boolean", "desc": "Evaluates to true / false", "color": "node-green", "min_w": "160px"}
        ]),
        "internalWorking": "Every grammar rule is represented by a class. Terminal expressions evaluate simple tokens (e.g. literals, variables); Non-Terminal expressions combine child expressions (e.g. AndExpression, OrExpression, AddExpression). The client builds an Abstract Syntax Tree (AST) representing the expression and invokes 'interpret(Context)' at the root node, which recursively evaluates children.",
        "complexPart": "Grammar complexity explosion: The Interpreter pattern works well for tiny, simple grammars (e.g., cron expressions, boolean criteria filters). For complex grammars, maintaining dozens of AST classes becomes unmanageable; parser generators like ANTLR or JavaCC are preferred.",
        "keyPoints": [
            "Models domain rules as composable expression objects.",
            "Spring Expression Language ('SpEL') uses an AST-based Interpreter to parse '#{user.age > 18}'.",
            "Context object holds global state and variable mappings during tree traversal.",
            "Best suited for small, specialized domain-specific rule evaluations."
        ],
        "codeSnippet": """public interface Expression {
    boolean interpret(Map<String, Boolean> context);
}

public class VariableExpression implements Expression {
    private final String name;
    public VariableExpression(String name) { this.name = name; }
    public boolean interpret(Map<String, Boolean> ctx) {
        return ctx.getOrDefault(name, false);
    }
}

public class AndExpression implements Expression {
    private final Expression left, right;
    public AndExpression(Expression l, Expression r) { this.left = l; this.right = r; }
    public boolean interpret(Map<String, Boolean> ctx) {
        return left.interpret(ctx) && right.interpret(ctx);
    }
}""",
        "pitfall": "Using the Interpreter pattern for large programming languages; it produces unmaintainable AST class explosions.",
        "interviewTip": "Mention Spring Expression Language (SpEL) and java.util.regex.Pattern as enterprise Java examples."
    },
    # 16. Iterator Pattern
    {
        "id": "pat-iterator",
        "title": "Iterator Pattern (Traversal Decoupling, Fail-Fast vs Fail-Safe)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation (array, linked list, tree, hash bucket). Underpins Java's 'Iterable<T>' and 'enhanced for-loop'.",
        "visualDiagram": make_box("Iterator Traversal Mechanics", [
            {"label": "Aggregate Collection", "desc": "ArrayList / LinkedList / BTree", "color": "node-blue", "min_w": "160px"},
            {"label": "iterator() Factory", "desc": "Instantiates stateful cursor pointer", "color": "node-purple", "min_w": "170px"},
            {"label": "hasNext() & next()", "desc": "Validates modCount == expectedModCount", "color": "node-orange", "min_w": "190px"},
            {"label": "Uniform Traversal", "desc": "Client loops without knowing inner data", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "An Iterator encapsulates traversal cursor state (current position, bounds checks) separately from the collection itself, allowing multiple independent traversals to run concurrently on the same collection. Java iterators track 'modCount': if a thread mutates the collection structure directly while iterating, 'expectedModCount != modCount' and it throws 'ConcurrentModificationException' (Fail-Fast).",
        "complexPart": "Fail-Fast vs Fail-Safe semantics: Standard collections (ArrayList, HashMap) are fail-fast. Concurrent collections ('CopyOnWriteArrayList', 'ConcurrentHashMap') are fail-safe/weakly-consistent, iterating over a snapshot or internal bucket chain without throwing ConcurrentModificationException.",
        "keyPoints": [
            "Encapsulates internal traversal data structures away from client consumers.",
            "Enables the Java enhanced for-loop ('for (T item : list)').",
            "Multiple iterators can traverse the same aggregate independently without cross-interference.",
            "Always remove items using 'iterator.remove()' rather than 'collection.remove()' to prevent ConcurrentModificationException."
        ],
        "codeSnippet": """public class CustomItemRepository implements Iterable<String> {
    private final String[] items = {"Order", "Invoice", "Payment"};

    @Override
    public Iterator<String> iterator() {
        return new Iterator<>() {
            private int cursor = 0;
            public boolean hasNext() { return cursor < items.length; }
            public String next() {
                if (!hasNext()) throw new NoSuchElementException();
                return items[cursor++];
            }
        };
    }
}""",
        "pitfall": "Modifying a collection via 'list.remove(item)' inside a for-each loop, triggering ConcurrentModificationException.",
        "interviewTip": "Explain how Java's enhanced for-loop compiles down to an Iterator, and explain the 'modCount' fail-fast mechanism."
    },
    # 17. Mediator Pattern
    {
        "id": "pat-mediator",
        "title": "Mediator Pattern (Hub-and-Spoke Decoupling & Event Bus)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Defines an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently.",
        "visualDiagram": make_box("Mediator Hub Architecture", [
            {"label": "Component A (ChatUser)", "desc": "Sends message to mediator only", "color": "node-blue", "min_w": "170px"},
            {"label": "ChatRoomMediator", "desc": "Central hub dispatches to colleagues", "color": "node-purple", "min_w": "180px"},
            {"label": "Component B (Colleague)", "desc": "Receives message without knowing A", "color": "node-orange", "min_w": "180px"},
            {"label": "Component C (Colleague)", "desc": "Zero direct point-to-point links", "color": "node-green", "min_w": "180px"}
        ]),
        "internalWorking": "Without a Mediator, N components communicate in a chaotic mesh with O(N^2) direct dependencies. The Mediator replaces this with a clean hub-and-spoke topology of O(N) connections. Components (Colleagues) only know the Mediator and send events to it. The Mediator coordinates routing, filtering, and notification. Guava's 'EventBus' and Spring's 'ApplicationEventPublisher' are modern mediators.",
        "complexPart": "Mediator central point of failure and complexity: If the mediator accumulates too much orchestration logic, it degrades into an unmaintainable God Class that is difficult to test and debug.",
        "keyPoints": [
            "Replaces complex N-to-N relationships with clean 1-to-N hub-and-spoke communication.",
            "Colleague classes are highly reusable because they do not couple to other colleagues.",
            "Enterprise message brokers and event buses act as architectural mediators.",
            "Differs from Observer: Observer establishes 1-to-many dynamic pub-sub; Mediator coordinates complex multi-directional workflows between peers."
        ],
        "codeSnippet": """public interface ChatMediator {
    void sendMessage(String msg, User sender);
    void addUser(User user);
}

public class ChatRoom implements ChatMediator {
    private final List<User> users = new ArrayList<>();
    public void addUser(User user) { users.add(user); }
    public void sendMessage(String msg, User sender) {
        users.stream()
             .filter(u -> u != sender)
             .forEach(u -> u.receive(msg));
    }
}

public abstract class User {
    protected final ChatMediator mediator;
    protected final String name;
    public User(ChatMediator med, String name) { this.mediator = med; this.name = name; }
    public abstract void send(String msg);
    public abstract void receive(String msg);
}""",
        "pitfall": "Allowing the Mediator to evolve into an omnipotent God Object holding business state.",
        "interviewTip": "Contrast Mediator (centralized coordination) with Observer (distributed notifications)."
    },
    # 18. Memento Pattern
    {
        "id": "pat-memento",
        "title": "Memento Pattern (State Snapshots, Rollbacks & Encapsulation)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Without violating encapsulation, captures and externalizes an object's internal state so that the object can be restored to this state later. Essential for multi-level undo/redo systems, game save states, and transactional rollbacks.",
        "visualDiagram": make_box("Memento State Snapshot", [
            {"label": "Originator (Editor)", "desc": "Current state: \"Version 1\"", "color": "node-blue", "min_w": "160px"},
            {"label": "createMemento()", "desc": "Packages state in opaque Memento", "color": "node-purple", "min_w": "170px"},
            {"label": "Caretaker (History)", "desc": "Stores Memento in Stack/Queue", "color": "node-orange", "min_w": "170px"},
            {"label": "restore(memento)", "desc": "Reverts Originator state safely", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Three actors collaborate: (1) Originator holds current business state and produces snapshots; (2) Memento is an immutable token holding the snapshot data; (3) Caretaker (e.g. HistoryManager) stores mementos without inspecting or mutating their contents. To ensure strict encapsulation, Memento getters are package-private or accessible only to the Originator.",
        "complexPart": "Memory footprint: Storing full snapshots on every state change can rapidly exhaust JVM heap. In production, systems store diffs/deltas or enforce maximum history depth limits ('CircularFifoQueue') to bound memory usage.",
        "keyPoints": [
            "Preserves encapsulation: Caretaker cannot tamper with or inspect internal snapshot state.",
            "Simplifies the Originator: it does not need to manage history or rollback stacks.",
            "Can be paired with Java serialization for disk-persisted checkpoints.",
            "Always make Memento classes immutable to prevent accidental external modification."
        ],
        "codeSnippet": """// Memento Token (Immutable)
public record EditorMemento(String text, int cursorPosition) {}

// Originator
public class TextEditor {
    private String text = "";
    private int cursor = 0;

    public void write(String newText) { this.text += newText; this.cursor += newText.length(); }
    public EditorMemento save() { return new EditorMemento(text, cursor); }
    public void restore(EditorMemento memento) {
        this.text = memento.text();
        this.cursor = memento.cursorPosition();
    }
}

// Caretaker
public class HistoryCaretaker {
    private final Deque<EditorMemento> history = new ArrayDeque<>();
    public void push(EditorMemento m) { history.push(m); }
    public EditorMemento pop() { return history.pop(); }
}""",
        "pitfall": "Exposing mutable public setters on the Memento object, allowing Caretaker to corrupt the snapshot.",
        "interviewTip": "Emphasize encapsulation: The Caretaker holds the memento as a black box; only the Originator can unpack it."
    },
    # 19. Observer Pattern
    {
        "id": "pat-observer",
        "title": "Observer Pattern (Pub-Sub Decoupling & Reactive Streams)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically. Forms the bedrock of event-driven architectures, GUI listeners, and Reactive Streams (Project Reactor / RxJava).",
        "visualDiagram": make_box("Observer Notification Broadcast", [
            {"label": "Subject / Observable", "desc": "State changes: Price updated", "color": "node-blue", "min_w": "160px"},
            {"label": "notifyObservers()", "desc": "Iterates registered listener set", "color": "node-purple", "min_w": "170px"},
            {"label": "Observer A (Mobile)", "desc": "update(price) invoked", "color": "node-orange", "min_w": "160px"},
            {"label": "Observer B (Analytics)", "desc": "update(price) invoked", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "The Subject maintains a registry ('List<Observer>'). When internal state mutates, it iterates the registry and invokes 'update(event)' on each observer. Observers can register or unregister dynamically at runtime. In Spring Boot, '@EventListener' and 'ApplicationEventPublisher' implement this pattern cleanly without interface coupling.",
        "complexPart": "Lapsed Listener memory leak: If an observer registers with a long-lived Subject but fails to unregister when discarded, the Subject's strong reference prevents the observer from being garbage-collected! Fix: Use 'WeakReference' or explicit lifecycle unregistration.",
        "keyPoints": [
            "Supports broadcast communication with zero coupling between subject and concrete observers.",
            "Beware of the Lapsed Listener problem: use WeakReferences or explicit deregistrations.",
            "Java 9+ 'Flow' API (Publisher/Subscriber) represents the modern reactive evolution of Observer.",
            "Notifications can be Push (subject sends full payload) or Pull (subject sends notification; observer requests data)."
        ],
        "codeSnippet": """public interface StockObserver {
    void onPriceChanged(String symbol, double newPrice);
}

public class StockTicker {
    private final List<StockObserver> observers = new CopyOnWriteArrayList<>();
    public void register(StockObserver o) { observers.add(o); }
    public void unregister(StockObserver o) { observers.remove(o); }

    public void updatePrice(String symbol, double price) {
        observers.forEach(o -> o.onPriceChanged(symbol, price));
    }
}

// Concrete Observer
public class MobileDisplay implements StockObserver {
    public void onPriceChanged(String symbol, double price) {
        System.out.println("Alert: " + symbol + " is now $" + price);
    }
}""",
        "pitfall": "Lapsed Listener memory leaks where destroyed UI/service objects are retained in the Subject's subscriber list.",
        "interviewTip": "Highlight Spring's ApplicationEventPublisher and explain how Reactive Streams (Java 9 Flow API / WebFlux) build directly on Observer."
    },
    # 20. State Pattern
    {
        "id": "pat-state",
        "title": "State Pattern (Polymorphic State Transitions & State Machines)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Allows an object to alter its behavior when its internal state changes. The object will appear to change its class. Eliminates sprawling 'switch(state)' or 'if-else' statements by encapsulating state-specific behavior into dedicated polymorphic classes.",
        "visualDiagram": make_box("State Machine Transition Flow", [
            {"label": "OrderContext", "desc": "Current state: NewOrderState", "color": "node-blue", "min_w": "160px"},
            {"label": "order.pay()", "desc": "Delegates to state.pay()", "color": "node-purple", "min_w": "160px"},
            {"label": "State Mutation", "desc": "context.setState(PaidOrderState)", "color": "node-orange", "min_w": "170px"},
            {"label": "order.ship()", "desc": "Now valid under PaidOrderState", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "The Context maintains a reference to a 'State' interface. Each concrete State class implements state-specific behavior (e.g. 'pay()', 'ship()', 'cancel()'). If an operation is invalid in the current state (e.g. shipping an unpaid order), that state class throws an IllegalStateException. Valid actions trigger state transitions by updating the Context's current state pointer.",
        "complexPart": "State transition ownership: Should the State classes trigger transitions on the Context ('context.setState(new PaidState())') or should the Context manage all transitions? State-driven transitions are more dynamic but tightly couple State subclasses together.",
        "keyPoints": [
            "Converts complex state machine conditional trees into clean, cohesive subclasses.",
            "Adheres to Single Responsibility Principle: each state's rules are isolated in one class.",
            "Differs from Strategy: Strategy algorithms are typically independent and chosen once; State transitions dynamically over an object's lifecycle.",
            "Enterprise workflows frequently implement this pattern or use Spring State Machine."
        ],
        "codeSnippet": """public interface OrderState {
    void pay(OrderContext ctx);
    void ship(OrderContext ctx);
}

public class CreatedState implements OrderState {
    public void pay(OrderContext ctx) {
        System.out.println("Processing payment...");
        ctx.setState(new PaidState());
    }
    public void ship(OrderContext ctx) {
        throw new IllegalStateException("Cannot ship an unpaid order!");
    }
}

public class PaidState implements OrderState {
    public void pay(OrderContext ctx) {
        throw new IllegalStateException("Order is already paid!");
    }
    public void ship(OrderContext ctx) {
        System.out.println("Shipping order to customer...");
        ctx.setState(new ShippedState());
    }
}""",
        "pitfall": "Allowing invalid transitions without throwing informative domain exceptions (e.g., shipping before paying).",
        "interviewTip": "Contrast State vs Strategy: Strategy is set by the client and rarely changes; State changes automatically as actions execute."
    },
    # 21. Strategy Pattern
    {
        "id": "pat-strategy",
        "title": "Strategy Pattern (Interchangeable Algorithms & Lambda DI)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from clients that use it. In modern Java, functional interfaces and lambdas make Strategy implementation concise and lightweight.",
        "visualDiagram": make_box("Strategy Algorithm Selection", [
            {"label": "PaymentContext", "desc": "Holds PaymentStrategy reference", "color": "node-blue", "min_w": "160px"},
            {"label": "CreditCardStrategy", "desc": "Implements pay(): charges card", "color": "node-purple", "min_w": "170px"},
            {"label": "PayPalStrategy", "desc": "Implements pay(): OAuth token", "color": "node-orange", "min_w": "170px"},
            {"label": "CryptoStrategy", "desc": "Implements pay(): gas fee & hash", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "The Context delegates execution to a Strategy interface instead of embedding concrete algorithmic logic. At runtime, the client injects the desired strategy into the context. In Spring Boot, autowiring a collection or map of strategies ('@Autowired Map<String, PaymentStrategy>') allows dynamically resolving the correct strategy from a request parameter.",
        "complexPart": "Strategy parameter passing: When strategies require differing subsets of domain data, passing parameters through a generic interface method can cause data bloat or force strategies to pull data back from the context.",
        "keyPoints": [
            "Replaces multiple conditional branches with clean polymorphism.",
            "Modern Java replaces single-method strategy classes with lambdas: 'Collections.sort(list, Comparator.comparing(...))'.",
            "In Spring Boot, inject 'Map<String, Strategy>' to build dynamic plug-and-play strategy dispatchers.",
            "Open/Closed: add new payment gateways or tax calculation engines without touching existing checkout logic."
        ],
        "codeSnippet": """@FunctionalInterface
public interface PaymentStrategy {
    void pay(BigDecimal amount);
}

// Production Spring Boot Dynamic Strategy Dispatcher
@Service
public class PaymentService {
    private final Map<String, PaymentStrategy> strategies;

    // Spring auto-injects all PaymentStrategy beans keyed by bean name
    public PaymentService(Map<String, PaymentStrategy> strategies) {
        this.strategies = strategies;
    }

    public void processPayment(String method, BigDecimal amount) {
        PaymentStrategy strategy = strategies.get(method.toLowerCase() + "PaymentStrategy");
        if (strategy == null) throw new IllegalArgumentException("Unknown payment method: " + method);
        strategy.pay(amount);
    }
}""",
        "pitfall": "Creating a sprawling enum with embedded switch statements instead of leveraging Spring's bean map injection.",
        "interviewTip": "Highlight how Java 8+ functional interfaces (Function, Predicate, Comparator) represent Strategy pattern implementations."
    },
    # 22. Template Method
    {
        "id": "pat-template-method",
        "title": "Template Method (Algorithm Skeleton & Hook Methods)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Defines the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's overarching structure.",
        "visualDiagram": make_box("Template Method Pipeline", [
            {"label": "1. readData()", "desc": "Concrete baseline step in superclass", "color": "node-blue", "min_w": "160px"},
            {"label": "2. parseData() [abstract]", "desc": "Subclass custom parsing (CSV/JSON)", "color": "node-purple", "min_w": "180px"},
            {"label": "3. validate() [hook]", "desc": "Optional hook method with default", "color": "node-orange", "min_w": "170px"},
            {"label": "4. exportResults()", "desc": "Standard final step in superclass", "color": "node-green", "min_w": "160px"}
        ]),
        "internalWorking": "The abstract base class defines a 'final' method containing the invariant workflow steps. Primitive steps are declared 'abstract' (subclasses MUST implement). Optional steps are declared as 'hook methods' with default empty or boolean implementations (subclasses MAY override). The Hollywood Principle ('Don't call us, we'll call you') governs execution.",
        "complexPart": "Inheritance rigidity: Template Method relies on inheritance. If a subclass already extends another class, it cannot inherit the template. In modern architectures, composition-based strategies or functional callbacks (like Spring's 'TransactionTemplate') are preferred over heavy inheritance.",
        "keyPoints": [
            "Declares the invariant algorithm flow as 'final' to prevent subclasses from altering sequence.",
            "Enforces the Hollywood Principle: superclass controls flow and invokes subclass overrides.",
            "Spring's 'JdbcTemplate' and 'TransactionTemplate' evolved from this pattern into callback-based execution.",
            "Hook methods provide optional extension points without forcing subclass overrides."
        ],
        "codeSnippet": """public abstract class DataMiner {
    // The Template Method: Final to prevent flow alterations
    public final void mine(String path) {
        String rawData = readFile(path);
        List<Record> records = parse(rawData); // Abstract step
        if (shouldValidate()) {                // Hook method
            validate(records);
        }
        sendReports(records);
    }

    private String readFile(String p) { return "raw-data"; }
    protected abstract List<Record> parse(String data);
    protected boolean shouldValidate() { return true; } // Hook with default
    private void sendReports(List<Record> r) { System.out.println("Report sent"); }
}""",
        "pitfall": "Forgetting to mark the template method 'final', allowing subclasses to override the orchestration flow.",
        "interviewTip": "Contrast Template Method (inheritance-based) with Strategy (composition-based), and cite Spring JdbcTemplate."
    },
    # 23. Visitor Pattern
    {
        "id": "pat-visitor",
        "title": "Visitor Pattern (Double Dispatch & AST Inspection)",
        "category": "Behavioral Patterns",
        "badge": "GoF Behavioral",
        "whatIsIt": "Represents an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates, achieving Double Dispatch in single-dispatch languages like Java.",
        "visualDiagram": make_box("Visitor Double Dispatch", [
            {"label": "1. client.accept(visitor)", "desc": "Dispatches on element runtime type", "color": "node-blue", "min_w": "170px"},
            {"label": "2. visitor.visit(this)", "desc": "Dispatches on visitor runtime type", "color": "node-purple", "min_w": "180px"},
            {"label": "Double Dispatch Complete", "desc": "Resolved exact method without instanceof", "color": "node-orange", "min_w": "180px"},
            {"label": "Export / Report Result", "desc": "XML/JSON report generated", "color": "node-green", "min_w": "160px"}
        ]),
        "internalWorking": "Java determines method overriding polymorphically on the target object (single dispatch), but method overloading is resolved statically at compile time. Visitor achieves double dispatch: the element accepts the visitor ('element.accept(v)'), and inside 'accept', it passes itself to the visitor ('v.visit(this)'). The exact method is resolved dynamically based on BOTH element type and visitor type.",
        "complexPart": "Element hierarchy instability: Adding a new Element class requires adding 'visit(NewElement)' to the Visitor interface and updating EVERY concrete visitor class. Visitor is only suitable when element hierarchies are stable but operations on them change frequently.",
        "keyPoints": [
            "Achieves double dispatch without ugly 'if (e instanceof CarElement)' ladders.",
            "Separates algorithms from complex object structures (compilers, AST traversals, document exporters).",
            "Pairs exceptionally well with the Composite pattern for tree processing.",
            "In modern Java 17+, Pattern Matching for switch on sealed hierarchies often replaces Visitor."
        ],
        "codeSnippet": """public interface Visitor {
    void visit(Book book);
    void visit(Electronics elec);
}

public interface VisitableItem {
    void accept(Visitor visitor); // First dispatch
}

public class Book implements VisitableItem {
    private final double price;
    public Book(double p) { this.price = p; }
    public double getPrice() { return price; }
    public void accept(Visitor v) { v.visit(this); } // Second dispatch
}

public class TaxVisitor implements Visitor {
    public void visit(Book b) { System.out.println("Book tax: $" + (b.getPrice() * 0.05)); }
    public void visit(Electronics e) { System.out.println("Elec tax: $" + (e.getPrice() * 0.20)); }
}""",
        "pitfall": "Using Visitor on volatile class hierarchies where new Element types are added regularly.",
        "interviewTip": "Explain 'Double Dispatch' clearly, and mention that Java 21+ sealed interfaces and pattern matching for switch provide a modern alternative."
    },
    # 24. Null Object Pattern
    {
        "id": "pat-null-object",
        "title": "Null Object & Optional Pattern (Eliminating NPEs Cleanly)",
        "category": "Modern Java Idioms",
        "badge": "Modern Idioms",
        "whatIsIt": "Provides a surrogate object with default do-nothing behavior in place of 'null'. Eliminates repetitive 'if (obj != null)' defensive boilerplate across the codebase and prevents catastrophic NullPointerExceptions (NPEs).",
        "visualDiagram": make_box("Null Object Safe Execution", [
            {"label": "Client Caller", "desc": "logger.log(\"User logged in\")", "color": "node-blue", "min_w": "160px"},
            {"label": "NullLogger Object", "desc": "Implements Logger with no-op body", "color": "node-purple", "min_w": "180px"},
            {"label": "Zero '!= null' Checks", "desc": "Client code executes cleanly", "color": "node-orange", "min_w": "170px"},
            {"label": "Safe Zero-Cost Execution", "desc": "No NPE, no defensive branches", "color": "node-green", "min_w": "170px"}
        ]),
        "internalWorking": "Instead of returning 'null' when an entity, logger, or callback is missing, the system returns a singleton 'NullObject' implementing the expected interface. All methods perform safe default actions (e.g. no-op, empty string, zero count). In modern Java, this is complemented by 'Optional<T>' for return values and 'Collections.emptyList()' for collection returns.",
        "complexPart": "Masking bugs: If an unexpected null represents a fatal database or configuration failure, returning a silent Null Object can mask the root cause, making debugging difficult. Reserve Null Object for truly optional collaborator objects.",
        "keyPoints": [
            "Eliminates boilerplate defensive null checks and NullPointerExceptions.",
            "Collections should ALWAYS return empty collections ('Collections.emptyList()'), NEVER null.",
            "Never use 'Optional<T>' as field types or method parameters; use it strictly for return types.",
            "Null Object instances should be immutable singletons to conserve memory."
        ],
        "codeSnippet": """public interface AuditLogger {
    void log(String action);
}

// Real Implementation
public class CloudAuditLogger implements AuditLogger {
    public void log(String action) { System.out.println("Sent to Cloud: " + action); }
}

// Null Object Implementation (No-Op)
public class NullAuditLogger implements AuditLogger {
    public static final NullAuditLogger INSTANCE = new NullAuditLogger();
    private NullAuditLogger() {}
    public void log(String action) {
        // Safe no-op: does nothing, never throws NPE
    }
}""",
        "pitfall": "Using a Null Object when a missing object actually signifies an unexpected error that should have failed fast.",
        "interviewTip": "Emphasize: 'Never return null for collections—return Collections.emptyList(); use Optional for single return values; use Null Object for optional dependencies.'"
    }
]

output_path = "js/data/java-patterns-data.js"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("""/**
 * java-patterns-data.js
 * Comprehensive Gang of Four (GoF) & Modern Java Design Patterns
 * Includes: 24 Core Patterns with Visual Diagrams, Execution Mechanics, Production Code & Senior Traps.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

""")
    f.write(f"window.REVISION_APP_DATA.JAVA_PATTERNS_CATEGORIES = {json.dumps(categories, indent=2)};\n\n")
    f.write(f"window.REVISION_APP_DATA.JAVA_PATTERNS = {json.dumps(patterns, indent=2)};\n")

print(f"Generated {len(patterns)} Java Design Patterns in {output_path} successfully!")
