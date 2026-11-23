/**
 * lifecycle-data.js
 * End-to-End Delivery Pipeline for Java Spring Boot Microservices on Google Cloud Platform (GCP)
 * Includes: 12 Ordered Stages, SVG Icons, Responsibility Matrix, and 60-Second Cheat Sheet.
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.LIFECYCLE_PHASES = [
  { id: "all", label: "All 12 Stages", count: 12, color: "var(--text-primary)" },
  { id: "dev", label: "Phase 1: Local & Code Collaboration", count: 2, color: "#3b82f6" },
  { id: "cicd", label: "Phase 2: CI/CD & Image Governance", count: 4, color: "#8b5cf6" },
  { id: "deploy", label: "Phase 3: Helm Manifests & GKE Deploy", count: 2, color: "#10b981" },
  { id: "ops", label: "Phase 4: Apigee, Ingress, Ops & Rollback", count: 4, color: "#f97316" }
];

window.REVISION_APP_DATA.LIFECYCLE_STAGES = [
  {
    step: 1,
    id: "stage-1-local-dev",
    title: "Local Development & Bootstrapping",
    subtitle: "Spring Boot 3, Java 17+, Profile Overrides & Testcontainers",
    phase: "dev",
    phaseLabel: "Dev Phase",
    phaseBadgeColor: "#3b82f6",
    owner: "Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    whatHappens: "Developers author REST controllers, business services, and database repositories using Java 17+ and Spring Boot 3 on an IDE (IntelliJ IDEA / VS Code). The service executes locally using an isolated profile ('application-local.yml') with credentials injected via '.env' or environment variables. Supporting infrastructure (PostgreSQL, Kafka, Redis) runs locally via Docker Compose or Testcontainers for rapid, reproducible feedback cycles.",
    tools: ["Java 17 / 21", "Spring Boot 3.x", "IntelliJ IDEA / VS Code", "Maven Wrapper (mvnw)", "application-local.yml", "Testcontainers", "Docker Compose"],
    developerResponsibility: "Author modular business logic using constructor injection. Bind configuration properties via '@ConfigurationProperties' instead of scattered '@Value'. Write unit tests (JUnit 5 + Mockito) and repository tests against Testcontainers. Never hardcode local IP addresses, credentials, or localhost ports into source files or default configuration files.",
    commonPitfall: "Hardcoding localhost URLs, database passwords, or third-party API keys into the default 'application.yml' or committing a dirty '.env' file into Git. When deployed to GKE, the pod will either crash on startup or secretly connect to the wrong database environment.",
    codeSnippet: `# src/main/resources/application-local.yml
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:postgresql://localhost:5432/order_db
    username: \${DB_USERNAME:order_dev}
    password: \${DB_PASSWORD:dev_secret_only}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
server:
  port: 8080`
  },
  {
    step: 2,
    id: "stage-2-version-control",
    title: "Version Control & Code Review",
    subtitle: "Git Branching, Conventional Commits, Semantic Versioning & PR Quality",
    phase: "dev",
    phaseLabel: "Dev Phase",
    phaseBadgeColor: "#3b82f6",
    owner: "Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`,
    whatHappens: "Code changes are pushed to a remote Git repository (GitHub / GitLab / Bitbucket) on a short-lived feature branch ('feature/ORDER-101-cancel-endpoint'). Developers follow Conventional Commits ('feat: add cancel endpoint to OrderController') and open a Pull Request (PR) against 'main' or 'develop'. Automated branch protection rules enforce passing CI status checks, SonarQube quality gates, and mandatory approvals by at least two peer reviewers before merging.",
    tools: ["Git", "GitHub / GitLab / Bitbucket", "Conventional Commits", "Semantic Versioning (SemVer)", ".gitignore", "Branch Protection Rules"],
    developerResponsibility: "Keep PRs small (<400 lines) and strictly focused on a single feature or bug fix. Write descriptive Conventional Commit messages. Ensure '.gitignore' excludes 'target/', '.idea/', '.env', and OS files. Actively participate in peer reviews, checking for concurrency edge cases, N+1 JPA query antipatterns, and non-breaking REST API contracts.",
    commonPitfall: "Submitting monolithic 'mega-PRs' containing 2,500 lines touching multiple modules, or pushing breaking changes to public REST API request/response JSON schemas without versioning (/v1 -> /v2), breaking upstream mobile apps and Apigee proxies.",
    codeSnippet: `# Git Branching & Conventional Commit Workflow
git checkout -b feature/ORDER-101-cancel-endpoint
git add src/
git commit -m "feat(order): implement idempotent order cancellation endpoint

- Add CancelOrderRequest DTO and state machine validation
- Expose POST /api/v1/orders/{id}/cancel with audit logging
- Fixes #101"
git push origin feature/ORDER-101-cancel-endpoint`
  },
  {
    step: 3,
    id: "stage-3-ci-trigger",
    title: "CI Pipeline Trigger & Orchestration",
    subtitle: "Git Webhooks, Jenkins Declarative Pipeline & Ephemeral K8s Agents",
    phase: "cicd",
    phaseLabel: "CI/CD Phase",
    phaseBadgeColor: "#8b5cf6",
    owner: "DevOps & Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    whatHappens: "A Git push or PR creation triggers an HTTPS Webhook to the Jenkins controller. Jenkins reads the declarative 'Jenkinsfile' in the repository root. Rather than running directly on the controller, Jenkins dynamically provisions an ephemeral Kubernetes agent pod (via the Jenkins K8s plugin) running a specialized Maven + JDK 17 container. The agent securely checks out the code using deploy keys and starts the build stages in parallel.",
    tools: ["Jenkins 2.x Declarative Pipeline", "Git Webhook", "Jenkins Kubernetes Plugin", "Ephemeral Pod Agents", "Pipeline Syntax Validator"],
    developerResponsibility: "Maintain the declarative 'Jenkinsfile' committed in the application root repository. Define logical pipeline stages ('Checkout', 'Build & Test', 'Static Analysis', 'Docker Build', 'Artifact Push'). Ensure build stages fail fast if unit tests fail, avoiding unnecessary downstream container builds. Keep Jenkins credentials references generic.",
    commonPitfall: "Running builds directly on the static Jenkins master/controller node without ephemeral agents, causing disk exhaustion ('/var/jenkins_home' reaching 100%) and bringing down CI builds across the entire engineering department.",
    codeSnippet: `// Jenkinsfile (Declarative Pipeline with Ephemeral K8s Agent)
pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: maven-jdk17
    image: maven:3.9.6-eclipse-temurin-17-alpine
    command: ['sleep']
    args: ['99d']
    resources:
      requests: { cpu: "1000m", memory: "2Gi" }
      limits: { cpu: "2000m", memory: "4Gi" }
'''
    }
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
  }
}`
  },
  {
    step: 4,
    id: "stage-4-build-and-test",
    title: "Maven Build, Test Suites & Quality Gate",
    subtitle: "Compilation, JUnit 5/Mockito, JaCoCo Coverage & SonarQube Analysis",
    phase: "cicd",
    phaseLabel: "CI/CD Phase",
    phaseBadgeColor: "#8b5cf6",
    owner: "Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    whatHappens: "Maven runs 'mvn clean test package'. Dependencies are resolved from an internal artifact mirror (Google Artifact Registry / Nexus) to prevent supply chain tampering. The JVM executes unit tests (JUnit 5 + Mockito) and fast slice integration tests. JaCoCo records code branch coverage. SonarQube runs static application security testing (SAST), checking for OWASP Top 10 vulnerabilities, code smells, and cyclomatic complexity before stamping the quality gate as PASSED.",
    tools: ["Apache Maven 3.9+", "JUnit 5", "Mockito", "JaCoCo Coverage", "SonarQube Quality Gate", "Target Executable JAR"],
    developerResponsibility: "Fix dependency vulnerabilities in 'pom.xml' promptly using Dependency-Check. Ensure line and branch coverage exceeds team thresholds (e.g. >=80%). Eliminate SonarQube Blocker/Critical code smells. NEVER run 'mvn clean package -DskipTests' inside CI pipeline scripts to bypass broken tests.",
    commonPitfall: "Using unpinned dynamic dependency versions or range declarations (e.g. '1.2.+') in 'pom.xml', resulting in non-deterministic builds where an upstream third-party minor release published at 2 AM breaks the production build.",
    codeSnippet: `// Jenkinsfile Stage: Maven Build & SonarQube Gate
stage('Build & Unit Tests') {
  steps {
    container('maven-jdk17') {
      sh 'mvn clean test jacoco:report'
    }
  }
}
stage('SonarQube Quality Gate') {
  steps {
    container('maven-jdk17') {
      withSonarQubeEnv('GlobalSonarQube') {
        sh 'mvn sonar:sonar -Dsonar.projectKey=order-service'
      }
      timeout(time: 5, unit: 'MINUTES') {
        waitForQualityGate abortPipeline: true
      }
    }
  }
}`
  },
  {
    step: 5,
    id: "stage-5-containerization",
    title: "Containerization & Layered JAR Packaging",
    subtitle: "Multi-Stage Dockerfile, Slim JRE, Non-Root UID & Layer Caching",
    phase: "cicd",
    phaseLabel: "CI/CD Phase",
    phaseBadgeColor: "#8b5cf6",
    owner: "Developer & DevOps",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    whatHappens: "The executable JAR is converted into an OCI container image using a multi-stage 'Dockerfile'. Spring Boot's 'layertools' extracts the fat JAR into four layers: dependencies, spring-boot-loader, snapshot-dependencies, and application code. The runtime stage uses a minimal JRE base image (Temurin/Distroless Alpine), creates an unprivileged system user ('appuser', UID 10001), and copies layers in order of least-to-most frequently changed.",
    tools: ["Docker / Kaniko", "Spring Boot layertools", "Multi-stage Dockerfile", "Eclipse Temurin JRE 17 Alpine", "Non-root UID 10001", ".dockerignore"],
    developerResponsibility: "Maintain the application 'Dockerfile' in the root folder. Maintain '.dockerignore' to keep 'src/', '.git', and test files out of build context. Never run containers as root. Configure JVM container ergonomics ('-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC'). Ensure the application layer only invalidates tiny code layers (~5MB) instead of 100MB+ third-party dependencies.",
    commonPitfall: "Copying the fat JAR as a single layer ('COPY target/app.jar app.jar') and running as 'root'. Every single one-line bug fix forces Docker to re-push the entire 130MB layer over the network and violates zero-trust container security policies.",
    codeSnippet: `# Multi-Stage Dockerfile with Spring Boot 3 Layer Extraction
FROM eclipse-temurin:17-jre-alpine AS builder
WORKDIR /builder
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -u 10001
WORKDIR /app
COPY --from=builder /builder/dependencies/ ./
COPY --from=builder /builder/spring-boot-loader/ ./
COPY --from=builder /builder/snapshot-dependencies/ ./
COPY --from=builder /builder/application/ ./
USER 10001:10001
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "org.springframework.boot.loader.launch.JarLauncher"]`
  },
  {
    step: 6,
    id: "stage-6-registry",
    title: "Google Artifact Registry & CVE Scanning",
    subtitle: "Image Push, Immutable Git-SHA Tags, Vulnerability Scanning & Binary Auth",
    phase: "cicd",
    phaseLabel: "CI/CD Phase",
    phaseBadgeColor: "#8b5cf6",
    owner: "DevOps & Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    whatHappens: "The container image is tagged with the exact immutable Git commit SHA (e.g. 'sha-7b3a9c1') and pushed over TLS to Google Artifact Registry (GAR) in the target GCP region. Google Cloud Container Analysis immediately triggers automated asynchronous vulnerability scanning against the National Vulnerability Database (NVD). If Binary Authorization is enabled, cryptographic attestations confirm the image was built by authorized CI pipelines.",
    tools: ["Google Artifact Registry (GAR)", "Google Cloud Container Analysis", "Binary Authorization", "gcloud CLI", "Immutable Image Tags"],
    developerResponsibility: "Always tag images with immutable descriptors (Git Commit SHA 'sha-7b3a9c1' and SemVer 'v1.4.0'). NEVER rely on the mutable ':latest' tag for production artifacts. Monitor Artifact Registry vulnerability reports and promptly bump base images or dependency versions when Critical or High CVEs are flagged.",
    commonPitfall: "Deploying images tagged with ':latest'. Kubernetes nodes set 'imagePullPolicy: IfNotPresent', which skips pulling new images if a ':latest' image is already cached on the node. Furthermore, automated rollbacks become impossible because ':latest' has overwritten the old image tag.",
    codeSnippet: `# Jenkins Pipeline: Build and Push to Google Artifact Registry
def IMAGE_TAG = "us-central1-docker.pkg.dev/my-gcp-project/services/order-service:\${GIT_COMMIT.take(7)}"

stage('Push to Artifact Registry') {
  steps {
    sh """
      gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
      docker build -t \${IMAGE_TAG} .
      docker push \${IMAGE_TAG}
    """
  }
}`
  },
  {
    step: 7,
    id: "stage-7-configuration-manifests",
    title: "Configuration, Helm Charts & Secret Binding",
    subtitle: "Helm 3, values-<env>.yaml, GCP Secret Manager, Actuator Probes & HPA",
    phase: "deploy",
    phaseLabel: "Infra & Deploy",
    phaseBadgeColor: "#10b981",
    owner: "Developer & DevOps",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    whatHappens: "Kubernetes manifests ('Deployment', 'Service', 'ConfigMap', 'HorizontalPodAutoscaler') are packaged as a parameterized Helm chart. Environment-specific differences are cleanly separated into 'values-dev.yaml', 'values-staging.yaml', and 'values-prod.yaml'. Production secrets (passwords, tokens) are synchronized from Google Cloud Secret Manager via the External Secrets Operator. Container CPU/Memory requests and limits are explicitly enforced alongside Spring Boot Actuator health probes.",
    tools: ["Helm 3", "values-prod.yaml", "Google Cloud Secret Manager", "External Secrets Operator (ESO)", "Spring Boot Actuator", "HorizontalPodAutoscaler (HPA)"],
    developerResponsibility: "Configure environment values in 'values-<env>.yaml'. Calculate accurate CPU/memory 'requests' and 'limits' based on JVM heap sizing ('-XX:MaxRAMPercentage=75.0'). Configure Spring Boot Actuator probe endpoints: 'startupProbe' for Hibernate/Flyway initialization, 'livenessProbe' for deadlocks, and 'readinessProbe' for traffic shedding.",
    commonPitfall: "Omitting 'startupProbe' for a Spring Boot service that takes 35 seconds to warm up and run DB migrations. The default 'livenessProbe' checks at 15 seconds, decides the pod is hung, kills the container, and puts the deployment into a perpetual 'CrashLoopBackOff'.",
    codeSnippet: `# helm/templates/deployment.yaml (Probes & Sizing)
containers:
- name: order-service
  image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
  resources:
    requests: { cpu: "500m", memory: "1Gi" }
    limits:   { cpu: "1000m", memory: "2Gi" }
  startupProbe:
    httpGet: { path: /actuator/health/liveness, port: 8080 }
    failureThreshold: 30
    periodSeconds: 2
  livenessProbe:
    httpGet: { path: /actuator/health/liveness, port: 8080 }
    periodSeconds: 10
  readinessProbe:
    httpGet: { path: /actuator/health/readiness, port: 8080 }
    periodSeconds: 5`
  },
  {
    step: 8,
    id: "stage-8-gke-deployment",
    title: "Deployment to GKE & Rolling Updates",
    subtitle: "GitOps Argo CD / Helm, Zero-Downtime Rolling Update & Workload Identity",
    phase: "deploy",
    phaseLabel: "Infra & Deploy",
    phaseBadgeColor: "#10b981",
    owner: "DevOps & Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    whatHappens: "The deployment is applied to Google Kubernetes Engine (GKE) via GitOps (Argo CD reconciling the Git repository) or Helm CI deployment ('helm upgrade --install'). GKE executes a zero-downtime rolling update with 'maxSurge: 25%' and 'maxUnavailable: 0'. Workload Identity securely binds the Kubernetes 'ServiceAccount' directly to a GCP Cloud IAM service account, granting keyless access to BigQuery, Cloud Pub/Sub, or Cloud Storage.",
    tools: ["Google Kubernetes Engine (GKE)", "Argo CD GitOps", "Helm 3", "Workload Identity", "PodDisruptionBudget (PDB)"],
    developerResponsibility: "Ensure the Spring Boot service enables graceful shutdown ('server.shutdown=graceful') with 'spring.lifecycle.timeout-per-shutdown-phase=30s'. Ensure database migrations (Flyway/Liquibase) are backwards-compatible (expand-and-contract pattern) so both old and new pod versions can run concurrently during the 5-minute rolling update.",
    commonPitfall: "Deploying a destructive database column rename in the same release as application code. During the rolling update, both old and new pods run simultaneously against the same DB; old pods fail instantly on the renamed column, causing a 500 Internal Server Error spike for users.",
    codeSnippet: `# src/main/resources/application-prod.yml
# Enable Graceful Shutdown in Spring Boot 3
server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
---
# Kubernetes Rolling Update Strategy
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0`
  },
  {
    step: 9,
    id: "stage-9-apigee-gateway",
    title: "API Gateway (Apigee X) Management Layer",
    subtitle: "API Proxy, OAuth 2.0 / JWT Auth, SpikeArrest, Rate Limiting & Developer Portal",
    phase: "ops",
    phaseLabel: "Gateway & Ops",
    phaseBadgeColor: "#f97316",
    owner: "Platform API Team & Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    whatHappens: "Before external client traffic reaches the GKE cluster, it arrives at Google Cloud Apigee X. Apigee acts as the enterprise API Gateway and developer portal. An Apigee API Proxy ('/v1/orders') intercepts requests, validates OAuth 2.0 / JWT tokens or API keys, executes a 'SpikeArrest' policy (e.g. 500 req/sec) to shield backend GKE pods from micro-bursts, enforces consumer Quotas (e.g. 10,000 req/day), strips internal headers, and forwards requests across the VPC Peering bridge to the GKE Ingress.",
    tools: ["Google Cloud Apigee X", "Apigee API Proxies", "OAuth 2.0 / JWT Verification", "SpikeArrest Policy", "Quota Rate Limiting", "Apigee Developer Portal"],
    developerResponsibility: "Provide and maintain the OpenAPI / Swagger specification ('openapi.yaml') defining all REST endpoints, headers, and payload schemas. Define consumer rate-limit tier requirements (e.g. Bronze vs Gold). Ensure error response formats adhere to RFC 7807 'Problem Details' so Apigee can pass standardized client errors.",
    commonPitfall: "Failing to configure a 'SpikeArrest' policy in Apigee. A sudden burst of 20,000 requests in 2 seconds bypasses the gateway and floods the internal Spring Boot Tomcat thread pool (default 200 threads) and HikariCP connection pool (default 10 connections) before GKE HPA has time to react and scale up new pods.",
    codeSnippet: `<!-- Apigee SpikeArrest & OAuth2 Security Policy Bundle -->
<SpikeArrest async="false" continueOnError="false" enabled="true" name="SA-ProtectBackend">
    <DisplayName>Protect Spring Boot Pods from Traffic Bursts</DisplayName>
    <Rate>500ps</Rate>
    <UseEffectiveParam>true</UseEffectiveParam>
</SpikeArrest>

<!-- OAuth 2.0 Verification Policy -->
<OAuthV2 async="false" continueOnError="false" enabled="true" name="OAuth-VerifyToken">
    <Operation>VerifyAccessToken</Operation>
    <AccessToken>request.header.Authorization</AccessToken>
</OAuthV2>`
  },
  {
    step: 10,
    id: "stage-10-ingress-load-balancing",
    title: "Ingress & Cloud Load Balancing",
    subtitle: "GCP HTTPS Global Load Balancer, ManagedCertificate TLS 1.3 & Cloud Armor WAF",
    phase: "ops",
    phaseLabel: "Gateway & Ops",
    phaseBadgeColor: "#f97316",
    owner: "Platform / DevOps & Developer",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16.2 7.8l-2 6.3-6.4 2 2-6.3z"></path></svg>`,
    whatHappens: "Client and Apigee egress traffic routes through the Google Cloud External HTTPS Application Load Balancer via Anycast IP addresses. Edge Points of Presence (PoPs) terminate TLS 1.3 globally using Google-managed SSL certificates ('ManagedCertificate' CRD). Google Cloud Armor inspects requests with Layer 7 Web Application Firewall (WAF) rules against SQLi, XSS, and botnets. The load balancer dispatches traffic via Container-Native Load Balancing (Network Endpoint Groups / NEGs) directly to the target pod IPs.",
    tools: ["Google Cloud HTTPS Load Balancer", "GKE Ingress Controller", "ManagedCertificate CRD", "Cloud Armor WAF", "Network Endpoint Groups (NEG)"],
    developerResponsibility: "Configure the Kubernetes 'Service' with annotation 'cloud.google.com/neg: '{\"ingress\": true}'' to enable low-latency Container-Native Load Balancing. Instruct Spring Boot to respect reverse proxy headers ('server.forward-headers-strategy=FRAMEWORK') so redirect URLs, client IPs, and HTTPS protocols are parsed correctly.",
    commonPitfall: "Spring Boot issuing 'http://' redirect responses instead of 'https://' because it fails to read the reverse-proxy 'X-Forwarded-Proto' header sent by Google Cloud Load Balancer, trapping browser clients in an endless HTTP 301/302 redirection loop.",
    codeSnippet: `# k8s/service.yaml (NEG Container-Native Load Balancing)
apiVersion: v1
kind: Service
metadata:
  name: order-service
  annotations:
    cloud.google.com/neg: '{"ingress": true}' # Enables direct pod routing
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
  selector:
    app: order-service
---
# application-prod.yml
server:
  forward-headers-strategy: FRAMEWORK`
  },
  {
    step: 11,
    id: "stage-11-observability",
    title: "Observability, Telemetry & SRE Operations",
    subtitle: "Cloud Logging, Prometheus / GMP, OpenTelemetry Tracing & PagerDuty Alerting",
    phase: "ops",
    phaseLabel: "Gateway & Ops",
    phaseBadgeColor: "#f97316",
    owner: "Developer & SRE / Ops",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
    whatHappens: "The Spring Boot service emits structured JSON logs to 'stdout', where Google Cloud Logging agent collects and correlates them automatically. Micrometer formats application metrics into Prometheus format ('/actuator/prometheus'), scraped by Google Cloud Managed Service for Prometheus (GMP). Distributed tracing via OpenTelemetry / Google Cloud Trace propagates the W3C 'traceparent' header across Apigee, Ingress, and downstream microservices. Alerting rules trigger PagerDuty notifications when error rates or latencies breach SLO thresholds.",
    tools: ["Spring Boot Actuator", "Micrometer", "Google Cloud Logging", "Google Cloud Managed Service for Prometheus (GMP)", "Google Cloud Trace / OpenTelemetry", "PagerDuty"],
    developerResponsibility: "Log in structured JSON format with contextual metadata ('traceId', 'spanId', 'orderId', 'userId'). Instrument business metrics with Micrometer (e.g. 'Counter.builder(\"orders.placed\").register(registry)'). Author and maintain a clear, step-by-step on-call service Runbook for critical alerts.",
    commonPitfall: "Writing unstructured multi-line stack traces or printing raw sensitive Personally Identifiable Information (PII) such as credit card numbers, passwords, or Authorization headers to 'stdout', triggering compliance violations and overwhelming log indexing pipelines.",
    codeSnippet: `// Instrumenting Business Metrics with Micrometer in Spring Boot
@Service
public class OrderService {
    private final Counter orderCounter;

    public OrderService(MeterRegistry registry) {
        this.orderCounter = Counter.builder("business.orders.placed")
            .description("Total successfully placed orders")
            .tag("service", "order-service")
            .register(registry);
    }

    public Order createOrder(OrderRequest req) {
        // ... Business logic
        orderCounter.increment();
        return savedOrder;
    }
}`
  },
  {
    step: 12,
    id: "stage-12-rollback",
    title: "Rollback, Incident Response & Postmortem",
    subtitle: "Helm Rollback, GitOps Revert, Feature Flags & Blameless Postmortems",
    phase: "ops",
    phaseLabel: "Gateway & Ops",
    phaseBadgeColor: "#f97316",
    owner: "Developer, SRE & Platform",
    svgIcon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`,
    whatHappens: "If a production release causes elevated HTTP 5xx errors, memory leaks, or database deadlocks, immediate mitigation executes. SREs or developers trigger a rollback via GitOps ('git revert <commit-sha>') or direct Helm rollback command ('helm rollback order-service <previous-revision>'). Feature flags (LaunchDarkly / Unleash) allow killing buggy code paths in under 5 seconds without redeploying. Following incident recovery, the team conducts a blameless postmortem to analyze the timeline and implement preventive guardrails.",
    tools: ["Helm Rollback CLI", "GitOps 'git revert'", "LaunchDarkly / Unleash Feature Flags", "PagerDuty Incident Commander", "Blameless Postmortem Template"],
    developerResponsibility: "Know the exact single-command rollback procedure and test it in lower environments. Wrap high-risk business logic in Feature Flags so features can be toggled off instantly. Lead the blameless postmortem within 48 hours, documenting the timeline, root cause, detection gap, and actionable remediation tickets.",
    commonPitfall: "Assuming that rolling back code also rolls back database migrations! If a new release ran a destructive DB migration (e.g. dropping a column), rolling back the application code causes the old container to crash because its expected column is gone. Database migrations must always follow the backwards-compatible expand-and-contract pattern.",
    codeSnippet: `# Fast Incident Rollback Command Lines

# 1. Quick Helm Rollback to previous stable revision:
helm history order-service -n production
helm rollback order-service 42 -n production

# 2. Or GitOps Git Revert:
git revert <faulty-commit-sha>
git push origin main # Argo CD automatically redeploys previous image`
  }
];

window.REVISION_APP_DATA.LIFECYCLE_MATRIX = [
  {
    stage: "1. Local Development",
    phase: "Dev",
    developer: "Business logic, unit/slice tests, application-local.yml, Testcontainers, constructor injection.",
    platform: "Base parent POM BOM, approved JDK base runtimes, Docker desktop licenses, architecture standards.",
    files: "src/main/java/**, pom.xml, application-local.yml, .env"
  },
  {
    stage: "2. Version Control",
    phase: "Dev",
    developer: "Feature branches, descriptive Conventional Commits, peer code reviews, clean .gitignore.",
    platform: "GitHub/GitLab org, branch protection rules, code owners file, automated commit linter bot.",
    files: ".gitignore, Pull Request descriptions, Git commits"
  },
  {
    stage: "3. CI Trigger",
    phase: "CI/CD",
    developer: "Authoring project Jenkinsfile declarative stages, test triggers, fail-fast validations.",
    platform: "Jenkins master controllers, Kubernetes agent cluster, GitHub webhook integration, secrets store.",
    files: "Jenkinsfile"
  },
  {
    stage: "4. Build & Test",
    phase: "CI/CD",
    developer: "Unit & integration test suites, pom.xml dependency management, fixing SonarQube blockers.",
    platform: "SonarQube enterprise server, Artifactory/Nexus mirror caching, private maven mirrors.",
    files: "pom.xml, src/test/java/**, sonar-project.properties"
  },
  {
    stage: "5. Containerization",
    phase: "CI/CD",
    developer: "Multi-stage Dockerfile, Spring layertools, unprivileged user (UID 10001), .dockerignore.",
    platform: "Base hardened JRE container images (Temurin/Distroless), Kaniko CI daemonless builders.",
    files: "Dockerfile, .dockerignore"
  },
  {
    stage: "6. Artifact Registry",
    phase: "CI/CD",
    developer: "Tagging with immutable Git-SHA tags, inspecting CVE security scan results and updating deps.",
    platform: "Artifact Registry repository provisioning, IAM access permissions, Binary Authorization policies.",
    files: "CI build script tag args (${GIT_COMMIT})"
  },
  {
    stage: "7. Configuration & Manifests",
    phase: "Infra/Deploy",
    developer: "values-<env>.yaml overrides, CPU/RAM sizing, Spring Actuator startup/liveness/readiness probes.",
    platform: "Base Helm chart architecture, External Secrets Operator, K8s admission controllers, OPA Gatekeeper.",
    files: "helm/values-*.yaml, Secret Manager bindings"
  },
  {
    stage: "8. GKE Deployment",
    phase: "Infra/Deploy",
    developer: "Graceful shutdown settings ('server.shutdown=graceful'), backwards-compatible DB migrations.",
    platform: "GKE cluster lifecycle, VPC CNI networking, Argo CD GitOps operator, Workload Identity.",
    files: "helm/templates/*, application-prod.yml, Chart.yaml"
  },
  {
    stage: "9. API Gateway (Apigee)",
    phase: "Gateway/Ops",
    developer: "OpenAPI/Swagger specs, REST path definitions, rate limit tier requirements, error schema.",
    platform: "Apigee X organization, environments, OAuth token endpoints, global TLS, shared security flows.",
    files: "openapi.yaml, Apigee proxy XML bundle"
  },
  {
    stage: "10. Ingress & Load Balancing",
    phase: "Gateway/Ops",
    developer: "NEG service annotations, reverse-proxy headers ('server.forward-headers-strategy=FRAMEWORK').",
    platform: "GCP HTTPS Load Balancer, Google-managed SSL certificates, Cloud Armor WAF rules, DNS zones.",
    files: "k8s/service.yaml annotations, Ingress rules"
  },
  {
    stage: "11. Observability",
    phase: "Gateway/Ops",
    developer: "Structured JSON logging, Micrometer business metrics, OpenTelemetry span naming, service runbook.",
    platform: "Cloud Logging storage buckets, Prometheus GMP scraping, PagerDuty alerting infrastructure.",
    files: "logback-spring.xml, /actuator config, Runbook docs"
  },
  {
    stage: "12. Rollback & Incidents",
    phase: "Gateway/Ops",
    developer: "Triggering 'helm rollback' or 'git revert', toggling Feature Flags, leading blameless postmortem.",
    platform: "Automated canary analysis (Argo Rollouts), incident commander rota, disaster recovery failover.",
    files: "git revert, Feature flag toggles, Postmortem doc"
  }
];

window.REVISION_APP_DATA.LIFECYCLE_CHEAT_SHEET = [
  { step: 1, name: "Local Dev", rule: "Code Spring Boot 3 in JDK 17+, use Testcontainers, and keep secrets in .env/local profiles." },
  { step: 2, name: "Version Control", rule: "Work on feature branches, write Conventional Commits, and protect main with 2 PR reviews." },
  { step: 3, name: "CI Trigger", rule: "Git push fires a webhook to Jenkins, which allocates an ephemeral K8s agent pod." },
  { step: 4, name: "Build & Test", rule: "Maven compiles, runs JUnit 5 tests, and passes SonarQube quality gate before packaging JAR." },
  { step: 5, name: "Containerization", rule: "Multi-stage Dockerfile extracts Spring Boot layered JARs and runs as non-root UID 10001." },
  { step: 6, name: "Registry", rule: "Push immutable Git-SHA tagged image to Google Artifact Registry with automatic CVE scanning." },
  { step: 7, name: "Configuration", rule: "Package K8s manifests in Helm, bind Secret Manager via ESO, and wire Actuator health probes." },
  { step: 8, name: "GKE Deployment", rule: "Argo CD or Helm rolls out zero-downtime pods onto GKE backed by Workload Identity." },
  { step: 9, name: "API Gateway (Apigee)", rule: "Apigee X intercepts external traffic: OAuth 2.0 auth, SpikeArrest (500 rps), and Quotas." },
  { step: 10, name: "Ingress & LB", rule: "GCP HTTPS Load Balancer with ManagedCertificate and Cloud Armor WAF routes via NEGs." },
  { step: 11, name: "Observability", rule: "Structured JSON logs to Cloud Logging, Micrometer metrics to GMP, and traces to Cloud Trace." },
  { step: 12, name: "Rollback", rule: "Roll back in seconds with 'helm rollback' or feature flags; complete a blameless postmortem." }
];
