# ---------------- AWS Load Balancer Controller ----------------
# Ye controller AWS mein NLB/ALB banata hai jab Service type=LoadBalancer ya Ingress banta hai.

# IAM role (IRSA) - policy module ke andar built-in hai
module "lb_controller_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.44"

  role_name                              = "${var.project_name}-lb-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
}

resource "helm_release" "aws_lb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.lb_controller_chart_version
  namespace  = "kube-system"

  wait    = true
  timeout = 600

  values = [yamlencode({
    clusterName = module.eks.cluster_name
    region      = var.region
    vpcId       = module.vpc.vpc_id
    replicaCount = 1

    serviceAccount = {
      create = true
      name   = "aws-load-balancer-controller"
      annotations = {
        "eks.amazonaws.com/role-arn" = module.lb_controller_irsa.iam_role_arn
      }
    }
  })]

  depends_on = [module.eks]
}

# ---------------- ingress-nginx (ek NLB ke peeche) ----------------
resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  version          = var.ingress_nginx_chart_version
  namespace        = "ingress-nginx"
  create_namespace = true

  # NLB ready hone tak wait
  wait    = true
  timeout = 900

  values = [yamlencode({
    controller = {
      replicaCount = 2

      ingressClassResource = {
        name    = "nginx"
        default = true
      }

      service = {
        type = "LoadBalancer"
        annotations = {
          # AWS Load Balancer Controller is annotation par internet-facing NLB banata hai
          "service.beta.kubernetes.io/aws-load-balancer-type"                              = "external"
          "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type"                   = "ip"
          "service.beta.kubernetes.io/aws-load-balancer-scheme"                            = "internet-facing"
          "service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled" = "true"
        }
      }

      resources = {
        requests = { cpu = "100m", memory = "128Mi" }
      }
    }
  })]

  # LB controller pehle tayyar ho, warna Service ke liye NLB nahi banta
  depends_on = [helm_release.aws_lb_controller]
}

# NLB ka DNS naam
data "kubernetes_service_v1" "ingress_nginx" {
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }

  depends_on = [helm_release.ingress_nginx]
}

locals {
  ingress_host = try(data.kubernetes_service_v1.ingress_nginx.status[0].load_balancer[0].ingress[0].hostname, "pending")
}

output "app_url" {
  description = "Website (ingress.yaml apply hone ke baad khulegi)"
  value       = "http://${local.ingress_host}"
}

output "load_balancer_hostname" {
  value = local.ingress_host
}
