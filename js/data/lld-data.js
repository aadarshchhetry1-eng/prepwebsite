/**
 * lld-data.js
 * Low-Level Design (LLD), Object-Oriented Design & Machine Coding.
 * Comprehensive models, GoF design pattern decision matrices, and classic interview problems.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

// =========================================================================
// 1. LLD Architecture, Design Patterns & Interview Frameworks
// =========================================================================
window.REVISION_APP_DATA.LLD_TOPICS = [
  {
    id: "lld-machine-coding-roadmap-playbook",
    title: "The 60-90 Minute Machine Coding & LLD Interview Playbook",
    category: "LLD Framework",
    badge: "Staff-Level Playbook",
    oneLiner: "Structured 6-phase roadmap for executing low-level design and machine coding rounds: scoping entities, drafting contracts, applying GoF patterns, thread-safety, and writing a clean driver.",
    summary: "Machine coding rounds evaluate object-oriented design, clean code, SOLID compliance, extensibility, and working runnable code within a strict time limit (usually 60 to 90 minutes). A senior candidate follows a disciplined execution sequence.",
    keyPoints: [
      "Phase 1 (0-10 min) - Requirements & Clarifications: Identify primary actors, core use cases, boundary constraints, and future extensibility hooks (e.g. 'Can we add new vehicle types later?', 'How is pricing calculated?', 'Is it single-threaded or multi-threaded?').",
      "Phase 2 (10-20 min) - Entity & Relationship Modeling: List core domain models (nouns) vs services (verbs). Establish relationships: Inheritance (is-a), Composition (has-a lifecycle bound), Aggregation (has-a independent), and Association (uses-a).",
      "Phase 3 (20-30 min) - Interface & Strategy Definition: Design interfaces first before concrete implementations. Isolate variable algorithms behind the Strategy pattern (e.g., PricingStrategy, SlotAssignmentStrategy).",
      "Phase 4 (30-65 min) - Core Implementation & Concurrency: Write clean, modular classes following Layered Architecture (Models -> Repository/Storage -> Service -> Controller/CLI). Add thread-safety (ReentrantLock, ConcurrentHashMap, Atomic variables) if multi-threaded.",
      "Phase 5 (65-80 min) - Demo Driver & Edge Case Testing: Create a `Main` class demonstrating all requirements: valid flows, out-of-bounds inputs, capacity exhaustion, and concurrent attempts.",
      "Phase 6 (80-90 min) - Code Refactoring & SOLID Review: Verify Open-Closed Principle (can you add a new strategy without changing existing classes?), check exception handling, and eliminate magic strings/numbers."
    ],
    codeSnippet: `// =========================================================================
// STANDARD MACHINE CODING PROJECT STRUCTURE SKELETON
// =========================================================================

/*
 src/
 ├── model/                 // Core domain entities (POJOs/Records)
 │   ├── Vehicle.java       // Base class / interface
 │   ├── Car.java           // Subclass
 │   ├── ParkingSpot.java   // Slot representation
 │   └── Ticket.java        // Transaction receipt
 ├── enums/                 // System constants and states
 │   ├── VehicleType.java   // CAR, BIKE, TRUCK
 │   └── SpotStatus.java    // AVAILABLE, OCCUPIED, RESERVED
 ├── strategy/              // Extensible business logic algorithms
 │   ├── SlotAllocationStrategy.java  // Interface
 │   ├── NearestSlotStrategy.java     // Implementation
 │   ├── PricingStrategy.java         // Interface
 │   └── HourlyPricingStrategy.java   // Implementation
 ├── repository/            // In-memory data store / collections
 │   └── ParkingLotRepository.java    // Thread-safe ConcurrentHashMaps
 ├── service/               // Business logic orchestration
 │   └── ParkingLotService.java       // Entry, Exit, Payment logic
 └── Main.java              // Test harness driver demonstrating all test cases
*/`,
    pitfall: "Junior trap: Writing everything in a single God Class or jumping into writing database/UI code. Machine coding tests Object-Oriented Design (OOD) in pure in-memory Java, NOT Spring Boot annotations or SQL queries.",
    interviewTip: "Always explain your pattern choices to the interviewer as you code: 'I'm defining PricingStrategy as an interface here so that if the business introduces peak-hour surge pricing or vehicle-type discounting tomorrow, we satisfy the Open-Closed Principle.'",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⏱️ The 60-90 Minute Machine Coding Pacing Flow</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">00 - 10 min</span><small>Clarification &amp; Enums</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">10 - 20 min</span><small>Domain Models &amp; Interfaces</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">20 - 30 min</span><small>Strategy Patterns</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">30 - 65 min</span><small>Thread-Safe Services</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">65 - 80 min</span><small>Working Main() Driver</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-design-pattern-decision-matrix",
    title: "GoF Design Pattern Decision Matrix: What to Choose When",
    category: "Design Patterns",
    badge: "Decision Matrix",
    oneLiner: "Definitive senior selection matrix for GoF Creational, Structural, and Behavioral patterns with concrete trade-offs and machine coding use cases.",
    summary: "Over-engineering with design patterns is just as bad as spaghetti code. This matrix outlines the exact criteria for when each pattern is required, why it is chosen over alternatives, and common interview scenarios.",
    keyPoints: [
      "Strategy vs State: Both use polymorphism to change behavior, but Strategy lets the caller inject an interchangeable algorithm (e.g. Payment: CreditCard vs UPI; Pricing: Hourly vs Dynamic), whereas State allows an object to alter its internal behavior automatically as its state changes (e.g. VendingMachine: NoCoin -> HasCoin -> Dispensing).",
      "Factory Method vs Abstract Factory vs Builder: Factory Method creates one product via inheritance; Abstract Factory creates families of related or dependent objects (e.g. MacButton + MacCheckbox vs WinButton + WinCheckbox); Builder constructs complex objects with 5+ optional attributes step-by-step without telescoping constructors.",
      "Observer vs Pub/Sub: Observer is in-memory and synchronous where the Subject directly holds references to its Observers (e.g. Cricket Scoreboard, Stock Price Alert). Pub/Sub introduces an independent Message Broker (e.g. Kafka/EventBus) where publishers and subscribers have zero knowledge of each other.",
      "Decorator vs Inheritance: Decorator attaches additional responsibilities dynamically at runtime via composition (e.g. Coffee + Milk + WhipCream; Pizza toppings; Java `BufferedInputStream(FileInputStream)`), avoiding an exponential explosion of static subclasses.",
      "Chain of Responsibility vs Interceptor/Filter: Passes a request along a chain of handlers. Each handler decides either to process the request and pass it along, or terminate the chain (e.g. ATM Currency Dispenser: ₹2000 -> ₹500 -> ₹100; Approval workflow; Request auth filter chain)."
    ],
    codeSnippet: `// =========================================================================
// GOF DESIGN PATTERN SELECTION SUMMARY
// =========================================================================

