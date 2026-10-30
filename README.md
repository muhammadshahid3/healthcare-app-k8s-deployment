# MediBook: Healthcare Appointment Platform on AWS EKS

![Landing page](docs/screenshots/landing-page.png)

**MediBook** is a React and Laravel medical appointment application running on **Amazon EKS** (Kubernetes). Doctors publish their available time slots, and patients browse doctors and book the slot that suits them.

The entire AWS platform is created with a single **Terraform** project (VPC, EKS, RDS MySQL, Secrets Manager, ingress, Argo CD and monitoring), and the application is delivered through **GitOps with Argo CD**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Application Features](#application-features)
3. [Architecture](#architecture)
4. [Terraform Infrastructure](#terraform-infrastructure)
5. [How to Deploy](#how-to-deploy)
6. [Running Pods](#running-pods)
7. [GitOps with Argo CD](#gitops-with-argo-cd)
8. [Monitoring](#monitoring)
9. [Security Notes](#security-notes)
10. [Cost and Cleanup](#cost-and-cleanup)
11. [Project Structure](#project-structure)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Laravel (PHP) REST API |
| Database | Amazon RDS for MySQL 8.0 |
| Secrets | AWS Secrets Manager and Kubernetes Secret |
| Infrastructure as Code | Terraform (AWS, Helm and Kubernetes providers) |
| Orchestration | Amazon EKS, Kubernetes 1.33 |
| Ingress | ingress-nginx behind an AWS Network Load Balancer |
| GitOps / CD | Argo CD |
| Monitoring | Prometheus, Grafana and Node Exporter (kube-prometheus-stack) |
| Region | `ap-south-1` (Mumbai) |

---

## Application Features

- Patient and doctor registration and login
- Doctors manage their profile (name, education, specialization, about)
- Doctors add and delete booking slots
- Patients search doctors by name or specialization
- Patients book available slots and view their appointments
- A booked slot disappears from the available list, so there are no double bookings

**Doctor dashboard**

![Doctor dashboard](docs/screenshots/doctor-dashboard.png)

**Patient dashboard**

![Patient dashboard](docs/screenshots/patient-dashboard.png)

---

## Architecture

```
                               Internet
                                  │
                    AWS Network Load Balancer (internet-facing)
                                  │
                         ingress-nginx (2 replicas)
                  ┌───────────────┼────────────────────┐
                  │               │                    │
           Frontend (React)  Backend (Laravel)    /grafana (Grafana)
             2 pods             2 pods
                                  │
                                  │  reads DB credentials from the
                                  │  Kubernetes Secret "rds-conn"
                                  ▼
                        Amazon RDS MySQL 8.0
                     (private database subnets,
                      port 3306 open to EKS nodes only)

   ┌────────────────────────── VPC 10.0.0.0/16 (2 AZs) ──────────────────────────┐
   │  Public subnets   : NLB, NAT gateway                                         │
   │  Private subnets  : EKS worker nodes (t3.medium)                             │
   │  Database subnets : RDS MySQL                                                │
   └──────────────────────────────────────────────────────────────────────────────┘

   Git repo (k8s/ folder) ──► Argo CD (auto-sync, prune, self-heal) ──► EKS
   Prometheus + Node Exporter ──► Grafana
   AWS Secrets Manager: backup copy of the RDS credentials
```

---

## Terraform Infrastructure

The Terraform code is split by purpose into one file per component. It uses well-known community modules for the VPC, EKS and IAM role (IRSA) parts, and the Helm provider to install the platform add-ons.

### What each file does

| File | Creates | Details |
|---|---|---|
| `versions.tf` | Providers | AWS (`~> 5.60`), Helm (`~> 2.12`), Kubernetes (`~> 2.27`). Helm and Kubernetes providers get a fresh token from `aws eks get-token` on each run, so long applies do not fail with `Unauthorized`. Every AWS resource gets the tags `Project` and `ManagedBy=terraform`. |
| `variables.tf` | Inputs | Region, sizes, versions, passwords and the Git repo for Argo CD. Everything has a default except the two passwords. |
| `vpc.tf` | Network | VPC `10.0.0.0/16` over **2 Availability Zones** with **3 subnet tiers**: public, private and database. One shared NAT gateway. The subnet tags let Kubernetes place load balancers correctly. |
| `eks.tf` | Kubernetes cluster | EKS cluster in the private subnets, with a managed node group, the core add-ons (CoreDNS, kube-proxy, VPC CNI) and IRSA enabled. The user who runs Terraform becomes cluster admin. |
| `rds.tf` | Database | MySQL 8.0 instance, encrypted `gp3` storage, not publicly accessible, with a security group that allows port `3306` **only from the EKS nodes**. |
| `secrets.tf` | Secrets Manager | Secret `medical/rds/mysql` storing the username, password, host, port, database name and connection string. |
| `ingress.tf` | Traffic entry | AWS Load Balancer Controller (with its IAM role) and ingress-nginx. The controller creates an internet-facing **Network Load Balancer**. |
| `argocd.tf` | GitOps and DB secret | Installs Argo CD, creates the `medical` namespace and the `rds-conn` Kubernetes Secret, and creates the Argo CD `medical-app` application. |
| `monitoring.tf` | Observability | kube-prometheus-stack: Prometheus, Grafana (served at `/grafana`) and Node Exporter on every node. |
| `outputs.tf` | Outputs | Cluster name, `kubectl` command, RDS details, Argo CD URL and credentials. |

### Default sizing

| Item | Value |
|---|---|
| Kubernetes version | `1.33` |
| Worker nodes | `t3.medium`, desired 2 (min 1, max 3), AL2023 AMI |
| RDS | `db.t3.micro`, 20 GB (auto-scales up to 100 GB), 7-day backups, single AZ |
| VPC subnets | public `10.0.0.0/24`, `10.0.1.0/24`; private `10.0.10.0/24`, `10.0.11.0/24`; database `10.0.20.0/24`, `10.0.21.0/24` |
| Prometheus | 7 days retention, data stored in `emptyDir` (lost on pod restart) |

### How the pieces depend on each other

Terraform works out the order automatically, and this is the flow behind it:

```
vpc ──► eks ──┬──► rds (security group trusts the EKS node group) ──► Secrets Manager
              │
              ├──► AWS Load Balancer Controller (via IRSA) ──► ingress-nginx ──┬──► monitoring (Grafana ingress)
              │                                                                └──► Argo CD application
              │
              └──► Argo CD ──► "medical" namespace ──► "rds-conn" Secret
```

### How the database password reaches the application

1. You pass `db_password` to Terraform as a sensitive variable.
2. Terraform creates the RDS instance with it.
3. Terraform stores the credentials in **AWS Secrets Manager** (`medical/rds/mysql`).
4. Terraform also creates the Kubernetes Secret **`rds-conn`** in the `medical` namespace with the keys `host`, `database`, `username`, `password` and `connection-string`.
5. The backend Deployment reads its database settings from `rds-conn` through `secretKeyRef`.

So the password is never written in the application code or in the Kubernetes manifests in Git.

### How Argo CD gets the application

If you set `app_repo_url`, Terraform creates an Argo CD application named `medical-app` that watches the `k8s/` folder of this repository on the `main` branch. It uses automated sync with `prune` and `selfHeal`, so Git is the single source of truth. If `app_repo_url` is left empty, only Argo CD itself is installed.

---

## How to Deploy

### Prerequisites

- An AWS account and the AWS CLI configured (`aws configure`)
- Terraform `>= 1.5`
- `kubectl`
- Permissions to create VPC, EKS, RDS, IAM, Secrets Manager and load balancers

### 1. Provide the variables

Copy the example file and fill in your values:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

```hcl
db_password            = "choose-a-strong-password"
grafana_admin_password = "choose-another-strong-password"
app_repo_url           = "https://github.com/muhammadshahid3/healthcare-app-k8s-deployment.git"
```

`terraform.tfvars` is ignored by Git, so it is never pushed. You can also use environment variables instead: `export TF_VAR_db_password=...`.

### 2. Create the infrastructure

```bash
terraform init
terraform plan
terraform apply
```

The first apply takes around 20 to 30 minutes (EKS, RDS and the load balancer take the longest).

### 3. Connect kubectl

```bash
aws eks update-kubeconfig --region ap-south-1 --name medical-eks
kubectl get nodes
```

### 4. Get the URLs

```bash
terraform output app_url
terraform output grafana_url
terraform output argocd_url
terraform output -raw argocd_password
```

Argo CD then syncs the `k8s/` folder automatically, and the website opens on `app_url`.

---

## Running Pods

The application runs in the `medical` namespace with two replicas each for the frontend and the backend.

| Component | Replicas | Container Port |
|---|---|---|
| Frontend (React) | 2 | `80` |
| Backend (Laravel API) | 2 | `8000` |

```bash
kubectl -n medical get pods
```

![Frontend and backend pods running](docs/screenshots/app-pods-running.png)

All pods are `1/1 Running` with `0` restarts.

---

## GitOps with Argo CD

Argo CD runs in the `argocd` namespace and watches this repository.

```bash
kubectl get pod -n argocd
```

![Argo CD pods running](docs/screenshots/argocd-pods-running.png)

The `medical-app` application shows **Healthy** and **Synced** with auto-sync enabled. It manages the backend secret, the frontend and backend services, and the deployments with their pods.

![Argo CD application tree](docs/screenshots/argocd-ui.png)

To open the UI locally:

```bash
kubectl port-forward svc/argocd-server -n argocd 8081:80
# open http://localhost:8081  (user: admin)
```

---

## Monitoring

Prometheus scrapes pod and node metrics (Node Exporter runs on every worker node), and Grafana shows them: pod CPU, pod memory, node CPU and node memory. Grafana is available through the same load balancer at `/grafana`.

Alertmanager and the control-plane scrapers (etcd, scheduler, controller manager, kube-proxy) are disabled, because AWS manages the EKS control plane and they cannot be scraped.

![Grafana dashboard](docs/screenshots/grafana-dashboard.png)

---

## Security Notes

This project is built for learning and demonstration. Before using it in production, consider these points:

- **Terraform state contains secrets.** `terraform.tfstate` holds the database and Grafana passwords in plain text. It is excluded from Git. For a team setup, use a remote backend (S3 with encryption and DynamoDB locking).
- **Plain-text credentials output.** The `all_credentials` output prints passwords in the terminal. Remove it, or use `terraform output -raw <name>` for single values.
- **Argo CD runs over HTTP** (`--insecure`) behind its own load balancer. Use TLS and an Ingress for production.
- **The EKS API endpoint is public.** Restrict it with `cluster_endpoint_public_access_cidrs` or make it private.
- **RDS is single AZ** with `skip_final_snapshot` and no deletion protection. Enable Multi-AZ, deletion protection and a final snapshot for production.
- **Prometheus data uses `emptyDir`.** Metrics are lost when the pod restarts. Use a persistent volume if you need history.
- **Secrets are never committed.** `.tfvars`, `.tfstate`, `.terraform/` and `.env` files are listed in `.gitignore`.

---

## Cost and Cleanup

This stack creates billable AWS resources: the EKS control plane, two `t3.medium` nodes, a NAT gateway, a Network Load Balancer, a Load Balancer for Argo CD and an RDS instance.

When you are done, remove everything:

```bash
terraform destroy
```

Then check the EC2 console for leftover load balancers or volumes.

---

## Project Structure

```
.
├── terraform/
│   ├── versions.tf      # providers and authentication
│   ├── variables.tf     # all inputs and defaults
│   ├── vpc.tf           # VPC, subnets, NAT
│   ├── eks.tf           # EKS cluster and node group
│   ├── rds.tf           # MySQL and its security group
│   ├── secrets.tf       # AWS Secrets Manager
│   ├── ingress.tf       # Load Balancer Controller and ingress-nginx
│   ├── argocd.tf        # Argo CD, rds-conn secret, medical-app
│   ├── monitoring.tf    # Prometheus and Grafana
│   ├── outputs.tf       # URLs and credentials
│   └── terraform.tfvars.example
├── k8s/                 # Kubernetes manifests watched by Argo CD
├── docs/screenshots/
└── README.md
```

---

## Key Learnings

- Building a complete AWS platform as code with Terraform
- Running a Laravel and React application on Kubernetes (EKS)
- Network design with public, private and database subnets
- Keeping credentials out of code with Secrets Manager and Kubernetes Secrets
- Continuous delivery with GitOps (Argo CD auto-sync)
- Observing cluster and pod health with Prometheus and Grafana

---

## Author

**Muhammad Shahid**
GitHub: [@muhammadshahid3](https://github.com/muhammadshahid3)