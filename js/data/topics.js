/**
 * topics.js
 * Central Registry of Revision Sections & Metadata.
 * In future, to add a new section or topic, simply add an entry here or in the specific data file!
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.SECTIONS = [
  {
    id: "mindmap",
    title: "Mind Maps & Quick Glance",
    shortTitle: "Mind Maps",
    icon: "🧠",
    badge: "Visual Hub",
    description: "Visual mental models for SOLID, OOPs, JMM, Spring Lifecycle, DSA patterns, Java Streams, and SQL engine."
  },
  {
    id: "java",
    title: "Core & Advanced Java",
    shortTitle: "Java Core",
    icon: "☕",
    badge: "Senior / Staff",
    description: "JVM Internals, Memory Model (JMM), Concurrency & AQS, Virtual Threads, GC Mechanics, and Java 8-21 Features."
  },
  {
    id: "streams",
    title: "Java Streams & Functional API",
    shortTitle: "Streams",
    icon: "🌊",
    badge: "25+ Coding Qs",
    description: "Stream Pipeline lifecycle, Intermediate vs Terminal ops, Collectors, Comparator chaining, and 25 top interview coding problems."
  },
  {
    id: "spring",
    title: "Spring Boot & Enterprise",
    shortTitle: "Spring Boot",
    icon: "🌱",
    badge: "Production Ready",
    description: "IoC Bean Lifecycle, CGLIB/JDK Proxies, Auto-Configuration internals, @Transactional traps, JPA/Hibernate pitfalls, Resilience."
  },
  {
    id: "sql",
    title: "SQL Engine & Query Mastery",
    shortTitle: "SQL Mastery",
    icon: "🗄️",
    badge: "20 Top Queries",
    description: "Logical Query Execution Order, B+Tree Indexing, Window Functions (DENSE_RANK, LEAD/LAG), CTEs, and 20 top interview query challenges."
  },
  {
    id: "dsa",
    title: "DSA & System Patterns",
    shortTitle: "DSA & Systems",
    icon: "⚡",
    badge: "Master Patterns",
    description: "14 Core Algorithmic Patterns, Big-O Mastery, LRU/LFU/Rate-Limiter implementations, and Monotonic Stack/Queue tricks."
  },
  {
    id: "questions",
    title: "Tricky Senior Q&A",
    shortTitle: "Tricky Q&A",
    icon: "🔥",
    badge: "Interview Traps",
    description: "In-depth questions designed for Senior/Staff engineers. Uncover compiler tricks, proxy bypasses, and concurrency hazards."
  }
];
