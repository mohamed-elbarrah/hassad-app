<div align="center">
<!-- <img width="1200" height="475" alt="Hassad Platform Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" /> -->

# 🌾 Hassad Platform
### The Ultimate SaaS Engine for Marketing Agencies

[![Turborepo](https://img.shields.io/badge/Maintained%20with-Turborepo-09d4ff.svg)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Powered%20by-Next.js-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E.svg)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 🚀 Overview

**Hassad** (حَصاد - Harvest) is a comprehensive, enterprise-grade SaaS platform specifically designed for marketing agencies. It streamlines the entire agency lifecycle: from initial lead acquisition in the CRM to project execution, financial management, and advanced marketing campaign analytics.

Built with a modern monorepo architecture, Hassad provides a unified experience for both agency internal teams and their clients via a dedicated secure portal.

---

## 🛠️ Tech Stack

### Core Infrastructure
- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: [NestJS 11](https://nestjs.com/) (REST API)
- **Database & ORM**: PostgreSQL 17, [Prisma 6](https://prisma.io/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + RTK Query

### Security & Integrations
- **Authentication**: JWT + HttpOnly Cookies (Zero-JS Token Strategy)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible)
- **Payments**: [Moyasar](https://moyasar.com/)
- **Deployment**: Docker, Docker Compose

---

## 📂 Repository Structure

```
hassad-platform/
├── apps/
│   ├── web/          ← Next.js (Dashboard + Client Portal)
│   └── api/          ← NestJS (Central API)
├── packages/
│   └── shared/       ← Shared Zod schemas, TypeScript types, and Enums
├── docker-compose.yml ← Infrastructure (DB, Redis)
└── turbo.json        ← Build pipeline configuration
```

---

## 🚦 Roadmap & Progress

| Phase | Feature Set | Status |
| :--- | :--- | :--- |
| **Foundation** | Monorepo setup, Prisma schemas, Shared Package | ✅ **Done** |
| **Phase 1** | **Secure Auth (HttpOnly) & RBAC Matrix** | ✅ **Done** |
| **Phase 2** | CRM & Sales Pipeline Management | 🏗️ *In Progress* |
| **Phase 3** | Project Management & Task Tracking | ⏳ Planned |
| **Phase 4** | Client Portal (Project visibility, Invoices) | ⏳ Planned |
| **Phase 5** | Finance (Invoicing, Moyasar Integration) | ⏳ Planned |
| **Phase 6** | Marketing Campaigns & AI Layer | ⏳ Planned |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create `.env` files based on the templates:
- `apps/api/.env` (Copy from `apps/api/.env.example`)
- `apps/web/.env.local` (Copy from `apps/web/.env.example`)

### 3. Spin up Infrastructure
```bash
docker compose up -d postgres
```

### 4. Run Development Servers
```bash
# From the root
npx turbo dev
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001/v1](http://localhost:3001/v1)

---

## 🔒 Security Principles

Hassad employs a **Security-First** approach:
- **HttpOnly Cookies**: No session tokens are accessible via JavaScript, neutralizing XSS risks.
- **Strict RBAC**: Every endpoint and UI component respects a predefined role-access matrix.
- **Sanitized Inputs**: Zero-trust policy on all incoming data, validated via Zod on both client and server.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
