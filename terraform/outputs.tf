output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}
output "configure_kubectl" {
  value = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}

output "rds_endpoint" {
  value = aws_db_instance.mysql.endpoint
}

output "rds_address" {
  value = aws_db_instance.mysql.address
}

output "rds_database" {
  value = aws_db_instance.mysql.db_name
}

output "rds_username" {
  value = aws_db_instance.mysql.username
}

# ---------------- ArgoCD + sab credentials ----------------
locals {
  argocd_host = try(data.kubernetes_service_v1.argocd_server.status[0].load_balancer[0].ingress[0].hostname, "pending")
}

output "argocd_url" {
  value = "http://${local.argocd_host}"
}

output "argocd_username" {
  value = "admin"
}

output "argocd_password" {
  value     = data.kubernetes_secret_v1.argocd_admin.data["password"]
  sensitive = true
}

output "rds_password" {
  value     = var.db_password
  sensitive = true
}

output "rds_connection_string" {
  value     = local.rds_connection_string
  sensitive = true
}

# Sab kuch ek jagah (plain text). Dhyan: password terminal/logs mein dikhega.
output "all_credentials" {
  value = {
    argocd = {
      url      = "http://${local.argocd_host}"
      username = "admin"
      password = nonsensitive(data.kubernetes_secret_v1.argocd_admin.data["password"])
    }
    rds = {
      endpoint          = aws_db_instance.mysql.endpoint
      database          = var.db_name
      username          = var.db_username
      password          = nonsensitive(var.db_password)
      connection_string = nonsensitive(local.rds_connection_string)
    }
    eks = {
      cluster_name = module.eks.cluster_name
      kubectl      = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
    }
  }
}
