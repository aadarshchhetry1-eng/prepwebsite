/**
 * react-data.js
 * Senior / Staff Engineer React & Redux Architecture, Core Internals & Top Interview Scenarios
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.REACT_TOPICS = [
  {
    id: "react-fiber-reconciler-architecture",
    title: "React Fiber Architecture & Double-Buffering Engine",
    category: "Reconciliation & Concurrency",
    badge: "Staff-Level Reconciler",
    oneLiner: "Fiber replaces recursive stack reconciliation with an interruptible singly-linked tree structure, using Double-Buffering to prevent tearing during concurrent rendering.",
    summary: "Prior to React 16 (Stack Reconciler), reconciliation was a recursive, synchronous walk down the component tree. Once started, it could not be paused, causing dropped animation frames and unresponsive UIs during heavy renders. The Fiber Reconciler transforms reconciliation into a virtual stack machine where each component is represented as a 'Fiber' node linked by `child`, `sibling`, and `return` pointers. This enables cooperative multitasking (time-slicing) via the React Scheduler and Double-Buffering (`current` vs `workInProgress` trees).",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 React Fiber Double-Buffering & Scheduling Architecture</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">Current Fiber Tree (Screen)</div>
            <div class="space-desc">Active DOM representation</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Pointers reflect what user currently sees on screen. Immutable during rendering.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">WorkInProgress Tree (Offscreen)</div>
            <div class="space-desc">Built concurrently in time slices</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Calculated in chunks via Scheduler (MessageChannel). Can be paused, aborted, or restarted!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Render Phase</span>
            <span class="node-label">beginWork / completeWork</span>
            <span class="node-sub">Async &amp; Interruptible</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Pointer Swap</span>
            <span class="node-label">fiberRoot.current = Wip</span>
            <span class="node-sub">Instantaneous atomic swap</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">3. Commit Phase</span>
            <span class="node-label">commitRoot</span>
            <span class="node-sub">Sync DOM Mutation</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Fiber Data Structure: Each component instance maps to a Fiber node with three navigation pointers: `child` (first child), `sibling` (next sibling), and `return` (parent). This singly-linked list can be paused and resumed at any arbitrary node without relying on the JavaScript call stack.",
      "Double-Buffering Mechanism: React maintains two trees: `current` (the tree already committed to the DOM) and `workInProgress` (the tree currently being computed in memory). Once the workInProgress tree completes, React swaps `fiberRoot.current` to point to it in a single atomic pointer reassignment.",
      "The Two Phases: 1) Render Phase (asynchronous, interruptible): runs `beginWork()` and `completeWork()`, computes diffs, creates effect tags; 2) Commit Phase (synchronous, uninterruptible): runs `commitMutationEffects()`, mutates the real DOM, and triggers layout/passive effects (`useEffect`).",
      "Time-Slicing & Scheduler: The Scheduler uses `MessageChannel` (macro-task) to yield control back to the browser every ~5ms so the browser can process user clicks, layout, and 60fps animations.",
      "Lanes Concurrency Model: React 18 uses 31-bit integers ('Lanes') to represent update priorities (SyncLane, InputContinuousLane, DefaultLane, TransitionLane, IdleLane). Urgent lanes pre-empt non-urgent transitions."
    ],
    codeSnippet: `// Representation of a React Fiber Node under the hood:
interface FiberNode {
    // 1. Component Identity & DOM Instance
    tag: WorkTag;              // FunctionComponent (0), ClassComponent (1), HostComponent (5 - div/span)
    key: null | string;        // Reconciliation key
    elementType: any;          // 'div', 'span', or Component function
    type: any;                 // Resolved component function
    stateNode: any;            // Reference to real DOM Element or Class instance

    // 2. Tree Traversal Pointers (Singly-Linked List)
    return: FiberNode | null;  // Parent Fiber
    child: FiberNode | null;   // First child Fiber
    sibling: FiberNode | null; // Next sibling Fiber
    index: number;

    // 3. State & Hooks Storage
    memoizedProps: any;        // Props used in previous render
    pendingProps: any;         // Incoming new props
    memoizedState: any;        // Head of Hook linked list (for function components)
    updateQueue: any;          // Queue of pending setState updates

    // 4. Double-Buffering & Concurrency
    alternate: FiberNode | null; // Pointer to corresponding Fiber in alternate tree!
    flags: Flags;                // Bitmask of DOM effects (Placement, Update, Deletion)
    lanes: Lanes;                // Priority bitmask
}

// Work loop executing in 5ms time-slices:
function workLoopConcurrent() {
    while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
    }
}`,
    pitfall: "Running heavy synchronous calculations or blocking JSON parses inside the Render phase. Even with Fiber, a single component that takes 100ms to compute its JSX cannot be interrupted mid-component, dropping frames.",
    interviewTip: "Always emphasize the separation between the Render phase (asynchronous, side-effect free, interruptible) and the Commit phase (synchronous DOM mutations)."
  },

  {
    id: "react-vdom-diffing-algorithm",
    title: "Virtual DOM & Diffing Heuristics: Why O(N) Replaces O(N³)",
    category: "Virtual DOM & Reconciliation",
    badge: "Must-Know Core Engine",
    oneLiner: "React solves the NP-hard O(N³) tree edit distance problem in linear O(N) time using 3 pragmatic heuristics based on element types, keys, and level-by-level comparison.",
    summary: "Finding the minimum number of operations to transform one tree into another has an optimal algorithmic complexity of O(N³). If 1,000 components were diffed using general tree diffing, it would take 1 billion operations per render! React replaces this with an O(N) heuristic algorithm based on three core assumptions: different component types produce completely different trees, keys provide stable identity across reorders, and diffing is strictly confined to nodes at the same tree depth.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 The 3 React Diffing Heuristics (O(N) Complexity)</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #ef4444;">1. Different Types ➔ Full Teardown</div>
            <div class="space-desc">&lt;div&gt; ➔ &lt;section&gt; destroys entire subtree</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Component is unmounted, state is wiped, and brand-new DOM nodes are created.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">2. Same Type ➔ In-Place Patch</div>
            <div class="space-desc">&lt;div className="a"&gt; ➔ &lt;div className="b"&gt;</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">DOM node is retained; only modified attributes and props are updated.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-orange">
            <span class="node-badge">3. List Keys</span>
            <span class="node-label">key="user-101"</span>
            <span class="node-sub">Stable Identity Hash</span>
          </div>
          <div class="flow-arrow-node">Reorder ➔</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Linear Map</span>
            <span class="node-label">existingChildren Map</span>
            <span class="node-sub">O(1) Map Lookup by Key!</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Three Diffing Heuristics: 1) Two elements of different types produce different trees (destroy old, mount new); 2) Child lists are matched using unique, stable `key` props; 3) Trees are diffed level-by-level without comparing across differing hierarchy depths.",
      "List Reconciliation (`reconcileChildrenArray`): React builds an `existingChildren` Map keyed by `key || index`. It walks the new child list, matching items from the Map in O(1) time. Nodes with matching keys are reused and moved via `Placement` flags instead of being destroyed and recreated.",
      "The `key={index}` Disaster: If keys are array indices, inserting an item at the beginning changes the index of EVERY subsequent item (index 0 becomes 1, 1 becomes 2). React thinks all items changed, mutates every row, and binds internal state (like `<input>` text or checkbox checks) to the wrong items!",
      "Synthetic Keys (`Math.random()`): Generating keys on the fly during render creates new keys on every tick, forcing React to unmount and remount the DOM node on every render, destroying focus, selections, and animations."
    ],
    codeSnippet: `// ❌ THE INDEX AS KEY DISASTER:
function TodoList({ items }) {
    return (
        <ul>
            {items.map((item, index) => (
                // Adding item at index 0 re-indexes all children!
                // Input state remains at position 0, attaching to the wrong item!
                <li key={index}>
                    <input type="text" defaultValue={item.text} />
                </li>
            ))}
        </ul>
    );
}

// ✅ STABLE BUSINESS IDENTIFIER:
function TodoListFixed({ items }) {
    return (
        <ul>
            {items.map(item => (
                // Reordering or prepending keeps DOM node bound to item.id!
                <li key={item.id}>
                    <input type="text" defaultValue={item.text} />
                </li>
            ))}
        </ul>
    );
}`,
    pitfall: "Using array index as key in dynamic lists that can be sorted, filtered, deleted, or prepended. It causes subtle state bleeding bugs in form inputs and degrades reconciliation performance.",
    interviewTip: "Explain that React's diffing is a greedy O(N) heuristic. Detail how `existingChildren` Map lookup enables single-pass linear reconciliation."
  },

  {
    id: "react-hooks-linked-list-internals",
    title: "Hooks Under the Hood: The Fiber memoizedState Linked List",
    category: "Hooks Architecture",
    badge: "Senior Core Engine",
    oneLiner: "Hooks are stored as a singly-linked list on the Fiber's memoizedState; calling hooks out of order corrupts the pointer traversal and crashes the component.",
    summary: "React does not identify hooks by their variable names. Inside the Fiber node, `fiber.memoizedState` points to the head of a singly-linked list of Hook objects. Each invocation of `useState`, `useEffect`, `useMemo`, or `useRef` advances a `workInProgressHook` pointer along this list. This explains why hooks cannot be placed inside `if` statements or loops: changing the number or order of hook calls shifts the pointer, causing Hook N to receive the state of Hook N-1!",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Fiber.memoizedState Singly-Linked List of Hooks</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Hook 1 (useState)</span>
            <span class="node-label">memoizedState: 42</span>
            <span class="node-sub">queue: [dispatchAction]</span>
          </div>
          <div class="flow-arrow-node">.next ➔</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">Hook 2 (useEffect)</span>
            <span class="node-label">memoizedState: Effect</span>
            <span class="node-sub">tag: Passive, deps: [id]</span>
          </div>
          <div class="flow-arrow-node">.next ➔</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">Hook 3 (useRef)</span>
            <span class="node-label">memoizedState: {current: DOM}</span>
            <span class="node-sub">next: null (Tail)</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Hook Object: `{ memoizedState, baseState, baseQueue, queue, next }`. `memoizedState` holds the actual state value for `useState`, the effect descriptor for `useEffect`, the `{ current }` object for `useRef`, or the cached tuple `[value, deps]` for `useMemo`.",
      "Mount vs Update Dispatchers: React swaps internal dispatchers: `ReactCurrentDispatcher.current = HooksDispatcherOnMount` during initial mount, and `HooksDispatcherOnUpdate` during subsequent re-renders.",
      "The Pointer Advance (`updateWorkInProgressHook`): During re-render, React traverses the existing hook list sequentially: `workInProgressHook = currentHook.next`. If an `if` condition skips a hook, `useState` reads the data of `useEffect`, causing an unrecoverable type error.",
      "State Updates (`dispatchAction`): Calling `setState` creates an Update object and appends it to `hook.queue.pending` (a circular linked list). During the next render phase, React processes this queue to compute the new `memoizedState`."
    ],
    codeSnippet: `// Simplified Under-the-Hood Mechanics of React Hooks:
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;

function useState(initialState) {
    let hook;
    if (currentlyRenderingFiber.alternate === null) {
        // 1. MOUNT PHASE: Build the linked list
        hook = {
            memoizedState: typeof initialState === 'function' ? initialState() : initialState,
            queue: { pending: null },
            next: null
        };
        if (!currentlyRenderingFiber.memoizedState) {
            currentlyRenderingFiber.memoizedState = hook; // Head
        } else {
            workInProgressHook.next = hook; // Append
        }
        workInProgressHook = hook;
    } else {
        // 2. UPDATE PHASE: Traverse existing linked list sequentially!
        currentHook = currentHook ? currentHook.next : currentlyRenderingFiber.alternate.memoizedState;
        hook = {
            memoizedState: currentHook.memoizedState,
            queue: currentHook.queue,
            next: null
        };
        // Process queued updates...
        workInProgressHook = hook;
    }

    const dispatch = (action) => {
        // Enqueue update and schedule render on Fiber root
    };

    return [hook.memoizedState, dispatch];
}`,
    pitfall: "Conditional hook invocation: `if (isLoggedIn) useState(...)`. This corrupts the `memoizedState` pointer traversal on subsequent renders, causing React to throw: 'Rendered fewer hooks than expected'.",
    interviewTip: "Always explain that Hooks rely on a singly-linked list on `fiber.memoizedState`. That is the architectural reason behind the Rules of Hooks."
  },

  {
    id: "redux-core-middleware-immer-internals",
    title: "Redux Core Internals: Unidirectional Data Flow, Curried Middleware & Immer",
    category: "State Management Architecture",
    badge: "Enterprise State Architecture",
    oneLiner: "Redux composes curried middleware pipelines around dispatch; Redux Toolkit leverages ES6 Proxies (Immer) to enable mutating syntax with strict structural sharing.",
    summary: "Redux is built on three strict principles: a single source of truth (store), read-only state (emitted actions), and pure reducer functions. When an action is dispatched, it travels through a pipeline of nested curried middleware functions (`store => next => action`) before reaching the root reducer. Redux Toolkit (RTK) modernizes this using Immer.js, which wraps the draft state in ES6 Proxies to record mutations and produce an immutable state tree with structural sharing.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Redux Action Pipeline & Curried Middleware Flow</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Trigger</span>
            <span class="node-label">dispatch(action)</span>
            <span class="node-sub">{ type, payload }</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Middleware 1</span>
            <span class="node-label">Logging / Thunk</span>
            <span class="node-sub">Async side effects</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">3. Middleware 2</span>
            <span class="node-label">Crash Reporter</span>
            <span class="node-sub">Telemetry interception</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. Reducer (Immer)</span>
            <span class="node-label">Produce New State</span>
            <span class="node-sub">Structural Sharing</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Curried Middleware Pattern: Redux middleware has the signature `store => next => action`. Using `compose()`, each middleware wraps the next `dispatch` function, creating an onion-like execution pipeline.",
      "Redux Thunk Mechanics: Thunk is a 14-line middleware: `if (typeof action === 'function') return action(dispatch, getState, extraArgument); return next(action);`. It intercepts functions to enable async workflows before dispatching raw action objects.",
      "How Immer Works: Immer wraps state in an ES6 `Proxy`. When you execute `state.items.push(x)`, the Proxy intercepts the mutation, tracks modified paths, and leaves unmodified branches untouched (Structural Sharing). It returns a new immutable object reference.",
      "Selector Bailouts: `useSelector` subscribes to the store. On every dispatch, it runs the selector function and compares the result using reference equality (`===`). If the reference changed, it forces a component re-render; if identical, it bails out!"
    ],
    codeSnippet: `// 1. Implementing Custom Redux Middleware from Scratch:
const crashReportingMiddleware = store => next => action => {
    try {
        console.log('[ACTION DISPATCHED]:', action.type, action.payload);
        return next(action); // Passes action to next middleware in chain or reducer
    } catch (err) {
        console.error('[REDUX CRASH]:', err);
        Sentry.captureException(err, { extra: { action, state: store.getState() } });
        throw err;
    }
};

// 2. Redux Toolkit (RTK) with Immer Proxy Mutation:
import { createSlice, createSelector } from '@reduxjs/toolkit';

const cartSlice = createSlice({
    name: 'cart',
    initialState: { items: [], total: 0 },
    reducers: {
        addItem(state, action) {
            // Immer ES6 Proxy intercepts mutation! Produces immutable draft safely:
            state.items.push(action.payload);
            state.total += action.payload.price;
        }
    }
});

// 3. Reselect Memoized Selector (Prevents recalculations):
export const selectExpensiveCartTotal = createSelector(
    state => state.cart.items,
    items => items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
);`,
    pitfall: "Direct state mutation in vanilla Redux: `state.user.name = 'Bob'; return state;`. Because the object reference is identical (`oldState === newState`), `useSelector` and `store.subscribe` bail out, and components never re-render!",
    interviewTip: "Write the 3-arrow curried middleware signature on the whiteboard: `store => next => action`. Explain how Immer uses ES6 Proxies for structural sharing."
  },

  {
    id: "react-rerender-context-memoization",
    title: "Re-rendering Mechanics, Context API Pitfalls & Memoization Strategies",
    category: "Performance & Rendering",
    badge: "Staff-Level Performance",
    oneLiner: "Component re-renders are triggered by state, parent renders, or Context changes; Context causes cascading consumer re-renders because it lacks selector-based bailout.",
    summary: "A common misconception is that a component only re-renders when its props change. By default, when a parent component renders, React recursively re-renders ALL of its children regardless of props! Context API exacerbates this because any change to the context value forces EVERY component calling `useContext` to re-render, even if it only uses an untouched slice of the context. Senior engineers optimize this using `React.memo`, `useMemo`, `useCallback`, and Context Slicing.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧠 Context API vs Selector-Based State Re-render Impact</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #ef4444;">❌ Monolithic Context API</div>
            <div class="space-desc">Theme &amp; User &amp; Notifications in 1 Context</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">User changes theme ➔ 45 unrelated notification badges and profile widgets all re-render!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">✅ Context Slicing or Redux Selectors</div>
            <div class="space-desc">Split into ThemeContext, UserContext, or Redux</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Only the exact component consuming the changed slice re-renders. Remaining components bail out!</div>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The 3 Triggers of a Re-render: 1) Local state change (`useState`, `useReducer`); 2) Parent component re-render (cascades down the tree); 3) Consumed Context value change (`useContext`).",
      "Why `React.memo` Fails: `React.memo` performs a shallow equality check (`Object.is`) on props. If the parent passes an inline function `onClick={() => doWork()}` or inline object `style={{ color: 'red' }}`, a new reference is created on every render, defeating `React.memo`!",
      "The Role of `useCallback` and `useMemo`: `useCallback(fn, deps)` caches function instance references; `useMemo(() => val, deps)` caches expensive computed values. They are ONLY useful when passed to memoized children (`React.memo`) or dependency arrays.",
      "State Colocation Principle: The best performance optimization is NOT memoization; it is pushing state DOWN to the leaves of the component tree so parent re-renders don't propagate downward."
    ],
    codeSnippet: `// ❌ THE UNMEMOIZED PROP TRAP:
function Parent() {
    const [count, setCount] = useState(0);
    // New function reference created on every single render!
    const handleClick = () => console.log('Clicked');
    // New object reference created on every single render!
    const config = { theme: 'dark' };

    return (
        <div>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
            {/* MemoChild RE-RENDERS EVERY TIME despite React.memo! */}
            <MemoChild onClick={handleClick} config={config} />
        </div>
    );
}

