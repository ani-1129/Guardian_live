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

---

## Render Deployment (Blueprint)

This repository includes a [render.yaml](file:///d:/internship/location/render.yaml) configuration file at the root to automatically spin up the entire backend stack (FastAPI Web Service, Celery Worker, PostgreSQL Database, and Redis Instance).

### Step-by-Step Deployment:

1. **Push Changes to GitHub**: Ensure the latest changes are pushed to your remote repository `https://github.com/ani-1129/Guardian_live`.
2. **Connect to Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New** in the top-right corner and select **Blueprint**.
   - Connect your GitHub account and select your repository (`Guardian_live`).
3. **Deploy the Blueprint**:
   - Render will read the `render.yaml` configuration.
   - Enter a Group Name (e.g., `guardian-live-stack`).
   - Click **Approve** to begin the deployment.
4. **Environment Variables**:
   - Render will automatically configure `DATABASE_URL` and `REDIS_URL` connection strings between the services.
   - The `JWT_SECRET` variable is automatically generated for the Web Service. Copy this generated value and add it manually under the Env Variables of `guardian-celery-worker` so that they match.

---

## Cloudflare Integration

To point your custom domain/subdomain to Render and route traffic securely through Cloudflare, follow these steps:

### 1. Cloudflare DNS Configuration
- Log in to the Cloudflare Dashboard and select your domain.
- Navigate to **DNS** > **Records**.
- Add a new **CNAME** record:
  - **Type**: `CNAME`
  - **Name**: `api` (or whichever subdomain you want to use for the backend)
  - **Target**: `<your-render-web-service-name>.onrender.com` (found in the Render Dashboard under your web service)
  - **Proxy status**: **Proxied** (Orange cloud enabled)

### 2. SSL/TLS Settings
- In the Cloudflare sidebar, click on **SSL/TLS**.
- Set the encryption mode to **Full** or **Full (strict)**. (Render automatically provides a valid SSL certificate for `onrender.com` domains, so either option will secure the connection between Cloudflare and Render).

### 3. WebSocket Configuration
Since the dashboard uses WebSockets (Socket.IO) for real-time tracking:
- Under **Network** settings in Cloudflare, ensure **WebSockets** toggle is enabled (turned ON).
- Render handles long-lived connections, but Cloudflare has a default HTTP request timeout of 100 seconds. The Socket.IO connection handles heartbeats automatically, keeping the connection alive.

### 4. Custom Domains in Render
- In your Render Dashboard, select the `guardian-backend` Web Service.
- Go to **Settings** > **Custom Domains**.
- Add your custom domain/subdomain (e.g. `api.yourdomain.com`).
- Render will check DNS records. Since you already pointed the CNAME in Cloudflare, this check will complete successfully.

