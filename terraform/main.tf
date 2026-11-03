terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "demo" {
  metadata {
    name = "product-demo"
  }
}

resource "kubernetes_persistent_volume_claim" "postgres" {
  metadata {
    name      = "postgres-data"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = { storage = "256Mi" }
    }
  }
}

resource "kubernetes_deployment" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }
  spec {
    replicas = 1
    selector { match_labels = { app = "postgres" } }
    template {
      metadata { labels = { app = "postgres" } }
      spec {
        security_context { fs_group = 999 }
        container {
          name  = "postgres"
          image = "postgres:16-alpine"
          args  = ["-c", "shared_buffers=16MB", "-c", "max_connections=20"]
          port { container_port = 5432 }
          env {
            name  = "POSTGRES_USER"
            value = "product"
          }
          env {
            name  = "POSTGRES_PASSWORD"
            value = "product"
          }
          env {
            name  = "POSTGRES_DB"
            value = "products"
          }
          volume_mount {
            name       = "data"
            mount_path = "/var/lib/postgresql/data"
          }
        }
        volume {
          name = "data"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.postgres.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }
  spec {
    selector = { app = "postgres" }
    port {
      port        = 5432
      target_port = 5432
    }
  }
}

resource "kubernetes_deployment" "app" {
  metadata {
    name      = "product-service"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }
  spec {
    replicas = 1
    selector { match_labels = { app = "product-service" } }
    template {
      metadata { labels = { app = "product-service" } }
      spec {
        container {
          name              = "product-service"
          image             = "product-service:1.0.0"
          image_pull_policy = "IfNotPresent"
          port { container_port = 8080 }
          env {
            name  = "SPRING_DATASOURCE_URL"
            value = "jdbc:postgresql://postgres:5432/products"
          }
          env {
            name  = "SPRING_DATASOURCE_USERNAME"
            value = "product"
          }
          env {
            name  = "SPRING_DATASOURCE_PASSWORD"
            value = "product"
          }
        }
      }
    }
  }
  depends_on = [kubernetes_service.postgres]
}

resource "kubernetes_service" "app" {
  metadata {
    name      = "product-service"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }
  spec {
    type     = "NodePort"
    selector = { app = "product-service" }
    port {
      port        = 8080
      target_port = 8080
      node_port   = 30080
    }
  }
}
