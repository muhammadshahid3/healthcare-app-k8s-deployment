variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix used for naming resources"
  type        = string
  default     = "medical"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.33"
}

variable "node_instance_type" {
  type    = string
  default = "t3.medium"
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 3
}

variable "db_name" {
  description = "Initial MySQL database name"
  type        = string
  default     = "medicaldb"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}




# ---------------- ArgoCD ----------------
variable "argocd_namespace" {
  type    = string
  default = "argocd"
}

variable "argocd_chart_version" {
  description = "argo-cd helm chart version. null = latest; production mein pin karein"
  type        = string
  default     = null
}

variable "app_namespace" {
  description = "Namespace jahan Medical app chalegi (RDS secret yahin banta hai)"
  type        = string
  default     = "medical"
}

variable "app_repo_url" {
  description = "Git repo URL jisme k8s manifests hain. Khali = ArgoCD Application nahi banegi"
  type        = string
  default     = ""
}

variable "app_repo_path" {
  type    = string
  default = "k8s"
}

variable "app_repo_branch" {
  type    = string
  default = "main"
}


# ---------------- Ingress + Load Balancer ----------------
variable "lb_controller_chart_version" {
  description = "aws-load-balancer-controller chart version. null = latest"
  type        = string
  default     = null
}

variable "ingress_nginx_chart_version" {
  description = "ingress-nginx chart version. null = latest"
  type        = string
  default     = null
}

# ---------------- Monitoring ----------------
variable "monitoring_namespace" {
  type    = string
  default = "monitoring"
}

variable "monitoring_chart_version" {
  description = "kube-prometheus-stack chart version. null = latest"
  type        = string
  default     = null
}

variable "prometheus_retention" {
  description = "Prometheus metrics kitne din rakhe"
  type        = string
  default     = "7d"
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}
