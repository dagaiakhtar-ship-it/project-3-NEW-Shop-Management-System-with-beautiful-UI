# Installation, Deployment, and Security Hardening Guide

This document provides step-by-step instructions for installing, compiling, deploying, and hardening the **Single Shop Retail Management System** in local, server, or cloud-container environments.

---

## 1. System Requirements

Before installing, ensure your host environment meets the following specifications:
- **Node.js**: Version 18.x or 20.x (LTS recommended)
- **NPM**: Version 9.x or higher
- **RAM**: Minimum 1GB RAM (2GB recommended for builds)
- **Supported Browsers**: Google Chrome 90+, Microsoft Edge 90+, Mozilla Firefox 85+, Apple Safari 14+ (IndexedDB must be enabled).

---

## 2. Local Installation

Follow these instructions to run the application on a local development machine or terminal:

1. **Extract/Clone the Source Code**:
   ```bash
   tar -xvf shop-management-system.tar.gz
   cd shop-management-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in any custom variables if desired (the application runs completely offline even with empty values):
   ```bash
   cp .env.example .env
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Production Compilation & Packaging

To compile the application into high-performance static client assets bundled with a secure Node.js full-stack proxy:

1. **Run the Production Build**:
   ```bash
   npm run build
   ```
   This command executes a two-stage compilation:
   - **Client SPA Compilation**: Vite compiles and minifies all React, Tailwind CSS, and typescript assets into the `/dist` directory.
   - **Backend Server Bundle**: Esbuild bundles `server.ts` into a unified `dist/server.cjs` file, enabling rapid container boots and simple node execution.

2. **Run Compiled Production Server**:
   ```bash
   npm run start
   ```
   The application will bind to port `3000` and host `0.0.0.0`, serving the minified React SPA with full static optimization.

---

## 4. Cloud Container Deployment (Cloud Run / Docker)

The application is prepared for containerized deployment in high-availability clouds (e.g., Google Cloud Run, AWS ECS, or DigitalOcean App Platform).

### Sample `Dockerfile`
To dockerize the application for enterprise staging:

```dockerfile
# Stage 1: Build assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve assets
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Deploying to Google Cloud Run
1. Build and tag your Docker container image in Google Artifact Registry.
2. Deploy the container with CPU allocation on-demand (the app has extremely low cold-start overhead):
   ```bash
   gcloud run deploy shop-retail-service \
     --image gcr.io/your-project/shop-management:latest \
     --platform managed \
     --port 3000 \
     --allow-unauthenticated
   ```

---

## 5. Security Hardening Checklist

To protect sensitive financial registers and catalog margins in a production setting:

- [ ] **Enforce HTTPS Traffic**: All client-server transmissions must be served via SSL/TLS certificates (minimum TLS 1.2).
- [ ] **CORS Settings on Sheets**: Ensure the published Google Web App URL is queried only by recognized client origins if tighter network parameters are required.
- [ ] **Role Permissions enforcement**: Never bypass client roles (Cashier vs. Administrator) when configuring system modifications.
- [ ] **Audit Trail Integrity**: Do not clear the IndexedDB `auditLogs` table without archiving history records first.
- [ ] **Database Quota Allocation**: Regularly inspect storage quotas via the **System Audit Panel** to ensure disk writes are permitted.
