# -*- coding: utf-8 -*-
"""
build_cloud_services.py
Generates:
  1. js/data/aws-data.js (AWS IAM & Core Services: EC2, S3, RDS/Aurora, DynamoDB, Lambda, EKS, SQS/SNS, API Gateway)
  2. js/data/gcp-data.js (GCP IAM & Core Services: GCE, GCS, Cloud SQL/Spanner, GKE, Cloud Run, Pub/Sub, BigQuery, Apigee)

Pure vanilla JavaScript data modules attached to window.REVISION_APP_DATA.
"""

import json
import os

# =============================================================================
# AWS SERVICES & IAM DATA DEFINITIONS
# =============================================================================

AWS_CATEGORIES = [
    "All Categories",
    "Security & Identity",
    "Compute & Containers",
    "Storage & Database",
    "Networking & Messaging",
    "Serverless & APIs"
]

AWS_SERVICES = [
    # 1. AWS IAM & Role Architecture
    {
        "id": "aws-iam",
        "title": "AWS IAM & Role Architecture (AssumeRole, IRSA, Instance Profiles)",
        "category": "Security & Identity",
        "badge": "Security & IAM Core",
        "whatIsIt": "AWS Identity and Access Management (IAM) is the central control plane for identity, authentication, and authorization across all AWS resources. It governs who (principals: IAM users, federated users, AWS services) can perform what actions (API calls) on which resources under what conditions. Rather than distributing static, long-lived access keys, modern AWS architecture is built entirely on temporary, automatically rotated STS credentials obtained via IAM Roles, AssumeRole policies, EC2 Instance Profiles, and EKS IAM Roles for Service Accounts (IRSA).",
        "whenAndWhy": "When to use: In EVERY AWS architecture. Never create long-lived IAM user secret access keys for applications. Why: Static keys get leaked, committed to Git, or neglected. With IAM Roles and STS (Security Token Service), AWS provisions temporary credentials (valid 15m to 12h) that are automatically rotated by the AWS SDK and instance metadata service (IMDSv2), eliminating credential leakage risks entirely. Cost: IAM is 100% free with zero AWS charges.",
        "internalWorking": """1. Policy Evaluation Logic: Default is DENY. An explicit DENY in any applicable policy (SCP, Permissions Boundary, Identity Policy, Resource Policy) immediately terminates evaluation and results in DENY. If no explicit deny, at least one explicit ALLOW must exist.
2. IAM Role vs IAM User: A User has permanent credentials (passwords, access keys). A Role has NO permanent credentials; it has two policies:
   - Trust Policy (AssumeRolePolicyDocument): Defines WHO can assume the role (e.g., service `ec2.amazonaws.com` or OIDC provider `oidc.eks.us-east-1.amazonaws.com/id/...`).
   - Permissions Policy: Defines WHAT the role can do once assumed (e.g., `s3:GetObject`).
3. STS AssumeRole Engine: A client calls `sts:AssumeRole`. STS verifies the caller matches the Role's Trust Policy. If allowed, STS generates a temporary set of credentials: AccessKeyId (starts with ASIA...), SecretAccessKey, and SessionToken.
4. EC2 Instance Profile: A container for an IAM role that attaches to an EC2 instance. The EC2 Nitro hypervisor injects credentials into the local Instance Metadata Service at `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>`. AWS SDK automatically polls this endpoint and refreshes tokens before expiry.
5. EKS IRSA (IAM Roles for Service Accounts): EKS cluster acts as an OpenID Connect (OIDC) identity provider. A Kubernetes Service Account is annotated with `eks.amazonaws.com/role-arn`. The EKS mutating webhook injects an OIDC projected token and environment variables (`AWS_ROLE_ARN`, `AWS_WEB_IDENTITY_TOKEN_FILE`). The AWS SDK calls `sts:AssumeRoleWithWebIdentity` to exchange the pod token for AWS IAM credentials with scoped least privilege per pod.""",
        "iamConfiguration": """### Production IAM Role & Trust Relationship Configuration

#### 1. EC2 Instance Profile Trust Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### 2. EKS IRSA (IAM Roles for Service Accounts) OIDC Trust Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::111122223333:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": "system:serviceaccount:production:payment-service",
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

#### 3. Kubernetes Service Account Annotation:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/PaymentServiceProdRole
```""",
        "realWorldUseCase": "Production Banking Microservice on EKS: The `payment-service` running in Kubernetes needs to write transaction logs to an S3 bucket and publish events to SQS. With IRSA, we attach `eks.amazonaws.com/role-arn` to the ServiceAccount. The pods receive temporary credentials scoped strictly to `s3:PutObject` on `arn:aws:s3:::bank-audit-logs/*`. Other pods on the same worker node (e.g. `notification-service`) cannot access the S3 bucket because credentials belong to the pod identity, not the underlying EC2 node!",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🔐 AWS IAM Security Architecture &amp; IRSA Token Flow</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">EKS Pod (KSA)</span>
            <span class="node-desc">payment-service pod mounts projected OIDC JWT token</span>
          </div>
          <span class="flow-arrow-separator">──► 1. Present JWT ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">AWS STS Engine</span>
            <span class="node-desc">AssumeRoleWithWebIdentity verifies OIDC thumbprint</span>
          </div>
          <span class="flow-arrow-separator">──► 2. Issue ASIA... ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Target AWS Service</span>
            <span class="node-desc">S3 / DynamoDB authorizes call via IAM Role policy</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #38bdf8;">
          ⚡ <strong>Zero Secret Leaks:</strong> Pod credentials expire every 60 minutes and auto-rotate silently inside the AWS Java SDK v2 DefaultCredentialsProvider!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: AWS SDK v2 Zero-Config IAM Role Credential Provider
package com.company.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsConfig {

    @Bean
    public S3Client s3Client() {
        // Automatically discovers credentials in order:
        // 1. Java System Properties -> 2. Env Vars -> 3. Web Identity Token (EKS IRSA)
        // 4. ECS Container Credentials -> 5. EC2 IMDSv2
        return S3Client.builder()
                .region(Region.US_EAST_1)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}""",
        "complexPart": "Permission Boundaries and Service Control Policies (SCPs): In large organizations with AWS Organizations, an IAM administrator might grant `s3:*` to a developer role, but an SCP at the Organizational Unit (OU) level can forbid S3 bucket deletion (`Deny s3:DeleteBucket`). Even with AdministratorAccess at the local account level, the request is REJECTED because SCPs establish an explicit guardrail that cannot be overridden by account-level admins.",
        "keyPoints": [
            "Never issue permanent access keys (AKIA...) for software applications in production.",
            "Use EC2 Instance Profiles for VM-based workloads; query IMDSv2 using secure PUT token flow.",
            "Use EKS IRSA (IAM Roles for Service Accounts) to isolate pod privileges on shared nodes.",
            "Role Trust Policies control WHO can assume; Permission Policies control WHAT can be done.",
            "An explicit DENY in any policy layer (SCP, boundary, identity, resource) overrides all ALLOWs."
        ],
        "pitfall": "Confusing Identity-based Policies with Resource-based Policies. An IAM policy attached to a role is Identity-based. A bucket policy attached to S3 or an SQS queue policy is Resource-based. For cross-account access, BOTH the identity policy in Account A and the resource policy in Account B must explicitly permit the action!",
        "interviewTip": "When asked how microservices should authenticate to AWS services, immediately answer: 'Using the DefaultCredentialsProvider chain backed by EKS IRSA or EC2 Instance Profiles with IMDSv2, ensuring zero long-lived credentials in config files or environment variables.'"
    },

    # 2. Amazon EC2 & Auto Scaling
    {
        "id": "aws-ec2",
        "title": "Amazon EC2 (Elastic Compute Cloud) & Auto Scaling Groups (ASG)",
        "category": "Compute & Containers",
        "badge": "Core Compute",
        "whatIsIt": "Amazon EC2 provides resizable, on-demand virtual compute capacity in the cloud. Powered by the AWS Nitro System (which offloads virtualization, networking, and security to dedicated hardware cards), EC2 instances run operating systems and application stacks. Auto Scaling Groups (ASG) monitor fleet health and automatically adjust instance counts based on demand metrics (CPU, request count, SQS queue depth) across multiple Availability Zones to ensure high availability and fault tolerance.",
        "whenAndWhy": "When to use: When you require full control over the OS kernel, need bare-metal performance, run stateful legacy enterprise applications, or build custom Kubernetes worker nodes. Why over alternatives: EC2 offers unmatched instance variety (compute-optimized, memory-optimized, GPU, ARM-based Graviton3/4) and cost flexibility (Spot instances up to 90% discount, Savings Plans, Reserved Instances). Cost model: Pay-per-second for running instances; data egress and EBS block storage billed separately.",
        "internalWorking": """1. Nitro Architecture: Traditional hypervisors consume 10-15% of CPU/memory for host management. AWS Nitro offloads VPC networking (ENA), storage (EBS Controller), and secure hardware root-of-trust to custom PCIe ASIC chips, giving 100% of host CPU/RAM to guest instances.
2. EBS Attachment: Elastic Block Store (EBS) volumes are network-attached block devices connected via dedicated Nitro NVMe storage buses. Data is synchronously replicated across multiple physical storage servers within the same AZ.
3. Security Groups (Stateful) vs NACLs (Stateless):
   - Security Groups operate at the virtual network interface (ENI) level. Stateful: if inbound traffic is allowed on port 443, outbound response is automatically permitted regardless of outbound rules.
   - Network ACLs operate at the subnet boundary. Stateless: you must explicitly allow both inbound port 443 and outbound ephemeral ports (1024-65535).
4. Auto Scaling Group (ASG) Target Tracking: Uses CloudWatch alarms. For example, maintaining average CPU at 60%. When traffic spikes, CloudWatch triggers ASG to launch instances using an EC2 Launch Template (defining AMI, instance type, IAM instance profile, user data bootstrap script).
5. Spot Interruption Lifecycle: AWS reclaims spot capacity with a 2-minute warning delivered via CloudWatch Events and IMDS at `http://169.254.169.254/latest/meta-data/spot/instance-action`. Graceful shutdown hooks catch this to deregister from target groups and drain in-flight connections.""",
        "iamConfiguration": """### EC2 Instance Profile IAM Configuration

To allow an EC2 instance running a Spring Boot service to read parameters from AWS Systems Manager (SSM) Parameter Store:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:us-east-1:111122223333:parameter/prod/order-service/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:us-east-1:111122223333:key/your-kms-key-id"
    }
  ]
}
```
Attach this policy to an IAM Role named `OrderServiceEC2Role`, wrap it in an `InstanceProfile`, and assign it to the EC2 Launch Template.""",
        "realWorldUseCase": "High-Throughput Order Processing Fleet: A Spring Boot order service runs across 3 AZs on Graviton3 `c7g.xlarge` instances inside an ASG behind an Application Load Balancer (ALB). The ASG scales between 6 and 30 instances based on ALB Request Count Per Target (e.g. 1500 req/sec). User Data script automatically pulls secrets from SSM Parameter Store using the EC2 Instance Profile, starts the Dockerized JVM with `-XX:+UseG1GC`, and registers with the ALB target group health check.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🖥️ Multi-AZ EC2 Auto Scaling Group Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">ALB (Public Subnets)</span>
            <span class="node-desc">Distributes traffic across AZ-a, AZ-b, AZ-c</span>
          </div>
          <span class="flow-arrow-separator">──► Health Checked ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">ASG (Private Subnets)</span>
            <span class="node-desc">Auto Scaling Group dynamically launches/terminates</span>
          </div>
          <span class="flow-arrow-separator">──► NVMe Network ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">gp3 EBS Volumes</span>
            <span class="node-desc">Synchronously replicated block storage within AZ</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          💡 <strong>High Availability Invariant:</strong> Placing EC2 instances across 3 Availability Zones guarantees 99.99% uptime even during total single-datacenter loss!
        </div>
      </div>
    """,
        "codeSnippet": """# Terraform: Production EC2 Launch Template with IMDSv2 & Instance Profile
resource "aws_launch_template" "order_service" {
  name_prefix   = "order-service-"
  image_id      = "ami-0c55b159cbfafe1f0" # Amazon Linux 2023 ARM64
  instance_type = "c7g.xlarge"

  iam_instance_profile {
    arn = aws_iam_instance_profile.order_service_profile.arn
  }

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Enforce IMDSv2 (prevents SSRF attacks)
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    docker run -d -p 8080:8080 111122223333.dkr.ecr.us-east-1.amazonaws.com/order-service:latest
  EOF
  )
}""",
        "complexPart": "IMDSv2 vs IMDSv1 SSRF Vulnerability: In IMDSv1, any Server-Side Request Forgery (SSRF) bug in your web app allows an attacker to make a GET request to `http://169.254.169.254/.../security-credentials/` and steal IAM role tokens. IMDSv2 mandates a session-oriented PUT request with `X-aws-ec2-metadata-token-ttl-seconds: 21600` to fetch a token, followed by GET requests containing the `X-aws-ec2-metadata-token` header. SSRF attacks cannot easily execute custom PUT headers, mitigating token theft.",
        "keyPoints": [
            "Nitro System provides bare-metal performance by offloading I/O to dedicated ASIC hardware.",
            "Security Groups are stateful; Network ACLs are stateless and operate at the subnet layer.",
            "Always enforce IMDSv2 (`http_tokens = required`) to prevent SSRF credential exfiltration.",
            "ASGs use target tracking policies to scale horizontally across multiple AZs automatically.",
            "EBS volumes are AZ-bound network storage, not physically plugged into the motherboard."
        ],
        "pitfall": "Storing persistent application state or uploaded user files on the root EBS volume or instance store. If the ASG terminates the instance, instance store data is permanently lost and EBS is deleted by default. Store state in S3, RDS, or DynamoDB!",
        "interviewTip": "Highlight the difference between vertical scaling and horizontal scaling with ASG: 'Instead of over-provisioning huge m5.16xlarge instances, production systems use ASGs with smaller c7g instances across multiple AZs with Spot and On-Demand mixed pools for resilience and 70% cost savings.'"
    },

    # 3. Amazon S3 (Simple Storage Service)
    {
        "id": "aws-s3",
        "title": "Amazon S3 (Simple Storage Service) & Object Storage Architecture",
        "category": "Storage & Database",
        "badge": "Managed Storage",
        "whatIsIt": "Amazon S3 is an exabyte-scale, highly durable (99.999999999% - 11 9's durability) object storage service. Unlike block storage (EBS) or file storage (EFS), S3 stores data as objects comprising a key, value (up to 5TB per object), metadata, and version ID inside flat containers called buckets. S3 provides strong read-after-write consistency, comprehensive lifecycle automation across storage tiers, event notifications to Lambda/SQS, and granular access control via Bucket Policies and IAM.",
        "whenAndWhy": "When to use: Static assets, media uploads, application backups, big data data lakes (Parquet/ORC for Spark/Athena), and event-driven file processing. Why over EBS/EFS: Unlimited capacity with zero pre-provisioning, accessible via standard REST HTTP APIs anywhere, 11 9's durability across at least 3 AZs, and extreme cost optimization (Glacier Deep Archive is ~$0.00099 per GB/month). Cost model: Pay for stored GB/month, PUT/GET HTTP requests, and cross-region data transfer.",
        "internalWorking": """1. Consistent Key-Value Storage Engine: S3 achieves strong read-after-write consistency for PUT and DELETE requests of objects in all AWS regions. As soon as a PUT completes (200 OK), any subsequent GET immediately returns the latest object mutation.
2. Multipart Upload Protocol: For files > 100MB (and mandatory for > 5GB), clients initiate a Multipart Upload. The file is split into chunks (5MB to 5GB), uploaded concurrently in parallel over multiple network streams, and assembled by S3 via `CompleteMultipartUpload`. If any part fails, only that part is retried.
3. Storage Tiers & Intelligent-Tiering:
   - S3 Standard: Millisecond access for active data (frequent access).
   - S3 Intelligent-Tiering: Automatically moves data between Frequent, Infrequent, and Archive tiers based on access patterns without retrieval fees.
   - S3 Glacier Instant Retrieval / Flexible / Deep Archive: Cost-optimized cold storage with retrieval times from milliseconds to 12 hours.
4. S3 Event Notifications: S3 can emit events (`s3:ObjectCreated:*`, `s3:ObjectRemoved:*`) directly to SQS, SNS, EventBridge, or trigger AWS Lambda functions asynchronously.
5. S3 Presigned URLs: A server with IAM permissions generates a cryptographically signed HMAC-SHA256 URL. A client (browser or mobile app) can upload directly to S3 via HTTP PUT without passing through your application backend servers, saving backend CPU and bandwidth.""",
        "iamConfiguration": """### S3 Bucket Policy & IAM Configuration

#### 1. Enforcing HTTPS and Restricting Access to Specific IAM Role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLSRequestsOnly",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::corporate-customer-documents",
        "arn:aws:s3:::corporate-customer-documents/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AllowAppRoleOnly",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:role/DocumentServiceRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::corporate-customer-documents/*"
    }
  ]
}
```""",
        "realWorldUseCase": """Direct-to-S3 Video / Document Upload Pipeline: In an enterprise loan approval system, users upload 500MB PDF audit packages. If uploaded through the Spring Boot API, backend threads would be blocked, causing memory saturation and OOM errors. Instead:
1. Client requests upload ticket: `POST /api/documents/upload-url`
2. Spring Boot service uses AWS SDK `S3Presigner` to generate a presigned PUT URL valid for 15 minutes.
3. Client browser uploads raw bytes directly to S3 via `PUT <presigned-url>`.
4. S3 fires an `ObjectCreated` event to AWS Lambda, which triggers OCR scanning and virus inspection.""",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📦 S3 Presigned URL &amp; Event-Driven Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Frontend Client</span>
            <span class="node-desc">1. Request Presigned URL from Backend</span>
          </div>
          <span class="flow-arrow-separator">──► 2. Direct PUT ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Amazon S3 Bucket</span>
            <span class="node-desc">Stores 500MB object; verifies cryptographic HMAC signature</span>
          </div>
          <span class="flow-arrow-separator">──► 3. ObjectCreated ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Lambda / SQS</span>
            <span class="node-desc">Trigger asynchronous OCR &amp; virus scanner</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          ⚡ <strong>Backend Offload:</strong> Zero file bytes touch your application servers, keeping memory footprints tiny and APIs blazing fast!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Generating S3 Presigned Upload URL
package com.company.doc.service;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

@Service
public class DocumentPresignService {

    private final S3Presigner s3Presigner;

    public DocumentPresignService(S3Presigner s3Presigner) {
        this.s3Presigner = s3Presigner;
    }

    public String generateUploadUrl(String bucketName, String objectKey, String contentType) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(objectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
        return presigned.url().toString();
    }
}""",
        "complexPart": "S3 High Request Rates & Partition Hashing: Historically, key naming required randomized hex prefixes to prevent hitting partition bottlenecks. While S3 now automatically partitions prefixes at 3,500 PUT/POST/DELETE and 5,500 GET requests per second per prefix, applications with massive parallel writes (e.g. 50,000 req/sec) must partition object keys across distinct prefixes (e.g. `bucket/partition-1/...`, `bucket/partition-2/...`) to avoid 503 Slow Down throttling errors.",
        "keyPoints": [
            "Provides 99.999999999% (11 9's) durability by replicating data across minimum 3 AZs.",
            "Offers strong read-after-write consistency for PUT and DELETE requests globally.",
            "Always use S3 Presigned URLs for client uploads to offload bandwidth and CPU from backends.",
            "Use S3 Intelligent-Tiering to automatically optimize storage costs without operational overhead.",
            "Never make S3 buckets public; enforce `Block Public Access` and require TLS 1.2+ via bucket policy."
        ],
        "pitfall": "Forgetting S3 Incomplete Multipart Upload lifecycle cleanup rules. When multipart uploads fail or are abandoned halfway, the uploaded parts remain in S3 and bill you storage fees indefinitely unless an S3 Lifecycle Rule is configured with `AbortIncompleteMultipartUpload` (e.g. after 7 days)!",
        "interviewTip": "When asked how to handle large file uploads in a microservices system, emphasize S3 Presigned URLs and S3 Event Notifications instead of streaming gigabytes through API Gateway or Spring Boot controllers."
    },

    # 4. Amazon RDS & Aurora
    {
        "id": "aws-rds",
        "title": "Amazon RDS & Amazon Aurora (Distributed Cloud Relational Database)",
        "category": "Storage & Database",
        "badge": "Managed Relational DB",
        "whatIsIt": "Amazon Relational Database Service (RDS) is a managed relational database service supporting PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server. Amazon Aurora is AWS's proprietary cloud-native relational engine (MySQL and PostgreSQL compatible) that re-architects database storage by decoupling compute from storage. Aurora replicates a distributed write-ahead log (WAL) across 6 storage nodes spanning 3 Availability Zones, delivering up to 5x the throughput of standard MySQL and sub-10ms read replica latency.",
        "whenAndWhy": "When to use: Transactional business systems (ACID transactions, complex SQL joins, foreign key constraints, financial ledgers, inventory). Why Aurora over standard RDS: Standard RDS uses synchronous block-level replication (EBS) to a passive standby in Multi-AZ, doubling write latency. Aurora writes ONLY the redo log across a 6-way storage quorum, completely eliminating buffer cache write freezes and supporting up to 15 auto-scaling read replicas with zero replica lag.",
        "internalWorking": """1. RDS Multi-AZ Replication: The primary instance synchronously replicates storage-level writes to a standby instance in a secondary AZ via EBS mirroring. If the primary fails, RDS flips the CNAME DNS record to the standby within 60-120 seconds.
2. Aurora's 'The Log is the Database' Architecture: Compute nodes do not write dirty database pages to disk; they send ONLY redo log records to a purpose-built distributed storage fleet.
3. 6-Way Quorum Model: Aurora writes 6 copies of data across 3 AZs (2 copies per AZ). A write is acknowledged as committed as soon as 4 of the 6 nodes acknowledge receipt (4/6 write quorum). Even if an entire AZ fails and a second node dies, Aurora still processes reads (3/6 read quorum) and self-heals background corruptions.
4. Aurora Global Database: Replicates the storage log asynchronously across AWS regions with typical latency under 1 second, enabling cross-region disaster recovery with near-zero RPO.
5. IAM Database Authentication: Applications authenticate to MySQL/Postgres using short-lived IAM authentication tokens generated by AWS STS instead of static database passwords stored in properties files.""",
        "iamConfiguration": """### IAM Database Authentication Configuration

#### 1. IAM Policy for Application Connecting to Aurora PostgreSQL:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "arn:aws:rds-db:us-east-1:111122223333:dbuser:cluster-ABCDEF123456/db_user_app"
    }
  ]
}
```

#### 2. PostgreSQL Role Creation:
```sql
CREATE USER db_user_app;
GRANT rds_iam TO db_user_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO db_user_app;
```""",
        "realWorldUseCase": "Global Retail Checkout & Inventory Management: The checkout microservice writes orders to an Amazon Aurora PostgreSQL Multi-AZ cluster. The writer instance handles order creation transactions. Three auto-scaling read replicas handle catalog search, order history lookups, and reporting. During Black Friday peak traffic, Aurora Read Replicas scale up automatically from 3 to 10 instances in response to CPU utilization, while HikariCP connection pools leverage AWS JDBC Driver for sub-second DNS-less cluster failover.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🗄️ Amazon Aurora 'Log is the Database' Quorum Engine</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Aurora Primary Compute</span>
            <span class="node-desc">Executes transactions; sends ONLY Redo Log records</span>
          </div>
          <span class="flow-arrow-separator">──► 4/6 Write Quorum ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Distributed Storage Fleet</span>
            <span class="node-desc">6 storage copies across 3 AZs (2 per AZ)</span>
          </div>
          <span class="flow-arrow-separator">──► Sub-10ms Lag ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">15x Aurora Read Replicas</span>
            <span class="node-desc">Share SAME storage layer; zero cache warming needed</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          ⚡ <strong>Sub-Second Failover:</strong> An Aurora read replica can be promoted to primary in under 30 seconds because data is already present in the shared storage layer!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Dynamic Token Generation for RDS IAM Authentication
package com.company.db.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.rds.RdsUtilities;

import javax.sql.DataSource;

@Configuration
public class RdsIamDataSourceConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://aurora-cluster.cluster-xyz.us-east-1.rds.amazonaws.com:5432/orders");
        config.setUsername("db_user_app");

        // Generate temporary auth token (valid for 15 minutes)
        RdsUtilities rdsUtilities = RdsUtilities.builder()
                .credentialsProvider(DefaultCredentialsProvider.create())
                .region(Region.US_EAST_1)
                .build();

        String token = rdsUtilities.generateAuthenticationToken(b -> b
                .hostname("aurora-cluster.cluster-xyz.us-east-1.rds.amazonaws.com")
                .port(5432)
                .username("db_user_app"));

        config.setPassword(token);
        config.setMaximumPoolSize(20);
        config.setMaxLifetime(600000); // 10 minutes (refresh before 15m token expiry)

        return new HikariDataSource(config);
    }
}""",
        "complexPart": "Connection Pool Exhaustion vs RDS Proxy: In serverless (Lambda) or highly concurrent microservice environments, thousands of concurrent threads open DB connections, exhausting PostgreSQL max_connections (causing `FATAL: remaining connection slots are reserved`). AWS RDS Proxy sits between apps and the database, pooling and sharing established connections, multiplexing transactions, and preserving connections during database failover to reduce failover downtime by up to 66%.",
        "keyPoints": [
            "Aurora decouples compute from storage, writing only the redo log across 6 storage nodes.",
            "4-of-6 quorum is required for writes; 3-of-6 quorum for reads, with auto-healing storage blocks.",
            "Aurora Read Replicas share the identical distributed storage volume, eliminating replication lag.",
            "Use RDS Proxy to protect databases against connection exhaustion from serverless or autoscaling apps.",
            "Use IAM Database Authentication to eradicate hardcoded database passwords in configuration files."
        ],
        "pitfall": "Using standard database endpoints instead of Cluster and Reader endpoints. If your application hardcodes the direct instance endpoint of an Aurora DB node, failover will result in an immediate outage. Always connect to the Cluster Endpoint for writes and Reader Endpoint for load-balanced reads!",
        "interviewTip": "In system design rounds, explain why Aurora outperforms standard RDS MySQL/PostgreSQL: 'Traditional databases write both dirty data pages and redo logs, creating I/O bottlenecks. Aurora offloads logging to a distributed 6-way storage quorum, transforming random disk writes into sequential network log streams.'"
    },

    # 5. Amazon DynamoDB
    {
        "id": "aws-dynamodb",
        "title": "Amazon DynamoDB (Serverless Single-Digit Millisecond NoSQL)",
        "category": "Storage & Database",
        "badge": "Serverless NoSQL",
        "whatIsIt": "Amazon DynamoDB is a fully managed, serverless, key-value and document NoSQL database designed for single-digit millisecond latency at any scale. It offers built-in high availability across 3 AZs, ACID multi-item transactions, global active-active multi-region replication (Global Tables), and Change Data Capture (DynamoDB Streams). With predictable performance powered by consistent hashing, DynamoDB effortlessly scales from 10 requests/sec to over 100 million requests/sec without operational downtime.",
        "whenAndWhy": "When to use: User session stores, real-time gaming leaderboards, shopping carts, high-velocity IoT telemetry, and large-scale microservice state stores requiring predictable sub-10ms response times. Why over Relational DBs: Relational databases degrade when tables exceed 100M rows and struggle with horizontal scaling. DynamoDB partitions data automatically using consistent hashing; an item lookup on a 1-billion-row table takes the exact same 3ms as on a 1,000-row table.",
        "internalWorking": """1. Consistent Hashing & Storage Partitions: DynamoDB automatically partitions data across physical storage nodes (each partition supports max 10GB data, 1,000 WCUs, and 3,000 RCUs).
2. Primary Key Architecture:
   - Simple Primary Key (Partition Key / PK): An MD5 hash of the PK determines the exact physical partition hosting the item.
   - Composite Primary Key (PK + Sort Key / SK): PK determines the partition; SK orders items physically within that partition using a B-tree. Enables range queries (`begins_with`, `between`, `<`, `>`).
3. Single-Table Design: Rather than normalizing across multiple tables (which requires expensive joins), production systems store multiple distinct entity types (Customers, Orders, Items) in a single DynamoDB table using overloaded generic keys (`PK: USER#123`, `SK: ORDER#999`).
4. Read/Write Capacity Modes:
   - Provisioned: You specify RCU (1 RCU = one 4KB strongly consistent read/sec) and WCU (1 WCU = one 1KB write/sec) with Auto Scaling.
   - On-Demand: Pay strictly per request; scales instantly to accommodate spiky, unpredictable workloads.
