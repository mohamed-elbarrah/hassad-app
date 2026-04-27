<div align="center">
<!-- <img width="1200" height="475" alt="Hassad Platform Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" /> -->

# 🌾 Hassad Platform (V2
### The Ultimate SaaS Engine for Marketing Agencies — Redesigned for Scale
Built with **Strict Architecture** and **High-Performance Infrastructure**.

[![Turborepo](https://img.shields.io/badge/Maintained%20with-Turborepo-09d4ff.svg)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Powered%20by-Next.js-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748.svg)](https://prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 🚀 Overview (V2 Redesign)

**Hassad** (حَصاد) has undergone a complete architectural redesign (V2) to ensure enterprise-level stability, strict workflow enforcement, and modular scalability. The platform now features a unified data layer with over 40 tables and a redesigned API layer with 12 specialized modules.

### Key V2 Enhancements:
- **Strict State Control**: Mandatory history logging for all status transitions (Leads, Tasks).
- **Granular Permissions**: A robust RBAC system with both role-based and direct user permissions.
- **Unified Data Model**: Redesigned PostgreSQL schema with strict foreign key constraints and standard UUIDs.
- **Modular API**: A clean, scalable NestJS structure following the **V2 API Specification**.

---

## 🛠️ Tech Stack

### Core Infrastructure
- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: [NestJS 11](https://nestjs.com/) (REST API)
- **Database & ORM**: PostgreSQL 17 (Docker), [Prisma 6](https://prisma.io/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + RTK Query

### Security & Integrations
- **Authentication**: JWT + HttpOnly Cookies (Zero-JS Token Strategy)
- **Authorization**: Granular PermissionsGuard + RBAC Matrix
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible)
- **Deployment**: Docker, Docker Compose

---

## 📂 Repository Structure (V2)

```
hassad-platform/
├── apps/
│   ├── web/          ← Next.js (Dashboard + Client Portal)
│   └── api/          ← NestJS (Central API V2)
│       ├── prisma/   ← V2 Schema & Migrations
│       └── src/
│           ├── modules/ ← 12 Specialized API Modules
│           └── common/  ← Guards, Interceptors, Decorators
├── packages/
│   └── shared/       ← Shared Enums, DTOs, and Types
├── docker-compose.yml ← Infrastructure (DB, Redis)
└── turbo.json        ← Build pipeline configuration
```

---

## 🧱 Modular API Structure (V2)

Hassad V2 organizes the backend into independent, high-performance modules:

1.  **🟣 Core**: User management, RBAC, Roles, and Departments.
2.  **🔵 CRM**: Lead acquisition, contact logging, and automated pipeline stages.
3.  **🟠 Proposals**: Digital proposal creation, sharing, and approval flow.
4.  **🟠 Contracts**: Legal contract management with versioning and e-signing.
5.  **🟢 Projects**: Project lifecycle management and team membership.
6.  **🟢 Tasks**: Strictly enforced task flow (Assign → Start → Submit → Approve).
7.  **🟦 Portal**: Client-facing deliverables, revisions, and intake forms.
8.  **🔴 Marketing**: Campaign tracking, KPI snapshots, and A/B testing.
9.  **🟡 Finance**: Professional invoicing and financial support tickets.
10. **⚫ Chat**: Real-time internal and client-agency conversations.
11. **⚪ Notifications**: Unified notification event system (Email, Push, UI).
12. **🔵 AI Layer**: AI-driven analysis logs and proactive business suggestions.

---

## 🚦 Roadmap & Progress (V2)

| Phase | Feature Set | Status |
| :--- | :--- | :--- |
| **Foundation (V2)** | **Database Redesign & Migration** | ✅ **Done** |
| **Foundation (V2)** | **Modular API V2 Implementation** | ✅ **Done** |
| **Phase 1** | **Secure Auth & Permissions Guard** | ✅ **Done** |
| **Phase 2** | **CRM & Sales Pipeline (Strict Flow)** | ✅ **Done** |
| **Phase 3** | **Project & Task Management (Strict Flow)** | ✅ **Done** |
| **Phase 4** | **Client Portal & Deliverables** | ✅ **Done** |
| **Phase 5** | **Finance & Contract Versioning** | ✅ **Done** |
| **Phase 6** | **Marketing KPIs & AI Layer (Foundations)** | ✅ **Done** |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Installation
```bash
npm install
```

### 2. Database & Infrastructure
```bash
docker compose up -d postgres
```

### 3. Initialize V2 Database
```bash
# From apps/api
npx prisma migrate dev --name init_v2
npx prisma db seed
```
*Standard Users (Password: `password123`): `admin@hassad.com`, `pm@hassad.com`, `sales@hassad.com`*

### 4. Run Development Servers
```bash
npx turbo dev
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001/v1](http://localhost:3001/v1)

---

## 🔒 Security & Workflow Principles (V2)

1.  **Zero-JS Token Strategy**: Tokens are stored in HttpOnly cookies, invisible to XSS.
2.  **Granular Permissions**: Every single API action is scoped by a permission key.
3.  **Auditability**: Every lead stage change and task status update is logged in a history table.
4.  **No Hard Deletes**: All deletions use `is_active` or `is_archived` flags to preserve business data.
5.  **State Transition Validation**: Systems prevent invalid states (e.g., approving an unsubmitted task).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
