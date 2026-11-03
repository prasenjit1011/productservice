# Product and Customer API

A small Product and Customer API built with Spring Boot and Hibernate, backed by PostgreSQL, and deployed to Kubernetes with either raw manifests or Terraform.

## What you get

| Piece | Where |
| --- | --- |
| REST API | `app/` |
| Local PostgreSQL | `docker-compose.yml` |
| Kubernetes YAML | `k8s/product-demo.yaml` |
| Terraform (Kubernetes provider) | `terraform/` |

Hibernate creates and updates the `products`, `customers`, and `purchases` tables (`spring.jpa.hibernate.ddl-auto=update`).

Product code lives in `com.nutrisoft.product`. Customer code lives in `com.nutrisoft.customer`. Purchase code lives in `com.nutrisoft.purchase`.

Rule: a customer can buy only **1 product within 45 minutes**. A second buy inside that window returns HTTP 409.

## API

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/products` | |
| `GET` | `/api/products/{id}` | |
| `POST` | `/api/products` | `{ "name", "description", "price", "stock" }` |
| `PUT` | `/api/products/{id}` | same as create |
| `DELETE` | `/api/products/{id}` | |
| `GET` | `/api/customers` | |
| `GET` | `/api/customers/{id}` | |
| `POST` | `/api/customers` | `{ "name", "email", "phone" }` |
| `PUT` | `/api/customers/{id}` | same as create |
| `DELETE` | `/api/customers/{id}` | |
| `GET` | `/api/purchases` | |
| `POST` | `/api/purchases` | `{ "customerId", "productId" }` |

```json
{
  "name": "Notebook",
  "description": "A5 ruled",
  "price": 4.50,
  "stock": 20
}
```

## Run on your machine

Needs Java 17 and Maven. Start PostgreSQL, then the API.

```powershell
docker compose up -d
cd app
mvn spring-boot:run
```

UI: `http://localhost:8080/` · Products: `/products.html` · Customers: `/customers.html` · Purchases: `/purchases.html`

API: `http://localhost:8080/api/products`

Database defaults: user `product`, password `product`, database `products`, port `5432`.

```powershell
curl -X POST http://localhost:8080/api/products -H "Content-Type: application/json" -d "{\"name\":\"Notebook\",\"description\":\"A5 ruled\",\"price\":4.50,\"stock\":20}"
curl http://localhost:8080/api/products
curl -X POST http://localhost:8080/api/customers -H "Content-Type: application/json" -d "{\"name\":\"Ada Lovelace\",\"email\":\"ada@example.com\",\"phone\":\"555-0100\"}"
curl http://localhost:8080/api/customers
curl -X POST http://localhost:8080/api/purchases -H "Content-Type: application/json" -d "{\"customerId\":1,\"productId\":1}"
```


## Run on Kubernetes

Needs Docker, kubectl, and a local cluster (Docker Desktop Kubernetes is the simplest). Build the image so the cluster can see it (`imagePullPolicy: IfNotPresent`).

```powershell
docker build -t product-service:1.0.0 ./app
kubectl apply -f k8s/product-demo.yaml
kubectl -n product-demo rollout status deploy/product-service
```

UI: `http://localhost:30080/` · API: `http://localhost:30080/api/products`

If you use minikube or kind, load the image into that cluster before the pods start:

```powershell
minikube image load product-service:1.0.0
# or
kind load docker-image product-service:1.0.0
```

Use either `k8s/product-demo.yaml` or Terraform for the `product-demo` namespace.

## Deploy with Terraform

Needs Terraform 1.5+ and a working kubeconfig.

```powershell
docker build -t product-service:1.0.0 ./app
cd terraform
terraform init
terraform apply
```

Terraform is a single file, `terraform/main.tf`. It reads `~/.kube/config` and the current context. On Windows a typical context is `docker-desktop`. The database user, password, and name are `product` / `product` / `products`.

Remove the stack with `terraform destroy`, or with `kubectl delete -f k8s/product-demo.yaml` if you applied the manifest.

## Deploy with GitHub Actions

`.github/workflows/deploy.yml` runs on every push to `main` or `master`, and from the Actions tab. It packages the API, pushes the image to GitHub Container Registry, and applies `k8s/product-demo.yaml`.

The image is `ghcr.io/<github-owner>/product-service`.

Add these repository secrets before the first deploy:

| Secret | Value |
| --- | --- |
| `KUBE_CONFIG` | kubeconfig contents for the target cluster |
| `GHCR_USERNAME` | GitHub username. Required only when the package is private |
| `GHCR_TOKEN` | Personal access token with `read:packages`. Required only when the package is private |

GitHub Packages creates the container as private. Make the `product-service` package public, or set the two `GHCR_*` secrets so the cluster can pull the image.

This workflow applies `k8s/product-demo.yaml`. Leave Terraform unused for the `product-demo` namespace.

After a successful deploy, the workflow waits **20 minutes**, then deletes the entire `product-demo` namespace (pods, services, PVC, secrets, everything).

From **Actions → Deploy → Run workflow** you can choose:

| Action | What it does |
| --- | --- |
| `deploy` | Build, push, apply, wait 20 minutes, then delete the namespace |
| `destroy` | Delete the `product-demo` namespace immediately |

Manual teardown without waiting:

```powershell
kubectl delete namespace product-demo
```