5. DynamoDB Streams: An ordered log of item-level modifications (INSERT, MODIFY, REMOVE) retained for 24 hours. AWS Lambda consumes these streams to trigger downstream projections, search indexing (Elasticsearch/OpenSearch), or event broadcasting.""",
        "iamConfiguration": """### DynamoDB Fine-Grained Access Control (FGAC)

Allow a logged-in mobile user to read and write ONLY their own items in a shared DynamoDB table using Cognito User Identity:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:111122223333:table/UserProfiles",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": [
            "${cognito-identity.amazonaws.com:sub}"
          ]
        }
      }
    }
  ]
}
```""",
        "realWorldUseCase": "E-Commerce Shopping Cart & Checkout: A shopping cart service requires 5ms response times. The table uses `PK = USER#<userId>` and `SK = CART#<itemId>`. When a user updates cart items, atomic counters (`ADD quantity :val`) update counts safely without race conditions. During checkout, a DynamoDB Transaction (`TransactWriteItems`) atomically deducts item inventory from an `INVENTORY#<itemId>` partition while creating the `ORDER#<orderId>` record. If inventory is insufficient, the entire transaction rolls back atomically.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚡ DynamoDB Partition Hashing &amp; Single-Table Structure</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">PutItem / Query</span>
            <span class="node-desc">PK: "USER#1001", SK: "ORDER#5001"</span>
          </div>
          <span class="flow-arrow-separator">──► MD5(PK) Hash ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Storage Partition #4</span>
            <span class="node-desc">Direct O(1) hash routing; B-Tree search on Sort Key</span>
          </div>
          <span class="flow-arrow-separator">──► CDC Stream ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">DynamoDB Streams</span>
            <span class="node-desc">Stream mutations to Lambda -> OpenSearch for analytics</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          💡 <strong>O(1) Access Guarantee:</strong> Partition key hashing guarantees identical single-digit millisecond latency whether table has 1,000 items or 10 billion items!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: DynamoDB Enhanced Client Query Execution
package com.company.cart.repository;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;

@Repository
public class CartRepository {

    private final DynamoDbTable<CartItem> cartTable;

    public CartRepository(DynamoDbEnhancedClient client) {
        this.cartTable = client.table("CommerceStore", TableSchema.fromBean(CartItem.class));
    }

    // Fetches all items in a user's cart in a single sub-5ms Query call
    public List<CartItem> getUserCart(String userId) {
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
                Key.builder()
                        .partitionValue("USER#" + userId)
                        .sortValue("CART#")
                        .build()
        );

