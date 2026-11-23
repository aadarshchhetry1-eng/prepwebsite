"""
java_internals_data3.py
Topics 29 to 42:
29. CAS (Compare-And-Swap)
30. ABA Problem
31. Virtual Threads
32. ArrayList Internals
33. LinkedList Internals
34. HashMap Internals
35. HashSet Internals
36. Fail-Fast vs. Fail-Safe Iterators
37. CopyOnWriteArrayList Internals
38. PriorityQueue Internals
39. ArrayDeque Internals
40. Comparable vs. Comparator
41. String Immutability
42. String Pool
"""

TOPICS_29_TO_42 = [
    {
        "id": "java-int-cas",
        "title": "CAS (Compare-And-Swap) & Unsafe / VarHandle Mechanics",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Lock-Free Primitives",
        "oneLiner": "Hardware-level atomic instruction (CMPXCHG) enabling non-blocking lock-free data structures.",
        "whatIsIt": "CAS (Compare-And-Swap) is the hardware-level atomic instruction that forms the bedrock of all non-blocking, lock-free algorithms in the Java Virtual Machine. Instead of locking an entire monitor, CAS takes three operands: a memory offset (V), an expected old value (A), and a new target value (B). The CPU updates V to B if and only if V currently equals A, executing as a single indivisible hardware cycle.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The Hardware CAS Atomic Cycle</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">Read Current (A = 5)</span>
                <span class="node-desc">Fetch from volatile memory</span>
              </div>
              <span class="flow-arrow-separator">──Compute──►</span>
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">Target (B = 6)</span>
                <span class="node-desc">Calculate updated state</span>
              </div>
              <span class="flow-arrow-separator">──cmpxchg──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">CAS(V, 5, 6)</span>
                <span class="node-desc">Success: Atomically swapped!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Spin Loop (Optimistic Retry):</strong> If another thread updated V first (V != 5), CAS returns false ──► Loop re-reads and retries!
            </div>
          </div>
        """,
        "internalWorking": "Inside AtomicInteger, ConcurrentHashMap, and AQS: CAS is exposed via jdk.internal.misc.Unsafe (or Java 9+ VarHandle). The JVM maps compareAndSet() directly to the host CPU's atomic assembly instruction: On x86/x64 architectures, it emits 'lock cmpxchg [rdi], rsi'. The 'lock' prefix asserts a hardware signal on the system bus (or utilizes cache coherency bus locking) to guarantee that no other CPU core can read or modify the cache line between the compare and the swap steps. If another thread intervened, CAS fails and returns false, allowing the caller to retry inside an optimistic spin loop.",
        "complexPart": "CAS Spin Storms & Cache Line Bouncing: Under intense multi-threaded contention (e.g. 64 threads incrementing a single AtomicInteger in a tight loop), CAS failure rates surge to >95%. Every failed CAS forces cache invalidation broadcasts across CPU interconnects (Intel UPI / AMD Infinity Fabric). This phenomenon, known as 'Cache Line Bouncing', saturates memory bus bandwidth and destroys system throughput. Solution: Java 8 LongAdder partitions the counter across a CounterCell[] array, eliminating contention.",
        "keyPoints": [
            "Hardware Atomic Primitive: Maps to 'lock cmpxchg' on x86 and 'LL/SC' (load-linked/store-conditional) on ARM/RISC-V.",
            "Optimistic Concurrency: Assumes no conflict; retries only upon collision (vastly faster than thread parking).",
            "Unsafe to VarHandle: Java 9 introduced VarHandle (MethodHandles.Lookup) to provide type-safe, fine-grained access to CAS operations.",
            "No Thread Suspension: Threads do not context-switch or sleep on failure, eliminating kernel transition latency.",
            "LongAdder Evolution: LongAdder replaces AtomicLong under high write contention by spreading updates across cache-padded cell slots."
        ],
        "codeSnippet": "// AtomicInteger getAndIncrement Implementation (JDK Source):\npublic final int getAndIncrement() {\n    return U.getAndAddInt(this, VALUE_OFFSET, 1);\n}\n\n// Unsafe.getAndAddInt Spin-Loop:\npublic final int getAndAddInt(Object o, long offset, int delta) {\n    int v;\n    do {\n        v = getIntVolatile(o, offset); // Read current value\n    } while (!weakCompareAndSetInt(o, offset, v, v + delta)); // Retry until CAS succeeds!\n    return v;\n}",
        "pitfall": "Using AtomicInteger / AtomicLong in ultra-high write concurrency. When dozens of threads contend on a single memory location, CAS spin loops burn 100% CPU time in useless retry cycles. Switch to LongAdder or DoubleAdder.",
        "interviewTip": "Contrast CAS with synchronized: synchronized is pessimistic (assumes conflict, blocks threads, causes OS context switches); CAS is optimistic (assumes success, commits atomically, spins without context switches)."
    },
    {
        "id": "java-int-aba-problem",
        "title": "The ABA Problem & AtomicStampedReference Mitigation",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Lock-Free Hazard",
        "oneLiner": "A memory state changes from A to B and back to A, tricking naive CAS into succeeding despite intervening mutations.",
        "whatIsIt": "The ABA Problem is a subtle anomaly in lock-free concurrent algorithms relying on naive Compare-And-Swap (CAS). It occurs when a thread reads value 'A', is suspended by the OS, and during the pause, competing threads change the value to 'B' and then restore it back to 'A'. When the original thread resumes, CAS checks memory, sees 'A', and erroneously concludes that no modification occurred.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: The ABA Masking Cycle & Stamp Solution</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">Time 1: State A</span>
                <span class="node-desc">Thread 1 reads (A, Stamp=1)</span>
              </div>
              <span class="flow-arrow-separator">──Mutated──►</span>
              <div class="flow-step-node node-orange" style="min-width: 150px;">
                <span class="node-label">Time 2: State B</span>
                <span class="node-desc">Thread 2 changes to (B, Stamp=2)</span>
              </div>
              <span class="flow-arrow-separator">──Restored──►</span>
              <div class="flow-step-node node-purple" style="min-width: 150px;">
                <span class="node-label">Time 3: State A</span>
                <span class="node-desc">Thread 2 restores (A, Stamp=3)</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Resolution:</strong> AtomicStampedReference pairs reference with integer version stamp: CAS checks (A, 1) != (A, 3) ──► <strong>DETECTED & REJECTED!</strong>
            </div>
          </div>
        """,
        "internalWorking": "Why ABA is Dangerous: In a lock-free Treiber Stack: Top points to Node A -> Node B. Thread 1 prepares to pop A, reading 'next = B'. Before Thread 1 can CAS, Thread 2 pops A, pops B, and pushes a newly allocated Node A back onto the stack (with next = null). Thread 1 resumes and executes CAS(expected=A, new=B). Because Top equals A, CAS succeeds! But Node B was already freed/garbage-collected, corrupting the entire stack data structure! Solution: java.util.concurrent.atomic.AtomicStampedReference. It wraps the target reference inside a Pair<T> record containing both the object reference AND an integer 'stamp' (version number). CAS compares BOTH reference and stamp: 'casPair(expectedReference, newReference, expectedStamp, newStamp)'.",
        "complexPart": "Pair<V> Object Allocation in AtomicStampedReference: To atomize reference + int stamp without requiring double-word 128-bit CAS (CMPXCHG16B) on all hardware architectures, AtomicStampedReference creates a small immutable object 'Pair.of(reference, stamp)' and performs CAS on the Pair reference itself. While this makes it universally portable across all 32-bit and 64-bit CPUs, it incurs garbage collection allocation overhead for every successful state transition.",
        "keyPoints": [
            "The Illusion: Value appears unchanged to naive CAS, masking intermediate structural mutations.",
            "Classic Scenario: Lock-free stacks and memory reclamation pools where nodes are re-allocated.",
            "AtomicStampedReference: Adds an integer version stamp that increments with every modification.",
            "AtomicMarkableReference: Alternative primitive that pairs reference with a boolean flag (useful for node deletion marking).",
            "Garbage Collection Advantage: In garbage-collected languages like Java, ABA is rarer than in C/C++ because memory addresses are not immediately recycled while referenced, but still occurs in pooled node structures."
        ],
        "codeSnippet": "// Eliminating ABA using AtomicStampedReference\nAtomicStampedReference<String> ref = new AtomicStampedReference<>(\"A\", 1);\n\nint initialStamp = ref.getStamp(); // 1\nString initialVal = ref.getReference(); // \"A\"\n\n// Competing thread changes A -> B -> A\nref.compareAndSet(\"A\", \"B\", 1, 2);\nref.compareAndSet(\"B\", \"A\", 2, 3);\n\n// Thread 1 attempts CAS expecting stamp 1:\nboolean success = ref.compareAndSet(initialVal, \"NewValue\", initialStamp, initialStamp + 1);\nSystem.out.println(\"CAS Success: \" + success); // FALSE! (Stamp 1 != 3)",
        "pitfall": "Assuming standard AtomicReference is immune to ABA. If your algorithm recycles or pools node objects, an intervening pop/push sequence will trigger silent data corruption under AtomicReference.",
        "interviewTip": "Use the Treiber Stack pop-recycled-node example to explain why ABA is lethal: show that while the top node pointer value 'A' matches, its child 'next' pointer has been invalidated by intervening operations."
    },
    {
        "id": "java-int-virtual-threads",
        "title": "Virtual Threads (Java 21 Project Loom): Continuation & Carrier Threads",
        "category": "Advanced Concurrency & Synchronizers",
        "badge": "Java 21 Loom",
        "oneLiner": "M:N lightweight user-mode threads scheduled onto OS carrier threads via jdk.internal.vm.Continuation.",
        "whatIsIt": "Virtual Threads (JEP 444, Java 21) are lightweight, user-mode threads managed directly by the Java Virtual Machine rather than the underlying operating system kernel. While platform threads map 1:1 to heavy OS kernel threads (consuming 1MB of stack memory and thousands of CPU cycles per context switch), millions of Virtual Threads can run concurrently, multiplexed M:N onto a small pool of OS Carrier Threads.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Project Loom Continuation Unmounting Pipeline</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Virtual Thread A</span>
                <span class="node-desc">Running on Carrier Worker</span>
              </div>
              <span class="flow-arrow-separator">──Blocking I/O──►</span>
              <div class="flow-step-node node-orange" style="min-width: 160px;">
                <span class="node-label">Continuation.yield()</span>
                <span class="node-desc">Stack frames copied to Heap!</span>
              </div>
              <span class="flow-arrow-separator">──Carrier Free──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">Virtual Thread B</span>
                <span class="node-desc">Carrier mounts & runs next VT!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Throughput Revolution:</strong> A single JVM can effortlessly run 1,000,000 active Virtual Threads simultaneously on just 8 CPU cores!
            </div>
          </div>
        """,
        "internalWorking": "Inside Project Loom: (1) Carrier Thread Pool: A standard ForkJoinPool configured with worker threads equal to available CPU cores ('Runtime.getRuntime().availableProcessors()'). (2) Continuation Engine: Each VirtualThread wraps a 'jdk.internal.vm.Continuation'. When a virtual thread executes blocking I/O (SocketChannel.read(), Thread.sleep(), LockSupport.park()): (a) The JVM catches the blocking call in the NIO socket adapter. (b) The continuation yields: the execution frames currently on the OS carrier thread's stack are copied as dynamic chunks into the Java Heap. (c) The carrier thread is completely unmounted and returned to the pool to run other virtual threads. (d) The I/O operation registers with an OS epoll/kqueue Selector. (3) Resumption: When the socket receives bytes, epoll notifies the JVM. The virtual thread is resubmitted to ForkJoinPool, its stack frames are copied from heap back to a carrier stack, and execution resumes seamlessly!",
        "complexPart": "Thread Pinning Hazard (synchronized & JNI): A virtual thread becomes 'PINNED' to its OS carrier thread if it performs a blocking operation while: (1) inside a 'synchronized' block or method (because HotSpot's ObjectMonitor is tied to the physical OS thread pointer), or (2) inside a native JNI call. When pinned, the continuation CANNOT yield, freezing the underlying OS carrier thread! If all carrier threads become pinned, the entire virtual thread engine stalls.",
        "keyPoints": [
            "M:N User-Mode Scheduling: Millions of virtual threads scheduled across N carrier threads (where N = CPU cores).",
            "Dynamic Heap Stacks: Virtual threads do NOT allocate fixed 1MB -Xss stacks; stack frames grow and shrink dynamically on the heap.",
            "Zero Thread Pooling: NEVER pool virtual threads! Spawning a virtual thread takes ~1 microsecond and <1KB RAM; create them on-demand per request.",
            "Pinning Avoidance: Replace 'synchronized' with 'ReentrantLock' in I/O-heavy paths to prevent pinning carrier threads (until JEP 491).",
            "ThreadLocal Overhead: Avoid storing massive memory buffers in ThreadLocal, as 1,000,000 virtual threads will multiply memory consumption a million-fold."
        ],
        "codeSnippet": "// Spawning 100,000 Concurrent Virtual Threads (Java 21+)\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 100_000).forEach(i -> {\n        executor.submit(() -> {\n            // Blocking HTTP/DB call: Virtual thread unmounts from carrier;\n            // Carrier thread serves other requests while this thread waits!\n            Thread.sleep(Duration.ofSeconds(1));\n            return i;\n        });\n    });\n} // executor.close() automatically waits for all 100k tasks to finish!",
        "pitfall": "Pooling virtual threads using ThreadPoolExecutor. Virtual threads are designed to be disposable lightweight abstractions. Pooling them adds synchronization contention and wastes memory.",
        "interviewTip": "Explain Thread Pinning clearly: in Java 21, blocking inside 'synchronized' blocks or JNI pins the virtual thread to its OS carrier thread because the monitor lock is bound to the native thread structure. Recommend migrating to ReentrantLock."
    },
    {
        "id": "java-int-arraylist",
        "title": "ArrayList Internals: 1.5x Growth, Arrays.copyOf & Fast-Path Operations",
        "category": "Collections Framework Internals",
        "badge": "List Collection",
        "oneLiner": "Dynamic array backing with 1.5x exponential growth factor and native System.arraycopy memory transfers.",
        "whatIsIt": "ArrayList is Java's most widely used collection implementation, backed by a contiguous dynamic array (Object[] elementData). It provides O(1) random index access and amortized O(1) append performance, resizing dynamically by a 1.5x factor (newCapacity = oldCapacity + (oldCapacity >> 1)) whenever capacity is exhausted.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: ArrayList 1.5x Expansion & Element Shift</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">Capacity 10 (Full)</span>
                <span class="node-desc">size == elementData.length</span>
              </div>
              <span class="flow-arrow-separator">──add(element)──►</span>
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">1.5x Bitshift</span>
                <span class="node-desc">10 + (10 &gt;&gt; 1) = 15</span>
              </div>
              <span class="flow-arrow-separator">──System.arraycopy──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">New Array (15)</span>
                <span class="node-desc">Contiguous memory allocated</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #fb923c; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Middle Insertion O(N):</strong> 'add(index, elem)' uses System.arraycopy to shift all subsequent elements 1 slot to the right!
            </div>
          </div>
        """,
        "internalWorking": "Inside java.util.ArrayList: (1) Lazy Initialization: 'new ArrayList<>()' sets elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA (empty array, 0 bytes). On first add(), it expands to DEFAULT_CAPACITY (10). (2) Growth Policy: grow(minCapacity) calculates: 'int newCapacity = oldCapacity + (oldCapacity >> 1)'. It invokes native Arrays.copyOf(elementData, newCapacity) which delegates to native C++ System.arraycopy (memmove on Linux) for lightning-fast memory chunk duplication. (3) Deletion (remove(index)): Computes 'numMoved = size - index - 1'. If numMoved > 0, invokes System.arraycopy to shift elements left. Sets 'elementData[--size] = null' to prevent memory leaks (loitering objects).",
        "complexPart": "Why 1.5x instead of 2.0x (Fibonacci & Memory Reuse): Many textbooks describe dynamic arrays expanding by 2x. However, 2x expansion guarantees that the sum of all previously allocated memory chunks is ALWAYS less than the newly requested chunk, preventing the memory allocator from ever reusing previously freed memory slots! With a growth factor of 1.5x (or golden ratio 1.618), the n-th allocation can fit into the consolidated memory previously freed by earlier chunks.",
        "keyPoints": [
            "Default Initial Capacity: 10 (allocated lazily on the first add() invocation).",
            "Growth Formula: 'oldCapacity + (oldCapacity >> 1)' results in integer 1.5x exponential expansion.",
            "O(1) Random Access: Direct pointer arithmetic '(baseAddress + index * 4)' yields instantaneous access.",
            "O(N) Shift Cost: Adding or removing elements at index 0 shifts the entire array via System.arraycopy.",
            "Null Clearing on Remove: 'elementData[--size] = null' is mandatory to avoid object loitering memory leaks."
        ],
        "codeSnippet": "// Under the Hood: ArrayList.grow() Implementation\nprivate Object[] grow(int minCapacity) {\n    int oldCapacity = elementData.length;\n    if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {\n        // 1.5x growth via bitshift: oldCapacity + (oldCapacity >> 1)\n        int newCapacity = ArraysSupport.newLength(oldCapacity,\n                minCapacity - oldCapacity, /* minimum growth */\n                oldCapacity >> 1           /* preferred growth (50%) */);\n        return elementData = Arrays.copyOf(elementData, newCapacity);\n    } else {\n        return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];\n    }\n}",
        "pitfall": "Creating an ArrayList without pre-sizing when adding millions of elements ('new ArrayList<>()'). The list will reallocate and copy elements dozens of times (10 -> 15 -> 22 -> 33... -> millions), creating massive GC churn. Always pass initial capacity ('new ArrayList<>(expectedSize)').",
        "interviewTip": "Mention the lazy initialization optimization: creating 'new ArrayList<>()' consumes almost zero memory because it assigns a singleton shared static empty array until the very first element is added."
    },
    {
        "id": "java-int-linkedlist",
        "title": "LinkedList Internals: Doubly-Linked Nodes & Memory Locality Penalty",
        "category": "Collections Framework Internals",
        "badge": "List Collection",
        "oneLiner": "Doubly-linked Node objects with next/prev pointers; suffers from severe CPU cache line invalidation compared to ArrayList.",
        "whatIsIt": "LinkedList is Java's doubly-linked list implementation, adhering to both List<E> and Deque<E> interfaces. Each inserted element is wrapped in a dedicated Node<E> heap object containing references to the payload item, the previous node, and the next node. While theoretically offering O(1) insertions at head/tail, in practice it is almost universally slower than ArrayList due to CPU cache misses.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Doubly-Linked Node Memory Fragmentation</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 150px;">
                <span class="node-label">Node 1 (Heap Addr 0x1A0)</span>
                <span class="node-desc">prev=null, item, next=0x8F0</span>
              </div>
              <span class="flow-arrow-separator">◄──next/prev──►</span>
              <div class="flow-step-node node-purple" style="min-width: 150px;">
                <span class="node-label">Node 2 (Heap Addr 0x8F0)</span>
                <span class="node-desc">prev=0x1A0, item, next=0x3C0</span>
              </div>
              <span class="flow-arrow-separator">◄──next/prev──►</span>
              <div class="flow-step-node node-purple" style="min-width: 150px;">
                <span class="node-label">Node 3 (Heap Addr 0x3C0)</span>
                <span class="node-desc">prev=0x8F0, item, next=null</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>CPU Cache Line Miss:</strong> Nodes are scattered across heap RAM; traversing LinkedList triggers constant L1/L2 cache misses!
            </div>
          </div>
        """,
        "internalWorking": "Inside java.util.LinkedList: (1) Node Structure: 'private static class Node<E> { E item; Node<E> next; Node<E> prev; }'. On a 64-bit JVM with compressed OOPs, each Node consumes 24 bytes of heap overhead (12-byte header + 4-byte item ref + 4-byte next ref + 4-byte prev ref = 24 bytes) JUST to hold a single 4-byte integer! (2) Index Access (get(index)): Does NOT support O(1) random indexing. It optimizes traversal by checking 'if (index < (size >> 1))'—if index is in first half, it walks forward from head; if in second half, it walks backward from tail. Still strictly O(N/2) = O(N). (3) Insertions: linkFirst(), linkLast(), linkBefore() execute pointer adjustments without array resizing.",
        "complexPart": "The Memory Locality Catastrophe (ArrayList vs LinkedList Benchmark): Computer science curricula teach that LinkedList is faster at insertions (O(1) vs O(N)). In reality, modern CPUs fetch memory in 64-byte Cache Lines. ArrayList's contiguous memory fits perfectly into CPU L1/L2 caches, allowing hardware prefetchers to read elements at nanosecond speeds. LinkedList nodes are scattered randomly across the 16GB heap; traversing it forces the CPU to stall for hundreds of clock cycles on every single node hop!",
        "keyPoints": [
            "Doubly-Linked List: Implements List, Deque, and Queue with head ('first') and tail ('last') pointers.",
            "High Memory Overhead: 24 bytes of overhead per node compared to 4 bytes per slot in ArrayList.",
            "O(N) Indexing: get(index) splits the search from head or tail depending on index proximity.",
            "No Resizing / Copying: Memory is allocated piecemeal per element without array reallocation.",
            "Deque Replacement: For queue/stack use cases, ArrayDeque is vastly superior in throughput and memory efficiency."
        ],
        "codeSnippet": "// Node Structure and Bi-directional Search in get(index)\nNode<E> node(int index) {\n    // If index in first half, traverse forward from head\n    if (index < (size >> 1)) {\n        Node<E> x = first;\n        for (int i = 0; i < index; i++)\n            x = x.next;\n        return x;\n    } else { // Else traverse backward from tail\n        Node<E> x = last;\n        for (int i = size - 1; i > index; i--)\n            x = x.prev;\n        return x;\n    }\n}",
        "pitfall": "Iterating through a LinkedList using a standard for-loop with index access ('for(int i=0; i<list.size(); i++) list.get(i)'). Because get(i) traverses the list from the ends every single time, this turns an O(N) iteration into an O(N^2) performance disaster! Always use an Iterator or enhanced for-loop.",
        "interviewTip": "When asked whether to use ArrayList or LinkedList, answer: 'Almost always ArrayList (or ArrayDeque)'. Explain the hardware memory locality and CPU cache line prefetching advantage of contiguous arrays over pointer-chasing heap nodes."
    },
    {
        "id": "java-int-hashmap",
        "title": "HashMap Internals: Hash Scattering, Collision Resolution & Treeification",
        "category": "Collections Framework Internals",
        "badge": "Hash Table",
        "oneLiner": "Array + LinkedList + Red-Black Tree (TreeBin) hybrid with 16-bit hash XOR scattering and power-of-2 resizing.",
        "whatIsIt": "HashMap is Java's core associative key-value map implementation. In Java 8+, it is engineered as an array of buckets (Node<K,V>[] table) combining a hash perturbation function, power-of-two bitwise indexing, linked collision lists, and automatic conversion to self-balancing Red-Black Trees (TreeBin) when collision chains reach the treeification threshold.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: HashMap Bucket Indexing & Treeification</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">h ^ (h &gt;&gt;&gt; 16)</span>
                <span class="node-desc">Perturbation scattering</span>
              </div>
              <span class="flow-arrow-separator">──Bitwise &──►</span>
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">index = (n - 1) &amp; hash</span>
                <span class="node-desc">O(1) array slot lookup</span>
              </div>
              <span class="flow-arrow-separator">──Chain &gt;= 8──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">TreeBin (Red-Black)</span>
                <span class="node-desc">O(log N) worst-case lookup</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Resizing Math:</strong> (e.hash & oldCap) == 0 stays at 'index'; != 0 moves to 'index + oldCap' without recomputing hashes!
            </div>
          </div>
        """,
        "internalWorking": "Step 1: Hash Perturbation: 'hash = (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16)'. XORing the high 16 bits into the low 16 bits ensures high-order bits participate in index calculation when table size is small (e.g. 16). Step 2: Bucket Indexing: 'i = (n - 1) & hash' replaces slow modulo '%' with bitwise AND (works because table length n is always a power of 2). Step 3: Collision Resolution: Entries are stored as Node<K,V>(hash, key, value, next). If bucket is full, appends to tail (Java 8 tail-insertion fixes Java 7 head-insertion infinite loop during resize). Step 4: Treeification: If collision chain length >= TREEIFY_THRESHOLD (8) AND table.length >= MIN_TREEIFY_CAPACITY (64), the bucket converts to a Red-Black Tree (TreeNode). Step 5: Untreeify: If deletions drop tree size to UNTREEIFY_THRESHOLD (6), it converts back to a linked list.",
        "complexPart": "Power-of-Two High-Low Bit Resizing Invariant: When HashMap doubles in size (e.g. 16 to 32), the mask (n-1) gains exactly 1 new bit on the left (15 = 01111 -> 31 = 11111). Instead of recomputing hash codes for every element, the JVM evaluates '(e.hash & oldCap) == 0'. If the bit is 0, the element stays at original 'index'. If the bit is 1, it moves to 'index + oldCap'! This splits collision chains in half and links them via lowHead/highHead pointers without hash re-computation.",
        "keyPoints": [
            "Default Constants: Initial capacity = 16, Load Factor = 0.75, Treeify Threshold = 8, Untreeify Threshold = 6, Min Treeify Capacity = 64.",
            "Tail Insertion (Java 8): Replaces Java 7 head insertion, eliminating the circular linked-list infinite loop bug during concurrent resize.",
            "Modulo Replacement: '(n - 1) & hash' is equivalent to 'hash % n' because n is strictly guaranteed to be a power of two.",
            "Load Factor 0.75 Trade-off: Mathematically derived based on Poisson distribution; balances space utilization against collision probability.",
            "Null Key Handling: Supports exactly one null key, which is permanently hashed to index 0."
        ],
        "codeSnippet": "// HashMap Hash Scattering and Bucket Calculation\nstatic final int hash(Object key) {\n    int h;\n    // XOR high 16 bits with low 16 bits to prevent clustering\n    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);\n}\n\n// Index assignment during put/get:\nint index = (table.length - 1) & hash(key);",
        "pitfall": "Using a mutable object as a HashMap key. If you mutate a field that affects the key's hashCode() after inserting it into the map, its hash code changes. Subsequent calls to map.get(key) compute a completely different bucket index and return null, creating a permanent memory leak!",
        "interviewTip": "Explain both conditions for treeification: the bucket chain length must reach 8 AND total table capacity must be at least 64. If chain reaches 8 but capacity < 64, HashMap calls resize() instead of converting to a tree."
    },
    {
        "id": "java-int-hashset",
        "title": "HashSet Internals: HashMap Backing & PRESENT Dummy Object",
        "category": "Collections Framework Internals",
        "badge": "Set Collection",
        "oneLiner": "A thin wrapper around HashMap where set elements serve as map keys and values share a dummy Object PRESENT.",
        "whatIsIt": "HashSet is Java's primary Set collection, guaranteeing that no duplicate elements exist. Rather than implementing an independent hash table data structure from scratch, the JDK implements HashSet as a lightweight structural wrapper around a backing HashMap instance. Every element added to the HashSet becomes a Key in the underlying map, while all entries share a single static dummy Object as their Value.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: HashSet Backed by HashMap & PRESENT Sentinel</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">set.add(\"Alice\")</span>
                <span class="node-desc">Client invocation</span>
              </div>
              <span class="flow-arrow-separator">──Delegates──►</span>
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">map.put(\"Alice\", PRESENT)</span>
                <span class="node-desc">Key = Element; Value = Shared Object</span>
              </div>
              <span class="flow-arrow-separator">──Returns──►</span>
              <div class="flow-step-node node-green" style="min-width: 140px;">
                <span class="node-label">return prev == null</span>
                <span class="node-desc">true if new; false if duplicate</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Memory Waste:</strong> Because HashSet uses HashMap, each set entry still allocates a full 32-byte Node<K,V> structure!
            </div>
          </div>
        """,
        "internalWorking": "Inside java.util.HashSet: (1) Storage: 'private transient HashMap<E,Object> map;'. (2) Sentinel Value: 'private static final Object PRESENT = new Object();'. (3) add(E e): Executes 'return map.put(e, PRESENT) == null;'. If key already exists in the map, map.put() returns the previous value (PRESENT); since result is not null, add() returns false. If key is new, map.put() returns null, and add() returns true. (4) contains(Object o): Delegates directly to 'map.containsKey(o)'. (5) remove(Object o): Delegates to 'map.remove(o) == PRESENT'. (6) iterator(): Returns 'map.keySet().iterator()'.",
        "complexPart": "Serialization and Transient Map: The backing field is declared 'transient HashMap<E,Object> map'. Why is it transient? Because HashMap serialization includes empty bucket slots and capacity details that vary across JVM architectures. HashSet overrides writeObject() to write ONLY the count and the individual elements to the stream, and readObject() recreates the HashMap cleanly, ensuring compact network serialization.",
        "keyPoints": [
            "Complete Delegation: Every single method in HashSet delegates to an internal HashMap method.",
            "Shared Static Sentinel: All entries point to the exact same 'private static final Object PRESENT' instance.",
            "Duplicate Detection: Relies on map.put() returning null for fresh keys versus returning the previous value for existing keys.",
            "Iteration Order: HashSet iteration order is undefined and shifts whenever the underlying HashMap resizes.",
            "LinkedHashSet Alternative: Inherits from HashSet; replaces internal map with LinkedHashMap to preserve insertion ordering."
        ],
        "codeSnippet": "// Complete JDK Source of HashSet Core Methods:\npublic class HashSet<E> extends AbstractSet<E> implements Set<E> {\n    private transient HashMap<E,Object> map;\n    private static final Object PRESENT = new Object();\n\n    public HashSet() {\n        map = new HashMap<>();\n    }\n\n    public boolean add(E e) {\n        // If map.put returns null, the element was new -> returns true\n        return map.put(e, PRESENT) == null;\n    }\n\n    public boolean contains(Object o) {\n        return map.containsKey(o);\n    }\n\n    public boolean remove(Object o) {\n        return map.remove(o) == PRESENT;\n    }\n}",
        "pitfall": "Assuming HashSet has lower memory consumption than HashMap because it only stores keys. In reality, each element allocates a full HashMap$Node instance holding hash, key, value pointer (to PRESENT), and next pointer, consuming identical memory per element.",
        "interviewTip": "Highlight how add() determines success without a separate contains() check: map.put(e, PRESENT) returns null if the key was previously absent, allowing HashSet to complete the operation in a single hash lookup."
    },
    {
        "id": "java-int-fail-fast-vs-fail-safe",
        "title": "Fail-Fast vs. Fail-Safe Iterators & ConcurrentModificationException",
        "category": "Collections Framework Internals",
        "badge": "Iterator Mechanics",
        "oneLiner": "modCount mismatch throws ConcurrentModificationException vs Copy-on-Write snapshot traversal.",
        "whatIsIt": "Fail-Fast and Fail-Safe represent two distinct design philosophies for handling structural modifications during collection iteration. Fail-Fast iterators (ArrayList, HashMap) immediately throw ConcurrentModificationException if the collection is structurally altered during traversal. Fail-Safe / Weakly-Consistent iterators (ConcurrentHashMap, CopyOnWriteArrayList) operate on cloned snapshots or tolerant data structures, never throwing CME.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Fail-Fast modCount Verification vs Fail-Safe Snapshot</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Fail-Fast Iterator</span>
                <span class="node-desc">expectedModCount = modCount</span>
              </div>
              <span class="flow-arrow-separator">──list.add()──►</span>
              <div class="flow-step-node node-red" style="min-width: 170px;">
                <span class="node-label">modCount Incremented!</span>
                <span class="node-desc">modCount != expectedModCount</span>
              </div>
              <span class="flow-arrow-separator">──next()──►</span>
              <div class="flow-step-node node-red" style="min-width: 150px;">
                <span class="node-label">Throws CME</span>
                <span class="node-desc">ConcurrentModificationEx</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Fail-Safe Alternative:</strong> CopyOnWriteArrayList traverses an immutable snapshot array — modifications create new array, iterator is unaffected!
            </div>
          </div>
        """,
        "internalWorking": "Fail-Fast Mechanics: Collections maintain an internal field 'protected transient int modCount = 0'. Every structural mutation (add, remove, clear, resize) increments modCount++. When an iterator is spawned via list.iterator(), the iterator initializes a local field: 'int expectedModCount = modCount'. On every single call to next() or remove(), the iterator executes 'checkForComodification()': if (modCount != expectedModCount) throw new ConcurrentModificationException(). Fail-Safe Mechanics: CopyOnWriteArrayList's iterator stores a direct reference to the backing array snapshot at the instant iterator() was called. Even if another thread replaces the list's array pointer with an updated clone, the iterator continues traversing its immutable snapshot.",
        "complexPart": "ConcurrentModificationException in Single-Threaded Code: Many developers believe CME is caused exclusively by multi-threaded race conditions. In reality, CME is triggered just as frequently in single-threaded code when using an enhanced for-loop ('for (String s : list) { list.remove(s); }')! The enhanced for-loop is compiled into Iterator syntax, but list.remove() mutates the collection directly, causing the next iteration's checkForComodification() to explode.",
        "keyPoints": [
            "modCount Tracker: Structural modification counter incremented by add/remove/clear.",
            "Single-Threaded CME: Calling list.remove() inside a for-each loop triggers CME; call iterator.remove() instead.",
            "Weakly Consistent: ConcurrentHashMap iterators are weakly consistent—they reflect state at or after iterator creation and never throw CME.",
            "Snapshot Immutability: CopyOnWriteArrayList iterators do not support iterator.remove() (throws UnsupportedOperationException).",
            "Best-Effort Basis: JVM specification notes that fail-fast behavior is not strictly guaranteed under concurrent race conditions."
        ],
        "codeSnippet": "// Correct Single-Threaded Element Removal via Iterator\nIterator<String> it = list.iterator();\nwhile (it.hasNext()) {\n    String item = it.next();\n    if (\"target\".equals(item)) {\n        // CORRECT: Updates both list AND iterator's expectedModCount!\n        it.remove(); \n        \n        // WRONG: Throws ConcurrentModificationException on next loop!\n        // list.remove(item); \n    }\n}",
        "pitfall": "Modifying a collection inside an enhanced for-loop ('for(Item i : list) { if(...) list.remove(i); }'). The enhanced for-loop compiles to an Iterator, but list.remove() increments modCount without updating expectedModCount, throwing CME.",
        "interviewTip": "Clarify that iterator.remove() is safe because it updates both the collection's modCount AND resets expectedModCount to match, keeping them synchronized."
    },
    {
        "id": "java-int-copyonwritearraylist",
        "title": "CopyOnWriteArrayList Internals: Snapshot Iterators & Write Re-allocation",
        "category": "Collections Framework Internals",
        "badge": "Concurrent List",
        "oneLiner": "Lock-free volatile reads against snapshots; writes duplicate the entire backing array under ReentrantLock.",
        "whatIsIt": "CopyOnWriteArrayList is a thread-safe variant of ArrayList designed specifically for read-heavy, write-rare concurrency scenarios (event listener registries, configuration tables). While reads are completely lock-free and blazing fast, every single mutation (add, set, remove) creates a fresh copy of the entire underlying array under a mutual exclusion lock.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: CopyOnWriteArrayList Mutation Duplication</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Readers (Threads 1-100)</span>
                <span class="node-desc">Read Old Array (Lock-Free)</span>
              </div>
              <span class="flow-arrow-separator">──Write Arrives──►</span>
              <div class="flow-step-node node-orange" style="min-width: 160px;">
                <span class="node-label">Lock &amp; Copy</span>
                <span class="node-desc">Arrays.copyOf(old, len + 1)</span>
              </div>
              <span class="flow-arrow-separator">──Volatile Swap──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">setArray(newArray)</span>
                <span class="node-desc">Atomic volatile reference update!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Write Penalty:</strong> Modifying a 100,000-element list copies all 100,000 pointers on EVERY write! Never use in write-heavy workloads!
            </div>
          </div>
        """,
        "internalWorking": "Inside CopyOnWriteArrayList: (1) Storage: 'private transient volatile Object[] array'. Reads execute 'return (E) getArray()[index]' with zero locking, zero synchronization, and zero contention. (2) Writes (add(E e)): Enters synchronized lock (or ReentrantLock in Java 8). Reads current array. Allocates a new array with length + 1 via Arrays.copyOf(elements, len + 1). Inserts new element at the final slot. Executes 'setArray(newElements)', atomically overwriting the volatile array pointer. Releases lock. (3) Iterator: Captures the array reference at creation time. Since the array is never mutated in-place (mutations create a new array), the iterator's snapshot is permanently stable. No ConcurrentModificationException is ever possible.",
        "complexPart": "Eventual Consistency & Memory Bloat in Write-Heavy Systems: (1) Memory: If you have a CopyOnWriteArrayList holding 50MB of data and 5 write operations execute concurrently, the JVM momentarily holds 250MB of duplicate arrays in memory before GC sweeps older snapshots. (2) Stale Reads: A reading thread holding an older iterator snapshot will NOT see updates made by subsequent writes until it requests a fresh iterator, exhibiting classic eventual consistency.",
        "keyPoints": [
            "Lock-Free Reads: Reading via get(index) or iterator requires zero locks and never blocks.",
            "Write Re-allocation: Every mutation duplicates the entire backing array using native Arrays.copyOf.",
            "Snapshot Iterators: Iterators never throw ConcurrentModificationException and do not require external synchronization.",
            "Unsupported Remove: Iterator.remove() throws UnsupportedOperationException because snapshot is immutable.",
            "Ideal Use Case: Event listener collections where listeners are registered once at startup and iterated millions of times."
        ],
        "codeSnippet": "// JDK Source of CopyOnWriteArrayList.add(E e)\npublic boolean add(E e) {\n    synchronized (lock) {\n        Object[] es = getArray();\n        int len = es.length;\n        // Allocate NEW array with length + 1 and copy all elements\n        es = Arrays.copyOf(es, len + 1);\n        es[len] = e;\n        // Atomically publish new array to volatile pointer\n        setArray(es);\n        return true;\n    }\n}",
        "pitfall": "Using CopyOnWriteArrayList in a write-intensive workload (e.g. logging buffer, streaming telemetry). Copying the array on every append creates catastrophic garbage collection pauses and CPU saturation.",
        "interviewTip": "Define the sweet spot for CopyOnWriteArrayList: when reads outnumber writes by 100:1 or 1,000:1 (such as system configuration tables or UI event listeners)."
    },
    {
        "id": "java-int-priorityqueue",
        "title": "PriorityQueue Internals: Binary Min-Heap, SiftUp & SiftDown",
        "category": "Collections Framework Internals",
        "badge": "Heap Structure",
        "oneLiner": "Array-backed complete binary min-heap with O(log N) siftUp insertion and siftDown extraction.",
        "whatIsIt": "PriorityQueue is Java's unbounded priority queue implementation backed by a balanced binary min-heap represented inside a contiguous dynamic array (Object[] queue). Rather than maintaining fully sorted order, it enforces the Heap Invariant: every parent node is less than or equal to its children, guaranteeing O(1) peek() at the minimum element and O(log N) offer() and poll() operations.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Array-Backed Binary Min-Heap Indexing</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 140px;">
                <span class="node-label">Root: index 0 (Min)</span>
                <span class="node-desc">Smallest element in queue</span>
              </div>
              <span class="flow-arrow-separator">──Children──►</span>
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Left: (2*k + 1)</span>
                <span class="node-desc">Index 1</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">Right: (2*k + 2)</span>
                <span class="node-desc">Index 2</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Heap Navigation:</strong> Parent of node k is always at 'parent = (k - 1) >>> 1' — zero pointer overhead!
            </div>
          </div>
        """,
        "internalWorking": "Array Heap Math: For any element at index k: Parent is at (k - 1) >>> 1; Left Child is at 2*k + 1; Right Child is at 2*k + 2. (1) Insertion (offer(E e)): Places the element at the next available array slot (index = size). Calls siftUp(size, e): compares element with its parent. If element < parent, swaps with parent and walks up the tree until heap invariant is restored. Cost: O(log N). (2) Extraction (poll()): Top element queue[0] is returned. The last element in the array queue[--size] is moved to queue[0]. Calls siftDown(0, last): compares with smallest of left and right children. If child < element, swaps down until invariant holds. Cost: O(log N). (3) Inspection (peek()): Returns queue[0] in O(1).",
        "complexPart": "Heapify via siftDown O(N) vs Repeated Insertion O(N log N): When constructing a PriorityQueue from an existing collection, Java does NOT insert elements one by one (which would take O(N log N)). Instead, it copies all elements into the array and runs 'heapify()' from the lowest non-leaf node down to the root: 'for (int i = (size >>> 1) - 1; i >= 0; i--) siftDown(i, queue[i])'. Due to mathematical convergence, bottom-up siftDown builds the heap in strictly linear O(N) time!",
        "keyPoints": [
            "Binary Min-Heap: Parent <= Children; root queue[0] is always the minimum element.",
            "Array Navigation: Parent = (k-1)/2, Left = 2k+1, Right = 2k+2.",
            "O(log N) Mutations: offer() and poll() require at most tree height (log2 N) sift comparisons.",
            "O(1) Retrieval: peek() directly returns queue[0].",
            "Non-Thread-Safe: For concurrent environments, use PriorityBlockingQueue."
        ],
        "codeSnippet": "// Sift-Up Implementation on Insertion\nprivate void siftUpComparable(int k, E x) {\n    Comparable<? super E> key = (Comparable<? super E>) x;\n    while (k > 0) {\n        int parent = (k - 1) >>> 1; // Bitshift divide by 2\n        Object e = queue[parent];\n        if (key.compareTo((E) e) >= 0)\n            break; // Heap invariant satisfied!\n        queue[k] = e; // Pull parent down\n        k = parent;   // Climb up to parent\n    }\n    queue[k] = key;\n}",
        "pitfall": "Mutating an element after adding it to a PriorityQueue. PriorityQueue does not listen to property changes. If you alter a field that changes compareTo outcome, the heap order becomes corrupt, leading to incorrect poll() returns.",
        "interviewTip": "Highlight the O(N) heapify optimization: building a heap from an unsorted array takes O(N) time using bottom-up siftDown, NOT O(N log N)."
    },
    {
        "id": "java-int-arraydeque",
        "title": "ArrayDeque Internals: Circular Array & Head/Tail Bitmask Wraparound",
        "category": "Collections Framework Internals",
        "badge": "Deque Structure",
        "oneLiner": "Contiguous circular array with power-of-two bitmask wraparound; beats Stack and LinkedList as FIFO/LIFO.",
        "whatIsIt": "ArrayDeque is Java's resizable circular array implementation of the Deque (Double-Ended Queue) interface. Unlike LinkedList (which allocates heavy Node objects) or legacy Vector/Stack (which synchronizes every method), ArrayDeque operates on a contiguous Object[] array using circular head and tail pointer bitmasks, making it the fastest queue and stack implementation in the JDK.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Circular Array Head/Tail Bitmask Wraparound</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 140px;">
                <span class="node-label">elements[] array</span>
                <span class="node-desc">Length = 16 (Power of 2)</span>
              </div>
              <span class="flow-arrow-separator">◄──head──►</span>
              <div class="flow-step-node node-purple" style="min-width: 150px;">
                <span class="node-label">addFirst(e)</span>
                <span class="node-desc">head = (head - 1) &amp; (len - 1)</span>
              </div>
              <span class="flow-arrow-separator">◄──tail──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">addLast(e)</span>
                <span class="node-desc">tail = (tail + 1) &amp; (len - 1)</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Circular Wraparound:</strong> If head reaches 0, (0 - 1) & 15 wraps head directly to index 15 in a single CPU cycle!
            </div>
          </div>
        """,
        "internalWorking": "Inside java.util.ArrayDeque: (1) Storage: 'transient Object[] elements' with power-of-two capacity (default 16). (2) Circular Pointers: Maintains 'int head' and 'int tail'. (3) addFirst(E e): Decrements head with wraparound: 'head = (head - 1) & (elements.length - 1)'. If elements.length = 16 and head = 0: (0 - 1) is -1 (all 1s in binary). (-1 & 15) evaluates to 15! The pointer wraps around to the back of the array in a single cycle without branching! (4) addLast(E e): Assigns elements[tail] = e, then increments: 'tail = (tail + 1) & (elements.length - 1)'. (5) Resizing (doubleCapacity): If 'head == tail', the array is full. It allocates 2x capacity, copies the head-to-end chunk followed by the 0-to-head chunk, and resets head = 0, tail = oldLength.",
        "complexPart": "Why ArrayDeque Beats Stack and LinkedList Across All Benchmarks: (1) Over Stack: java.util.Stack extends Vector, meaning every push/pop incurs synchronized lock acquisition and monitors. ArrayDeque is unsynchronized. (2) Over LinkedList: LinkedList allocates a 24-byte Node object per element and suffers from pointer cache misses. ArrayDeque stores elements contiguously in a flat array, maximizing CPU L1 cache line hits and avoiding all node allocation GC overhead.",
        "keyPoints": [
            "Circular Buffer Math: '(head - 1) & (len - 1)' provides branchless circular wraparound.",
            "Power-of-Two Enforcement: Capacity is strictly rounded up to the next power of 2 to enable bitwise mask operations.",
            "No Nulls Allowed: ArrayDeque forbids null elements because methods like poll() use null as an empty queue sentinel.",
            "Replacement for Stack: The official JavaDoc explicitly recommends ArrayDeque over legacy java.util.Stack for LIFO operations.",
            "Amortized O(1): Insertions and removals at both ends (head and tail) are amortized O(1)."
        ],
        "codeSnippet": "// Circular Index Bitmasking in ArrayDeque\npublic void addFirst(E e) {\n    if (e == null) throw new NullPointerException();\n    // Branchless wraparound: (0 - 1) & 15 -> 15\n    head = (head - 1) & (elements.length - 1);\n    elements[head] = e;\n    if (head == tail)\n        doubleCapacity(); // Resizes when pointers meet\n}\n\npublic void addLast(E e) {\n    if (e == null) throw new NullPointerException();\n    elements[tail] = e;\n    // Wraps (15 + 1) & 15 -> 0\n    if ((tail = (tail + 1) & (elements.length - 1)) == head)\n        doubleCapacity();\n}",
        "pitfall": "Inserting null into an ArrayDeque ('deque.add(null)'). It throws NullPointerException immediately. ArrayDeque uses null return values from poll() and peek() to signal an empty queue.",
        "interviewTip": "Explain why ArrayDeque is the JDK-recommended replacement for java.util.Stack: Stack extends Vector, paying synchronized lock overhead on every operation, whereas ArrayDeque is modern, unsynchronized, cache-friendly, and faster."
    },
    {
        "id": "java-int-comparable-vs-comparator",
        "title": "Comparable vs. Comparator & Timsort Sorting Internals",
        "category": "Collections Framework Internals",
        "badge": "Sorting & Ordering",
        "oneLiner": "Natural ordering (compareTo) vs external strategy (compare), powered by JDK Timsort hybrid sorting.",
        "whatIsIt": "Comparable<T> and Comparator<T> are Java's two mechanisms for defining object ordering. Comparable defines an object's intrinsic Natural Ordering via 'int compareTo(T o)'. Comparator defines external, strategy-pattern ordering via 'int compare(T o1, T o2)', allowing multiple distinct sort sequences for the same class without modifying its source code.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Comparable vs Comparator & Timsort Merging</div>
            <div class="flow-chain">
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">Comparable&lt;T&gt;</span>
                <span class="node-desc">compareTo(o): Intrinsic Natural</span>
              </div>
              <span class="flow-arrow-separator">VS</span>
              <div class="flow-step-node node-blue" style="min-width: 160px;">
                <span class="node-label">Comparator&lt;T&gt;</span>
                <span class="node-desc">compare(o1, o2): Strategy Pattern</span>
              </div>
              <span class="flow-arrow-separator">──Executed by──►</span>
              <div class="flow-step-node node-green" style="min-width: 150px;">
                <span class="node-label">Dual-Pivot / Timsort</span>
                <span class="node-desc">Runs + Galloping mode merge</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Integer Subtraction Trap:</strong> Writing 'return a - b' causes Integer Overflow bug! Always use 'Integer.compare(a, b)'.
            </div>
          </div>
        """,
        "internalWorking": "Timsort Algorithm (Arrays.sort(Object[])): Arrays.sort for object reference arrays implements Timsort (invented by Tim Peters for Python, adapted to Java). Timsort is an adaptive, stable hybrid of Insertion Sort and Merge Sort: (1) Run Detection: Scans array for natural ascending or strictly descending runs. (2) Binary Insertion Sort: Short runs (<32 elements) are extended using Binary Insertion Sort. (3) Stack Merging: Runs are pushed onto a stack and merged following strict invariant rules (A > B + C and B > C) to ensure balanced merges. (4) Galloping Mode: When one run consistently wins during merging, Timsort switches to exponential binary search ('galloping') to skip massive chunks in O(log N).",
        "complexPart": "The Integer Subtraction Overflow Disaster: A classic junior mistake in Comparator is writing: 'return o1.age - o2.age'. If o1.score is Integer.MIN_VALUE (-2,147,483,648) and o2.score is 1, subtraction overflows: -2,147,483,648 - 1 = +2,147,483,647 (positive!). The comparator violates the Transitive Law, causing Timsort to throw: 'java.lang.IllegalArgumentException: Comparison method violates its general contract!'. Always use Integer.compare(o1, o2).",
        "keyPoints": [
            "Comparable: Implemented by class itself (java.lang.Comparable); method is 'int compareTo(T o)'.",
            "Comparator: External functional interface (java.util.Comparator); method is 'int compare(T o1, T o2)'.",
            "Contract Invariants: Antisymmetry (sgn(x.compareTo(y)) == -sgn(y.compareTo(x))), Transitivity, and Consistency with equals.",
            "Timsort Engine: Worst-case O(N log N), best-case O(N) for partially sorted data, guaranteed stable.",
            "Java 8 Comparator Chaining: Fluent composition using Comparator.comparing().thenComparing()."
        ],
        "codeSnippet": "// Idiomatic Modern Comparator Chaining with Null Safety\nComparator<Employee> employeeComparator = Comparator\n    .comparing(Employee::getDepartment, Comparator.nullsLast(String::compareTo))\n    .thenComparing(Employee::getSalary, Comparator.reverseOrder())\n    .thenComparing(Employee::getName);\n\n// Safe Primitive Comparison (NEVER use o1.id - o2.id):\nComparator<Item> safeComparator = (i1, i2) -> Integer.compare(i1.getId(), i2.getId());",
        "pitfall": "Violating the Transitive Contract in a custom comparator. If compare(A, B) > 0 and compare(B, C) > 0, compare(A, C) MUST be > 0. If your logic returns inconsistent numbers, Collections.sort will crash with 'IllegalArgumentException: Comparison method violates its general contract'.",
        "interviewTip": "Warn against subtraction for integer comparisons: explain that integer overflow produces inverted signs, violating transitivity and causing Timsort contract violation exceptions."
    },
    {
        "id": "java-int-string-immutability",
        "title": "String Immutability: final byte[], Security & Hash Caching",
        "category": "Strings & Object Semantics",
        "badge": "String Internals",
        "oneLiner": "Backed by final byte[] array with Compact Strings (Latin1 vs UTF16) and cached 32-bit hash code.",
        "whatIsIt": "String Immutability is the foundational design invariant of the java.lang.String class: once constructed on the heap, its character payload can never be modified. In Java 9+, HotSpot introduced Compact Strings, replacing the traditional char[] (2 bytes per character) with a final byte[] array paired with a coder flag (LATIN1 vs UTF16) to cut heap memory footprint by 50% for standard ASCII text.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: Compact String Memory Layout (Java 9+)</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">String Object Header</span>
                <span class="node-desc">12 bytes Mark+Klass</span>
              </div>
              <span class="flow-arrow-separator">──Fields──►</span>
              <div class="flow-step-node node-purple" style="min-width: 160px;">
                <span class="node-label">final byte[] value</span>
                <span class="node-desc">Payload (1 byte/char for ASCII)</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-orange" style="min-width: 140px;">
                <span class="node-label">byte coder</span>
                <span class="node-desc">0 = LATIN1, 1 = UTF16</span>
              </div>
              <span class="flow-arrow-separator">+</span>
              <div class="flow-step-node node-green" style="min-width: 130px;">
                <span class="node-label">int hash</span>
                <span class="node-desc">Cached 32-bit hash</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Why Immutable?</strong> Enables String Pool caching, thread-safe sharing without locks, security credentials protection, and hashCode() caching!
            </div>
          </div>
        """,
        "internalWorking": "Inside java.lang.String (Java 9+): 'private final byte[] value;' and 'private final byte coder;'. If all characters in the string fit within ISO-8859-1 (Latin-1), coder = 0, storing 1 byte per character. If any character requires >8 bits (e.g. Emoji, Chinese characters), coder = 1, expanding to 2 bytes per char (UTF-16). Why Immutability is Essential: (1) Security: ClassLoader and database connection URLs use Strings. If Strings were mutable, an attacker could validate a safe path ('/public/file') and then mutate the String to ('/etc/passwd') on another thread (Time-of-Check to Time-of-Use TOCTOU exploit). (2) Hash Caching: String caches its 32-bit hash code in field 'private int hash'. Because the string is immutable, the hash is computed exactly ONCE on first call to hashCode() and cached forever, making HashMap lookups ultra-fast.",
        "complexPart": "Reflection Attacks on 'final byte[] value': In Java 8 and earlier, developers could use reflection to bypass final, access 'value.setAccessible(true)', and mutate a String's characters in-place, corrupting all other code sharing that interned literal! In Java 9+ Project Jigsaw (Strong Encapsulation), the JVM natively prohibits reflective access to private fields of java.base classes, throwing InaccessibleObjectException unless explicit '--add-opens java.base/java.lang=ALL-UNNAMED' flags are passed.",
        "keyPoints": [
            "Compact Strings (Java 9+): Replaces char[] with byte[] + coder flag, reducing memory usage by 50% for Latin-1 text.",
            "Thread Safety: Immutable objects are inherently thread-safe and can be shared freely across threads with zero synchronization.",
            "Cached hashCode(): The 32-bit hash integer is lazily evaluated on first access and cached permanently.",
            "Security Protection: Prevents TOCTOU (Time-of-Check to Time-of-Use) attacks in security managers, network sockets, and file handles.",
            "Substrings in Modern Java: String.substring() creates a brand-new byte[] copy (Java 7u6+), eliminating memory leaks from long parent strings."
        ],
        "codeSnippet": "// HashCode Caching in java.lang.String Source\npublic int hashCode() {\n    int h = hash;\n    if (h == 0 && !hashIsZero) {\n        h = isLatin1() ? StringLatin1.hashCode(value) : StringUTF16.hashCode(value);\n        if (h == 0) {\n            hashIsZero = true; // Special flag so 0-hash strings don't recompute!\n        } else {\n            hash = h;          // Cached permanently!\n        }\n    }\n    return h;\n}",
        "pitfall": "Concatenating strings inside loops using '+' ('String s = \"\"; for(...) s += i;'). Each '+' compiles to new StringBuilder().append().toString(), creating thousands of temporary heap arrays. Use an explicit StringBuilder outside the loop.",
        "interviewTip": "List the 4 architectural reasons why String is immutable in Java: (1) String Pool sharing, (2) Cached hashCode() for HashMap speed, (3) Security protection for OS/network parameters, and (4) Inherent thread safety without locking."
    },
    {
        "id": "java-int-string-pool",
        "title": "String Pool (StringTable) Internals: Native C++ Hashtable & JVM Optimization",
        "category": "Strings & Object Semantics",
        "badge": "String Pool",
        "oneLiner": "The native C++ StringTable hashtable living on Java Heap (Java 7+) for literal deduplication.",
        "whatIsIt": "The String Pool (also known as StringTable) is a specialized memory cache maintained by the JVM to deduplicate String instances. Whenever a string literal appears in code, the JVM checks the String Pool: if a string with the same character sequence already exists, the existing reference is returned; if not, a new instance is created and registered in the pool.",
        "visualDiagram": """
          <div class="visual-diagram-box">
            <div class="diagram-header-label">🧠 Visual Mental Model: String Pool (StringTable) vs Heap Objects</div>
            <div class="flow-chain">
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">String s1 = \"hello\"</span>
                <span class="node-desc">Literal references pool</span>
              </div>
              <span class="flow-arrow-separator">──Points to──►</span>
              <div class="flow-step-node node-green" style="min-width: 170px;">
                <span class="node-label">StringTable (\"hello\")</span>
                <span class="node-desc">Dedicated pool instance on Heap</span>
              </div>
              <span class="flow-arrow-separator">◄──Points to──</span>
              <div class="flow-step-node node-blue" style="min-width: 150px;">
                <span class="node-label">String s2 = \"hello\"</span>
                <span class="node-desc">s1 == s2 evaluates TRUE!</span>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.78rem; color: #fb923c; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> <strong>Heap Location:</strong> In Java 6, StringTable lived in PermGen (fixed OOM risk); since Java 7, it lives directly on the Java Heap!
            </div>
          </div>
        """,
        "internalWorking": "Under the hood: (1) Native Implementation: The String Pool is implemented in HotSpot C++ source as 'StringTable', which is a fixed-capacity hash table with bucket chaining. (2) Relocation to Heap: In Java 6, StringTable was allocated in PermGen (fixed size, prone to OutOfMemoryError: PermGen space). Since Java 7, StringTable lives on the standard Java Heap and is subject to standard Garbage Collection when strings become unreferenced. (3) Tuning: The number of buckets is configured via '-XX:StringTableSize=N' (default 60,013 buckets in Java 8+). If millions of distinct strings are interned and StringTableSize is left small, bucket collision chains grow into thousands of elements, degrading interning from O(1) to O(N) and causing massive CPU stalls.",
        "complexPart": "G1GC String Deduplication (-XX:+UseStringDeduplication): Distinct from the String Pool, G1GC offers an automatic background deduplication engine. During GC evacuation pauses, G1 inspects candidate strings. If two independent String instances on the heap have identical char/byte payloads, G1 rewires their internal 'final byte[] value' pointer to share the SAME backing byte array, reclaiming memory without requiring manual String.intern() calls!",
        "keyPoints": [
            "Heap Location: Moved from PermGen to main Java Heap in Java 7, eliminating PermGen OOM failures.",
            "C++ StringTable: Fixed-size hashtable tuned via -XX:StringTableSize (default 60,013 buckets).",
            "String Deduplication (G1GC): -XX:+UseStringDeduplication enables automatic byte[] sharing across identical strings in background GC.",
            "Literal Registration: String literals in classes are resolved lazily on first instruction execution.",
            "Garbage Collectible: Pooled strings that are no longer referenced by any loaded class can be garbage collected."
        ],
        "codeSnippet": "// Demonstrating String Pool Identity vs Distinct Heap Allocation\nString literal1 = \"apple\";\nString literal2 = \"apple\";\nString distinctObj = new String(\"apple\");\n\nSystem.out.println(literal1 == literal2);    // TRUE: Both point to exact same StringTable reference\nSystem.out.println(literal1 == distinctObj); // FALSE: distinctObj is a separate heap instance\nSystem.out.println(literal1.equals(distinctObj)); // TRUE: Content is identical",
        "pitfall": "Interning millions of dynamically generated strings in Java 8 without tuning -XX:StringTableSize. If the bucket count is too small, hash collisions turn the C++ StringTable into linked chains, causing String.intern() calls to stall the application.",
        "interviewTip": "Highlight the relocation of the String Pool from PermGen to Java Heap in Java 7: explain that in Java 6, interning unbounded strings resulted in fatal PermGen OutOfMemoryErrors; on modern JVMs, pooled strings are collected during regular GC."
    }
]