// ✅ FIXED WITH MEMOIZATION & STABLE REFERENCES:
const MemoChild = React.memo(function Child({ onClick, config }) {
    console.log('Child rendered!');
    return <button onClick={onClick}>Child Button</button>;
});

function ParentFixed() {
    const [count, setCount] = useState(0);
    // Stable function reference cached across renders:
    const handleClick = useCallback(() => console.log('Clicked'), []);
    // Stable object reference cached across renders:
    const config = useMemo(() => ({ theme: 'dark' }), []);

    return (
        <div>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
            {/* MemoChild BAILS OUT of render because props are strictly equal (Object.is)! */}
            <MemoChild onClick={handleClick} config={config} />
        </div>
    );
}`,
    pitfall: "Using Context API for high-frequency state updates (e.g., streaming stock prices or mouse coordinates). Every tick forces all consumer components to re-render, freezing the browser. Use Redux, Zustand, or Jotai with selectors instead.",
    interviewTip: "State the rule: 'React.memo is useless if props include unmemoized object literals or inline arrow functions.'"
  }
];

window.REVISION_APP_DATA.REACT_QUESTIONS = [
  {
    id: "react-q1-key-index-disaster",
    title: "1. Why is key={index} a Production Disaster on Dynamic Lists?",
    difficulty: "Senior",
    category: "Reconciliation & Virtual DOM",
    summary: "Using key={index} causes state corruption, input bleeding, and wrong DOM node recycling when items are deleted, prepended, or filtered.",
    problem: "A shopping cart checklist has a delete button on each item row. When a user checks the checkbox on Item 1 ('Apples') and clicks 'Delete', Item 1 disappears, but Item 2 ('Bananas') is now marked as checked! Text input values and checkbox states bleed across rows.",
    juniorTrap: "Assuming that keys are just to silence React console warnings, or that index is fine if items don't have IDs.",
    interviewerIntent: "Assesses exact knowledge of React's linear diffing algorithm (`reconcileChildrenArray`), element identity, and why the DOM state node remains associated with the position index.",
    seniorAnswer: [
      "How React Diffs Arrays: React compares old children with new children by `key`. If `key={index}`, the keys are always `0, 1, 2...` regardless of what data is in those positions.",
      "The Prepend / Delete Failure: Suppose list has items `[A(key 0), B(key 1)]`. You delete A. The new list has `[B(key 0)]`.",
      "The Bug: React compares old `key=0` (which was A) with new `key=0` (which is B). It sees same element type and same key! React concludes: 'Element 0 did not change; it just received new props!'.",
      "Result: React updates the text prop, but REUSES the existing DOM element and its uncontrolled internal state (like `<input>` focus, cursor position, or checkbox checked state)! The checkbox stays checked on B!",
      "The Fix: Always use stable, unique business IDs (e.g. `item.uuid`, `item.id`). Never use array index or random numbers generated during render."
    ],
    innerWorking: "During `reconcileChildrenArray()`, React attempts to map existing Fiber nodes by key. When keys are indices, React erroneously matches node `i` to node `i`, mutating props in-place on the wrong Fiber rather than executing a `Deletion` on the removed Fiber.",
    solution: `// ❌ BUGGY CODE (Index as Key):
{items.map((item, index) => (
    <TodoRow key={index} item={item} onDelete={() => removeItem(item.id)} />
))}

// ✅ PRODUCTION FIX (Stable Unique ID):
{items.map(item => (
    <TodoRow key={item.id} item={item} onDelete={() => removeItem(item.id)} />
))}`,
    warStory: "An enterprise HR app allowed managers to approve employee expense line items. Rows used `key={index}`. When a manager rejected line item 1, the approval checkbox state bled into line item 2, accidentally approving a \$4,500 unverified expense report."
  },

  {
    id: "react-q2-fiber-double-buffering-tearing",
    title: "2. React Fiber Double-Buffering: Preventing UI Tearing in Concurrent Mode",
    difficulty: "Staff",
    category: "Fiber & Concurrency",
    summary: "How does React Fiber use double-buffering (current vs workInProgress) to eliminate visual tearing and half-rendered UI states?",
    problem: "An interviewer asks: 'In video games, double-buffering prevents screen tearing. How does React Fiber apply this exact architecture to DOM rendering in Concurrent React?'",
    juniorTrap: "Thinking React directly updates DOM nodes one by one as it computes them during reconciliation.",
    interviewerIntent: "Evaluates deep comprehension of the Render Phase (time-sliced computation) vs Commit Phase (atomic DOM flush) and the `fiberRoot.current` pointer swap.",
    seniorAnswer: [
      "The Problem (UI Tearing): In Concurrent Mode, React renders asynchronously across multiple 5ms time-slices. If React mutated the real DOM incrementally during the render phase, users would see half-rendered layouts and inconsistent state (Tearing).",
      "The Solution (Double-Buffering): React maintains two complete Fiber trees: 1) `current`: matches what is currently displayed on screen; 2) `workInProgress` (WIP): the tree constructed offscreen during the render phase.",
      "Concurrent Pause/Resume: If a high-priority user click occurs, React can discard or pause the WIP tree without touching the visible screen.",
      "The Atomic Swap: Only when the entire WIP tree is complete does the Commit Phase execute. React performs an atomic pointer reassignment: `fiberRoot.current = workInProgress`, and synchronously flushes DOM mutations."
    ],
    innerWorking: "Each Fiber has an `alternate` pointer linking to its twin: `current.alternate === workInProgress` and `workInProgress.alternate === current`. Reusable alternate nodes eliminate memory allocations during subsequent renders.",
    solution: `// Conceptual Representation of Fiber Double-Buffering:
function commitRoot(fiberRoot) {
    const finishedWork = fiberRoot.current.alternate; // workInProgress tree
    
    // 1. Synchronously execute DOM mutations (Placement, Update, Deletion)
    commitMutationEffects(finishedWork);
    
    // 2. ATOMIC POINTER SWAP: WIP becomes the new Current tree!
    fiberRoot.current = finishedWork;
    
    // 3. Trigger passive layout effects (useEffect)
    requestIdleCallback(() => flushPassiveEffects());
}`,
    warStory: "Prior to Fiber, a complex financial dashboard with 800 SVG charts caused visible screen tearing: table cells updated 40ms before chart bars rendered, creating a jarring flicker that gave traders the impression of stale market data."
  },

  {
    id: "react-q3-render-phase-vs-commit-phase",
    title: "3. Render Phase vs Commit Phase: Why Side Effects Crash the Render Phase",
    difficulty: "Senior",
    category: "Reconciliation Lifecycle",
    summary: "The Render phase is asynchronous and can run multiple times or be aborted; the Commit phase is synchronous. Why calling APIs or mutating globals in Render breaks apps.",
    problem: "A developer places `analytics.track('View')` or `fetchData()` directly in the body of a functional component instead of inside `useEffect`. Under React 18 Concurrent Mode, the analytics event fires 4 times on a single page load, and race conditions corrupt application state.",
    juniorTrap: "Assuming that a functional component executes exactly once per render cycle and that the component body is safe for side effects.",
    interviewerIntent: "Tests understanding of pure functional rendering invariants, Concurrent aborts/restarts, and the phase boundary.",
    seniorAnswer: [
      "Phase 1: Render Phase (Pure & Side-Effect Free): React calls component functions (`beginWork()`), evaluates JSX, and computes diffs. In Concurrent Mode, this phase is interruptible and can be executed multiple times or completely aborted if a higher-priority update preempts it!",
      "Rule: The Render Phase MUST BE PURE. No network calls, no analytics tracking, no local storage mutations, and no global state mutations.",
      "Phase 2: Commit Phase (Side Effects & DOM Mutation): Executes once per completed update. Mutates the actual DOM and fires `useLayoutEffect` (synchronously before browser paint) and `useEffect` (asynchronously after paint).",
      "Why Analytics Fired 4 Times: If React paused or aborted rendering due to a typing event, the uncommitted render phase ran, fired the raw analytics call, and was discarded, repeating on the next attempt."
    ],
    innerWorking: "React 18 Strict Mode intentionally invokes the Render phase TWICE in development (`Component()`, `useState(fn)`, `useMemo(fn)`) to flush out accidental side effects and detect missing idempotency.",
    solution: `// ❌ DANGEROUS (Side-effect inside Render Phase):
function ProductPage({ id }) {
    analytics.track('View', id); // Fires multiple times in Concurrent Mode!
    return <div>Product {id}</div>;
}