        return cartTable.query(r -> r.queryConditional(queryConditional).scanIndexForward(true))
                .items()
                .stream()
                .toList();
    }
}""",
        "complexPart": "Hot Partition Throttling & GSI Backpressure: When an application issues thousands of requests to the same partition key (e.g. celebrity account or flash sale item), a single physical partition exceeds its 1,000 WCU or 3,000 RCU limit, triggering `ProvisionedThroughputExceededException`. Solution: Apply write sharding (appending random suffix `ITEM#123#P01..P10` to the PK) or front with Amazon DynamoDB Accelerator (DAX) for in-memory microsecond caching.",
        "keyPoints": [
            "Delivers predictable single-digit millisecond latency regardless of dataset size.",
            "Primary keys consist of a Partition Key (hash routed) and optional Sort Key (range queryable).",
            "Use Single-Table Design to fetch multiple related entities in a single atomic Query call.",
            "DynamoDB Streams provide 24-hour Change Data Capture (CDC) for event-driven architectures.",
            "Avoid full-table Scans at all costs; design access patterns using Query and Secondary Indexes (GSIs)."
        ],
        "pitfall": "Using DynamoDB like a relational database by performing Scans or creating 10+ Global Secondary Indexes (GSIs). A Scan reads every single item in the entire table, exhausting read capacity in seconds and driving costs sky-high. In DynamoDB, you MUST know your query access patterns BEFORE designing the primary key schema!",
        "interviewTip": "Highlight the difference between Scan and Query: 'A Query looks up an exact Partition Key using O(1) hash routing and filters Sort Keys via B-tree index in under 5ms. A Scan reads every physical block across all partitions in O(N) time and must be strictly banned from OLTP request paths.'"
    },

    # 6. AWS Lambda & Serverless Compute
    {
        "id": "aws-lambda",
        "title": "AWS Lambda (Serverless Compute & SnapStart Execution Engine)",
        "category": "Serverless & APIs",
        "badge": "Serverless Core",
        "whatIsIt": "AWS Lambda is a serverless, event-driven compute service that runs code in response to events without provisioning or managing servers. Lambda automatically scales execution from zero to tens of thousands of concurrent microVMs within seconds. Each function runs in an isolated Firecracker microVM container sandbox. For Java enterprise workloads, AWS Lambda SnapStart leverages CRaC (Coordinated Restore at Checkpoint) to eliminate JVM cold starts, reducing startup latency from 8+ seconds down to sub-200 milliseconds.",
        "whenAndWhy": "When to use: Event-driven background processing (S3 image resizing, DynamoDB stream processing, SQS message consumption), scheduled cron jobs (EventBridge), and scalable REST/GraphQL APIs behind API Gateway. Why over EC2/Containers: Zero server maintenance, zero OS patching, built-in multi-AZ fault tolerance, and true pay-as-you-go pricing (zero cost when idle). Cost model: Billed based on invocation count and duration measured in 1ms increments per MB of allocated memory.",
        "internalWorking": """1. Firecracker MicroVM Isolation: Lambda runs functions inside lightweight Firecracker microVMs launched on EC2 bare-metal host fleets. MicroVMs boot in ~5ms with minimal memory overhead while guaranteeing strict hardware-level multi-tenant isolation.
2. Cold Start vs Warm Start Lifecycle:
   - Cold Start: When a request arrives with no idle microVMs available, Lambda downloads the function code/container image, starts the microVM, boots the runtime (JVM/Node/Python), runs static initialization code (Spring Boot context refresh), and finally calls the handler function.
   - Warm Start: Subsequent requests reuse the running microVM; execution jumps directly to the handler function in single-digit milliseconds.
3. AWS Lambda SnapStart for Java 17+:
   - At deployment time, Lambda boots the JVM, runs Spring Boot initialization, invokes `@EventListener(ContextRefreshedEvent.class)` hooks, and pauses execution.
   - Lambda takes an encrypted snapshot of the entire microVM memory state and disk, caching it in a multi-tier cache.
   - On cold start invocations, Lambda restores the snapshot in ~150ms instead of executing the full 8-second JVM bootstrap!
4. Concurrency Controls:
   - Reserved Concurrency: Guarantees a dedicated pool of instances for a function while preventing it from exhausting the regional account limit (default 1,000).
   - Provisioned Concurrency: Keeps pre-initialized execution environments warm 24/7 for zero cold-start SLA requirements.
5. Event Source Mapping: An internal poller managed by AWS reads batches of records from streaming sources (SQS, Kinesis, DynamoDB Streams) and synchronously invokes your Lambda function with the batch.""",
        "iamConfiguration": """### Lambda Execution Role & Resource-Based Policy

