"""
Core Java Interview Topics - Java 8+ Features
7 Subtopics, 10 Tricky Questions Each (70 Questions Total)
"""

TOPICS_JAVA8 = [
    # -------------------------------------------------------------------------
    # Topic 29: Stream pipeline (map, flatMap, reduce, collect)
    # -------------------------------------------------------------------------
    {
        "topicId": "stream-pipeline",
        "topicTitle": "Stream pipeline (map, flatMap, reduce, collect)",
        "category": "java8",
        "summary": "Intermediate vs terminal operations, stream reuse, laziness, parallel stream thread safety, short-circuiting, and collector intricacies.",
        "questions": [
            {
                "id": "q-stream-1",
                "difficulty": "Mid",
                "title": "Stream Reuse: IllegalStateException on Re-consumption",
                "question": "Can you traverse or reuse an already consumed Java Stream? What exception is thrown and why is Stream designed as single-use?",
                "interviewerIntent": "Tests understanding of Stream lifecycle, lazy evaluation pipelines, and underlying cursor-like consumption semantics.",
                "juniorTrap": "Assuming a Stream is like a Collection that retains its elements in memory for multiple passes.",
                "problem": "A developer filters a stream and attempts to use the same stream variable to get count() and then findFirst(), resulting in runtime failure.",
                "innerWorking": "Streams are backed by a Spliterator pipeline. When a terminal operation runs, the pipeline is linked, consumed, and marked closed/operated upon via an internal flag. Calling any operation after flags IllegalStateException('stream has already been operated upon or closed'). To reuse data, construct a new Stream via a Supplier or store as a Collection.",
                "seniorAnswer": "No, a Stream cannot be reused once a terminal operation has executed. Streams are one-time computational pipelines that traverse source data lazily without storing elements. Reusing an operated stream throws IllegalStateException. If multiple traversals are needed, either collect into a Collection or wrap the stream creation in a `Supplier<Stream<T>>`.",
                "codeSnippet": "Stream<String> stream = Stream.of(\"a\", \"b\", \"c\");\nstream.forEach(System.out::print); // Terminal op consumes stream\n// stream.count(); // Throws IllegalStateException: stream has already been operated upon\n\n// Correct approach using Supplier:\nSupplier<Stream<String>> streamSupplier = () -> Stream.of(\"a\", \"b\", \"c\");\nstreamSupplier.get().forEach(System.out::print);\nlong count = streamSupplier.get().count(); // Works perfectly",
                "trap": "Believing intermediate operations consume the stream; only terminal operations trigger execution and mark the stream consumed."
            },
            {
                "id": "q-stream-2",
                "difficulty": "Senior",
                "title": "Resource Leaks with Files.lines() and flatMap()",
                "question": "Why does using Stream.flatMap() with Files.lines() or similar AutoCloseable streams cause native file descriptor leaks unless explicitly closed?",
                "interviewerIntent": "Verifies awareness that Streams backed by I/O resources implement AutoCloseable and must be closed, and that intermediate flatMap does NOT auto-close inner streams.",
                "juniorTrap": "Assuming try-with-resources on the outer stream automatically closes all child streams generated inside flatMap().",
                "problem": "Processing hundreds of log files by flatMapping `Files.lines(path)` crashes with `java.io.IOException: Too many open files`.",
                "innerWorking": "BaseStream implements AutoCloseable. When `Files.lines(path)` is opened, it holds an open FileChannel/BufferedReader. While try-with-resources on the outer stream closes registered close handlers, inner streams created inside flatMap lambdas are NOT automatically registered with the outer stream's onClose hook unless explicitly managed or wrapped.",
                "seniorAnswer": "Streams created from I/O (like Files.lines()) must be closed via try-with-resources to release operating system file descriptors. In flatMap, each inner stream created per element is independent; the outer stream does not close inner streams. You must explicitly ensure inner streams are closed (or use try-with-resources within flatMap) to prevent file handle exhaustion.",
                "codeSnippet": "List<Path> paths = List.of(Path.of(\"file1.txt\"), Path.of(\"file2.txt\"));\n// LEAK RISK:\npaths.stream().flatMap(p -> {\n    try { return Files.lines(p); } catch (IOException e) { return Stream.empty(); }\n}).forEach(System.out::println); // Inner streams are never closed!\n\n// FIXED: Register onClose or collect per file\ntry (Stream<Path> pStream = paths.stream()) {\n    pStream.flatMap(p -> {\n        try {\n            Stream<String> lines = Files.lines(p);\n            return lines.onClose(lines::close);\n        } catch (IOException e) { return Stream.empty(); }\n    }).forEach(System.out::println);\n}",
                "trap": "Assuming GC will quickly clean up open file descriptors; OS handles exhaust long before GC triggers."
            },
            {
                "id": "q-stream-3",
                "difficulty": "Senior",
                "title": "Parallel Stream Thread-Safety Trap with Stateful Lambdas",
                "question": "What is the danger of executing `list.parallelStream().forEach(result::add)` where `result` is an `ArrayList`? What symptoms occur?",
                "interviewerIntent": "Evaluates knowledge of parallel stream concurrency, shared mutable state hazards, and race conditions during non-thread-safe collection mutation.",
                "juniorTrap": "Thinking parallelStream() handles synchronization behind the scenes for external shared variables.",
                "problem": "Running `parallelStream().forEach(sharedList::add)` randomly produces ArrayIndexOutOfBoundsException, missing elements, or null values in the result.",
                "innerWorking": "parallelStream() splits work across ForkJoinPool.commonPool(). ArrayList is not synchronized. When multiple carrier/worker threads call `add()` concurrently without locks, they race on `elementData[size++] = element`. Race condition causes overwritten entries, null elements, or corrupted internal size counters.",
                "seniorAnswer": "Calling `forEach` with a stateful mutating lambda on an unsynchronized collection like ArrayList causes severe race conditions, data loss, and corrupted internal state. The stream API is functional: parallel processing requires immutable operations and pure functions. Rather than mutating an external collection, use the reduction operation `collect(Collectors.toList())` which safely merges partial results using the ForkJoin framework.",
                "codeSnippet": "List<Integer> unsafe = new ArrayList<>();\n// DANGEROUS: Thread safety violation\nIntStream.range(0, 1000).parallel().forEach(unsafe::add); // Size will often be < 1000 or throw!\n\n// CORRECT: Use reduction via collect\nList<Integer> safe = IntStream.range(0, 1000)\n                              .parallel()\n                              .boxed()\n                              .collect(Collectors.toList()); // Thread-safe parallel accumulation",
                "trap": "Using `Collections.synchronizedList()` with `forEach` avoids crashes but destroys parallel throughput due to heavy lock contention."
            },
            {
                "id": "q-stream-4",
                "difficulty": "Staff",
                "title": "reduce() Identity and Associativity Violations in Parallel Streams",
                "question": "What mathematical rules must `identity` and `accumulator`/`combiner` obey in `Stream.reduce()`? What happens in parallel execution if the combiner is non-associative?",
                "interviewerIntent": "Tests deep understanding of parallel divide-and-conquer reductions and mathematical requirements of identity and associativity.",
                "juniorTrap": "Passing an arbitrary non-zero value as identity (e.g., initial balance of 100) and getting massively multiplied numbers in parallel streams.",
                "problem": "Calculating sum with initial value 100: `stream.parallel().reduce(100, Integer::sum)` yields 100 multiplied by the number of thread chunks plus the sum.",
                "innerWorking": "In parallel reduce, data is partitioned into sub-tasks. Each sub-task applies the identity element: `combiner.apply(identity, x) == x`. If identity is 100, each thread slice starts with 100, multiplying 100 across 8 CPU cores. Furthermore, accumulator/combiner must be associative: `(a op b) op c == a op (b op c)`.",
                "seniorAnswer": "In `reduce(identity, accumulator, combiner)`, `identity` must be the true mathematical identity value such that for all `u`, `combiner.apply(identity, u) == u` (e.g., 0 for addition, 1 for multiplication). If a non-identity value is passed, parallel slices apply it multiple times, yielding incorrect aggregates. The operation must also be associative so sub-results can be combined in any tree order without altering the final value.",
                "codeSnippet": "List<Integer> nums = List.of(1, 2, 3, 4, 5);\n// INCORRECT in parallel:\nint bad = nums.parallelStream().reduce(100, Integer::sum);\n// bad will be ~515 instead of 115 because 100 is added to each parallel leaf task!\n\n// CORRECT:\nint good = 100 + nums.parallelStream().reduce(0, Integer::sum); // 115",
                "trap": "Believing `identity` is just an initial seed value like an accumulator variable in a sequential loop."
            },
            {
                "id": "q-stream-5",
                "difficulty": "Senior",
                "title": "peek() Elimination and Laziness Optimization in Java 9+",
                "question": "Why might `stream.filter(...).peek(System.out::println).count()` completely skip printing anything in Java 9 and newer versions?",
                "interviewerIntent": "Probes knowledge of Stream compiler/runtime optimization where terminal operations like count() can determine size from Spliterator characteristics without traversing elements.",
                "juniorTrap": "Relying on `peek()` for business logic or side effects instead of debugging.",
                "problem": "Logging operations inside `peek()` never fire in Java 9+ when chained to `count()` on a SIZED stream.",
                "innerWorking": "In Java 9+, `Stream.count()` checks if intermediate operations affect stream size. If the pipeline has no filtering/flatMapping and the source Spliterator reports `SIZED`, `count()` directly reads Spliterator size and discards traversal. `peek()` is explicitly specified as a non-interfering debug tool; JVM is free to optimize it away.",
                "seniorAnswer": "Java streams are lazy and pipeline-optimized. In Java 9+, if the terminal operation is `count()` and the pipeline can deduce count from the source's Sized Spliterator characteristics without processing elements (or when filtering is absent), the stream traversal is bypassed entirely. `peek()` should never be used for production side-effects; use `forEach` or explicit loops.",
                "codeSnippet": "List<String> list = List.of(\"a\", \"b\", \"c\");\n// Java 9+: prints nothing! count() returns 3 directly from list.size() via SIZED spliterator.\nlong c = list.stream().peek(System.out::println).count(); \n\n// If filter is added, traversal is required, so peek executes:\nlong c2 = list.stream().filter(s -> s.length() > 0).peek(System.out::println).count();",
                "trap": "Using `peek()` to mutate objects or trigger external calls in production code."
            },
            {
                "id": "q-stream-6",
                "difficulty": "Senior",
                "title": "toList() vs Collectors.toList() vs toUnmodifiableList()",
                "question": "What are the critical differences between `Stream.toList()` (Java 16+), `Collectors.toList()`, and `Collectors.toUnmodifiableList()` regarding mutability, null allowance, and performance?",
                "interviewerIntent": "Tests currency with modern Java evolution and exact collector semantics.",
                "juniorTrap": "Thinking `Stream.toList()` returns a standard mutable `ArrayList`.",
                "problem": "Calling `.add()` on `stream.toList()` results in UnsupportedOperationException in production, or NPE when collecting nulls with toUnmodifiableList.",
                "innerWorking": "`Collectors.toList()` returns an unspecified List implementation (typically mutable ArrayList) that permits nulls. `Collectors.toUnmodifiableList()` returns an immutable list that rejects nulls (throws NPE). `Stream.toList()` (Java 16) produces an unmodifiable List backed directly by the stream array, permits nulls, avoids collector overhead, and is significantly faster and more memory-efficient.",
                "seniorAnswer": "1. `Collectors.toList()`: Returns a mutable list (typically ArrayList), allows nulls, no immutability guarantees.\n2. `Collectors.toUnmodifiableList()`: Returns an unmodifiable list, strictly disallows nulls (throws NPE on null elements).\n3. `Stream.toList()` (Java 16+): Direct stream method, returns an unmodifiable list that allows nulls, with lower allocation overhead. Modifying it throws UnsupportedOperationException.",
                "codeSnippet": "List<String> mutable = Stream.of(\"a\", null).collect(Collectors.toList());\nmutable.add(\"c\"); // OK\n\n// Stream.of(\"a\", null).collect(Collectors.toUnmodifiableList()); // Throws NullPointerException!\n\nList<String> modern = Stream.of(\"a\", null).toList(); // Java 16+\n// modern.add(\"c\"); // Throws UnsupportedOperationException\nSystem.out.println(modern.get(1)); // Prints null (allowed)",
                "trap": "Assuming `Stream.toList()` disallows nulls like `List.of()` or `toUnmodifiableList()`."
            },
            {
                "id": "q-stream-7",
                "difficulty": "Senior",
                "title": "Collectors.toMap() Duplicate Key Trap and Null Values",
                "question": "What happens if `Collectors.toMap()` encounters duplicate keys without a merge function, or if the value mapper function returns null?",
                "interviewerIntent": "Checks real-world experience with common production crashes when aggregating maps via streams.",
                "juniorTrap": "Expecting `Collectors.toMap()` to overwrite existing keys by default (like `Map.put()`), and expecting it to allow null values.",
                "problem": "Aggregating users by role throws `IllegalStateException: Duplicate key` or throws `NullPointerException` when a field is null.",
                "innerWorking": "`Collectors.toMap(keyMapper, valueMapper)` uses `Map.merge()`. If a key collision occurs without a 3-argument merge function `(v1, v2) -> v2`, it throws `IllegalStateException`. Furthermore, `Map.merge()` spec forbids null values; if `valueMapper` yields null, it throws an uninformative `NullPointerException`.",
                "seniorAnswer": "By default, the 2-argument `Collectors.toMap` throws `IllegalStateException: Duplicate key` upon collision because no collision resolver is specified. Furthermore, it throws `NullPointerException` if any mapped value is null because it relies internally on `Map.merge()` which rejects nulls. Always supply a merge function `(oldVal, newVal) -> newVal` and handle potential nulls.",
                "codeSnippet": "class User { String role; String phone; /* getters */ }\nList<User> users = List.of(new User(\"ADMIN\", null), new User(\"ADMIN\", \"123\"));\n\n// Pitfall 1: Duplicate key -> IllegalStateException\n// Pitfall 2: Null value -> NullPointerException\n\n// Safe approach:\nMap<String, String> safeMap = users.stream().collect(HashMap::new,\n    (m, u) -> m.put(u.getRole(), u.getPhone()),\n    HashMap::putAll\n);",
                "trap": "Thinking `Collectors.toMap` behaves identically to a sequential `for` loop calling `map.put(k, v)`."
            },
            {
                "id": "q-stream-8",
                "difficulty": "Senior",
                "title": "Infinite Streams and Short-Circuiting Pitfalls",
                "question": "What happens if you execute `Stream.iterate(0, i -> i + 1).filter(i -> i % 2 == 0).limit(5)` vs `Stream.iterate(0, i -> i + 1).limit(5).filter(i -> i % 2 == 0)`? What if filter never matches?",
                "interviewerIntent": "Evaluates understanding of pipeline order, short-circuiting operations (limit), and infinite stream termination hazards.",
                "juniorTrap": "Believing pipeline order does not matter for limit() and filter().",
                "problem": "A developer writes `Stream.iterate(1, i -> i + 2).filter(i -> i % 2 == 0).limit(5)` and the application hangs forever at 100% CPU.",
                "innerWorking": "Intermediate operations execute per-element from left to right. In `filter -> limit(5)`, the stream evaluates infinite elements until 5 match the filter. If no elements ever match, the stream runs forever in an infinite loop. In `limit(5) -> filter`, exactly 5 items from source are taken and filtered, producing 0 to 5 elements and immediately terminating.",
                "seniorAnswer": "Pipeline order dictates termination. `filter().limit(5)` collects 5 elements that satisfy the filter; if the predicate never evaluates to true, the thread hangs indefinitely consuming CPU. In contrast, `limit(5).filter()` consumes only 5 items from the source and filters those, always terminating. When working with infinite streams, ensure short-circuiting conditions can be met.",
                "codeSnippet": "// HANGS FOREVER (Infinite loop):\n// Stream.iterate(1, i -> i + 2).filter(i -> i % 2 == 0).limit(5).forEach(System.out::println);\n\n// Terminates immediately (outputs nothing because 1,3,5,7,9 are odd):\nStream.iterate(1, i -> i + 2).limit(5).filter(i -> i % 2 == 0).forEach(System.out::println);",
                "trap": "Assuming `limit()` always protects against infinite streams regardless of where it is placed in the pipeline."
            },
            {
                "id": "q-stream-9",
                "difficulty": "Staff",
                "title": "Spliterator Characteristics and Parallel Performance Impacts",
                "question": "How do Spliterator characteristics (`ORDERED`, `SIZED`, `SUBSIZED`, `CONCURRENT`) impact the performance of `distinct()`, `limit()`, and parallel stream execution?",
                "interviewerIntent": "Tests master-level understanding of stream decomposition, ordering constraints, and buffer management in ForkJoinPool.",
                "juniorTrap": "Thinking parallel streams always speed up any operation including `limit()` or `findFirst()`.",
                "problem": "Running `parallelStream().limit(10)` on a large ordered collection performs significantly worse than a sequential stream.",
                "innerWorking": "If a stream is `ORDERED`, `limit(n)` in parallel must preserve encounter order. Worker threads processing later chunks must coordinate and buffer data, waiting for earlier chunks to complete. Removing `ORDERED` via `.unordered()` allows `limit(n)` to take any `n` elements as soon as they complete across threads, drastically reducing synchronization barriers.",
                "seniorAnswer": "Spliterator characteristics dictate pipeline execution strategies. In an `ORDERED` stream, parallel `limit()`, `skip()`, and `distinct()` incur severe synchronization overhead because threads must buffer elements and preserve encounter order across chunks. Calling `.unordered()` on a parallel stream removes this constraint, enabling lock-free local chunk truncation and dramatic speedups.",
                "codeSnippet": "List<Integer> largeList = IntStream.range(0, 10_000_000).boxed().toList();\n\n// Slow: Must coordinate across threads to keep encounter order\nList<Integer> slow = largeList.parallelStream().limit(100).toList();\n\n// Fast: Threads grab any 100 elements without order preservation\nList<Integer> fast = largeList.parallelStream().unordered().limit(100).toList();",
                "trap": "Overlooking the fact that `findFirst()` preserves order while `findAny()` allows immediate termination in parallel streams."
            },
            {
                "id": "q-stream-10",
                "difficulty": "Senior",
                "title": "Stream.concat() Deep Recursion and StackOverflowError",
                "question": "Why can repeatedly calling `Stream.concat()` in a recursive or iterative loop lead to a `StackOverflowError` during terminal evaluation?",
                "interviewerIntent": "Assesses knowledge of how Stream.concat creates nested stream wrappers and deep call stacks during Spliterator traversal.",
                "juniorTrap": "Using `Stream.concat(acc, stream)` inside a loop instead of flatMap.",
                "problem": "Concatenating 10,000 streams in a loop crashes with `java.lang.StackOverflowError` when `.collect()` is called.",
                "innerWorking": "`Stream.concat(a, b)` wraps the two streams in a `Streams.ConcatSpliterator`. When nested `N` times, traversing elements requires recursive calls through `N` layers of ConcatSpliterators. For large `N`, the method call depth exceeds JVM thread stack limits (`-Xss`), resulting in `StackOverflowError` during terminal execution.",
                "seniorAnswer": "`Stream.concat()` constructs a tree of ConcatSpliterators. When chained repeatedly in a loop, it creates a deeply nested call hierarchy. During terminal operation traversal, each `tryAdvance` call traverses down the nesting levels recursively, overflowing the thread call stack. To concatenate many streams, place them in a `List<Stream<T>>` and use `streamList.stream().flatMap(s -> s)`.",
                "codeSnippet": "// DANGEROUS: StackOverflowError for large N\nStream<Integer> stream = Stream.empty();\nfor (int i = 0; i < 5000; i++) {\n    stream = Stream.concat(stream, Stream.of(i));\n}\n// stream.count(); // StackOverflowError!\n\n// SAFE: flatMap over collection of streams\nList<Stream<Integer>> streams = new ArrayList<>();\nfor (int i = 0; i < 5000; i++) streams.add(Stream.of(i));\nlong count = streams.stream().flatMap(s -> s).count(); // Works cleanly",
                "trap": "Believing `Stream.concat()` flattens streams into a single flat array-like spliterator internally."
            }
        ]
    },

    # -------------------------------------------------------------------------
    # Topic 30: Optional best practices (orElse vs. orElseGet)
    # -------------------------------------------------------------------------
    {
        "topicId": "optional-best-practices",
        "topicTitle": "Optional best practices (orElse vs. orElseGet)",
        "category": "java8",
        "summary": "Eager vs lazy evaluation, serialization hazards, method parameter anti-patterns, primitive optionals, and avoiding Optional.get().",
        "questions": [
            {
                "id": "q-opt-1",
                "difficulty": "Mid",
                "title": "orElse() vs orElseGet(): Eager Evaluation Hazard",
                "question": "What is the critical behavioral difference between `optional.orElse(expensiveMethod())` and `optional.orElseGet(() -> expensiveMethod())` when the optional is non-empty?",
                "interviewerIntent": "Tests core understanding of method parameter evaluation (eager) vs functional supplier evaluation (lazy).",
                "juniorTrap": "Assuming `orElse()` won't call the method inside its parenthesis if the Optional already has a value.",
                "problem": "A database insert or REST call inside `orElse()` executes on every single request, even when the cached value is already present in the Optional.",
                "innerWorking": "In Java, method arguments are evaluated eagerly before invoking the method. `orElse(T other)` receives an already-evaluated object `other`. Thus `expensiveMethod()` runs every time regardless of presence. `orElseGet(Supplier<? extends T> supplier)` receives a lambda/functional interface that is invoked ONLY if `value == null`.",
                "seniorAnswer": "`orElse(val)` evaluates its argument eagerly at call time, even if the `Optional` is non-empty and the fallback value is discarded. `orElseGet(Supplier)` evaluates lazily, invoking the supplier only if the `Optional` is empty. Always use `orElseGet()` when computing default values involves method calls, object instantiation, database queries, or side-effects.",
                "codeSnippet": "Optional<String> opt = Optional.of(\"cached\");\n\n// Pitfall: computeDefault() executes even though opt has \"cached\"!\nString r1 = opt.orElse(computeDefault());\n\n// Correct: computeDefault() is NEVER called!\nString r2 = opt.orElseGet(() -> computeDefault());",
                "trap": "Using `orElse(new Object())` in high-throughput loops causing massive unnecessary heap garbage allocation."
            },
            {
                "id": "q-opt-2",
                "difficulty": "Senior",
                "title": "Optional as Method Parameter or Constructor Argument Anti-Pattern",
                "question": "Why is passing `Optional<T>` as a method parameter or constructor argument considered a bad practice and design smell in Java?",
                "interviewerIntent": "Checks software craftsmanship, API design principles, and awareness of Optional's intended design role.",
                "juniorTrap": "Believing `Optional` should be used everywhere a value can be null, including method parameters.",
                "problem": "A method signature `public void process(Optional<User> user)` forces callers to wrap values in `Optional.ofNullable()` or allows callers to pass `null` directly, causing NullPointerException on `user.isPresent()`.",
                "innerWorking": "Optional was designed strictly as a method return type to represent absence of result without returning null. Using it as a parameter forces callers to perform extra allocations `Optional.of(...)`, clutters call sites, and introduces a worse bug: the caller can pass `null` for the Optional parameter itself, forcing defensive `if (param == null || !param.isPresent())` checks.",
                "seniorAnswer": "Using `Optional` as a parameter is an anti-pattern: it bloats caller code with boxing (`Optional.ofNullable(x)`), creates unnecessary wrapper objects, and fails to prevent null bugs because callers can pass `null` instead of `Optional.empty()`. Instead, use method overloading or accept nullable arguments with clear `@Nullable` annotations.",
                "codeSnippet": "// BAD DESIGN:\npublic void updateUser(String id, Optional<String> email) {\n    if (email != null && email.isPresent()) { ... } // Absurd defensive code\n}\n\n// IDIOMATIC DESIGN:\npublic void updateUser(String id, String email) { // Overload or document @Nullable\n    if (email != null) { ... }\n}",
                "trap": "Believing `Optional` prevents `null` from being passed into a method argument."
            },
            {
                "id": "q-opt-3",
                "difficulty": "Senior",
                "title": "Optional Fields and Serialization / JPA Pitfalls",
                "question": "Why does declaring `Optional` as a field in a domain entity or DTO break Java Serialization and JPA / Hibernate mappings?",
                "interviewerIntent": "Tests knowledge of Java serialization mechanics, specification design choices, and ORM persistence frameworks.",
                "juniorTrap": "Declaring `private Optional<String> middleName;` inside an entity class.",
                "problem": "Serializing an object with an `Optional` field throws `java.io.NotSerializableException: java.util.Optional`.",
                "innerWorking": "The Java architects intentionally did NOT make `java.util.Optional` implement `java.io.Serializable`. Brian Goetz stated Optional was meant solely for method return values. When standard Java serialization or frameworks like Hazelcast serialize an entity with an Optional field, it fails with `NotSerializableException`. Furthermore, JPA specifications require persistent attributes to be basic types, embeddables, or relationships—not Optional.",
                "seniorAnswer": "`java.util.Optional` does not implement `Serializable`. Declaring it as an instance field causes `NotSerializableException` in RMI, caching, or session replication. Moreover, JPA providers cannot map `Optional` fields to database columns. The correct pattern is to keep the field as a standard nullable type (`private String middleName`) and expose an Optional getter (`public Optional<String> getMiddleName()`).",
                "codeSnippet": "// BAD:\npublic class Person implements Serializable {\n    private Optional<String> middleName; // NotSerializableException!\n}\n\n// CORRECT:\npublic class Person implements Serializable {\n    private String middleName; // Stored as nullable\n    \n    public Optional<String> getMiddleName() {\n        return Optional.ofNullable(middleName); // Returned as Optional\n    }\n}",
                "trap": "Marking the Optional field `transient` prevents NotSerializableException but loses the field data during serialization."
            },
            {
                "id": "q-opt-4",
                "difficulty": "Mid",
                "title": "Optional.of(null) vs Optional.ofNullable(null)",
                "question": "What happens when you pass `null` to `Optional.of(null)` versus `Optional.ofNullable(null)`?",
                "interviewerIntent": "Verifies familiarity with factory methods and fail-fast null checking in Optional.",
                "juniorTrap": "Using `Optional.of(variable)` when `variable` can be null, expecting it to return `Optional.empty()`.",
                "problem": "An unhandled NullPointerException crashes the service because `Optional.of(user.getPhone())` was called on a null phone.",
                "innerWorking": "`Optional.of(T value)` explicitly calls `Objects.requireNonNull(value)`. If value is null, it immediately throws `NullPointerException`. It is intended for values that MUST never be null (failing fast). `Optional.ofNullable(T value)` checks `value == null ? empty() : new Optional<>(value)`.",
                "seniorAnswer": "`Optional.of(value)` throws `NullPointerException` immediately if the value is null; it asserts that the argument is guaranteed to be present. `Optional.ofNullable(value)` safely handles null by returning `Optional.empty()`. Use `Optional.of` only when null represents a programming contract violation; use `Optional.ofNullable` when null is a valid possibility.",
                "codeSnippet": "String nullableString = null;\n// Optional.of(nullableString); // Immediate NullPointerException!\n\nOptional<String> safe = Optional.ofNullable(nullableString); // Returns Optional.empty()\nSystem.out.println(safe.isPresent()); // false",
                "trap": "Assuming `Optional.of()` wraps null cleanly without throwing."
            },
            {
                "id": "q-opt-5",
                "difficulty": "Mid",
                "title": "Replacing Imperative get() and isPresent() with Monadic Chains",
                "question": "Why is the pattern `if (opt.isPresent()) { opt.get(); }` considered a code smell? What methods should be used instead?",
                "interviewerIntent": "Tests idiomatic functional programming style versus treating Optional like an old-fashioned nullable check.",
                "juniorTrap": "Calling `opt.get()` directly without checking or using `isPresent() / get()` everywhere, forfeiting all benefits of Optional.",
                "problem": "Codebase is riddled with `if (opt.isPresent()) return opt.get(); else return null;` which defeats the purpose of the abstraction.",
                "innerWorking": "Using `isPresent()` followed by `get()` is merely an imperative `if (x != null)` check disguised with object overhead. Modern Java provides monadic operators: `map()`, `flatMap()`, `filter()`, `ifPresent()`, `ifPresentOrElse()` (Java 9), `or()` (Java 9), and `orElseThrow()`.",
                "seniorAnswer": "`if (opt.isPresent()) opt.get();` is an anti-pattern because it replicates imperative null checks with higher syntax noise and allocation cost. The idiomatic functional approach chains operations using `map`, `flatMap`, `filter`, and resolves terminal states via `orElseGet` or `orElseThrow`. In Java 10+, `opt.get()` is deprecated in spirit in favor of `opt.orElseThrow()`.",
                "codeSnippet": "Optional<User> opt = findUser();\n// CODE SMELL:\nif (opt.isPresent()) {\n    System.out.println(opt.get().getName().toUpperCase());\n}\n\n// IDIOMATIC FUNCTIONAL STYLE:\nopt.map(User::getName)\n   .map(String::toUpperCase)\n   .ifPresent(System.out::println);\n\n// With fallback:\nString name = opt.map(User::getName).orElse(\"UNKNOWN\");",
                "trap": "Using `opt.get()` without checking; it throws `NoSuchElementException`."
            },
            {
                "id": "q-opt-6",
                "difficulty": "Senior",
                "title": "flatMap() vs map() on Optionals Returning Optionals",
                "question": "What is the result of using `map()` vs `flatMap()` on an `Optional` when the transformation function itself returns an `Optional`?",
                "interviewerIntent": "Evaluates comprehension of monadic flatMap vs map type signatures.",
                "juniorTrap": "Using `map()` and ending up with an ugly `Optional<Optional<String>>` that requires multiple unpackings.",
                "problem": "Compiling `optUser.map(User::getAddress)` fails type matching because getAddress() returns `Optional<Address>`.",
                "innerWorking": "`Optional.map(Function<T, R>)` automatically wraps the result `R` in `Optional<R>`. If `R` is already `Optional<U>`, the return type becomes `Optional<Optional<U>>`. In contrast, `Optional.flatMap(Function<T, Optional<U>>)` does not wrap the result; it expects the function to return an `Optional` and flattens it directly.",
                "seniorAnswer": "When a mapping function returns an `Optional`, using `.map()` produces a nested `Optional<Optional<T>>`. Using `.flatMap()` flattens the hierarchy into a single `Optional<T>`. This mirrors `Stream.flatMap` and enables clean linear pipeline chaining without nested unboxing.",
                "codeSnippet": "class Order { Optional<Payment> getPayment() { return Optional.empty(); } }\nOptional<Order> order = Optional.of(new Order());\n\n// With map: results in Optional<Optional<Payment>>\nOptional<Optional<Payment>> nested = order.map(Order::getPayment);\n\n// With flatMap: cleanly flattens to Optional<Payment>\nOptional<Payment> payment = order.flatMap(Order::getPayment);",
                "trap": "Passing a function to `flatMap` that returns `null` instead of `Optional.empty()` throws NullPointerException."
            },
            {
                "id": "q-opt-7",
                "difficulty": "Senior",
                "title": "Identity-Sensitive Operations on Optional (Value-Based Class)",
                "question": "Why should you never synchronize on an `Optional` instance or rely on `==` identity comparison between `Optional` objects?",
                "interviewerIntent": "Checks understanding of 'Value-Based Classes' in modern Java and Project Valhalla forward compatibility.",
                "juniorTrap": "Using `synchronized (opt)` or `opt1 == opt2` expecting reference identity.",
                "problem": "Compiling code synchronizing on an Optional triggers compiler warnings or crashes in newer JDKs.",
                "innerWorking": "`Optional` is designated as a Value-Based Class in Java doc. Value-based classes do not have accessible constructors, instances are immutable, and their identity is considered irrelevant. Synchronizing on a value-based class triggers compiler warnings (`-Xlint:sync`) and in future Java versions (Project Valhalla) will throw `IdentityException`. Always compare with `.equals()`.",
                "seniorAnswer": "`Optional` is an immutable 'Value-Based Class'. It does not have guaranteed object identity: two `Optional.of(\"a\")` calls may or may not return the exact same instance due to runtime caching. Synchronizing on an Optional instance causes JVM warnings and will break in upcoming Valhalla releases. Always compare Optionals with `.equals()` and never use them as monitor locks.",
                "codeSnippet": "Optional<String> o1 = Optional.of(\"test\");\nOptional<String> o2 = Optional.of(\"test\");\n\nSystem.out.println(o1 == o2); // UNRELIABLE: may be true or false!\nSystem.out.println(o1.equals(o2)); // ALWAYS TRUE: checks value equality\n\n// DO NOT DO THIS:\n// synchronized (o1) { } // Warning in modern Java; forbidden in future JVMs",
                "trap": "Comparing `Optional.empty() == Optional.empty()` may return true due to singleton caching, leading developers to wrongly assume `==` works for all Optionals."
            },
            {
                "id": "q-opt-8",
                "difficulty": "Mid",
                "title": "Primitive Optionals: OptionalInt, OptionalLong, OptionalDouble",
                "question": "Why does `Optional<Integer>` introduce performance degradation in numeric computations, and how do specialized primitive optionals solve this?",
                "interviewerIntent": "Tests awareness of boxing/unboxing overhead and specialized primitive wrapper types in `java.util`.",
                "juniorTrap": "Using `Optional<Double>` or `Optional<Long>` in performance-critical calculations.",
                "problem": "High-frequency streaming pipeline spends 30% of its CPU time boxing integers into `Optional<Integer>`.",
                "innerWorking": "`Optional<Integer>` incurs double indirection and heap allocation: one object for the `Optional` wrapper and one object for the boxed `Integer` (16 bytes + 16 bytes = 32 bytes minimum). `OptionalInt` stores a primitive `int` and boolean `isPresent` directly in its object layout, completely eliminating boxing overhead and reducing GC pressure.",
                "seniorAnswer": "`Optional<Integer>` causes boxing/unboxing overhead and extra heap allocations. `OptionalInt`, `OptionalLong`, and `OptionalDouble` are dedicated primitive specializations that store the value as an unboxed primitive field. However, note that primitive optionals lack monadic methods like `map()` and `flatMap()`; they provide `getAsInt()`, `orElse()`, and `ifPresent()`.",
                "codeSnippet": "// Inefficient: Boxes int into Integer, then wraps in Optional\nOptional<Integer> boxed = Optional.of(42);\n\n// Efficient: No boxing overhead\nOptionalInt primitive = OptionalInt.of(42);\nint val = primitive.orElse(0);",
                "trap": "Primitive optionals use `getAsInt()` instead of `get()`, which still throws `NoSuchElementException` if empty."
            },
            {
                "id": "q-opt-9",
                "difficulty": "Senior",
                "title": "Optional.stream() in Java 9 for Clean Stream Filtering",
                "question": "How does `Optional.stream()` introduced in Java 9 simplify transforming a `Stream<Optional<T>>` into a `Stream<T>` without null checks or filtering?",
                "interviewerIntent": "Tests knowledge of Java 9 Stream-Optional integration and functional stream pipeline patterns.",
                "juniorTrap": "Filtering with `.filter(Optional::isPresent).map(Optional::get)` in Java 9+ codebases.",
                "problem": "Verbosity and potential warnings when mapping `Optional::get` across collections.",
                "innerWorking": "In Java 9, `Optional.stream()` was added: if value is present, it returns a single-element stream `Stream.of(val)`; if empty, it returns `Stream.empty()`. When flatMapped over a stream of Optionals, empty optionals seamlessly produce zero elements and non-empty produce one, cleanly unpacking the values.",
                "seniorAnswer": "Before Java 9, extracting values from `Stream<Optional<T>>` required `.filter(Optional::isPresent).map(Optional::get)`. In Java 9+, `Optional.stream()` converts an Optional into a 0-or-1 element Stream. By chaining `.flatMap(Optional::stream)`, empty Optionals are automatically discarded and present values are unpacked in a single idiomatic step.",
                "codeSnippet": "List<Optional<String>> list = List.of(Optional.of(\"a\"), Optional.empty(), Optional.of(\"b\"));\n\n// Pre-Java 9 (clunky):\nList<String> oldWay = list.stream()\n                          .filter(Optional::isPresent)\n                          .map(Optional::get)\n                          .toList();\n\n// Java 9+ (Idiomatic):\nList<String> modern = list.stream()\n                          .flatMap(Optional::stream)\n                          .toList(); // [\"a\", \"b\"]",
                "trap": "Thinking `Optional.stream()` returns an infinite stream."
            },
            {
                "id": "q-opt-10",
                "difficulty": "Senior",
                "title": "Returning null from a Method whose Return Type is Optional",
                "question": "What is wrong with writing `public Optional<User> findUser() { return null; }` and why is it considered the worst API violation?",
                "interviewerIntent": "Verifies understanding of API contracts and the fundamental guarantee of Optional.",
                "juniorTrap": "Returning `null` inside a method returning `Optional<T>` to represent an error or absence.",
                "problem": "The caller writes `findUser().ifPresent(...)` and crashes with a `NullPointerException`, completely defeating the purpose of using Optional.",
                "innerWorking": "The entire contract of returning `Optional` is to eliminate `NullPointerException` on return values. If an API returns `null` instead of `Optional.empty()`, callers who safely invoke `.isPresent()` or `.orElse()` will crash with NPE. It violates the core contract of the type.",
                "seniorAnswer": "A method returning `Optional` must NEVER return `null`. The sole purpose of `Optional` is to guarantee that the caller receives a non-null reference that safely encapsulates absence. Returning `null` directly breaks client expectations and causes `NullPointerException` at the call site. Always return `Optional.empty()`.",
                "codeSnippet": "// WORST PRACTICE:\npublic Optional<User> findUser(String id) {\n    if (id == null) return null; // VIOLATION! Breaks caller: findUser(null).isPresent()\n    return Optional.empty();\n}\n\n// PROPER PRACTICE:\npublic Optional<User> findUser(String id) {\n    if (id == null) return Optional.empty();\n    return Optional.of(new User(id));\n}",
                "trap": "Returning `null` from an Optional-returning method triggers static analysis errors in SonarQube, SpotBugs, and IntelliJ."
            }
        ]
    },

    # -------------------------------------------------------------------------
    # Topic 31: Functional interfaces (Predicate, Function, Supplier, Consumer)
    # -------------------------------------------------------------------------
    {
        "topicId": "functional-interfaces",
        "topicTitle": "Functional interfaces (Predicate, Function, Supplier, Consumer)",
        "category": "java8",
        "summary": "SAM contracts, checked exceptions in lambdas, variable capture & effectively final, composition, and primitive specializations.",
        "questions": [
            {
                "id": "q-func-1",
                "difficulty": "Senior",
                "title": "Checked Exceptions Inside Functional Interfaces",
                "question": "Why can't standard functional interfaces like `Consumer<T>` or `Function<T, R>` throw checked exceptions, and what are the standard architectural solutions?",
                "interviewerIntent": "Tests understanding of SAM method signatures, type erasure, and exception handling strategies in functional Java.",
                "juniorTrap": "Believing you can just throw `IOException` inside a `.map()` or `.forEach()` lambda without handling it.",
                "problem": "Writing `list.forEach(item -> Files.readString(item))` fails compilation with unhandled `IOException`.",
                "innerWorking": "`Consumer<T>.accept(T t)` does not declare `throws Exception`. Because lambdas must match the exact signature of the SAM, throwing a checked exception causes a compiler error. Solutions include: (1) try-catch inside lambda, (2) custom throwing functional interface with wrapper utility, or (3) SneakyThrows via generic type erasure.",
                "seniorAnswer": "Standard functional interfaces do not declare checked exceptions on their SAM method signatures, so throwing checked exceptions causes compilation failure. Senior architectures solve this by writing generic exception-wrapping functional interfaces (e.g., `ThrowingConsumer<T, E extends Exception>`) with a static wrapper method that catches checked exceptions and rethrows them as `RuntimeException` or via SneakyThrows.",
                "codeSnippet": "@FunctionalInterface\npublic interface ThrowingConsumer<T, E extends Exception> {\n    void accept(T t) throws E;\n    \n    static <T> Consumer<T> unchecked(ThrowingConsumer<T, Exception> f) {\n        return t -> {\n            try { f.accept(t); }\n            catch (Exception e) { throw new RuntimeException(e); }\n        };\n    }\n}\n// Usage:\npaths.forEach(ThrowingConsumer.unchecked(Files::delete));",
                "trap": "Using Lombok `@SneakyThrows` without team awareness can cause undeclared checked exceptions to escape undetected up the call stack."
            },
            {
                "id": "q-func-2",
                "difficulty": "Mid",
                "title": "@FunctionalInterface and java.lang.Object Methods",
                "question": "Can an interface have multiple abstract methods and still qualify as a `@FunctionalInterface` if those methods match `java.lang.Object` methods?",
                "interviewerIntent": "Tests exact specification rules regarding Single Abstract Method (SAM) type definition.",
                "juniorTrap": "Counting public abstract `equals(Object)` or `toString()` as the interface's single abstract method.",
                "problem": "An interface declares `void execute();` and `boolean equals(Object obj);` and a developer assumes it cannot be a `@FunctionalInterface`.",
                "innerWorking": "JLS §9.8 specifies that public abstract methods corresponding to public methods of `java.lang.Object` (such as `equals`, `hashCode`, `toString`) do NOT count toward the interface's abstract method count. Every class implementing the interface will automatically inherit an implementation from `java.lang.Object`.",
                "seniorAnswer": "Yes. Any public method in an interface that mirrors a public method in `java.lang.Object` (e.g., `boolean equals(Object)`) does not count toward the single abstract method count. For example, `java.util.Comparator` is a valid `@FunctionalInterface` even though it declares `int compare(T, T)` AND `boolean equals(Object)`.",
                "codeSnippet": "@FunctionalInterface\npublic interface MyAction {\n    void execute(); // The single abstract method\n    \n    boolean equals(Object obj); // Overrides Object method; does NOT count against SAM!\n    String toString();          // Also does NOT count\n    \n    default void log() { System.out.println(\"log\"); } // Default methods don't count\n}",
                "trap": "Declaring `protected Object clone()` in an interface causes compilation failure because `clone()` is not public in `java.lang.Object`."
            },
            {
                "id": "q-func-3",
                "difficulty": "Senior",
                "title": "Effectively Final Variable Capture and Mutability Tricks",
                "question": "Why must local variables referenced in lambdas be final or effectively final? Why does using a 1-element array `int[] count = {0}` or `AtomicInteger` introduce race conditions?",
                "interviewerIntent": "Probes knowledge of stack frame lifecycles, closure capture by value, and concurrency hazards of mutable captures.",
                "juniorTrap": "Using `int[] holder = new int[1]` to bypass effectively final compiler checks in parallel streams.",
                "problem": "Mutating `holder[0]++` inside a parallel stream lambda produces wrong count results due to missing atomicity and visibility.",
                "innerWorking": "Local variables live on the thread stack and vanish when the method exits. Lambdas can outlive the creating method (e.g. async execution). Java copies local primitive/reference values into the lambda object. If the variable were mutable, stack and lambda copies could diverge. By enforcing effectively final, Java ensures consistency. Mutating an array element bypasses compiler checks but causes race conditions in multithreaded pipelines.",
                "seniorAnswer": "Local variables must be effectively final because Java captures them by value (copying the value to the heap-allocated closure), not by reference. If the local variable could change, the stack copy and lambda copy would become desynchronized. Bypassing this via `int[] holder = {0}` allows mutation in sequential code, but in parallel streams or multithreaded contexts it causes severe race conditions and lost updates. Use `AtomicInteger` or proper reductions instead.",
                "codeSnippet": "int count = 0;\n// list.forEach(x -> count++); // COMPILER ERROR: Local variable must be effectively final\n\n// ANTI-PATTERN in multithreading:\nint[] unsafe = new int[1];\nIntStream.range(0, 1000).parallel().forEach(i -> unsafe[0]++); // Lost updates! unsafe[0] < 1000\n\n// THREAD-SAFE ALTERNATIVE:\nAtomicInteger safe = new AtomicInteger();\nIntStream.range(0, 1000).parallel().forEach(i -> safe.incrementAndGet()); // 1000 guaranteed",
                "trap": "Thinking `AtomicInteger` solves all race conditions when multiple dependent operations are executed without synchronization."
            },
            {
                "id": "q-func-4",
                "difficulty": "Mid",
                "title": "Predicate Composition: and(), or(), negate() Short-Circuiting",
                "question": "How do `Predicate.and()` and `Predicate.or()` handle short-circuit evaluation, and what happens if the first predicate throws an exception?",
                "interviewerIntent": "Verifies understanding of functional composition and short-circuit evaluation semantics.",
                "juniorTrap": "Assuming both predicates are always evaluated regardless of the first predicate's result.",
                "problem": "Writing `isNotNull.and(isValid)` where `isValid` calls a method on the object; if `isNotNull` is false, does `isValid` throw NPE?",
                "innerWorking": "`Predicate.and(other)` is implemented as `(t) -> test(t) && other.test(t)`. Because Java's logical `&&` operator short-circuits, if `test(t)` returns false, `other.test(t)` is NEVER called. Similarly, `or(other)` uses `||` and short-circuits if the first is true. If the first predicate throws an exception, evaluation stops immediately.",
                "seniorAnswer": "`Predicate.and()` and `Predicate.or()` implement standard Java short-circuit logical operators (`&&` and `||`). In `p1.and(p2)`, if `p1` returns false, `p2` is never evaluated. This guarantees safety for null checks: `Objects::nonNull.and(obj -> obj.length() > 0)` will never throw `NullPointerException` on a null object.",
                "codeSnippet": "Predicate<String> nonNull = Objects::nonNull;\nPredicate<String> nonEmpty = s -> s.length() > 0;\nPredicate<String> isValid = nonNull.and(nonEmpty);\n\nSystem.out.println(isValid.test(null)); // Prints false; nonEmpty is never invoked (no NPE!)\nSystem.out.println(isValid.test(\"\"));   // Prints false\nSystem.out.println(isValid.test(\"ok\")); // Prints true",
                "trap": "Manually combining predicates with bitwise `&` instead of `and()` which forces evaluation of both sides and causes NPE."
            },
            {
                "id": "q-func-5",
                "difficulty": "Senior",
                "title": "Function.identity() vs Lambda `x -> x`",
                "question": "Is `Function.identity()` identical to `x -> x`? What are the differences in type inference, bytecode generation, and object allocation?",
                "interviewerIntent": "Probes deep knowledge of JVM compiler optimizations, lambda meta-factories, and generic type inference.",
                "juniorTrap": "Assuming `Function.identity()` and `x -> x` are completely interchangeable in every compilation context.",
                "problem": "Passing `x -> x` to a method causes ambiguous compiler error, whereas `Function.identity()` compiles cleanly (or vice versa).",
                "innerWorking": "`Function.identity()` returns a pre-instantiated singleton `(t) -> t` instance typed to `Function<Object, Object>`, cast safely via generics. `x -> x` generates an `invokedynamic` call site targeting `LambdaMetafactory`. In complex generic method calls, `Function.identity()` provides explicit target typing whereas `x -> x` may fail type inference.",
                "seniorAnswer": "Functionally they return the input argument unchanged, but there are differences: (1) `Function.identity()` is a static method returning a constant function, avoiding repeated lambda metafactory linkage, (2) `Function.identity()` explicitly specifies the `Function` type, which helps javac resolve generic types when type inference with `x -> x` fails, (3) `x -> x` can be inferred as any functional interface (e.g. `UnaryOperator`), while `Function.identity()` is strictly a `Function`.",
                "codeSnippet": "// Both work here:\nMap<String, String> map1 = list.stream().collect(Collectors.toMap(Function.identity(), s -> s));\nMap<String, String> map2 = list.stream().collect(Collectors.toMap(x -> x, s -> s));\n\n// Type inference distinction:\nUnaryOperator<String> u1 = x -> x; // Compiles\n// UnaryOperator<String> u2 = Function.identity(); // COMPILER ERROR: Function cannot be cast to UnaryOperator",
                "trap": "Assuming `Function.identity()` can be assigned to `UnaryOperator<T>` without an explicit cast."
            },
            {
                "id": "q-func-6",
                "difficulty": "Senior",
                "title": "Method Overloading Ambiguity with Functional Interfaces",
                "question": "Why does calling `process(x -> System.out.println(x))` cause a compiler error when overloaded methods `process(Consumer<String>)` and `process(Consumer<Integer>)` exist?",
                "interviewerIntent": "Tests compiler resolution of lambda expressions against overloaded functional interface methods.",
                "juniorTrap": "Expecting the compiler to guess the parameter type of the lambda expression.",
                "problem": "Compiling `executor.submit(() -> doWork())` fails with 'reference to submit is ambiguous' when Callable and Runnable overloads exist.",
                "innerWorking": "Java compiler uses a multi-phase overload resolution process (JLS §15.12.2). An untyped lambda parameter `x -> ...` cannot provide type information to disambiguate between `Consumer<String>` and `Consumer<Integer>`. Similarly, if `doWork()` returns a value, both `Runnable` (return ignored) and `Callable<V>` could match, creating ambiguity.",
                "seniorAnswer": "Lambda expressions without explicit parameter types are poly expressions whose target type must be inferred from the method declaration. When two overloaded methods accept functional interfaces with identical arity (e.g., `Consumer<String>` vs `Consumer<Integer>`), the compiler cannot determine the parameter type from `x -> ...` and aborts with an ambiguous method error. Disambiguation requires explicit lambda casting or typed parameters `(String x) -> ...`.",
                "codeSnippet": "public void execute(Consumer<String> c) { }\npublic void execute(Consumer<Integer> c) { }\n\n// execute(x -> System.out.println(x)); // COMPILER ERROR: ambiguous\n\n// SOLUTION 1: Explicit parameter type\nexecute((String x) -> System.out.println(x));\n\n// SOLUTION 2: Cast\nexecute((Consumer<String>) System.out::println);",
                "trap": "Overloading methods that take `Callable<T>` and `Runnable` frequently leads to confusing call-site compilation failures."
            },
            {
                "id": "q-func-7",
                "difficulty": "Mid",
                "title": "Consumer andThen() Exception Propagation Trap",
                "question": "If you chain consumers via `c1.andThen(c2).accept(obj)`, what happens to `c2` if `c1` throws a RuntimeException?",
                "interviewerIntent": "Evaluates understanding of sequential execution and exception short-circuiting in functional composition.",
                "juniorTrap": "Believing `andThen` runs both consumers independently like a multicast broadcast.",
                "problem": "Auditing consumer in `c1.andThen(auditConsumer)` never executes when business validation inside `c1` fails.",
                "innerWorking": "`Consumer.andThen(after)` is implemented as: `(T t) -> { accept(t); after.accept(t); }`. If `accept(t)` throws an exception, the current thread unrolls immediately and `after.accept(t)` is never executed.",
                "seniorAnswer": "`andThen()` executes sequentially on the calling thread. If the first consumer throws an exception, the pipeline terminates immediately and the chained second consumer is NOT invoked. It does not provide fault isolation or guaranteed delivery. If both must run, wrap each invocation in independent try-catch blocks.",
                "codeSnippet": "Consumer<String> c1 = s -> { throw new RuntimeException(\"Failed!\"); };\nConsumer<String> c2 = s -> System.out.println(\"Audited: \" + s);\n\nConsumer<String> chained = c1.andThen(c2);\ntry {\n    chained.accept(\"data\");\n} catch (RuntimeException e) {\n    // c2 was NEVER called! Audit entry was skipped.\n}",
                "trap": "Using `andThen()` for critical side-effects (like telemetry or auditing) that must run even on error."
            },
            {
                "id": "q-func-8",
                "difficulty": "Senior",
                "title": "Primitive Functional Interfaces and Megamorphic Call Sites",
                "question": "Why does using `java.util.function.IntPredicate` instead of `Predicate<Integer>` prevent JIT de-optimization and boxing in high-throughput loops?",
                "interviewerIntent": "Probes deep knowledge of JVM escape analysis, auto-boxing object allocation, and JIT inlining mechanics.",
                "juniorTrap": "Believing modern JVMs always optimize away `Integer` auto-boxing via escape analysis in hot loops.",
                "problem": "A filtering loop processing 100 million integers consumes 4 GB of memory allocations and triggers continuous young-gen GC.",
                "innerWorking": "`Predicate<Integer>.test(Integer)` requires auto-boxing `int` to `Integer` on every call. In tight loops, the allocation rate overwhelms young-gen Eden. Furthermore, virtual method dispatch on generic interfaces can become megamorphic, preventing JIT inlining. `IntPredicate.test(int)` works strictly on CPU registers and primitive stack values with zero heap allocation.",
                "seniorAnswer": "`Predicate<Integer>` forces `int` to be boxed into a heap-allocated `Integer` object on every invocation, causing massive GC pressure and memory bus saturation in high-throughput paths. `IntPredicate` uses primitive `int` directly on the CPU stack, completely bypassing heap allocation and enabling the JIT compiler to inline the lambda into raw machine code.",
                "codeSnippet": "// Inefficient: 10,000,000 Integer allocations\nPredicate<Integer> boxedPred = x -> x % 2 == 0;\nfor (int i = 0; i < 10_000_000; i++) boxedPred.test(i);\n\n// Zero allocation: Pure primitive execution\nIntPredicate primitivePred = x -> x % 2 == 0;\nfor (int i = 0; i < 10_000_000; i++) primitivePred.test(i);",
                "trap": "Assuming Escape Analysis can scalar-replace every boxed `Integer` across method boundaries."
            },
            {
                "id": "q-func-9",
                "difficulty": "Staff",
                "title": "Serialization of Lambdas and Synthetic Methods",
                "question": "How does Java serialize a lambda expression, what is the syntax for creating a serializable lambda, and why is lambda serialization considered a security and fragility hazard?",
                "interviewerIntent": "Tests knowledge of advanced bytecode mechanisms, `writeReplace()`, `SerializedLambda`, and architectural hazards in distributed systems.",
                "juniorTrap": "Thinking lambdas cannot be serialized under any circumstances.",
                "problem": "Submitting a lambda to Apache Spark or Hazelcast throws `NotSerializableException` unless typed to a serializable intersection.",
                "innerWorking": "A lambda can be marked serializable using intersection types: `(Runnable & Serializable) () -> doWork()`. When compiled, javac generates a synthetic method in the enclosing class and generates `writeReplace()` that emits a `java.lang.invoke.SerializedLambda`. Deserialization verifies the capturing class and method name. If the enclosing class is refactored or method names change, deserialization breaks immediately. Furthermore, deserializing untrusted SerializedLambda instances is a major remote code execution attack vector.",
                "seniorAnswer": "Lambdas can be serialized using intersection types (`(Callable<String> & Serializable) () -> \"ok\"`). Javac generates a synthetic method in the enclosing class and serializes it as `SerializedLambda`. However, it is an anti-pattern in production because: (1) it ties the serialized representation to compiler-generated synthetic method names, making code refactoring break deserialization, and (2) deserializing `SerializedLambda` opens severe RCE vulnerabilities. Use explicit named classes for distributed compute engines.",
                "codeSnippet": "Runnable r = (Runnable & Serializable) () -> System.out.println(\"Serializable\");\n\nByteArrayOutputStream baos = new ByteArrayOutputStream();\ntry (ObjectOutputStream oos = new ObjectOutputStream(baos)) {\n    oos.writeObject(r); // Serializes successfully as SerializedLambda\n}",
                "trap": "Capturing an instance method inside a serializable lambda secretly serializes the entire enclosing object (`this`)!"
            },
            {
                "id": "q-func-10",
                "difficulty": "Mid",
                "title": "Supplier as a Deferred Execution Wrapper (Lazy Evaluation)",
                "question": "How does `Supplier<T>` enable lazy evaluation in logging frameworks like SLF4J / Log4j2 to prevent unnecessary string concatenation?",
                "interviewerIntent": "Checks practical application of functional programming for system performance optimization.",
                "juniorTrap": "Relying on eager string concatenation in debug logging statements.",
                "problem": "High-throughput server wastes 20% CPU constructing complex debug JSON strings when debug logging is disabled in production.",
                "innerWorking": "In `logger.debug(\"Data: \" + expensiveJson(data))`, the JSON serialization runs eagerly before `logger.debug` is entered. Using `Supplier`: `logger.debug(\"Data: {}\", () -> expensiveJson(data))`. The logger checks `isDebugEnabled()`; if false, the `Supplier.get()` is never called, avoiding all CPU cycles.",
                "seniorAnswer": "`Supplier<T>` models deferred, on-demand computation. In logging and assertions, passing a `Supplier` allows the framework to evaluate the expression only if the log level is active. If the level is disabled, the supplier is never invoked, eliminating expensive string formatting, object conversions, or database lookups.",
                "codeSnippet": "// Wasteful: runs expensiveBuild() even when DEBUG is off\nlogger.debug(\"State: \" + expensiveBuildReport(order));\n\n// Efficient with Supplier: Evaluated lazily only if DEBUG is enabled\nlogger.debug(\"State: {}\", (Supplier<String>) () -> expensiveBuildReport(order));",
                "trap": "Wrapping lightweight literals in `Supplier` adds lambda allocation overhead without any performance gain."
            }
        ]
    },

    # -------------------------------------------------------------------------
    # Topic 32: Method references
    # -------------------------------------------------------------------------
    {
        "topicId": "method-references",
        "topicTitle": "Method references",
        "category": "java8",
        "summary": "Bound vs unbound method references, constructor references, ambiguity resolution, invokedynamic, and LambdaMetafactory.",
        "questions": [
            {
                "id": "q-mref-1",
                "difficulty": "Senior",
                "title": "Bound vs Unbound Method References Parameter Shift",
                "question": "What is the precise syntactic and semantic difference between an unbound instance method reference (`String::toUpperCase`) and a bound instance method reference (`str::toUpperCase`) regarding parameter count?",
                "interviewerIntent": "Tests deep understanding of receiver parameter semantics and arity matching in method references.",
                "juniorTrap": "Confusing bound and unbound method references and wondering why one accepts a parameter while the other takes none.",
                "problem": "Passing `String::compareTo` matches a `BiFunction<String, String, Integer>` while `\"abc\"::compareTo` matches a `Function<String, Integer>`.",
                "innerWorking": "In an unbound method reference (`Type::instanceMethod`), the receiver object is supplied as the FIRST argument to the functional interface: `(x) -> x.instanceMethod()`. Hence `String::toUpperCase` maps to `Function<String, String>`. In a bound method reference (`instance::instanceMethod`), the receiver is already captured at reference creation time, so the functional interface needs only the remaining parameters: `() -> instance.instanceMethod()`.",
                "seniorAnswer": "In an unbound method reference (`ClassName::method`), the target instance is not fixed; the functional interface must supply the receiver object as its first argument (e.g. `Function<String, String>` for `String::toUpperCase`). In a bound method reference (`instanceRef::method`), the target instance is already captured; the functional interface takes zero arguments (e.g. `Supplier<String>` for `myString::toUpperCase`). Arity shifts by one parameter.",
                "codeSnippet": "// Unbound: Target instance is passed as parameter -> Function<String, String>\nFunction<String, String> unbound = String::toUpperCase;\nSystem.out.println(unbound.apply(\"hello\")); // \"HELLO\"\n\n// Bound: Target instance is captured -> Supplier<String>\nString target = \"hello\";\nSupplier<String> bound = target::toUpperCase;\nSystem.out.println(bound.get()); // \"HELLO\"",
                "trap": "Thinking unbound method references can be invoked without passing an instance of the class."
            },
            {
                "id": "q-mref-2",
                "difficulty": "Senior",
                "title": "Eager Evaluation Timing of the Bound Receiver Instance",
                "question": "When is the receiver expression evaluated in a bound method reference: when the method reference is created, or when the functional interface method is invoked?",
                "interviewerIntent": "Tests exact evaluation timing rules in JLS §15.13.3 regarding bound instance method references.",
                "juniorTrap": "Assuming the receiver expression is evaluated lazily when the method reference is actually called.",
                "problem": "A developer writes `Supplier<String> s = getObject()::toString;` and expects `getObject()` to be called whenever `s.get()` is invoked.",
                "innerWorking": "According to JLS §15.13.3, for an expression of the form `Expression::Identifier`, the Expression is evaluated immediately when the method reference expression is evaluated at runtime (eagerly). If `Expression` returns null, `NullPointerException` is thrown at creation time, NOT when the functional interface method is eventually invoked.",
                "seniorAnswer": "The receiver expression in a bound method reference is evaluated eagerly at the time the reference expression is created, NOT lazily when the functional method is invoked. If the expression evaluates to null, an NPE is thrown immediately at the point of assignment. Furthermore, the captured reference is stored in the closure; subsequent changes to the variable do not change the captured target.",
                "codeSnippet": "class Service {\n    String call() { return \"done\"; }\n}\nService service = null;\n// Throws NullPointerException IMMEDIATELY at line below, NOT when supplier.get() is called!\n// Supplier<String> supplier = service::call;\n\nService s = new Service();\nSupplier<String> sup = s::call;\ns = null; // Reassigning local variable does NOT affect sup\nSystem.out.println(sup.get()); // Prints \"done\" cleanly",
                "trap": "Expecting a bound method reference to pick up a newly assigned object if the original variable is reassigned."
            },
            {
                "id": "q-mref-3",
                "difficulty": "Mid",
                "title": "Constructor References with Arrays: String[]::new",
                "question": "How does `String[]::new` work as a method reference, and what functional interface does it satisfy?",
                "interviewerIntent": "Checks familiarity with array constructor method references and Stream collection.",
                "juniorTrap": "Trying to use `String[]::new` with a no-arg Supplier.",
                "problem": "Compiling `Supplier<String[]> s = String[]::new;` fails to compile.",
                "innerWorking": "Array creation requires an integer size dimension. Therefore, `Type[]::new` maps to `IntFunction<Type[]>`, which takes an `int` size and returns an array of that size. This is specifically used in `Stream.toArray(String[]::new)`.",
                "seniorAnswer": "`String[]::new` satisfies `IntFunction<String[]>`. It accepts an integer representing the array length and returns a `new String[size]`. This is the standard idiom in Java Streams to collect stream elements into a strongly typed array via `stream.toArray(String[]::new)`.",
                "codeSnippet": "IntFunction<String[]> arrayCreator = String[]::new;\nString[] array = arrayCreator.apply(5); // Creates new String[5]\n\n// Practical use in Stream:\nList<String> list = List.of(\"a\", \"b\", \"c\");\nString[] result = list.stream().toArray(String[]::new);",
                "trap": "Passing `String[]::new` to `Supplier` which fails compilation because arrays require an array length argument."
            },
            {
                "id": "q-mref-4",
                "difficulty": "Senior",
                "title": "Overload Resolution Ambiguity with System.out::println",
                "question": "Why does passing `System.out::println` sometimes fail to compile with 'ambiguous method reference' when assigned to generic custom functional interfaces?",
                "interviewerIntent": "Assesses understanding of compiler method reference resolution when the target class has dozens of overloaded methods.",
                "juniorTrap": "Thinking `System.out::println` is a single unique method.",
                "problem": "Assigning `System.out::println` to an interface that can accept multiple primitive or reference types fails compilation.",
                "innerWorking": "`PrintStream` has 10+ overloaded variants of `println()` (`println(int)`, `println(char[])`, `println(Object)`, `println(String)`). When assigning to a functional interface whose parameter type is an unbounded type variable or where multiple overloads match, javac cannot resolve which overload is intended and fails with an ambiguity error.",
                "seniorAnswer": "`PrintStream.println` contains over ten overloaded signatures. If the target functional interface method has a type variable that is unbounded or could match multiple overloads (e.g. `char[]` vs `Object`), the compiler cannot determine which method to bind. Explicit casting or using a lambda `x -> System.out.println(x)` resolves the ambiguity.",
                "codeSnippet": "interface CustomPrinter<T> {\n    void print(T val);\n}\n\n// Compiles if T is known:\nCustomPrinter<String> p1 = System.out::println;\n\n// If target type is generic or ambiguous in method call:\n// doPrint(System.out::println); // May fail if doPrint has overloads\n// Fix:\ndoPrint((String s) -> System.out.println(s));",
                "trap": "Passing `char[]` into `System.out.println` invokes `println(char[])` which prints characters, whereas `Object` prints `[C@hashcode`."
            },
            {
                "id": "q-mref-5",
                "difficulty": "Staff",
                "title": "Under the Hood: LambdaMetafactory vs Anonymous Classes",
                "question": "How are lambdas and method references compiled in Java bytecode? Why does the JVM use `invokedynamic` rather than generating separate `.class` files?",
                "interviewerIntent": "Tests expert understanding of JSR 292, invokedynamic, LambdaMetafactory, classloader footprint, and startup performance.",
                "juniorTrap": "Believing lambdas are purely syntactic sugar for anonymous inner classes (`new Runnable() { ... }`).",
                "problem": "An engineer worries that adding 5,000 lambdas will generate 5,000 `.class` files and bloat the JAR and metaspace.",
                "innerWorking": "Unlike anonymous classes which generate a `Enclosing$1.class` file at compile time, lambdas emit an `invokedynamic` (indy) instruction with bootstrap method `LambdaMetafactory.metafactory()`. At first runtime execution, indy dynamically generates an internal hidden class (or uses method handles) via bytecode spin. This defers linkage, reduces JAR size, avoids disk I/O at startup, and allows the JVM to change implementation strategies without recompilation.",
                "seniorAnswer": "Lambdas and method references do not generate anonymous inner class files at compile time. Instead, javac emits an `invokedynamic` bytecode instruction that points to `LambdaMetafactory`. At runtime, the JVM dynamically generates and links a lightweight class or call site. This reduces JAR size, avoids disk I/O, prevents Metaspace class pollution, and allows future JVM optimizations without code recompilation.",
                "codeSnippet": "// Bytecode inspection (javap -c -v):\n// 0: invokedynamic #2, 0 // InvokeDynamic #0:apply:()Ljava/util/function/Function;\n// 5: astore_1\n// ...\n// BootstrapMethods:\n// 0: #18 REF_invokeStatic java/lang/invoke/LambdaMetafactory.metafactory:...",
                "trap": "Believing `this` inside a lambda refers to the lambda instance; `this` inside a lambda refers to the enclosing class instance!"
            },
            {
                "id": "q-mref-6",
                "difficulty": "Senior",
                "title": "Performance: Stateless vs Capturing Method References",
                "question": "Does a method reference like `String::length` allocate an object on the heap each time it is encountered in a loop?",
                "interviewerIntent": "Probes knowledge of singleton caching by LambdaMetafactory for non-capturing lambdas/method references.",
                "juniorTrap": "Assuming every execution of a method reference creates a new heap object.",
                "problem": "A developer rewrites method references to static fields out of fear of GC allocation in a tight loop.",
                "innerWorking": "Stateless method references (static methods or unbound instance methods like `String::length`) do not capture any external state. The `LambdaMetafactory` generates an implementation where the instance is cached as a singleton constant after the first execution. Bound method references (e.g., `myInstance::doWork`), however, capture `myInstance` and must allocate a new wrapper object on each execution.",
                "seniorAnswer": "Non-capturing method references (static method references or unbound instance method references like `String::length`) do NOT allocate objects repeatedly; the JVM caches the generated functional instance in a static field on the indy call site. However, bound method references (`instance::method`) capture the receiver instance and allocate a new object on each evaluation unless optimized by escape analysis.",
                "codeSnippet": "for (int i = 0; i < 1_000_000; i++) {\n    // Non-capturing (Stateless): 0 ongoing allocations (cached singleton!)\n    Function<String, Integer> f1 = String::length;\n    \n    // Capturing (Bound): Allocates 1,000,000 closure objects on the heap!\n    String prefix = \"prefix_\" + i;\n    Supplier<String> f2 = prefix::toUpperCase;\n}",
                "trap": "Thinking all method references are zero-allocation; bound references capture state and allocate."
            },
            {
                "id": "q-mref-7",
                "difficulty": "Mid",
                "title": "Superclass Method References: super::method",
                "question": "When can you use `super::methodName` and what are its scoping and execution restrictions?",
                "interviewerIntent": "Tests understanding of superclass method binding and lexical scoping in lambdas.",
                "juniorTrap": "Attempting to call `super::method` from outside the subclass or from a static context.",
                "problem": "Attempting to reference a grandparent method or using `super::` in a static method fails compilation.",
                "innerWorking": "`super::method` is only valid inside an instance context of a subclass. It emits an `invokespecial` instruction rather than `invokevirtual`, bypassing the subclass's own overridden implementation and directly calling the parent method. It cannot be used from static contexts or to skip up to a grandparent class.",
                "seniorAnswer": "`super::methodName` is valid only within an instance method or constructor of a subclass. It binds to the superclass implementation using `invokespecial` bytecode dispatch, bypassing any override in the current class. It cannot be used in static methods, nor can it bypass the immediate parent class to access a grandparent.",
                "codeSnippet": "class Parent {\n    void greet() { System.out.println(\"Parent\"); }\n}\nclass Child extends Parent {\n    @Override\n    void greet() { System.out.println(\"Child\"); }\n    \n    void test() {\n        Runnable r1 = this::greet;  // Prints \"Child\"\n        Runnable r2 = super::greet; // Prints \"Parent\" (invokespecial)\n        r1.run();\n        r2.run();\n    }\n}",
                "trap": "Trying to write `Parent.super::greet` inside a class that extends `Parent` (only allowed for interface default methods: `InterfaceName.super.method()`)."
            },
            {
                "id": "q-mref-8",
                "difficulty": "Senior",
                "title": "Method References to Interface Static Methods",
                "question": "Can you create a method reference to a static method defined on an interface? How does the syntax differ from class static methods?",
                "interviewerIntent": "Verifies knowledge of Java 8 interface static methods and resolution rules.",
                "juniorTrap": "Trying to reference an interface static method via an implementing class name.",
                "problem": "Compiling `MyClass::staticMethod` where `staticMethod` is defined in `MyInterface` implemented by `MyClass` fails compilation.",
                "innerWorking": "Static methods on interfaces in Java 8 are NOT inherited by implementing classes or sub-interfaces. Therefore, a method reference to an interface static method MUST use the interface name directly: `InterfaceName::method`. Calling it via `ImplementingClass::method` is illegal.",
                "seniorAnswer": "Yes, method references to interface static methods are fully supported using `InterfaceName::staticMethod`. However, because interface static methods are not inherited by implementing classes, you cannot invoke or reference them through an implementing class name (e.g., `SubClass::interfaceStaticMethod` will fail to compile).",
                "codeSnippet": "interface MathOp {\n    static int square(int x) { return x * x; }\n}\nclass Calculator implements MathOp {}\n\n// CORRECT:\nIntUnaryOperator op1 = MathOp::square;\n\n// COMPILER ERROR: Static method not inherited from interface!\n// IntUnaryOperator op2 = Calculator::square;",
                "trap": "Assuming interface static methods participate in class inheritance hierarchies."
            },
            {
                "id": "q-mref-9",
                "difficulty": "Senior",
                "title": "Dynamic Polymorphic Dispatch in Method References",
                "question": "If you write `Function<Animal, String> f = Animal::speak;` and pass a `Dog` instance to `f.apply(dog)`, which method is called: `Animal.speak()` or `Dog.speak()`?",
                "interviewerIntent": "Tests whether the candidate understands that method references preserve virtual method dispatch (polymorphism).",
                "juniorTrap": "Assuming the method reference statically binds to `Animal.speak` at compile time.",
                "problem": "A developer believes method references act like C function pointers and bypass runtime overriding.",
                "innerWorking": "Unbound method references `ClassName::instanceMethod` emit an `invokevirtual` (or `invokeinterface`) instruction targeting the runtime receiver object. Therefore, normal Java virtual dispatch applies. When `dog` is passed, the JVM looks up the method in `Dog`'s vtable at runtime.",
                "seniorAnswer": "It executes `Dog.speak()`. Method references maintain full runtime polymorphism. An unbound method reference `Animal::speak` uses `invokevirtual` dispatch on whatever instance is passed as the argument, executing the overridden method on the actual runtime subclass.",
                "codeSnippet": "class Animal { String speak() { return \"Generic\"; } }\nclass Dog extends Animal { @Override String speak() { return \"Bark\"; } }\n\nFunction<Animal, String> speaker = Animal::speak;\nSystem.out.println(speaker.apply(new Dog())); // Outputs \"Bark\"! (Virtual dispatch)",
                "trap": "Only private, static, or final methods use static binding; all other instance method references use dynamic dispatch."
            },
            {
                "id": "q-mref-10",
                "difficulty": "Senior",
                "title": "Generic Method References Type Arguments Syntax",
                "question": "What is the correct syntax for specifying explicit type arguments when creating a method reference to a generic method?",
                "interviewerIntent": "Tests knowledge of rare and advanced Java syntax for explicit generic type witnesses in method references.",
                "juniorTrap": "Placing type arguments at the end of the method reference: `ClassName::method<String>`.",
                "problem": "Type inference fails on a generic method reference and the developer doesn't know where to place `<String>`.",
                "innerWorking": "According to JLS §15.13, type arguments in a method reference appear AFTER the double colon `::` and BEFORE the method name: `ClassName::<TypeArg>methodName` or `instance::<TypeArg>methodName`.",
                "seniorAnswer": "Explicit generic type arguments in a method reference are placed immediately after the `::` operator and before the method name: `MyClass::<String>genericMethod`. Placing them before `::` or after the method name results in a syntax error.",
                "codeSnippet": "class Utilities {\n    public static <T> List<T> singleton(T item) { return List.of(item); }\n}\n\n// Inferred type argument:\nFunction<String, List<String>> f1 = Utilities::singleton;\n\n// Explicit type witness syntax:\nFunction<String, List<String>> f2 = Utilities::<String>singleton;",
                "trap": "Writing `Utilities<String>::singleton` or `Utilities::singleton<String>` both cause compilation syntax errors."
            }
        ]
    },

    # -------------------------------------------------------------------------
    # Topic 33: CompletableFuture exception handling
    # -------------------------------------------------------------------------
    {
        "topicId": "cf-exception-handling",
        "topicTitle": "CompletableFuture exception handling",
        "category": "java8",
        "summary": "exceptionally vs handle vs whenComplete, CompletionException unwrapping, exception swallowing, allOf failure semantics, and async recovery.",
        "questions": [
            {
                "id": "q-cf-1",
                "difficulty": "Senior",
                "title": "handle() vs exceptionally() vs whenComplete()",
                "question": "What are the exact functional differences between `handle()`, `exceptionally()`, and `whenComplete()` in CompletableFuture exception processing?",
                "interviewerIntent": "Tests mastery of asynchronous exception handling, stage transformations, and recovery semantics.",
                "juniorTrap": "Using `whenComplete()` to recover from an exception, not realizing it cannot alter the returned result.",
                "problem": "Returning a fallback value inside `whenComplete()` is ignored, and downstream stages still receive the exception.",
                "innerWorking": "1. `exceptionally(fn)`: Triggered ONLY on exception; returns a fallback value, converting an exceptional stage back to normal completion.\n2. `handle(biFn)`: Always executed (success or error). Receives `(result, throwable)` and transforms the output to a new value.\n3. `whenComplete(biConsumer)`: A consumer side-effect (e.g. logging/cleanup). Receives `(result, throwable)` but DOES NOT alter the result. If the input stage failed, `whenComplete` propagates that same failure downstream.",
                "seniorAnswer": "`exceptionally()` only runs on failure and provides a fallback value to recover the pipeline. `handle()` executes on both success and failure, transforming the result into a new value. `whenComplete()` is a pure consumer for side-effects (like logging or metric recording); it cannot recover from exceptions or alter the downstream pipeline result.",
                "codeSnippet": "CompletableFuture<String> failed = CompletableFuture.failedFuture(new RuntimeException(\"Boom\"));\n\n// exceptionally: Recovers to fallback value\nfailed.exceptionally(ex -> \"Recovered\").thenAccept(System.out::println); // Prints \"Recovered\"\n\n// handle: Receives (val, ex), returns transformed result\nfailed.handle((val, ex) -> ex != null ? \"Handled: \" + ex.getMessage() : val);\n\n// whenComplete: Can log, but CANNOT change outcome; downstream STILL fails!\nfailed.whenComplete((val, ex) -> System.err.println(\"Logged: \" + ex));",
                "trap": "Throwing an exception inside `whenComplete` suppresses the original exception and replaces it with the new one."
            },
            {
                "id": "q-cf-2",
                "difficulty": "Mid",
                "title": "CompletionException vs ExecutionException: get() vs join()",
                "question": "Why does `CompletableFuture.get()` throw checked `ExecutionException` while `CompletableFuture.join()` throws unchecked `CompletionException`?",
                "interviewerIntent": "Tests understanding of Future vs CompletableFuture API design, checked exception friction, and lambda ergonomics.",
                "juniorTrap": "Using `.get()` inside lambdas or streams and having to write bulky try-catch blocks.",
                "problem": "Writing `list.stream().map(CompletableFuture::get)` requires catching checked InterruptedException and ExecutionException.",
                "innerWorking": "`get()` originates from Java 5 `Future<V>` and declares `throws InterruptedException, ExecutionException`. When CompletableFuture was added in Java 8, `join()` was introduced to fit functional stream pipelines: it throws unchecked `CompletionException` which wraps the root cause. However, both wrap the underlying exception.",
                "seniorAnswer": "`get()` is the legacy method from Java 5 `Future`; it throws checked `InterruptedException` and `ExecutionException`, requiring explicit try-catch blocks. `join()` was introduced in Java 8 for functional and stream pipelines; it wraps the root cause in an unchecked `CompletionException`, allowing clean use in lambdas. To extract the real business exception, always inspect `e.getCause()`.",
                "codeSnippet": "CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {\n    throw new IllegalStateException(\"Database down\");\n});\n\n// join(): Unchecked CompletionException\ntry {\n    cf.join();\n} catch (CompletionException ce) {\n    System.out.println(ce.getCause().getClass()); // IllegalStateException\n}\n\n// get(): Checked ExecutionException\ntry {\n    cf.get();\n} catch (InterruptedException | ExecutionException ee) {\n    System.out.println(ee.getCause().getClass()); // IllegalStateException\n}",
                "trap": "Calling `join()` without catching `CompletionException` crashes background threads silently."
            },
            {
                "id": "q-cf-3",
                "difficulty": "Senior",
                "title": "Silent Exception Swallowing in Fire-and-Forget Pipelines",
                "question": "What happens to an exception thrown inside `CompletableFuture.supplyAsync()` if no downstream code ever invokes `join()`, `get()`, or an exception handler?",
                "interviewerIntent": "Assesses knowledge of asynchronous execution failure visibility and production debugging pitfalls.",
                "juniorTrap": "Assuming unhandled exceptions in CompletableFuture will print to `System.err` or trigger `UncaughtExceptionHandler`.",
                "problem": "Async background task silently fails; no logs appear, no alerts fire, and the issue goes unnoticed in production.",
                "innerWorking": "CompletableFuture catches all Throwables thrown inside async supplier/runnable tasks and stores the exception in its internal result field (`result = new AltResult(ex)`). If no client calls `join()`, `get()`, `handle()`, or `exceptionally()`, the exception is NEVER printed or propagated. It is silently garbage collected.",
                "seniorAnswer": "The exception is completely swallowed and silenced. CompletableFuture encapsulates exceptions as state inside the future instance. It does not print to stderr and does not notify the thread's `UncaughtExceptionHandler`. In fire-and-forget async operations, you must always append `.whenComplete((res, ex) -> { if (ex != null) log.error(ex); })` to ensure visibility.",
                "codeSnippet": "// DANGEROUS: Exception is silently swallowed!\nCompletableFuture.runAsync(() -> {\n    throw new RuntimeException(\"Fatal background error!\"); // DISAPPEARS INTO VOID\n});\n\n// SAFE: Always attach logger\nCompletableFuture.runAsync(() -> {\n    throw new RuntimeException(\"Fatal background error!\");\n}).whenComplete((res, ex) -> {\n    if (ex != null) logger.error(\"Async task failed\", ex);\n});",
                "trap": "Relying on standard thread dump analysis to find swallowed CompletableFuture exceptions."
            },
            {
                "id": "q-cf-4",
                "difficulty": "Senior",
                "title": "CompletableFuture.allOf() Exception Hiding and Fast-Fail Absence",
                "question": "Why does `CompletableFuture.allOf(f1, f2, f3).join()` NOT fail fast when one future fails, and why does it hide exceptions from other failed futures?",
                "interviewerIntent": "Probes deep understanding of `allOf` synchronization barrier semantics and error aggregation in parallel workflows.",
                "juniorTrap": "Expecting `allOf` to terminate immediately as soon as any child future throws an exception.",
                "problem": "One child future fails in 100ms, but `allOf().join()` blocks for 30 seconds waiting for other slow futures, and reports only one arbitrary failure.",
                "innerWorking": "`allOf()` creates a barrier that completes ONLY when ALL constituent futures complete (either normally or exceptionally). It does not fail-fast. Furthermore, if multiple futures fail, `allOf().join()` only throws a `CompletionException` wrapping ONE of the failures (typically the first one registered internally), hiding the rest.",
                "seniorAnswer": "`CompletableFuture.allOf()` is a completion barrier, not a fail-fast supervisor. It waits for every future to finish regardless of failures. If multiple futures throw exceptions, `allOf.join()` only surfaces one arbitrary exception, swallowing the others. To handle errors properly, inspect each future individually or use a custom aggregator that collects all exceptions.",
                "codeSnippet": "CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);\ntry {\n    all.join();\n} catch (CompletionException e) {\n    // Inspect ALL futures to find every failure:\n    List<Throwable> errors = Stream.of(f1, f2, f3)\n        .filter(CompletableFuture::isCompletedExceptionally)\n        .map(f -> {\n            try { f.join(); return null; }\n            catch (CompletionException ce) { return ce.getCause(); }\n        })\n        .toList();\n    logger.error(\"Failures: \" + errors);\n}",
                "trap": "Assuming `allOf` returns a future containing the results of all sub-futures (it returns `CompletableFuture<Void>`)."
            },
            {
                "id": "q-cf-5",
                "difficulty": "Senior",
                "title": "cancel(true) Does NOT Interrupt Running Async Threads",
                "question": "Why does calling `completableFuture.cancel(true)` fail to stop a currently running thread in ForkJoinPool, unlike `Future.cancel(true)`?",
                "interviewerIntent": "Tests understanding of CompletableFuture cancellation mechanics and thread interruption limitations.",
                "juniorTrap": "Assuming `cancel(true)` interrupts the executing worker thread.",
                "problem": "An expensive computation continues running to completion consuming CPU even after `cf.cancel(true)` was called.",
                "innerWorking": "In standard `FutureTask`, `cancel(true)` calls `thread.interrupt()`. In `CompletableFuture`, `cancel(mayInterruptIfRunning)` simply completes the future with a `CancellationException`. The boolean parameter `mayInterruptIfRunning` is completely IGNORED by CompletableFuture's implementation. The thread running the supplier continues unaffected.",
                "seniorAnswer": "In `CompletableFuture`, `cancel(true)` does NOT interrupt the underlying worker thread. The boolean flag `mayInterruptIfRunning` has no effect in CompletableFuture's implementation. Calling `cancel(true)` merely sets the future's state to exceptionally completed with a `CancellationException`. Downstream dependent stages will not run, but the currently executing thread continues until finished.",
                "codeSnippet": "CompletableFuture<Void> cf = CompletableFuture.runAsync(() -> {\n    while (true) {\n        // Running thread is NEVER interrupted by cf.cancel(true)!\n        if (Thread.currentThread().isInterrupted()) break; // Never triggered by CF!\n    }\n});\ncf.cancel(true); // Sets state to cancelled, but worker thread keeps spinning!",
                "trap": "Believing `cancel(true)` frees up CPU resources immediately."
            },
            {
                "id": "q-cf-6",
                "difficulty": "Senior",
                "title": "Downstream Stage Skipping on Exceptional Completion",
                "question": "In a chain `cf.thenApply(s1).thenApply(s2).thenAccept(s3)`, if `s1` throws an exception, what happens to `s2` and `s3`? How do you recover mid-stream?",
                "interviewerIntent": "Verifies understanding of error short-circuiting in asynchronous call graphs.",
                "juniorTrap": "Thinking downstream `thenApply` stages execute with a `null` argument on upstream failure.",
                "problem": "An exception in stage 1 bypasses critical downstream cleanup stages.",
                "innerWorking": "Any standard stage (`thenApply`, `thenCompose`, `thenAccept`) requires successful normal completion of its predecessor. If a predecessor completes exceptionally, all subsequent standard stages are skipped immediately and transition to exceptional completion with the same exception.",
                "seniorAnswer": "If any intermediate stage throws an exception, all subsequent standard stages (`thenApply`, `thenAccept`, `thenCompose`) are bypassed and complete exceptionally. Downstream stages are only executed if an intervening recovery stage (`exceptionally()` or `handle()`) catches the exception and returns a valid replacement value.",
                "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"Stage 1 failed\");\n    return \"step1\";\n})\n.thenApply(s -> s + \"_step2\") // SKIPPED\n.thenApply(s -> s + \"_step3\") // SKIPPED\n.exceptionally(ex -> \"recovered_at_step3\") // INTERCEPTS AND RECOVERS\n.thenAccept(System.out::println); // EXECUTES with \"recovered_at_step3\"",
                "trap": "Placing `exceptionally()` at the very end of a chain when you needed recovery earlier in the pipeline."
            },
            {
                "id": "q-cf-7",
                "difficulty": "Senior",
                "title": "exceptionallyAsync() in Java 12+ for Heavy Recovery Work",
                "question": "Why was `exceptionallyAsync()` introduced in Java 12, and what thread execution problem with standard `exceptionally()` does it solve?",
                "interviewerIntent": "Evaluates knowledge of thread affinity during callback execution and Java 12 CompletableFuture enhancements.",
                "juniorTrap": "Running slow network fallback calls inside standard `exceptionally()` on the caller thread or carrier thread.",
                "problem": "Fallback logic inside `exceptionally()` blocks the main UI thread or common pool carrier thread.",
                "innerWorking": "Standard `exceptionally(fn)` runs on whatever thread completed the future exceptionally. If the future was already failed, it runs on the calling thread; if completed by an I/O thread, it runs on that I/O thread. If recovery involves another database or network call, it blocks that thread. `exceptionallyAsync(fn, executor)` guarantees recovery runs asynchronously on a dedicated executor.",
                "seniorAnswer": "`exceptionally()` runs synchronously on the thread that triggered the exception (or the calling thread if already failed). If fallback recovery requires blocking I/O (e.g. calling a secondary cache or backup API), it can block critical threads like ForkJoinPool carrier threads. `exceptionallyAsync()` (Java 12+) executes the recovery function on a specified `Executor` pool, ensuring thread isolation.",
                "codeSnippet": "ExecutorService fallbackPool = Executors.newFixedThreadPool(4);\n\nCompletableFuture<String> cf = CompletableFuture.supplyAsync(this::primaryService)\n    // In Java 12+: runs backup call on fallbackPool, not on primary service thread\n    .exceptionallyAsync(ex -> backupService(), fallbackPool);",
                "trap": "Using standard `exceptionally()` with blocking fallback logic in reactive systems causes thread pool starvation."
            },
            {
                "id": "q-cf-8",
                "difficulty": "Staff",
                "title": "Memory Leaks in Uncompleted CompletableFuture Dependency Graphs",
                "question": "How can an uncompleted `CompletableFuture` retain strong references and cause massive memory leaks in long-running applications?",
                "interviewerIntent": "Tests comprehension of CompletableFuture internal doubly linked dependency stack (`Completion` nodes) and GC retention paths.",
                "juniorTrap": "Assuming garbage collection cleans up uncompleted futures and their attached callbacks.",
                "problem": "Application experiences gradual heap exhaustion because futures registered in a central registry are never completed.",
                "innerWorking": "Each downstream stage (`thenApply`, `thenAccept`) creates a `Completion` node pushed onto the upstream future's internal stack (`result` or `stack`). If the root future never completes, it retains strong references to all `Completion` nodes, which retain references to their lambdas, which capture their enclosing objects. If the root future is static or long-lived, the entire DAG is held in memory forever.",
                "seniorAnswer": "CompletableFuture maintains a linked list of `Completion` subscriber objects. Each stage holds strong references to its callback lambdas and captured variables. If a root future never completes (e.g. waiting on a dropped socket), the entire chained graph of futures and their captured closures remain strongly reachable, preventing garbage collection. Always enforce timeouts via `orTimeout()` to ensure terminal completion.",
                "codeSnippet": "// LEAK HAZARD:\nCompletableFuture<String> orphan = new CompletableFuture<>(); // Never completed\nfor (int i = 0; i < 1_000_000; i++) {\n    byte[] bigData = new byte[1024 * 1024];\n    orphan.thenAccept(res -> System.out.println(bigData.length)); // Retains bigData forever!\n}\n\n// FIX: Ensure terminal timeout\norphan.orTimeout(5, TimeUnit.SECONDS); // Java 9+ guarantees completion (exceptionally)",
                "trap": "Registering callbacks on a shared static CompletableFuture without ever detaching or completing them."
            },
            {
                "id": "q-cf-9",
                "difficulty": "Senior",
                "title": "orTimeout() vs completeOnTimeout() in Java 9",
                "question": "What is the difference between `orTimeout()` and `completeOnTimeout()` introduced in Java 9 regarding exception handling?",
                "interviewerIntent": "Tests familiarity with modern asynchronous timeout mechanisms in Java 9+.",
                "juniorTrap": "Writing custom ScheduledExecutorService timer tasks to manually cancel futures on timeout.",
                "problem": "Handling timeouts pre-Java 9 required separate watchdog threads and manual completion.",
                "innerWorking": "`orTimeout(timeout, unit)` completes the future exceptionally with a `TimeoutException` if not completed before the duration. `completeOnTimeout(defaultValue, timeout, unit)` recovers gracefully by completing the future normally with `defaultValue` if the timeout expires, without throwing an exception.",
                "seniorAnswer": "Both methods were added in Java 9 using an internal system daemon scheduler. `orTimeout()` fails the future with a `TimeoutException`, triggering downstream `exceptionally()` handlers. In contrast, `completeOnTimeout(defaultVal)` gracefully completes the future normally with the supplied default value, allowing the pipeline to proceed without exception handling.",
                "codeSnippet": "// orTimeout: Fails exceptionally on timeout\nCompletableFuture<String> f1 = CompletableFuture.supplyAsync(this::slowTask)\n    .orTimeout(2, TimeUnit.SECONDS)\n    .exceptionally(ex -> \"Timeout Fallback\");\n\n// completeOnTimeout: Gracefully completes with fallback value (no exception thrown)\nCompletableFuture<String> f2 = CompletableFuture.supplyAsync(this::slowTask)\n    .completeOnTimeout(\"Default Value\", 2, TimeUnit.SECONDS);",
                "trap": "Assuming `orTimeout()` interrupts the underlying worker thread; like `cancel()`, it does not stop thread execution."
            },
            {
                "id": "q-cf-10",
                "difficulty": "Senior",
                "title": "Executor Rejection Handling (RejectedExecutionException)",
                "question": "What happens if the custom `Executor` passed to `CompletableFuture.supplyAsync(task, executor)` rejects the task due to a full queue? Does the returned future complete exceptionally?",
                "interviewerIntent": "Probes real-world edge cases where ThreadPoolExecutor saturation throws before a future can even be created.",
                "juniorTrap": "Expecting the returned `CompletableFuture` to receive the `RejectedExecutionException` via `.exceptionally()`.",
                "problem": "A developer puts `.exceptionally()` on `supplyAsync` but the application crashes with an unhandled `RejectedExecutionException` on the main thread.",
                "innerWorking": "`CompletableFuture.supplyAsync(supplier, executor)` immediately calls `executor.execute(...)`. If the executor's rejection policy throws `RejectedExecutionException` (e.g. `AbortPolicy`), the exception is thrown synchronously on the calling thread. The `CompletableFuture` object is NEVER returned, so downstream `.exceptionally()` is never even registered.",
                "seniorAnswer": "If the `Executor` rejects the task, `executor.execute()` throws `RejectedExecutionException` synchronously on the calling thread. The method `CompletableFuture.supplyAsync()` never returns, meaning downstream `.exceptionally()` handlers are never constructed or executed. You must wrap the `supplyAsync` invocation itself in a synchronous try-catch block to handle pool saturation.",
                "codeSnippet": "ExecutorService pool = new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(1));\npool.submit(() -> Thread.sleep(1000)); // Saturate pool\npool.submit(() -> Thread.sleep(1000)); // Saturate queue\n\n// SYNCHRONOUS CRASH: Throws RejectedExecutionException right here!\n// CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> \"ok\", pool)\n//     .exceptionally(ex -> \"fallback\"); // NEVER REACHED!\n\n// SAFE PATTERN:\nCompletableFuture<String> safeFuture;\ntry {\n    safeFuture = CompletableFuture.supplyAsync(() -> \"ok\", pool);\n} catch (RejectedExecutionException e) {\n    safeFuture = CompletableFuture.completedFuture(\"Fallback due to pool saturation\");\n}",
                "trap": "Believing asynchronous futures capture synchronous invocation errors during task submission."
            }
        ]
    },

    # -------------------------------------------------------------------------
    # Topic 34: Records, sealed classes, pattern matching (modern Java)
    # -------------------------------------------------------------------------
    {
        "topicId": "modern-java",
        "topicTitle": "Records, sealed classes, pattern matching (modern Java)",
        "category": "java8",
        "summary": "Record shallow immutability, compact constructors, serialization security bypass, sealed hierarchy exhaustiveness, and pattern matching switch.",
        "questions": [
            {
                "id": "q-mod-1",
                "difficulty": "Mid",
                "title": "Records: Shallow Immutability and Mutable Component Traps",
                "question": "Why does declaring a Java `record` NOT make its state deeply immutable? What happens if a record has a `List` component?",
                "interviewerIntent": "Tests understanding of shallow vs deep immutability in Java records.",
                "juniorTrap": "Assuming records make all their fields and nested structures completely immutable.",
                "problem": "A developer passes an `ArrayList` to a record and is shocked when external code modifies the list and alters the record's internal state.",
                "innerWorking": "A record generates `final` fields for each component. However, `final` on an object reference only prevents reassigning the reference itself; it does NOT prevent mutating the object being referenced. If a record holds an `ArrayList`, elements can still be added or removed.",
                "seniorAnswer": "Java records provide shallow immutability: their fields are final and have no setters. However, if a component is a mutable object (like `List`, `Date`, or an array), callers can mutate that object's contents. To achieve true immutability, use the compact constructor to make defensive unmodifiable copies (e.g. `List.copyOf(items)`).",
                "codeSnippet": "public record ShoppingCart(String user, List<String> items) {\n    // COMPACT CONSTRUCTOR for defensive copying:\n    public ShoppingCart {\n        items = List.copyOf(items); // Replaces with unmodifiable list\n    }\n}\nList<String> list = new ArrayList<>(List.of(\"Apple\"));\nShoppingCart cart = new ShoppingCart(\"Alice\", list);\nlist.add(\"Banana\"); // Does NOT affect cart because of List.copyOf\n// cart.items().add(\"Orange\"); // Throws UnsupportedOperationException",
                "trap": "Using standard canonical constructor without defensive copy allows external code to mutate record contents."
            },
            {
                "id": "q-mod-2",
                "difficulty": "Senior",
                "title": "Record Serialization: Why readObject() is Bypassed",
                "question": "How does serialization and deserialization of Java Records fundamentally differ from standard classes, and how does it prevent historic deserialization vulnerabilities?",
                "interviewerIntent": "Probes deep knowledge of JVM serialization architecture and security enhancements introduced with records.",
                "juniorTrap": "Trying to customize record deserialization by declaring `readObject()` or `readResolve()`.",
                "problem": "Security vulnerabilities in standard Java serialization allow attackers to instantiate classes in invalid states bypassing constructors.",
                "innerWorking": "For normal classes, deserialization uses magical byte-level reflection (`sun.reflect.ReflectionFactory`) that bypasses all constructors, allowing corrupted/malicious state. For Records, the serialization spec dictates that deserialization MUST invoke the canonical constructor, passing the stream values as arguments. Custom `readObject()` methods are completely ignored. All constructor invariants and validations are guaranteed to execute.",
                "seniorAnswer": "Unlike standard classes where deserialization bypasses constructors entirely, records MUST be deserialized by invoking the canonical constructor using values extracted from the stream. Any custom `readObject()`, `readObjectNoData()`, or `writeObject()` methods are strictly ignored. This guarantees that invariants and validations placed in the record constructor can never be bypassed during deserialization, closing major security vectors.",
                "codeSnippet": "public record Range(int start, int end) implements Serializable {\n    public Range {\n        if (start > end) throw new IllegalArgumentException(\"start > end\");\n    }\n    // If a malicious byte stream with start=10, end=2 is deserialized,\n    // it invokes this canonical constructor and THROWS IllegalArgumentException!\n    // Normal classes would deserialize the corrupted state bypassing constructor!\n}",
                "trap": "Attempting to declare a custom `private void readObject(ObjectInputStream in)` in a record will be completely ignored by the JVM."
            },
            {
                "id": "q-mod-3",
                "difficulty": "Mid",
                "title": "Compact Constructors in Records: Syntax and Field Assignment",
                "question": "What is unique about the syntax of a 'compact constructor' in a record, and why is assigning to `this.field` prohibited inside it?",
                "interviewerIntent": "Tests precise knowledge of record constructor syntax and compiler transformations.",
                "juniorTrap": "Writing `this.x = x;` inside a compact constructor.",
                "problem": "Compiling a compact constructor with `this.name = name;` throws a compilation error.",
                "innerWorking": "A compact constructor omits the parameter list entirely: `public MyRecord { ... }`. Inside the body, you validate or normalize the parameters (which are implicitly in scope). At the end of the block, the compiler automatically inserts `this.x = x; this.y = y;` for all components. Assigning to `this.field` directly is a compiler error because initialization hasn't occurred yet.",
                "seniorAnswer": "A compact constructor has no parameter list (e.g. `public User { ... }`). The constructor parameters are implicitly available. Inside the compact constructor, you only perform validation and normalization on the bare parameter names. The compiler automatically inserts field assignments (`this.field = field`) at the very end of the block. Attempting to write `this.field = ...` inside a compact constructor causes a compile error.",
                "codeSnippet": "public record User(String name, int age) {\n    // Compact constructor:\n    public User {\n        if (age < 0) throw new IllegalArgumentException(\"Age cannot be negative\");\n        name = name.trim(); // Normalizes parameter\n        // this.name = name; // COMPILER ERROR! Disallowed in compact constructor.\n        // Compiler automatically generates: this.name = name; this.age = age;\n    }\n}",
                "trap": "Confusing a compact constructor with a canonical constructor with an explicit parameter list."
            },
            {
                "id": "q-mod-4",
                "difficulty": "Senior",
                "title": "Sealed Classes Exhaustiveness in Pattern Matching Switch",
                "question": "How do sealed classes and interfaces enable the Java compiler to guarantee exhaustiveness in `switch` expressions without requiring a `default` branch?",
                "interviewerIntent": "Evaluates understanding of algebraic data types (ADTs), sealed hierarchies, and compiler exhaustiveness checks.",
                "juniorTrap": "Always adding a `default` branch in a switch over a sealed hierarchy, masking future unhandled subclasses.",
                "problem": "Adding a new permitted subclass to a sealed interface silently fails to be handled if a `default` branch exists.",
                "innerWorking": "A sealed class/interface explicitly lists all permitted subclasses via `permits`. In Java 21 `switch` expressions, if all permitted subclasses are covered by `case` labels, the compiler knows no other instances can exist. Therefore, no `default` branch is needed. If a developer adds a new permitted subclass later, the compiler immediately flags an error in every switch that omits it.",
                "seniorAnswer": "Sealed hierarchies define a closed algebraic sum type. Because the compiler knows every possible concrete subtype at compile time, a `switch` expression covering all permitted subclasses is exhaustive without a `default` clause. Omitting `default` is a best practice: if a new subclass is added in the future, the compiler fails fast with a compile-time error wherever the switch is missing that new case.",
                "codeSnippet": "public sealed interface Shape permits Circle, Square {}\npublic record Circle(double radius) implements Shape {}\npublic record Square(double side) implements Shape {}\n\n// Exhaustive switch expression - NO DEFAULT NEEDED:\ndouble area = switch (shape) {\n    case Circle c -> Math.PI * c.radius() * c.radius();\n    case Square s -> s.side() * s.side();\n    // If a new 'Triangle' is added to Shape permits, this fails compilation!\n};",
                "trap": "Adding a `default: throw new IllegalArgumentException();` defeats compile-time exhaustiveness checking."
            },
            {
                "id": "q-mod-5",
                "difficulty": "Senior",
                "title": "Sealed Hierarchy Subclass Modifiers: final, sealed, and non-sealed",
                "question": "What are the three mandatory modifiers every permitted subclass of a sealed class must use, and what does `non-sealed` mean?",
                "interviewerIntent": "Tests knowledge of sealed hierarchy rules and how extensibility is controlled.",
                "juniorTrap": "Declaring a permitted subclass without any special modifier like a normal class.",
                "problem": "Compiling `public class Dog extends Animal` where `Animal` is sealed throws 'class must be declared final, sealed, or non-sealed'.",
                "innerWorking": "JLS requires every permitted direct subclass of a sealed class to explicitly declare how it continues or closes the hierarchy. The three options are: (1) `final`: Prevents any further subclassing, (2) `sealed`: Continues the restricted hierarchy with its own permits list, (3) `non-sealed`: Opens the class back up for unrestricted subclassing by any class.",
                "seniorAnswer": "Every permitted subclass must explicitly declare one of three modifiers: `final` (cannot be extended further), `sealed` (extends the restricted sealed hierarchy), or `non-sealed` (explicitly re-opens the hierarchy for unrestricted extension). Normal unadorned class declarations are prohibited for permitted subclasses.",
                "codeSnippet": "public sealed class Vehicle permits Car, Truck, ExperimentalVehicle {}\n\npublic final class Car extends Vehicle {} // Closed\n\npublic sealed class Truck extends Vehicle permits LightTruck {} // Continues sealing\npublic final class LightTruck extends Truck {}\n\npublic non-sealed class ExperimentalVehicle extends Vehicle {} // Re-opened for anyone\nclass CustomDrone extends ExperimentalVehicle {} // Legal!",
                "trap": "Assuming `non-sealed` breaks the parent's sealing; the parent still knows that any instance is either Car, Truck, or ExperimentalVehicle."
            },
            {
                "id": "q-mod-6",
                "difficulty": "Mid",
                "title": "Pattern Matching instanceof: Flow Scoping and Negation",
                "question": "How does 'flow scoping' work with pattern matching for `instanceof`? Why is `if (!(obj instanceof String s))` valid when followed by `return;` but invalid otherwise?",
                "interviewerIntent": "Tests comprehension of Java's flow scoping rules for type pattern variables.",
                "juniorTrap": "Assuming pattern variables are only in scope inside the `if` body block.",
                "problem": "A developer is confused why `s` is accessible outside the `if` statement when an early return is used.",
                "innerWorking": "Pattern variables use flow scoping: the variable is in scope only where the compiler can deduce that the pattern has matched with certainty. In `if (!(obj instanceof String s)) return;`, if execution proceeds past the `if`, the condition MUST have been false, meaning `obj` IS a `String`. Hence `s` remains in scope for the rest of the method block.",
                "seniorAnswer": "Pattern matching variables use 'flow scoping', meaning the variable is in scope strictly on code paths where the pattern is guaranteed to have matched. With negation `if (!(obj instanceof String s)) return;`, the compiler knows that if the method did not return, `obj` is definitely a `String`. Therefore, `s` is safely in scope for all subsequent lines in that method.",
                "codeSnippet": "public void printLength(Object obj) {\n    if (!(obj instanceof String s)) {\n        return; // Exits if not String\n    }\n    // 's' is IN SCOPE here because flow analysis proves obj is a String!\n    System.out.println(\"Length: \" + s.length());\n}\n\n// INVALID:\n// if (!(obj instanceof String s)) { System.out.println(s); } // Compile error: s not in scope",
                "trap": "Using `||` with pattern matching: `if (obj instanceof String s || s.isEmpty())` causes compilation error because `s` is not guaranteed to match."
            },
            {
                "id": "q-mod-7",
                "difficulty": "Senior",
                "title": "Pattern Matching switch in Java 21: Null Handling and Guards",
                "question": "How does `switch` in Java 21 handle `null` values compared to legacy switch? What is a guard expression (`when`)?",
                "interviewerIntent": "Tests knowledge of Java 21 pattern matching switch enhancements, null safety, and guarded patterns.",
                "juniorTrap": "Assuming `switch` on an object reference still throws `NullPointerException` before checking cases.",
                "problem": "Legacy switch throws NPE when passed null; modern switch allows explicit `case null` or combined `case null, default`.",
                "innerWorking": "Historically, passing null to `switch` threw an immediate NPE. In Java 21 pattern matching switch, you can write an explicit `case null` branch. If no `case null` is present, it still throws NPE for backwards compatibility. Furthermore, guard clauses use the `when` keyword to evaluate additional boolean expressions on matched patterns.",
                "seniorAnswer": "In Java 21, `switch` supports direct null handling via `case null` or `case null, default:`. If `case null` is omitted, passing null still throws `NullPointerException`. Java 21 also introduces guarded patterns using the `when` keyword, allowing conditional matching without ugly nested `if` blocks.",
                "codeSnippet": "static String process(Object obj) {\n    return switch (obj) {\n        case null -> \"Received null!\"; // Explicit null handling (no NPE)\n        case String s when s.isBlank() -> \"Blank string\"; // Guarded pattern\n        case String s -> \"String of length \" + s.length();\n        case Integer i when i < 0 -> \"Negative int: \" + i;\n        case Integer i -> \"Positive int: \" + i;\n        default -> \"Unknown type\";\n    };\n}",
                "trap": "Putting `case String s` before `case String s when s.isBlank()` causes a compilation error because the first pattern dominates the second."
            },
            {
                "id": "q-mod-8",
                "difficulty": "Senior",
                "title": "Record Deconstruction Patterns (Record Patterns) in Java 21",
                "question": "How do Record Patterns (JEP 440) in Java 21 allow deconstruction of nested records directly inside `switch` or `instanceof`?",
                "interviewerIntent": "Evaluates knowledge of modern Java 21 deconstruction patterns and nested component extraction.",
                "juniorTrap": "Manually extracting components via getters after an `instanceof` check.",
                "problem": "Nested data structures require 5 lines of boilerplates: checking types, casting, and extracting inner fields.",
                "innerWorking": "Java 21 introduces record patterns that deconstruct a record into its components during matching: `case Point(int x, int y)`. Furthermore, they nest recursively: `case Window(Point(int x, int y), Size(int w, int h))`. The compiler extracts the components directly into local variables in a single expression.",
                "seniorAnswer": "Java 21 record patterns allow developers to test whether an object matches a record type and simultaneously deconstruct its components into local variables in a single step. This works recursively for deeply nested records, completely eliminating manual getter calls and defensive null checking.",
                "codeSnippet": "record Point(int x, int y) {}\nrecord ColoredPoint(Point p, String color) {}\n\nstatic void print(Object obj) {\n    if (obj instanceof ColoredPoint(Point(int x, int y), String c)) {\n        System.out.printf(\"Point at (%d, %d) with color %s%n\", x, y, c);\n    }\n}",
                "trap": "If the inner record component is null, the nested pattern match fails and falls through to the next case."
            },
            {
                "id": "q-mod-9",
                "difficulty": "Mid",
                "title": "Text Blocks (Java 15+): Indentation Stripping Rules",
                "question": "How does the Java compiler calculate common white space stripping in multi-line Text Blocks (`\"\"\"`), and how does the closing delimiter's position affect indentation?",
                "interviewerIntent": "Tests understanding of text block indentation algorithms (`stripIndent()`) and whitespace preservation.",
                "juniorTrap": "Not realizing that moving the closing `\"\"\"` changes the indentation of every line in the entire text block.",
                "problem": "SQL or JSON text block has unexpected leading whitespace or fails indentation formatting.",
                "innerWorking": "The compiler determines the 'essential indentation' by finding the minimum leading whitespace across all non-blank lines AND the line containing the closing delimiter `\"\"\"`. If the closing `\"\"\"` is placed to the left of the text, that becomes the baseline, leaving leading spaces on the text lines. If the closing delimiter is on the same line as the last text, trailing whitespace isn't stripped.",
                "seniorAnswer": "The compiler computes incidental whitespace by finding the minimum indentation of all lines, including the closing `\"\"\"` delimiter. If the closing `\"\"\"` is indented to column 0, all original leading spaces in the block are preserved. If the closing `\"\"\"` is aligned with the text, the shared leading spaces are stripped. Use `\\` at line end to prevent newlines.",
                "codeSnippet": "// Closing quotes at column 0: keeps 4 leading spaces\nString query1 = \"\"\"\n    SELECT * FROM users\n    WHERE active = true\n\"\"\";\n\n// Closing quotes aligned with text: 0 leading spaces\nString query2 = \"\"\"\n    SELECT * FROM users\n    WHERE active = true\n    \"\"\";",
                "trap": "Opening `\"\"\"` must be followed by a line terminator; putting text on the same line as opening `\"\"\"` is a syntax error."
            },
            {
                "id": "q-mod-10",
                "difficulty": "Senior",
                "title": "Records Cannot Extend Classes but Can Implement Interfaces",
                "question": "Why does the Java language specification forbid records from extending another class, while permitting them to implement multiple interfaces?",
                "interviewerIntent": "Tests architectural rationale of Records as immutable data carriers and single inheritance constraints.",
                "juniorTrap": "Trying to write `public record Employee(String name) extends Person`.",
                "problem": "A developer tries to create a shared base class for common record fields and encounters compilation failure.",
                "innerWorking": "All records implicitly extend `java.lang.Record`. Because Java does not support multiple class inheritance, a record cannot extend any other class. Furthermore, allowing inheritance would introduce mutable state from parent classes, violating the record contract. However, records can implement any number of interfaces (e.g. `Serializable`, `Comparable`).",
                "seniorAnswer": "All records automatically and implicitly extend `java.lang.Record`. Because Java enforces single class inheritance, records cannot extend another class. Conceptually, records are designed as transparent, immutable carrier tuples with fixed state; class inheritance would allow parent classes to introduce hidden or mutable fields. Records can, however, implement interfaces.",
                "codeSnippet": "interface Identifiable { String id(); }\n\n// VALID:\npublic record Product(String id, double price) implements Identifiable {}\n\n// COMPILER ERROR: Records cannot extend classes!\n// public record Book(String id, double price, String author) extends Product {}",
                "trap": "Attempting to declare instance fields inside a record that are not part of the record header components is forbidden."
            }
        ]
    },

    # -------------------------------------------------------------------------
    # Topic 35: Virtual threads (Java 21)
    # -------------------------------------------------------------------------
    {
        "topicId": "virtual-threads",
        "topicTitle": "Virtual threads (Java 21)",
        "category": "java8",
        "summary": "Project Loom, carrier threads, continuation unmounting, thread pinning traps, ThreadLocal scalability, and no-pooling architecture.",
        "questions": [
            {
                "id": "q-vthread-1",
                "difficulty": "Senior",
                "title": "Virtual Threads vs Platform (OS) Threads Architecture",
                "question": "How do virtual threads differ from platform OS threads in memory footprint, scheduling, and lifecycle? What is a carrier thread?",
                "interviewerIntent": "Tests core understanding of Project Loom architecture, M:N user-mode scheduling, and continuation mechanics.",
                "juniorTrap": "Thinking virtual threads are just faster CPU-bound threads that replace thread pools for everything.",
                "problem": "An engineer creates 1 million platform threads and crashes the OS with `OutOfMemoryError: unable to create new native thread`.",
                "innerWorking": "Platform threads are 1:1 wrappers around OS kernel threads. Each platform thread allocates a fixed 1MB stack in native memory and context switches in kernel space (expensive). Virtual threads are lightweight user-mode threads managed by the JVM. Their stack frames are allocated on the Java heap (starting at a few hundred bytes). The JVM mounts virtual threads onto a pool of platform threads (carrier threads, backed by `ForkJoinPool.commonPool()` / default scheduler). When a virtual thread blocks on I/O, it unmounts from its carrier thread.",
                "seniorAnswer": "Platform threads are 1:1 kernel threads with fixed ~1MB memory stacks; allocating thousands exhausts OS memory and CPU scheduling capacity. Virtual threads are user-mode threads managed by the JVM whose stacks reside on the heap and grow dynamically (starting at < 1KB). The JVM mounts virtual threads onto OS 'carrier threads'. When a virtual thread performs blocking I/O, the JVM unmounts it, freeing the carrier thread to run other work. This enables millions of concurrent threads on modest hardware.",
                "codeSnippet": "// Launching 100,000 virtual threads without exhausting memory:\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 100_000).forEach(i -> {\n        executor.submit(() -> {\n            Thread.sleep(1000); // Unmounts from carrier thread!\n            return i;\n        });\n    });\n} // Executor auto-closes, waiting for all 100k tasks to finish",
                "trap": "Virtual threads do NOT run faster on CPU calculations; they only improve throughput for I/O-bound blocking tasks."
            },
            {
                "id": "q-vthread-2",
                "difficulty": "Staff",
                "title": "Thread Pinning Trap: synchronized Blocks vs ReentrantLock",
                "question": "What is 'Thread Pinning' in virtual threads, why does the `synchronized` keyword cause it, and how does `ReentrantLock` solve it?",
                "interviewerIntent": "Probes deep knowledge of JVM Loom limitations, native monitor frames, and concurrency refactoring requirements.",
                "juniorTrap": "Using `synchronized` around blocking I/O inside virtual threads, inadvertently starving the entire carrier thread pool.",
                "problem": "Virtual thread application hangs and throughput collapses under high load despite having thousands of virtual threads.",
                "innerWorking": "When a virtual thread enters a `synchronized` block/method or calls native code / JNI, its stack frame is tied to the native OS carrier thread. If it performs blocking I/O while holding a synchronized monitor, the JVM CANNOT unmount the virtual thread from its carrier thread. This is called 'pinning'. If all carrier threads (typically equal to CPU core count) are pinned, the entire JVM stalls. `ReentrantLock` is implemented in pure Java without native monitors; when blocking, the virtual thread cleanly unmounts.",
                "seniorAnswer": "Thread pinning occurs when a virtual thread cannot be unmounted from its underlying OS carrier thread during a blocking operation. In Java 21, entering a `synchronized` block or method pins the carrier thread because native monitor frames cannot be moved to the heap. If all carrier threads become pinned, the system deadlocks. Replacing `synchronized` with `ReentrantLock` avoids pinning because `ReentrantLock` uses `LockSupport.park()` which cleanly unmounts the continuation.",
                "codeSnippet": "// ANTI-PATTERN: Pins carrier thread during I/O!\nsynchronized (lock) {\n    socket.getInputStream().read(); // Pins carrier thread; starves pool!\n}\n\n// RECOMMENDED PATTERN:\nReentrantLock lock = new ReentrantLock();\nlock.lock();\ntry {\n    socket.getInputStream().read(); // Cleanly unmounts virtual thread!\n} finally {\n    lock.unlock();\n}",
                "trap": "Diagnose pinning using the JVM flag `-Djdk.tracePinnedThreads=full` to find offending synchronized blocks."
            },
            {
                "id": "q-vthread-3",
                "difficulty": "Senior",
                "title": "Never Pool Virtual Threads: newVirtualThreadPerTaskExecutor",
                "question": "Why should you NEVER pool virtual threads with a bounded pool (e.g. `ThreadPoolExecutor`), and what executor should be used instead?",
                "interviewerIntent": "Tests shift from legacy thread-pooling mindset to Loom's cheap, disposable thread paradigm.",
                "juniorTrap": "Creating a fixed thread pool of 500 virtual threads like platform threads.",
                "problem": "A developer writes `Executors.newFixedThreadPool(500, Thread.ofVirtual().factory())` to 'limit concurrency'.",
                "innerWorking": "Thread pooling was invented because creating platform threads is expensive (allocating 1MB stack and OS kernel handles). Virtual threads are lightweight, ephemeral heap objects costing almost nothing to create. Pooling them adds synchronization contention and defeats Loom's design. If you need to limit concurrency for a shared resource (like database connections), pool the resource (e.g. HikariCP or a `Semaphore`), NEVER the threads.",
                "seniorAnswer": "Virtual threads are designed to be disposable, ephemeral tasks—not pooled resources. Pooling virtual threads re-introduces thread queue contention and defeats Loom's architecture. Instead, use `Executors.newVirtualThreadPerTaskExecutor()`, which spawns a fresh virtual thread per task and terminates it upon completion. To limit concurrency against external resources (e.g. DB connections), use a `Semaphore` instead of pooling threads.",
                "codeSnippet": "// WRONG: Never pool virtual threads!\n// ExecutorService pool = Executors.newFixedThreadPool(100, Thread.ofVirtual().factory());\n\n// CORRECT: Create a thread per task\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    executor.submit(this::handleRequest);\n}\n\n// To throttle access to limited resource (e.g. max 20 DB connections):\nSemaphore dbThrottle = new Semaphore(20);\nvoid query() {\n    dbThrottle.acquire();\n    try { runDbQuery(); } finally { dbThrottle.release(); }\n}",
                "trap": "Pooling virtual threads to limit database concurrency instead of using a Semaphore or connection pool."
            },
            {
                "id": "q-vthread-4",
                "difficulty": "Senior",
                "title": "ThreadLocal Memory Bloat and Overhead in Virtual Threads",
                "question": "Why does heavy use of `ThreadLocal` pose severe memory scalability risks when transitioning from 200 platform threads to 1,000,000 virtual threads?",
                "interviewerIntent": "Assesses understanding of ThreadLocal memory multiplication and modern alternatives like Scoped Values.",
                "juniorTrap": "Using `ThreadLocal` to cache heavy objects (e.g. `SimpleDateFormat` or buffers) when running millions of virtual threads.",
                "problem": "Migrating a service to virtual threads causes immediate OutOfMemoryError because a framework stores a 1MB buffer in a ThreadLocal.",
                "innerWorking": "With 200 platform threads, a `ThreadLocal` holding a 1MB buffer consumes 200MB of heap. With 1,000,000 virtual threads, that same `ThreadLocal` attempts to allocate 1,000,000 × 1MB = 1 Terabyte of heap memory! Furthermore, ThreadLocal maps add overhead to every virtual thread object.",
                "seniorAnswer": "ThreadLocal variables are replicated per thread instance. In legacy applications with 100 platform threads, caching heavy objects in ThreadLocal was common practice. But with 1,000,000 virtual threads, each thread instance holds its own copy, multiplying memory consumption to catastrophic levels. For virtual threads, avoid ThreadLocal caching and prefer method parameter passing or Java 21+ Scoped Values (`ScopedValue<T>`).",
                "codeSnippet": "// DANGEROUS in Virtual Threads (1M threads = 1M buffers!):\nstatic final ThreadLocal<byte[]> BUFFER = ThreadLocal.withInitial(() -> new byte[1024 * 1024]);\n\n// SAFE: Pass lightweight context or use Java 21 ScopedValue (Preview):\n// static final ScopedValue<UserContext> CONTEXT = ScopedValue.newInstance();\n// ScopedValue.where(CONTEXT, ctx).run(() -> doWork());",
                "trap": "Logging frameworks storing MDC context in `InheritableThreadLocal` copying maps across millions of child threads."
            },
            {
                "id": "q-vthread-5",
                "difficulty": "Mid",
                "title": "CPU-Bound Tasks: Why Virtual Threads Give Zero Benefit",
                "question": "Will migrating a CPU-intensive video encoding or cryptographic hashing workload to virtual threads improve performance? Why or why not?",
                "interviewerIntent": "Verifies that the candidate understands virtual threads solve I/O blocking latency, not CPU hardware limitations.",
                "juniorTrap": "Expecting virtual threads to speed up matrix multiplication or heavy math calculations.",
                "problem": "An engineer benchmarks CPU-bound task with 10,000 virtual threads on an 8-core CPU and finds it runs slower than 8 platform threads.",
                "innerWorking": "Virtual threads do not create magic CPU cores. Carrier threads are bounded by `Runtime.getRuntime().availableProcessors()`. In CPU-bound work, threads never block or yield, so carrier threads never unmount them. Running 10,000 compute-heavy virtual threads adds continuation scheduling overhead and context switching without any concurrency benefit.",
                "seniorAnswer": "No. Virtual threads provide zero performance benefit for CPU-bound workloads. Virtual threads excel solely when tasks spend time blocked on I/O, timers, or locks (allowing the carrier thread to unmount and do other work). For CPU-bound workloads, throughput is strictly bounded by the number of physical CPU cores. Creating thousands of compute threads merely adds scheduling and memory overhead; use standard ForkJoinPool or parallel streams instead.",
                "codeSnippet": "// CPU-BOUND: Use parallelStream or ForkJoinPool matching CPU cores\nlong sum = LongStream.range(0, 1_000_000_000).parallel().sum();\n\n// Using 1,000,000 virtual threads for heavy math runs SLOWER due to scheduling overhead!",
                "trap": "Believing virtual threads give free parallelism beyond hardware core capacity."
            },
            {
                "id": "q-vthread-6",
                "difficulty": "Senior",
                "title": "JNI and Native Method Carrier Pinning",
                "question": "What happens when a virtual thread calls a native C method via JNI or Foreign Function & Memory (FFM) API that blocks?",
                "interviewerIntent": "Tests edge-case awareness of native library integration with Loom.",
                "juniorTrap": "Assuming native I/O libraries (like legacy C drivers) cleanly unmount virtual threads.",
                "problem": "Calling a legacy C database driver locks up the JVM carrier threads.",
                "innerWorking": "The JVM continuation mechanism can only capture Java stack frames. It cannot capture native OS C-stack frames. Therefore, while executing inside a JNI native method, the virtual thread is strictly pinned to its carrier thread. If the native method blocks on native socket I/O, the underlying OS carrier thread is completely blocked.",
                "seniorAnswer": "When a virtual thread executes native code via JNI, it pins the carrier thread. If the native method performs a blocking operation (like C-level socket read or file lock), the underlying OS thread is physically blocked and cannot run other virtual threads. To prevent carrier starvation, run blocking native calls on a dedicated platform thread pool.",
                "codeSnippet": "// Native method call pins carrier thread:\n// nativeLibrary.blockingRead(); \n\n// Safe approach: Offload native calls to dedicated OS thread pool\nExecutorService nativePool = Executors.newFixedThreadPool(10);\nnativePool.submit(() -> nativeLibrary.blockingRead());",
                "trap": "Assuming Foreign Function & Memory (FFM) API automatically unmounts virtual threads during native C calls."
            },
            {
                "id": "q-vthread-7",
                "difficulty": "Senior",
                "title": "Continuation Mechanics: How Park and Unpark Work Internally",
                "question": "What is a `Continuation` in the JVM, and how does the combination of `LockSupport.park()` and carrier thread `ForkJoinPool` make virtual threads non-blocking?",
                "interviewerIntent": "Probes under-the-hood JVM implementation knowledge of Project Loom.",
                "juniorTrap": "Assuming the JVM rewrites blocking code into reactive callbacks like Node.js at compile time.",
                "problem": "Explaining how synchronous `socket.read()` code runs asynchronously at the OS level.",
                "innerWorking": "Loom uses internal JVM `Continuation` primitives. When a virtual thread calls a blocking API (e.g. `SocketInputStream.read()`), the JDK registers a polling callback with the OS kernel (`epoll` on Linux, `kqueue` on macOS, `IOCP` on Windows) and calls `Continuation.yield()`. The JVM copies the virtual thread's stack frames to the Java heap and unmounts it. When the OS signals data is ready, the scheduler mounts the continuation back onto an available carrier thread to resume execution.",
                "seniorAnswer": "Virtual threads are implemented on top of `Continuation` objects. When synchronous blocking code (like socket read) is called, the JDK intercepts it, registers an event with the OS non-blocking multiplexer (`epoll`/`kqueue`), and yields the continuation. The virtual thread's stack frames are copied to heap, and the carrier thread is released. Once the I/O event fires, the poller wakes up and reschedules the continuation in `ForkJoinPool`, mounting it on any available carrier thread to resume execution seamlessly.",
                "codeSnippet": "// Looks synchronous, runs asynchronously under the hood:\nbyte[] data = new byte[1024];\nint read = socket.getInputStream().read(data); // Yields continuation, carrier released!\n// When epoll fires, resumes right here on an available carrier thread",
                "trap": "Believing virtual threads are green threads from Java 1.1; Java 1.1 green threads ran on a single OS thread without M:N multi-core scheduling."
            },
            {
                "id": "q-vthread-8",
                "difficulty": "Mid",
                "title": "Thread.sleep() on Virtual Threads",
                "question": "What happens to the underlying OS carrier thread when a virtual thread calls `Thread.sleep(1000)`?",
                "interviewerIntent": "Verifies understanding of how standard blocking APIs were retrofitted in Java 21 to support virtual threads.",
                "juniorTrap": "Assuming `Thread.sleep()` blocks the operating system thread.",
                "problem": "An engineer replaces `Thread.sleep()` with complex reactive delay timers because they fear blocking the server.",
                "innerWorking": "In Java 21, `Thread.sleep()` was completely rewritten. For virtual threads, `Thread.sleep()` does not call the OS sleep system call. Instead, it schedules a wake-up task in an internal system timer and yields the continuation, releasing the carrier thread immediately. The carrier thread continues running other virtual threads.",
                "seniorAnswer": "`Thread.sleep()` does NOT block the underlying OS carrier thread. In Java 21, `Thread.sleep()` yields the virtual thread's continuation and releases the carrier thread to execute other virtual threads. After the sleep duration elapses, the JVM re-mounts the virtual thread onto an available carrier thread. You can freely use `Thread.sleep()` in virtual threads without wasting OS resources.",
                "codeSnippet": "Runnable task = () -> {\n    try {\n        Thread.sleep(5000); // Carrier thread is NOT blocked; free to serve other tasks\n    } catch (InterruptedException e) {}\n};\nThread.ofVirtual().start(task);",
                "trap": "Calling `Object.wait()` still pins the carrier thread in early Java 21 releases; prefer `LockSupport.park()` or `Condition`."
            },
            {
                "id": "q-vthread-9",
                "difficulty": "Staff",
                "title": "Deadlocks in Carrier Pool via Synchronized Blocks",
                "question": "How can a pool of 8 carrier threads experience a total deadlock even if there are 1,000 virtual threads waiting to run?",
                "interviewerIntent": "Tests complex concurrency problem analysis where thread pinning meets resource dependency.",
                "juniorTrap": "Believing deadlocks only happen between the same thread types.",
                "problem": "An application with 8 CPU cores hangs completely when 8 virtual threads enter synchronized blocks waiting for responses from other virtual threads.",
                "innerWorking": "Suppose an 8-core machine has 8 carrier threads. 8 virtual threads enter `synchronized` blocks and attempt to read from a channel/queue populated by 8 OTHER virtual threads. Because `synchronized` pins the carrier thread, all 8 carrier threads are pinned waiting for data. The producer virtual threads CANNOT be mounted because all carrier threads are blocked. The entire system is permanently deadlocked.",
                "seniorAnswer": "If the number of virtual threads that enter `synchronized` blocks and wait on dependencies exceeds the carrier thread pool size (equal to available CPU cores), carrier starvation occurs. All carrier threads become pinned waiting for conditions produced by other virtual threads. But because all carrier threads are busy, the producer virtual threads can never be mounted to run, resulting in a complete system deadlock.",
                "codeSnippet": "// 8 carrier threads on 8-core CPU\n// If 8 virtual threads run this:\nsynchronized(lock) {\n    queue.take(); // Waits for producer... BUT PRODUCER CANNOT RUN BECAUSE ALL 8 CARRIERS ARE PINNED!\n}",
                "trap": "Assuming the JVM will dynamically spin up hundreds of emergency carrier threads (default carrier expansion is strictly limited)."
            },
            {
                "id": "q-vthread-10",
                "difficulty": "Senior",
                "title": "Thread Names and Debugging Millions of Virtual Threads",
                "question": "How do you identify and debug virtual threads in thread dumps, and why does `jstack` handle them differently than platform threads?",
                "interviewerIntent": "Tests operational knowledge of observability, thread dumps, and troubleshooting in Java 21 production.",
                "juniorTrap": "Running `jstack <pid>` expecting to see 500,000 virtual threads listed line by line.",
                "problem": "Taking a thread dump with `jstack` freezes the process or omits virtual threads entirely.",
                "innerWorking": "Standard `jstack` or `Thread.getAllStackTraces()` dumps platform threads. Printing 1,000,000 virtual threads in a classic thread dump would generate a 2GB text file and freeze the JVM. In Java 21, virtual threads are inspected using `jcmd <pid> Thread.dump_to_file -format=json threads.json` which writes an asynchronous JSON thread dump.",
                "seniorAnswer": "Traditional `jstack` does not dump virtual threads to prevent freezing the JVM and producing multi-gigabyte files. In Java 21, use `jcmd <pid> Thread.dump_to_file -format=json dump.json` to generate an asynchronous structured thread dump. Additionally, always give virtual threads meaningful names using `Thread.ofVirtual().name(\"worker-\", 0).factory()` for production traceability.",
                "codeSnippet": "// Giving names to virtual threads for logging and metrics:\nThreadFactory factory = Thread.ofVirtual().name(\"order-processor-\", 0).factory();\ntry (var executor = Executors.newThreadPerTaskExecutor(factory)) {\n    executor.submit(() -> System.out.println(Thread.currentThread().getName()));\n}\n// Command line dump:\n// jcmd <PID> Thread.dump_to_file -format=json /tmp/threads.json",
                "trap": "Virtual threads have no default name (name is empty string) unless explicitly specified with a name builder or factory."
            }
        ]
    }
]
