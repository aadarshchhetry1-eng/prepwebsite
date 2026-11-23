# scripts/topics_strings.py
# Category: Strings, Wrappers & Exceptions (7 Topics x 10 Questions = 70 Questions)

TOPICS_STRINGS = [
  # --------------------------------------------------------------------------
  # 7. String immutability and the string pool
  # --------------------------------------------------------------------------
  {
    "topicId": "string-immutability-string-pool",
    "topicTitle": "String immutability and the string pool",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on Literal Deduplication, StringTable Internals, Compact Strings & Security.",
    "questions": [
      {
        "id": "q-strpool-1",
        "difficulty": "Senior",
        "title": "Literal Creation vs new String() Heap Object Count",
        "question": "How many objects are created by String s = new String(\"hello\") when \"hello\" is not yet in the pool?",
        "interviewerIntent": "Verifying bytecode understanding of ldc instruction vs new opcode.",
        "juniorTrap": "Saying 1 object.",
        "problem": "Unnecessary heap allocation when creating strings with new String().",
        "innerWorking": "Creates TWO objects: 1) The string literal \"hello\" is created in the JVM StringTable (Heap) during class loading via ldc bytecode instruction. 2) new String() allocates a distinct object instance on the normal heap that references the underlying byte array.",
        "seniorAnswer": [
          "Creates 2 objects: one in the String Pool, one on the standard heap.",
          "Avoid new String(\"...\"); use string literals directly to leverage JVM deduplication."
        ],
        "codeSnippet": "String s1 = \"hello\"; // Pooled literal\nString s2 = new String(\"hello\"); // 2nd object on heap!\nSystem.out.println(s1 == s2); // false!",
        "trap": "new String(\"literal\") always creates a redundant heap object in addition to the pooled literal."
      },
      {
        "id": "q-strpool-2",
        "difficulty": "Staff Level",
        "title": "Compile-Time Constant Folding vs Runtime Concatenation",
        "question": "Why does \"a\" + \"b\" evaluate to a pooled literal, but String a = \"a\"; a + \"b\" creates a new heap object?",
        "interviewerIntent": "Testing JLS §15.28 compile-time constant expressions vs dynamic StringBuilder invocation.",
        "juniorTrap": "Assuming both string concatenations are optimized identically by the compiler.",
        "problem": "Inefficient string concatenation in loops causing continuous heap allocations.",
        "innerWorking": "Constant expressions (\"a\" + \"b\") are folded by javac at compile time directly into \"ab\" in the class constant pool. If any operand is a non-final variable, javac generates dynamic concatenation bytecode (invokedynamic StringConcatFactory in Java 9+), creating a new heap instance.",
        "seniorAnswer": [
          "Literal concatenation is folded at compile time; (s1 == s2) is true.",
          "Variable concatenation runs at runtime via StringConcatFactory; creates distinct heap object.",
          "If variable is marked 'final String a = \"a\";', it becomes a constant expression and folds!"
        ],
        "codeSnippet": "String s1 = \"ab\";\nString s2 = \"a\" + \"b\"; // Folded to \"ab\" at compile time!\nSystem.out.println(s1 == s2); // true!\n\nString a = \"a\";\nString s3 = a + \"b\"; // Evaluated at runtime!\nSystem.out.println(s1 == s3); // false!",
        "trap": "Concatenating literals is folded at compile-time; concatenating non-final variables allocates at runtime."
      },
      {
        "id": "q-strpool-3",
        "difficulty": "Senior",
        "title": "Why String is Immutable: Security, Thread-Safety & Caching",
        "question": "What catastrophic security and architectural failures would occur if String were mutable in Java?",
        "interviewerIntent": "Evaluating systemic understanding of Java security, class loading, networking, and hash caching.",
        "juniorTrap": "Giving a shallow answer like 'to make programming easier'.",
        "problem": "Security breaches: modifying connection strings or filenames after security validation passes (TOCTOU).",
        "innerWorking": "1) Security: ClassLoader security checks, file access, and network connections pass String parameters. If mutable, a malicious thread could alter the file path after security checks pass (Time-of-Check to Time-of-Use). 2) Thread safety: Immutable strings are inherently thread-safe without locks. 3) HashCode caching: String caches hash = 0; if mutable, hash codes would change, destroying HashMap lookups.",
        "seniorAnswer": [
          "Prevents TOCTOU security race conditions.",
          "Enables safe hashCode caching (hash field computed once).",
          "Allows String Pool deduplication without risk of one thread mutating another's string."
        ],
        "codeSnippet": "// If String were mutable:\nvoid openFile(String path) {\n    checkSecurity(path);\n    // Attacker thread mutates 'path' here to '/etc/passwd'!\n    fileSystem.open(path); // BREACH!\n}",
        "trap": "String immutability is essential for security validation, thread-safety, and stable hash code caching."
      },
      {
        "id": "q-strpool-4",
        "difficulty": "Staff Level",
        "title": "Compact Strings (Java 9+): byte[] vs char[] and Latin-1 Encoding",
        "question": "How did Java 9's Compact Strings change the internal memory layout of String, and how does it save 50% RAM?",
        "interviewerIntent": "Testing knowledge of modern HotSpot memory optimizations (JEP 254).",
        "juniorTrap": "Believing String still stores an array of 16-bit char[] internally in modern Java.",
        "problem": "High memory consumption where 90%+ of application strings only contain single-byte ASCII characters.",
        "innerWorking": "Prior to Java 9, String held private final char[] value (2 bytes per character). JEP 254 replaced char[] with byte[] value plus a byte coder field. If the string contains only Latin-1 characters (1 byte each), coder = LATIN1 (1 byte per char). If any character requires UTF-16, coder = UTF16 (2 bytes per char).",
        "seniorAnswer": [
          "Replaced char[] (16 bits) with byte[] (8 bits) + 1-byte coder flag.",
          "Halves the heap footprint for standard ASCII/Latin-1 text in enterprise microservices.",
          "Transparent to user code; completely managed by the JVM."
        ],
        "codeSnippet": "// Java 8 String: char[] (2 bytes per character always)\n// Java 9+ String: byte[] + coder flag (1 byte per char if Latin-1)",
        "trap": "In Java 9+, String uses byte[] internally, allocating only 1 byte per character for Latin-1 strings."
      },
      {
        "id": "q-strpool-5",
        "difficulty": "Senior",
        "title": "G1 GC String Deduplication (-XX:+UseStringDeduplication)",
        "question": "How does G1 GC String Deduplication optimize memory without requiring manual String.intern() calls?",
        "interviewerIntent": "Understanding JVM-level automatic string deduplication (JEP 192).",
        "juniorTrap": "Confusing G1 String Deduplication with the String Pool.",
        "problem": "Applications holding millions of duplicate String instances on the heap, wasting gigabytes of RAM.",
        "innerWorking": "String instances with identical character sequences have identical hashes. When G1 GC runs in the background, it inspects strings that survive minor GC cycles. If it finds two distinct String objects with identical byte[] contents, it re-points both String objects to the SAME underlying byte[] array, freeing the duplicate array.",
        "seniorAnswer": [
          "Deduplicates the underlying byte[] array, not the String object wrapper.",
          "Runs asynchronously in background GC threads with near-zero latency impact.",
          "Enable via: -XX:+UseG1GC -XX:+UseStringDeduplication."
        ],
        "codeSnippet": "// With -XX:+UseStringDeduplication:\n// String s1 = new String(\"data\");\n// String s2 = new String(\"data\");\n// s1 != s2 (distinct String objects), but s1.value == s2.value (shared byte[] memory!)",
        "trap": "G1 String Deduplication shares the underlying byte[] across duplicate strings without pool pollution."
      },
      {
        "id": "q-strpool-6",
        "difficulty": "Staff Level",
        "title": "Reflection Mutating String.value[] and JVM Corruption",
        "question": "Can reflection mutate a String literal's private value field? What happens to the JVM if you change \"hello\" to \"world\"?",
        "interviewerIntent": "Understanding deep JVM internals, String literal immutability assumptions, and Java 17 modular encapsulation.",
        "juniorTrap": "Believing private final makes fields physically hardware-immutable.",
        "problem": "Catastrophic global JVM corruption: System.out.println(\"hello\") prints \"world\"!",
        "innerWorking": "Using reflection (prior to Java 17), one can obtain the private byte[] value field of String.class, setAccessible(true), and overwrite bytes. Because string literals are pooled, mutating \"hello\" corrupts ALL occurrences of \"hello\" across the entire JVM runtime! In Java 17+, JEP 403 blocks this by default.",
        "seniorAnswer": [
          "Pre-Java 17 reflection can alter String.value byte array directly.",
          "Corrupts the JVM globally because pooled literals share the exact same byte array.",
          "Java 17+ strongly encapsulates java.base, throwing InaccessibleObjectException."
        ],
        "codeSnippet": "// Pre-Java 17:\nField f = String.class.getDeclaredField(\"value\");\nf.setAccessible(true);\nbyte[] val = (byte[]) f.get(\"hello\");\nval[0] = 'H'; val[1] = 'I';\nSystem.out.println(\"hello\"); // Prints: \"hIllo\" everywhere in the JVM!",
        "trap": "Mutating string literals via reflection corrupts that literal across the entire JVM runtime."
      },
      {
        "id": "q-strpool-7",
        "difficulty": "Senior",
        "title": "SubString Memory Leak Fix (Java 7 Update 6)",
        "question": "Why did String.substring() cause massive memory leaks in Java 6, and how was it fixed in Java 7u6?",
        "interviewerIntent": "Historical understanding of JVM string memory layout changes.",
        "juniorTrap": "Assuming substring() always creates a copy of the characters.",
        "problem": "Extracting a 4-character substring from a 10MB text file kept the entire 10MB char[] array pinned in memory!",
        "innerWorking": "In Java 6, substring(start, end) shared the original String's char[] array, simply using an offset and count field. If you kept a tiny substring, the entire 10MB parent array could not be garbage collected! In Java 7u6, substring() was changed to always create a brand-new, truncated copy of the underlying array via Arrays.copyOfRange.",
        "seniorAnswer": [
          "Java 6: substring shared parent char[] with offset/count -> massive memory leak.",
          "Java 7u6+: substring always allocates a fresh, truncated char/byte array.",
          "Tradeoff: Java 6 was O(1) time but leaked memory; modern Java is O(N) copy but zero memory leak."
        ],
        "codeSnippet": "// Java 6: Tiny substring held pointer to huge 10MB array\n// Java 7u6+: Arrays.copyOfRange creates compact copy, freeing huge parent array.",
        "trap": "In modern Java, substring() copies the character range, preventing memory leaks from large parent strings."
      },
      {
        "id": "q-strpool-8",
        "difficulty": "Senior",
        "title": "String Concatenation in Loops Anti-Pattern",
        "question": "Why does using str += \"a\" inside a for loop of 100,000 iterations destroy CPU performance?",
        "interviewerIntent": "Analyzing bytecode generation inside loops and O(N^2) complexity.",
        "juniorTrap": "Thinking the compiler automatically optimizes str += \"a\" inside loops into a single StringBuilder.",
        "problem": "App freezes or takes minutes to process a simple string accumulation loop.",
        "innerWorking": "In each loop iteration, javac generates: new StringBuilder(str).append(\"a\").toString(). It creates 100,000 temporary StringBuilder instances and copies all preceding characters over and over again, degrading performance from O(N) to O(N^2) with massive GC garbage.",
        "seniorAnswer": [
          "Compiler only optimizes single-statement string concatenations, NOT cross-iteration loops.",
          "Creates N temporary StringBuilder objects and copies N*(N+1)/2 characters.",
          "Fix: Instantiate a single StringBuilder outside the loop."
        ],
        "codeSnippet": "// BAD: O(N^2) allocations\nString s = \"\";\nfor (int i=0; i<100000; i++) s += i;\n\n// GOOD: O(N) single pre-sized buffer\nStringBuilder sb = new StringBuilder(100000 * 6);\nfor (int i=0; i<100000; i++) sb.append(i);",
        "trap": "Using += on strings inside loops generates a new StringBuilder per iteration, causing O(N^2) performance."
      },
      {
        "id": "q-strpool-9",
        "difficulty": "Senior",
        "title": "String.hashCode() Multiplier 31 Math",
        "question": "Why does String.hashCode() use the prime multiplier 31 in s[0]*31^(n-1) + s[1]*31^(n-2) + ...?",
        "interviewerIntent": "Testing knowledge of hashing distribution math, prime numbers, and CPU bit-shift optimizations.",
        "juniorTrap": "Saying 'because 31 is prime' without knowing the hardware bit-shift optimization.",
        "problem": "Poor hashing multipliers causing hash clustering or slow CPU multiplication.",
        "innerWorking": "1) Prime multiplier: 31 reduces hash collisions across anagrams and structured strings. 2) Hardware bit-shift optimization: Modern compilers and CPUs optimize 31 * i into: (i << 5) - i. Bit-shift and subtraction take 1 CPU clock cycle, whereas integer multiplication historically took multiple cycles.",
        "seniorAnswer": [
          "31 * i == (i << 5) - i: Replaced multiplication with bit-shift and subtraction at hardware level.",
          "Prime number distribution minimizes collision clustering.",
          "Result fits inside standard 32-bit signed int."
        ],
        "codeSnippet": "// HotSpot JVM computes 31 * i as:\nint hash = (hash << 5) - hash + charAt(i);",
        "trap": "31 was chosen for String.hashCode because it is prime and optimizes to (i << 5) - i at the hardware level."
      },
      {
        "id": "q-strpool-10",
        "difficulty": "Staff Level",
        "title": "Why String Should NOT Be Used for Passwords (char[] vs String)",
        "question": "Why does security compliance (PCI-DSS) strictly require char[] instead of String for storing passwords in memory?",
        "interviewerIntent": "Evaluating memory security, heap dump vulnerabilities, and zeroing out sensitive data.",
        "juniorTrap": "Thinking String is safe because it's immutable.",
        "problem": "Plaintext passwords lingering in JVM heap memory for hours after login, exposed in memory dumps.",
        "innerWorking": "Because String is immutable, you cannot wipe its contents from memory after use. It lingers in heap memory until the next GC cycle (which may take hours). A hacker or core dump tool can inspect RAM and read passwords in plaintext. With char[], you can explicitly zero out the array immediately after authentication via Arrays.fill(password, '0').",
        "seniorAnswer": [
          "Strings cannot be cleared or zeroed out due to immutability.",
          "char[] can be explicitly wiped immediately with Arrays.fill(pwd, '\\0').",
          "Mitigates heap inspection, core dump scraping, and cold boot attacks."
        ],
        "codeSnippet": "char[] password = getPasswordFromUser();\nauthenticate(password);\n// ZERO OUT IMMEDIATELY AFTER USE:\nArrays.fill(password, '\\0');",
        "trap": "Never store passwords in String; use char[] so sensitive data can be zeroed out immediately after use."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 8. String.intern()
  # --------------------------------------------------------------------------
  {
    "topicId": "string-intern",
    "topicTitle": "String.intern()",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on StringTable Native Hashtable, PermGen vs Heap, GC & Tuning.",
    "questions": [
      {
        "id": "q-intern-1",
        "difficulty": "Senior",
        "title": "String.intern() Contract and Return Value",
        "question": "What does String.intern() do if the string already exists in the pool vs when it does not exist?",
        "interviewerIntent": "Testing exact specification of String.intern() contract.",
        "juniorTrap": "Thinking intern() modifies the calling string in-place.",
        "problem": "Writing str.intern() without assigning the return value, expecting str to become pooled.",
        "innerWorking": "str.intern() returns a canonical representation from the StringTable. If an equal string is in the pool, the pooled reference is returned. If NOT in the pool, str's reference is added to the pool and returned. Calling str.intern() without s = str.intern() does nothing!",
        "seniorAnswer": [
          "String.intern() returns the pooled reference; it does not mutate the caller.",
          "Always capture the return: s = s.intern().",
          "If present, returns existing pooled reference; if absent, adds and returns reference."
        ],
        "codeSnippet": "String s = new String(\"test\");\ns.intern(); // USELESS! Return value ignored!\nSystem.out.println(s == \"test\"); // false!\n\ns = s.intern(); // CORRECT!\nSystem.out.println(s == \"test\"); // true!",
        "trap": "String.intern() does not mutate the string; you must capture its return value."
      },
      {
        "id": "q-intern-2",
        "difficulty": "Staff Level",
        "title": "Java 6 vs Java 7+ String.intern() PermGen vs Heap Shift",
        "question": "What does new String(\"1\") + new String(\"1\"); s.intern(); s == \"11\" print in Java 6 vs Java 7+?",
        "interviewerIntent": "Deep knowledge of the StringTable relocation from PermGen to main Heap in Java 7.",
        "juniorTrap": "Expecting both to print false.",
        "problem": "Severe PermGen OutOfMemoryError in Java 6 when calling intern() on dynamic data.",
        "innerWorking": "In Java 6, StringTable was in PermGen. intern() copied the characters into PermGen and returned that PermGen pointer (s == s.intern() was false). In Java 7+, StringTable moved to the main Heap: when s.intern() is called and '11' is absent, the JVM simply stores the reference of s directly into the pool! Thus, s == \"11\" is TRUE in Java 7+!",
        "seniorAnswer": [
          "Java 6: StringTable in PermGen -> intern() cloned characters into PermGen (s == \"11\" is false).",
          "Java 7+: StringTable in Heap -> intern() stores existing heap reference (s == \"11\" is true).",
          "Java 7+ avoids duplicating heap objects when interning fresh strings."
        ],
        "codeSnippet": "String s = new String(\"1\") + new String(\"1\");\ns.intern();\nString s2 = \"11\";\nSystem.out.println(s == s2); // true in Java 7+! false in Java 6!",
        "trap": "In Java 7+, String.intern() stores the heap reference directly rather than copying characters to PermGen."
      },
      {
        "id": "q-intern-3",
        "difficulty": "Senior",
        "title": "StringTable Native Hashtable Bucket Sizing (-XX:StringTableSize)",
        "question": "Why does calling intern() on millions of unique strings cause massive CPU spikes? How does -XX:StringTableSize fix it?",
        "interviewerIntent": "Understanding the C++ native hashtable structure powering the String Pool.",
        "juniorTrap": "Assuming StringTable resizes dynamically like java.util.HashMap without performance cost.",
        "problem": "Massive GC pauses and slow intern() calls when processing large CSV files.",
        "innerWorking": "The JVM StringTable is a fixed-size native C++ hashtable with linked buckets. Default size was historically 1,009 (now 60,013 in Java 8+). If you intern 1,000,000 unique strings into 1,009 buckets, each bucket chain has ~1,000 linked elements! Every intern() must traverse a 1,000-node linked list, degrading lookup to O(N).",
        "seniorAnswer": [
          "StringTable has a fixed bucket count configured at startup.",
          "Tuned via: -XX:StringTableSize=60013 (must be prime).",
          "Inspect table performance with: -XX:+PrintStringTableStatistics."
        ],
        "codeSnippet": "// JVM Flag to tune StringTable buckets:\n// -XX:StringTableSize=1000003\n// -XX:+PrintStringTableStatistics",
        "trap": "Interning millions of unique strings into a default StringTable causes massive linked-list hash collisions."
      },
      {
        "id": "q-intern-4",
        "difficulty": "Senior",
        "title": "String.intern() Garbage Collection Behavior",
        "question": "Are interned strings ever garbage collected in modern Java?",
        "interviewerIntent": "Verifying GC reachability rules for pooled strings.",
        "juniorTrap": "Believing interned strings live forever and can never be GC'd.",
        "problem": "Fear that calling intern() guarantees permanent memory leakage.",
        "innerWorking": "In Java 7+, since StringTable resides in the main Java heap, interned strings CAN be garbage collected during Full GC if they are no longer reachable from any live GC root. However, string literals loaded from class constant pools are held alive by their ClassLoader and survive as long as the class is loaded.",
        "seniorAnswer": [
          "Dynamically interned strings ARE garbage collected if no strong references exist.",
          "Literal strings in constant pools survive until their ClassLoader unloads.",
          "In Java 6 (PermGen), interned strings were rarely or never collected, causing PermGen OOM."
        ],
        "codeSnippet": "// Dynamically interned string without strong reference:\nString.valueOf(Math.random()).intern();\n// Can and will be garbage collected during Full GC!",
        "trap": "Interned strings in modern Java can be garbage collected when no longer strongly referenced."
      },
      {
        "id": "q-intern-5",
        "difficulty": "Staff Level",
        "title": "String.intern() vs Custom ConcurrentHashMap Pool",
        "question": "Why do high-throughput systems prefer a bounded ConcurrentHashMap or Guava Interner over String.intern()?",
        "interviewerIntent": "Evaluating production memory safety, eviction controls, and lock contention.",
        "juniorTrap": "Defaulting to String.intern() for memory optimization.",
        "problem": "String.intern() cannot be bounded; unbounded user input pollutes the native JVM table.",
        "innerWorking": "String.intern() operates on a JVM-wide native table with no eviction policy, no size bounds, and requires native JVM JNI lock transitions. A custom ConcurrentHashMap or Guava Interners.newWeakInterner() allows memory bounds, LRU eviction, and soft/weak reference cleaning.",
        "seniorAnswer": [
          "Guava Interner supports weak references (Interners.newWeakInterner()).",
          "Custom pools allow LRU eviction and memory bounds.",
          "Protects against Denial of Service (DoS) attacks from unbounded user input."
        ],
        "codeSnippet": "// RECOMMENDED: Guava Weak Interner\nInterner<String> interner = Interners.newWeakInterner();\nString canonical = interner.intern(dynamicInput);",
        "trap": "Never call String.intern() on unbounded user input; use a bounded or weak-reference interner."
      },
      {
        "id": "q-intern-6",
        "difficulty": "Senior",
        "title": "Literal Equality with intern() across ClassLoaders",
        "question": "Are string literals with identical values shared across different ClassLoaders? Does intern() return the same reference?",
        "interviewerIntent": "Testing classloader isolation boundaries and StringTable global scope.",
        "juniorTrap": "Assuming ClassLoaders isolate String literals like they isolate classes.",
        "problem": "Confusion regarding classloader boundaries.",
        "innerWorking": "The JVM StringTable is GLOBAL across the entire JVM process. String literals loaded by ClassLoader A and ClassLoader B share the exact same pooled reference in the StringTable. s1.intern() == s2.intern() is ALWAYS true across classloaders.",
        "seniorAnswer": [
          "StringTable is global across all ClassLoaders in the JVM.",
          "Literals from different JARs and classloaders resolve to the same pooled instance.",
          "Classes are isolated by ClassLoader; strings are not."
        ],
        "codeSnippet": "// Loader 1 loads Class A with \"hello\"\n// Loader 2 loads Class B with \"hello\"\n// A.STR == B.STR evaluates to TRUE across different classloaders!",
        "trap": "The JVM StringTable is globally shared across all ClassLoaders in the runtime."
      },
      {
        "id": "q-intern-7",
        "difficulty": "Senior",
        "title": "Identity Comparison (==) Optimization after intern()",
        "question": "Can you safely replace equals() with == after interning strings? What are the risks?",
        "interviewerIntent": "Balancing micro-optimization speed against defensive programming.",
        "juniorTrap": "Using == everywhere after interning, leading to subtle bugs when third-party libraries pass uninterned strings.",
        "problem": "Bugs where uninterned strings compare as false using == despite having identical text.",
        "innerWorking": "If all strings in a domain are strictly canonicalized via intern(), reference equality (==) is O(1) and orders of magnitude faster than equals(). However, if ANY code path passes an uninterned string, == fails silently. In production, this optimization is fragile and rarely worth the bug risk.",
        "seniorAnswer": [
          "Technically valid only in 100% closed, controlled systems (e.g. compiler symbol tables).",
          "Extremely fragile in enterprise code: one uninterned string breaks equality silently.",
          "Always use Objects.equals(s1, s2) or s1.equals(s2)."
        ],
        "codeSnippet": "String s1 = userInput.intern();\nString s2 = \"ADMIN\";\nif (s1 == s2) { /* Works only if userInput is GUARANTEED interned! Highly fragile! */ }",
        "trap": "Using == on interned strings is fragile; a single uninterned string causes silent comparison failures."
      },
      {
        "id": "q-intern-8",
        "difficulty": "Staff Level",
        "title": "String.intern() DoS Vulnerability on Public Endpoints",
        "question": "How can an attacker trigger an OutOfMemoryError or 100% CPU lockup if an application calls .intern() on JSON/XML request bodies?",
        "interviewerIntent": "Security threat modeling and algorithmic complexity attacks (HashDoS).",
        "juniorTrap": "Believing intern() is harmless if the strings are small.",
        "problem": "Public REST API server crashes with OOM or becomes unresponsive under malicious payload attack.",
        "innerWorking": "An attacker sends millions of random UUID strings in JSON payloads. The server calls intern() on each. 1) Heap exhaustion: Millions of string references flood the StringTable. 2) Hash collision attack: Attacker crafts strings colliding on the same StringTable bucket, turning lookups into O(N) linked list traversals that burn 100% CPU.",
        "seniorAnswer": [
          "Never call String.intern() on untrusted user input.",
          "HashDoS attack turns StringTable lookup into O(N) CPU spin.",
          "Use a bounded LRU cache if deduplication is required for user data."
        ],
        "codeSnippet": "// VULNERABLE CONTROLLER:\n@PostMapping(\"/process\")\npublic void handle(@RequestBody Request req) {\n    String key = req.getPayload().intern(); // SECURITY VULNERABILITY!\n}",
        "trap": "Calling intern() on untrusted external inputs exposes applications to HashDoS CPU lockups and OOM attacks."
      },
      {
        "id": "q-intern-9",
        "difficulty": "Senior",
        "title": "Bytecode Analysis of String.intern()",
        "question": "What bytecode instruction is generated when invoking s.intern(), and what is its native signature?",
        "interviewerIntent": "Verifying native method boundary knowledge.",
        "juniorTrap": "Thinking intern() is implemented in Java.",
        "problem": "Assuming JIT compiler can inline String.intern().",
        "innerWorking": "s.intern() invokes invokevirtual on public native String intern(). It enters the JVM C++ hotspot runtime (JVM_InternString in jvm.cpp), searching the global StringTable symbol table using native mutexes.",
        "seniorAnswer": [
          "intern() is a native C++ method; JIT cannot inline it directly.",
          "Incurs native method invocation overhead (JNI transition).",
          "Locks native StringTable mutex during modifications."
        ],
        "codeSnippet": "// Bytecode:\n// 2: invokevirtual #4 // Method java/lang/String.intern:()Ljava/lang/String;\n// Native declaration in java.lang.String:\npublic native String intern();",
        "trap": "String.intern() is a native C++ method that incurs JNI transition and StringTable lock overhead."
      },
      {
        "id": "q-intern-10",
        "difficulty": "Senior",
        "title": "StringTable Inspection via JConsole / VisualVM",
        "question": "How do you inspect the size, memory consumption, and collision statistics of the StringTable in a running production JVM?",
        "interviewerIntent": "Production diagnostics and JVM monitoring tools.",
        "juniorTrap": "Thinking StringTable metrics are visible in standard heap dump object counts.",
        "problem": "Diagnosing suspected StringTable memory leaks or high collision times.",
        "innerWorking": "Use jcmd <pid> VM.stringtable to dump exact bucket counts, string counts, and memory footprint in bytes. Alternatively, enable -XX:+PrintStringTableStatistics on shutdown.",
        "seniorAnswer": [
          "Use jcmd <pid> VM.stringtable for live inspection.",
          "Output details: Number of buckets, entries, total footprint in bytes, average/max bucket chain length.",
          "Helps determine if -XX:StringTableSize needs to be increased."
        ],
        "codeSnippet": "# Run in terminal for live JVM:\njcmd 12345 VM.stringtable\n# Shows: Number of buckets: 60013, Number of entries: 150000, Max bucket size: 12",
        "trap": "Use 'jcmd <pid> VM.stringtable' to monitor StringTable bucket distribution and collision depths in production."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 9. == vs. .equals() (Integer caching: -128 to 127)
  # --------------------------------------------------------------------------
  {
    "topicId": "equality-integer-caching",
    "topicTitle": "== vs. .equals() (Integer caching: -128 to 127)",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on Wrapper Caching Bounds, JLS Autoboxing Invariants, Generics & Equality.",
    "questions": [
      {
        "id": "q-intcache-1",
        "difficulty": "Senior",
        "title": "The Classic IntegerCache Boundary Bug",
        "question": "Why does Integer a = 127, b = 127 have (a == b) == true, but Integer a = 128, b = 128 has (a == b) == false?",
        "interviewerIntent": "Testing JLS §5.1.7 autoboxing cache range.",
        "juniorTrap": "Using == to compare IDs or counts because unit tests with small numbers passed.",
        "problem": "Code works in staging with low test IDs (1 to 100) but crashes in production when real database IDs exceed 127.",
        "innerWorking": "JLS §5.1.7 mandates that autoboxing int -> Integer caches values in the range [-128, 127]. For values in this range, Integer.valueOf() reuses cached instances from IntegerCache.cache[]. For 128+, new Integer() heap objects are allocated, having distinct memory addresses.",
        "seniorAnswer": [
          "[-128, 127] is cached by default; == compares object memory references.",
          "127 shares reference; 128 allocates distinct objects.",
          "Always use .equals() or intValue() for wrapper comparisons."
        ],
        "codeSnippet": "Integer x = 127, y = 127; System.out.println(x == y); // true!\nInteger w = 128, z = 128; System.out.println(w == z); // false!\nSystem.out.println(w.equals(z)); // true! (Value comparison)",
        "trap": "== compares object references; wrapper caching [-128, 127] causes deceptive test passes."
      },
      {
        "id": "q-intcache-2",
        "difficulty": "Senior",
        "title": "Tuning IntegerCache High Bound (-XX:AutoBoxCacheMax)",
        "question": "Can the IntegerCache boundary be configured? Can you change both lower and upper bounds?",
        "interviewerIntent": "Verifying HotSpot JVM tuning flags and JLS constraints.",
        "juniorTrap": "Thinking the range is completely hardcoded or that lower bound (-128) can be changed.",
        "problem": "Attempting to tune the lower bound via non-existent JVM flags.",
        "innerWorking": "The upper bound can be tuned using -XX:AutoBoxCacheMax=<size>. The lower bound is strictly fixed at -128 per JVM specification and cannot be modified. Byte, Short, Long, Character caches cannot be configured at all.",
        "seniorAnswer": [
          "Upper bound configurable via -XX:AutoBoxCacheMax=<n>.",
          "Lower bound (-128) is hardcoded and cannot be changed.",
          "Useful in systems with high density of small IDs (e.g. caching up to 20,000)."
        ],
        "codeSnippet": "# JVM flag to cache Integers up to 20,000:\n-XX:AutoBoxCacheMax=20000",
        "trap": "-XX:AutoBoxCacheMax tunes only the upper bound of IntegerCache; the lower bound (-128) is fixed."
      },
      {
        "id": "q-intcache-3",
        "difficulty": "Senior",
        "title": "Caching in Other Primitive Wrappers (Byte, Short, Long, Char, Float, Double)",
        "question": "Which other primitive wrappers cache values, and which NEVER cache values?",
        "interviewerIntent": "Testing knowledge of wrapper caching across the entire Java standard library.",
        "juniorTrap": "Assuming Double and Float cache values or that Boolean doesn't cache.",
        "problem": "Assuming Double.valueOf(0.0) == Double.valueOf(0.0) is true.",
        "innerWorking": "Boolean: caches TRUE and FALSE. Byte, Short, Long: cache [-128, 127] (fixed, unconfigurable). Character: caches [0, 127]. Float and Double: NEVER cache values! Float.valueOf(1.0f) == Float.valueOf(1.0f) is ALWAYS false.",
        "seniorAnswer": [
          "Boolean, Byte, Short, Character, Integer, Long cache ranges.",
          "Float and Double NEVER cache any values (infinite precision representation).",
          "Never use == for any wrapper types."
        ],
        "codeSnippet": "Double d1 = 1.0, d2 = 1.0;\nSystem.out.println(d1 == d2); // ALWAYS false! Floating-point wrappers never cache!",
        "trap": "Double and Float never cache values; Double.valueOf(1.0) == Double.valueOf(1.0) is always false."
      },
      {
        "id": "q-intcache-4",
        "difficulty": "Senior",
        "title": "Autoboxing in Generics Comparison Trap",
        "question": "Why does comparing List<Integer> elements with == fail even when the values are small numbers populated dynamically?",
        "interviewerIntent": "Understanding generics type erasure and dynamic unboxing/boxing.",
        "juniorTrap": "Assuming collections return cached instances for all boxed values.",
        "problem": "list1.get(i) == list2.get(i) fails unexpectedly.",
        "innerWorking": "If elements were instantiated via new Integer(val) rather than Integer.valueOf(val), they bypass the cache entirely! Also, if values exceed 127, == compares heap addresses. Using == on elements from generic collections is an immediate defect.",
        "seniorAnswer": [
          "Generics store Object references; == performs reference comparison.",
          "Bypassing valueOf() bypasses the cache.",
          "Always use .equals() when comparing collection elements."
        ],
        "codeSnippet": "List<Integer> list = List.of(new Integer(5), new Integer(5));\nSystem.out.println(list.get(0) == list.get(1)); // false! Distinct heap objects!",
        "trap": "Generic collections hold object references; comparing collection elements with == checks memory identity."
      },
      {
        "id": "q-intcache-5",
        "difficulty": "Senior",
        "title": "Mixing Primitives and Wrappers in == Comparison",
        "question": "What happens when an Integer wrapper is compared against an int primitive using == (e.g. Integer a = 200; int b = 200; a == b)?",
        "interviewerIntent": "Understanding unboxing coercion in binary comparison operators (JLS §15.21.1).",
        "juniorTrap": "Thinking b is boxed to Integer, causing reference comparison to fail (false).",
        "problem": "Assuming a == b checks object reference identity when one operand is a primitive.",
        "innerWorking": "If one operand in == is a primitive and the other is a wrapper, the wrapper is UNBOXED to a primitive. a.intValue() == b is evaluated. Thus, 200 == 200 is TRUE. However, if a is null, it throws NullPointerException!",
        "seniorAnswer": [
          "When comparing wrapper == primitive, the wrapper is unboxed to primitive.",
          "Values are compared numerically; 200 == 200 evaluates to true.",
          "DANGER: If wrapper is null, it throws NullPointerException at runtime!"
        ],
        "codeSnippet": "Integer a = 200;\nint b = 200;\nSystem.out.println(a == b); // true! (Unboxed to primitive int comparison)\n\nInteger n = null;\n// System.out.println(n == b); // THROWS NullPointerException!",
        "trap": "Comparing wrapper == primitive unboxes the wrapper; evaluates numerically but throws NPE if null."
      },
      {
        "id": "q-intcache-6",
        "difficulty": "Staff Level",
        "title": "new Integer() vs Integer.valueOf() Deprecation",
        "question": "Why was new Integer(100) deprecated for removal in Java 9, and what warning does javac produce?",
        "interviewerIntent": "Understanding modern API deprecation and Project Valhalla value type preparations.",
        "juniorTrap": "Using new Integer() out of habit.",
        "problem": "Compilation warnings and performance degradation due to bypassing cache.",
        "innerWorking": "new Integer() forces a new heap allocation, bypassing the IntegerCache and consuming unnecessary memory. Deprecated in Java 9 with 'forRemoval = true' in preparation for Project Valhalla (primitive value types where constructors for wrappers will be eliminated).",
        "seniorAnswer": [
          "new Integer() is deprecated for removal.",
          "Bypasses caching, allocating redundant heap memory.",
          "Use Integer.valueOf() or standard autoboxing Integer x = 100."
        ],
        "codeSnippet": "// DEPRECATED:\nInteger a = new Integer(10); \n// RECOMMENDED:\nInteger b = Integer.valueOf(10); // Uses cache [-128, 127]",
        "trap": "new Integer() is deprecated for removal; always use Integer.valueOf() to leverage the cache."
      },
      {
        "id": "q-intcache-7",
        "difficulty": "Senior",
        "title": "equals() Cross-Type Wrapper Invariance",
        "question": "Why does Integer a = 10; Long b = 10L; a.equals(b) evaluate to false?",
        "interviewerIntent": "Testing equals() implementation in wrapper classes.",
        "juniorTrap": "Assuming numeric equivalence (10 == 10) causes equals() to return true.",
        "problem": "Comparing an Integer ID with a Long ID using .equals() fails silently in production business logic.",
        "innerWorking": "In Integer.equals(Object obj), the first line is: if (obj instanceof Integer). Since Long is NOT an Integer, it immediately returns false without even comparing the numerical values! Different wrapper types are NEVER equal via .equals().",
        "seniorAnswer": [
          "Wrapper equals() checks exact type match before comparing value.",
          "Integer.valueOf(10).equals(Long.valueOf(10)) is ALWAYS false.",
          "Convert to primitive before comparison: a.longValue() == b.longValue()."
        ],
        "codeSnippet": "Integer a = 10;\nLong b = 10L;\nSystem.out.println(a.equals(b)); // false! (Different wrapper types!)\nSystem.out.println(a.longValue() == b.longValue()); // true!",
        "trap": "Wrapper equals() returns false when comparing different wrapper types, regardless of numeric value."
      },
      {
        "id": "q-intcache-8",
        "difficulty": "Senior",
        "title": "HashMap Lookup Failure with Differing Wrapper Types",
        "question": "If you put an entry with key Long 10L into a Map<Object, String>, why does map.get(10) (int 10) return null?",
        "interviewerIntent": "Connecting wrapper equals() invariance to Collections hashing.",
        "juniorTrap": "Assuming numeric key 10 finds the entry.",
        "problem": "Looking up database IDs in maps failing because int 10 is autoboxed to Integer, not Long.",
        "innerWorking": "10 autoboxes to Integer(10). 10L is Long(10L). 1) Long.hashCode() and Integer.hashCode() produce the same hash code for 10, locating the bucket. 2) But inside the bucket, equals() fails because Integer is not an instance of Long! Returns null.",
        "seniorAnswer": [
          "Map.get(10) autoboxes to Integer. The key stored is Long.",
          "Integer.equals(Long) returns false.",
          "Ensure keys are strictly converted to the expected type: map.get(10L)."
        ],
        "codeSnippet": "Map<Object, String> map = new HashMap<>();\nmap.put(10L, \"Found!\");\nSystem.out.println(map.get(10));  // null! (Integer(10) != Long(10L))\nSystem.out.println(map.get(10L)); // Found!",
        "trap": "A Map keyed by Long will return null if queried with an Integer due to cross-type equals() failure."
      },
      {
        "id": "q-intcache-9",
        "difficulty": "Staff Level",
        "title": "IntegerCache Reflection Modification Exploit",
        "question": "How can reflection rewrite IntegerCache to make 2 + 2 == 5, and how does Java 17 block it?",
        "interviewerIntent": "Understanding reflection attacks on JVM internal caches and modern encapsulation.",
        "juniorTrap": "Believing JVM wrapper caches are in read-only memory.",
        "problem": "Corrupted application behavior where basic arithmetic comparisons yield insane results.",
        "innerWorking": "IntegerCache.cache is a private static final Integer[] array. Using reflection (Field.setAccessible), code can mutate cache[4 + 128] = 5. Any subsequent autoboxing of 4 (e.g. 2 + 2) returns the object representing 5! Java 17+ JEP 403 blocks this by default.",
        "seniorAnswer": [
          "Pre-Java 17 can mutate IntegerCache array elements via reflection.",
          "Corrupts all autoboxed integers globally in the JVM.",
          "Java 17+ strongly encapsulates java.base, throwing InaccessibleObjectException."
        ],
        "codeSnippet": "// Mutates IntegerCache[4 + 128] = 5;\nInteger x = 2 + 2;\nSystem.out.println(\"2 + 2 = \" + x); // Prints: 5!",
        "trap": "Prior to Java 17, IntegerCache could be mutated via reflection to alter arithmetic results globally."
      },
      {
        "id": "q-intcache-10",
        "difficulty": "Senior",
        "title": "Ternary Unboxing NPE with Mixed Types",
        "question": "Why does Integer a = null; boolean flag = false; Number n = flag ? a : 1.0; evaluate fine, but double d = flag ? a : 1.0; throw NPE?",
        "interviewerIntent": "Analyzing JLS conditional operator type determination rules.",
        "juniorTrap": "Thinking both statements behave identically because flag is false.",
        "problem": "Subtle NullPointerExceptions on dead ternary branches.",
        "innerWorking": "In double d = flag ? a : 1.0, the operands are Integer and double. Binary numeric promotion dictates the overall expression type is primitive double. Therefore, branch 1 is compiled to a.intValue() (unboxing). In Number n = flag ? a : 1.0, both are converted to common supertype Number (no primitive unboxing forced).",
        "seniorAnswer": [
          "Mixed wrapper and primitive ternary coerces to the primitive type.",
          "Causes implicit unboxing call on the wrapper branch, throwing NPE if null.",
          "Avoid mixing wrappers and primitives in ternary branches."
        ],
        "codeSnippet": "Integer a = null;\nboolean flag = false;\n// Number n = flag ? a : 1.0; // OK (Evaluates to 1.0)\n// double d = flag ? a : 1.0; // THROWS NPE at runtime due to unboxing coercion!",
        "trap": "Mixing wrappers and primitives in ternary expressions coerces to primitive, unboxing null and throwing NPE."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 10. StringBuilder vs. StringBuffer
  # --------------------------------------------------------------------------
  {
    "topicId": "stringbuilder-vs-stringbuffer",
    "topicTitle": "StringBuilder vs. StringBuffer",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on Synchronization Contention, Growth Math (2n+2), Thread Safety & HotSpot Inlining.",
    "questions": [
      {
        "id": "q-sb-1",
        "difficulty": "Mid-Senior",
        "title": "The Synchronization Contention Penalty in StringBuffer",
        "question": "Why is StringBuffer considered obsolete in 99% of modern Java applications? What is the performance cost?",
        "interviewerIntent": "Evaluating lock overhead awareness and thread confinement.",
        "juniorTrap": "Using StringBuffer by default 'just in case thread safety is needed'.",
        "problem": "Unnecessary monitor lock acquisition on single-threaded methods causing throughput degradation.",
        "innerWorking": "Almost every method in StringBuffer is marked synchronized. In 99% of string construction use cases, the buffer is confined locally to a single method stack frame. Acquiring and releasing monitor locks creates unnecessary memory barriers and CPU overhead.",
        "seniorAnswer": [
          "StringBuffer methods are synchronized; StringBuilder is unsynchronized.",
          "Local method string assembly has zero concurrent access; synchronization is redundant.",
          "Use StringBuilder for 99.9% of applications; HotSpot BiasedLocking is disabled in modern Java."
        ],
        "codeSnippet": "// StringBuffer: synchronized on every append\nStringBuffer sbuf = new StringBuffer();\n// StringBuilder: fast, non-synchronized\nStringBuilder sb = new StringBuilder();",
        "trap": "StringBuffer synchronizes every method; StringBuilder is non-synchronized and much faster for single threads."
      },
      {
        "id": "q-sb-2",
        "difficulty": "Senior",
        "title": "Buffer Resizing Formula: (oldCapacity * 2) + 2",
        "question": "How does StringBuilder expand its internal array when capacity is exceeded? What is the mathematical formula?",
        "interviewerIntent": "Testing knowledge of internal array reallocation and growth factors.",
        "juniorTrap": "Assuming it doubles capacity (old * 2) or adds a fixed chunk like +16.",
        "problem": "Repeated array allocations and System.arraycopy churn when building large strings without initial sizing.",
        "innerWorking": "Default initial capacity is 16. When capacity is exceeded, it calculates: newCapacity = (oldCapacity * 2) + 2. If this is still insufficient, it uses the requested minimum capacity. It allocates a new byte[]/char[] array and copies existing contents via System.arraycopy.",
        "seniorAnswer": [
          "Growth formula: (oldCapacity * 2) + 2.",
          "Default initial capacity: 16 characters.",
          "Pre-size large buffers: new StringBuilder(estimatedLength) to eliminate array copy churn."
        ],
        "codeSnippet": "StringBuilder sb = new StringBuilder(); // capacity = 16\nsb.append(\"12345678901234567\"); // 17 chars -> resizes: (16 * 2) + 2 = 34!",
        "trap": "StringBuilder capacity expands via (oldCapacity * 2) + 2; pre-size to avoid array copy churn."
      },
      {
        "id": "q-sb-3",
        "difficulty": "Senior",
        "title": "Is StringBuffer Truly 'Thread-Safe' Across Compound Operations?",
        "question": "Does using StringBuffer prevent race conditions when two threads perform compound operations like if (sb.length() > 0) sb.delete(0, 1)?",
        "interviewerIntent": "Distinguishing individual synchronized method safety from compound operation safety (Check-Then-Act).",
        "juniorTrap": "Believing StringBuffer makes all multi-threaded string manipulation automatically safe.",
        "problem": "StringIndexOutOfBoundsException thrown even when using StringBuffer across threads!",
        "innerWorking": "Each individual method (length(), delete()) is synchronized. But between thread 1 calling sb.length() and sb.delete(), thread 2 can call sb.delete(), reducing the length! Thread 1 then attempts to delete out-of-bounds characters, crashing with StringIndexOutOfBoundsException.",
        "seniorAnswer": [
          "Individual methods are synchronized; compound operations are NOT atomic.",
          "Check-then-act operations still require external client-side synchronization: synchronized(sb).",
          "Sharing mutable string buffers across threads is an architectural anti-pattern anyway."
        ],
        "codeSnippet": "// BROKEN across threads even with StringBuffer:\nif (sb.length() > 0) {\n    // Thread 2 can empty buffer here!\n    sb.deleteCharAt(0); // THROWS StringIndexOutOfBoundsException!\n}",
        "trap": "StringBuffer synchronizes individual methods, not compound operations; check-then-act still requires external locking."
      },
      {
        "id": "q-sb-4",
        "difficulty": "Senior",
        "title": "StringBuilder with Multi-Threading: ArrayIndexOutOfBoundsException & Data Loss",
        "question": "What happens when multiple threads call sb.append() on a shared StringBuilder without synchronization?",
        "interviewerIntent": "Analyzing non-thread-safe array mutations under concurrency.",
        "juniorTrap": "Thinking characters just get interleaved in order.",
        "problem": "Silent data loss, corrupted string output, or ArrayIndexOutOfBoundsException.",
        "innerWorking": "StringBuilder.append() does: value[count++] = char. count++ is NOT atomic (it is a non-atomic read-modify-write). Two threads can read the same count, overwrite each other's characters (lost updates), or increment count beyond value.length, triggering ArrayIndexOutOfBoundsException.",
        "seniorAnswer": [
          "count++ is not atomic; causes race conditions and lost characters.",
          "Can advance count beyond internal buffer length, throwing ArrayIndexOutOfBoundsException.",
          "Never share StringBuilder across threads; use thread-local instances."
        ],
        "codeSnippet": "// Multi-threaded append on StringBuilder throws:\n// Exception in thread \"main\" java.lang.ArrayIndexOutOfBoundsException",
        "trap": "Sharing StringBuilder across threads causes silent data corruption or ArrayIndexOutOfBoundsException."
      },
      {
        "id": "q-sb-5",
        "difficulty": "Staff Level",
        "title": "JVM Escape Analysis and Lock Elision on StringBuffer",
        "question": "Can the HotSpot JIT compiler optimize away the synchronization overhead of StringBuffer? How does Lock Elision work?",
        "interviewerIntent": "Understanding C2 JIT optimization, escape analysis, and lock elimination.",
        "juniorTrap": "Believing synchronized methods always execute OS mutex operations.",
        "problem": "Assuming StringBuffer is always 10x slower than StringBuilder in compiled code.",
        "innerWorking": "If a StringBuffer is created and used locally inside a method without escaping, JIT Escape Analysis proves NoEscape. The JIT performs Lock Elision: it completely removes all synchronized monitor enter/exit instructions from the compiled native machine code!",
        "seniorAnswer": [
          "Escape Analysis detects if an object escapes the creating thread.",
          "If NoEscape, JIT eliminates synchronization completely via Lock Elision.",
          "However, writing StringBuilder is still cleaner, faster in interpreted mode, and idiomatic."
        ],
        "codeSnippet": "public String build() {\n    // JIT Lock Elision completely removes synchronized locks here!\n    StringBuffer sb = new StringBuffer();\n    sb.append(\"a\");\n    return sb.toString();\n}",
        "trap": "HotSpot JIT Escape Analysis removes StringBuffer synchronization via Lock Elision if it does not escape the method."
      },
      {
        "id": "q-sb-6",
        "difficulty": "Senior",
        "title": "CharSequence Interface Polymorphism",
        "question": "Why do modern Java APIs (like String.join(), RegEx, and formatting) accept CharSequence rather than String or StringBuilder?",
        "interviewerIntent": "Understanding interface-based abstraction for character sequences.",
        "juniorTrap": "Converting StringBuilder to String via .toString() before passing to APIs.",
        "problem": "Allocating redundant intermediate String objects just to pass to a method.",
        "innerWorking": "CharSequence is the common read-only interface implemented by String, StringBuilder, StringBuffer, and CharBuffer. Accepting CharSequence allows methods to read character data directly from a StringBuilder without forcing an expensive .toString() heap allocation.",
        "seniorAnswer": [
          "CharSequence provides read-only character sequence abstraction.",
          "Eliminates redundant .toString() memory allocations.",
          "Implemented by String, StringBuilder, StringBuffer, CharBuffer."
        ],
        "codeSnippet": "StringBuilder sb = new StringBuilder(\"data\");\n// NO NEED to call sb.toString()! String.join accepts CharSequence directly:\nString result = String.join(\",\", sb, \"extra\");",
        "trap": "APIs accepting CharSequence can consume StringBuilder directly without calling .toString()."
      },
      {
        "id": "q-sb-7",
        "difficulty": "Senior",
        "title": "Pre-Sizing StringBuilder for Known Payloads",
        "question": "What is the memory and CPU impact of building a 100,000-character JSON string without passing an initial capacity to StringBuilder?",
        "interviewerIntent": "Practical latency tuning and GC allocation churn avoidance.",
        "juniorTrap": "Using new StringBuilder() with default capacity 16.",
        "problem": "Repeated array allocations (16 -> 34 -> 70 -> 142...) triggering thousands of System.arraycopy operations and GC allocations.",
        "innerWorking": "Starting at 16, reaching 100,000 requires ~14 successive array allocations and array copies, generating ~200KB of discarded temporary garbage arrays. Pre-sizing new StringBuilder(100000) allocates exactly ONE array, copies zero times, and creates zero garbage.",
        "seniorAnswer": [
          "Default capacity 16 causes repeated array reallocations and copies.",
          "Pre-sizing eliminates intermediate garbage allocations.",
          "Critical in high-throughput JSON/XML serialization pipelines."
        ],
        "codeSnippet": "// OPTIMAL: Single allocation, zero arraycopy churn\nStringBuilder json = new StringBuilder(estimatedChars);",
        "trap": "Always pre-size StringBuilder when expected size is known to avoid repeated array allocations and copies."
      },
      {
        "id": "q-sb-8",
        "difficulty": "Senior",
        "title": "setLength(0) vs new StringBuilder() for Buffer Reuse",
        "question": "Is it faster to reuse a StringBuilder by calling sb.setLength(0) or to instantiate a new StringBuilder() in a loop?",
        "interviewerIntent": "Evaluating object reuse vs GC generational hypothesis trade-offs.",
        "juniorTrap": "Assuming object pooling/reuse is always faster than creating new short-lived objects.",
        "problem": "Holding onto oversized StringBuilders causing memory retention leaks.",
        "innerWorking": "sb.setLength(0) simply resets the internal count index to 0 without freeing the underlying array. If the buffer previously expanded to 5MB, it retains that 5MB buffer forever. In modern HotSpot JVMs, allocating small temporary objects in Eden space is lightning-fast, and garbage is collected in Minor GC with zero cost.",
        "seniorAnswer": [
          "setLength(0) retains the maximum capacity the buffer ever reached (potential memory leak).",
          "Eden allocation for short-lived StringBuilder is extremely fast.",
          "Use setLength(0) only in tight, performance-critical loops with predictable sizes."
        ],
        "codeSnippet": "// Reusing oversized buffer holds memory:\nsb.setLength(0); // Keeps internal byte[5MB] alive indefinitely!",
        "trap": "sb.setLength(0) resets the count but retains the internal array size, potentially leaking memory."
      },
      {
        "id": "q-sb-9",
        "difficulty": "Senior",
        "title": "toString() Implementation in StringBuilder: Shared Array Optimization",
        "question": "Does StringBuilder.toString() copy the internal array or share it with the returned String in modern Java?",
        "interviewerIntent": "Understanding memory safety during toString() conversion.",
        "juniorTrap": "Thinking toString() shares the array without copying.",
        "problem": "Assuming modifying the builder after toString() might mutate the returned String.",
        "innerWorking": "Prior to Java 5, String and StringBuffer shared the array with a shared flag (copy-on-write). In modern Java (Compact Strings), StringBuilder.toString() ALWAYS creates a truncated copy of the buffer via Arrays.copyOfRange to guarantee that subsequent mutations to the builder do not mutate the immutable String.",
        "seniorAnswer": [
          "Modern Java always copies the array on toString().",
          "Guarantees that subsequent builder mutations do not corrupt the returned String.",
          "Ensures String immutability is never violated."
        ],
        "codeSnippet": "StringBuilder sb = new StringBuilder(\"hello\");\nString s = sb.toString(); // Allocates clean, truncated copy!\nsb.append(\" world\");\nSystem.out.println(s); // Still \"hello\"!",
        "trap": "StringBuilder.toString() always allocates a truncated copy of the array to guarantee String immutability."
      },
      {
        "id": "q-sb-10",
        "difficulty": "Senior",
        "title": "append(null) vs append((String) null)",
        "question": "What does sb.append(null) do? Why does sb.append((char[]) null) throw NullPointerException while sb.append((String) null) prints \"null\"?",
        "interviewerIntent": "Testing method overloading resolution differences for null.",
        "juniorTrap": "Expecting both calls to behave identically.",
        "problem": "NullPointerException thrown when passing null char array to StringBuilder.",
        "innerWorking": "append(String s) handles null gracefully by appending the 4 characters 'n', 'u', 'l', 'l'. However, append(char[] str) does NOT null-check and immediately calls str.length, throwing NullPointerException!",
        "seniorAnswer": [
          "sb.append((String) null) appends the literal characters \"null\".",
          "sb.append((char[]) null) throws NullPointerException.",
          "Overload resolution selects different methods with differing null contracts."
        ],
        "codeSnippet": "StringBuilder sb = new StringBuilder();\nsb.append((String) null); // Appends \"null\" safely!\n// sb.append((char[]) null); // THROWS NullPointerException!",
        "trap": "sb.append((String) null) appends \"null\"; sb.append((char[]) null) throws NullPointerException."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 11. Autoboxing/unboxing pitfalls
  # --------------------------------------------------------------------------
  {
    "topicId": "autoboxing-unboxing-pitfalls",
    "topicTitle": "Autoboxing/unboxing pitfalls",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on Silent NPEs, Performance Loops, Equality Pitfalls & HashMap Lookups.",
    "questions": [
      {
        "id": "q-box-1",
        "difficulty": "Senior",
        "title": "Silent NullPointerException during Implicit Unboxing",
        "question": "Why does Integer count = null; int total = count; compile cleanly but throw NullPointerException at runtime?",
        "interviewerIntent": "Understanding compiler bytecode synthesis (intValue()) for unboxing.",
        "juniorTrap": "Believing compiler checks prevent null assignments to primitives.",
        "problem": "Production NPE on lines with no explicit method calls or dereferences.",
        "innerWorking": "The compiler automatically transforms int total = count into int total = count.intValue(). If count is null, invoking intValue() on a null reference throws NullPointerException at runtime. The compiler cannot detect this statically.",
        "seniorAnswer": [
          "Unboxing generates implicit .xxxValue() method call.",
          "Invoking on null throws NullPointerException at runtime.",
          "Always guard with null checks or use Objects.requireNonNullElse()."
        ],
        "codeSnippet": "Integer count = null;\n// Compiles to: int total = count.intValue();\nint total = count; // THROWS NullPointerException!",
        "trap": "Assigning a null wrapper to a primitive compiles cleanly but throws NPE at runtime via implicit .intValue()."
      },
      {
        "id": "q-box-2",
        "difficulty": "Senior",
        "title": "Autoboxing Overhead in Computational Loops",
        "question": "What is the severe performance defect in: Long sum = 0L; for(long i=0; i<Integer.MAX_VALUE; i++) sum += i;?",
        "interviewerIntent": "Diagnosing massive memory allocation churn from loop autoboxing.",
        "juniorTrap": "Thinking sum += i runs in registers like a primitive loop.",
        "problem": "Program runs 10x slower and creates 2 billion temporary Long objects on the heap, triggering continuous GC pauses.",
        "innerWorking": "Because sum is declared as Long (wrapper), sum += i unboxes sum, performs addition, and autoboxes the result back to a new Long: sum = Long.valueOf(sum.longValue() + i). This creates 2,147,483,647 temporary Long instances on the heap!",
        "seniorAnswer": [
          "Creates 2+ billion temporary wrapper objects on the heap.",
          "Triggers continuous minor GC pauses and burns memory bandwidth.",
          "Fix: Declare primitive: long sum = 0L; (runs in nanoseconds in CPU registers)."
        ],
        "codeSnippet": "// SLOW (Creates 2B Long objects):\nLong sum = 0L;\nfor (long i = 0; i < Integer.MAX_VALUE; i++) sum += i;\n\n// FAST (Zero heap allocations, CPU registers):\nlong fastSum = 0L;\nfor (long i = 0; i < Integer.MAX_VALUE; i++) fastSum += i;",
        "trap": "Declaring accumulator variables as wrapper types in loops creates billions of temporary heap objects."
      },
      {
        "id": "q-box-3",
        "difficulty": "Senior",
        "title": "Ternary Operator Implicit Unboxing Coercion",
        "question": "Why does boolean condition = false; Integer val = null; int result = condition ? val : 0; evaluate to 0, but if condition is true it throws NPE?",
        "interviewerIntent": "Mastery of JLS §15.25 conditional operator type rules.",
        "juniorTrap": "Assuming the ternary expression preserves the wrapper type.",
        "problem": "Unconditional NPE when condition evaluates to true.",
        "innerWorking": "When one branch is an Integer and the other is an int primitive, JLS rules state the overall expression type is primitive int. Therefore, javac compiles the val branch to val.intValue(). When condition is true, val.intValue() executes on null, throwing NullPointerException.",
        "seniorAnswer": [
          "Mixed wrapper and primitive branches coerce the expression to primitive type.",
          "Causes implicit unboxing on the wrapper branch.",
          "Ensure both branches return matching wrapper types: condition ? val : Integer.valueOf(0)."
        ],
        "codeSnippet": "Integer val = null;\nboolean flag = true;\n// Compiles to: flag ? val.intValue() : 0;\nint x = flag ? val : 0; // THROWS NullPointerException!",
        "trap": "Ternary operator mixing wrappers and primitives unboxes the wrapper, throwing NPE if it is null."
      },
      {
        "id": "q-box-4",
        "difficulty": "Senior",
        "title": "Comparison Operators (<, >, <=, >=) Unbox Both Operands",
        "question": "Why does Integer a = new Integer(10); Integer b = new Integer(10); evaluate (a <= b) to true, but (a == b) to false?",
        "interviewerIntent": "Contrasting relational comparison operators vs equality operators on wrappers.",
        "juniorTrap": "Assuming that if a <= b and a >= b are true, then a == b must be true.",
        "problem": "Contradictory comparison logic confusing developers.",
        "innerWorking": "Relational operators (<, >, <=, >=) are defined ONLY for primitives. When comparing wrappers with relational operators, BOTH are unboxed: a.intValue() <= b.intValue() (10 <= 10 is true). However, equality (==) is defined for Objects, so a == b compares object references (distinct heap addresses = false)!",
        "seniorAnswer": [
          "Relational operators (<, <=, >, >=) unbox wrappers to primitives.",
          "Equality (==) on two wrappers checks object reference identity.",
          "a <= b and a >= b can both be true while a == b is false!"
        ],
        "codeSnippet": "Integer a = new Integer(10);\nInteger b = new Integer(10);\nSystem.out.println(a <= b); // true! (Unboxed: 10 <= 10)\nSystem.out.println(a >= b); // true! (Unboxed: 10 >= 10)\nSystem.out.println(a == b); // false! (Reference identity!)",
        "trap": "Relational operators unbox wrappers; equality (==) does not, leading to cases where a <= b is true but a == b is false."
      },
      {
        "id": "q-box-5",
        "difficulty": "Senior",
        "title": "Method Overloading: Widening vs Autoboxing Precedence",
        "question": "Given void test(int a, Integer b) and void test(Integer a, int b), what does test(10, 10) do?",
        "interviewerIntent": "Testing ambiguous multi-parameter overload resolution.",
        "juniorTrap": "Thinking one method is chosen based on parameter order.",
        "problem": "Compilation error: reference to test is ambiguous.",
        "innerWorking": "For test(10, 10), method 1 requires autoboxing argument 2. Method 2 requires autoboxing argument 1. Neither method is more specific than the other across all parameters. JLS §15.12.2 rejects the call as ambiguous.",
        "seniorAnswer": [
          "Compiler cannot choose between symmetric boxing requirements.",
          "Compilation error: reference is ambiguous.",
          "Must explicitly cast: test(10, (Integer) 10)."
        ],
        "codeSnippet": "void test(int a, Integer b) {}\nvoid test(Integer a, int b) {}\n// test(10, 10); // COMPILE ERROR: Ambiguous call!",
        "trap": "Overloaded methods requiring symmetric autoboxing across multiple arguments fail compilation as ambiguous."
      },
      {
        "id": "q-box-6",
        "difficulty": "Senior",
        "title": "Boolean Wrapper in if Conditions (NPE Hazard)",
        "question": "What happens when Boolean flag = null; if (flag) { ... } is executed?",
        "interviewerIntent": "Highlighting dangerous control-flow unboxing on Boolean wrappers.",
        "juniorTrap": "Thinking null behaves like 'false' (like in JavaScript or Python).",
        "problem": "Unexpected NullPointerException on an if statement.",
        "innerWorking": "The if statement in Java strictly requires a primitive boolean condition. if (flag) is compiled to: if (flag.booleanValue()). If flag is null, calling booleanValue() throws NullPointerException at runtime.",
        "seniorAnswer": [
          "if conditions strictly require primitive boolean.",
          "Throws NullPointerException if Boolean wrapper is null.",
          "Safe guard: if (Boolean.TRUE.equals(flag)) avoids NPE."
        ],
        "codeSnippet": "Boolean flag = null;\n// if (flag) {} // THROWS NullPointerException!\nif (Boolean.TRUE.equals(flag)) { // Safe! Evaluates to false without NPE\n}",
        "trap": "Using a null Boolean wrapper in an if condition throws NullPointerException; use Boolean.TRUE.equals(flag)."
      },
      {
        "id": "q-box-7",
        "difficulty": "Senior",
        "title": "Collections.remove(Object) vs List.remove(int index)",
        "question": "Given List<Integer> list = new ArrayList<>(List.of(1, 2, 3)); what does list.remove(1) do vs list.remove(Integer.valueOf(1))?",
        "interviewerIntent": "Testing signature collision between index-based removal and object-based removal in Lists.",
        "juniorTrap": "Assuming list.remove(1) removes the number 1.",
        "problem": "Removing element at index 1 (value 2) instead of the number 1, or IndexOutOfBoundsException.",
        "innerWorking": "List has two overloaded remove methods: 1) E remove(int index) - removes by index. 2) boolean remove(Object o) - removes by value equality. Passing int 1 invokes the primitive index-based remove(int), removing the element at index 1 (value 2)! Passing Integer.valueOf(1) invokes remove(Object), removing the value 1.",
        "seniorAnswer": [
          "list.remove(1) calls index-based remove(int); removes item at index 1.",
          "list.remove(Integer.valueOf(1)) calls object-based remove(Object); removes value 1.",
          "Severe trap in List<Integer> collections."
        ],
        "codeSnippet": "List<Integer> list = new ArrayList<>(List.of(10, 20, 30));\nlist.remove(1); // Removes index 1 (value 20)! List is now [10, 30]\nlist.remove(Integer.valueOf(10)); // Removes object 10! List is now [30]",
        "trap": "list.remove(1) removes by index; list.remove(Integer.valueOf(1)) removes by object value."
      },
      {
        "id": "q-box-8",
        "difficulty": "Senior",
        "title": "Autoboxing in Map.getOrDefault() Primitive Pitfall",
        "question": "Why does long val = map.getOrDefault(\"key\", null); throw NullPointerException when map is Map<String, Long>?",
        "interviewerIntent": "Analyzing implicit unboxing of fallback default values.",
        "juniorTrap": "Assuming getOrDefault returning null assigns null safely.",
        "problem": "NullPointerException thrown when key is missing, despite using getOrDefault.",
        "innerWorking": "map.getOrDefault(\"key\", null) returns null of type Long when the key is absent. Because val is declared as primitive long, Java attempts to unbox the returned Long via .longValue(), throwing NullPointerException on null!",
        "seniorAnswer": [
          "getOrDefault returns null when key is absent.",
          "Assigning to primitive unboxes null, throwing NPE.",
          "Provide primitive default: map.getOrDefault(\"key\", 0L)."
        ],
        "codeSnippet": "Map<String, Long> map = new HashMap<>();\n// long val = map.getOrDefault(\"missing\", null); // THROWS NPE on unboxing!\nlong val = map.getOrDefault(\"missing\", 0L); // SAFE!",
        "trap": "Returning null from getOrDefault to a primitive variable causes implicit unboxing and throws NPE."
      },
      {
        "id": "q-box-9",
        "difficulty": "Staff Level",
        "title": "Autoboxing with Varargs Array Allocation Overhead",
        "question": "Why is calling MessageFormat.format(\"Hello {0}, count: {1}\", \"User\", 42) inefficient in low-latency systems?",
        "interviewerIntent": "Identifying compound autoboxing and Object[] varargs heap churn.",
        "juniorTrap": "Assuming format strings are compiled to direct string concatenations.",
        "problem": "Millions of short-lived Object[] arrays and Integer wrappers generated on high-frequency log paths.",
        "innerWorking": "Varargs compiles to creating an Object[] array. Furthermore, primitive 42 must be autoboxed to Integer.valueOf(42). Every single call allocates an Object[2] array and boxes all primitive arguments into heap objects.",
        "seniorAnswer": [
          "Varargs allocates Object[] array on every invocation.",
          "Primitives are autoboxed into heap objects.",
          "Low-latency logging frameworks (Log4j2 / SLF4J) provide unboxed overloads: info(String, Object, long) to eliminate array allocation."
        ],
        "codeSnippet": "// Allocates Object[] array + boxes 42 to Integer:\nlog.info(\"User {} count {}\", user, 42); \n// Log4j2 provides primitive overloads to avoid boxing!",
        "trap": "Varargs methods accepting primitives incur both array allocation and autoboxing heap overhead."
      },
      {
        "id": "q-box-10",
        "difficulty": "Senior",
        "title": "Identity Comparison (==) with Autoboxed Variables",
        "question": "Why does Integer a = 1000; Integer b = 1000; System.out.println(a == b); print false, but Integer a = 10; Integer b = 10; prints true?",
        "interviewerIntent": "Reiterating the core invariant of autoboxing identity vs caching.",
        "juniorTrap": "Believing autoboxing always returns identical objects for identical numbers.",
        "problem": "Deceptive passes in test environments masking catastrophic failures in production.",
        "innerWorking": "Autoboxing calls Integer.valueOf(int). The JVM caches instances only between -128 and 127. Values outside this range allocate fresh heap instances with distinct memory addresses, causing == to evaluate to false.",
        "seniorAnswer": [
          "Autoboxing caches only [-128, 127].",
          "Values outside this range create distinct objects.",
          "Always use .equals() for wrapper comparisons."
        ],
        "codeSnippet": "Integer a = 1000, b = 1000;\nSystem.out.println(a == b); // false! Distinct heap objects!\nSystem.out.println(a.equals(b)); // true! Values equal!",
        "trap": "Autoboxed integers outside [-128, 127] allocate distinct heap objects; == fails."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 12. Checked vs. unchecked exceptions
  # --------------------------------------------------------------------------
  {
    "topicId": "checked-vs-unchecked-exceptions",
    "topicTitle": "Checked vs. unchecked exceptions",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on SneakyThrows, Lambda Boundaries, Bytecode athrow & Recovery Contracts.",
    "questions": [
      {
        "id": "q-exc-1",
        "difficulty": "Staff Level",
        "title": "Does the JVM Bytecode Enforce Checked Exceptions?",
        "question": "Does JVM bytecode distinguish between checked and unchecked exceptions? What happens if you throw IOException via athrow without declaring it?",
        "interviewerIntent": "Testing whether the candidate understands compiler enforcement vs JVM execution semantics.",
        "juniorTrap": "Believing the JVM verifies checked exception signatures at runtime and halts execution.",
        "problem": "Confusion regarding how frameworks throw checked exceptions without throws declarations.",
        "innerWorking": "The JVM bytecode instruction athrow treats ALL instances of java.lang.Throwable identically. There is NO concept of checked vs unchecked exceptions inside the JVM engine. Checked exception enforcement is 100% a compile-time check performed by javac.",
        "seniorAnswer": [
          "Checked exceptions exist ONLY in the javac compiler.",
          "JVM athrow bytecode instruction handles all Throwables identically.",
          "Exploited by Lombok @SneakyThrows and bytecode manipulation tools."
        ],
        "codeSnippet": "// Bytecode instruction is identical for ALL exceptions:\n// athrow",
        "trap": "Checked exceptions are a compiler construct; JVM bytecode treats all exceptions identically."
      },
      {
        "id": "q-exc-2",
        "difficulty": "Staff Level",
        "title": "Lombok @SneakyThrows Generic Type Erasure Hack",
        "question": "How does Lombok's @SneakyThrows throw checked exceptions without declaring them in a throws clause?",
        "interviewerIntent": "Understanding generics type erasure to bypass compiler checked exception rules.",
        "juniorTrap": "Thinking Lombok rewrites the exception to a RuntimeException.",
        "problem": "Catching RuntimeException fails to catch a sneaky-thrown IOException!",
        "innerWorking": "It casts the Throwable to a generic type <T extends Throwable> and throws it: ((T) throwable). During compilation, javac erases T to RuntimeException (unchecked), allowing compilation without a throws clause. At runtime, the original checked exception is thrown directly!",
        "seniorAnswer": [
          "Exploits generic type erasure: <E extends Throwable> void sneak(Throwable t) throws E { throw (E)t; }.",
          "Javac erases E to RuntimeException, passing compile check.",
          "Original checked exception is thrown unchanged; caller catch(RuntimeException) will NOT catch it!"
        ],
        "codeSnippet": "@SuppressWarnings(\"unchecked\")\npublic static <E extends Throwable> void sneakyThrow(Throwable e) throws E {\n    throw (E) e; // Erased to (Throwable) e at runtime!\n}\n// Calling sneakyThrow(new IOException()) throws checked exception without 'throws' clause!",
        "trap": "SneakyThrows throws the actual checked exception without wrapping; catch(RuntimeException) will miss it."
      },
      {
        "id": "q-exc-3",
        "difficulty": "Senior",
        "title": "Functional Interfaces and Checked Exceptions Barrier",
        "question": "Why cannot standard Java 8 Streams and Lambdas (like Function<T,R> or Consumer<T>) throw checked exceptions? What is the idiom to handle them?",
        "interviewerIntent": "Evaluating functional programming limitations in Java and error-wrapping strategies.",
        "juniorTrap": "Surrounding the lambda with try-catch outside the stream.",
        "problem": "Compilation error inside stream: unhandled exception type IOException.",
        "innerWorking": "The Single Abstract Method in Function<T,R> (R apply(T t)) does not declare any throws clause in its interface definition. Therefore, any checked exception thrown inside the lambda violates the SAM signature, causing compilation failure.",
        "seniorAnswer": [
          "Standard functional interfaces lack throws clauses.",
          "Must catch and rethrow as UncheckedIOException or custom RuntimeException.",
          "Alternatively, use a functional wrapper utility or Vavr Try/Either."
        ],
        "codeSnippet": "list.stream().map(file -> {\n    try {\n        return Files.readString(file);\n    } catch (IOException e) {\n        throw new UncheckedIOException(e); // Wrap in unchecked exception!\n    }\n});",
        "trap": "Lambdas cannot throw checked exceptions unless the target functional interface declares them in its SAM."
      },
      {
        "id": "q-exc-4",
        "difficulty": "Senior",
        "title": "Architectural Intent: Checked vs Unchecked Exception Contract",
        "question": "What is the official architectural guideline for choosing between a checked exception and an unchecked exception?",
        "interviewerIntent": "Evaluating exception design philosophy and modern software engineering consensus.",
        "juniorTrap": "Using checked exceptions for every possible business error.",
        "problem": "Polluting 20 layers of method signatures with throws OrderProcessingException.",
        "innerWorking": "Official rule: Use checked exceptions for conditions from which the caller can reasonably be expected to RECOVER (e.g. FileNotFound -> prompt user for new path). Use unchecked exceptions (RuntimeException) for programming bugs, precondition failures, or unrecoverable conditions (e.g. NullPointerException, DatabaseDown). Modern consensus heavily favors unchecked exceptions.",
        "seniorAnswer": [
          "Checked: Expected, recoverable business conditions.",
          "Unchecked: Programming defects, invariant violations, unrecoverable system failures.",
          "Modern frameworks (Spring, Hibernate) use unchecked exceptions exclusively to prevent signature pollution."
        ],
        "codeSnippet": "// Checked: Caller MUST handle or recover\npublic User loadUser(File f) throws FileNotFoundException;\n// Unchecked: Unrecoverable programming error\npublic void process(Order o) { Objects.requireNonNull(o); }",
        "trap": "Use checked exceptions only for recoverable conditions; modern frameworks favor unchecked exceptions."
      },
      {
        "id": "q-exc-5",
        "difficulty": "Senior",
        "title": "Transaction Rollback Rules in Spring (@Transactional)",
        "question": "Why does Spring @Transactional roll back automatically for unchecked exceptions, but COMMITS for checked exceptions by default?",
        "interviewerIntent": "Connecting Java exception types to enterprise database transaction lifecycles.",
        "juniorTrap": "Assuming @Transactional rolls back for ANY thrown exception.",
        "problem": "Database changes committed to the database despite throwing a business exception!",
        "innerWorking": "Spring EJB/transaction convention assumes checked exceptions represent business outcomes from which the application can recover (so data is committed). Unchecked exceptions (RuntimeException, Error) represent fatal programming bugs and trigger rollback. To roll back on checked exceptions, use @Transactional(rollbackFor = Exception.class).",
        "seniorAnswer": [
          "Default Spring rollback: RuntimeException and Error ONLY.",
          "Checked exceptions commit the transaction by default!",
          "Fix: Always configure @Transactional(rollbackFor = Exception.class)."
        ],
        "codeSnippet": "@Transactional // COMMITS transaction if CustomCheckedException is thrown!\npublic void transfer() throws CustomCheckedException {}\n\n@Transactional(rollbackFor = Exception.class) // ROLLS BACK for all exceptions!\npublic void safeTransfer() throws CustomCheckedException {}",
        "trap": "Spring @Transactional commits for checked exceptions by default; specify rollbackFor = Exception.class."
      },
      {
        "id": "q-exc-6",
        "difficulty": "Senior",
        "title": "Exception Chaining and Preserving the Root Cause",
        "question": "What critical information is lost when writing catch (IOException e) { throw new RuntimeException(e.getMessage()); }?",
        "interviewerIntent": "Testing knowledge of exception chaining and root-cause debugging.",
        "juniorTrap": "Passing e.getMessage() instead of the exception object 'e' itself.",
        "problem": "Production log displays only generic message; original stack trace and line number of root cause are completely erased!",
        "innerWorking": "new RuntimeException(e.getMessage()) creates a brand-new exception with a fresh stack trace starting at the throw statement. The original root cause, cause hierarchy, and exact failure line in IOException are lost. Always pass 'e' as the cause: new RuntimeException(e).",
        "seniorAnswer": [
          "Passing e.getMessage() drops the root cause stack trace.",
          "Always pass the Throwable cause: throw new RuntimeException(\"Failed\", e);.",
          "Enables Throwable.getCause() inspection and full nested stack trace printing."
        ],
        "codeSnippet": "// BAD: Drops original stack trace\ncatch (SQLException e) { throw new RuntimeException(e.getMessage()); }\n// GOOD: Preserves entire cause chain\ncatch (SQLException e) { throw new RuntimeException(\"Database failure\", e); }",
        "trap": "Passing e.getMessage() instead of 'e' to a new exception destroys the original root-cause stack trace."
      },
      {
        "id": "q-exc-7",
        "difficulty": "Staff Level",
        "title": "Cost of fillInStackTrace() in High-Throughput Systems",
        "question": "Why is throwing exceptions expensive in Java, and how does overriding fillInStackTrace() improve performance by 100x for control-flow exceptions?",
        "interviewerIntent": "Understanding JVM stack traversal overhead and zero-cost lightweight exceptions.",
        "juniorTrap": "Believing creating new Exception() is expensive because of object allocation.",
        "problem": "Severe CPU degradation when using exceptions for business control-flow.",
        "innerWorking": "Creating an exception is slow because Throwable constructor invokes native fillInStackTrace(). The JVM walks the entire native thread call stack frame by frame to record class names, method names, and line numbers. Overriding public synchronized Throwable fillInStackTrace() { return this; } bypasses stack walking entirely, making exception creation 100x faster.",
        "seniorAnswer": [
          "fillInStackTrace() walks the OS thread stack; responsible for 90%+ of exception creation cost.",
          "In high-frequency control flow, override fillInStackTrace() to return 'this'.",
          "Used in high-performance reactive libraries (Netty, Disruptor)."
        ],
        "codeSnippet": "public class LightweightException extends RuntimeException {\n    @Override\n    public synchronized Throwable fillInStackTrace() {\n        return this; // Skips native stack walk! 100x faster instantiation!\n    }\n}",
        "trap": "Exception performance overhead comes from walking the call stack in fillInStackTrace(), not from object allocation."
      },
      {
        "id": "q-exc-8",
        "difficulty": "Senior",
        "title": "Empty catch Blocks and Silent Failure Anti-Pattern",
        "question": "Why is catch (Exception e) {} (swallowing exceptions) considered a critical production anti-pattern?",
        "interviewerIntent": "Evaluating production operational hygiene and diagnostic logging.",
        "juniorTrap": "Swallowing exceptions to prevent thread crashes or test failures.",
        "problem": "Silent data corruption where transactions fail without any log output or alerts.",
        "innerWorking": "Swallowing exceptions erases the failure from observability. Subsequent code executes assuming preconditions succeeded, compounding errors, corrupting database states, or leaking resources. At minimum, log the exception or wrap in an unchecked exception.",
        "seniorAnswer": [
          "Silently swallowed exceptions cause phantom data corruption and impossible debugging.",
          "If an exception is truly ignorable, document why and log at DEBUG level.",
          "Never leave catch blocks empty."
        ],
        "codeSnippet": "// CATASTROPHIC ANTI-PATTERN:\ntry { transferFunds(); } catch (Exception e) {} // Silent failure! Nobody knows money wasn't sent!",
        "trap": "Never swallow exceptions with empty catch blocks; it hides failures and causes silent data corruption."
      },
      {
        "id": "q-exc-9",
        "difficulty": "Senior",
        "title": "Multi-Catch Block and Final Exception Binding",
        "question": "What is the restriction on the exception variable in a multi-catch block: catch (IOException | SQLException e)?",
        "interviewerIntent": "Verifying JLS §14.20 multi-catch syntax rules.",
        "juniorTrap": "Trying to reassign e = new IOException() inside a multi-catch block.",
        "problem": "Compilation error: multi-catch parameter e is implicitly final.",
        "innerWorking": "In a multi-catch block catch (TypeA | TypeB e), the parameter e is implicitly final. You cannot reassign e to another value inside the catch block. Furthermore, alternative exception types cannot have a subclass relationship (e.g. IOException | FileNotFoundException is a compile error).",
        "seniorAnswer": [
          "Multi-catch parameter is implicitly final; cannot be reassigned.",
          "Alternatives cannot be subtypes of each other (must be disjoint).",
          "Type of 'e' is the common supertype of the alternatives."
        ],
        "codeSnippet": "try { /* ... */ }\ncatch (IOException | SQLException e) {\n    // e = new IOException(); // COMPILE ERROR! Parameter is implicitly final.\n    log.error(\"IO or SQL failed\", e);\n}",
        "trap": "The exception parameter in a multi-catch block is implicitly final and cannot be reassigned."
      },
      {
        "id": "q-exc-10",
        "difficulty": "Senior",
        "title": "Catching java.lang.Throwable or java.lang.Error Hazard",
        "question": "Why should applications almost never catch java.lang.Throwable or java.lang.Error (like OutOfMemoryError or StackOverflowError)?",
        "interviewerIntent": "Differentiating fatal JVM errors from catchable application exceptions.",
        "juniorTrap": "Writing catch (Throwable t) everywhere in business logic.",
        "problem": "Catching OutOfMemoryError or ThreadDeath and continuing execution in a corrupted, unstable JVM state.",
        "innerWorking": "java.lang.Error represents serious, unrecoverable JVM problems (OutOfMemoryError, InternalError, StackOverflowError). The JVM state is unstable, locks may be held, and memory is corrupted. Catching Error prevents the JVM from shutting down cleanly or crashes subsequent threads unpredictably.",
        "seniorAnswer": [
          "Errors represent catastrophic JVM faults; application cannot recover.",
          "Catching Error prevents proper container health checks and pod restarts.",
          "Catch java.lang.Exception for application failures; leave Errors to JVM top-level handlers."
        ],
        "codeSnippet": "// DANGEROUS:\ncatch (Throwable t) { /* Catches OutOfMemoryError and keeps corrupted JVM running! */ }\n// SAFE:\ncatch (Exception e) { /* Catches standard application failures */ }",
        "trap": "Never catch Throwable or Error; fatal JVM errors like OutOfMemoryError leave the runtime in an unstable state."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 13. try-with-resources
  # --------------------------------------------------------------------------
  {
    "topicId": "try-with-resources",
    "topicTitle": "try-with-resources",
    "category": "Strings, Wrappers & Exceptions",
    "summary": "10 Tricky Questions on AutoCloseable, Exception Suppression, Reverse Order & finally Hijacking.",
    "questions": [
      {
        "id": "q-twr-1",
        "difficulty": "Senior",
        "title": "Exception Suppression Mechanics in Try-With-Resources",
        "question": "If both the try block and AutoCloseable.close() throw exceptions, which exception is thrown to the caller and where does the other go?",
        "interviewerIntent": "Testing knowledge of Throwable.addSuppressed() and getSuppressed().",
        "juniorTrap": "Assuming the close() exception overwrites the try block exception (like in legacy try-finally).",
        "problem": "Root cause exception being swallowed by cleanup failure.",
        "innerWorking": "In try-with-resources, the exception from the try block is the PRIMARY exception thrown to the caller. The exception from close() is caught by synthesized bytecode and attached to the primary exception as a suppressed exception via primary.addSuppressed(closeException).",
        "seniorAnswer": [
          "Try block exception is primary; close() exception is suppressed.",
          "Accessible via e.getSuppressed().",
          "In legacy try-finally, finally exception completely erased the try exception!"
        ],
        "codeSnippet": "try (var res = new FaultyResource()) {\n    throw new RuntimeException(\"Try Failed!\"); // Primary\n}\n// In caller: catch (Exception e) {\n//   e.getMessage() -> \"Try Failed!\"\n//   e.getSuppressed()[0].getMessage() -> \"Close Failed!\"\n// }",
        "trap": "In try-with-resources, the try block exception is primary; close() failures are attached as suppressed exceptions."
      },
      {
        "id": "q-twr-2",
        "difficulty": "Senior",
        "title": "Reverse Order of Resource Closure",
        "question": "Given try (ResA a = new ResA(); ResB b = new ResB()), in what exact order are a and b closed?",
        "interviewerIntent": "Testing JLS §14.20.3 resource closure order.",
        "juniorTrap": "Assuming resources are closed in order of declaration (a then b).",
        "problem": "Closing dependencies out of order (e.g. closing connection before closing statement).",
        "innerWorking": "Resources are closed in REVERSE order of declaration. ResB is closed first, then ResA. This mirrors natural stack unwinding and ensures dependent resources (wrappers, statements) close before their underlying dependencies (streams, connections).",
        "seniorAnswer": [
          "Resources close in strictly REVERSE order of initialization.",
          "b.close() executes first; then a.close().",
          "Ensures dependent wrappers flush before underlying streams close."
        ],
        "codeSnippet": "try (Connection conn = getConn(); // Closed 2nd\n     Statement stmt = conn.createStmt()) { // Closed 1st!\n    stmt.execute();\n}",
        "trap": "Resources declared in try-with-resources are closed in reverse order of declaration."
      },
      {
        "id": "q-twr-3",
        "difficulty": "Senior",
        "title": "AutoCloseable vs Closeable Contract Differences",
        "question": "What is the difference between java.lang.AutoCloseable and java.io.Closeable?",
        "interviewerIntent": "Contrasting Java 7 AutoCloseable with Java 5 Closeable.",
        "juniorTrap": "Thinking both are interchangeable.",
        "problem": "Forcing non-I/O resources to throw IOException.",
        "innerWorking": "1) Closeable (Java 5) extends AutoCloseable; its close() throws IOException and is idempotent. 2) AutoCloseable (Java 7) close() throws Exception and is NOT required to be idempotent (though recommended). Any class implementing either can be used in try-with-resources.",
        "seniorAnswer": [
          "AutoCloseable.close() throws Exception; Closeable.close() throws IOException.",
          "Closeable requires idempotency; AutoCloseable recommends it.",
          "Implement AutoCloseable for general resources; Closeable for I/O streams."
        ],
        "codeSnippet": "// AutoCloseable: void close() throws Exception;\n// Closeable: void close() throws IOException;",
        "trap": "AutoCloseable.close() throws Exception; Closeable.close() is restricted to IOException."
      },
      {
        "id": "q-twr-4",
        "difficulty": "Senior",
        "title": "Execution Timing of close() vs catch and finally Blocks",
        "question": "In try (Resource r = new Resource()) { ... } catch (Exception e) { ... } finally { ... }, does r.close() execute BEFORE or AFTER catch and finally?",
        "interviewerIntent": "Understanding synthesized bytecode execution sequence.",
        "juniorTrap": "Assuming r.close() executes after the catch or finally block.",
        "problem": "Attempting to use the resource inside catch or finally when it is already closed.",
        "innerWorking": "r.close() executes BEFORE any catch or finally blocks! The synthesized bytecode wraps the try block in its own inner try-finally that calls close(). Catch and finally blocks execute AFTER the resource has already been closed.",
        "seniorAnswer": [
          "close() runs BEFORE the catch block executes.",
          "close() runs BEFORE the finally block executes.",
          "Any resource accessed inside catch/finally is already closed."
        ],
        "codeSnippet": "try (var r = new Resource()) {\n    throw new Exception();\n} catch (Exception e) {\n    // r.close() HAS ALREADY RUN before this line executes!\n}",
        "trap": "Resources in try-with-resources are closed BEFORE catch and finally blocks execute."
      },
      {
        "id": "q-twr-5",
        "difficulty": "Senior",
        "title": "Effectively Final Resources in Java 9+",
        "question": "What syntactic enhancement did Java 9 introduce for try-with-resources variables initialized outside the try statement?",
        "interviewerIntent": "Testing modern Java 9 syntax improvements (JEP 213).",
        "juniorTrap": "Declaring duplicate dummy variables inside try header in Java 9+.",
        "problem": "Verbosity in Java 7/8 requiring re-assignment: try (Resource r2 = r) {}.",
        "innerWorking": "In Java 7/8, variables managed by try-with-resources HAD to be declared in the try header. In Java 9+, if a resource variable is final or effectively final, you can pass it directly into the try header: try (r) {}.",
        "seniorAnswer": [
          "Java 9 allows final or effectively final variables in try header.",
          "No need to re-declare: try (resource) instead of try (Res r = resource).",
          "Variable must not be reassigned after declaration."
        ],
        "codeSnippet": "Resource r = new Resource(); // Effectively final\n// Java 9+ Concise syntax:\ntry (r) {\n    r.doWork();\n} // r is closed automatically!",
        "trap": "In Java 9+, effectively final resources declared outside try can be passed directly into the try header."
      },
      {
        "id": "q-twr-6",
        "difficulty": "Senior",
        "title": "Finally Block Returning or Throwing Swallowing Suppressed Exceptions",
        "question": "What happens if a try-with-resources block has an explicit finally block containing 'return 42;' or 'throw new CustomException()'?",
        "interviewerIntent": "Understanding control-flow hijacking by finally blocks.",
        "juniorTrap": "Assuming try-with-resources prevents finally from hijacking exceptions.",
        "problem": "Both the primary exception AND all suppressed close() exceptions are completely discarded!",
        "innerWorking": "An explicit return or throw in a finally block unconditionally aborts any in-flight exception handling. Even though try-with-resources carefully captured primary and suppressed exceptions, finally { return; } wipes the slate clean, swallowing all failures.",
        "seniorAnswer": [
          "finally return or throw wipes out primary AND suppressed exceptions.",
          "Completely breaks exception diagnostics.",
          "Never place return or throw inside a finally block."
        ],
        "codeSnippet": "try (var r = new FaultyResource()) {\n    throw new RuntimeException(\"Real Failure\");\n} finally {\n    return; // DANGER: Swallows Real Failure AND close() exceptions!\n}",
        "trap": "A return or throw in finally completely swallows both primary and suppressed exceptions in try-with-resources."
      },
      {
        "id": "q-twr-7",
        "difficulty": "Senior",
        "title": "Null Resource Handling in Try-With-Resources",
        "question": "What happens if a resource declared in try-with-resources evaluates to null (e.g. try (Resource r = null))?",
        "interviewerIntent": "Testing null-safety in synthesized bytecode.",
        "juniorTrap": "Assuming the JVM throws NullPointerException when calling r.close().",
        "problem": "Adding manual null checks around try-with-resources unnecessarily.",
        "innerWorking": "The synthesized bytecode explicitly generates a null check: if (r != null) r.close(). If the resource is null, close() is simply skipped without throwing NullPointerException.",
        "seniorAnswer": [
          "Synthesized bytecode performs null check before calling close().",
          "Passing null resource does not throw NullPointerException.",
          "Safe to initialize with methods that may return null."
        ],
        "codeSnippet": "Resource r = null;\ntry (r) { \n    // Runs fine; close() is skipped because r is null!\n}",
        "trap": "try-with-resources safely checks for null before invoking close(); null resources do not trigger NPE."
      },
      {
        "id": "q-twr-8",
        "difficulty": "Staff Level",
        "title": "AutoCloseable Idempotency Contract Violation",
        "question": "What happens if close() is NOT idempotent, and why does AutoCloseable Javadoc strongly recommend idempotency?",
        "interviewerIntent": "Evaluating safe resource lifecycle design and defensive cleanup.",
        "juniorTrap": "Assuming close() will only ever be called once.",
        "problem": "Calling close() a second time throwing unexpected IllegalStateException or double-freeing native memory.",
        "innerWorking": "AutoCloseable recommends that close() be idempotent (calling it multiple times has no side effect). If a resource is wrapped (e.g. BufferedReader wrapping FileReader), closing the outer stream closes the inner stream. If the inner stream was also managed by try-with-resources, its close() is called twice! Non-idempotent close() crashes.",
        "seniorAnswer": [
          "Idempotency: Calling close() more than once must be a no-op.",
          "Wrapping streams cause inner streams to be closed twice.",
          "Always guard close() with: if (closed) return; closed = true;."
        ],
        "codeSnippet": "public void close() {\n    if (!closed) {\n        closed = true;\n        releaseNativeResources();\n    }\n}",
        "trap": "AutoCloseable.close() must be idempotent because wrapped streams can trigger duplicate close() invocations."
      },
      {
        "id": "q-twr-9",
        "difficulty": "Senior",
        "title": "Closing Unmanaged Resources Leaking in Constructor Failure",
        "question": "In try (ResA a = new ResA(); ResB b = new ResB(a)), what happens if ResB's constructor throws an exception?",
        "interviewerIntent": "Testing partial initialization cleanup in multi-resource try headers.",
        "juniorTrap": "Thinking ResA leaks memory because try block was never entered.",
        "problem": "Resource leaks during constructor failure.",
        "innerWorking": "If ResA initializes successfully, but ResB's constructor throws an exception, the synthesized bytecode catches the exception and immediately invokes a.close() before propagating the constructor failure! ResA is safely closed.",
        "seniorAnswer": [
          "Successfully initialized resources in the header are closed even if subsequent header initializers fail.",
          "Guarantees no resource leakage during chained constructor failures.",
          "Mirror image of stack unwinding."
        ],
        "codeSnippet": "try (var a = new SafeResource(); // Closed successfully!\n     var b = new FailingResource()) { // Throws in constructor!\n    // Never reached\n}",
        "trap": "If a second resource constructor fails in the try header, the first resource is safely closed automatically."
      },
      {
        "id": "q-twr-10",
        "difficulty": "Senior",
        "title": "Synthesized Bytecode Disassembly of Try-With-Resources",
        "question": "What does 'javap -c' reveal about the bytecode generated by try-with-resources?",
        "interviewerIntent": "Understanding the complex synthetic bytecode generated by javac.",
        "juniorTrap": "Thinking try-with-resources is a runtime JVM feature.",
        "problem": "Assuming special bytecode instructions exist for AutoCloseable.",
        "innerWorking": "There is no special bytecode instruction for try-with-resources. Javac desugars the statement into a standard try-catch-finally block with explicit null-checks, Throwable.addSuppressed() invocations, and synthetic exception handlers.",
        "seniorAnswer": [
          "Purely compile-time syntactic sugar desugared into complex nested try-catch-finally.",
          "Generates synthetic exception handler tables.",
          "Injects addSuppressed() calls to attach secondary exceptions."
        ],
        "codeSnippet": "// Bytecode shows:\n// invokevirtual #7 // Method java/lang/Throwable.addSuppressed:(Ljava/lang/Throwable;)V\n// invokeinterface #8, 1 // InterfaceMethod java/lang/AutoCloseable.close:()V",
        "trap": "try-with-resources is compile-time syntactic sugar desugared into nested try-finally with addSuppressed() calls."
      }
    ]
  }
]
