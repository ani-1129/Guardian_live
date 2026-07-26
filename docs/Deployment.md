# Deployment & Production Setup

This document describes how to deploy Guardian Live Enterprise into staging or production.

## Docker Compose Deployment

The simplest way to deploy the stack is by using the root `docker-compose.yml`:

```bash
docker-compose up --build -d
```

## Production Architecture (Kubernetes & Scaling)

For large-scale, high-concurrency systems, the architecture should be migrated to Kubernetes:

- **Horizontal Pod Autoscaling (HPA)**: Scaling FastAPI pods based on CPU/Memory or WebSocket connection metrics.
- **StatefulSets**: For PostgreSQL (HA setup with pgPool-II) and Redis (Sentinel/Cluster mode).
- **Ingress-Nginx Controller**: Manages routing, rate limiting, and CORS headers at the edge.

## CI/CD Pipeline

The project includes GitHub Actions template to build, test, and release container images:
1. **Linter and Tests**: Executes pytest on backend and tests on frontend.
2. **Docker Build & Push**: Builds container images and pushes them to private registries (ECR/GCR).
3. **Rolling Deploy**: Deploys images to K8s or virtual machines using green/blue strategy.
