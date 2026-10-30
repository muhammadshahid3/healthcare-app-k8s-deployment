# EKS cluster + managed node group.
# (Purani zip mein ye file nahi thi, lekin baqi files module.eks use karti hain.
#  Agar aapke paas pehle se eks.tf hai to ye file mat rakhein.)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.31"

  cluster_name    = "${var.project_name}-eks"
  cluster_version = var.kubernetes_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true # jis user ne terraform chalaya, wo cluster admin

  # IRSA (pods ko IAM role dene ke liye) - AWS Load Balancer Controller ko chahiye
  enable_irsa = true

  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
  }

  eks_managed_node_group_defaults = {
    # Kubernetes 1.33 par AL2 AMI nahi milti, is liye AL2023 zaroori hai
    ami_type = "AL2023_x86_64_STANDARD"
  }

  eks_managed_node_groups = {
    default = {
      instance_types = [var.node_instance_type]
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_desired_size
    }
  }
}