// ✅ CORRECT (Side-effect deferred to Commit Phase):
function ProductPageFixed({ id }) {
    useEffect(() => {
        analytics.track('View', id); // Guaranteed to run only upon successful Commit!
    }, [id]);

    return <div>Product {id}</div>;
}`,
    warStory: "A SaaS billing page placed an idempotent payment reservation call in the component body. During a concurrent re-render triggered by typing a coupon code, the reservation API was called 3 times, creating 3 temporary pending holds on customer credit cards."
  },

  {
    id: "react-q4-stale-closures-useeffect-usecallback",
    title: "4. The Stale Closure Trap in useEffect, useCallback & useRef",
    difficulty: "Senior",
    category: "Hooks & JavaScript Closures",
    summary: "How JavaScript closures capture variables at creation time, why omitted dependencies cause stale state, and the 3 architectural fixes.",
    problem: "A component runs a `setInterval` inside `useEffect` to increment a counter: `setCount(count + 1)`. The counter increments to 1, and then stays stuck at 1 forever, never reaching 2!",
    juniorTrap: "Assuming `count` is a live pointer that automatically reads the latest state across time intervals.",
    interviewerIntent: "Assesses deep JavaScript lexical scoping knowledge, closure mechanics, and React dependency array invariants.",
    seniorAnswer: [
      "Root Cause (Lexical Closure): When `useEffect` runs on initial mount, its callback closes over `count = 0`. The interval timer repeatedly executes `setCount(0 + 1)`. Because the dependency array is empty `[]`, the effect is never recreated, and the closure permanently retains `count = 0`.",
      "Fix 1 (Functional State Updater): Use `setCount(prev => prev + 1)`. The updater function receives the fresh state directly from React's internal queue, bypassing the closure completely.",
      "Fix 2 (useRef for Mutable Instance Variables): Store latest state in a ref: `countRef.current = count`. Closures reading `countRef.current` always dereference the live object pointer.",
      "Fix 3 (Declare Dependencies): Add `[count]` to dependency array, but ensure the interval is cleaned up properly (`clearInterval`) to prevent multiple timers."
    ],
    innerWorking: "In JavaScript, functions retain references to their lexical environment at definition time. When React re-renders, a new `count` constant is allocated. If an effect or callback is not recreated, it retains the reference to the scope from the render cycle in which it was born.",
    solution: `// ❌ STALE CLOSURE BUG:
useEffect(() => {
    const timer = setInterval(() => {
        setCount(count + 1); // Permanently sees count = 0!
    }, 1000);
    return () => clearInterval(timer);
}, []); // Empty deps!

// ✅ FIX 1: Functional State Updater (Recommended):
useEffect(() => {
    const timer = setInterval(() => {
        setCount(prev => prev + 1); // Reads fresh state from React queue!
    }, 1000);
    return () => clearInterval(timer);
}, []);

// ✅ FIX 2: useRef for External Event Handlers / WebSockets:
const stateRef = useRef(state);
stateRef.current = state; // Always points to latest state

useEffect(() => {
    socket.on('message', () => {
        processMessage(stateRef.current); // Always reads latest!
    });
}, []);`,
    warStory: "A live crypto trading bot had a WebSocket listener in `useEffect(..., [])` closing over `slippageTolerance`. When the user changed slippage from 1% to 0.1%, the stale socket listener still executed market orders with the old 1% tolerance, resulting in a \$12,000 bad trade."
  },

  {
    id: "react-q5-automatic-batching-react-18",
    title: "5. Automatic Batching in React 18 & Why setState Behaves Asynchronously",
    difficulty: "Senior",
    category: "State Updates & Batching",
    summary: "React 17 only batched state updates inside native synthetic event handlers; React 18 batches across setTimeout, promises, and native events.",
    problem: "In React 17, running two `setState` calls inside a `fetch().then()` triggered TWO separate component re-renders. In React 18, it triggers only ONE re-render. Why did this change, and how does React batch state updates?",
    juniorTrap: "Believing `setState` is an asynchronous JavaScript Promise that can be awaited (`await setState(...)`).",
    interviewerIntent: "Evaluates knowledge of React 18's execution loop, microtask batching, and `flushSync`.",
    seniorAnswer: [
      "Why `setState` is Not Immediate: If React re-rendered the component immediately upon every `setState` call, updating 3 states would re-render the child components 3 times, causing layout thrashing.",
      "React 17 Batching Limit: React 17 only batched updates triggered within React's own SyntheticEvent system (e.g. `onClick`). Updates inside `fetch()`, `setTimeout()`, or `addEventListener` executed outside the React batch context and triggered synchronous re-renders for each call.",
      "React 18 Automatic Batching: React 18 uses the Fiber Scheduler to batch ALL state updates into a single microtask render, regardless of where they originate (Promises, setTimeout, native events).",
      "How to Opt Out: Use `flushSync(() => { setState(...) })` to force an immediate, synchronous DOM flush (e.g. before measuring DOM dimensions)."
    ],
    innerWorking: "React enqueues an update onto the Fiber's `updateQueue`. It marks the root with the update's Lane. It schedules a microtask via `scheduleCallback`. Multiple updates in the same tick share the same Lane and are processed together in one pass.",
    solution: `// React 18 Batches Both Updates Automatically:
function handleAsyncLoad() {
    fetch('/api/user').then(res => res.json()).then(data => {
        setUser(data);      // ┐
        setLoading(false);  // ┴── Only ONE re-render in React 18! (Two in React 17)
    });
}

// Forcing an Immediate Synchronous Render (When measuring DOM):
import { flushSync } from 'react-dom';

function handlePrint() {
    flushSync(() => {
        setIsPrinting(true); // Forces immediate DOM update before next line!
    });
    window.print(); // DOM already has isPrinting styles!
}`,
    warStory: "A real-time chat application in React 17 scrolled to the bottom on receiving messages. Two state updates in a socket listener caused a visual flicker as the DOM rendered the message first and updated the unread counter second. React 18 automatic batching eliminated the flicker automatically."
  },

  {
    id: "react-q6-useeffect-vs-uselayouteffect-useinsertioneffect",
    title: "6. useEffect vs useLayoutEffect vs useInsertionEffect: Execution Timings",
    difficulty: "Staff",
    category: "Hooks Lifecycle & Browser Paint",
    summary: "Comparing the 3 effect hooks: execution order, blocking browser paint, measuring DOM nodes, and CSS-in-JS style injection.",
    problem: "A developer builds a tooltip that calculates its position based on the trigger element's bounding box. Using `useEffect`, the tooltip momentarily flashes at coordinate (0, 0) before snapping to the correct position. Why, and which hook fixes it?",
    juniorTrap: "Using useEffect for everything, or using useLayoutEffect everywhere without understanding paint blocking.",
    interviewerIntent: "Assesses exact knowledge of browser layout, painting, composition threads, and React effect scheduling.",
    seniorAnswer: [
      "`useEffect` (Passive Effect - Asynchronous): Runs AFTER the browser has computed layout and painted pixels to the screen. It does not block painting. Perfect for 95% of tasks (data fetching, subscriptions, logging).",
      "`useLayoutEffect` (Layout Effect - Synchronous): Runs AFTER React mutates the DOM, but BEFORE the browser paints pixels to the screen! The browser thread is BLOCKED while this runs.",
      "Why Tooltip Flickered: With `useEffect`, browser painted the tooltip at default (0, 0), then `useEffect` ran, calculated coords, updated state, and triggered a second paint. With `useLayoutEffect`, the measurement and state update happen BEFORE the first paint, eliminating flicker!",
      "`useInsertionEffect` (React 18): Runs BEFORE any DOM mutations. Specifically designed for CSS-in-JS libraries (Emotion, Styled-Components) to inject &lt;style&gt; tags into the DOM before layout calculation."
    ],
    innerWorking: "Order of execution: 1) React Render phase (WIP tree); 2) React Commit phase DOM mutations; 3) `useInsertionEffect`; 4) DOM layout calculated; 5) `useLayoutEffect` (sync); 6) Browser paints pixels; 7) `useEffect` (async macro/micro-task).",
    solution: `// Fixing Tooltip Flickering with useLayoutEffect:
function Tooltip({ targetRef, text }) {
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef();

    useLayoutEffect(() => {
        // Runs synchronously BEFORE browser paint!
        const targetRect = targetRef.current.getBoundingClientRect();
        setCoords({
            top: targetRect.bottom + 8,
            left: targetRect.left
        });
        // Browser paints directly at calculated coordinates with ZERO flicker!
    }, []);

    return <div ref={tooltipRef} style={{ position: 'fixed', ...coords }}>{text}</div>;
}`,
    warStory: "A design system modal animated with `useEffect` had an 8ms frame drop where users saw unstyled white containers before dimensions snapped into place. Switching dimension calculations to `useLayoutEffect` fixed the visual glitch across all browsers."
  },

  {
    id: "react-q7-react-memo-shallow-compare-trap",
    title: "7. Why Inline Objects and Functions Defeat React.memo",
    difficulty: "Senior",
    category: "Performance & Memoization",
    summary: "React.memo compares props with Object.is; passing unmemoized arrow functions or object literals creates new memory references that invalidate memoization.",
    problem: "A developer wraps a heavy chart component in `React.memo(ChartComponent)`. However, whenever the parent component re-renders (e.g. typing in a search input), the `ChartComponent` STILL re-renders, causing typing lag. Props passed: `data={[1, 2, 3]}` and `onSelect={() => handleSelect()}`.",
    juniorTrap: "Assuming wrapping a component in React.memo is all that's required to prevent re-renders.",
    interviewerIntent: "Tests understanding of referential equality in JavaScript, shallow comparison algorithms, and the purpose of `useCallback`/`useMemo`.",
    seniorAnswer: [
      "How `React.memo` Works: Before re-rendering a child, `React.memo` loops over `prevProps` and `nextProps`, comparing each prop with `Object.is(prevProps[key], nextProps[key])`.",
      "The Reference Trap: In JavaScript, `{} !== {}` and `(() => {}) !== (() => {})`. Every time the parent renders, inline objects like `style={{ color: 'red' }}` and inline arrow functions `onClick={() => ...}` allocate BRAND NEW memory references.",
      "Result: `Object.is(oldOnClick, newOnClick)` evaluates to `false`! `React.memo` concludes that props changed and re-renders the child, wasting CPU cycles on redundant comparison checks.",
      "The Solution: 1) Cache function references with `useCallback`; 2) Cache object/array references with `useMemo`; 3) Pass primitive values where possible."
    ],
    innerWorking: "Shallow comparison does: `for (let key in prevProps) if (!Object.is(prevProps[key], nextProps[key])) return false`. A single unstable reference bails out of memoization and triggers a full render.",
    solution: `// ❌ DEFEATS REACT.MEMO:
function Parent() {
    const [search, setSearch] = useState('');
    return (
        <div>
            <input value={search} onChange={e => setSearch(e.target.value)} />
            {/* New array and function created every keystroke! */}
            <ExpensiveChart data={[10, 20, 30]} onHover={() => console.log('hover')} />
        </div>
    );
}

// ✅ FIXED (Stable references allow React.memo to succeed):
function ParentFixed() {
    const [search, setSearch] = useState('');
    const chartData = useMemo(() => [10, 20, 30], []);
    const handleHover = useCallback(() => console.log('hover'), []);

    return (
        <div>
            <input value={search} onChange={e => setSearch(e.target.value)} />
            {/* ExpensiveChart bails out! 0 wasted renders while typing */}
            <ExpensiveChart data={chartData} onHover={handleHover} />
        </div>
    );
}`,
    warStory: "A fintech trading grid had 500 rows wrapped in `React.memo`. Each row had `onRowClick={() => selectRow(row.id)}`. Typing in a filter bar caused all 500 rows to re-render on every keystroke because of the unmemoized arrow function, freezing the UI for 600ms."
  },

  {
    id: "react-q8-when-not-to-use-usememo-usecallback",
    title: "8. When NOT to Use useMemo & useCallback: The Premature Optimization Penalty",
    difficulty: "Senior",
    category: "Performance Anti-Patterns",
    summary: "useMemo and useCallback carry memory and CPU costs; wrapping trivial computations is slower than re-running them.",
    problem: "A junior developer wraps every single variable and function in `useMemo` and `useCallback`: `const total = useMemo(() => a + b, [a, b]);`. Code review flags this. Why is blanket memoization harmful?",
    juniorTrap: "Believing that more useMemo/useCallback always makes an application faster.",
    interviewerIntent: "Assesses architectural judgment, understanding of V8 heap allocation costs, and dependency comparison overhead.",
    seniorAnswer: [
      "The Cost of Memoization: `useMemo` is NOT free! On every render, React must: 1) Allocate the dependency array in memory; 2) Iterate through the dependency array comparing previous vs next values; 3) Store the cached value in the Fiber's `memoizedState` linked list.",
      "Trivial Operations: Simple operations like `a + b`, array mapping under 100 items, or object spreading take < 0.001ms. The overhead of allocating dependency arrays and running `Object.is` loops costs MORE CPU and memory than just recalculating the sum!",
      "When `useCallback` is Pointless: If the function is passed to a standard DOM element (`<button onClick={fn}>`), `useCallback` is completely wasted because HTML DOM elements don't shallow-compare props!",
      "When to ACTUALLY use them: 1) When passing callbacks/objects to children wrapped in `React.memo`; 2) When an object/function is used in another hook's dependency array (to prevent infinite loops); 3) When calculating genuinely heavy operations (e.g. filtering 10,000 items)."
    ],
    innerWorking: "Every `useMemo` adds a 5-field object to the Fiber hook list in the V8 heap. Multiplying this across thousands of components creates heap fragmentation and garbage collection pressure.",
    solution: `// ❌ UNNECESSARY OVERHEAD:
