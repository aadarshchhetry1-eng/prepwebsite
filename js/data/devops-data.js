/**
 * devops-data.js
 * Senior / Staff Engineer Kubernetes, Docker, CI/CD, Terraform & Helm Architecture, Internals & Top Interview Scenarios
 */

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {};

window.REVISION_APP_DATA.DEVOPS_TOPICS = [
  {
    id: "k8s-control-plane-etcd-internals",
    title: "Kubernetes Control Plane Internals: API Server, etcd Raft Quorum & Level-Triggered Loops",
    category: "K8s Control Plane",
    badge: "Staff K8s Architecture",
    oneLiner: "The API Server is the only stateless gateway; controllers run infinite level-triggered reconciliation loops with informers and workqueues; etcd provides strongly consistent linearizable state via Raft quorum.",
    summary: "Kubernetes is a declarative, distributed orchestration system governed by level-triggered reconciliation loops. The Control Plane consists of the kube-apiserver (the only component communicating directly with etcd), kube-scheduler (filtering & scoring nodes), and kube-controller-manager (running control loops). State is persisted in etcd, a distributed key-value store using Raft consensus requiring (N/2)+1 quorum. Client-go uses Informers and DeltaFIFO queues to cache state locally and avoid swamping the API server.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">☸️ Kubernetes Control Plane &amp; Reconciliation Engine</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(50, 108, 229, 0.4); background: rgba(50, 108, 229, 0.08);">
            <div class="space-name" style="color: #60a5fa;">kube-apiserver (Stateless)</div>
            <div class="space-desc">Authentication, Webhooks &amp; OpenAPI Schema</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">AuthN/AuthZ ➔ Mutating Webhook ➔ Schema Validation ➔ Validating Webhook ➔ etcd commit.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">etcd v3 (Stateful Raft Quorum)</div>
            <div class="space-desc">Linearizable Key-Value Store</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Quorum: Q = floor(N/2) + 1. 3 nodes tolerate 1 failure; 5 nodes tolerate 2. MVCC with bbolt.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. API Watch</span>
            <span class="node-label">Reflector / Informer</span>
            <span class="node-sub">HTTP/2 Streaming Watch</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">2. WorkQueue</span>
            <span class="node-label">RateLimitingQueue</span>
            <span class="node-sub">Deduplicated Keys</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">3. Reconcile Loop</span>
            <span class="node-label">Observed vs Desired</span>
            <span class="node-sub">Level-Triggered State Sync</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. Node Action</span>
            <span class="node-label">kubelet (CRI/CNI/CSI)</span>
            <span class="node-sub">Container Execution</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Stateless API Gateway: kube-apiserver is the only component that touches etcd. It handles Authentication, Authorization (RBAC), Mutating Admission Webhooks, Schema Validation, and Validating Admission Webhooks before persisting to etcd.",
      "etcd Raft Consensus Invariants: Raft requires a strict majority quorum Q = floor(N/2) + 1. 3 nodes tolerate 1 failure; 5 nodes tolerate 2. Writes append to write-ahead log (WAL) and commit only after majority confirmation. Never deploy even-numbered etcd clusters (a 4-node cluster still requires 3 for quorum, offering zero additional fault tolerance over 3 nodes).",
      "Level-Triggered vs Edge-Triggered: Edge-triggered reacts only when an event fires (if the packet is lost, state stays broken). Kubernetes is Level-Triggered: controllers continuously examine the current observed state against the desired state. If a network blip occurs, the next reconciliation cycle heals the disparity.",
      "client-go Informer Pattern: To avoid hammering the API server with polling queries, controllers use Informers with an HTTP/2 long-lived watch connection. Updates enter a DeltaFIFO queue, update an in-memory Indexer (Lister cache), and push keys into a rate-limiting WorkQueue.",
      "kube-scheduler Pipeline: Two-phase scheduling: 1) Filtering (Predicates: NodeAffinity, Taints/Tolerations, Port/Resource availability); 2) Scoring (Priorities: ImageLocality, NodeResourcesBalancedAllocation) to pick the optimal node."
    ],
    codeSnippet: `// client-go Controller Level-Triggered Reconcile Loop Blueprint:
func (c *Controller) reconcile(key string) error {
    namespace, name, err := cache.SplitMetaNamespaceKey(key)
    if err != nil { return err }

    // 1. Fetch DESIRED state from local Lister cache (fast in-memory lookup)
    desired, err := c.deploymentLister.Deployments(namespace).Get(name)
    if errors.IsNotFound(err) {
        // Object was deleted: perform cleanup
        return nil
    }

    // 2. Fetch OBSERVED state of pods in cluster matching selector
    pods, err := c.podLister.Pods(namespace).List(labels.SelectorFromSet(desired.Spec.Selector.MatchLabels))
    if err != nil { return err }

    // 3. Level-Triggered Reconciliation: Compare Desired vs Observed
    diff := len(pods) - int(*desired.Spec.Replicas)
    if diff < 0 {
        // Scale OUT: create missing pods
        for i := 0; i < -diff; i++ {
            c.kubeClient.CoreV1().Pods(namespace).Create(ctx, c.buildPod(desired), metav1.CreateOptions{})
        }
    } else if diff > 0 {
        // Scale IN: delete excess pods gracefully
        for i := 0; i < diff; i++ {
            c.kubeClient.CoreV1().Pods(namespace).Delete(ctx, pods[i].Name, metav1.DeleteOptions{})
        }
    }
    return nil
}`
  },

  {
    id: "docker-cgroups-namespaces-overlayfs",
    title: "Container Runtime Deep Dive: Linux Namespaces, cgroups v2 & OverlayFS",
    category: "Container Runtime",
    badge: "Linux Kernel Internals",
    oneLiner: "Containers are unprivileged Linux host processes isolated by 7 namespaces, throttled by cgroups v2 hierarchical controllers, and layered using OverlayFS union mounts.",
    summary: "Containers are not virtual machines; there is no hypervisor or guest kernel. A container is a standard Linux host process wrapped by 7 Namespaces (providing isolation) and constrained by cgroups v2 (providing resource limits). Storage is constructed using OverlayFS, combining read-only image layers (lowerdir) with a single read-write container layer (upperdir). The OCI runtime (runc) executes standard Linux syscalls (clone, unshare, setns, pivot_root) under the direction of containerd/CRI.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🐧 Container Anatomy: Namespaces, cgroups v2 &amp; OverlayFS</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
            <div class="space-name" style="color: #fbbf24;">7 Linux Namespaces (Isolation)</div>
            <div class="space-desc">Process Virtual Boundaries</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">PID (Process IDs), NET (Virtual eth0), MNT (Mount table), IPC (Shared memory), UTS (Hostname), USER (UID mappings), CGROUP (Hierarchy).</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08);">
            <div class="space-name" style="color: #60a5fa;">cgroups v2 (Resource Metering)</div>
            <div class="space-desc">CPU, Memory &amp; I/O Throttling</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Single unified hierarchy at /sys/fs/cgroup. memory.max triggers kernel OOM Killer; cpu.max throttles CFS quota.</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-orange">
            <span class="node-badge">Layer 1: lowerdir</span>
            <span class="node-label">Base Image Layers</span>
            <span class="node-sub">Read-Only RootFS</span>
          </div>
          <div class="flow-arrow-node">➕</div>
          <div class="flow-step-node node-blue">
            <span class="node-badge">Layer 2: upperdir</span>
            <span class="node-label">Container Layer</span>
            <span class="node-sub">Read-Write CoW</span>
          </div>
          <div class="flow-arrow-node">➕</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">workdir</span>
            <span class="node-label">Atomic Staging</span>
            <span class="node-sub">Kernel Internal</span>
          </div>
          <div class="flow-arrow-node">══►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">merged</span>
            <span class="node-label">Unified Container Root</span>
            <span class="node-sub">pivot_root target</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The 7 Linux Namespaces: Namespaces isolate what a process can SEE: PID (PID 1 inside container), NET (virtual loopback and veth pair), MNT (isolated mount points via `pivot_root`), IPC (System V IPC/POSIX message queues), UTS (custom hostname), USER (maps root inside container to unprivileged UID on host), and CGROUP.",
      "cgroups v2 Architecture: cgroups restrict what a process can USE. cgroups v2 unified the fragmented v1 controllers into a single hierarchy under `/sys/fs/cgroup`. Key files: `memory.max` (hard ceiling; exceeding it invokes `mem_cgroup_out_of_memory` and SIGKILL 137), `memory.high` (throttles before killing), `cpu.max` (CFS bandwidth quota: quota period e.g. '50000 100000' = 50% CPU).",
      "OverlayFS Union Mount Mechanics: Container image layers are stacked as `lowerdir` (read-only). Mutations write to `upperdir` (read-write). If a container modifies an image file, the kernel copies the entire file from `lowerdir` into `upperdir` (Copy-on-Write / CoW) before writing. Deleting a lowerdir file creates a 'whiteout' character device (`0,0`) in upperdir.",
      "Containerd, CRI & runc: Kubelet invokes containerd via gRPC over the Container Runtime Interface (CRI). Containerd invokes `runc` (OCI reference implementation). `runc` calls `clone(CLONE_NEWPID | CLONE_NEWNET | CLONE_NEWNS ...)` to create the container process, mounts the OverlayFS root, applies seccomp filters, and exits, handing the process over to containerd-shim.",
      "Why Container Root is Dangerous: UID 0 inside a container without USER namespaces is UID 0 on the host Linux kernel! If a vulnerability (like Dirty COW or container-escape CVEs) exists in the shared kernel, root container processes can break out to the host."
    ],
    codeSnippet: `# 1. Creating a primitive container manually using Linux core utilities:
unshare --mount --uts --ipc --net --pid --fork bash

# 2. Mounting an OverlayFS root filesystem:
mount -t overlay overlay -o lowerdir=/var/lib/docker/lower,upperdir=/var/lib/docker/upper,workdir=/var/lib/docker/work /var/lib/docker/merged

# 3. Inspecting cgroups v2 limits of a container on the host:
cat /sys/fs/cgroup/kubepods.slice/kubepods-burstable.slice/memory.max
# Output: 1073741824 (1 GB limit)
cat /sys/fs/cgroup/kubepods.slice/kubepods-burstable.slice/cpu.max
# Output: 200000 100000 (2.0 vCPUs)`
  },

  {
    id: "terraform-engine-dag-state-locking",
    title: "Terraform Engine: Dependency DAG, Remote State Locking & Drift Detection",
    category: "Infrastructure as Code",
    badge: "Staff IaC Architecture",
    oneLiner: "Terraform builds an acyclic graph of dependencies executed concurrently via graph walk, using remote distributed locks to guarantee ACID-like state file mutations and 3-way state diffing.",
    summary: "Terraform treats infrastructure as a declarative Directed Acyclic Graph (DAG). During `terraform plan` and `apply`, Terraform parses HCL, walks the graph using topological sorting (Kahn's algorithm), and parallelizes non-dependent resource operations up to `-parallelism=10`. Remote backends (AWS S3 + DynamoDB, Terraform Cloud, or GCS) maintain distributed mutex locks to prevent race conditions. The 3-way reconciliation diff compares Desired HCL, Stored State, and Live Cloud State to determine Create, Update, or Destroy actions.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📐 Terraform Execution Pipeline &amp; Graph Walk</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(132, 79, 186, 0.4); background: rgba(132, 79, 186, 0.08);">
            <div class="space-name" style="color: #c084fc;">Directed Acyclic Graph (DAG)</div>
            <div class="space-desc">Topological Dependency Ordering</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">VPC ➔ Subnet ➔ Security Group ➔ EKS Cluster ➔ NodeGroup. Non-dependent nodes execute in parallel!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #f87171;">Distributed State Mutex (DynamoDB)</div>
            <div class="space-desc">LockID Hash Guard</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Acquires lock before reading state; releases lock after writing state. Blocks simultaneous CI runner applies!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-purple">
            <span class="node-badge">1. HCL Parser</span>
            <span class="node-label">Build DAG</span>
            <span class="node-sub">Interpolation Graph</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. State Refresh</span>
            <span class="node-label">Cloud API Read</span>
            <span class="node-sub">Detect Drift</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-blue">
            <span class="node-badge">3. 3-Way Diff</span>
            <span class="node-label">HCL vs State vs Reality</span>
            <span class="node-sub">Execution Plan</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">4. Graph Walk Apply</span>
            <span class="node-label">Provider API Mutate</span>
            <span class="node-sub">Write New State</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The Directed Acyclic Graph (DAG): Terraform parses all `.tf` files in a directory and builds an in-memory graph where nodes represent resources, data sources, and providers, and edges represent references (e.g. `subnet_id = aws_subnet.public.id`). Cycles (`A -> B -> A`) cause graph validation to fail immediately.",
      "Parallel Execution Walk: The graph walk executes independent nodes concurrently. The default concurrency is `-parallelism=10`. Nodes with upstream dependencies wait until their parent nodes finish successfully.",
      "The 3-Way Diff Invariant: Terraform calculates changes by comparing three states: 1) Desired State (your git `.tf` code); 2) Stored State (`terraform.tfstate` mapping HCL IDs to Cloud IDs); 3) Actual State (the live cloud resources returned by provider APIs during the refresh phase).",
      "Distributed State Locking: When using an S3 backend with DynamoDB locking, Terraform writes an item containing a unique UUID, timestamp, and who acquired the lock into the `LockID` column. If another run attempts to start, DynamoDB's conditional write fails, returning `Error acquiring the state lock`.",
      "Modern Drift & Import (TF 1.5+): Legacy `terraform import` was imperative and did not generate HCL. Terraform 1.5+ introduces declarative `import { to = ... id = ... }` blocks which can auto-generate code via `terraform plan -generate-config-out=generated.tf`."
    ],
    codeSnippet: `# Production S3 + DynamoDB Remote State Backend Architecture:
terraform {
  required_version = ">= 1.5.0"
  
  backend "s3" {
    bucket         = "corp-tf-state-prod-us-east-1"
    key            = "platform/eks-cluster.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Declarative Import Block (Terraform 1.5+):
import {
  to = aws_security_group.allow_tls
  id = "sg-0123456789abcdef0"
}

# Lifecycle Guards to prevent accidental deletion of critical state:
resource "aws_rds_cluster" "aurora_primary" {
  cluster_identifier = "prod-aurora-cluster"
  # ...
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [engine_version] # Let AWS auto-patch minor versions
  }
}`
  },

  {
    id: "helm3-template-engine-secrets-release",
    title: "Helm 3 Architecture: Go Templates, Release Secrets & 3-Way Merge",
    category: "Package Management",
    badge: "Helm 3 Internals",
    oneLiner: "Helm 3 stores release state as compressed K8s Secrets, validates values via JSONSchema, and calculates upgrades via 3-way strategic merge patch to preserve live mutations.",
    summary: "Helm 3 completely eliminated Tiller (the in-cluster root component of Helm 2), transitioning to an entirely client-side architecture that respects the calling user's Kubernetes RBAC. Helm stores each release revision as a base64 gzipped Secret directly in the release namespace. Upgrades utilize a 3-way strategic merge patch (comparing Base Chart, Current Live Cluster State, and New Proposed Chart) which prevents overwriting live changes such as Horizontal Pod Autoscaler (HPA) replica counts.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📦 Helm 3 Tillerless Architecture &amp; Release Storage</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(14, 165, 233, 0.4); background: rgba(14, 165, 233, 0.08);">
            <div class="space-name" style="color: #38bdf8;">Helm Client Engine</div>
            <div class="space-desc">Go Template Rendering</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Values Precedence: defaults (values.yaml) ➔ Parent Chart ➔ -f custom.yaml ➔ --set CLI flags. Validates against values.schema.json.</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">K8s Secrets Storage Engine</div>
            <div class="space-desc">Namespaced Release Metadata</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Stored as: sh.helm.release.v1.&lt;RELEASE&gt;.v&lt;REV&gt;. Contains gzip-compressed release JSON. Zero in-cluster daemon!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">1. Original Chart</span>
            <span class="node-label">Manifest v1</span>
            <span class="node-sub">From Release Secret</span>
          </div>
          <div class="flow-arrow-node">⚡</div>
          <div class="flow-step-node node-orange">
            <span class="node-badge">2. Live Cluster State</span>
            <span class="node-label">HPA Replicas = 10</span>
            <span class="node-sub">Out-of-band updates</span>
          </div>
          <div class="flow-arrow-node">⚡</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">3. New Proposed Chart</span>
            <span class="node-label">Manifest v2</span>
            <span class="node-sub">Rendered templates</span>
          </div>
          <div class="flow-arrow-node">══►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Strategic 3-Way Patch</span>
            <span class="node-label">Merged Update</span>
            <span class="node-sub">HPA count preserved!</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "Elimination of Tiller: Helm 2 used Tiller, a pod running with cluster-admin privileges that bypassed individual user RBAC. Helm 3 is 100% client-side; all requests to the API server use the credentials and RBAC configured in the user's local kubeconfig.",
      "Release Storage via K8s Secrets: Helm 3 stores release state as Secrets with type `helm.sh/release.v1`. A secret is created for every revision: `sh.helm.release.v1.my-service.v1`, `v2`, etc. The payload is a base64-encoded, gzip-compressed JSON object containing chart metadata, manifest YAML, and values.",
      "The 3-Way Strategic Merge Patch Invariant: In Helm 2 (2-way diff), an upgrade compared the old chart with the new chart. If an HPA dynamically scaled your pods from 2 to 10 in the cluster, Helm 2 would see `replicas: 2` in the chart and force the cluster back down to 2! Helm 3 compares Old Chart vs Live Cluster vs New Chart; because `replicas` was changed by the cluster and not changed in the chart, Helm 3 preserves the live 10 replicas.",
      "Release Hooks Lifecycle: Hooks allow running jobs at specific lifecycle points: `pre-install`, `post-install`, `pre-upgrade`, `post-upgrade`, `pre-delete`. If a hook fails and `--atomic` is passed, Helm rolls back all resources to the previous release revision.",
      "Values Precedence & Schema Enforcement: Precedence from lowest to highest: 1) Subchart `values.yaml`, 2) Parent chart `values.yaml`, 3) User supplied `-f values.yaml`, 4) `--set` CLI overrides. Modern charts enforce strict type safety using a `values.schema.json` file."
    ],
    codeSnippet: `# Decoding a Helm 3 Release Secret directly from the Kubernetes cluster:
kubectl get secret -n production sh.helm.release.v1.auth-service.v3 -o jsonpath='{.data.release}' \\
  | base64 -d | base64 -d | gunzip | jq .

# Output reveals the complete release object:
# {
#   "name": "auth-service",
#   "version": 3,
#   "info": { "status": "deployed", "first_deployed": "2026-10-01..." },
#   "chart": { "metadata": { "name": "auth-service", "version": "1.4.0" } },
#   "manifest": "--- \\napiVersion: apps/v1\\nkind: Deployment...",
#   "config": { "replicas": 3, "image": { "tag": "v1.4.0" } }
# }`
  },

  {
    id: "k8s-cni-iptables-cilium-ebpf",
    title: "Kubernetes Networking & Service Mesh: CNI Plugins, kube-proxy & Cilium eBPF",
    category: "Cloud Native Networking",
    badge: "Staff Networking Architecture",
    oneLiner: "Kubernetes enforces a flat, non-NAT Pod-to-Pod IP network; kube-proxy routes Service traffic via iptables O(N) or IPVS O(1), while Cilium eBPF bypasses conntrack at the kernel layer for wire-speed performance.",
    summary: "Kubernetes networking mandates that every Pod gets a unique, routable IP address, and all Pods can communicate with all other Pods without NAT across worker nodes. CNI (Container Network Interface) plugins (Calico, Cilium, AWS VPC CNI) configure the network namespace and routing tables. The Virtual Service IP (ClusterIP) is implemented by kube-proxy using Linux kernel packet translation. While iptables scales at O(N) linear rule traversal, modern enterprise clusters replace kube-proxy with Cilium eBPF to achieve O(1) BPF map lookups and bypass the entire TCP/IP connection tracking (conntrack) overhead.",
    visualDiagram: `
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🌐 K8s Service Routing: iptables vs IPVS vs Cilium eBPF</div>
        <div class="memory-grid-diagram">
          <div class="memory-space-block" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
            <div class="space-name" style="color: #f87171;">kube-proxy (iptables mode)</div>
            <div class="space-desc">O(N) Sequential Chain Evaluation</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">At 10,000 services (40,000 rules), every packet traverses rules one by one. Rule updates require full table rewrites!</div>
          </div>
          <div class="memory-space-block" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
            <div class="space-name" style="color: #34d399;">Cilium eBPF (kube-proxy Replacement)</div>
            <div class="space-desc">O(1) BPF Map Lookups &amp; Socket Steering</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Hooks directly into Linux socket layer (sock_ops / XDP). Bypasses iptables and conntrack tables entirely!</div>
          </div>
        </div>
        <div class="flow-chain" style="margin-top: 14px;">
          <div class="flow-step-node node-blue">
            <span class="node-badge">Pod Packet</span>
            <span class="node-label">veth0 ➔ eth0</span>
            <span class="node-sub">ClusterIP Virtual Target</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-purple">
            <span class="node-badge">eBPF Hook</span>
            <span class="node-label">bpf_sock_ops</span>
            <span class="node-sub">Translate VIP to Pod IP</span>
          </div>
          <div class="flow-arrow-node">──►</div>
          <div class="flow-step-node node-green">
            <span class="node-badge">Direct Routing</span>
            <span class="node-label">Target Pod veth</span>
            <span class="node-sub">Zero conntrack latency</span>
          </div>
        </div>
      </div>
    `,
    keyPoints: [
      "The K8s IP-per-Pod Invariant: 1) All pods can communicate with all other pods without NAT; 2) All agents on a node (kubelet) can communicate with all pods on that node; 3) The IP a pod sees for itself is the same IP that other pods see for it. Implemented via veth pairs connected to a Linux bridge or direct routing.",
      "The iptables O(N) Bottleneck: In iptables mode, kube-proxy creates chains in the `nat` table (`KUBE-SERVICES`, `KUBE-SVC-XXX`). Traffic checks every rule sequentially. In a cluster with 5,000 services and 20,000 endpoints, iptables table synchronization consumes significant CPU, causing packet drop during rapid pod scaling.",
      "IPVS vs eBPF: IPVS (IP Virtual Server) uses netfilter hash tables, improving routing lookup from O(N) to O(1). However, IPVS still relies on Linux conntrack for state tracking. Cilium eBPF goes further by attaching BPF programs to `tc` (Traffic Control) and socket operations, bypassing conntrack and netfilter entirely.",
      "NetworkPolicy Enforcement: NetworkPolicies are declarative L3/L4 firewall rules (podSelector, namespaceSelector, ipBlock). Crucially, Kubernetes DOES NOT enforce them itself! The CNI plugin (Calico, Cilium) must enforce them. If you run a basic CNI like Flannel, NetworkPolicies are silently ignored!",
      "Ingress vs Gateway API: Ingress is a single-resource L7 specification with limited multi-tenancy and vendor-specific annotations. The modern Gateway API decouples infrastructure provisioning (`GatewayClass`), cluster routing (`Gateway`), and application routing (`HTTPRoute`), natively supporting canary weights, header rewrites, and multi-tenant teams."
    ],
    codeSnippet: `# Production Zero-Trust Default-Deny NetworkPolicy:
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {} # Selects ALL pods in the namespace
  policyTypes:
    - Ingress
    - Egress
---
# Explicitly Whitelist App-to-Database Ingress:
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-payment-to-postgres
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: payment-service
      ports:
        - protocol: TCP
          port: 5432`
  }
];

