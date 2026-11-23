/**
 * dsa-data.js
 * Comprehensive Senior & Staff Level DSA Patterns, Problem Finding Strategies,
 * Brute-Force to Optimal Blueprints, and Production System Data Structures.
 * Complete 29 Topic Master Suite.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.DSA_CATEGORIES = [
  { id: "pointers", title: "👉 Two Pointers & Window (3)" },
  { id: "stacks", title: "📚 Stacks, Queues & Intervals (4)" },
  { id: "binary_search", title: "🎯 Binary Search & Heaps (4)" },
  { id: "graphs", title: "🕸️ Trees, Graphs & DSU (5)" },
  { id: "dp", title: "⚡ Dynamic Programming & Backtracking (6)" },
  { id: "advanced", title: "🛠️ Advanced & System Structures (7)" }
];

window.REVISION_APP_DATA.DSA_TOPICS = [
  {
    "id": "dsa-two-pointers",
    "title": "Two Pointers: Collision & Directional Scan",
    "category": "Two Pointers & Window",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Sorted array or string requiring pair matching",
      "Find pairs with target sum (Two Sum II, 3Sum)",
      "Reverse array or test palindrome in-place",
      "Container With Most Water (maximize width * min-height)",
      "Partitioning array (Dutch National Flag, Segregate 0s and 1s)"
    ],
    "whatIsIt": "Two pointers traversing a sequence from opposite ends (collision) or in the same direction at varying speeds. For sorted inputs, the monotonic order guarantees that moving a pointer monotonically increases or decreases the evaluated metric, eliminating entire search quadrants without visiting them.",
    "bruteForce": "Exhaustively examine all N*(N-1)/2 pairs using nested loops (for i=0..N-1; for j=i+1..N-1). Time complexity is O(N^2). Bottleneck: Recomputes comparisons that are mathematically impossible based on the sorted order.",
    "optimalStrategy": "Initialize left = 0, right = N - 1. Compute metric = arr[left] + arr[right]. If metric == target, return pair. If metric < target, we need a larger sum, so left++ (since any pair with right would be smaller). If metric > target, right--. Traversal terminates when left >= right in exactly O(N) time and O(1) space.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Two Pointer Collision on Sorted Array</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">left = 0</span>\n            <span class=\"node-desc\">Smallest Value (arr[0])</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► sum &lt; target ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Target Evaluation</span>\n            <span class=\"node-desc\">sum = arr[left] + arr[right]</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── sum &gt; target ◄──</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">right = N - 1</span>\n            <span class=\"node-desc\">Largest Value (arr[N-1])</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Pruning Guarantee:</strong> When sum &lt; target, moving right leftward would only decrease the sum. Thus, arr[left] cannot pair with ANY element up to right!\n        </div>\n      </div>\n    ",
    "internalWorking": "1. Verify sorted precondition: If unsorted, sort first in O(N log N) if indices don't need preservation.\n2. Invariant maintenance: All pairs (i, j) with i < left or j > right have been conclusively evaluated or eliminated.\n3. Deduplication: In 3Sum or unique pairs, after finding a match, skip duplicates with while(left < right && nums[left] == nums[left+1]) left++.",
    "complexPart": "Container With Most Water: Why is it always safe to move the pointer pointing to the shorter line? Area = (right - left) * min(h[left], h[right]). If we move the taller line, the width decreases by 1, and the height can never exceed the shorter line, so the area is STRICTLY smaller. Thus, moving the shorter line is the ONLY chance to find a larger area.",
    "keyPoints": [
      "Works on sorted arrays, linked lists (cycle/middle), or two independent arrays.",
      "Time Complexity: O(N) traversal (or O(N log N) if sorting required).",
      "Space Complexity: O(1) auxiliary memory.",
      "Trap: Off-by-one termination condition (left < right vs left <= right).",
      "Trap: Infinite loop when skipping duplicates if bounds check (left < right) is omitted."
    ],
    "codeSnippet": "// Canonical Two-Pointer Pair Sum Template (Java 17+)\npublic int[] twoSumSorted(int[] numbers, int target) {\n    int left = 0, right = numbers.length - 1;\n    while (left < right) {\n        int sum = numbers[left] + numbers[right];\n        if (sum == target) {\n            return new int[]{left + 1, right + 1}; // 1-based index\n        } else if (sum < target) {\n            left++; // Need larger sum\n        } else {\n            right--; // Need smaller sum\n        }\n    }\n    return new int[]{-1, -1};\n}\n\n// 3Sum Deduplication Template\npublic List<List<Integer>> threeSum(int[] nums) {\n    Arrays.sort(nums);\n    List<List<Integer>> res = new ArrayList<>();\n    for (int i = 0; i < nums.length - 2; i++) {\n        if (i > 0 && nums[i] == nums[i - 1]) continue; // Skip duplicate anchor\n        if (nums[i] > 0) break; // Optimization: positive anchor cannot sum to 0\n        int l = i + 1, r = nums.length - 1;\n        while (l < r) {\n            int sum = nums[i] + nums[l] + nums[r];\n            if (sum == 0) {\n                res.add(List.of(nums[i], nums[l], nums[r]));\n                while (l < r && nums[l] == nums[l + 1]) l++; // Skip duplicate left\n                while (l < r && nums[r] == nums[r - 1]) r--; // Skip duplicate right\n                l++; r--;\n            } else if (sum < 0) l++;\n            else r--;\n        }\n    }\n    return res;\n}",
    "canonicalProblems": "• LeetCode 167: Two Sum II (Input array is sorted)\n• LeetCode 15: 3Sum (Sort + anchor pointer + two-pointer pair scan)\n• LeetCode 11: Container With Most Water (Greedy height elimination)\n• LeetCode 42: Trapping Rain Water (Two pointers tracking leftMax and rightMax in O(1) space)",
    "pitfall": "Forgetting that sorting alters original element indices. If the question asks for original 0-based indices, use a HashMap or an indexed tuple array `int[][]` before sorting.",
    "interviewTip": "Always state the elimination proof clearly: 'Because the array is sorted, any element paired with the current left pointer will yield a sum strictly less than target, allowing us to safely discard left in O(1).'"
  },
  {
    "id": "dsa-sliding-window",
    "title": "Sliding Window: Fixed Size & Dynamic Contiguous Subarrays",
    "category": "Two Pointers & Window",
    "badge": "Top Tech Frequency",
    "triggerSignals": [
      "Contiguous subarray or substring problem",
      "Find longest/shortest subarray satisfying a condition (e.g. sum >= K, at most K distinct)",
      "Fixed window: Max sum or average of all subarrays of size K",
      "Character frequency constraint (e.g. valid anagrams, string permutations)"
    ],
    "whatIsIt": "A contiguous subarray/substring scanner that avoids recalculating metrics from scratch. By maintaining a window [left, right], we expand right to ingest elements and shrink left to evict invalid states. Because both pointers traverse the array at most once, total time is linear O(N) rather than O(N^2).",
    "bruteForce": "Iterate over every possible start index i and end index j (O(N^2) pairs). For each pair, scan all elements to verify the condition (sum, distinct count, characters). Total time is O(N^3) or O(N^2). Bottleneck: Redundant scanning of overlapping subarray contents.",
    "optimalStrategy": "1. Expand right: Add arr[right] to window state (sum += arr[right] or map[char]++).\n2. Test window validity: While window violates the constraint (e.g. distinctCount > K or sum >= target), record answer if looking for minimum, then shrink from left: remove arr[left] from state and left++.\n3. If looking for maximum window size, record max(res, right - left + 1) after shrinking.\n4. Both pointers advance monotonically: each element is added once and removed once -> O(N) total time.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Dynamic Sliding Window [left, right]</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Expand [right]</span>\n            <span class=\"node-desc\">Ingest arr[right] into state</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► State Check ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Condition Violation?</span>\n            <span class=\"node-desc\">while (invalid condition)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Evict [left] ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Shrink [left++]</span>\n            <span class=\"node-desc\">Evict arr[left], restore valid</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Amortized O(N) Proof:</strong> Right pointer increments N times. Left pointer increments at most N times. Total iterations across inner while loop cannot exceed 2N!\n        </div>\n      </div>\n    ",
    "internalWorking": "Fixed vs Variable Window:\n- Fixed Size K: Increment right. When right >= K - 1, compute metric, then subtract arr[right - K + 1] before next iteration.\n- Variable Size (Find Longest): Expand right. While invalid, shrink left. When valid, update maxLen = max(maxLen, right - left + 1).\n- Variable Size (Find Shortest): Expand right. While valid, update minLen = min(minLen, right - left + 1), then shrink left to see if shorter valid window exists.",
    "complexPart": "Minimum Window Substring (LC 76): Requires tracking matched distinct character count (`formed == required`) using an ASCII frequency array. Shrinking the left pointer only decrements `formed` when `windowCounts[c] < targetCounts[c]`. Getting this condition right is the most common bug.",
    "keyPoints": [
      "Applies strictly to CONTIGUOUS subarrays/substrings (cannot be used for subsequences).",
      "Works naturally with non-negative numbers where monotonic expansion increases sum.",
      "Time Complexity: Amortized O(N) since left and right move only forward.",
      "Space Complexity: O(K) where K is alphabet size (e.g., int[128] or HashMap).",
      "Negative Numbers Pitfall: If subarray sum can decrease when adding positive numbers or vice-versa due to negatives, Sliding Window fails! Use Prefix Sum + HashMap instead."
    ],
    "codeSnippet": "// Universal Dynamic Sliding Window Template (Java 17+)\npublic int lengthOfLongestSubstringKDistinct(String s, int k) {\n    if (s == null || k == 0) return 0;\n    int[] count = new int[256];\n    int left = 0, distinct = 0, maxLen = 0;\n\n    for (int right = 0; right < s.length(); right++) {\n        char rChar = s.charAt(right);\n        if (count[rChar] == 0) distinct++;\n        count[rChar]++;\n\n        // Shrink window while invalid\n        while (distinct > k) {\n            char lChar = s.charAt(left);\n            count[lChar]--;\n            if (count[lChar] == 0) distinct--;\n            left++;\n        }\n\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}",
    "canonicalProblems": "• LeetCode 3: Longest Substring Without Repeating Characters (Hash table index jump)\n• LeetCode 209: Minimum Size Subarray Sum (Variable window shrink while sum >= target)\n• LeetCode 76: Minimum Window Substring (Two frequency maps + match counter)\n• LeetCode 438: Find All Anagrams in a String (Fixed size window of length P)",
    "pitfall": "Attempting to use Sliding Window for 'Subarray Sum Equals K' with negative numbers. When negative numbers exist, expanding the window does NOT monotonically increase the sum. You MUST use Prefix Sum + HashMap (Kadane / Subarray Sum equals K).",
    "interviewTip": "Clearly state the window invariant at the start of your code: 'The window [left, right] always represents the longest valid substring ending at right that contains at most K distinct characters.'"
  },
  {
    "id": "dsa-fast-slow-pointers",
    "title": "Fast & Slow Pointers (Floyd's Tortoise & Hare Cycle Detection)",
    "category": "Two Pointers & Window",
    "badge": "Pointer Mastery",
    "triggerSignals": [
      "Detecting cycle or loop in a singly linked list",
      "Finding middle of a linked list in a single pass",
      "Array treated as a functional mapping f(i) = nums[i] with guaranteed cycle (LC 287)",
      "Determining if a number is 'Happy' (sum of squares of digits cycles back)"
    ],
    "whatIsIt": "Two pointers moving through a sequence or state graph at different speeds (slow by 1 step, fast by 2 steps). If there is a cycle, the relative speed difference of 1 step per iteration guarantees they must collide within the loop, proving a cycle exists in O(1) auxiliary space.",
    "bruteForce": "Store visited node memory addresses or values in a HashSet. For every step, check if set.contains(node). Time: O(N), Space: O(N). Bottleneck: Requires O(N) heap memory, which is prohibited for embedded or O(1) memory constraints.",
    "optimalStrategy": "1. Initialize slow = head, fast = head.\n2. Advance slow = slow.next, fast = fast.next.next.\n3. If fast == null or fast.next == null -> No cycle exists, return false.\n4. If slow == fast -> Cycle detected!\n5. To find cycle entry: Reset slow = head, keep fast at collision point. Advance both 1 step at a time. The node where they meet is the EXACT cycle entry point (Mathematical proof: distance from head to entry equals distance from collision to entry modulo cycle length).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Floyd's Cycle Detection &amp; Entry Point</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Head (distance a)</span>\n            <span class=\"node-desc\">Start to Cycle Entry</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► enters loop ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Cycle Entry (Node E)</span>\n            <span class=\"node-desc\">Loop begins here</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► distance b ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Collision Point (C)</span>\n            <span class=\"node-desc\">slow meets fast!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Math Invariant:</strong> Fast travels 2*(a + b) = a + b + k*L  ==&gt;  a = k*L - b. Resetting slow to Head and walking both at 1 step guarantees they meet at Entry E!\n        </div>\n      </div>\n    ",
    "internalWorking": "Finding Middle of Linked List:\n- When fast reaches null (even length) or fast.next is null (odd length), slow is exactly at the middle node.\n- For odd length (1->2->3->4->5): fast at 5, slow at 3.\n- For even length (1->2->3->4): fast at null, slow at 3 (second middle).",
    "complexPart": "Find the Duplicate Number (LC 287): Array of length N+1 containing numbers 1..N without modifying array and O(1) space. Treat array as pointer transition: `f(i) = nums[i]`. Because N+1 numbers map into 1..N range, at least two indices point to the same value (in-degree >= 2), forming a directed graph with a cycle. Cycle entry is the duplicate value!",
    "keyPoints": [
      "Time Complexity: O(N) where N is number of nodes or sequence states.",
      "Space Complexity: Strict O(1) auxiliary space.",
      "Guard check: Always check `while (fast != null && fast.next != null)` to avoid NullPointerException.",
      "Cycle entry proof: Mathematical guarantee $a = kL - b$ eliminates need for set lookups."
    ],
    "codeSnippet": "// Floyd's Cycle Detection & Entry Point (Java 17+)\npublic ListNode detectCycle(ListNode head) {\n    if (head == null || head.next == null) return null;\n    ListNode slow = head, fast = head;\n    boolean hasCycle = false;\n\n    while (fast != null && fast.next != null) {\n        slow = slow.next;\n        fast = fast.next.next;\n        if (slow == fast) {\n            hasCycle = true;\n            break;\n        }\n    }\n\n    if (!hasCycle) return null;\n\n    // Reset slow to head; advance both 1 step to meet at cycle entry\n    slow = head;\n    while (slow != fast) {\n        slow = slow.next;\n        fast = fast.next;\n    }\n    return slow; // Entry node\n}",
    "canonicalProblems": "• LeetCode 141: Linked List Cycle (Boolean existence)\n• LeetCode 142: Linked List Cycle II (Find entry node)\n• LeetCode 876: Middle of the Linked List (Single pass middle)\n• LeetCode 287: Find the Duplicate Number (Array value as node index)",
    "pitfall": "Forgetting that fast advances 2 steps. If you check `fast.next != null` without checking `fast != null`, an unhandled NullPointerException will trigger on even-length lists.",
    "interviewTip": "When asked LC 287 (Duplicate Number), impress the interviewer by explaining the Pigeonhole Principle first, then explaining why value-as-pointer maps directly into a directed cyclic functional graph."
  },
  {
    "id": "dsa-monotonic-stack",
    "title": "Monotonic Stack: Next Greater Element & Histogram Area",
    "category": "Stacks, Queues & Intervals",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Find 'Next Greater Element' or 'Previous Smaller Element' for every element",
      "Daily Temperatures (days until warmer temperature)",
      "Largest Rectangle in Histogram or Maximal Rectangle in Binary Matrix",
      "Trapping Rain Water or Online Stock Span"
    ],
    "whatIsIt": "A stack whose elements are strictly monotonically increasing or decreasing. When a new element arrives that violates the monotonic order, elements are popped from the stack and resolved immediately. Because every element is pushed once and popped at most once, total runtime across all pops is amortized O(N).",
    "bruteForce": "For each element i, run an inner loop for j = i+1..N-1 to find the first element nums[j] > nums[i]. Time complexity is O(N^2). Bottleneck: Elements are repeatedly scanned without sharing information between neighbors.",
    "optimalStrategy": "Maintain a stack of INDICES (not values) in monotonically decreasing value order. For each index i with value x: while stack is non-empty and nums[stack.peek()] < x, pop topIndex = stack.pop(). The next greater element for topIndex is x! Then push i onto stack. Leftover elements in stack at end have no greater element.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Monotonic Decreasing Stack for Next Greater</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Stack: [73, 71, 69]</span>\n            <span class=\"node-desc\">Decreasing temperatures</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Arrival of 72 ──►</span>\n          <div class=\"flow-step-node node-red\">\n            <span class=\"node-label\">Pop 69 &amp; 71!</span>\n            <span class=\"node-desc\">Next greater for 69, 71 is 72</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Push 72 ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Stack: [73, 72]</span>\n            <span class=\"node-desc\">Monotonicity restored!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Amortized O(N) Invariant:</strong> N elements pushed. At most N elements popped. Total operations across the entire array cannot exceed 2N!\n        </div>\n      </div>\n    ",
    "internalWorking": "Histogram Largest Rectangle (LC 84):\n- When a bar heights[i] < heights[stack.peek()] arrives, the bar at the top of the stack has found its right boundary (index i).\n- Its left boundary is the new stack.peek() (the previous smaller element).\n- Width = i - stack.peek() - 1. Height = heights[popped].\n- Area = width * height. Pop and repeat.",
    "complexPart": "Circular Arrays (LC 503): When array wraps around, how to find next greater element? Loop from 0 to 2*N - 1 and access elements using `i % N`. Only push indices when `i < N`, but allow pops throughout all 2N iterations.",
    "keyPoints": [
      "Store INDICES on the stack rather than values: enables distance calculation `i - stack.peek()`.",
      "Time Complexity: Strict amortized O(N).",
      "Space Complexity: O(N) stack auxiliary memory.",
      "Monotonically Decreasing Stack -> Finds Next GREATER Element.",
      "Monotonically Increasing Stack -> Finds Next SMALLER Element."
    ],
    "codeSnippet": "// Daily Temperatures / Next Greater Element Template (Java 17+)\npublic int[] dailyTemperatures(int[] temperatures) {\n    int n = temperatures.length;\n    int[] answer = new int[n];\n    Deque<Integer> stack = new ArrayDeque<>(); // Store indices\n\n    for (int i = 0; i < n; i++) {\n        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {\n            int prevIndex = stack.pop();\n            answer[prevIndex] = i - prevIndex; // Wait distance\n        }\n        stack.push(i);\n    }\n    return answer;\n}\n\n// Largest Rectangle in Histogram (O(N) Amortized)\npublic int largestRectangleArea(int[] heights) {\n    int n = heights.length, maxArea = 0;\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(-1); // Sentinel left boundary\n\n    for (int i = 0; i < n; i++) {\n        while (stack.peek() != -1 && heights[i] <= heights[stack.peek()]) {\n            int h = heights[stack.pop()];\n            int w = i - stack.peek() - 1;\n            maxArea = Math.max(maxArea, h * w);\n        }\n        stack.push(i);\n    }\n    while (stack.peek() != -1) {\n        int h = heights[stack.pop()];\n        int w = n - stack.peek() - 1;\n        maxArea = Math.max(maxArea, h * w);\n    }\n    return maxArea;\n}",
    "canonicalProblems": "• LeetCode 739: Daily Temperatures (Classic Next Greater distance)\n• LeetCode 496: Next Greater Element I (Monotonic stack + HashMap)\n• LeetCode 84: Largest Rectangle in Histogram (Popped element bounded by current and stack.peek)\n• LeetCode 901: Online Stock Span (Consecutive smaller or equal days)",
    "pitfall": "Using `java.util.Stack` in Java. `Stack` extends `Vector` and synchronizes every single method, introducing massive thread contention lock overhead. Always use `Deque<Integer> stack = new ArrayDeque<>()`.",
    "interviewTip": "State the invariant: 'The stack maintains a strictly decreasing sequence of indices. When an incoming element is strictly greater, it acts as the right boundary for all smaller elements on the stack.'"
  },
  {
    "id": "dsa-monotonic-deque",
    "title": "Monotonic Deque: Sliding Window Maximum in Amortized O(1)",
    "category": "Stacks, Queues & Intervals",
    "badge": "Advanced Queue",
    "triggerSignals": [
      "Sliding window maximum or minimum in array of size K",
      "Shortest subarray with sum at least K (positive & negative values)",
      "Constrained subsequence sum or jump game with max reward",
      "Dynamic programming optimization where transition is over sliding window range"
    ],
    "whatIsIt": "A double-ended queue (Deque) maintaining indices whose values are strictly monotonic. The head (peekFirst) always holds the maximum (or minimum) of the current window. Smaller elements behind an incoming larger element are eliminated from the tail because they can NEVER be the window maximum in the future.",
    "bruteForce": "Re-scan all K elements in the window for every slide in O(N * K). Alternatively, use a PriorityQueue (Max-Heap) in O(N log K) with lazy deletion, but removing expired elements from heap takes O(K) unless using TreeMap.",
    "optimalStrategy": "1. For each index i: evict expired indices from head: `while (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.pollFirst()`.\n2. Evict smaller elements from tail: `while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) deque.pollLast()`.\n3. Push i to tail.\n4. If i >= k - 1: window is full, `deque.peekFirst()` is the guaranteed maximum in O(1)!",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Monotonic Decreasing Deque</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Head: peekFirst()</span>\n            <span class=\"node-desc\">Current Window Max! O(1)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── Strictly Decreasing ──►</span>\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Tail: pollLast()</span>\n            <span class=\"node-desc\">Strip smaller &lt;= incoming</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Ingest [i] ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">offerLast(i)</span>\n            <span class=\"node-desc\">New candidate at tail</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Why drop smaller elements?</strong> Incoming element is newer AND larger. Any older element smaller than it will expire BEFORE it and is strictly dominated!\n        </div>\n      </div>\n    ",
    "internalWorking": "Monotonic Deque DP Optimization:\n- When DP transition is `dp[i] = nums[i] + max(dp[j])` for `i - k <= j < i`.\n- Instead of checking all j in O(K), store j in Monotonic Deque ordered by `dp[j]`.\n- Reduces DP runtime from O(N * K) down to strict O(N)!",
    "complexPart": "Shortest Subarray with Sum at Least K (LC 862): With negative numbers, prefix sums are not monotonic. A monotonic deque stores prefix sum indices. When `prefix[i] - prefix[deque.peekFirst()] >= K`, pollFirst and record length (since future indices would only produce larger lengths). When `prefix[i] <= prefix[deque.peekLast()]`, pollLast to preserve increasing order.",
    "keyPoints": [
      "Stores indices rather than raw values to easily verify expiration `index <= i - k`.",
      "Head (peekFirst) is ALWAYS the extremum in O(1) time.",
      "Time Complexity: Strict amortized O(N) because each index is offered once and polled once.",
      "Space Complexity: O(K) bound by window size."
    ],
    "codeSnippet": "// Sliding Window Maximum in O(N) Amortized (Java 17+)\npublic int[] maxSlidingWindow(int[] nums, int k) {\n    if (nums == null || k <= 0) return new int[0];\n    int n = nums.length;\n    int[] result = new int[n - k + 1];\n    Deque<Integer> deque = new ArrayDeque<>(); // Stores indices\n\n    for (int i = 0; i < n; i++) {\n        // 1. Remove expired indices outside window [i - k + 1, i]\n        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {\n            deque.pollFirst();\n        }\n\n        // 2. Remove smaller elements from tail (they can never be max)\n        while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) {\n            deque.pollLast();\n        }\n\n        // 3. Add current index to tail\n        deque.offerLast(i);\n\n        // 4. Record result once first window is formed\n        if (i >= k - 1) {\n            result[i - k + 1] = nums[deque.peekFirst()];\n        }\n    }\n    return result;\n}",
    "canonicalProblems": "• LeetCode 239: Sliding Window Maximum (Canonical Monotonic Deque)\n• LeetCode 862: Shortest Subarray with Sum at Least K (Prefix Sum + Monotonic Deque)\n• LeetCode 1425: Constrained Subsequence Sum (DP + Sliding Window Deque in O(N))\n• LeetCode 1499: Max Value of Equation (y_i + y_j + |x_i - x_j|)",
    "pitfall": "Poll order confusion: remember that `pollFirst()` evicts expired indices from the old edge of the window, while `pollLast()` strips dominated values from the new edge.",
    "interviewTip": "Emphasize domination theory: 'An older element that is strictly smaller than the incoming element can never be the maximum of any future window containing both, because it will expire earlier and is already inferior.'"
  },
  {
    "id": "dsa-merge-intervals",
    "title": "Merge Intervals: Sweep-Line & Overlap Resolution",
    "category": "Stacks, Queues & Intervals",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Intervals with [start, end] times",
      "Merging overlapping time ranges or booking slots",
      "Insert new interval into existing non-overlapping interval set",
      "Meeting Rooms: Find minimum conference rooms or maximum concurrent meetings"
    ],
    "whatIsIt": "A pattern for resolving interval collisions by first sorting intervals by their start coordinate. Once sorted, any overlap between consecutive intervals can be detected in O(1) comparison: if curr.start <= prev.end, they overlap and merge to [prev.start, max(prev.end, curr.end)]. Sweep-line decomposes intervals into discrete +1 and -1 boundary events.",
    "bruteForce": "Compare every pair of intervals in O(N^2) and merge them into a graph of connected components. Time: O(N^2) or O(N^3). Bottleneck: Unsorted intervals require pairwise quadratic checking.",
    "optimalStrategy": "1. Sort intervals by start time: `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]))` in O(N log N).\n2. Initialize merged list with first interval.\n3. Iterate i from 1 to N-1: if intervals[i][0] <= lastMerged[1], update `lastMerged[1] = Math.max(lastMerged[1], intervals[i][1])`.\n4. Else, no overlap: push intervals[i] as a new entry.\n5. Total runtime: O(N log N) sorting + O(N) linear merge.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Merge Intervals via Sorted Start Times</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Interval [1, 4]</span>\n            <span class=\"node-desc\">Current end = 4</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► 2 &lt;= 4 (Overlap!) ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Interval [2, 6]</span>\n            <span class=\"node-desc\">Merge: end = max(4, 6)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► 8 &gt; 6 (Disjoint) ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Interval [8, 10]</span>\n            <span class=\"node-desc\">Start new merged group</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Sweep-Line Insight:</strong> To find max concurrency (Meeting Rooms II), map each interval into two events: (start, +1) and (end, -1). Sort events and take prefix sum to find peak!\n        </div>\n      </div>\n    ",
    "internalWorking": "Sweep-Line Algorithm for Meeting Rooms II:\n- Create array of starts `int[] starts` and ends `int[] ends`.\n- Sort both arrays independently in O(N log N).\n- Use two pointers `s` and `e`. If `starts[s] < ends[e]`, a meeting started before the earliest one finished -> `rooms++`, `s++`.\n- Else `ends[e]` finished, so free room -> `rooms--`, `e++`.\n- Max rooms at any point is the answer.",
    "complexPart": "Insert Interval (LC 57): Insert interval into sorted non-overlapping set in O(N) without sorting. Three phases:\n1. Add all intervals ending before newInterval.start.\n2. Merge all overlapping intervals into newInterval: `start = min(start, curr.start)`, `end = max(end, curr.end)` while `curr.start <= newInterval.end`.\n3. Add all remaining intervals starting after newInterval.end.",
    "keyPoints": [
      "Sorting by start time guarantees only adjacent intervals need overlap checks.",
      "Time Complexity: O(N log N) dominated by sorting (or O(N) if already sorted).",
      "Space Complexity: O(N) to hold result list.",
      "Overlap Condition: `curr.start <= prev.end` (use `<` if boundaries touching at single point are not considered overlapping)."
    ],
    "codeSnippet": "// Merge Intervals (Java 17+)\npublic int[][] merge(int[][] intervals) {\n    if (intervals.length <= 1) return intervals;\n\n    // 1. Sort by start coordinate\n    Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));\n\n    List<int[]> merged = new ArrayList<>();\n    int[] current = intervals[0];\n    merged.add(current);\n\n    for (int i = 1; i < intervals.length; i++) {\n        if (intervals[i][0] <= current[1]) {\n            // Overlapping -> extend end coordinate\n            current[1] = Math.max(current[1], intervals[i][1]);\n        } else {\n            // Disjoint -> advance reference\n            current = intervals[i];\n            merged.add(current);\n        }\n    }\n    return merged.toArray(new int[merged.size()][]);\n}",
    "canonicalProblems": "• LeetCode 56: Merge Intervals (Standard merge)\n• LeetCode 57: Insert Interval (O(N) 3-phase insertion)\n• LeetCode 253: Meeting Rooms II (Sweep-line / Min-Heap for concurrent rooms)\n• LeetCode 435: Non-overlapping Intervals (Greedy sort by END time to maximize preserved)",
    "pitfall": "Sorting by END time instead of START time for general merging. Sorting by end time works for Greedy Activity Selection (LC 435), but fails for merging because an earlier interval with a huge span could encompass all subsequent intervals.",
    "interviewTip": "Distinguish between sorting by START time (for merging overlapping intervals) versus sorting by END time (for greedy scheduling / maximum non-overlapping intervals)."
  },
  {
    "id": "dsa-cyclic-sort",
    "title": "Cyclic Sort: Numbers in Range [1..N] in O(N) Time & O(1) Space",
    "category": "Stacks, Queues & Intervals",
    "badge": "In-Place Mastery",
    "triggerSignals": [
      "Input array has N integers strictly in range [1..N] or [0..N]",
      "Find the missing number or duplicate number in O(1) auxiliary space",
      "Find the first missing positive integer in unsorted array (LC 41)",
      "Set Mismatch (one duplicate, one missing)"
    ],
    "whatIsIt": "An in-place sorting algorithm that places every number x at its correct destination index (x - 1 for 1-based, or x for 0-based) by repeatedly swapping. Because each swap places at least one element into its permanent final position, the total number of swaps cannot exceed N, achieving strict O(N) runtime and O(1) extra memory.",
    "bruteForce": "Use a HashSet of seen numbers in O(N) time and O(N) space, or sort the array with Arrays.sort() in O(N log N) time. Bottleneck: Violates O(1) space constraints or exceeds O(N) time requirements.",
    "optimalStrategy": "1. Iterate i from 0 to N-1.\n2. While `nums[i] != nums[nums[i] - 1]` (and value is in valid range 1..N):\n   swap(nums, i, nums[i] - 1).\n3. If nums[i] is already at correct index or equals the element at destination index, increment i++.\n4. Second pass: scan array; the first index i where `nums[i] != i + 1` reveals the missing number (i + 1) and duplicate number (nums[i]).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Cyclic Sort In-Place Swapping</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Index 0: val = 3</span>\n            <span class=\"node-desc\">Should be at index 2 (val - 1)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► swap(0, 2) ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Swap with nums[2]</span>\n            <span class=\"node-desc\">3 placed at index 2!</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Evaluate new nums[0] ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Repeat until nums[i] == i + 1</span>\n            <span class=\"node-desc\">Then advance i++</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Why O(N) Total?</strong> Each swap correctly places at least one number in its final home. Once placed, an element is NEVER moved again. Max swaps &lt; N!\n        </div>\n      </div>\n    ",
    "internalWorking": "First Missing Positive (LC 41) Specialization:\n- Values can be negative or > N. Simply ignore elements where `nums[i] <= 0 || nums[i] > N`.\n- Only swap when `nums[i] > 0 && nums[i] <= N && nums[i] != nums[nums[i] - 1]`.\n- After cycle sort, scan 0..N-1: the first index where `nums[i] != i + 1` gives the answer `i + 1`.\n- If all match, answer is N + 1.",
    "complexPart": "Infinite Loop Bug: If you write `nums[i] != i + 1` in the while loop condition instead of `nums[i] != nums[correctIdx]`, duplicates will cause an infinite loop! For example: `[2, 2]`. At index 0, value 2 swaps with index 1 (value 2), resulting in `[2, 2]` forever. Always check `nums[i] != nums[nums[i] - 1]`.",
    "keyPoints": [
      "Requires array elements to correspond to indices (range [1..N] or [0..N]).",
      "Time Complexity: Strict O(N) amortized.",
      "Space Complexity: Strict O(1) auxiliary space (in-place modification).",
      "Termination Guard: Must check `nums[i] != nums[correctIndex]` to prevent duplicate cycle loops."
    ],
    "codeSnippet": "// First Missing Positive in O(N) time and O(1) space (Java 17+)\npublic int firstMissingPositive(int[] nums) {\n    int n = nums.length;\n    int i = 0;\n\n    while (i < n) {\n        int correctIdx = nums[i] - 1;\n        // Swap only if in range [1..n] and not already in correct position\n        if (nums[i] > 0 && nums[i] <= n && nums[i] != nums[correctIdx]) {\n            int temp = nums[i];\n            nums[i] = nums[correctIdx];\n            nums[correctIdx] = temp;\n        } else {\n            i++;\n        }\n    }\n\n    // Scan for first mismatch\n    for (int j = 0; j < n; j++) {\n        if (nums[j] != j + 1) {\n            return j + 1;\n        }\n    }\n    return n + 1;\n}",
    "canonicalProblems": "• LeetCode 268: Missing Number (Range 0..N)\n• LeetCode 442: Find All Duplicates in an Array (Range 1..N in O(N) time, O(1) space)\n• LeetCode 41: First Missing Positive (Hard problem solved elegantly via cyclic sort)\n• LeetCode 448: Find All Numbers Disappeared in an Array",
    "pitfall": "Index swap order: In `swap(nums, i, nums[i] - 1)`, if you assign `nums[i] = nums[nums[i] - 1]` before storing `nums[i] - 1`, the second index lookup gets corrupted! Always extract `int target = nums[i] - 1` into a local variable first.",
    "interviewTip": "Whenever an interviewer says 'numbers are between 1 and N' and 'do this in O(1) space', immediately shout 'Cyclic Sort!'"
  },
  {
    "id": "dsa-binary-search-answer",
    "title": "Binary Search on Answer Space: The Monotonic Feasibility Invariant",
    "category": "Binary Search & Heaps",
    "badge": "Top Tech Frequency",
    "triggerSignals": [
      "Find 'minimum possible maximum' or 'maximum possible minimum'",
      "Koko Eating Bananas (find min speed K)",
      "Split Array Largest Sum or Capacity To Ship Packages",
      "Answer lies within known numeric range [low, high] with monotonic feasibility function"
    ],
    "whatIsIt": "Binary Search applied not to an array, but to the answer domain [low, high]. The key prerequisite is a monotonic predicate function `check(mid)`: if a candidate value `mid` is feasible, then all values > mid (or < mid) are also feasible. This divides the search space into [false, false, ..., true, true, true], allowing O(log(range)) convergence.",
    "bruteForce": "Iterate sequentially through all candidate answers mid = 1, 2, 3, ... until `check(mid)` becomes true. Time: O((high - low) * cost_of_check). For high = 10^9 and cost = 10^5, takes 10^14 ops (Time Limit Exceeded). Bottleneck: Sequential search ignores monotonic truth values.",
    "optimalStrategy": "1. Define bounds: `low` = minimum theoretical answer (e.g., 1 or max element), `high` = maximum theoretical answer (e.g., sum of all elements).\n2. While `low <= high`:\n   `mid = low + (high - low) / 2`.\n3. If `check(mid)` is valid, record `ans = mid` and search lower: `high = mid - 1`.\n4. Else search higher: `low = mid + 1`.\n5. Total complexity: O(N * log(high - low)) where check(mid) takes O(N).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Binary Search on Monotonic Truth Space</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-red\">\n            <span class=\"node-label\">mid = 3: False</span>\n            <span class=\"node-desc\">Cannot finish in time</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► low = mid + 1 ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">mid = 4: True (Target!)</span>\n            <span class=\"node-desc\">Minimal feasible boundary</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── high = mid - 1 ◄──</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">mid = 7: True</span>\n            <span class=\"node-desc\">Feasible but not minimum</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Binary Search Predicate:</strong> Truth values are strictly monotonic: [F, F, F, F, T, T, T, T]. Binary search finds the FIRST True in O(log(range)) checks!\n        </div>\n      </div>\n    ",
    "internalWorking": "Designing the check(mid) function:\n- Usually a greedy linear scan O(N).\n- Example (Ship within D days): Walk through weights; greedily add to current boat. If `currentWeight + w > mid`, increment `daysNeeded++` and start new boat with `currentWeight = w`. Return `daysNeeded <= D`.",
    "complexPart": "Integer Overflow in Mid & Sum Calculations: When `low + high` exceeds 2^31 - 1, `(low + high) / 2` overflows to negative! Always use `mid = low + (high - low) / 2`. In check() functions, use `long currentWeight` when summing to avoid 32-bit overflow.",
    "keyPoints": [
      "Applicable whenever you see: 'Minimize the maximum' or 'Maximize the minimum'.",
      "Truth values must form a monotonic step function: `[F, F, ..., T, T]`.",
      "Time Complexity: O(N * log(search_range)).",
      "Space Complexity: O(1) auxiliary memory.",
      "Always verify lower bound: e.g. Koko's speed must be at least 1; Ship capacity must be at least max(weights)."
    ],
    "codeSnippet": "// Koko Eating Bananas (Java 17+)\npublic int minEatingSpeed(int[] piles, int h) {\n    int low = 1, high = 1;\n    for (int p : piles) high = Math.max(high, p); // Max pile\n\n    int ans = high;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (canFinish(piles, mid, h)) {\n            ans = mid;         // Feasible, try slower speed\n            high = mid - 1;\n        } else {\n            low = mid + 1;     // Infeasible, must eat faster\n        }\n    }\n    return ans;\n}\n\nprivate boolean canFinish(int[] piles, int speed, int h) {\n    long hours = 0;\n    for (int p : piles) {\n        hours += (p + speed - 1) / speed; // Ceiling division\n    }\n    return hours <= h;\n}",
    "canonicalProblems": "• LeetCode 875: Koko Eating Bananas (Minimize eating speed K)\n• LeetCode 1011: Capacity To Ship Packages Within D Days (Minimize boat capacity)\n• LeetCode 410: Split Array Largest Sum (Minimize maximum subarray sum across M splits)\n• LeetCode 1482: Minimum Number of Days to Make m Bouquets",
    "pitfall": "Incorrect ceiling division: Writing `(p / speed) + 1` fails when p is an exact multiple of speed! Use `(p + speed - 1) / speed` or `(int) Math.ceil((double) p / speed)`.",
    "interviewTip": "Whenever an interview question asks to 'minimize the maximum' or 'maximize the minimum', do NOT reach for Dynamic Programming first. 95% of the time, it is Binary Search on Answer Space with an O(N) greedy checker!"
  },
  {
    "id": "dsa-top-k-heap",
    "title": "Top 'K' Elements: PriorityQueue Sieve Pattern",
    "category": "Binary Search & Heaps",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Find K largest or K smallest elements in an array",
      "Top K Frequent Elements or K Closest Points to Origin",
      "Kth Largest Element in a Stream",
      "Reorganize string so no two adjacent characters are identical"
    ],
    "whatIsIt": "A pattern for tracking the top K extremums in an unbounded collection without sorting the entire array. To find the K largest elements, maintain a MIN-HEAP of size K. When the heap exceeds K elements, poll the smallest element. At the end, the heap contains the K largest elements in O(N log K) time and O(K) space.",
    "bruteForce": "Sort the entire array of size N using quicksort/mergesort in O(N log N) time, then take the first/last K elements. Bottleneck: Wastes work ordering the N - K elements that we do not care about.",
    "optimalStrategy": "1. Initialize Min-Heap: `PriorityQueue<Integer> minHeap = new PriorityQueue<>()`.\n2. Iterate through elements:\n   `minHeap.offer(x)`.\n   `if (minHeap.size() > k) minHeap.poll()`.\n3. The element at `minHeap.peek()` is the Kth largest element in the entire array!\n4. Time Complexity: O(N log K) which is vastly faster than O(N log N) when K << N.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Min-Heap as Top-K Largest Sieve</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Min-Heap (size = K)</span>\n            <span class=\"node-desc\">Root = Smallest of Top-K</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Ingest element X ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">size &gt; K ?</span>\n            <span class=\"node-desc\">minHeap.poll()</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Evicts smallest ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Heap Preserves Top K</span>\n            <span class=\"node-desc\">Peak candidates retained</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Counter-Intuitive Rule:</strong> To find K LARGEST elements, use a MIN-HEAP! The root holds the minimum of the top tier; any smaller incoming element is rejected!\n        </div>\n      </div>\n    ",
    "internalWorking": "QuickSelect Alternative for O(N) Average:\n- Hoare's QuickSelect partitions around a pivot.\n- If pivotIndex == target (N - K), return nums[pivotIndex].\n- If target < pivotIndex, recurse left; else recurse right.\n- Average time: O(N), worst-case: O(N^2) if bad pivot. Min-Heap is strictly O(N log K) worst-case.",
    "complexPart": "Top K Frequent Words: Frequency tie-breaking requires lexicographical ordering. In Java PriorityQueue: `(a, b) -> a.val != b.val ? a.val - b.val : b.word.compareTo(a.word)`. Notice that for Min-Heap, the secondary sort MUST be reversed so that lexicographically larger words are polled first!",
    "keyPoints": [
      "Rule: Find K LARGEST -> Use MIN-Heap of size K (root is the threshold).",
      "Rule: Find K SMALLEST -> Use MAX-Heap of size K (`Collections.reverseOrder()`).",
      "Time Complexity: O(N log K) time, O(K) memory.",
      "QuickSelect offers O(N) average time if in-place array modification is allowed."
    ],
    "codeSnippet": "// Top K Frequent Elements in O(N log K) (Java 17+)\npublic int[] topKFrequent(int[] nums, int k) {\n    Map<Integer, Integer> freqMap = new HashMap<>();\n    for (int n : nums) freqMap.put(n, freqMap.getOrDefault(n, 0) + 1);\n\n    // Min-heap ordered by frequency\n    PriorityQueue<Integer> minHeap = new PriorityQueue<>(\n        Comparator.comparingInt(freqMap::get)\n    );\n\n    for (int key : freqMap.keySet()) {\n        minHeap.offer(key);\n        if (minHeap.size() > k) {\n            minHeap.poll(); // Evict lowest frequency\n        }\n    }\n\n    int[] result = new int[k];\n    for (int i = 0; i < k; i++) {\n        result[i] = minHeap.poll();\n    }\n    return result;\n}",
    "canonicalProblems": "• LeetCode 215: Kth Largest Element in an Array (Min-Heap vs QuickSelect)\n• LeetCode 347: Top K Frequent Elements (HashMap + Min-Heap or Bucket Sort)\n• LeetCode 973: K Closest Points to Origin (Max-Heap of size K)\n• LeetCode 692: Top K Frequent Words (Tied frequency lexicographical comparator)",
    "pitfall": "Using a Max-Heap of size N instead of Min-Heap of size K. Adding N elements to a Max-Heap takes O(N log N) space and time, completely erasing the algorithmic advantage!",
    "interviewTip": "Ask the interviewer: 'Is this an offline static array or a continuous streaming dataset?' If streaming, Min-Heap of size K is the only acceptable answer because QuickSelect requires random access to the full dataset."
  },
  {
    "id": "dsa-two-heaps",
    "title": "Two Heaps Pattern: Running Median & Stream Balancing",
    "category": "Binary Search & Heaps",
    "badge": "Advanced Heap",
    "triggerSignals": [
      "Find median from a continuous stream of data",
      "Partition streaming dataset into two equal-sized halves",
      "Sliding Window Median (LC 480)",
      "IPO: Select projects maximizing capital within budget (LC 502)"
    ],
    "whatIsIt": "A pattern for tracking the median of a dynamic dataset in O(1) retrieval time. Maintains two balanced heaps: a Max-Heap for the smaller half of numbers and a Min-Heap for the larger half. The heaps are maintained such that either both have equal size, or the Max-Heap has exactly 1 more element than the Min-Heap.",
    "bruteForce": "Maintain a sorted list using Insertion Sort for every incoming number. Insertion takes O(N) shifting. Computing median takes O(1). Total time for N numbers is O(N^2). Bottleneck: Maintaining strict total order when we only need the middle elements.",
    "optimalStrategy": "1. `maxHeap`: stores smaller half, root is maximum of smaller half.\n2. `minHeap`: stores larger half, root is minimum of larger half.\n3. Add num: if `num <= maxHeap.peek()`, add to maxHeap; else add to minHeap.\n4. Rebalance sizes:\n   - if `maxHeap.size() > minHeap.size() + 1`: `minHeap.offer(maxHeap.poll())`.\n   - if `minHeap.size() > maxHeap.size()`: `maxHeap.offer(minHeap.poll())`.\n5. Median: if sizes equal, `(maxHeap.peek() + minHeap.peek()) / 2.0`; else `maxHeap.peek()`.\n6. Time: O(log N) insertion, O(1) median query.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Two Heaps Running Median Invariant</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Max-Heap (Smaller Half)</span>\n            <span class=\"node-desc\">Peek = Max of small elements</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── Median Bridge ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Min-Heap (Larger Half)</span>\n            <span class=\"node-desc\">Peek = Min of large elements</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Balance Invariant:</strong> maxHeap.size() == minHeap.size()  OR  maxHeap.size() == minHeap.size() + 1. The median is always right at the top of the heaps!\n        </div>\n      </div>\n    ",
    "internalWorking": "Sliding Window Median (LC 480) with Lazy Removal:\n- When window slides, an element leaves. Standard Heap takes O(K) to remove arbitrary element.\n- Solution: Use a HashMap `delayed` tracking count of elements pending deletion.\n- Only prune from heap top when heap root matches an element in delayed map.\n- Achieves O(N log K) time.",
    "complexPart": "Integer Overflow in Average: `(maxHeap.peek() + minHeap.peek()) / 2.0` can overflow if both values are close to Integer.MAX_VALUE! Always cast to double or long: `((double) maxHeap.peek() + minHeap.peek()) / 2.0`.",
    "keyPoints": [
      "Time Complexity: O(log N) for `addNum()`, O(1) for `findMedian()`.",
      "Space Complexity: O(N) to store stream elements across both heaps.",
      "Invariant 1: Every element in `maxHeap` <= Every element in `minHeap`.",
      "Invariant 2: `maxHeap.size() == minHeap.size()` or `maxHeap.size() == minHeap.size() + 1`."
    ],
    "codeSnippet": "// Find Median from Data Stream (Java 17+)\nclass MedianFinder {\n    private PriorityQueue<Integer> maxHeap; // Smaller half\n    private PriorityQueue<Integer> minHeap; // Larger half\n\n    public MedianFinder() {\n        maxHeap = new PriorityQueue<>(Collections.reverseOrder());\n        minHeap = new PriorityQueue<>();\n    }\n\n    public void addNum(int num) {\n        if (maxHeap.isEmpty() || num <= maxHeap.peek()) {\n            maxHeap.offer(num);\n        } else {\n            minHeap.offer(num);\n        }\n\n        // Rebalance to preserve: maxHeap.size() == minHeap.size() (+ 1)\n        if (maxHeap.size() > minHeap.size() + 1) {\n            minHeap.offer(maxHeap.poll());\n        } else if (minHeap.size() > maxHeap.size()) {\n            maxHeap.offer(minHeap.poll());\n        }\n    }\n\n    public double findMedian() {\n        if (maxHeap.size() > minHeap.size()) {\n            return maxHeap.peek();\n        } else {\n            return ((double) maxHeap.peek() + minHeap.peek()) / 2.0;\n        }\n    }\n}",
    "canonicalProblems": "• LeetCode 295: Find Median from Data Stream (Canonical Two Heaps)\n• LeetCode 480: Sliding Window Median (Two Heaps + Hash-based lazy deletion)\n• LeetCode 502: IPO (Min-Heap for capital requirement, Max-Heap for profit yield)",
    "pitfall": "Forgetting that `addNum` must initially check if `num <= maxHeap.peek()`. If you blindly add alternating between heaps, elements in maxHeap will end up larger than elements in minHeap, destroying the invariant.",
    "interviewTip": "Mention the trade-off: 'If the stream is read-heavy (many more findMedian calls than inserts), Two Heaps gives O(1) queries. If write-heavy and memory is constrained, self-balancing trees like AVL or Red-Black could also be considered.'"
  },
  {
    "id": "dsa-k-way-merge",
    "title": "K-Way Merge: Tournament Heap Pattern",
    "category": "Binary Search & Heaps",
    "badge": "Advanced Heap",
    "triggerSignals": [
      "Merge K sorted linked lists or arrays into one sorted result",
      "Find Kth smallest element in a row-wise and column-wise sorted matrix",
      "Smallest Range Covering Elements from K Lists",
      "External sorting (merging multiple sorted disk chunks)"
    ],
    "whatIsIt": "A pattern for merging K sorted sequences into a single sorted stream. A Min-Heap of size K stores the current head element of each of the K lists. At each step, poll the smallest element from the heap, append it to the result, and insert the next element from that SAME list into the heap. Total time is O(N * log K) where N is total elements.",
    "bruteForce": "Concatenate all K lists into one giant array of length N and call Arrays.sort(). Time: O(N log N). Space: O(N). Bottleneck: Completely ignores the fact that each of the K individual lists is ALREADY sorted!",
    "optimalStrategy": "1. Initialize Min-Heap of size K: `PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.val))`.\n2. Push the head of each non-empty list into pq.\n3. While pq is non-empty:\n   - `curr = pq.poll()`\n   - append curr to result list\n   - if `curr.next != null`, push `curr.next` into pq.\n4. Time: O(N log K), Space: O(K) heap memory.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: K-Way Tournament Min-Heap</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">List 1 [1, 4, 5]</span>\n            <span class=\"node-desc\">Head: 1</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Min-Heap (K=3) ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Root: 1 (Smallest)</span>\n            <span class=\"node-desc\">Poll 1 -&gt; Next: 4</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Append to Result ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Result: [1, 1, 2...]</span>\n            <span class=\"node-desc\">Sorted Output Stream</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Log K Factor:</strong> The heap never exceeds size K. Each insertion/deletion costs O(log K). For N total items, total time is strictly O(N log K)!\n        </div>\n      </div>\n    ",
    "internalWorking": "Smallest Range Covering Elements from K Lists (LC 632):\n- Store `(val, listIndex, elementIndex)` in Min-Heap of size K.\n- Track running `maxVal` across all current K elements in heap.\n- At each step, current range is `[minHeap.peek().val, maxVal]`.\n- If range is smaller than best range, update best.\n- Poll minimum, advance that list pointer, update `maxVal`, push new element.\n- Stop when any list is exhausted.",
    "complexPart": "Divide and Conquer Alternative: Instead of a Min-Heap, merge lists pairwise using Divide & Conquer (like Mergesort). Pairwise merging K lists takes log K levels, each level processing N elements -> O(N log K) time and O(1) auxiliary space (no heap object overhead)!",
    "keyPoints": [
      "Time Complexity: O(N log K) where N is total elements across all K lists.",
      "Space Complexity: O(K) heap memory (or O(1) using Divide & Conquer pairwise merge).",
      "Heap entry must retain pointer to originating list (`(val, row, col)`).",
      "Fundamental design pattern of MapReduce Merge Phase and LSM-Tree compaction."
    ],
    "codeSnippet": "// Merge k Sorted Lists using Min-Heap (Java 17+)\npublic ListNode mergeKLists(ListNode[] lists) {\n    if (lists == null || lists.length == 0) return null;\n\n    PriorityQueue<ListNode> minHeap = new PriorityQueue<>(\n        Comparator.comparingInt(node -> node.val)\n    );\n\n    // Seed heap with head of each list\n    for (ListNode node : lists) {\n        if (node != null) minHeap.offer(node);\n    }\n\n    ListNode dummy = new ListNode(0);\n    ListNode tail = dummy;\n\n    while (!minHeap.isEmpty()) {\n        ListNode smallest = minHeap.poll();\n        tail.next = smallest;\n        tail = tail.next;\n\n        if (smallest.next != null) {\n            minHeap.offer(smallest.next);\n        }\n    }\n    return dummy.next;\n}",
    "canonicalProblems": "• LeetCode 23: Merge k Sorted Lists (Min-Heap vs Divide & Conquer)\n• LeetCode 378: Kth Smallest Element in a Sorted Matrix (K-way merge on rows)\n• LeetCode 632: Smallest Range Covering Elements from K Lists (Heap + running max)\n• LeetCode 373: Find K Pairs with Smallest Sums",
    "pitfall": "Pushing null nodes into the PriorityQueue. In Java, `PriorityQueue.offer(null)` throws a `NullPointerException` immediately! Always check `if (node != null)` before offering.",
    "interviewTip": "Mention external sorting: 'This exact K-Way Merge pattern is what Apache Lucene and database engines use during External Merge Sort when datasets exceed physical RAM capacity.'"
  },
  {
    "id": "dsa-bfs-graph",
    "title": "Breadth-First Search (BFS) & Multi-Source Wave Expansion",
    "category": "Trees, Graphs & DSU",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Shortest path in unweighted graph or 2D grid",
      "Minimum turns, steps, or transformations to reach target (Word Ladder)",
      "Simultaneous spreading processes (Rotting Oranges, Fire Propagation)",
      "Level-order traversal of trees or connected networks"
    ],
    "whatIsIt": "A level-by-level graph traversal algorithm using a FIFO Queue. Because edges have uniform weight 1, visiting nodes in FIFO queue order guarantees that the first time a target node is visited, it is reached via the absolute MINIMUM number of edge transitions.",
    "bruteForce": "Exhaustive DFS exploring all possible paths to the target and taking the minimum length. Time: Exponential O(4^(R*C)) on a grid because DFS backtracks and re-evaluates cycles. Bottleneck: Explores deep suboptimal dead-ends before discovering short paths.",
    "optimalStrategy": "1. Initialize Queue and visited boolean array.\n2. Push initial node(s) into Queue with `distance = 0` (for Multi-Source BFS, push ALL initial source nodes into Queue simultaneously at t=0).\n3. While Queue is not empty:\n   `levelSize = queue.size()`.\n   Iterate `levelSize` times:\n   `curr = queue.poll()`.\n   If `curr == target`, return `distance`.\n   For each neighbor: if not visited, mark visited and `queue.offer(neighbor)`.\n   `distance++`.\n4. Time: O(V + E) or O(R * C), Space: O(V).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Multi-Source BFS Concentric Ripple Expansion</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-red\">\n            <span class=\"node-label\">t=0: All Rotten Oranges</span>\n            <span class=\"node-desc\">Enqueued simultaneously!</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Wave 1 ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">t=1: Adjacent Neighbors</span>\n            <span class=\"node-desc\">Fresh turned rotten</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Wave 2 ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">t=2: Next Perimeter</span>\n            <span class=\"node-desc\">Shortest time to rot</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Shortest Path Guarantee:</strong> In an unweighted graph, BFS discovers nodes strictly in increasing order of their distance from origin. First visit == Shortest path!\n        </div>\n      </div>\n    ",
    "internalWorking": "0-1 BFS with Deque (Edge weights 0 or 1):\n- Standard Dijkstra takes O(E log V).\n- With 0-1 BFS, use an `ArrayDeque`.\n- If edge weight is 0: `deque.offerFirst(neighbor)` (process immediately in current level).\n- If edge weight is 1: `deque.offerLast(neighbor)` (process in next level).\n- Achieves O(V + E) shortest path!",
    "complexPart": "Bidirectional BFS (Word Ladder LC 127): Instead of searching from start to end (branching factor b^d), search simultaneously from start and end using two sets. Alternate expanding the smaller set. Reduces complexity from O(b^d) to O(b^(d/2)), converting an impossible TLE into a 15ms execution!",
    "keyPoints": [
      "Only guarantees shortest path if ALL edge weights are UNIFORM (unweighted).",
      "Multi-Source BFS: Enqueue all starting sources into Queue before starting the while loop.",
      "Mark nodes visited WHEN ENQUEUING, not when polling! Marking on poll causes duplicate queue insertions and O(V^2) memory explosion.",
      "Time Complexity: O(V + E) for graphs, O(R * C) for grids.",
      "Space Complexity: O(V) queue capacity."
    ],
    "codeSnippet": "// Rotting Oranges (Multi-Source BFS in Java 17+)\npublic int orangesRotting(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length;\n    Queue<int[]> queue = new ArrayDeque<>();\n    int freshCount = 0;\n\n    // 1. Enqueue all initial rotten oranges (t=0 sources)\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == 2) queue.offer(new int[]{r, c});\n            else if (grid[r][c] == 1) freshCount++;\n        }\n    }\n\n    if (freshCount == 0) return 0;\n    int minutes = 0;\n    int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};\n\n    // 2. Wave-by-wave level expansion\n    while (!queue.isEmpty() && freshCount > 0) {\n        int size = queue.size();\n        for (int i = 0; i < size; i++) {\n            int[] curr = queue.poll();\n            for (int[] d : dirs) {\n                int nr = curr[0] + d[0], nc = curr[1] + d[1];\n                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {\n                    grid[nr][nc] = 2; // Mark rotten (visited) immediately!\n                    freshCount--;\n                    queue.offer(new int[]{nr, nc});\n                }\n            }\n        }\n        minutes++;\n    }\n\n    return freshCount == 0 ? minutes : -1;\n}",
    "canonicalProblems": "• LeetCode 994: Rotting Oranges (Multi-source BFS)\n• LeetCode 127: Word Ladder (Shortest string transformation / Bidirectional BFS)\n• LeetCode 542: 01 Matrix (Multi-source distance to nearest 0)\n• LeetCode 1091: Shortest Path in Binary Matrix (8-directional BFS)",
    "pitfall": "Marking visited on `queue.poll()` instead of `queue.offer()`. In a dense grid, multiple nodes can offer the same neighbor in the same level. If not marked visited immediately on offer, the neighbor is enqueued multiple times, causing OutOfMemoryError.",
    "interviewTip": "Whenever you have multiple starting points (e.g. fire spreading while human runs, multiple gates in rooms), always use Multi-Source BFS: enqueue all starting sources at t=0."
  },
  {
    "id": "dsa-dfs-islands",
    "title": "Depth-First Search (DFS): Connected Components & Grid Traversal",
    "category": "Trees, Graphs & DSU",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Count number of islands or connected components",
      "Flood fill or capture surrounded regions",
      "Word Search in grid (backtracking DFS with unmarking)",
      "Detecting cycles in directed/undirected graphs"
    ],
    "whatIsIt": "A recursive graph exploration strategy that traverses as deep as possible along each branch before backtracking. For grid problems (Number of Islands), visiting a cell triggers recursive DFS to mark all orthogonally connected land cells as visited, collapsing an entire connected component into a single count.",
    "bruteForce": "Running separate pairwise reachability checks between every pair of cells in O((R*C)^2). Bottleneck: Re-evaluates cells that already belong to an explored connected component.",
    "optimalStrategy": "1. Iterate through grid r = 0..rows-1, c = 0..cols-1.\n2. When `grid[r][c] == '1'`:\n   `islandCount++`\n   `dfs(r, c)` -> sets `grid[r][c] = '0'` (in-place visited marking) and recursively calls 4 neighbors.\n3. Base conditions in dfs:\n   if `r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1'` return.\n4. Total time: O(R * C) because each cell is visited at most 4 times.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Recursive Flood Fill Component Sinking</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Found Land '1'</span>\n            <span class=\"node-desc\">New Island Count + 1</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Recursive Sink ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">DFS 4-Directions</span>\n            <span class=\"node-desc\">Set grid[r][c] = '0'</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Entire Island Sunk ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Component Consumed</span>\n            <span class=\"node-desc\">Resume outer scan</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>In-Place Optimization:</strong> Mutating `grid[r][c] = '0'` replaces the need for a `boolean[][] visited` array, saving O(R*C) memory!\n        </div>\n      </div>\n    ",
    "internalWorking": "Cycle Detection in Directed Graphs via 3-Coloring:\n- WHITE (0): Unvisited node.\n- GRAY (1): Currently in recursion stack (visiting ancestors).\n- BLACK (2): Fully explored and closed.\n- If DFS encounters a GRAY node, a back-edge (CYCLE) is detected!",
    "complexPart": "Surrounded Regions (LC 130): Flip all 'O's surrounded by 'X's. Don't start from inside! Start DFS from the BORDERS: any 'O' connected to the boundary cannot be captured. Mark all boundary-connected 'O's with temporary character '#'. Then iterate full grid: flip remaining 'O' -> 'X', and restore '#' -> 'O'.",
    "keyPoints": [
      "Time Complexity: O(V + E) for graphs, O(R * C) for 2D grids.",
      "Space Complexity: O(R * C) recursion call stack depth in worst-case (snake grid).",
      "Always check boundary conditions BEFORE accessing `grid[r][c]` to avoid ArrayIndexOutOfBoundsException.",
      "In-place grid modification eliminates O(R*C) visited array memory overhead."
    ],
    "codeSnippet": "// Number of Islands in O(R * C) (Java 17+)\npublic int numIslands(char[][] grid) {\n    if (grid == null || grid.length == 0) return 0;\n    int rows = grid.length, cols = grid[0].length;\n    int islands = 0;\n\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == '1') {\n                islands++;\n                sinkIsland(grid, r, c);\n            }\n        }\n    }\n    return islands;\n}\n\nprivate void sinkIsland(char[][] grid, int r, int c) {\n    // Base case: bounds check or water\n    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') {\n        return;\n    }\n    grid[r][c] = '0'; // Sink cell (mark visited)\n\n    sinkIsland(grid, r + 1, c);\n    sinkIsland(grid, r - 1, c);\n    sinkIsland(grid, r, c + 1);\n    sinkIsland(grid, r, c - 1);\n}",
    "canonicalProblems": "• LeetCode 200: Number of Islands (Canonical grid DFS)\n• LeetCode 695: Max Area of Island (Accumulate area recursively)\n• LeetCode 130: Surrounded Regions (Boundary-first DFS)\n• LeetCode 79: Word Search (Backtracking DFS with unmarking)",
    "pitfall": "StackOverflowError on very large grids (e.g. 1000x1000). If recursion limit is exceeded, switch to BFS using an explicit `ArrayDeque` or increase JVM stack size `-Xss`.",
    "interviewTip": "Ask the interviewer before in-place mutation: 'May I mutate the input grid in-place to save memory, or is it considered immutable?' If immutable, allocate a `boolean[][] visited`."
  },
  {
    "id": "dsa-topological-sort",
    "title": "Topological Sort & Kahn's Algorithm (DAG Dependency Resolution)",
    "category": "Trees, Graphs & DSU",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Prerequisite tasks / Course Schedule",
      "Build system package compilation order (DAG)",
      "Alien Dictionary (deducing alphabet order from sorted word list)",
      "Cycle detection in directed graphs"
    ],
    "whatIsIt": "A linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u -> v, vertex u comes before v. Kahn's Algorithm uses an in-degree array and a Queue to iteratively peel off vertices with in-degree 0 (no remaining dependencies). If the output contains fewer than V vertices, the graph contains a DIRECTED CYCLE.",
    "bruteForce": "Exhaustively testing all V! permutations of vertices to check if prerequisite order is valid. Time: O(V! * E). Bottleneck: Combinatorial explosion.",
    "optimalStrategy": "1. Build adjacency list and compute `inDegree[u]` for all nodes.\n2. Enqueue all vertices with `inDegree[u] == 0` into Queue.\n3. While Queue is not empty:\n   `curr = queue.poll()`\n   `order.add(curr)`\n   For each neighbor v of curr:\n     `inDegree[v]--`\n     if `inDegree[v] == 0`, `queue.offer(v)`.\n4. If `order.size() == V` -> Valid topological order!\n5. Else `order.size() < V` -> Cycle detected (impossible to complete all courses).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Kahn's In-Degree 0 Peeling Queue</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">In-Degree == 0</span>\n            <span class=\"node-desc\">No prerequisites! Enqueue</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Poll &amp; Decrement ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Peel Vertex</span>\n            <span class=\"node-desc\">neighbors inDegree--</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► New In-Degree 0 ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Enqueue Next Batch</span>\n            <span class=\"node-desc\">Repeat until queue empty</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Cycle Detection Invariant:</strong> If there is a cycle (e.g. A -&gt; B -&gt; A), the in-degrees of nodes in the cycle will NEVER reach 0, so they are never enqueued!\n        </div>\n      </div>\n    ",
    "internalWorking": "Alien Dictionary (LC 269):\n- Compare adjacent words in sorted dictionary: find first differing character `w1[k] != w2[k]`.\n- Add directed edge `w1[k] -> w2[k]` and increment `inDegree[w2[k]]++`.\n- Trap: If `w1.startsWith(w2)` and `w1.length() > w2.length()` (e.g. 'apple' before 'app'), input is invalid -> return empty string!\n- Run Kahn's algorithm to produce alien alphabet order.",
    "complexPart": "Minimum Height Trees (LC 310): Find roots that minimize tree height. This is reverse topological sort on an undirected tree! Leaf nodes have `degree == 1`. Repeatedly peel leaves layer-by-layer until <= 2 nodes remain. Those remaining 1 or 2 nodes are the exact tree centroids!",
    "keyPoints": [
      "Only possible on Directed Acyclic Graphs (DAGs). Fails on cyclic graphs.",
      "Time Complexity: O(V + E) linear in graph vertices and edges.",
      "Space Complexity: O(V + E) for adjacency list and in-degree array.",
      "Cycle Check: `processedCount < V` guarantees a directed cycle exists."
    ],
    "codeSnippet": "// Course Schedule II (Kahn's Algorithm in Java 17+)\npublic int[] findOrder(int numCourses, int[][] prerequisites) {\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());\n    int[] inDegree = new int[numCourses];\n\n    // Build graph: [course, prereq] -> prereq -> course\n    for (int[] p : prerequisites) {\n        int course = p[0], prereq = p[1];\n        adj.get(prereq).add(course);\n        inDegree[course]++;\n    }\n\n    Queue<Integer> queue = new ArrayDeque<>();\n    for (int i = 0; i < numCourses; i++) {\n        if (inDegree[i] == 0) queue.offer(i);\n    }\n\n    int[] order = new int[numCourses];\n    int index = 0;\n\n    while (!queue.isEmpty()) {\n        int u = queue.poll();\n        order[index++] = u;\n\n        for (int v : adj.get(u)) {\n            inDegree[v]--;\n            if (inDegree[v] == 0) queue.offer(v);\n        }\n    }\n\n    return index == numCourses ? order : new int[0]; // Cycle if < numCourses\n}",
    "canonicalProblems": "• LeetCode 207: Course Schedule I (Cycle detection in DAG)\n• LeetCode 210: Course Schedule II (Return topological order)\n• LeetCode 269: Alien Dictionary (Build DAG from lexicographical strings)\n• LeetCode 310: Minimum Height Trees (Leaf-peeling topological trim)",
    "pitfall": "Edge direction inversion: In `[course, prereq]`, the edge is `prereq -> course` (must take prereq first), NOT `course -> prereq`. Reversing this builds an inverse graph that gives reverse topological order.",
    "interviewTip": "Highlight the dual capability: 'Kahn's algorithm not only constructs the topological ordering in O(V + E), but also serves as the industry standard for cycle detection in dependency graphs (like Maven/Gradle builds).'"
  },
  {
    "id": "dsa-union-find",
    "title": "Union-Find (DSU): Path Compression & Rank Balancing",
    "category": "Trees, Graphs & DSU",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Dynamic graph connectivity (are nodes A and B connected?)",
      "Detect cycle in an undirected graph",
      "Kruskal's Minimum Spanning Tree (MST)",
      "Accounts Merge or Number of Connected Components"
    ],
    "whatIsIt": "A tree-based disjoint set data structure supporting two near-instantaneous operations: `find(x)` (finds root representative of set containing x) and `union(x, y)` (merges sets containing x and y). Powered by Path Compression and Union by Rank, any sequence of M operations on N elements takes O(M * α(N)) time, where α is the Inverse Ackermann function (α(N) < 5 for all atoms in the universe -> practically O(1)!).",
    "bruteForce": "Use BFS/DFS for every connectivity query to search if a path exists between u and v in O(V + E). For Q queries, total time is O(Q * (V + E)). Bottleneck: Re-traverses existing static edges for every dynamic query.",
    "optimalStrategy": "1. `parent[i] = i`, `rank[i] = 0`.\n2. `find(i)`: recursively traverse up parent pointers. Crucial: `parent[i] = find(parent[i])` (Path Compression flattens the tree so all visited nodes point directly to the root).\n3. `union(x, y)`: `rootX = find(x)`, `rootY = find(y)`. If `rootX == rootY`, cycle detected!\n   Else attach smaller rank tree under larger rank tree (Union by Rank). If ranks equal, attach and increment rank by 1.\n4. Amortized time per operation: O(α(N)) ≈ O(1)!",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Path Compression in Union-Find</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Deep Chain</span>\n            <span class=\"node-desc\">4 -&gt; 3 -&gt; 2 -&gt; 1 -&gt; Root(0)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► find(4) with compression ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Flattened Star Tree</span>\n            <span class=\"node-desc\">4, 3, 2, 1 all point to 0!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Inverse Ackermann:</strong> With Path Compression + Union by Rank, tree height never exceeds 4. Every subsequent find() on any node in the chain is strict O(1)!\n        </div>\n      </div>\n    ",
    "internalWorking": "Redundant Connection (LC 684):\n- Given an undirected graph that started as a tree of N nodes and had 1 extra edge added.\n- Iterate through edges: for edge (u, v), if `union(u, v) == false` (meaning `find(u) == find(v)` already), this edge is the redundant edge that creates the cycle!\n- Return (u, v) immediately in O(N * α(N)) time.",
    "complexPart": "Accounts Merge (LC 721): Nodes are emails (Strings). Map each email to a unique integer ID. Union emails belonging to the same account. Group emails by `find(emailId)` root representative. Sort emails per group and output.",
    "keyPoints": [
      "Path Compression: `parent[x] = find(parent[x])` reduces depth on every search.",
      "Union by Rank: Keeps trees balanced by attaching shorter tree under taller root.",
      "Time Complexity: O(α(N)) ≈ O(1) amortized per operation.",
      "Space Complexity: O(N) array memory for `parent[]` and `rank[]`."
    ],
    "codeSnippet": "// Production-Grade Union-Find Class (Java 17+)\nclass UnionFind {\n    private int[] parent;\n    private int[] rank;\n    public int count; // Number of connected components\n\n    public UnionFind(int n) {\n        parent = new int[n];\n        rank = new int[n];\n        count = n;\n        for (int i = 0; i < n; i++) parent[i] = i;\n    }\n\n    public int find(int x) {\n        if (parent[x] != x) {\n            parent[x] = find(parent[x]); // Path Compression\n        }\n        return parent[x];\n    }\n\n    public boolean union(int x, int y) {\n        int rootX = find(x);\n        int rootY = find(y);\n        if (rootX == rootY) return false; // Already in same set (Cycle!)\n\n        // Union by Rank\n        if (rank[rootX] < rank[rootY]) {\n            parent[rootX] = rootY;\n        } else if (rank[rootX] > rank[rootY]) {\n            parent[rootY] = rootX;\n        } else {\n            parent[rootY] = rootX;\n            rank[rootX]++;\n        }\n        count--;\n        return true;\n    }\n}",
    "canonicalProblems": "• LeetCode 684: Redundant Connection (Cycle detection in undirected graph)\n• LeetCode 323: Number of Connected Components in an Undirected Graph\n• LeetCode 721: Accounts Merge (String email mapping to DSU components)\n• LeetCode 128: Longest Consecutive Sequence (DSU or HashSet)",
    "pitfall": "Forgetting path compression in `find()`. Writing `while(x != parent[x]) x = parent[x]; return x;` without path compression degrades tree into a linear linked list of height N under skewed unions, making operations O(N) instead of O(1)!",
    "interviewTip": "Mention the Ackermann function: 'With both path compression and union by rank, the time complexity per operation is O(alpha(N)), which is bounded by 4 for any practical input size.'"
  },
  {
    "id": "dsa-graph-dijkstra",
    "title": "Dijkstra's Algorithm: PriorityQueue Shortest Path in Weighted Graphs",
    "category": "Trees, Graphs & DSU",
    "badge": "Weighted Graphs",
    "triggerSignals": [
      "Shortest path in weighted graph with non-negative edge weights",
      "Network Delay Time (minimum time for signal to reach all nodes)",
      "Path with Minimum Effort / Maximum Probability",
      "Cheapest Flights Within K Stops (modified with step tracking)"
    ],
    "whatIsIt": "A greedy shortest-path algorithm for directed or undirected graphs with non-negative edge weights. Maintains a Min-Heap of `(dist, u)` and an array `distTo[]` initialized to infinity. Greedily pops the unvisited node with the smallest known distance, finalizes its shortest path, and relaxes all its outgoing edges.",
    "bruteForce": "BFS fails because edges have unequal weights (an edge of weight 10 is not 10 hops). DFS explores all exponential paths in O(V!). Bottleneck: Does not exploit greedy triangle inequality.",
    "optimalStrategy": "1. `distTo` array filled with `Integer.MAX_VALUE`, `distTo[start] = 0`.\n2. `minHeap.offer(new int[]{0, start})`.\n3. While minHeap is not empty:\n   `curr = minHeap.poll()`, `d = curr[0]`, `u = curr[1]`.\n   If `d > distTo[u]`, continue (stale outdated heap entry!).\n   For each edge (u, v, weight):\n     if `distTo[u] + weight < distTo[v]`:\n       `distTo[v] = distTo[u] + weight`\n       `minHeap.offer(new int[]{distTo[v], v})`.\n4. Time Complexity: O((V + E) log V) with binary heap.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Dijkstra's Greedy Relaxation Wave</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Node U (dist = 4)</span>\n            <span class=\"node-desc\">Polled from Min-Heap (Finalized!)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Edge (weight = 3) ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Relax Edge U -&gt; V</span>\n            <span class=\"node-desc\">4 + 3 = 7 &lt; distTo[V] (Inf)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Push to Heap ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">distTo[V] = 7</span>\n            <span class=\"node-desc\">Enqueued with lower cost</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Non-Negative Weight Invariant:</strong> Because all weights are &gt;= 0, once a node is polled from the Min-Heap, no future path can ever reach it with a smaller distance!\n        </div>\n      </div>\n    ",
    "internalWorking": "Handling Stale Entries (Lazy Deletion):\n- In standard Java `PriorityQueue`, decreasing an element's key is O(N).\n- Instead of decrease-key, we simply offer the new `(distTo[v], v)` pair into the heap.\n- When popped, if `d > distTo[u]`, it is an obsolete stale entry -> skip it immediately with `continue`!\n- Memory footprint increases by at most E entries, but avoids expensive O(N) heap linear scans.",
    "complexPart": "Why Dijkstra Fails on Negative Weights: If an edge has negative weight, a node finalized with a greedy positive distance could later be reached via a negative detour with a smaller total cost, violating the greedy invariant. You MUST use Bellman-Ford O(V * E) or SPFA when negative weights exist.",
    "keyPoints": [
      "Strict requirement: ALL edge weights must be NON-NEGATIVE (>= 0).",
      "Time Complexity: O((V + E) log V) with binary PriorityQueue.",
      "Space Complexity: O(V + E) for adjacency list and heap.",
      "Stale check: Always check `if (d > distTo[u]) continue;` upon polling.",
      "For negative edge weights, use Bellman-Ford algorithm in O(V * E)."
    ],
    "codeSnippet": "// Network Delay Time via Dijkstra (Java 17+)\npublic int networkDelayTime(int[][] times, int n, int k) {\n    List<List<int[]>> adj = new ArrayList<>();\n    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());\n    for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]}); // u -> {v, w}\n\n    int[] distTo = new int[n + 1];\n    Arrays.fill(distTo, Integer.MAX_VALUE);\n    distTo[k] = 0;\n\n    // Min-heap storing {distance, node}\n    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));\n    pq.offer(new int[]{0, k});\n\n    while (!pq.isEmpty()) {\n        int[] curr = pq.poll();\n        int d = curr[0], u = curr[1];\n        if (d > distTo[u]) continue; // Skip stale entry!\n\n        for (int[] edge : adj.get(u)) {\n            int v = edge[0], w = edge[1];\n            if (distTo[u] + w < distTo[v]) {\n                distTo[v] = distTo[u] + w;\n                pq.offer(new int[]{distTo[v], v});\n            }\n        }\n    }\n\n    int maxDist = 0;\n    for (int i = 1; i <= n; i++) {\n        if (distTo[i] == Integer.MAX_VALUE) return -1; // Unreachable\n        maxDist = Math.max(maxDist, distTo[i]);\n    }\n    return maxDist;\n}",
    "canonicalProblems": "• LeetCode 743: Network Delay Time (Canonical Dijkstra)\n• LeetCode 1631: Path With Minimum Effort (Minimax edge weight Dijkstra)\n• LeetCode 778: Swim in Rising Water (Grid-based Dijkstra)\n• LeetCode 787: Cheapest Flights Within K Stops (Modified Dijkstra with stop tracking)",
    "pitfall": "Forgetting the stale entry check `if (d > distTo[u]) continue`. Without this, duplicate nodes inserted with old higher distances will re-explore all their outgoing edges, inflating runtime to exponential worst-cases.",
    "interviewTip": "Be ready to contrast: 'BFS for unweighted shortest paths (O(V+E)); Dijkstra for non-negative weighted graphs (O((V+E)logV)); Bellman-Ford for graphs with negative weights or negative cycle detection (O(V*E)).'"
  },
  {
    "id": "dsa-backtracking",
    "title": "Backtracking: State-Space Tree Pruning Pattern",
    "category": "Dynamic Programming & Backtracking",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Generate all possible subsets, permutations, or combinations",
      "Constraint satisfaction puzzles (N-Queens, Sudoku Solver)",
      "Partition array into K subsets with equal sum",
      "Word Search or path finding with unmarking requirements"
    ],
    "whatIsIt": "A systematic algorithm for finding all (or some) solutions to computational problems by building candidates incrementally. As soon as a partial candidate violates the problem's constraints, it is abandoned ('pruned') immediately, cutting off entire exponential branches of the search tree. Pattern: Choose -> Recurse -> Unchoose (Backtrack).",
    "bruteForce": "Generate all N^N or 2^N complete possibilities first, then check each one against the constraints. Bottleneck: Evaluates millions of complete candidates that failed at step 1.",
    "optimalStrategy": "1. Base Case: if current state meets goal (e.g. `path.size() == k`), add deep copy of path to result (`new ArrayList<>(path)`).\n2. For each choice in candidate list:\n   - Prune: if choice is invalid, continue.\n   - Choose: update state (`path.add(choice)`, mark visited).\n   - Recurse: `backtrack(nextIndex, path, state)`.\n   - Unchoose (Backtrack): revert state (`path.remove(path.size() - 1)`, unmark visited).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Backtracking Choose-Recurse-Unchoose Cycle</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">1. Choose</span>\n            <span class=\"node-desc\">path.add(val), mark used</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Recurse ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">2. Recurse</span>\n            <span class=\"node-desc\">backtrack(index + 1)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Backtrack ──►</span>\n          <div class=\"flow-step-node node-red\">\n            <span class=\"node-label\">3. Unchoose</span>\n            <span class=\"node-desc\">path.remove(), unmark</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Pruning Impact:</strong> In N-Queens, checking column/diagonal safety BEFORE placing a queen prunes 99.9% of branches, turning an impossible 64! search into sub-millisecond execution!\n        </div>\n      </div>\n    ",
    "internalWorking": "Subsets vs Permutations vs Combinations Indexing:\n- Subsets / Combinations: pass `start` index to recursive call `backtrack(i + 1)` so elements are never picked in reverse order (avoids duplicate combinations like [1, 2] and [2, 1]).\n- Permutations: always loop from `i = 0 to N - 1`, tracking used elements with a `boolean[] used` array.",
    "complexPart": "Deduplication with Duplicate Input Elements (Subsets II / Permutations II):\n1. Sort the input array first: `Arrays.sort(nums)`.\n2. In loop, skip duplicate choices at the SAME tree level: `if (i > start && nums[i] == nums[i - 1]) continue;`.\nThis ensures duplicate elements are only chosen sequentially across recursive depths, never as parallel branches.",
    "keyPoints": [
      "Crucial: Always add a DEEP COPY to results: `result.add(new ArrayList<>(path))` (otherwise all entries in result reflect the final empty path!).",
      "Time Complexity: O(2^N) for subsets, O(N!) for permutations.",
      "Prune early: check validity BEFORE making the recursive call.",
      "Unchoose step must perfectly invert the Choose step."
    ],
    "codeSnippet": "// Combination Sum with Candidate Pruning (Java 17+)\npublic List<List<Integer>> combinationSum(int[] candidates, int target) {\n    Arrays.sort(candidates); // Sort for early pruning\n    List<List<Integer>> result = new ArrayList<>();\n    backtrack(candidates, target, 0, new ArrayList<>(), result);\n    return result;\n}\n\nprivate void backtrack(int[] candidates, int remain, int start, \n                       List<Integer> path, List<List<Integer>> result) {\n    if (remain == 0) {\n        result.add(new ArrayList<>(path)); // Deep copy!\n        return;\n    }\n\n    for (int i = start; i < candidates.length; i++) {\n        if (candidates[i] > remain) break; // Early prune (since sorted)\n\n        path.add(candidates[i]); // Choose\n        backtrack(candidates, remain - candidates[i], i, path, result); // Recurse\n        path.remove(path.size() - 1); // Unchoose (Backtrack)\n    }\n}",
    "canonicalProblems": "• LeetCode 78: Subsets (Standard power set)\n• LeetCode 46: Permutations (Order matters, boolean[] used tracking)\n• LeetCode 39: Combination Sum (Reuse allowed, early pruning)\n• LeetCode 51: N-Queens (Diagonals boolean hash bitmasking)",
    "pitfall": "Adding `result.add(path)` without creating a new list. Because `path` is passed by reference and later emptied by backtracking, your result list will end up containing N empty lists `[[], [], []]`!",
    "interviewTip": "Emphasize pruning: 'By sorting the array upfront, if candidates[i] > remaining, we can immediately break out of the loop because all subsequent candidates will also exceed remaining, pruning the entire subtree.'"
  },
  {
    "id": "dsa-dp-1d-kadane",
    "title": "1D Dynamic Programming: Kadane's Algorithm & State Optimization",
    "category": "Dynamic Programming & Backtracking",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Maximum subarray sum (contiguous elements)",
      "House Robber (cannot rob adjacent houses)",
      "Coin Change (minimum coins to make amount)",
      "Climbing Stairs or Decode Ways (Fibonacci state transitions)"
    ],
    "whatIsIt": "A dynamic programming formulation where the optimal answer for a subproblem of length i depends directly on a fixed window of preceding states (i-1, i-2). In Kadane's algorithm, the maximum subarray ending at index i is either the element itself (starting fresh) or the element added to the previous maximum subarray. Because only the immediate previous state is required, memory collapses from an O(N) table to O(1) registers.",
    "bruteForce": "For Maximum Subarray, check all N*(N+1)/2 subarrays using two nested loops and compute sums in O(N^2) or O(N^3). Bottleneck: Recomputes prefix sums repeatedly.",
    "optimalStrategy": "1. Kadane's recurrence: `currentMax = Math.max(nums[i], currentMax + nums[i])`.\n2. Global tracking: `globalMax = Math.max(globalMax, currentMax)`.\n3. House Robber recurrence: `dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i])`.\n4. Space optimization: Replace `int[] dp` with two scalar variables `prev1` and `prev2`.\n5. Time: O(N), Space: O(1).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Kadane's Local vs Global Maximum Transition</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Extend Previous?</span>\n            <span class=\"node-desc\">currentMax + nums[i]</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Math.max() ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Start Fresh?</span>\n            <span class=\"node-desc\">nums[i] standalone</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Update Global ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">globalMax</span>\n            <span class=\"node-desc\">max(globalMax, currentMax)</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Negative Reset Rule:</strong> If currentMax dips below 0, it is a liability! Extending it would only hurt future subarrays, so we discard it and start fresh at the next number!\n        </div>\n      </div>\n    ",
    "internalWorking": "Longest Increasing Subsequence (LIS) in O(N log N):\n- Standard DP takes O(N^2) with `dp[i] = 1 + max(dp[j])`.\n- O(N log N) Patient Sorting: maintain array `tails[]` where `tails[len]` is the smallest tail of all increasing subsequences of length `len`.\n- For each x in nums, binary search in `tails[]`. If x is greater than all tails, append it. Else replace the first element >= x.\n- Final length of `tails[]` is the LIS length!",
    "complexPart": "Maximum Product Subarray (LC 152): Negative numbers flip signs (negative * negative = positive)! You MUST track BOTH `maxProduct` and `minProduct` simultaneously. When `nums[i] < 0`, swap `maxProduct` and `minProduct` before multiplying!",
    "keyPoints": [
      "Optimal Substructure: Solution to problem of size N incorporates solution to size N-1.",
      "Overlapping Subproblems: Recursion repeats work; DP caches or tabulates.",
      "Space Optimization: If state only looks back K steps, drop the array and keep K scalar variables to achieve O(1) space.",
      "Time Complexity: O(N) linear time.",
      "Space Complexity: O(1) memory."
    ],
    "codeSnippet": "// Kadane's Maximum Subarray in O(N) time and O(1) space (Java 17+)\npublic int maxSubArray(int[] nums) {\n    int currentMax = nums[0];\n    int globalMax = nums[0];\n\n    for (int i = 1; i < nums.length; i++) {\n        // Either extend the previous subarray or start fresh from current element\n        currentMax = Math.max(nums[i], currentMax + nums[i]);\n        globalMax = Math.max(globalMax, currentMax);\n    }\n    return globalMax;\n}\n\n// House Robber with O(1) Memory State Optimization\npublic int rob(int[] nums) {\n    int prev2 = 0; // dp[i-2]\n    int prev1 = 0; // dp[i-1]\n\n    for (int num : nums) {\n        int current = Math.max(prev1, prev2 + num);\n        prev2 = prev1;\n        prev1 = current;\n    }\n    return prev1;\n}",
    "canonicalProblems": "• LeetCode 53: Maximum Subarray (Canonical Kadane)\n• LeetCode 198: House Robber (O(1) space 2-state DP)\n• LeetCode 152: Maximum Product Subarray (Tracking min & max products)\n• LeetCode 300: Longest Increasing Subsequence (O(N log N) Patience Sorting)",
    "pitfall": "Initializing `globalMax = 0` in Kadane's algorithm. If the input array consists entirely of negative numbers `[-5, -2, -8]`, initializing to 0 produces a wrong answer (0 instead of -2)! Always initialize `globalMax = nums[0]`.",
    "interviewTip": "Start by explaining the O(N) array approach `dp[i]`, then impress the interviewer by stating: 'Notice that dp[i] only depends on dp[i-1] and dp[i-2]. We can optimize space from O(N) to O(1) using two scalar variables.'"
  },
  {
    "id": "dsa-dp-2d-knapsack",
    "title": "2D Dynamic Programming: 0/1 Knapsack & Unbounded Subsets",
    "category": "Dynamic Programming & Backtracking",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Select subset of items with weights and values to maximize value within capacity W",
      "Partition Equal Subset Sum (can array be partitioned into two equal sum subsets?)",
      "Target Sum (assign + or - signs to reach target)",
      "Coin Change II (number of combinations for amount using unlimited coins)"
    ],
    "whatIsIt": "A 2D decision grid where rows represent the subset of items considered (1..N) and columns represent remaining capacity or target value (0..W). For 0/1 Knapsack (each item usable at most once), we choose `max(exclude_item, include_item)`. For Unbounded Knapsack (unlimited copies), including an item transitions from the SAME row instead of the previous row.",
    "bruteForce": "Recursive branching: for each item, either include it or exclude it. Generates all 2^N subsets in O(2^N) time. Bottleneck: Recomputes identical remaining capacity states thousands of times.",
    "optimalStrategy": "1. State: `dp[i][w]` = maximum value achievable using a subset of the first i items with capacity w.\n2. Recurrence:\n   `dp[i][w] = dp[i-1][w]` (exclude item i)\n   if `w >= wt[i-1]`: `dp[i][w] = Math.max(dp[i][w], val[i-1] + dp[i-1][w - wt[i-1]])`.\n3. 1D Space Optimization for 0/1 Knapsack: Iterate capacity w BACKWARDS from W down to wt[i]! This guarantees an item is never used more than once in the same row.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: 0/1 Knapsack Backwards 1D Rolling Array</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Target W (Right)</span>\n            <span class=\"node-desc\">Iterate backwards: W -&gt; wt</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── Read Old State ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">dp[w - wt] (Left)</span>\n            <span class=\"node-desc\">Still holds (i - 1) value!</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Overwrite ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">dp[w] updated</span>\n            <span class=\"node-desc\">No item reuse!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Why Backwards Loop?</strong> Iterating backwards prevents overwriting dp[w - wt] before dp[w] reads it. If you iterated forwards, item i would be reused multiple times (Unbounded)!\n        </div>\n      </div>\n    ",
    "internalWorking": "Partition Equal Subset Sum (LC 416) Math Transformation:\n- Total sum = S. If S is odd, partitioning into two equal subsets is impossible -> return false.\n- Target = S / 2. Problem reduces identically to 0/1 Knapsack: can we find a subset of numbers that sums exactly to Target?",
    "complexPart": "Target Sum (LC 494) Math Reduction:\n- Let P be subset with '+' and N be subset with '-'.\n- `sum(P) - sum(N) = target` and `sum(P) + sum(N) = totalSum`.\n- Adding both equations: `2 * sum(P) = target + totalSum`  ==>  `sum(P) = (target + totalSum) / 2`.\n- If `target + totalSum` is odd or negative, impossible. Otherwise, standard 0/1 subset sum count!",
    "keyPoints": [
      "0/1 Knapsack: Items used at most once -> Loop capacity BACKWARDS: `for (int w = W; w >= wt; w--)`.",
      "Unbounded Knapsack: Items reused -> Loop capacity FORWARDS: `for (int w = wt; w <= W; w++)`.",
      "Time Complexity: O(N * W) pseudo-polynomial.",
      "Space Complexity: O(W) with 1D array optimization."
    ],
    "codeSnippet": "// Partition Equal Subset Sum in O(N * Target) and O(Target) space (Java 17+)\npublic boolean canPartition(int[] nums) {\n    int totalSum = 0;\n    for (int n : nums) totalSum += n;\n    if (totalSum % 2 != 0) return false; // Odd sum cannot be halved\n\n    int target = totalSum / 2;\n    boolean[] dp = new boolean[target + 1];\n    dp[0] = true; // Base case: sum of 0 is always achievable\n\n    for (int num : nums) {\n        // Iterate backwards so each num is used at most once!\n        for (int w = target; w >= num; w--) {\n            dp[w] = dp[w] || dp[w - num];\n        }\n    }\n    return dp[target];\n}",
    "canonicalProblems": "• LeetCode 416: Partition Equal Subset Sum (0/1 Knapsack boolean reachability)\n• LeetCode 494: Target Sum (Algebraic reduction to 0/1 Knapsack subset count)\n• LeetCode 518: Coin Change II (Unbounded Knapsack forward iteration)\n• LeetCode 474: Ones and Zeroes (2-dimensional resource Knapsack)",
    "pitfall": "Looping forwards in 0/1 Knapsack. If you write `for (int w = num; w <= target; w++)`, `dp[w]` uses `dp[w - num]` which was ALREADY updated in the current loop, allowing the same item to be reused multiple times!",
    "interviewTip": "Explain the direction invariant: 'By iterating the capacity loop in reverse order from target down to num, we ensure that dp[w - num] represents the state from the previous item iteration, preserving the 0/1 constraint without a 2D matrix.'"
  },
  {
    "id": "dsa-dp-strings-lcs",
    "title": "2D String DP: Longest Common Subsequence & Edit Distance",
    "category": "Dynamic Programming & Backtracking",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Longest Common Subsequence (LCS) or Substring",
      "Edit Distance (minimum insertions, deletions, replacements)",
      "Interleaving String or Distinct Subsequences",
      "Regular Expression Matching or Wildcard Matching"
    ],
    "whatIsIt": "A 2D matrix dynamic programming pattern where rows correspond to prefixes of string s1 (0..M) and columns correspond to prefixes of string s2 (0..N). `dp[i][j]` stores the optimal metric between `s1[0..i-1]` and `s2[0..j-1]`. If current characters match, transition diagonally: `dp[i-1][j-1]`. If they mismatch, transition from top, left, or diagonal with edit penalty.",
    "bruteForce": "Generate all 2^M subsequences of s1 and check each against s2 in O(2^M * N). Bottleneck: Re-evaluates identical prefix match states exponentially.",
    "optimalStrategy": "1. Initialize `int[][] dp = new int[m + 1][n + 1]`.\n2. LCS Recurrence:\n   if `s1.charAt(i - 1) == s2.charAt(j - 1)`: `dp[i][j] = 1 + dp[i - 1][j - 1]`.\n   else: `dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])`.\n3. Edit Distance Recurrence:\n   if characters match: `dp[i][j] = dp[i - 1][j - 1]`.\n   else: `dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]))` (replace, delete, insert).\n4. Time: O(M * N), Space: O(min(M, N)) with 2-row rolling array.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: 2D String Alignment Matrix</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Match: s1[i]==s2[j]</span>\n            <span class=\"node-desc\">Take Diagonal: 1 + dp[i-1][j-1]</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── Alignment Grid ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Mismatch</span>\n            <span class=\"node-desc\">max(dp[i-1][j], dp[i][j-1])</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Base Cases Matter:</strong> For Edit Distance, `dp[i][0] = i` (deleting all i chars) and `dp[0][j] = j` (inserting all j chars). Always populate row 0 and col 0!\n        </div>\n      </div>\n    ",
    "internalWorking": "Space Optimization from O(M * N) to O(N):\n- Notice that `dp[i][j]` only requires values from the current row `i` and previous row `i - 1`.\n- Maintain two 1D arrays: `prev[]` and `curr[]`.\n- Reduces auxiliary space to O(min(M, N)) while retaining O(M * N) execution speed.",
    "complexPart": "Wildcard Matching (LC 44) & Regex Matching (LC 10): Handling `*`.\n- In Wildcard (`*` matches any sequence): `dp[i][j] = dp[i-1][j] || dp[i][j-1]` (matches empty sequence or matches current character).\n- In Regex (`x*` matches 0 or more of previous character x):\n  `dp[i][j] = dp[i][j-2]` (zero occurrences of x) || `(s.charAt(i-1) == p.charAt(j-2) || p.charAt(j-2) == '.') && dp[i-1][j]` (one or more occurrences).",
    "keyPoints": [
      "Matrix dimensions: `(m + 1) * (n + 1)` where index 0 represents empty string.",
      "LCS Match: `dp[i][j] = 1 + dp[i-1][j-1]`.",
      "LCS Mismatch: `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.",
      "Time Complexity: O(M * N).",
      "Space Complexity: O(M * N) or O(min(M, N)) space-optimized."
    ],
    "codeSnippet": "// Longest Common Subsequence in O(M * N) (Java 17+)\npublic int longestCommonSubsequence(String text1, String text2) {\n    int m = text1.length(), n = text2.length();\n    int[] prev = new int[n + 1];\n    int[] curr = new int[n + 1];\n\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {\n                curr[j] = 1 + prev[j - 1]; // Diagonal match\n            } else {\n                curr[j] = Math.max(prev[j], curr[j - 1]); // Top or Left\n            }\n        }\n        int[] temp = prev;\n        prev = curr;\n        curr = temp;\n    }\n    return prev[n];\n}\n\n// Edit Distance (LeetCode 72)\npublic int minDistance(String word1, String word2) {\n    int m = word1.length(), n = word2.length();\n    int[][] dp = new int[m + 1][n + 1];\n\n    for (int i = 0; i <= m; i++) dp[i][0] = i; // Deletions\n    for (int j = 0; j <= n; j++) dp[0][j] = j; // Insertions\n\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {\n                dp[i][j] = dp[i - 1][j - 1];\n            } else {\n                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], // Replace\n                               Math.min(dp[i - 1][j],     // Delete\n                                        dp[i][j - 1]));   // Insert\n            }\n        }\n    }\n    return dp[m][n];\n}",
    "canonicalProblems": "• LeetCode 1143: Longest Common Subsequence (Canonical string DP)\n• LeetCode 72: Edit Distance (Classic 3-operation Levenshtein)\n• LeetCode 10: Regular Expression Matching (Handling . and * characters)\n• LeetCode 97: Interleaving String",
    "pitfall": "Off-by-one mapping between string 0-based indices and DP 1-based indices. Character `s1.charAt(i - 1)` corresponds to DP row `i`. Accessing `s1.charAt(i)` leads to StringIndexOutOfBoundsException.",
    "interviewTip": "Always write the 2x2 grid base cases on the whiteboard before writing the loops: show what `dp[0][0]`, `dp[0][1]`, and `dp[1][0]` represent."
  },
  {
    "id": "dsa-tree-dp-lca",
    "title": "Tree DP & Lowest Common Ancestor (LCA Binary Lifting)",
    "category": "Dynamic Programming & Backtracking",
    "badge": "Advanced Trees",
    "triggerSignals": [
      "Binary Tree Maximum Path Sum (path between any two nodes)",
      "Diameter of Binary Tree (longest path between any two leaf nodes)",
      "Lowest Common Ancestor (LCA) queries in binary tree or general tree",
      "Dynamic programming on tree subtrees (House Robber III)"
    ],
    "whatIsIt": "A bottom-up dynamic programming approach on trees where each node's state is computed post-order from its children's returned states. For LCA queries in large trees, Binary Lifting precomputes 2^k-th ancestors (`up[node][k]`), enabling any LCA query to be answered in O(log N) jumps.",
    "bruteForce": "For LCA, find path from root to p and path from root to q using DFS in O(N) per query. For Q queries, takes O(Q * N). For Diameter, compute max depth of left and right at every single node from scratch in O(N^2). Bottleneck: Ignores parent-child topological tree hierarchy.",
    "optimalStrategy": "1. Post-Order Tree DP: Visit left and right children first. Compute: `leftGain = Math.max(0, dfs(node.left))`, `rightGain = Math.max(0, dfs(node.right))`.\n2. Update global answer at root: `maxPath = Math.max(maxPath, leftGain + rightGain + node.val)`.\n3. Return to parent: `node.val + Math.max(leftGain, rightGain)` (can only extend ONE branch upwards!).\n4. Binary Lifting LCA: Precompute `up[node][k] = up[up[node][k-1]][k-1]` in O(N log N). Answer any LCA query in O(log N) by jumping powers of 2.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Tree DP Post-Order Invariant</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Left Child: dfs(left)</span>\n            <span class=\"node-desc\">Returns max single-branch gain</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Merge at Root ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Current Node (Apex)</span>\n            <span class=\"node-desc\">Global update: L + R + val</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Return Upward ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Return to Parent</span>\n            <span class=\"node-desc\">val + max(L, R) only!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Crucial Difference:</strong> A path can arch through the current node as the apex (`L + R + val`), but it can ONLY contribute a SINGLE branch (`val + max(L, R)`) to its parent above!\n        </div>\n      </div>\n    ",
    "internalWorking": "House Robber III (LC 337):\n- Each node returns `int[]{robNode, notRobNode}`.\n- `robNode = node.val + left.notRob + right.notRob`.\n- `notRobNode = max(left.rob, left.notRob) + max(right.rob, right.notRob)`.\n- Solves the problem in a single O(N) post-order pass without memoization map overhead!",
    "complexPart": "Binary Lifting LCA Walkthrough:\n1. Bring both nodes to the same depth: if `depth[p] < depth[q]`, jump q up using powers of 2.\n2. If `p == q`, return p.\n3. Jump both p and q upwards in tandem from `k = 19 down to 0`: if `up[p][k] != up[q][k]`, set `p = up[p][k]` and `q = up[q][k]`.\n4. Both are now immediately below the LCA: return `up[p][0]`!",
    "keyPoints": [
      "Post-order traversal (Left, Right, Root) is mandatory: children must complete before parent can compute.",
      "Global vs Return distinction: Global update can use both children; return to parent can only use ONE branch.",
      "Time Complexity: O(N) single-pass tree DP; O(log N) per LCA query with Binary Lifting.",
      "Space Complexity: O(H) recursion stack height (O(log N) balanced, O(N) worst-case skewed)."
    ],
    "codeSnippet": "// Binary Tree Maximum Path Sum (LeetCode 124 in Java 17+)\npublic class Solution {\n    private int maxSum = Integer.MIN_VALUE;\n\n    public int maxPathSum(TreeNode root) {\n        maxGain(root);\n        return maxSum;\n    }\n\n    private int maxGain(TreeNode node) {\n        if (node == null) return 0;\n\n        // Ignore negative path gains with Math.max(0, ...)\n        int leftGain = Math.max(0, maxGain(node.left));\n        int rightGain = Math.max(0, maxGain(node.right));\n\n        // Path arching through current node as highest apex\n        int currentPathSum = node.val + leftGain + rightGain;\n        maxSum = Math.max(maxSum, currentPathSum);\n\n        // Return single branch upward to parent\n        return node.val + Math.max(leftGain, rightGain);\n    }\n}",
    "canonicalProblems": "• LeetCode 124: Binary Tree Maximum Path Sum (Apex vs Branch return)\n• LeetCode 543: Diameter of Binary Tree (Post-order height aggregation)\n• LeetCode 236: Lowest Common Ancestor of a Binary Tree (Divide & conquer search)\n• LeetCode 337: House Robber III (Tree DP returning 2-element array)",
    "pitfall": "Returning `node.val + leftGain + rightGain` to the parent. An ancestral path cannot branch in both directions! Returning both child branches would create a 'Y' shape with 3 branches, which is not a valid simple path.",
    "interviewTip": "State the invariant: 'The global maximum path can treat this node as the turning point (summing left + right + node.val), but the value returned to the parent can only represent a straight path extending through at most one child.'"
  },
  {
    "id": "dsa-dp-bitmask",
    "title": "Bitmask DP: State Compression for Exponential Subsets",
    "category": "Dynamic Programming & Backtracking",
    "badge": "Advanced DP",
    "triggerSignals": [
      "Input size N is small (N <= 16 to 20)",
      "Traveling Salesperson Problem (TSP) / visit all nodes with minimum cost",
      "Assign N tasks to N workers to minimize cost or maximize compatibility",
      "Matchsticks to Square / Partition into K subsets with equal sum"
    ],
    "whatIsIt": "A dynamic programming technique that encodes a subset of items as an integer bitmask from 0 to 2^N - 1. The i-th bit being 1 means element i is included in the current subset; 0 means excluded. State transitions use bitwise operations: test inclusion with `(mask & (1 << i)) != 0` and set bit with `mask | (1 << i)`. Converts factorial O(N!) permutation searches into O(2^N * N^2) polynomial-in-mask runtime.",
    "bruteForce": "Exhaustive backtracking through all permutations of size N. Time: O(N!). For N = 16, 16! ≈ 2.09 * 10^13 operations, which runs for days and times out. Bottleneck: Permutations that visit the same subset of nodes ending at the same node are recalculated independently.",
    "optimalStrategy": "1. State: `dp[mask][last]` = minimum cost to visit the subset of nodes encoded by `mask`, with `last` being the final visited node.\n2. Total states: `2^N * N`. For N = 16, 2^16 * 16 ≈ 1,048,576 states.\n3. Recurrence: For every unvisited node next (`(mask & (1 << next)) == 0`):\n   `nextMask = mask | (1 << next)`\n   `dp[nextMask][next] = min(dp[nextMask][next], dp[mask][last] + cost[last][next])`.\n4. Time: O(2^N * N^2) which executes in under 0.1 seconds in Java!",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Bitmask Integer State Representation</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">mask = 01011 (binary)</span>\n            <span class=\"node-desc\">Nodes {0, 1, 3} visited</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Visit Node 2 ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Bitwise OR: | (1 &lt;&lt; 2)</span>\n            <span class=\"node-desc\">Sets 2nd bit to 1</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► New State ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">mask = 01111 (binary)</span>\n            <span class=\"node-desc\">Nodes {0, 1, 2, 3} visited!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Constraint Clue:</strong> Whenever N &lt;= 18 on LeetCode Hard, it is 99% a Bitmask DP problem! 2^16 = 65,536 is small enough to fit in standard L1/L2 CPU cache!\n        </div>\n      </div>\n    ",
    "internalWorking": "Common Bit Manipulation Primitives in Bitmask DP:\n- Check if i-th bit is set: `(mask & (1 << i)) != 0`\n- Set i-th bit to 1: `mask | (1 << i)`\n- Clear i-th bit to 0: `mask & ~(1 << i)`\n- Toggle i-th bit: `mask ^ (1 << i)`\n- Count set bits (subset size): `Integer.bitCount(mask)`\n- Iterate all submasks of mask: `for (int sub = mask; sub > 0; sub = (sub - 1) & mask)`.",
    "complexPart": "Iterating All Submasks in O(3^N): When DP requires splitting a subset into sub-subsets, the trick `sub = (sub - 1) & mask` visits every submask in descending order. Total iterations across all masks is exactly 3^N (not 4^N!), because each element is either not in mask, in mask but not in sub, or in both.",
    "keyPoints": [
      "Key Trigger: Problem asks for subset matching/permutation with $N \\le 18$ or $N \\le 20$.",
      "Time Complexity: $O(2^N \\cdot N^2)$ or $O(2^N \\cdot N)$.",
      "Space Complexity: $O(2^N \\cdot N)$ or $O(2^N)$ with space reduction.",
      "Base case: `dp[1 << i][i] = 0` for all starting nodes i."
    ],
    "codeSnippet": "// Shortest Path Visiting All Nodes via Bitmask BFS (Java 17+)\npublic int shortestPathLength(int[][] graph) {\n    int n = graph.length;\n    if (n <= 1) return 0;\n    int targetMask = (1 << n) - 1; // All n bits set to 1\n\n    // Queue stores {node, mask}\n    Queue<int[]> queue = new ArrayDeque<>();\n    boolean[][] visited = new boolean[n][1 << n];\n\n    // Seed queue with all nodes as possible starting points\n    for (int i = 0; i < n; i++) {\n        queue.offer(new int[]{i, 1 << i});\n        visited[i][1 << i] = true;\n    }\n\n    int steps = 0;\n    while (!queue.isEmpty()) {\n        int size = queue.size();\n        for (int s = 0; s < size; s++) {\n            int[] curr = queue.poll();\n            int u = curr[0], mask = curr[1];\n\n            if (mask == targetMask) return steps; // All nodes visited!\n\n            for (int v : graph[u]) {\n                int nextMask = mask | (1 << v);\n                if (!visited[v][nextMask]) {\n                    visited[v][nextMask] = true;\n                    queue.offer(new int[]{v, nextMask});\n                }\n            }\n        }\n        steps++;\n    }\n    return -1;\n}",
    "canonicalProblems": "• LeetCode 847: Shortest Path Visiting All Nodes (Bitmask BFS)\n• LeetCode 1125: Smallest Sufficient Team (Bitmask DP subset cover)\n• LeetCode 473: Matchsticks to Square (Partition into 4 equal sides with bitmask)\n• LeetCode 1879: Minimum XOR Sum of Two Arrays",
    "pitfall": "Operator precedence trap in Java: bitwise operators have lower precedence than comparison operators! Writing `if (mask & 1 << i != 0)` is evaluated as `mask & (1 << (i != 0))` which triggers compiler syntax errors. ALWAYS wrap with parentheses: `if ((mask & (1 << i)) != 0)`.",
    "interviewTip": "Show your constraint awareness: 'Because N is at most 16, a factorial N! solution will TLE. However, N <= 16 indicates that we can represent the subset of visited vertices as a 16-bit integer bitmask, reducing the search space to 2^16 states.'"
  },
  {
    "id": "dsa-trie-prefix",
    "title": "Trie (Prefix Tree): High-Speed String & Bit Prefix Matching",
    "category": "Advanced & System Structures",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Prefix search or autocomplete engine",
      "Word Search II (search dictionary words in Boggle grid simultaneously)",
      "Maximum XOR of two numbers in an array",
      "IP routing lookup (longest prefix match)"
    ],
    "whatIsIt": "A 26-ary tree (or binary 2-ary tree for bits) where each node represents a character along a string's path. Nodes share common prefixes, enabling prefix lookups and insertions in strict O(L) time where L is the length of the string, completely independent of the total dictionary size N. Binary Tries allow finding maximum XOR pairs in O(32) = O(1) time.",
    "bruteForce": "Iterate through all N words in dictionary and check `word.startsWith(prefix)`. Time: O(N * L) per query. For 100,000 words and 1,000 queries, takes 10^8 operations. Bottleneck: Scans completely unrelated words without sharing prefix computation.",
    "optimalStrategy": "1. TrieNode structure:\n   `TrieNode[] children = new TrieNode[26];`\n   `boolean isEnd = false;` (or stores full `String word`).\n2. Insert word: traverse character by character; if `children[c - 'a'] == null`, instantiate new node. Mark last node `isEnd = true`.\n3. Search / StartsWith: traverse path; if any child is null, return false immediately. If finished, return `curr.isEnd` (for search) or true (for startsWith).\n4. Word Search II: run grid DFS against the Trie! If current path is not in Trie, prune the grid search immediately.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Prefix Tree Shared Representation</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Root</span>\n            <span class=\"node-desc\">Empty starting point</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► 'a' ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Node 'a'</span>\n            <span class=\"node-desc\">Shared prefix: \"a\"</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► 'p' ──► 'p' ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Branches: 'l' vs 'e'</span>\n            <span class=\"node-desc\">\"apple\" (end) &amp; \"apply\" (end)</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Word Search II Pruning:</strong> Walking the Trie during grid DFS allows searching for 10,000 words in parallel without running 10,000 separate DFS searches!\n        </div>\n      </div>\n    ",
    "internalWorking": "Maximum XOR of Two Numbers (LC 421) via Binary Trie:\n- Each number is represented as 31-bit binary path.\n- To maximize `XOR = a ^ b`, for each bit of `a` (from MSB 30 down to 0), we greedily want `b` to have the OPPOSITE bit (`1 - bit`).\n- Query Binary Trie: if opposite child exists, take it and set bit in result; else take existing child.\n- Runs in strict O(31 * N) = O(N) time!",
    "complexPart": "Trie Node Pruning in Word Search II: To avoid visiting words already found, when a word is matched, set `node.word = null`. Even better, decrement child count and prune leaf nodes upwards so future DFS traversals skip dead branches entirely.",
    "keyPoints": [
      "Time Complexity: O(L) for insert, search, and startsWith (L = length of word).",
      "Space Complexity: O(ALPHABET_SIZE * N * L) node allocations.",
      "Prunes exponential grid search in Word Search II from TLE to under 30ms.",
      "Binary Trie (0 and 1 branches) solves maximum XOR problems in linear time."
    ],
    "codeSnippet": "// Production-Grade Trie Implementation (Java 17+)\nclass Trie {\n    private static class Node {\n        Node[] children = new Node[26];\n        boolean isEnd = false;\n    }\n\n    private final Node root = new Node();\n\n    public void insert(String word) {\n        Node curr = root;\n        for (int i = 0; i < word.length(); i++) {\n            int idx = word.charAt(i) - 'a';\n            if (curr.children[idx] == null) {\n                curr.children[idx] = new Node();\n            }\n            curr = curr.children[idx];\n        }\n        curr.isEnd = true;\n    }\n\n    public boolean search(String word) {\n        Node node = findPrefixNode(word);\n        return node != null && node.isEnd;\n    }\n\n    public boolean startsWith(String prefix) {\n        return findPrefixNode(prefix) != null;\n    }\n\n    private Node findPrefixNode(String str) {\n        Node curr = root;\n        for (int i = 0; i < str.length(); i++) {\n            int idx = str.charAt(i) - 'a';\n            if (curr.children[idx] == null) return null;\n            curr = curr.children[idx];\n        }\n        return curr;\n    }\n}",
    "canonicalProblems": "• LeetCode 208: Implement Trie (Prefix Tree)\n• LeetCode 212: Word Search II (Trie + Grid Backtracking with pruning)\n• LeetCode 421: Maximum XOR of Two Numbers in an Array (Binary Trie)\n• LeetCode 211: Design Add and Search Words Data Structure (Wildcard '.' DFS in Trie)",
    "pitfall": "Memory explosion with large character sets: for Unicode or full ASCII, `new Node[256]` or `new Node[65536]` wastes massive memory on empty null pointers. Use `Map<Character, Node> children` for sparse character domains.",
    "interviewTip": "In Word Search II, emphasize Trie coupling: 'Instead of searching for each of the K words individually via grid DFS in O(K * 4^(R*C)), we build a Trie of all K words and do a single grid DFS, cutting off paths as soon as the prefix doesn't exist in the Trie.'"
  },
  {
    "id": "dsa-bit-manipulation",
    "title": "Bit Manipulation: XOR Identities & Low-Level Bit Twiddling",
    "category": "Advanced & System Structures",
    "badge": "Core Pattern",
    "triggerSignals": [
      "Find the single number where every other element appears twice or thrice",
      "Count set bits (Hamming weight / Population count)",
      "Determine if an integer is a power of two in O(1)",
      "Generate all 2^N subsets without recursion"
    ],
    "whatIsIt": "Solving algorithmic problems at the machine register level using bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`). XOR acts as a self-canceling toggle: $x \\oplus x = 0$ and $x \\oplus 0 = x$. Brian Kernighan's trick clears the lowest set bit in O(1) clock cycles: `x & (x - 1)`.",
    "bruteForce": "Use a HashSet or frequency map to track seen numbers, taking O(N) time and O(N) space. Bottleneck: Allocates heap memory and performs expensive hashing for operations the CPU ALU can do in 1 clock cycle.",
    "optimalStrategy": "1. Single Number: XOR all elements in array: `res ^= num`. All duplicate pairs cancel to 0 ($x \\oplus x = 0$), leaving strictly the single unique number in O(N) time and O(1) space!\n2. Brian Kernighan's Bit Count: `while (n != 0) { n &= (n - 1); count++; }` runs in O(set_bits), not O(32)!\n3. Lowest Set Bit extraction: `lowestBit = x & (-x)`.\n4. Power of Two test: `n > 0 && (n & (n - 1)) == 0`.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Brian Kernighan's x &amp; (x - 1) Trick</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">x = 12 (1100 binary)</span>\n            <span class=\"node-desc\">Lowest set bit is at 2^2</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► x - 1 = 11 (1011) ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Bitwise AND: &amp;</span>\n            <span class=\"node-desc\">1100 &amp; 1011</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Result ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">x = 8 (1000 binary)</span>\n            <span class=\"node-desc\">Lowest set bit cleared!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>ALU Magic:</strong> `x &amp; (x - 1)` flips the lowest 1-bit and all trailing zeros. ANDing with x clears that exact lowest set bit in a single CPU instruction!\n        </div>\n      </div>\n    ",
    "internalWorking": "Single Number II (Every element appears 3 times except 1):\n- Sum bits at position i across all numbers.\n- If `sum % 3 != 0`, the unique number has a 1-bit at position i.\n- Digital Logic simulation: maintain two bitmasks `ones` and `twos` tracking counts modulo 3 in O(N) time and O(1) space without looping through 32 bits.",
    "complexPart": "Single Number III (Two unique numbers, all others appear twice):\n1. XOR all numbers: `xor = a ^ b` (since a != b, xor != 0).\n2. Find any set bit in xor: `diffBit = xor & (-xor)` (guaranteed that a and b differ at this bit).\n3. Partition all numbers into two groups based on whether `(num & diffBit) == 0`.\n4. XORing each group separately isolates `a` and `b` in O(N) time and O(1) space!",
    "keyPoints": [
      "$x \\oplus x = 0$ (self-canceling) and $x \\oplus 0 = x$ (identity).",
      "$x \\& (x - 1)$ strips the lowest set bit (Power of 2 check: `n > 0 && (n & (n - 1)) == 0`).",
      "$x \\& (-x)$ isolates the lowest set bit (Two's complement magic).",
      "Always use parentheses around bitwise operations: `(a & b) == c`."
    ],
    "codeSnippet": "// Single Number III: Find two unique numbers in O(N) time, O(1) space (Java 17+)\npublic int[] singleNumber(int[] nums) {\n    int xor = 0;\n    for (int n : nums) xor ^= n; // xor = a ^ b\n\n    // Isolate lowest set bit where a and b differ\n    int diffBit = xor & (-xor);\n\n    int a = 0, b = 0;\n    for (int n : nums) {\n        if ((n & diffBit) == 0) {\n            a ^= n; // Group 1\n        } else {\n            b ^= n; // Group 2\n        }\n    }\n    return new int[]{a, b};\n}\n\n// Brian Kernighan's Count 1-Bits\npublic int hammingWeight(int n) {\n    int count = 0;\n    while (n != 0) {\n        n &= (n - 1); // Clears lowest set bit in O(1)\n        count++;\n    }\n    return count;\n}",
    "canonicalProblems": "• LeetCode 136: Single Number (XOR cancellation)\n• LeetCode 260: Single Number III (Two unique numbers via diffBit partition)\n• LeetCode 191: Number of 1 Bits (Brian Kernighan's algorithm)\n• LeetCode 231: Power of Two (Single bit test)",
    "pitfall": "Signed 32-bit shift with negative numbers: In Java, `>>` is arithmetic right shift (preserves sign bit), while `>>>` is logical right shift (zero-fills from left). Using `>>` in while loops with negative numbers creates an infinite loop of 1s!",
    "interviewTip": "Explain Two's Complement: 'In two's complement, `-x = ~x + 1`. This inverts all bits and adds 1, leaving only the lowest set bit unchanged and inverting everything else, so `x & (-x)` isolates that exact bit.'"
  },
  {
    "id": "dsa-segment-fenwick-tree",
    "title": "Segment Tree & Fenwick Tree (Binary Indexed Tree): Dynamic Range Queries",
    "category": "Advanced & System Structures",
    "badge": "Advanced Structures",
    "triggerSignals": [
      "Frequent point updates and range sum / min / max queries in O(log N)",
      "Range update with range query (Lazy Propagation)",
      "Count of Smaller Numbers After Self (LC 315) or inversion count",
      "Mutable 2D range sum queries"
    ],
    "whatIsIt": "Specialized tree data structures for mutable sequences. A Prefix Sum array achieves O(1) query but O(N) update. A plain array achieves O(1) update but O(N) query. Fenwick Tree (Binary Indexed Tree) and Segment Tree balance both operations into O(log N) query and O(log N) update. Fenwick Tree uses bitwise increments `i += i & (-i)` to maintain partial prefix sums in O(N) array memory.",
    "bruteForce": "Recompute range sum `for i = L..R sum += arr[i]` in O(N) per query. For Q queries and U updates, total time is O(Q * N + U). Bottleneck: Fails to amortize prefix information during mutations.",
    "optimalStrategy": "Fenwick Tree (BIT):\n1. Array `tree[]` of size N + 1 (1-based index).\n2. Update index i with delta: `while (i <= n) { tree[i] += delta; i += i & (-i); }`.\n3. Query prefix sum 1..i: `while (i > 0) { sum += tree[i]; i -= i & (-i); }`.\n4. Range sum [L, R] = `query(R) - query(L - 1)` in O(log N)!\nSegment Tree:\n- Complete binary tree of size 4*N. Stores sum/min/max of range [L, R]. Supports arbitrary associative functions (GCD, min, max, sum) and Lazy Propagation for range updates in O(log N).",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Fenwick Tree Bit Responsibility Intervals</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Index 4 (100_2)</span>\n            <span class=\"node-desc\">Covers 4 elements [1..4]</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► i += i &amp; (-i) ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">Index 8 (1000_2)</span>\n            <span class=\"node-desc\">Covers 8 elements [1..8]</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► i -= i &amp; (-i) for query ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Query(7) = T[7] + T[6] + T[4]</span>\n            <span class=\"node-desc\">Decomposes into powers of 2</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Log N Guarantee:</strong> A 32-bit integer has at most 32 set bits. Both update and query traverse at most 32 nodes, ensuring strict O(log N) runtime!\n        </div>\n      </div>\n    ",
    "internalWorking": "Count of Smaller Numbers After Self (LC 315):\n- Discretize array values to ranks 1..M.\n- Traverse array from right to left.\n- For each number: `count = fenwick.query(rank - 1)` gives count of elements seen so far smaller than it.\n- Then `fenwick.update(rank, 1)`.\n- Solves this famous Hard problem in O(N log N) time!",
    "complexPart": "Segment Tree with Lazy Propagation: When asked to update a RANGE [L, R] by delta, traversing all leaf nodes takes O(N). Lazy Propagation updates the current segment tree node, stores the pending delta in a `lazy[]` array, and defers pushing the update to children until a query actually touches those children. Restores range update to O(log N)!",
    "keyPoints": [
      "Fenwick Tree (BIT): Simpler, lighter, O(N) space, perfect for range SUM queries.",
      "Segment Tree: More powerful, O(4N) space, handles range MIN/MAX/GCD and lazy range updates.",
      "Time Complexity: O(log N) query, O(log N) update.",
      "Space Complexity: O(N) for Fenwick Tree, O(4N) for Segment Tree."
    ],
    "codeSnippet": "// Production Fenwick Tree (Binary Indexed Tree) in Java 17+\nclass FenwickTree {\n    private final int[] tree;\n    private final int n;\n\n    public FenwickTree(int n) {\n        this.n = n;\n        this.tree = new int[n + 1]; // 1-based index\n    }\n\n    public void add(int i, int delta) {\n        for (; i <= n; i += i & (-i)) {\n            tree[i] += delta;\n        }\n    }\n\n    public int query(int i) {\n        int sum = 0;\n        for (; i > 0; i -= i & (-i)) {\n            sum += tree[i];\n        }\n        return sum;\n    }\n\n    public int rangeSum(int left, int right) {\n        return query(right) - query(left - 1);\n    }\n}",
    "canonicalProblems": "• LeetCode 307: Range Sum Query - Mutable (Canonical Fenwick / Segment Tree)\n• LeetCode 315: Count of Smaller Numbers After Self (Coordinate compression + Fenwick)\n• LeetCode 493: Reverse Pairs (Fenwick inversion counting)\n• Range Minimum Query with Lazy Propagation",
    "pitfall": "1-based indexing in Fenwick Tree: If `i = 0`, `i & (-i)` evaluates to 0, causing an infinite loop! Fenwick Trees must always be 1-based indexed (`index + 1`).",
    "interviewTip": "Compare them succinctly: 'If the problem only requires range sum queries with point updates, Fenwick Tree is strictly superior due to 1/4th memory usage, cache friendliness, and 10 lines of code. If range min/max or range updates are required, Segment Tree with Lazy Propagation is necessary.'"
  },
  {
    "id": "lru-cache-implementation",
    "title": "LRU Cache (Least Recently Used) in Strict O(1)",
    "category": "Advanced & System Structures",
    "badge": "System DSA",
    "triggerSignals": [
      "Design an in-memory cache with eviction when capacity is reached",
      "Evict least recently accessed or updated key",
      "Both get(key) and put(key, val) must execute in strict O(1) time",
      "Low-level storage cache, CPU page replacement, Redis cache tier"
    ],
    "whatIsIt": "A high-performance caching engine combining a HashMap for O(1) key-to-node lookup with a Doubly Linked List for O(1) node relocation and eviction. Dummy Head and Tail sentinel nodes eliminate all null-pointer checks during boundary pointer updates.",
    "bruteForce": "Use a simple HashMap + timestamp array or singly linked list. When full, scan all entries to find the oldest timestamp in O(N) time. Bottleneck: O(N) eviction breaks SLA requirements.",
    "optimalStrategy": "1. `Map<Integer, Node> map`: key -> Node reference.\n2. Doubly Linked List with `head` (Most Recently Used) and `tail` (Least Recently Used) sentinels.\n3. `get(key)`: if absent return -1. If present: `moveToHead(node)`, return `node.val` in O(1).\n4. `put(key, val)`: if key exists, update value and `moveToHead(node)`. If new key: create node, `addNode(node)`, `map.put(key, node)`. If over capacity: `lru = popTail()`, `map.remove(lru.key)` in O(1)!",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Doubly Linked List + HashMap Coupling</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">HashMap</span>\n            <span class=\"node-desc\">Key -> Node Ref O(1)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄── Coupled ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">[Dummy Head]</span>\n            <span class=\"node-desc\">Sentinel (MRU side)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄══►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Active Nodes</span>\n            <span class=\"node-desc\">node.prev &lt;=&gt; node.next</span>\n          </div>\n          <span class=\"flow-arrow-separator\">◄══►</span>\n          <div class=\"flow-step-node node-red\">\n            <span class=\"node-label\">[Dummy Tail]</span>\n            <span class=\"node-desc\">tail.prev = LRU Evict!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>O(1) Mechanics:</strong> `get(k)` unlinks node in O(1) and moves to Head. `put(k,v)` when full drops `tail.prev` from both list and map in O(1)!\n        </div>\n      </div>\n    ",
    "internalWorking": "Sentinel Pointer Mechanics:\n- `removeNode(node)`: `node.prev.next = node.next; node.next.prev = node.prev;`\n- `addNode(node)` (at head): `node.prev = head; node.next = head.next; head.next.prev = node; head.next = node;`\n- Sentinel nodes ensure head and tail are never null, eliminating if-else edge branches.",
    "complexPart": "Why Singly Linked List Fails: To remove an arbitrary node in O(1), you MUST know its predecessor node (`prev`). A singly linked list would require traversing from the head in O(N) to discover the predecessor. A Doubly Linked List provides `node.prev` immediately in O(1).",
    "keyPoints": [
      "HashMap provides O(1) random access; Doubly Linked List provides O(1) node deletion & insertion.",
      "Sentinel dummy head and tail nodes avoid null pointer exceptions.",
      "Time Complexity: Strict O(1) for both `get()` and `put()`.",
      "Space Complexity: O(Capacity) memory."
    ],
    "codeSnippet": "// Production-Grade LRU Cache in O(1) (Java 17+)\nclass LRUCache {\n    private static class Node {\n        int key, val;\n        Node prev, next;\n        Node(int k, int v) { this.key = k; this.val = v; }\n    }\n\n    private final int capacity;\n    private final Map<Integer, Node> map;\n    private final Node head, tail;\n\n    public LRUCache(int capacity) {\n        this.capacity = capacity;\n        this.map = new HashMap<>();\n        head = new Node(0, 0);\n        tail = new Node(0, 0);\n        head.next = tail;\n        tail.prev = head;\n    }\n\n    public int get(int key) {\n        Node node = map.get(key);\n        if (node == null) return -1;\n        moveToHead(node);\n        return node.val;\n    }\n\n    public void put(int key, int value) {\n        Node node = map.get(key);\n        if (node != null) {\n            node.val = value;\n            moveToHead(node);\n        } else {\n            if (map.size() >= capacity) {\n                Node lru = tail.prev;\n                removeNode(lru);\n                map.remove(lru.key);\n            }\n            Node newNode = new Node(key, value);\n            map.put(key, newNode);\n            addNode(newNode);\n        }\n    }\n\n    private void addNode(Node node) {\n        node.prev = head;\n        node.next = head.next;\n        head.next.prev = node;\n        head.next = node;\n    }\n\n    private void removeNode(Node node) {\n        node.prev.next = node.next;\n        node.next.prev = node.prev;\n    }\n\n    private void moveToHead(Node node) {\n        removeNode(node);\n        addNode(node);\n    }\n}",
    "canonicalProblems": "• LeetCode 146: LRU Cache (Must code live without using LinkedHashMap)\n• Redis In-Memory Eviction policy (volatile-lru, allkeys-lru)\n• Linux Kernel Page Replacement",
    "pitfall": "Forgetting to store the KEY in the `Node` object. When evicting `tail.prev`, you must remove the entry from the HashMap: `map.remove(lru.key)`. If Node only stores `val`, you cannot identify which key to evict from the map!",
    "interviewTip": "Do NOT use `LinkedHashMap` in the interview unless asked. Writing your own Doubly Linked List with dummy head/tail sentinels demonstrates deep mastery of pointer mechanics and memory safety."
  },
  {
    "id": "lfu-cache-implementation",
    "title": "LFU Cache (Least Frequently Used) in Strict O(1)",
    "category": "Advanced & System Structures",
    "badge": "System DSA",
    "triggerSignals": [
      "Cache eviction based on access frequency (hits count)",
      "Tie-breaker: when frequencies are identical, evict Least Recently Used (LRU)",
      "Strict O(1) time for both get(key) and put(key, val)",
      "CDN caching layer, database query plan buffer"
    ],
    "whatIsIt": "A multi-tier caching system that evicts keys with the lowest access frequency. In case of tie, it evicts the least recently used key. It maintains two HashMaps: `keyToValFreq` and `freqToList` (mapping frequency count to an independent Doubly Linked List), plus a scalar `minFreq` variable, delivering strict O(1) get and put operations.",
    "bruteForce": "Maintain a Min-Heap of nodes ordered by frequency and recency timestamp. `get()` and `put()` require heap re-sorting in O(log N) time. Bottleneck: O(log N) violates strict O(1) requirements under heavy concurrency.",
    "optimalStrategy": "1. `vals`: key -> val, `counts`: key -> frequency.\n2. `lists`: frequency -> Doubly Linked List of keys with that frequency.\n3. `minFreq`: tracks the current lowest frequency in the entire cache.\n4. `get(key)`: fetch val, increment frequency by 1, move key from `lists.get(f)` to `lists.get(f + 1)`. If `lists.get(minFreq)` becomes empty, `minFreq++`. Return val in O(1).\n5. `put(key, val)`: if over capacity, evict `lists.get(minFreq).popTail()` in O(1). Insert new key with frequency 1 and set `minFreq = 1`.",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: LFU Double HashMap + Frequency Buckets</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">minFreq = 1</span>\n            <span class=\"node-desc\">Current eviction bucket</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► maps to ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">freqToList[1]</span>\n            <span class=\"node-desc\">Doubly Linked List (Freq 1)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► on access ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Promote to freqToList[2]</span>\n            <span class=\"node-desc\">Doubly Linked List (Freq 2)</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>O(1) Invariant:</strong> `minFreq` only increments by 1 on access, or resets to 1 on new key insertion. No searching required!\n        </div>\n      </div>\n    ",
    "internalWorking": "Why minFreq Tracking is O(1):\n- When a key is accessed, its frequency increases from F to F+1.\n- If F was the `minFreq` and the list at frequency F is now empty, `minFreq` MUST become F + 1.\n- When a brand-new key is inserted, its frequency is ALWAYS 1, so `minFreq` resets to 1.\n- Zero scanning needed!",
    "complexPart": "Handling Empty Capacity: If `capacity == 0`, `put()` must immediately return without performing any operations. Forgetting this edge case triggers an immediate NullPointerException on `lists.get(minFreq)`.",
    "keyPoints": [
      "Eviction Rule: Smallest frequency first; tie-breaker: least recently used.",
      "Data Structures: 2 HashMaps (`keyToValFreq` and `freqToDLL`) + 1 integer `minFreq`.",
      "Time Complexity: Strict O(1) for both `get()` and `put()`.",
      "Space Complexity: O(Capacity) memory."
    ],
    "codeSnippet": "// Production-Grade LFU Cache in Strict O(1) (Java 17+)\nclass LFUCache {\n    private final int capacity;\n    private int minFreq;\n    private final Map<Integer, Integer> vals = new HashMap<>();\n    private final Map<Integer, Integer> counts = new HashMap<>();\n    private final Map<Integer, LinkedHashSet<Integer>> lists = new HashMap<>();\n\n    public LFUCache(int capacity) {\n        this.capacity = capacity;\n        this.minFreq = 0;\n    }\n\n    public int get(int key) {\n        if (!vals.containsKey(key)) return -1;\n        int count = counts.get(key);\n        counts.put(key, count + 1);\n\n        // Remove from old freq bucket\n        lists.get(count).remove(key);\n        if (count == minFreq && lists.get(count).isEmpty()) {\n            minFreq++;\n        }\n\n        // Add to new freq bucket\n        lists.computeIfAbsent(count + 1, k -> new LinkedHashSet<>()).add(key);\n        return vals.get(key);\n    }\n\n    public void put(int key, int value) {\n        if (capacity <= 0) return;\n\n        if (vals.containsKey(key)) {\n            vals.put(key, value);\n            get(key); // Re-use get() to promote frequency\n            return;\n        }\n\n        if (vals.size() >= capacity) {\n            // Evict least recently used key from minFreq bucket\n            int evictKey = lists.get(minFreq).iterator().next();\n            lists.get(minFreq).remove(evictKey);\n            vals.remove(evictKey);\n            counts.remove(evictKey);\n        }\n\n        vals.put(key, value);\n        counts.put(key, 1);\n        minFreq = 1;\n        lists.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);\n    }\n}",
    "canonicalProblems": "• LeetCode 460: LFU Cache (Hardest classical cache interview problem)\n• CDN Edge Caching (Akamai / Cloudflare cache tiering)\n• Database Query Optimizer Plan Cache",
    "pitfall": "Using a PriorityQueue. While easier to code, PriorityQueue takes O(log N) for `get()` and `put()`, which fails the strict LeetCode 460 O(1) time complexity requirement.",
    "interviewTip": "Highlight the LinkedHashSet trick: 'Using Java's `LinkedHashSet` gives us both O(1) deletion/addition and preserves insertion order (LRU) inside each frequency bucket without writing 150 lines of custom DLL!'"
  },
  {
    "id": "sliding-window-rate-limiter",
    "title": "Token Bucket & Sliding Window Rate Limiter",
    "category": "Advanced & System Structures",
    "badge": "System DSA",
    "triggerSignals": [
      "Rate limiting API requests to N calls per second",
      "Handling bursty traffic while guaranteeing average throughput",
      "Sliding window log vs token bucket trade-offs",
      "Thread-safe atomic token consumption in high-concurrency gateways"
    ],
    "whatIsIt": "An in-memory algorithmic rate limiter that throttles incoming requests. The Token Bucket algorithm models a bucket of capacity B that continuously refills with tokens at rate R tokens/sec. When a request arrives, if tokens >= 1, consume 1 token and allow; else drop/reject. Sliding Window Log records millisecond timestamps in a Deque, purging entries older than window T.",
    "bruteForce": "Locking a global counter per second window. Bottleneck: The 'Reset at Second Boundary' flaw allows 2x burst at the boundary (e.g. 100 requests at 00:00:999 and 100 requests at 00:01:001 -> 200 requests in 2 milliseconds!).",
    "optimalStrategy": "Token Bucket with Lazy Refill:\n- Do NOT run a background timer thread to add tokens (wasteful polling overhead).\n- On each `tryAcquire()` call: compute elapsed time = `now - lastRefillTimestamp`.\n- Tokens to add = `elapsed * refillRate`.\n- `tokens = min(capacity, tokens + tokensToAdd)`.\n- `lastRefillTimestamp = now`.\n- If `tokens >= 1`: `tokens--`, return true; else return false in O(1) time and O(1) space!",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Token Bucket Lazy Refill &amp; Consumption</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Request Arrives</span>\n            <span class=\"node-desc\">now = System.currentTimeMillis()</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Lazy Refill ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">tokens += elapsed * rate</span>\n            <span class=\"node-desc\">tokens = min(capacity, tokens)</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► tokens &gt;= 1 ? ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Consume: tokens--</span>\n            <span class=\"node-desc\">Request Allowed in O(1)!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>No Background Threads:</strong> Tokens are calculated mathematically on demand during request invocation! Zero background cron CPU overhead!\n        </div>\n      </div>\n    ",
    "internalWorking": "Concurrency Thread-Safety:\n- In multi-threaded environments (Tomcat / Netty), wrap token updates in `synchronized` or use `AtomicReference` / CAS loop.\n- In Redis: use a Lua script executing `HMGET` and `HMSET` atomically to prevent race conditions across distributed cluster nodes.",
    "complexPart": "Sliding Window Counter (Cloudflare Approximation):\n- Combines previous second count and current second count.\n- `weight = 1 - (elapsed_in_current_sec / 1000)`.\n- `estimatedCount = prevCount * weight + currentCount`.\n- Provides 99.9% accuracy with only 2 integer registers instead of thousands of timestamps!",
    "keyPoints": [
      "Token Bucket supports configurable BURSTS (up to bucket capacity).",
      "Lazy refill eliminates background thread polling overhead.",
      "Time Complexity: Strict O(1) per check.",
      "Space Complexity: Strict O(1) memory per user/client ID."
    ],
    "codeSnippet": "// Production Token Bucket Rate Limiter (Thread-Safe in Java 17+)\npublic class TokenBucketRateLimiter {\n    private final long capacity;\n    private final double refillRatePerMs;\n    private double tokens;\n    private long lastRefillTimestamp;\n\n    public TokenBucketRateLimiter(long capacity, double tokensPerSecond) {\n        this.capacity = capacity;\n        this.refillRatePerMs = tokensPerSecond / 1000.0;\n        this.tokens = capacity;\n        this.lastRefillTimestamp = System.currentTimeMillis();\n    }\n\n    public synchronized boolean tryAcquire() {\n        refill();\n        if (tokens >= 1.0) {\n            tokens -= 1.0;\n            return true;\n        }\n        return false;\n    }\n\n    private void refill() {\n        long now = System.currentTimeMillis();\n        long elapsed = now - lastRefillTimestamp;\n        if (elapsed > 0) {\n            tokens = Math.min(capacity, tokens + elapsed * refillRatePerMs);\n            lastRefillTimestamp = now;\n        }\n    }\n}",
    "canonicalProblems": "• Design API Rate Limiter (System Design Core Question)\n• LeetCode 359: Logger Rate Limiter\n• Cloudflare / Envoy Gateway Rate Limiting Filter",
    "pitfall": "Starting a background thread `ScheduledExecutorService` that runs every millisecond to increment tokens. At scale with 100,000 active users, 100,000 background threads will immediately crash the JVM with OutOfMemoryError. Always use lazy timestamp calculation!",
    "interviewTip": "Contrast the algorithms clearly: 'Token Bucket allows controlled traffic bursts; Leaky Bucket forces uniform outbound flow; Sliding Window Log has zero burst edge bugs but consumes high memory; Sliding Window Counter approximates it in O(1) space.'"
  },
  {
    "id": "monotonic-stack-queue",
    "title": "Monotonic Deque Stream Architecture: Extreme Throughput Windowing",
    "category": "Advanced & System Structures",
    "badge": "System DSA",
    "triggerSignals": [
      "Real-time streaming stock ticker tracking running maximums",
      "Network packet latency peak detection in high-speed router",
      "Streaming window extremum queries with zero GC allocation"
    ],
    "whatIsIt": "A cache-friendly, zero-allocation ring-buffer implementation of the Monotonic Deque for high-throughput stream processing pipelines (such as LMAX Disruptor or Kafka stream consumers). Replaces dynamic object allocations with fixed primitive arrays to eliminate garbage collection pauses.",
    "bruteForce": "Re-evaluating window minimums using TreeMap or PriorityQueue creates heavy garbage collection churn and latency spikes. Bottleneck: Memory allocator lock contention under 100k events/sec.",
    "optimalStrategy": "Circular Array Deque:\n- Preallocate two primitive arrays `int[] indices` and `int[] values` of size K.\n- Pointers `head` and `tail` advance modulo K.\n- Each incoming stream element is offered into the ring buffer in O(1) amortized time without allocating a single Java object on the heap!",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Zero-Allocation Ring Buffer Monotonic Deque</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Preallocated Ring</span>\n            <span class=\"node-desc\">int[] values = new int[K]</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Modulo Advance ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">head &amp; tail pointers</span>\n            <span class=\"node-desc\">Advanced with (ptr + 1) % K</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Zero GC ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Continuous Stream</span>\n            <span class=\"node-desc\">Millions ops/sec with 0ms GC!</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Mechanical Sympathy:</strong> Contiguous primitive arrays eliminate pointer indirection and utilize L1/L2 CPU cache lines directly!\n        </div>\n      </div>\n    ",
    "internalWorking": "Ring Buffer Pointers:\n- Empty check: `size == 0`\n- Pop head: `head = (head + 1) % capacity`\n- Pop tail: `tail = (tail - 1 + capacity) % capacity`\n- All operations take 2 CPU instructions.",
    "complexPart": "Cache Line False Sharing: When multiple threads access head and tail on multi-core CPUs, padding variables (`@Contended` or 64 dummy bytes) prevent CPU cache line invalidation across core L1 caches.",
    "keyPoints": [
      "Zero allocation: Preallocated primitive ring buffer eliminates GC pressure.",
      "Time Complexity: Strict O(1) amortized per stream event.",
      "Space Complexity: Strict O(K) bound memory.",
      "Used in ultra-low latency finance matching engines and telemetry streams."
    ],
    "codeSnippet": "// Primitive Zero-GC Monotonic Deque for Streaming (Java 17+)\npublic class PrimitiveMonotonicDeque {\n    private final int[] indices;\n    private final int[] values;\n    private final int capacity;\n    private int head = 0, tail = 0, count = 0;\n\n    public PrimitiveMonotonicDeque(int k) {\n        this.capacity = k;\n        this.indices = new int[k];\n        this.values = new int[k];\n    }\n\n    public void push(int index, int val) {\n        // Strip smaller elements from tail\n        while (count > 0 && values[(tail - 1 + capacity) % capacity] <= val) {\n            tail = (tail - 1 + capacity) % capacity;\n            count--;\n        }\n        indices[tail] = index;\n        values[tail] = val;\n        tail = (tail + 1) % capacity;\n        count++;\n    }\n\n    public void evict(int minValidIndex) {\n        while (count > 0 && indices[head] < minValidIndex) {\n            head = (head + 1) % capacity;\n            count--;\n        }\n    }\n\n    public int getMax() {\n        return values[head];\n    }\n}",
    "canonicalProblems": "• Real-time stock ticker sliding peak\n• Network socket bandwidth throttling buffer\n• Zero-allocation audio signal processing",
    "pitfall": "Negative modulo in Java: `(-1 % capacity)` evaluates to `-1` in Java! You must write `(tail - 1 + capacity) % capacity` to wrap properly.",
    "interviewTip": "Demonstrate mechanical sympathy: 'In ultra-low latency trading or high-throughput stream processing, allocating objects like java.lang.Integer or ArrayDeque$Node triggers GC pauses. Replacing them with a primitive circular ring buffer guarantees 0ms GC pauses.'"
  },
  {
    "id": "tree-graph-toposort-unionfind",
    "title": "Graph & Tree Decision Blueprint: Choosing the Right Traversal",
    "category": "Trees, Graphs & DSU",
    "badge": "System DSA",
    "triggerSignals": [
      "Architecture decision: when to pick BFS vs DFS vs Dijkstra vs DSU vs Topo Sort",
      "Network routing and dependency resolution in distributed systems",
      "Real-world trade-off analysis between graph algorithms"
    ],
    "whatIsIt": "A comprehensive decision blueprint for navigating graph problems in interviews and systems architecture. Maps problem traits (weights, cycles, direction, memory bounds) to the exact optimal graph algorithm.",
    "bruteForce": "Attempting to use DFS for shortest path in weighted graphs or BFS for DAG dependency scheduling. Bottleneck: Inappropriate traversal strategy causing exponential blowup.",
    "optimalStrategy": "The Graph Algorithm Decision Matrix:\n1. Unweighted graph + Shortest Path -> BFS (O(V + E))\n2. Directed graph + Prerequisites / Order -> Topological Sort / Kahn's (O(V + E))\n3. Undirected graph + Dynamic connectivity / Cycles -> Union-Find (DSU) (O(V * alpha))\n4. Weighted graph (>= 0) + Shortest Path -> Dijkstra (O((V + E) log V))\n5. Weighted graph with negative weights -> Bellman-Ford (O(V * E))\n6. All-Pairs Shortest Path ($N \\le 400$) -> Floyd-Warshall (O(V^3))\n7. Connected components / Island flood fill -> DFS (O(R * C))\n8. Minimum Spanning Tree -> Kruskal's with DSU (O(E log E)) or Prim's (O(E log V))",
    "visualDiagram": "\n      <div class=\"visual-diagram-box\">\n        <div class=\"diagram-header-label\">🧠 Visual Mental Model: Graph Algorithm Selection Tree</div>\n        <div class=\"flow-chain\">\n          <div class=\"flow-step-node node-blue\">\n            <span class=\"node-label\">Graph Problem</span>\n            <span class=\"node-desc\">Identify traits &amp; weights</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Unweighted ──►</span>\n          <div class=\"flow-step-node node-purple\">\n            <span class=\"node-label\">BFS / Kahn's / DSU</span>\n            <span class=\"node-desc\">O(V + E) linear speed</span>\n          </div>\n          <span class=\"flow-arrow-separator\">──► Weighted (&gt;= 0) ──►</span>\n          <div class=\"flow-step-node node-green\">\n            <span class=\"node-label\">Dijkstra with PQ</span>\n            <span class=\"node-desc\">O((V + E) log V)</span>\n          </div>\n        </div>\n        <div style=\"margin-top: 8px; font-size: 0.76rem; color: #34d399;\">\n          ⚡ <strong>Master Decision Rule:</strong> Always check 3 questions: 1. Directed or Undirected? 2. Weighted or Unweighted? 3. Negative weights possible?\n        </div>\n      </div>\n    ",
    "internalWorking": "Memory vs Call Stack:\n- For deep graphs (trees of depth 100,000), DFS triggers StackOverflowError in Java.\n- BFS requires queue of size equal to maximum width of graph.\n- DSU uses only two flat int[] arrays, making it the most memory-efficient graph algorithm.",
    "complexPart": "Bidirectional Search Speedup: When start and end are both known in an unweighted graph, Bidirectional BFS reduces explored states from $b^d$ to $2 \\cdot b^{d/2}$. If branching factor $b = 10$ and depth $d = 8$, explores $2 \\times 10^4 = 20,000$ states instead of $10^8 = 100,000,000$ states!",
    "keyPoints": [
      "Always verify edge weights before picking BFS: weights must be UNIFORM.",
      "Topological sort requires graph to be a DIRECTED ACYCLIC GRAPH (DAG).",
      "Union-Find works on UNDIRECTED graphs for cycle detection and connectivity.",
      "Dijkstra strictly requires NON-NEGATIVE edge weights."
    ],
    "codeSnippet": "// Universal Graph Traversal Decision Matrix\n/*\n+-----------------------+-------------------+----------------------+--------------------+\n| Problem Requirement   | Graph Properties  | Optimal Algorithm    | Time Complexity    |\n+-----------------------+-------------------+----------------------+--------------------+\n| Shortest Path         | Unweighted        | BFS (Queue)          | O(V + E)           |\n| Shortest Path         | Non-negative wt   | Dijkstra (Heap)      | O((V + E) log V)   |\n| Shortest Path         | Negative weights  | Bellman-Ford         | O(V * E)           |\n| All-Pairs Shortest    | Dense, N <= 400   | Floyd-Warshall       | O(V^3)             |\n| Dependency Order      | Directed DAG      | Kahn's (inDegree)    | O(V + E)           |\n| Dynamic Connectivity  | Undirected        | Union-Find (DSU)     | O(V * alpha(V))    |\n| Minimum Spanning Tree | Weighted          | Kruskal's (DSU)      | O(E log E)         |\n| Connected Components  | 2D Grid / Matrix  | DFS / Flood Fill     | O(R * C)           |\n+-----------------------+-------------------+----------------------+--------------------+\n*/",
    "canonicalProblems": "• System design routing engine\n• Dependency resolution graph\n• Social network degree of separation",
    "pitfall": "Attempting to use Union-Find on a DIRECTED graph for cycle detection. Union-Find does not understand edge direction; it treats all edges as bidirectional!",
    "interviewTip": "Recite the Decision Matrix proactively: 'Before choosing an approach, let's analyze the graph properties: it is directed and weighted with non-negative costs, which immediately points to Dijkstra over standard BFS.'"
  }
];
