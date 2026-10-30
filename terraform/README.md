# infra (Terraform)

Files:
- vpc.tf, rds.tf, secrets.tf, argocd.tf, outputs.tf, versions.tf, variables.tf (pehle wali)
- eks.tf          EKS cluster + node group
- ecr.tf          ECR: medical-backend, medical-frontend
- ingress.tf      AWS Load Balancer Controller + ingress-nginx (NLB)
- monitoring.tf   Prometheus + Grafana + Node Exporter (kube-prometheus-stack)

## Chalane ka order

```bash
cp terraform.tfvars.example terraform.tfvars   # passwords badlein
terraform init

# Pehle network + cluster (helm/kubernetes providers ko cluster chahiye)
terraform apply -target=module.vpc -target=module.eks

# Phir baqi sab
terraform apply

terraform output
$(terraform output -raw configure_kubectl)
```

## Images ECR mein push karna

```bash
$(terraform output -raw ecr_login_command)

BACKEND=$(terraform output -raw ecr_backend_repository_url)
FRONTEND=$(terraform output -raw ecr_frontend_repository_url)

docker build -t $BACKEND:latest  ./Backend  && docker push $BACKEND:latest
docker build -t $FRONTEND:latest ./Frontend && docker push $FRONTEND:latest
```

## Saaf karna

Pehle Argo app delete karein (taake Ingress/NLB hat jaye), phir `terraform destroy`.
