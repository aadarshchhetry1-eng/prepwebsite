/**
 * sql-data.js
 * Senior / Staff Engineer SQL Architecture & 20 Most Asked Interview Coding Queries
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.SQL_TOPICS = [
  {
    id: "sql-execution-order",
    title: "SQL Logical Query Execution Order",
    category: "Query Engine Internals",
    badge: "Must Know Architecture",
    oneLiner: "SQL queries execute in an exact 10-step sequence: FROM ➔ WHERE ➔ GROUP BY ➔ HAVING ➔ SELECT ➔ WINDOW ➔ DISTINCT ➔ ORDER BY ➔ LIMIT.",
    summary: "Unlike procedural code which executes top-to-bottom, SQL is declarative. The database engine executes clauses in a strict logical order. Understanding this sequence explains why aliases defined in SELECT cannot be used in WHERE, and why HAVING runs after GROUP BY.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: The 10-Step Query Execution Order</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. FROM &amp; JOIN</span>
            <span class="node-label">Table Source</span>
            <span class="node-sub">Cartesian ➔ ON filter</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-red">
            <span class="node-badge">2. WHERE</span>
            <span class="node-label">Row Filter</span>
            <span class="node-sub">Pre-aggregation check</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">3. GROUP BY</span>
            <span class="node-label">Bucketing</span>
            <span class="node-sub">Aggregates into groups</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">4. HAVING</span>
            <span class="node-label">Group Filter</span>
            <span class="node-sub">Filters aggregated metrics</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">5. SELECT</span>
            <span class="node-label">Projection</span>
            <span class="node-sub">Aliases assigned here</span>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 10px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">6. WINDOW (OVER)</span>
            <span class="node-label">Analytic Calc</span>
            <span class="node-sub">ROW_NUMBER / RANK</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">7. DISTINCT</span>
            <span class="node-label">Deduplication</span>
            <span class="node-sub">Hash / Sort distinct</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">8. ORDER BY</span>
            <span class="node-label">Sorting</span>
            <span class="node-sub">Aliases CAN be used!</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">9. LIMIT / OFFSET</span>
            <span class="node-label">Pagination</span>
            <span class="node-sub">Clips row pipeline</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Why `WHERE alias = x` fails: The `WHERE` clause executes at Step 2, while the `SELECT` clause (where column aliases are defined) doesn't execute until Step 5. Use CTEs or subqueries to filter on calculated aliases.",
      "WHERE vs HAVING: `WHERE` filters raw table rows BEFORE aggregation (uses indexes). `HAVING` filters aggregated metrics AFTER grouping (cannot use indexes on aggregated columns).",
      "WINDOW Functions: Execute at Step 6, which is AFTER `WHERE`, `GROUP BY`, and `HAVING`. This is why you cannot put window functions directly inside a `WHERE` clause.",
      "ORDER BY Aliases: `ORDER BY` executes at Step 8, AFTER `SELECT`. Therefore, column aliases defined in `SELECT` ARE legally accessible in `ORDER BY`."
    ],
    codeSnippet: `-- The Execution Order in Action
SELECT 
    department_id,
    AVG(salary) AS avg_sal,              -- Step 5: Evaluated & aliased
    COUNT(*) AS emp_count
FROM employees                            -- Step 1: Data source loaded
WHERE is_active = 1                       -- Step 2: Row-level filter (uses index)
GROUP BY department_id                    -- Step 3: Groups formed
HAVING AVG(salary) > 80000                -- Step 4: Group aggregate filter
ORDER BY avg_sal DESC                     -- Step 8: Aliases allowed here!
LIMIT 5;                                  -- Step 9: Pagination`,
    pitfall: "Writing `WHERE avg_sal > 80000` throws 'column avg_sal does not exist' because WHERE evaluates long before SELECT creates the alias.",
    interviewTip: "When asked why window functions cannot be in a WHERE clause, cite the execution order: WHERE is step 2, while WINDOW calculations are step 6. The engine hasn't calculated the window rank yet!"
  },

  {
    id: "sql-b-tree-indexing",
    title: "B+Tree Indexing & The Leftmost Prefix Rule",
    category: "Storage Engine & Performance",
    badge: "Staff Performance",
    oneLiner: "B+Trees store keys in balanced multi-way tree pages; composite indexes (A, B, C) can only be utilized if queries filter starting with column A.",
    summary: "Indexes are the foundation of database performance. In InnoDB / Postgres, B+Trees store table data in balanced pages. Understanding clustered indexes, covering indexes, and composite prefix mechanics is mandatory for senior system design.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: B+Tree Leaf Page vs Heap / Secondary Index</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Clustered Index (PK)</div>
            <div class="space-desc">Leaf = Actual Row Data</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Table IS the B+Tree. Ordered physically by Primary Key. O(log N) point lookup.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(249, 115, 22, 0.4); background: rgba(249, 115, 22, 0.08);">
            <div class="space-name" style="color: #fb923c;">Secondary Index</div>
            <div class="space-desc">Leaf = Indexed Col + PK</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Requires Bookmark Lookup (Double Traverse) to fetch unindexed columns.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Covering Index</div>
            <div class="space-desc">Index-Only Scan ✅</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">All queried columns exist in index leaf page. Eliminates table lookup entirely!</div>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Leftmost Prefix Rule: An index on `(A, B, C)` can serve queries on `(A)`, `(A, B)`, and `(A, B, C)`. It CANNOT serve queries on `(B)` or `(C)` alone because the index is sorted by A first.",
      "Range Column Trap: If a query has `WHERE A = 1 AND B > 50 AND C = 2`, the index on `(A, B, C)` only utilizes `A` and `B`. Once a range condition (`>`, `<`, `LIKE '%...'`) is hit, subsequent columns (`C`) cannot use the index tree.",
      "Covering Index: If an index on `(user_id, status, created_at)` contains all columns requested in `SELECT`, the database answers the query directly from RAM index pages without touching disk table pages.",
      "Index Selectivity: `Selectivity = count(distinct col) / count(*)`. If selectivity is low (e.g. `status IN ('ACTIVE', 'INACTIVE')`), the query optimizer will ignore the index and execute a Full Table Scan (Seq Scan)."
    ],
    codeSnippet: `-- Leftmost Prefix Mechanics
CREATE INDEX idx_orders_customer_status_date ON orders(customer_id, status, order_date);

-- ✅ USES INDEX EFFICIENTLY:
SELECT * FROM orders WHERE customer_id = 42 AND status = 'COMPLETED';

-- ⚠️ ONLY USES customer_id & status (order_date index traversal disabled by range):
SELECT * FROM orders WHERE customer_id = 42 AND status > 'C' AND order_date = '2024-01-01';

-- ❌ CANNOT USE INDEX (Full Table Scan! Skips leftmost column customer_id):
SELECT * FROM orders WHERE status = 'COMPLETED';`,
    pitfall: "Applying a function or calculation on an indexed column (e.g. `WHERE YEAR(created_at) = 2024` or `WHERE LOWER(email) = 'x'`) prevents index usage. Use range bounds `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'` instead.",
    interviewTip: "Explain Bookmark Lookup: How a secondary index holds the Primary Key, requiring a second traversal into the clustered index to fetch columns not covered in the index."
  },

  {
    id: "sql-window-functions-mastery",
    title: "Window Functions: ROW_NUMBER, RANK, DENSE_RANK & Frames",
    category: "Analytic Queries",
    badge: "Core Interview Topic",
    oneLiner: "Window functions perform calculations across related row sets without collapsing them into a single row like GROUP BY.",
    summary: "Window functions are the #1 most tested topic in technical SQL interviews. Mastering the difference between ranking functions, offset functions (LEAD/LAG), and running total frame specifications is essential.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: Ranking Ties Comparison (Scores: 100, 100, 90, 80)</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">ROW_NUMBER()</div>
            <div class="space-desc">1, 2, 3, 4</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Strictly unique monotonic sequence. Arbitrary tie-breaker.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(249, 115, 22, 0.4); background: rgba(249, 115, 22, 0.08);">
            <div class="space-name" style="color: #fb923c;">RANK()</div>
            <div class="space-desc">1, 1, 3, 4 (Gaps!)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Ties share rank. Next rank skips by count of tied items.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">DENSE_RANK()</div>
            <div class="space-desc">1, 1, 2, 3 (No Gaps!)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Ties share rank. Next rank increases by exactly +1. Ideal for Nth salary!</div>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "`DENSE_RANK()` for Nth Highest: Always use `DENSE_RANK()` when asked for 'Nth highest salary' so ties at rank 1 don't cause rank 2 to become empty.",
      "`LEAD(col, offset, default)` / `LAG()`: Accesses subsequent or previous rows without expensive self-joins. Crucial for calculating Month-over-Month growth or session inactivity.",
      "Frame Specification: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` computes a strict cumulative running sum. Without `ROWS BETWEEN`, default `RANGE` may group identical timestamp rows together.",
      "PARTITION BY vs GROUP BY: `GROUP BY` collapses rows; `PARTITION BY` calculates metrics across partition groups while preserving every individual original row."
    ],
    codeSnippet: `-- Cumulative Running Total & MoM Growth
SELECT 
    order_id,
    customer_id,
    order_date,
    amount,
    -- Running Total per Customer
    SUM(amount) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_customer_total,
    -- Previous Order Amount
    LAG(amount, 1, 0) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS prev_order_amount
FROM orders;`,
    pitfall: "Using `SUM(amount) OVER (ORDER BY date)` without specifying `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` uses default `RANGE`, which sums all rows with identical dates together into the same total.",
    interviewTip: "Memorize the exact definition: DENSE_RANK() does NOT skip numbers after ties; RANK() skips numbers equal to the tie count; ROW_NUMBER() assigns distinct sequential integers."
  },

  {
    id: "sql-joins-execution-plans",
    title: "Join Algorithms & EXPLAIN ANALYZE Execution Plans",
    category: "Query Optimization",
    badge: "Staff Performance",
    oneLiner: "Query optimizers choose between Nested Loop (small/indexed), Hash Join (large unsorted), and Merge Join (pre-sorted streams).",
    summary: "When you write an `INNER JOIN`, the SQL engine chooses a physical join algorithm. Senior engineers must be able to read an `EXPLAIN ANALYZE` output and identify slow sequential scans, temp table spills, and join bottlenecks.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: The 3 Physical Join Algorithms</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Nested Loop</span>
            <span class="node-label">Outer Loop ➔ Inner Index</span>
            <span class="node-sub">Fast for small outer + indexed inner</span>
          </div>
          <div class="flow-arrow-node">vs</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Hash Join</span>
            <span class="node-label">Build Hash Map in RAM</span>
            <span class="node-sub">O(N + M) for large unindexed sets</span>
          </div>
          <div class="flow-arrow-node">vs</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Sort-Merge Join</span>
            <span class="node-label">Two Sorted Pointers</span>
            <span class="node-sub">O(N + M) when tables pre-sorted by key</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Nested Loop: Scans outer table and performs index lookup on inner table for each row. Ideal for OLTP queries returning few rows.",
      "Hash Join: Builds an in-memory hash table of the smaller relation, then probes the larger relation. If the hash table exceeds `work_mem` / buffer pool, it spills to disk (HashJoin Spill), degrading performance.",
      "Sort-Merge Join: Sorts both inputs on the join key (or reads pre-sorted index) and merges them like merge sort. Very efficient for large bulk analytical scans.",
      "Reading EXPLAIN: Look for: 1) `Seq Scan` (Full table scan), 2) `Index Scan` vs `Index Only Scan`, 3) `Rows Removed by Filter` (high number indicates missing index)."
    ],
    codeSnippet: `-- Diagnosing Query Performance with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT c.name, COUNT(o.id) AS total_orders
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.id, c.name;

-- Key Indicators in Output:
-- -> Hash Join (cost=... actual time=...)
--    -> Seq Scan on orders (Rows Removed by Filter: 850,000) ❌ (Missing index on created_at!)
--    -> Hash (Batches: 1 Memory Usage: 450kB) ✅ (Fits in RAM)`,
    pitfall: "Assuming `JOIN` order in your SQL query dictates physical join order. The cost-based optimizer re-orders joins based on catalog statistics. Stale table statistics cause the optimizer to choose wrong plans.",
    interviewTip: "Run `ANALYZE table_name` regularly in production to refresh optimizer statistics (histogram buckets) so the planner chooses the right join algorithm."
  },

  {
    id: "sql-acid-isolation-locks",
    title: "ACID, Transaction Isolation Levels & Locking",
    category: "Transactions & Concurrency",
    badge: "Senior Systems",
    oneLiner: "Transaction isolation levels balance data consistency against concurrent throughput via MVCC and lock granularity.",
    summary: "Concurrency in relational databases relies on MVCC (Multi-Version Concurrency Control) and lock managers. Senior engineers must understand dirty reads, non-repeatable reads, phantom reads, and deadlock prevention.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Visual Mental Model: The 4 SQL Isolation Levels & Concurrency Hazards</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #ef4444;">Read Uncommitted</div>
            <div class="space-desc">Dirty Reads Allowed ❌</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Reads uncommitted dirty data from in-flight transactions. Never use in production.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(249, 115, 22, 0.4); background: rgba(249, 115, 22, 0.08);">
            <div class="space-name" style="color: #fb923c;">Read Committed</div>
            <div class="space-desc">Default in Postgres/Oracle</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Each query takes fresh MVCC snapshot. Non-repeatable reads can occur between queries.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Repeatable Read</div>
            <div class="space-desc">Default in MySQL (InnoDB)</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Snapshot created at transaction start. InnoDB uses Next-Key Locks to eliminate Phantoms!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Serializable</div>
            <div class="space-desc">Strict Serial Ordering</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Highest isolation. Simulates serial execution via 2PL or SSI. High abort/retry rate.</div>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Dirty Read: Reading data written by another uncommitted transaction that subsequently rolls back.",
      "Non-Repeatable Read: Re-reading the same row within a transaction and seeing modified column values because another transaction committed an update.",
      "Phantom Read: Re-running a range query (e.g. `WHERE amount > 100`) and seeing NEW rows inserted by another committed transaction.",
      "MVCC (Multi-Version Concurrency Control): Readers do not block writers, and writers do not block readers. Reads fetch row snapshots based on transaction ID timestamps without locking.",
      "Deadlock Prevention: Always acquire row locks in a consistent, deterministic order (e.g. `ORDER BY id ASC`) across all application service endpoints."
    ],
    codeSnippet: `-- Pessimistic Locking with SELECT FOR UPDATE
-- Prevents lost updates in inventory deduction
START TRANSACTION;

SELECT stock_count 
FROM inventory 
WHERE product_id = 101 
FOR UPDATE; -- Acquires Exclusive (X) Row Lock

-- Business logic check in app: if (stock_count >= requested)
UPDATE inventory 
SET stock_count = stock_count - 1 
WHERE product_id = 101;

COMMIT; -- Releases lock`,
    pitfall: "Using `SELECT ... FOR UPDATE` without an index causes the database to lock every single row (or the whole table) in the table, completely halting concurrency.",
    interviewTip: "Highlight that InnoDB's default isolation level is Repeatable Read, and it uses Next-Key Locks (record lock + gap lock) to prevent phantom reads without requiring full Serializable isolation."
  }
];

window.REVISION_APP_DATA.SQL_QUESTIONS = [
  {
    id: "sql-q1-nth-highest-salary",
    title: "1. Nth Highest Salary (without LIMIT/OFFSET)",
    difficulty: "Medium",
    category: "Window Functions",
    summary: "Find the Nth highest distinct salary in an Employee table.",
    problem: "Write a SQL query to find the Nth highest salary from the Employee table. If there is no Nth highest salary, return NULL.",
    solution: `WITH RankedSalaries AS (
    SELECT 
        salary,
        DENSE_RANK() OVER (ORDER BY salary DESC) as rnk
    FROM Employee
)
SELECT MAX(salary) AS NthHighestSalary
FROM RankedSalaries
WHERE rnk = :N;`,
    explanation: "`DENSE_RANK()` assigns identical ranks to duplicate salaries without creating gaps in the numbering sequence (e.g. 100, 100, 90 ➔ ranks 1, 1, 2). Wrapping in `MAX(salary)` ensures that if no row has `rnk = N`, the query safely returns a single `NULL` instead of an empty result set.",
    trap: "Using `LIMIT 1 OFFSET N-1` without `DISTINCT` returns the wrong salary if there are duplicate top salaries, and returns empty instead of NULL when N exceeds table count."
  },

  {
    id: "sql-q2-department-top-3-earners",
    title: "2. Department Top 3 Earners (LeetCode 185)",
    difficulty: "Hard",
    category: "Window Functions",
    summary: "Find employees who earn in the top 3 unique salaries for their department.",
    problem: "Given tables Employee (id, name, salary, departmentId) and Department (id, name), find all employees who earn in the top 3 highest unique salaries in their department.",
    solution: `WITH RankedEmployees AS (
    SELECT 
        d.name AS Department,
        e.name AS Employee,
        e.salary AS Salary,
        DENSE_RANK() OVER (
            PARTITION BY e.departmentId 
            ORDER BY e.salary DESC
        ) AS salary_rank
    FROM Employee e
    JOIN Department d ON e.departmentId = d.id
)
SELECT Department, Employee, Salary
FROM RankedEmployees
WHERE salary_rank <= 3;`,
    explanation: "`PARTITION BY e.departmentId` resets the ranking for each department. `DENSE_RANK() <= 3` guarantees that all employees sharing a top-3 salary tier are included, even if more than 3 individual employees qualify.",
    trap: "Using `ROW_NUMBER()` or `RANK()`: If two employees share the #1 salary, `ROW_NUMBER()` will arbitrarily make one #1 and the other #2, while `RANK()` skips #2 and jumps straight to #3."
  },

  {
    id: "sql-q3-consecutive-logins-gaps-islands",
    title: "3. Consecutive Login Days / Active Streak (Gaps & Islands)",
    difficulty: "Hard",
    category: "Gaps & Islands",
    summary: "Find users who logged in for 3 or more consecutive days.",
    problem: "Given a Logins table (user_id, login_date), find all user_ids that have logged in on at least 3 consecutive calendar days.",
    solution: `WITH DeduplicatedLogins AS (
    SELECT DISTINCT user_id, login_date
    FROM Logins
),
GroupedIslands AS (
    SELECT 
        user_id,
        login_date,
        login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)) * INTERVAL '1 day' AS island_id
    FROM DeduplicatedLogins
)
SELECT user_id
FROM GroupedIslands
GROUP BY user_id, island_id
HAVING COUNT(*) >= 3;`,
    explanation: "The Classic Gaps & Islands Technique: When dates are consecutive, subtracting the monotonic sequence `ROW_NUMBER()` from `login_date` yields a constant anchor date (`island_id`). Any island with `COUNT(*) >= 3` represents 3+ consecutive login days.",
    trap: "Failing to deduplicate first: If a user logs in 3 times on the SAME day, `login_date - ROW_NUMBER()` produces false positive streaks. Always `SELECT DISTINCT` first."
  },

  {
    id: "sql-q4-cumulative-running-total",
    title: "4. Running Total / Cumulative Sum per Customer",
    difficulty: "Medium",
    category: "Window Frames",
    summary: "Calculate running cumulative revenue per customer over time.",
    problem: "Given Orders (order_id, customer_id, order_date, amount), compute each customer's cumulative spending up to each order.",
    solution: `SELECT 
    customer_id,
    order_id,
    order_date,
    amount,
    SUM(amount) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date, order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_spent
FROM Orders;`,
    explanation: "`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` enforces a physical row-by-row accumulator from the start of the customer partition up to the current row.",
    trap: "Omitting `ROWS BETWEEN`: By default, `SUM() OVER(ORDER BY date)` uses `RANGE BETWEEN`, which groups orders placed on the exact same date and assigns them the same combined sum."
  },

  {
    id: "sql-q5-managers-with-5-reports",
    title: "5. Managers with at Least 5 Direct Reports",
    difficulty: "Medium",
    category: "Aggregation & Filtering",
    summary: "Find names of all managers who supervise 5 or more employees.",
    problem: "Given Employee (id, name, department, managerId), return names of managers with at least 5 direct reporting employees.",
    solution: `SELECT m.name
FROM Employee e
JOIN Employee m ON e.managerId = m.id
GROUP BY m.id, m.name
HAVING COUNT(e.id) >= 5;`,
    explanation: "Self-join `Employee e` (as subordinates) to `Employee m` (as managers). Grouping by manager ID and filtering with `HAVING COUNT(e.id) >= 5` returns qualified managers.",
    trap: "Grouping by `m.name` alone without `m.id`: Two different managers with the same name (e.g. 'John Smith') would be incorrectly merged together."
  },

  {
    id: "sql-q6-deduplicate-keep-latest",
    title: "6. Deduplicate Records Keeping Only the Latest Entry",
    difficulty: "Hard",
    category: "DML / Deletion",
    summary: "Delete duplicate user rows, retaining only the single most recent record per email.",
    problem: "Given Users (id, email, created_at), write a DELETE query to eliminate duplicate emails, keeping the newest entry.",
    solution: `-- Postgres / MySQL 8.0+ CTE Deletion
WITH RankedDuplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY created_at DESC, id DESC
        ) as rn
    FROM Users
)
DELETE FROM Users
WHERE id IN (
    SELECT id FROM RankedDuplicates WHERE rn > 1
);`,
    explanation: "`ROW_NUMBER()` partitions by email and orders by created_at descending. The latest record receives `rn = 1`. Any row with `rn > 1` is a duplicate and is safely deleted.",
    trap: "Deleting with `MIN(id)` or `MAX(id)` without partitioning: Only works if IDs are guaranteed strictly monotonic with timestamps. CTE with `ROW_NUMBER()` is robust against out-of-order writes."
  },

  {
    id: "sql-q7-mom-revenue-growth",
    title: "7. Month-over-Month (MoM) Revenue Growth Percentage",
    difficulty: "Hard",
    category: "LAG & Financial Analytics",
    summary: "Compute monthly revenue and percentage growth compared to the prior month.",
    problem: "Given Orders (order_id, order_date, amount), calculate total revenue per month and the MoM growth percentage.",
    solution: `WITH MonthlyRevenue AS (
    SELECT 
        DATE_TRUNC('month', order_date) AS order_month,
        SUM(amount) AS monthly_revenue
    FROM Orders
    GROUP BY DATE_TRUNC('month', order_date)
),
RevenueWithLag AS (
    SELECT 
        order_month,
        monthly_revenue,
        LAG(monthly_revenue, 1) OVER (ORDER BY order_month) AS prev_month_revenue
    FROM MonthlyRevenue
)
SELECT 
    order_month,
    monthly_revenue,
    prev_month_revenue,
    ROUND(
        ((monthly_revenue - prev_month_revenue) / NULLIF(prev_month_revenue, 0)) * 100.0, 
        2
    ) AS mom_growth_pct
FROM RevenueWithLag
ORDER BY order_month;`,
    explanation: "Two-stage CTE: 1) Aggregate raw order amounts into monthly sums. 2) Use `LAG(monthly_revenue, 1)` to fetch prior month revenue. `NULLIF(prev, 0)` protects against division by zero errors.",
    trap: "Applying `LAG()` before grouping: `LAG()` inside the initial query evaluates per-row order instead of per-month total."
  },

  {
    id: "sql-q8-second-most-recent-order",
    title: "8. Second Most Recent Activity per User",
    difficulty: "Medium",
    category: "Window Slicing",
    summary: "Get the 2nd most recent order for each user, falling back to 1st if user has only 1 order.",
    problem: "Given Orders (order_id, user_id, order_date), return the 2nd most recent order for users with 2+ orders, or their only order if they have 1.",
    solution: `WITH RankedOrders AS (
    SELECT 
        user_id,
        order_id,
        order_date,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date DESC) as rn,
        COUNT(*) OVER (PARTITION BY user_id) as total_orders
    FROM Orders
)
SELECT user_id, order_id, order_date
FROM RankedOrders
WHERE rn = 2 OR (total_orders = 1 AND rn = 1);`,
    explanation: "`COUNT(*) OVER (PARTITION BY user_id)` counts total orders per user alongside `ROW_NUMBER()`. The WHERE condition filters for `rn = 2` while preserving users whose `total_orders = 1`.",
    trap: "Using only `WHERE rn = 2` silently drops users who only made 1 purchase."
  },

  {
    id: "sql-q9-mutual-friends-dedup",
    title: "9. Mutual Friends / Unordered Pair Deduplication",
    difficulty: "Medium",
    category: "Self-Join / Graph",
    summary: "Eliminate duplicate undirected relationships (e.g. A-B and B-A).",
    problem: "Given Friendship (user1_id, user2_id), normalize and count distinct friendships so (1, 2) and (2, 1) are treated as one unique pair.",
    solution: `SELECT 
    CASE WHEN user1_id < user2_id THEN user1_id ELSE user2_id END AS u1,
    CASE WHEN user1_id < user2_id THEN user2_id ELSE user1_id END AS u2
FROM Friendship
GROUP BY 
    CASE WHEN user1_id < user2_id THEN user1_id ELSE user2_id END,
    CASE WHEN user1_id < user2_id THEN user2_id ELSE user1_id END;`,
    explanation: "Enforces a canonical ordering `(min_id, max_id)` for every edge using `CASE WHEN`. Grouping by the canonical pair eliminates bidirectional duplicate relationships.",
    trap: "Simple `WHERE user1_id < user2_id` drops legitimate one-way relationships if the reciprocal row `(user2, user1)` was not stored in the table."
  },

  {
    id: "sql-q10-median-salary-per-department",
    title: "10. Median Salary of Employees per Department",
    difficulty: "Hard",
    category: "Statistical Windows",
    summary: "Compute the true mathematical median salary for each department.",
    problem: "Given Employee (id, name, salary, department_id), calculate the median salary per department without using proprietary database extensions.",
    solution: `WITH RankedSalaries AS (
    SELECT 
        department_id,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary ASC, id ASC) AS row_asc,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC, id DESC) AS row_desc
    FROM Employee
)
SELECT 
    department_id,
    ROUND(AVG(salary), 2) AS median_salary
FROM RankedSalaries
WHERE row_asc IN (row_desc, row_desc - 1, row_desc + 1)
GROUP BY department_id;`,
    explanation: "Universal SQL Median Trick: Sorting ascending and descending simultaneously means the median element(s) will have `row_asc` equal or adjacent to `row_desc`. `AVG(salary)` correctly averages the middle two values for even-sized lists.",
    trap: "Relying on `PERCENTILE_CONT(0.5)`: It is an analytical window function in Postgres/Oracle but is NOT supported natively in MySQL."
  },

  {
    id: "sql-q11-pivot-rows-to-columns",
    title: "11. Pivot Rows to Columns without PIVOT Keyword",
    difficulty: "Medium",
    category: "Conditional Aggregation",
    summary: "Convert row status counts into separate columns using conditional aggregation.",
    problem: "Given Orders (id, customer_id, status: 'PENDING', 'COMPLETED', 'CANCELLED'), create a summary table with customer_id and columns: pending_count, completed_count, cancelled_count.",
    solution: `SELECT 
    customer_id,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
    COUNT(*) AS total_orders
FROM Orders
GROUP BY customer_id;`,
    explanation: "Conditional Aggregation (`SUM(CASE WHEN ...)`): Transforms vertical row states into horizontal column values universally across all SQL dialects (MySQL, Postgres, Oracle, SQL Server, SQLite).",
    trap: "Using `COUNT(CASE WHEN status = 'PENDING' THEN 0 END)`: `COUNT()` counts non-null values! Even 0 is non-null, so it counts all rows. Use `SUM()` with 1/0 or `COUNT(CASE WHEN ... THEN 1 ELSE NULL END)`."
  },

  {
    id: "sql-q12-customers-bought-all-products",
    title: "12. Find Customers Who Bought All Products",
    difficulty: "Hard",
    category: "Relational Division",
    summary: "Find customers who have purchased every single product available in the store.",
    problem: "Given Customer (customer_id, product_key) and Product (product_key), find all customer_ids that bought all products in the Product table.",
    solution: `SELECT customer_id
FROM Customer
GROUP BY customer_id
HAVING COUNT(DISTINCT product_key) = (
    SELECT COUNT(*) FROM Product
);`,
    explanation: "Relational Division via Aggregation: Group by customer_id and count their unique purchased products. If the count matches the total count of distinct products in the Product catalog, the customer bought everything.",
    trap: "Forgetting `DISTINCT` inside `COUNT(product_key)`: A customer who buys the same product 5 times would falsely match a store with 5 total products."
  },

  {
    id: "sql-q13-user-retention-cohort",
    title: "13. Monthly User Retention / Cohort Analysis",
    difficulty: "Hard",
    category: "Cohort Analysis",
    summary: "Calculate how many users from Month M returned and performed actions in Month M+1.",
    problem: "Given UserActivity (user_id, activity_date), calculate Month 1 Retention: percentage of users active in month M who return in month M+1.",
    solution: `WITH MonthlyActive AS (
    SELECT DISTINCT 
        user_id,
        DATE_TRUNC('month', activity_date) AS activity_month
    FROM UserActivity
)
SELECT 
    m1.activity_month AS cohort_month,
    COUNT(m1.user_id) AS cohort_size,
    COUNT(m2.user_id) AS retained_users,
    ROUND((COUNT(m2.user_id) * 100.0 / COUNT(m1.user_id)), 2) AS retention_rate_pct
FROM MonthlyActive m1
LEFT JOIN MonthlyActive m2 
    ON m1.user_id = m2.user_id 
    AND m2.activity_month = m1.activity_month + INTERVAL '1 month'
GROUP BY m1.activity_month
ORDER BY m1.activity_month;`,
    explanation: "Deduplicates users by active month in a CTE, then performs a self-`LEFT JOIN` on `user_id` matching `activity_month + 1 month`. Any non-null match represents a retained user.",
    trap: "Using `INNER JOIN`: Completely eliminates cohorts that had zero retained users instead of reporting 0% retention."
  },

  {
    id: "sql-q14-overlapping-intervals-booking",
    title: "14. Overlapping Event Bookings / Schedule Conflicts",
    difficulty: "Hard",
    category: "Interval Collision",
    summary: "Detect overlapping conference room bookings.",
    problem: "Given Bookings (booking_id, room_id, start_time, end_time), find all pairs of overlapping bookings for the same room.",
    solution: `SELECT 
    b1.booking_id AS booking_1,
    b2.booking_id AS booking_2,
    b1.room_id
FROM Bookings b1
JOIN Bookings b2 
    ON b1.room_id = b2.room_id
    AND b1.booking_id < b2.booking_id -- Avoid self-comparison & duplicate pairs
    AND b1.start_time < b2.end_time   -- Standard interval overlap formula
    AND b1.end_time > b2.start_time;`,
    explanation: "Universal Interval Overlap Formula: Two intervals `[A_start, A_end]` and `[B_start, B_end]` overlap if and only if `A_start < B_end AND A_end > B_start`. `b1.booking_id < b2.booking_id` prevents pairing an event with itself and avoids bidirectional duplicates.",
    trap: "Writing `b1.start_time BETWEEN b2.start_time AND b2.end_time`: Fails when interval B is completely contained inside interval A without B's start time touching boundaries."
  },

  {
    id: "sql-q15-tree-hierarchy-node-type",
    title: "15. Tree Node Classification: Root, Inner, Leaf",
    difficulty: "Medium",
    category: "Hierarchical SQL",
    summary: "Classify each node in a tree hierarchy as Root, Inner, or Leaf.",
    problem: "Given Tree (id, p_id), where p_id is the parent node id, classify each node as 'Root', 'Inner', or 'Leaf'.",
    solution: `SELECT 
    id,
    CASE 
        WHEN p_id IS NULL THEN 'Root'
        WHEN id IN (SELECT p_id FROM Tree WHERE p_id IS NOT NULL) THEN 'Inner'
        ELSE 'Leaf'
    END AS node_type
FROM Tree;`,
    explanation: "1) If `p_id IS NULL`, it has no parent ➔ 'Root'. 2) If its `id` appears as a parent to other nodes, it has children ➔ 'Inner'. 3) Otherwise, it has a parent but no children ➔ 'Leaf'.",
    trap: "Writing `IN (SELECT p_id FROM Tree)` without `WHERE p_id IS NOT NULL`: If the subquery returns even a single NULL, SQL three-valued logic causes `NOT IN` to evaluate to UNKNOWN, returning zero results!"
  },

  {
    id: "sql-q16-rank-scores-dense",
    title: "16. Rank Scores with Ties and No Gaps",
    difficulty: "Medium",
    category: "Dense Ranking",
    summary: "Rank competitive contest scores from highest to lowest without rank number gaps.",
    problem: "Given Scores (id, score), rank scores descending. Ties must have the same rank, and the next rank number must be consecutive.",
    solution: `SELECT 
    score,
    DENSE_RANK() OVER (ORDER BY score DESC) AS 'rank'
FROM Scores;`,
    explanation: "`DENSE_RANK()` was created specifically for competitive rankings where identical scores share rank without skipping numbers (e.g. 4.0, 4.0, 3.85 ➔ Rank 1, 1, 2).",
    trap: "Using `RANK()`: Yields ranks 1, 1, 3 (skipping rank 2)."
  },

  {
    id: "sql-q17-7-day-moving-average",
    title: "17. 7-Day Moving Average of Daily Revenue",
    difficulty: "Hard",
    category: "Rolling Windows",
    summary: "Calculate the rolling 7-day average of daily revenue.",
    problem: "Given DailySales (sale_date, amount), compute the 7-day moving average for dates that have at least 6 preceding days.",
    solution: `WITH DailyTotals AS (
    SELECT 
        sale_date,
        SUM(amount) AS daily_amount
    FROM DailySales
    GROUP BY sale_date
)
SELECT 
    sale_date,
    daily_amount,
    ROUND(
        AVG(daily_amount) OVER (
            ORDER BY sale_date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ), 
        2
    ) AS moving_avg_7d
FROM DailyTotals
ORDER BY sale_date;`,
    explanation: "`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` defines a sliding window of exactly 7 consecutive days (6 previous + current day).",
    trap: "Assuming `ROWS BETWEEN 6 PRECEDING` handles missing dates: If days are missing from DailyTotals, it averages the last 7 *recorded entries*, not 7 calendar days! Generate a calendar date series first if gaps exist."
  },

  {
    id: "sql-q18-find-missing-ids-in-sequence",
    title: "18. Find Missing IDs in an Auto-Increment Sequence",
    difficulty: "Hard",
    category: "Sequence Gaps",
    summary: "Find gap intervals in a primary key sequence (e.g. identifying deleted records).",
    problem: "Given a table with an integer `id` column, identify all missing ranges where IDs skipped.",
    solution: `WITH NextIdLead AS (
    SELECT 
        id,
        LEAD(id, 1) OVER (ORDER BY id) AS next_id
    FROM Orders
)
SELECT 
    id + 1 AS gap_start,
    next_id - 1 AS gap_end
FROM NextIdLead
WHERE next_id - id > 1;`,
    explanation: "Uses `LEAD(id, 1)` to inspect the immediately following ID. Whenever `next_id - id > 1`, a gap exists starting at `id + 1` up to `next_id - 1`.",
    trap: "Self-joining `Orders o1 JOIN Orders o2 ON o1.id + 1 = o2.id` fails to identify gaps larger than 1."
  },

  {
    id: "sql-q19-exchange-adjacent-seats",
    title: "19. Exchange Adjacent Seats in a Classroom",
    difficulty: "Medium",
    category: "Modular Arithmetic",
    summary: "Swap seats between every two consecutive students (1 with 2, 3 with 4).",
    problem: "Given Seat (id, student), swap seats for consecutive students. If total count is odd, the last student's seat is unchanged.",
    solution: `SELECT 
    CASE 
        WHEN id % 2 = 1 AND id = (SELECT COUNT(*) FROM Seat) THEN id -- Last odd seat stays
        WHEN id % 2 = 1 THEN id + 1                                  -- Odd goes to Even
        ELSE id - 1                                                  -- Even goes to Odd
    END AS id,
    student
FROM Seat
ORDER BY id ASC;`,
    explanation: "Conditional modular arithmetic: Odd IDs increment by 1 (`1 ➔ 2`), Even IDs decrement by 1 (`2 ➔ 1`). The boundary check preserves the final student if total seats is an odd number.",
    trap: "Forgetting to handle the final odd student: When count is 5, student 5 would map to 6, leaving seat 5 empty."
  },

  {
    id: "sql-q20-employees-earning-more-than-managers",
    title: "20. Employees Earning More Than Their Direct Managers",
    difficulty: "Medium",
    category: "Self-Join",
    summary: "Identify employees whose compensation exceeds their direct manager's salary.",
    problem: "Given Employee (id, name, salary, managerId), find names of employees who earn more than their manager.",
    solution: `SELECT e.name AS Employee
FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;`,
    explanation: "Classic self-join: Join the Employee table to itself on `e.managerId = m.id`. Filter where subordinate salary `e.salary` is strictly greater than manager salary `m.salary`.",
    trap: "Using `LEFT JOIN`: Subordinates without managers have `m.salary IS NULL`, and `e.salary > NULL` evaluates to UNKNOWN, which produces no rows. `INNER JOIN` is cleaner and index-friendly."
  }
];