#### 1. Lambda Execution Role (Permissions the Lambda uses to call AWS services):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:us-east-1:111122223333:order-processing-queue"
    }
  ]
}
```

#### 2. Resource-Based Policy (Authorizing S3 to invoke the Lambda):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Invoke",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:111122223333:function:ImageThumbnailGenerator",
      "Condition": {
        "ArnLike": {
          "aws:SourceArn": "arn:aws:s3:::user-avatar-bucket"
        }
      }
    }
  ]
}
```""",
        "realWorldUseCase": "Event-Driven Asynchronous Order Ingestion: An e-commerce system receives purchase events from Amazon SQS. A Java 17 Spring Cloud Function runs on AWS Lambda with SnapStart enabled. An Event Source Mapping polls the SQS queue in batches of 10 messages. Lambda processes orders, writes results to DynamoDB, and deletes processed messages from SQS. When marketing runs a flash sale, Lambda instantly scales from 2 concurrent executions to 800 executions without human intervention, then drops back to zero.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">⚡ AWS Lambda SnapStart &amp; MicroVM Lifecycle</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Build / Deploy Time</span>
            <span class="node-desc">Boot JVM, refresh Spring Context, snapshot memory &amp; disk</span>
          </div>
          <span class="flow-arrow-separator">──► Encrypted Snapshot ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">SnapStart Cache</span>
            <span class="node-desc">Persists pre-warmed memory state in multi-tier cache</span>
          </div>
          <span class="flow-arrow-separator">──► ~150ms Restore ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Instant Invocation</span>
            <span class="node-desc">Sub-200ms cold start; executes handler immediately</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          🚀 <strong>Cold Start Eradicated:</strong> SnapStart eliminates 95% of Java bootstrap latency by restoring memory state rather than executing classloading and bytecode verification!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17: AWS Lambda SQS Batch Handler with SnapStart CRaC Integration
package com.company.order.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import org.crac.Core;
import org.crac.Resource;

public class OrderBatchHandler implements RequestHandler<SQSEvent, String>, Resource {

    public OrderBatchHandler() {
        // Register with CRaC runtime for snapshot lifecycle callbacks
        Core.getGlobalContext().register(this);
    }

    @Override
    public void beforeCheckpoint(org.crac.Context<? extends Resource> context) {
        // Close network sockets, DB connections, or ephemeral tokens before snapshot
        System.out.println("Preparing for SnapStart memory checkpoint...");
    }

    @Override
    public void afterRestore(org.crac.Context<? extends Resource> context) {
        // Re-seed SecureRandom and reconnect DB connections after restore
        System.out.println("Restored from SnapStart snapshot! Ready for traffic.");
    }

    @Override
    public String handleRequest(SQSEvent event, Context context) {
        for (SQSEvent.SQSMessage msg : event.getRecords()) {
            context.getLogger().log("Processing Order ID: " + msg.getBody());
        }
        return "SUCCESS";
    }
}""",
        "complexPart": "State Uniqueness & Pseudo-Random Number Generation under SnapStart: Because SnapStart clones a saved memory snapshot across hundreds of microVMs, any static state initialized before checkpointing (such as `java.security.SecureRandom`, pseudo-random seeds, or cached cryptographic nonces) will be IDENTICAL across all restored instances! Developers must implement the CRaC `afterRestore()` callback to re-seed random number generators and re-authenticate dynamic session tokens.",
        "keyPoints": [
            "Runs code on Firecracker microVMs with sub-millisecond billing and zero idle cost.",
            "Java 17+ SnapStart reduces cold start latency by up to 90% using CRaC memory snapshotting.",
            "Lambda Execution Roles govern what AWS services the function can access.",
            "Resource-Based Policies govern what services (S3, API Gateway) are permitted to invoke the function.",
            "Use Reserved Concurrency to protect downstream databases from being overwhelmed by Lambda auto-scaling."
        ],
        "pitfall": "Opening new database connections inside the Lambda handler function on every invocation. If 1,000 concurrent Lambdas spin up, they will open 1,000 simultaneous connections, crashing your relational database. Always initialize database connection pools in static initialization outside the handler, or front the DB with AWS RDS Proxy!",
        "interviewTip": "When interviewers ask if Java is suitable for serverless given high cold start times, respond: 'Historically Java struggled with 8-second cold starts, but with AWS Lambda SnapStart utilizing CRaC memory checkpointing and GraalVM Native Images, Java 17+ functions achieve cold starts under 200ms, making it fully production-viable for latency-critical APIs.'"
    },

    # 7. Amazon EKS (Elastic Kubernetes Service)
    {
        "id": "aws-eks",
        "title": "Amazon EKS (Elastic Kubernetes Service) & Cloud-Native Pod Networking",
        "category": "Compute & Containers",
        "badge": "Enterprise Containers",
        "whatIsIt": "Amazon Elastic Kubernetes Service (EKS) is a fully managed Kubernetes control plane service certified Kubernetes-conformant. EKS provisions, scales, and manages the Kubernetes API server, etcd consensus storage, and controller managers across 3 Availability Zones with a 99.95% SLA. In the data plane, EKS integrates natively with AWS networking via the VPC CNI plugin (assigning real VPC IP addresses directly to pods), leverages Karpenter for intelligent just-in-time compute provisioning, and enforces pod-level security via IRSA.",
        "whenAndWhy": "When to use: Complex enterprise microservices architectures, polyglot backend systems, existing Kubernetes YAML/Helm ecosystem investments, and multi-cloud portability. Why over raw EC2 or ECS: ECS is an AWS-proprietary container orchestrator; EKS provides the full Kubernetes ecosystem (operators, Helm, Istio service mesh, Prometheus, ArgoCD GitOps) while eliminating the operational burden of managing and upgrading etcd and control planes.",
        "internalWorking": """1. Managed Control Plane: EKS provisions at least 2 API server instances and 3 etcd instances across 3 AZs. EKS automatically detects and replaces unhealthy control plane instances and patches security vulnerabilities with zero downtime.
2. AWS VPC CNI Plugin: Unlike overlay networks (Flannel, Calico VXLAN) which encapsulate packets causing 5-10% CPU overhead, AWS VPC CNI assigns native secondary private IPv4 addresses from the host subnet directly to pods via Elastic Network Interfaces (ENIs). Pods communicate with other VPC resources at bare-metal line speed with zero packet encapsulation.
3. Managed Node Groups vs Karpenter:
   - Managed Node Groups: Automates EC2 provisioning and rolling OS updates via standard ASGs.
   - Karpenter: Modern open-source node autoscaler that bypasses ASGs. It directly calls EC2 Fleet APIs to provision optimal instance types (evaluating 400+ types, spot vs on-demand, architecture) in under 45 seconds based on un-schedulable pod resource requests.
4. EKS IRSA (Pod-Level Identity): The EKS control plane is configured with an OpenID Connect (OIDC) issuer URL. The pod mounts a projected service account token that AWS STS validates to issue short-lived scoped IAM role credentials.
5. AWS Load Balancer Controller: Watches Kubernetes `Ingress` and `Service` (type `LoadBalancer`) objects and automatically configures AWS Application Load Balancers (ALB) and Network Load Balancers (NLB) with IP-mode target groups routing traffic directly to pod IPs.""",
        "iamConfiguration": """### EKS Cluster IAM & Node Role Architecture

#### 1. EKS Cluster Control Plane IAM Role:
Must include AWS managed policy `AmazonEKSClusterPolicy`.

#### 2. Worker Node IAM Role:
Must include:
- `AmazonEKSWorkerNodePolicy`
- `AmazonEC2ContainerRegistryReadOnly` (to pull images from ECR)
- `AmazonEKS_CNI_Policy` (for VPC CNI ENI IP allocation)

#### 3. Pod IRSA (Scoped IAM Role for Payment Service):
```bash
# Associate OIDC provider with your EKS cluster
eksctl utils associate-iam-oidc-provider --cluster prod-cluster --approve

# Create IAM Role and Service Account linked via OIDC
eksctl create iamserviceaccount \
  --name payment-k8s-sa \
  --namespace production \
  --cluster prod-cluster \
  --role-name PaymentServiceIRSA \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  --approve
```""",
        "realWorldUseCase": "Enterprise Banking Platform on EKS: A global bank runs 120 Spring Boot microservices on EKS. The cluster uses Karpenter to schedule pods across mixed Spot and On-Demand Graviton3 instances, saving 65% in compute costs. The AWS Load Balancer Controller manages an internet-facing ALB that routes incoming customer requests directly to pod IP addresses using Target Group IP mode. Pods authenticate to AWS Secrets Manager using IRSA to fetch encryption keys without storing secrets in Git.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">☸️ Amazon EKS VPC CNI &amp; IRSA Pod Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Application Load Balancer</span>
            <span class="node-desc">IP Mode: Routes directly to Pod IP bypassing NodePort</span>
          </div>
          <span class="flow-arrow-separator">──► Direct VPC IP ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">EKS Worker Node</span>
            <span class="node-desc">AWS VPC CNI binds secondary ENI IPs directly to Pods</span>
          </div>
          <span class="flow-arrow-separator">──► OIDC Web Identity ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Pod-Scoped IAM Role</span>
            <span class="node-desc">IRSA grants least-privilege AWS access per microservice</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          💡 <strong>Zero Overlay Overhead:</strong> Direct VPC IP addressing allows native AWS VPC Security Groups to be applied directly at the individual Kubernetes Pod level!
        </div>
      </div>
    """,
        "codeSnippet": """# Kubernetes Deployment: Spring Boot on EKS with IRSA and AWS ALB Ingress
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  namespace: production
spec:
  replicas: 4
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      serviceAccountName: payment-k8s-sa # Linked to AWS IAM Role via IRSA
      containers:
        - name: app
          image: 111122223333.dkr.ecr.us-east-1.amazonaws.com/payment-service:v2.1
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "1000m"
              memory: "2Gi"
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip # Route directly to pod IPs
spec:
  rules:
    - http:
        paths:
          - path: /payments
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 8080""",
        "complexPart": "VPC Subnet IP Address Exhaustion with VPC CNI: Because the AWS VPC CNI assigns real private VPC IPv4 addresses to every single pod, a node running 60 pods consumes 60 private IP addresses from the VPC subnet. If your VPC was created with a small `/24` CIDR block (251 usable IPs), a cluster of 5 nodes will completely exhaust the subnet, preventing new pods from scheduling! Solution: Configure VPC CNI Custom Networking with secondary non-routable CIDR blocks (`100.64.0.0/16`) or use IPv6.",
        "keyPoints": [
            "Provisions a high-availability, SLA-backed managed Kubernetes control plane across 3 AZs.",
            "VPC CNI assigns native VPC IP addresses to pods, eliminating network overlay encapsulation penalty.",
            "IRSA maps Kubernetes Service Accounts to IAM Roles via OIDC for least-privilege pod security.",
            "Use Karpenter instead of Cluster Autoscaler for faster, cheaper, just-in-time compute provisioning.",
            "Configure Target Group `IP Mode` with AWS Load Balancer Controller to route traffic directly to pods."
        ],
        "pitfall": "Relying on EC2 Node IAM Roles for application permissions instead of IRSA. If you grant S3 permissions to the EC2 Node Role, EVERY pod running on that worker node inherits full access to your S3 buckets, violating least privilege and exposing your cluster to cross-tenant privilege escalation!",
        "interviewTip": "When discussing Kubernetes on AWS, mention Karpenter and IRSA immediately: 'In modern EKS architectures, we avoid standard ASG Cluster Autoscaler in favor of Karpenter for sub-minute node provisioning, and enforce strict zero-trust pod isolation using IRSA over OIDC federation.'"
    },

    # 8. Amazon SQS & SNS Messaging
    {
        "id": "aws-sqs-sns",
        "title": "Amazon SQS & SNS (Decoupled Pub/Sub & Distributed Queue Architecture)",
        "category": "Networking & Messaging",
        "badge": "Enterprise Messaging",
        "whatIsIt": "Amazon Simple Queue Service (SQS) is a fully managed distributed message queuing service supporting standard (at-least-once, unlimited throughput) and FIFO (first-in-first-out, exactly-once processing) queues. Amazon Simple Notification Service (SNS) is a fully managed publish/subscribe messaging service that coordinates message delivery to multiple subscribing endpoints (fan-out pattern). Together, SNS and SQS form the backbone of resilient, decoupled event-driven microservices on AWS.",
        "whenAndWhy": "When to use: Asynchronous order processing, event fan-out, decoupling fast producers from slow consumers, absorbing spiky traffic bursts, and cross-microservice communication. Why: Without queues, an outage in Service B immediately cascades into Service A (cascading failure). By placing an SQS queue between them, Service A writes messages at 50,000 req/sec while Service B processes messages at its own pace without dropping a single transaction.",
        "internalWorking": """1. SNS/SQS Fan-Out Pattern: A publisher publishes an event to a single SNS Topic. Multiple SQS queues subscribe to that topic. When an event arrives, SNS automatically replicates and pushes a copy of the message into every subscribed SQS queue concurrently.
2. SQS Distributed Architecture: SQS stores message redundant copies across multiple physical storage servers across 3 AZs.
3. Message Visibility Timeout: When Consumer A receives a message via `ReceiveMessage`, the message is not deleted; it enters an invisible state for a configurable period (default 30 seconds). If Consumer A processes the message and calls `DeleteMessage`, it is removed permanently. If Consumer A crashes before deletion, the visibility timeout expires, and the message reappears in the queue for Consumer B to process.
4. Long Polling (`WaitTimeSeconds = 20`): Reduces empty responses and costs. When a consumer requests messages, SQS waits up to 20 seconds for a message to arrive before returning an empty response.
5. Dead Letter Queues (DLQ) & Redrive Policy: If a message fails processing `maxReceiveCount` times (e.g. 5 times due to corrupt payload / poison pill), SQS automatically moves the message to a DLQ for offline debugging and alerts CloudWatch.""",
        "iamConfiguration": """### SQS Queue Resource Policy for SNS Fan-Out

To allow an SNS topic to push messages into an SQS queue across services:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSNSTopicToPublish",
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:111122223333:order-fulfillment-queue",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:sns:us-east-1:111122223333:order-events-topic"
        }
      }
    }
  ]
}
```""",
        "realWorldUseCase": """E-Commerce Order Placement Fan-Out: When a customer places an order, the Order API publishes an `OrderPlacedEvent` to the `order-events` SNS topic. Four separate microservices need this event:
1. `fulfillment-queue` -> Fulfillment service ships physical goods.
2. `billing-queue` -> Invoicing service generates tax receipts.
3. `notification-queue` -> Email/SMS service sends notifications.
4. `analytics-queue` -> Data pipeline indexes orders into Snowflake.
Each service consumes from its own dedicated SQS queue with tailored concurrency and DLQs. If the notification service is down for maintenance, billing and fulfillment continue seamlessly without disruption!""",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📨 SNS-to-SQS Pub/Sub Fan-Out Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Order Microservice</span>
            <span class="node-desc">Publishes 1x OrderPlacedEvent to SNS Topic</span>
          </div>
          <span class="flow-arrow-separator">──► Broadcast ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Amazon SNS Topic</span>
            <span class="node-desc">Replicates message to all subscribed SQS queues</span>
          </div>
          <span class="flow-arrow-separator">──► Decoupled Delivery ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">SQS Queues + DLQs</span>
            <span class="node-desc">Fulfillment, Billing &amp; Notification consume independently</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          ⚡ <strong>Fault Isolation:</strong> A crash in the Notification Consumer has ZERO impact on Billing or Shipping—each consumer has its own isolated buffer and DLQ!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Publishing to SNS and Consuming from SQS with Spring Cloud AWS
package com.company.messaging;

import io.awspring.cloud.sqs.annotation.SqsListener;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Service
public class OrderMessagingService {

    private final SnsClient snsClient;

    public OrderMessagingService(SnsClient snsClient) {
        this.snsClient = snsClient;
    }

    // Publisher: Publish event to SNS Topic
    public void publishOrderPlaced(String orderJson) {
        PublishRequest request = PublishRequest.builder()
                .topicArn("arn:aws:sns:us-east-1:111122223333:order-events-topic")
                .message(orderJson)
                .build();
        snsClient.publish(request);
    }

    // Consumer: Spring Cloud AWS listens to SQS Queue with automatic ack/visibility management
    @SqsListener("order-fulfillment-queue")
    public void handleOrderMessage(String messagePayload) {
        System.out.println("Processing fulfillment for order: " + messagePayload);
        // If exception is thrown here, message is NOT acknowledged.
        // It returns to queue after VisibilityTimeout expires.
    }
}""",
        "complexPart": "Poison Pill Messages & Visibility Timeout Race Conditions: If a consumer thread takes 45 seconds to process a complex message, but the SQS Visibility Timeout is set to 30 seconds, SQS assumes the worker crashed and delivers the same message to a second consumer thread! Both threads are now processing the same transaction concurrently, causing duplicate charges or database constraint collisions. Solution: Set Visibility Timeout to 6x your max expected processing time, or have the worker heartbeat via `ChangeMessageVisibility` periodically.",
        "keyPoints": [
            "SNS is push-based (Pub/Sub fanout); SQS is pull-based (distributed message queue).",
            "Combining SNS and SQS provides the classic fan-out pattern for decoupled microservices.",
            "Message Visibility Timeout prevents other consumers from grabbing in-flight messages.",
            "Always enable SQS Long Polling (`WaitTimeSeconds = 20`) to eliminate empty responses and slash costs.",
            "Dead Letter Queues (DLQs) catch poison-pill messages after max retry counts to prevent infinite crash loops."
        ],
        "pitfall": "Assuming SQS Standard Queues guarantee strict FIFO ordering. Standard queues provide at-least-once delivery and best-effort ordering; messages may occasionally arrive out of sequence or be delivered twice. If strict ordering and deduplication are mandatory, you MUST use SQS FIFO queues with `MessageGroupId` and `MessageDeduplicationId`!",
        "interviewTip": "When asked how to build resilient microservices architectures, explain the SNS + SQS fan-out pattern: 'By publishing events to an SNS topic and having each downstream microservice consume from its own SQS queue, we achieve total fault isolation, rate leveling, and zero data loss during downstream outages.'"
    },

    # 9. Amazon API Gateway
    {
        "id": "aws-api-gateway",
        "title": "Amazon API Gateway (Serverless Managed Reverse Proxy & Edge Routing)",
        "category": "Serverless & APIs",
        "badge": "Managed API Gateway",
        "whatIsIt": "Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. Supporting REST APIs, cost-effective HTTP APIs, and real-time bidirectional WebSocket APIs, API Gateway acts as the secure 'front door' for applications to access backend workloads running on Lambda, EC2, ECS, EKS, or any publicly accessible HTTP endpoint. It handles traffic management, CORS, authorization, rate limiting, and API versioning automatically.",
        "whenAndWhy": "When to use: Public-facing REST APIs, serverless microservice routing, mobile backend entry points, and IoT WebSocket communication. Why: Building custom routing, authentication, and rate limiting into your application code wastes engineering time. API Gateway handles token bucket throttling, request validation, mutual TLS, and Cognito integration at cloud scale with zero servers to manage.",
        "internalWorking": """1. Gateway Variants:
   - REST APIs: Feature-rich; supports API keys, usage plans, request validation via JSON schema, request/response transformations using VTL (Velocity Template Language), and AWS WAF integration.
   - HTTP APIs: Lightweight, high-performance, and up to 70% cheaper than REST APIs; optimized for serverless Lambda proxies with built-in JWT authorizers.
   - WebSocket APIs: Stateful bidirectional connections for chat and real-time notifications.
2. Token Bucket Rate Limiting & Throttling: Enforces steady-state rate limits (e.g. 10,000 requests/sec) and burst limits (e.g. 5,000 requests) using the Token Bucket algorithm. When a client exceeds limits, API Gateway immediately returns `429 Too Many Requests` without invoking backend compute, protecting downstream databases.
3. Authorization Engine:
   - AWS IAM: Validates AWS Signature Version 4 (SigV4) headers.
   - Amazon Cognito User Pools: Validates OAuth2 / OIDC JWT tokens natively.
   - Lambda Authorizers (Custom): Executes a Lambda function that inspects bearer tokens or headers and dynamically returns an IAM Policy document with `Effect: Allow` or `Effect: Deny`.
4. Private Integrations via VPC Link: Connects API Gateway securely to private VPC resources (NLB, ALB, or Cloud Map) inside private subnets without exposing backend instances to the public internet.""",
        "iamConfiguration": """### Lambda Authorizer IAM Policy Return Structure

When a custom Lambda Authorizer validates a client token, it must return an IAM Policy document allowing or denying execution of the API method:

```json
{
  "principalId": "user_2847192",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow",
        "Resource": "arn:aws:execute-api:us-east-1:111122223333:api-id/prod/GET/orders/*"
      }
    ]
  },
  "context": {
    "tenantId": "tenant_enterprise_01",
    "role": "ADMIN"
  }
}
```
The `context` keys are passed directly to backend Lambdas or Spring Boot services via request headers.""",
        "realWorldUseCase": "Multi-Tenant SaaS API Front Door: A SaaS banking application exposes APIs to enterprise clients. API Gateway sits at the perimeter integrated with AWS WAF to block SQL injection and DDoS attacks. Clients pass an API key and an OAuth2 JWT token. API Gateway validates the JWT via a Cognito Authorizer, enforces per-client Usage Plans (e.g. Tier 1 clients get 5,000 req/sec; Tier 2 get 500 req/sec), and routes authorized requests over a VPC Link to internal Spring Boot microservices on an EKS private cluster.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🚪 Amazon API Gateway Perimeter Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Public Internet</span>
            <span class="node-desc">Client sends HTTPS request with JWT Bearer token</span>
          </div>
          <span class="flow-arrow-separator">──► WAF &amp; Rate Limit ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Amazon API Gateway</span>
            <span class="node-desc">Validates JWT, enforces Token Bucket throttle, transforms req</span>
          </div>
          <span class="flow-arrow-separator">──► VPC Link ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Private Backends</span>
            <span class="node-desc">Lambda / EKS Pods inside private VPC receive clean requests</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #ff9900;">
          🛡️ <strong>DDoS Protection:</strong> 429 rate limit rejections and unauthorized 401/403 requests are absorbed at the AWS edge without consuming a single cycle of backend compute!
        </div>
      </div>
    """,
        "codeSnippet": """# Terraform: HTTP API with JWT Authorizer and Lambda Integration
resource "aws_apigatewayv2_api" "http_api" {
  name          = "order-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_authorizer" "jwt_auth" {
  api_id           = aws_apigatewayv2_api.http_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt-authorizer"

  jwt_configuration {
    audience = ["your-app-client-id"]
    issuer   = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abcdef123"
  }
}

resource "aws_apigatewayv2_route" "orders_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/v1/orders"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id = aws_apigatewayv2_authorizer.jwt_auth.id
}""",
        "complexPart": "Authorizer Caching Traps with Multiple User Tokens: When Lambda Custom Authorizers are configured with authorizer caching enabled (default 300s TTL), API Gateway caches the generated IAM policy based on the cache key (usually the `Authorization` header). If your authorizer generates a policy scoped to a specific resource (e.g. `arn:aws:execute-api:.../GET/orders/123`), and the same user immediately calls `/GET/users/456`, API Gateway evaluates the CACHED policy and rejects the valid call with a 403 Forbidden! Solution: Return an allow policy with wildcard resource (`/prod/*/*`) and put granular access checks in backend logic.",
        "keyPoints": [
            "Acts as the unified front door for APIs, providing routing, throttling, and auth out of the box.",
            "HTTP APIs provide low latency and 70% cost savings for serverless Lambda proxies.",
            "Token Bucket rate limiting absorbs traffic spikes and blocks abusers with 429 Too Many Requests.",
            "Connects to private VPC backends (EKS, ALB) via VPC Links without exposing instances to internet.",
            "Natively integrates with AWS WAF to block OWASP Top 10 web vulnerabilities at the perimeter."
        ],
        "pitfall": "Selecting REST APIs instead of HTTP APIs without needing advanced features like VTL transformations or API Keys. HTTP APIs are faster, significantly cheaper, and support native OIDC/JWT authorizers without requiring a custom Lambda authorizer!",
        "interviewTip": "In system design discussions, emphasize edge security: 'We terminate SSL, enforce WAF inspection, authenticate JWTs via Cognito, and apply token-bucket rate limiting directly at API Gateway, ensuring unauthenticated or malicious traffic never touches private microservice networks.'"
    }
]


# =============================================================================
# GCP SERVICES & IAM DATA DEFINITIONS
# =============================================================================

GCP_CATEGORIES = [
    "All Categories",
    "Security & Identity",
    "Compute & Containers",
    "Storage & Database",
    "Networking & Messaging",
    "Analytics & Enterprise API"
]

GCP_SERVICES = [
    # 1. Google Cloud IAM & Service Accounts
    {
        "id": "gcp-iam",
        "title": "Google Cloud IAM, Service Accounts & Workload Identity Federation",
        "category": "Security & Identity",
        "badge": "GCP Identity Core",
        "whatIsIt": "Google Cloud Identity and Access Management (IAM) provides fine-grained access control and visibility for managing Google Cloud resources centrally. IAM defines WHO (Principals: Google Accounts, Google Groups, Service Accounts, Cloud Identity Domains) has WHAT permissions (Roles: Predefined, Custom) on WHICH resource node (Resource Hierarchy: Organization -> Folder -> Project -> Resource). Crucially, modern GCP architecture eliminates long-lived JSON service account keys via GKE Workload Identity, Service Account Impersonation, and Workload Identity Federation.",
        "whenAndWhy": "When to use: Foundation for all Google Cloud architectures. Why over legacy approaches: Static JSON service account keys are the #1 source of cloud security breaches when accidentally committed to GitHub. Workload Identity binds Kubernetes service accounts to Google service accounts at the kernel metadata layer with zero stored secrets. Workload Identity Federation allows external CI/CD pipelines (GitHub Actions, GitLab) to authenticate to GCP via OIDC tokens without service account keys.",
        "internalWorking": """1. GCP Resource Hierarchy & Policy Inheritance:
   Organization (Root) ➔ Folders ➔ Projects ➔ Resources (GCS Buckets, GCE VMs, BigQuery Datasets).
   Policies are inherited downward. If a principal is granted `roles/viewer` at the Folder level, they have viewer access to EVERY project and resource inside that folder. Permissions are additive; you CANNOT deny an inherited permission at a lower level (unless using IAM Deny Policies).
2. IAM Policy Bindings & Conditions:
   An IAM Policy consists of bindings linking a list of `members` to a `role`, optionally restricted by IAM Conditions (Common Expression Language - CEL based on time, resource tags, or request attributes).
3. Service Accounts (GSA): An identity representing an application rather than an end user.
   - User-Managed Service Accounts: Created by developers (e.g. `payment-svc@prod-proj.iam.gserviceaccount.com`).
   - Default Service Accounts: Automatically created by GCE/App Engine (WARNING: Often possess overly permissive `Editor` roles and should be disabled).
4. GKE Workload Identity Engine:
   GKE enables Workload Identity using the GKE Workload Identity Pool (`<PROJECT_ID>.svc.id.goog`). The GKE metadata server intercepts requests to `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`. It checks the calling Pod's Kubernetes Service Account (KSA) and exchanges its projected OIDC token for a short-lived Google OAuth2 Access Token for the mapped Google Service Account (GSA).
5. Workload Identity Federation (Keyless CI/CD):
   GitHub Actions generates an OIDC token signed by GitHub (`token.actions.githubusercontent.com`). The GCP Security Token Service (STS) verifies the token against a configured Workload Identity Pool and issues a federated token that impersonates a Google Service Account to run Terraform or deploy containers.""",
        "iamConfiguration": """### Production GCP IAM Configuration

#### 1. GKE Workload Identity Binding (KSA to GSA):
```bash
# 1. Create Google Service Account (GSA)
gcloud iam service-accounts create payment-gsa \
    --project=prod-fintech-44210

# 2. Grant GSA permissions on GCP resource (e.g. Cloud Storage)
gcloud projects add-iam-policy-binding prod-fintech-44210 \
    --member="serviceAccount:payment-gsa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

# 3. Allow Kubernetes Service Account (KSA) to impersonate GSA
gcloud iam service-accounts add-iam-policy-binding \
    payment-gsa@prod-fintech-44210.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:prod-fintech-44210.svc.id.goog[production/payment-ksa]"

# 4. Annotate KSA in Kubernetes
kubectl annotate serviceaccount payment-ksa \
    --namespace production \
    iam.gke.io/gcp-service-account=payment-gsa@prod-fintech-44210.iam.gserviceaccount.com
```

#### 2. Workload Identity Federation for GitHub Actions:
```bash
# Allow GitHub Actions repo to impersonate deployer service account
gcloud iam service-accounts add-iam-policy-binding deployer@prod-fintech-44210.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/github-pool/attribute.repository/my-org/my-repo"
```""",
        "realWorldUseCase": """Zero-Key Enterprise Multi-Cloud CI/CD and Microservice Deployment: An enterprise runs Spring Boot microservices on GKE and deploys via GitHub Actions.
1. GitHub Actions uses Workload Identity Federation to authenticate directly to GCP without saving JSON private keys in repository secrets, assuming the `github-deployer` service account to push Docker images to Google Artifact Registry.
2. In GKE, the running `order-service` pod uses Workload Identity to interact with Google Cloud Storage and Pub/Sub. The pod mounts no secret files; the Google Cloud Java client library transparently queries the GKE Metadata Server and receives fresh, auto-rotating 1-hour OAuth2 tokens.""",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🌐 GKE Workload Identity Keyless Security Engine</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">GKE Pod (payment-ksa)</span>
            <span class="node-desc">Pod queries metadata.google.internal with KSA projected token</span>
          </div>
          <span class="flow-arrow-separator">──► Intercepted ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">GKE Metadata Server</span>
            <span class="node-desc">Validates against workloadIdentityUser binding on GSA</span>
          </div>
          <span class="flow-arrow-separator">──► Returns OAuth2 Token ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Google Cloud API</span>
            <span class="node-desc">BigQuery / GCS / PubSub validates short-lived OAuth2 token</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          🔒 <strong>Zero Secret Leaks:</strong> Eliminates static JSON service account keys permanently. Pods never touch credentials, and tokens expire in 60 minutes!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Google Cloud Client Library with Automatic Workload Identity
package com.company.gcp.config;

import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GcpStorageConfig {

    @Bean
    public Storage storage() {
        // Automatically discovers credentials via Google Application Default Credentials (ADC):
        // 1. GOOGLE_APPLICATION_CREDENTIALS env var
        // 2. GKE Workload Identity Metadata Server (http://metadata.google.internal)
        // 3. Compute Engine / Cloud Run Metadata Server
        // Zero code changes or hardcoded keys required!
        return StorageOptions.getDefaultInstance().getService();
    }
}""",
        "complexPart": "Service Account Token Creator vs Service Account User: Granting `roles/iam.serviceAccountUser` allows a developer to attach a service account to a VM or Cloud Run service. However, it does NOT allow the developer to directly generate tokens. Granting `roles/iam.serviceAccountTokenCreator` allows a principal to impersonate the service account directly via `gcloud --impersonate-service-account` to generate OAuth2 tokens. In high-security environments, `serviceAccountTokenCreator` must be strictly audited because it allows complete privilege elevation.",
        "keyPoints": [
            "Resource hierarchy enforces downward permission inheritance from Org -> Folders -> Projects.",
            "Never download or distribute static JSON Service Account Keys in enterprise production.",
            "Use GKE Workload Identity to bind Kubernetes Service Accounts (KSA) to Google Service Accounts (GSA).",
            "Use Workload Identity Federation for keyless authentication from GitHub Actions and external clouds.",
            "Prefer fine-grained Predefined Roles (e.g. `roles/pubsub.publisher`) over Primitive Roles (`Editor`, `Viewer`)."
        ],
        "pitfall": "Leaving Compute Engine Default Service Accounts with their default Editor role enabled. When GCE VMs are created without specifying a custom service account, GCP attaches a default service account with full project-wide Editor access, allowing anyone who compromises the VM to take over the entire Google Cloud project!",
        "interviewTip": "When asked how to securely handle service-to-service authentication in Google Cloud, immediately state: 'We enforce zero static keys by leveraging Workload Identity on GKE, Application Default Credentials (ADC) on Cloud Run/Compute, and Workload Identity Federation for external CI/CD pipelines.'"
    },

    # 2. Google Compute Engine (GCE)
    {
        "id": "gcp-gce",
        "title": "Google Compute Engine (GCE) & Managed Instance Groups (MIG)",
        "category": "Compute & Containers",
        "badge": "Core IaaS Compute",
        "whatIsIt": "Google Compute Engine (GCE) delivers scalable, high-performance virtual machines running on Google's global infrastructure. GCE features custom machine types (choose exact vCPU and RAM ratios), industry-leading Live Migration (VMs move between physical hosts during hardware maintenance with zero downtime and zero reboots), persistent disks decoupled from compute, and Managed Instance Groups (MIGs) that support automatic healing, autoscaling, and multi-zone regional deployments.",
        "whenAndWhy": "When to use: Workloads requiring direct OS access, custom Linux kernels, non-containerized legacy monoliths, high-performance computing (HPC), and custom database clusters. Why over AWS EC2: GCE Live Migration ensures maintenance never causes VM reboots; custom machine types prevent paying for unused memory; and per-second billing with committed use discounts offers significant cost predictability. Cost model: Per-second billing with sustained use discounts applied automatically.",
        "internalWorking": """1. Live Migration Technology: When Google needs to perform hardware maintenance, firmware updates, or hypervisor patches, GCE transparently migrates running VMs to a different physical host within milliseconds. The VM's CPU and memory state are streamed over Google's high-speed internal network; running applications never disconnect or reboot.
2. Andromeda Software-Defined Networking (SDN): GCE networking is fully virtualized via Andromeda, delivering up to 100 Gbps network bandwidth with ultra-low latency without physical switch bottlenecks.
3. Persistent Disks (PD): Network-attached block storage devices (Standard HDD, Balanced PD, SSD PD, Extreme PD). Like AWS EBS, Persistent Disks are decoupled from VMs and replicated synchronously across multiple independent storage devices within the zone or across two zones (Regional PD for high-availability DR).
4. Managed Instance Groups (MIGs): Groups of homogeneous VMs created from an Instance Template.
   - Autoscaling: Automatically adds or removes VMs based on CPU, Cloud Monitoring metrics, or HTTP load balancer serving capacity.
   - Auto-healing: Health checks actively probe the VM application endpoint; if a VM becomes unresponsive, the MIG automatically recreates it.
   - Rolling Updates: Updates instances gradually with canary deployment stages and zero downtime.""",
        "iamConfiguration": """### Compute Engine Service Account IAM Policy

Assign a dedicated service account to GCE instances with access limited strictly to Cloud Logging and Secret Manager:

```bash
# 1. Create dedicated GCE Service Account
gcloud iam service-accounts create backend-vm-sa --project=prod-fintech-44210

# 2. Grant Secret Manager Secret Accessor
gcloud projects add-iam-policy-binding prod-fintech-44210 \
    --member="serviceAccount:backend-vm-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# 3. Create Instance Template using the custom service account (NEVER default compute SA!)
gcloud compute instance-templates create backend-template \
    --machine-type=e2-standard-4 \
    --service-account=backend-vm-sa@prod-fintech-44210.iam.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=http-server,backend
```""",
        "realWorldUseCase": "Fault-Tolerant Regional Fintech Clearing Engine: An enterprise core-banking clearing service runs on GCE inside a Regional Managed Instance Group (MIG) spanning `us-central1-a`, `us-central1-b`, and `us-central1-c`. The service uses Regional Persistent Disks to replicate data across two zones synchronously. If an entire Google data center experiences a power failure, the Regional MIG automatically brings up replacement instances in the surviving zone with the Regional Persistent Disk reattached in under 60 seconds.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🖥️ GCE Live Migration &amp; Regional MIG Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Physical Host Maintenance</span>
            <span class="node-desc">Google hypervisor detects pending hardware maintenance</span>
          </div>
          <span class="flow-arrow-separator">──► Live Stream ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">GCE Live Migration</span>
            <span class="node-desc">Transfers CPU/RAM state to new host with ZERO VM reboot</span>
          </div>
          <span class="flow-arrow-separator">──► Auto-Healing ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Regional MIG Fleet</span>
            <span class="node-desc">Multi-zone high availability with Regional Persistent Disks</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          ⚡ <strong>Zero Maintenance Downtime:</strong> Unlike AWS EC2 where scheduled maintenance requires instance reboots, GCE Live Migration keeps workloads online continuously!
        </div>
      </div>
    """,
        "codeSnippet": """# Terraform: Production Regional Managed Instance Group with Auto-Healing
resource "google_compute_region_instance_group_manager" "backend_mig" {
  name   = "backend-clearing-mig"
  region = "us-central1"

  version {
    instance_template = google_compute_instance_template.backend_template.id
  }

  base_instance_name = "backend-worker"
  target_size        = 6

  auto_healing_policies {
    health_check      = google_compute_health_check.http_health.id
    initial_delay_sec = 120 # Grace period for JVM warmup
  }

  update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_surge_fixed       = 3
    max_unavailable_fixed = 0 # Zero downtime rolling update
  }
}""",
        "complexPart": "Ephemeral External IPs vs Cloud NAT for Outbound Security: Assigning public external IP addresses directly to compute instances exposes them to internet port scans and brute force attacks. Production architectures deploy instances inside private subnets with ONLY internal private IP addresses, and route outbound internet traffic (for software updates or external APIs) through Cloud NAT. Inbound traffic is accepted exclusively via Cloud Load Balancers.",
        "keyPoints": [
            "Live Migration keeps virtual machines running without reboot during physical host maintenance.",
            "Regional MIGs distribute instances across zones with auto-healing and zero-downtime rolling updates.",
            "Always attach custom service accounts with least privilege; never use default compute service accounts.",
            "Regional Persistent Disks provide synchronous cross-zone block replication for disaster recovery.",
            "Use Custom Machine Types to dial in exact vCPU-to-memory ratios to eliminate wasted compute costs."
        ],
        "pitfall": "Failing to set an adequate `initial_delay_sec` on MIG Auto-healing health checks for Java applications. If a heavy Spring Boot application takes 45 seconds to boot, but the health check has an initial delay of 15 seconds, the MIG will declare the booting VM unhealthy and terminate it, entering an infinite reboot loop!",
        "interviewTip": "Highlight Google Cloud's distinctive infrastructure advantage: 'GCE Live Migration transparently moves VMs between hosts without rebooting, meaning infrastructure upgrades, security patching, and hardware replacements happen with zero operational downtime for our services.'"
    },

    # 3. Google Cloud Storage (GCS)
    {
        "id": "gcp-gcs",
        "title": "Google Cloud Storage (GCS) & Global Object Storage Architecture",
        "category": "Storage & Database",
        "badge": "Managed Object Storage",
        "whatIsIt": "Google Cloud Storage (GCS) is an exabyte-scale, highly durable (11 9's durability) unified object storage service. Built on Google's distributed Colossus file system, GCS offers strong global consistency for all read and write operations, seamless multi-region bucket replication, and automated Object Lifecycle Management. With Uniform Bucket-Level Access, GCS standardizes permissions purely around Google Cloud IAM, eliminating confusing legacy Access Control Lists (ACLs).",
        "whenAndWhy": "When to use: Unstructured data storage (images, video, documents), big data analytics storage for BigQuery and Dataproc (Spark/Hadoop), application backups, and static website hosting. Why over AWS S3: GCS provides global multi-region and dual-region buckets out of the box with single unified endpoints; storage classes (Standard, Nearline, Coldline, Archive) share the identical API and millisecond access latency; and GCS was strongly consistent across all operations long before S3. Cost model: Billed for stored GB/month, network egress, and operations.",
        "internalWorking": """1. Colossus Storage Foundation: GCS stores object chunks across thousands of disks in Google data centers managed by Colossus (successor to Google File System). Data is erasure-coded across independent failure domains to provide 99.999999999% annual durability.
2. Strong Global Consistency: All GCS operations (upload, metadata update, delete, bucket listing) are strongly consistent globally. Once a write operation returns success, any read request from anywhere in the world immediately sees the updated object.
3. Storage Classes:
   - Standard: High-frequency access with low access costs.
   - Nearline: Data accessed less than once a month (30-day minimum storage).
   - Coldline: Data accessed less than once a year (90-day minimum storage).
   - Archive: Coldest storage for disaster recovery and long-term compliance (365-day minimum storage), yet retains sub-second access latency!
4. Signed URLs: Similar to AWS presigned URLs, a server with GCS permissions signs a cryptographic URL (using V4 signing), allowing end users to upload or download objects directly to/from GCS without routing traffic through backend web application servers.
5. Cloud Audit Logs & Pub/Sub Notifications: GCS can publish real-time messages to Cloud Pub/Sub whenever objects are created, overwritten, or deleted, triggering serverless pipelines.""",
        "iamConfiguration": """### GCS Bucket IAM & Uniform Bucket-Level Access

#### 1. Enforcing Uniform Bucket-Level Access:
```bash
# Uniform access disables legacy object-level ACLs in favor of clean IAM policies
gcloud storage buckets update gs://prod-invoices-archive \
    --uniform-bucket-level-access
```

#### 2. Granting GCS Object Viewer Role to Microservice:
```bash
gcloud storage buckets add-iam-policy-binding gs://prod-invoices-archive \
    --member="serviceAccount:invoice-service-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"
```""",
        "realWorldUseCase": "Global Document Processing & Ingestion Pipeline: A multinational insurance platform ingests 2 million claims documents per day. The frontend web app requests a Signed URL from the Spring Boot API, then uploads PDF files directly to a dual-region GCS bucket (`us-central1` and `us-east1`). GCS triggers a Cloud Pub/Sub event on `OBJECT_FINALIZE`, invoking a Cloud Run OCR worker that extracts claims data and streams results into Google BigQuery.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📦 Google Cloud Storage Signed URL &amp; Event Stream</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Web Client</span>
            <span class="node-desc">Requests Signed Upload URL from Backend API</span>
          </div>
          <span class="flow-arrow-separator">──► Direct HTTP PUT ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">GCS Bucket (Dual-Region)</span>
            <span class="node-desc">Strong global consistency; erasure-coded Colossus storage</span>
          </div>
          <span class="flow-arrow-separator">──► OBJECT_FINALIZE ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Cloud Pub/Sub ➔ Cloud Run</span>
            <span class="node-desc">Triggers automated serverless document extraction pipeline</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          ⚡ <strong>Millisecond Cold Retrieval:</strong> Unlike AWS Glacier which requires minutes or hours to unfreeze cold data, GCS Archive class retrieves objects in milliseconds!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Generating GCS V4 Signed Upload URL
package com.company.gcs.service;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class GcsPresignService {

    private final Storage storage;

    public GcsPresignService(Storage storage) {
        this.storage = storage;
    }

    public String generateV4SignedUploadUrl(String bucketName, String objectName, String contentType) {
        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, objectName)
                .setContentType(contentType)
                .build();

        Map<String, String> extensionHeaders = new HashMap<>();
        extensionHeaders.put("Content-Type", contentType);

        URL signedUrl = storage.signUrl(
                blobInfo,
                15,
                TimeUnit.MINUTES,
                Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                Storage.SignUrlOption.withExtHeaders(extensionHeaders),
                Storage.SignUrlOption.withV4Signature()
        );

        return signedUrl.toString();
    }
}""",
        "complexPart": "Dual-Region Turbo Replication vs Standard Geo-Redundancy: Standard multi-region or dual-region GCS buckets replicate objects asynchronously with a 99.9% replication SLA within 12 hours. For mission-critical disaster recovery where RPO must be under 15 minutes, developers must enable Turbo Replication on dual-region buckets, guaranteeing that 100% of newly written objects replicate to the secondary region within 15 minutes.",
        "keyPoints": [
            "Delivers 99.999999999% (11 9's) durability backed by Google's Colossus distributed storage.",
            "Strong global consistency across all operations, including uploads, overwrites, and deletes.",
            "All storage classes (Standard, Nearline, Coldline, Archive) provide sub-second access latency.",
            "Always enable Uniform Bucket-Level Access to enforce security purely via Google Cloud IAM.",
            "Use GCS Signed URLs to offload high-bandwidth media and document uploads from backend servers."
        ],
        "pitfall": "Mixing legacy Object ACLs with Google Cloud IAM permissions. If Uniform Bucket-Level Access is disabled, individual objects can possess legacy public-read ACLs that bypass IAM policies, inadvertently exposing proprietary data to the public internet!",
        "interviewTip": "Highlight GCS's retrieval performance edge over AWS S3: 'In Google Cloud Storage, even the coldest Archive storage class returns the first byte in under a second with standard REST APIs, completely avoiding the complex asynchronous unfreezing workflows required by AWS Glacier.'"
    },

    # 4. Cloud SQL & Cloud Spanner
    {
        "id": "gcp-cloud-sql",
        "title": "Cloud SQL & Cloud Spanner (Global Consistency & TrueTime Relational DB)",
        "category": "Storage & Database",
        "badge": "Managed Relational Core",
        "whatIsIt": "Google Cloud provides two distinct relational database powerhouses: Cloud SQL is a fully managed service for MySQL, PostgreSQL, and SQL Server offering regional high availability with automated synchronous replication and failover. Cloud Spanner is Google's groundbreaking, globally distributed, horizontally scalable relational database that delivers external consistency (strict serializability) and 99.999% (five 9's) availability across multiple regions, powered by Google's proprietary TrueTime API synchronized via atomic clocks and GPS receivers.",
        "whenAndWhy": "When to use: Cloud SQL for standard regional microservices needing 100% standard PostgreSQL/MySQL compatibility. Cloud Spanner for mission-critical global systems (financial ledgers, global inventory, telco billing) where you need the horizontal scalability of NoSQL combined with ACID transactional guarantees of relational SQL. Why Spanner: Eliminates the impossible choice between CAP theorem consistency and availability—Spanner is the world's first globally consistent, horizontally partitioned ACID database.",
        "internalWorking": """1. Cloud SQL Regional High Availability:
   - Primary instance and standby instance reside in two different zones within a region.
   - Storage uses Regional Persistent Disks replicating synchronously at the block level.
   - If the primary zone fails, Cloud SQL automatically triggers failover to the standby in under 60 seconds with zero data loss (RPO = 0).
2. Cloud Spanner Architecture & Splits:
   - Tables are horizontally partitioned into 'splits' based on primary key ranges.
   - Splits are replicated across multiple zones/regions using the Paxos consensus algorithm.
   - Each split has a Paxos leader that coordinates read/write transactions.
3. Google TrueTime API Engine:
   - Distributed databases usually suffer from clock skew (NTP drift up to hundreds of milliseconds), making it impossible to order transactions globally without expensive locking.
   - Google data centers install dedicated atomic clocks and GPS receivers in every cluster.
   - The TrueTime API returns a time interval `[earliest, latest]` with bounded uncertainty (epsilon `ε` < 7ms).
   - Commit Wait: When a transaction commits, Spanner waits `2ε` (approx 14ms) before releasing locks. This guarantees that any subsequent transaction anywhere in the world receives a timestamp strictly greater than the previous one, achieving strict serializability without global locks!""",
        "iamConfiguration": """### Cloud SQL & Spanner IAM Access Configuration

#### 1. Connecting via Cloud SQL IAM Database Authentication:
```bash
# 1. Enable IAM DB Auth on Cloud SQL Instance
gcloud sql instances patch prod-pg-instance \
    --database-flags=cloudsql.iam_authentication=on

# 2. Add IAM database user
gcloud sql users create payment-service-sa@prod-fintech-44210.iam \
    --instance=prod-pg-instance \
    --type=CLOUD_IAM_SERVICE_ACCOUNT

# 3. Grant Client role to the Service Account
gcloud projects add-iam-policy-binding prod-fintech-44210 \
    --member="serviceAccount:payment-service-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```""",
        "realWorldUseCase": "Global Payment Settlement & Ledger Engine: A financial institution processes multi-currency payments across the US, Europe, and Asia. Using traditional PostgreSQL, cross-region replication is asynchronous (risking financial double-spends on failover) or sharded (requiring manual cross-shard 2PC code). By deploying on Cloud Spanner with a multi-region instance configuration, transactions in Tokyo, Frankfurt, and New York commit with strict serializability, zero stale reads, and 99.999% SLA availability.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🌐 Cloud Spanner TrueTime Distributed Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Global Transaction</span>
            <span class="node-desc">Client executes multi-region ACID write transaction</span>
          </div>
          <span class="flow-arrow-separator">──► Paxos Consensus ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Paxos Leader Splits</span>
            <span class="node-desc">Replicates write across regional quorum nodes</span>
          </div>
          <span class="flow-arrow-separator">──► TrueTime Commit ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Atomic Clock Sync</span>
            <span class="node-desc">TrueTime bounded uncertainty guarantees global serializability</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          ⚡ <strong>CAP Theorem Defied:</strong> Google Spanner is practically a CA system (Consistent and Available) under network partitions due to TrueTime GPS/atomic clock integration!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Cloud SQL IAM Database Connection with HikariCP & Cloud SQL Connector
package com.company.db.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class CloudSqlDataSourceConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        // Uses Google Cloud SQL Socket Factory for automatic SSL & IAM authentication
        config.setJdbcUrl("jdbc:postgresql://google/payment_db");
        config.setUsername("payment-service-sa@prod-fintech-44210.iam");
        config.setPassword("unused-when-using-iam");

        config.addDataSourceProperty("socketFactory", "com.google.cloud.sql.postgres.SocketFactory");
        config.addDataSourceProperty("cloudSqlInstance", "prod-fintech-44210:us-central1:prod-pg-instance");
        config.addDataSourceProperty("enableIamAuth", "true");
        config.addDataSourceProperty("sslmode", "disable"); // SSL is handled automatically by SocketFactory

        config.setMaximumPoolSize(25);
        return new HikariDataSource(config);
    }
}""",
        "complexPart": "Monotonically Increasing Primary Keys in Cloud Spanner (The Anti-Pattern): In traditional MySQL/PostgreSQL, auto-incrementing integer IDs (`SERIAL`, `AUTO_INCREMENT`) or sequential timestamps are best practice. In Cloud Spanner, sequential primary keys cause MASSIVE HOTSPOTS! Because Spanner splits data by key ranges, all sequential writes hit the exact same Paxos leader split on a single server, crippling write throughput. Solution: Use UUIDv4 or bit-reversed sequential hashes as primary keys.",
        "keyPoints": [
            "Cloud SQL offers regional HA with sub-60s failover using Regional Persistent Disks.",
            "Cloud Spanner combines horizontal scalability of NoSQL with full relational ACID guarantees.",
            "TrueTime API uses atomic clocks and GPS receivers to bound clock uncertainty globally.",
            "Use Cloud SQL IAM Database Authentication to eliminate database passwords in code.",
            "Never use sequential auto-incrementing primary keys in Cloud Spanner; use UUIDs to prevent hotspots."
        ],
        "pitfall": "Treating Cloud Spanner like traditional single-node PostgreSQL by running unindexed full table scans or unbounded cross-table joins. Spanner is a distributed system; queries that cross multiple splits across regions incur network latency overhead. Always design indexes to keep related queries within single split partitions!",
        "interviewTip": "When asked how Spanner achieves global consistency without distributed deadlocks, explain: 'Spanner uses Google TrueTime hardware (atomic clocks and GPS) to bound clock skew to under 7ms. By enforcing a commit-wait interval equal to twice the uncertainty window, Spanner guarantees absolute monotonic ordering of transactions globally.'"
    },

    # 5. Google Kubernetes Engine (GKE)
    {
        "id": "gcp-gke",
        "title": "Google Kubernetes Engine (GKE) & Autopilot Cloud-Native Architecture",
        "category": "Compute & Containers",
        "badge": "Enterprise Containers",
        "whatIsIt": "Google Kubernetes Engine (GKE) is the industry's premier managed Kubernetes service, engineered by the original creators of Kubernetes. GKE offers two operating modes: GKE Standard (full control over worker nodes and cluster configuration) and GKE Autopilot (a fully hands-off, production-ready mode where Google manages the entire infrastructure, node provisioning, security hardening, and OS lifecycle). GKE features VPC-native networking via Alias IPs, Workload Identity, Gateway API, and multi-cluster services.",
        "whenAndWhy": "When to use: Modern containerized microservices, scalable distributed applications, enterprise Java Spring Boot deployments, and multi-cloud Kubernetes architectures. Why GKE over EKS/AKS: GKE receives Kubernetes features and security patches first; Autopilot eliminates node pool management and bills strictly for pod resource requests (CPU/RAM/storage) rather than idle VM capacity; and VPC-native networking delivers zero-overhead pod communication.",
        "internalWorking": """1. Standard vs Autopilot Mode:
   - Standard: You manage node pools, configure node autoscaling, handle OS upgrades, and pay for the underlying Compute Engine VMs whether pods utilize them or not.
   - Autopilot: Google provisions, optimizes, and auto-scales worker nodes automatically; enforces security best practices (Shielded Nodes, no root containers); and bills ONLY for the exact CPU, memory, and storage requested by running pods.
2. VPC-Native Cluster Networking (Alias IPs):
   - Rather than overlay networks (flannel/Calico), GKE allocates secondary IP ranges from your Google Cloud VPC subnet directly to pods.
   - Pods are first-class citizens in the VPC network; they can talk directly to GCE VMs, Cloud SQL, and on-premises resources via Cloud Interconnect with zero network address translation (NAT).
3. GKE Workload Identity: Seamlessly maps Kubernetes Service Accounts (KSA) to Google Service Accounts (GSA), allowing pods to securely access Google Cloud APIs with zero stored credentials.
4. GKE Dataplane V2 (eBPF): Powered by Cilium and eBPF in the Linux kernel, Dataplane V2 replaces legacy `iptables` for Kubernetes Services and Network Policies, delivering orders-of-magnitude faster packet routing and deep observability.
5. Multi-Cluster Ingress & Gateway API: Manages global external HTTPS load balancers routing traffic across multiple GKE clusters deployed in different regions for latency optimization and disaster recovery.""",
        "iamConfiguration": """### GKE Cluster & Workload Identity Configuration

```bash
# 1. Create a VPC-native GKE Autopilot Cluster
gcloud container clusters create-auto prod-autopilot-cluster \
    --region=us-central1 \
    --project=prod-fintech-44210 \
    --network=prod-vpc \
    --subnetwork=gke-subnet

# 2. Bind GSA to KSA for Workload Identity
gcloud iam service-accounts add-iam-policy-binding \
    order-gsa@prod-fintech-44210.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:prod-fintech-44210.svc.id.goog[production/order-ksa]"
```""",
        "realWorldUseCase": "Global Multi-Region E-Commerce Platform on GKE: An enterprise retail platform runs across two GKE Autopilot clusters in `us-central1` and `europe-west1`. Incoming customer traffic hits a Google Cloud External Gateway (Gateway API). If the European cluster is undergoing a regional rollout or traffic surges, the global load balancer automatically spills traffic over to the US cluster over Google's premium fiber backbone. Pods use Workload Identity to write transaction records into Cloud Spanner without managing secrets.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">☸️ GKE Autopilot &amp; VPC-Native Network Topology</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Global External Gateway</span>
            <span class="node-desc">Google Anycast IP routes traffic via closest edge PoP</span>
          </div>
          <span class="flow-arrow-separator">──► Alias IP Direct ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">GKE Autopilot Pods</span>
            <span class="node-desc">VPC-native secondary subnet IPs; eBPF Dataplane V2</span>
          </div>
          <span class="flow-arrow-separator">──► Workload Identity ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Google Cloud APIs</span>
            <span class="node-desc">Direct access to Spanner / BigQuery without stored secrets</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          💡 <strong>Pay Only for Pods:</strong> In GKE Autopilot, you never pay for unallocated node CPU or memory overhead—Google absorbs node bin-packing costs!
        </div>
      </div>
    """,
        "codeSnippet": """# Kubernetes Gateway API & HTTPRoute for GKE Multi-Cluster Traffic
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: external-http-gateway
  namespace: production
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: prod-tls-cert
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: order-service-route
  namespace: production
spec:
  parentRefs:
    - name: external-http-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/v1/orders
      backendRefs:
        - name: order-service
          port: 8080""",
        "complexPart": "Autopilot Resource Quota Clamping & Minimum Requests: In GKE Autopilot, Google enforces strict resource ratios to prevent node fragmentation. For example, the minimum CPU request is 250m, and the memory-to-CPU ratio must be between 1:1 and 6.5:1. If a developer defines a deployment requesting 50m CPU and 2Gi memory, Autopilot will automatically mutate the manifest upward to conform to minimum ratios, which can unexpectedly increase costs if not monitored.",
        "keyPoints": [
            "GKE is the gold standard managed Kubernetes engine with Autopilot and Standard modes.",
            "Autopilot mode eliminates node management and bills strictly for pod resource requests.",
            "VPC-native clusters allocate real VPC subnet IPs directly to pods using Alias IPs.",
            "Dataplane V2 leverages eBPF in the Linux kernel to replace slow `iptables` rules.",
            "Workload Identity securely binds Kubernetes Service Accounts to Google Cloud Service Accounts."
        ],
        "pitfall": "Omitting resource requests (`resources.requests.cpu` and `memory`) in GKE pod manifests. In Autopilot mode, GKE applies generous default requests (500m CPU / 2Gi RAM) to unconfigured pods, resulting in 4x higher cloud bills than necessary!",
        "interviewTip": "Emphasize GKE Autopilot in cloud discussions: 'For new cloud-native microservices on GCP, we choose GKE Autopilot because it eliminates node maintenance, applies Google SRE security hardening out of the box, and ensures we pay strictly for running pod resources rather than idle worker VMs.'"
    },

    # 6. Google Cloud Run
    {
        "id": "gcp-cloud-run",
        "title": "Google Cloud Run (Serverless Container Runtime with Concurrency)",
        "category": "Compute & Containers",
        "badge": "Serverless Containers",
        "whatIsIt": "Google Cloud Run is a fully managed, serverless container execution platform built on top of the open-source Knative standard. It enables developers to deploy any container image (written in Java, Go, Node, Python, Rust) that listens for HTTP/gRPC requests or WebSockets, and automatically scales up from zero to thousands of instances in seconds. Unlike AWS Lambda which processes only one request per function instance at a time, Cloud Run supports multi-concurrency (up to 250 concurrent requests per container instance), dramatically lowering costs and eliminating cold starts.",
        "whenAndWhy": "When to use: Microservice APIs, asynchronous webhook handlers, background processing jobs, and scheduled tasks. Why over AWS Lambda / ECS / Kubernetes: You package standard Docker containers with zero proprietary runtime SDK locks; you get automatic SSL, custom domains, and traffic splitting (canary deployments) out of the box; and multi-concurrency means one container handles 100 requests simultaneously, reducing instance counts and slashing cloud spend by up to 80% compared to single-threaded serverless.",
        "internalWorking": """1. Knative & gVisor Container Sandboxing:
   - Each Cloud Run instance runs inside a gVisor sandbox container. gVisor implements a secure, user-space Linux kernel that intercepts and virtualizes system calls, providing multi-tenant hardware-level security isolation with near-native container performance.
2. Scale-to-Zero & Fast Startup:
   - When no incoming traffic is present, Cloud Run scales container instances to zero, incurring zero compute cost.
   - When a request arrives, Cloud Run's ingress proxy routes the request to an existing instance or spins up a fresh container in under 2 seconds.
3. Multi-Concurrency Model:
   - In AWS Lambda, 100 concurrent requests spin up 100 separate Lambda microVMs.
   - In Cloud Run, developers set `--concurrency=80`. A single Spring Boot container instance handles up to 80 simultaneous HTTP requests using Netty/Tomcat thread pools. Only when request #81 arrives does Cloud Run provision a second instance!
4. Traffic Splitting & Revision Management:
   - Every deployment creates an immutable Revision.
   - Cloud Run supports zero-downtime canary rollouts: route 90% of traffic to `v1` and 10% to `v2` with a single command, rolling back instantly if error rates spike.
5. Cloud Run Jobs: Dedicated execution mode for run-to-completion batch tasks (data migrations, nightly reporting) that run up to 24 hours.""",
        "iamConfiguration": """### Cloud Run Service IAM & Ingress Control

#### 1. Controlling Ingress (Restricting to Internal VPC & Load Balancer Only):
```bash
gcloud run deploy payment-service \
    --image=gcr.io/prod-fintech-44210/payment-svc:v1 \
    --ingress=internal-and-cloud-load-balancing \
    --service-account=payment-run-sa@prod-fintech-44210.iam.gserviceaccount.com
```

#### 2. Service-to-Service Authentication (Allowing Order Service to Call Payment Service):
```bash
# Grant 'run.invoker' role to the calling service account
gcloud run services add-iam-policy-binding payment-service \
    --region=us-central1 \
    --member="serviceAccount:order-service-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/run.invoker"
```""",
        "realWorldUseCase": "High-Volume Real-Time Payment Webhook Processor: An international payment gateway receives thousands of merchant webhooks per second. The application is packaged as a lightweight Spring Boot 3 / GraalVM Native Image container and deployed to Cloud Run with `--concurrency=100` and `--min-instances=2`. When Black Friday traffic surges from 50 req/sec to 15,000 req/sec, Cloud Run scales from 2 instances to 150 instances within seconds. GraalVM native compilation keeps cold start latency under 150ms.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🏃 Cloud Run Multi-Concurrency vs Traditional Serverless</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">100 Concurrent Requests</span>
            <span class="node-desc">Incoming burst of HTTP requests from clients</span>
          </div>
          <span class="flow-arrow-separator">──► Ingress Proxy ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">1x Cloud Run Container</span>
            <span class="node-desc">Concurrency = 100 handles all requests in ONE instance</span>
          </div>
          <span class="flow-arrow-separator">──► Zero Cold Start ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Downstream Backends</span>
            <span class="node-desc">Cloud SQL / PubSub receives processed payments</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          💰 <strong>Cost Advantage:</strong> AWS Lambda would boot 100 separate microVMs. Cloud Run boots ONE container instance, reducing memory footprint and cloud cost by 90%!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Secure Service-to-Service Call from Cloud Run
package com.company.client;

import com.google.auth.oauth2.IdTokenCredentials;
import com.google.auth.oauth2.IdTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class PaymentClient {

    private final WebClient webClient;

    public PaymentClient() {
        this.webClient = WebClient.builder()
                .baseUrl("https://payment-service-xyz.a.run.app")
                .build();
    }

    public String callPaymentService(String payload) throws Exception {
        // Fetch OpenID Connect (OIDC) ID token from GCP Metadata Server for service-to-service auth
        IdTokenProvider idTokenProvider = (IdTokenProvider) IdTokenCredentials.getApplicationCredentials();
        String idToken = idTokenProvider.idTokenWithTargetUrl("https://payment-service-xyz.a.run.app")
                .getTokenValue();

        return webClient.post()
                .uri("/process")
                .header("Authorization", "Bearer " + idToken)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}""",
        "complexPart": "CPU Throttling Outside Request Processing: By default, Cloud Run enforces CPU allocation 'only during request processing'. Once a container finishes returning an HTTP response, its CPU is immediately throttled to zero! If your application spins up an unmanaged background thread (e.g. `CompletableFuture.runAsync()`) to process work AFTER returning the HTTP response, the background task will freeze or take hours to complete! Solution: Enable 'CPU always allocated' or offload async tasks to Cloud Pub/Sub or Cloud Tasks.",
        "keyPoints": [
            "Runs standard Docker container images with automatic HTTPS, custom domains, and scale-to-zero.",
            "Supports multi-concurrency (up to 250 concurrent requests per instance), slashing serverless costs.",
            "Enforces secure kernel sandboxing via gVisor for safe multi-tenant container isolation.",
            "Built-in canary traffic splitting allows progressive rollout between revisions (e.g. 90/10 split).",
            "Use OIDC ID Tokens fetched from the GCP metadata server for authenticated service-to-service calls."
        ],
        "pitfall": "Attempting to perform asynchronous background work after sending the HTTP response when CPU is allocated only during requests. The CPU gets throttled to near-zero as soon as the response closes, halting your background thread until the next request happens to arrive!",
        "interviewTip": "When comparing AWS Lambda to GCP Cloud Run, highlight concurrency: 'Lambda enforces a 1-request-per-instance model which drives up cold starts and container counts. Cloud Run allows a single container to handle up to 250 concurrent requests, making it ideal for high-throughput Java web APIs at a fraction of the cost.'"
    },

    # 7. Cloud Pub/Sub
    {
        "id": "gcp-pubsub",
        "title": "Cloud Pub/Sub (Global Ingestion & Exactly-Once Distributed Messaging)",
        "category": "Networking & Messaging",
        "badge": "Managed Streaming Core",
        "whatIsIt": "Google Cloud Pub/Sub is a globally distributed, horizontally scalable, asynchronous messaging service that decouples services that produce events from services that process events. Pub/Sub provides durable message storage with automatic multi-zone replication, sub-100ms latency, and high availability with zero pre-provisioning. It supports both Pull and Push delivery, dead-letter topics, message ordering keys, and optional Exactly-Once Delivery guarantees.",
        "whenAndWhy": "When to use: Event-driven microservices architectures, distributed streaming data ingestion for BigQuery and Apache Beam / Cloud Dataflow, asynchronous workflow dispatch, and IoT telemetry ingestion. Why over Apache Kafka / RabbitMQ: Kafka requires complex cluster sizing, partition rebalancing, ZooKeeper/KRaft maintenance, and disk monitoring. Cloud Pub/Sub is truly serverless; it scales automatically from 1 msg/sec to millions of msgs/sec without partition rebalancing or broker management.",
        "internalWorking": """1. Topics and Subscriptions Architecture:
   - Publishers send messages to a Topic.
   - Multiple Subscriptions attach to a Topic. Each subscription receives a copy of every message (Pub/Sub fan-out).
2. Push vs Pull Subscriptions:
   - Pull Subscription: Worker services (GKE pods, Cloud Run) open streaming gRPC pull connections to fetch message batches and send `ack` acknowledgments.
   - Push Subscription: Pub/Sub automatically initiates an HTTPS POST webhook to an external endpoint or Cloud Run service with the message payload.
3. Message Ordering Keys:
   - By default, Pub/Sub delivers messages out of order to maximize parallel throughput.
   - When a publisher assigns an `ordering_key` (e.g. `customerId_1001`), Pub/Sub guarantees that messages sharing that key are delivered to subscribers in strict chronological sequence.
4. Exactly-Once Delivery Engine:
   - Standard messaging systems provide at-least-once delivery (retries cause duplicates if acks are delayed).
   - Cloud Pub/Sub's Exactly-Once Delivery mode uses an internal distributed transaction log. If an ack succeeds, any subsequent redelivery attempt is suppressed, preventing duplicate processing across distributed workers.
5. Dead Letter Topics & Exponential Backoff:
   - Messages that fail processing after a configurable number of delivery attempts (e.g. 5) are automatically forwarded to a Dead Letter Topic for investigation.""",
        "iamConfiguration": """### Cloud Pub/Sub IAM Access Configuration

#### 1. Publisher Role on Topic:
```bash
gcloud pubsub topics add-iam-policy-binding order-events \
    --member="serviceAccount:order-service-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/pubsub.publisher"
```

#### 2. Subscriber Role on Subscription:
```bash
gcloud pubsub subscriptions add-iam-policy-binding order-fulfillment-sub \
    --member="serviceAccount:fulfillment-service-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/pubsub.subscriber"
```

#### 3. Pub/Sub Service Agent Role for Push Subscriptions:
```bash
# Allow Pub/Sub to invoke private Cloud Run services
gcloud run services add-iam-policy-binding fulfillment-service \
    --member="serviceAccount:service-111122223333@gcp-sa-pubsub.iam.gserviceaccount.com" \
    --role="roles/run.invoker"
```""",
        "realWorldUseCase": """Real-Time Fraud Detection & Analytics Pipeline: When a credit card transaction occurs, the payment gateway publishes an event to the `card-transactions` Pub/Sub topic. Two subscriptions receive the event:
1. `fraud-detection-sub` (Pull): A low-latency GKE microservice pulls events, runs an ML fraud model, and approves/declines transactions within 40ms.
2. `bigquery-streaming-sub` (Direct BigQuery Subscription): Pub/Sub writes the raw event directly into a BigQuery audit table with zero intermediary code or server infrastructure!""",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📨 Cloud Pub/Sub Real-Time Streaming Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Publisher Microservice</span>
            <span class="node-desc">Publishes event with Ordering Key "customer_1001"</span>
          </div>
          <span class="flow-arrow-separator">──► Global Fan-Out ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Cloud Pub/Sub Topic</span>
            <span class="node-desc">Replicates across 3 zones; exactly-once delivery tracking</span>
          </div>
          <span class="flow-arrow-separator">──► Pull / Push ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Subscribers</span>
            <span class="node-desc">Streaming Pull on GKE &amp; Direct Streaming to BigQuery</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          ⚡ <strong>Direct-to-BigQuery:</strong> Pub/Sub can stream messages directly into BigQuery tables without requiring custom consumer code or Dataflow pipelines!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: Publishing to Cloud Pub/Sub with Ordering Key
package com.company.events.publisher;

import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class OrderEventPublisher {

    private final PubSubTemplate pubSubTemplate;

    public OrderEventPublisher(PubSubTemplate pubSubTemplate) {
        this.pubSubTemplate = pubSubTemplate;
    }

    public void publishOrder(String orderId, String customerId, String jsonPayload) {
        PubsubMessage message = PubsubMessage.newBuilder()
                .setData(ByteString.copyFrom(jsonPayload, StandardCharsets.UTF_8))
                .setOrderingKey(customerId) // Enforces chronological order per customer
                .putAttributes("orderId", orderId)
                .build();

        // Asynchronously publishes to Pub/Sub topic
        pubSubTemplate.publish("order-events", message);
    }
}""",
        "complexPart": "Ack Deadline Expiry vs Subscriber Flow Control: When a subscriber pulls a message, the ack deadline defaults to 10 seconds. If message processing involves an external database call taking 15 seconds, the ack deadline expires, and Pub/Sub redelivers the message to another consumer. If the consumer continues pulling new messages without acking old ones, an avalanche effect occurs, swamping the consumer with duplicate redeliveries. Solution: Enable Subscriber Flow Control (max outstanding messages limit) and configure Auto-Ack-Extension in the Google Cloud SDK.",
        "keyPoints": [
            "Globally distributed, horizontally scalable serverless messaging with sub-100ms latency.",
            "Supports both Pull (high throughput gRPC streaming) and Push (HTTPS webhook POST) subscriptions.",
            "Provides optional Exactly-Once Delivery to eliminate duplicate message processing.",
            "Message Ordering Keys guarantee strict chronological sequence for specific entity IDs.",
            "Features BigQuery and Cloud Storage Subscriptions that write events directly to storage with zero code."
        ],
        "pitfall": "Enabling Ordering Keys on a subscription but failing to ack a failed message. When ordering is enabled, if message #1 fails and is not acknowledged, Pub/Sub blocks all subsequent messages for that ordering key until message #1 succeeds or moves to a Dead Letter Topic, halting the processing pipeline for that entity!",
        "interviewTip": "Highlight Pub/Sub's direct integrations: 'Unlike Apache Kafka which requires Kafka Connect clusters to bridge data into warehouses, Cloud Pub/Sub features native BigQuery Subscriptions that write streaming events directly into BigQuery tables with zero infrastructure to manage.'"
    },

    # 8. Google BigQuery
    {
        "id": "gcp-bigquery",
        "title": "Google BigQuery (Serverless Petabyte-Scale Cloud Data Warehouse)",
        "category": "Analytics & Enterprise API",
        "badge": "Serverless Analytics Core",
        "whatIsIt": "Google BigQuery is a serverless, highly scalable, cost-effective multicloud enterprise data warehouse designed for business agility. Powered by Google's proprietary Dremel execution engine and Capacitor columnar storage format, BigQuery enables developers and data scientists to query petabytes of data in seconds using standard ANSI SQL. BigQuery completely separates storage from compute, features built-in Machine Learning (BigQuery ML), geospatial analysis, and sub-second BI dashboarding via BigQuery BI Engine.",
        "whenAndWhy": "When to use: Large-scale analytical processing (OLAP), enterprise data warehousing, real-time streaming analytics, business intelligence dashboards, and predictive machine learning models. Why over Redshift / Snowflake: BigQuery is 100% serverless—zero clusters to resize, zero vacuuming, zero disk management. It scales from zero to tens of thousands of compute slots instantly and charges either per-query (bytes scanned) or via predictable flat-rate editions.",
        "internalWorking": """1. Decoupled Compute and Storage:
   - Storage (Capacitor): Columnar format stored on Google Colossus file system. Columns are stored as separate files with proprietary run-length and dictionary encoding.
   - Compute (Dremel): Dynamically allocates thousands of worker slots (CPU cores + RAM) structured as a multi-tier tree. The root server distributes SQL operations to mixer nodes, which fan out work to leaf nodes reading directly from Colossus in parallel over Google's petabit Jupiter network.
2. Partitioning and Clustering:
   - Partitioning: Segregates table data by date/timestamp or integer range into discrete physical segments. Queries filtering on `WHERE date = '2026-11-23'` scan ONLY that partition, reducing bytes scanned and cost by 99%.
   - Clustering: Automatically sorts data within partitions based on up to 4 columns (e.g. `customer_id`, `status`). BigQuery skips entire storage blocks that don't match the query filter (block pruning).
3. BigQuery Storage Write API: High-performance streaming ingestion supporting gRPC streaming with exactly-once semantics, allowing millions of events per second to become instantly queryable.
4. Authorized Views & Column-Level Security: Allows users to query aggregated views without granting access to underlying raw tables, while Policy Tags enforce column-level data masking (e.g. masking SSNs or credit card numbers).""",
        "iamConfiguration": """### BigQuery Dataset IAM & Column-Level Security

#### 1. Granting Data Viewer Role on Specific Dataset:
```bash
gcloud bigquery datasets add-iam-policy-binding prod_analytics \
    --member="serviceAccount:reporting-service-sa@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataViewer"
```

#### 2. Column-Level Security Policy Tag (Restricting PII):
Using Google Cloud Data Catalog, attach a `High_PII` policy tag to the `ssn` column. Grant `roles/datacatalog.categoryFineGrainedReader` ONLY to authorized compliance service accounts. All other queries return masked values (`XXX-XX-XXXX`).""",
        "realWorldUseCase": "Real-Time Enterprise Analytics & Anomaly Detection: A global rideshare company streams 100,000 GPS coordinates, ride completions, and pricing events per second from Cloud Pub/Sub directly into BigQuery using the BigQuery Storage Write API. Anomaly detection models trained directly in SQL using BigQuery ML (`CREATE MODEL ... OPTIONS(model_type='kmeans')`) detect fraudulent driver behavior in under 5 seconds. Tableau executive dashboards query the same dataset via BigQuery BI Engine with sub-second response times.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">📊 BigQuery Decoupled Compute &amp; Storage Architecture</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">ANSI SQL Query</span>
            <span class="node-desc">WHERE date = CURRENT_DATE AND customer_id = 'C123'</span>
          </div>
          <span class="flow-arrow-separator">──► Dremel Multi-Tier Tree ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">1,000s of Dremel Slots</span>
            <span class="node-desc">Mixers &amp; leaf nodes execute parallel aggregations</span>
          </div>
          <span class="flow-arrow-separator">──► Jupiter Petabit Net ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Capacitor Columnar Storage</span>
            <span class="node-desc">Colossus reads ONLY requested columns &amp; clustered blocks</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          ⚡ <strong>Partition &amp; Cluster Pruning:</strong> Partitioning by Date and Clustering by Customer ID eliminates 98% of bytes scanned, slashing query time and cost!
        </div>
      </div>
    """,
        "codeSnippet": """// Java 17+ Spring Boot: BigQuery Parameterized SQL Query with Dry-Run Cost Estimation
package com.company.analytics.service;

import com.google.cloud.bigquery.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class BigQueryAnalyticsService {

    private final BigQuery bigquery;

    public BigQueryAnalyticsService(BigQuery bigquery) {
        this.bigquery = bigquery;
    }

    public void executeQueryWithCostProtection(String customerId) throws InterruptedException {
        String query = "SELECT status, COUNT(*) as total_orders " +
                "FROM `prod-fintech-44210.prod_analytics.orders` " +
                "WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) " +
                "AND customer_id = @customerId " +
                "GROUP BY status";

        QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(query)
                .addNamedParameter("customerId", QueryParameterValue.string(customerId))
                .setUseLegacySql(false)
                .setMaximumBytesBilled(10737418240L) // 10 GB limit protection
                .build();

        JobId jobId = JobId.of(UUID.randomUUID().toString());
        TableResult result = bigquery.query(queryConfig, jobId);

        result.iterateAll().forEach(row -> {
            System.out.printf("Status: %s, Count: %d%n",
                    row.get("status").getStringValue(),
                    row.get("total_orders").getLongValue());
        });
    }
}""",
        "complexPart": "SELECT * and the On-Demand Pricing Trap: BigQuery on-demand pricing bills $6.25 per TB of data scanned. Because Capacitor stores data in separate columnar files, a query requesting `SELECT status, count(*) ...` scans ONLY the `status` column bytes (e.g. 20MB = $0.0001). However, executing `SELECT * FROM giant_table` forces BigQuery to read EVERY single column from disk across all partitions, scanning 20 Terabytes ($125 for a single query!). Always forbid `SELECT *` and set `maximumBytesBilled` guards on client queries.",
        "keyPoints": [
            "Serverless enterprise data warehouse separating Dremel compute slots from Capacitor storage.",
            "Queries petabytes of data using standard ANSI SQL in seconds without server provisioning.",
            "Always use Partitioning (by date/time) and Clustering (by query keys) to eliminate wasted scan costs.",
            "BigQuery Storage Write API supports high-throughput streaming ingestion with exactly-once semantics.",
            "Never execute `SELECT *`; specify exact columns to leverage columnar compression benefits."
        ],
        "pitfall": "Running high-frequency single-row OLTP queries (`SELECT * FROM users WHERE id = 123` 500 times per second) against BigQuery. BigQuery is an OLAP data warehouse with ~1-2 second query planning latency; it is NOT an OLTP key-value database. For low-latency single-row lookups, use Cloud Bigtable or Cloud Spanner!",
        "interviewTip": "When asked how to optimize BigQuery performance and costs, immediately name four techniques: '1. Partition by timestamp to prune date slices; 2. Cluster by frequent filter keys to prune storage blocks; 3. Explicitly select only necessary columns to minimize bytes scanned; and 4. Set maximumBytesBilled on queries to prevent accidental runaway bills.'"
    },

    # 9. Apigee API Management
    {
        "id": "gcp-apigee",
        "title": "Apigee API Management (Enterprise API Gateway, Policy Pipeline & Security)",
        "category": "Analytics & Enterprise API",
        "badge": "Enterprise API Core",
        "whatIsIt": "Google Cloud Apigee is an enterprise-grade API management platform for designing, securing, analyzing, and scaling APIs across hybrid and multi-cloud environments. Apigee sits as a reverse proxy in front of backend microservices, executing a sophisticated, declarative policy pipeline (SpikeArrest, Quotas, OAuth2, VerifyAPIKey, JSONThreatProtection, XML-to-JSON transformations). It provides an automated Developer Portal for client onboarding, API key provisioning, monetization, and AI-driven API security threat analytics.",
        "whenAndWhy": "When to use: Enterprise API programs, public B2B partner integrations, open banking (PSD2), API monetization, and centralized security governance across heterogeneous multi-cloud backends. Why over simple gateways (API Gateway / Envoy): Basic gateways only handle basic routing and JWT checks; Apigee provides complete API lifecycle governance, self-service developer portals, sophisticated rate quota tiers per partner contract, and advanced anomaly threat detection.",
        "internalWorking": """1. API Proxy Flow Pipeline:
   Apigee processes requests through an ordered execution pipeline:
   - ProxyEndpoint (PreFlow ➔ Conditional Flows ➔ PostFlow): Executes security, authentication, and threat protection policies before routing.
   - TargetEndpoint (PreFlow ➔ Conditional Flows ➔ PostFlow): Transforms requests for backend microservices and sanitizes responses returning to the client.
2. Built-in Security & Rate Limiting Policies:
   - SpikeArrest: Smooths traffic spikes by converting limits to micro-increments (e.g. `120pm` allows 1 request every 500ms, rejecting sudden micro-bursts).
   - Quota: Enforces business-tier contractual limits (e.g. Bronze tier = 10,000 calls/month; Gold tier = 1,000,000 calls/month).
   - JSONThreatProtection: Enforces maximum JSON payload size, array depth, and string lengths to prevent parser denial-of-service attacks.
3. Apigee Hybrid & X Architecture:
   - Management Plane: Hosted and managed by Google Cloud, housing the UI, analytics, developer portal, and deployment pipeline.
   - Runtime Plane: Runs in the customer's private VPC (Apigee X) or on-premises Kubernetes cluster (Apigee Hybrid), ensuring client payload data never leaves private networks.
4. Advanced API Security (AI-Powered): Uses machine learning to detect credential stuffing, API scraping bots, and shadow API endpoints in real time.""",
        "iamConfiguration": """### Apigee IAM & Service Account Integration

To allow Apigee runtime to securely invoke private backend microservices on Google Cloud Run:

```bash
# 1. Create Apigee Backend Invoker Service Account
gcloud iam service-accounts create apigee-backend-invoker \
    --project=prod-fintech-44210

# 2. Grant Cloud Run Invoker Role to the Service Account
gcloud run services add-iam-policy-binding core-banking-service \
    --region=us-central1 \
    --member="serviceAccount:apigee-backend-invoker@prod-fintech-44210.iam.gserviceaccount.com" \
    --role="roles/run.invoker"

# 3. Configure Apigee TargetEndpoint with GoogleAuth token generation:
# In Apigee XML configuration:
# <Authentication>
#   <GoogleAccessToken>
#     <Scopes>
#       <Scope>https://www.googleapis.com/auth/cloud-platform</Scope>
#     </Scopes>
#   </GoogleAccessToken>
# </Authentication>
```""",
        "realWorldUseCase": "Open Banking PSD2 API Gateway: A commercial bank exposes regulated Open Banking APIs to third-party fintech apps (Plaid, Mint). Apigee sits at the perimeter, enforcing mutual TLS (mTLS), validating OAuth2 access tokens, and executing SpikeArrest to prevent DDoS attacks. When a fintech partner calls `/v1/accounts`, Apigee validates their API key, applies their specific contractual quota tier, logs analytics for monetization, and securely routes the request to internal core-banking microservices on GKE.",
        "visualDiagram": """
      <div class="visual-diagram-box">
        <div class="diagram-header-label">🛡️ Apigee Enterprise API Proxy Pipeline</div>
        <div class="flow-chain">
          <div class="flow-step-node node-blue">
            <span class="node-label">Partner / Mobile Client</span>
            <span class="node-desc">HTTPS request with mTLS &amp; API Key / Bearer Token</span>
          </div>
          <span class="flow-arrow-separator">──► Proxy Flow ──►</span>
          <div class="flow-step-node node-purple">
            <span class="node-label">Apigee Policy Pipeline</span>
            <span class="node-desc">SpikeArrest ➔ VerifyAPIKey ➔ Quota ➔ JSONThreat</span>
          </div>
          <span class="flow-arrow-separator">──► Target Flow ──►</span>
          <div class="flow-step-node node-green">
            <span class="node-label">Backend Microservice</span>
            <span class="node-desc">Clean, validated request arrives at private GKE / Cloud Run</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 0.76rem; color: #4285f4;">
          ⚡ <strong>Threat Mitigation:</strong> Malicious payload attacks, quota violations, and DDoS bursts are stopped dead at Apigee without reaching internal bank backends!
        </div>
      </div>
    """,
        "codeSnippet": """<!-- Apigee ProxyEndpoint XML: Production Security & Rate Limiting Pipeline -->
<ProxyEndpoint name="default">
  <PreFlow name="PreFlow">
    <Request>
      <!-- 1. Enforce burst rate limiting (1 request per 250ms) -->
      <Step>
        <Name>SpikeArrest-ProtectBackend</Name>
      </Step>
      <!-- 2. Validate Partner API Key -->
      <Step>
        <Name>VerifyAPIKey-PartnerKey</Name>
      </Step>
      <!-- 3. Prevent JSON payload buffer overflow attacks -->
      <Step>
        <Name>JSONThreatProtection-Sanitize</Name>
      </Step>
      <!-- 4. Enforce monthly contractual quota tier -->
      <Step>
        <Name>Quota-ContractualTier</Name>
      </Step>
    </Request>
    <Response/>
  </PreFlow>

  <HTTPProxyConnection>
    <BasePath>/v1/banking</BasePath>
    <VirtualHost>secure</VirtualHost>
  </HTTPProxyConnection>

  <RouteRule name="default">
    <TargetEndpoint>default</TargetEndpoint>
  </RouteRule>
</ProxyEndpoint>""",
        "complexPart": "SpikeArrest vs Quota Policy Behavioral Distinction: Engineers frequently confuse SpikeArrest with Quota. A Quota policy (e.g. 1000 requests per hour) allows all 1000 requests to arrive in the first 2 seconds, potentially melting downstream databases before blocking request 1001. A SpikeArrest policy (e.g. 60 requests per minute) calculates an interval (1 request per second) and rejects any rapid second request arriving within that 1-second window with `503 Service Unavailable`. Production APIs must ALWAYS combine BOTH policies!",
        "keyPoints": [
            "Enterprise API management platform providing proxy pipelines, security, and developer portals.",
            "Executes declarative policy pipelines: PreFlow, Conditional Flows, and PostFlow.",
            "Combine SpikeArrest (prevents micro-burst crashes) with Quota (enforces business tier limits).",
            "Apigee X architecture hosts the management plane in Google Cloud while runtime lives in private VPC.",
            "Features native Google Cloud IAM integration to authenticate seamlessly to Cloud Run and GKE."
        ],
        "pitfall": "Relying solely on Quota policies for API protection without SpikeArrest. A client with a quota of 100,000 calls per day could send all 100,000 calls simultaneously in a single 10-second burst, crashing your backend microservices while remaining completely within their daily quota!",
        "interviewTip": "Distinguish between a lightweight gateway and Apigee: 'Basic API gateways handle simple routing and JWT validation. Apigee is a full-lifecycle enterprise platform that provides partner developer portals, contractual quota tiers, SpikeArrest micro-burst leveling, monetization billing, and AI-driven API security threat protection.'"
    }
]


# =============================================================================
# BUILD SCRIPTS TO WRITE JAVASCRIPT FILES
# =============================================================================

def build_aws_file():
    output_path = os.path.join("js", "data", "aws-data.js")
    content = f"""// =============================================================================
// AWS Services & IAM Role Architecture Data Module
// Generated automatically by scripts/build_cloud_services.py
// =============================================================================

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {{}};

window.REVISION_APP_DATA.AWS_CATEGORIES = {json.dumps(AWS_CATEGORIES, indent=2)};

window.REVISION_APP_DATA.AWS_SERVICES = {json.dumps(AWS_SERVICES, indent=2)};
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Generated {output_path} successfully ({len(AWS_SERVICES)} AWS services).")


def build_gcp_file():
    output_path = os.path.join("js", "data", "gcp-data.js")
    content = f"""// =============================================================================
// Google Cloud Platform (GCP) Services & IAM Role Architecture Data Module
// Generated automatically by scripts/build_cloud_services.py
// =============================================================================

window.REVISION_APP_DATA = window.REVISION_APP_DATA || {{}};

window.REVISION_APP_DATA.GCP_CATEGORIES = {json.dumps(GCP_CATEGORIES, indent=2)};

window.REVISION_APP_DATA.GCP_SERVICES = {json.dumps(GCP_SERVICES, indent=2)};
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Generated {output_path} successfully ({len(GCP_SERVICES)} GCP services).")


if __name__ == "__main__":
    build_aws_file()
    build_gcp_file()
