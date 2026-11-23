# scripts/topics_oop.py
# Category: OOP & Design (6 Topics x 10 Questions = 60 Questions)

TOPICS_OOP = [
  # --------------------------------------------------------------------------
  # 1. equals() and hashCode() contract
  # --------------------------------------------------------------------------
  {
    "topicId": "equals-hashcode-contract",
    "topicTitle": "equals() and hashCode() contract",
    "category": "OOP & Design",
    "summary": "10 Tricky Questions on Hash Invariants, Symmetry, Transitivity, Proxy Equality & Bucket Addressing.",
    "questions": [
      {
        "id": "q-eqhash-1",
        "difficulty": "Senior",
        "title": "Mutable Keys in HashMap: Bucket Addressing Mismatch",
        "question": "What happens if a mutable object used as a HashMap key has its fields mutated after insertion? Why does map.get(key) return null while map.size() remains 1?",
        "interviewerIntent": "Testing bucket index calculation (n-1)&hash, table addressing, and memory leak diagnosis.",
        "juniorTrap": "Assuming that because the identical instance pointer (==) is passed to get(), HashMap will locate it.",
        "problem": "After key mutation, map.get(key) returns null, map.containsKey(key) returns false, and the entry cannot be removed, leaking memory.",
        "innerWorking": "HashMap addresses buckets via (table.length - 1) & hash(key.hashCode()). Mutating fields changes hashCode(), directing get() to an entirely different bucket. The entry remains trapped in the old bucket indefinitely.",
        "seniorAnswer": [
          "HashMap stores entries in an array of Node<K,V>[]. Index depends directly on key.hashCode().",
          "Mutating key state after insertion breaks bucket addressing; the entry becomes an unreachable zombie entry.",
          "Keys must be immutable (e.g. Java Records or classes with private final fields)."
        ],
        "codeSnippet": "Map<MutableKey, String> map = new HashMap<>();\nMutableKey k = new MutableKey(10);\nmap.put(k, \"Value\");\nk.setId(20); // Mutates hashCode!\nSystem.out.println(map.get(k)); // null!\nSystem.out.println(map.size()); // 1 (Leaked!)",
        "trap": "Mutating a key after insertion shifts its bucket index, orphaning the entry in memory."
      },
      {
        "id": "q-eqhash-2",
        "difficulty": "Senior",
        "title": "Symmetry Violation in Inheritance (Point vs ColorPoint)",
        "question": "Why does ColorPoint extends Point violate equals() symmetry when adding an extra field, and how does Joshua Bloch solve it?",
        "interviewerIntent": "Testing knowledge of the equals() symmetry contract: a.equals(b) == b.equals(a).",
        "juniorTrap": "Using instanceof in the subclass equals() check, causing p.equals(cp) to be true but cp.equals(p) to be false.",
        "problem": "Collections behaving inconsistently (e.g., list.contains(item) returns true or false depending on which object is checked first).",
        "innerWorking": "Point.equals(Object o) checks if o instanceof Point. Since ColorPoint is a Point, p.equals(cp) is true. But ColorPoint.equals(Object o) checks color; when passed Point, color is missing or check fails, returning false. Breaks symmetry.",
        "seniorAnswer": [
          "There is no way to extend an instantiable class and add an aspect while preserving equals contract using inheritance.",
          "Fix: Favor composition over inheritance. ColorPoint should contain a Point and a Color, exposing asPoint() view."
        ],
        "codeSnippet": "Point p = new Point(1, 2);\nColorPoint cp = new ColorPoint(1, 2, Color.RED);\nSystem.out.println(p.equals(cp));  // true!\nSystem.out.println(cp.equals(p));  // false! (Breaks Symmetry!)",
        "trap": "Inheritance cannot add fields to an instantiable class without violating symmetry or transitivity in equals()."
      },
      {
        "id": "q-eqhash-3",
        "difficulty": "Staff Level",
        "title": "Transitivity Violation when Trying to Fix Symmetry",
        "question": "If ColorPoint ignores color when comparing against a plain Point to fix symmetry, what contract breaks next?",
        "interviewerIntent": "Verifying mastery of equals() transitivity: if a.equals(b) and b.equals(c), then a.equals(c).",
        "juniorTrap": "Writing 'if (!(o instanceof ColorPoint)) return super.equals(o);' thinking symmetry is preserved.",
        "problem": "cpRed.equals(plainPoint) is true, and plainPoint.equals(cpBlue) is true, but cpRed.equals(cpBlue) is false! Breaks transitivity.",
        "innerWorking": "Transitivity requires consistent equivalence relations. When comparing two ColorPoints of different colors, both colors matter. But when compared through an intermediary plain Point, color is ignored, resulting in a false equivalence chain.",
        "seniorAnswer": [
          "Blinded equivalence through superclass drops discriminatory dimensions.",
          "Transitivity failures scramble sorting algorithms (TimSort crashes with 'Comparison method violates contract').",
          "Never attempt mixed-type equality across inheritance hierarchies."
        ],
        "codeSnippet": "ColorPoint cp1 = new ColorPoint(1, 2, Color.RED);\nPoint p = new Point(1, 2);\nColorPoint cp2 = new ColorPoint(1, 2, Color.BLUE);\n// cp1.equals(p) == true and p.equals(cp2) == true, but cp1.equals(cp2) == false!",
        "trap": "Ignoring sub-fields to appease superclass symmetry inevitably breaks transitivity."
      },
      {
        "id": "q-eqhash-4",
        "difficulty": "Senior",
        "title": "Constant hashCode() Catastrophe: O(1) to O(N) Collapse",
        "question": "Is public int hashCode() { return 1; } technically a legal implementation? What happens to HashMap performance?",
        "interviewerIntent": "Testing contract requirements vs runtime algorithmic performance.",
        "juniorTrap": "Believing returning 1 violates the contract, or thinking HashMap throws an exception.",
        "problem": "Entire HashMap collapses into a single bucket. All lookups degrade from O(1) to O(N) or O(log N).",
        "innerWorking": "The contract only requires: If a.equals(b), then a.hashCode() == b.hashCode(). It does NOT require distinct objects to have distinct hashes! Returning 1 fulfills the contract, but causes 100% collision rate, forcing every entry into bucket 1.",
        "seniorAnswer": [
          "Contractually valid, practically disastrous.",
          "In Java 8+, the bucket converts to a Red-Black tree after 8 collisions (if capacity >= 64), yielding O(log N) rather than O(N).",
          "If keys do not implement Comparable, tree lookup falls back to System.identityHashCode tie-breaking."
        ],
        "codeSnippet": "@Override public int hashCode() { return 1; } // Contractually valid! But destroys O(1) lookup.",
        "trap": "Equal objects must have equal hashes; unequal objects do not have to have unique hashes, but collisions degrade O(1) to O(log N)."
      },
      {
        "id": "q-eqhash-5",
        "difficulty": "Senior",
        "title": "Overloading equals(MyClass) instead of Overriding equals(Object)",
        "question": "Why does writing public boolean equals(Employee other) fail silently when using HashSets or Lists?",
        "interviewerIntent": "Testing compiler method resolution vs polymorphism in the Collections framework.",
        "juniorTrap": "Writing type-safe equals(Employee) without realizing it overloads rather than overrides Object.equals(Object).",
        "problem": "list.contains(emp) calls Object.equals(Object). It bypasses equals(Employee) completely, using reference identity (==).",
        "innerWorking": "Collection.contains(Object o) invokes o.equals(element). Since the parameter type is Object, dynamic dispatch checks vtable for equals(Object). If only equals(Employee) exists, Object.equals(Object) is called!",
        "seniorAnswer": [
          "Always annotate with @Override. If the signature is equals(MyClass), javac immediately flags a compilation error.",
          "Signature must strictly be: public boolean equals(Object obj)."
        ],
        "codeSnippet": "// BUG:\npublic boolean equals(Employee e) { return this.id == e.id; }\n// HashSet will NEVER call this! Always use @Override public boolean equals(Object o)",
        "trap": "Accidental overloading of equals(MyClass) leaves default Object.equals(Object) active in collections."
      },
      {
        "id": "q-eqhash-6",
        "difficulty": "Staff Level",
        "title": "Float and Double Equality: NaN and -0.0 Traps",
        "question": "Why must Float.compare() / Double.compare() be used instead of == in equals() and hashCode()?",
        "interviewerIntent": "Testing IEEE 754 floating-point edge cases: NaN != NaN and -0.0 == +0.0.",
        "juniorTrap": "Using == on floats/doubles or casting to int in hashCode().",
        "problem": "Float.NaN == Float.NaN evaluates to false, violating reflexivity (x.equals(x) must be true). -0.0f == +0.0f evaluates to true, but they have distinct bit layouts.",
        "innerWorking": "Float.compare(NaN, NaN) returns 0 (equal), satisfying reflexivity. Float.floatToIntBits(-0.0f) differs from +0.0f, ensuring hashCode() and equals() remain aligned.",
        "seniorAnswer": [
          "Reflexivity invariant: x.equals(x) MUST always be true. Float.NaN == Float.NaN violates this by returning false.",
          "Always use Double.compare(d1, d2) == 0 or Double.valueOf(d1).equals(Double.valueOf(d2))."
        ],
        "codeSnippet": "double d1 = Double.NaN;\nSystem.out.println(d1 == d1); // false! Breaks reflexivity!\nSystem.out.println(Double.compare(d1, d1) == 0); // true! Correct for equals()",
        "trap": "Using == for float/double fields breaks reflexivity on NaN and distinction on -0.0."
      },
      {
        "id": "q-eqhash-7",
        "difficulty": "Senior",
        "title": "Array Fields in equals() and hashCode(): == vs Arrays.equals()",
        "question": "What is wrong with using this.data.equals(o.data) or this.data.hashCode() when data is an array (byte[] / int[])?",
        "interviewerIntent": "Testing awareness that Java arrays do NOT override Object.equals() or hashCode().",
        "juniorTrap": "Calling array.equals(otherArray) assuming it checks element-by-element equality.",
        "problem": "array.equals() uses Object.equals(), checking only memory reference identity (==). Two distinct arrays with identical bytes fail equals().",
        "innerWorking": "Arrays in Java inherit directly from Object and do not override equals() or hashCode(). Must use Arrays.equals(a, b) and Arrays.hashCode(a), or Arrays.deepEquals/deepHashCode for multidimensional arrays.",
        "seniorAnswer": [
          "Calling .equals() on an array checks reference equality only.",
          "Use java.util.Arrays.equals(arr1, arr2) and java.util.Arrays.hashCode(arr1).",
          "For nested arrays, use Arrays.deepEquals() and Arrays.deepHashCode()."
        ],
        "codeSnippet": "int[] a = {1, 2}, b = {1, 2};\nSystem.out.println(a.equals(b)); // false! (Checks reference only)\nSystem.out.println(Arrays.equals(a, b)); // true! (Checks elements)",
        "trap": "Arrays do not override equals() or hashCode(). Always delegate to java.util.Arrays."
      },
      {
        "id": "q-eqhash-8",
        "difficulty": "Staff Level",
        "title": "JPA / Hibernate Entity Equality: getClass() vs instanceof with Dynamic Proxies",
        "question": "Why does using if (o.getClass() != getClass()) break entity equality in Hibernate/JPA, and why should instanceof be used instead?",
        "interviewerIntent": "Testing integration between JPA lazy loading, CGLIB/ByteBuddy proxies, and OOP equality.",
        "juniorTrap": "Enforcing getClass() != o.getClass() to prevent inheritance bugs, unwittingly breaking Hibernate proxies.",
        "problem": "When an entity is lazily loaded via em.getReference(), Hibernate creates a runtime proxy subclass (User$HibernateProxy$xyz). o.getClass() != getClass() returns true, breaking equality between a proxy and an unproxied entity!",
        "innerWorking": "Hibernate proxies subclass the target entity. Proxy.getClass() returns the generated proxy class, not User.class. instanceof correctly recognizes the proxy as a User instance.",
        "seniorAnswer": [
          "In JPA entities, always use instanceof rather than getClass().",
          "In getters inside equals(), use getId() rather than direct field access (this.id) so lazy proxies initialize properly.",
          "Entities should base equals/hashCode on a business key or generated UUID, not database-generated @Id before persist()."
        ],
        "codeSnippet": "// BAD for JPA:\nif (o == null || getClass() != o.getClass()) return false;\n// GOOD for JPA (Supports Hibernate ByteBuddy Proxies):\nif (!(o instanceof User other)) return false;\nreturn getId() != null && getId().equals(other.getId());",
        "trap": "getClass() breaks equality for Hibernate lazily-loaded dynamic bytecode proxies. Use instanceof."
      },
      {
        "id": "q-eqhash-9",
        "difficulty": "Senior",
        "title": "Circular Object Graph causing StackOverflowError in hashCode()",
        "question": "What happens when Order references Customer and Customer holds List<Order>, and both use Lombok's @Data or auto-generated hashCode()?",
        "interviewerIntent": "Diagnosing recursive graph traversal and infinite recursion during collection operations.",
        "juniorTrap": "Adding @Data to both sides of a bidirectional relationship.",
        "problem": "Calling customer.hashCode() or order.hashCode() throws StackOverflowError immediately.",
        "innerWorking": "Customer.hashCode() calls Order.hashCode(), which calls Customer.hashCode(), looping infinitely on the thread call stack until stack memory is exhausted.",
        "seniorAnswer": [
          "In bidirectional relationships, exclude the back-reference from equals and hashCode.",
          "In Lombok, use @EqualsAndHashCode.Exclude on the child reference.",
          "Base equality on immutable primary keys or business identifiers rather than navigating graph relationships."
        ],
        "codeSnippet": "@Entity\nclass Customer { \n    @EqualsAndHashCode.Exclude // Breaks infinite recursion!\n    List<Order> orders; \n}",
        "trap": "Bidirectional relationships in auto-generated hashCode() cause infinite recursion and StackOverflowError."
      },
      {
        "id": "q-eqhash-10",
        "difficulty": "Senior",
        "title": "Consistency Contract Violated by External Environmental Dependencies",
        "question": "Why is java.net.URL's equals() method considered one of the worst design flaws in the Java standard library?",
        "interviewerIntent": "Understanding the consistency invariant: equals() must return consistent results without blocking or external network calls.",
        "juniorTrap": "Using URL objects as keys in HashMap or HashSet.",
        "problem": "Adding URLs to a HashSet triggers synchronous DNS lookups! If IP changes or network drops, hash code changes or equals() blocks for seconds.",
        "innerWorking": "URL.equals() resolves hostnames to IP addresses via DNS. If two domains point to the same IP, they are 'equal'. If DNS is slow, collections block. If IP changes, hashCode changes, corrupting maps.",
        "seniorAnswer": [
          "equals() must be deterministic, pure, and CPU-bound only.",
          "Never perform I/O, DNS resolution, or database lookups inside equals() or hashCode().",
          "Always use java.net.URI instead of java.net.URL. URI performs string-based syntactic comparison without network I/O."
        ],
        "codeSnippet": "// DANGEROUS: URL.equals() triggers blocking network DNS lookup!\nSet<URL> urls = new HashSet<>(); \n// SAFE: URI does pure string syntax comparison:\nSet<URI> uris = new HashSet<>();",
        "trap": "URL.equals() performs blocking DNS queries; always use URI for deterministic, non-blocking comparisons."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 2. Composition vs. inheritance
  # --------------------------------------------------------------------------
  {
    "topicId": "composition-vs-inheritance",
    "topicTitle": "Composition vs. inheritance",
    "category": "OOP & Design",
    "summary": "10 Tricky Questions on Fragile Base Classes, Encapsulation Breaches, Method Hiding & Decorator Patterns.",
    "questions": [
      {
        "id": "q-comp-1",
        "difficulty": "Senior",
        "title": "The Fragile Base Class Problem: HashSet.addAll() Self-Use",
        "question": "Why does subclassing HashSet and overriding both add() and addAll() double-count elements?",
        "interviewerIntent": "Understanding internal self-use in libraries and why inheritance breaks encapsulation.",
        "juniorTrap": "Assuming super.addAll(c) executes as a single batch operation without invoking this.add().",
        "problem": "Adding 3 elements via addAll() increments the counter by 6.",
        "innerWorking": "In HashSet, addAll() iterates and invokes this.add(). Overriding both methods causes double counting because polymorphic dispatch redirects the superclass's internal call back into the subclass overridden method.",
        "seniorAnswer": [
          "Inheritance couples subclasses to superclass internal implementation details.",
          "If the superclass refactors addAll() to bypass this.add(), subclass breaks silently.",
          "Fix: Use Composition. Wrap a Set inside a ForwardingSet."
        ],
        "codeSnippet": "class CountedSet<E> extends HashSet<E> {\n    int count = 0;\n    @Override public boolean add(E e) { count++; return super.add(e); }\n    @Override public boolean addAll(Collection<? extends E> c) {\n        count += c.size();\n        return super.addAll(c); // Internally calls this.add()! Count becomes 2x!\n    }\n}",
        "trap": "Superclasses calling their own public methods internally creates double-invocation traps in subclasses."
      },
      {
        "id": "q-comp-2",
        "difficulty": "Staff Level",
        "title": "Subclass Constructor Invocation of Overridden Method Trap",
        "question": "What happens when a base class constructor calls an overridden method that accesses a subclass instance variable?",
        "interviewerIntent": "Testing JVM object initialization order and partially initialized object leakage.",
        "juniorTrap": "Expecting the subclass field to be initialized, or thinking base method runs.",
        "problem": "The overridden method prints null or 0, or throws NullPointerException.",
        "innerWorking": "Superclass constructor runs BEFORE subclass field initializers. Dynamic dispatch resolves to the subclass overridden method, but subclass fields still hold default JVM values (null/0).",
        "seniorAnswer": [
          "Never invoke non-final or non-private methods from constructors.",
          "Subclass state does not exist yet when super-constructor runs.",
          "Composition avoids this by constructing components before combining them."
        ],
        "codeSnippet": "class Super { Super() { print(); } void print() { System.out.println(\"Super\"); } }\nclass Sub extends Super {\n    String msg = \"Ready\";\n    @Override void print() { System.out.println(msg); } // PRINTS NULL!\n}",
        "trap": "Calling an overridable method inside a constructor exposes uninitialized subclass state (fields are null/0)."
      },
      {
        "id": "q-comp-3",
        "difficulty": "Senior",
        "title": "Accidental Override Collision during Superclass Evolution",
        "question": "What happens if a base class in version 2 adds a new method with the exact same signature as a method you added to your subclass in version 1?",
        "interviewerIntent": "Understanding fragile base class maintenance across library upgrades.",
        "juniorTrap": "Believing your method remains independent.",
        "problem": "Your method accidentally becomes an override of the base method without your knowledge, inheriting its contract or failing compilation if return types differ.",
        "innerWorking": "If the base class introduces void audit(), your existing void audit() accidentally overrides it. If the base method has a different return type, compilation breaks completely.",
        "seniorAnswer": [
          "Inheritance binds you to all future method additions of the superclass.",
          "Composition encapsulates the external class, preventing accidental signature collisions."
        ],
        "codeSnippet": "// Lib v1: class Base {}\n// You: class Sub extends Base { boolean validate() { return true; } }\n// Lib v2: class Base { void validate() { ... } } -> COMPILATION ERROR! (Incompatible return types)",
        "trap": "Superclass library upgrades can introduce method signatures that collide with subclass methods."
      },
      {
        "id": "q-comp-4",
        "difficulty": "Senior",
        "title": "Static Method Hiding vs Instance Method Overriding",
        "question": "Can static methods be overridden? What happens when Parent p = new Child(); p.staticMethod(); is called?",
        "interviewerIntent": "Differentiating compile-time static binding (invokestatic) from dynamic vtable dispatch (invokevirtual).",
        "juniorTrap": "Believing static methods participate in polymorphism.",
        "problem": "Calling p.staticMethod() invokes Parent.staticMethod(), ignoring Child's implementation completely.",
        "innerWorking": "Static methods belong to the class, not instance. Invocations are bound at compile time based on the declared reference type.",
        "seniorAnswer": [
          "Static methods are hidden, not overridden.",
          "Static methods use invokestatic bytecode instruction, resolving by reference type.",
          "Always call static methods via ClassName.method(), never via instance references."
        ],
        "codeSnippet": "Parent p = new Child();\np.printStatic(); // Executes Parent.printStatic()! Compiler rewrites to Parent.printStatic()",
        "trap": "Static methods cannot be overridden; they are hidden based on compile-time reference types."
      },
      {
        "id": "q-comp-5",
        "difficulty": "Senior",
        "title": "Encapsulation Breach via Protected Fields",
        "question": "Why is protected field access considered an architectural smell compared to private fields with composition?",
        "interviewerIntent": "Evaluating awareness of open-box vs black-box reuse.",
        "juniorTrap": "Using protected fields everywhere in base classes for subclass convenience.",
        "problem": "Any class in the same package (or any subclass anywhere) can mutate the field, breaking invariants without the base class knowing.",
        "innerWorking": "Protected fields create tight temporal and state coupling. Changing field representation in the base class breaks all subclasses.",
        "seniorAnswer": [
          "Protected fields expose implementation details to subclasses and same-package classes.",
          "Favor private fields with controlled public/protected accessors, or use composition."
        ],
        "codeSnippet": "public class Base { protected List<String> items; } // Subclass can replace or corrupt items list directly!",
        "trap": "Protected fields destroy encapsulation by allowing subclasses to bypass validation invariants."
      },
      {
        "id": "q-comp-6",
        "difficulty": "Senior",
        "title": "Decorator Pattern with Forwarding Class (Safe Composition)",
        "question": "How does Joshua Bloch's Forwarding Class pattern allow extending functionality without inheritance risks?",
        "interviewerIntent": "Understanding proper Decorator pattern implementation using composition and interface delegation.",
        "juniorTrap": "Re-implementing all 20+ interface methods manually inside the decorator class.",
        "problem": "Tedious boilerplate when delegating interface methods.",
        "innerWorking": "Create a reusable ForwardingSet<E> implementing Set<E> that forwards all calls to an underlying Set. The custom InstrumentedSet extends ForwardingSet and overrides only add() and addAll().",
        "seniorAnswer": [
          "Wraps any implementation of the interface (HashSet, TreeSet).",
          "Decoupled from concrete superclass internal implementation details.",
          "Works as a drop-in decorator at runtime."
        ],
        "codeSnippet": "public class InstrumentedSet<E> extends ForwardingSet<E> {\n    private int count = 0;\n    public InstrumentedSet(Set<E> s) { super(s); }\n    @Override public boolean add(E e) { count++; return super.add(e); }\n    public int getCount() { return count; }\n}",
        "trap": "Use an interface-forwarding class to implement clean, safe decorators without inheritance traps."
      },
      {
        "id": "q-comp-7",
        "difficulty": "Staff Level",
        "title": "LSP Violation when Inheritance Models Real-World Relationships",
        "question": "Why does inheriting Stack from Vector (like Java's legacy java.util.Stack) violate OOP design?",
        "interviewerIntent": "Critiquing standard library design flaws and Liskov Substitution Principle breaches.",
        "juniorTrap": "Thinking Stack is a specialized Vector so inheritance is natural.",
        "problem": "Stack exposes Vector.add(index, element), allowing elements to be inserted in the middle of a LIFO stack!",
        "innerWorking": "A Stack is NOT a Vector. It should not permit index-based insertion or arbitrary removal. By inheriting, Stack inherited operations that violate its core LIFO invariant.",
        "seniorAnswer": [
          "Inheritance is only valid when strict IS-A relationship holds for ALL operations.",
          "Modern alternative: Use ArrayDeque via Deque interface using composition."
        ],
        "codeSnippet": "Stack<Integer> s = new Stack<>();\ns.push(1); s.push(2);\ns.add(0, 99); // Legal! But destroys LIFO stack invariants!",
        "trap": "Inheritance exposes superclass operations that can violate the fundamental invariants of the subclass."
      },
      {
        "id": "q-comp-8",
        "difficulty": "Senior",
        "title": "Mocking and Unit Testing: Composition vs Rigid Class Hierarchies",
        "question": "Why does composition make unit testing trivial compared to deep inheritance trees?",
        "interviewerIntent": "Testing testability, dependency injection, and decoupling.",
        "juniorTrap": "Using partial mocks (Mockito spy) on deep inheritance trees.",
        "problem": "Testing a leaf subclass executes superclass constructors, database connections, and external resource initializers.",
        "innerWorking": "Subclass instantiation unconditionally invokes superclass constructors up the tree. With composition, dependencies are interfaces injected via constructor, easily mocked with Mockito.",
        "seniorAnswer": [
          "Composition allows isolated unit testing via mocked interface dependencies.",
          "Inheritance forces instantiation of all ancestors."
        ],
        "codeSnippet": "// Inheritance: Requires mocking entire ancestor tree\n// Composition: Simply pass mock interface\nOrderService service = new OrderService(mockPaymentGateway, mockEmailClient);",
        "trap": "Deep inheritance trees make isolated unit testing nearly impossible without complex partial mocks."
      },
      {
        "id": "q-comp-9",
        "difficulty": "Senior",
        "title": "Multiple Inheritance of Behavior vs Multiple Inheritance of State",
        "question": "Why does Java forbid multiple inheritance of classes (state) but allow multiple inheritance of interfaces (behavior)?",
        "interviewerIntent": "Understanding memory layout, vtable offsets, and field collision ambiguities.",
        "juniorTrap": "Giving hand-wavy answers about 'avoiding confusion' without knowing memory implications.",
        "problem": "If Class C inherits Class A (int x) and Class B (int x), how does the JVM lay out fields in memory?",
        "innerWorking": "If multiple inheritance of classes were allowed, an object header would have conflicting field offsets and duplicate state (Diamond Problem of State). Interfaces do not hold instance fields, avoiding memory layout ambiguities.",
        "seniorAnswer": [
          "Object layout requires contiguous, fixed-offset instance field memory.",
          "Composition enables assembling multiple stateful objects cleanly without memory conflicts."
        ],
        "codeSnippet": "// Composition provides multiple state inheritance cleanly:\nclass Vehicle { private Engine engine; private Transmission transmission; }",
        "trap": "Classes cannot be multiply inherited because of field memory layout conflicts; use composition."
      },
      {
        "id": "q-comp-10",
        "difficulty": "Staff Level",
        "title": "Runtime Strategy Switching: Inheritance vs Composition",
        "question": "Why cannot inheritance support dynamic runtime strategy switching while composition can?",
        "interviewerIntent": "Comparing compile-time binding vs runtime polymorphism (GoF Strategy Pattern).",
        "juniorTrap": "Creating subclasses for every combination of business logic.",
        "problem": "A User cannot change from FreeUser to PremiumUser at runtime without reconstructing the entire object.",
        "innerWorking": "Class identity is permanently fixed at instantiation time in the object header (Klass Word). You cannot change an object's class at runtime. With composition, you simply swap the strategy reference.",
        "seniorAnswer": [
          "Inheritance binds behavior statically at compile time.",
          "Composition (Strategy pattern) allows swapping behaviors dynamically via setters."
        ],
        "codeSnippet": "class Order { \n    private DiscountStrategy discount; \n    public void setDiscount(DiscountStrategy d) { this.discount = d; } // Dynamic swap!\n}",
        "trap": "Object class identity is immutable at runtime; composition allows dynamic strategy swapping."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 3. Abstract class vs. interface (post-Java 8)
  # --------------------------------------------------------------------------
  {
    "topicId": "abstract-class-vs-interface",
    "topicTitle": "Abstract class vs. interface (post-Java 8)",
    "category": "OOP & Design",
    "summary": "10 Tricky Questions on Default Methods, Diamond Ambiguity, Interface Private Helpers & Lifecycle Invariants.",
    "questions": [
      {
        "id": "q-abs-1",
        "difficulty": "Senior",
        "title": "Diamond Conflict Resolution with Duplicate Default Methods",
        "question": "If Interface A and Interface B both define default void execute(), how does implementing class C resolve the collision?",
        "interviewerIntent": "Testing JLS rules for resolving default method conflicts.",
        "juniorTrap": "Thinking the compiler picks the first interface listed in 'implements A, B'.",
        "problem": "Compiler throws: 'class C inherits unrelated defaults for execute() from types A and B'.",
        "innerWorking": "The compiler refuses to choose arbitrarily. The implementing class MUST override execute() and explicitly resolve the collision, optionally calling InterfaceA.super.execute().",
        "seniorAnswer": [
          "Class MUST explicitly override the colliding method.",
          "Can delegate using InterfaceName.super.methodName() syntax.",
          "If one interface extends the other, the more specific sub-interface wins automatically."
        ],
        "codeSnippet": "class Service implements A, B {\n    @Override public void execute() {\n        A.super.execute(); // Disambiguate explicitly!\n    }\n}",
        "trap": "Duplicate default methods in unrelated interfaces require explicit override disambiguation."
      },
      {
        "id": "q-abs-2",
        "difficulty": "Senior",
        "title": "Class Priority Rule: Superclass Method Wins Over Interface Default",
        "question": "What happens if a class extends BaseClass and implements MyInterface, and both define void log()?",
        "interviewerIntent": "Verifying the 'Class Wins' rule in JLS §9.4.1.",
        "juniorTrap": "Expecting a diamond conflict compilation error.",
        "problem": "Developers surprised that the interface default method is completely ignored.",
        "innerWorking": "JLS Rule 1: A method declaration in a superclass takes precedence over ANY default method in any implemented interface. The interface default method is overshadowed.",
        "seniorAnswer": [
          "'Classes win over interfaces' rule guarantees backward compatibility with Java 7 code.",
          "BaseClass.log() executes; no compiler error occurs."
        ],
        "codeSnippet": "class Base { public void log() { System.out.println(\"Base\"); } }\ninterface Loggable { default void log() { System.out.println(\"Interface\"); } }\nclass App extends Base implements Loggable {} // new App().log() prints: Base!",
        "trap": "Superclass method implementations always take precedence over interface default methods."
      },
      {
        "id": "q-abs-3",
        "difficulty": "Senior",
        "title": "Static Methods in Interfaces are NOT Inherited",
        "question": "Can you call an interface's static method through an implementing class or instance (e.g. MyClass.staticMethod() or instance.staticMethod())?",
        "interviewerIntent": "Contrasting class static method inheritance with interface static method non-inheritance.",
        "juniorTrap": "Assuming interface static methods work like class static methods.",
        "problem": "Compilation error: cannot find symbol method staticMethod() in MyClass.",
        "innerWorking": "Static methods in interfaces are NOT part of the class inheritance hierarchy. They can ONLY be invoked via InterfaceName.staticMethod(). This prevents accidental collisions across multiple interfaces.",
        "seniorAnswer": [
          "Interface static methods can only be invoked via InterfaceName.method().",
          "They are not inherited by implementing classes or sub-interfaces.",
          "Class static methods ARE inherited by subclasses (unless hidden)."
        ],
        "codeSnippet": "interface Util { static void run() {} }\nclass App implements Util {}\n// App.run(); // COMPILE ERROR! Must be: Util.run();",
        "trap": "Static methods on interfaces are not inherited by implementing classes; invoke via InterfaceName.method()."
      },
      {
        "id": "q-abs-4",
        "difficulty": "Senior",
        "title": "Private Interface Methods (Java 9): Scope & Purpose",
        "question": "Why did Java 9 introduce private and private static methods to interfaces, and what are their constraints?",
        "interviewerIntent": "Understanding code reuse within interfaces without exposing public API endpoints.",
        "juniorTrap": "Thinking private methods can be overridden by implementing classes.",
        "problem": "Duplicate helper code across multiple default methods polluting the public API.",
        "innerWorking": "Private interface methods allow sharing code between default methods without leaking helper routines as public interface contracts. They cannot be abstract, cannot be default, and cannot be accessed outside the interface.",
        "seniorAnswer": [
          "Private interface methods encapsulate internal helper routines for default methods.",
          "Private static methods encapsulate internal helpers for static and default methods.",
          "They cannot be overridden or accessed by implementing classes."
        ],
        "codeSnippet": "interface DataProcessor {\n    default void process() { validate(); /* work */ }\n    default void retry() { validate(); /* retry */ }\n    private void validate() { /* shared logic */ } // Clean encapsulation!\n}",
        "trap": "Private interface methods provide non-inheritable helper logic shared between default methods."
      },
      {
        "id": "q-abs-5",
        "difficulty": "Staff Level",
        "title": "State Encapsulation: Abstract Class vs Interface",
        "question": "Why can an interface never truly replace an abstract class when enforcing lifecycle invariants?",
        "interviewerIntent": "Comparing stateless contracts with stateful lifecycle templates.",
        "juniorTrap": "Believing interfaces with default methods make abstract classes obsolete.",
        "problem": "Attempting to track mutable state (like connection pools, request counters) inside an interface.",
        "innerWorking": "All fields in an interface are implicitly public static final (constants). Interfaces cannot hold instance fields or constructors. Abstract classes can declare private/protected mutable fields and constructors to enforce lifecycle invariants.",
        "seniorAnswer": [
          "Interfaces define contracts and behavior; abstract classes define identity and state.",
          "Template Method pattern requiring private mutable state requires an abstract class.",
          "Constructors in abstract classes enforce initialization invariants."
        ],
        "codeSnippet": "abstract class AbstractWorker {\n    private final AtomicInteger taskCount = new AtomicInteger(); // Mutable state!\n    protected abstract void doWork();\n}",
        "trap": "Interfaces cannot hold mutable instance state or constructors; abstract classes are required for stateful lifecycles."
      },
      {
        "id": "q-abs-6",
        "difficulty": "Senior",
        "title": "Protected Access in Abstract Classes vs Public in Interfaces",
        "question": "Can interfaces define protected methods? Why does this matter for API design?",
        "interviewerIntent": "Understanding API exposure boundaries.",
        "juniorTrap": "Trying to declare protected default void hook() in an interface.",
        "problem": "Compiler error: modifier protected not allowed here.",
        "innerWorking": "All non-private methods in an interface are implicitly public. If you need internal extension points accessible only to subclasses, you MUST use an abstract class with protected abstract methods.",
        "seniorAnswer": [
          "Interfaces are public contracts by definition; protected methods are disallowed.",
          "Abstract classes allow protected hooks that clients cannot call directly."
        ],
        "codeSnippet": "abstract class Framework {\n    public void execute() { setup(); run(); } // Public API\n    protected abstract void setup();          // Protected hook for subclasses only!\n}",
        "trap": "Interfaces cannot define protected methods; all non-private interface methods are public."
      },
      {
        "id": "q-abs-7",
        "difficulty": "Senior",
        "title": "Binary Compatibility Hazard with Interface Default Methods",
        "question": "How can adding a default method to an existing interface break binary compatibility with client code at runtime?",
        "interviewerIntent": "Understanding runtime binary compatibility (JLS §13.5.7).",
        "juniorTrap": "Assuming default methods are always 100% backward compatible.",
        "problem": "NoSuchMethodError or IncompatibleClassChangeError at runtime.",
        "innerWorking": "If client class C implements Interface A and Interface B, and Interface B adds default void foo() that conflicts with A.foo(), existing pre-compiled binaries will fail at runtime with IncompatibleClassChangeError when invoked.",
        "seniorAnswer": [
          "Adding default methods can cause runtime link errors if client classes implement other interfaces with colliding signatures.",
          "Always verify interface evolution against common ecosystem dependencies."
        ],
        "codeSnippet": "// Interface A has default void test()\n// Interface B adds default void test()\n// Precompiled Class C implements A, B -> Runtime IncompatibleClassChangeError!",
        "trap": "Adding default methods can cause runtime IncompatibleClassChangeErrors if clients implement multiple evolving interfaces."
      },
      {
        "id": "q-abs-8",
        "difficulty": "Senior",
        "title": "Sub-Interface Priority Rule: More Specific Interface Wins",
        "question": "If Interface B extends Interface A, and both provide default void ping(), which one executes for class C implements B?",
        "interviewerIntent": "Understanding JLS Rule 2 for default method resolution.",
        "juniorTrap": "Expecting a diamond collision compilation error.",
        "problem": "Confusion over whether B overrides A's default.",
        "innerWorking": "JLS Rule 2: Sub-interfaces override super-interfaces. Since B is more specific than A in the inheritance hierarchy, B.ping() is chosen automatically without compiler error.",
        "seniorAnswer": [
          "The most specific default-providing interface wins.",
          "No disambiguation needed if one interface inherits from the other."
        ],
        "codeSnippet": "interface A { default void ping() { System.out.println(\"A\"); } }\ninterface B extends A { default void ping() { System.out.println(\"B\"); } }\nclass C implements B {} // new C().ping() prints: B",
        "trap": "In default method resolution, sub-interfaces automatically override parent interfaces."
      },
      {
        "id": "q-abs-9",
        "difficulty": "Senior",
        "title": "Functional Interface SAM Rule with Object Method Overrides",
        "question": "Why does an interface with boolean equals(Object o) and void execute() still qualify as a @FunctionalInterface?",
        "interviewerIntent": "Testing knowledge of SAM (Single Abstract Method) rules regarding java.lang.Object overrides.",
        "juniorTrap": "Thinking the interface has 2 abstract methods so it cannot be functional.",
        "problem": "Developers confused why Comparator has compare() and equals(Object) but is still a functional interface.",
        "innerWorking": "Public abstract methods that override public methods from java.lang.Object (equals, hashCode, toString) do NOT count toward the Single Abstract Method count, because every implementation class inherits them from Object anyway.",
        "seniorAnswer": [
          "Object method declarations in interfaces refine documentation or return types.",
          "They do not count toward the SAM quota for lambda targets."
        ],
        "codeSnippet": "@FunctionalInterface\ninterface Task {\n    void execute(); // The ONLY abstract method that counts!\n    boolean equals(Object obj); // Object override -> ignored in SAM count!\n}",
        "trap": "Abstract methods overriding public Object methods do not count toward the SAM limit in functional interfaces."
      },
      {
        "id": "q-abs-10",
        "difficulty": "Staff Level",
        "title": "Interface Default Method Performance vs Abstract Class V-Table Dispatch",
        "question": "Is invoking an interface default method slower than invoking an abstract class method at the bytecode level?",
        "interviewerIntent": "Analyzing invokeinterface vs invokevirtual and JIT HotSpot inline caching.",
        "juniorTrap": "Assuming both compile to the exact same bytecode.",
        "problem": "Performance misconceptions in high-frequency trading applications.",
        "innerWorking": "Class methods use invokevirtual (vtable lookup with fixed array offsets). Interfaces use invokeinterface (itable lookup). itable lookup is slightly slower because unrelated classes implement interfaces at varying offsets. However, HotSpot JIT Monomorphic Inline Caching (MIC) inlines 95%+ of calls directly, eliminating the difference.",
        "seniorAnswer": [
          "invokeinterface historically required stub table search; invokevirtual is a direct offset lookup.",
          "C2 JIT monomorphic inline caching makes them virtually identical in steady-state production."
        ],
        "codeSnippet": "// javap -c shows:\n// abstractClass.method() -> invokevirtual #4\n// interface.method()     -> invokeinterface #5, 1",
        "trap": "invokeinterface has slightly more lookup overhead than invokevirtual, but JIT inline caching eliminates the difference."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 4. Method overloading vs. overriding
  # --------------------------------------------------------------------------
  {
    "topicId": "method-overloading-vs-overriding",
    "topicTitle": "Method overloading vs. overriding",
    "category": "OOP & Design",
    "summary": "10 Tricky Questions on Compile-Time Binding, Dynamic Dispatch, Varargs, Boxing & Exception Widening.",
    "questions": [
      {
        "id": "q-over-1",
        "difficulty": "Senior",
        "title": "Ambiguous Method Resolution for null Argument",
        "question": "What happens when calling test(null) with overloaded methods test(String s) and test(Integer i)?",
        "interviewerIntent": "Testing JLS §15.12.2 'Most Specific Method' resolution rules.",
        "juniorTrap": "Thinking String wins, or Object wins, or it executes randomly.",
        "problem": "Compilation error: reference to test is ambiguous.",
        "innerWorking": "Compiler searches for the most specific method where parameter types are subtypes of others. Neither String nor Integer is a subtype of the other. Compiler rejects it as ambiguous.",
        "seniorAnswer": [
          "Compiler selects most specific subtype.",
          "If sibling types match null with equal specificity, compilation fails.",
          "Disambiguate by casting: test((String) null)."
        ],
        "codeSnippet": "void test(String s) {}\nvoid test(Integer i) {}\n// test(null); // COMPILE ERROR: Ambiguous reference!",
        "trap": "test(null) fails to compile when overloaded with sibling types that have no subtype relationship."
      },
      {
        "id": "q-over-2",
        "difficulty": "Senior",
        "title": "Widening Primitive vs Autoboxing Precedence",
        "question": "When int x = 5 is passed to test(long) and test(Integer), which one is invoked?",
        "interviewerIntent": "Verifying JLS 3-phase overload resolution order.",
        "juniorTrap": "Thinking int autoboxes to Integer because both represent integers.",
        "problem": "Assuming boxing precedes widening.",
        "innerWorking": "Overload resolution phases: Phase 1: Subtyping without boxing/varargs (widening primitive). Phase 2: Boxing/unboxing. Phase 3: Varargs. Primitive widening (int -> long) wins in Phase 1, avoiding heap allocation.",
        "seniorAnswer": [
          "Primitive widening always takes precedence over autoboxing.",
          "test(long) executes; test(Integer) is ignored unless explicitly passed Integer.valueOf(5)."
        ],
        "codeSnippet": "void test(long n) { System.out.println(\"long\"); }\nvoid test(Integer n) { System.out.println(\"Integer\"); }\nint x = 10; test(x); // Prints: long!",
        "trap": "Primitive widening takes precedence over autoboxing in method overload resolution."
      },
      {
        "id": "q-over-3",
        "difficulty": "Senior",
        "title": "Autoboxing vs Varargs Precedence",
        "question": "When int x = 5 is passed to test(Integer) and test(int... vars), which one executes?",
        "interviewerIntent": "Testing Phase 2 (boxing) vs Phase 3 (varargs) precedence.",
        "juniorTrap": "Thinking varargs with int avoids boxing so it wins.",
        "problem": "Varargs creates an array allocation on every call.",
        "innerWorking": "Phase 2 (boxing) is evaluated before Phase 3 (varargs). Autoboxing int -> Integer wins over int... varargs array creation.",
        "seniorAnswer": [
          "Boxing beats Varargs.",
          "Varargs is the lowest priority in overload resolution."
        ],
        "codeSnippet": "void test(Integer n) { System.out.println(\"Boxed\"); }\nvoid test(int... arr) { System.out.println(\"Varargs\"); }\ntest(5); // Prints: Boxed!",
        "trap": "Autoboxing takes precedence over varargs during method overload resolution."
      },
      {
        "id": "q-over-4",
        "difficulty": "Senior",
        "title": "Cannot Box and Widen in a Single Step",
        "question": "Why does passing an int x = 5 to a method test(Long n) fail to compile?",
        "interviewerIntent": "Testing JLS rule forbidding combined boxing and widening.",
        "juniorTrap": "Expecting int to box to Integer, then widen Integer to Long.",
        "problem": "Compilation error: incompatible types: int cannot be converted to Long.",
        "innerWorking": "The compiler permits widening primitive (int -> long) OR boxing (int -> Integer), but NEVER boxing followed by reference widening (int cannot become Long because Integer does not extend Long).",
        "seniorAnswer": [
          "Java does not support compound boxing-then-widening.",
          "Fix: Pass 5L or (long) 5."
        ],
        "codeSnippet": "void test(Long n) {}\nint x = 5;\n// test(x); // COMPILE ERROR! int cannot convert to Long directly.",
        "trap": "Java will not perform boxing and reference widening in a single step (int cannot convert to Long)."
      },
      {
        "id": "q-over-5",
        "difficulty": "Senior",
        "title": "Overriding and Exception Throws Clauses",
        "question": "Can an overriding method throw a broader checked exception than the base method (e.g. Base throws IOException, Child throws Exception)?",
        "interviewerIntent": "Understanding Liskov Substitution Principle applied to exception contracts.",
        "juniorTrap": "Thinking Child can throw any exception it wants.",
        "problem": "Compilation error: overridden method does not throw Exception.",
        "innerWorking": "An overriding method can throw: 1) Same exception. 2) Subclasses of declared exceptions (narrower). 3) Fewer or no checked exceptions. 4) Any unchecked exceptions (RuntimeException). It CANNOT throw broader checked exceptions.",
        "seniorAnswer": [
          "Subclasses cannot violate caller catch contracts.",
          "Can narrow checked exceptions or omit them completely.",
          "Can throw any RuntimeException."
        ],
        "codeSnippet": "class Base { void run() throws IOException {} }\nclass Sub extends Base {\n    // void run() throws Exception {} // COMPILE ERROR!\n    void run() throws FileNotFoundException {} // OK (Narrower)\n}",
        "trap": "An overriding method cannot throw broader or new checked exceptions than declared by the parent."
      },
      {
        "id": "q-over-6",
        "difficulty": "Senior",
        "title": "Covariant Return Types in Overriding",
        "question": "Can an overriding method change the return type to a subtype (e.g. Base returns Object, Child returns String)?",
        "interviewerIntent": "Testing knowledge of Covariant Returns introduced in Java 5.",
        "juniorTrap": "Believing overriding requires 100% exact return type match.",
        "problem": "Confusion regarding compiler bridge methods.",
        "innerWorking": "Java 5+ supports covariant return types. The subclass method can return a subtype. Under the hood, the compiler generates a synthetic Bridge Method with the original return type to satisfy the vtable.",
        "seniorAnswer": [
          "Overriding methods can return subtypes of the base return type.",
          "Javac generates a synthetic bridge method in bytecode to preserve binary compatibility."
        ],
        "codeSnippet": "class Base { Object get() { return null; } }\nclass Sub extends Base { @Override String get() { return \"hello\"; } } // Legal covariant return!",
        "trap": "Overridden methods can return subtypes (covariant returns) via synthetic compiler bridge methods."
      },
      {
        "id": "q-over-7",
        "difficulty": "Senior",
        "title": "Field Shadowing vs Method Overriding",
        "question": "What is printed by Parent p = new Child(); System.out.println(p.name); when both Parent and Child declare public String name?",
        "interviewerIntent": "Differentiating field shadowing (resolved by reference type) from method overriding (resolved by instance type).",
        "juniorTrap": "Assuming fields are polymorphic like methods.",
        "problem": "Code reads parent field instead of child field.",
        "innerWorking": "Fields are NOT polymorphic in Java. Field access is resolved at compile time based on the declared static reference type (Parent). The Child's field simply shadows (hides) the parent's field.",
        "seniorAnswer": [
          "Variables are resolved at compile time by reference type.",
          "Methods are resolved at runtime by actual heap object type.",
          "Never declare public fields in hierarchies; use getters."
        ],
        "codeSnippet": "class Parent { public String name = \"Parent\"; }\nclass Child extends Parent { public String name = \"Child\"; }\nParent p = new Child();\nSystem.out.println(p.name); // Prints: Parent!",
        "trap": "Fields in Java are not polymorphic; field access is resolved strictly by reference type."
      },
      {
        "id": "q-over-8",
        "difficulty": "Senior",
        "title": "Overload Resolution with Polymorphic Reference Arguments",
        "question": "Given void process(Parent p) and void process(Child c), which method is called by Parent p = new Child(); process(p);?",
        "interviewerIntent": "Clarifying that overloading is statically dispatched based on the reference type.",
        "juniorTrap": "Expecting process(Child) to execute because the runtime object is a Child.",
        "problem": "Overloading does not perform double-dispatch.",
        "innerWorking": "Method overloading is resolved at COMPILE TIME based on the static type of the argument reference. Since p is declared as Parent, process(Parent) is chosen at compile time.",
        "seniorAnswer": [
          "Java is single-dispatch, not double-dispatch.",
          "Overload resolution uses static reference type; only overriding uses dynamic runtime dispatch.",
          "To achieve double dispatch, use the Visitor pattern."
        ],
        "codeSnippet": "Parent p = new Child();\nprocess(p); // Calls process(Parent), NOT process(Child)!",
        "trap": "Method overloading is resolved at compile time based on the argument's declared reference type."
      },
      {
        "id": "q-over-9",
        "difficulty": "Senior",
        "title": "Access Modifier Restrictions in Overriding",
        "question": "Can an overriding method make the access modifier more restrictive (e.g. base is public, child is protected)?",
        "interviewerIntent": "Verifying Liskov Substitution Principle enforcement on visibility.",
        "juniorTrap": "Thinking subclasses can hide methods they don't want callers to access.",
        "problem": "Compilation error: attempting to assign weaker access privileges; was public.",
        "innerWorking": "An overriding method cannot reduce visibility (public cannot become protected or private). It CAN expand visibility (protected can become public).",
        "seniorAnswer": [
          "Visibility can be widened (protected -> public).",
          "Visibility cannot be narrowed (public -> protected -> compile error)."
        ],
        "codeSnippet": "class Base { public void work() {} }\nclass Sub extends Base {\n    // protected void work() {} // COMPILE ERROR! Cannot reduce visibility.\n}",
        "trap": "Subclass methods cannot reduce the visibility of overridden methods (cannot weaken access privileges)."
      },
      {
        "id": "q-over-10",
        "difficulty": "Staff Level",
        "title": "Synthetic Bridge Methods and Reflection Inconsistencies",
        "question": "Why does calling Class.getDeclaredMethods() on a class with covariant returns or generic overrides return TWO methods with identical names?",
        "interviewerIntent": "Understanding synthetic compiler bridge methods and reflection traps.",
        "juniorTrap": "Assuming each method in Java code maps to exactly one method in bytecode.",
        "problem": "Reflection code fails with AmbiguousMethodException or invokes the bridge method unexpectedly.",
        "innerWorking": "To satisfy legacy JVM vtables when return types or generic type parameters are narrowed, javac generates a synthetic bridge method: public Object get() which delegates to public String get(). Check method.isBridge().",
        "seniorAnswer": [
          "Bridge methods are synthetic methods generated by javac to support generics and covariant returns.",
          "In reflection, filter out method.isBridge() and method.isSynthetic()."
        ],
        "codeSnippet": "for (Method m : Sub.class.getDeclaredMethods()) {\n    if (m.getName().equals(\"get\")) {\n        System.out.println(m + \" isBridge: \" + m.isBridge());\n    }\n}",
        "trap": "Covariant returns and generic overrides generate synthetic bridge methods visible during reflection."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 5. final keyword (variable, method, class)
  # --------------------------------------------------------------------------
  {
    "topicId": "final-keyword-variable-method-class",
    "topicTitle": "final keyword (variable, method, class)",
    "category": "OOP & Design",
    "summary": "10 Tricky Questions on JMM Field Freezes, Blank Finals, Inlining, Immutability & Proxies.",
    "questions": [
      {
        "id": "q-fin-1",
        "difficulty": "Senior",
        "title": "Final Reference vs Object State Immutability",
        "question": "Does private final List<String> list = new ArrayList<>() make the list immutable? What does final actually guarantee?",
        "interviewerIntent": "Distinguishing reference immutability from state immutability.",
        "juniorTrap": "Believing elements cannot be added, removed, or modified in a final collection.",
        "problem": "Accidental state corruption when exposing a final collection via a public getter.",
        "innerWorking": "final on a variable means the reference pointer cannot be reassigned to point to another object on the heap. The object itself remains 100% mutable.",
        "seniorAnswer": [
          "final guarantees pointer freeze, not object immutability.",
          "For true immutability, wrap with Collections.unmodifiableList() or List.copyOf()."
        ],
        "codeSnippet": "final List<String> list = new ArrayList<>();\nlist.add(\"Mutated!\"); // Perfectly legal!\n// list = new ArrayList<>(); // COMPILE ERROR: cannot assign a value to final variable",
        "trap": "The final keyword prevents pointer reassignment; it provides zero protection against object mutation."
      },
      {
        "id": "q-fin-2",
        "difficulty": "Staff Level",
        "title": "JMM Final Field Freeze & Thread-Safe Publication",
        "question": "How does the Java Memory Model (JSR-133) guarantee safe publication of final fields without synchronization?",
        "interviewerIntent": "Understanding memory freeze barriers inserted at the end of constructors.",
        "juniorTrap": "Thinking volatile or synchronized is needed to publish immutable objects across threads.",
        "problem": "Thread seeing partially initialized fields in newly created objects.",
        "innerWorking": "Under JSR-133, the JVM inserts a memory freeze barrier at the end of the constructor for all final fields. Any thread reading a properly published reference is guaranteed to see the initialized final fields without synchronization, provided 'this' did not escape during construction.",
        "seniorAnswer": [
          "Final fields provide safe publication guarantees without volatile overhead.",
          "Guarantee holds ONLY if the 'this' reference does not escape the constructor before completion."
        ],
        "codeSnippet": "class SafePublication {\n    private final int value;\n    public SafePublication(int v) { this.value = v; } // JMM Freeze barrier at end of constructor!\n}",
        "trap": "Final fields are guaranteed safely visible across threads after constructor completion, provided 'this' does not escape."
      },
      {
        "id": "q-fin-3",
        "difficulty": "Senior",
        "title": "Blank Final Variable Initialization Rules",
        "question": "What is a 'blank final' variable, and what are the compiler rules regarding its initialization?",
        "interviewerIntent": "Verifying definite assignment rules (JLS §16).",
        "juniorTrap": "Thinking final fields must be initialized on the line of declaration.",
        "problem": "Compiler error: variable might not have been initialized or variable might already have been assigned.",
        "innerWorking": "A blank final is declared without an initial value. It MUST be definitely assigned in EVERY constructor (for instance fields) or static block (for static fields) exactly once along all execution paths.",
        "seniorAnswer": [
          "Instance blank finals must be assigned in every constructor exactly once.",
          "Cannot be assigned inside helper methods called from constructors.",
          "Static blank finals must be assigned in static initializer blocks."
        ],
        "codeSnippet": "class Config {\n    private final int port; // Blank final\n    public Config(int p) { this.port = p; } // Definitely assigned\n}",
        "trap": "Blank final fields must be definitely assigned in every constructor exactly once."
      },
      {
        "id": "q-fin-4",
        "difficulty": "Senior",
        "title": "JIT Constant Inlining and Stale Recompilation",
        "question": "What happens if public static final int TIMEOUT = 5000 in Library A is changed to 10000, but Client B is NOT recompiled?",
        "interviewerIntent": "Understanding compile-time constant folding into calling class bytecode.",
        "juniorTrap": "Assuming Client B will read the new value at runtime.",
        "problem": "Client B continues to run with TIMEOUT = 5000 in production even after deploying the new Library A jar!",
        "innerWorking": "Compile-time constants (primitive and String literals) are inlined directly into Client B's bytecode by javac at compile time (bipush/ldc). Client B never reads Library A's field at runtime unless recompiled.",
        "seniorAnswer": [
          "static final primitives and Strings are inlined at compile time.",
          "Modifying a constant requires recompiling all downstream consumers.",
          "Workaround: Use static methods (public static int getTimeout()) to avoid inlining."
        ],
        "codeSnippet": "// In Library: public static final int MAX = 100;\n// In Client: System.out.println(Library.MAX); -> Bytecode inlines: iconst 100!",
        "trap": "Compile-time constants are inlined directly into consumer bytecode; changing them requires recompilation."
      },
      {
        "id": "q-fin-5",
        "difficulty": "Staff Level",
        "title": "Final Classes Breaking CGLIB Proxies in Spring/Hibernate",
        "question": "Why does making a Spring @Service class 'final' cause Spring AOP, @Transactional, and Hibernate lazy loading to fail at startup?",
        "interviewerIntent": "Connecting Java language finality to bytecode generation frameworks (CGLIB / ByteBuddy).",
        "juniorTrap": "Marking classes final for security, unknowingly breaking Spring dynamic subclassing.",
        "problem": "Startup failure: Cannot subclass final class com.example.UserService.",
        "innerWorking": "Spring CGLIB and Hibernate lazy loading create dynamic subclasses at runtime (e.g. UserService$$SpringCGLIB$$0). If the class or methods are final, the JVM forbids subclassing and method overriding, preventing proxy generation.",
        "seniorAnswer": [
          "Spring CGLIB proxies require subclassing the target bean.",
          "Final classes or methods cannot be intercepted for @Transactional, @Async, or @Cacheable.",
          "Use interface-based JDK dynamic proxies or avoid final on Spring beans."
        ],
        "codeSnippet": "@Service\npublic final class UserService {} // BREAKS Spring CGLIB proxy generation at startup!",
        "trap": "Final classes and methods cannot be proxied by CGLIB, breaking @Transactional and AOP."
      },
      {
        "id": "q-fin-6",
        "difficulty": "Senior",
        "title": "Final Method Inlining and JIT Optimization",
        "question": "Does marking a method 'final' actually improve performance in modern HotSpot JVMs?",
        "interviewerIntent": "Evaluating modern JIT optimization awareness vs legacy Java folklore.",
        "juniorTrap": "Believing you must mark methods final so the JIT inlines them.",
        "problem": "Adding final everywhere unnecessarily restricting testability and mockability.",
        "innerWorking": "In modern HotSpot JVMs, the C2 compiler performs Class Hierarchy Analysis (CHA). If a method is not currently overridden by any loaded class, the JIT inlines it anyway (Monomorphic Call Site), regardless of whether it is declared final. If a subclass is dynamically loaded later, the JIT deoptimizes.",
        "seniorAnswer": [
          "Mark methods final for design clarity (preventing overrides), not for micro-benchmarks.",
          "HotSpot JIT inlines effectively using Class Hierarchy Analysis without final keyword."
        ],
        "codeSnippet": "public final void process() {} // Inlined by JIT, but non-final would also be inlined via CHA!",
        "trap": "HotSpot JIT inlines non-final methods automatically via Class Hierarchy Analysis; final is for API design."
      },
      {
        "id": "q-fin-7",
        "difficulty": "Senior",
        "title": "Effectively Final Variables in Lambdas and Anonymous Classes",
        "question": "Why must local variables accessed inside lambdas be final or 'effectively final'? What happens if they are mutated?",
        "interviewerIntent": "Understanding stack allocation vs heap closure capture.",
        "juniorTrap": "Believing lambdas share the local method stack frame.",
        "problem": "Compilation error: local variables referenced from a lambda must be final or effectively final.",
        "innerWorking": "Local variables live on the method stack and vanish when the method returns. Lambdas execute asynchronously or outlive the method on the heap. Java captures variables by copying their values. If mutation were allowed, the stack copy and heap copy would desynchronize.",
        "seniorAnswer": [
          "Lambdas capture a copy of the primitive/reference value.",
          "Must be effectively final to prevent consistency illusions between stack and heap.",
          "Workaround for counters: Use AtomicInteger or 1-element array int[] holder = {0}."
        ],
        "codeSnippet": "int counter = 0;\n// Runnable r = () -> counter++; // COMPILE ERROR! Variable must be effectively final.",
        "trap": "Local variables captured by lambdas must be effectively final because the lambda copies their values to the heap."
      },
      {
        "id": "q-fin-8",
        "difficulty": "Staff Level",
        "title": "Modifying Final Fields via Reflection: Security & JIT Traps",
        "question": "Can reflection modify private final fields? What are the bizarre side-effects when JIT optimizations run?",
        "interviewerIntent": "Testing reflection internals, Field.setAccessible, and JIT constant propagation.",
        "juniorTrap": "Thinking reflection updates the field everywhere consistently.",
        "problem": "field.get(obj) reflects the new value, but obj.printValue() continues printing the old value!",
        "innerWorking": "The JIT compiler assumes final fields never change and constants-propagates them into machine registers. Modifying the field via reflection updates heap memory, but JIT-compiled native code reads the inlined value from registers!",
        "seniorAnswer": [
          "Reflection can modify final fields via setAccessible(true) (prior to Java 17).",
          "JIT constant folding results in split-brain state where direct reads and getter calls disagree.",
          "Java 17+ strongly encapsulates JDK internals, throwing InaccessibleObjectException."
        ],
        "codeSnippet": "Field f = obj.getClass().getDeclaredField(\"id\");\nf.setAccessible(true);\nf.setInt(obj, 999); // Updates heap, but JIT compiled code may still read old constant!",
        "trap": "Mutating final fields via reflection causes split-brain state due to JIT constant folding."
      },
      {
        "id": "q-fin-9",
        "difficulty": "Senior",
        "title": "Final Parameters in Method Signatures",
        "question": "Does declaring void save(final User user) have any runtime or bytecode impact?",
        "interviewerIntent": "Distinguishing compiler checks from runtime bytecode instructions.",
        "juniorTrap": "Believing final parameters prevent modifying user.setName().",
        "problem": "Assuming final parameters make objects read-only.",
        "innerWorking": "final parameters exist solely for compile-time enforcement: preventing reassigning user = null inside the method body. It generates no special bytecode and does not prevent modifying the user object's state.",
        "seniorAnswer": [
          "Purely a compile-time check against variable reassignment.",
          "Zero runtime bytecode impact.",
          "Does not make the argument object immutable."
        ],
        "codeSnippet": "void update(final User user) {\n    user.setName(\"Alice\"); // LEGAL!\n    // user = new User(); // COMPILE ERROR\n}",
        "trap": "final on method parameters only prevents reassigning the parameter reference inside the method body."
      },
      {
        "id": "q-fin-10",
        "difficulty": "Senior",
        "title": "Finalizer Attack Prevention using Final Methods or Final Classes",
        "question": "How does a final class or final finalize() method protect against Finalizer Attacks during construction failure?",
        "interviewerIntent": "Understanding security vulnerability CVE patterns around object resurrection.",
        "juniorTrap": "Assuming throwing an exception in a constructor prevents the object from ever running code.",
        "problem": "An attacker subclasses a sensitive class, triggers an exception in constructor, and resurrects the half-initialized object in finalize().",
        "innerWorking": "Even if a constructor throws an exception, the JVM still registers the object for finalization if allocated. A malicious subclass overrides finalize() to store 'this' in a static list, bypassing constructor validation security checks! Making the class final prevents subclassing.",
        "seniorAnswer": [
          "Throwing an exception in a constructor does not prevent finalize() from executing.",
          "Mark the class final, or declare final void finalize() {} in the base class to prevent finalizer attacks.",
          "Modern defense: Use Cleaner or avoid finalize completely (deprecated)."
        ],
        "codeSnippet": "public final class BankSecurityAccount { \n    // Final class prevents subclass finalizer resurrection attacks!\n}",
        "trap": "Throwing an exception in a constructor does not stop finalization; make classes final to block finalizer attacks."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 6. SOLID principles
  # --------------------------------------------------------------------------
  {
    "topicId": "solid-principles",
    "topicTitle": "SOLID principles",
    "category": "OOP & Design",
    "summary": "10 Tricky Questions on SRP Cohesion, OCP Extensions, LSP Invariants, ISP Granularity & DIP Inversion.",
    "questions": [
      {
        "id": "q-solid-1",
        "difficulty": "Senior",
        "title": "Single Responsibility Principle (SRP): Actor vs Functionality",
        "question": "Does SRP mean 'a class should only do one thing'? What is Uncle Bob's true definition regarding actors?",
        "interviewerIntent": "Disentangling the common misconception of SRP as function-level modularity vs architectural cohesion.",
        "juniorTrap": "Splitting a class into 100 single-method classes believing each method is a single responsibility.",
        "problem": "Extreme fragmentation of codebases with anemic classes that destroy cohesion.",
        "innerWorking": "Robert C. Martin's definition: 'A module should be responsible to one, and only one, actor.' An actor is a group of users/stakeholders who request changes. E.g., Employee class calculating pay (CFO), reporting hours (COO), and saving to DB (CTO) violates SRP because changes requested by CFO can break COO's logic.",
        "seniorAnswer": [
          "SRP is about actors and reasons to change, not having only one method.",
          "Separate code by who requested the business rules (CFO logic vs CTO persistence).",
          "High cohesion around business domains."
        ],
        "codeSnippet": "// VIOLATION: 3 distinct business actors (CFO, COO, CTO) in 1 class\nclass Employee { void calcPay() {} void reportHours() {} void save() {} }",
        "trap": "SRP means a class should have one reason to change (serving one actor), not that it only has one method."
      },
      {
        "id": "q-solid-2",
        "difficulty": "Senior",
        "title": "Open/Closed Principle (OCP) vs Switch Statements in Java",
        "question": "When does a switch statement violate OCP, and when does it legitimately comply (e.g. sealed classes)?",
        "interviewerIntent": "Evaluating modern pattern matching vs GoF polymorphism trade-offs.",
        "juniorTrap": "Claiming that all switch statements are automatically OCP violations that must be replaced by Strategy pattern.",
        "problem": "Over-engineering simple data operations into 20 factory/strategy classes.",
        "innerWorking": "Traditional switch on type codes violates OCP because adding a new type requires finding and editing every switch in the codebase. However, with Java 21 Sealed Classes and Pattern Matching, algebraic data types intentionally keep the type hierarchy closed to allow adding new operations (functions) without modifying the types (Expression Problem).",
        "seniorAnswer": [
          "Classic switch across business rules violates OCP: prefer polymorphism.",
          "Sealed hierarchies switch statements invert OCP: easy to add new operations, hard to add new types.",
          "Choose polymorphism when adding new types is frequent; choose sealed pattern matching when adding new operations is frequent."
        ],
        "codeSnippet": "// Modern Sealed OCP balance: Compiler guarantees exhaustiveness!\nreturn switch(shape) { case Circle c -> c.r() * c.r() * Math.PI; case Square s -> s.w() * s.w(); };",
        "trap": "Switch on types violates OCP unless backed by sealed classes where operations are open and types are closed."
      },
      {
        "id": "q-solid-3",
        "difficulty": "Staff Level",
        "title": "LSP Preconditions and Postconditions Rules",
        "question": "What are Bertrand Meyer's rules regarding preconditions and postconditions when overriding methods under LSP?",
        "interviewerIntent": "Testing formal contract design (Design by Contract).",
        "juniorTrap": "Assuming subclass methods can validate more aggressively than their parent.",
        "problem": "A subclass throws IllegalArgumentException for inputs that the parent class accepts gracefully.",
        "innerWorking": "LSP Contract Rules: 1) Preconditions cannot be strengthened in a subtype (you cannot require more than the parent). 2) Postconditions cannot be weakened in a subtype (you cannot return less than guaranteed). 3) Invariants of the supertype must be preserved.",
        "seniorAnswer": [
          "Subclasses must accept all inputs accepted by the parent.",
          "Subclasses cannot return null if parent guarantees non-null.",
          "Throwing UnsupportedOperationException in a subclass violates LSP."
        ],
        "codeSnippet": "// Base accepts positive and negative numbers\nclass Calculator { int calc(int x) { return x * 2; } }\n// Subclass STRENGTHENS precondition (LSP VIOLATION!):\nclass PositiveCalculator extends Calculator {\n    @Override int calc(int x) {\n        if (x < 0) throw new IllegalArgumentException(); // BROKE LSP!\n        return super.calc(x);\n    }\n}",
        "trap": "Subtypes cannot strengthen preconditions (require more) or weaken postconditions (guarantee less)."
      },
      {
        "id": "q-solid-4",
        "difficulty": "Senior",
        "title": "Interface Segregation Principle (ISP) vs Fat Interfaces",
        "question": "How does Java's own standard library demonstrate ISP through modern functional interfaces?",
        "interviewerIntent": "Recognizing fine-grained interface design.",
        "juniorTrap": "Creating large 'all-in-one' repository or service interfaces with 30 methods.",
        "problem": "Clients forced to depend on methods they never use or implement dummy empty bodies.",
        "innerWorking": "ISP states clients should not be forced to depend upon interfaces that they do not use. In Java 8, java.util.function provides granular Single Abstract Method interfaces (Consumer, Supplier, Function, Predicate). A method needing a reader depends on Supplier, not on an entire service.",
        "seniorAnswer": [
          "Split fat interfaces into role-based interfaces.",
          "Clients depend only on the minimal method set they consume.",
          "Composable interfaces (Readable, Writable, Closeable)."
        ],
        "codeSnippet": "// FAT Interface violates ISP:\ninterface MultiWorker { void print(); void scan(); void fax(); }\n// SEGREGATED Interfaces satisfy ISP:\ninterface Printer { void print(); }\ninterface Scanner { void scan(); }",
        "trap": "Clients should never be forced to depend on methods they do not use; segregate fat interfaces."
      },
      {
        "id": "q-solid-5",
        "difficulty": "Senior",
        "title": "Dependency Inversion Principle (DIP) vs Dependency Injection (DI)",
        "question": "What is the difference between the Dependency Inversion Principle (DIP) and Dependency Injection (DI)?",
        "interviewerIntent": "Clarifying architectural principle (DIP) vs implementation pattern/framework (DI).",
        "juniorTrap": "Saying 'DIP is using Spring @Autowired'.",
        "problem": "Assuming Spring or Guice is required to achieve Dependency Inversion.",
        "innerWorking": "DIP is an architectural principle: 1) High-level modules should not depend on low-level modules; both should depend on abstractions. 2) Abstractions should not depend on details; details depend on abstractions. DI is simply a creational design pattern (passing dependencies via constructor/setter). You can do DIP without Spring DI.",
        "seniorAnswer": [
          "DIP is the architectural rule defining dependency direction.",
          "DI is the plumbing technique to pass dependencies from the outside.",
          "IoC (Inversion of Control) is the broader paradigm."
        ],
        "codeSnippet": "// High-level OrderService depends on ABSTRACTION PaymentGateway (DIP)\n// Dependency is INJECTED via constructor (DI)\npublic class OrderService {\n    private final PaymentGateway payment; \n    public OrderService(PaymentGateway payment) { this.payment = payment; }\n}",
        "trap": "DIP is the architectural rule that high-level modules depend on abstractions; DI is the injection mechanism."
      },
      {
        "id": "q-solid-6",
        "difficulty": "Senior",
        "title": "LSP Violation: Throwing UnsupportedOperationException",
        "question": "Why does java.util.Collections.unmodifiableList().add() throwing UnsupportedOperationException violate LSP?",
        "interviewerIntent": "Critiquing JDK collection design tradeoffs under formal OOP rules.",
        "juniorTrap": "Claiming it does not violate LSP because it's documented in the Javadoc.",
        "problem": "A method expecting List<String> calling list.add() crashes at runtime because an unmodifiable list was passed.",
        "innerWorking": "List contract defines add() as a mutating operation. If an implementation refuses to support add() by throwing runtime exceptions, it cannot be safely substituted for List without caller defensive checks. The Java designers made this pragmatic compromise to avoid duplicating collection hierarchies.",
        "seniorAnswer": [
          "Documented compromise in Java collections, but formal LSP violation.",
          "Better design: Separate ImmutableList from MutableList (like Scala or Kotlin).",
          "Never throw UnsupportedOperationException in standard business class overrides."
        ],
        "codeSnippet": "List<String> list = Collections.unmodifiableList(new ArrayList<>());\nlist.add(\"test\"); // THROWS UnsupportedOperationException at runtime! (Violates LSP)",
        "trap": "Throwing UnsupportedOperationException when implementing an interface method is a direct violation of LSP."
      },
      {
        "id": "q-solid-7",
        "difficulty": "Senior",
        "title": "Open/Closed Principle via Decorator and Strategy Patterns",
        "question": "How do Decorator and Strategy design patterns implement the Open/Closed Principle without subclassing?",
        "interviewerIntent": "Evaluating practical design pattern application for extensibility.",
        "juniorTrap": "Modifying existing core service classes with boolean flags whenever new features arrive.",
        "problem": "Adding logging, caching, and rate limiting by mutating the core business method with tangled if-else statements.",
        "innerWorking": "OCP: Software entities should be open for extension, but closed for modification. Decorator wraps the core interface to add cross-cutting behavior (caching, metrics) without changing a single line of core logic. Strategy injects interchangeable algorithms.",
        "seniorAnswer": [
          "Core class remains untouched and stable.",
          "New behaviors added by creating new decorator wrappers.",
          "Chained execution: new CachingDecorator(new LoggingDecorator(new CoreService()))."
        ],
        "codeSnippet": "public class CachingOrderService implements OrderService {\n    private final OrderService delegate; // Closed for modification, open for extension!\n    public CachingOrderService(OrderService s) { this.delegate = s; }\n}",
        "trap": "Extend behavior by wrapping classes with decorators or injecting strategies, rather than editing core code."
      },
      {
        "id": "q-solid-8",
        "difficulty": "Staff Level",
        "title": "Interface Pollution and ISP in Microservice Client SDKs",
        "question": "How does ISP prevent cascading build deployments when building shared internal Java client libraries?",
        "interviewerIntent": "Applying SOLID principles to enterprise distributed architecture and build cycles.",
        "juniorTrap": "Generating one massive 200-method Java SDK jar for an entire domain API.",
        "problem": "Service A only needs user name, but when billing methods in the shared SDK change, Service A must be rebuilt and redeployed.",
        "innerWorking": "If client apps depend on a monolithic SDK interface, any change to unused methods breaks binary compatibility or forces recompilation. Segregating interfaces into UserProfileClient, UserBillingClient, UserAuthClient isolates build dependency graphs.",
        "seniorAnswer": [
          "Granular interfaces prevent unnecessary recompilations and deployments.",
          "Clients only recompile when the methods they actually consume change.",
          "Minimizes blast radius of microservice contract evolutions."
        ],
        "codeSnippet": "// Segregated SDK interfaces:\npublic interface UserProfileReader { UserProfile getProfile(String id); }\npublic interface UserBillingManager { void bill(String id, BigDecimal amt); }",
        "trap": "Monolithic client SDKs violate ISP, forcing unrelated microservices to recompile when unused endpoints change."
      },
      {
        "id": "q-solid-9",
        "difficulty": "Senior",
        "title": "DIP Violation via Concrete Factory Instantiations",
        "question": "Why does calling new MySQLDatabase() inside a business service violate DIP, and how does Inversion of Control resolve it?",
        "interviewerIntent": "Understanding direct dependency coupling and the purpose of IoC containers.",
        "juniorTrap": "Writing 'private Database db = new MySQLDatabase();' and claiming it's fine because Database is an interface.",
        "problem": "Service is tightly coupled to concrete MySQL implementation; cannot unit test without real MySQL database running.",
        "innerWorking": "Even if the variable is an interface, the new keyword hardcodes a direct compile-time dependency on the concrete implementation. The high-level service cannot be compiled or tested without the low-level MySQL class. IoC delegates instantiation to an assembler.",
        "seniorAnswer": [
          "The 'new' keyword creates concrete coupling.",
          "Invert control by accepting the interface via constructor.",
          "Assembler / IoC container injects the concrete instance."
        ],
        "codeSnippet": "// VIOLATION: Hardcoded concrete coupling\nprivate Database db = new MySQLDatabase();\n// SATISFIES DIP: High-level depends on abstraction, injected from outside\npublic OrderService(Database db) { this.db = db; }",
        "trap": "Using 'new ConcreteClass()' inside business logic violates DIP by tightly coupling to low-level details."
      },
      {
        "id": "q-solid-10",
        "difficulty": "Staff Level",
        "title": "SOLID Trade-offs: Over-Abstraction vs YAGNI",
        "question": "When does dogmatic application of SOLID principles become an anti-pattern? How do you recognize over-engineering?",
        "interviewerIntent": "Evaluating pragmatic engineering judgment vs dogmatic rule-following.",
        "juniorTrap": "Creating interfaces and factories for every single 5-line utility method.",
        "problem": "Codebase bloated with UserServiceImpl implementing UserService, factories with only one implementation, and impossible cognitive navigation.",
        "innerWorking": "SOLID principles are guidelines to manage complexity and change. If a module has zero probability of change or alternate implementations, adding interfaces, factories, and multiple layers adds cognitive drag without architectural payoff (YAGNI violation).",
        "seniorAnswer": [
          "SOLID manages change; where change is non-existent, abstractions are premature.",
          "Smells: 1-to-1 interface-to-implementation pairings with no alternate implementations or test mocks.",
          "Start simple, refactor to abstractions when change pressure arrives (Rule of Three)."
        ],
        "codeSnippet": "// Anti-pattern: Dogmatic interface with no second implementation\ninterface UserGreeter { void greet(); }\nclass UserGreeterImpl implements UserGreeter { public void greet() { System.out.println(\"Hi\"); } }",
        "trap": "Applying SOLID dogmatically creates premature abstractions and code bloat; balance with YAGNI."
      }
    ]
  }
]
