// scripts/build-java-questions.js
const fs = require('fs');
const path = require('path');

const javaDataPath = path.join(__dirname, '..', 'js', 'data', 'java-data.js');
let currentContent = fs.readFileSync(javaDataPath, 'utf8');

// Ensure we only append once or replace existing JAVA_QUESTIONS block
const marker = 'window.REVISION_APP_DATA.JAVA_QUESTIONS =';
if (currentContent.includes(marker)) {
  currentContent = currentContent.substring(0, currentContent.indexOf(marker)).trimEnd() + '\n\n';
}

const javaQuestions = [
  // =========================================================================
  // CATEGORY 1: OOP & Design
  // =========================================================================
  {
    id: "q-java-equals-hashcode-contract",
    category: "OOP & Design",
    difficulty: "Senior",
    title: "equals() and hashCode() Contract: Mutable Keys, Hash Bucket Dislocation & Silent Memory Leaks",
    question: "What happens when a mutable object is used as a key in HashMap/HashSet and its fields are modified after insertion?",
    interviewerIntent: "Testing whether the candidate understands hash bucket addressing, invariant enforcement in collections, and memory leak diagnosis.",
    juniorTrap: "Assuming that because the exact same object reference (==) is passed to map.get(key), the map will find it regardless of field mutations.",
    problem: "An object inserted into a HashMap becomes unretrievable after mutating its fields, while map.size() still reports 1 and keys cannot be removed.",
    innerWorking: "HashMap computes bucket index via (n - 1) & hash(key.hashCode()). If a key's fields are mutated, hashCode() changes. A subsequent get(key) computes a completely different bucket index. Even if by coincidence it maps to the same bucket, equals() may now fail. The entry becomes a phantom zombie object in heap memory.",
    seniorAnswer: [
      "Contract Invariant: If a.equals(b) is true, then a.hashCode() MUST equal b.hashCode(). Consistency: If state doesn't change, hashCode() must return the exact same integer.",
      "Bucket Dislocation: When key fields mutate, map.get(key) searches the new bucket index and returns null. map.containsKey(key) returns false.",
      "Zombie Entry: The old entry remains trapped inside the original bucket. Over time, mutating keys causes severe memory leaks that survive Garbage Collection because the Table array holds strong references.",
      "Resolution: 1) Keys in HashMaps and elements in HashSets MUST be immutable (e.g. Java 14+ Records or final fields). 2) If mutability is unavoidable, use IdentityHashMap which uses System.identityHashCode() and reference equality (==)."
    ],
    codeSnippet: `import java.util.*;

class UserKey {
    private int id;
    public UserKey(int id) { this.id = id; }
    public void setId(int id) { this.id = id; }

    @Override public int hashCode() { return this.id; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserKey k)) return false;
        return this.id == k.id;
    }
}

public class MutableKeyTrap {
    public static void main(String[] args) {
        Map<UserKey, String> map = new HashMap<>();
        UserKey user = new UserKey(100);
        map.put(user, "Active Session");

        // Mutating key field after insertion:
        user.setId(200);

        System.out.println("Get user: " + map.get(user)); // Prints: null!
        System.out.println("Contains: " + map.containsKey(user)); // Prints: false!
        System.out.println("Size: " + map.size()); // Prints: 1 (Trapped memory leak!)
    }
}`,
    trap: "Mutating key state after insertion breaks bucket addressing, creating unreachable zombie entries in heap memory."
  },

  {
    id: "q-java-composition-vs-inheritance",
    category: "OOP & Design",
    difficulty: "Senior",
    title: "Composition vs Inheritance: The Fragile Base Class Problem & HashSet.addAll() Trap",
    question: "Why does extending a class like HashSet and overriding add() and addAll() double-count elements, and how does composition solve it?",
    interviewerIntent: "Testing awareness of the Fragile Base Class problem, self-use inside library methods, and Joshua Bloch's 'Favor Composition over Inheritance' principle.",
    juniorTrap: "Assuming that overriding both add() and addAll() is standard polymorphism, unaware that HashSet's addAll() internally calls this.add().",
    problem: "A custom InstrumentedHashSet counts 6 additions when only 3 elements are added via addAll().",
    innerWorking: "In java.util.HashSet, addAll() iterates over the collection and invokes this.add(e) dynamically. When a subclass overrides both methods and increments its counter in both, adding via addAll() increments once in addAll() and then again for each item in the overridden add(). Subclassing breaks when base classes change their internal self-use.",
    seniorAnswer: [
      "Inheritance breaches encapsulation because a subclass depends on the implementation details of its superclass, not just its public contract.",
      "If HashSet later changes its internal implementation of addAll() to use a batch-native call rather than this.add(), the subclass silently breaks in production without any compile warning.",
      "Composition Solution: Create a ForwardingSet that wraps a Set instance and implements Set by delegating. This Decorator pattern is immune to superclass internal refactoring."
    ],
    codeSnippet: `import java.util.*;

// BROKEN INHERITANCE:
class BrokenInstrumentedSet<E> extends HashSet<E> {
    private int addCount = 0;
    @Override public boolean add(E e) { addCount++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); // Increments count by 3
        return super.addAll(c); // super.addAll() internally calls this.add(), incrementing another 3!
    }
    public int getAddCount() { return addCount; }
}

// PROPER COMPOSITION (Decorator / Forwarding):
class SafeInstrumentedSet<E> implements Set<E> {
    private final Set<E> delegate;
    private int addCount = 0;
    public SafeInstrumentedSet(Set<E> delegate) { this.delegate = delegate; }
    
    public boolean add(E e) { addCount++; return delegate.add(e); }
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return delegate.addAll(c); // Safe! delegate.addAll() does NOT call SafeInstrumentedSet.add()
    }
    public int getAddCount() { return addCount; }
    // ... delegate all other Set methods ...
}`,
    trap: "Subclassing libraries exposes you to hidden internal self-use loops. Always prefer composition with forwarding interfaces."
  },

  {
    id: "q-java-abstract-vs-interface-java8",
    category: "OOP & Design",
    difficulty: "Staff Level",
    title: "Abstract Class vs Interface Post-Java 8: The Diamond Problem & State Invariants",
    question: "Now that interfaces support default, static, and private methods, do we still need abstract classes? Explain the Diamond Problem resolution.",
    interviewerIntent: "Testing architectural understanding of state encapsulation vs behavior contracts, and the exact JLS rules for resolving interface method conflicts.",
    juniorTrap: "Claiming abstract classes are completely obsolete since interfaces now support code implementation.",
    problem: "When a class implements two interfaces containing identical default methods void log(String msg), what does the compiler do, and how is it resolved?",
    innerWorking: "Abstract classes can hold mutable instance state (fields) and constructors to enforce lifecycle invariants. Interfaces CANNOT hold instance fields (only public static final constants) and have no constructors. In conflicts, JLS rule: 1) Classes win over interfaces. 2) More specific sub-interfaces win over super-interfaces. 3) If unrelated, compilation fails with duplicate default methods.",
    seniorAnswer: [
      "State vs Contract: Abstract classes define 'what an object IS' and encapsulate mutable state and constructors. Interfaces define 'what an object CAN DO' (capabilities/roles).",
      "Diamond Conflict Resolution: If InterfaceA and InterfaceB have default void run(), class C MUST explicitly override run() and disambiguate via InterfaceA.super.run(); or provide its own logic.",
      "Evolvability: Interfaces allow multiple inheritance of type and behavior. Abstract classes allow controlled template method lifecycles (e.g. final templateMethod() calling protected abstract hooks)."
    ],
    codeSnippet: `interface Engine {
    default void start() { System.out.println("Engine started"); }
}
interface ElectricSystem {
    default void start() { System.out.println("Electric power online"); }
}

// MUST explicitly resolve collision or compiler throws error:
class HybridVehicle implements Engine, ElectricSystem {
    @Override
    public void start() {
        // Disambiguate using Interface.super syntax:
        Engine.super.start();
        ElectricSystem.super.start();
        System.out.println("Hybrid powertrain ready!");
    }
}`,
    trap: "Interfaces can never replace abstract classes when state initialization or protected template lifecycles are required."
  },

  {
    id: "q-java-overload-vs-override-null",
    category: "OOP & Design",
    difficulty: "Senior",
    title: "Method Overloading vs Overriding: The Ambiguous null & Boxing vs Widening Precedence",
    question: "Which method is invoked for test(null), and what happens when an int primitive matches both long widening and Integer autoboxing?",
    interviewerIntent: "Verifying exact knowledge of JLS overload resolution phases (compile-time static binding) vs overriding (runtime dynamic vtable dispatch).",
    juniorTrap: "Thinking test(null) calls Object because null matches anything, or thinking int autoboxes to Integer before widening to long.",
    problem: "A developer calls test(null) with overloaded methods test(String) and test(Integer) and gets a compilation failure.",
    innerWorking: "JLS §15.12.2 specifies a 3-phase overload resolution: Phase 1 (widening primitive without boxing), Phase 2 (boxing/unboxing), Phase 3 (varargs). Widening ALWAYS beats autoboxing. For null arguments, the compiler searches for the most specific subtype. If two sibling types are equally specific, it fails as ambiguous.",
    seniorAnswer: [
      "Overloading is resolved at COMPILE TIME based on compile-time reference types.",
      "Overriding is resolved at RUNTIME based on the actual heap object instance type (vtable lookup).",
      "Widening beats Boxing: test(10) calls test(long) over test(Integer). Primitive conversion does not incur heap allocation.",
      "Ambiguous null: test(Object) vs test(String) invokes test(String) because String is more specific. But test(String) vs test(Integer) throws compile error because neither is a subtype of the other."
    ],
    codeSnippet: `public class OverloadDemo {
    static void test(Object o) { System.out.println("Object"); }
    static void test(String s) { System.out.println("String"); }
    // If you uncomment Integer, test(null) becomes ambiguous!
    // static void test(Integer i) { System.out.println("Integer"); }

    static void choose(long val) { System.out.println("Widened to long"); }
    static void choose(Integer val) { System.out.println("Autoboxed to Integer"); }

    public static void main(String[] args) {
        test(null); // Prints: String (more specific than Object)
        int x = 42;
        choose(x);  // Prints: Widened to long (Phase 1 beats Phase 2 boxing!)
    }
}`,
    trap: "Primitive widening always beats wrapper autoboxing. Overload resolution happens strictly at compile time."
  },

  {
    id: "q-java-final-keyword-internals",
    category: "OOP & Design",
    difficulty: "Senior",
    title: "final Keyword Mechanics: Blank Finals, JIT Constant Folding & Immutability Pitfall",
    question: "Does making a reference 'final' guarantee immutability, and how does the JMM treat final field publication in constructors?",
    interviewerIntent: "Testing whether the candidate distinguishes between reference immutability vs object state immutability, and understanding JMM final field freeze semantics.",
    juniorTrap: "Confusing a final reference with an immutable collection (e.g. thinking final List cannot have elements added).",
    problem: "A developer marks private final List<String> list = new ArrayList<>() and assumes the list is thread-safe and immutable.",
    innerWorking: "The final keyword only makes the variable pointer reassignment impossible (it cannot point to a new heap address). It provides ZERO protection against internal mutation of the referenced object. JMM Special Guarantee: The JMM ensures that after a constructor finishes, all final fields are 'frozen' and safely visible to all other threads without synchronization.",
    seniorAnswer: [
      "Final Reference != Immutability: final List<T> list allows list.add() and list.clear(). To achieve true immutability, use List.copyOf() or Collections.unmodifiableList().",
      "JMM Final Field Freeze: Under JSR-133, a write to a final field inside a constructor has a memory freeze barrier at the end of the constructor. Other threads are guaranteed to see the initialized final field without needing volatile or locks (provided 'this' reference did not escape during construction).",
      "JIT Constant Folding: static final primitive/String constants are inlined directly into class bytecode by javac (compile-time constants)."
    ],
    codeSnippet: `public class FinalTrap {
    private final List<String> names = new ArrayList<>(); // NOT immutable!

    public void addName(String name) {
        names.add(name); // Perfectly legal! Mutates underlying object
    }

    // TRUE Immutability:
    public static class ImmutableHolder {
        private final List<String> safeList;
        public ImmutableHolder(List<String> input) {
            // Defensive copy + unmodifiable wrapper:
            this.safeList = List.copyOf(input);
        }
        public List<String> getSafeList() { return safeList; }
    }
}`,
    trap: "final on a reference variable only freezes the pointer; it does not protect the underlying object from mutation."
  },

  {
    id: "q-java-solid-lsp-violation",
    category: "OOP & Design",
    difficulty: "Staff Level",
    title: "SOLID Liskov Substitution Principle (LSP): The Rectangle/Square Anti-Pattern & Invariant Defense",
    question: "Why does class Square extends Rectangle violate the Liskov Substitution Principle, and how do you detect LSP violations in code reviews?",
    interviewerIntent: "Evaluating real-world clean architecture skills and the ability to distinguish mathematical subtyping from behavioral subtyping.",
    juniorTrap: "Arguing that because a Square is mathematically a Rectangle with equal sides, Square extends Rectangle is valid OOP.",
    problem: "A client writes a method resize(Rectangle r) that sets width to 10 and height to 20 and asserts area == 200. Passing a Square fails the test or breaks invariants.",
    innerWorking: "LSP states: Functions that use pointers or references to base classes must be able to use objects of derived classes without knowing it and without breaking invariants. In Rectangle, width and height vary independently. In Square, changing width implicitly changes height. A subtype cannot strengthen preconditions or weaken postconditions.",
    seniorAnswer: [
      "LSP Violation Smells in Code Reviews: 1) Derived classes overriding methods with empty bodies or throwing UnsupportedOperationException. 2) Subclasses modifying class invariants assumed by client code. 3) Clients using if (obj instanceof Child) checks before calling methods.",
      "Solution: Separate mutable models from common read-only interfaces (Shape), or use composition rather than inheritance."
    ],
    codeSnippet: `// BAD: Violates LSP
class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int getArea() { return width * height; }
}

class Square extends Rectangle {
    @Override public void setWidth(int w) { this.width = this.height = w; }
    @Override public void setHeight(int h) { this.width = this.height = h; }
}

// Client method that fails:
void verifyArea(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    // Assumes independent dimensions! For Square, this asserts 20 == 16 (FAILS!)
    assert r.getArea() == 20 : "LSP Violation detected!";
}`,
    trap: "Subclasses must preserve the behavioral contracts and invariants of their parents, not just their method signatures."
  },

  // =========================================================================
  // CATEGORY 2: Strings, Wrappers & Exceptions
  // =========================================================================
  {
    id: "q-java-string-pool-intern",
    category: "Strings & Exceptions",
    difficulty: "Senior",
    title: "String Immutability, String Pool & String.intern() Memory Mechanics",
    question: "How many objects are created by String s = new String(\"abc\"), and how does String.intern() interact with JVM heap memory?",
    interviewerIntent: "Testing bytecode-level understanding of StringTable native hashtable, JVM String literal caching, and GC behavior across Java versions.",
    juniorTrap: "Saying it creates only 1 object, or not knowing where the string pool resides in modern JVMs (Heap vs PermGen).",
    problem: "Developers frequently misuse new String(str) or call str.intern() on millions of random strings, causing severe StringTable bucket collisions and GC pauses.",
    innerWorking: "new String(\"abc\") creates TWO objects: 1) The literal \"abc\" is placed in the StringTable (String Pool) at class load time if not already present. 2) new String() allocates a distinct object instance on the heap. String.intern() queries the JVM's StringTable: if an equal string exists, it returns the pooled reference; otherwise, it adds the reference to the table and returns it.",
    seniorAnswer: [
      "Memory Allocation: new String(\"hello\") allocates on normal heap and references the pooled char[]/byte[] array.",
      "StringTable Location: In Java 6, StringTable was in PermGen (fixed size, prone to java.lang.OutOfMemoryError: PermGen space). Since Java 7+, StringTable resides in the main Java Heap and is garbage collected.",
      "Modern Alternative: In Java 9+, Compact Strings use byte[] instead of char[] with LATIN1/UTF16 coder flag. In G1 GC, use -XX:+UseStringDeduplication to automatically deduplicate identical char/byte arrays in the background without intern() overhead."
    ],
    codeSnippet: `public class StringPoolDemo {
    public static void main(String[] args) {
        String s1 = "Hello";
        String s2 = new String("Hello");
        String s3 = s2.intern();

        System.out.println(s1 == s2);        // false (Heap instance vs Pooled literal)
        System.out.println(s1 == s3);        // true (Both point to StringTable entry)
        System.out.println(s1.equals(s2));   // true (Value comparison)
        
        // Literal concatenation (folded at compile time):
        String a = "ab";
        String b = "a" + "b";
        System.out.println(a == b);          // true (javac compiler constant folding!)
    }
}`,
    trap: "Avoid calling .intern() on unbounded dynamic user inputs; it pollutes the JVM native StringTable hashtable."
  },

  {
    id: "q-java-integer-cache-traps",
    category: "Strings & Exceptions",
    difficulty: "Senior",
    title: "IntegerCache Trap: == Identity Comparison Bounds (-128 to 127) & Reflection Tampering",
    question: "Why does Integer a = 100, b = 100 evaluate a == b to true, but Integer c = 200, d = 200 evaluates to false? Can reflection break this?",
    interviewerIntent: "Verifying whether the candidate understands wrapper caching, JLS §5.1.7 autoboxing specifications, and defensive JVM programming.",
    juniorTrap: "Using == on wrapper types instead of .equals() because it 'worked fine in local unit tests' with small numbers.",
    problem: "Code using == for IDs or quantities works in dev environments with small numbers but silently fails in production when values exceed 127.",
    innerWorking: "Integer.valueOf(int) caches objects for the range [-128, 127]. When autoboxing Integer x = 100, javac generates Integer.valueOf(100) which returns a reference from IntegerCache.cache[]. For values >= 128, it invokes new Integer(val), creating distinct heap objects. Using reflection, one can modify the underlying cache array, corrupting JVM math globally!",
    seniorAnswer: [
      "Cache Bounds: [-128, 127] is mandatory per JLS. High bound can be tuned via -XX:AutoBoxCacheMax=<size>.",
      "Other Caches: Byte, Short, Long cache [-128, 127]. Character caches [0, 127]. Float and Double are NEVER cached.",
      "Golden Rule: NEVER use == for object wrappers unless checking for null. Always use .equals() or primitive intValue()."
    ],
    codeSnippet: `import java.lang.reflect.Field;

public class IntegerCacheHacking {
    public static void main(String[] args) throws Exception {
        Integer a = 127, b = 127;
        System.out.println(a == b); // true (Shared cached reference)

        Integer c = 128, d = 128;
        System.out.println(c == d); // false (Distinct heap objects!)

        // REFLECTION ATTACK (Demonstrating cache mutability):
        Class<?> cacheClass = Class.forName("java.lang.Integer$IntegerCache");
        Field cacheField = cacheClass.getDeclaredField("cache");
        cacheField.setAccessible(true);
        Integer[] cache = (Integer[]) cacheField.get(null);
        
        // Mutate cached value for 4 (index: 4 + 128 = 132):
        cache[132] = 42;

        Integer x = 2 + 2;
        System.out.println("2 + 2 = " + x); // Prints: 2 + 2 = 42!
    }
}`,
    trap: "Never compare wrapper types with ==. Small values fool unit tests because of IntegerCache."
  },

  {
    id: "q-java-stringbuilder-vs-buffer",
    category: "Strings & Exceptions",
    difficulty: "Mid-Senior",
    title: "StringBuilder vs StringBuffer: Synchronization Overhead & Capacity Growth Math",
    question: "When should you ever use StringBuffer over StringBuilder in modern Java, and how does the internal char[]/byte[] buffer expand?",
    interviewerIntent: "Testing candidate's practical performance instincts and memory allocation awareness.",
    juniorTrap: "Defaulting to StringBuffer out of habit thinking thread-safety is always desirable.",
    problem: "Excessive object allocation and lock contention in high-throughput string manipulation routines.",
    innerWorking: "StringBuffer synchronizes almost every method using synchronized monitor locks. In 99.9% of use cases, string assembly occurs locally within a single thread/method stack, rendering synchronization completely redundant. Capacity expansion formula in both classes: newCapacity = (oldCapacity * 2) + 2.",
    seniorAnswer: [
      "Modern Reality: StringBuffer is a legacy Java 1.0 relic. StringBuilder (Java 5) is non-synchronized, faster, and standard for single-threaded string construction.",
      "Pre-sizing Optimization: Default initial capacity is 16 characters. If building a 5,000-character JSON/XML payload without initial sizing, the JVM repeatedly allocates new arrays, copies contents via System.arraycopy, and discards old buffers, causing GC allocation churn.",
      "Best Practice: Always pre-size: new StringBuilder(estimatedSize)."
    ],
    codeSnippet: `// BAD: Triggers multiple reallocations and array copies
StringBuilder sb = new StringBuilder(); // Default capacity = 16
for (int i = 0; i < 1000; i++) {
    sb.append("data,"); // Repeatedly resizes: 16 -> 34 -> 70 -> 142 -> 286...
}

// GOOD: Single allocation, zero arraycopy churn
StringBuilder optimized = new StringBuilder(5000);
for (int i = 0; i < 1000; i++) {
    optimized.append("data,");
}`,
    trap: "Never use StringBuffer unless sharing a buffer across multiple threads (which is an architectural anti-pattern anyway)."
  },

  {
    id: "q-java-autoboxing-ternary-npe",
    category: "Strings & Exceptions",
    difficulty: "Senior",
    title: "Autoboxing/Unboxing Pitfall: Silent NullPointerException in Ternary Conditional Expressions",
    question: "Why does boolean flag = true; Integer val = null; int result = flag ? val : 0.0 == 0.0 ? val : 0; throw a NullPointerException at runtime?",
    interviewerIntent: "Testing deep knowledge of JLS conditional operator type coercion rules (§15.25).",
    juniorTrap: "Assuming that because the ternary operator is conditional, wrapper types remain unboxed until assigned.",
    problem: "Production code throwing NullPointerException on lines containing simple ternary null-checks.",
    innerWorking: "According to JLS §15.25, if one operand of the ternary operator is a numeric wrapper (Integer) and the other is a primitive (int or double), the type of the entire ternary expression is determined by binary numeric promotion to the PRIMITIVE type. Therefore, the compiler inserts an implicit val.intValue() unboxing call on the branch, throwing NPE if val is null!",
    seniorAnswer: [
      "Type Coercion Rule: In condition ? wrapper : primitive, the wrapper is ALWAYS unboxed to primitive.",
      "Loop Performance Trap: Integer sum = 0; for(int i=0; i<1M; i++) sum += i; creates 1,000,000 temporary Integer objects due to autoboxing/unboxing churn.",
      "Defense: When using ternary operators with nullables, ensure both return branches have identical wrapper types: condition ? val : Integer.valueOf(0)."
    ],
    codeSnippet: `public class TernaryNPETrap {
    public static void main(String[] args) {
        Integer nullableValue = null;
        boolean condition = false;

        // Tricky Trap: Mixing Integer and int primitive:
        // Even when condition is false, compiler types this as 'int'!
        int safe = condition ? nullableValue : 0; // Evaluates to 0 safely

        boolean conditionTrue = true;
        // When conditionIsTrue is true:
        // The JVM executes: nullableValue.intValue() -> THROWS NullPointerException!
        try {
            int broken = conditionTrue ? nullableValue : 0;
        } catch (NullPointerException e) {
            System.out.println("NPE thrown due to implicit primitive unboxing coercion!");
        }
    }
}`,
    trap: "Mixing wrapper types with primitives in ternary expressions causes implicit unboxing, triggering unexpected NPEs."
  },

  {
    id: "q-java-checked-vs-unchecked-sneaky",
    category: "Strings & Exceptions",
    difficulty: "Staff Level",
    title: "Checked vs Unchecked Exceptions: Generic Type Erasure 'SneakyThrows' & Lambda Boundaries",
    question: "Can Java throw a checked exception without declaring it in a 'throws' clause at compile time without bytecode manipulation? How does Lombok's @SneakyThrows work?",
    interviewerIntent: "Testing whether the candidate understands that checked exceptions are purely a compiler fiction and do NOT exist in JVM bytecode.",
    juniorTrap: "Believing that the JVM runtime refuses to execute or throw a checked exception unless declared on the method signature.",
    problem: "Java 8 Streams and Lambdas do not accept methods throwing checked exceptions (e.g. Function<T,R> cannot throw IOException).",
    innerWorking: "At the JVM bytecode level, there is NO distinction between checked and unchecked exceptions (the athrow bytecode instruction handles all Throwable objects identically). The javac compiler enforces checked exceptions. By exploiting Generic Type Erasure, a method can cast any Throwable to an unchecked type <T extends Throwable> and throw it, bypassing the compiler's check completely!",
    seniorAnswer: [
      "JVM Reality: Checked exceptions exist ONLY in the Java compiler. The JVM runtime treats all exceptions uniformly.",
      "SneakyThrows Mechanism: Using <E extends Throwable> void sneakyThrow(Throwable t) throws E { throw (E) t; } tricks javac into erasing E to RuntimeException.",
      "Functional Boundaries: Used extensively in modern frameworks (Lombok, Vavr, Spring) to wrap checked exceptions without polluting functional pipelines with try-catch blocks."
    ],
    codeSnippet: `import java.io.IOException;

public class SneakyThrowsDemo {
    // Exploiting Generics Type Erasure to bypass javac checked exception check:
    @SuppressWarnings("unchecked")
    public static <E extends Throwable> void sneakyThrow(Throwable e) throws E {
        throw (E) e; // Erased to: throw (Throwable) e; at runtime!
    }

    // Notice: NO 'throws IOException' on this method!
    public static void doNastyWork() {
        sneakyThrow(new IOException("Checked IO failure thrown sneakily!"));
    }

    public static void main(String[] args) {
        try {
            doNastyWork();
        } catch (Exception e) {
            System.out.println("Caught checked exception without throws clause: " + e);
        }
    }
}`,
    trap: "Checked exceptions are a compiler construct; bytecode treats all exceptions identically."
  },

  {
    id: "q-java-try-with-resources-finally",
    category: "Strings & Exceptions",
    difficulty: "Senior",
    title: "Try-With-Resources Exception Suppression vs finally Block Hijacking",
    question: "What happens if both the try block and AutoCloseable.close() throw exceptions? What happens if finally executes return or throw?",
    interviewerIntent: "Testing mastery of Java 7+ exception suppression mechanics and dangerous finally control-flow traps.",
    juniorTrap: "Assuming the close() exception overwrites the try block exception, or not realizing that finally { return; } wipes out in-flight exceptions.",
    problem: "Crucial root-cause exceptions disappearing from production logs because a finally block returned or threw an auxiliary exception.",
    innerWorking: "In classic try-finally, an exception in finally suppresses and obliterates the original exception from try. In try-with-resources, the try block exception is PRIMARY; the close() exception is caught and appended to the primary exception's suppressed list via Throwable.addSuppressed(). However, an explicit return in finally will completely silence all exceptions!",
    seniorAnswer: [
      "Suppression Guarantee: Try-with-resources preserves the primary root cause and attaches close() failures to e.getSuppressed().",
      "Order of Closure: Resources declared in try (R1, R2) are closed in REVERSE order of declaration (R2 first, then R1).",
      "Finally Antipattern: NEVER put return, break, or throw inside a finally block. It unconditionally discards in-flight exceptions and corrupts call stack propagation."
    ],
    codeSnippet: `class FaultyResource implements AutoCloseable {
    private final String name;
    public FaultyResource(String name) { this.name = name; }
    @Override public void close() { throw new RuntimeException("Error closing " + name); }
}

public class SuppressionDemo {
    public static int dangerousMethod() {
        try (var r1 = new FaultyResource("R1");
             var r2 = new FaultyResource("R2")) {
            throw new IllegalStateException("Primary business failure");
        } catch (Exception e) {
            System.out.println("Primary: " + e.getMessage());
            for (Throwable s : e.getSuppressed()) {
                System.out.println("Suppressed: " + s.getMessage());
            }
            throw e; // Re-throwing...
        } finally {
            return 999; // DANGER! Silently swallows and erases the re-thrown exception!
        }
    }

    public static void main(String[] args) {
        System.out.println("Result: " + dangerousMethod()); // Prints 999! No exception thrown!
    }
}`,
    trap: "Never place a return or throw statement inside a finally block; it permanently erases in-flight exceptions."
  },

  // =========================================================================
  // CATEGORY 3: Collections
  // =========================================================================
  {
    id: "q-java-hashmap-treeification-resize",
    category: "Collections",
    difficulty: "Staff Level",
    title: "HashMap Internals: Bitwise Spread (h ^ (h >>> 16)), Resizing & Treeification Rules (8 / 6 / 64)",
    question: "Walk through HashMap.put() step by step: bitwise hash spread, bucket index calculation, treeification criteria, and power-of-2 resize mechanics.",
    interviewerIntent: "Evaluating comprehensive understanding of data structure mechanics, CPU-level bitwise math, Red-Black tree conversions, and hash collision defense.",
    juniorTrap: "Saying a bucket treeifies to a Red-Black tree as soon as the 8th item collides, ignoring the MIN_TREEIFY_CAPACITY = 64 check.",
    problem: "High collision rates in poorly hashed keys causing O(N) performance degradation down to O(log N).",
    innerWorking: "1) Hash spread formula: (h = key.hashCode()) ^ (h >>> 16) XORs the top 16 bits with lower 16 bits to ensure higher-order bits influence lower-order bucket indices. 2) Index: index = (n - 1) & hash. 3) Collision: LinkedList node added. When chain length reaches 8, treeifyBin() is called. IF table.length < 64, it RESIZES instead of treeifying! Only if table.length >= 64 does it convert to a Red-Black TreeNode. 4) Untreeify: during resize, if tree count drops to <= 6, it reverts to a LinkedList.",
    seniorAnswer: [
      "Why Power of 2: Table size is always 2^n so that modulus hash % n can be computed using lightning-fast bitwise AND: (n - 1) & hash.",
      "Resize Mechanics: In Java 8, elements do not need hash recomputation on resize. Because capacity doubles (e.g. 16 -> 32), an element either stays at the exact same index i or moves to i + oldCap, determined purely by (hash & oldCap) == 0.",
      "Treeification Cost: TreeNodes consume roughly double the memory of standard Node entries. The 8/6 hysteresis gap prevents continuous conversion thrashing around the threshold."
    ],
    codeSnippet: `// Key internal constants in java.util.HashMap:
// static final int TREEIFY_THRESHOLD = 8;
// static final int UNTREEIFY_THRESHOLD = 6;
// static final int MIN_TREEIFY_CAPACITY = 64;

// Bitwise Hash Spread in Java 8:
static final int hash(Object key) {
    int h;
    // XORs higher 16 bits into lower 16 bits to prevent poor hash distributions
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// Power of 2 Index Calculation:
// index = (table.length - 1) & hash(key);`,
    trap: "A bucket only converts to a Red-Black tree if chain length >= 8 AND total map capacity >= 64; otherwise it resizes."
  },

  {
    id: "q-java-concurrenthashmap-null-philosophy",
    category: "Collections",
    difficulty: "Senior",
    title: "ConcurrentHashMap vs Collections.synchronizedMap: Lock Striping & Why null is Strictly Forbidden",
    question: "Why does HashMap permit null keys and values, while ConcurrentHashMap strictly throws NullPointerException for both?",
    interviewerIntent: "Testing concurrency design philosophy and deep understanding of Doug Lea's concurrent data structure invariants.",
    juniorTrap: "Saying null was disallowed in ConcurrentHashMap 'by mistake' or 'to keep code cleaner'.",
    problem: "Concurrent code suffering race conditions when checking for null presence via map.get(key) == null.",
    innerWorking: "In a single-threaded HashMap, if map.get(key) returns null, you can call map.containsKey(key) to disambiguate whether the key mapped to null or was absent. In a concurrent map, between the call to get() and containsKey(), another thread could have inserted, updated, or removed the key! The state cannot be atomically validated. Doug Lea explicitly disallowed null to eliminate this concurrency ambiguity.",
    seniorAnswer: [
      "Locking Architecture: Collections.synchronizedMap wraps a standard map in a single mutex (synchronized(mutex)), creating a severe thread contention bottleneck.",
      "ConcurrentHashMap Architecture (Java 8+): Uses Lock-Free CAS (Compare-And-Swap) for empty bucket insertion, and synchronized(firstNodeOfBucket) for bucket-level locking (Node-level striping). It offers full O(1) concurrent reads without locking.",
      "Recursive computeIfAbsent Deadlock: Calling computeIfAbsent recursively on the same bucket hash causes a silent thread deadlock/hang."
    ],
    codeSnippet: `// Single mutex bottleneck:
Map<String, String> syncMap = Collections.synchronizedMap(new HashMap<>());

// High concurrency, striped locks, CAS insertion:
ConcurrentHashMap<String, String> chm = new ConcurrentHashMap<>();

// THE NULL TRAP:
try {
    chm.put("key", null); // THROWS NullPointerException!
    chm.put(null, "val"); // THROWS NullPointerException!
} catch (NullPointerException e) {
    System.out.println("ConcurrentHashMap strictly forbids null keys & values!");
}`,
    trap: "ConcurrentHashMap strictly forbids null keys and values to prevent race conditions during key presence verification."
  },

  {
    id: "q-java-linkedhashmap-lru",
    category: "Collections",
    difficulty: "Senior",
    title: "LinkedHashMap: Building an O(1) In-Memory LRU Cache via accessOrder & removeEldestEntry",
    question: "How do you implement an O(1) Least Recently Used (LRU) Cache in 10 lines of Java using LinkedHashMap?",
    interviewerIntent: "Checking knowledge of doubly-linked list ordering inside HashMaps and custom eviction policies.",
    juniorTrap: "Building a complex custom doubly-linked list and HashMap from scratch or forgetting accessOrder = true.",
    problem: "Creating an LRU cache where elements are evicted by insertion order rather than actual read/access order.",
    innerWorking: "LinkedHashMap maintains a doubly-linked list running through all its entries. By default, it orders by insertion-order (accessOrder = false). When instantiated with accessOrder = true, every get() or put() removes the accessed entry from its current position in the linked list and appends it to the tail (most recently used). The hook removeEldestEntry() is evaluated during put() to automatically prune the head (least recently used).",
    seniorAnswer: [
      "Constructor: new LinkedHashMap<>(capacity, loadFactor, true /* accessOrder */).",
      "Eviction Hook: Override protected boolean removeEldestEntry(Map.Entry eldest) { return size() > maxEntries; }.",
      "Thread Safety: LinkedHashMap is NOT thread-safe. For concurrent LRU, wrap with Collections.synchronizedMap() or use Caffeine Cache."
    ],
    codeSnippet: `import java.util.*;

public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxCapacity;

    public LRUCache(int maxCapacity) {
        // initialCapacity, loadFactor, accessOrder = true (CRUCIAL for LRU!)
        super(maxCapacity, 0.75f, true);
        this.maxCapacity = maxCapacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        // Automatically evicts the least recently accessed item when capacity is exceeded
        return size() > maxCapacity;
    }

    public static void main(String[] args) {
        LRUCache<Integer, String> cache = new LRUCache<>(2);
        cache.put(1, "A");
        cache.put(2, "B");
        cache.get(1);      // Access 1 -> Order is now: [2, 1]
        cache.put(3, "C"); // Evicts 2!
        System.out.println(cache.keySet()); // Prints: [1, 3]
    }
}`,
    trap: "Forgetting to set accessOrder = true turns LinkedHashMap into a FIFO queue rather than an LRU cache."
  },

  {
    id: "q-java-arraylist-vs-linkedlist-cpu",
    category: "Collections",
    difficulty: "Senior",
    title: "ArrayList vs LinkedList: CPU Cache Locality, Spatial Prefetching & The False 'Fast Insertion' Myth",
    question: "Why does ArrayList outperform LinkedList in almost all real-world benchmarks, even for random insertions in the middle of a list?",
    interviewerIntent: "Testing hardware sympathy, CPU L1/L2 cache-line prefetching, memory layout, and real-world algorithmic tradeoffs.",
    juniorTrap: "Claiming LinkedList is faster for insertions because 'it is O(1) pointer swap while ArrayList is O(N) array copy'.",
    problem: "Junior developers using LinkedList for performance-sensitive lists, inadvertently increasing latency and memory footprint.",
    innerWorking: "1) Traversal to index: In LinkedList, to insert at index i, you must traverse i pointers from head/tail (O(N) pointer chasing). 2) Hardware Cache Locality: ArrayList elements reside in contiguous memory; the CPU prefetcher loads entire 64-byte cache lines into L1/L2 data cache. LinkedList nodes are scattered across the heap, causing continuous L1/L2 CPU cache misses. 3) Memory Overhead: Each LinkedList node costs 24 bytes (12 header + 4 item + 8 prev/next refs) compared to ArrayList's compact pointer array.",
    seniorAnswer: [
      "ArrayCopy Speed: ArrayList insertion uses System.arraycopy(), which maps directly to hardware memmove assembly instructions moving blocks of memory in single CPU microcode bursts.",
      "Memory Footprint: LinkedList consumes 4x-6x more RAM than ArrayList for the same number of elements.",
      "Verdict: LinkedList is virtually never the right choice in modern JVMs. If you need double-ended queue operations, use ArrayDeque (circular array backed)."
    ],
    codeSnippet: `// MEMORY FOOTPRINT COMPARISON (64-bit HotSpot JVM with CompressedOOPs):
// ArrayList<Integer> holding 1,000,000 elements:
// ~4MB array buffer + 16-24MB Integer objects

// LinkedList<Integer> holding 1,000,000 elements:
// 1,000,000 Node objects * 24 bytes = 24MB raw node overhead!
// Plus 16-24MB Integer objects = ~48MB total (2x-3x higher memory!)

// BENCHMARK REALITY:
// ArrayList.add(index, elem) with System.arraycopy often beats LinkedList.add(index, elem)
// up to 100,000 elements because pointer chasing cache misses cost more CPU cycles 
// than hardware-accelerated memory block copies!`,
    trap: "LinkedList's pointer chasing destroys CPU cache prefetching. Always default to ArrayList or ArrayDeque."
  },

  {
    id: "q-java-comparable-vs-comparator-overflow",
    category: "Collections",
    difficulty: "Mid-Senior",
    title: "Comparable vs Comparator: The Integer Subtraction Underflow Bug (a - b)",
    question: "Why is (a, b) -> a.value - b.value a dangerous bug in Comparator implementations, and how should it be written?",
    interviewerIntent: "Checking numerical safety, comparison contract invariants (reflexivity, antisymmetry, transitivity), and modern Comparator composition APIs.",
    juniorTrap: "Writing (a, b) -> a - b because it's quick and works for small positive integers.",
    problem: "Sorting routines crashing or producing scrambled order when handling negative numbers or large values.",
    innerWorking: "If a = Integer.MIN_VALUE (-2,147,483,648) and b = 1, then a - b underflows to +2,147,483,647. The comparator returns a positive integer, claiming that Integer.MIN_VALUE is GREATER than 1! This violates the Comparator transitivity contract and causes TimSort to throw IllegalArgumentException: Comparison method violates its general contract!",
    seniorAnswer: [
      "Safe Comparison: Use Integer.compare(a.value, b.value) or Comparator.comparingInt(Obj::getValue).",
      "Comparable vs Comparator: Comparable defines the NATURAL ordering intrinsic to the class (compareTo). Comparator defines an EXTERNAL, pluggable ordering strategy.",
      "Null-safe Chaining: Use Comparator.nullsFirst(Comparator.comparing(...)).reversed()."
    ],
    codeSnippet: `import java.util.*;

public class ComparatorOverflowBug {
    public static void main(String[] args) {
        int a = Integer.MIN_VALUE;
        int b = 1;

        // BROKEN: Underflow bug
        int brokenResult = a - b;
        System.out.println("Broken (a - b): " + brokenResult); // Prints +2147483647 (WRONG!)

        // SAFE:
        int safeResult = Integer.compare(a, b);
        System.out.println("Safe compare: " + safeResult);     // Prints -1 (CORRECT!)

        // Modern Idiomatic Java Comparator Composition:
        Comparator<String> comp = Comparator
            .nullsLast(Comparator.comparingInt(String::length))
            .thenComparing(String::compareToIgnoreCase);
    }
}`,
    trap: "Never subtract integers in a comparator (a - b); integer overflow/underflow violates transitivity."
  },

  {
    id: "q-java-fail-fast-vs-fail-safe",
    category: "Collections",
    difficulty: "Senior",
    title: "Fail-Fast vs Fail-Safe Iterators: modCount Verification & CopyOnWrite Snapshots",
    question: "How does an iterator detect ConcurrentModificationException, and why does CopyOnWriteArrayList not throw it?",
    interviewerIntent: "Testing knowledge of collection modification tracking (modCount) and thread-safe iterator mechanics.",
    juniorTrap: "Believing ConcurrentModificationException only occurs in multi-threaded programs.",
    problem: "Single-threaded code modifying a list inside a standard for-each loop and crashing with ConcurrentModificationException.",
    innerWorking: "Every collection maintains an internal int modCount incremented on every structural change (add/remove). When an iterator is created, it stores expectedModCount = modCount. On each next(), it verifies if (modCount != expectedModCount) throw new ConcurrentModificationException(). In CopyOnWriteArrayList, the iterator operates on an immutable snapshot of the underlying array at the instant the iterator was created.",
    seniorAnswer: [
      "Single-Threaded Trigger: Calling list.remove(item) inside a for (Item item : list) loop triggers CME because for-each uses an Iterator under the hood, and list.remove() bypasses the iterator's expectedModCount.",
      "Safe Removal: Use iterator.remove() or collection.removeIf(predicate).",
      "Fail-Safe / Weakly Consistent: CopyOnWriteArrayList, ConcurrentHashMap iterators reflect state at creation time or subsequent changes without throwing CME."
    ],
    codeSnippet: `import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class FailFastDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(List.of("A", "B", "C"));

        // FAIL-FAST TRAP (Single-threaded CME):
        try {
            for (String s : list) {
                if (s.equals("B")) list.remove(s); // Modifies collection directly!
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("Fail-Fast: modCount != expectedModCount!");
        }

        // CORRECT WAY:
        list.removeIf(s -> s.equals("B")); // Safe single-pass removal

        // FAIL-SAFE (CopyOnWrite):
        var cowList = new CopyOnWriteArrayList<>(List.of("X", "Y"));
        for (String s : cowList) {
            cowList.add("Z"); // Mutates new array copy; iterator reads original snapshot!
        }
        System.out.println("COW List size: " + cowList.size()); // Prints 4 safely!
    }
}`,
    trap: "Never mutate a collection directly during for-each iteration; use iterator.remove() or removeIf()."
  },

  // =========================================================================
  // CATEGORY 4: Multithreading & Concurrency
  // =========================================================================
  {
    id: "q-java-sync-volatile-reentrantlock",
    category: "Multithreading",
    difficulty: "Staff Level",
    title: "synchronized vs volatile vs ReentrantLock: CPU Store Buffers, Mutual Exclusion & Fairness",
    question: "Compare synchronized, volatile, and ReentrantLock across memory visibility, mutual exclusion, thread parking, and lock acquisition fairness.",
    interviewerIntent: "Evaluating mastery of the Java Concurrency Model, AQS internals, and lock-free vs monitor-based synchronization.",
    juniorTrap: "Believing volatile is 'just a lightweight synchronized' that makes compound operations like count++ thread-safe.",
    problem: "High-concurrency systems suffering from race conditions due to volatile count++, or thread starvation due to unfair synchronized locks.",
    innerWorking: "1) volatile: Guarantees visibility and ordering (Happens-Before) via StoreLoad memory barriers, but ZERO mutual exclusion. 2) synchronized: Built into JVM HotSpot object headers (Mark Word). Supports lock escalation (Biased -> Lightweight CAS -> Heavyweight OS Mutex). Implicit lock release on exception. 3) ReentrantLock: Java-level synchronizer backed by AQS. Supports timed tryLock(timeout), interruptible locks, fairness policies, and multiple Condition queues (await/signal).",
    seniorAnswer: [
      "When to use volatile: Single writer, multiple reader status flags (e.g. volatile boolean shutdownRequested).",
      "When to use synchronized: Simple block-level mutual exclusion where JVM lock elision and biased locking optimizations can apply.",
      "When to use ReentrantLock: Advanced features needed: tryLock() to prevent deadlocks, fair queuing to prevent starvation, or multiple condition variables."
    ],
    codeSnippet: `import java.util.concurrent.locks.ReentrantLock;

public class ConcurrencyPrims {
    // 1. volatile: Visibility ONLY (count++ is BROKEN!)
    private volatile boolean running = true;

    // 2. synchronized: JVM Monitor lock
    public synchronized void syncMethod() { /* Mutex */ }

    // 3. ReentrantLock: AQS-backed explicit lock with tryLock timeout
    private final ReentrantLock lock = new ReentrantLock(true); // Fair lock
    public void safePerform() {
        if (lock.tryLock()) { // Non-blocking attempt to prevent deadlocks!
            try {
                // Critical section
            } finally {
                lock.unlock(); // Always unlock in finally!
            }
        }
    }
}`,
    trap: "volatile does NOT provide mutual exclusion; volatile count++ suffers from lost updates."
  },

  {
    id: "q-java-wait-notify-synchronization",
    category: "Multithreading",
    difficulty: "Senior",
    title: "wait() / notify() Mechanics: Why Monitor Ownership is Mandatory & Spurious Wakeups",
    question: "Why must wait() and notify() be called inside a synchronized block, and why must wait() ALWAYS be in a while loop rather than an if statement?",
    interviewerIntent: "Verifying deep understanding of condition synchronization, the Lost Wakeup race condition, and POSIX thread spurious wakeups.",
    juniorTrap: "Calling wait() outside synchronized, or wrapping wait() in an if (condition) check.",
    problem: "Threads freezing forever due to lost notifications, or resuming with unfulfilled conditions after spurious wakeups.",
    innerWorking: "1) Why synchronized is mandatory: If wait() could be called without holding the lock, a race condition occurs: Thread A checks condition (false), but before calling wait(), Thread B changes condition to true and calls notify(). Thread A then calls wait() and sleeps FOREVER (Lost Wake-up). JVM enforces holding the monitor, throwing IllegalMonitorStateException otherwise. 2) Why while loop: Operating systems allow threads to wake up without notify() (spurious wakeups), or another thread may consume the condition before this thread wakes up.",
    seniorAnswer: [
      "Lost Wakeup: Atomically releases the monitor and puts the thread to sleep in the Object's Wait Set.",
      "Spurious Wakeup Defense: while (!condition) { wait(); } guarantees the condition predicate is re-evaluated upon awakening.",
      "Modern Alternative: Use java.util.concurrent abstractions (BlockingQueue, CountDownLatch, CompletableFuture) rather than low-level wait/notify."
    ],
    codeSnippet: `class MessageQueue {
    private String message;
    private boolean hasMessage = false;

    public synchronized void produce(String msg) throws InterruptedException {
        // ALWAYS use while loop to guard against spurious wakeups!
        while (hasMessage) {
            wait(); // Releases lock and sleeps
        }
        this.message = msg;
        this.hasMessage = true;
        notifyAll(); // Wake up waiting consumers
    }

    public synchronized String consume() throws InterruptedException {
        // NEVER use 'if (hasMessage)'!
        while (!hasMessage) {
            wait();
        }
        hasMessage = false;
        notifyAll();
        return message;
    }
}`,
    trap: "Never call wait() inside an 'if' check; always wrap in a 'while' loop to guard against spurious wakeups."
  },

  {
    id: "q-java-executors-completablefuture",
    category: "Multithreading",
    difficulty: "Staff Level",
    title: "ExecutorService & CompletableFuture: Thread Pool Starvation & Non-Blocking Async Composition",
    question: "How does thread pool starvation occur when chaining dependent tasks in a bounded ExecutorService, and how does CompletableFuture prevent it?",
    interviewerIntent: "Evaluating candidate's architectural ability to design deadlock-free reactive and asynchronous enterprise pipelines.",
    juniorTrap: "Calling future.get() inside a task running on the same thread pool, blocking threads while waiting for sub-tasks to complete.",
    problem: "A web service with a 20-thread pool crashes under moderate load with all threads stuck in WAITING state.",
    innerWorking: "If Parent tasks are submitted to a fixed thread pool of size N, and each Parent task submits a Child task to the SAME pool and blocks via childFuture.get(): when N concurrent requests arrive, all N threads are occupied by Parent tasks waiting for Child tasks. But no threads remain in the pool to execute the Child tasks! The entire system deadlocks permanently (Thread Pool Starvation Deadlock).",
    seniorAnswer: [
      "Resolution with CompletableFuture: Use asynchronous callbacks (thenApply, thenCompose) which do NOT block worker threads. When the child task finishes, the continuation is scheduled dynamically.",
      "Custom Executors: Always isolate blocking I/O tasks from CPU-bound computation by using dedicated, isolated thread pools.",
      "thenApply vs thenCompose: thenApply maps T -> R (like Stream.map). thenCompose maps T -> CompletableFuture<R> (like Stream.flatMap), preventing nested CompletableFuture<CompletableFuture<R>>."
    ],
    codeSnippet: `// BAD: Thread Pool Starvation Deadlock
ExecutorService pool = Executors.newFixedThreadPool(2);
pool.submit(() -> {
    // Submits sub-task to the SAME pool and blocks:
    Future<String> sub = pool.submit(() -> "Child Result");
    return sub.get(); // BLOCKS! If 2 parent tasks run simultaneously -> PERMANENT DEADLOCK!
});

// GOOD: Non-blocking CompletableFuture chaining
CompletableFuture.supplyAsync(() -> fetchUserData(userId), customIoPool)
    .thenCompose(user -> CompletableFuture.supplyAsync(() -> fetchOrders(user), customIoPool))
    .thenApply(orders -> processOrders(orders))
    .thenAccept(result -> renderUI(result))
    .exceptionally(ex -> {
        log.error("Async pipeline failed", ex);
        return null;
    });`,
    trap: "Never call .get() or block inside tasks executed by the same thread pool; it causes permanent thread pool starvation."
  },

  {
    id: "q-java-deadlock-conditions-prevention",
    category: "Multithreading",
    difficulty: "Senior",
    title: "Deadlock: The 4 Coffman Conditions, Lock Ordering & Timed tryLock Backoff",
    question: "What are the 4 Coffman conditions required for a deadlock, and how do you programmatically prevent or break them?",
    interviewerIntent: "Testing fundamental concurrency theory and practical distributed/multithreaded lock ordering patterns.",
    juniorTrap: "Believing deadlocks can be resolved by increasing thread pool sizes or CPU resources.",
    problem: "Production microservices freezing due to circular wait conditions when transferring money between accounts.",
    innerWorking: "The 4 Coffman conditions: 1) Mutual Exclusion (exclusive resource control). 2) Hold and Wait (holding one lock while requesting another). 3) No Preemption (locks cannot be forcibly confiscated). 4) Circular Wait (Thread 1 waits for Thread 2, which waits for Thread 1). Eliminating ANY ONE condition guarantees deadlock freedom.",
    seniorAnswer: [
      "Global Lock Ordering: Break Circular Wait by enforcing a strict global acquisition order (e.g. acquire locks by comparing System.identityHashCode(account) or account.getId()).",
      "Timed Preemption: Use ReentrantLock.tryLock(timeout, unit) to break No Preemption. If acquiring the second lock times out, release the first lock, back off randomly, and retry.",
      "Deadlock Detection: JVM jstack or ThreadMXBean.findDeadlockedThreads() can identify active cycle graphs in production."
    ],
    codeSnippet: `public class SafeTransfer {
    // Enforcing strict global lock ordering breaks Circular Wait:
    public static void transfer(Account from, Account to, double amount) {
        Account firstLock = from.getId() < to.getId() ? from : to;
        Account secondLock = from.getId() < to.getId() ? to : from;

        synchronized (firstLock) {
            synchronized (secondLock) {
                from.debit(amount);
                to.credit(amount);
            }
        }
    }
}`,
    trap: "Always acquire multiple locks in a globally consistent order (e.g. sorted by ID) to break the circular wait condition."
  },

  {
    id: "q-java-threadlocal-leaks",
    category: "Multithreading",
    difficulty: "Staff Level",
    title: "ThreadLocal Internals: ThreadLocalMap, WeakReference Keys & Thread Pool Memory Leaks",
    question: "How does ThreadLocal work internally, why are its Map keys WeakReferences, and how does it cause severe memory leaks in Web application servers?",
    interviewerIntent: "Testing JVM thread memory model, garbage collection reference reachability, and thread pool lifecycle management.",
    juniorTrap: "Assuming that because ThreadLocalMap uses WeakReference keys, the thread-local values are automatically garbage collected.",
    problem: "Tomcat / Spring Boot application servers running out of memory (OutOfMemoryError) or leaking SecurityContext across user HTTP requests.",
    innerWorking: "Each Thread object has an internal field: ThreadLocal.ThreadLocalMap threadLocals. The ThreadLocalMap uses WeakReference<ThreadLocal<?>> for its entry keys. When the ThreadLocal instance itself is dereferenced, the key is GC'd and becomes null. HOWEVER, the Entry value is a STRONG reference! Because threads in a web server thread pool NEVER die, the Entry value remains strongly reachable from Thread -> ThreadLocalMap -> Entry -> Value indefinitely!",
    seniorAnswer: [
      "The Leak: Thread pool threads live forever. Even if the ThreadLocal variable is unreachable, its value object remains trapped in the thread's map.",
      "Cross-User Data Pollution: If Thread A processes User 1's request and sets ThreadLocal<User>, when User 2's request reuses Thread A, User 2 could inherit User 1's security context if not cleaned up!",
      "The Invariant Fix: ALWAYS invoke threadLocal.remove() inside a finally block."
    ],
    codeSnippet: `public class SecurityContextFilter {
    private static final ThreadLocal<UserContext> contextHolder = new ThreadLocal<>();

    public void doFilter(Request req, Response res) {
        try {
            UserContext ctx = authenticate(req);
            contextHolder.set(ctx);
            proceed(req, res);
        } finally {
            // MANDATORY IN THREAD POOLS!
            // Prevents both Memory Leaks AND Cross-Tenant Data Contamination!
            contextHolder.remove();
        }
    }
}`,
    trap: "ThreadLocalMap Entry keys are Weak, but Values are Strong. Always call .remove() in a finally block."
  },

  {
    id: "q-java-callable-vs-runnable",
    category: "Multithreading",
    difficulty: "Mid-Senior",
    title: "Callable<V> vs Runnable: Checked Exception Signatures & Future Return Types",
    question: "What are the core functional differences between Runnable and Callable, and how does ExecutorService adapt between them?",
    interviewerIntent: "Checking knowledge of functional interfaces, exception handling across thread boundaries, and concurrent task abstraction.",
    juniorTrap: "Trying to throw checked exceptions from Runnable.run() or trying to directly return values from Runnable.",
    problem: "Needing to return calculated data from an asynchronous background thread while cleanly handling checked exceptions.",
    innerWorking: "Runnable: public void run() — returns nothing and cannot throw checked exceptions. Callable<V>: public V call() throws Exception — returns a generic value V and is declared to throw checked Exception. FutureTask<V> implements RunnableFuture<V>, adapting Callable to run on an underlying thread and capturing any thrown exception to re-throw inside future.get() wrapped in ExecutionException.",
    seniorAnswer: [
      "Signature: Callable returns T and throws Exception; Runnable returns void and cannot throw checked exceptions.",
      "Future Interaction: When submitting Callable to an ExecutorService, future.get() returns the computed value or unpacks exceptions.",
      "Adapters: Executors.callable(runnable, result) adapts a Runnable to a Callable."
    ],
    codeSnippet: `import java.util.concurrent.*;

public class CallableDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newSingleThreadExecutor();

        Callable<Integer> task = () -> {
            if (Math.random() > 0.5) throw new java.io.IOException("Network fail");
            return 42; // Returns typed value!
        };

        Future<Integer> future = pool.submit(task);
        try {
            Integer result = future.get(); // Blocks until done
            System.out.println("Result: " + result);
        } catch (ExecutionException e) {
            // Checked IOException is captured and wrapped inside ExecutionException:
            System.out.println("Underlying cause: " + e.getCause());
        } finally {
            pool.shutdown();
        }
    }
}`,
    trap: "Runnable cannot return values or throw checked exceptions; Callable returns generics and throws Exception."
  },

  {
    id: "q-java-atomic-vs-sync-counter",
    category: "Multithreading",
    difficulty: "Staff Level",
    title: "AtomicInteger vs synchronized Counter: CAS Loops, Cache Line Bouncing & LongAdder",
    question: "Why does AtomicInteger outperform synchronized under low-to-medium contention, but collapse under ultra-high multi-core contention? How does LongAdder fix it?",
    interviewerIntent: "Testing hardware cache coherency (MESI protocol), CPU Compare-And-Swap (CAS) spin loops, and striping solutions.",
    juniorTrap: "Assuming AtomicInteger is always the fastest counter implementation regardless of thread count.",
    problem: "High-throughput telemetry metric counters causing CPU spikes due to CAS loop spinning on a single memory address.",
    innerWorking: "AtomicInteger uses CPU-native CAS (cmpxchg on x86) in an optimistic lock-free spin loop. Under intense contention across 64+ cores, multiple threads repeatedly attempt to CAS the same single memory address. When one thread succeeds, all other CPU cores experience L1/L2 cache-line invalidation (Cache Line Bouncing). Threads spin continuously in while(!compareAndSet()), burning 100% CPU. LongAdder solves this by maintaining a striped array of Cell objects (@Contended to prevent false sharing) where threads hash to independent cells and sum them up only on read.",
    seniorAnswer: [
      "AtomicInteger: Great for low-to-medium contention or when atomic read-and-update return values are immediately needed.",
      "Synchronized: High overhead due to thread descheduling and OS context switching.",
      "LongAdder (Java 8+): Striped internal counters. Eliminates cache-line bouncing by allowing threads to increment distinct memory cells. Up to 10x faster under extreme write contention."
    ],
    codeSnippet: `import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

public class HighContentionCounter {
    // Slower under extreme contention (CAS spin loop + cache line bouncing):
    private final AtomicInteger atomicCounter = new AtomicInteger();

    // 10x Faster under 64+ concurrent threads (Striped cells):
    private final LongAdder highThroughputCounter = new LongAdder();

    public void increment() {
        // Distributes increments across independent CPU cache lines:
        highThroughputCounter.increment(); 
    }

    public long getTotal() {
        // Aggregates across all striped cells:
        return highThroughputCounter.sum();
    }
}`,
    trap: "Under massive multi-threaded contention, AtomicInteger burns CPU in CAS spin-loops. Use LongAdder for high-throughput counters."
  },

  {
    id: "q-java-happens-before-dcl",
    category: "Multithreading",
    difficulty: "Staff Level",
    title: "Happens-Before Relationship & Double-Checked Locking: Instruction Reordering 1-3-2",
    question: "Explain the exact bytecode instructions of new Object() and why omitting volatile in Double-Checked Locking publishes partially constructed objects.",
    interviewerIntent: "Testing precise understanding of the Java Memory Model (JSR-133), JIT out-of-order execution, and hardware memory barriers.",
    juniorTrap: "Thinking that synchronized protects the entire creation, forgetting that the outer if (instance == null) check is completely UNSYNCHRONIZED.",
    problem: "Production crashes where threads read uninitialized, null, or zeroed fields from a singleton that was presumed fully constructed.",
    innerWorking: "Object creation compiles to 3 bytecode instructions: 1) new #2 (allocate heap memory), 2) invokespecial #3 (execute constructor body), 3) putstatic #4 (assign address to reference). Under as-if-serial rules, the JIT/CPU can reorder instructions to: 1 -> 3 -> 2. If Thread A executes 1 and 3, instance is non-null before constructor 2 finishes! Thread B checks outer if (instance == null), sees non-null, and immediately consumes the half-baked object.",
    seniorAnswer: [
      "The Volatile Fix: Declaring private static volatile Singleton INSTANCE forces a StoreStore barrier before the write and a StoreLoad barrier after it, strictly forbidding reordering step 3 before step 2.",
      "Happens-Before Guarantee: A write to a volatile variable happens-before every subsequent read of that variable.",
      "Holder Idiom Alternative: Use the Bill Pugh Initialization-on-demand holder idiom: static class Holder { static final Singleton INSTANCE = new Singleton(); } which relies on thread-safe JVM ClassLoader initialization locks without volatile overhead."
    ],
    codeSnippet: `// Thread-Safe Double-Checked Locking (DCL)
public class SafeDCLSingleton {
    // 'volatile' is MANDATORY to prevent 1-3-2 instruction reordering!
    private static volatile SafeDCLSingleton INSTANCE;

    private SafeDCLSingleton() {
        // Complex state initialization
    }

    public static SafeDCLSingleton getInstance() {
        SafeDCLSingleton local = INSTANCE; // Read volatile once into CPU register
        if (local == null) {
            synchronized (SafeDCLSingleton.class) {
                local = INSTANCE;
                if (local == null) {
                    INSTANCE = local = new SafeDCLSingleton();
                }
            }
        }
        return local;
    }
}`,
    trap: "Without volatile, CPU instruction reordering publishes a non-null reference before the constructor runs."
  },

  // =========================================================================
  // CATEGORY 5: Java 8+ Features
  // =========================================================================
  {
    id: "q-java-stream-pipeline-fusion",
    category: "Java 8+ Features",
    difficulty: "Senior",
    title: "Stream Pipeline: Loop Fusion, Stateless vs Stateful Operations & Stream Re-Use Exception",
    question: "How does the Stream engine execute intermediate operations under loop fusion, and why does attempting to reuse a Stream throw an IllegalStateException?",
    interviewerIntent: "Testing deep understanding of lazy evaluation, internal iteration pipelines, and stream terminal consumption.",
    juniorTrap: "Believing each intermediate operation (.filter(), .map()) creates a full intermediate collection in memory.",
    problem: "Developers expecting streams to execute intermediate steps before terminal operations, or caching Stream instances for multiple reads.",
    innerWorking: "Streams are lazy pull-based pipelines. Intermediate operations do zero work until a terminal operation (collect, forEach, reduce) is invoked. Loop fusion combines chained stateless operations (filter, map) into a single pass over the elements without allocating intermediate buffers. Stateful operations (sorted, distinct) break loop fusion because they must process all upstream elements before emitting downstream. Once a terminal operation completes, the stream is marked consumed; reusing it throws IllegalStateException.",
    seniorAnswer: [
      "Stateless vs Stateful: filter() and map() are stateless (process 1 element at a time). sorted() and distinct() are stateful (must buffer data into temporary arrays).",
      "Short-Circuiting: findFirst(), anyMatch(), limit(n) stop upstream iteration as soon as conditions are met.",
      "Stream Lifecycle: Streams cannot be stored or reused. To reuse, create a Supplier<Stream<T>>."
    ],
    codeSnippet: `import java.util.List;
import java.util.stream.Stream;

public class StreamFusionDemo {
    public static void main(String[] args) {
        List<String> names = List.of("Alice", "Bob", "Charlie", "David");

        // Loop Fusion in Action:
        // Elements are processed vertically one-by-one, NOT horizontally in batches!
        names.stream()
            .filter(s -> {
                System.out.println("Filter: " + s);
                return s.length() > 3;
            })
            .map(s -> {
                System.out.println("Map: " + s);
                return s.toUpperCase();
            })
            .findFirst(); // Short-circuits! "Charlie" and "David" are NEVER evaluated!

        // STREAM RE-USE TRAP:
        Stream<String> stream = names.stream();
        stream.forEach(System.out::println);
        // stream.forEach(System.out::println); // THROWS: IllegalStateException!
    }
}`,
    trap: "Streams cannot be reused once consumed; intermediate operations do zero work until a terminal operation is called."
  },

  {
    id: "q-java-optional-orelse-vs-orelseget",
    category: "Java 8+ Features",
    difficulty: "Senior",
    title: "Optional Best Practices: orElse() Eager Evaluation vs orElseGet() Lazy Supplier",
    question: "Why should you almost never pass a method call to orElse(), and what are the strict anti-patterns when using Optional?",
    interviewerIntent: "Evaluating functional API hygiene, eager vs lazy evaluation tradeoffs, and performance vigilance.",
    juniorTrap: "Using orElse(fetchFromDb()) assuming it will only execute when the Optional is empty.",
    problem: "High database loads and unintended side effects because orElse() executes its parameter eagerly on EVERY single invocation.",
    innerWorking: "Method arguments in Java are evaluated EAGERLY before method entry. When calling opt.orElse(computeDefault()), computeDefault() is evaluated immediately on the caller stack, regardless of whether opt contains a value or not! In contrast, opt.orElseGet(() -> computeDefault()) accepts a Supplier functional interface and evaluates it LAZILY only when opt.isEmpty().",
    seniorAnswer: [
      "orElse vs orElseGet: Use orElse(constantValue) only for pre-computed constants (e.g. \"UNKNOWN\"). Use orElseGet(Supplier) whenever computing fallback values involves method calls or I/O.",
      "Optional Anti-Patterns: 1) Calling opt.get() without isPresent() (use ifPresent, map, or orElseThrow). 2) Passing Optional as a method parameter (pollutes signatures with null checks). 3) Storing Optional in fields or Collections (Optional is not Serializable).",
      "Primary Purpose: Optional was created strictly as a method return type to represent possible absence without null."
    ],
    codeSnippet: `import java.util.Optional;

public class OptionalTrap {
    static String expensiveDatabaseQuery() {
        System.out.println("🚨 CRITICAL: Database queried!");
        return "fallback";
    }

    public static void main(String[] args) {
        Optional<String> cachedUser = Optional.of("Aadarsh");

        System.out.println("--- Testing orElse ---");
        // EAGER: Queries database even though user IS ALREADY PRESENT!
        String r1 = cachedUser.orElse(expensiveDatabaseQuery());

        System.out.println("--- Testing orElseGet ---");
        // LAZY: Supplier is NEVER executed because cachedUser is present!
        String r2 = cachedUser.orElseGet(() -> expensiveDatabaseQuery());
    }
}`,
    trap: "orElse() evaluates its parameter eagerly even when the Optional has a value; always use orElseGet() for method calls."
  },

  {
    id: "q-java-functional-interfaces-sam",
    category: "Java 8+ Features",
    difficulty: "Mid-Senior",
    title: "Functional Interfaces & SAM: @FunctionalInterface Rules, Default Methods & Lambda Types",
    question: "Can an interface with 10 methods still be a @FunctionalInterface? Explain the Single Abstract Method (SAM) rule.",
    interviewerIntent: "Testing precise understanding of Java functional typing and bytecode lambda invocation.",
    juniorTrap: "Believing an interface can only have exactly 1 total method to be functional.",
    problem: "Developers unsure whether adding default or static utility methods invalidates an interface for lambda expressions.",
    innerWorking: "A functional interface has exactly ONE abstract method (Single Abstract Method - SAM). It can contain ANY number of default methods, static methods, and public abstract methods that override methods from java.lang.Object (such as boolean equals(Object obj)). The @FunctionalInterface annotation is optional, but instructs javac to generate a compile error if the interface violates SAM criteria.",
    seniorAnswer: [
      "SAM Rule: Only non-Object abstract methods count toward the single abstract method total.",
      "Default / Static: Can have unlimited default and static methods without breaking functional compatibility.",
      "Lambda Dispatch: Lambdas do NOT compile to anonymous inner classes; they compile to invokedynamic bytecode instructions using LambdaMetafactory for zero-classloader overhead."
    ],
    codeSnippet: `@FunctionalInterface
public interface SmartProcessor<T, R> {
    // 1. The SINGLE Abstract Method (SAM):
    R process(T input);

    // 2. Default methods do NOT count toward SAM:
    default SmartProcessor<T, R> logBefore() {
        return input -> {
            System.out.println("Processing: " + input);
            return process(input);
        };
    }

    // 3. Static helper methods do NOT count:
    static <T> SmartProcessor<T, T> identity() {
        return t -> t;
    }

    // 4. Object public methods do NOT count:
    @Override
    boolean equals(Object obj);
}`,
    trap: "Functional interfaces require exactly ONE abstract method; default, static, and Object overrides do not count."
  },

  {
    id: "q-java-method-references-dispatch",
    category: "Java 8+ Features",
    difficulty: "Senior",
    title: "Method References: Static vs Bound vs Unbound Instance References",
    question: "Explain the difference between bound instance references (inst::method) and unbound instance references (Class::method).",
    interviewerIntent: "Testing how lambdas map parameter arguments to method receivers under the hood.",
    juniorTrap: "Getting confused why String::compareToIgnoreCase takes 2 arguments when compareToIgnoreCase is an instance method taking 1 argument.",
    problem: "Compilation errors when trying to pass method references to higher-order functional interfaces.",
    innerWorking: "There are 4 kinds of method references: 1) Static: Math::max -> (x, y) -> Math.max(x, y). 2) Bound Instance: System.out::println -> x -> System.out.println(x) (receiver is bound to specific instance). 3) Unbound Instance: String::length -> s -> s.length() (the first argument to the lambda becomes the instance receiver on which the method is called!). 4) Constructor: ArrayList::new -> () -> new ArrayList().",
    seniorAnswer: [
      "Unbound Receiver Binding: In (s1, s2) -> s1.compareToIgnoreCase(s2), the method reference is written String::compareToIgnoreCase. The first parameter s1 acts as the target receiver.",
      "Performance: Method references are cleaner syntactic sugar for lambdas and are optimized identically via invokedynamic bootstrap calls."
    ],
    codeSnippet: `import java.util.function.*;

public class MethodRefDemo {
    public static void main(String[] args) {
        // 1. Static Reference:
        Function<String, Integer> f1 = Integer::parseInt; // s -> Integer.parseInt(s)

        // 2. Bound Instance Reference (receiver is 'System.out'):
        Consumer<String> f2 = System.out::println;        // s -> System.out.println(s)

        // 3. Unbound Instance Reference:
        // Notice: takes TWO strings, first is target receiver!
        BiPredicate<String, String> f3 = String::equalsIgnoreCase; 
        // Equivalent to: (s1, s2) -> s1.equalsIgnoreCase(s2)

        // 4. Constructor Reference:
        Supplier<StringBuilder> f4 = StringBuilder::new;
    }
}`,
    trap: "In unbound instance references (Class::method), the first lambda parameter becomes the target object receiver."
  },

  {
    id: "q-java-completablefuture-exceptions",
    category: "Java 8+ Features",
    difficulty: "Staff Level",
    title: "CompletableFuture Exception Handling: exceptionally() vs handle() vs whenComplete()",
    question: "How do exceptionally(), handle(), and whenComplete() differ in error propagation, result transformation, and thread execution?",
    interviewerIntent: "Evaluating mastery of asynchronous resilience patterns, error recovery, and non-blocking pipeline completion.",
    juniorTrap: "Thinking exceptionally() halts pipeline execution instead of providing a fallback value to downstream stages.",
    problem: "Uncaught asynchronous exceptions disappearing silently into ForkJoinPool background threads without alerting.",
    innerWorking: "1) exceptionally(fn): Catches exceptions and returns a fallback value of type T. Subsequent stages receive this fallback value as if nothing went wrong. 2) handle(biFn): Always executes (success or failure) receiving (result, exception). Can transform the result or recover to a different type R. 3) whenComplete(biConsumer): A terminal observer hook receiving (result, exception). Does NOT transform data; simply passes the original result or re-throws the original exception downstream.",
    seniorAnswer: [
      "handle() vs exceptionally(): Use handle() when you want to transform either the successful value or the exception into a unified outcome. Use exceptionally() for simple fallback defaults.",
      "Thread Switching: exceptionallyAsync() and handleAsync() allow shifting recovery logic to a dedicated fallback thread pool.",
      "Missing Logging: If neither get(), join(), nor exception handlers are registered, an uncaught exception inside a CompletableFuture is silently swallowed!"
    ],
    codeSnippet: `import java.util.concurrent.CompletableFuture;

public class AsyncExceptionPipeline {
    public static void main(String[] args) {
        CompletableFuture<String> pipeline = CompletableFuture.supplyAsync(() -> {
            if (true) throw new RuntimeException("Payment Gateway Timeout");
            return "SUCCESS";
        })
        // 1. exceptionally: Recovery Fallback
        .exceptionally(ex -> {
            System.out.println("Recovering from error: " + ex.getMessage());
            return "FALLBACK_PAYMENT_QUEUED"; // Recovers downstream!
        })
        // 2. handle: BiFunction transforming result or error
        .handle((res, ex) -> {
            if (ex != null) return "FAILED_RECOVERY";
            return "FINAL_STATUS: " + res;
        })
        // 3. whenComplete: Side-effect observer (logging)
        .whenComplete((res, ex) -> {
            System.out.println("Pipeline finished with: " + res);
        });

        System.out.println(pipeline.join());
    }
}`,
    trap: "Uncaught exceptions in CompletableFuture are silently swallowed unless joined, chained with handle/exceptionally, or logged."
  },

  {
    id: "q-java-records-sealed-pattern",
    category: "Java 8+ Features",
    difficulty: "Senior",
    title: "Modern Java: Records, Sealed Classes & Exhaustive Pattern Matching Without default",
    question: "Why should you avoid adding a 'default:' branch when pattern matching over a sealed class hierarchy in modern Java?",
    interviewerIntent: "Testing familiarity with modern Java (Java 17 / 21) algebraic data types (sum and product types) and compile-time exhaustiveness checking.",
    juniorTrap: "Adding default: out of old habit, which completely disables compiler warnings when new subclasses are introduced.",
    problem: "Adding a new transaction type to a sealed hierarchy does not trigger compile-time errors in business logic because default: silently handles it.",
    innerWorking: "Sealed classes (permits clause) restrict subclassing to an explicit whitelist known at compile time. When used with Java 21 Pattern Matching for switch, the javac compiler performs Exhaustiveness Analysis: it verifies that all permitted subtypes are covered. If you omit default:, adding a new subclass in the future causes a COMPILE ERROR at all switch sites, forcing developers to implement the new case explicitly!",
    seniorAnswer: [
      "Records: Pure product types. Automatically generate canonical constructor, private final fields, equals, hashCode, and toString. Cannot extend classes, but can implement interfaces.",
      "Sealed Hierarchies: Pure sum types. sealed interface Payment permits CreditCard, PayPal, Crypto {}.",
      "Compiler Invariant: Pattern switch over sealed hierarchies is exhaustively checked. Adding default: destroys this architectural safety net."
    ],
    codeSnippet: `// Algebraic Data Type in Modern Java:
sealed interface PaymentResult permits Success, Failure, Pending {}

record Success(String txId, double amount) implements PaymentResult {}
record Failure(String errorCode, String reason) implements PaymentResult {}
record Pending(String trackingUrl) implements PaymentResult {}

public class ModernJavaPatternDemo {
    public static String handlePayment(PaymentResult result) {
        // NO 'default:' branch! Compiler enforces exhaustiveness!
        // If a new record 'Refunded' is added to PaymentResult, this line FAILS TO COMPILE!
        return switch (result) {
            case Success s -> "Processed " + s.amount() + " with TX: " + s.txId();
            case Failure f -> "Failed: " + f.reason() + " (Code: " + f.errorCode() + ")";
            case Pending p -> "Pending: " + p.trackingUrl();
        };
    }
}`,
    trap: "Never add a 'default:' branch to a sealed pattern matching switch; it destroys compiler exhaustiveness checking."
  },

  {
    id: "q-java-virtual-threads-pinning",
    category: "Java 8+ Features",
    difficulty: "Staff Level",
    title: "Java 21 Virtual Threads (Loom): Carrier Thread Pinning Trap (synchronized vs ReentrantLock)",
    question: "What is Virtual Thread Carrier Pinning, why does synchronized cause it, and how does ReentrantLock fix it?",
    interviewerIntent: "Evaluating knowledge of Project Loom, M:N user-space scheduling, OS carrier threads, and migration gotchas for Java 21.",
    juniorTrap: "Assuming Virtual Threads make all legacy multithreaded code magically 100x faster without checking synchronization constructs.",
    problem: "A high-concurrency microservice upgraded to Java 21 Virtual Threads experiences total throughput collapse and server hangs under load.",
    innerWorking: "Virtual threads run mounted on an underlying pool of OS carrier threads (ForkJoinPool). When a virtual thread executes blocking I/O (e.g. Thread.sleep, socket read), it unmounts from the carrier thread so other virtual threads can run. However, if the blocking call occurs inside a synchronized block or native method, the virtual thread is PINNED to its carrier thread. The carrier thread cannot unmount. If all carrier threads get pinned, the entire system stalls.",
    seniorAnswer: [
      "Pinning Cause: JVM monitor implementation ties the lock state directly to the OS carrier thread stack frame.",
      "Solution: Replace synchronized blocks with ReentrantLock around blocking I/O operations.",
      "Diagnostics: Run with -Djdk.tracePinnedThreads=full to detect pinned threads in production.",
      "Pool Rule: NEVER pool virtual threads (e.g. with Executors.newFixedThreadPool). Virtual threads are cheap and short-lived; spawn new ones freely using Executors.newVirtualThreadPerTaskExecutor()."
    ],
    codeSnippet: `import java.util.concurrent.locks.ReentrantLock;

public class VirtualThreadPinningTrap {
    private final Object monitorLock = new Object();
    private final ReentrantLock reentrantLock = new ReentrantLock();

    // BAD (Pins the OS Carrier Thread!):
    public void badTask() {
        synchronized (monitorLock) {
            try {
                // Blocking I/O inside synchronized pins carrier thread!
                Thread.sleep(1000); 
            } catch (InterruptedException e) {}
        }
    }

    // GOOD (Safely unmounts carrier thread!):
    public void goodTask() {
        reentrantLock.lock();
        try {
            // Virtual thread cleanly unmounts; carrier thread executes other tasks!
            Thread.sleep(1000); 
        } catch (InterruptedException e) {}
        finally {
            reentrantLock.unlock();
        }
    }
}`,
    trap: "synchronized blocks pin Java 21 Virtual Threads to OS carrier threads during blocking I/O. Use ReentrantLock instead."
  },

  // =========================================================================
  // CATEGORY 6: JVM Internals & Memory
  // =========================================================================
  {
    id: "q-java-jvm-memory-architecture",
    category: "JVM Internals & Memory",
    difficulty: "Staff Level",
    title: "JVM Memory Architecture: Heap, Thread Stacks, Metaspace & Off-Heap Direct Memory",
    question: "Break down the exact memory regions of HotSpot JVM: Heap, Stacks, Metaspace, CodeCache, and Direct Off-Heap Native Memory.",
    interviewerIntent: "Testing whether the candidate can diagnose complex Linux memory issues where a container gets OOMKilled despite heap usage being low.",
    juniorTrap: "Assuming the JVM only consumes memory configured by -Xmx.",
    problem: "A Kubernetes pod with memory limit 4GB and -Xmx2g gets SIGKILL (OOMKilled) by the Linux kernel.",
    innerWorking: "Total JVM Memory = Heap (-Xmx) + Metaspace + Thread Stacks (numThreads * -Xss) + CodeCache + Direct ByteBuffers + GC Native Overhead + JIT Buffers. Metaspace stores class metadata in native memory (unbounded by default). Thread stacks consume 1MB each by default (-Xss1m). Off-heap memory (ByteBuffer.allocateDirect) bypasses the JVM heap and GC entirely, allocated directly from OS virtual memory.",
    seniorAnswer: [
      "Metaspace: Replaced PermGen in Java 8. Resides in native memory. Bound it with -XX:MaxMetaspaceSize to prevent unbounded memory growth.",
      "Thread Stacks: 1,000 threads with default 1MB stack = 1GB of raw native RAM outside the heap.",
      "Off-Heap / Netty: High-performance frameworks use Unsafe / DirectByteBuffer for zero-copy socket I/O. Track with -XX:NativeMemoryTracking=summary."
    ],
    codeSnippet: `// DIRECT OFF-HEAP MEMORY:
// Allocates 1GB outside JVM heap via OS malloc()
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024 * 1024 * 1024);

// LINUX OOMKILLED FORMULA:
// Max RAM = Heap (-Xmx)
//         + Thread Stacks (Threads * -Xss)
//         + Metaspace (-XX:MaxMetaspaceSize)
//         + Direct Memory (-XX:MaxDirectMemorySize)
//         + JIT CodeCache (-XX:ReservedCodeCacheSize)
//         + GC native bookkeeping (Remembered Sets, Mark Stacks)
// If Total > K8s Container Limit -> Linux Kernel triggers OOMKiller (SIGKILL 137)!`,
    trap: "The JVM consumes significant native memory outside the heap; setting -Xmx equal to container memory guarantees OOMKill."
  },

  {
    id: "q-java-gc-algorithms-comparison",
    category: "JVM Internals & Memory",
    difficulty: "Staff Level",
    title: "Garbage Collection Comparison: G1 Region-Based vs ZGC Low-Latency Load Barriers",
    question: "How does ZGC achieve sub-millisecond pause times regardless of heap size, and how does it compare mechanically to G1 GC?",
    interviewerIntent: "Evaluating production GC tuning skills, concurrent marking/relocation algorithms, and colored pointer mechanics.",
    juniorTrap: "Recommending Parallel GC for low-latency web microservices or believing ZGC has longer stop-the-world pauses on 1TB heaps.",
    problem: "A high-frequency trading or real-time banking system experiencing 500ms Stop-The-World (STW) pauses during minor GC cycles.",
    innerWorking: "G1 GC divides the heap into 2,048 equal regions (Eden, Survivor, Old, Humongous). It uses incremental copying and target pause times (-XX:MaxGCPauseMillis), but still requires Stop-The-World pauses during phase boundaries. ZGC (Z Garbage Collector) performs virtually ALL phases concurrently (concurrent mark, concurrent prepare for relocate, concurrent relocate) using Colored Pointers (metadata encoded in 64-bit reference address bits) and Load Barriers (JIT-inserted read intercepts that self-heal old pointers on the fly).",
    seniorAnswer: [
      "Colored Pointers: ZGC encodes Marked0, Marked1, and Remapped flags directly into the upper bits of reference addresses.",
      "Load Barrier: When application code dereferences an object during relocation, the load barrier detects the stale address, relocates the object immediately, updates the reference, and continues without pausing the world.",
      "Tradeoff: ZGC optimizes for ultra-low latency (<1ms pause) at the expense of ~2-5% throughput overhead from load barriers."
    ],
    codeSnippet: `// GC Decision Matrix:
// 1. ZGC (-XX:+UseZGC):
//    Use when: Sub-millisecond pause time is critical (<1ms), heaps from 16MB to 16TB.
//    Cost: Slight throughput penalty (~2-5%) due to JIT load barriers.

// 2. G1 GC (-XX:+UseG1GC):
//    Use when: Balanced throughput and latency, heap size > 4GB, pause targets ~200ms.
//    Default in Java 9+.

// 3. Parallel GC (-XX:+UseParallelGC):
//    Use when: Batch processing, offline crunching where throughput is king and pauses don't matter.`,
    trap: "ZGC pause times are independent of heap size because marking and relocation happen concurrently via load barriers."
  },

  {
    id: "q-java-classloader-delegation",
    category: "JVM Internals & Memory",
    difficulty: "Senior",
    title: "ClassLoader Delegation Model: Parent-First Hierarchy & How Web Containers Invert It",
    question: "Explain the ClassLoader delegation hierarchy, what triggers ClassCastException across loaders, and why Tomcat inverts delegation to Child-First.",
    interviewerIntent: "Testing classloader isolation, ClassCastException root causes in modular/plugin systems, and enterprise container architectures.",
    juniorTrap: "Assuming that if two classes have the exact same package and class name, they are identical to the JVM.",
    problem: "ClassCastException: class com.example.User cannot be cast to class com.example.User.",
    innerWorking: "In the standard delegation model, a ClassLoader delegates class loading to its parent before searching itself: Bootstrap -> Platform (Extensions) -> Application (System). Tomcat inverts this for web applications (Child-First): WebAppClassLoader searches /WEB-INF/classes and /WEB-INF/lib FIRST. If not found, it delegates to the Shared parent. Two classes loaded by different ClassLoaders are completely distinct types to the JVM, even if loaded from the exact same .class bytes!",
    seniorAnswer: [
      "JVM Class Identity: An object's runtime class is defined by the tuple: (Fully Qualified Class Name, ClassLoader Instance).",
      "Why Invert Delegation: Web application isolation. App A can bundle Spring 5 while App B bundles Spring 6 in the same servlet container without library version conflicts.",
      "Bootstrap Loader: Native C++ loader in JVM; returns null if queried via String.class.getClassLoader()."
    ],
    codeSnippet: `public class ClassLoaderIdentity {
    public static void main(String[] args) {
        // String is loaded by Bootstrap ClassLoader (returns null in Java):
        System.out.println("String loader: " + String.class.getClassLoader()); // null

        // App classes loaded by AppClassLoader:
        System.out.println("App loader: " + ClassLoaderIdentity.class.getClassLoader());

        // CLASS IDENTITY TRAP:
        // Class A loaded by Loader 1
        // Class B loaded by Loader 2
        // A obj = (A) loader2.loadClass("com.example.User").newInstance();
        // THROWS: ClassCastException (Different classloader identities!)
    }
}`,
    trap: "Two classes are identical to the JVM ONLY if they share the exact same name AND the exact same ClassLoader instance."
  },

  {
    id: "q-java-heap-regions-aging",
    category: "JVM Internals & Memory",
    difficulty: "Senior",
    title: "Heap Regions & Object Aging: Eden, Survivor S0/S1 Copying & Tenuring Thresholds",
    question: "Why does the Young Generation have TWO survivor spaces (S0 and S1), and how does the HotSpot JVM determine when to promote an object to Old Gen?",
    interviewerIntent: "Testing knowledge of generational garbage collection mechanics, copying collectors, and tuning tenuring thresholds.",
    juniorTrap: "Believing objects go directly from Eden to Old Generation, or not understanding why S0/S1 ping-pong.",
    problem: "Premature promotion of short-lived objects directly into the Old Generation, causing frequent, costly Full GC / Major GC pauses.",
    innerWorking: "Young Gen uses a Copying Garbage Collector. Eden is where new objects are allocated via thread-local allocation buffers (TLAB). When Eden fills, a Minor GC occurs: live objects from Eden and the 'From' Survivor space are copied contiguously into the 'To' Survivor space. The roles of From and To then swap. Each survival increments the object's age bit in its Mark Word header. When age reaches -XX:MaxTenuringThreshold (default 15) or dynamic tenuring threshold is met, it promotes to Old Gen.",
    seniorAnswer: [
      "Why Two Survivor Spaces: Copying to an empty space eliminates memory fragmentation without needing an expensive compaction pass.",
      "Max Tenuring Threshold: Max age is 15 because only 4 bits are allocated for age in the 64-bit Mark Word header (2^4 - 1 = 15).",
      "Premature Promotion Smell: If survivor spaces are too small, objects spill directly into Old Gen (Tenured), causing Old Gen fragmentation and frequent Major GCs."
    ],
    codeSnippet: `// Object Header (Mark Word) bit layout in 64-bit JVM:
// [Unused: 25 bits] [HashCode: 31 bits] [CMS Free: 1 bit] [Age: 4 bits] [BiasedLock: 1 bit] [Lock Tag: 2 bits]
// Notice: 'Age' has exactly 4 bits -> Maximum age is 1111 in binary = 15!

// JVM Flag:
// -XX:MaxTenuringThreshold=15 (Valid range: 1 to 15)
// -XX:SurvivorRatio=8 (Eden is 8x the size of each Survivor space S0/S1)`,
    trap: "The maximum tenuring threshold is 15 because the HotSpot Mark Word allocates exactly 4 bits for object age."
  },

  {
    id: "q-java-oom-scenarios",
    category: "JVM Internals & Memory",
    difficulty: "Staff Level",
    title: "OutOfMemoryError Scenarios: Java heap space vs Metaspace vs GC Overhead Limit vs Direct Buffer",
    question: "Identify the 4 primary OutOfMemoryError variants in Java, their underlying root causes, and how to triage each in production.",
    interviewerIntent: "Testing production incident response, memory profiler triage, and JVM troubleshooting depth.",
    juniorTrap: "Blindly increasing -Xmx every time any OutOfMemoryError occurs.",
    problem: "Production crashes with OutOfMemoryError: Metaspace or Direct buffer memory, where increasing heap space fails to solve the issue.",
    innerWorking: "1) java.lang.OutOfMemoryError: Java heap space: Heap cannot allocate object; root cause: memory leak or undersized heap. 2) java.lang.OutOfMemoryError: GC overhead limit exceeded: JVM spent >98% of total CPU time doing GC and recovered <2% of heap. 3) java.lang.OutOfMemoryError: Metaspace: Native memory for class metadata exhausted; root cause: dynamic class generation (CGLIB, ByteBuddy, proxies) without class unloading. 4) java.lang.OutOfMemoryError: Direct buffer memory: JVM direct native buffers exceeded -XX:MaxDirectMemorySize.",
    seniorAnswer: [
      "Triage Heap OOM: Capture heap dump on crash via -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/heap.hprof and analyze with Eclipse Memory Analyzer (MAT) for dominator tree retainers.",
      "Triage GC Overhead: Signals catastrophic heap starvation. The application is thrashing.",
      "Triage Metaspace: Inspect ClassLoader leaks. In web apps, repeatedly redeploying without restarting the JVM leaks WebAppClassLoaders.",
      "Triage Native Threads: java.lang.OutOfMemoryError: unable to create new native thread means Linux kernel pid/max_user_watches limit reached or OS exhausted virtual memory."
    ],
    codeSnippet: `// ESSENTIAL PRODUCTION JVM FLAGS FOR OOM DIAGNOSIS:
// 1. Automatically dump heap on fatal OOM:
//    -XX:+HeapDumpOnOutOfMemoryError 
//    -XX:HeapDumpPath=/var/log/dumps/oom.hprof

// 2. Kill container immediately on OOM to allow Kubernetes auto-restart:
//    -XX:+ExitOnOutOfMemoryError

// 3. Bound native metaspace:
//    -XX:MaxMetaspaceSize=512m

// 4. Bound direct off-heap memory:
//    -XX:MaxDirectMemorySize=1g`,
    trap: "Not all OOM errors come from the heap; increasing -Xmx does nothing for Metaspace, DirectBuffer, or native thread OOMs."
  },

  {
    id: "q-java-escape-analysis-scalar",
    category: "JVM Internals & Memory",
    difficulty: "Staff Level",
    title: "Escape Analysis & HotSpot Optimization: Stack Allocation via Scalar Replacement & Lock Elision",
    question: "Can Java objects ever be allocated on the Stack instead of the Heap? Explain how C2 JIT Escape Analysis works.",
    interviewerIntent: "Verifying cutting-edge understanding of JIT C2 compiler optimizations and memory layout optimization.",
    juniorTrap: "Answering definitively that 'ALL objects in Java are strictly allocated on the Heap without exception'.",
    problem: "High allocation rates causing unnecessary GC pressure for purely local temporary objects.",
    innerWorking: "The JIT compiler analyzes the scope of an object reference: 1) GlobalEscape (escapes method and thread), 2) ArgEscape (passed as argument but doesn't escape thread), 3) NoEscape (confined entirely inside creating method). When NoEscape is proven, HotSpot performs Scalar Replacement: it decomposes the object into its individual primitive fields (scalars) and allocates them directly on the CPU Stack or registers, bypassing the Heap entirely! It also performs Lock Elision (removing synchronized locks if the object never escapes the thread).",
    seniorAnswer: [
      "Scalar Replacement: Java does not allocate raw object headers on the stack; it replaces the object with scalar primitive variables in stack frames.",
      "Zero GC Cost: When the method returns, stack frames pop, instantly reclaiming memory with zero garbage collection overhead.",
      "Verification: Enabled by default (-XX:+DoEscapeAnalysis). Disable via -XX:-DoEscapeAnalysis to observe dramatic GC allocation spikes."
    ],
    codeSnippet: `public class EscapeAnalysisDemo {
    static class Point {
        int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }
    }

    public static int compute() {
        // 'p' NEVER escapes this method!
        // JIT C2 Compiler detects 'NoEscape' and performs SCALAR REPLACEMENT:
        // It converts Point p into two local stack variables: int p_x = 10; int p_y = 20;
        // ZERO heap allocation occurs! Zero GC overhead!
        Point p = new Point(10, 20);
        return p.x + p.y;
    }

    public static void main(String[] args) {
        for (int i = 0; i < 100_000_000; i++) {
            compute(); // Runs in nanoseconds with scalar replacement!
        }
    }
}`,
    trap: "HotSpot does not allocate objects on the stack; it decomposes non-escaping objects into primitive stack variables via Scalar Replacement."
  },

  // =========================================================================
  // CATEGORY 7: Tricky Edge Cases
  // =========================================================================
  {
    id: "q-java-edge-reflection-integer-cache",
    category: "Tricky Edge Cases",
    difficulty: "Senior",
    title: "Tricky Edge Case: Modifying IntegerCache via Reflection (Making 2 + 2 == 5)",
    question: "How can low-level reflection rewrite the IntegerCache to make 2 + 2 == 5, and how does Java 17+ Strong Encapsulation prevent this?",
    interviewerIntent: "Testing depth of Java reflection, internal class structures, and Java 9+ JPMS module boundary defenses.",
    juniorTrap: "Believing that private final fields in wrapper classes are physically immutable against all runtime reflection.",
    problem: "Malicious libraries or poorly written agent interceptors mutating JVM-wide cached literals.",
    innerWorking: "Integer has an internal private static class IntegerCache containing an array Integer[] cache. Using setAccessible(true) on Field, code can access the cache array and overwrite the element corresponding to integer 4. Since autoboxing reuses cached references, any subsequent Integer x = 4 evaluates to whatever was overwritten. In Java 17+, JEP 403 (Strongly Encapsulate JDK Internals) blocks setAccessible on java.base packages, throwing InaccessibleObjectException unless overridden with --add-opens.",
    seniorAnswer: [
      "Autoboxing Mechanism: Integer.valueOf(4) indexes directly into IntegerCache.cache[4 + 128]. Overwriting that element corrupts all autoboxed 4s globally.",
      "Modern JVM Defense: Java 17+ forbids deep reflection on JDK internals by default, throwing java.lang.reflect.InaccessibleObjectException.",
      "Security Best Practice: Run applications under SecurityManager or modern modular isolation flags."
    ],
    codeSnippet: `import java.lang.reflect.Field;

public class IntegerCacheTampering {
    public static void main(String[] args) throws Exception {
        // Pre-Java 17 (or with --add-opens java.base/java.lang=ALL-UNNAMED):
        Class<?> cacheClass = Class.forName("java.lang.Integer$IntegerCache");
        Field field = cacheClass.getDeclaredField("cache");
        field.setAccessible(true);
        Integer[] cache = (Integer[]) field.get(null);

        // Rewrite value for 4 (index: 4 + 128 = 132) to 5:
        cache[132] = 5;

        Integer twoPlusTwo = 2 + 2; // Autoboxes to Integer.valueOf(4)
        System.out.println("2 + 2 = " + twoPlusTwo); // PRINTS: 5!
    }
}`,
    trap: "Prior to Java 17, IntegerCache could be mutated via reflection to alter arithmetic results globally."
  },

  {
    id: "q-java-finalize-resurrection",
    category: "Tricky Edge Cases",
    difficulty: "Senior",
    title: "The finalize() Trap: Object Resurrection, Finalizer Thread Starvation & Modern Cleaner",
    question: "How can an object resurrect itself from the dead inside finalize(), why is finalize() deprecated, and how does the Cleaner API replace it?",
    interviewerIntent: "Testing object lifecycle edge cases, GC finalization queue risks, and modern resource management.",
    juniorTrap: "Relying on finalize() for mission-critical native memory or connection cleanup.",
    problem: "Production applications crashing with OOM because the single low-priority Finalizer thread gets backlogged by slow finalize() calls.",
    innerWorking: "When an object with a non-empty finalize() becomes unreachable, the GC does NOT immediately reclaim it. It appends the object to a java.lang.ref.Finalizer queue. Inside finalize(), if the object assigns this to a live static variable, the object becomes reachable again (Resurrected!). However, the JVM guarantees finalize() will NEVER run a second time. If it becomes unreachable again, finalize() is skipped. Deprecated in Java 9, scheduled for removal in modern Java.",
    seniorAnswer: [
      "Finalizer Thread Bottleneck: HotSpot runs a single Finalizer daemon thread. If any finalize() method blocks or runs slowly, the queue grows infinitely, causing OutOfMemoryError.",
      "Performance Overhead: Objects with finalizers take at least 2 full GC cycles to be collected and degrade allocation throughput.",
      "Modern Replacement: Use java.lang.ref.Cleaner (Java 9+) or AutoCloseable with try-with-resources."
    ],
    codeSnippet: `public class ZombieResurrection {
    public static ZombieResurrection liveInstance;

    @Override
    @SuppressWarnings("deprecation")
    protected void finalize() {
        System.out.println("finalize() running... Resurrecting object!");
        // RESURRECTION: Re-assigns 'this' to an active GC root!
        liveInstance = this; 
        // Note: The JVM will NEVER invoke finalize() again for this object!
    }

    public static void main(String[] args) throws Exception {
        new ZombieResurrection();
        System.gc(); // Trigger GC
        Thread.sleep(100);

        if (liveInstance != null) {
            System.out.println("Object resurrected from the dead!");
        }
    }
}`,
    trap: "Never rely on finalize(); it degrades GC performance, causes memory leaks, and only runs once per instance."
  },

  {
    id: "q-java-serialization-transient-singleton",
    category: "Tricky Edge Cases",
    difficulty: "Staff Level",
    title: "Serialization & transient: Non-Serializable Superclass Constructor & Singleton Destruction",
    question: "What constructor executes when deserializing a subclass whose superclass is NOT Serializable? How does serialization destroy singletons?",
    interviewerIntent: "Testing serialization protocol specifications, constructor execution during deserialization, and singleton protection.",
    juniorTrap: "Assuming deserialization calls the subclass constructor, or that inline transient field initializers execute.",
    problem: "Deserializing an object resets superclass fields to default values and creates duplicate singleton instances, breaking singleton guarantees.",
    innerWorking: "1) Non-Serializable Superclass: During deserialization, the subclass constructor is NEVER called. Instead, the JVM walks up the hierarchy to find the first non-serializable superclass and invokes its NO-ARG constructor. If that superclass lacks a no-arg constructor, InvalidClassException is thrown at runtime! 2) transient: transient fields are restored to primitive defaults (0, null), ignoring inline field assignments. 3) Singleton Destruction: Deserialization bypasses constructors and allocates a brand-new heap object, violating singleton uniqueness. Fix: Implement readResolve().",
    seniorAnswer: [
      "readResolve() Contract: protected Object readResolve() { return INSTANCE; } ensures the deserializer substitutes the cached singleton reference.",
      "Enum Defense: Enum singletons are immune to serialization attacks; the JVM guarantees only one instance per enum constant.",
      "serialVersionUID: Explicitly declare serialVersionUID to prevent InvalidClassException when compilers generate differing hashes."
    ],
    codeSnippet: `import java.io.*;

class ParentNotSerializable {
    int parentVal;
    // MANDATORY: First non-serializable superclass MUST have no-arg constructor!
    public ParentNotSerializable() {
        System.out.println("ParentNotSerializable() called");
        this.parentVal = 10;
    }
}

class ChildSerializable extends ParentNotSerializable implements Serializable {
    private static final long serialVersionUID = 1L;
    int childVal;
    transient int secret = 999; // Ignored on deserialization (defaults to 0)!

    public ChildSerializable(int a, int b) {
        this.parentVal = a;
        this.childVal = b;
    }

    // SINGLETON PROTECTION:
    protected Object readResolve() {
        // Return existing singleton instance rather than deserialized duplicate!
        return this;
    }
}`,
    trap: "Deserialization invokes the first non-serializable superclass no-arg constructor, resetting superclass state."
  },

  {
    id: "q-java-main-static-overload",
    category: "Tricky Edge Cases",
    difficulty: "Mid-Senior",
    title: "Why main() Must Be static, Method Overloading & Reflection Entry Points",
    question: "Why must public static void main(String[] args) be static, can main() be overloaded or marked final/synchronized, and what changed in Java 21?",
    interviewerIntent: "Testing foundational knowledge of JVM bootstrap mechanics, entry point requirements, and Java 21 compact main features.",
    juniorTrap: "Thinking main() cannot be overloaded with other parameter types, or not knowing why static is required.",
    problem: "Confusion regarding JVM class initialization and launch requirements.",
    innerWorking: "The JVM entry point is called before any objects exist on the heap. If main() were non-static, the JVM would have to instantiate the containing class, requiring decisions about which constructor to call. Overloading main is completely legal in Java, but the JVM launcher looks specifically for the exact signature: public static void main(String[] args). It CAN be marked final, synchronized, or strictfp.",
    seniorAnswer: [
      "Why Static: Enables the JVM C-based launcher to call the method directly via Class.getMethod() without instantiating heap state.",
      "Modifiable Modifiers: main() can be final (prevents hiding in subclasses) or synchronized (synchronizes on Class object).",
      "Java 21 JEP 445 / 463: Unnamed classes and instance main methods allow void main() without String[] or static in launch scripts."
    ],
    codeSnippet: `public class MainMechanics {
    // Valid entry point (can be final and synchronized!):
    public static final synchronized void main(String[] args) {
        System.out.println("JVM Entry Point!");
        main(42); // Calling overloaded version
    }

    // Overloading main is 100% legal!
    public static void main(int number) {
        System.out.println("Overloaded main: " + number);
    }
    public static void main(String arg1, String arg2) {
        System.out.println("Overloaded dual string main");
    }
}`,
    trap: "main() can be overloaded, final, or synchronized, but the JVM launcher requires public static void main(String[])."
  },

  {
    id: "q-java-reference-types-phantom",
    category: "Tricky Edge Cases",
    difficulty: "Staff Level",
    title: "Strong vs Soft vs Weak vs Phantom References: Memory Mechanics & ReferenceQueue",
    question: "Compare Strong, Soft, Weak, and Phantom references across GC collection cycles, and explain how PhantomReference powers off-heap cleaners.",
    interviewerIntent: "Evaluating mastery of advanced JVM reference reachability, caching strategies, and native off-heap memory reclamation.",
    juniorTrap: "Confusing SoftReference (reclaimed only during memory pressure before OOM) with WeakReference (reclaimed on the very next GC cycle).",
    problem: "Caches causing OutOfMemoryError because they hold Strong references, or native off-heap buffers leaking memory.",
    innerWorking: "1) StrongReference: Default reference. Never GC'd while reachable from GC roots. 2) SoftReference: GC reclaims ONLY when memory is low (before throwing OutOfMemoryError). Ideal for memory-sensitive caches. 3) WeakReference: GC reclaims eagerly on the very next GC run, regardless of memory headroom. Ideal for canonical mappings (WeakHashMap). 4) PhantomReference: get() ALWAYS returns null. Enqueued to a ReferenceQueue AFTER the object has been finalized and memory is ready to be reclaimed. Used to safely deallocate native off-heap memory (like DirectByteBuffer Cleaner) without resurrection bugs.",
    seniorAnswer: [
      "SoftReference Tuning: Governed by -XX:SoftRefLRUPolicyMSPerMB (default 1000ms per free megabyte).",
      "WeakHashMap: Entry keys are WeakReferences. When keys lose strong references, the GC enqueues them and the map purges stale entries on subsequent operations.",
      "Phantom Cleaners: Replaces dangerous finalize(). Used in modern Java's java.lang.ref.Cleaner to free OS handles and native C pointers."
    ],
    codeSnippet: `import java.lang.ref.*;

public class ReferenceTypesDemo {
    public static void main(String[] args) {
        Object strong = new Object();

        // 1. Soft Reference: Collected ONLY before OutOfMemoryError
        SoftReference<Object> soft = new SoftReference<>(new Object());

        // 2. Weak Reference: Collected on the VERY NEXT GC cycle
        WeakReference<Object> weak = new WeakReference<>(new Object());

        // 3. Phantom Reference: get() ALWAYS returns null!
        ReferenceQueue<Object> refQueue = new ReferenceQueue<>();
        PhantomReference<Object> phantom = new PhantomReference<>(new Object(), refQueue);

        System.out.println("Phantom.get(): " + phantom.get()); // ALWAYS prints null!

        // Force GC:
        System.gc();

        System.out.println("Weak after GC: " + weak.get()); // null (Collected!)
        System.out.println("Soft after GC: " + soft.get()); // Still alive (Memory is ample!)
    }
}`,
    trap: "PhantomReference.get() always returns null; its purpose is post-mortem notification via ReferenceQueue."
  }
];

// Append JAVA_QUESTIONS to java-data.js
const appendScript = `\n\n// =========================================================================\n// JAVA TRICKY INTERVIEW QUESTIONS (Senior & Staff Level)\n// =========================================================================\nwindow.REVISION_APP_DATA.JAVA_QUESTIONS = ${JSON.stringify(javaQuestions, null, 2)};\n`;

fs.writeFileSync(javaDataPath, currentContent + appendScript, 'utf8');
console.log('Successfully written ' + javaQuestions.length + ' tricky Java questions to ' + javaDataPath);
