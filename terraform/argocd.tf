# ---------------- ArgoCD install ----------------
resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = var.argocd_chart_version
  namespace        = var.argocd_namespace
  create_namespace = true

  # LoadBalancer ready hone tak wait karta hai
  wait    = true
  timeout = 900

  values = [yamlencode({
    server = {
      service   = { type = "LoadBalancer" }
      extraArgs = ["--insecure"] # HTTP par chalega; production mein TLS/Ingress lagayein
    }
  })]

  depends_on = [module.eks]
}

# ArgoCD ka auto-generated admin password
data "kubernetes_secret_v1" "argocd_admin" {
  metadata {
    name      = "argocd-initial-admin-secret"
    namespace = var.argocd_namespace
  }

  depends_on = [helm_release.argocd]
}

# ArgoCD ka LoadBalancer URL
data "kubernetes_service_v1" "argocd_server" {
  metadata {
    name      = "argocd-server"
    namespace = var.argocd_namespace
  }

  depends_on = [helm_release.argocd]
}

# ---------------- App namespace + RDS secret ----------------
resource "kubernetes_namespace_v1" "app" {
  metadata {
    name = var.app_namespace
  }

  depends_on = [module.eks]
}

locals {
  rds_connection_string = "Server=${aws_db_instance.mysql.address};Port=3306;Database=${var.db_name};User=${var.db_username};Password='${var.db_password}';SslMode=Preferred;"
}

# Deployment is secret se connection string leta hai (secretKeyRef: rds-conn / connection-string)
resource "kubernetes_secret_v1" "rds_conn" {
  metadata {
    name      = "rds-conn"
    namespace = kubernetes_namespace_v1.app.metadata[0].name
  }

  data = {
    "connection-string" = local.rds_connection_string
    "host"              = aws_db_instance.mysql.address
    "database"          = var.db_name
    "username"          = var.db_username
    "password"          = var.db_password
  }
}

# ---------------- ArgoCD Application (optional) ----------------
# Sirf tab banti hai jab app_repo_url diya ho
resource "helm_release" "argocd_apps" {
  count = var.app_repo_url == "" ? 0 : 1

  name       = "argocd-apps"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-apps"
  namespace  = var.argocd_namespace

  values = [yamlencode({
    applications = {
      medical-app = {
        namespace = var.argocd_namespace
        project   = "default"
        source = {
          repoURL        = var.app_repo_url
          targetRevision = var.app_repo_branch
          path           = var.app_repo_path
        }
        destination = {
          server    = "https://kubernetes.default.svc"
          namespace = var.app_namespace
        }
        syncPolicy = {
          automated   = { prune = true, selfHeal = true }
          syncOptions = ["CreateNamespace=true"]
        }
      }
    }
  })]

  # Ingress controller ke baad, taake app ka Ingress apply ho sake
  depends_on = [helm_release.argocd, helm_release.ingress_nginx]
}