/*
 +-------------------------+--------------------+-----------------------------------------------+
 | Pattern                 | Category           | Classic Machine Coding Use Cases              |
 +-------------------------+--------------------+-----------------------------------------------+
 | Strategy                | Behavioral         | Parking fee calculation, Payment processors,  |
 |                         |                    | Sorting algorithms, Route finding             |
 +-------------------------+--------------------+-----------------------------------------------+
 | State                   | Behavioral         | Vending Machine, ATM states, Order lifecycle, |
 |                         |                    | Elevator movement states                      |
 +-------------------------+--------------------+-----------------------------------------------+
 | Observer                | Behavioral         | Stock ticker alert, Cricket score update,     |
 |                         |                    | YouTube subscriber notification               |
 +-------------------------+--------------------+-----------------------------------------------+
 | Chain of Responsibility | Behavioral         | ATM cash dispenser, Logging framework (Log4j),|
 |                         |                    | Expense approval hierarchy                    |
 +-------------------------+--------------------+-----------------------------------------------+
 | Command                 | Behavioral         | Remote control, Chess/Tic-Tac-Toe undo/redo,  |
 |                         |                    | Transactional undo/rollback                   |
 +-------------------------+--------------------+-----------------------------------------------+
 | Decorator               | Structural         | Coffee shop add-ons, Pizza base toppings,     |
 |                         |                    | Car customizations, Java I/O streams          |
 +-------------------------+--------------------+-----------------------------------------------+
 | Builder                 | Creational         | Complex entities with 5+ optional parameters: |
 |                         |                    | OrderBuilder, HttpRequestBuilder              |
 +-------------------------+--------------------+-----------------------------------------------+
 | Factory Method          | Creational         | VehicleFactory, NotificationFactory (SMS/Email)|
 +-------------------------+--------------------+-----------------------------------------------+
*/`,
    pitfall: "Junior trap: Using Singleton for everything (e.g., Making Repository, Service, and Engine all singletons). This violates testability, couples code tightly, and causes race conditions during unit testing. Prefer passing instances via constructors (Dependency Injection).",
    interviewTip: "When choosing a pattern, always state the problem it prevents: 'Without the State pattern here, our Elevator class would be riddled with 50 lines of nested `if-else (state == MOVING && direction == UP)` that breaks every time a new state like MAINTENANCE is added.'",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🧩 GoF Behavioral Pattern Choice Tree</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Interchangeable Algorithm?</span><small>Strategy Pattern</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Internal Lifecycle Shift?</span><small>State Pattern</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">1-to-Many Notifications?</span><small>Observer Pattern</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Sequential Handling?</span><small>Chain of Responsibility</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-solid-clean-architecture-principles",
    title: "Applying SOLID & Clean Architecture in Machine Coding",
    category: "SOLID Principles",
    badge: "Core Architecture",
    oneLiner: "How to apply Single Responsibility, Open-Closed, Liskov, Interface Segregation, and Dependency Inversion in real machine coding rounds without boilerplate bloat.",
    summary: "Interviewers grade machine coding primarily on how cleanly the code adheres to SOLID principles. Violating OCP (giant if-else switches) or SRP (fat models with business logic) is the #1 reason candidates fail senior LLD rounds.",
    keyPoints: [
      "Single Responsibility (SRP): A class should have one reason to change. Models (e.g., `Ticket`) hold state and getters; Repositories (e.g., `TicketRepository`) manage persistence; Services (e.g., `ParkingService`) orchestrate business logic; PricingStrategies calculate fees. Never calculate ticket fees inside the `Ticket` model class.",
      "Open-Closed Principle (OCP): Open for extension, closed for modification. Achieved via interfaces and abstract base classes. If a new vehicle type (e.g., `ElectricVehicle`) is added, you should only create `class ElectricCar extends Vehicle` and `ElectricSlotStrategy` without modifying existing `ParkingLot` methods.",
      "Liskov Substitution Principle (LSP): Subtypes must be substitutable for base types without breaking caller expectations. Classic violation: `Square extends Rectangle` where `setWidth()` mutates both width and height, breaking invariant expectations.",
      "Interface Segregation Principle (ISP): Clients should not be forced to depend on methods they do not use. Prefer small, focused interfaces (`HasDimensions`, `Pricable`, `Navigable`) over fat interfaces (`IVehicle` with 25 methods).",
      "Dependency Inversion Principle (DIP): High-level business modules should depend on abstractions (interfaces), not low-level concrete classes. Inject `PricingStrategy` and `SlotAllocationStrategy` into `ParkingService` via constructor injection."
    ],
    codeSnippet: `// BAD: Violates SRP & OCP (Fat model doing calculation + persistence + hardcoded types)
class BadParkingTicket {
    private String vehicleType;
    private long entryTime;
    
    public double calculateFee() {
        if (vehicleType.equals("CAR")) return 20.0;
        else if (vehicleType.equals("BIKE")) return 10.0;
        return 50.0; // Adding a new type requires modifying this class!
    }
}

// GOOD: Clean SOLID Architecture
interface PricingStrategy {
    double calculateFee(long durationMillis, VehicleType type);
}

class HourlyPricingStrategy implements PricingStrategy {
    @Override
    public double calculateFee(long durationMillis, VehicleType type) {
        long hours = (long) Math.ceil(durationMillis / (1000.0 * 60 * 60));
        return hours * type.getBaseHourlyRate();
    }
}

class ParkingTicket {
    private final String ticketId;
    private final String spotId;
    private final Vehicle vehicle;
    private final long entryTimestamp;
    // Pure immutable domain state
}`,
    pitfall: "Junior trap: Writing code that requires editing existing classes whenever a new feature is requested by the interviewer during the follow-up phase.",
    interviewTip: "In machine coding, interviewers always introduce a 'surprise requirement' at minute 60 (e.g., 'Now add Electric Charging spots with special kilowatt-hour pricing'). If your code follows OCP, you can add it in 2 minutes simply by writing a new class that implements the interface.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🏗️ Clean Layered Architecture in LLD</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Controller / CLI</span><small>Driver Input</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Service Layer</span><small>Business Orchestration</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Strategies</span><small>Pluggable Algorithms</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Repository</span><small>Thread-Safe Data</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-concurrency-thread-safety-in-lld",
    title: "Thread-Safety & Concurrency in Machine Coding",
    category: "LLD Concurrency",
    badge: "Senior Mechanics",
    oneLiner: "How to handle multi-threaded race conditions in machine coding using ConcurrentHashMap, ReadWriteLock, Atomic primitives, and double-checked locking.",
    summary: "Senior machine coding evaluations frequently specify: 'Your system must be thread-safe for concurrent operations (e.g., 100 threads booking seats simultaneously)'. Using synchronized everywhere destroys throughput; failing to lock causes race conditions.",
    keyPoints: [
      "In-Memory Repositories: Use `ConcurrentHashMap<K, V>` for lookup tables. Use atomic compound methods like `computeIfAbsent()`, `compute()`, and `putIfAbsent()` instead of `if (!map.containsKey(k)) map.put(k, v)` which suffers from check-then-act race conditions.",
      "Read-Write Locking (`ReentrantReadWriteLock`): Ideal for entities that are read 99% of the time and written 1% of the time (e.g., viewing movie seat layout vs booking a seat). Multiple threads can read concurrently; write lock is exclusive.",
      "Granular Row-Level Locking: Never synchronize the entire service method (`public synchronized Ticket bookSeat()`) because it turns the system into a single-threaded bottleneck. Instead, lock on the individual entity (e.g., `seat.getLock().lock()`) or use an in-memory lock map.",
      "Atomic Primitives: Use `AtomicInteger` or `AtomicLong` for ticket sequence numbers and transaction counters to guarantee thread-safe increment without monitor locks.",
      "Timeouts & Deadlock Prevention: When acquiring locks across multiple resources (e.g., transferring funds between User A and User B), always enforce consistent global ordering (e.g. lock by smaller `userId` first) or use `lock.tryLock(timeout)` to prevent circular deadlocks."
    ],
    codeSnippet: `// =========================================================================
// THREAD-SAFE CONCURRENT SEAT RESERVATION MECHANICS
// =========================================================================

public class Seat {
    private final String seatId;
    private SeatStatus status = SeatStatus.AVAILABLE;
    private final ReentrantLock lock = new ReentrantLock();

