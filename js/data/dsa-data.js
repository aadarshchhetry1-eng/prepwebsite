/**
 * dsa-data.js
 * Senior Engineer Level DSA Patterns, Complexity Matrix & System DSA Implementations.
 * Enriched with Visual Mindmaps, Flow Diagrams & Mental Models.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.DSA_TOPICS = [
  {
    id: "lru-cache-implementation",
    title: "LRU Cache (Least Recently Used) in O(1)",
    category: "System Data Structures",
    badge: "Must Code Live",
    oneLiner: "Doubly Linked List sentinel pointers + HashMap lookup for O(1) eviction and recency promotion.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Doubly Linked List + HashMap Coupling</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">HashMap</span>
            <span class="node-desc">Key ➔ Node Ref O(1)</span>
          </div>
          <span class="flow-arrow-separator">◄──Coupled──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">[Dummy Head]</span>
            <span class="node-desc">Sentinel (MRU side)</span>
          </div>
          <span class="flow-arrow-separator">◄═►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Recent Nodes</span>
            <span class="node-desc">node.prev &lt;=&gt; node.next</span>
          </div>
          <span class="flow-arrow-separator">◄═►</span>
          <div class="flow-step-node node-red">
            <span class="node-label">[Dummy Tail]</span>
            <span class="node-desc">tail.prev = LRU Evict!</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #34d399;">
          ⚡ <strong>O(1) Mechanics:</strong> <code>get(k)</code> unlinks node in O(1) and moves to Head. <code>put(k,v)</code> when full drops <code>tail.prev</code> from both list and map in O(1)!
        </div>
      </div>
    `,
    summary: "Implementing a production-grade LRU cache from scratch using a Doubly Linked List + HashMap without using LinkedHashMap.",
    keyPoints: [
      "Why HashMap alone fails: HashMap provides O(1) key-value lookup, but cannot maintain recency ordering in O(1).",
      "Why Doubly Linked List is required: A singly linked list requires O(N) to delete an arbitrary node because you need the pointer to the previous node. A Doubly Linked List allows O(1) removal of any node given its reference (node.prev.next = node.next).",
      "Sentinel Nodes (Dummy Head & Tail): Eliminates null-checking edge cases when inserting at the head or removing the tail.",
      "Operations: get(key) -> fetch node via map, move to head, return val. put(key, val) -> if exists, update & move to head; if new, insert at head; if over capacity, evict tail.prev from both list and map."
    ],
    codeSnippet: `public class LRUCache {
    private static class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { this.key = k; this.value = v; }
    }

    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0); // Dummy head
    private final Node tail = new Node(0, 0); // Dummy tail

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insertAtHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            remove(map.get(key));
        }
        if (map.size() >= capacity) {
            map.remove(tail.prev.key);
            remove(tail.prev);
        }
        Node newNode = new Node(key, value);
        map.put(key, newNode);
        insertAtHead(newNode);
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insertAtHead(Node node) {
        node.next = head.next;
        node.next.prev = node;
        head.next = node;
        node.prev = head;
    }
}`,
    pitfall: "Forgetting to remove the evicted tail node from the HashMap is a classic leak in coding interviews!",
    interviewTip: "To make it thread-safe for senior design interviews, discuss wrapping methods in ReentrantReadWriteLock or using Java's ConcurrentLinkedDeque + striped segments."
  },

  {
    id: "sliding-window-rate-limiter",
    title: "Rate Limiter: Token Bucket & Sliding Window",
    category: "System Patterns",
    badge: "Senior System DSA",
    oneLiner: "O(1) memory Token Bucket refill formula and distributed Redis Lua script atomicity.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Token Bucket Flow Algorithm</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Refill Clock</span>
            <span class="node-desc">r tokens / second</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange">
            <span class="node-label">Bucket (Max b)</span>
            <span class="node-desc">tokens = min(b, tokens + Δt*r)</span>
          </div>
          <span class="flow-arrow-separator">──Request──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">tokens &gt;= 1 ✅</span>
            <span class="node-desc">tokens-- ➔ Allow 200</span>
          </div>
          <span class="flow-arrow-separator">OR</span>
          <div class="flow-step-node node-red">
            <span class="node-label">tokens == 0 ❌</span>
            <span class="node-desc">Drop ➔ HTTP 429</span>
          </div>
        </div>
      </div>
    `,
    summary: "Algorithms powering API Gateways (Envoy, Kong, Spring Cloud Gateway): Token Bucket, Leaky Bucket, and Redis Sliding Window Log.",
    keyPoints: [
      "Token Bucket: Tokens are added at a constant rate r up to capacity b. Requests take tokens. Allows bursts up to bucket capacity. Very memory efficient (O(1) space: just 2 numbers - tokens and lastRefillTimestamp).",
      "Sliding Window Log: Stores request timestamps in a Sorted Set (ZSET in Redis). For each request, remove all entries older than now - windowSize. Count remaining. Memory: O(Requests) per user.",
      "Sliding Window Counter: Hybrid approach dividing time into sub-windows. Weighs previous bucket count proportional to elapsed time.",
      "Concurrency in Distributed Environments: In Redis, multi-step rate limiter checks must be executed atomically using Redis Lua scripts to prevent race condition over-quota spikes."
    ],
    codeSnippet: `// In-Memory Token Bucket Algorithm (Thread-Safe)
public class TokenBucketRateLimiter {
    private final long capacity;
    private final double refillRatePerSecond;
    private double availableTokens;
    private long lastRefillTimestamp;

    public TokenBucketRateLimiter(long capacity, double refillRatePerSecond) {
        this.capacity = capacity;
        this.refillRatePerSecond = refillRatePerSecond;
        this.availableTokens = capacity;
        this.lastRefillTimestamp = System.nanoTime();
    }

    public synchronized boolean tryAcquire(int tokensRequired) {
        refill();
        if (availableTokens >= tokensRequired) {
            availableTokens -= tokensRequired;
            return true;
        }
        return false; // Rate limit exceeded (HTTP 429)
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsedSeconds = (now - lastRefillTimestamp) / 1_000_000_000.0;
        double tokensToAdd = elapsedSeconds * refillRatePerSecond;
        availableTokens = Math.min(capacity, availableTokens + tokensToAdd);
        lastRefillTimestamp = now;
    }
}`,
    pitfall: "Using a naive sliding window log for high-traffic public endpoints without TTL can exhaust Redis memory quickly.",
    interviewTip: "In system design rounds, justify why Token Bucket is preferred for API gateways (handles traffic spikes smoothly with constant O(1) memory), while Leaky Bucket is ideal when downstream services require a strictly smoothed constant output rate."
  },

  {
    id: "monotonic-stack-queue",
    title: "Monotonic Stack & Deque: Linear Extrema",
    category: "Algorithmic Patterns",
    badge: "O(N) Optimization",
    oneLiner: "Transforming O(N^2) search spaces into amortized linear O(N) by enforcing monotonic invariants.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Monotonic Deque Invariant Enforcement</div>
        <div class="flow-chain">
          <div class="flow-step-node node-purple">
            <span class="node-label">Incoming nums[i]</span>
            <span class="node-desc">Current value</span>
          </div>
          <span class="flow-arrow-separator">──compare──►</span>
          <div class="flow-step-node node-red">
            <span class="node-label">Pop smaller elements</span>
            <span class="node-desc">while deque.last &lt; nums[i]</span>
          </div>
          <span class="flow-arrow-separator">──push──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Strictly Descending</span>
            <span class="node-desc">Head is ALWAYS Maximum!</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #34d399;">
          ⚡ <strong>Amortized Proof:</strong> Each element index is pushed exactly once and popped at most once. Total operations &lt;= 2N = <strong>O(N) Time</strong>.
        </div>
      </div>
    `,
    summary: "Transforming O(N^2) search spaces into amortized linear O(N) by enforcing monotonic invariants.",
    keyPoints: [
      "Principle: Maintain a stack/queue whose elements are strictly monotonically increasing or decreasing.",
      "Amortized O(N) Time Proof: Even though there is a nested while loop popping elements, each index is pushed onto the stack exactly ONCE and popped at most ONCE across the entire run. Total operations <= 2N.",
      "Classic Problems: (1) Next Greater Element, (2) Daily Temperatures, (3) Largest Rectangle in Histogram, (4) Trapping Rain Water, (5) Sliding Window Maximum."
    ],
    codeSnippet: `// Sliding Window Maximum in O(N) using Monotonic Deque
public int[] maxSlidingWindow(int[] nums, int k) {
    if (nums == null || k <= 0) return new int[0];
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>(); // Stores indices of descending elements

    for (int i = 0; i < n; i++) {
        // 1. Evict elements outside the current window [i - k + 1, i]
        if (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // 2. Maintain monotonic decreasing order: pop elements smaller than current
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        // 3. Record maximum once the first window is formed
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}`,
    pitfall: "Storing array values instead of array indices in the deque makes it impossible to check if the front element has expired outside the current window bounds.",
    interviewTip: "When asked for the complexity, state clearly: 'Time is O(N) amortized because each element enters and leaves the deque at most once; Auxiliary Space is O(K) for the deque.'"
  },

  {
    id: "tree-graph-toposort-unionfind",
    title: "Disjoint Set (Union-Find) & Path Compression",
    category: "Graph Architectures",
    badge: "Staff Mastery",
    oneLiner: "Flattens tree depth to ~1 using path compression for nearly constant O(α(N)) cycle detection.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Path Compression Flattens Trees to O(1)</div>
        <div class="flow-chain">
          <div class="flow-step-node node-orange">
            <span class="node-label">Before: Deep Chain</span>
            <span class="node-desc">4 ➔ 3 ➔ 2 ➔ 1 (Root)</span>
          </div>
          <span class="flow-arrow-separator">──find(4)──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Path Compression</span>
            <span class="node-desc">parent[x] = find(parent[x])</span>
          </div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">After: Flat Star</span>
            <span class="node-desc">All nodes point directly to Root 1</span>
          </div>
        </div>
      </div>
    `,
    summary: "Cycle detection, connected components, and minimum spanning trees using Disjoint Set Union (DSU) with Path Compression and Rank.",
    keyPoints: [
      "Disjoint Set Union (DSU): Represents partitioned sets. Supports find(x) (which set does x belong to) and union(x, y) (merge two sets).",
      "Path Compression Optimization: During find(x), point every visited node directly to the root: parent[x] = find(parent[x]). Flattens tree height to ~1.",
      "Union by Rank: Attach smaller depth tree under the root of the deeper tree.",
      "Inverse Ackermann Function: With both optimizations, DSU amortized time per operation is O(α(N)), which is virtually constant O(1) for all practical values of N."
    ],
    codeSnippet: `// Production-Grade DSU with Path Compression & Union by Rank
public class UnionFind {
    private final int[] parent;
    private final int[] rank;
    private int count; // Number of connected components

    public UnionFind(int n) {
        this.count = n;
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int p) {
        if (parent[p] != p) {
            parent[p] = find(parent[p]); // Path compression
        }
        return parent[p];
    }

    public boolean union(int p, int q) {
        int rootP = find(p);
        int rootQ = find(q);
        if (rootP == rootQ) return false; // Cycle detected or already connected!

        if (rank[rootP] < rank[rootQ]) {
            parent[rootP] = rootQ;
        } else if (rank[rootP] > rank[rootQ]) {
            parent[rootQ] = rootP;
        } else {
            parent[rootQ] = rootP;
            rank[rootP]++;
        }
        count--;
        return true;
    }

    public int getCount() { return count; }
}`,
    pitfall: "Omitting path compression degrades DSU to an unbalanced linked list with worst-case O(N) per find/union operation.",
    interviewTip: "Mention real-world applications of Union-Find: Kruskal's Minimum Spanning Tree (MST), network packet connectivity verification, and image segmentation."
  }
];