window.REVISION_APP_DATA.DEVOPS_QUESTIONS = [
  {
    id: "devops-q1-oomkilled-exit-137-vs-crashloop",
    title: "1. Pod OOMKilled (Exit Code 137) vs CrashLoopBackOff Triage Runbook",
    difficulty: "Staff",
    category: "Kubernetes Troubleshooting",
    summary: "Exit Code 137 is 128 + 9 (SIGKILL sent by the Linux kernel). Distinguishing between JVM Heap OOM vs Linux cgroup Native Memory OOM.",
    problem: "A critical Java Spring Boot microservice suddenly restarts continuously with CrashLoopBackOff. 'kubectl describe pod' shows 'Last State: Terminated, Reason: OOMKilled, Exit Code: 137'. The developer insists they set '-Xmx2g' and the pod memory limit is '2Gi', so why is it dying?",
    juniorTrap: "Increasing -Xmx to 3g inside the container without raising the container cgroup limit, which causes the pod to get OOMKilled even faster!",
    interviewerIntent: "Tests understanding of container cgroup memory limits, Linux kernel OOM Killer mechanics, and JVM native memory footprint (Metaspace, Thread stacks, DirectByteBuffers, Netty, C-libraries).",
    seniorAnswer: [
      "Why Exit Code 137 Occurred: Exit code 137 = 128 + SIGKILL (9). The Linux kernel's `mem_cgroup_out_of_memory` subsystem detected that the container breached its cgroup `memory.max` limit (2Gi) and killed the process immediately.",
      "The JVM vs cgroup Trap: A JVM process memory consumption = Heap (-Xmx) + Metaspace + Thread Stacks (Xss * count) + Direct Memory (NIO/Netty) + GC overhead + JIT Code Cache + glibc malloc arenas. Setting -Xmx2g inside a 2Gi container leaves ZERO room for native memory! As soon as Netty allocates off-heap buffers or 100 threads are created (100 * 1MB = 100MB), the kernel kills the container.",
      "Heap OOM vs Container OOM: If the JVM exceeds Heap, it throws `java.lang.OutOfMemoryError: Java heap space` and generates a heap dump. The process DOES NOT return Exit Code 137 unless killed by an external signal. Exit Code 137 means the Linux host kernel terminated it before the JVM even realized memory was low.",
      "The Production Fix: 1) Use `-XX:MaxRAMPercentage=70.0` or `75.0` instead of hardcoded `-Xmx`; 2) Set `resources.limits.memory: 3Gi` and `resources.requests.memory: 3Gi` (Guaranteed QoS class) so the pod has ~1GB of breathing room for native memory; 3) Add `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps`."
    ],
    innerWorking: "When `memory.current > memory.max`, the kernel traverses all processes inside the cgroup hierarchy, calculates their `badness_score`, and sends an uninterruptible `SIGKILL`. Kubelet detects the termination reason via CRI and marks the Pod Reason as `OOMKilled`.",
    solution: `# Production Pod Resource Configuration:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-service
spec:
  template:
    spec:
      containers:
        - name: app
          image: billing:v2.1
          env:
            - name: JAVA_TOOL_OPTIONS
              value: >-
                -XX:MaxRAMPercentage=75.0
                -XX:+ExitOnOutOfMemoryError
                -XX:+UseG1GC
                -XX:NativeMemoryTracking=summary
          resources:
            requests:
              memory: "4Gi"
              cpu: "2000m"
            limits:
              memory: "4Gi" # Guaranteed QoS: prevents node-level overcommit eviction
              cpu: "2000m"`,
    warStory: "A fintech payment service crashed every hour under high traffic. Engineers bumped -Xmx from 4GB to 6GB in a 6GB container. The service crashed in 5 minutes! Native Memory Tracking revealed Netty off-heap direct byte buffers allocated 1.2GB for TLS connections, pushing memory to 7.2GB and triggering immediate kernel SIGKILL."
  },

  {
    id: "devops-q2-dns-resolution-timeout-ndots5",
    title: "2. DNS Resolution Timeouts & The 5-Second Delay in Alpine (ndots:5 Trap)",
    difficulty: "Staff",
    category: "Cloud Native Networking",
    summary: "ndots:5 in /etc/resolv.conf causes Alpine musl libc to execute 4 failed internal cluster DNS queries before querying external domains over parallel UDP.",
    problem: "Microservices deployed using Alpine Linux base images experience intermittent 5.001-second latencies when calling external third-party APIs (e.g., 'api.stripe.com'). The external API responds in 50ms when tested with curl on the host. What is causing this 5-second lag in Kubernetes?",
    juniorTrap: "Assuming network congestion or increasing HTTP client connect timeouts without investigating DNS lookups.",
    interviewerIntent: "Assesses deep knowledge of Linux resolver libraries (musl libc vs glibc), Kubernetes CoreDNS search domains, `/etc/resolv.conf` `ndots:5` mechanics, and Linux netfilter conntrack race conditions.",
    seniorAnswer: [
      "The ndots:5 Root Cause: Kubernetes sets `ndots:5` in `/etc/resolv.conf` by default. This tells the Linux resolver: 'If a query name contains fewer than 5 dots, search all local cluster domains first before querying as an absolute FQDN'.",
      "The Cascading Query Chain: `api.stripe.com` contains only 2 dots (< 5). Therefore, the container queries CoreDNS sequentially for: 1) `api.stripe.com.default.svc.cluster.local`, 2) `api.stripe.com.svc.cluster.local`, 3) `api.stripe.com.cluster.local`, 4) and finally `api.stripe.com`. That is 4 DNS round-trips for every single external HTTP request!",
      "The 5-Second Linux Conntrack Race: Alpine uses `musl libc`, which issues A and AAAA DNS queries in parallel over the same UDP socket. In the Linux kernel, netfilter connection tracking (conntrack) has a known race condition when two UDP packets arrive from the same socket simultaneously. One packet is silently dropped! The DNS resolver's timeout before retry is exactly 5 seconds, causing the 5.001s latency spike.",
      "The Remediation Strategy: 1) Append a trailing dot to external domain names in code (`https://api.stripe.com./v1/charges`), telling the resolver it is an absolute FQDN; 2) Override Pod `dnsConfig` to set `options: [{ name: ndots, value: '2' }]`; 3) Deploy **NodeLocal DNSCache** as a DaemonSet to serve queries locally over TCP without hitting conntrack limits."
    ],
    innerWorking: "CoreDNS processes millions of NXDOMAIN responses because of ndots:5. When combined with iptables NAT and UDP packet drops, the application thread blocks on `getaddrinfo()` until the 5-second kernel UDP socket retransmit fires.",
    solution: `# Remediating ndots:5 in the Pod Deployment spec:
spec:
  template:
    spec:
      dnsConfig:
        options:
          - name: ndots
            value: "2" # Any domain with >= 2 dots bypasses internal cluster search domains!
          - name: single-request-reopen # Forces separate sockets for A and AAAA queries in glibc
          - name: timeout
            value: "1"`,
    warStory: "An e-commerce company during Black Friday suffered 30% checkout failures. Tracing revealed payment calls took 5.05 seconds. The team migrated from Alpine (`musl`) to Debian-slim (`glibc`) with NodeLocal DNSCache enabled; p99 latency plummeted from 5,050ms to 8ms instantly."
  },

  {
    id: "devops-q3-node-notready-eviction-pressure",
    title: "3. Node NotReady & Eviction Pressure (DiskPressure, MemoryPressure, PIDs)",
    difficulty: "Senior",
    category: "Node Stability & Kubelet",
    summary: "Kubelet marks nodes NotReady when lease updates fail, and evicts pods when hard thresholds for Disk, Memory, or PIDs are breached.",
    problem: "In an production EKS/GKE cluster, two worker nodes suddenly flip to 'NotReady'. Workloads running on them are evicted, causing a thunderous herd on remaining nodes. 'kubectl describe node' shows 'DiskPressure: True'. How do you triage and structurally prevent this?",
    juniorTrap: "Deleting the pods manually or draining the node without fixing the underlying resource leak, which simply transfers the DiskPressure to the next node.",
    interviewerIntent: "Tests understanding of Kubelet node leases, eviction manager thresholds, container log rotation, and system-reserved memory allocations.",
    seniorAnswer: [
      "How Node Leases Work: Every node maintains a `Lease` object in the `kube-node-lease` namespace. The Kubelet heartbeats every 10 seconds. If the controller manager doesn't receive a heartbeat within `node-monitor-grace-period` (default 40s), the node is marked `NotReady`.",
      "The DiskPressure Eviction Mechanism: When available disk on the root/image filesystem drops below `evictionHard: imagefs.available < 15%` or `nodefs.available < 10%`, Kubelet's eviction manager immediately transitions the node to `DiskPressure: True` and begins killing Pods in order of QoS priority (BestEffort first, then Burstable).",
      "Common Culprits: 1) Unrotated container application logs writing to stdout/stderr stored in `/var/log/pods`; 2) Massive orphaned Docker/containerd layer caches in `/var/lib/docker/overlay2` or `/var/lib/containerd`; 3) Ephemeral storage abuse by pods writing multi-gigabyte temporary files to container root instead of mounted PVCs.",
      "Structural Prevention: 1) Configure Kubelet image garbage collection (`imageGCHighThresholdPercent: 80`, `imageGCLowThresholdPercent: 70`); 2) Configure container runtime log rotation (`max-size: 50m`, `max-file: 3`); 3) Enforce Pod `resources.limits.ephemeral-storage: 2Gi`; 4) Protect system daemons using `system-reserved` and `kube-reserved`."
    ],
    innerWorking: "Kubelet periodically polls filesystem usage via cAdvisor. When `imagefs.available` drops below the hard threshold, Kubelet deletes dead pods, unused container images, and terminates running pods ranked by priority and resource violation.",
    solution: `# /etc/kubernetes/kubelet-config.yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
# 1. Protect host OS & Kubelet from Pod resource starvation:
systemReserved:
  cpu: "500m"
  memory: "1Gi"
  ephemeral-storage: "2Gi"
kubeReserved:
  cpu: "500m"
  memory: "1Gi"
  ephemeral-storage: "2Gi"

# 2. Hard eviction triggers:
evictionHard:
  memory.available: "500Mi"
  nodefs.available: "10%"
  nodefs.inodesFree: "5%"
  imagefs.available: "15%"

# 3. Image Garbage Collection:
imageGCHighThresholdPercent: 80
imageGCLowThresholdPercent: 70`,
    warStory: "A rogue batch script printed 10 million debug lines to stdout in 20 minutes. `/var/log/pods` consumed 98% of the root disk. Kubelet entered DiskPressure and evicted 40 mission-critical services, causing a cluster-wide outage until daemon log rotation was enforced."
  },

  {
    id: "devops-q4-zero-downtime-rolling-deployments-pdb",
    title: "4. Zero-Downtime Rolling Deployments: PDB, Readiness Probes & preStop Hooks",
    difficulty: "Staff",
    category: "Deployment Strategy",
    summary: "Achieving true zero-downtime rolling updates requires coordinating readiness probes, termination grace periods, preStop sleep hooks, and PodDisruptionBudgets.",
    problem: "A company updates their Deployment via 'kubectl set image'. Despite having 10 replicas and maxSurge: 25%, users experience HTTP 502 Bad Gateway and dropped connections during every single deployment rollout. Why?",
    juniorTrap: "Assuming Kubernetes automatically waits for in-flight requests to finish before killing old pods.",
    interviewerIntent: "Assesses end-to-end understanding of the Pod termination lifecycle, Kubelet vs Ingress/kube-proxy race conditions, and graceful HTTP draining.",
    seniorAnswer: [
      "The Asynchronous Deregistration Race Condition: When a Pod is terminated, two parallel events occur: 1) The API Server notifies Kubelet to send `SIGTERM` to the container; 2) The Endpoints Controller removes the Pod IP from the Service Endpoints list, and kube-proxy / Ingress controller re-programs iptables/Nginx. Because iptables rule updates across worker nodes take 1 to 3 seconds, Ingress continues sending new HTTP requests to a Pod that is ALREADY terminating!",
      "The Critical preStop Hook Fix: You MUST configure a `preStop` hook: `exec: command: ['/bin/sh', '-c', 'sleep 15']`. When Kubelet initiates termination, it executes `preStop` FIRST. The sleep gives iptables and Ingress proxies 15 seconds to flush their routing tables and stop routing new requests to the pod BEFORE `SIGTERM` is delivered to the app.",
      "Readiness Probe Invariants: If a Deployment lacks a `readinessProbe`, Kubernetes considers a newly created Pod ready the instant its container process starts! Traffic hits the pod before Spring Boot or Node.js finishes initializing, returning immediate connection refused errors.",
      "The Rolling Parameters: Set `maxUnavailable: 0` and `maxSurge: 25%` to guarantee capacity never drops below 100%. Attach a `PodDisruptionBudget` (`minAvailable: 80%`) to protect against node drains and cluster autoscaler evictions."
    ],
    innerWorking: "During pod shutdown: Pod marked Terminating ➔ preStop hook executed ➔ Endpoints controller removes pod IP ➔ kube-proxy rewrites iptables ➔ preStop completes ➔ SIGTERM sent ➔ terminationGracePeriodSeconds countdown ➔ SIGKILL sent.",
    solution: `# Complete Zero-Downtime Deployment & PDB Architecture:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout-api
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # Create new pods before killing old ones
      maxUnavailable: 0    # NEVER reduce capacity below 100%
  template:
    spec:
      terminationGracePeriodSeconds: 45 # Give in-flight requests time to finish
      containers:
        - name: api
          image: checkout:v3.2
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"] # Drain proxy routing tables!
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
            failureThreshold: 2
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: checkout-pdb
spec:
  minAvailable: 80% # Never allow node drains to drop below 8 available replicas
  selector:
    matchLabels:
      app: checkout-api`,
    warStory: "An enterprise banking app dropped ~450 transactions every deploy. Senior management banned midday deployments. A staff engineer added a 10-second `preStop` sleep hook and `maxUnavailable: 0`. Dropped requests fell to exactly zero, restoring continuous midday delivery."
  },

  {
    id: "devops-q5-statefulsets-vs-deployments-persistent-identity",
    title: "5. StatefulSets vs Deployments: Distributed Database & Sticky Identity",
    difficulty: "Senior",
    category: "Kubernetes Storage & Workloads",
    summary: "StatefulSets provide sticky network identity (ordinal naming), ordered startup/shutdown, and dedicated volumeClaimTemplates for distributed stateful systems.",
    problem: "Why can you NOT run Kafka, Elasticsearch, or PostgreSQL on standard Kubernetes Deployments using a shared PersistentVolumeClaim, and how does StatefulSet solve storage binding and peer discovery?",
    juniorTrap: "Believing that a Deployment with a shared ReadWriteMany NFS volume is suitable for a distributed SQL/NoSQL cluster.",
    interviewerIntent: "Tests understanding of distributed consensus requirements (stable network IDs, dedicated disk IOPS, split-brain prevention, and Headless Services).",
    seniorAnswer: [
      "Why Deployments Fail for Databases: Deployments treat pods as stateless, interchangeable cattle. 1) Random hash names (`app-6b8f...`) mean peers cannot maintain persistent cluster topology; 2) Deployments share a single PVC across replicas; databases (e.g. PostgreSQL or Kafka) writing to the same filesystem will corrupt the transaction log immediately.",
      "Stable Ordinal Identity: StatefulSets assign predictable, zero-indexed ordinal names: `kafka-0`, `kafka-1`, `kafka-2`. If `kafka-1` crashes, its replacement is guaranteed to be named `kafka-1`.",
      "Headless Service Discovery: StatefulSets require a Headless Service (`clusterIP: None`). CoreDNS creates individual SRV and A records for every pod: `kafka-0.kafka-headless.production.svc.cluster.local`. Nodes discover peers directly without passing through a virtual load balancer.",
      "Dedicated volumeClaimTemplates: Instead of pointing to an existing PVC, a StatefulSet defines a `volumeClaimTemplate`. For every replica ordinal `i`, Kubernetes automatically provisions a dedicated PersistentVolume (`data-kafka-0`, `data-kafka-1`). If pod `kafka-1` is rescheduled to a different physical host, the CSI re-attaches that exact same EBS/GPD volume to the new host!"
    ],
    innerWorking: "The StatefulSet controller manages pod ordinals monotonically: pods start in order (0, then 1, then 2) and terminate in reverse order (2, then 1, then 0). When a pod terminates, its PVC is intentionally NOT deleted to prevent data loss.",
    solution: `# Production StatefulSet for a Distributed Cluster:
apiVersion: v1
kind: Service
metadata:
  name: kafka-headless
spec:
  clusterIP: None # HEADLESS SERVICE: Gives each pod a stable DNS entry
  selector:
    app: kafka
  ports:
    - name: peer
      port: 9092
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: "kafka-headless"
  replicas: 3
  podManagementPolicy: OrderedReady # Startup 0 ➔ 1 ➔ 2; Shutdown 2 ➔ 1 ➔ 0
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
        - name: broker
          image: kafka:3.5
          ports:
            - containerPort: 9092
          volumeMounts:
            - name: data
              mountPath: /var/lib/kafka/data
  volumeClaimTemplates: # DEDICATED PVC PER ORDINAL POD
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "gp3-encrypted"
        resources:
          requests:
            storage: 200Gi`,
    warStory: "A startup ran MongoDB on a Deployment with an AWS EFS (NFS) share. File lock contention across 3 pods corrupted the WiredTiger database catalog during peak traffic, requiring 14 hours of data recovery from S3 snapshots."
  },

  {
    id: "devops-q6-cni-ip-exhaustion-aws-vpc-cni",
    title: "6. CNI IP Address Exhaustion in AWS EKS / GCP GKE",
    difficulty: "Staff",
    category: "Cloud Native Networking",
    summary: "AWS VPC CNI assigns real VPC IPv4 addresses to Pods, hitting ENI and EC2 instance limits and blocking pod creation.",
    problem: "Your company's AWS EKS cluster fails to scale during a marketing spike. Auto-scaling adds new nodes, but new Pods remain stuck in 'ContainerCreating' with error: 'FailedCreatePodSandBox: failed to assign an IP address to container'. The subnet has available IPs. What is the root cause?",
    juniorTrap: "Assuming that Kubernetes worker nodes can host an arbitrary number of Pods regardless of EC2 instance type.",
    interviewerIntent: "Assesses deep knowledge of AWS VPC CNI, secondary ENI attachment limits, IP warm pools, and prefix delegation.",
    seniorAnswer: [
      "How AWS VPC CNI Operates: Unlike overlay networks (like Flannel or Calico VXLAN) which use virtual pod subnets, AWS VPC CNI allocates real, routable IPv4 addresses directly from your AWS VPC subnet.",
      "The ENI & Secondary IP Ceiling: Each EC2 instance type has a hard hardware limit on the number of Elastic Network Interfaces (ENIs) and secondary IPv4 addresses it can attach. For example, an `m5.large` supports at most 3 ENIs with 10 IPs per ENI = 30 total IP addresses. Subtract host IPs, and the node can run at most 29 Pods!",
      "The Warm Pool Trap: `aws-vpc-cni` maintains a pre-allocated pool of warm IPs (`WARM_IP_TARGET`). If multiple nodes spawn simultaneously, the daemonset reserves dozens of IPs per node, completely exhausting the VPC subnet even if pods aren't using them.",
      "The Enterprise Fix - Prefix Delegation: Enable **Prefix Delegation** (`ENABLE_PREFIX_DELEGATION=true`). Instead of allocating single `/32` IP addresses to an ENI, AWS assigns entire `/28` IPv4 CIDR blocks (16 IPs per slot). This increases an instance's pod density to 110 pods without exhausting ENIs or subnet space."
    ],
    innerWorking: "Kubelet queries the CNI plugin via RPC during the `CreatePodSandbox` phase. The plugin calls AWS EC2 `AssignPrivateIpAddresses`. If the instance has hit its max ENI limit, the API call fails, leaving the Pod in `ContainerCreating`.",
    solution: `# Enabling Prefix Delegation on AWS VPC CNI:
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true
kubectl set env daemonset aws-node -n kube-system WARM_PREFIX_TARGET=1

# Verify node max-pod limit increase:
# A c5.large now supports up to 110 pods instead of the previous 29-pod limit!
kubectl get nodes -o custom-columns=NAME:.metadata.name,PODS:.status.allocatable.pods`,
    warStory: "A SaaS company divided a `/20` VPC subnet into three `/24` subnets (250 IPs each). As the cluster grew to 15 nodes, the AWS VPC CNI warm pool pre-allocated all 250 IPs. New microservices failed to schedule for 3 hours until Prefix Delegation and a secondary CIDR were provisioned."
  },

  {
    id: "devops-q7-terraform-state-lock-stuck-recovery",
    title: "7. Terraform State Lock Stuck: Safe Recovery Runbook & Blast Radius",
    difficulty: "Senior",
    category: "Infrastructure as Code",
    summary: "Recovering safely from 'Error acquiring the state lock' using DynamoDB LockID inspection without causing concurrency corruption.",
    problem: "A GitHub Actions CI/CD deployment runner was terminated abruptly due to a timeout. The next deployment fails with: 'Error acquiring the state lock: ConditionalCheckFailedException... Lock Info: ID: 3a9f4c82-...' What is the exact sequence of steps to safely resolve this without corrupting state?",
    juniorTrap: "Immediately running 'terraform force-unlock' without verifying if another engineer or background pipeline is actively writing to state.",
    interviewerIntent: "Tests operational discipline in distributed state management, remote lock debugging, and recovery verification.",
    seniorAnswer: [
      "The Concurrency Risk: Terraform uses DynamoDB conditional writes (`attribute_not_exists(LockID)`) to enforce a distributed mutex. If you forcefully break the lock while another process is actively mutating cloud resources, the state file will desynchronize, causing orphan resources and catastrophic drift.",
      "Step 1 - Triage the Lock Metadata: Read the error output: it displays the `Lock Info` object containing `ID` (UUID), `Path` (state file key), `Operation` (Apply/Plan), `Who` (user or CI runner hostname), and `Created` (timestamp).",
      "Step 2 - Verify Process Liveness: Check the CI/CD pipeline dashboard and runner host. Confirm 100% that the runner with that hostname and process ID is dead, canceled, or terminated.",
      "Step 3 - Release Lock via Terraform CLI: Execute `terraform force-unlock <LOCK-ID>`. NEVER delete the item directly in DynamoDB console if CLI is available, because the CLI validates state integrity.",
      "Step 4 - State Consistency Validation: Run `terraform plan` immediately after unlocking. Verify that the refreshed state matches cloud reality and that no half-baked resource mutations occurred."
    ],
    innerWorking: "DynamoDB backend stores an item where `LockID = <bucket>/<state-path>-md5`. When terraform starts, it executes `PutItem` with a condition expression. `force-unlock` issues a `DeleteItem` targeting that exact LockID.",
    solution: `# Safe Terraform Lock Recovery Workflow:

# 1. Inspect the error output:
# "Lock Info: ID: 8bf2e4a1-10c3-4d89-9b4e-287df5a23081"
# "Who: runner@github-actions-worker-04"
# "Created: 2026-11-20 14:22:10 UTC"

# 2. Once verified worker-04 is dead, unlock:
terraform force-unlock -force 8bf2e4a1-10c3-4d89-9b4e-287df5a23081

# 3. Verify state integrity by running a plan with refresh:
terraform plan -refresh-only`,
    warStory: "Two engineers ran `terraform apply` concurrently on their laptops. One engineer saw the lock error and executed `force-unlock` immediately. Both processes applied changes at the same time: AWS resources were created, but one process overwrote the other's state file, leaving 12 production RDS read-replicas orphaned."
  },

  {
    id: "devops-q8-terraform-drift-detection-import",
    title: "8. Terraform Drift Detection & Importing Pre-Existing Cloud Resources",
    difficulty: "Staff",
    category: "Infrastructure as Code",
    summary: "Reconciling state drift with -refresh-only and adopting unmanaged cloud resources using modern Terraform 1.5+ declarative import blocks.",
    problem: "During an outage, an engineer manually created an AWS S3 bucket and edited an existing IAM Role in the AWS console. Now running 'terraform apply' threatens to destroy the IAM changes and fails to adopt the S3 bucket with 'Resource already exists'. How do you cleanly adopt and reconcile this?",
    juniorTrap: "Running 'terraform import' imperatively from the CLI and manually hacking together HCL code that doesn't match the imported state.",
    interviewerIntent: "Assesses mastery of Terraform state reconciliation, the modern 3-way diff, and Terraform 1.5+ declarative code generation.",
    seniorAnswer: [
      "Reconciling the IAM Role Drift: Run `terraform plan -refresh-only`. This tells Terraform: 'Do NOT generate an infrastructure change plan; only update the local `terraform.tfstate` with the latest attributes from the AWS API'. You then update your git `.tf` code to include the new IAM policies so future plans are clean.",
      "Adopting the Unmanaged S3 Bucket (Terraform 1.5+ Way): Legacy `terraform import` was imperative and error-prone. Modern Terraform 1.5+ uses declarative `import` blocks directly inside your HCL.",
      "Automated HCL Code Generation: Define `import { to = aws_s3_bucket.data; id = 'corp-analytics-bucket' }` in a file. Run `terraform plan -generate-config-out=generated.tf`. Terraform inspects the live AWS bucket and automatically writes syntactically valid HCL into `generated.tf`!",
      "Final Execution: Review the generated HCL, refine attribute definitions, and run `terraform apply`. Terraform marks the resource as managed with ZERO downtime and zero resource destruction."
    ],
    innerWorking: "Terraform 1.5+ engine combines the import block with provider schemas. It reads the cloud API, maps API responses into state attributes, and executes a code synthesizer that outputs idiomatic HCL matching the resource state.",
    solution: `# Step 1: Add import block in import.tf:
import {
  to = aws_s3_bucket.analytics_bucket
  id = "corp-analytics-prod-data"
}

# Step 2: Generate HCL automatically from live AWS resource:
# terraform plan -generate-config-out=generated_s3.tf

# Step 3: Inspect generated_s3.tf:
resource "aws_s3_bucket" "analytics_bucket" {
  bucket        = "corp-analytics-prod-data"
  force_destroy = false
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Step 4: Apply plan (0 to add, 0 to change, 0 to destroy, 1 to import):
# terraform apply`,
    warStory: "A production engineer used legacy CLI import for a DynamoDB table with 500 million rows. They misconfigured the HCL partition key attribute name. When they ran apply, Terraform planned to destroy and recreate the table, nearly wiping out the company's entire transaction history."
  },

  {
    id: "devops-q9-helm-release-stuck-pending-upgrade",
    title: "9. Helm 3 Release Stuck in 'pending-upgrade' or 'pending-install'",
    difficulty: "Senior",
    category: "Package Management",
    summary: "Understanding Helm release secrets lifecycle, why interrupted upgrades lock releases, and surgical recovery techniques.",
    problem: "A deployment pipeline was terminated mid-flight during a Helm upgrade. Now, all future Helm commands fail with: 'Error: another operation (install/upgrade/rollback) is in progress'. Running 'helm rollback' also fails with the same error. How do you recover?",
    juniorTrap: "Running 'helm uninstall' or deleting the entire Kubernetes namespace, destroying production data volumes and secrets!",
    interviewerIntent: "Tests understanding of Helm 3 storage backend mechanics (Kubernetes Secrets), release state machine, and disaster recovery.",
    seniorAnswer: [
      "Why the Release is Locked: Helm 3 maintains release history in Kubernetes Secrets named `sh.helm.release.v1.<RELEASE_NAME>.v<REVISION>`. When an upgrade starts, Helm creates a new revision secret with status `pending-upgrade`. If the client disconnects before completion, the status is never updated to `deployed` or `failed`. To prevent race conditions, Helm refuses to execute any new operations on a pending release.",
      "Why helm rollback Fails: `helm rollback` is itself a Helm operation! Because the release is locked in `pending-upgrade`, the rollback command is also rejected.",
      "The Surgical Recovery Runbook: 1) Identify the failed revision using `helm history <release>`; 2) Inspect the release secrets: `kubectl get secrets -n <ns> -l owner=helm,name=<release>`; 3) Delete ONLY the specific Secret corresponding to the failed pending revision (`kubectl delete secret sh.helm.release.v1.<release>.v<failed_rev>`); 4) Helm immediately falls back to the previous revision which is marked `deployed`.",
      "Prevention via CI Flags: Always pass `--atomic --timeout 5m` in automated CI/CD pipelines. If the upgrade times out or fails, Helm automatically cleans up and rolls back to the prior deployed revision."
    ],
    innerWorking: "Helm uses client-side optimistic locking. Before writing, it checks if the latest revision secret has status `pending-*`. Deleting the pending secret leaves the previous stable revision as the latest known revision in the secret history.",
    solution: `# Diagnostic and Recovery Shell Script:
RELEASE="auth-service"
NAMESPACE="production"

# 1. View release history:
helm history $RELEASE -n $NAMESPACE
# REVISION   STATUS            CHART               APP VERSION   DESCRIPTION
# 4          deployed          auth-service-1.2.0  1.2.0         Install complete
# 5          pending-upgrade   auth-service-1.3.0  1.3.0         Upgrade in progress...

# 2. Delete the STUCK revision secret:
kubectl delete secret -n $NAMESPACE sh.helm.release.v1.\${RELEASE}.v5

# 3. Verify history now points to revision 4:
helm history $RELEASE -n $NAMESPACE

# 4. Re-run upgrade safely with --atomic:
helm upgrade $RELEASE ./charts/auth-service -n $NAMESPACE --atomic --timeout 5m`,
    warStory: "A junior engineer faced a stuck `pending-upgrade` on an Elasticsearch Helm chart. Unable to run `helm upgrade`, they ran `helm uninstall`. The deletion wiped out all PersistentVolumeClaims, destroying 4TB of logging data before the team could intervene."
  },

  {
    id: "devops-q10-docker-multistage-builds-layer-caching",
    title: "10. Docker Multi-Stage Builds & Layer Caching Optimization",
    difficulty: "Senior",
    category: "Container Optimization",
    summary: "Architecting minimal, secure production container images (<150MB) with BuildKit cache mounts and layered JAR extraction.",
    problem: "A Java Spring Boot Docker image builds in 12 minutes on CI/CD and produces a 1.4 GB image. Every single code commit re-downloads all Maven dependencies from scratch. How do you re-engineer the Dockerfile to build in <30 seconds and reduce image size to <180 MB?",
    juniorTrap: "Copying the entire source repository ('COPY . .') before running dependency downloads, completely invalidating the Docker layer cache on every commit.",
    interviewerIntent: "Assesses deep knowledge of Docker storage layers, cache invalidation rules, BuildKit cache mounts, multi-stage pipelines, and distroless runtime images.",
    seniorAnswer: [
      "The Layer Cache Invalidation Rule: Docker caches each instruction line. If files referenced in a `COPY` instruction change, that layer and EVERY SUBSEQUENT LAYER must be completely rebuilt. Copying `COPY . .` first invalidates the cache on every single line of code change.",
      "Step 1 - Dependency Layering: Copy ONLY `pom.xml` / `build.gradle` first, and run `mvn dependency:go-offline` or `gradle dependencies`. This layer is cached and will NOT re-run unless dependencies in `pom.xml` actually change!",
      "Step 2 - BuildKit Cache Mounts: Use BuildKit `--mount=type=cache,target=/root/.m2` to share the local package cache across builds even when dependencies change.",
      "Step 3 - Spring Boot Layered JARs: Spring Boot 2.3+ supports layered JAR extraction: `java -Djarmode=layertools -jar app.jar extract`. This splits the artifact into 4 folders: `dependencies`, `spring-boot-loader`, `snapshot-dependencies`, and `application`. Third-party dependencies rarely change and remain permanently cached!",
      "Step 4 - Minimal Runtime Distroless Base: The build stage uses a full JDK (`eclipse-temurin:21-jdk`). The runtime stage uses `gcr.io/distroless/java21-debian12`. Distroless contains zero package managers, no shell (`/bin/sh`), and no curl, reducing CVE attack surface by 95% and dropping image size to ~150MB."
    ],
    innerWorking: "BuildKit creates a content-addressable DAG of build steps. Non-dependent branches run concurrently. Layered JARs ensure that 90% of the byte size (third-party dependencies) lives in an immutable bottom layer that never re-pushes to the container registry.",
    solution: `# Syntax=docker/dockerfile:1.4
# STAGE 1: Dependency resolution & build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# 1. Cache dependencies independently of source code:
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN --mount=type=cache,target=/root/.m2 ./mvnw dependency:go-offline -B

# 2. Build application:
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw clean package -DskipTests

# 3. Extract Spring Boot layered JAR:
WORKDIR /workspace/target
RUN java -Djarmode=layertools -jar *.jar extract

# STAGE 2: Ultra-minimal production runtime
FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app

# Copy layers from least frequently changed to most frequently changed:
COPY --from=builder /workspace/target/dependencies/ ./
COPY --from=builder /workspace/target/spring-boot-loader/ ./
COPY --from=builder /workspace/target/snapshot-dependencies/ ./
COPY --from=builder /workspace/target/application/ ./

USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]`,
    warStory: "A high-velocity engineering team pushed 100 images a day with a 1.2GB image. Registry storage costs hit $14,000/month and deployment rollouts took 8 minutes per node. Adopting multi-stage distroless and layered JARs cut image size to 142MB and deploy pull times to 4 seconds."
  },

  {
    id: "devops-q11-container-security-rootless-seccomp",
    title: "11. Container Security Hardening: Rootless, SecComp & Read-Only RootFS",
    difficulty: "Senior",
    category: "Container Security",
    summary: "Preventing container breakouts and privilege escalation using non-root UIDs, dropped Linux capabilities, seccomp filters, and read-only filesystems.",
    problem: "A container security audit flags your production Kubernetes workloads for failing SOC2 / PCI-DSS compliance because pods run with root privileges and writable filesystems. How do you harden the workload at both Dockerfile and Kubernetes securityContext layers?",
    juniorTrap: "Adding 'USER 1000' in Dockerfile without dropping capabilities or disallowing privilege escalation in Kubernetes.",
    interviewerIntent: "Assesses depth of knowledge in Linux kernel security boundaries, Linux capabilities (`CAP_*`), seccomp syscall filtering, and container immutability.",
    seniorAnswer: [
      "The Kernel Attack Surface: All containers share the single Linux host kernel. If a process runs as root (UID 0) inside a container, a kernel vulnerability or misconfigured capability (e.g. `CAP_SYS_ADMIN`, `CAP_DAC_OVERRIDE`) enables full host takeover.",
      "Enforcing Non-Root: Specify `runAsNonRoot: true` and `runAsUser: 10001` in the pod `securityContext`. Kubernetes blocks the pod from starting if the container image attempts to run as UID 0.",
      "Dropping ALL Capabilities: Linux divides root privileges into ~40 granular capabilities. By default, Docker grants ~14 capabilities (e.g. `CAP_CHOWN`, `CAP_NET_RAW`). Production apps should specify `capabilities: drop: ['ALL']` and add back only strictly necessary ones (if any).",
      "Read-Only Root Filesystem: Set `readOnlyRootFilesystem: true`. If an attacker exploits a remote code execution (RCE) vulnerability, they cannot download shell scripts, compile rootkits, or alter binary files. For apps that require temporary file writes, mount an ephemeral `emptyDir` on `/tmp`."
    ],
    innerWorking: "Seccomp (Secure Computing Mode) intercepts system calls. The `RuntimeDefault` profile blocks ~300 dangerous syscalls (like `reboot`, `sys_chroot`, `keyctl`) before they ever reach the Linux kernel.",
    solution: `# Fully Hardened Production Pod SecurityContext:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-gateway
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
        seccompProfile:
          type: RuntimeDefault # Blocks risky Linux syscalls
      containers:
        - name: gateway
          image: gateway:v1.0
          securityContext:
            allowPrivilegeEscalation: false # Prevents setuid binaries
            readOnlyRootFilesystem: true    # Immutable container root
            capabilities:
              drop:
                - ALL                       # Drop every Linux capability!
          volumeMounts:
            - name: tmp-dir
              mountPath: /tmp
      volumes:
        - name: tmp-dir
          emptyDir:
            sizeLimit: 100Mi # Ephemeral scratch space in RAM`,
    warStory: "An attacker exploited an unauthenticated Log4j RCE vulnerability in an internet-facing service. Because the container was configured with `readOnlyRootFilesystem: true` and `capabilities: drop: ['ALL']`, the attacker's script failed to write cryptocurrency mining payloads to disk, neutralizing the attack completely."
  },

  {
    id: "devops-q12-k8s-networkpolicies-default-deny-zero-trust",
    title: "12. Kubernetes NetworkPolicies: Default-Deny & Zero-Trust Microsegmentation",
    difficulty: "Staff",
    category: "Cloud Native Networking",
    summary: "Architecting a zero-trust namespace security model with default-deny Ingress/Egress and CNI enforcement requirements.",
    problem: "By default, any pod in a Kubernetes cluster can establish TCP connections with any other pod across any namespace. How do you implement a Zero-Trust Network Policy architecture, and why do policies silently fail on some clusters?",
    juniorTrap: "Assuming NetworkPolicies work out-of-the-box on every Kubernetes cluster without verifying that the CNI plugin enforces them.",
    interviewerIntent: "Tests understanding of CNI network policy controllers, the Default-Deny paradigm, namespace boundary enforcement, and egress filtering.",
    seniorAnswer: [
      "The CNI Prerequisite Trap: Kubernetes NetworkPolicy is purely an API resource; Kubernetes itself DOES NOT enforce it! A network plugin with a NetworkPolicy controller (e.g. Calico, Cilium, or AWS VPC CNI with network policy agent) MUST be installed. If you run Flannel, NetworkPolicies are silently ignored with zero error messages!",
      "The Default-Deny Architecture: Always begin by applying a `default-deny-all` NetworkPolicy to every namespace. This isolates the entire namespace, rejecting all inbound (Ingress) and outbound (Egress) connections.",
      "Explicit Ingress Microsegmentation: Whitelist incoming traffic based on `podSelector` and `namespaceSelector`. For example, the Postgres database pod should accept port 5432 ONLY from pods labeled `app: order-service`.",
      "The Egress DNS Trap: When you configure default-deny Egress, Pods CANNOT resolve DNS! You MUST explicitly whitelist Egress on UDP/TCP port 53 to the `kube-dns` / CoreDNS pods in the `kube-system` namespace, or all outbound calls will fail with hostname resolution errors."
    ],
    innerWorking: "Calico or Cilium translates NetworkPolicy YAML into kernel firewall rules (iptables or eBPF tail calls). In Cilium, eBPF maps filter packets at the network interface before Linux socket buffers are even allocated.",
    solution: `# Step 1: Enforce Default-Deny for all Ingress and Egress:
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: billing
spec:
  podSelector: {} # Targets every pod in the billing namespace
  policyTypes:
    - Ingress
    - Egress
---
# Step 2: Explicitly allow DNS egress (Required for cluster networking!):
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: billing
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53`,
    warStory: "A compromised frontend pod was used by attackers to scan the internal network. Because the cluster lacked NetworkPolicies, the attacker reached internal Redis caches containing session tokens. Implementing Default-Deny microsegmentation stopped lateral movement across namespaces."
  },

  {
    id: "devops-q13-ingress-502-bad-gateway-rolling-deployment",
    title: "13. Ingress 502 Bad Gateway / Connection Refused During Pod Rollouts",
    difficulty: "Senior",
    category: "Ingress & Traffic Routing",
    summary: "Solving race conditions between Kubelet pod termination and Ingress upstream deregistration using preStop hooks and Nginx proxy settings.",
    problem: "During a rolling deployment of a high-traffic e-commerce checkout service, Nginx Ingress Controller logs show sporadic HTTP 502 Bad Gateway errors for ~3 seconds. No pods crashed. Why did Nginx route requests to a dead pod?",
    juniorTrap: "Assuming that Nginx Ingress instantly knows when a pod is dead the moment Kubelet terminates it.",
    interviewerIntent: "Assesses understanding of Ingress Controller architecture, endpoint slice propagation latency, and TCP connection draining.",
    seniorAnswer: [
      "The Propagation Delay Breakdown: When a pod is deleted: 1) API server marks pod as terminating; 2) EndpointSlice controller detects this and updates EndpointSlice; 3) Ingress controller receives watch event and reloads/updates internal lua upstream balance table. This sequence takes anywhere from 500ms to 2,000ms under heavy cluster load.",
      "The Race Condition: During those 2 seconds, Nginx's upstream table STILL lists the old pod's IP as healthy! If Kubelet terminates the container process immediately upon receiving the delete event, incoming TCP SYNs sent by Nginx hit a dead socket, generating `ECONNREFUSED` and HTTP 502.",
      "The Fix - Lifecycle preStop Hook: Introduce a `preStop` hook: `sleep 15`. The container process continues listening on its port and accepting traffic for 15 seconds while Nginx safely removes the IP from its upstream pools.",
      "Ingress Retry Configuration: Configure Nginx Ingress annotations: `nginx.ingress.kubernetes.io/proxy-next-upstream: 'error timeout invalid_header http_502 http_503'`. If an upstream pod fails, Nginx immediately retries the request against another healthy pod transparently."
    ],
    innerWorking: "Nginx Ingress controller uses Lua-based dynamic upstreams to avoid reloading worker processes. However, network latency and client-go watch queues introduce an inescapable delay before the IP disappears from the upstream shared memory pool.",
    solution: `# Ingress Annotations to transparently retry upstream connection drops:
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: checkout-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-next-upstream: "error timeout http_502 http_503"
    nginx.ingress.kubernetes.io/proxy-next-upstream-tries: "3"
    nginx.ingress.kubernetes.io/proxy-next-upstream-timeout: "5"
spec:
  rules:
    - host: checkout.corp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: checkout-service
                port:
                  number: 8080`,
    warStory: "A flash sale saw 10,000 requests/sec. An autoscaling event scaled down 5 pods. Because there was no `preStop` sleep, Nginx routed 420 requests to dead sockets, producing 420 customer checkout failures in 3 seconds until `proxy-next-upstream` and `preStop: sleep 10` were deployed."
  },

  {
    id: "devops-q14-argocd-gitops-outofsync-loop-selfhealing",
    title: "14. GitOps ArgoCD OutOfSync Loop & Self-Healing Mutation Conflicts",
    difficulty: "Staff",
    category: "GitOps & CD Architecture",
    summary: "Resolving GitOps reconciliation thrashing caused by in-cluster mutating webhooks, HPAs, and ignoreDifferences configurations.",
    problem: "An ArgoCD Application is configured with automated self-healing. Suddenly, the application enters an infinite OutOfSync / Sync thrashing loop. The diff shows ArgoCD fighting over 'spec.replicas' and an injected mutating webhook sidecar. How do you resolve this?",
    juniorTrap: "Disabling automated self-healing in ArgoCD or hardcoding dynamic cluster values into Git.",
    interviewerIntent: "Tests mastery of GitOps principles, declarative state purity, mutating admission controllers, and ArgoCD `ignoreDifferences` CRD specs.",
    seniorAnswer: [
      "The Git vs In-Cluster Mutation Conflict: GitOps dictates that Git is the single source of truth. However, in Kubernetes, two components mutate objects at runtime: 1) Horizontal Pod Autoscaler (HPA), which mutates `spec.replicas`; 2) Mutating Admission Webhooks (e.g. Istio sidecar injector, Vault agent injector), which mutate `spec.template.spec.containers`.",
      "Why the Loop Happens: Git says `replicas: 2`. HPA scales the cluster to `replicas: 8`. ArgoCD detects a diff, triggers self-healing, and resets the cluster back to `replicas: 2`! HPA notices high CPU and scales back to 8. This loop repeats infinitely, causing extreme cluster instability.",
      "The Solution - Slicing Ownership: 1) Omit `spec.replicas` from your Git Deployment manifest completely, allowing HPA to own the field; 2) Configure `ignoreDifferences` in the ArgoCD `Application` manifest for fields owned by controllers or mutating webhooks.",
      "Using jqPathExpressions: Tell ArgoCD's reconciliation engine to ignore specific JSON pointers or paths during diff computation."
    ],
    innerWorking: "ArgoCD executes a 3-way diff between Git Target, Live Cluster, and previous synced state. If an unignored field differs, ArgoCD marks the application `OutOfSync`. If `selfHeal: true` is enabled, it sends a PATCH request to force live state back to Git.",
    solution: `# ArgoCD Application CRD with ignoreDifferences:
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/corp/gitops-manifests.git'
    path: apps/order-service
    targetRevision: main
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
  ignoreDifferences:
    # 1. Ignore HPA replica scaling:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
    # 2. Ignore Istio injected sidecar containers:
    - group: apps
      kind: Deployment
      jqPathExpressions:
        - .spec.template.spec.containers[] | select(.name == "istio-proxy")`,
    warStory: "An e-commerce company deployed ArgoCD with auto-sync. During a flash sale, HPA scaled pods to 50. ArgoCD detected a diff with Git (`replicas: 3`) and violently killed 47 pods every 30 seconds. The site crashed until `ignoreDifferences` for `/spec/replicas` was merged."
  },

  {
    id: "devops-q15-hpa-flapping-thrashing-stabilization-window",
    title: "15. Horizontal Pod Autoscaler (HPA) Flapping & Thrashing Mitigation",
    difficulty: "Senior",
    category: "Autoscaling & Capacity Planning",
    summary: "Stabilizing rapid scale-up and scale-down oscillations using HPA v2 behavior stabilization windows and rate limits.",
    problem: "A web application receives spiky traffic. The HPA scales pods from 5 to 60. When the burst pauses for 30 seconds, HPA immediately terminates 50 pods. Another burst arrives 10 seconds later, causing severe latency and OOM errors as new pods cold-start. How do you stabilize HPA?",
    juniorTrap: "Increasing the CPU utilization threshold from 70% to 90%, which just makes the pods vulnerable to crashing under spike.",
    interviewerIntent: "Assesses expertise in Kubernetes autoscaling algorithms, metrics server polling, and HPA v2 `behavior` tuning.",
    seniorAnswer: [
      "The Flapping (Thrashing) Phenomenon: Autoscaler flapping occurs when a metric dips briefly, causing the HPA algorithm to scale down immediately. The remaining pods immediately become overloaded by the next request batch, triggering another frantic scale-up.",
      "The Mathematical Invariant: Desired Replicas = `ceil(Current Replicas * (Current Metric Value / Target Metric Value))`. Without damping policies, this formula reacts violently to momentary traffic drops.",
      "The Stabilization Window Solution: Kubernetes HPA v2 allows configuring `behavior.scaleDown.stabilizationWindowSeconds`. By setting this to 300 seconds (5 minutes), HPA inspects all calculated replica counts over the past 5 minutes and chooses the HIGHEST value, preventing premature scale-down.",
      "Rate Limiting Scale Down: Restrict downscaling speed using `policies`: e.g. allow scaling down at most 10% of total replicas per minute, ensuring pods drain gradually."
    ],
    innerWorking: "The HPA controller queries Metrics Server every 15 seconds (`--horizontal-pod-autoscaler-sync-period`). The stabilization window maintains a rolling time-series buffer of recommendations to filter out high-frequency noise.",
    solution: `# Production HPA v2 with Advanced Damping Behavior:
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-autoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 5
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0 # React IMMEDIATELY to sudden spikes!
      policies:
        - type: Percent
          value: 100               # Double capacity if needed
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300 # Wait 5 minutes before confirming scale-down!
      policies:
        - type: Percent
          value: 10                # Terminate at most 10% of pods per minute
          periodSeconds: 60`,
    warStory: "A ticket booking platform experienced server thrashing during concert drops. Pods scaled 5 -> 80 -> 5 -> 80 four times in 15 minutes. Cold-start JVM latency caused 504 timeouts. Implementing a 10-minute scaleDown stabilization window kept capacity steady and eliminated cold starts."
  },

  {
    id: "devops-q16-docker-disk-exhaustion-overlay2-cleanup",
    title: "16. Docker Daemon Disk Space Exhaustion: overlay2 Buildup & Safe Cleanup",
    difficulty: "Senior",
    category: "Container Storage",
    summary: "Root-cause triage of /var/lib/docker/overlay2 filling 100% disk and safe operational cleanup without breaking container state.",
    problem: "A Kubernetes node's disk hits 100% capacity. An engineer finds '/var/lib/docker/overlay2' using 180 GB. Can you run 'rm -rf /var/lib/docker/overlay2/*' to free up space? What is the correct triage runbook?",
    juniorTrap: "Running 'rm -rf /var/lib/docker/overlay2/*', which corrupts the Docker/containerd storage driver metadata and bricks all containers on the host!",
    interviewerIntent: "Assesses understanding of OverlayFS backing directories, storage driver metadata consistency, and safe container garbage collection.",
    seniorAnswer: [
      "Why 'rm -rf' Destroys the Node: `/var/lib/docker/overlay2` contains the underlying filesystem layers for every image and running container. Deleting files directly bypasses Docker's in-memory graph driver database (`link` files and image metadata). Containers will immediately fail with `no such file or directory` or kernel panic.",
      "Step 1 - Safe Pruning: Execute `docker system prune -a --volumes` or `crictl rmi --prune`. This invokes the container engine's garbage collector, cleanly unmounting unused layers and deleting orphaned images and volumes.",
      "Step 2 - Identify Log Runaways: Frequently, `overlay2` buildup is NOT images, but an application writing massive log files inside the container's read-write layer (upperdir) instead of stdout! Run `docker ps -s` to inspect the writable size of each running container.",
      "Step 3 - Prevent Future Runaways: 1) Enforce `ephemeral-storage` resource limits in Pod manifests; 2) Mount `emptyDir` for scratch directories so data writes to memory/ephemeral mount rather than the container overlay root."
    ],
    innerWorking: "OverlayFS links are tracked in `/var/lib/docker/overlay2/l`. Direct file deletion causes dangling inode references in the kernel, resulting in unrecoverable `EIO` storage driver errors.",
    solution: `# Safe Node Storage Emergency Runbook:

# 1. Clean up unused images and stopped containers safely:
crictl rmi --prune
# OR on Docker engine:
docker system prune -af --volumes

# 2. Find containers with huge writable layers (upperdir abusers):
docker ps --format '{{.ID}}\t{{.Names}}\t{{.Size}}' | sort -k3 -hr | head -n 10

# 3. Restrict Docker daemon log size in /etc/docker/daemon.json:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}`,
    warStory: "A junior sysadmin ran `rm -rf /var/lib/docker/overlay2/*` on a staging node to clear a 100% disk alert. Docker daemon failed to restart, and all existing state was corrupted. The node had to be terminated and replaced with a fresh AMI."
  },

  {
    id: "devops-q17-external-secrets-operator-vault-aws",
    title: "17. Kubernetes Secrets Management: External Secrets Operator (ESO) & Vault",
    difficulty: "Staff",
    category: "Security & Secrets Management",
    summary: "Automating secure secrets synchronization from AWS Secrets Manager / HashiCorp Vault to K8s Secrets using IRSA and ESO.",
    problem: "Storing base64-encoded Kubernetes Secrets in Git repositories violates compliance. How do enterprise platform teams architect an automated, keyless secrets pipeline that syncs from AWS Secrets Manager or HashiCorp Vault into native Kubernetes Secrets?",
    juniorTrap: "Using custom shell scripts in CI/CD pipelines that run 'kubectl create secret' with hardcoded access keys.",
    interviewerIntent: "Tests knowledge of modern cloud-native secrets management, External Secrets Operator (ESO), IRSA (IAM Roles for Service Accounts), and secret rotation.",
    seniorAnswer: [
      "The Plain Secret Fallacy: Kubernetes Secrets are simply base64-encoded strings stored in etcd (readable by anyone with RBAC read access or etcd access unless envelope encryption is configured). Committing them to Git is a severe security vulnerability.",
      "External Secrets Operator (ESO) Pattern: ESO is a Kubernetes controller that synchronizes secrets from external APIs (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) into native K8s Secrets.",
      "Keyless Authentication via IRSA: On AWS EKS, configure IAM Roles for Service Accounts (IRSA). The ESO Pod uses an OIDC-federated IAM role to assume permissions to read secrets from AWS Secrets Manager WITHOUT ANY STATIC CREDENTIALS.",
      "Declarative Custom Resources: Developers commit two CRDs to Git: 1) `SecretStore` (points to the AWS backend and specifies the IAM role); 2) `ExternalSecret` (specifies remote secret keys and refresh intervals). The ESO controller creates and continuously rotates the native K8s Secret."
    ],
    innerWorking: "ESO periodically polls the external provider based on `refreshInterval`. When the secret in AWS Secrets Manager is updated, ESO detects the version change, updates the native K8s Secret, and optionally triggers a rolling deployment via Reloader.",
    solution: `# 1. SecretStore CRD (Points to AWS Secrets Manager using IRSA):
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-backend
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: eso-irsa-sa # Uses AWS IAM Role via EKS OIDC
---
# 2. ExternalSecret CRD (Syncs remote secret to native K8s Secret):
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 1h # Automatically poll for secret rotation!
  secretStoreRef:
    name: aws-secrets-backend
    kind: SecretStore
  target:
    name: db-secret # NATIVE K8s SECRET CREATED IN NAMESPACE!
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/rds/postgres
        property: password`,
    warStory: "An engineer accidentally committed an unencrypted production database password to a public GitHub repository. Within 12 minutes, automated bots compromised the database. The company overhauled their architecture with ESO and AWS Secrets Manager; zero credentials ever touch git."
  },

  {
    id: "devops-q18-etcd-disaster-recovery-quorum-restoration",
    title: "18. etcd Disaster Recovery: Quorum Loss & Cluster Restoration Runbook",
    difficulty: "Staff",
    category: "Disaster Recovery & etcd",
    summary: "Recovering from catastrophic quorum loss in a multi-master etcd cluster using snapshots and --force-new-cluster.",
    problem: "In a 3-node self-managed etcd control plane, two nodes experience hardware failure simultaneously. The remaining node cannot achieve Raft quorum (needs 2 of 3). The Kubernetes API server stops responding. How do you recover the cluster without losing state?",
    juniorTrap: "Spinning up two fresh empty etcd nodes and trying to join them to the broken cluster (which fails because Raft leader election is impossible without quorum).",
    interviewerIntent: "Assesses mastery of Raft consensus protocol, etcd failure recovery, write-ahead logs, and catastrophic control plane rebuilding.",
    seniorAnswer: [
      "Why Quorum Loss Freezes the Cluster: In a 3-node cluster, Raft requires `floor(3/2) + 1 = 2` nodes to agree on any transaction. With only 1 node alive, quorum is lost. etcd rejects all writes and linearizable reads to prevent split-brain. The API server hangs.",
      "The Recovery Strategy - Forcing a New Cluster: When a majority of nodes are permanently dead, the single survivor must be forced to rewrite its Raft cluster membership to declare ITSELF as the sole member of a new 1-node cluster.",
      "Step 1 - Snapshot Current State: Take a snapshot of the surviving node: `etcdctl snapshot save backup.db`.",
      "Step 2 - Stop etcd Service: Terminate the etcd process on the surviving node.",
      "Step 3 - Reinitialize with --force-new-cluster: Reinitialize the etcd service on the surviving node with the flag `--force-new-cluster`. This resets Raft cluster IDs, removes dead peers from the member list, and elects the local node as the leader.",
      "Step 4 - Scale Back to 3 Nodes: Once the API server is healthy, add 2 new empty nodes one at a time using `etcdctl member add`."
    ],
    innerWorking: "`--force-new-cluster` writes a special tombstone record into the Raft log. It clears the peer member directory in etcd's bbolt database and resets the Raft term, enabling single-node leader election.",
    solution: `# Catastrophic etcd Disaster Recovery Steps:

# 1. Take snapshot of surviving node:
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key \\
  snapshot save /tmp/etcd-backup.db

# 2. Restore snapshot into a clean data directory with new cluster identity:
ETCDCTL_API=3 etcdctl snapshot restore /tmp/etcd-backup.db \\
  --data-dir=/var/lib/etcd-restored \\
  --initial-cluster=controlplane-01=https://10.0.1.10:2380 \\
  --initial-cluster-token=etcd-cluster-new \\
  --initial-advertise-peer-urls=https://10.0.1.10:2380

# 3. Update etcd.yaml manifest to point to /var/lib/etcd-restored
# 4. Once node 1 is running healthy, add fresh nodes:
etcdctl member add controlplane-02 --peer-urls=https://10.0.1.11:2380`,
    warStory: "An AWS availability zone outage killed 2 out of 3 master nodes in a self-managed Kubernetes cluster. The remaining node went read-only. A staff SRE executed the `--force-new-cluster` restoration runbook, recovering full cluster operations within 18 minutes with zero data loss."
  },

  {
    id: "devops-q19-cicd-security-oidc-vs-static-cloud-credentials",
    title: "19. CI/CD Pipeline Security: Keyless OIDC vs Long-Lived Cloud Credentials",
    difficulty: "Senior",
    category: "CI/CD & Pipeline Security",
    summary: "Eliminating static AWS_ACCESS_KEY_ID in GitHub Actions using OpenID Connect (OIDC) and short-lived STS tokens.",
    problem: "Your company stores static 'AWS_ACCESS_KEY_ID' and 'AWS_SECRET_ACCESS_KEY' in GitHub Actions Secrets for terraform deployment pipelines. A security audit mandates eliminating all static credentials. How do you implement keyless authentication via OIDC?",
    juniorTrap: "Rotating static AWS access keys every 30 days via a cron job instead of adopting short-lived OIDC federated tokens.",
    interviewerIntent: "Tests understanding of OpenID Connect (OIDC), OAuth2 JWT verification, AWS STS `AssumeRoleWithWebIdentity`, and principle of least privilege in CI/CD.",
    seniorAnswer: [
      "The Vulnerability of Static Keys: Long-lived access keys stored in CI/CD pipelines are susceptible to exfiltration via malicious PR workflows, rogue GitHub actions, or insider threats. They have no expiration time unless manually revoked.",
      "How OIDC Keyless Auth Works: 1) GitHub Actions generates a cryptographically signed OIDC JSON Web Token (JWT) containing metadata (repo, branch, commit); 2) The pipeline sends this token to AWS STS; 3) AWS verifies GitHub's public OIDC keys (`token.actions.githubusercontent.com`); 4) AWS issues a temporary 15-minute STS session credential.",
      "Strict Subject Filtering: In AWS IAM Trust Policy, you MUST restrict the `sub` (subject) claim to your exact organization, repository, and branch: `repo:corp-org/infra-repo:ref:refs/heads/main`. If you don't validate `sub`, ANY GitHub user on the entire internet could assume your IAM role!",
      "Pipeline Permissions: In the GitHub Actions workflow YAML, specify `permissions: id-token: write` to allow the runner to request the JWT."
    ],
    innerWorking: "The GitHub Actions runner calls the OIDC provider endpoint `$ACTIONS_ID_TOKEN_REQUEST_URL`. AWS STS calls GitHub's JWKS endpoint (`/.well-known/jwks.json`) to verify the signature of the token before returning temporary credentials.",
    solution: `# 1. AWS IAM Role Trust Policy (Restricted to exact repo & main branch):
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-org/my-infra:ref:refs/heads/main"
        }
      }
    }
  ]
}

# 2. GitHub Actions Workflow (.github/workflows/deploy.yml):
name: Terraform Deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write # REQUIRED for requesting the OIDC JWT!
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS Credentials via OIDC (ZERO STATIC KEYS!)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-tf-deployer
          aws-region: us-east-1
      - run: terraform apply -auto-approve`,
    warStory: "A developer added a third-party GitHub Action to an internal pipeline. The malicious action dumped all environment variables, including permanent AWS admin access keys, to an external server. Migrating to OIDC ensures no static secrets exist to steal."
  },

  {
    id: "devops-q20-canary-deployments-argo-rollouts-service-mesh",
    title: "20. Blue-Green vs Canary Deployments: Argo Rollouts & Automated Metric Analysis",
    difficulty: "Staff",
    category: "Deployment Strategy & Service Mesh",
    summary: "Architecting automated canary rollouts with progressive traffic shifting and automated metric analysis for zero-human intervention rollbacks.",
    problem: "How do enterprise platform engineering teams architect a Canary deployment pipeline in Kubernetes that shifts traffic gradually (10% -> 25% -> 50% -> 100%) and automatically rolls back if HTTP 5xx error rates exceed 1% without any human intervention?",
    juniorTrap: "Creating two Deployments (1 pod canary, 9 pods stable) behind the same Service, which provides coarse-grained 10% steps and cannot automatically evaluate Prometheus metrics.",
    interviewerIntent: "Assesses expertise in progressive delivery, Argo Rollouts CRD, Service Mesh traffic shifting (Istio/Linkerd), and Prometheus-based AnalysisTemplates.",
    seniorAnswer: [
      "Why Standard K8s Deployments Cannot Do True Canaries: A standard K8s Service routes traffic randomly to all matching pods. To get a 10% canary, you must run 1 canary pod and 9 stable pods (inflexible, expensive, and cannot do 1% or 5% traffic). It also lacks native metric awareness.",
      "Argo Rollouts Architecture: Argo Rollouts replaces the standard `Deployment` resource with a `Rollout` CRD. It integrates directly with Service Mesh (Istio VirtualService) or Ingress (Nginx / ALB) to manipulate routing weights dynamically at the proxy layer.",
      "Automated AnalysisTemplate: The Rollout specifies an `AnalysisTemplate`. At each canary step (e.g. 10% traffic for 10 minutes), Argo Rollouts queries Prometheus: `sum(rate(http_requests_total{status=~'5..'}[2m])) / sum(rate(http_requests_total[2m])) * 100`.",
      "Automated Abort & Rollback: If the Prometheus query returns > 1% error rate, the analysis fails. Argo Rollouts instantly resets the Istio/Ingress routing weight back to 100% stable, terminates the canary pods, and marks the deployment `Degraded`."
    ],
    innerWorking: "Argo Rollouts controller modifies the Istio `VirtualService` HTTP route weights. Traffic splitting occurs at the Envoy proxy level without modifying pod replica counts.",
    solution: `# Complete Argo Rollout with Istio & Prometheus AnalysisTemplate:
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service
spec:
  replicas: 10
  strategy:
    canary:
      trafficRouting:
        istio:
          virtualService:
            name: payment-vsvc
            routes: [primary]
      steps:
        - setWeight: 10
        - pause: { duration: 10m } # Send 10% traffic for 10 minutes
        - analysis:
            templates:
              - templateName: error-rate-check
        - setWeight: 50
        - pause: { duration: 15m }
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
spec:
  metrics:
    - name: success-rate
      interval: 30s
      successCondition: result[0] <= 1.0 # HTTP 5xx error rate must be <= 1%
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus-server.monitoring:9090
          query: >-
            sum(rate(http_requests_total{app="payment-service",status=~"5.*"}[2m]))
            /
            sum(rate(http_requests_total{app="payment-service"}[2m])) * 100`,
    warStory: "A latent null-pointer bug was introduced in a checkout release that only triggered for European currency symbols. Argo Rollouts routed 10% of European traffic, detected a 3.4% error rate in Prometheus after 90 seconds, and automatically rolled back without waking up the on-call engineer."
  }
,
  {
    id: "devops-q21-jenkins-pipeline-buildonce-expandcontract-migrations",
    title: "21. Enterprise CI/CD Architecture: Declarative Jenkinsfile, 'Build Once Deploy Many', Zero-Downtime Rollbacks & Expand/Contract Migrations (Interview Deep Dive Q6.1)",
    difficulty: "Staff / Principal",
    category: "CI/CD & Release Engineering",
    summary: "Production Jenkins declarative pipeline design, ephemeral agents, immutable SHA image promotion, zero-downtime rollback with expand/contract DB migrations, and Jenkins anti-patterns.",
    problem: "1) Design a production Jenkins pipeline for a Spring Boot service to deploy safely. 2) What does 'build once, deploy many' mean and why does it matter? 3) Rollback strategy including the database migration constraint. 4) Common Jenkins anti-patterns to avoid.",
    juniorTrap: "Rebuilding the Docker image separately in each environment (Dev, Staging, Prod) or attempting code rollbacks after executing non-backward-compatible database schema migrations.",
    interviewerIntent: "Assesses enterprise delivery pipeline design, container artifact immutability, zero-downtime database deployment strategies (Parallel Change pattern), and operational CI/CD hygiene.",
    seniorAnswer: [
      "1. Enterprise Pipeline Design: Declarative Jenkinsfile versioned in source repository (Pipeline-as-Code); Multibranch Pipeline with webhook triggers (no SCM polling); shared libraries (vars/) for reusable enterprise stages; ephemeral Kubernetes agent pods with podTemplate (never build on controller); withCredentials for secret masking; parallel unit + integration test stages with SonarQube SAST and Trivy/Snyk CVE vulnerability scanning; immutable Docker image tagged with git commit SHA and pushed to registry; automated deployment to Dev -> automated smoke tests -> manual approval gate -> Staging -> Prod. Use post { always { junit ... } } to guarantee test reporting.",
      "2. 'Build Once, Deploy Many' Principle: Compile source code, execute tests, and build the Docker container image ONCE at the start of the pipeline. Tag the image with the immutable git commit SHA (or content digest). Promote that exact same image artifact across Dev -> Staging -> Production by injecting environment configuration via Kubernetes ConfigMaps and Vault Secrets. Why it matters: Rebuilding in each environment produces non-reproducible artifacts (different base image updates, timestamp drift, dependency resolution differences); what was tested in staging is NOT what is running in production. Promoting an immutable image guarantees reproducibility and enables instantaneous rollback.",
      "3. Rollback Strategy & The Database Migration Constraint: Rollback is executed by redeploying the previous known-good Docker image digest (or switching service traffic in blue-green). The Database Constraint: Application code CANNOT simply roll back if the database schema underwent breaking changes (e.g. dropped column, renamed field).",
      "4. Solution: Expand/Contract (Parallel Change) Pattern: Phase 1 (Expand): Migration adds a new nullable column or table. Deploy application code that dual-writes to both old and new schema, but reads from old. Phase 2: Run asynchronous background job to backfill historical data. Deploy code that reads from the new schema. Phase 3 (Contract): After code stabilizes across all environments, deploy a subsequent release with a migration that safely drops the old deprecated column. Because old and new application versions coexist safely with the database schema, code rollbacks NEVER require database rollbacks!",
      "5. Common Jenkins Anti-Patterns: 1) Polling SCM (pollSCM) or sleep loops instead of instantaneous GitHub webhooks; 2) Giant monolithic pipeline stages that obscure exact failure points; 3) Shell steps without 'set -e' causing failed commands to silently pass; 4) Blindly retrying flaky tests instead of fixing root causes; 5) Running build jobs on the Jenkins controller (master), creating severe security and stability risks; 6) Echoing credentials or tokens in console logs; 7) Baking environment credentials and configs into Docker images instead of runtime injection."
    ],
    innerWorking: "Kubernetes pod templates launch an ephemeral Jenkins agent pod on demand containing specialized containers (maven, docker, kubectl, helm). Once the pipeline completes, the pod is terminated, ensuring clean, hermetic build environments with zero cross-build workspace pollution.",
    solution: `// Declarative Jenkinsfile with Ephemeral Kubernetes Agent:
pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  containers:
  - name: maven
    image: maven:3.9-eclipse-temurin-17
    command: ['sleep']
    args: ['99d']
  - name: docker
    image: docker:24-cli
    command: ['sleep']
    args: ['99d']
'''
        }
    }
    environment {
        IMAGE_NAME = 'gcr.io/my-org/order-service'
        IMAGE_TAG  = "\${env.GIT_COMMIT.take(7)}"
    }
    stages {
        stage('Parallel Quality Checks') {
            parallel {
                stage('Unit & Integration Tests') {
                    container('maven') {
                        steps {
                            sh 'mvn clean verify -DskipITs=false'
                        }
                    }
                }
                stage('Security & SAST Scan') {
                    container('maven') {
                        steps {
                            sh 'mvn sonar:sonar'
                        }
                    }
                }
            }
        }
        stage('Build & Push Immutable Image') {
            container('docker') {
                steps {
                    // BUILD ONCE: Tagged with git commit SHA
                    sh "docker build -t \${IMAGE_NAME}:\${IMAGE_TAG} ."
                    sh "docker push \${IMAGE_NAME}:\${IMAGE_TAG}"
                }
            }
        }
        stage('Deploy to Staging') {
            steps {
                sh "helm upgrade --install order-staging ./helm --set image.tag=\${IMAGE_TAG} -n staging"
            }
        }
        stage('Production Approval Gate') {
            steps {
                timeout(time: 24, unit: 'HOURS') {
                    input message: "Promote \${IMAGE_TAG} to Production?"
                }
            }
        }
        stage('Deploy to Production') {
            steps {
                // PROMOTE THE EXACT SAME IMAGE DIGEST:
                sh "helm upgrade --install order-prod ./helm --set image.tag=\${IMAGE_TAG} -n prod"
            }
        }
    }
    post {
        always {
            junit '**/target/surefire-reports/*.xml'
        }
    }
}`,
    warStory: "An enterprise bank ran Jenkins jobs on the bare-metal controller node. A developer's broken build script ran 'rm -rf /' inside a build step without checking for variable nullness. It wiped the Jenkins master disk, destroying all build histories, credentials, and job configurations across 80 microservices, taking 3 days to restore from cold backups."
  }
];