const fullName = useMemo(() => \`\${firstName} \${lastName}\`, [firstName, lastName]);
const handleClick = useCallback(() => setOpen(true), []); // Passed to normal <button>!

// ✅ CLEAN & OPTIMAL:
const fullName = \`\${firstName} \${lastName}\`; // Recalculation takes 0.0001ms!
const handleClick = () => setOpen(true); // Normal GC handles it instantly`,
    warStory: "An audit of an e-commerce checkout page revealed 180 `useMemo` and `useCallback` hooks on simple form inputs. Removing 160 of them decreased bundle size by 4KB and reduced initial page render time by 12% by eliminating dependency array allocation loops."
  },

  {
    id: "react-q9-context-api-vs-redux-cascading-renders",
    title: "9. Why Context API is NOT a Redux Replacement: The Cascading Render Problem",
    difficulty: "Staff",
    category: "State Management Architecture",
    summary: "Context API lacks fine-grained selector-based bailouts; any update forces all consumers to re-render, creating massive performance bottlenecks.",
    problem: "A team replaces Redux with a single global React Context holding `{ user, theme, cart, notifications }`. When a notification arrives, the shopping cart and user profile components re-render, causing severe UI lag.",
    juniorTrap: "Claiming 'React Context replaces Redux because both provide global state'.",
    interviewerIntent: "Evaluates architectural understanding of dependency tracking, selector bailouts, and scaling global state.",
    seniorAnswer: [
      "The Fundamental Difference: Context API is a dependency injection mechanism, NOT a state management system with selector-based subscriptions.",
      "The Cascading Re-render Flaw: When a Context value changes, EVERY component that calls `useContext(MyContext)` is FORCED to re-render! React Context provides NO built-in way to subscribe to only a slice of the value.",
      "Why Redux Bails Out: In Redux, components use `useSelector(state => state.cart)`. Redux checks if `state.cart` changed. If only `state.notifications` changed, the cart component BAILS OUT of rendering immediately.",
      "How to Optimize Context: **Context Slicing**: Split monolithic contexts into independent domains: `ThemeContext`, `UserContext`, `CartContext`. Or adopt selector-based libraries like Zustand, Jotai, or Redux Toolkit."
    ],
    innerWorking: "React tracks Context consumers via a `dependencies` linked list on the Fiber. When the Provider receives a new `value`, it traverses the consumer list and marks every consumer Fiber as dirty (`ReceivedUpdate`), completely bypassing `React.memo`.",
    solution: `// ❌ MONOLITHIC CONTEXT (All consumers re-render on ANY change):
const AppContext = createContext(); // { user, theme, cart }

// ✅ CONTEXT SLICING (Isolated update boundaries):
const ThemeContext = createContext();
const CartContext = createContext();

function App() {
    return (
        <ThemeContext.Provider value={theme}>
            <CartContext.Provider value={cart}>
                {/* Cart updates DO NOT trigger Theme consumers! */}
                <CartWidget />
            </CartContext.Provider>
        </ThemeContext.Provider>
    );
}`,
    warStory: "A SaaS trading platform stored both real-time ticker prices (10 updates/sec) and user profile data in a single Context. The 10 ticks/sec caused user modal forms to continuously re-render, canceling keystrokes and dropping form input focus until state was moved to Redux."
  },

  {
    id: "react-q10-custom-redux-middleware-pipeline",
    title: "10. How Redux Middleware Works Under the Hood: Writing a Custom Middleware",
    difficulty: "Senior",
    category: "Redux Architecture",
    summary: "Understanding the 3-arrow curried middleware signature (store => next => action) and how applyMiddleware composes functions.",
    problem: "An interviewer asks you to write a custom Redux middleware from scratch that tracks execution time of actions and sends metrics to a telemetry endpoint.",
    juniorTrap: "Not understanding why there are 3 nested functions or confusing `next(action)` with `store.dispatch(action)`.",
    interviewerIntent: "Tests functional programming concepts (currying, function composition) and the core Redux execution cycle.",
    seniorAnswer: [
      "The Middleware Signature: `const middleware = store => next => action => { ... }`.",
      "Why 3 Nested Functions? 1) First level receives `storeAPI` (`getState`, `dispatch`) during `applyMiddleware` initialization; 2) Second level receives `next` (the next middleware in the pipeline, or the base `store.dispatch`); 3) Third level is the actual action handler called on every dispatch.",
      "`next(action)` vs `store.dispatch(action)`: Calling `next(action)` passes the action to the next middleware in the chain. Calling `store.dispatch(action)` restarts the entire pipeline from the very first middleware (risking infinite loops if not guarded!)."
    ],
    innerWorking: "Redux's `applyMiddleware` uses `compose(...chain)`: `dispatch = compose(...middlewares)(store.dispatch)`. It transforms the single `store.dispatch` into a nested pipeline of wrapped dispatch functions.",
    solution: `// Custom Performance Telemetry Middleware:
const performanceLoggerMiddleware = store => next => action => {
    const startTime = performance.now();
    
    // 1. Pass action down the pipeline to reducers
    const result = next(action);
    
    // 2. Measure execution duration
    const duration = performance.now() - startTime;
    if (duration > 16) { // Took longer than 1 frame (16ms)
        console.warn(\`[SLOW ACTION] \${action.type} took \${duration.toFixed(2)}ms\`);
        TelemetryService.recordSlowAction(action.type, duration);
    }
    
    return result;
};

// Wiring into store:
const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(performanceLoggerMiddleware)
});`,
    warStory: "A developer called `store.dispatch(action)` instead of `next(action)` inside an authentication refresh middleware. Every dispatched action triggered an infinite loop of recursive dispatches that crashed the browser tab with `Maximum call stack size exceeded`."
  },

  {
    id: "react-q11-immer-proxies-redux-toolkit",
    title: "11. How Immer.js Works in Redux Toolkit: Mutating Syntax with Pure Immutability",
    difficulty: "Staff",
    category: "Redux & State Immutability",
    summary: "Immer wraps state in ES6 Proxies to record mutations, generating a new immutable state tree with Structural Sharing.",
    problem: "In Redux Toolkit `createSlice`, developers write `state.items.push(newItem)` or `state.user.name = 'Bob'`. Why is this pure and safe, and how does Immer prevent memory waste?",
    juniorTrap: "Assuming that Redux Toolkit abandoned immutability and now uses mutable state like Vue or MobX.",
    interviewerIntent: "Assesses understanding of ES6 Proxies, Copy-on-Write semantics, and Structural Sharing.",
    seniorAnswer: [
      "How Immer Works: Immer passes your reducer a `draft` state wrapped in an **ES6 Proxy**.",
      "Trap Interception: When you call `draft.items.push(x)`, the Proxy traps the mutation. It does NOT touch the original state. Instead, it marks the `items` branch as 'modified' and creates a shallow copy of that branch (Copy-on-Write).",
      "Structural Sharing: When the reducer finishes, Immer constructs the final state: modified branches receive new object references, while untouched branches retain their exact original memory references!",
      "Benefit: You write simple, readable imperative code (`state.todos[0].done = true`) while guaranteeing 100% pure immutability and high-performance reference checking (`===`)."
    ],
    innerWorking: "Immer maintains a `ProxyState` object. It creates shallow copies on-demand only for objects that are written to. Unmodified state nodes are reused directly, keeping memory overhead minimal.",
    solution: `// Redux Toolkit createSlice using Immer:
const userSlice = createSlice({
    name: 'user',
    initialState: { profile: { name: 'Alice', age: 25 }, preferences: { theme: 'dark' } },
    reducers: {
        updateName(state, action) {
            // Looks like direct mutation, but Immer Proxy intercepts it!
            state.profile.name = action.payload;
            // state.preferences is UNTOUCHED (Structural sharing reuses its exact reference)!
        }
    }
});`,
    warStory: "A developer working in vanilla Redux wrote `state.list.push(item)`. Because the memory reference didn't change, the UI refused to re-render. To fix it, they wrote `JSON.parse(JSON.stringify(state))`, which destroyed Dates, dropped functions, and introduced a 40ms CPU lag on large trees."
  },

  {
    id: "react-q12-reselect-memoized-selectors",
    title: "12. Memoized Selectors with Reselect: Preventing Selector Recalculation",
    difficulty: "Senior",
    category: "Redux Optimization",
    summary: "createSelector caches calculation results based on input reference equality, avoiding expensive recalculations and wasted re-renders.",
    problem: "A component calls `useSelector(state => state.todos.filter(t => t.completed))`. Even when unrelated state changes, the component re-renders on EVERY dispatch. Why?",
    juniorTrap: "Believing useSelector only triggers re-renders when todos change.",
    interviewerIntent: "Tests understanding of selector return reference equality and how Reselect's `createSelector` bails out.",
    seniorAnswer: [
      "The Flaw of Inline `.filter()`: JavaScript's `.filter()` or `.map()` ALWAYS returns a brand-new array reference in memory, even if the elements are identical!",
      "Why `useSelector` Re-renders: On every action dispatched in the store, `useSelector` re-runs its selector. It compares previous result with new result using strict equality (`prevResult === nextResult`). Because a new array reference was created, it assumes state changed and forces a re-render!",
      "The Solution (`createSelector`): Reselect checks if the input selector (`state.todos`) changed. If `state.todos` is referentially identical, it bails out and returns the cached array reference, preventing re-renders!"
    ],
    innerWorking: "Reselect stores `lastArgs` and `lastResult`. It evaluates `argumentsChanged(lastArgs, newArgs)`. If all input selectors return referentially equal values, it skips the transform function entirely.",
    solution: `// ❌ UNMEMOIZED (Always returns a new array reference -> forces re-render):
const completedTodos = useSelector(state => 
    state.todos.filter(t => t.isDone)
);

// ✅ MEMOIZED SELECTOR (Only re-evaluates when state.todos changes):
import { createSelector } from '@reduxjs/toolkit';

export const selectCompletedTodos = createSelector(
    state => state.todos, // Input selector
    todos => todos.filter(t => t.isDone) // Transform function (cached!)
);

// In Component:
const completedTodos = useSelector(selectCompletedTodos);`,
    warStory: "An analytical dashboard called `useSelector(state => computePortfolioRisk(state.trades))` in 20 widgets. Every heartbeat price tick created a new object, executing the 50ms mathematical risk model 20 times simultaneously. Wrapping in `createSelector` cut CPU usage from 95% to 4%."
  },

  {
    id: "react-q13-react-18-transitions-concurrency",
    title: "13. React 18 Transitions: useTransition vs useDeferredValue for Heavy UIs",
    difficulty: "Staff",
    category: "React 18 Concurrency",
    summary: "Decoupling urgent user input (typing) from non-urgent rendering (filtering a 10,000-item list) using React 18 Concurrent Mode.",
    problem: "A user types in an autocomplete input that filters 10,000 table rows. Because rendering the table takes 80ms, the input box freezes and drops typed characters. Debouncing helps, but still causes input lag once the timer fires. How do Transitions solve this?",
    juniorTrap: "Defaulting to lodash.debounce or setTimeout, unaware that Transitions allow React to interrupt rendering in real-time.",
    interviewerIntent: "Assesses knowledge of React 18 Concurrent scheduler, priority lanes, and the difference between `useTransition` and `useDeferredValue`.",
    seniorAnswer: [
      "The Core Problem: All updates in React 17 were 'Urgent'. Typing and table rendering shared the same synchronous thread.",
      "How `useTransition` Works: Wraps non-urgent state updates inside `startTransition(() => setQuery(text))`. React marks this update with `TransitionLane` (low priority).",
      "Interruptible Rendering: While React is computing the 10,000 rows in the background, if the user presses another key, React INTERRUPTS and discards the unfinished background render, immediately updates the input box (UrgentLane), and then resumes the table render with the fresh key!",
      "`useTransition` vs `useDeferredValue`: Use `useTransition` when you control the state updater function (`setFilter`). Use `useDeferredValue` when you receive a value via props from an external source."
    ],
    innerWorking: "Transitions execute at `TransitionLane`. The React Scheduler checks `shouldYield()` every 5ms. If an urgent discrete event (keyboard/mouse) arrives in the MessageChannel queue, the transition is paused.",
    solution: `// Smooth Search with useTransition:
function SearchBox() {
    const [input, setInput] = useState('');
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleChange = (e) => {
        // 1. URGENT: Update input box immediately (no lag!)
        setInput(e.target.value);

        // 2. NON-URGENT: Table filter is interruptible!
        startTransition(() => {
            setQuery(e.target.value);
        });
    };

    return (
        <div>
            <input value={input} onChange={handleChange} />
            {isPending && <Spinner />}
            <HeavyTable filter={query} />
        </div>
    );
}`,
    warStory: "A flight reservation seat map froze for 300ms every time a user clicked a filter checkbox. Wrapping the seat map recalculation in `startTransition` allowed users to click checkboxes at full speed with 0 input lag while the seat map caught up seamlessly in the background."
  },

  {
    id: "react-q14-react-server-components-vs-ssr",
    title: "14. React Server Components (RSC) vs Traditional SSR: Architecture & Tradeoffs",
    difficulty: "Staff",
    category: "Fullstack Architecture & Next.js",
    summary: "SSR sends HTML and hydrates full JS bundle; RSC sends zero client JavaScript, streams serialized component JSON, and queries databases directly.",
    problem: "An architect asks: 'We already have SSR (Server-Side Rendering). Why did the React team spend 4 years building React Server Components (RSC)? What architectural problem does RSC solve that SSR cannot?'",
    juniorTrap: "Believing RSC is just another name for SSR or that RSC replaces client-side React.",
    interviewerIntent: "Tests mastery of modern full-stack React architecture, bundle-size economics, and client hydration costs.",
    seniorAnswer: [
      "The Limitation of Traditional SSR: SSR renders HTML on the server, BUT the client must still download the ENTIRE JavaScript bundle for all those components and execute 'Hydration' to attach event listeners. 100KB of server dependencies (like `marked` or `date-fns`) still ship to the browser!",
      "How RSC Changes the Game: Server Components execute ONLY ON THE SERVER. Their dependencies and source code NEVER ship to the client browser! 0KB bundle impact.",
      "Direct Backend Access: RSC can query Postgres, Redis, or local file systems directly inside the component body using `async/await`: `const user = await db.user.findUnique(...)`.",
      "Streaming Wire Format: RSC emits a compact JSON stream (virtual DOM representation), not static HTML. Client components can be interleaved seamlessly inside Server Components without re-fetching."
    ],
    innerWorking: "RSC renders to an intermediate streaming protocol format (rows of JSON describing elements and server component slots). The client reconciler stitches this stream into the active DOM without losing client component state.",
    solution: `// React Server Component (app/page.tsx - Zero Client JS!):
import db from '@/lib/db';
import ClientButton from './ClientButton'; // Client component

export default async function ProductPage({ params }) {
    // 1. Direct database access on the server!
    const product = await db.products.findUnique({ where: { id: params.id } });
    
    // 2. Heavy markdown parser runs on server; 0KB sent to browser!
    const htmlDescription = marked.parse(product.description);

    return (
        <div>
            <h1>{product.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: htmlDescription }} />
            {/* Interactive Client Component embedded inside RSC: */}
            <ClientButton productId={product.id} />
        </div>
    );
}`,
    warStory: "An e-commerce product page used a 450KB syntax highlighter and markdown engine. In traditional SSR, the page required 600KB of client JS. Migrating to React Server Components dropped client bundle size from 600KB to 24KB, boosting Lighthouse mobile performance score from 42 to 98."
  },

  {
    id: "react-q15-suspense-internals-thrown-promises",
    title: "15. How Suspense Works Internally: Thrown Promises & Fallback Boundaries",
    difficulty: "Staff",
    category: "Reconciliation & Suspense",
    summary: "Suspense leverages JavaScript's throw statement: components throw pending Promises during render, which Suspense catches to render fallbacks.",
    problem: "How does React Suspense know when an asynchronous resource is loading vs ready without an explicit loading boolean in the component?",
    juniorTrap: "Assuming Suspense uses polling, async/await in client components, or window global events.",
    interviewerIntent: "Assesses knowledge of React's algebraic effect simulation using JavaScript thrown Promises and Fiber boundary handling.",
    seniorAnswer: [
      "The Mechanism (Thrown Promises): When a component suspended on data renders, if the data is not yet in cache, the data fetcher THROWS A PROMISE using JavaScript's `throw promise` statement!",
      "Catching in the Fiber Tree: React's `renderRoot` catches the thrown object using a `try-catch` wrapper. If the thrown value is a `Promise`, React locates the nearest parent `Suspense` boundary in the Fiber tree.",
      "Fallback Activation: The Suspense boundary renders its `fallback` prop into the DOM. Meanwhile, React attaches a `.then()` listener to the thrown Promise.",
      "Resumption: When the Promise resolves, React marks the suspended Fiber as dirty and triggers a re-render. This time, the cache returns the resolved data, and the component renders its real UI!"
    ],
    innerWorking: "When an exception occurs during `beginWork()`, React checks: `if (isPromise(thrownValue)) attachPingListener(fiber, thrownValue)`. The ping handler schedules a low-priority update on the root to retry rendering.",
    solution: `// Conceptual Suspense Resource Implementation:
function wrapPromise(promise) {
    let status = 'pending';
    let result;
    let suspender = promise.then(
        r => { status = 'success'; result = r; },
        e => { status = 'error'; result = e; }
    );

    return {
        read() {
            if (status === 'pending') throw suspender; // THROWS PROMISE! Caught by Suspense!
            if (status === 'error') throw result;     // Caught by ErrorBoundary!
            if (status === 'success') return result;   // Returns data cleanly!
        }
    };
}`,
    warStory: "A developer built a custom suspense cache without memoizing the thrown Promise. On every render retry, a brand-new Promise was thrown, creating an infinite network fetch loop that sent 40,000 requests to an authentication service in 10 seconds."
  },

  {
    id: "react-q16-useeffect-double-run-strict-mode",
    title: "16. Why useEffect Runs Twice on Mount in React 18 Strict Mode",
    difficulty: "Senior",
    category: "React 18 Lifecycle & Strict Mode",
    summary: "React 18 simulates remounting (mount -> unmount -> mount) in development to catch missing cleanup functions and prepare for Offscreen state restoration.",
    problem: "A developer upgrades to React 18. In local development, an API call inside `useEffect(..., [])` executes twice on page load, inserting duplicate records into a test database. The developer asks: 'Why is React broken, and how do I turn this off?'",
    juniorTrap: "Blaming React, removing `<StrictMode>`, or using a useRef flag hack to suppress the second run.",
    interviewerIntent: "Evaluates understanding of Strict Mode resilience checks, cleanup contracts, and future React features (Offscreen API / reusable state).",
    seniorAnswer: [
      "The Reason: In React 18, Strict Mode intentionally simulates immediate component remounting in development mode: `Mount ➔ Unmount ➔ Mount`.",
      "The Architectural Purpose: To verify that effects properly implement cleanup logic! In future React (and features like mobile tab switching or `<Activity>`), React will unmount and remount components while preserving state.",
      "Why the Test DB Created Duplicates: If your effect inserts a database row or creates a subscription without handling cancellation or cleanup, it is fundamentally BROKEN and causes memory leaks in production during tab navigation.",
      "The Production Fix: Implement proper cleanup logic using `AbortController` or cancelation tokens. In production builds, effects run strictly ONCE."
    ],
    innerWorking: "Strict Mode runs effects with: 1) `commitPassiveMountEffects()`; 2) `commitPassiveUnmountEffects()` (immediately); 3) `commitPassiveMountEffects()` (again). If the cleanup doesn't reset external state, a warning or bug reveals itself.",
    solution: `// ❌ BROKEN (Leaves stale requests & duplicates on remount):
useEffect(() => {
    fetch('/api/increment-view'); // Runs twice in Dev!
}, []);

// ✅ RESILIENT IMPLEMENTATION (AbortController cleanup):
useEffect(() => {
    const controller = new AbortController();

    fetch('/api/data', { signal: controller.signal })
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => {
            if (err.name !== 'AbortError') console.error(err);
        });

    return () => {
        controller.abort(); // Cleans up first mount cleanly!
    };
}, []);`,
    warStory: "A chat application without effect cleanups opened WebSocket connections in `useEffect`. In development, Strict Mode opened 2 sockets per user. When deployed to a Next.js SSR environment, users switching tabs left 40 ghost connections open, exhausting the backend socket server."
  },

  {
    id: "react-q17-abortcontroller-race-conditions",
    title: "17. Preventing Race Conditions with AbortController in useEffect",
    difficulty: "Senior",
    category: "Async Hooks & Network Safety",
    summary: "When users rapidly switch tabs, slow earlier API requests can resolve AFTER faster later requests, overwriting fresh data with stale responses.",
    problem: "In a user profile view, clicking 'User 1' starts an API request that takes 800ms. The user immediately clicks 'User 2' (takes 200ms). User 2's data displays, but 600ms later, User 1's slow response resolves and overwrites the screen! The screen displays User 1's data while the URL says User 2.",
    juniorTrap: "Assuming API responses always resolve in the exact order they were sent.",
    interviewerIntent: "Assesses asynchronous race condition diagnosis, DOM lifecycle awareness, and proper HTTP cleanup with AbortController.",
    seniorAnswer: [
      "The Race Condition: Network latency is non-deterministic. A slow request triggered at t=0 can easily resolve after a fast request triggered at t=100ms.",
      "The Flaw: If the component does not cancel or discard the in-flight request for User 1, when User 1's promise settles, its `.then()` calls `setUser(user1)`, overwriting the already-rendered User 2.",
      "Solution 1 (AbortController): Create an `AbortController` in the effect and pass `signal: controller.signal` to `fetch()`. In the cleanup return function, invoke `controller.abort()`. The browser cancels the TCP request immediately, saving client bandwidth.",
      "Solution 2 (Active Boolean Flag): Set `let active = true; return () => { active = false; };`. Inside `.then()`, check `if (!active) return;`."
    ],
    innerWorking: "When `userId` changes, React executes the cleanup function of the PREVIOUS effect before running the new effect. Aborting the previous controller ensures its settlement callbacks never mutate current state.",
    solution: `function UserProfile({ userId }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchUser() {
            try {
                const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
                const data = await res.json();
                setUser(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch failed:', err);
                }
            }
        }

        fetchUser();

        // CLEANUP: Aborts in-flight request if userId changes before fetch finishes!
        return () => controller.abort();
    }, [userId]);

    return <div>{user ? user.name : 'Loading...'}</div>;
}`,
    warStory: "An e-commerce search bar without an AbortController allowed users typing 'apple' to see results for 'app' because the 3-letter query hit a cold cache and finished 200ms after the 5-letter query, displaying the wrong catalog."
  },

  {
    id: "react-q18-profiling-wasted-renders-devtools",
    title: "18. Profiling and Eliminating Wasted Re-renders: Senior Performance Playbook",
    difficulty: "Staff",
    category: "Performance Diagnostics",
    summary: "Systematic methodology to diagnose render bottlenecks using React DevTools Profiler, why-did-you-render, and state colocation.",
    problem: "A high-traffic dashboard feels sluggish. A junior developer proposes wrapping every component in `React.memo` and adding `useMemo` everywhere. As a Staff Engineer, what is your systematic diagnostic and remediation runbook?",
    juniorTrap: "Blindly adding memoization across the entire codebase without profiling.",
    interviewerIntent: "Evaluates production engineering maturity, metrics-driven profiling, and structural refactoring techniques.",
    seniorAnswer: [
      "Step 1: Quantify with React DevTools Profiler: Enable 'Record why each component rendered while profiling'. Look for components highlighted in yellow/red taking > 16ms with reason: 'The parent component rendered' or 'Hook N changed'.",
      "Step 2: State Colocation (Push State Down): If a modal's `isOpen` state lives in the top-level `Dashboard` component, opening the modal re-renders the entire dashboard! Move `isOpen` down to a dedicated `<ModalTrigger>` wrapper component.",
      "Step 3: Lift Content Up (Component as Children / Slots): Pass expensive child components as `children` or JSX props: `<Parent><ExpensiveChild /></Parent>`. Because `ExpensiveChild` was instantiated outside `Parent`, `Parent`'s state changes do NOT cause `ExpensiveChild` to re-render!",
      "Step 4: Surgical Memoization: Apply `React.memo` and `useCallback` only on identified hot leaf components, verifying with the Profiler that wasted render counts drop to zero."
    ],
    innerWorking: "When `Parent` re-renders, if `children` is passed from outside, `props.children` retains its referential identity (`prevProps.children === nextProps.children`). React automatically bails out of rendering the children subtree!",
    solution: `// ❌ BAD: State at top forces ExpensiveTree to re-render on every keystroke:
function BadDashboard() {
    const [search, setSearch] = useState('');
    return (
        <div>
            <input value={search} onChange={e => setSearch(e.target.value)} />
            <ExpensiveTree /> {/* Re-renders every keystroke! */}
        </div>
    );
}

// ✅ ARCHITECTURAL FIX (State Colocation with zero memoization needed!):
function SearchInput() {
    const [search, setSearch] = useState('');
    return <input value={search} onChange={e => setSearch(e.target.value)} />;
}

function OptimalDashboard() {
    return (
        <div>
            <SearchInput /> {/* Isolated state! */}
            <ExpensiveTree /> {/* NEVER re-renders when typing! */}
        </div>
    );
}`,
    warStory: "A React Native enterprise logistics app had 3-second render pauses on barcode scans. The team planned a 2-month complete rewrite. Profiling revealed a root `ThemeProvider` state updating on scan. Colocating scan state to the camera component resolved the issue in 2 hours."
  },

  {
    id: "react-q19-error-boundaries-why-hooks-cannot-catch",
    title: "19. Error Boundaries: Why Hooks Cannot Catch Render Errors",
    difficulty: "Senior",
    category: "Error Handling & Resilience",
    summary: "Error Boundaries catch errors during rendering, lifecycle, and constructors. Why try/catch in functional components fails to catch JSX errors.",
    problem: "A developer wraps JSX in a standard JavaScript `try-catch` inside a functional component: `try { return <Child />; } catch(e) { return <Fallback />; }`. When `Child` throws an error during rendering, the catch block NEVER executes, and the whole page crashes with a blank white screen. Why?",
    juniorTrap: "Assuming JavaScript try/catch can catch errors thrown by child components during React's asynchronous render phase.",
    interviewerIntent: "Assesses understanding of declarative JSX vs imperative execution, and the class-based Error Boundary lifecycle (`componentDidCatch`, `getDerivedStateFromError`).",
    seniorAnswer: [
      "Why `try-catch` Fails: Writing `<Child />` does NOT execute `Child` immediately! It merely creates a lightweight Virtual DOM element object: `{ type: Child, props: {} }`.",
      "The Execution Phase: React executes `Child()` later, inside React's internal `renderRoot` work loop. By the time `Child` actually runs and throws, the parent's `try-catch` block has ALREADY finished executing and exited the stack!",
      "How Error Boundaries Work: Error Boundaries are special components implementing `static getDerivedStateFromError()` and `componentDidCatch()`. When a component in the subtree throws during the Render or Commit phase, React catches it and walks up the Fiber tree to the nearest Error Boundary.",
      "What Error Boundaries CANNOT Catch: 1) Event handlers (`onClick`); 2) Asynchronous callbacks (`setTimeout`, `fetch`); 3) Server-Side Rendering errors."
    ],
    innerWorking: "During `renderRootConcurrent`, React wraps work in a catch block. If an error is thrown, it calls `throwException()`, walks up the `return` pointers until it finds a Fiber with `ClassComponent` and `getDerivedStateFromError`, and tags it with `ShouldCapture`.",
    solution: `// Production Error Boundary Component:
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log telemetry to Sentry / Datadog
        console.error('[CRASH REPORT]:', error, errorInfo.componentStack);
        Sentry.captureException(error, { extra: errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || <h1>Something went wrong.</h1>;
        }
        return this.props.children;
    }
}`,
    warStory: "An unhandled null-pointer in a currency conversion widget threw during rendering. Because the app had no Error Boundaries, React unmounted the ENTIRE page from root, presenting users with a blank white screen during checkout."
  },

  {
    id: "react-q20-synthetic-events-event-delegation",
    title: "20. React SyntheticEvent & Event Delegation in React 17/18",
    difficulty: "Senior",
    category: "DOM & Event System",
    summary: "React attaches a single event listener per event type to the root DOM container instead of attaching listeners to individual DOM elements.",
    problem: "If an app renders a table with 10,000 rows, each with `<button onClick={handleDelete}>`, does the browser allocate 10,000 DOM event listeners? What changed in event delegation between React 16 and React 17?",
    juniorTrap: "Believing that React creates 10,000 native browser addEventListener listeners on the DOM.",
    interviewerIntent: "Tests understanding of the SyntheticEvent wrapper, memory pooling, and event delegation architecture.",
    seniorAnswer: [
      "Event Delegation Architecture: React attaches ZERO event listeners to the individual buttons! Instead, it uses **Event Delegation**.",
      "How it Works: When a click occurs, the native browser event bubbles up to the root container. React intercepts it, wraps it in a cross-browser `SyntheticEvent`, matches the event target to the Fiber tree, and dispatches your `onClick` handler.",
      "The React 16 vs 17 Architectural Shift: In React 16, React attached all delegated listeners to the global `document` node. In React 17/18, React attaches listeners to the **Root DOM Container** (`#root` where `createRoot` is mounted).",
      "Why this Shift was Critical: Attaching to `document` made micro-frontends impossible because nesting two React apps meant the outer app intercepted events from the inner app. Attaching to the root container enables safe coexistence of multiple React versions on the same page."
    ],
    innerWorking: "React registers listening plugins during app startup (`listenToAllSupportedEvents(rootContainerElement)`). Event bubbling is simulated internally by React traversing the Fiber `return` pointers upwards.",
    solution: `// In React 18:
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
// All events (onClick, onKeyDown) are delegated to <div id="root">!
// document node is NEVER polluted.

// Safe Micro-Frontend Embedding:
<div id="react-legacy-app">...</div> <!-- React 16 App -->
<div id="react-modern-app">...</div> <!-- React 18 App (Events isolated!) -->`,
    warStory: "A micro-frontend migration embedded a new React 18 widget inside a legacy Backbone/jQuery application. In React 16, `e.stopPropagation()` failed to prevent document-level jQuery modal dismiss listeners from firing. React 17's container-level delegation resolved the event capture collision immediately."
  },

  {
    id: "react-q21-controlled-vs-uncontrolled-forms",
    title: "21. Controlled vs Uncontrolled Components & Form Performance",
    difficulty: "Mid-Senior",
    category: "Forms & DOM Interop",
    summary: "Controlled components bind DOM input values to React state triggering re-renders on every keystroke; uncontrolled components let the DOM manage state accessed via refs.",
    problem: "In an enterprise form with 80 input fields, typing into any single field causes perceptible input lag (keystroke latency > 100ms). Why does this happen with controlled inputs, and how do uncontrolled components or libraries like React Hook Form solve this without re-rendering the whole form?",
    juniorTrap: "Storing all 80 fields in a single parent state object `const [form, setForm] = useState({ ... })` and updating it on every `onChange`, re-rendering the entire page and all 80 input child components on every letter typed.",
    trap: "Storing all 80 fields in a single parent state object and updating it on every onChange, forcing a full reconciliation of 80 child components on every keystroke.",
    interviewerIntent: "Tests understanding of React re-render costs, browser input latency, React Hook Form's uncontrolled ref subscription model, and when to use controlled vs uncontrolled inputs.",
    seniorAnswer: [
      "Controlled Component Re-render Overhead: In controlled components (<input value={val} onChange={e => setVal(e.target.value)} />), every keystroke updates React state, triggering reconciliation and re-rendering of the component and all its children. In forms with 50+ fields, this creates 50-100ms of scripting time per keystroke, dropping frames.",
      "Uncontrolled Components with useRef: The native DOM retains its own internal state. React mounts the <input ref={inputRef} defaultValue='foo' />. When submitting, the form reads inputRef.current.value in O(1) time with ZERO re-renders during typing.",
      "React Hook Form Architecture: Uses uncontrolled inputs under the hood via register('fieldName'). It attaches native DOM event listeners and uses an isolated proxy/event-emitter to only re-render individual field validation errors or touched state without re-rendering the form container.",
      "When to Choose Which: Use Controlled when immediate UI feedback is strictly required per keystroke (e.g. live autocomplete search suggestions, dynamic conditional form fields where field B appears only if field A == 'OTHER', or instant character counters). Use Uncontrolled for standard submission forms, large data entry tables, and file uploads (<input type='file'> is strictly uncontrolled in React)."
    ],
    innerWorking: "In controlled inputs, React intercepts native input events, schedules a state update, re-renders the component, and imperatively overwrites the DOM node's .value property during the commit phase (node.value = nextValue). If React cannot complete this within 16ms, cursor jumping and character drop anomalies occur.",
    solution: `// 1. NAIVE CONTROLLED (Re-renders whole component on every keystroke):
function SlowForm() {
    const [name, setName] = useState('');
    return <input value={name} onChange={e => setName(e.target.value)} />;
}

// 2. HIGH-PERFORMANCE UNCONTROLLED (Zero re-renders while typing):
function FastForm() {
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // O(1) read directly from native DOM at submission time
        console.log({
            name: nameRef.current?.value,
            email: emailRef.current?.value
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input ref={nameRef} defaultValue="" placeholder="Name" />
            <input ref={emailRef} defaultValue="" placeholder="Email" />
            <button type="submit">Submit</button>
        </form>
    );
}`,
    warStory: "A healthcare provider built an 85-field patient intake questionnaire using a single Redux/useState controlled form. On hospital iPad tablets, doctors experienced a 150ms delay between pressing a physical key and seeing the letter appear. Switching to uncontrolled components via React Hook Form reduced re-renders from 85 per keystroke to 0, eliminating all input lag."
  },

  {
    id: "react-q22-portals-event-bubbling",
    title: "22. React Portals: DOM Insertion vs SyntheticEvent Bubbling Invariant",
    difficulty: "Senior",
    category: "DOM & Event Delegation",
    summary: "createPortal renders children into a completely separate physical DOM node outside parent hierarchy, but SyntheticEvents still bubble up through the React component tree.",
    problem: "You render a Modal dialog into 'document.body' using 'ReactDOM.createPortal'. When a user clicks a button inside the modal, why does an 'onClick' listener on the parent container (inside '#root') still fire, even though the modal DOM element is NOT inside that container?",
    juniorTrap: "Assuming that because the modal DOM element was portaled to document.body, events fired inside it will only bubble through document.body and not trigger parent React component onClick handlers.",
    trap: "Assuming portaled DOM nodes isolate event bubbling. SyntheticEvent dispatching walks the Fiber virtual hierarchy, not native DOM parents.",
    interviewerIntent: "Evaluates deep knowledge of React SyntheticEvent dispatching vs native browser DOM event propagation.",
    seniorAnswer: [
      "The Portal Invariant: ReactDOM.createPortal(child, container) allows mounting a sub-tree into an arbitrary DOM node (e.g. #modal-root, #tooltip-root) to escape parent CSS constraints (overflow: hidden, z-index stacking contexts, or position: relative).",
      "SyntheticEvent Bubbling Follows the Fiber Tree: Even though the physical DOM node resides elsewhere, React's SyntheticEvent system walks up the Virtual DOM / Fiber tree (return pointers), NOT the native DOM tree!",
      "Why this Happens: React's event listener at the root container catches the native event bubbling to document/root, maps the native target to its internal Fiber node, and walks up fiber.return to dispatch React onClick handlers. Since the modal Fiber's parent is the component that called createPortal, that parent's onClick receives the event.",
      "Stopping Propagation: If you don't want the parent container to detect the modal click, you must explicitly call e.stopPropagation() inside the modal content handler."
    ],
    innerWorking: "React maintains a virtual hierarchy where the Portal Fiber node's return pointer points directly to the parent Fiber that returned createPortal(). During SyntheticEvent dispatching (accumulateTwoPhaseDispatches), React traverses Fiber return pointers, creating an event dispatch chain that mirrors JSX structure rather than browser DOM structure.",
    solution: `import { createPortal } from 'react-dom';

function ParentContainer() {
    const handleParentClick = () => {
        console.log("Parent clicked! (Catches bubbled portal events)");
    };

    return (
        <div onClick={handleParentClick} style={{ border: '2px solid blue' }}>
            <h2>Parent Card</h2>
            <Modal />
        </div>
    );
}

function Modal() {
    return createPortal(
        <div className="modal-overlay">
            <div 
                className="modal-content"
                onClick={(e) => {
                    // MUST call stopPropagation if you want to isolate events from React parent!
                    e.stopPropagation();
                }}
            >
                <h3>Modal Dialog in document.body</h3>
                <button onClick={() => alert("Action triggered")}>Click Me</button>
            </div>
        </div>,
        document.body // Physical DOM destination
    );
}`,
    warStory: "A banking portal had a card component with an onClick that opened the account details drawer. The card also opened a confirmation modal via a Portal. Clicking 'Confirm' inside the modal triggered the card's onClick handler, opening the drawer behind the modal simultaneously. The bug was caused by forgetting that Portal synthetic events bubble to React parents, resolved with e.stopPropagation() on the modal overlay."
  },

  {
    id: "react-q23-rules-of-hooks-internals",
    title: "23. The Rules of Hooks & Fiber memoizedState Linked List Internals",
    difficulty: "Senior",
    category: "Hooks Internals",
    summary: "Hooks cannot be called inside loops, conditions, or nested functions because React relies on a strict, call-order-dependent singly-linked list on fiber.memoizedState.",
    problem: "Why does React forbid calling hooks inside 'if' statements or loops? What data structure does React use internally to track useState and useEffect between re-renders, and what happens under the hood if a hook call is skipped?",
    juniorTrap: "Thinking React tracks hooks by their variable names or line numbers. React has no knowledge of variable names; it only knows the sequential order in which hooks are invoked.",
    trap: "Believing React maps hooks by variable names or call-site string hashes. React stores hooks as an index-less singly-linked list where position equals identity.",
    interviewerIntent: "Probes understanding of Hook storage in the Fiber architecture, linked list pointers, and why ESLint rules of hooks exist.",
    seniorAnswer: [
      "Fiber's memoizedState Singly-Linked List: Each functional component Fiber stores its hooks as a singly-linked list of Hook objects on fiber.memoizedState. Each Hook object has a next pointer pointing to the next hook in the component.",
      "Mount vs Update Dispatchers: On initial render (mountWorkInProgressHook), React allocates new Hook nodes and links them: hook1.next = hook2; hook2.next = hook3. On subsequent re-renders (updateWorkInProgressHook), React traverses the existing linked list in lockstep with the execution of the component function.",
      "What Happens When a Hook is Skipped in an if Statement: If if (condition) useState() is skipped because condition is false, React's internal workInProgressHook pointer advances to hook2 when the code is actually calling what used to be hook3. State values, effect dependencies, and reducers become misaligned, assigning State A's value to State B and causing catastrophic data corruption or runtime crashes.",
      "Rule of Hooks: 1) Only call Hooks at the top level of your React function (never inside loops, conditions, or nested functions); 2) Only call Hooks from React function components or custom Hooks."
    ],
    innerWorking: "In React source code (ReactFiberHooks.js), ReactCurrentDispatcher.current switches between HooksDispatcherOnMount and HooksDispatcherOnUpdate. In update phase, currentHook = currentHook.next. If the count or types of hooks mismatch between renders, React throws 'Rendered fewer hooks than expected' or 'Rendered more hooks than expected'.",
    solution: `// SIMULATED FIBER HOOK LINKED LIST:
// fiber.memoizedState -> [Hook 1: useState(0)] -> next -> [Hook 2: useEffect()] -> next -> null

// Custom Hook Example respecting Rule of Hooks:
function useDebounce<T>(value: T, delay: number): T {
    // Hooks called at top level unconditionally:
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]); // Stable dependency array

    return debouncedValue;
}`,
    warStory: "A developer put a useQuery() hook inside an if (isLoggedIn) condition. When users logged out, the component re-rendered with 1 less hook. Instead of a clear error, the third hook (useState for theme) received the query result object, corrupting user preferences and crashing the app with cryptic 'cannot read properties of undefined' errors."
  },

  {
    id: "react-q24-forwardref-useimperativehandle",
    title: "24. forwardRef & useImperativeHandle: Encapsulating Imperative DOM Controls",
    difficulty: "Senior",
    category: "Refs & Imperative Code",
    summary: "forwardRef allows passing refs through parent components to child DOM nodes; useImperativeHandle customizes the exposed ref instance to expose limited methods rather than the raw DOM node.",
    problem: "Why can't functional components accept 'ref' as a standard prop by default in React 18? How does 'forwardRef' solve this, and why should senior engineers use 'useImperativeHandle' instead of passing the raw HTMLInputElement ref to parents?",
    juniorTrap: "Passing raw DOM refs up 3 component layers, allowing any parent component to arbitrarily mutate styles, classes, or event listeners directly, violating component encapsulation.",
    trap: "Exposing raw HTML DOM elements to parent components via forwardRef, destroying component encapsulation and leaking implementation details.",
    interviewerIntent: "Tests component encapsulation, ref forwarding mechanics, and API design in reusable UI component libraries (Design Systems).",
    seniorAnswer: [
      "Why Functional Components Reject ref: Function components do not have instances (unlike class components). React treats ref (like key) as a reserved prop; it is stripped before passing props to the component function.",
      "forwardRef Wrapper: React.forwardRef((props, ref) => ...) intercepts the ref prop and passes it as a second argument to the render function, enabling parent components to bind to an internal DOM node.",
      "Encapsulation with useImperativeHandle: Exposing a raw <input> DOM node violates component encapsulation because parent components can execute inputRef.current.style.color = 'red' or hijack internal event handlers. useImperativeHandle(ref, () => ({ focus: () => ..., clear: () => ... })) exposes a clean, restricted API contract.",
      "React 19 Evolution: In React 19, ref is finally treated as a standard prop in function components, deprecating the need for forwardRef boilerplate!"
    ],
    innerWorking: "forwardRef creates a Fiber node with WorkTag ForwardRef (11). During reconciliation, updateForwardRef extracts the ref argument and invokes the wrapped component function Component(props, ref). useImperativeHandle runs during the commit phase, assigning the returned object to ref.current.",
    solution: `import React, { useRef, useImperativeHandle, forwardRef } from 'react';

// Define public imperative contract
export interface CustomInputHandle {
    focus: () => void;
    clear: () => void;
}

export const CustomInput = forwardRef<CustomInputHandle, { label: string }>((props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose only safe, restricted operations to parent callers
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        },
        clear: () => {
            if (inputRef.current) inputRef.current.value = '';
        }
    }));

    return (
        <div>
            <label>{props.label}</label>
            <input ref={inputRef} type="text" />
        </div>
    );
});

// Parent Usage:
function Form() {
    const inputHandle = useRef<CustomInputHandle>(null);
    return (
        <div>
            <CustomInput ref={inputHandle} label="Username" />
            <button onClick={() => inputHandle.current?.focus()}>Focus</button>
            <button onClick={() => inputHandle.current?.clear()}>Clear</button>
        </div>
    );
}`,
    warStory: "A design system team exposed raw HTMLDivElement refs on their DatePicker component. Multiple teams started reaching into internal DOM elements to tweak z-indexes and CSS classes directly. When the design system team refactored the internal DOM from div to dialog, 40 production apps broke because parents relied on internal DOM structures. Wrapping with useImperativeHandle prevented future leaks."
  },

  {
    id: "react-q25-useid-ssr-hydration-mismatch",
    title: "25. useId Hook & Preventing SSR Hydration ID Mismatches",
    difficulty: "Mid-Senior",
    category: "Accessibility & SSR",
    summary: "useId generates deterministic, unique IDs based on component tree position that match perfectly between Server-Side Rendering (SSR) and client hydration.",
    problem: "Why does generating unique HTML input/label accessibility IDs with 'Math.random()' or an auto-incrementing global counter 'let id = 0; id++' cause catastrophic hydration mismatch errors in SSR (Next.js/Remix)? How does React 18 'useId' resolve this?",
    juniorTrap: "Using 'Math.random()' or 'uuid()' inside components for accessibility 'htmlFor' and 'aria-describedby' IDs in SSR applications.",
    trap: "Using global counter variables or random hashes for accessibility IDs, breaking deterministic server-to-client hydration matching.",
    interviewerIntent: "Evaluates understanding of SSR hydration mechanics, deterministic tree algorithms, and WCAG accessibility standards.",
    seniorAnswer: [
      "The SSR Hydration Mismatch Problem: During SSR, the server renders HTML with IDs generated on the server (e.g. id='input-42'). When the client browser runs hydration, Math.random() generates a DIFFERENT number (e.g. id='input-87'). React detects that the server HTML does not match the client VDOM and throws a Hydration Mismatch Error, discarding SSR DOM nodes or re-rendering unnecessarily.",
      "Why Global Counters Fail: If components render in different orders on server vs client (due to concurrent features, code-splitting, or streaming HTML chunks), a global auto-incrementing counter (counter++) assigns different numbers to the same component.",
      "How useId Solves This: Instead of counters or random numbers, useId() generates a base-32 string derived from the component's exact position in the Fiber tree hierarchy (e.g. :r1:, :R2d:). Because the component tree structure is identical on server and client, the generated ID is 100% deterministic!",
      "Prefixing for Multiple Elements: Never call useId 5 times in one component. Call const id = useId() once, and append prefixes: id + '-first-name', id + '-last-name'."
    ],
    innerWorking: "useId inspects the current Fiber's parent path. React represents the tree path as a bitmask where every fork or sibling branches the bit sequence. This bit sequence is serialized into a compact base-32 string wrapped in colons (:r1:), which is immune to concurrency timing and streaming chunks.",
    solution: `import { useId } from 'react';

function AccessibleSignupForm() {
    // Generates a single deterministic base-32 tree ID (e.g. ":r1:")
    const id = useId();

    return (
        <form>
            <div>
                <label htmlFor={id + '-name'}>Full Name:</label>
                <input id={id + '-name'} type="text" aria-describedby={id + '-name-hint'} />
                <span id={id + '-name-hint'}>Enter your legal name</span>
            </div>
            <div>
                <label htmlFor={id + '-email'}>Email Address:</label>
                <input id={id + '-email'} type="email" />
            </div>
        </form>
    );
}`,
    warStory: "An e-commerce site used lodash.uniqueId() for checkout form labels. In Next.js, because server chunks loaded in parallel while client hydration occurred sequentially, ID numbers diverged. Screen readers read labels for the wrong inputs (CVV was labeled 'Cardholder Name'), failing WCAG compliance audits and triggering credit card chargeback disputes."
  },

  {
    id: "react-q26-virtualization-windowing-performance",
    title: "26. Virtualization & Windowing: Rendering 100,000 Items at 60 FPS",
    difficulty: "Senior",
    category: "Performance & DOM Sizing",
    summary: "Virtualization (windowing) only renders DOM nodes currently within the visible viewport, turning O(N) DOM memory bloat into O(1) constant DOM nodes.",
    problem: "Rendering a list of 10,000 transactions freezes the browser tab for 4 seconds and consumes 800MB of RAM. Why does the browser struggle with 10,000 DOM nodes even if only 10 are visible on screen? How does list virtualization (windowing) work under the hood?",
    juniorTrap: "Relying on React.memo or pagination for a continuous infinite scroll feed, mounting 10,000 DOM nodes simultaneously.",
    trap: "Mounting tens of thousands of real DOM nodes in an infinite scroll feed, triggering expensive browser recalculate styles and layout reflows.",
    interviewerIntent: "Tests understanding of browser rendering pipeline (Recalculate Style, Layout, Paint, Composite) and mathematical windowing offset algorithms.",
    seniorAnswer: [
      "The Browser DOM Bottleneck: Browsers are not optimized for 50,000 DOM elements. Every DOM node costs memory (V8 C++ DOM wrappers, event listeners, layout boxes). On any CSS change or scroll, the browser executes Recalculate Styles and Reflow/Layout on all 10,000 elements, locking the main thread.",
      "Virtualization Principle (Windowing): If the screen height is 600px and each row is 50px high, at most 12 rows are visible at any time. A virtualized list renders only ~16 items (12 visible + 4 overscan buffer items for smooth scrolling) regardless of whether the total dataset contains 100 items or 1,000,000 items!",
      "Under the Hood Mechanics: 1) An outer scroll container with overflow-y: auto and a fixed height; 2) An inner phantom spacer div whose height is set to totalItems * itemHeight (e.g. 10,000 * 50px = 500,000px) to provide realistic native scrollbar sizing; 3) An onScroll listener that calculates startIndex = Math.floor(scrollTop / itemHeight) and endIndex = startIndex + visibleCount; 4) Items rendered inside with CSS transform: translateY(startIndex * itemHeight).",
      "Libraries: Use @tanstack/react-virtual or react-window for production. Supports variable height rows with dynamic measurement caches."
    ],
    innerWorking: "Virtual lists maintain a constant DOM node count of K ≈ 20. As the user scrolls, the same 20 DOM nodes are recycled and repopulated with new data, shifting their translateY coordinate. Layout calculation time stays constant (O(1)) instead of degrading linearly (O(N)).",
    solution: `// Pure React Virtualized List Implementation:
function VirtualList<T>({ items, itemHeight, containerHeight, renderRow }: {
    items: T[]; itemHeight: number; containerHeight: number;
    renderRow: (item: T, index: number) => React.ReactNode;
}) {
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2); // 2 overscan
    const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + containerHeight) / itemHeight) + 2);

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return (
        <div 
            style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
            {/* Phantom Spacer Div providing native scrollbar height */}
            <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
                {/* Active Render Window shifted by translateY */}
                <div style={{ transform: \`translateY(\${offsetY}px)\` }}>
                    {visibleItems.map((item, idx) => renderRow(item, startIndex + idx))}
                </div>
            </div>
        </div>
    );
}`,
    warStory: "A crypto exchange displayed a live order book of 15,000 order ticks updating 20 times per second. Without virtualization, the browser ran continuous 400ms Layout passes, consuming 1.2GB RAM and causing browser tabs to crash with Out-Of-Memory errors. Introducing react-window locked DOM count to 25 rows, dropping CPU from 98% to 4%."
  },

  {
    id: "react-q27-state-colocation-vs-global-store",
    title: "27. State Colocation vs Lifting State Up vs Global Stores (Redux/Zustand)",
    difficulty: "Mid-Senior",
    category: "State Architecture",
    summary: "State should be kept as close as possible to the components that consume it (Colocation), preventing cascading re-renders caused by premature centralization.",
    problem: "A team stores all UI state—including modal open flags, dropdown active indices, and form input values—in a global Redux/Zustand store. Why does this lead to severe performance degradation and spaghetti code, and what is the senior rule for State Colocation?",
    juniorTrap: "Defaulting to putting EVERY piece of state into Redux/Zustand or Context API 'just in case other components need it later'.",
    trap: "Centering transient UI state (e.g. dropdown open, input focus) in global Redux stores, triggering widespread selector recalculations on trivial interactions.",
    interviewerIntent: "Tests architectural judgment on state granularity, re-render isolation, and practical application of Kent C. Dodds' State Colocation principle.",
    seniorAnswer: [
      "State Colocation Rule: Keep state as close to where it is used as possible. If only Component A uses a piece of state, store it in Component A (useState). If Component A and Component B share state, lift it up to their closest common parent. Only promote to Global Store if state is truly global.",
      "The Penalty of Over-Centralized Global State: Storing local UI state (like an open dropdown or hover tooltip) in Redux forces the action through middleware, runs all reducers, evaluates selectors across the app, and risks re-rendering entire navigation bars on a simple hover event.",
      "State Categorization Hierarchy: 1) Local UI State: useState / useReducer (toggles, form inputs, local tabs); 2) Server/Cache State: TanStack Query / RTK Query / SWR (API data, pagination, caching, polling, deduplication); 3) Global Client State: Redux Toolkit / Zustand (authenticated user session, shopping cart, global audio player, app theme); 4) URL State: React Router search params (filters, page number, sorting—enables bookmarking and sharing!).",
      "Performance Benefit: When local state updates, ONLY that sub-tree re-renders. Parents and sibling branches are never touched by reconciliation."
    ],
    innerWorking: "React reconciliation traverses downward from the component whose state changed. If state is stored at the root (App level or global provider), React must traverse the entire component tree to check for prop/context changes. When colocated in a leaf node, reconciliation starts at the leaf and terminates immediately.",
    solution: `// BAD ARCHITECTURE: Storing modal and input state in Redux
// dispatch({ type: 'SET_SEARCH_INPUT', payload: 'cat' }); // Re-renders Redux subscribers!

// SENIOR ARCHITECTURE: Colocated State with URL synchronization
function ProductCatalog() {
    // URL Search Params: Bookmarkable, shareable filter state
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    // Server Cache State (TanStack Query): Deduplicated, cached
    const { data: products } = useQuery(['products', query], () => fetchProducts(query));

    return (
        <div>
            <SearchBar initialValue={query} onSearch={(val) => setSearchParams({ q: val })} />
            <ProductList items={products} />
        </div>
    );
}

// Local UI state stays completely isolated inside SearchBar:
function SearchBar({ initialValue, onSearch }: { initialValue: string; onSearch: (v: string) => void }) {
    const [localInput, setLocalInput] = useState(initialValue); // Colocated!
    return (
        <input 
            value={localInput} 
            onChange={(e) => setLocalInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onSearch(localInput)}
        />
    );
}`,
    warStory: "A SaaS dashboard stored active table row selection state in global Redux. With 500 rows, clicking a checkbox dispatched a Redux action that evaluated 500 selectors, causing a noticeable 80ms click latency. Moving row selection state to a localized Set inside the table component made row toggling instantaneous (2ms)."
  },

  {
    id: "react-q28-ssr-hydration-mismatch-causes-fixes",
    title: "28. Resolving SSR Hydration Mismatches in Next.js & Remix",
    difficulty: "Senior",
    category: "SSR & Next.js",
    summary: "Hydration mismatches occur when server-rendered HTML diverges from client initial render due to browser-only APIs, timezones, or local storage.",
    problem: "In Next.js, your console is flooded with 'Error: Text content does not match server-rendered HTML'. What are the top 4 root causes of hydration mismatches in production, and how do you cleanly solve them without disabling SSR entirely?",
    juniorTrap: "Fixing hydration mismatch by turning off SSR globally with 'use client' or adding suppressHydrationWarning everywhere without understanding why divergence occurs.",
    trap: "Using suppressHydrationWarning blindly or disabling SSR entirely instead of employing two-pass rendering for client-only dynamic values.",
    interviewerIntent: "Evaluates deep understanding of Server-Side Rendering (SSR), the two-pass rendering pattern, and browser vs Node runtime differences.",
    seniorAnswer: [
      "Top 4 Causes of Hydration Mismatches: 1) Browser-Only Globals: Accessing window, localStorage, navigator.userAgent, or document during initial render (these are undefined on Node server but present on browser); 2) Time & Dates: Rendering new Date().toLocaleTimeString() where server timezone (UTC) differs from client browser timezone (PST/IST); 3) Invalid HTML Nesting: Browser HTML parser auto-corrects invalid HTML (e.g. <p><div>...</div></p> or <table><tr>...</tr></table> missing <tbody>), causing the browser DOM to diverge from React's virtual tree; 4) Authentication State: Server renders logged-out state, while client reads auth token from cookie/localStorage and renders logged-in profile on mount.",
      "Solution 1 - Two-Pass Rendering (useEffect Mount Flag): Render a fallback or deterministic placeholder on the first pass (matching SSR), and update to client-specific data inside useEffect (which only runs on the client after initial hydration completes).",
      "Solution 2 - Dynamic Imports with { ssr: false }: For components that rely heavily on window (like Canvas, charting libraries, or WebGL), dynamically import them with SSR disabled (next/dynamic(..., { ssr: false })).",
      "Solution 3 - suppressHydrationWarning: Use only on specific leaf nodes where mismatch is unavoidable and harmless (e.g. <time suppressHydrationWarning>{date.toLocaleString()}</time>)."
    ],
    innerWorking: "During hydration (hydrateRoot), React compares each server DOM node to the corresponding Fiber node produced by the client's initial render. If attributes, tags, or text content differ, React 18 logs a hydration error, discards the server DOM node, and executes client-side fallback rendering for that sub-tree.",
    solution: `// Reusable Two-Pass Mount Hook
export function useIsMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true); // Only runs on client AFTER initial hydration!
    }, []);
    return mounted;
}

// Client-Specific Component Safe from Hydration Mismatch:
function UserHeader() {
    const isMounted = useIsMounted();

    // First pass (Server & Initial Client Hydration): Identical markup!
    if (!isMounted) {
        return <div className="skeleton-placeholder">Loading Profile...</div>;
    }

    // Second pass (Client-Only after mount): Safe to read localStorage/window
    const userTheme = localStorage.getItem('theme') || 'light';
    const localTime = new Date().toLocaleTimeString();

    return (
        <div>
            <span>Theme: {userTheme}</span>
            <span>Local Time: {localTime}</span>
        </div>
    );
}`,
    warStory: "A news website rendered relative timestamps ('3 minutes ago') on server render. On slow 3G connections, by the time the JavaScript bundle downloaded and hydrated 15 seconds later, client evaluated '4 minutes ago', triggering hydration mismatches across all 50 homepage articles and forcing client-side re-renders that destroyed their Google Core Web Vitals (INP/CLS) score."
  },

  {
    id: "react-q29-code-splitting-lazy-suspense",
    title: "29. Code Splitting, Dynamic Imports & React.lazy with Suspense",
    difficulty: "Senior",
    category: "Bundle Optimization & Suspense",
    summary: "React.lazy splits monolithic JavaScript bundles into dynamic chunks loaded on demand, using Suspense boundaries to render fallback loaders during network transit.",
    problem: "A single-page application has a 12MB initial 'bundle.js', causing a 6-second First Contentful Paint (FCP) on mobile. How does route-based and component-based code splitting with React.lazy work, and how do you handle network chunk loading failures when a new deployment invalidates old chunk hashes?",
    juniorTrap: "Wrapping every single 20-line component in React.lazy, creating a waterfall of 150 tiny 2KB HTTP requests that slows down the application due to network roundtrip latency.",
    trap: "Failing to handle chunk 404 load errors when new production deployments invalidate old bundle hashes on user navigation.",
    interviewerIntent: "Tests performance optimization strategies, Webpack/Vite dynamic import mechanics, and handling production chunk loading errors gracefully.",
    seniorAnswer: [
      "How React.lazy Works: const HeavyChart = React.lazy(() => import('./HeavyChart')). It wraps the native ES dynamic import() statement. When the component first renders, React.lazy throws a Promise that is caught by the nearest <Suspense fallback={<Spinner />}> boundary. Once the network fetch resolves the module, React renders the loaded component.",
      "Route-Based Code Splitting: The most effective optimization is splitting by routes (e.g. /dashboard, /settings, /admin). Users landing on the homepage download only the homepage bundle; admin panels are never downloaded by standard users.",
      "Handling Chunk Load Failures (Deployment Hash Invalidation): When a new production release deploys, old chunk files (123.abc.js) are deleted from the CDN. If a user on the old version navigates to a lazy route, the browser receives a 404 ChunkLoadError. Senior solution: Wrap React.lazy in a retry function that performs a single full-page reload (window.location.reload()) to fetch the new HTML and updated chunk hashes.",
      "Prefetching on Hover: Boost perceived performance by prefetching lazy chunks on link hover (onMouseEnter={() => import('./Dashboard')}), so the chunk is already in browser cache before the user clicks."
    ],
    innerWorking: "Under the hood, dynamic import() invokes Webpack/Vite runtime's __webpack_require__.e() which appends a <script src='...'> tag to the HTML head. React.lazy returns a LazyComponent Fiber (tag 16). During render phase, mountLazyComponent checks module status; if Pending, it suspends execution by throwing the Promise.",
    solution: `// Production Chunk Load Error Recovery Wrapper:
export function lazyWithRetry(componentImport: () => Promise<any>) {
    return React.lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            return await componentImport();
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // New deployment removed old chunk hashes: reload page to fetch fresh HTML!
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
                return { default: () => null };
            }
            throw error; // Real network error, caught by ErrorBoundary
        }
    });
}

// Route Configuration with Suspense:
const AnalyticsDashboard = lazyWithRetry(() => import('./pages/AnalyticsDashboard'));

function AppRoutes() {
    return (
        <Suspense fallback={<div className="page-loader">Loading module...</div>}>
            <Routes>
                <Route path="/analytics" element={<AnalyticsDashboard />} />
            </Routes>
        </Suspense>
    );
}`,
    warStory: "After a Friday afternoon deployment, customer support received thousands of tickets: 'Clicking Settings gives a blank page'. The app used standard React.lazy() without error boundaries or chunk retry logic. Active users with cached index.html were requesting deleted chunk hashes. Implementing an auto-refresh chunk wrapper resolved all chunk 404 errors."
  },

  {
    id: "react-q30-react-19-actions-optimistic-updates",
    title: "30. Modern React 19: Server Actions, useActionState & useOptimistic",
    difficulty: "Staff / Modern React",
    category: "React 19 & Modern Paradigm",
    summary: "React 19 transitions from manual useEffect mutation patterns to first-class Actions, automated pending state tracking via useActionState, and instant UI feedback via useOptimistic.",
    problem: "In React 18, handling form submissions required manual 'isSubmitting', 'error', 'try/catch', and complex rollback logic for optimistic updates. How does React 19 modernize this with Actions, 'useActionState', 'useFormStatus', and 'useOptimistic'?",
    juniorTrap: "Writing boilerplate try/catch blocks with 4 separate useState variables (data, loading, error, optimisticValue) for every form mutation in modern React.",
    trap: "Writing repetitive try/catch and 4 separate useState variables for pending/error states instead of leveraging React 19's useActionState and useOptimistic.",
    interviewerIntent: "Evaluates staying ahead of the industry curve with React 19 modern idioms, asynchronous transitions, and declarative optimistic UI design.",
    seniorAnswer: [
      "What is an Action in React 19: An Action is any asynchronous function executed within an async Transition. React automatically handles pending states, errors, optimistic updates, and sequential submission queueing.",
      "useActionState: Replaces manual useState + try/catch boilerplate. Takes (actionFn, initialState) and returns [state, formAction, isPending]. React automatically toggles isPending = true during async execution and populates errors without manual state flips.",
      "useOptimistic: Enables instant visual feedback before the server responds. const [optimisticLikes, setOptimisticLikes] = useOptimistic(likes, (currentCount, change: number) => currentCount + change). When the user clicks Like, the UI updates instantly; if the server Action succeeds, the actual state settles; if it fails, React automatically rolls back the optimistic value to the previous state!",
      "useFormStatus: A hook for child components (like <SubmitButton />) to read the parent <form>'s status (pending, data, method) without passing props down through multiple layers."
    ],
    innerWorking: "React 19 Actions run within Transition lanes (TransitionLane). When an optimistic update occurs via setOptimistic, React schedules an immediate render with the optimistic value in the Current tree. Meanwhile, the actual async action executes. When completed, React commits the server result. If an error is thrown, React discards the optimistic branch and renders the error boundary or action state error.",
    solution: `// Modern React 19 Optimistic Like Component:
import { useActionState, useOptimistic } from 'react';

async function updateLikeAction(previousState: number, formData: FormData) {
    const response = await fetch('/api/like', { method: 'POST' });
    if (!response.ok) throw new Error("Failed to like post");
    const result = await response.json();
    return result.newCount;
}

export function LikeButton({ initialLikes }: { initialLikes: number }) {
    // 1. useActionState manages async execution & error handling automatically
    const [likes, formAction, isPending] = useActionState(updateLikeAction, initialLikes);

    // 2. useOptimistic gives instant UI response before server responds!
    const [optimisticLikes, setOptimisticLikes] = useOptimistic(
        likes,
        (currentCount, change: number) => currentCount + change
    );

    return (
        <form action={async (formData) => {
            setOptimisticLikes(1); // Optimistically bump by +1 immediately!
            await formAction(formData); // Execute server action with automatic rollback on error
        }}>
            <button type="submit" disabled={isPending}>
                ❤️ {optimisticLikes} {isPending ? '(Saving...)' : ''}
            </button>
        </form>
    );
}`,
    warStory: "A social media platform's Like button had a 400ms API latency. Users repeatedly mashed the button thinking it didn't register, triggering duplicate API calls and race conditions where the count fluctuated. Refactoring to React 19's useOptimistic gave instant feedback while useActionState automatically serialized concurrent clicks."
  }
