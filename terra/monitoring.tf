# ---------------- Monitoring: Prometheus + Grafana + Node Exporter ----------------
# kube-prometheus-stack ek hi chart mein ye sab deta hai:
#   Prometheus, Grafana, node-exporter (har node par), kube-state-metrics, Prometheus Operator
# PV/PVC nahi: Prometheus data emptyDir mein hai (pod restart par purana data jata hai).
resource "helm_release" "monitoring" {
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  version          = var.monitoring_chart_version
  namespace        = var.monitoring_namespace
  create_namespace = true

  wait    = true
  timeout = 900

  values = [yamlencode({
    # Zaroorat nahi, resources bachane ke liye band
    alertmanager = { enabled = false }

    # EKS mein control plane AWS chalata hai, ye targets scrape nahi ho sakte
    kubeEtcd              = { enabled = false }
    kubeControllerManager = { enabled = false }
    kubeScheduler         = { enabled = false }
    kubeProxy             = { enabled = false }

    # Node Exporter (har node ka CPU / RAM / disk / network)
    nodeExporter = { enabled = true }

    prometheus = {
      prometheusSpec = {
        retention = var.prometheus_retention

        # Har namespace ke ServiceMonitor / PodMonitor utha le
        serviceMonitorSelectorNilUsesHelmValues = false
        podMonitorSelectorNilUsesHelmValues     = false

        resources = {
          requests = { cpu = "200m", memory = "512Mi" }
          limits   = { memory = "1Gi" }
        }
      }
    }

    grafana = {
      adminUser     = "admin"
      adminPassword = var.grafana_admin_password

      # OOMKilled se bachne ke liye memory badhayi (pehle limit 256Mi thi)
      resources = {
        requests = { cpu = "100m", memory = "256Mi" }
        limits   = { memory = "768Mi" }
      }

      # Grafana ingress ke peeche /grafana path par chalta hai
      "grafana.ini" = {
        server = {
          root_url            = "%(protocol)s://%(domain)s/grafana/"
          serve_from_sub_path = true
        }
      }

      ingress = {
        enabled          = true
        ingressClassName = "nginx"
        path             = "/grafana"
        pathType         = "Prefix"
      }
    }
  })]

  # Ingress controller pehle ho, warna Grafana ka Ingress create nahi hota
  depends_on = [helm_release.ingress_nginx]
}

output "grafana_url" {
  value = "http://${local.ingress_host}/grafana"
}

output "grafana_username" {
  value = "admin"
}

output "grafana_password" {
  value     = var.grafana_admin_password
  sensitive = true
}