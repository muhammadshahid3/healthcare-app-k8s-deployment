# k8s-eks (RDS + ECR + Ingress ke saath)

Ye folder aapke GitHub repo ke `k8s/` ki jagah jayega (Argo CD isi path ko dekhta hai).

Farq kind wale version se:
- MySQL pod nahi hai: database RDS hai (secret `rds-conn` Terraform banata hai)
- Services ClusterIP hain, bahar se traffic Ingress (NLB) se aata hai
- Images ECR se aati hain
- namespace.yaml nahi hai (Terraform namespace banata hai)