,
  {
    id: "react-q31-useeffect-batching-keys-renders-profiling",
    title: "31. React 18 Production Diagnostics: useEffect Stale Closures, Universal Batching, Key Index Bugs & Render Profiling (Interview Deep Dive Q5.1)",
    difficulty: "Staff / Principal",
    category: "React Engine, Hooks & Performance",
    summary: "useEffect dependency rules, re-render triggers & context cascade, array index key traps, React 18 universal batching, and DevTools render profiling.",
    problem: "1) useEffect dependency rules: what breaks with a missing dep, and what breaks with an unstable dep? 2) What triggers a component re-render, and what is the Context re-render trap? 3) Why is array index a catastrophic key? 4) What does React 18 batch, and controlled vs uncontrolled inputs? 5) How do you systematically debug 'Too many re-renders'?",
    juniorTrap: "Silencing the ESLint react-hooks/exhaustive-deps rule instead of resolving stale closures with functional state updaters or refs, or passing array index as key in dynamic list items with local state.",
    interviewerIntent: "Assesses deep understanding of React Fiber reconciliation, JavaScript closure semantics, Context propagation re-render cascades, and production profiling workflows.",
    seniorAnswer: [
      "1. useEffect Dependency Rules: Missing Dependency -> STALE CLOSURE: The effect captures variables from the render in which it was instantiated. If dependencies are omitted, handlers/timers continuously read stale cached values from the initial render. Fix: include all referenced variables, use a ref (useRef) for latest-value patterns, or use functional state updaters (setCount(c => c + 1)). Unstable Dependency -> INFINITE / EXCESS RENDERS: Passing inline objects, arrays, or anonymous functions creates a new memory reference on every render, triggering the effect continuously. Fix: useMemo/useCallback, or declare the object inside the effect.",
      "2. What Triggers a Re-render: 1) State update (setState); 2) Parent component re-render (unless child is memoized via React.memo with shallow-equal props); 3) Context value update. The Context Re-render Trap: Every consumer subscribed to a Context re-renders whenever the provider's value changes. Passing inline object <MyContext.Provider value={{ a, b }}> creates a new reference on every provider render, causing ALL consumers across the entire tree to re-render! Fix: Wrap context value in useMemo, or split into separate StateContext and DispatchContext.",
      "3. Why Array Index as Key is Catastrophic: React keys determine Fiber identity across renders. When items are inserted, deleted, or sorted, indices shift. React matches the wrong Fiber instances, causing component state (input text, focus, checkbox checked, CSS animations) to remain attached to the wrong item! Always use stable, globally unique business IDs.",
      "4. React 18 Universal Batching: React 17 only batched updates inside React synthetic event handlers. React 18 automatically batches ALL state updates across promises (fetch.then), setTimeout, and native event handlers into a single re-render. To opt-out for immediate DOM updates, use ReactDOM.flushSync(). Controlled inputs (value + onChange): single source of truth, but causes a render per keystroke (needs debouncing). Uncontrolled inputs (ref, defaultValue): zero renders per keystroke, ideal for heavy forms.",
      "5. Systematic Debugging of 'Too Many Renders': 1) Open React DevTools Profiler -> enable 'Record why each component rendered'; 2) Identify derived state erroneously stored in useState instead of calculated during render; 3) Detect unmemoized props breaking React.memo; 4) Check for unconditional state setters inside useEffect or render bodies; 5) Check for unmemoized Context providers mounted too high in the tree."
    ],
    innerWorking: "React Fiber stores hook states in a singly linked list on fiber.memoizedState. In React 18 concurrent mode, work is scheduled in lanes. Universal batching merges updates into a single lane, flushing them in a single reconciliation pass.",
    solution: `// 1. PREVENTING STALE CLOSURE & UNSTABLE DEPS:
function TimerComponent({ onTick }) {
    const [count, setCount] = useState(0);

    // Functional updater does NOT require 'count' in deps:
    useEffect(() => {
        const id = setInterval(() => {
            setCount(prev => prev + 1); // Safe: no stale closure!
        }, 1000);
        return () => clearInterval(id);
    }, []); // Clean empty deps!

    // Memoized callback prevents effect loops in children:
    const handleAction = useCallback(() => {
        onTick(count);
    }, [count, onTick]);
}

// 2. CONTEXT VALUE MEMOIZATION (PREVENTS CASCADE):
export const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('dark');

    // Prevents all consumers from re-rendering on unrelated renders:
    const contextValue = useMemo(() => ({
        user, setUser, theme, setTheme
    }), [user, theme]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}

// 3. REACT 18 UNIVERSAL BATCHING:
async function handleUpdate() {
    // React 18 batches both state updates into ONE single render:
    const data = await fetchUserData();
    setUser(data.user);
    setIsLoading(false); // Only 1 re-render occurs!
}`,
    warStory: "A SaaS dashboard had a global AppContext passing an unmemoized value={{ activeTab, user, notifications }}. Every time a 1-second notification polling interval fired, the unmemoized object created a new reference, re-rendering a 10,000-cell financial grid across all tabs. Users experienced 200ms input lag on every keystroke until the context was split and values were wrapped in useMemo."
  }
];
