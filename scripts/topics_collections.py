# scripts/topics_collections.py
# Category: Collections (6 Topics x 10 Questions = 60 Questions)

TOPICS_COLLECTIONS = [
  # --------------------------------------------------------------------------
  # 14. HashMap internals (hashing, collision, resizing, treeification)
  # --------------------------------------------------------------------------
  {
    "topicId": "hashmap-internals",
    "topicTitle": "HashMap internals (hashing, collision, resizing, treeification)",
    "category": "Collections",
    "summary": "10 Tricky Questions on Bitwise Hash Spread, Power-of-2 Table Math, Treeification (8/6/64) & Resizing.",
    "questions": [
      {
        "id": "q-hmap-1",
        "difficulty": "Staff Level",
        "title": "Why the Bitwise Hash Spread Formula: (h ^ (h >>> 16))?",
        "question": "Why does HashMap XOR the top 16 bits of hashCode() with the lower 16 bits before calculating the bucket index?",
        "interviewerIntent": "Testing knowledge of bitwise hash spreading to prevent clustering.",
        "juniorTrap": "Assuming HashMap simply uses key.hashCode() % table.length directly.",
        "problem": "Severe bucket collisions when hashCode() variations occur only in the higher-order bits.",
        "innerWorking": "Bucket index is computed as (n - 1) & hash. Since default capacity n = 16 (bits 00001111), only the lowest 4 bits determine the bucket! If keys have differing higher bits but identical lowest 4 bits, they all collide on the same bucket. XORing (h ^ (h >>> 16)) folds high-order bit entropy into low-order bits, distributing entries evenly.",
        "seniorAnswer": [
          "Folds upper 16-bit entropy into lower 16 bits.",
          "Protects against poor hash functions where differences exist only in upper bits.",
          "Cost: 1 shift + 1 XOR instruction (negligible CPU cost)."
        ],
        "codeSnippet": "static final int hash(Object key) {\n    int h;\n    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);\n}",
        "trap": "Without (h ^ (h >>> 16)), only the lowest bits of hashCode() influence bucket index in small tables."
      },
      {
        "id": "q-hmap-2",
        "difficulty": "Senior",
        "title": "Why Must HashMap Capacity Always Be a Power of 2?",
        "question": "Why does HashMap strictly enforce table capacity as a power of 2 (16, 32, 64...), and what bitwise optimization does it enable?",
        "interviewerIntent": "Comparing modulo operator (%) vs bitwise AND (&) performance.",
        "juniorTrap": "Thinking power-of-2 is an arbitrary convention.",
        "problem": "Modulo arithmetic (%) taking 10-20 CPU clock cycles on every put() and get().",
        "innerWorking": "When capacity n is a power of 2, hash % n is mathematically equivalent to (n - 1) & hash. Bitwise AND (&) executes in 1 single CPU clock cycle, whereas integer division/modulo takes 15-30 cycles. If n were not a power of 2, (n - 1) would not be all 1s (e.g. 15 is 01111), and certain buckets would never receive entries.",
        "seniorAnswer": [
          "Enables (n - 1) & hash instead of hash % n.",
          "Bitwise AND takes 1 CPU cycle; modulo takes up to 30 cycles.",
          "Ensures all bit positions can participate uniformly in indexing."
        ],
        "codeSnippet": "// If capacity = 16: (16 - 1) in binary is 00001111\n// Fast bitwise mask: index = hash & 15;",
        "trap": "Capacity must be a power of 2 so (n - 1) forms a complete bitmask, replacing slow modulo with fast bitwise AND."
      },
      {
        "id": "q-hmap-3",
        "difficulty": "Staff Level",
        "title": "Treeification Thresholds: Why 8 to Treeify, 6 to Untreeify, and MIN_TREEIFY_CAPACITY 64?",
        "question": "What are the exact criteria required to convert a LinkedList bucket to a Red-Black Tree in Java 8?",
        "interviewerIntent": "Testing knowledge of Poisson distribution math and treeification constraints.",
        "juniorTrap": "Believing a bucket treeifies immediately on the 8th collision regardless of table size.",
        "problem": "Misdiagnosing treeification vs resizing behavior.",
        "innerWorking": "Treeification requires TWO conditions: 1) Bucket chain length >= 8 (TREEIFY_THRESHOLD). 2) Total table capacity >= 64 (MIN_TREEIFY_CAPACITY). If chain >= 8 but capacity < 64, it RESIZES the table instead of treeifying! When resizing shrinks a tree bucket to <= 6 (UNTREEIFY_THRESHOLD), it reverts to a LinkedList.",
        "seniorAnswer": [
          "Under random hashes (Poisson distribution), probability of 8 collisions is 1 in 10 million (0.0000006).",
          "If capacity < 64, HashMap resizes rather than treeifying to alleviate collisions.",
          "Hysteresis gap (8 to treeify, 6 to untreeify) prevents thrashing between tree and list on frequent add/remove."
        ],
        "codeSnippet": "// static final int TREEIFY_THRESHOLD = 8;\n// static final int UNTREEIFY_THRESHOLD = 6;\n// static final int MIN_TREEIFY_CAPACITY = 64;",
        "trap": "A bucket will NOT treeify if table capacity < 64; it resizes the table instead."
      },
      {
        "id": "q-hmap-4",
        "difficulty": "Staff Level",
        "title": "Java 8 No-Rehash Resize Mechanics: (e.hash & oldCap) == 0",
        "question": "How does Java 8 resize a HashMap without recomputing key hashes or re-evaluating hash % newCap?",
        "interviewerIntent": "Understanding high-performance bitwise bucket split mechanics during resizing.",
        "juniorTrap": "Assuming Java 8 re-runs the hash formula for all elements during resize.",
        "problem": "Performance bottleneck during table doubling.",
        "innerWorking": "Because capacity doubles (power of 2), the new bitmask adds exactly 1 bit to the left (e.g. 16 -> 32 adds the 16-bit). By testing (e.hash & oldCap) == 0, if the result is 0, the element stays at index i. If non-zero, it moves to index i + oldCap. Elements are neatly divided into two new sub-lists (low-head and high-head) and spliced directly without recomputing hashes.",
        "seniorAnswer": [
          "Tests a single bit: (e.hash & oldCap) == 0.",
          "Bit is 0 -> Stays at index i.",
          "Bit is 1 -> Moves to index i + oldCap.",
          "Preserves original insertion order of elements within the bucket (unlike Java 7)."
        ],
        "codeSnippet": "// Java 8 resize partition:\nif ((e.hash & oldCap) == 0) {\n    // Placed in low-head (index i)\n} else {\n    // Placed in high-head (index i + oldCap)\n}",
        "trap": "Java 8 resizing splits buckets using '(hash & oldCap) == 0' without re-hashing elements."
      },
      {
        "id": "q-hmap-5",
        "difficulty": "Senior",
        "title": "Why Load Factor is 0.75 by Default",
        "question": "What is the mathematical and architectural tradeoff behind the default 0.75 load factor in HashMap?",
        "interviewerIntent": "Understanding the time vs space tradeoff in hash table design.",
        "juniorTrap": "Thinking 0.75 was picked randomly.",
        "problem": "Tuning load factor poorly causing memory waste (too low) or collision clustering (too high).",
        "innerWorking": "Load factor determines when to double capacity (threshold = capacity * loadFactor). 1) Higher factor (> 0.75): Saves memory, but increases collision frequency, degrading lookup times. 2) Lower factor (< 0.75): Decreases collisions, but triggers frequent resizing and wastes 50%+ of memory in empty buckets. 0.75 represents the optimal logarithmic median between space and search latency.",
        "seniorAnswer": [
          "Tradeoff: Space (memory footprint) vs Time (search latency).",
          "0.75 keeps Poisson collision probability for chain length > 8 at ~0.0000006.",
          "Rarely needs modification in standard enterprise applications."
        ],
        "codeSnippet": "// threshold = (int)(capacity * loadFactor);\n// 16 * 0.75 = 12 (Resizes when 13th element is inserted)",
        "trap": "Load factor 0.75 is the optimal mathematical balance between memory consumption and collision frequency."
      },
      {
        "id": "q-hmap-6",
        "difficulty": "Staff Level",
        "title": "Java 7 Infinite Loop Bug during Concurrent HashMap Resize",
        "question": "Why did concurrent puts to a standard HashMap in Java 7 cause 100% CPU lockup and infinite loops? How did Java 8 fix it?",
        "interviewerIntent": "Historical concurrency pathology in non-thread-safe collections.",
        "juniorTrap": "Believing multi-threaded puts on HashMap only cause lost data.",
        "problem": "Entire production JVM freezing at 100% CPU inside HashMap.get().",
        "innerWorking": "Java 7 used head-insertion for bucket linked lists during resize (transfer()). When two threads resized concurrently, pointer manipulation reversed the linked list order. Thread A paused while Thread B swapped pointers, creating a circular linked list (A -> B -> A). Any subsequent get() on that bucket entered an infinite loop, pegging CPU at 100%. Java 8 switched to tail-insertion, eliminating the circular pointer trap (though still not thread-safe).",
        "seniorAnswer": [
          "Java 7 head-insertion reversed lists during resize -> circular pointer loop (A -> B -> A).",
          "Caused infinite while loops during get() at 100% CPU.",
          "Java 8 uses tail-insertion preserving list order, preventing circular loops.",
          "Never use HashMap concurrently; use ConcurrentHashMap."
        ],
        "codeSnippet": "// Java 7 transfer() reversed order:\n// e.next = newTable[i]; newTable[i] = e; -> Circular reference A <-> B under concurrency!",
        "trap": "In Java 7, concurrent resizing created circular linked lists causing 100% CPU infinite loops; Java 8 uses tail-insertion."
      },
      {
        "id": "q-hmap-7",
        "difficulty": "Senior",
        "title": "Null Key and Value Handling in HashMap",
        "question": "Where does HashMap store a null key, and how many null keys/values can it hold?",
        "interviewerIntent": "Contrasting HashMap null mechanics with Hashtable, TreeMap, and ConcurrentHashMap.",
        "juniorTrap": "Thinking null key has a random hash or is not allowed.",
        "problem": "Assuming key.hashCode() is called on null, causing NullPointerException.",
        "innerWorking": "HashMap explicitly checks: if (key == null) return 0. It always assigns hash = 0 to null keys, placing them permanently in bucket 0 (index = 0). It supports exactly ONE null key (re-inserting overwrites previous value) and UNLIMITED null values.",
        "seniorAnswer": [
          "Null key always hashes to 0 and resides in bucket index 0.",
          "Supports 1 null key and multiple null values.",
          "TreeMap requires non-null keys (or custom comparator); Hashtable/ConcurrentHashMap forbid null completely."
        ],
        "codeSnippet": "Map<String, String> map = new HashMap<>();\nmap.put(null, \"First\");\nmap.put(null, \"Second\"); // Overwrites! Size is 1, value is \"Second\"",
        "trap": "HashMap allows exactly one null key (stored at bucket 0) and unlimited null values."
      },
      {
        "id": "q-hmap-8",
        "difficulty": "Senior",
        "title": "Comparable Tie-Breaking in Red-Black TreeNodes",
        "question": "How does HashMap order Red-Black TreeNodes when two keys collide on the same hash code?",
        "interviewerIntent": "Understanding Red-Black tree binary search tree insertion when hashes collide.",
        "juniorTrap": "Assuming HashMap only uses equals().",
        "problem": "Tree cannot balance without a comparison order.",
        "innerWorking": "If two keys have identical hash codes, HashMap checks if the key class implements Comparable. If so, it invokes k1.compareTo(k2). If keys do NOT implement Comparable (or compareTo returns 0), it uses tieBreakOrder(): comparing class names, and finally falling back to System.identityHashCode(k1) vs System.identityHashCode(k2).",
        "seniorAnswer": [
          "First checks: k1.compareTo(k2) if key implements Comparable.",
          "Fallback: tieBreakOrder() using System.identityHashCode().",
          "Implementing Comparable on custom keys speeds up tree operations."
        ],
        "codeSnippet": "// HashMap TreeNode tie-breaker fallback:\nstatic int tieBreakOrder(Object a, Object b) {\n    return System.identityHashCode(a) <= System.identityHashCode(b) ? -1 : 1;\n}",
        "trap": "When hashes collide in treeified buckets, HashMap uses Comparable or falls back to System.identityHashCode."
      },
      {
        "id": "q-hmap-9",
        "difficulty": "Senior",
        "title": "Pre-Sizing HashMap to Prevent Resizing (Math Formula)",
        "question": "If you know you will store exactly 1,000 entries, what initial capacity should you pass to new HashMap<>(initialCapacity)?",
        "interviewerIntent": "Calculating initial capacity factoring in load factor (0.75) and power-of-2 rounding.",
        "juniorTrap": "Passing 1,000 directly: new HashMap<>(1000).",
        "problem": "Table resizes when 750 entries are inserted (1000 * 0.75 = 750), causing an unnecessary resize.",
        "innerWorking": "Threshold = capacity * 0.75. To store 1,000 items without resizing: capacity >= 1000 / 0.75 = 1333.33. HashMap rounds up to the next power of 2: 2048! Passing new HashMap<>(2048) guarantees ZERO resizes. In Java 19+, use HashMap.newHashMap(1000) which computes this automatically.",
        "seniorAnswer": [
          "Formula: (expectedSize / 0.75) + 1, rounded to next power of 2.",
          "For 1,000 items: 1000 / 0.75 = 1334 -> rounds to 2048.",
          "Java 19+: Use HashMap.newHashMap(1000)."
        ],
        "codeSnippet": "// Java 19+ Built-in factory:\nMap<String, String> map = HashMap.newHashMap(1000); // Sets capacity = 2048 automatically!",
        "trap": "To store N items without resizing, pass (N / 0.75) + 1 rounded to the next power of 2."
      },
      {
        "id": "q-hmap-10",
        "difficulty": "Staff Level",
        "title": "HashDoS Vulnerability and the Java 8 Treeification Defense",
        "question": "What was the HashDoS attack that crippled Java web servers in 2011, and how does Java 8's treeification neutralize it?",
        "interviewerIntent": "Understanding algorithmic complexity attacks and security defenses.",
        "juniorTrap": "Thinking treeification was added purely for general performance.",
        "problem": "Attacker sending a small 2MB HTTP POST request containing 10,000 colliding form parameter keys locks web server CPU at 100% for minutes.",
        "innerWorking": "Attackers generated strings with identical hash codes (e.g. \"AaAa\", \"BBBB\"). Sending 20,000 colliding keys collapsed HashMap into a single 20,000-node linked list. Inserting 20,000 elements degraded from O(N) to O(N^2) complexity, freezing Tomcat. Java 8 introduced Red-Black trees: at 8 collisions, the chain becomes a tree, reducing lookup and insertion from O(N) to O(log N) and neutralizing HashDoS.",
        "seniorAnswer": [
          "HashDoS exploited O(N^2) linked list degradation under crafted hash collisions.",
          "Java 8 treeification caps worst-case lookup and insertion at O(log N).",
          "Turned an algorithmic denial-of-service attack into an irrelevant operation."
        ],
        "codeSnippet": "// In Java 7: 10,000 colliding keys took 30+ seconds of 100% CPU (O(N^2))\n// In Java 8: 10,000 colliding keys take <5 milliseconds (O(N log N) via Red-Black Tree)!",
        "trap": "Treeification in Java 8 was primarily introduced to neutralize HashDoS algorithmic attacks from O(N) to O(log N)."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 15. ConcurrentHashMap vs. Collections.synchronizedMap
  # --------------------------------------------------------------------------
  {
    "topicId": "concurrenthashmap-vs-synchronizedmap",
    "topicTitle": "ConcurrentHashMap vs. Collections.synchronizedMap",
    "category": "Collections",
    "summary": "10 Tricky Questions on CAS Node Locking, Doug Lea Null Philosophy, Deadlocks in computeIfAbsent & Iterator Consistency.",
    "questions": [
      {
        "id": "q-chm-1",
        "difficulty": "Senior",
        "title": "Locking Mechanism: Single Mutex vs CAS & Synchronized Node",
        "question": "How does ConcurrentHashMap's locking model in Java 8 differ from Collections.synchronizedMap?",
        "interviewerIntent": "Comparing global mutex bottleneck vs bucket-level striping and lock-free CAS.",
        "juniorTrap": "Thinking ConcurrentHashMap still uses Segment[] locks like Java 7.",
        "problem": "Single mutex in synchronizedMap bottlenecking all reading and writing threads.",
        "innerWorking": "Collections.synchronizedMap wraps all methods in a single global mutex (synchronized(mutex)). ConcurrentHashMap (Java 8): 1) Reads are 100% lock-free (volatile reads). 2) Empty bucket insertion uses lock-free CAS. 3) Collision insertion locks ONLY the first node of the bucket: synchronized(firstNode). Other buckets remain fully accessible concurrently.",
        "seniorAnswer": [
          "synchronizedMap serializes all threads through a single monitor lock.",
          "ConcurrentHashMap reads are non-blocking; writes lock only the specific bucket head node.",
          "Java 7 used 16 Segment locks; Java 8 locks individual bin nodes for infinite granularity."
        ],
        "codeSnippet": "// ConcurrentHashMap insertion:\n// 1. If bin empty: CAS(tabAt(i), null, newNode)\n// 2. If bin non-empty: synchronized(f) { insert into list/tree }",
        "trap": "ConcurrentHashMap locks only the head node of colliding buckets; synchronizedMap blocks the entire map."
      },
      {
        "id": "q-chm-2",
        "difficulty": "Senior",
        "title": "Why Null Keys and Values are Strictly Forbidden in ConcurrentHashMap",
        "question": "Why does ConcurrentHashMap throw NullPointerException for null keys and values while HashMap allows them?",
        "interviewerIntent": "Understanding Doug Lea's concurrency ambiguity philosophy.",
        "juniorTrap": "Saying it was an oversight or stylistic choice.",
        "problem": "Race condition when determining whether a key is mapped to null or missing.",
        "innerWorking": "In a non-concurrent map, map.get(key) == null can be disambiguated with map.containsKey(key). In a concurrent map, another thread could insert or remove the key between get() and containsKey()! The state cannot be atomically verified. Disallowing null eliminates this race condition completely.",
        "seniorAnswer": [
          "Eliminates ambiguity between 'key mapped to null' and 'key absent'.",
          "containsKey() cannot be atomically paired with get() without locking the entire map.",
          "Throws NullPointerException immediately on null key or value."
        ],
        "codeSnippet": "ConcurrentHashMap<String, String> chm = new ConcurrentHashMap<>();\n// chm.put(null, \"v\"); // THROWS NullPointerException!\n// chm.put(\"k\", null); // THROWS NullPointerException!",
        "trap": "ConcurrentHashMap forbids null keys and values to prevent race conditions during key presence checks."
      },
      {
        "id": "q-chm-3",
        "difficulty": "Staff Level",
        "title": "Deadlock in ConcurrentHashMap.computeIfAbsent()",
        "question": "How can calling computeIfAbsent() recursively on the same ConcurrentHashMap cause a permanent thread freeze/deadlock?",
        "interviewerIntent": "Diagnosing recursive computeIfAbsent deadlocks in Java 8.",
        "juniorTrap": "Assuming computeIfAbsent can be nested freely.",
        "problem": "Application threads hanging permanently on computeIfAbsent with no CPU usage.",
        "innerWorking": "computeIfAbsent locks the head node of the bucket while executing the mapping function. If the mapping function attempts to insert another key that hashes to the SAME bucket (or in Java 8, calls computeIfAbsent on the same map), the thread attempts to acquire the lock it already holds or waits on bucket status, triggering a self-deadlock or live-lock!",
        "seniorAnswer": [
          "Mapping function runs inside the bucket lock.",
          "Nested computeIfAbsent on the same map or colliding bucket causes permanent deadlock.",
          "Keep mapping functions short, pure, and free of recursive map mutations."
        ],
        "codeSnippet": "ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();\n// DEADLOCK HANG:\nmap.computeIfAbsent(\"AaAa\", key -> {\n    return map.computeIfAbsent(\"BBBB\", k2 -> 42); // Same bucket hash collision -> DEADLOCK!\n});",
        "trap": "Calling computeIfAbsent recursively on the same ConcurrentHashMap or colliding bucket causes a silent deadlock."
      },
      {
        "id": "q-chm-4",
        "difficulty": "Senior",
        "title": "Weakly Consistent Iterators vs ConcurrentModificationException",
        "question": "Why does iterating over ConcurrentHashMap NEVER throw ConcurrentModificationException, and what does 'weakly consistent' mean?",
        "interviewerIntent": "Contrasting fail-fast vs weakly consistent iterators.",
        "juniorTrap": "Thinking ConcurrentHashMap takes a full copy of the map on iteration.",
        "problem": "Expecting an iterator to reflect a frozen point-in-time snapshot.",
        "innerWorking": "ConcurrentHashMap iterators are 'weakly consistent'. They do not clone the map and do not check modCount. 1) They will never throw ConcurrentModificationException. 2) They traverse elements as they existed at iterator creation. 3) They MAY (or may not) reflect mutations that occur after the iterator was constructed. 4) Each element is returned at most once.",
        "seniorAnswer": [
          "Never throws ConcurrentModificationException.",
          "Weakly consistent: reflects state at or since creation without taking expensive copies.",
          "Safe to mutate map while iterating."
        ],
        "codeSnippet": "for (String key : chm.keySet()) {\n    chm.remove(key); // Perfectly legal! No ConcurrentModificationException thrown!\n}",
        "trap": "ConcurrentHashMap iterators are weakly consistent and never throw ConcurrentModificationException."
      },
      {
        "id": "q-chm-5",
        "difficulty": "Senior",
        "title": "size() vs mappingCount() in High Concurrency",
        "question": "Why does mappingCount() exist in ConcurrentHashMap alongside size(), and why is size() capped at Integer.MAX_VALUE?",
        "interviewerIntent": "Evaluating high-concurrency counter mechanics (CounterCell).",
        "juniorTrap": "Using size() without realizing it casts internally to int.",
        "problem": "Maps holding more than 2 billion entries returning Integer.MAX_VALUE from size().",
        "innerWorking": "ConcurrentHashMap uses a striped CounterCell[] array (like LongAdder) to track size without thread contention. size() returns int, capped at Integer.MAX_VALUE (2,147,483,647). mappingCount() returns long, allowing accurate representation of ultra-large concurrent caches exceeding 2 billion entries.",
        "seniorAnswer": [
          "size() returns int, capped at Integer.MAX_VALUE.",
          "mappingCount() returns long, designed for massive modern caches.",
          "Both estimate size concurrently without blocking writes."
        ],
        "codeSnippet": "long total = chm.mappingCount(); // Returns accurate long count!",
        "trap": "Prefer mappingCount() over size() in ConcurrentHashMap; mappingCount() returns long and avoids int overflow."
      },
      {
        "id": "q-chm-6",
        "difficulty": "Senior",
        "title": "Compound Operations Race Condition: putIfAbsent vs get and put",
        "question": "Why is if (!map.containsKey(k)) map.put(k, v); broken in multi-threaded code even with ConcurrentHashMap?",
        "interviewerIntent": "Distinguishing individual method thread-safety from atomic check-then-act operations.",
        "juniorTrap": "Believing using ConcurrentHashMap automatically makes compound logic thread-safe.",
        "problem": "Race conditions where two threads both observe containsKey as false and overwrite each other's data.",
        "innerWorking": "containsKey() and put() are two distinct atomic operations. Between thread A's containsKey() and put(), thread B can execute put(). Thread A then executes put(), blindly overwriting thread B's update. Must use atomic compound operations: map.putIfAbsent(k, v) or map.computeIfAbsent(k, fn).",
        "seniorAnswer": [
          "Check-then-act logic is not atomic across multiple calls.",
          "Use atomic methods: putIfAbsent(), computeIfAbsent(), replace().",
          "ConcurrentHashMap methods are atomic individually, not sequentially."
        ],
        "codeSnippet": "// BROKEN:\nif (!chm.containsKey(key)) chm.put(key, val);\n// ATOMIC & SAFE:\nchm.putIfAbsent(key, val);",
        "trap": "Chaining individual ConcurrentHashMap methods (containsKey + put) is not atomic; use putIfAbsent()."
      },
      {
        "id": "q-chm-7",
        "difficulty": "Staff Level",
        "title": "ConcurrentHashMap Treeification: TreeBins and StampedLock Reservation",
        "question": "How does ConcurrentHashMap prevent concurrent writers from reading half-rotated Red-Black trees during treeification?",
        "interviewerIntent": "Deep knowledge of TreeBin wrapper nodes and read/write lock synchronization.",
        "juniorTrap": "Thinking TreeNode is synchronized like standard nodes.",
        "problem": "Concurrent readers reading corrupted tree pointers during balancing rotations.",
        "innerWorking": "ConcurrentHashMap wraps Red-Black trees inside a TreeBin node. TreeBin maintains a simplified read-write lock state (lockState). While a writer thread rotates the tree during rebalancing, reader threads do not block; instead, readers temporarily fall back to traversing the linear linked list (TreeBins preserve both a tree and a linear list link!), ensuring zero read blocking.",
        "seniorAnswer": [
          "TreeBin maintains dual representation: Red-Black tree AND linked list.",
          "If tree is undergoing rotation, readers cleanly traverse the linked list.",
          "Guarantees reads remain lock-free even during tree balancing."
        ],
        "codeSnippet": "// TreeBin maintains dual links: parent/left/right for tree, and next for linear list fallback!",
        "trap": "ConcurrentHashMap TreeBins maintain a dual linked list so readers can bypass active tree rotations without blocking."
      },
      {
        "id": "q-chm-8",
        "difficulty": "Senior",
        "title": "Iterating over synchronizedMap Requires Client-Side Locking",
        "question": "Why must iteration over Collections.synchronizedMap ALWAYS be enclosed in synchronized(map) block?",
        "interviewerIntent": "Reading Javadoc contracts on synchronized wrappers.",
        "juniorTrap": "Iterating over synchronizedMap without synchronizing, crashing with ConcurrentModificationException.",
        "problem": "ConcurrentModificationException thrown during iteration despite using synchronizedMap.",
        "innerWorking": "synchronizedMap synchronizes individual method calls (get, put). However, map.keySet().iterator() creates an iterator that traverses the map across multiple calls. Between iterator.hasNext() and next(), another thread can mutate the map, triggering fail-fast ConcurrentModificationException. The user must manually lock on the map object.",
        "seniorAnswer": [
          "synchronizedMap iterators are fail-fast and NOT synchronized.",
          "User MUST manually synchronize on the map object during iteration.",
          "In contrast, ConcurrentHashMap handles concurrent iteration safely without locking."
        ],
        "codeSnippet": "Map<String, String> syncMap = Collections.synchronizedMap(new HashMap<>());\n// MANDATORY:\nsynchronized (syncMap) {\n    for (String key : syncMap.keySet()) { /* safe */ }\n}",
        "trap": "Iterating over Collections.synchronizedMap must be manually wrapped in synchronized(map) to prevent CME."
      },
      {
        "id": "q-chm-9",
        "difficulty": "Senior",
        "title": "ConcurrentHashMap in Java 7 (Segments) vs Java 8 (Node Locks)",
        "question": "Why did Java 8 discard the Segment[] array architecture of ConcurrentHashMap?",
        "interviewerIntent": "Historical architectural evolution of HotSpot concurrency primitives.",
        "juniorTrap": "Still explaining the old 16-Segment architecture in modern interviews.",
        "problem": "Segment architecture wasted memory and capped concurrency at the segment count (concurrencyLevel).",
        "innerWorking": "In Java 7, ConcurrentHashMap used Segment[] (subclasses of ReentrantLock). Concurrency was limited to the number of segments (default 16). Each Segment added memory overhead. Java 8 removed Segments entirely, placing nodes directly in table[] array and synchronizing on individual bucket head nodes, providing virtually infinite concurrency granularity and reducing memory footprint.",
        "seniorAnswer": [
          "Java 7: 16 ReentrantLock Segments -> fixed concurrency level.",
          "Java 8: Synchronized node heads + CAS -> concurrency scales with table size.",
          "Substantially reduces memory overhead per empty map."
        ],
        "codeSnippet": "// Java 7: Segment<K,V>[] segments (each an explicit ReentrantLock)\n// Java 8: Node<K,V>[] table (CAS + synchronized(firstNode))",
        "trap": "Java 8 eliminated Segments from ConcurrentHashMap, locking individual bucket nodes via CAS and synchronized."
      },
      {
        "id": "q-chm-10",
        "difficulty": "Staff Level",
        "title": "ConcurrentHashMap.compute() Atomic Counter Pattern",
        "question": "How do you implement an atomic word frequency counter in ConcurrentHashMap without race conditions or lost updates?",
        "interviewerIntent": "Evaluating atomic in-place mutation using compute() or merge().",
        "juniorTrap": "Calling get(), incrementing, and calling put() (lost updates).",
        "problem": "Word counts losing increments under multi-threaded load.",
        "innerWorking": "chm.merge(word, 1, Integer::sum) or chm.compute(word, (k, v) -> v == null ? 1 : v + 1) runs the computation atomically inside the bucket node lock. It eliminates race conditions and avoids separate lookup and insertion steps.",
        "seniorAnswer": [
          "chm.merge(key, 1, Integer::sum) is atomic and idiomatic.",
          "Runs inside the bucket-level monitor, preventing lost updates.",
          "Much faster than managing external synchronized blocks or AtomicInteger holders."
        ],
        "codeSnippet": "// ATOMIC & THREAD-SAFE:\nchm.merge(word, 1, Integer::sum);\n// Alternatively:\nchm.compute(word, (k, v) -> (v == null) ? 1 : v + 1);",
        "trap": "Use chm.merge() or compute() for atomic counter updates; get-then-put suffers from lost updates."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 16. LinkedHashMap (for LRU cache implementation)
  # --------------------------------------------------------------------------
  {
    "topicId": "linkedhashmap-lru-cache",
    "topicTitle": "LinkedHashMap (for LRU cache implementation)",
    "category": "Collections",
    "summary": "10 Tricky Questions on Access Order, removeEldestEntry, Thread Safety, Doubly-Linked Lists & Memory.",
    "questions": [
      {
        "id": "q-lhmap-1",
        "difficulty": "Senior",
        "title": "accessOrder Flag Mechanics: Insertion Order vs Access Order",
        "question": "What does the 3rd boolean parameter in new LinkedHashMap<>(capacity, loadFactor, accessOrder) control?",
        "interviewerIntent": "Understanding internal doubly-linked list head/tail pointer rewiring.",
        "juniorTrap": "Thinking LinkedHashMap only preserves insertion order.",
        "problem": "Attempting to build an LRU cache without accessOrder = true, resulting in a FIFO queue.",
        "innerWorking": "By default, accessOrder = false (orders by insertion-order). When accessOrder = true, every get(), getOrDefault(), and put() removes the accessed entry from its current position in the doubly-linked list and re-inserts it at the tail (most recently used).",
        "seniorAnswer": [
          "accessOrder = false: Insertion-order (iteration matches put sequence).",
          "accessOrder = true: Access-order (iteration from least-recently to most-recently accessed).",
          "accessOrder = true is required for LRU cache implementation."
        ],
        "codeSnippet": "var lru = new LinkedHashMap<Integer, String>(16, 0.75f, true /* accessOrder */);\nlru.put(1, \"A\"); lru.put(2, \"B\");\nlru.get(1); // Moves key 1 to tail! Iteration order: [2, 1]",
        "trap": "accessOrder = true is mandatory for LRU caches; otherwise LinkedHashMap behaves as a FIFO queue."
      },
      {
        "id": "q-lhmap-2",
        "difficulty": "Senior",
        "title": "Building an O(1) LRU Cache via removeEldestEntry()",
        "question": "How do you implement an O(1) LRU Cache by overriding removeEldestEntry(Map.Entry eldest)?",
        "interviewerIntent": "Testing knowledge of the built-in eviction hook in LinkedHashMap.",
        "juniorTrap": "Writing a custom thread loop or manually deleting elements after put.",
        "problem": "Unnecessary manual size checks and deletion logic.",
        "innerWorking": "During put() and putAll(), after inserting the new entry, LinkedHashMap invokes removeEldestEntry(eldest). If this returns true, the eldest entry (the head of the doubly-linked list) is automatically evicted. Overriding return size() > maxCapacity gives instant O(1) LRU eviction.",
        "seniorAnswer": [
          "Override protected boolean removeEldestEntry(Map.Entry<K,V> eldest).",
          "Return size() > MAX_CAPACITY.",
          "Runs automatically inside put(); O(1) eviction."
        ],
        "codeSnippet": "public class SimpleLRU<K, V> extends LinkedHashMap<K, V> {\n    private final int max;\n    public SimpleLRU(int max) { super(max, 0.75f, true); this.max = max; }\n    @Override protected boolean removeEldestEntry(Map.Entry<K, V> e) {\n        return size() > max;\n    }\n}",
        "trap": "Override removeEldestEntry() to return 'size() > max' for automatic O(1) LRU eviction."
      },
      {
        "id": "q-lhmap-3",
        "difficulty": "Senior",
        "title": "LinkedHashMap is NOT Thread-Safe (ConcurrentModificationException on get)",
        "question": "Why can calling get() concurrently on an access-ordered LinkedHashMap throw ConcurrentModificationException even if NO thread is writing?",
        "interviewerIntent": "Understanding structural modification caused by read operations in access-ordered maps.",
        "juniorTrap": "Assuming get() is a read-only operation that cannot trigger CME.",
        "problem": "Multi-threaded reads on an LRU cache crashing with ConcurrentModificationException.",
        "innerWorking": "In access-order mode (accessOrder = true), get() mutates the internal doubly-linked list to move the accessed entry to the tail! It increments modCount. If another thread is iterating or reading, modCount mismatch throws ConcurrentModificationException. Calling get() IS a structural write in access-order mode!",
        "seniorAnswer": [
          "get() mutates the doubly-linked list pointers and increments modCount.",
          "get() is a structural modification in access-order mode.",
          "Must synchronize all access: Collections.synchronizedMap(new LRUCache<>())."
        ],
        "codeSnippet": "// Concurrent get() throws ConcurrentModificationException!\n// Fix: Wrap with synchronizedMap\nMap<K, V> safeLru = Collections.synchronizedMap(new SimpleLRU<>(100));",
        "trap": "Calling get() on access-ordered LinkedHashMap is a structural write that mutates pointers and increments modCount."
      },
      {
        "id": "q-lhmap-4",
        "difficulty": "Staff Level",
        "title": "Memory Overhead: LinkedHashMap Entry vs HashMap Node",
        "question": "What additional memory overhead does LinkedHashMap incur per entry compared to standard HashMap?",
        "interviewerIntent": "Evaluating HotSpot object layout and pointer overhead in memory-constrained systems.",
        "juniorTrap": "Assuming LinkedHashMap has the exact same memory footprint as HashMap.",
        "problem": "Underestimating heap memory consumption for millions of cache entries.",
        "innerWorking": "HashMap.Node has 4 fields: hash, key, value, next (32 bytes on 64-bit JVM with CompressedOOPs). LinkedHashMap.Entry extends HashMap.Node and adds TWO additional references: before and after (pointers for the doubly-linked list). This adds 16 bytes per entry (50% memory increase per node).",
        "seniorAnswer": [
          "Adds before and after pointers to maintain the doubly-linked list.",
          "Increases node footprint from ~32 bytes to ~48 bytes on 64-bit JVMs.",
          "For millions of entries, use Caffeine Cache or primitive off-heap structures."
        ],
        "codeSnippet": "// LinkedHashMap.Entry extends HashMap.Node:\n// Entry<K,V> before, after; // 2 additional 64-bit/compressed references per entry!",
        "trap": "LinkedHashMap nodes add 'before' and 'after' pointers, consuming ~50% more memory per entry than HashMap."
      },
      {
        "id": "q-lhmap-5",
        "difficulty": "Senior",
        "title": "Iteration Performance: LinkedHashMap vs HashMap",
        "question": "Why is iterating over a sparsely-populated LinkedHashMap faster than iterating over an equivalent HashMap?",
        "interviewerIntent": "Understanding iteration complexity: O(size) vs O(capacity).",
        "juniorTrap": "Assuming HashMap iteration is always faster because it lacks linked-list pointers.",
        "problem": "Slow iteration over a large-capacity HashMap holding very few entries.",
        "innerWorking": "Iterating over HashMap requires traversing ALL table buckets (O(capacity + size)), scanning empty buckets. Iterating over LinkedHashMap simply traverses the doubly-linked list from head to tail (O(size)), completely ignoring empty buckets.",
        "seniorAnswer": [
          "HashMap iteration time is proportional to capacity + size.",
          "LinkedHashMap iteration time is proportional strictly to size.",
          "Significantly faster when capacity is large and entries are few."
        ],
        "codeSnippet": "// If capacity = 1,000,000 and size = 10:\n// HashMap iterates 1,000,000 buckets (O(N) empty scans)\n// LinkedHashMap traverses exactly 10 pointers via 'after' link (O(10))",
        "trap": "LinkedHashMap iterates in O(size) by following linked list pointers; HashMap iterates in O(capacity + size)."
      },
      {
        "id": "q-lhmap-6",
        "difficulty": "Senior",
        "title": "containsKey() Does NOT Alter Access Order",
        "question": "Does calling containsKey(k) on an access-ordered LinkedHashMap move the key to the most-recently-used tail?",
        "interviewerIntent": "Verifying method-level access-order side-effects.",
        "juniorTrap": "Thinking all read methods update access order.",
        "problem": "Assuming containsKey() acts as a cache touch.",
        "innerWorking": "containsKey() does NOT update access order. Only get(), getOrDefault(), put(), and putIfAbsent() update the access order. containsKey() inspects bucket nodes without modifying doubly-linked list pointers.",
        "seniorAnswer": [
          "containsKey() does not touch access order.",
          "get() and put() update access order.",
          "Prevents probe operations from resetting LRU eviction priority."
        ],
        "codeSnippet": "lru.put(1, \"A\"); lru.put(2, \"B\");\nlru.containsKey(1); // Does NOT alter access order! Key 1 remains eldest!",
        "trap": "containsKey() does not update access order in LinkedHashMap; only get() and put() touch entries."
      },
      {
        "id": "q-lhmap-7",
        "difficulty": "Senior",
        "title": "put() on Existing Key in Insertion-Order Mode",
        "question": "In default insertion-order mode, does put(existingKey, newValue) move the key to the end of the list?",
        "interviewerIntent": "Testing JLS insertion-order specifications.",
        "juniorTrap": "Assuming updating a value moves the key to the tail in insertion-order mode.",
        "problem": "Assuming put() always acts as an insertion.",
        "innerWorking": "In insertion-order mode (accessOrder = false), re-inserting an existing key simply updates its value in-place. The key's original position in the iteration sequence is UNCHANGED. It only moves to the tail if the key was previously removed.",
        "seniorAnswer": [
          "Re-inserting existing key does not alter insertion order.",
          "Value is updated in-place.",
          "To move to tail, must explicitly remove() and put()."
        ],
        "codeSnippet": "var map = new LinkedHashMap<Integer, String>();\nmap.put(1, \"A\"); map.put(2, \"B\");\nmap.put(1, \"Updated\"); // Order is STILL [1, 2]!",
        "trap": "Updating an existing key in insertion-order LinkedHashMap does not change its position in the iteration order."
      },
      {
        "id": "q-lhmap-8",
        "difficulty": "Senior",
        "title": "Modifying Collection View During Iteration",
        "question": "What happens if you mutate a LinkedHashMap while iterating over its entrySet() using iterator.remove()?",
        "interviewerIntent": "Verifying safe modification patterns during iteration.",
        "juniorTrap": "Thinking iterator.remove() breaks the doubly-linked list.",
        "problem": "Fear that iterator.remove() is unsafe in LinkedHashMap.",
        "innerWorking": "iterator.remove() is 100% safe. It updates both the HashMap bucket table and the before/after pointers of the doubly-linked list, while keeping expectedModCount synchronized with modCount.",
        "seniorAnswer": [
          "iterator.remove() safely splices out doubly-linked list pointers.",
          "Does not throw ConcurrentModificationException.",
          "Idiomatic single-threaded removal pattern."
        ],
        "codeSnippet": "var it = map.entrySet().iterator();\nwhile (it.hasNext()) {\n    if (it.next().getKey().equals(1)) it.remove(); // 100% SAFE!\n}",
        "trap": "iterator.remove() is safe and properly splices out before/after pointers without CME."
      },
      {
        "id": "q-lhmap-9",
        "difficulty": "Staff Level",
        "title": "Caffeine Cache vs LinkedHashMap LRU",
        "question": "Why is LinkedHashMap LRU rejected for high-throughput multi-threaded caching, and how does Caffeine Cache solve it?",
        "interviewerIntent": "Comparing global synchronized map locks with Window TinyLFU and striped ring buffers.",
        "juniorTrap": "Using Collections.synchronizedMap(new LRU()) for high-throughput enterprise caches.",
        "problem": "Catastrophic thread contention: all reading threads serialize on a single synchronized lock to update access-order pointers.",
        "innerWorking": "Synchronizing LinkedHashMap forces every get() to acquire an exclusive lock, destroying concurrent read throughput. Caffeine Cache uses Window TinyLFU (W-TinyLFU) eviction and records cache reads into lock-free striped RingBuffers (similar to LongAdder), batching eviction maintenance asynchronously.",
        "seniorAnswer": [
          "Synchronized LinkedHashMap serializes reads on a single lock.",
          "Caffeine uses lock-free read buffers and asynchronous eviction.",
          "Caffeine provides higher hit rates with Window TinyLFU vs standard LRU."
        ],
        "codeSnippet": "// High-concurrency enterprise replacement:\nCache<String, Object> cache = Caffeine.newBuilder()\n    .maximumSize(10_000)\n    .expireAfterWrite(Duration.ofMinutes(10))\n    .build();",
        "trap": "Synchronized LinkedHashMap locks on every get(); use Caffeine Cache for high-concurrency production caches."
      },
      {
        "id": "q-lhmap-10",
        "difficulty": "Senior",
        "title": "Head and Tail Sentinel Pointers in LinkedHashMap",
        "question": "How does LinkedHashMap internally track the oldest and newest elements in constant time?",
        "interviewerIntent": "Understanding internal data structure pointers in java.util.LinkedHashMap.",
        "juniorTrap": "Thinking it maintains a separate LinkedList object instance.",
        "problem": "Assuming double allocation of nodes.",
        "innerWorking": "LinkedHashMap does NOT create a separate LinkedList instance. It declares transient LinkedHashMap.Entry<K,V> head and tail fields directly on the map. Each node embedded in the hash bucket array simply has before and after pointers, creating a circular/doubly-linked chain directly in the nodes.",
        "seniorAnswer": [
          "head points to eldest entry; tail points to newest entry.",
          "Direct pointers on map instance avoid extra wrapper objects.",
          "O(1) access to both ends of the queue."
        ],
        "codeSnippet": "// LinkedHashMap fields:\n// transient LinkedHashMap.Entry<K,V> head;\n// transient LinkedHashMap.Entry<K,V> tail;",
        "trap": "LinkedHashMap tracks head and tail directly on the map instance without separate collection wrappers."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 17. ArrayList vs. LinkedList
  # --------------------------------------------------------------------------
  {
    "topicId": "arraylist-vs-linkedlist",
    "topicTitle": "ArrayList vs. LinkedList",
    "category": "Collections",
    "summary": "10 Tricky Questions on CPU Cache Locality, Spatial Prefetching, Array Expansion Math & Memory Overhead.",
    "questions": [
      {
        "id": "q-alist-1",
        "difficulty": "Senior",
        "title": "CPU L1/L2 Cache Locality vs Pointer Chasing",
        "question": "Why does ArrayList outperform LinkedList in almost all real-world benchmarks, even for random insertions?",
        "interviewerIntent": "Testing hardware cache line prefetching (spatial locality) vs random heap pointer traversal.",
        "juniorTrap": "Reciting textbook Big-O: 'LinkedList is O(1) insertion, ArrayList is O(N) copy, so LinkedList is faster'.",
        "problem": "Using LinkedList for performance-sensitive lists, inadvertently increasing latency.",
        "innerWorking": "1) Traversal: To insert at index i in LinkedList, you must traverse i pointers from head (O(N) pointer chasing). 2) Hardware Cache Locality: ArrayList elements reside contiguously in memory; CPU hardware prefetchers load entire 64-byte cache lines into L1/L2 cache. LinkedList nodes are scattered randomly across the heap, triggering continuous L1/L2 CPU cache misses.",
        "seniorAnswer": [
          "ArrayList has superior spatial locality; pre-loaded into CPU L1/L2 cache lines.",
          "LinkedList pointer chasing causes expensive DRAM cache misses.",
          "System.arraycopy in ArrayList is hardware-accelerated memory block transfer."
        ],
        "codeSnippet": "// ArrayList elements are contiguous in RAM: [ObjRef][ObjRef][ObjRef] -> Fast L1 Cache!\n// LinkedList nodes are scattered in RAM: Node -> (heap hop) -> Node -> Cache Misses!",
        "trap": "LinkedList pointer chasing destroys CPU cache prefetching; ArrayList contiguous layout is far faster."
      },
      {
        "id": "q-alist-2",
        "difficulty": "Senior",
        "title": "Memory Footprint: 24-Byte Overhead per LinkedList Node",
        "question": "What is the memory consumption difference between ArrayList<Integer> and LinkedList<Integer> storing 1,000,000 integers?",
        "interviewerIntent": "Calculating HotSpot 64-bit object layout memory overhead.",
        "juniorTrap": "Assuming both consume similar memory.",
        "problem": "Massive heap bloat from millions of small LinkedList node objects.",
        "innerWorking": "In 64-bit JVM with CompressedOOPs: ArrayList holds an array of 4-byte references (~4MB) + Integer objects. LinkedList allocates 1,000,000 Node objects: 12-byte Mark/Klass header + 4-byte padding + 4-byte item ref + 4-byte next ref + 4-byte prev ref = 24 bytes per node! 24MB raw node overhead alone!",
        "seniorAnswer": [
          "ArrayList: ~4MB array overhead for 1M elements.",
          "LinkedList: 24MB overhead in Node objects alone (6x higher overhead).",
          "Causes severe GC pressure and cache thrashing."
        ],
        "codeSnippet": "// LinkedList node: 12B header + 4B item + 4B prev + 4B next = 24 bytes per node!\n// 1M items = 24MB wasted RAM purely on node pointers!",
        "trap": "Each LinkedList node consumes 24 bytes of object overhead; ArrayList consumes only 4 bytes per reference."
      },
      {
        "id": "q-alist-3",
        "difficulty": "Senior",
        "title": "ArrayList Resizing Formula (1.5x) Math",
        "question": "How does ArrayList expand when its internal array fills? What is the exact formula in Java 8+?",
        "interviewerIntent": "Verifying knowledge of array growth factors and bit-shift math.",
        "juniorTrap": "Assuming it doubles (2x) like HashMap.",
        "problem": "Assuming ArrayList growth factor is 2.0.",
        "innerWorking": "In Java 8+, ArrayList expansion formula is: int newCapacity = oldCapacity + (oldCapacity >> 1);. This represents a 1.5x (50%) increase. (E.g. 10 -> 15 -> 22 -> 33). This balances amortized O(1) append performance against memory waste.",
        "seniorAnswer": [
          "Grows by 50% (1.5x) via: oldCapacity + (oldCapacity >> 1).",
          "1.5x growth factor allows reusing freed memory chunks in subsequent allocations.",
          "Default initial capacity: 10."
        ],
        "codeSnippet": "// ArrayList expansion in JDK:\nint newCapacity = oldCapacity + (oldCapacity >> 1); // 1.5x growth",
        "trap": "ArrayList grows by 1.5x (50%), not 2.0x; computed via 'oldCapacity + (oldCapacity >> 1)'."
      },
      {
        "id": "q-alist-4",
        "difficulty": "Senior",
        "title": "ArrayDeque is Superior to LinkedList for Queue/Deque",
        "question": "Why does the Java official documentation recommend ArrayDeque over LinkedList for Queue and Stack implementations?",
        "interviewerIntent": "Recommending modern, high-performance circular array buffers over pointer chains.",
        "juniorTrap": "Defaulting to LinkedList when implementing a FIFO Queue.",
        "problem": "High allocation rate and GC pressure from node allocations in high-throughput queues.",
        "innerWorking": "ArrayDeque is backed by a resizable circular array buffer with head and tail indices. It allocates zero node objects on push/pop, has superior CPU cache locality, and never incurs pointer-chasing overhead. In benchmarks, ArrayDeque is 2x-3x faster than LinkedList as a Queue.",
        "seniorAnswer": [
          "ArrayDeque uses circular array buffer with zero node allocation overhead.",
          "Faster than LinkedList and Stack.",
          "Official JDK recommendation for LIFO stacks and FIFO queues."
        ],
        "codeSnippet": "// RECOMMENDED for Queue / Stack:\nDeque<String> queue = new ArrayDeque<>();\nqueue.addLast(\"job\");\nqueue.pollFirst();",
        "trap": "Always use ArrayDeque instead of LinkedList for Queue and Stack; it avoids node allocation."
      },
      {
        "id": "q-alist-5",
        "difficulty": "Senior",
        "title": "SubList Memory Retention Trap in ArrayList",
        "question": "Why does keeping a tiny subList() from a large ArrayList cause a severe memory leak?",
        "interviewerIntent": "Understanding view-based collection views and object reference retention.",
        "juniorTrap": "Assuming subList() creates a new independent list containing only the sub-elements.",
        "problem": "A 100MB ArrayList cannot be garbage collected because a 2-element subList is referenced.",
        "innerWorking": "ArrayList.subList(from, to) returns a SubList view that holds a strong reference to the entire parent ArrayList! As long as the subList is reachable, the entire 100MB parent array cannot be collected by GC.",
        "seniorAnswer": [
          "subList() returns a view holding a strong reference to the parent array.",
          "Prevents garbage collection of the entire parent collection.",
          "Fix: Create an independent list: new ArrayList<>(list.subList(from, to))."
        ],
        "codeSnippet": "List<String> large = new ArrayList<>(1_000_000);\n// DANGER: Holds large list in memory!\nList<String> sub = large.subList(0, 5); \n// SAFE: Disconnects from parent array:\nList<String> safeSub = new ArrayList<>(large.subList(0, 5));",
        "trap": "subList() holds a strong reference to the parent ArrayList; copy it to avoid retaining large arrays in memory."
      },
      {
        "id": "q-alist-6",
        "difficulty": "Senior",
        "title": "RandomAccess Marker Interface Purpose",
        "question": "What is the purpose of the java.util.RandomAccess marker interface implemented by ArrayList but NOT LinkedList?",
        "interviewerIntent": "Understanding algorithmic dispatch based on marker interfaces.",
        "juniorTrap": "Thinking it provides special bytecode runtime checks.",
        "problem": "Using index-based for (int i=0; i<list.size(); i++) on a LinkedList degrades to O(N^2) complexity!",
        "innerWorking": "RandomAccess is a marker interface signaling that constant-time O(1) index-based access is supported. Algorithms like Collections.binarySearch() check if (list instanceof RandomAccess): if true, it uses indexed get(i); if false, it uses an iterator to avoid O(N^2) pointer traversal.",
        "seniorAnswer": [
          "Marker interface indicating fast O(1) random access.",
          "Algorithms adapt: binarySearch uses indexed access for ArrayList, iterator for LinkedList.",
          "Never use index loop for(i) on non-RandomAccess lists (O(N^2) catastrophe)."
        ],
        "codeSnippet": "if (list instanceof RandomAccess) {\n    for (int i=0; i<list.size(); i++) list.get(i); // O(1) per access\n} else {\n    for (var item : list) { /* O(1) per step via iterator */ }\n}",
        "trap": "RandomAccess signals O(1) index access; index loops on non-RandomAccess lists degrade to O(N^2)."
      },
      {
        "id": "q-alist-7",
        "difficulty": "Senior",
        "title": "Arrays.asList() vs List.of() vs new ArrayList()",
        "question": "What are the behavioral and structural differences between Arrays.asList(), List.of() (Java 9), and new ArrayList()?",
        "interviewerIntent": "Differentiating fixed-size views, immutable collections, and mutable lists.",
        "juniorTrap": "Calling .add() on Arrays.asList() or List.of().",
        "problem": "UnsupportedOperationException thrown at runtime.",
        "innerWorking": "1) Arrays.asList(arr): Fixed-size wrapper over array. Can set(i, val), but cannot add() or remove(). Mutations reflect in backing array! 2) List.of() (Java 9): Truly immutable. Neither add(), remove(), nor set() allowed. Rejects nulls (throws NPE). 3) new ArrayList(): Fully mutable, resizable, permits nulls.",
        "seniorAnswer": [
          "Arrays.asList: Fixed size, mutable values, backed by array, permits nulls.",
          "List.of: Purely immutable, forbids nulls, compact memory footprint.",
          "new ArrayList: Fully mutable resizable collection."
        ],
        "codeSnippet": "var l1 = Arrays.asList(1, 2); l1.set(0, 99); // OK! But l1.add(3) throws UnsupportedOperationException!\nvar l2 = List.of(1, 2); // l2.set(0, 99) THROWS UnsupportedOperationException!\nvar l3 = new ArrayList<>(List.of(1, 2)); // Fully mutable!",
        "trap": "Arrays.asList allows set() but not add(); List.of is strictly immutable and forbids nulls."
      },
      {
        "id": "q-alist-8",
        "difficulty": "Senior",
        "title": "ConcurrentModificationException During SubList Concurrent Modification",
        "question": "What happens if you structurally modify a parent ArrayList after creating a subList?",
        "interviewerIntent": "Testing fail-fast co-modification detection in collection views.",
        "juniorTrap": "Thinking the subList automatically adapts to parent additions.",
        "problem": "Any subsequent method call on the subList throws ConcurrentModificationException.",
        "innerWorking": "SubList records parent's modCount at creation. If the parent ArrayList is modified directly (parent.add()), parent modCount increments. The next time ANY method is called on the subList, it detects parent.modCount != this.modCount and throws ConcurrentModificationException immediately.",
        "seniorAnswer": [
          "Direct modification to parent invalidates all active subLists.",
          "Any subsequent read/write on the subList throws CME.",
          "To modify, mutate through the subList itself (subList.add())."
        ],
        "codeSnippet": "List<String> parent = new ArrayList<>(List.of(\"A\", \"B\"));\nList<String> sub = parent.subList(0, 1);\nparent.add(\"C\"); // Mutates parent directly!\n// sub.get(0); // THROWS ConcurrentModificationException!",
        "trap": "Modifying a parent ArrayList directly invalidates existing subLists, throwing CME on subsequent access."
      },
      {
        "id": "q-alist-9",
        "difficulty": "Senior",
        "title": "trimToSize() and Memory Reclamation in ArrayList",
        "question": "When an ArrayList removes elements via clear() or remove(), is the underlying array shrunk?",
        "interviewerIntent": "Understanding array capacity retention and trimToSize().",
        "juniorTrap": "Assuming clear() shrinks the backing array and reclaims memory.",
        "problem": "An ArrayList that once held 10,000,000 items continues to hold a 40MB empty array after clear().",
        "innerWorking": "clear() loops through elementData[] and nulls out references to permit GC of elements, but it does NOT resize the array buffer! The 10M array remains allocated. To reclaim capacity, you must explicitly invoke list.trimToSize(), which allocates an array equal to current size.",
        "seniorAnswer": [
          "clear() nulls elements but retains array capacity.",
          "trimToSize() trims capacity down to current size.",
          "Essential after temporary large data batch processing."
        ],
        "codeSnippet": "ArrayList<Integer> list = new ArrayList<>(10_000_000);\nlist.clear(); // list.size() is 0, but 40MB array remains allocated in heap!\nlist.trimToSize(); // Frees 40MB array!",
        "trap": "clear() on ArrayList does not shrink the underlying array; call trimToSize() to reclaim memory."
      },
      {
        "id": "q-alist-10",
        "difficulty": "Senior",
        "title": "System.arraycopy Native Acceleration in ArrayList",
        "question": "Why is ArrayList element removal (e.g. list.remove(0)) faster than pure Java array iteration?",
        "interviewerIntent": "Understanding native JVM intrinsics and hardware memmove instructions.",
        "juniorTrap": "Thinking ArrayList shifts elements using a Java for loop.",
        "problem": "Assuming shifting elements in an array is inherently slow in Java.",
        "innerWorking": "ArrayList removal uses System.arraycopy(elementData, index+1, elementData, index, numMoved). System.arraycopy is a JVM native intrinsic that compiles to specialized CPU assembly instructions (memmove/SSE/AVX block transfers) shifting memory in single vectorized CPU bursts.",
        "seniorAnswer": [
          "System.arraycopy is a JIT intrinsic mapped to native CPU memmove assembly.",
          "Shifts blocks of memory using vectorized CPU instructions.",
          "Significantly faster than manual iteration; often beats LinkedList for small-to-mid sizes."
        ],
        "codeSnippet": "// ArrayList removal uses native intrinsic:\nSystem.arraycopy(elementData, index + 1, elementData, index, numMoved);",
        "trap": "ArrayList shifts elements via System.arraycopy, which uses hardware-accelerated CPU memory block transfers."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 18. Comparable vs. Comparator
  # --------------------------------------------------------------------------
  {
    "topicId": "comparable-vs-comparator",
    "topicTitle": "Comparable vs. Comparator",
    "category": "Collections",
    "summary": "10 Tricky Questions on Subtraction Overflows, TimSort Contract Violations, Null Safety & Reversed Chaining.",
    "questions": [
      {
        "id": "q-compord-1",
        "difficulty": "Senior",
        "title": "Integer Subtraction Underflow Bug in compareTo",
        "question": "Why is (a, b) -> a.val - b.val a critical bug that can corrupt sorting in TimSort?",
        "interviewerIntent": "Testing integer underflow/overflow awareness in comparison contracts.",
        "juniorTrap": "Writing a - b as a shortcut for integer comparisons.",
        "problem": "TimSort crashes with: IllegalArgumentException: Comparison method violates its general contract!",
        "innerWorking": "If a.val = Integer.MIN_VALUE (-2,147,483,648) and b.val = 1, then a.val - b.val underflows to +2,147,483,647. The comparator reports a positive number, declaring that -2B is GREATER than 1! This violates transitivity and crashes sorting.",
        "seniorAnswer": [
          "Subtraction underflows/overflows with extreme numbers.",
          "Always use Integer.compare(a, b) or Double.compare(a, b).",
          "Or use Comparator.comparingInt(Obj::getVal)."
        ],
        "codeSnippet": "int a = Integer.MIN_VALUE, b = 1;\nSystem.out.println(a - b); // +2147483647 (BROKEN! Underflow!)\nSystem.out.println(Integer.compare(a, b)); // -1 (CORRECT!)",
        "trap": "Never subtract integers (a - b) in a comparator; underflow reverses sort order and crashes TimSort."
      },
      {
        "id": "q-compord-2",
        "difficulty": "Staff Level",
        "title": "TimSort Crash: Comparison Method Violates Its General Contract",
        "question": "What mathematical properties (reflexivity, antisymmetry, transitivity) does TimSort strictly verify, and what causes the contract crash?",
        "interviewerIntent": "Understanding TimSort invariants and strict weak ordering.",
        "juniorTrap": "Assuming sort() tolerates imperfect comparators.",
        "problem": "Production crash in java.util.TimSort.mergeLo() or countRunAndMakeAscending().",
        "innerWorking": "TimSort requires Strict Weak Ordering: 1) sgn(compare(x, y)) == -sgn(compare(y, x)). 2) Transitivity: compare(x, y) > 0 and compare(y, z) > 0 implies compare(x, z) > 0. 3) If x == y, then compare(x, z) == compare(y, z). Using >= instead of >, inconsistent floating-point ==, or subtraction overflow violates transitivity, causing TimSort's stack invariant to fail.",
        "seniorAnswer": [
          "TimSort maintains stack invariants tracking run lengths.",
          "Non-transitive comparators break run calculations, triggering IllegalArgumentException.",
          "Never write: (a > b) ? 1 : -1 (violates reflexivity when a == b!)."
        ],
        "codeSnippet": "// BROKEN (Violates reflexivity: compare(x, x) returns -1 instead of 0!):\nComparator<Integer> broken = (x, y) -> (x > y) ? 1 : -1;\n// Crashes TimSort with: Comparison method violates its general contract!",
        "trap": "A comparator where compare(x, x) != 0 breaks reflexivity and crashes TimSort with IllegalArgumentException."
      },
      {
        "id": "q-compord-3",
        "difficulty": "Senior",
        "title": "Natural Ordering vs External Strategy Pattern",
        "question": "What is the architectural distinction between implementing Comparable<T> and passing a Comparator<T>?",
        "interviewerIntent": "Evaluating domain modeling: intrinsic natural ordering vs external sorting strategies.",
        "juniorTrap": "Implementing Comparable for an arbitrary business sort (like sorting by user registration date).",
        "problem": "Hardcoding temporary UI sort requirements into the core entity class.",
        "innerWorking": "Comparable defines the single NATURAL ordering intrinsic to the domain entity (e.g. BigDecimal numeric order, String alphabetical order). Comparator implements the Strategy pattern, allowing multiple external, pluggable sorting orders (sort by date, sort by price desc, sort by name) without modifying the entity.",
        "seniorAnswer": [
          "Comparable: Intrinsic natural order of the class (single implementation).",
          "Comparator: External pluggable sorting strategies (multiple implementations).",
          "Entities should implement Comparable only if a universally obvious natural ordering exists."
        ],
        "codeSnippet": "// Natural order: Comparable<User> (by ID)\n// External strategies: Comparator.comparing(User::getName), Comparator.comparing(User::getAge)",
        "trap": "Comparable defines intrinsic natural order; Comparator defines pluggable external sorting strategies."
      },
      {
        "id": "q-compord-4",
        "difficulty": "Senior",
        "title": "Null-Safe Comparator Composition (nullsFirst and nullsLast)",
        "question": "How do you construct a null-safe comparator in modern Java that sorts nulls to the end without NullPointerExceptions?",
        "interviewerIntent": "Testing modern Java 8+ Comparator composition APIs.",
        "juniorTrap": "Writing manual nested if (o1 == null && o2 == null) logic.",
        "problem": "NullPointerException when sorting collections containing null elements or null property values.",
        "innerWorking": "Java 8 introduced Comparator.nullsFirst() and Comparator.nullsLast() which wrap an existing comparator and handle null elements gracefully. To handle null property fields on non-null objects, compose with Comparator.comparing(..., Comparator.nullsLast(...)).",
        "seniorAnswer": [
          "Use Comparator.nullsLast(Comparator.naturalOrder()).",
          "To handle null property fields: Comparator.comparing(User::getName, Comparator.nullsLast(String::compareTo)).",
          "Eliminates verbose manual null checking."
        ],
        "codeSnippet": "Comparator<User> safeComp = Comparator.nullsLast(\n    Comparator.comparing(User::getName, Comparator.nullsLast(String::compareToIgnoreCase))\n);",
        "trap": "Use Comparator.nullsLast() and nullsFirst() to build clean, null-safe sorting pipelines."
      },
      {
        "id": "q-compord-5",
        "difficulty": "Senior",
        "title": "Comparator Chaining via thenComparing()",
        "question": "How does Comparator.thenComparing() work internally, and what happens when the first comparator returns non-zero vs zero?",
        "interviewerIntent": "Understanding multi-level sorting composition.",
        "juniorTrap": "Writing custom comparators with nested if-else blocks.",
        "problem": "Verbosity and bugs in multi-attribute sorting (e.g. sort by department, then by salary desc, then by name).",
        "innerWorking": "thenComparing() returns a composite comparator. It evaluates the first comparator: int res = c1.compare(c1, c2). If res != 0, it immediately returns res (short-circuits). If res == 0, it evaluates and returns c2.compare(c1, c2).",
        "seniorAnswer": [
          "Short-circuits if first comparator returns non-zero.",
          "Evaluates second comparator only on equality (tie-breaker).",
          "Supports elegant chaining: comp.thenComparing(...).thenComparing(...)."
        ],
        "codeSnippet": "Comparator<Employee> comp = Comparator\n    .comparing(Employee::getDepartment)\n    .thenComparing(Employee::getSalary, Comparator.reverseOrder())\n    .thenComparing(Employee::getName);",
        "trap": "thenComparing() evaluates the secondary comparator only when the primary comparison yields zero."
      },
      {
        "id": "q-compord-6",
        "difficulty": "Senior",
        "title": "Consistent with Equals Contract Requirement",
        "question": "Why does the Comparable Javadoc strongly recommend that (x.compareTo(y) == 0) == (x.equals(y))? What breaks in TreeSet/TreeMap if they disagree?",
        "interviewerIntent": "Connecting comparison contracts to SortedSet and SortedMap behavior.",
        "juniorTrap": "Thinking TreeSet uses .equals() to check for duplicate elements.",
        "problem": "BigDecimal(\"2.0\") and BigDecimal(\"2.00\") compare as equal in TreeSet, but unequal in HashSet!",
        "innerWorking": "TreeSet and TreeMap do NOT use .equals()! They use compareTo() or compare() to verify equality. If compareTo() returns 0, the element is deemed a duplicate and rejected. BigDecimal(\"2.0\").equals(BigDecimal(\"2.00\")) is false (different scale), but compareTo is 0. A TreeSet will store only ONE, while HashSet stores BOTH!",
        "seniorAnswer": [
          "TreeSet and TreeMap enforce uniqueness using compareTo() == 0, NOT .equals().",
          "If compareTo and equals disagree, SortedSet violates general Set contract.",
          "Classic example: BigDecimal with differing scales."
        ],
        "codeSnippet": "BigDecimal b1 = new BigDecimal(\"2.0\"), b2 = new BigDecimal(\"2.00\");\nSet<BigDecimal> hashSet = new HashSet<>(List.of(b1, b2)); // Size is 2!\nSet<BigDecimal> treeSet = new TreeSet<>(List.of(b1, b2)); // Size is 1! (compareTo == 0)",
        "trap": "TreeSet and TreeMap use compareTo() == 0 to check uniqueness, completely ignoring .equals()."
      },
      {
        "id": "q-compord-7",
        "difficulty": "Senior",
        "title": "Reversed Comparator Inversion Trap: reversed() vs -1 * compare()",
        "question": "Why is writing return -1 * a.compareTo(b); a dangerous bug compared to using Comparator.reverseOrder()?",
        "interviewerIntent": "Recognizing integer negation overflow on Integer.MIN_VALUE.",
        "juniorTrap": "Multiplying by -1 to reverse sort order.",
        "problem": "Negative numbers remaining negative after multiplying by -1!",
        "innerWorking": "In Java 32-bit signed two's complement, Integer.MIN_VALUE is -2,147,483,648. If compareTo() returns Integer.MIN_VALUE, then -1 * Integer.MIN_VALUE is STILL -2,147,483,648! (Integer overflow on unary negation). It fails to invert the sign. Comparator.reverseOrder() swaps the argument order: compare(b, a), which is 100% mathematically safe.",
        "seniorAnswer": [
          "-1 * Integer.MIN_VALUE == Integer.MIN_VALUE (negation overflow).",
          "Fails to reverse the comparison sign.",
          "Use Comparator.reversed() or reverseOrder() which safely swaps parameter arguments."
        ],
        "codeSnippet": "int res = Integer.MIN_VALUE;\nSystem.out.println(-1 * res); // STILL -2147483648! (Overflow on negation!)\n// Fix: Swap arguments instead: compare(b, a)",
        "trap": "Multiplying compareTo result by -1 fails on Integer.MIN_VALUE due to overflow; use reversed() to swap arguments."
      },
      {
        "id": "q-compord-8",
        "difficulty": "Senior",
        "title": "Sorting Primitive Arrays with Custom Comparator Limitation",
        "question": "Why does Arrays.sort(int[] a, comparator) fail to compile in Java?",
        "interviewerIntent": "Understanding generics type boundaries with primitive arrays.",
        "juniorTrap": "Trying to pass a Comparator to sort an int[] primitive array in descending order.",
        "problem": "Compilation error: cannot find symbol method sort(int[], Comparator).",
        "innerWorking": "Comparator<T> requires Object reference types (T extends Object). Primitive int[] is NOT an array of objects; it is an array of primitives. Arrays.sort(T[], Comparator<? super T>) requires an Object array. To sort primitives in reverse order, you must box to Integer[] or use IntStream.boxed().sorted(Comparator.reverseOrder()).",
        "seniorAnswer": [
          "Comparators require generic Object types; primitives cannot be generic type arguments.",
          "Arrays.sort(int[]) uses Dual-Pivot Quicksort and does not accept Comparators.",
          "Must box to Integer[] or sort stream."
        ],
        "codeSnippet": "int[] arr = {3, 1, 2};\n// Arrays.sort(arr, Comparator.reverseOrder()); // COMPILE ERROR!\n// Fix via Stream:\nint[] desc = Arrays.stream(arr).boxed().sorted(Comparator.reverseOrder()).mapToInt(i->i).toArray();",
        "trap": "Arrays.sort() on primitive arrays does not accept Comparators because generics require Object types."
      },
      {
        "id": "q-compord-9",
        "difficulty": "Senior",
        "title": "Comparable Inheritance with Subclassing Trap",
        "question": "If Parent implements Comparable<Parent>, can Child implement Comparable<Child>?",
        "interviewerIntent": "Verifying generic interface inheritance constraints.",
        "juniorTrap": "Trying to implement Comparable<Child> in the subclass.",
        "problem": "Compilation error: java.lang.Comparable cannot be inherited with different arguments: Parent and Child.",
        "innerWorking": "A class cannot implement the same generic interface with different type arguments (JLS §8.1.5). Since Child inherits Comparable<Parent>, it CANNOT also declare implements Comparable<Child>. All child comparisons must accept Parent references.",
        "seniorAnswer": [
          "Generic interfaces cannot be implemented twice with different type arguments.",
          "Child inherits Comparable<Parent>; cannot declare Comparable<Child>.",
          "Use Comparator<Child> for specialized subclass comparisons."
        ],
        "codeSnippet": "class Parent implements Comparable<Parent> {\n    public int compareTo(Parent o) { return 0; }\n}\n// class Child extends Parent implements Comparable<Child> {} // COMPILE ERROR!",
        "trap": "A subclass cannot implement Comparable<Child> if its superclass already implements Comparable<Parent>."
      },
      {
        "id": "q-compord-10",
        "difficulty": "Staff Level",
        "title": "Dual-Pivot Quicksort vs TimSort in java.util.Arrays",
        "question": "When does Java use Dual-Pivot Quicksort vs TimSort in Arrays.sort()?",
        "interviewerIntent": "Understanding internal sorting engine selection in the JDK.",
        "juniorTrap": "Thinking Java uses a single sorting algorithm for everything.",
        "problem": "Assuming primitive sort and object sort have identical stability properties.",
        "innerWorking": "1) Primitive arrays (int[], double[]): Uses Vladimir Yaroslavskiy's Dual-Pivot Quicksort. It is NOT stable, but achieves O(N log N) with small memory footprint and high CPU cache efficiency. 2) Object arrays (T[]): Uses TimSort (adapted from Python). TimSort is STABLE (preserves original order of equal elements) and adaptive (O(N) on nearly-sorted data).",
        "seniorAnswer": [
          "Primitives: Dual-Pivot Quicksort (Unstable, in-place, memory efficient).",
          "Objects: TimSort (Stable, preserves relative order, adaptive O(N) best case).",
          "Stability is mandatory for objects so secondary sorts don't scramble primary sorts."
        ],
        "codeSnippet": "// Arrays.sort(int[]) -> Dual-Pivot Quicksort (Unstable)\n// Arrays.sort(Object[]) -> TimSort (Stable)",
        "trap": "Arrays.sort() uses Dual-Pivot Quicksort for primitives (unstable) and TimSort for objects (stable)."
      }
    ]
  },

  # --------------------------------------------------------------------------
  # 19. Fail-fast vs. fail-safe iterators
  # --------------------------------------------------------------------------
  {
    "topicId": "fail-fast-vs-fail-safe",
    "topicTitle": "Fail-fast vs. fail-safe iterators",
    "category": "Collections",
    "summary": "10 Tricky Questions on modCount, CopyOnWrite Snapshots, ConcurrentModificationException & Safe Mutation.",
    "questions": [
      {
        "id": "q-fail-1",
        "difficulty": "Senior",
        "title": "Single-Threaded ConcurrentModificationException Trigger",
        "question": "Why does calling list.remove(item) inside a standard single-threaded for-each loop throw ConcurrentModificationException?",
        "interviewerIntent": "Verifying that CME is NOT a multithreading exception; it is a structural modification check.",
        "juniorTrap": "Believing ConcurrentModificationException only occurs in multi-threaded programs.",
        "problem": "Single-threaded batch deletion routines crashing with CME.",
        "innerWorking": "The Java for-each loop is syntactic sugar for an Iterator. The iterator stores expectedModCount = list.modCount at initialization. Calling list.remove() modifies the collection directly, incrementing list.modCount. On the next iterator.next() or hasNext(), it checks if (modCount != expectedModCount) and throws ConcurrentModificationException.",
        "seniorAnswer": [
          "CME is NOT a multi-threaded error; it is a fail-fast invariant check.",
          "for-each loop desugars to Iterator.",
          "list.remove() increments modCount; iterator's expectedModCount is not updated -> throws CME."
        ],
        "codeSnippet": "List<String> list = new ArrayList<>(List.of(\"A\", \"B\"));\nfor (String s : list) {\n    if (s.equals(\"A\")) list.remove(s); // THROWS ConcurrentModificationException!\n}",
        "trap": "Calling list.remove() inside a for-each loop throws ConcurrentModificationException in single-threaded code."
      },
      {
        "id": "q-fail-2",
        "difficulty": "Senior",
        "title": "Why iterator.remove() Does NOT Throw ConcurrentModificationException",
        "question": "Why is calling iterator.remove() safe inside an iteration loop, while list.remove() throws an exception?",
        "interviewerIntent": "Understanding how Iterator updates both collection and internal counter.",
        "juniorTrap": "Thinking all removals during iteration are forbidden.",
        "problem": "Developers writing complex two-pass deletion lists unnecessarily.",
        "innerWorking": "iterator.remove() removes the element from the backing collection (incrementing list.modCount) AND immediately updates its internal expectedModCount = list.modCount. Therefore, on the subsequent next() call, modCount == expectedModCount holds true, preventing CME.",
        "seniorAnswer": [
          "iterator.remove() synchronizes expectedModCount = modCount after deletion.",
          "Safe, idiomatic way to remove elements during single-threaded iteration.",
          "Can only be called once per next() call."
        ],
        "codeSnippet": "Iterator<String> it = list.iterator();\nwhile (it.hasNext()) {\n    if (it.next().equals(\"A\")) {\n        it.remove(); // 100% SAFE! Updates expectedModCount!\n    }\n}",
        "trap": "iterator.remove() is safe because it synchronizes expectedModCount with the collection's modCount."
      },
      {
        "id": "q-fail-3",
        "difficulty": "Senior",
        "title": "The Second-to-Last Element Exception Anomaly",
        "question": "Why does removing the SECOND-TO-LAST element from an ArrayList in a for-each loop sometimes NOT throw ConcurrentModificationException?",
        "interviewerIntent": "Deep bytecode analysis of Iterator.hasNext() implementation.",
        "juniorTrap": "Assuming all removals in for-each unconditionally throw CME.",
        "problem": "A bug in code reviews where an illegal removal passes unit tests because the element happened to be 2nd-to-last!",
        "innerWorking": "In ArrayList's iterator, hasNext() is implemented as: return cursor != size;. If you remove the 2nd-to-last element, size shrinks by 1! On the next loop check, cursor == size evaluates to TRUE, so hasNext() returns FALSE! The loop terminates cleanly before next() is ever called to check modCount! If any other element is removed, it crashes.",
        "seniorAnswer": [
          "Removing 2nd-to-last element causes cursor == size in hasNext().",
          "hasNext() returns false, terminating loop before next() checks modCount.",
          "Deceptive pass in unit tests; still illegal code."
        ],
        "codeSnippet": "List<String> list = new ArrayList<>(List.of(\"A\", \"B\"));\nfor (String s : list) {\n    if (s.equals(\"A\")) list.remove(s); // Does NOT throw CME! Loop terminates silently!\n}",
        "trap": "Removing the 2nd-to-last element in for-each skips the modCount check because cursor == size terminates hasNext()."
      },
      {
        "id": "q-fail-4",
        "difficulty": "Senior",
        "title": "Collection.removeIf() Modern Idiom (Java 8+)",
        "question": "How does Collection.removeIf(Predicate) optimize element removal compared to manual iterator loops?",
        "interviewerIntent": "Evaluating modern functional collection mutation APIs.",
        "juniorTrap": "Writing 6 lines of verbose while(iterator.hasNext()) boilerplate.",
        "problem": "Repeated System.arraycopy calls when removing multiple elements via iterator in ArrayList.",
        "innerWorking": "ArrayList overrides removeIf() to use a 2-pass BitSet algorithm. Pass 1: Identifies all elements matching the predicate using a BitSet. Pass 2: Compacts all surviving elements into contiguous memory in a single O(N) sweep! Calling iterator.remove() N times causes N separate array copies; removeIf() shifts memory exactly ONCE.",
        "seniorAnswer": [
          "Single-pass O(N) vectorized compaction using BitSet.",
          "Much faster than calling iterator.remove() repeatedly on ArrayList.",
          "Thread-safe and clean one-liner: list.removeIf(String::isEmpty)."
        ],
        "codeSnippet": "// SLOW (Multiple array shifts):\n// while(it.hasNext()) { if(match) it.remove(); }\n\n// FAST & CLEAN (Single-pass O(N) compaction):\nlist.removeIf(s -> s.startsWith(\"TEST\"));",
        "trap": "Collection.removeIf() uses a single-pass BitSet compaction, vastly outperforming repeated iterator.remove() calls."
      },
      {
        "id": "q-fail-5",
        "difficulty": "Staff Level",
        "title": "CopyOnWriteArrayList: Fail-Safe Iterator Snapshot Mechanics",
        "question": "How does CopyOnWriteArrayList achieve fail-safe iteration without locking or throwing ConcurrentModificationException?",
        "interviewerIntent": "Understanding immutable snapshot arrays and copy-on-write concurrency.",
        "juniorTrap": "Thinking CopyOnWriteArrayList locks the collection during iteration.",
        "problem": "Severe memory churn if writes are frequent.",
        "innerWorking": "When COWIterator is created, it holds a direct reference to the underlying array snapshot at that instant. When another thread calls add() or remove(), CopyOnWriteArrayList allocates a BRAND-NEW array, copies existing elements, applies the mutation, and atomically updates the volatile array reference. The iterator continues traversing the old, immutable snapshot unharmed.",
        "seniorAnswer": [
          "Iterator operates on an immutable array snapshot.",
          "Mutations allocate a new array copy and swap volatile reference.",
          "Never throws CME; reads are 100% lock-free."
        ],
        "codeSnippet": "var cowList = new CopyOnWriteArrayList<>(List.of(\"A\", \"B\"));\nfor (String s : cowList) {\n    cowList.add(\"C\"); // Mutates new array copy; iterator continues reading old array!\n}",
        "trap": "CopyOnWriteArrayList iterators traverse an immutable snapshot; writes allocate a new array copy."
      },
      {
        "id": "q-fail-6",
        "difficulty": "Senior",
        "title": "CopyOnWriteArrayList Performance Trade-Off: High Read vs Heavy Write",
        "question": "When is CopyOnWriteArrayList an architectural disaster, and when is it ideal?",
        "interviewerIntent": "Evaluating write amplification overhead in copy-on-write structures.",
        "juniorTrap": "Using CopyOnWriteArrayList as a general-purpose thread-safe list for high-write endpoints.",
        "problem": "OutOfMemoryError and massive GC allocation pauses under write-heavy loads.",
        "innerWorking": "Every single write (add, set, remove) creates a full copy of the entire array via Arrays.copyOf(). If the list has 100,000 items, adding 1 item copies 100,000 references! Under heavy writes, this burns CPU and floods memory. It is designed EXCLUSIVELY for: read-heavy (99% reads, 1% writes), small size, event listener registries.",
        "seniorAnswer": [
          "Disaster for write-heavy workloads (copies entire array on every write).",
          "Ideal for: Observer/Listener registries where reads vastly outnumber writes.",
          "Zero locks on read."
        ],
        "codeSnippet": "// PERFECT USE CASE: Event listeners (rarely modified, frequently iterated)\nprivate final List<EventListener> listeners = new CopyOnWriteArrayList<>();",
        "trap": "CopyOnWriteArrayList copies the entire array on every write; catastrophic for write-heavy workloads."
      },
      {
        "id": "q-fail-7",
        "difficulty": "Senior",
        "title": "ConcurrentHashMap Iterators: Weakly Consistent vs Fail-Safe",
        "question": "Why is ConcurrentHashMap's iterator technically called 'weakly consistent' rather than 'fail-safe'?",
        "interviewerIntent": "Distinguishing snapshot copy-on-write from live weakly-consistent traversal.",
        "juniorTrap": "Using fail-safe and weakly consistent interchangeably.",
        "problem": "Assuming ConcurrentHashMap takes a snapshot copy on iterator creation.",
        "innerWorking": "'Fail-safe' implies iteration operates on a cloned, frozen snapshot (like CopyOnWriteArrayList). ConcurrentHashMap does NOT clone; it iterates directly over the live hash buckets. It is 'weakly consistent' because it tolerates concurrent mutations, guarantees each item is delivered at most once, and MAY reflect mutations that happen after iterator creation.",
        "seniorAnswer": [
          "Fail-safe (COW): Operates on frozen snapshot copy.",
          "Weakly consistent (CHM): Operates on live structure, reflects some concurrent changes.",
          "Neither ever throws ConcurrentModificationException."
        ],
        "codeSnippet": "// ConcurrentHashMap iterates live buckets without cloning:\nIterator<String> it = chm.keySet().iterator(); // Weakly consistent, zero memory allocation!",
        "trap": "ConcurrentHashMap is 'weakly consistent' (iterates live buckets), not 'fail-safe' (which implies snapshot cloning)."
      },
      {
        "id": "q-fail-8",
        "difficulty": "Senior",
        "title": "modCount is NOT Volatile: Concurrency Visibility Limits",
        "question": "Is the modCount field in ArrayList or HashMap declared volatile? What does this mean for multithreaded fail-fast guarantees?",
        "interviewerIntent": "Understanding Java Memory Model visibility limits on fail-fast iterators.",
        "juniorTrap": "Believing fail-fast iterators are guaranteed to detect concurrent modifications across threads.",
        "problem": "Assuming fail-fast iterators can be used for concurrency detection.",
        "innerWorking": "transient int modCount is NOT volatile! Under multi-threaded concurrent access, writes to modCount by Thread A may remain in CPU store buffers and never be visible to Thread B's CPU cache. Javadoc explicitly warns: 'The fail-fast behavior of an iterator cannot be guaranteed... fail-fast iterators should be used only to detect bugs.'",
        "seniorAnswer": [
          "modCount is not volatile; lacks happens-before memory visibility guarantees.",
          "Fail-fast detection is best-effort only.",
          "Never rely on CME for multithreaded program correctness."
        ],
        "codeSnippet": "// In ArrayList:\n// protected transient int modCount = 0; // NOT volatile!",
        "trap": "modCount is not volatile; fail-fast detection across threads is best-effort and cannot be guaranteed."
      },
      {
        "id": "q-fail-9",
        "difficulty": "Senior",
        "title": "Modifying Element State vs Structural Modification",
        "question": "Does mutating an object's internal fields (e.g. user.setName(\"Bob\")) inside a collection iteration trigger ConcurrentModificationException?",
        "interviewerIntent": "Distinguishing structural modification from element state mutation.",
        "juniorTrap": "Thinking any modification to anything during iteration triggers CME.",
        "problem": "Confusion over what constitutes a structural modification.",
        "innerWorking": "CME is triggered ONLY by structural modifications (adding elements, removing elements, resizing tables, clearing). Mutating an existing element's fields (e.g. list.get(0).setName(\"Bob\")) does NOT modify the collection's structure and does NOT touch modCount. No exception is thrown.",
        "seniorAnswer": [
          "Structural modification: add(), remove(), clear() alters collection size/pointers -> triggers CME.",
          "Element mutation: mutating object fields does not alter structure -> safe, no CME.",
          "Modifying HashMap key fields causes hash bucket dislocation, but not CME."
        ],
        "codeSnippet": "for (User u : userList) {\n    u.setStatus(\"ACTIVE\"); // SAFE! Not a structural modification. modCount unchanged!\n}",
        "trap": "Mutating an element's fields is not a structural modification and does not increment modCount or trigger CME."
      },
      {
        "id": "q-fail-10",
        "difficulty": "Senior",
        "title": "ListIterator: Bidirectional Traversal and In-Place set() / add()",
        "question": "How does ListIterator differ from standard Iterator, and why does ListIterator.set(val) NOT increment modCount?",
        "interviewerIntent": "Testing knowledge of ListIterator bidirectional traversal and in-place replacement.",
        "juniorTrap": "Assuming ListIterator only moves forward.",
        "problem": "Not knowing how to replace elements during iteration.",
        "innerWorking": "ListIterator supports: 1) Bidirectional traversal (hasPrevious(), previous()). 2) In-place replacement via set(E e) which replaces the last element returned without altering list size (does not increment modCount). 3) Element insertion via add(E e) which inserts an element and synchronizes cursor and expectedModCount.",
        "seniorAnswer": [
          "Bidirectional: hasPrevious() and previous().",
          "set(val) replaces element in-place without triggering CME.",
          "add(val) inserts element and synchronizes expectedModCount."
        ],
        "codeSnippet": "ListIterator<String> lit = list.listIterator();\nwhile (lit.hasNext()) {\n    if (lit.next().equals(\"OLD\")) {\n        lit.set(\"NEW\"); // Replaces in-place safely without CME!\n    }\n}",
        "trap": "ListIterator.set() replaces elements in-place without altering list structure or triggering CME."
      }
    ]
  }
]
