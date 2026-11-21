/**
 * streams-data.js
 * Complete Java Streams API Architectural Guide & 25 Top Interview Coding Questions
 * Senior & Staff Engineer Level
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.STREAMS_TOPICS = [
  {
    id: "stream-pipeline-lifecycle",
    title: "Stream Pipeline Lifecycle & Mechanics",
    category: "Streams Architecture",
    badge: "Core Architecture",
    oneLiner: "Streams are lazy, single-pass pipeline traversals with unexecuted intermediate ops until a terminal op triggers loop fusion.",
    summary: "A Stream is not a data structure; it does not store elements. It is a lazily evaluated pipeline of functional transformations over a source (Collection, Array, I/O channel) evaluated via an internal Spliterator.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Stream Pipeline Lifecycle & Loop Fusion</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Source</span>
            <span class="node-label">Collection / Array</span>
            <span class="node-sub">Spliterator traversal</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Intermediate (Lazy)</span>
            <span class="node-label">filter() ➔ map()</span>
            <span class="node-sub">Stateless (Fused Pass)</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">3. Intermediate (Stateful)</span>
            <span class="node-label">sorted() / distinct()</span>
            <span class="node-sub">Requires memory barrier</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. Terminal (Eager)</span>
            <span class="node-label">collect() / reduce()</span>
            <span class="node-sub">Triggers pull iteration</span>
          </div>
        </div>
        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 10px; line-height: 1.45;">
          ⚡ <strong>Loop Fusion Optimization:</strong> The JVM JIT compiler fuzes adjacent stateless operations (e.g. <code>filter</code> + <code>map</code>) into a single iteration pass over the data, avoiding intermediate array/collection allocation.
        </div>
      </div>
    `,
    keyPoints: [
      "Laziness: Intermediate operations (filter, map) return a new Stream and execute ZERO bytecode until a terminal operation is invoked.",
      "Single-Use Invariant: A Stream cannot be reused once a terminal operation has closed it (throws `IllegalStateException: stream has already been operated upon or closed`).",
      "Loop Fusion & Short-Circuiting: Stateless ops are fused into a single pass. Short-circuiting operations (findFirst, anyMatch, limit) can terminate infinite streams.",
      "Spliterator: Streams decouple data iteration from parallelization via Spliterators using `tryAdvance()` (sequential) and `trySplit()` (work-stealing)."
    ],
    codeSnippet: `// Stream Pipeline Lifecycle Demo
List<String> names = List.of("alice", "bob", "alexander", "brian", "anna");

// Stateless operations are fused into 1 pass; terminates after finding 2 matches
List<String> result = names.stream()
    .filter(name -> {
        System.out.println("Filter pass: " + name);
        return name.startsWith("a");
    })
    .map(String::toUpperCase)
    .limit(2) // Short-circuit: halts source consumption immediately
    .toList(); // Terminal op (Java 16+)`,
    pitfall: "Calling a terminal operation twice on the same stream instance causes an IllegalStateException. Streams cannot be reset; construct a fresh stream from the source.",
    interviewTip: "Explain Loop Fusion: How Java Streams combine multiple operations into a single loop pass at runtime instead of creating temporary lists between steps like naive loops."
  },

  {
    id: "stream-intermediate-ops",
    title: "Intermediate Operations: Stateless vs Stateful",
    category: "Functional Transformations",
    badge: "Engine Internals",
    oneLiner: "Stateless operations (filter, map, flatMap) process items independently; Stateful operations (sorted, distinct, limit) require state across elements.",
    summary: "Intermediate operations transform streams. Understanding stateless vs stateful is critical for performance and parallel stream execution.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Stateless vs Stateful Processing</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Stateless Ops</div>
            <div class="space-desc">filter(), map(), flatMap(), peek()</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Items evaluated in isolation in O(1) space. O(N) parallel scaling.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(249, 115, 22, 0.4); background: rgba(249, 115, 22, 0.08);">
            <div class="space-name" style="color: #fb923c;">Stateful Ops</div>
            <div class="space-desc">sorted(), distinct(), limit(), skip()</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Requires buffering or tracking prior elements. Memory barrier in parallel.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(168, 85, 247, 0.4); background: rgba(168, 85, 247, 0.08);">
            <div class="space-name" style="color: #c084fc;">Java 9+ Predicates</div>
            <div class="space-desc">takeWhile(), dropWhile()</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Short-circuits on sorted sources when condition flips to false.</div>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "`map` vs `flatMap`: `map` transforms T ➔ R (1:1 mapping). `flatMap` transforms T ➔ Stream<R> and flattens into Stream<R> (1:N mapping).",
      "`sorted()` Hazard: Buffers ALL upstream elements into an internal array before emitting a single item. Cannot be short-circuited on infinite streams without `limit()` before `sorted()`.",
      "`distinct()`: Backed by a temporary HashSet; requires O(N) space and correct `equals()` / `hashCode()` implementations.",
      "`takeWhile()` vs `filter()`: `takeWhile` halts processing the moment the predicate evaluates to false (ideal for sorted streams), whereas `filter` evaluates all elements."
    ],
    codeSnippet: `// flatMap Example: Extract unique skills across developers
record Developer(String name, List<String> skills) {}

List<Developer> team = List.of(
    new Developer("Alice", List.of("Java", "Kafka")),
    new Developer("Bob", List.of("Java", "Postgres", "Docker"))
);

List<String> distinctSkills = team.stream()
    .flatMap(dev -> dev.skills().stream()) // Flattens List<String> to Stream<String>
    .distinct()
    .sorted()
    .toList(); // ["Docker", "Java", "Kafka", "Postgres"]`,
    pitfall: "Calling `.sorted()` on an infinite stream (e.g. Stream.generate) without a preceding `.limit(N)` throws an OutOfMemoryError because it attempts to buffer infinite items.",
    interviewTip: "When asked how flatMap works mechanically: It accepts a function returning a Stream, opens each inner stream, and concatenates all elements sequentially into the caller pipeline."
  },

  {
    id: "stream-collectors-deep-dive",
    title: "Collectors Framework & Downstream Reductions",
    category: "Reductions & Aggregations",
    badge: "Staff Mastery",
    oneLiner: "Collectors transform stream outputs into Maps, Lists, Sets, or complex hierarchical aggregations via groupingBy and downstream collectors.",
    summary: "The `Collectors` utility class provides factory methods for mutable reduction operations. Senior engineers must master `groupingBy`, `partitioningBy`, downstream collectors, and `toMap` conflict resolution.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Two-Level groupingBy Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Classifier</span>
            <span class="node-label">Employee::department</span>
            <span class="node-sub">Generates Map Key</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Partition / Bucket</span>
            <span class="node-label">List&lt;Employee&gt;</span>
            <span class="node-sub">Items matching Key</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">3. Downstream Collector</span>
            <span class="node-label">mapping / counting / maxBy</span>
            <span class="node-sub">Reduces Bucket Value</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "`Collectors.groupingBy(classifier, downstream)`: Groups elements by classification function. The downstream collector reduces the list of values for each key.",
      "`Collectors.toMap(keyMapper, valueMapper, mergeFunction, mapSupplier)`: Always provide a `mergeFunction` `(existing, incoming) -> existing` to avoid `IllegalStateException: Duplicate key`.",
      "`Collectors.partitioningBy(predicate)`: Special 2-bucket group partition returning `Map<Boolean, List<T>>` with constant O(1) indexing overhead.",
      "`Collectors.teeing()` (Java 12): Runs two independent collectors simultaneously over a single pass and merges results via a BiFunction (e.g., finding min and max together)."
    ],
    codeSnippet: `// Advanced Collectors: Average salary & Employee count per department
record Employee(String name, String department, double salary) {}

Map<String, DepartmentSummary> deptStats = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.collectingAndThen(
            Collectors.summarizingDouble(Employee::salary),
            stats -> new DepartmentSummary(stats.getCount(), stats.getAverage(), stats.getMax())
        )
    ));`,
    pitfall: "Using `Collectors.toMap(k, v)` without the 3rd mergeFunction argument crashes with IllegalStateException in production as soon as duplicate keys appear.",
    interviewTip: "Highlight `Collectors.collectingAndThen`: It applies a finishing transformation function immediately after reduction without allocating an intermediate map."
  },

  {
    id: "comparator-masterclass",
    title: "Comparator API: Multi-Key Sorting & Null Handling",
    category: "Sorting & Functional Composition",
    badge: "Must Know",
    oneLiner: "Modern Comparator composition uses comparing(), thenComparing(), reversed(), and nullsFirst() / nullsLast() declarative chains.",
    summary: "Java 8 transformed Comparator from a verbose anonymous inner class into a fluent declarative pipeline. Senior engineers must be able to write complex multi-field, null-safe sorts in 1 readable line.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Fluent Comparator Composition Chain</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Primary Key</span>
            <span class="node-label">comparing(Employee::dept)</span>
            <span class="node-sub">Sorts Department Asc</span>
          </div>
          <div class="flow-arrow-node">──thenComparing──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Secondary Key</span>
            <span class="node-label">comparingDouble(::salary).reversed()</span>
            <span class="node-sub">Sorts Salary Desc</span>
          </div>
          <div class="flow-arrow-node">──thenComparing──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Tertiary Key</span>
            <span class="node-label">nullsLast(comparing(::name))</span>
            <span class="node-sub">Pushes null names to end</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "`Comparator.comparing(keyExtractor)`: Extracts a Comparable sort key. Use primitive specializations `comparingInt`, `comparingLong`, `comparingDouble` to avoid autoboxing overhead.",
      "`thenComparing()`: Chains a secondary tie-breaker comparison when primary keys are equal.",
      "`reversed()`: Inverts the preceding comparator's sort order.",
      "`Comparator.nullsFirst(c)` and `Comparator.nullsLast(c)`: Wraps a comparator to safely handle null elements without throwing NullPointerException."
    ],
    codeSnippet: `// Senior Multi-field Sort: Dept ASC, Salary DESC, Name ASC (nulls at end)
Comparator<Employee> seniorComparator = Comparator
    .comparing(Employee::department)
    .thenComparing(Comparator.comparingDouble(Employee::salary).reversed())
    .thenComparing(Employee::name, Comparator.nullsLast(Comparator.naturalOrder()));

List<Employee> sorted = employees.stream()
    .sorted(seniorComparator)
    .toList();`,
    pitfall: "Writing `(a, b) -> a.getSalary() - b.getSalary()` causes integer underflow/overflow bugs when comparing extreme values (Integer.MIN_VALUE). Always use `Comparator.comparingInt()` or `Integer.compare()`.",
    interviewTip: "Never implement manual subtracting logic in comparators. Mention that `Integer.compare(x, y)` and `Double.compare(x, y)` correctly handle NaN and negative zero edge cases."
  },

  {
    id: "parallel-streams-internals",
    title: "Parallel Streams, ForkJoinPool & Spliterators",
    category: "Concurrency & Hardware",
    badge: "Senior Concurrency",
    oneLiner: "Parallel streams execute on ForkJoinPool.commonPool() via recursive divide-and-conquer spliterator decomposition.",
    summary: "Parallel streams utilize CPU multi-core hardware by splitting data into chunks using `Spliterator.trySplit()` and processing them concurrently using work-stealing ForkJoinPool worker threads.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: ForkJoinPool Work-Stealing Parallel Stream</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Source Chunk</span>
            <span class="node-label">Spliterator.trySplit()</span>
            <span class="node-sub">Divides into binary tree</span>
          </div>
          <div class="flow-arrow-node">──fork──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Worker Threads</span>
            <span class="node-label">ForkJoinPool.commonPool()</span>
            <span class="node-sub">Runtime.availableProcessors - 1</span>
          </div>
          <div class="flow-arrow-node">──steal──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Work Stealing</span>
            <span class="node-label">Deque FIFO / LIFO</span>
            <span class="node-sub">Idle threads steal tasks</span>
          </div>
          <div class="flow-arrow-node">──join──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Reduction</span>
            <span class="node-label">Combiner BiFunction</span>
            <span class="node-sub">Associative accumulator</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The N*Q Rule (Doug Lea): A parallel stream yields speedup only when `N * Q > 10,000`, where `N` is number of items and `Q` is CPU computational cost per item.",
      "Shared Pool Hazard: `parallelStream()` uses `ForkJoinPool.commonPool()`, which is shared JVM-wide. Blocking I/O inside a parallel stream starves the entire application.",
      "Custom Pool: To isolate parallel stream execution, wrap it in a custom `ForkJoinPool.submit(() -> stream.parallel()...).get()`.",
      "Thread Safety: Accumulator operations MUST be stateless and side-effect free. Adding to an `ArrayList` in `forEach()` causes race conditions and lost updates."
    ],
    codeSnippet: `// Parallel Stream Isolation with Custom ForkJoinPool
ForkJoinPool customPool = new ForkJoinPool(4);
try {
    List<Double> results = customPool.submit(() ->
        heavyDataList.parallelStream()
            .map(this::heavyCpuCalculation) // Pure stateless CPU computation
            .toList()
    ).get();
} finally {
    customPool.shutdown();
}`,
    pitfall: "Running blocking I/O calls (HTTP requests, DB queries) inside standard parallel streams blocks commonPool threads, grinding the rest of your Spring Boot or server app to a halt.",
    interviewTip: "State the mathematical requirement for parallel stream operations: Accumulators must be associative: `(a op b) op c == a op (b op c)` and stateless."
  }
];

window.REVISION_APP_DATA.STREAM_QUESTIONS = [
  {
    id: "sq-1-dept-highest-earner",
    title: "1. Highest Earner in Each Department",
    difficulty: "Medium",
    category: "Grouping & Aggregations",
    summary: "Group employees by department and extract the single employee with the highest salary in each department.",
    problem: "Given a list of Employee objects (id, name, department, salary), return a `Map<String, Employee>` mapping each department name to the highest-earning employee.",
    solution: `public Map<String, Employee> getHighestEarnerPerDept(List<Employee> employees) {
    return employees.stream()
        .collect(Collectors.groupingBy(
            Employee::department,
            Collectors.collectingAndThen(
                Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
                Optional::get
            )
        ));
}`,
    explanation: "`groupingBy` partitions the stream by department. The downstream `maxBy` collector finds the Optional<Employee> with max salary. `collectingAndThen` extracts the value from the Optional directly so the resulting map holds the raw Employee instead of Optional<Employee>.",
    trap: "Using `Collectors.toMap()` directly without handling multiple employees in the same department causes duplicate key exceptions. Using `maxBy` alone leaves values wrapped in `Optional<Employee>`."
  },

  {
    id: "sq-2-second-highest-number",
    title: "2. Second Highest Number (with Duplicates)",
    difficulty: "Medium",
    category: "Sorting & Slicing",
    summary: "Find the second highest distinct number in an integer list or array.",
    problem: "Given `List<Integer> numbers = List.of(5, 9, 11, 2, 11, 8, 9);`, return the second highest unique value using Java Streams.",
    solution: `public Optional<Integer> findSecondHighest(List<Integer> numbers) {
    return numbers.stream()
        .distinct()                           // Eliminate duplicates (e.g. 11, 11)
        .sorted(Comparator.reverseOrder())     // Sort descending [11, 9, 8, 5, 2]
        .skip(1)                              // Skip the highest element
        .findFirst();                         // Returns Optional[9]
}`,
    explanation: "`.distinct()` is essential so duplicate highest values do not occupy both 1st and 2nd positions. `.sorted(reverseOrder())` orders descending, `.skip(1)` bypasses the largest, and `.findFirst()` safely returns an Optional in case the list has fewer than 2 elements.",
    trap: "Forgetting `.distinct()`: If the input is [10, 10, 9], skipping 1 without distinct yields 10 instead of 9."
  },

  {
    id: "sq-3-char-frequency-sorted",
    title: "3. Character Frequency Map Sorted Descending",
    difficulty: "Medium",
    category: "Map Transformations",
    summary: "Count the frequency of each character in a String and sort results by frequency descending.",
    problem: "Given a string `\"banana\"`, produce a `Map<Character, Long>` sorted in descending order of character occurrence frequency.",
    solution: `public Map<Character, Long> getSortedCharFrequency(String str) {
    return str.chars()
        .mapToObj(c -> (char) c)
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet().stream()
        .sorted(Map.Entry.<Character, Long>comparingByValue().reversed())
        .collect(Collectors.toMap(
            Map.Entry::getKey,
            Map.Entry::getValue,
            (e1, e2) -> e1,
            LinkedHashMap::new // Preserves sorted insertion order
        ));
}`,
    explanation: "Two-stage stream: 1) Group characters using `groupingBy(identity(), counting())`. 2) Stream the entrySet, sort entries by value reversed, and collect into a `LinkedHashMap` to preserve sorted order.",
    trap: "Collecting back into default `Collectors.toMap()` loses the sorted order because standard HashMap does not guarantee iteration order. `LinkedHashMap::new` is mandatory."
  },

  {
    id: "sq-4-find-duplicates",
    title: "4. Find All Duplicate Elements in O(N)",
    difficulty: "Medium",
    category: "Set Filtering",
    summary: "Extract only the elements that appear more than once in a collection using Streams.",
    problem: "Given `List<Integer> list = List.of(1, 2, 3, 2, 4, 5, 1, 6);`, return `Set<Integer>` containing [1, 2].",
    solution: `public Set<Integer> findDuplicates(List<Integer> list) {
    Set<Integer> seen = new HashSet<>();
    return list.stream()
        .filter(n -> !seen.add(n)) // Set.add() returns false if already present
        .collect(Collectors.toSet());
}`,
    explanation: "`Set.add(e)` returns `true` if element was added, and `false` if it was already in the set. Filtering with `!seen.add(n)` cleanly emits only duplicated elements in single pass O(N) time.",
    trap: "Using `Collections.frequency(list, n) > 1` inside a filter is an O(N^2) anti-pattern that scans the entire list for every single item."
  },

  {
    id: "sq-5-partition-prime-numbers",
    title: "5. Partition Numbers into Prime and Non-Prime",
    difficulty: "Medium",
    category: "Partitioning",
    summary: "Partition an integer range into two lists: Prime and Non-Prime numbers.",
    problem: "Given a list of integers from 1 to 100, return `Map<Boolean, List<Integer>>` where true = primes and false = non-primes.",
    solution: `public boolean isPrime(int n) {
    if (n <= 1) return false;
    return IntStream.rangeClosed(2, (int) Math.sqrt(n))
        .noneMatch(divisor -> n % divisor == 0);
}

public Map<Boolean, List<Integer>> partitionPrimes(List<Integer> numbers) {
    return numbers.stream()
        .collect(Collectors.partitioningBy(this::isPrime));
}`,
    explanation: "`partitioningBy` takes a predicate returning boolean and produces a map with exactly two keys: `Boolean.TRUE` and `Boolean.FALSE`. `isPrime` uses `IntStream.rangeClosed` with `noneMatch` for clean functional evaluation up to sqrt(N).",
    trap: "Testing divisors up to `n - 1` instead of `Math.sqrt(n)` changes prime check complexity from O(sqrt(N)) to O(N)."
  },

  {
    id: "sq-6-first-non-repeated-char",
    title: "6. First Non-Repeated Character in a String",
    difficulty: "Medium",
    category: "Frequency & Order",
    summary: "Find the very first character in a string that does not repeat anywhere else.",
    problem: "Given `String input = \"swiss\";`, find the first non-repeated character ('w').",
    solution: `public Optional<Character> firstNonRepeatedChar(String input) {
    return input.chars()
        .mapToObj(c -> (char) c)
        .collect(Collectors.groupingBy(
            Function.identity(),
            LinkedHashMap::new, // Maintain encounter order!
            Collectors.counting()
        ))
        .entrySet().stream()
        .filter(entry -> entry.getValue() == 1L)
        .map(Map.Entry::getKey)
        .findFirst();
}`,
    explanation: "`LinkedHashMap::new` guarantees encounter order is preserved during grouping. The subsequent stream filters for count == 1 and `findFirst()` retrieves the first non-repeated character.",
    trap: "Omitting `LinkedHashMap::new` in `groupingBy` allows standard `HashMap` bucket ordering to scramble character positions, returning the wrong character."
  },

  {
    id: "sq-7-flatten-nested-collections",
    title: "7. Flatten Nested Lists & Remove Duplicates",
    difficulty: "Medium",
    category: "flatMap",
    summary: "Flatten a 2D List or object graph into a single unique sorted collection.",
    problem: "Given `List<List<String>> matrix = List.of(List.of(\"a\",\"b\"), List.of(\"b\",\"c\"), List.of(\"d\"));`, flatten to a single sorted list of distinct elements.",
    solution: `public List<String> flattenAndDeduplicate(List<List<String>> nested) {
    return nested.stream()
        .flatMap(Collection::stream) // Flattens each List<String> into Stream<String>
        .distinct()
        .sorted()
        .toList();
}`,
    explanation: "`flatMap(Collection::stream)` converts Stream<List<String>> to Stream<String>. `distinct()` removes cross-list duplicates and `sorted()` organizes in natural order.",
    trap: "Calling `.map(Collection::stream)` instead of `.flatMap()` yields `Stream<Stream<String>>` rather than a flattened stream."
  },

  {
    id: "sq-8-multi-field-comparator-nulls",
    title: "8. Sort Objects by Multiple Fields with Nulls Last",
    difficulty: "Hard",
    category: "Comparator Chaining",
    summary: "Sort a list of employees by Department (ASC), Salary (DESC), and Name (ASC) where name can be null.",
    problem: "Construct a clean declarative Comparator to sort Employee records by Department asc, Salary desc, and Name asc (pushing null names to the bottom).",
    solution: `public List<Employee> sortEmployeesSenior(List<Employee> employees) {
    Comparator<Employee> comp = Comparator
        .comparing(Employee::department)
        .thenComparing(Comparator.comparingDouble(Employee::salary).reversed())
        .thenComparing(
            Employee::name, 
            Comparator.nullsLast(Comparator.naturalOrder())
        );

    return employees.stream()
        .sorted(comp)
        .toList();
}`,
    explanation: "Chains `comparing()` for primary key, `thenComparing(reversed())` for secondary descending numeric sort, and `Comparator.nullsLast()` to gracefully handle null field values without throwing NPE.",
    trap: "Calling `.reversed()` on the entire chain: `comp.thenComparing(...).reversed()` reverses EVERYTHING preceding it. Wrap only the target comparator in `.reversed()`."
  },

  {
    id: "sq-9-detect-anagrams",
    title: "9. Detect Anagrams using Streams",
    difficulty: "Medium",
    category: "String Processing",
    summary: "Determine if two strings are anagrams of each other using clean stream transformations.",
    problem: "Given two strings `s1 = \"listen\"` and `s2 = \"silent\"`, return true if they are anagrams.",
    solution: `public boolean isAnagram(String s1, String s2) {
    if (s1.length() != s2.length()) return false;
    
    Function<String, Map<Integer, Long>> freqMap = s -> s.chars()
        .boxed()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

    return freqMap.apply(s1).equals(freqMap.apply(s2));
}`,
    explanation: "Maps each string to its character-frequency map. Two strings are anagrams if and only if their character frequency maps are identical. Alternatively, sort the characters of both strings.",
    trap: "Comparing `s1.chars().sorted()` directly: `s1.chars().sorted().equals(s2.chars().sorted())` compares Stream object references, NOT stream content!"
  },

  {
    id: "sq-10-infinite-fibonacci",
    title: "10. Generate Fibonacci Sequence with Stream.iterate",
    difficulty: "Medium",
    category: "Infinite Streams",
    summary: "Generate the first N Fibonacci numbers without recursion or loops using Stream.iterate.",
    problem: "Produce a `List<Long>` containing the first 20 Fibonacci numbers using `Stream.iterate`.",
    solution: `public List<Long> getFibonacciSeries(int n) {
    return Stream.iterate(new long[]{0, 1}, f -> new long[]{f[1], f[0] + f[1]})
        .limit(n)
        .map(f -> f[0])
        .toList();
}`,
    explanation: "`Stream.iterate` generates an infinite stream of state tuples `[a, b]`, advancing `[b, a + b]`. `limit(n)` short-circuits the infinite stream, and `map(f -> f[0])` projects the sequence.",
    trap: "Forgetting `.limit(N)` on `Stream.iterate()` or `Stream.generate()` causes an infinite loop that freezes thread execution."
  },

  {
    id: "sq-11-summarizing-stats",
    title: "11. Calculate Count, Sum, Min, Max, and Avg in One Pass",
    difficulty: "Medium",
    category: "Summarization",
    summary: "Compute full statistical metrics over a numeric collection in a single stream pass.",
    problem: "Given a list of Order transactions, compute count, sum, average, min, and max in a single O(N) pass.",
    solution: `public DoubleSummaryStatistics getOrderStats(List<Order> orders) {
    return orders.stream()
        .collect(Collectors.summarizingDouble(Order::amount));
    // stats.getCount(), stats.getSum(), stats.getAverage(), stats.getMin(), stats.getMax()
}`,
    explanation: "`Collectors.summarizingDouble()` / `summarizingInt()` accumulates count, sum, min, max, and computes average in one traversal without multiple stream passes.",
    trap: "Running the stream 5 times (once for `count()`, once for `mapToDouble().sum()`, etc.) wastes 5x CPU cycles and fails if stream source is non-repeatable (e.g. an I/O channel)."
  },

  {
    id: "sq-12-list-intersection",
    title: "12. Find Intersection of Two Lists",
    difficulty: "Medium",
    category: "Set Operations",
    summary: "Find common elements between two large lists in O(N + M) time.",
    problem: "Given `listA` and `listB`, return a list containing all elements present in both without O(N*M) nested scanning.",
    solution: `public List<Integer> findIntersection(List<Integer> listA, List<Integer> listB) {
    Set<Integer> setB = new HashSet<>(listB); // O(M) lookup preparation
    return listA.stream()
        .filter(setB::contains)                // O(1) membership check
        .distinct()
        .toList();
}`,
    explanation: "Converting the second collection to a `HashSet` allows `setB::contains` to execute in O(1) time per element, achieving linear `O(N + M)` performance.",
    trap: "Calling `.filter(listB::contains)` directly on a List performs an O(M) linear scan for each element, degrading overall performance to quadratic O(N * M)."
  },

  {
    id: "sq-13-words-frequency-top-k",
    title: "13. Top K Most Frequent Words in a Document",
    difficulty: "Hard",
    category: "Heap & Grouping",
    summary: "Find the top K most recurring words in a sentence or document.",
    problem: "Given a text string, find the top 3 most frequently occurring words.",
    solution: `public List<String> topKFrequentWords(String text, int k) {
    return Arrays.stream(text.toLowerCase().split("\\\\W+"))
        .filter(word -> !word.isBlank())
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed()
            .thenComparing(Map.Entry::getKey))
        .limit(k)
        .map(Map.Entry::getKey)
        .toList();
}`,
    explanation: "Tokenizes words with regex, counts frequencies using `groupingBy(identity(), counting())`, sorts entries by value descending (tie-breaker alphabetical by key), and takes the top K.",
    trap: "Splitting on simple space `\" \"` fails when words are separated by punctuation (commas, periods, newlines). Use `\\\\W+` (non-word characters)."
  },

  {
    id: "sq-14-merge-maps-with-sum",
    title: "14. Merge Two Maps Combining Values on Key Collision",
    difficulty: "Medium",
    category: "Map Merging",
    summary: "Merge two frequency/metric maps, summing values when keys overlap.",
    problem: "Given `map1 = {A: 10, B: 20}` and `map2 = {B: 15, C: 30}`, merge into `{A: 10, B: 35, C: 30}`.",
    solution: `public Map<String, Integer> mergeMaps(Map<String, Integer> m1, Map<String, Integer> m2) {
    return Stream.concat(m1.entrySet().stream(), m2.entrySet().stream())
        .collect(Collectors.toMap(
            Map.Entry::getKey,
            Map.Entry::getValue,
            Integer::sum // Merge function handles key collisions!
        ));
}`,
    explanation: "`Stream.concat` combines both entry streams. When a key exists in both maps, `Integer::sum` combines their values seamlessly.",
    trap: "Omitting the merge function throws `IllegalStateException: Duplicate key B (attempted merging values 20 and 15)`."
  },

  {
    id: "sq-15-custom-collector-joining",
    title: "15. Group and Comma-Separate Child Names per Parent",
    difficulty: "Medium",
    category: "Mapping & Joining",
    summary: "Group records and concatenate a child field into a formatted string.",
    problem: "Given a list of items with category and itemName, return `Map<String, String>` where key is category and value is comma-separated item names.",
    solution: `public Map<String, String> groupItemNamesByCategory(List<Item> items) {
    return items.stream()
        .collect(Collectors.groupingBy(
            Item::category,
            Collectors.mapping(Item::name, Collectors.joining(", ", "[", "]"))
        ));
}`,
    explanation: "Combines `groupingBy` with downstream `mapping` and `joining`. `Collectors.mapping` extracts the string name before feeding into `Collectors.joining`.",
    trap: "Collecting into `List<String>` and then iterating manually to concatenate strings creates unnecessary garbage allocations."
  },

  {
    id: "sq-16-custom-teeing-collector",
    title: "16. Java 12 Collectors.teeing() Min & Max Pair",
    difficulty: "Hard",
    category: "Modern Java Features",
    summary: "Find both the minimum and maximum elements in a single stream pass.",
    problem: "Return a Pair/Record containing both the cheapest and most expensive product in a single stream traversal.",
    solution: `record PriceRange(Product min, Product max) {}

public PriceRange findPriceRange(List<Product> products) {
    return products.stream()
        .collect(Collectors.teeing(
            Collectors.minBy(Comparator.comparingDouble(Product::price)),
            Collectors.maxBy(Comparator.comparingDouble(Product::price)),
            (minOpt, maxOpt) -> new PriceRange(minOpt.orElse(null), maxOpt.orElse(null))
        ));
}`,
    explanation: "`Collectors.teeing()` takes two downstream collectors and a merger function. It splits the incoming elements into both collectors in parallel and combines the outputs at the end.",
    trap: "Running two stream iterations on `products` doubles execution time and fails if the stream source cannot be regenerated."
  },

  {
    id: "sq-17-longest-string-sentence",
    title: "17. Longest Word in a Sentence",
    difficulty: "Medium",
    category: "Reductions",
    summary: "Find the longest word in a text string using Stream reduction.",
    problem: "Given `\"The quick brown fox jumps over the lazy dog\"`, find the longest word.",
    solution: `public String findLongestWord(String sentence) {
    return Arrays.stream(sentence.split("\\\\s+"))
        .max(Comparator.comparingInt(String::length))
        .orElse("");
}`,
    explanation: "`Arrays.stream` splits the sentence. `.max(Comparator.comparingInt(String::length))` finds the maximum length string in O(N) time.",
    trap: "Using `.sorted(Comparator.comparingInt(String::length).reversed()).findFirst()` sorts the entire list in O(N log N) when only the single maximum is needed in O(N)."
  },

  {
    id: "sq-18-batch-stream-chunking",
    title: "18. Batch Stream Chunking into Size N",
    difficulty: "Hard",
    category: "Batch Processing",
    summary: "Partition a large stream or list into fixed-size batch sublists of size N for database bulk inserts.",
    problem: "Given a list of 10,000 entities, chunk them into sublists of batch size 500 using Java Streams.",
    solution: `public static <T> List<List<T>> chunkList(List<T> list, int chunkSize) {
    return IntStream.range(0, (list.size() + chunkSize - 1) / chunkSize)
        .mapToObj(i -> list.subList(i * chunkSize, Math.min((i + 1) * chunkSize, list.size())))
        .toList();
}`,
    explanation: "`IntStream.range` generates chunk indices using ceiling division. `mapToObj` slices the original list with `subList()` without copying memory.",
    trap: "Collecting elements into a stateful external accumulator inside `.forEach()` breaks thread safety if made parallel."
  },

  {
    id: "sq-19-find-pairs-sum-k",
    title: "19. Find All Unique Number Pairs That Sum to K",
    difficulty: "Hard",
    category: "Algorithmic Streams",
    summary: "Find all pairs (a, b) in a list such that a + b == target K without nested loop explosion.",
    problem: "Given `numbers = [2, 4, 3, 5, 7, 8, 9]`, target = 10, return unique pairs [[2, 8], [3, 7]].",
    solution: `public Set<List<Integer>> findPairs(List<Integer> nums, int target) {
    Set<Integer> seen = new HashSet<>();
    return nums.stream()
        .filter(n -> {
            int complement = target - n;
            if (seen.contains(complement)) {
                return true;
            }
            seen.add(n);
            return false;
        })
        .map(n -> List.of(Math.min(n, target - n), Math.max(n, target - n)))
        .collect(Collectors.toSet());
}`,
    explanation: "Single pass O(N) stream using a companion hash set for complement lookup. Normalizes the output pairs `[min, max]` so order doesn't duplicate pairs in the resulting set.",
    trap: "Using `IntStream.range` nested inside another stream results in quadratic O(N^2) complexity."
  },

  {
    id: "sq-20-reverse-each-word",
    title: "20. Reverse Each Word in a Sentence Preserving Order",
    difficulty: "Medium",
    category: "String Transformations",
    summary: "Reverse the letters of each word in a string while preserving word position.",
    problem: "Input: `\"Java Streams are Awesome\"` ➔ Output: `\"avaJ smaertS era emosewA\"`.",
    solution: `public String reverseWords(String sentence) {
    return Arrays.stream(sentence.split(" "))
        .map(word -> new StringBuilder(word).reverse().toString())
        .collect(Collectors.joining(" "));
}`,
    explanation: "Splits on word boundaries, maps each token to its StringBuilder reversed string, and rejoins with spaces.",
    trap: "Reversing the entire string first scrambles word positions (`\"Awesome are Streams Java\"`). Reversal must be mapped per token."
  },

  {
    id: "sq-21-parallel-stream-race-hazard",
    title: "21. Parallel Stream Concurrency Bug Diagnostic",
    difficulty: "Hard",
    category: "Concurrency Bugs",
    summary: "Identify and fix the race condition in parallel stream collection.",
    problem: "Diagnose why the following code produces missing elements or ArrayIndexOutOfBoundsException: `List<Integer> output = new ArrayList<>(); list.parallelStream().forEach(output::add);`",
    solution: `// THE BUGGY CODE:
// List<Integer> output = new ArrayList<>();
// list.parallelStream().forEach(output::add); // RACE CONDITION! ArrayList is NOT thread-safe!

// THE SENIOR FIX: Let the stream framework handle concurrent reduction
List<Integer> safeOutput = list.parallelStream()
    .filter(this::isValid)
    .toList(); // or .collect(Collectors.toList())`,
    explanation: "`ArrayList.add()` is not synchronized. Multiple ForkJoin worker threads updating `elementData` and `size` concurrently cause lost writes and silent array corruption. Stream terminal operations (`toList()`) manage thread isolation through proper reduction accumulators.",
    trap: "Attempting to fix with `Collections.synchronizedList(output)` introduces lock contention that destroys all parallel performance speedup."
  },

  {
    id: "sq-22-find-department-avg-salary-above-threshold",
    title: "22. Departments with Average Salary Above Threshold",
    difficulty: "Hard",
    category: "HAVING Equivalent in Streams",
    summary: "Simulate SQL `GROUP BY dept HAVING AVG(salary) > 100000` using Java Streams.",
    problem: "Filter for departments whose average employee salary exceeds $100,000.",
    solution: `public Map<String, Double> getHighPayingDepartments(List<Employee> employees, double threshold) {
    return employees.stream()
        .collect(Collectors.groupingBy(
            Employee::department,
            Collectors.averagingDouble(Employee::salary)
        ))
        .entrySet().stream()
        .filter(entry -> entry.getValue() > threshold)
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
}`,
    explanation: "Stage 1 groups by department and calculates average salary via `averagingDouble`. Stage 2 streams the resulting map entries to filter by threshold, mirroring SQL `HAVING`.",
    trap: "Filtering individual employees by salary before grouping: `filter(e -> e.getSalary() > 100k)` computes the average of only high earners, corrupting the true department average!"
  },

  {
    id: "sq-23-find-first-repeating-element",
    title: "23. First Repeating Element in an Array",
    difficulty: "Medium",
    category: "Lookahead / Set",
    summary: "Find the first element that occurs more than once, with lowest index of appearance.",
    problem: "Given `[10, 5, 3, 4, 3, 5, 6]`, return `5` (since 5 repeats earlier than 3).",
    solution: `public Optional<Integer> firstRepeatingElement(int[] arr) {
    Set<Integer> seen = new HashSet<>();
    int minIndex = -1;
    for (int i = arr.length - 1; i >= 0; i--) {
        if (seen.contains(arr[i])) {
            minIndex = i;
        } else {
            seen.add(arr[i]);
        }
    }
    return minIndex != -1 ? Optional.of(arr[minIndex]) : Optional.empty();
}`,
    explanation: "Traversing right-to-left and tracking elements in a HashSet allows finding the repeating element with the minimum starting index in O(N) time and O(N) space.",
    trap: "Forward traversal (`!set.add(n)`) returns the second occurrence of the first repeating pair, which may not be the element whose FIRST occurrence was leftmost."
  },

  {
    id: "sq-24-infinite-stream-short-circuit",
    title: "24. Infinite Stream with takeWhile Short-Circuiting",
    difficulty: "Medium",
    category: "Java 9+ Features",
    summary: "Process an infinite stream and short-circuit when a threshold condition fails.",
    problem: "Demonstrate how Java 9 `takeWhile` terminates consumption of an infinite stream.",
    solution: `public List<Integer> generateUntilThreshold(int start, int limit) {
    return Stream.iterate(start, n -> n + 3) // Infinite stream: 1, 4, 7, 10, 13...
        .takeWhile(n -> n < limit)           // Short-circuits the moment n >= limit
        .toList();
}`,
    explanation: "`takeWhile` evaluates elements until the predicate returns false, at which point the stream immediately halts consumption. Unlike `filter()`, which checks forever on infinite streams, `takeWhile` is a true short-circuit operation.",
    trap: "Using `.filter(n -> n < limit)` on an infinite stream runs FOREVER because it never knows if subsequent elements might satisfy the condition."
  },

  {
    id: "sq-25-custom-collector-implementation",
    title: "25. Implementing a Custom Collector from Scratch",
    difficulty: "Hard",
    category: "Collector Interface",
    summary: "Implement the Collector<T, A, R> interface to compute a custom reduction.",
    problem: "Write a custom collector that joins strings with custom delimiters and enclosure brackets.",
    solution: `public static Collector<String, StringJoiner, String> customJoining(String delimiter, String prefix, String suffix) {
    return Collector.of(
        () -> new StringJoiner(delimiter, prefix, suffix), // Supplier (creates accumulator container)
        StringJoiner::add,                                  // Accumulator (folds element into container)
        StringJoiner::merge,                                // Combiner (merges 2 containers for parallel streams)
        StringJoiner::toString,                             // Finisher (produces final result)
        Collector.Characteristics.IDENTITY_FINISH == null ? 
            Collector.Characteristics.CONCURRENT : Collector.Characteristics.IDENTITY_FINISH
    );
}`,
    explanation: "A Collector is defined by 4 functions: 1) `supplier()` creates the mutable container, 2) `accumulator()` adds an element, 3) `combiner()` merges two containers during parallel reduction, 4) `finisher()` extracts final result.",
    trap: "Forgetting the `combiner` function: Even in sequential streams, omitting the combiner breaks parallel stream compatibility or causes compilation failure in `Collector.of()`."
  }
];