    public boolean tryReserve(String userId, long timeoutMs) {
        try {
            if (lock.tryLock(timeoutMs, TimeUnit.MILLISECONDS)) {
                try {
                    if (this.status == SeatStatus.AVAILABLE) {
                        this.status = SeatStatus.RESERVED;
                        return true;
                    }
                    return false; // Already reserved by someone else
                } finally {
                    lock.unlock();
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return false; // Timed out waiting for lock
    }
}`,
    pitfall: "Junior trap: Slapping `synchronized` on every method of the `ParkingLotService`. While thread-safe, it forces all entry and exit gates to execute sequentially, causing severe lock contention.",
    interviewTip: "Demonstrate concurrency in your `Main` class using an `ExecutorService` with 10 threads attempting to book the same limited resource simultaneously, proving that no double-booking or corruption occurs.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🔒 Concurrent Resource Reservation Flow</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">10 Threads</span><small>Concurrent Request</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">tryLock(50ms)</span><small>Non-blocking</small></div>
          <span class="flow-arrow-separator">──Winner──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Status -> RESERVED</span><small>Safe Write</small></div>
          <span class="flow-arrow-separator">──Losers──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">SeatUnavailable</span><small>Graceful Fail</small></div>
        </div>
      </div>
    `
  }
];

// =========================================================================
// 2. Top 10 Most-Asked LLD / Machine Coding Problems in Senior Interviews
// =========================================================================
window.REVISION_APP_DATA.LLD_QUESTIONS = [
  {
    id: "lld-p1-parking-lot-system",
    title: "1. Design a Multi-Floor Parking Lot System",
    category: "LLD Classic",
    difficulty: "Senior LLD",
    problem: "Design an in-memory, thread-safe Multi-Floor Parking Lot supporting multiple vehicle types (Motorcycle, Car, Truck), dynamic slot allocation strategies, ticket generation, multiple entry/exit gates, and extensible fee calculation.",
    innerWorking: "Core Entities: `Vehicle` (hierarchy: `Bike`, `Car`, `Truck`), `ParkingSpot` (types: `COMPACT`, `LARGE`, `MOTORCYCLE`), `ParkingFloor`, `ParkingLot` (Singleton/DI), `Ticket`, `Gate`. Design Patterns: Strategy Pattern for slot allocation (`NearestSlotStrategy`, `LowestFloorStrategy`) and fee calculation (`HourlyPricingStrategy`, `FlatRateStrategy`). Concurrency: Synchronized entry/exit or `ReentrantLock` per spot to prevent double-booking.",
    seniorAnswer: [
      "Vehicle & Spot Modeling: Spot sizes map to vehicle sizes (`MOTORCYCLE` fits in all spots, `CAR` fits in `COMPACT` & `LARGE`, `TRUCK` fits only in `LARGE`). Use an enum mapping with a helper method `spot.canFit(vehicle)`.",
      "Strategy Pattern for Slot Allocation: Decouple spot finding into `SlotAllocationStrategy`. `NearestSlotStrategy` maintains a `TreeSet<ParkingSpot>` or min-heap per vehicle type sorted by distance from entrance gate, allowing $O(\log N)$ allocation.",
      "Strategy Pattern for Pricing: `PricingStrategy` interface with `calculateFee(Ticket ticket, long exitTime)`. Allows dynamic changes between Hourly, Flat Rate, or Weekend Surge pricing.",
      "Thread Safety: When a vehicle approaches an entry gate, allocating a spot and marking it `OCCUPIED` must be atomic. Use `spot.lock.tryLock()` or synchronize on the spot."
    ],
    codeSnippet: `// =========================================================================
// PARKING LOT SYSTEM - CORE PRODUCTION CODE
// =========================================================================

public enum VehicleType {
    MOTORCYCLE, CAR, TRUCK
}

public enum SpotType {
    MOTORCYCLE, COMPACT, LARGE;
    public boolean canFit(VehicleType vt) {
        if (this == LARGE) return true;
        if (this == COMPACT) return vt == VehicleType.CAR || vt == VehicleType.MOTORCYCLE;
        return vt == VehicleType.MOTORCYCLE;
    }
}

public class ParkingSpot {
    private final String spotId;
    private final int floor;
    private final SpotType spotType;
    private boolean isAvailable = true;
    private final ReentrantLock lock = new ReentrantLock();

    public ParkingSpot(String id, int floor, SpotType type) {
        this.spotId = id; this.floor = floor; this.spotType = type;
    }

    public boolean assignVehicle(VehicleType vt) {
        lock.lock();
        try {
            if (isAvailable && spotType.canFit(vt)) {
                isAvailable = false;
                return true;
            }
            return false;
        } finally { lock.unlock(); }
    }

    public void vacate() {
        lock.lock();
        try { isAvailable = true; }
        finally { lock.unlock(); }
    }
    public boolean isAvailable() { return isAvailable; }
    public String getSpotId() { return spotId; }
}

public interface PricingStrategy {
    double calculate(long durationMillis, VehicleType type);
}

public class HourlyPricingStrategy implements PricingStrategy {
    @Override
    public double calculate(long durationMillis, VehicleType type) {
        long hours = Math.max(1, (long) Math.ceil(durationMillis / (1000.0 * 60 * 60)));
        double ratePerHour = switch (type) {
            case MOTORCYCLE -> 10.0;
            case CAR -> 20.0;
            case TRUCK -> 50.0;
        };
        return hours * ratePerHour;
    }
}

public class ParkingTicket {
    private final String ticketId = UUID.randomUUID().toString();
    private final String spotId;
    private final VehicleType vehicleType;
    private final long entryTime = System.currentTimeMillis();

    public ParkingTicket(String spotId, VehicleType vt) {
        this.spotId = spotId; this.vehicleType = vt;
    }
    public String getSpotId() { return spotId; }
    public VehicleType getVehicleType() { return vehicleType; }
    public long getEntryTime() { return entryTime; }
    public String getTicketId() { return ticketId; }
}`,
    trap: "Hardcoding spot finding with nested for-loops across all floors and spots on every ticket request ($O(F \times S)$ time complexity). Maintaining a free-spots collection per type makes allocation $O(1)$ or $O(\log N)$.",
    interviewerIntent: "Evaluates OOP hierarchy design, enum mechanics, clean Strategy pattern implementation, and thread safety across multiple gates.",
    warStory: "In a production airport parking system, 10 automated entry gates shared an un-synchronized database table. Two cars arriving at Gate 1 and Gate 3 simultaneously were assigned Spot 4B. The resulting deadlock and customer confrontation blocked the airport terminal for 45 minutes.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🅿️ Parking Lot Entity Relationship Model</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Vehicle</span><small>Bike / Car / Truck</small></div>
          <span class="flow-arrow-separator">──Assigned To──►</span>
          <div class="flow-step-node node-green"><span class="node-label">ParkingSpot</span><small>Locked during write</small></div>
          <span class="flow-arrow-separator">──Generates──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Ticket</span><small>Entry Timestamp</small></div>
          <span class="flow-arrow-separator">──Exit──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">PricingStrategy</span><small>Fee Calculation</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p2-elevator-system",
    title: "2. Design an Elevator Control System (Multi-Car Fleet)",
    category: "LLD Classic",
    difficulty: "Staff LLD",
    problem: "Design an Elevator Control System coordinating $N$ elevators across $M$ floors. Elevators must handle internal requests (floor buttons inside car) and external requests (up/down buttons in hallway), optimize dispatching using the LOOK/SCAN algorithm, and model elevator states cleanly.",
    innerWorking: "Design Patterns: 1) State Pattern (`ElevatorState` with concrete states: `IdleState`, `MovingUpState`, `MovingDownState`); 2) Strategy Pattern for Elevator Dispatching (`NearestElevatorStrategy`, `ScanLookStrategy`); 3) Observer Pattern for floor display and arrival chimes. Algorithms: LOOK algorithm (elevator continues in current direction until no more requests exist in that direction, then reverses).",
    seniorAnswer: [
      "State Pattern for Elevator Lifecycle: Moving state logic out of huge switch statements. The `Elevator` delegates movement and button presses to `ElevatorState`. For instance, `MovingUpState.handleRequest()` only adds stops that are above the current floor to the primary queue; requests below are placed in the reverse queue.",
      "Request Representation & Queues: Each elevator maintains two sorted collections: `TreeSet<Integer> upStops` (sorted ascending) and `TreeSet<Integer> downStops` (sorted descending). This allows $O(\log N)$ insertion and instant $O(1)$ identification of the next stop.",
      "Elevator Dispatcher / Controller: When an external hallway button is pressed (`floor = 7, direction = UP`), the Dispatcher evaluates all $N$ elevators and assigns the request to the elevator with the lowest cost function (distance + penalizing elevators moving away).",
      "Thread Safety: Each elevator runs its own worker loop (`Runnable`) simulating movement between floors, synchronized with caller thread requests."
    ],
    codeSnippet: `// =========================================================================
// ELEVATOR SYSTEM - STATE & SCAN ALGORITHM SKELETON
// =========================================================================

public enum Direction { UP, DOWN, IDLE }

public class Elevator {
    private final int id;
    private int currentFloor = 0;
    private Direction direction = Direction.IDLE;
    private final TreeSet<Integer> upQueue = new TreeSet<>();
    private final TreeSet<Integer> downQueue = new TreeSet<>(Collections.reverseOrder());
    private final ReentrantLock lock = new ReentrantLock();

    public Elevator(int id) { this.id = id; }

    public void addRequest(int targetFloor) {
        lock.lock();
        try {
            if (targetFloor > currentFloor) {
                upQueue.add(targetFloor);
            } else if (targetFloor < currentFloor) {
                downQueue.add(targetFloor);
            }
            if (direction == Direction.IDLE) {
                direction = targetFloor > currentFloor ? Direction.UP : Direction.DOWN;
            }
        } finally { lock.unlock(); }
    }

    public void step() { // Simulates one clock tick of movement
        lock.lock();
        try {
            if (direction == Direction.UP) {
                if (!upQueue.isEmpty()) {
                    currentFloor++;
                    if (upQueue.contains(currentFloor)) {
                        upQueue.remove(currentFloor);
                        System.out.println("Elevator " + id + " stopped at floor " + currentFloor);
                    }
                } else if (!downQueue.isEmpty()) {
                    direction = Direction.DOWN;
                } else {
                    direction = Direction.IDLE;
                }
            } else if (direction == Direction.DOWN) {
                if (!downQueue.isEmpty()) {
                    currentFloor--;
                    if (downQueue.contains(currentFloor)) {
                        downQueue.remove(currentFloor);
                        System.out.println("Elevator " + id + " stopped at floor " + currentFloor);
                    }
                } else if (!upQueue.isEmpty()) {
                    direction = Direction.UP;
                } else {
                    direction = Direction.IDLE;
                }
            }
        } finally { lock.unlock(); }
    }
}`,
    trap: "Candidate models the elevator with a simple FIFO queue. If requests arrive for floors 1, 10, 2, 9 in that order, a FIFO elevator travels from 1 -> 10 -> 2 -> 9, wasting massive energy and creating horrible passenger wait times. Must use SCAN/LOOK elevator disk scheduling algorithms.",
    interviewerIntent: "Assesses ability to model state machines, complex multi-threaded scheduling algorithms, and clean separation between fleet dispatching and individual car movement.",
    warStory: "An office building with 4 elevators had a dispatcher that assigned every external button press to Elevator 1 if it was idle. Elevator 1 did 90% of all trips while Elevators 2-4 sat idle on the ground floor, leading to premature motor failure on Elevator 1 within 6 months.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🛗 Elevator SCAN/LOOK Scheduling Engine</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">External Hallway Call</span><small>Floor 7 UP</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Fleet Dispatcher</span><small>Calculate Cost Function</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Elevator Car 2</span><small>Insert into upQueue</small></div>
          <span class="flow-arrow-separator">──Step Loop──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">LOOK Algorithm</span><small>Upward Sweep -> Reverse</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p3-tic-tac-toe-game",
    title: "3. Design Tic-Tac-Toe / Chess Board Game",
    category: "LLD Classic",
    difficulty: "Senior LLD",
    problem: "Design an extensible, generic $N \times N$ Board Game (Tic-Tac-Toe / Connect-4 / Chess) supporting 2 or more players, move validation, $O(1)$ win checking, and Undo/Redo moves using the Command pattern.",
    innerWorking: "Entities: `Board`, `Cell`, `Piece` (types: `X`, `O`), `Player`, `Move`, `Game`. Patterns: 1) Strategy Pattern for Win Condition Check (evaluating whether a player has won); 2) Command Pattern for Undo/Redo (`MakeMoveCommand` storing previous cell state); 3) State Pattern for Game Status (`IN_PROGRESS`, `FINISHED`, `DRAW`). Key Algorithm: $O(1)$ win evaluation using row, column, and diagonal counters instead of $O(N)$ full board scans on every move.",
    seniorAnswer: [
      "O(1) Win Check Optimization: Instead of scanning the entire $N \times N$ board after each move, maintain arrays `int[] rowCounts`, `int[] colCounts`, and integers `diagCount`, `antiDiagCount`. Player X adds +1; Player O adds -1. When any counter hits $+N$ (Player X wins) or $-N$ (Player O wins), game is won in $O(1)$ time.",
      "Command Pattern for Undo/Redo: Wrap each move inside a `MoveCommand` containing `(row, col, player)`. Maintain an undo stack `Deque<MoveCommand> history`. When `undo()` is called, pop the command, vacate the cell, decrement the win counters, and switch current player back.",
      "Extensibility to N-Dimensions / Connect-4: Decouple the win check into `WinningStrategy` interface. An $N \times N$ Tic-Tac-Toe uses `StandardTicTacToeWinningStrategy`, while Connect-4 uses `ConnectFourWinningStrategy`.",
      "Clean Turn Management: Maintain a `Queue<Player>` or `LinkedList<Player>`. When a player finishes a valid move, they are rotated to the back of the queue."
    ],
    codeSnippet: `// =========================================================================
// O(1) WIN-CHECKING TIC-TAC-TOE ENGINE
// =========================================================================

public class TicTacToeGame {
    private final int n;
    private final int[][] board;
    private final int[] rows;
    private final int[] cols;
    private int diagonal = 0;
    private int antiDiagonal = 0;
    private int movesMade = 0;

    public TicTacToeGame(int n) {
        this.n = n;
        this.board = new int[n][n];
        this.rows = new int[n];
        this.cols = new int[n];
    }

    // player: 1 for Player 1 (X), -1 for Player 2 (O)
    // Returns: 1 if Player 1 wins, -1 if Player 2 wins, 0 otherwise
    public int makeMove(int row, int col, int player) {
        if (row < 0 || row >= n || col < 0 || col >= n || board[row][col] != 0) {
            throw new IllegalArgumentException("Invalid move!");
        }

        board[row][col] = player;
        movesMade++;

        rows[row] += player;
        cols[col] += player;
        if (row == col) diagonal += player;
        if (row + col == n - 1) antiDiagonal += player;

        // O(1) Winner Check!
        if (Math.abs(rows[row]) == n || Math.abs(cols[col]) == n ||
            Math.abs(diagonal) == n || Math.abs(antiDiagonal) == n) {
            return player; // Winner declared!
        }

        if (movesMade == n * n) return 2; // Draw
        return 0; // Game in progress
    }
}`,
    trap: "Iterating through all rows, columns, and diagonals with nested loops on every single move. For an $N \times N$ game, this turns win verification into $O(N)$ or $O(N^2)$ instead of constant $O(1)$ time.",
    interviewerIntent: "Evaluates algorithm optimization ($O(1)$ win checking), clean separation of board state from game logic, and Command pattern implementation for Undo/Redo.",
    warStory: "An online board gaming engine crashed during a live tournament with $100 \times 100$ Gomoku boards because their win checker ran a full $O(N^2)$ recursive flood-fill check after every stone placement. Rewriting with directional counters dropped CPU usage from 95% to 2%.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🎮 Tic-Tac-Toe O(1) Counter Win Machine</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Player Move</span><small>row: 1, col: 1</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Increment Counters</span><small>rows[1]++, diag++</small></div>
          <span class="flow-arrow-separator">──Check──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Any Counter == N?</span><small>O(1) Evaluation</small></div>
          <span class="flow-arrow-separator">──Yes──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">Declare Winner</span><small>Game Over</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p4-splitwise-expense-sharing",
    title: "4. Design Splitwise (Expense Sharing & Debt Simplification)",
    category: "LLD Classic",
    difficulty: "Staff LLD",
    problem: "Design an in-memory expense sharing app (Splitwise) supporting groups, users, different split strategies (EQUAL, EXACT, PERCENTAGE), balance sheet tracking, and an algorithm to simplify group debts (minimizing total cash flow transactions).",
    innerWorking: "Entities: `User`, `Group`, `Expense`, `Split` (subclasses: `EqualSplit`, `ExactSplit`, `PercentageSplit`), `BalanceSheet`. Patterns: Strategy Pattern for Expense Validation & Splitting (`SplitStrategy`). Key Algorithm: Min Cash Flow Graph Algorithm using two Heaps (MinHeap of net debtors + MaxHeap of net creditors) to minimize transactions from $O(N^2)$ to $O(N)$.",
    seniorAnswer: [
      "Strategy Pattern for Split Types: Each split type implements `SplitValidatorStrategy`. For `EXACT`, it validates `sum(amounts) == totalExpense`. For `PERCENTAGE`, it validates `sum(percentages) == 100.0`. For `EQUAL`, it divides amount equally and handles rounding remainders (e.g., ₹100 split 3 ways -> 33.34, 33.33, 33.33).",
      "User Balance Sheet Modeling: Maintain a nested map `Map<String, Map<String, Double>> balances` where `balances.get(userA).get(userB)` stores how much User B owes User A.",
      "Debt Simplification Algorithm (Min Cash Flow): In a group where A owes B ₹100, B owes C ₹100, and C owes A ₹50, naive settlement requires 3 transactions. Simplify: 1) Compute net balance for each person (`totalCredit - totalDebit`); 2) Separate people into `debtors` (negative net) and `creditors` (positive net); 3) Settle largest debtor with largest creditor greedily using two PriorityQueues. Reduces transactions to $\le N-1$.",
      "Rounding Precision: Use `BigDecimal` with `RoundingMode.HALF_UP` for all financial currency amounts; never use raw `double` or `float` due to IEEE-754 precision errors."
    ],
    codeSnippet: `// =========================================================================
// MINIMUM CASH FLOW ALGORITHM (DEBT SIMPLIFICATION)
// =========================================================================

public class DebtSimplifier {
    public static List<Transaction> simplifyDebts(Map<String, Double> netBalances) {
        // MaxHeap for Creditors (people owed money > 0)
        PriorityQueue<UserBalance> creditors = new PriorityQueue<>(
            (a, b) -> Double.compare(b.amount, a.amount));
        // MinHeap for Debtors (people who owe money < 0)
        PriorityQueue<UserBalance> debtors = new PriorityQueue<>(
            Comparator.comparingDouble(a -> a.amount));

        for (Map.Entry<String, Double> entry : netBalances.entrySet()) {
            if (entry.getValue() > 0.001) {
                creditors.add(new UserBalance(entry.getKey(), entry.getValue()));
            } else if (entry.getValue() < -0.001) {
                debtors.add(new UserBalance(entry.getKey(), entry.getValue()));
            }
        }

        List<Transaction> result = new ArrayList<>();
        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            UserBalance maxCreditor = creditors.poll();
            UserBalance maxDebtor = debtors.poll();

            double settleAmount = Math.min(maxCreditor.amount, -maxDebtor.amount);
            result.add(new Transaction(maxDebtor.userId, maxCreditor.userId, settleAmount));

            double remainingCredit = maxCreditor.amount - settleAmount;
            double remainingDebit = maxDebtor.amount + settleAmount;

            if (remainingCredit > 0.001) creditors.add(new UserBalance(maxCreditor.userId, remainingCredit));
            if (remainingDebit < -0.001) debtors.add(new UserBalance(maxDebtor.userId, remainingDebit));
        }
        return result;
    }
    
    static record UserBalance(String userId, double amount) {}
    static record Transaction(String from, String to, double amount) {}
}`,
    trap: "Using `double` for currency math causing 0.00000000000001 cent leaks, or hardcoding the debt simplification logic inside the `Expense` class, violating Single Responsibility.",
    interviewerIntent: "Evaluates financial data modeling, precision handling, Strategy pattern usage for split types, and graph algorithm mastery for debt minimization.",
    warStory: "An early expense-sharing startup used raw `float` arithmetic. Over 2 years, accumulated floating-point rounding errors caused group balance totals to diverge by ₹43,000, forcing a painful ledger audit and migration to `BigDecimal`.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">💰 Splitwise Debt Simplification Flow</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Raw Group Debts</span><small>O(N^2) Transfers</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Compute Net Balances</span><small>Credit - Debit</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Greedy Two-Heaps</span><small>Max Debtor -> Max Creditor</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Simplified Debts</span><small>Max N-1 Transactions</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p5-snake-and-ladder",
    title: "5. Design Snake and Ladder Board Game",
    category: "LLD Classic",
    difficulty: "Senior LLD",
    problem: "Design an in-memory Snake and Ladder board game supporting arbitrary board sizes ($N$), configurable snakes and ladders, multiple dice rolling strategies (fair, crooked, 2-dice), player turn queues, and winner detection.",
    innerWorking: "Entities: `Board`, `Cell`, `Jump` (subclasses: `Snake` where end < start; `Ladder` where end > start), `Dice`, `Player`, `Game`. Patterns: Strategy Pattern for Dice rolling (`FairDiceStrategy`, `CrookedDiceStrategy`); Factory Pattern for Board initialization; State Machine for Game status (`NOT_STARTED`, `RUNNING`, `ENDED`).",
    seniorAnswer: [
      "Jump Modeling (Snake vs Ladder): Model both as a `Jump` class containing `startCell` and `endCell`. A `Snake` is simply a jump where `endCell < startCell`; a `Ladder` is where `endCell > startCell`. A Cell holds an optional `Jump` reference. This eliminates duplicated traversal logic.",
      "Preventing Infinite Snake/Ladder Cycles: During board generation, validate that no cell contains both a snake head and ladder bottom, and that snake tails do not drop into ladder bottoms forming an infinite loop.",
      "Extensible Dice Strategy: Define `DiceStrategy` interface returning random number between $1$ and $6 \times \text{numberOfDice}$. Allows pluggable crooked dice (always even numbers) or test-deterministic dice.",
      "Turn Queue: Manage players in a FIFO `Queue<Player>`. Poll player, roll dice, calculate `newPosition = currentPosition + roll`. If `newPosition <= totalCells`, update position and apply Jump. If `newPosition == totalCells`, player wins! Otherwise, push player back to end of queue."
    ],
    codeSnippet: `// =========================================================================
// SNAKE AND LADDER GAME CORE SKELETON
// =========================================================================

public class Jump {
    private final int start;
    private final int end;
    public Jump(int start, int end) { this.start = start; this.end = end; }
    public int getStart() { return start; }
    public int getEnd() { return end; }
    public boolean isSnake() { return end < start; }
}

public class Board {
    private final int size;
    private final Map<Integer, Jump> jumps = new HashMap<>();

    public Board(int size) { this.size = size; }
    public void addJump(Jump jump) { jumps.put(jump.getStart(), jump); }

    public int getNextPosition(int currentPos, int roll) {
        int target = currentPos + roll;
        if (target > size) return currentPos; // Bounce / No move rule
        if (jumps.containsKey(target)) {
            Jump j = jumps.get(target);
            System.out.println((j.isSnake() ? "Bitten by Snake!" : "Climbed Ladder!") + " to " + j.getEnd());
            return j.getEnd();
        }
        return target;
    }
    public int getSize() { return size; }
}

public class SnakeAndLadderGame {
    private final Board board;
    private final Queue<Player> players = new LinkedList<>();
    private final DiceStrategy dice;

    public SnakeAndLadderGame(Board board, List<Player> playerList, DiceStrategy dice) {
        this.board = board;
        this.players.addAll(playerList);
        this.dice = dice;
    }

    public void play() {
        while (players.size() > 1) {
            Player current = players.poll();
            int roll = dice.roll();
            int nextPos = board.getNextPosition(current.getPosition(), roll);
            current.setPosition(nextPos);

            System.out.println(current.getName() + " rolled a " + roll + " and moved to " + nextPos);

            if (nextPos == board.getSize()) {
                System.out.println("🏆 " + current.getName() + " has WON the game!");
                break;
            }
            players.offer(current); // Next player's turn
        }
    }
}`,
    trap: "Using an array of 100 Cell objects with separate `snakeStart`, `snakeEnd`, `ladderStart`, `ladderEnd` fields everywhere. Unifying them into a single `Jump` abstraction keeps the codebase clean and extensible.",
    interviewerIntent: "Evaluates basic OOP inheritance/composition, clean game-loop state modeling, and input validation against infinite loops.",
    warStory: "A gaming portal launched a customizable board feature where users could place snakes. A user placed a snake from 99 to 20, and a ladder from 20 to 99. Games on that board entered infinite recursion, hung the worker thread, and exhausted server memory.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🎲 Snake &amp; Ladder Game Loop</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Poll Player</span><small>Queue Turn</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Roll Dice</span><small>DiceStrategy</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Jump Check</span><small>Snake/Ladder</small></div>
          <span class="flow-arrow-separator">──Pos == N──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">Winner Declared</span><small>Game Ends</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p6-bookmyshow-movie-booking",
    title: "6. Design BookMyShow / Movie Ticket Booking",
    category: "LLD Classic",
    difficulty: "Staff LLD",
    problem: "Design an in-memory Movie Ticket Booking system (BookMyShow) supporting multiple cinemas, screens, shows, seat types (Silver, Gold, Platinum), and a temporary 10-minute seat lock mechanism that releases seats automatically if payment fails.",
    innerWorking: "Entities: `City`, `Cinema`, `Screen`, `Show`, `Movie`, `Seat`, `Booking`, `Payment`. Patterns: 1) State Pattern for Seat status (`AVAILABLE`, `LOCKED`, `BOOKED`); 2) Strategy Pattern for Pricing; 3) Scheduled Executor / DelayQueue for releasing seat lock after 10-minute timeout; 4) Concurrency: Thread-safe atomic seat reservation.",
    seniorAnswer: [
      "Temporary Seat Lock & Timeout: When a user selects 3 seats and clicks 'Proceed to Pay', the seats are placed in status `LOCKED` with an expiry timestamp `lockExpiresAt = now + 10 mins`. A background `ScheduledExecutorService` (or in-memory DelayQueue) polls expired locks and resets status to `AVAILABLE`.",
      "Atomic Multi-Seat Reservation: Booking multiple seats (e.g., A1, A2, A3) requires acquiring locks on all 3 seats. To prevent deadlock when another user simultaneously tries to book A3, A2, A1, always sort seat IDs lexicographically before acquiring locks.",
      "ShowSeat Separation: A physical `Seat` belongs to a `Screen`. A `ShowSeat` represents the status of that seat for a *specific* `Show` at a *specific* time. Never store booking status on the physical `Seat` model.",
      "Concurrency Handling: Use optimistic locking or a concurrent map `ConcurrentHashMap<String, ShowSeat>` where reserving executes `seat.compareAndSet(AVAILABLE, LOCKED)`."
    ],
    codeSnippet: `// =========================================================================
// THREAD-SAFE SEAT LOCKING MECHANICS WITH TIMEOUT
// =========================================================================

public enum SeatStatus { AVAILABLE, LOCKED, BOOKED }

public class ShowSeat {
    private final String seatId;
    private SeatStatus status = SeatStatus.AVAILABLE;
    private String lockedByUserId = null;
    private long lockTimestamp = 0L;
    private final ReentrantLock lock = new ReentrantLock();

    public ShowSeat(String seatId) { this.seatId = seatId; }

    public boolean lockSeat(String userId, long timeoutMillis) {
        lock.lock();
        try {
            long now = System.currentTimeMillis();
            // If already locked, check if the lock has expired
            if (status == SeatStatus.LOCKED && (now - lockTimestamp) > timeoutMillis) {
                status = SeatStatus.AVAILABLE; // Lock expired!
            }

            if (status == SeatStatus.AVAILABLE) {
                this.status = SeatStatus.LOCKED;
                this.lockedByUserId = userId;
                this.lockTimestamp = now;
                return true;
            }
            return false;
        } finally { lock.unlock(); }
    }

    public boolean confirmBooking(String userId) {
        lock.lock();
        try {
            if (status == SeatStatus.LOCKED && userId.equals(lockedByUserId)) {
                this.status = SeatStatus.BOOKED;
                return true;
            }
            return false;
        } finally { lock.unlock(); }
    }

    public void releaseLock() {
        lock.lock();
        try {
            if (status == SeatStatus.LOCKED) {
                this.status = SeatStatus.AVAILABLE;
                this.lockedByUserId = null;
            }
        } finally { lock.unlock(); }
    }
}`,
    trap: "Storing `status` directly on the physical `Seat` entity. A cinema seat is a permanent physical chair; its availability changes per Movie Show. Mixing the two means you cannot run multiple shows in the same auditorium.",
    interviewerIntent: "Assesses separation of physical vs logical models (`Seat` vs `ShowSeat`), distributed temporary locking, timeout handling, and deadlock prevention.",
    warStory: "A major cinema app didn't lexicographically sort seat IDs when locking multiple seats. User 1 clicked [B1, B2] and locked B1; User 2 clicked [B2, B1] and locked B2. Both threads blocked waiting on each other's lock, hanging the payment screen and causing customer checkout timeouts.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🎬 BookMyShow Seat Reservation State Machine</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-green"><span class="node-label">AVAILABLE</span><small>Open for Selection</small></div>
          <span class="flow-arrow-separator">──Select &amp; Lock──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">LOCKED</span><small>10-Min Payment Timer</small></div>
          <span class="flow-arrow-separator">──Payment Paid──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">BOOKED</span><small>Ticket Issued</small></div>
          <span class="flow-arrow-separator">──Timeout / Fail──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">AVAILABLE</span><small>Auto-Vacated</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p7-atm-machine-system",
    title: "7. Design an ATM Machine (State & Chain of Responsibility)",
    category: "LLD Classic",
    difficulty: "Senior LLD",
    problem: "Design an Automated Teller Machine (ATM) supporting card insertion, PIN validation, balance inquiry, and cash withdrawal dispensing ₹2000, ₹500, and ₹100 notes using proper design patterns.",
    innerWorking: "Design Patterns: 1) State Pattern for ATM States: `IdleState`, `HasCardState`, `PinEnteredState`, `DispensingState`; 2) Chain of Responsibility Pattern for Cash Dispenser: `TwoThousandDispenser -> FiveHundredDispenser -> OneHundredDispenser`. Eliminates nested if-else logic and models hardware constraints accurately.",
    seniorAnswer: [
      "State Pattern for ATM Lifecycle: An `ATM` context delegates actions (`insertCard`, `enterPin`, `requestCash`, `ejectCard`) to an `ATMState` interface. Illegal operations (e.g. attempting to enter PIN when no card is inserted) throw `InvalidActionException` cleanly.",
      "Chain of Responsibility for Cash Dispenser: Define `CashDispenser` abstract handler with `setNextDispenser()`. When a withdrawal of ₹3,700 arrives, `TwoThousandDispenser` takes 1 note (₹2000), forwards ₹1,700 to `FiveHundredDispenser` (takes 3 notes = ₹1500), which forwards ₹200 to `OneHundredDispenser` (takes 2 notes = ₹200).",
      "Inventory Tracking in Dispenser: Each dispenser tracks remaining note inventory. If ₹2000 notes are empty, the dispenser forwards the entire amount to the next chain link.",
      "Atomic Hardware Dispensation & Rollback: If the cash cannot be dispensed in exact denominations (e.g., requesting ₹350 when smallest note is ₹100), the chain fails before ejecting notes, rolling back the transaction."
    ],
    codeSnippet: `// =========================================================================
// ATM CASH DISPENSER - CHAIN OF RESPONSIBILITY PATTERN
// =========================================================================

public abstract class CashDispenser {
    protected CashDispenser next;
    protected final int denomination;
    protected int availableNotes;

    public CashDispenser(int denomination, int initialNotes) {
        this.denomination = denomination;
        this.availableNotes = initialNotes;
    }

    public void setNext(CashDispenser next) { this.next = next; }

    public void dispense(int amount) {
        int notesNeeded = amount / denomination;
        int notesToDispense = Math.min(notesNeeded, availableNotes);
        int remainder = amount - (notesToDispense * denomination);

        if (notesToDispense > 0) {
            availableNotes -= notesToDispense;
            System.out.println("Dispensing " + notesToDispense + " notes of ₹" + denomination);
        }

        if (remainder > 0) {
            if (next != null) {
                next.dispense(remainder);
            } else {
                throw new IllegalStateException("Cannot dispense exact amount with available denominations!");
            }
        }
    }
}`,
    trap: "Hardcoding cash withdrawal with integer division (`/ 2000`, `/ 500`) directly inside the ATM class. Adding a new ₹200 denomination requires modifying core ATM code, violating OCP. Chain of Responsibility lets you insert new denomination handlers dynamically.",
    interviewerIntent: "Assesses pairing two complementary GoF design patterns (State + Chain of Responsibility) to solve hardware-oriented workflows.",
    warStory: "When India demonetized ₹1000 notes and introduced ₹2000 and ₹200 notes, banks whose ATM firmware used hardcoded division had to flash every ATM motherboard manually over 4 months. Banks with pluggable Chain of Responsibility firmware updated denominations via a remote config push in 1 day.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🏧 ATM Cash Dispenser Chain of Responsibility</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">Withdrawal Request</span><small>Amount: ₹3,700</small></div>
          <span class="flow-arrow-separator">──₹1,700 left──►</span>
          <div class="flow-step-node node-green"><span class="node-label">₹2000 Handler</span><small>Dispense 1 Note</small></div>
          <span class="flow-arrow-separator">──₹200 left──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">₹500 Handler</span><small>Dispense 3 Notes</small></div>
          <span class="flow-arrow-separator">──₹0 left──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">₹100 Handler</span><small>Dispense 2 Notes</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p8-vending-machine-system",
    title: "8. Design a Vending Machine (State Pattern & Inventory)",
    category: "LLD Classic",
    difficulty: "Senior LLD",
    problem: "Design an in-memory Vending Machine supporting item selection, coin/note insertion, inventory tracking, change calculation, and refunding using the State Pattern.",
    innerWorking: "Design Pattern: State Pattern with states `IdleState` (No Coin), `HasMoneyState` (Coin Inserted), `DispenseItemState`, `SoldOutState`. The context `VendingMachine` maintains current state, inventory map (`ItemShelf`), and accumulated monetary balance.",
    seniorAnswer: [
      "State Pattern for Operations: Operations `insertMoney(Coin/Note)`, `selectItem(code)`, `dispense()`, `cancelRefund()` delegate directly to `VendingMachineState`. For instance, in `IdleState`, calling `dispense()` throws `IllegalStateException('Please insert money first')`.",
      "Inventory Management: Model items with `Item` (`name`, `price`, `itemCode`) and `ItemShelf` (`shelfCode`, `item`, `count`). Slots track physical stock counts accurately.",
      "Change Return Algorithm: Calculate `change = currentBalance - item.getPrice()`. If change > 0, return coins from machine's coin accumulator. If the machine lacks sufficient change, reject transaction and refund original money.",
      "State Transition Flow: `IdleState` -> (Insert Coin) -> `HasMoneyState` -> (Select Item & Balance >= Price) -> `DispenseItemState` -> (Dispense & Return Change) -> `IdleState`."
    ],
    codeSnippet: `// =========================================================================
// VENDING MACHINE STATE PATTERN SKELETON
// =========================================================================

public interface VendingState {
    void insertCoin(VendingMachine vm, Coin coin);
    void selectItem(VendingMachine vm, String code);
    void dispense(VendingMachine vm);
    List<Coin> cancelAndRefund(VendingMachine vm);
}

public class IdleState implements VendingState {
    @Override
    public void insertCoin(VendingMachine vm, Coin coin) {
        vm.addBalance(coin.getValue());
        vm.setState(new HasMoneyState());
        System.out.println("Coin accepted. Current balance: " + vm.getBalance());
    }

    @Override
    public void selectItem(VendingMachine vm, String code) {
        throw new IllegalStateException("Please insert coins before selecting an item!");
    }

    @Override
    public void dispense(VendingMachine vm) {
        throw new IllegalStateException("No money inserted!");
    }

    @Override
    public List<Coin> cancelAndRefund(VendingMachine vm) {
        return Collections.emptyList();
    }
}`,
    trap: "Writing the Vending Machine using an enum with 300 lines of `switch(state)` statements. Adding a new promotional state (e.g. `FreeBonusState`) requires modifying every method.",
    interviewerIntent: "Classic evaluation of pure GoF State Pattern implementation, edge case handling (out-of-stock, exact change missing), and encapsulation.",
    warStory: "An embedded vending machine used global integer state flags. A race condition allowed customers to press 'Refund' and 'Select Item' at the exact same millisecond, which refunded the coins AND dispensed the soda, draining the machine of both stock and cash.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🥤 Vending Machine State Lifecycle</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">IdleState</span><small>Waiting for Coin</small></div>
          <span class="flow-arrow-separator">──Insert Coin──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">HasMoneyState</span><small>Waiting for Selection</small></div>
          <span class="flow-arrow-separator">──Select Item──►</span>
          <div class="flow-step-node node-green"><span class="node-label">DispenseState</span><small>Deduct Stock &amp; Change</small></div>
          <span class="flow-arrow-separator">──Complete──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">IdleState</span><small>Reset</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p9-logging-framework-log4j",
    title: "9. Design a Distributed Logging Framework (Log4j-like)",
    category: "LLD Classic",
    difficulty: "Staff LLD",
    problem: "Design an in-memory, thread-safe logging library (similar to Log4j / SLF4J) supporting hierarchical Log Levels (DEBUG, INFO, WARN, ERROR), multiple pluggable Appenders (Console, File, Network), customizable formatters, and asynchronous non-blocking logging.",
    innerWorking: "Design Patterns: 1) Chain of Responsibility / Observer Pattern for Log Appenders; 2) Strategy Pattern for Log Formatting (`JsonFormatter`, `SimpleTextFormatter`); 3) Singleton / Registry for Logger instances; 4) Concurrency: Asynchronous non-blocking Ring Buffer (`Disruptor` or bounded `ArrayBlockingQueue`) so logging does not block the business application thread.",
    seniorAnswer: [
      "LogLevel Hierarchy: Enums ordered by severity (`DEBUG(1) < INFO(2) < WARN(3) < ERROR(4)`). A message is only logged if `messageLevel >= configuredLevel`. Checks should be $O(1)$ fast to avoid overhead when logging is disabled.",
      "Pluggable Appenders via Observer: A `Logger` holds a list of `LogAppender` instances (`ConsoleAppender`, `FileAppender`). When a log event occurs, all registered appenders receive the event.",
      "Asynchronous Non-Blocking Logging: Writing to disk or network synchronously blocks the caller thread for milliseconds. High-performance loggers push `LogEvent` to a bounded ring buffer or `BlockingQueue`; a dedicated background daemon worker polls the queue and flushes to appenders.",
      "MDC (Mapped Diagnostic Context): Thread-local key-value store (`ThreadLocal<Map<String, String>>`) allowing correlation IDs (trace IDs) to be automatically prepended to every log line emitted by that thread."
    ],
    codeSnippet: `// =========================================================================
// ASYNC LOGGING FRAMEWORK SKELETON
// =========================================================================

public enum LogLevel {
    DEBUG(1), INFO(2), WARN(3), ERROR(4);
    private final int level;
    LogLevel(int l) { this.level = l; }
    public boolean isEnabled(LogLevel target) { return this.level <= target.level; }
}

public interface LogAppender {
    void append(String formattedMessage);
}

public class AsyncLogger {
    private final String name;
    private LogLevel currentLevel = LogLevel.INFO;
    private final List<LogAppender> appenders = new CopyOnWriteArrayList<>();
    private final BlockingQueue<String> logQueue = new ArrayBlockingQueue<>(10_000);

    public AsyncLogger(String name) {
        this.name = name;
        // Background consumer thread flushing logs asynchronously
        Thread worker = new Thread(() -> {
            while (true) {
                try {
                    String msg = logQueue.take();
                    for (LogAppender appender : appenders) {
                        appender.append(msg);
                    }
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            }
        });
        worker.setDaemon(true);
        worker.start();
    }

    public void addAppender(LogAppender appender) { appenders.add(appender); }

    public void info(String message) {
        if (LogLevel.INFO.isEnabled(currentLevel)) {
            String formatted = String.format("[%s] [INFO] [%s] %s", Instant.now(), name, message);
            logQueue.offer(formatted); // Non-blocking offer
        }
    }
}`,
    trap: "Synchronously writing log strings directly to disk (`FileWriter`) inside `logger.info()`. Under high concurrency, 500 threads fight for disk I/O locks, crashing application throughput.",
    interviewerIntent: "Assesses understanding of clean decoupled abstractions, Observer/Strategy patterns, and asynchronous producer-consumer buffering.",
    warStory: "A payments gateway had synchronous file logging. When AWS EBS disk latency spiked to 200ms during an AWS storage degradation, all gateway worker threads backed up on `logger.info()`, causing a global API timeout across all merchant checkouts.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📜 Asynchronous Logging Architecture</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">App Thread</span><small>logger.info("msg")</small></div>
          <span class="flow-arrow-separator">──Non-Blocking Push──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Ring Buffer Queue</span><small>ArrayBlockingQueue</small></div>
          <span class="flow-arrow-separator">──Background Poll──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Worker Daemon</span><small>Flushes Event</small></div>
          <span class="flow-arrow-separator">──►</span>
          <div class="flow-step-node node-orange"><span class="node-label">Appenders</span><small>Console, File, Kafka</small></div>
        </div>
      </div>
    `
  },
  {
    id: "lld-p10-in-memory-cache-lru-lfu",
    title: "10. Design an In-Memory Cache (LRU / LFU Eviction & Concurrency)",
    category: "LLD Classic",
    difficulty: "Senior LLD",
    problem: "Design a high-performance, thread-safe in-memory cache supporting $O(1)$ `get(key)` and `put(key, value)`, configurable capacity, pluggable eviction strategies (LRU, LFU, FIFO), and optional TTL expiration.",
    innerWorking: "Design Patterns: Strategy Pattern for Eviction Policies (`EvictionStrategy`). Algorithms: 1) LRU (Least Recently Used) implemented via Doubly Linked List + HashMap; 2) LFU (Least Frequently Used) implemented via Frequency Buckets (HashMap of frequency -> DoublyLinkedList); 3) Concurrency: `ReentrantReadWriteLock` to allow concurrent readers while serializing evictions.",
    seniorAnswer: [
      "LRU Internal Mechanics (Doubly Linked List + HashMap): HashMap maps `key -> Node`. Doubly linked list maintains access order (`head` = most recently used, `tail` = least recently used). On `get(key)`: lookup node in $O(1)$, move node to head in $O(1)$. On `put(key, value)`: if key exists, update value and move to head; if capacity exceeded, remove `tail` from both list and map in $O(1)$ time.",
      "Strategy Pattern for Eviction: Decouple the cache storage from eviction via `EvictionPolicy<K>`. Allows swapping between `LRUEvictionPolicy`, `LFUEvictionPolicy`, and `FIFOEvictionPolicy` without modifying the core cache wrapper.",
      "Thread Safety via ReadWriteLock: Multiple concurrent threads calling `get()` acquire `readLock`. Note: Because standard LRU mutates list order on `get()`, pure LRU requires a write lock on read. To optimize, use a concurrent read buffer (like Caffeine Cache) or fine-grained bucket striping.",
      "TTL Expiration Policy: Store `expiryTimestamp` in `Node`. On `get()`, check if `System.currentTimeMillis() > node.expiryTimestamp`. If expired, delete node and return null (passive expiration). A background cleaner sweeps expired keys periodically (active expiration)."
    ],
    codeSnippet: `// =========================================================================
// THREAD-SAFE LRU CACHE WITH DOUBLY LINKED LIST + HASHMAP
// =========================================================================

public class LRUCache<K, V> {
    private static class Node<K, V> {
        K key; V value;
        Node<K, V> prev, next;
        Node(K k, V v) { this.key = k; this.value = v; }
    }

    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private final Node<K, V> head = new Node<>(null, null);
    private final Node<K, V> tail = new Node<>(null, null);
    private final ReentrantLock lock = new ReentrantLock();

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public V get(K key) {
        lock.lock();
        try {
            Node<K, V> node = map.get(key);
            if (node == null) return null;
            moveToHead(node);
            return node.value;
        } finally { lock.unlock(); }
    }

    public void put(K key, V value) {
        lock.lock();
        try {
            Node<K, V> node = map.get(key);
            if (node != null) {
                node.value = value;
                moveToHead(node);
            } else {
                if (map.size() >= capacity) {
                    Node<K, V> lru = tail.prev;
                    removeNode(lru);
                    map.remove(lru.key);
                }
                Node<K, V> newNode = new Node<>(key, value);
                map.put(key, newNode);
                addFirst(newNode);
            }
        } finally { lock.unlock(); }
    }

    private void moveToHead(Node<K, V> node) {
        removeNode(node);
        addFirst(node);
    }
    private void addFirst(Node<K, V> node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
    private void removeNode(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}`,
    trap: "Using Java's built-in `LinkedHashMap(capacity, 0.75f, true)` and overriding `removeEldestEntry()`. While valid in simple code, in a machine coding interview it looks lazy. Interviewers want you to demonstrate the Doubly Linked List pointer manipulations manually.",
    interviewerIntent: "Evaluates manual pointer manipulation, $O(1)$ hash table + linked list synchronization, clean Strategy pattern abstraction, and concurrency protection.",
    warStory: "An engineer used standard synchronized `HashMap` for an in-memory cache without capacity bounds. Under high load, cache entries grew to 12 million keys, triggering a Stop-the-World JVM GC pause lasting 42 seconds that dropped all client HTTP connections.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🗃️ LRU Cache Doubly-Linked List + Hash Table</div>
        <div class="flow-chain" style="flex-wrap: wrap; justify-content: center;">
          <div class="flow-step-node node-blue"><span class="node-label">HEAD (Sentinel)</span><small>Most Recently Used</small></div>
          <span class="flow-arrow-separator">◄──►</span>
          <div class="flow-step-node node-green"><span class="node-label">Node: Key 1</span><small>O(1) Hash Map Reference</small></div>
          <span class="flow-arrow-separator">◄──►</span>
          <div class="flow-step-node node-purple"><span class="node-label">Node: Key 2</span><small>Pointer Handoff</small></div>
          <span class="flow-arrow-separator">◄──►</span>
          <div class="flow-step-node node-pink"><span class="node-label">TAIL (Sentinel)</span><small>Least Recently Used (Evict)</small></div>
        </div>
      </div>
    `
  }
];
