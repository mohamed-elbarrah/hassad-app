import { PrismaClient } from "@prisma/client";
import { ClientCounterService } from "../src/modules/crm/services/client-counter.service";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // ── Clear transactional data ONLY (preserve users, roles, permissions) ─────
  await prisma.notification.deleteMany();
  await prisma.notificationEvent.deleteMany();
  await prisma.campaignKpiSnapshot.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.paymentTicket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.clientSnoozedItem.deleteMany();
  await prisma.clientHistoryLog.deleteMany();
  await prisma.clientRevisionRequest.deleteMany();
  await prisma.projectRevisionRequest.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.taskFile.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskStatusHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectPeriodHistory.deleteMany();
  await prisma.projectMeeting.deleteMany();
  await prisma.projectPeriod.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractStatusHistory.deleteMany();
  await prisma.contractPaymentPlan.deleteMany();
  await prisma.contractVersion.deleteMany();
  await prisma.legacyContractMigrationReview.deleteMany();
  await prisma.legacyLeadMigration.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.requestAutomationLog.deleteMany();
  await prisma.requestAutomationRule.deleteMany();
  await prisma.crmNote.deleteMany();
  await prisma.requestService.deleteMany();
  await prisma.requestStatusHistory.deleteMany();
  await prisma.request.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany({ where: { email: "client2@hassad.com" } });
  await prisma.salary.deleteMany();
  await prisma.ledger.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.satisfactionRating.deleteMany();
  await prisma.internalRating.deleteMany();
  await prisma.staffWorkload.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.campaignKpiAuditLog.deleteMany();
  await prisma.contractRenewalAlert.deleteMany();
  await prisma.taskDelayAlert.deleteMany();
  await prisma.adminActionLog.deleteMany();
  await prisma.systemEventLog.deleteMany();
  await prisma.reportSnapshot.deleteMany();
  await prisma.externalServiceHealth.deleteMany();
  await prisma.systemError.deleteMany();
  await prisma.systemHealthCheck.deleteMany();
  await prisma.pmDisputeStats.deleteMany();
  await prisma.disputeAttachment.deleteMany();
  await prisma.disputeMessage.deleteMany();
  await prisma.disputeHistory.deleteMany();
  await prisma.disputeTicket.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.portalIntakeForm.deleteMany();
  await prisma.aiAnalysisLog.deleteMany();
  await prisma.aiSuggestion.deleteMany();

  // ── Reference data (upsert — never deleted) ──────────────────────────────────

  // Service Catalog
  const KNOWN_SERVICE_IDS = [
    "svc-branding",
    "svc-landing",
    "svc-ads",
    "svc-content",
  ];

  // Clean up orphan service rows that may have been created by accidental create() calls
  await prisma.requestService.deleteMany({
    where: { serviceId: { notIn: KNOWN_SERVICE_IDS } },
  });
  await prisma.deliverableTemplate.deleteMany({
    where: { serviceId: { notIn: KNOWN_SERVICE_IDS } },
  });
  await prisma.serviceCatalog.deleteMany({
    where: { id: { notIn: KNOWN_SERVICE_IDS } },
  });

  const services = await Promise.all([
    prisma.serviceCatalog.upsert({
      where: { id: "svc-branding" },
      update: {},
      create: {
        id: "svc-branding",
        name: "Brand Identity",
        nameAr: "الهوية البصرية",
        description: "Complete brand identity design",
        descriptionAr: "تصميم هوية بصرية متكاملة",
        category: "BRANDING",
        estimatedDays: 14,
        basePrice: 5000,
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.serviceCatalog.upsert({
      where: { id: "svc-landing" },
      update: {},
      create: {
        id: "svc-landing",
        name: "Landing Page",
        nameAr: "صفحة الهبوط",
        description: "Responsive landing page design and development",
        descriptionAr: "تصميم وتطوير صفحة هبوط متجاوبة",
        category: "WEB_DEVELOPMENT",
        estimatedDays: 7,
        basePrice: 3000,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.serviceCatalog.upsert({
      where: { id: "svc-ads" },
      update: {},
      create: {
        id: "svc-ads",
        name: "Ad Campaign Management",
        nameAr: "إدارة الحملات الإعلانية",
        description: "Social media ad campaign setup and management",
        descriptionAr: "إعداد وإدارة حملات إعلانية على وسائل التواصل الاجتماعي",
        category: "ADVERTISING",
        estimatedDays: 30,
        basePrice: 8000,
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.serviceCatalog.upsert({
      where: { id: "svc-content" },
      update: {},
      create: {
        id: "svc-content",
        name: "Content Creation",
        nameAr: "إنشاء المحتوى",
        description: "Social media content creation and scheduling",
        descriptionAr: "إنشاء وجدولة محتوى وسائل التواصل الاجتماعي",
        category: "CONTENT_CREATION",
        estimatedDays: 30,
        basePrice: 4000,
        isActive: true,
        sortOrder: 4,
      },
    }),
  ]);

  // Deliverable Templates
  await prisma.deliverableTemplate.deleteMany();
  await prisma.deliverableTemplate.createMany({
    data: [
      {
        serviceId: services[0].id,
        title: "Brand Logo Design",
        titleAr: "تصميم شعار العلامة التجارية",
        description: "3 logo variants",
        descriptionAr: "3 خيارات للشعار",
        sortOrder: 1,
      },
      {
        serviceId: services[0].id,
        title: "Brand Guidelines",
        titleAr: "دليل الهوية البصرية",
        description: "Complete brand style guide",
        descriptionAr: "دليل شامل للهوية البصرية",
        sortOrder: 2,
      },
      {
        serviceId: services[0].id,
        title: "Business Card Design",
        titleAr: "تصميم بطاقة العمل",
        description: "Professional business card design",
        descriptionAr: "تصميم بطاقة عمل احترافية",
        sortOrder: 3,
      },
      {
        serviceId: services[1].id,
        title: "Landing Page Design",
        titleAr: "تصميم صفحة الهبوط",
        description: "UI/UX design for landing page",
        descriptionAr: "تصميم واجهة صفحة الهبوط",
        sortOrder: 1,
      },
      {
        serviceId: services[1].id,
        title: "Landing Page Development",
        titleAr: "تطوير صفحة الهبوط",
        description: "Front-end development",
        descriptionAr: "تطوير واجهة صفحة الهبوط",
        sortOrder: 2,
      },
      {
        serviceId: services[2].id,
        title: "Campaign Strategy",
        titleAr: "استراتيجية الحملة الإعلانية",
        description: "Ad campaign strategy document",
        descriptionAr: "وثيقة استراتيجية الحملة الإعلانية",
        sortOrder: 1,
      },
      {
        serviceId: services[2].id,
        title: "Ad Creative Design",
        titleAr: "تصميم الإعلانات",
        description: "Creative assets for the ad campaign",
        descriptionAr: "تصميم الأصول الإبداعية للحملة",
        sortOrder: 2,
      },
      {
        serviceId: services[2].id,
        title: "Campaign Launch & Management",
        titleAr: "إطلاق وإدارة الحملة",
        description: "Launching and managing the ad campaign",
        descriptionAr: "إطلاق وإدارة الحملة الإعلانية",
        sortOrder: 3,
      },
      {
        serviceId: services[3].id,
        title: "Content Calendar",
        titleAr: "تقويم المحتوى",
        description: "Monthly content calendar",
        descriptionAr: "تقويم المحتوى الشهري",
        sortOrder: 1,
      },
      {
        serviceId: services[3].id,
        title: "Social Media Posts",
        titleAr: "منشورات وسائل التواصل",
        description: "Design and copy for social media posts",
        descriptionAr: "تصميم ونصوص المنشورات",
        sortOrder: 2,
      },
    ],
  });

  // ── Reference config: currency, company settings, bank, payment gateway ──────
  // (upsert — never deleted; supports the contract-periods-and-billing feature)

  // Currency: SAR as the default/base currency (exchangeRate 1)
  await prisma.currencySetting.upsert({
    where: { code: "SAR" },
    update: { isDefault: true, isActive: true, exchangeRate: 1 },
    create: {
      code: "SAR",
      name: "Saudi Riyal",
      symbol: "SAR",
      isDefault: true,
      isActive: true,
      exchangeRate: 1,
      symbolType: "TEXT",
    },
  });

  // Company settings consumed by the billing/period engine (admin-only to change)
  const companySettings: Array<{ key: string; value: any }> = [
    { key: "timezone", value: "Asia/Riyadh" },
    { key: "down_payment_grace_days", value: 14 },
    { key: "reminder_offset_days", value: [5, 3, 0] },
    { key: "suspend_on_overdue", value: true },
  ];
  for (const s of companySettings) {
    await prisma.companySetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  // Bank account (manual transfer target)
  await prisma.bankAccount.upsert({
    where: { id: "bank-alrajhi-main" },
    update: {},
    create: {
      id: "bank-alrajhi-main",
      accountName: "Hassad Platform — Operating Account",
      iban: "SA0380000000608010167519",
      bankName: "Al Rajhi Bank",
      swiftCode: "RJHISARI",
      instructions:
        "يرجى إرسال إيصال التحويل عبر البوابة لتفعيل المشروع بعد دفع الدفعة المقدمة.",
      isActive: true,
    },
  });

  // Payment gateway — manual (bank transfer) for dev; online gateways (Moyasar) added in prod
  await prisma.paymentGateway.upsert({
    where: { id: "gw-manual-bank" },
    update: {},
    create: {
      id: "gw-manual-bank",
      name: "Manual Bank Transfer",
      type: "MANUAL",
      isActive: true,
      configJson: { bankAccountId: "bank-alrajhi-main" },
    },
  });

  // Roles
  const roleNames = [
    "ADMIN",
    "PM",
    "SALES",
    "TEAM",
    "MARKETING",
    "ACCOUNTANT",
    "CLIENT",
  ];
  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Departments
  const deptNames = [
    "MANAGEMENT",
    "DESIGN",
    "CONTENT",
    "DEVELOPMENT",
    "MARKETING",
    "PRODUCTION",
  ];
  for (const name of deptNames) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Users
  const userDefs = [
    {
      key: "ADMIN",
      email: "admin@hassad.com",
      name: "Super Admin",
      role: "ADMIN",
      phoneWhatsapp: "+966500000101",
    },
    {
      key: "PM",
      email: "pm@hassad.com",
      name: "Layla PM",
      role: "PM",
      dept: "MANAGEMENT",
      phoneWhatsapp: "+966500000102",
    },
    {
      key: "SALES",
      email: "sales@hassad.com",
      name: "Omar Sales",
      role: "SALES",
      phoneWhatsapp: "+966500000103",
    },
    {
      key: "TEAM",
      email: "employee@hassad.com",
      name: "Hana Designer",
      role: "TEAM",
      dept: "DESIGN",
      phoneWhatsapp: "+966500000104",
    },
    {
      key: "MARKETING",
      email: "marketing@hassad.com",
      name: "Ziad Marketing",
      role: "MARKETING",
      dept: "MARKETING",
      phoneWhatsapp: "+966500000105",
    },
    {
      key: "ACCOUNTANT",
      email: "accountant@hassad.com",
      name: "Sara Accountant",
      role: "ACCOUNTANT",
      phoneWhatsapp: "+966500000106",
    },
    {
      key: "CLIENT1",
      email: "client@hassad.com",
      name: "فيصل القحطاني",
      role: "CLIENT",
      phoneWhatsapp: "+966501234567",
    },
    {
      key: "PM2",
      email: "pm2@hassad.com",
      name: "Fadi Kareem",
      role: "PM",
      dept: "MANAGEMENT",
      phoneWhatsapp: "+966500000107",
    },
    {
      key: "SALES2",
      email: "sales2@hassad.com",
      name: "Mona Saleh",
      role: "SALES",
      phoneWhatsapp: "+966500000108",
    },
    {
      key: "TEAM_CONTENT",
      email: "content1@hassad.com",
      name: "Lina Haddad",
      role: "TEAM",
      dept: "CONTENT",
      phoneWhatsapp: "+966500000109",
    },
    {
      key: "TEAM_DEV",
      email: "dev1@hassad.com",
      name: "Kareem Nasser",
      role: "TEAM",
      dept: "DEVELOPMENT",
      phoneWhatsapp: "+966500000110",
    },
    {
      key: "TEAM_PRODUCTION",
      email: "production1@hassad.com",
      name: "Rawan Ali",
      role: "TEAM",
      dept: "PRODUCTION",
      phoneWhatsapp: "+966500000111",
    },
    {
      key: "MARKETING2",
      email: "marketing2@hassad.com",
      name: "Noura Growth",
      role: "MARKETING",
      dept: "MARKETING",
      phoneWhatsapp: "+966500000112",
    },
    {
      key: "CLIENT2",
      email: "client2@hassad.com",
      name: "Rana Khaled",
      role: "CLIENT",
      phoneWhatsapp: "+966500000113",
    },
    {
      key: "CLIENT3",
      email: "client3@hassad.com",
      name: "Majed Al Noor",
      role: "CLIENT",
      phoneWhatsapp: "+966500000114",
    },
    {
      key: "CLIENT4",
      email: "client4@hassad.com",
      name: "Dina Faris",
      role: "CLIENT",
      phoneWhatsapp: "+966500000115",
    },
  ];

  const userIds: Record<string, string> = {};

  for (const u of userDefs) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phoneWhatsapp: u.phoneWhatsapp ?? null,
        role: { connect: { name: u.role } },
        isPayrollEligible: u.role !== "CLIENT",
      },
      create: {
        email: u.email,
        name: u.name,
        phoneWhatsapp: u.phoneWhatsapp ?? null,
        passwordHash,
        role: { connect: { name: u.role } },
        isPayrollEligible: u.role !== "CLIENT",
      },
    });
    userIds[u.key ?? u.role] = created.id;
    if (!userIds[u.role]) {
      userIds[u.role] = created.id;
    }

    if (u.dept) {
      const dept = await prisma.department.findUnique({
        where: { name: u.dept },
      });
      if (dept) {
        await prisma.userDepartment.upsert({
          where: {
            userId_departmentId: { userId: created.id, departmentId: dept.id },
          },
          update: {},
          create: { userId: created.id, departmentId: dept.id },
        });
      }
    }
  }

  const d = (y: number, m: number, day: number) =>
    new Date(y, m - 1, day, 0, 0, 0, 0);

  const userStateUpdates = [
    {
      key: "ADMIN",
      data: {
        lastLoginAt: d(2026, 8, 8),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Super%20Admin",
      },
    },
    {
      key: "PM",
      data: {
        lastLoginAt: d(2026, 8, 7),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Layla%20PM",
      },
    },
    {
      key: "PM2",
      data: {
        lastLoginAt: d(2026, 8, 5),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Fadi%20Kareem",
      },
    },
    {
      key: "SALES",
      data: {
        lastLoginAt: d(2026, 8, 9),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Omar%20Sales",
      },
    },
    {
      key: "SALES2",
      data: {
        lastLoginAt: d(2026, 8, 8),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Mona%20Saleh",
      },
    },
    {
      key: "TEAM",
      data: {
        lastLoginAt: d(2026, 8, 8),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Hana%20Designer",
      },
    },
    {
      key: "TEAM_CONTENT",
      data: {
        lastLoginAt: d(2026, 8, 1),
        isActive: false,
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Lina%20Haddad",
      },
    },
    {
      key: "TEAM_DEV",
      data: {
        lastLoginAt: d(2026, 8, 9),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Kareem%20Nasser",
      },
    },
    {
      key: "TEAM_PRODUCTION",
      data: {
        lastLoginAt: d(2026, 7, 28),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Rawan%20Ali",
      },
    },
    {
      key: "MARKETING",
      data: {
        lastLoginAt: d(2026, 8, 7),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Ziad%20Marketing",
      },
    },
    {
      key: "MARKETING2",
      data: {
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Noura%20Growth",
      },
    },
    {
      key: "ACCOUNTANT",
      data: {
        lastLoginAt: d(2026, 8, 6),
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Sara%20Accountant",
      },
    },
    {
      key: "CLIENT1",
      data: {
        lastLoginAt: d(2026, 8, 8),
      },
    },
    {
      key: "CLIENT2",
      data: {
        lastLoginAt: d(2026, 8, 9),
      },
    },
    {
      key: "CLIENT3",
      data: {
        lastLoginAt: d(2026, 8, 6),
      },
    },
    {
      key: "CLIENT4",
      data: {},
    },
  ];

  for (const update of userStateUpdates) {
    await prisma.user.update({
      where: { id: userIds[update.key] },
      data: update.data,
    });
  }

  // Department lookups
  const designDept = await prisma.department.findUnique({
    where: { name: "DESIGN" },
  });
  const contentDept = await prisma.department.findUnique({
    where: { name: "CONTENT" },
  });
  const marketingDept = await prisma.department.findUnique({
    where: { name: "MARKETING" },
  });
  const developmentDept = await prisma.department.findUnique({
    where: { name: "DEVELOPMENT" },
  });
  const productionDept = await prisma.department.findUnique({
    where: { name: "PRODUCTION" },
  });

  // ── Employees ─────────────────────────────────────────────────────────────────
  const payrollUsers = [
    {
      userKey: "TEAM",
      role: "TEAM",
      name: "Hana Designer",
      baseSalary: 7000,
      payType: "FIXED",
    },
    {
      userKey: "MARKETING",
      role: "MARKETING",
      name: "Ziad Marketing",
      baseSalary: 8500,
      payType: "FIXED",
    },
    {
      userKey: "SALES",
      role: "SALES",
      name: "Omar Sales",
      baseSalary: 5000,
      payType: "HYBRID",
      commissionRate: 0.05,
    },
    {
      userKey: "PM",
      role: "PM",
      name: "Layla PM",
      baseSalary: 12000,
      payType: "FIXED",
    },
    {
      userKey: "ACCOUNTANT",
      role: "ACCOUNTANT",
      name: "Sara Accountant",
      baseSalary: 9000,
      payType: "FIXED",
    },
    {
      userKey: "ADMIN",
      role: "ADMIN",
      name: "Super Admin",
      baseSalary: 15000,
      payType: "FIXED",
    },
    {
      userKey: "PM2",
      role: "PM",
      name: "Fadi Kareem",
      baseSalary: 11800,
      payType: "FIXED",
    },
    {
      userKey: "SALES2",
      role: "SALES",
      name: "Mona Saleh",
      baseSalary: 5600,
      payType: "HYBRID",
      commissionRate: 0.06,
    },
    {
      userKey: "TEAM_CONTENT",
      role: "TEAM",
      name: "Lina Haddad",
      baseSalary: 6400,
      payType: "FIXED",
    },
    {
      userKey: "TEAM_DEV",
      role: "TEAM",
      name: "Kareem Nasser",
      baseSalary: 9100,
      payType: "FIXED",
    },
    {
      userKey: "TEAM_PRODUCTION",
      role: "TEAM",
      name: "Rawan Ali",
      baseSalary: 6200,
      payType: "FIXED",
    },
    {
      userKey: "MARKETING2",
      role: "MARKETING",
      name: "Noura Growth",
      baseSalary: 8300,
      payType: "FIXED",
    },
  ];

  const employeeIds: Record<string, string> = {};
  for (const u of payrollUsers) {
    const emp = await prisma.employee.upsert({
      where: { userId: userIds[u.userKey] },
      update: {
        name: u.name,
        baseSalary: u.baseSalary,
        payType: u.payType as any,
        commissionRate: u.commissionRate ?? null,
      },
      create: {
        userId: userIds[u.userKey],
        name: u.name,
        role: u.role,
        baseSalary: u.baseSalary,
        payType: u.payType as any,
        commissionRate: u.commissionRate ?? null,
        isActive: true,
      },
    });
    employeeIds[u.userKey] = emp.id;
    if (!employeeIds[u.role]) {
      employeeIds[u.role] = emp.id;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SINGLE TEST CLIENT — تقنيات المستقبل (client@hassad.com)
  // Every project/scenario lives under this one client so the portal, PM
  // dashboard, finance, and marketing pages can all be exercised from one
  // login. Covers every ProjectStatus + both contract types + period states.
  // ═══════════════════════════════════════════════════════════════════════════════

  // Personal identity (contactName, email, phoneWhatsapp) is NOT set
  // here — it lives on the linked `User` row. The seed already populates
  // `User.name`, `User.email`, and `User.phoneWhatsapp` for the demo
  // client user (see the userDefs loop above).
  const clientA = await prisma.client.create({
    data: {
      userId: userIds["CLIENT1"],
      companyName: "تقنيات المستقبل",
      businessName: "Future Technologies",
      businessType: "OTHER",
      status: "ACTIVE",
      accountManager: userIds["SALES"],
    },
  });
  const client = clientA; // alias used by helpers below

  // ── Pipeline leads — one at every active stage (sales Kanban) ───────────────
  const PIPELINE_STAGES = [
    { st: "NEW", co: "شركة الأفق", nm: "محمد علي", source: "WEBSITE", serviceId: services[0].id, createdAt: d(2026, 8, 8), attempts: 0 },
    { st: "INTRO_SENT", co: "مؤسسة النور", nm: "سارة خالد", source: "REFERRAL", serviceId: services[1].id, createdAt: d(2026, 8, 3), attempts: 1 },
    { st: "CALL_ATTEMPT", co: "مجموعة الريادة", nm: "أحمد عمر", source: "AD", serviceId: services[2].id, createdAt: d(2026, 7, 29), attempts: 3 },
    { st: "MEETING_SCHEDULED", co: "شركة التميز", nm: "نورة سعد", source: "WEBSITE", serviceId: services[1].id, createdAt: d(2026, 7, 31), attempts: 2 },
    { st: "MEETING_DONE", co: "شركة الابتكار", nm: "فهد عبدالله", source: "WHATSAPP", serviceId: services[3].id, createdAt: d(2026, 7, 25), attempts: 4 },
    { st: "PROPOSAL_SENT", co: "شركة الأساس", nm: "لمى محمد", source: "PLATFORM", serviceId: services[0].id, createdAt: d(2026, 7, 20), attempts: 4 },
    { st: "FOLLOW_UP", co: "شركة التواصل", nm: "بدر إبراهيم", source: "REFERRAL", serviceId: services[2].id, createdAt: d(2026, 7, 17), attempts: 5 },
    { st: "APPROVED", co: "شركة الإنجاز", nm: "هند جميل", source: "WEBSITE", serviceId: services[0].id, createdAt: d(2026, 7, 10), attempts: 5 },
  ];
  const pipelineRequestIds: Record<string, string> = {};
  const requestStatusByStage: Record<string, string> = {
    NEW: "QUALIFYING",
    INTRO_SENT: "QUALIFYING",
    CALL_ATTEMPT: "QUALIFYING",
    MEETING_SCHEDULED: "PROPOSAL_IN_PROGRESS",
    MEETING_DONE: "PROPOSAL_IN_PROGRESS",
    PROPOSAL_SENT: "PROPOSAL_SENT",
    FOLLOW_UP: "NEGOTIATION",
    APPROVED: "CONTRACT_PREPARATION",
  };
  for (const p of PIPELINE_STAGES) {
    const pipelineClient = await prisma.client.create({
      data: {
        companyName: p.co,
        businessName: p.co,
        businessType: "OTHER",
        status: "LEAD",
      } as any,
    });
    const request = await prisma.request.create({
      data: {
        clientId: pipelineClient.id,
        companyName: p.co,
        contactName: p.nm,
        phoneWhatsapp: "+966500000000",
        email: `lead.${p.st.toLowerCase()}@example.com`,
        businessName: p.co,
        businessType: "OTHER",
        source: p.source as any,
        assignedSalesId: userIds["SALES"],
        contactAttemptCount: p.attempts,
        lastContactAt: p.st === "NEW" ? null : d(2026, 8, p.st === "FOLLOW_UP" ? 1 : 7),
        status: requestStatusByStage[p.st] as any,
        crmStage: "NEW",
        createdAt: p.createdAt,
      } as any,
    });
    pipelineRequestIds[p.st] = request.id;
    await prisma.requestService.create({
      data: { requestId: request.id, serviceId: p.serviceId, quantity: 1 },
    });
    await prisma.requestStatusHistory.create({
      data: {
        requestId: request.id,
        fromStatus: null,
        toStatus: requestStatusByStage[p.st] as any,
        changedBy: userIds["SALES"],
        changedAt: p.createdAt,
      } as any,
    });
    if (p.st !== "NEW") {
      await prisma.requestContactLog.create({
        data: {
          requestId: request.id,
          userId: userIds["SALES"],
          type:
            p.st === "MEETING_SCHEDULED" || p.st === "MEETING_DONE"
              ? "MEETING"
              : p.st === "PROPOSAL_SENT" || p.st === "FOLLOW_UP"
                ? "EMAIL"
                : "CALL",
          result: "RESPONDED",
          notes: `Seeded contact flow for ${p.st}`,
          contactedAt: d(2026, 8, p.st === "FOLLOW_UP" ? 1 : 6),
        } as any,
      });
    }
  }

  await prisma.proposal.createMany({
    data: [
      {
        requestId: pipelineRequestIds["PROPOSAL_SENT"],
        createdBy: userIds["SALES"],
        title: "عرض تأسيس الهوية",
        serviceDescription: "Brand package for commercial approval",
        servicesList: [{ serviceId: services[0].id, name: services[0].name, price: 22000, quantity: 1 }],
        totalPrice: 22000,
        durationDays: 30,
        platforms: [],
        status: "SENT",
        createdAt: d(2026, 8, 2),
      } as any,
      {
        requestId: pipelineRequestIds["FOLLOW_UP"],
        createdBy: userIds["SALES2"],
        title: "عرض الحملة الإعلانية",
        serviceDescription: "Campaign management package under negotiation",
        servicesList: [{ serviceId: services[2].id, name: services[2].name, price: 42000, quantity: 1 }],
        totalPrice: 42000,
        durationDays: 45,
        platforms: [],
        status: "REVISION_REQUESTED",
        createdAt: d(2026, 8, 1),
      } as any,
      {
        requestId: pipelineRequestIds["APPROVED"],
        createdBy: userIds["SALES2"],
        title: "عرض التحول الرقمي",
        serviceDescription: "Approved package pending contract assembly",
        servicesList: [{ serviceId: services[1].id, name: services[1].name, price: 54000, quantity: 1 }],
        totalPrice: 54000,
        durationDays: 60,
        platforms: [],
        status: "APPROVED",
        createdAt: d(2026, 7, 30),
      } as any,
    ],
  });

  // ── Requests — one per status (portal requests Kanban) ──────────────────────
  const REQUEST_STATUSES = [
    { st: "SUBMITTED", tl: "طلب تصميم هوية بصرية" },
    { st: "QUALIFYING", tl: "طلب إعلانات ممولة" },
    { st: "PROPOSAL_IN_PROGRESS", tl: "طلب تطوير موقع" },
    { st: "PROPOSAL_SENT", tl: "طلب حملة تسويقية" },
    { st: "NEGOTIATION", tl: "طلب إدارة منصات التواصل" },
    { st: "CONTRACT_PREPARATION", tl: "طلب استشارات إدارية" },
    { st: "CONTRACT_SENT", tl: "طلب تصميم تطبيق جوال" },
    { st: "SIGNED", tl: "طلب خدمات متكاملة" },
    { st: "PROJECT_CREATED", tl: "طلب تحول إلى مشروع" },
    { st: "CANCELLED", tl: "طلب ملغي" },
  ];
  for (const r of REQUEST_STATUSES) {
    await prisma.request.create({
      data: {
        clientId: client.id,
        submittedBy: userIds["CLIENT1"],
        assignedSalesId: userIds["SALES"],
        companyName: "تقنيات المستقبل",
        contactName: "فيصل القحطاني",
        phoneWhatsapp: "+966501234567",
        email: "ceo@futuretech.sa",
        businessName: "Future Technologies",
        businessType: "OTHER",
        source: "WEBSITE",
        status: r.st as any,
        notes: `طلب اختبار للحالة ${r.st}`,
      } as any,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Helpers — declarative scenario builders (clean + easy to extend/debug)
  // ═══════════════════════════════════════════════════════════════════════════════

  type GoalShape = {
    title: string;
    description?: string;
    progress: number;
    status: "done" | "in_progress" | "pending";
  };
  type PeriodStatus = "UPCOMING" | "ACTIVE" | "CLOSED" | "SUSPENDED";
  type InvoiceStatus =
    | "PAID"
    | "PENDING"
    | "LATE"
    | "DUE"
    | "PARTIAL"
    | "CANCELLED"
    | null;
  type MeetingSpec = {
    title: string;
    at: Date;
    status: "SCHEDULED" | "DONE" | "CANCELLED" | "RESCHEDULED";
    durationMin?: number;
    location?: string;
    link?: string;
    notes?: string;
  };

  /** Create a MONTHLY_RETAINER contract with a recurring PERIOD_END plan (+ optional down payment). */
  async function makeRetainerContract(opts: {
    clientId?: string;
    createdBy?: string;
    title: string;
    status: any;
    start: Date;
    end: Date;
    total: number;
    months: number;
    downPct?: number;
  }) {
    const monthly = Math.round(
      (opts.total * (1 - (opts.downPct ?? 0) / 100)) / opts.months,
    );
    const contract = await prisma.contract.create({
      data: {
        clientId: opts.clientId ?? client.id,
        createdBy: opts.createdBy ?? userIds["SALES"],
        title: opts.title,
        type: "MONTHLY_RETAINER",
        status: opts.status,
        startDate: opts.start,
        endDate: opts.end,
        monthlyValue: monthly,
        totalValue: opts.total,
        numberOfMonths: opts.months,
        filePath: "contracts/sample.pdf",
        shareLinkToken: `share-${opts.title.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
        versionNumber: 1,
        downPaymentType: opts.downPct ? "PERCENT" : null,
        downPaymentValue: opts.downPct ?? null,
      },
    });
    if (opts.downPct) {
      await prisma.contractPaymentPlan.create({
        data: {
          contractId: contract.id,
          label: "الدفعة الأولى",
          sequence: 0,
          triggerType: "ON_SIGN",
          amountType: "PERCENT",
          amountValue: opts.downPct,
          isRecurring: false,
        },
      });
    }
    const recurringPlan = await prisma.contractPaymentPlan.create({
      data: {
        contractId: contract.id,
        label: "الدفعة الشهرية",
        sequence: opts.downPct ? 1 : 0,
        triggerType: "PERIOD_END",
        amountType: "FIXED",
        amountValue: monthly,
        isRecurring: true,
      },
    });
    return { contract, monthly, recurringPlan };
  }

  /** Create a FIXED_PROJECT contract. */
  async function makeFixedContract(opts: {
    clientId?: string;
    createdBy?: string;
    title: string;
    status: any;
    start: Date;
    end: Date;
    total: number;
  }) {
    return prisma.contract.create({
      data: {
        clientId: opts.clientId ?? client.id,
        createdBy: opts.createdBy ?? userIds["SALES"],
        title: opts.title,
        type: "FIXED_PROJECT",
        status: opts.status,
        startDate: opts.start,
        endDate: opts.end,
        monthlyValue: 0,
        totalValue: opts.total,
        filePath: "contracts/sample.pdf",
        shareLinkToken: `share-${opts.title.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
        versionNumber: 1,
      },
    });
  }

  /** Create a project + standard members (PM manager, employee + marketing members). */
  async function makeProject(opts: {
    clientId?: string;
    projectManagerId?: string;
    memberUserIds?: string[];
    name: string;
    status: any;
    contractId: string;
    start: Date;
    end: Date;
    completion: number;
    priority?: any;
    description?: string;
  }) {
    const project = await prisma.project.create({
      data: {
        clientId: opts.clientId ?? client.id,
        contractId: opts.contractId,
        projectManagerId: opts.projectManagerId ?? userIds["PM"],
        name: opts.name,
        description: opts.description ?? null,
        status: opts.status,
        priority: opts.priority ?? "HIGH",
        startDate: opts.start,
        endDate: opts.end,
        completionPercentage: opts.completion,
      },
    });
    await prisma.projectMember.createMany({
      data: [
        {
          projectId: project.id,
          userId: opts.projectManagerId ?? userIds["PM"],
          role: "MANAGER" as const,
        },
        ...(
          opts.memberUserIds ?? [userIds["TEAM"], userIds["MARKETING"]]
        ).map((userId) => ({
          projectId: project.id,
          userId,
          role: "MEMBER" as const,
        })),
      ],
      skipDuplicates: true,
    });
    return project;
  }

  /** Create one period: period row + history + invoice + payment (+ optional meetings). */
  async function makePeriod(opts: {
    clientId?: string;
    createdBy?: string;
    projectId: string;
    contractId: string;
    planId: string;
    number: number;
    start: Date;
    end: Date;
    status: PeriodStatus;
    completion?: number;
    goals?: GoalShape[];
    summary?: string;
    report?: boolean;
    invoiceStatus: InvoiceStatus;
    invoiceAmount: number;
    meetings?: MeetingSpec[];
  }) {
    const period = await prisma.projectPeriod.create({
      data: {
        projectId: opts.projectId,
        periodNumber: opts.number,
        startDate: opts.start,
        endDate: opts.end,
        status: opts.status as any,
        completionPercentage:
          opts.completion ??
          (opts.status === "CLOSED" ? 100 : opts.status === "ACTIVE" ? 50 : 0),
        goals: (opts.goals ?? []) as any,
        summary: opts.summary ?? null,
        reportFilePath: opts.report
          ? `projects/seed-period-${opts.number}/report.pdf`
          : null,
        closedAt: opts.status === "CLOSED" ? opts.end : null,
        suspendedAt: opts.status === "SUSPENDED" ? opts.end : null,
      },
    });

    // Status history
    if (opts.status !== "UPCOMING") {
      await prisma.projectPeriodHistory.create({
        data: {
          periodId: period.id,
          fromStatus: "UPCOMING" as any,
          toStatus: opts.status as any,
          changedBy: opts.createdBy ?? userIds["PM"],
          changedAt: opts.start,
        },
      });
    }

    // Period invoice (only for non-UPCOMING periods that bill)
    if (opts.invoiceStatus && opts.invoiceStatus !== "CANCELLED") {
      const isPaid = opts.invoiceStatus === "PAID";
      const isLate = opts.invoiceStatus === "LATE";
      const inv = await prisma.invoice.create({
        data: {
          clientId: opts.clientId ?? client.id,
          contractId: opts.contractId,
          paymentPlanId: opts.planId,
          createdBy: userIds["ACCOUNTANT"],
          invoiceNumber: `INV-PRD-${opts.projectId.slice(0, 4)}-${String(opts.number).padStart(2, "0")}`,
          amount: opts.invoiceAmount,
          status: opts.invoiceStatus as any,
          paymentMethod: "BANK_TRANSFER",
          issueDate: opts.end,
          dueDate: new Date(opts.end.getTime() + 7 * 86400000),
          paidAt: isPaid ? opts.end : null,
          paymentReference: isPaid ? `PAY-${opts.number}` : null,
          triggeredSuspension: isLate,
          reminderFlags: isLate ? 7 : 0,
          items: {
            create: {
              description: `الدفعة الشهرية — الفترة ${opts.number}`,
              quantity: 1,
              unitPrice: opts.invoiceAmount,
              total: opts.invoiceAmount,
            },
          },
        },
      });
      await prisma.projectPeriod.update({
        where: { id: period.id },
        data: { invoiceId: inv.id },
      });
      if (isPaid) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            clientId: opts.clientId ?? client.id,
            amount: opts.invoiceAmount,
            status: "SUCCESS",
            method: "BANK_TRANSFER",
            date: opts.end,
          },
        });
      }
    }

    // Meetings
    for (const m of opts.meetings ?? []) {
      await prisma.projectMeeting.create({
        data: {
          projectId: opts.projectId,
          periodId: period.id,
          title: m.title,
          scheduledAt: m.at,
          durationMin: m.durationMin ?? null,
          location: m.location ?? null,
          meetingLink: m.link ?? null,
          status: m.status as any,
          notes: m.notes ?? null,
          createdBy: opts.createdBy ?? userIds["PM"],
        },
      });
    }
    return period;
  }

  /** Down-payment invoice for retainer projects that require one. */
  async function makeDownPaymentInvoice(
    contractId: string,
    clientId: string,
    total: number,
    downPct: number,
    start: Date,
  ) {
    const amount = Math.round((total * downPct) / 100);
    const inv = await prisma.invoice.create({
      data: {
        clientId,
        contractId,
        createdBy: userIds["ACCOUNTANT"],
        invoiceNumber: `INV-DOWN-${contractId.slice(0, 4)}`,
        amount,
        status: "PAID",
        paymentMethod: "BANK_TRANSFER",
        issueDate: start,
        dueDate: new Date(start.getTime() + 7 * 86400000),
        paidAt: new Date(start.getTime() + 2 * 86400000),
        paymentReference: `PAY-DOWN-${contractId.slice(0, 4)}`,
        items: {
          create: {
            description: "الدفعة الأولى",
            quantity: 1,
            unitPrice: amount,
            total: amount,
          },
        },
      },
    });
    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        clientId,
        amount,
        status: "SUCCESS",
        method: "BANK_TRANSFER",
        date: new Date(start.getTime() + 2 * 86400000),
      },
    });
  }

  const goalDone = (title: string, description?: string): GoalShape => ({
    title,
    description,
    progress: 100,
    status: "done",
  });
  const goalProg = (
    title: string,
    description?: string,
    progress = 50,
  ): GoalShape => ({ title, description, progress, status: "in_progress" });
  const goalPending = (title: string, description?: string): GoalShape => ({
    title,
    description,
    progress: 0,
    status: "pending",
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 1 — ACTIVE retainer (the main portal/PM test project)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    const { contract, monthly, recurringPlan } = await makeRetainerContract({
      title: "عقد هوية بصرية",
      status: "ACTIVE",
      start: d(2026, 3, 1),
      end: d(2026, 8, 31),
      total: 24000,
      months: 6,
      downPct: 25,
    });
    await makeDownPaymentInvoice(contract.id, client.id, 24000, 25, d(2026, 3, 1));
    const project = await makeProject({
      name: "تصميم هوية بصرية",
      status: "ACTIVE",
      contractId: contract.id,
      start: d(2026, 3, 1),
      end: d(2026, 8, 31),
      completion: 50,
    });

    // Periods 1-3 closed & paid (with reports on period 3)
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 1,
      start: d(2026, 3, 1),
      end: d(2026, 3, 31),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [
        goalDone("تصميم الشعار", "جميع الصيغ"),
        goalDone("لوحة الألوان والخطوط"),
      ],
      summary: "تم إنجاز أعمال الفترة 1 بنجاح",
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 2,
      start: d(2026, 4, 1),
      end: d(2026, 4, 30),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [
        goalDone("دليل الهوية", "دليل الاستخدام الكامل"),
        goalDone("بطاقات العمل"),
      ],
      summary: "تم إنجاز أعمال الفترة 2 بنجاح",
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 3,
      start: d(2026, 5, 1),
      end: d(2026, 5, 31),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [goalDone("تطبيقات الهوية")],
      summary: "تم إنجاز أعمال الفترة 3 بنجاح",
      report: true,
    });
    // Period 4 active (in-progress goals, upcoming meeting, done meeting, pending invoice)
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 4,
      start: d(2026, 6, 1),
      end: d(2026, 6, 30),
      status: "ACTIVE",
      completion: 45,
      invoiceStatus: "DUE",
      invoiceAmount: monthly,
      goals: [
        goalProg("اللمسات النهائية للهوية", "تعديلات نهائية", 60),
        goalPending("تسليم الملفات المصدرية", "جميع الملفات"),
      ],
      meetings: [
        {
          title: "اجتماع مراجعة الفترة 4",
          at: d(2026, 6, 25),
          status: "SCHEDULED",
          durationMin: 45,
          link: "https://meet.example/period4",
          notes: null as any,
        },
        {
          title: "اجتماع بدء الفترة 4",
          at: d(2026, 6, 3),
          status: "DONE",
          durationMin: 30,
          location: "المكتب",
          notes: "تمت مراجعة الأهداف والمصطلحات مع العميل",
        },
      ],
    });
    // Periods 5-6 upcoming (no invoices)
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 5,
      start: d(2026, 7, 1),
      end: d(2026, 7, 31),
      status: "UPCOMING",
      invoiceStatus: null,
      invoiceAmount: monthly,
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 6,
      start: d(2026, 8, 1),
      end: d(2026, 8, 31),
      status: "UPCOMING",
      invoiceStatus: null,
      invoiceAmount: monthly,
    });

    // Tasks + a running campaign
    await prisma.task.create({
      data: {
        projectId: project.id,
        departmentId: designDept!.id,
        title: "تصميم دليل الهوية البصرية",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: d(2026, 6, 25),
        assignedTo: userIds["TEAM"],
        createdBy: userIds["PM"],
      },
    });
    await prisma.task.create({
      data: {
        projectId: project.id,
        departmentId: designDept!.id,
        title: "تجهيز ملف العلامة التجارية",
        status: "TODO",
        priority: "NORMAL",
        dueDate: d(2026, 7, 10),
        assignedTo: userIds["TEAM"],
        createdBy: userIds["PM"],
      },
    });
    await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title: "دليل الهوية البصرية",
        status: "IN_REVIEW",
        filePath: "",
        isVisibleToClient: true,
      },
    } as any);
    const campaignTask = await prisma.task.create({
      data: {
        projectId: project.id,
        departmentId: marketingDept!.id,
        title: "إدارة حملة إطلاق الهوية",
        status: "IN_PROGRESS" as any,
        priority: "HIGH",
        dueDate: d(2026, 8, 31),
        assignedTo: userIds["MARKETING"],
        createdBy: userIds["PM"],
      },
    });
    const campaign = await prisma.campaign.create({
      data: {
        clientId: client.id,
        taskId: campaignTask.id,
        projectId: project.id,
        managedBy: userIds["MARKETING"],
        name: "حملة إطلاق الهوية الجديدة",
        platform: "META",
        status: "ACTIVE",
        startDate: d(2026, 6, 1),
        endDate: d(2026, 8, 31),
        budgetTotal: 8000,
        budgetSpent: 3000,
      } as any,
    });
    await prisma.campaignKpiSnapshot.create({
      data: {
        campaignId: campaign.id,
        impressions: 15000,
        clicks: 1200,
        conversions: 85,
        revenue: 6800,
        cpc: 0.45,
        ctr: 8.0,
        conversionRate: 7.08,
        roas: 2.27,
        source: "meta_api",
        recordedAt: d(2026, 6, 15),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 2 — AWAITING_REVIEW retainer (work finished, awaiting client approval)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    const { contract, monthly, recurringPlan } = await makeRetainerContract({
      title: "عقد حملة رمضان",
      status: "ACTIVE",
      start: d(2026, 4, 1),
      end: d(2026, 6, 30),
      total: 18000,
      months: 3,
      downPct: 20,
    });
    await makeDownPaymentInvoice(contract.id, client.id, 18000, 20, d(2026, 4, 1));
    const project = await makeProject({
      name: "حملة تسويق رمضان",
      status: "AWAITING_REVIEW",
      contractId: contract.id,
      start: d(2026, 4, 1),
      end: d(2026, 6, 30),
      completion: 100,
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 1,
      start: d(2026, 4, 1),
      end: d(2026, 4, 30),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [goalDone("تصميم الهوية", "شعار ودليل")],
      summary: "تم إنجاز الفترة 1",
      report: true,
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 2,
      start: d(2026, 5, 1),
      end: d(2026, 5, 31),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [goalDone("تقويم المحتوى", "30 منشور")],
      summary: "تم إنجاز الفترة 2",
      report: true,
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 3,
      start: d(2026, 6, 1),
      end: d(2026, 6, 30),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [goalDone("إطلاق الحملة", "إعداد وإطلاق")],
      summary: "تم إنجاز الفترة 3",
      report: true,
    });
    await prisma.task.create({
      data: {
        projectId: project.id,
        departmentId: marketingDept!.id,
        title: "إطلاق حملة إعلانية",
        status: "DONE",
        priority: "HIGH",
        dueDate: d(2026, 5, 15),
        assignedTo: userIds["MARKETING"],
        createdBy: userIds["PM"],
        approvedBy: userIds["PM"],
        approvedAt: d(2026, 5, 14),
      },
    });
    await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title: "تقرير الإنجاز النهائي",
        status: "IN_REVIEW",
        filePath: "",
        isVisibleToClient: true,
      },
    } as any);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 3 — NEEDS_REVISION retainer (client requested revisions)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    const { contract, monthly, recurringPlan } = await makeRetainerContract({
      title: "عقد إدارة منصات",
      status: "ACTIVE",
      start: d(2026, 5, 1),
      end: d(2026, 7, 31),
      total: 12000,
      months: 3,
      downPct: 0,
    });
    const project = await makeProject({
      name: "إدارة منصات التواصل",
      status: "NEEDS_REVISION",
      contractId: contract.id,
      start: d(2026, 5, 1),
      end: d(2026, 7, 31),
      completion: 70,
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 1,
      start: d(2026, 5, 1),
      end: d(2026, 5, 31),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [goalDone("تصميم منشورات الشهر", "30 منشور")],
      summary: "تم إنجاز الفترة 1",
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 2,
      start: d(2026, 6, 1),
      end: d(2026, 6, 30),
      status: "CLOSED",
      invoiceStatus: "PAID",
      invoiceAmount: monthly,
      goals: [goalDone("تحليل الأداء")],
      summary: "تم إنجاز الفترة 2",
      report: true,
    });
    await makePeriod({
      projectId: project.id,
      contractId: contract.id,
      planId: recurringPlan.id,
      number: 3,
      start: d(2026, 7, 1),
      end: d(2026, 7, 31),
      status: "ACTIVE",
      completion: 30,
      invoiceStatus: "PENDING",
      invoiceAmount: monthly,
      goals: [
        goalProg("تصميم منشورات الشهر", "30 منشور", 40),
        goalPending("تقرير الأداء الشهري"),
      ],
      meetings: [
        {
          title: "اجتماع مراجعة التعديلات",
          at: d(2026, 7, 5),
          status: "DONE",
          durationMin: 60,
          notes: "طلب العميل تعديل ألوان المنشورات وإضافة محتوى تفاعلي",
        },
      ],
    });
    // Client revision request
    const deliv = await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title: "منشورات الأسبوع الأول",
        status: "IN_REVIEW",
        filePath: "/uploads/week1.zip",
        isVisibleToClient: true,
      },
    } as any);
    await prisma.clientRevisionRequest.create({
      data: {
        deliverableId: deliv.id,
        clientId: client.id,
        requestDescription:
          "الرجاء تعديل الألوان لتتناسب مع الهوية الجديدة، وإضافة منشورات تفاعلية للقصص.",
        status: "REVISION",
      } as any,
    });
    await prisma.projectRevisionRequest.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        comment:
          "الرجاء تعديل الألوان لتتناسب مع الهوية الجديدة، وإضافة منشورات تفاعلية للقصص.",
      } as any,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADMIN ENRICHMENT — additional clients, projects, finance states, and risks
  // ═══════════════════════════════════════════════════════════════════════════════
  const clientGreenline = await prisma.client.create({
    data: {
      userId: userIds["CLIENT2"],
      companyName: "Greenline",
      businessName: "Greenline Trading",
      businessType: "STORE",
      status: "ACTIVE",
      accountManager: userIds["SALES2"],
    },
  });
  const clientNoor = await prisma.client.create({
    data: {
      userId: userIds["CLIENT3"],
      companyName: "Al Noor",
      businessName: "Al Noor Ventures",
      businessType: "SERVICE",
      status: "ACTIVE",
      accountManager: userIds["SALES2"],
    },
  });
  const clientOasis = await prisma.client.create({
    data: {
      userId: userIds["CLIENT4"],
      companyName: "Oasis Retail",
      businessName: "Oasis Retail Group",
      businessType: "STORE",
      status: "STOPPED",
      accountManager: userIds["SALES"],
    },
  });

  await prisma.request.createMany({
    data: [
      {
        clientId: clientGreenline.id,
        submittedBy: userIds["CLIENT2"],
        assignedSalesId: userIds["SALES2"],
        companyName: "Greenline",
        contactName: "Rana Khaled",
        phoneWhatsapp: "+966500000113",
        email: "rana@greenline.sa",
        businessName: "Greenline Trading",
        businessType: "STORE",
        source: "REFERRAL",
        status: "NEGOTIATION",
        notes: "Expansion retainer under discussion",
      } as any,
      {
        clientId: clientOasis.id,
        submittedBy: userIds["CLIENT4"],
        assignedSalesId: null,
        companyName: "Oasis Retail",
        contactName: "Dina Faris",
        phoneWhatsapp: "+966500000115",
        email: "dina@oasis.sa",
        businessName: "Oasis Retail Group",
        businessType: "STORE",
        source: "WEBSITE",
        status: "SUBMITTED",
        notes: "Unassigned intake request for admin attention",
      } as any,
    ],
  });

  const greenlineContract = await makeRetainerContract({
    clientId: clientGreenline.id,
    createdBy: userIds["SALES2"],
    title: "عقد نمو Greenline",
    status: "ACTIVE",
    start: d(2026, 6, 1),
    end: d(2026, 11, 30),
    total: 186000,
    months: 6,
    downPct: 20,
  });
  await makeDownPaymentInvoice(
    greenlineContract.contract.id,
    clientGreenline.id,
    186000,
    20,
    d(2026, 6, 1),
  );
  const greenlineProject = await makeProject({
    clientId: clientGreenline.id,
    projectManagerId: userIds["PM2"],
    memberUserIds: [userIds["TEAM_DEV"], userIds["TEAM_CONTENT"], userIds["MARKETING2"]],
    name: "Greenline growth retainer",
    status: "ACTIVE",
    contractId: greenlineContract.contract.id,
    start: d(2026, 6, 1),
    end: d(2026, 11, 30),
    completion: 72,
  });
  await makePeriod({
    clientId: clientGreenline.id,
    createdBy: userIds["PM2"],
    projectId: greenlineProject.id,
    contractId: greenlineContract.contract.id,
    planId: greenlineContract.recurringPlan.id,
    number: 1,
    start: d(2026, 6, 1),
    end: d(2026, 6, 30),
    status: "CLOSED",
    invoiceStatus: "PAID",
    invoiceAmount: greenlineContract.monthly,
    goals: [goalDone("Kickoff and media plan")],
  });
  const greenlineActivePeriod = await makePeriod({
    clientId: clientGreenline.id,
    createdBy: userIds["PM2"],
    projectId: greenlineProject.id,
    contractId: greenlineContract.contract.id,
    planId: greenlineContract.recurringPlan.id,
    number: 2,
    start: d(2026, 7, 1),
    end: d(2026, 7, 31),
    status: "ACTIVE",
    completion: 68,
    invoiceStatus: "DUE",
    invoiceAmount: greenlineContract.monthly,
    goals: [goalProg("Paid social rollout", undefined, 75), goalProg("Landing page experiments", undefined, 50)],
  });
  await prisma.task.createMany({
    data: [
      {
        projectId: greenlineProject.id,
        periodId: greenlineActivePeriod.id,
        departmentId: developmentDept!.id,
        title: "Build conversion landing page",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: d(2026, 8, 2),
        assignedTo: userIds["TEAM_DEV"],
        createdBy: userIds["PM2"],
      } as any,
      {
        projectId: greenlineProject.id,
        periodId: greenlineActivePeriod.id,
        departmentId: contentDept!.id,
        title: "Prepare offer messaging",
        status: "IN_REVIEW",
        priority: "HIGH",
        dueDate: d(2026, 8, 3),
        assignedTo: userIds["TEAM_CONTENT"],
        createdBy: userIds["PM2"],
        revisionCount: 1,
      } as any,
      {
        projectId: greenlineProject.id,
        periodId: greenlineActivePeriod.id,
        departmentId: marketingDept!.id,
        title: "Launch Meta retargeting",
        status: "TODO",
        priority: "NORMAL",
        dueDate: d(2026, 8, 10),
        assignedTo: userIds["MARKETING2"],
        createdBy: userIds["PM2"],
      } as any,
    ],
  });
  await prisma.deliverable.create({
    data: {
      projectId: greenlineProject.id,
      periodId: greenlineActivePeriod.id,
      title: "July performance pack",
      status: "IN_REVIEW",
      filePath: "/uploads/greenline-july.pdf",
      isVisibleToClient: true,
    } as any,
  });

  const noorContract = await makeFixedContract({
    clientId: clientNoor.id,
    createdBy: userIds["SALES2"],
    title: "عقد إطلاق Al Noor",
    status: "COMPLETED",
    start: d(2026, 3, 1),
    end: d(2026, 5, 31),
    total: 28000,
  });
  const noorProject = await makeProject({
    clientId: clientNoor.id,
    projectManagerId: userIds["PM"],
    memberUserIds: [userIds["TEAM"], userIds["TEAM_PRODUCTION"]],
    name: "Al Noor launch campaign",
    status: "COMPLETED",
    contractId: noorContract.id,
    start: d(2026, 3, 1),
    end: d(2026, 5, 31),
    completion: 100,
  });
  await prisma.project.update({
    where: { id: noorProject.id },
    data: { isArchived: true, archivedAt: d(2026, 6, 5) },
  });
  const noorInvoice = await prisma.invoice.create({
    data: {
      clientId: clientNoor.id,
      contractId: noorContract.id,
      createdBy: userIds["ACCOUNTANT"],
      invoiceNumber: `INV-NOOR-${noorContract.id.slice(0, 4)}`,
      amount: 28000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      issueDate: d(2026, 5, 31),
      dueDate: d(2026, 6, 7),
      paidAt: d(2026, 6, 3),
      paymentReference: "PAY-NOOR",
      items: {
        create: {
          description: "Final launch package",
          quantity: 1,
          unitPrice: 28000,
          total: 28000,
        },
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: noorInvoice.id,
      clientId: clientNoor.id,
      amount: 28000,
      status: "SUCCESS",
      method: "BANK_TRANSFER",
      date: d(2026, 6, 3),
    },
  });

  const oasisClient = await prisma.client.create({
    data: {
      companyName: "Oasis Retail",
      businessName: "Oasis Retail Group",
      businessType: "STORE",
      status: "LEAD",
    },
  });
  const oasisLead = await prisma.request.create({
    data: {
      clientId: oasisClient.id,
      companyName: "Oasis Retail",
      contactName: "Dina Faris",
      phoneWhatsapp: "+966500000115",
      email: "dina@oasis.sa",
      businessName: "Oasis Retail Group",
      businessType: "STORE",
      source: "AD",
      status: "QUALIFYING",
      assignedSalesId: userIds["SALES"],
      contactAttemptCount: 4,
      lastContactAt: d(2026, 7, 24),
      createdAt: d(2026, 7, 12),
    } as any,
  });
  await prisma.requestService.create({
    data: {
      requestId: oasisLead.id,
      serviceId: services[2].id,
      quantity: 1,
    },
  });
  await prisma.proposal.create({
    data: {
      requestId: oasisLead.id,
      createdBy: userIds["SALES"],
      title: "عرض Oasis loyalty campaign",
      serviceDescription: "Loyalty campaign and activation scope",
      servicesList: [{ serviceId: services[2].id, name: services[2].name, price: 12000, quantity: 1 }],
      totalPrice: 12000,
      durationDays: 21,
      platforms: [],
      status: "SENT",
      createdAt: d(2026, 7, 26),
    } as any,
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Extra proposals & contracts — full status variety for the listing pages
  // ═══════════════════════════════════════════════════════════════════════════════
  const extraRequest = await prisma.request.create({
    data: {
      clientId: client.id,
      companyName: "مؤسسة اختبار العروض",
      contactName: "مشاري التميمي",
      phoneWhatsapp: "+966500000099",
      email: "extra-proposals@example.com",
      businessName: "مؤسسة اختبار العروض",
      businessType: "OTHER",
      source: "WEBSITE",
      status: "CONTRACT_PREPARATION",
      assignedSalesId: userIds["SALES"],
    } as any,
  });
  for (const st of ["DRAFT", "SENT", "REVISION_REQUESTED", "REJECTED"]) {
    await prisma.proposal.create({
      data: {
        requestId: extraRequest.id,
        clientId: client.id,
        createdBy: userIds["SALES"],
        title: `عرض توضيحي — ${st}`,
        serviceDescription: `عرض اختبار للحالة ${st}`,
        status: st as any,
        totalPrice: 5000,
        startDate: d(2026, 6, 1),
        durationDays: 30,
        platforms: [],
        servicesList: [{ name: "خدمة اختبار", price: 5000, quantity: 1 }],
      } as any,
    });
  }
  for (const st of ["DRAFT", "SENT", "SIGNED", "EXPIRED", "CANCELLED"]) {
    await prisma.contract.create({
      data: {
        clientId: client.id,
        createdBy: userIds["SALES"],
        title: `عقد توضيحي — ${st}`,
        type: "MONTHLY_RETAINER",
        status: st as any,
        startDate: d(2026, 1, 1),
        endDate: d(2026, 12, 31),
        monthlyValue: 5000,
        totalValue: 60000,
      },
    });
  }

  // ── Client history logs ─────────────────────────────────────────────────────
  await prisma.clientHistoryLog.createMany({
    data: [
      {
        clientId: client.id,
        userId: userIds["ADMIN"],
        eventType: "CONTRACT_ACTIVATED",
        description: "تم تفعيل عقد هوية بصرية",
        occurredAt: d(2026, 3, 1),
      },
      {
        clientId: client.id,
        userId: userIds["PM"],
        eventType: "PROJECT_COMPLETED",
        description: "تم اكتمال مشروع إطلاق متجر التراث",
        occurredAt: d(2024, 6, 15),
      },
      {
        clientId: client.id,
        userId: userIds["ACCOUNTANT"],
        eventType: "INVOICE_ISSUED",
        description: "تم إصدار فاتورة الفترة 4",
        occurredAt: d(2026, 6, 30),
      },
      {
        clientId: clientGreenline.id,
        userId: userIds["SALES2"],
        eventType: "CLIENT_EXPANSION",
        description: "تم توسيع نطاق التعاقد مع Greenline",
        occurredAt: d(2026, 7, 2),
      },
      {
        clientId: clientNoor.id,
        userId: userIds["PM"],
        eventType: "PROJECT_COMPLETED",
        description: "تم إغلاق مشروع الإطلاق بنجاح",
        occurredAt: d(2026, 6, 5),
      },
    ],
  });

  await prisma.session.createMany({
    data: [
      {
        userId: userIds["ADMIN"],
        refreshTokenHash: "seed-admin-session",
        userAgent: "Seeded Chrome",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 16),
      },
      {
        userId: userIds["PM"],
        refreshTokenHash: "seed-pm-session",
        userAgent: "Seeded Safari",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 14),
      },
      {
        userId: userIds["SALES"],
        refreshTokenHash: "seed-sales-session",
        userAgent: "Seeded Chrome",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 14),
      },
      {
        userId: userIds["SALES2"],
        refreshTokenHash: "seed-sales2-session",
        userAgent: "Seeded Chrome",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 15),
      },
      {
        userId: userIds["TEAM"],
        refreshTokenHash: "seed-team-session",
        userAgent: "Seeded Firefox",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 12),
      },
      {
        userId: userIds["ACCOUNTANT"],
        refreshTokenHash: "seed-accountant-session",
        userAgent: "Seeded Edge",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 13),
      },
      {
        userId: userIds["CLIENT1"],
        refreshTokenHash: "seed-client1-session",
        userAgent: "Seeded Mobile Safari",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 13),
      },
      {
        userId: userIds["CLIENT2"],
        refreshTokenHash: "seed-client2-session",
        userAgent: "Seeded Mobile Safari",
        ip: "127.0.0.1",
        expiresAt: d(2026, 8, 13),
      },
    ],
  });

  await prisma.staffWorkload.createMany({
    data: [
      {
        userId: userIds["TEAM"],
        activeTasksCount: 4,
        workloadStatus: "BUSY",
        avgCompletionSpeedDays: 4.2,
        avgQualityScore: 4.5,
      } as any,
      {
        userId: userIds["TEAM_DEV"],
        activeTasksCount: 3,
        workloadStatus: "BUSY",
        avgCompletionSpeedDays: 5.1,
        avgQualityScore: 4.2,
      } as any,
      {
        userId: userIds["TEAM_CONTENT"],
        activeTasksCount: 1,
        workloadStatus: "AVAILABLE",
        avgCompletionSpeedDays: 6.8,
        avgQualityScore: 3.9,
      } as any,
      {
        userId: userIds["TEAM_PRODUCTION"],
        activeTasksCount: 2,
        workloadStatus: "BUSY",
        avgCompletionSpeedDays: 5.7,
        avgQualityScore: 4.1,
      } as any,
      {
        userId: userIds["MARKETING"],
        activeTasksCount: 2,
        workloadStatus: "BUSY",
        avgCompletionSpeedDays: 4.8,
        avgQualityScore: 4.4,
      } as any,
      {
        userId: userIds["MARKETING2"],
        activeTasksCount: 1,
        workloadStatus: "AVAILABLE",
        avgCompletionSpeedDays: 5.3,
        avgQualityScore: 4.0,
      } as any,
    ],
  });

  await prisma.securityEvent.createMany({
    data: [
      {
        userId: userIds["ADMIN"],
        type: "LOGIN_SUCCESS",
        ip: "127.0.0.1",
        userAgent: "Seeded Chrome",
        createdAt: d(2026, 8, 8),
      } as any,
      {
        userId: userIds["TEAM_CONTENT"],
        type: "ACCOUNT_LOCKED",
        ip: "127.0.0.1",
        userAgent: "Seeded Browser",
        metadata: { reason: "test-seed" },
        createdAt: d(2026, 8, 1),
      } as any,
      {
        userId: userIds["SALES2"],
        type: "LOGIN_SUCCESS",
        ip: "127.0.0.1",
        userAgent: "Seeded Chrome",
        createdAt: d(2026, 8, 8),
      } as any,
    ],
  });

  await prisma.ledger.createMany({
    data: [
      {
        action: "admin.projects.watch",
        entity: "project",
        entityId: greenlineProject.id,
        userId: userIds["ADMIN"],
        after: { project: "Greenline growth retainer", risk: "invoice_due" },
        createdAt: d(2026, 8, 8),
      },
      {
        action: "finance.invoices.issue",
        entity: "invoice",
        entityId: noorInvoice.id,
        userId: userIds["ACCOUNTANT"],
        after: { client: "Al Noor", amount: 28000 },
        createdAt: d(2026, 6, 3),
      },
      {
        action: "crm.proposals.approved",
        entity: "lead",
        entityId: pipelineRequestIds["APPROVED"],
        userId: userIds["SALES2"],
        after: { lead: "شركة الإنجاز" },
        createdAt: d(2026, 7, 30),
      },
      {
        action: "admin.requests.unassigned",
        entity: "request",
        entityId: clientOasis.id,
        userId: userIds["ADMIN"],
        after: { status: "SUBMITTED" },
        createdAt: d(2026, 8, 7),
      },
    ],
  });

  const greenlineTask = await prisma.task.findFirstOrThrow({
    where: { projectId: greenlineProject.id, title: "Build conversion landing page" },
  });
  await prisma.taskDelayAlert.create({
    data: {
      taskId: greenlineTask.id,
      notifiedUserId: userIds["PM2"],
      alertLevel: "HIGH",
      isAcknowledged: false,
      triggeredAt: d(2026, 8, 8),
    } as any,
  });

  const disputeTicket = await prisma.disputeTicket.create({
    data: {
      ticketNumber: 1,
      clientId: clientGreenline.id,
      pmId: userIds["PM2"],
      projectId: greenlineProject.id,
      title: "Delay in landing page release",
      description: "Client requested escalation after missing the launch date.",
      category: "DELAY",
      status: "ESCALATED",
      priority: "HIGH",
      openedAt: d(2026, 8, 6),
      approvedAt: d(2026, 8, 7),
      deadlineAt: d(2026, 8, 10),
      escalatedAt: d(2026, 8, 8),
      reviewedBy: userIds["ADMIN"],
    } as any,
  });
  await prisma.disputeHistory.create({
    data: {
      ticketId: disputeTicket.id,
      fromStatus: "PENDING_APPROVAL",
      toStatus: "ESCALATED",
      changedBy: userIds["ADMIN"],
      changedAt: d(2026, 8, 7),
      note: "Approved for admin review",
    } as any,
  });
  await prisma.pmDisputeStats.create({
    data: {
      userId: userIds["PM2"],
      totalDisputes: 1,
      resolvedDisputes: 0,
      escalatedDisputes: 1,
      pmChangedCount: 0,
      avgResolutionDays: 0,
    },
  });

  // ── Recompute denormalized client counters ─────────────────────────────
  // The seed bypasses the contract / project / payment services (it
  // inserts rows directly via Prisma), so the production hooks that
  // would otherwise fire `ClientCounterService.recomputeAll()` never
  // run. Without this explicit recompute, `/portal/profile` would render
  // all-zeros for the KPI grid because every counter defaults to 0 in
  // the schema. We delegate to the SAME method the runtime hooks call,
  // so the formula stays in lockstep with production behavior.
  //
  // We reuse the existing `prisma` connection instead of creating a new
  // `PrismaService()` — the service only needs the Prisma client API,
  // and spinning up a second connection just for one recompute is wasteful.
  // The cast is safe because `PrismaService extends PrismaClient` and
  // `ClientCounterService` never calls Nest lifecycle hooks on it.
  const counterService = new ClientCounterService(
    prisma as unknown as ConstructorParameters<typeof ClientCounterService>[0],
  );
  for (const seededClientId of [client.id, clientGreenline.id, clientNoor.id, clientOasis.id]) {
    await counterService.recomputeAll(seededClientId);
  }

  // Salaries
  await prisma.salary.createMany({
    data: [
      {
        employeeId: employeeIds["TEAM"],
        amount: 7000,
        baseSalary: 7000,
        status: "PAID",
        month: 5,
        year: 2026,
        paymentDate: new Date("2026-05-01"),
      },
      {
        employeeId: employeeIds["MARKETING"],
        amount: 8500,
        baseSalary: 8500,
        status: "PAID",
        month: 5,
        year: 2026,
        paymentDate: new Date("2026-05-01"),
      },
      {
        employeeId: employeeIds["PM2"],
        amount: 11800,
        baseSalary: 11800,
        status: "PAID",
        month: 7,
        year: 2026,
        paymentDate: new Date("2026-07-01"),
      },
      {
        employeeId: employeeIds["TEAM_DEV"],
        amount: 9100,
        baseSalary: 9100,
        status: "PENDING",
        month: 7,
        year: 2026,
      },
      {
        employeeId: employeeIds["TEAM_CONTENT"],
        amount: 6400,
        baseSalary: 6400,
        status: "CANCELLED",
        month: 7,
        year: 2026,
        notes: "Employee inactive this month",
      },
    ],
  });

  console.log(
    "✓ Seed complete — workflow baseline preserved and extended with admin-ready staff, clients, projects, disputes, invoices, workload, and activity states.",
  );

  // ── Permissions (always upserted — never deleted) ────────────────────────────
  const permissions = [
    "chat.create",
    "chat.read",
    "chat.update",
    "chat.message",
    "clients.create",
    "clients.handover",
    "clients.read",
    "clients.read_activity",
    "clients.update",
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.archive",
    "projects.manage_members",
    "proposals.create",
    "proposals.read",
    "proposals.read_public",
    "proposals.update",
    "proposals.send",
    "proposals.approve",
    "proposals.reject",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.assign",
    "tasks.approve",
    "tasks.comment",
    "tasks.delete",
    "notifications.read",
    "notifications.update",
    "notifications.broadcast",
    "marketing.manage_tests",
    "marketing.create",
    "marketing.read",
    "marketing.update",
    "marketing.delete",
    "marketing.manage_kpis",
    "marketing.flag_optimization",
    "portal.read",
    "portal.manage_deliverables",
    "portal.approve_deliverables",
    "portal.request_revisions",
    "portal.manage_intake",
    "finance.create_invoice",
    "finance.read",
    "finance.update_invoice",
    "finance.manage_tickets",
    "finance.read_ledger",
    "finance.manage_payroll",
    "requests.create",
    "requests.read",
    "requests.update",
    "requests.assign",
    "requests.convert",
    "requests.delete",
    "automation.create",
    "automation.read",
    "automation.execute",
    "contracts.create",
    "contracts.read",
    "contracts.update",
    "contracts.send",
    "contracts.sign",
    "contracts.activate",
    "contracts.cancel",
    "contracts.manage_versions",
    "contracts.manage_payment_plan",
    "contracts.read_public",
    "contracts.sign_public",
    "invoices.pay_public",
    "services.create",
    "services.read",
    "services.update",
    "services.delete",
    // Dispute permissions
    "disputes.create",
    "disputes.read",
    "disputes.pm_read",
    "disputes.pm_update",
    "disputes.admin",

    // Admin dashboard & monitoring
    "admin.stats",
    "admin.stats.trends",
    "admin.funnel",
    "admin.alerts",
    "admin.audit",
    "admin.dashboard",
    "admin.reports",

    // Admin settings & configuration
    "admin.settings",
    "admin.notifications",
    "admin.team",
    "admin.marketing",

    // Admin users & security
    "admin.users.read",
    "admin.users.manage",
    "admin.users.impersonate",
    "admin.sessions.read",
    "admin.security.read",

    // Admin domain read
    "admin.projects.read",
    "admin.tasks.read",
    "admin.contracts.read",
    "admin.requests.read",
    "admin.requests.read",
    "admin.finance.read",
    "admin.proposals.read",
    "admin.clients.read",
    "admin.campaigns.read",
    "admin.chat.read",
    "admin.portal.read",

    // Admin domain intervene
    "admin.projects.intervene",
    "admin.projects.create",
    "admin.tasks.intervene",
    "admin.contracts.intervene",
    "admin.requests.intervene",
    "admin.requests.intervene",
    "admin.finance.intervene",
    "admin.proposals.intervene",
    "admin.campaigns.create",
    "admin.campaigns.intervene",
    "admin.chat.moderate",
    "admin.portal.manage",

    // Admin clients intervene
    "admin.clients.intervene",

    // Admin generic (used on intake-forms)
    "admin.portal",
  ];

  for (const name of permissions) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const rolePermissionMapping: Record<string, string[]> = {
    ADMIN: permissions,
    PM: [
      "projects.create",
      "projects.read",
      "projects.update",
      "projects.manage_members",
      "tasks.read",
      "tasks.create",
      "tasks.assign",
      "tasks.update",
      "tasks.approve",
      "tasks.comment",
      "proposals.read",
      "proposals.update",
      "proposals.approve",
      "proposals.reject",
      "notifications.read",
      "notifications.update",
      "finance.read",
      "finance.update_invoice",
      "marketing.read",
      "portal.read",
      "services.read",
      "chat.create",
      "chat.read",
      "chat.message",
      "clients.read",
      "disputes.pm_read",
      "disputes.pm_update",
    ],
    SALES: [
      "requests.create",
      "requests.read",
      "requests.update",
      "requests.assign",
      "proposals.create",
      "proposals.read",
      "proposals.send",
      "proposals.read_public",
      "contracts.create",
      "contracts.read",
      "contracts.update",
      "contracts.send",
      "contracts.sign",
      "contracts.activate",
      "contracts.cancel",
      "contracts.manage_versions",
      "contracts.manage_payment_plan",
      "notifications.read",
      "notifications.update",
      "services.read",
      "chat.create",
      "chat.read",
      "chat.message",
      "clients.read",
      "clients.create",
      "clients.update",
      "clients.read_activity",
    ],
    TEAM: [
      "tasks.read",
      "tasks.update",
      "tasks.comment",
      "projects.read",
      "notifications.read",
      "notifications.update",
      "chat.read",
      "chat.message",
    ],
    MARKETING: [
      "marketing.create",
      "marketing.read",
      "marketing.update",
      "marketing.delete",
      "marketing.manage_tests",
      "marketing.manage_kpis",
      "marketing.flag_optimization",
      "tasks.read",
      "tasks.update",
      "tasks.comment",
      "notifications.read",
      "chat.read",
      "chat.message",
    ],
    ACCOUNTANT: [
      "finance.create_invoice",
      "finance.read",
      "finance.update_invoice",
      "finance.manage_tickets",
      "finance.read_ledger",
      "finance.manage_payroll",
      "notifications.read",
      "chat.read",
      "chat.message",
    ],
    CLIENT: [
      "proposals.read_public",
      "notifications.read",
      "requests.create",
      "contracts.read_public",
      "contracts.sign_public",
      "invoices.pay_public",
      "portal.read",
      "portal.manage_intake",
      "portal.approve_deliverables",
      "portal.request_revisions",
      "services.read",
      "chat.read",
      "chat.message",
      "clients.read",
    ],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionMapping)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    for (const permName of permNames) {
      const perm = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
