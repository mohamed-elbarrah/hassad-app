import { PrismaClient } from "@prisma/client";
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
  await prisma.projectPeriod.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractStatusHistory.deleteMany();
  await prisma.contractPaymentPlan.deleteMany();
  await prisma.contractVersion.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.leadService.deleteMany();
  await prisma.leadPipelineHistory.deleteMany();
  await prisma.leadContactLog.deleteMany();
  await prisma.leadAutomationLog.deleteMany();
  await prisma.leadAutomationRule.deleteMany();
  await prisma.requestService.deleteMany();
  await prisma.requestStatusHistory.deleteMany();
  await prisma.request.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();
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
  await prisma.leadService.deleteMany({
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
    "EMPLOYEE",
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
    { email: "admin@hassad.com", name: "Super Admin", role: "ADMIN" },
    {
      email: "pm@hassad.com",
      name: "Layla PM",
      role: "PM",
      dept: "MANAGEMENT",
    },
    { email: "sales@hassad.com", name: "Omar Sales", role: "SALES" },
    {
      email: "employee@hassad.com",
      name: "Hana Designer",
      role: "EMPLOYEE",
      dept: "DESIGN",
    },
    {
      email: "marketing@hassad.com",
      name: "Ziad Marketing",
      role: "MARKETING",
      dept: "MARKETING",
    },
    {
      email: "accountant@hassad.com",
      name: "Sara Accountant",
      role: "ACCOUNTANT",
    },
    { email: "client@hassad.com", name: "Tech Ventures CEO", role: "CLIENT" },
    { email: "client2@hassad.com", name: "Ahmad Saleh", role: "CLIENT" },
  ];

  const userIds: Record<string, string> = {};
  for (const u of userDefs) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: { connect: { name: u.role } } },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: { connect: { name: u.role } },
        isPayrollEligible: u.role !== "CLIENT",
      },
    });
    userIds[u.role] = created.id;
    if (u.email === "client@hassad.com") userIds["CLIENT1"] = created.id;
    if (u.email === "client2@hassad.com") userIds["CLIENT2"] = created.id;

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

  // ── Employees ─────────────────────────────────────────────────────────────────
  const payrollUsers = [
    { role: "EMPLOYEE",  name: "Hana Designer",       baseSalary: 7000,  payType: "FIXED" },
    { role: "MARKETING", name: "Ziad Marketing",        baseSalary: 8500,  payType: "FIXED" },
    { role: "SALES",     name: "Omar Sales",            baseSalary: 5000,  payType: "HYBRID", commissionRate: 0.05 },
    { role: "PM",        name: "Layla PM",              baseSalary: 12000, payType: "FIXED" },
    { role: "ACCOUNTANT",name: "Sara Accountant",       baseSalary: 9000,  payType: "FIXED" },
    { role: "ADMIN",     name: "Super Admin",           baseSalary: 15000, payType: "FIXED" },
  ];

  const employeeIds: Record<string, string> = {};
  for (const u of payrollUsers) {
    const emp = await prisma.employee.upsert({
      where: { userId: userIds[u.role] },
      update: {
        name: u.name,
        baseSalary: u.baseSalary,
        payType: u.payType as any,
        commissionRate: u.commissionRate ?? null,
      },
      create: {
        userId: userIds[u.role],
        name: u.name,
        role: u.role,
        baseSalary: u.baseSalary,
        payType: u.payType as any,
        commissionRate: u.commissionRate ?? null,
        isActive: true,
      },
    });
    employeeIds[u.role] = emp.id;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIENT A: TechVentures — 3 billable scenarios for quick testing
  // ═══════════════════════════════════════════════════════════════════════════════

  // ── Pipeline leads — one at every active stage (8 leads) ───────────────────
  const PIPELINE_STAGES = [
    { st: "NEW", co: "شركة الأفق", nm: "محمد علي" },
    { st: "INTRO_SENT", co: "مؤسسة النور", nm: "سارة خالد" },
    { st: "CALL_ATTEMPT", co: "مجموعة الريادة", nm: "أحمد عمر" },
    { st: "MEETING_SCHEDULED", co: "شركة التميز", nm: "نورة سعد" },
    { st: "MEETING_DONE", co: "شركة الابتكار", nm: "فهد عبدالله" },
    { st: "PROPOSAL_SENT", co: "شركة الأساس", nm: "لمى محمد" },
    { st: "FOLLOW_UP", co: "شركة التواصل", nm: "بدر إبراهيم" },
    { st: "APPROVED", co: "شركة الإنجاز", nm: "هند جميل" },
  ];
  for (const p of PIPELINE_STAGES) {
    await prisma.lead.create({
      data: {
        companyName: p.co,
        contactName: p.nm,
        phoneWhatsapp: "+966500000000",
        email: `lead.${p.st.toLowerCase()}@example.com`,
        businessName: p.co,
        businessType: "OTHER",
        source: "WEBSITE",
        pipelineStage: p.st,
        assignedTo: userIds["SALES"],
      } as any,
    });
  }

  // ── 3 CONTRACT_SIGNED leads → clients → requests → contracts → projects ────
  // These are the leads that already converted, one for each test scenario.
  const d = (y: number, m: number, d: number) => new Date(y, m - 1, d, 0, 0, 0, 0);

  const leadScenarios = [
    { key: "completed", co: "شركة التقدم", nm: "خالد الشمري", val: 18000, downPct: 20, months: 3, start: [2026, 4, 1], end: [2026, 6, 30] },
    { key: "suspended", co: "مؤسسة التقنية", nm: "أحمد السلمي", val: 12000, downPct: 0,  months: 3, start: [2026, 5, 1], end: [2026, 7, 31] },
    { key: "active",    co: "تقنيات المستقبل", nm: "فيصل القحطاني", val: 24000, downPct: 25, months: 6, start: [2026, 3, 1], end: [2026, 8, 31] },
  ] as const;

  const clientA = await prisma.client.create({
    data: {
      userId: userIds["CLIENT1"],
      companyName: "تقنيات المستقبل",
      contactName: leadScenarios[2].nm,
      phoneWhatsapp: "+966501234567",
      email: "ceo@futuretech.sa",
      businessName: "Future Technologies",
      businessType: "OTHER",
      status: "ACTIVE",
    },
  });

  // ── Requests — one per pipeline stage for the Kanban board ────────────────
  const REQUEST_STATUSES = [
    { st: "SUBMITTED",            tl: "طلب تصميم هوية بصرية" },
    { st: "QUALIFYING",           tl: "طلب إعلانات ممولة" },
    { st: "PROPOSAL_IN_PROGRESS", tl: "طلب تطوير موقع" },
    { st: "PROPOSAL_SENT",        tl: "طلب حملة تسويقية" },
    { st: "NEGOTIATION",          tl: "طلب إدارة منصات التواصل" },
    { st: "CONTRACT_PREPARATION", tl: "طلب استشارات إدارية" },
    { st: "CONTRACT_SENT",        tl: "طلب تصميم تطبيق جوال" },
    { st: "SIGNED",               tl: "طلب خدمات متكاملة" },
    { st: "PROJECT_CREATED",      tl: "طلب تحول إلى مشروع" },
    { st: "CANCELLED",            tl: "طلب ملغي" },
  ];
  for (const r of REQUEST_STATUSES) {
    await prisma.request.create({
      data: {
        clientId: clientA.id,
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

  // Create leads, proposals, contracts, and projects for each scenario
  const ctrCompleted: any = {}, ctrSuspended: any = {}, ctrActive: any = {};
  const projCompleted: any = {}, projSuspended: any = {}, projActive: any = {};

  for (const sc of leadScenarios) {
    const leadConverted = await prisma.lead.create({
      data: {
        companyName: sc.co,
        contactName: sc.nm,
        phoneWhatsapp: "+966500000000",
        email: `lead.${sc.key}@example.com`,
        businessName: sc.co,
        businessType: "OTHER",
        source: "WEBSITE",
        pipelineStage: "CONTRACT_SIGNED",
        assignedTo: userIds["SALES"],
      } as any,
    });

    const proposal = await prisma.proposal.create({
      data: {
        leadId: leadConverted.id,
        createdBy: userIds["SALES"],
        title: `عرض ${sc.co}`,
        serviceDescription: `خدمات تسويقية شاملة لـ ${sc.co}`,
        status: "APPROVED",
        totalPrice: sc.val,
        startDate: d(sc.start[0], sc.start[1], sc.start[2]),
        durationDays: sc.months * 30,
        platforms: [],
        servicesList: [
          { name: "تصميم الهوية البصرية", price: sc.val * 0.6, quantity: 1 },
          { name: "إدارة الحملات الإعلانية", price: sc.val * 0.4, quantity: 1 },
        ],
      } as any,
    });

    const downPaymentType = sc.downPct > 0 ? "PERCENT" : null;
    const downPaymentValue = sc.downPct > 0 ? sc.downPct : null;

    const contract = await prisma.contract.create({
      data: {
        clientId: clientA.id,
        proposalId: proposal.id,
        createdBy: userIds["SALES"],
        title: `عقد ${sc.co}`,
        type: "MONTHLY_RETAINER",
        status: (sc.key === "completed" ? "COMPLETED" : sc.key === "suspended" ? "ON_HOLD" : "ACTIVE") as any,
        startDate: d(sc.start[0], sc.start[1], sc.start[2]),
        endDate: d(sc.end[0], sc.end[1], sc.end[2]),
        monthlyValue: Math.round(sc.val * (1 - sc.downPct / 100) / sc.months),
        totalValue: sc.val,
        filePath: "contracts/sample.pdf",
        shareLinkToken: `share-${sc.key}-token`,
        versionNumber: 1,
        downPaymentType: downPaymentType as any,
        downPaymentValue: downPaymentValue,
        numberOfMonths: sc.months,
      },
    });

    // Payment plan rows
    if (downPaymentType) {
      await prisma.contractPaymentPlan.create({
        data: {
          contractId: contract.id,
          label: "الدفعة الأولى",
          sequence: 0,
          triggerType: "ON_SIGN",
          amountType: downPaymentType as any,
          amountValue: downPaymentValue!,
          isRecurring: false,
        },
      });
    }
    const monthlyAmount = Math.round(sc.val * (1 - sc.downPct / 100) / sc.months);
    await prisma.contractPaymentPlan.create({
      data: {
        contractId: contract.id,
        label: "الدفعة الشهرية",
        sequence: downPaymentType ? 1 : 0,
        triggerType: "PERIOD_END",
        amountType: "FIXED",
        amountValue: monthlyAmount,
        isRecurring: true,
      },
    });

    // Contract status history
    const statusFlow = sc.key === "completed"
      ? (["SENT", "SIGNED", "ACTIVE", "COMPLETED"] as const)
      : sc.key === "suspended"
        ? (["SENT", "SIGNED", "ACTIVE", "ON_HOLD"] as const)
        : (["SENT", "SIGNED", "ACTIVE"] as const);
    for (let i = 0; i < statusFlow.length; i++) {
      if (i === 0) continue;
      await prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: statusFlow[i - 1] as any,
          toStatus: statusFlow[i] as any,
          changedBy: userIds["SALES"],
          reason: i === statusFlow.length - 1 && sc.key === "suspended" ? "Period 2 overdue — auto-suspension" : `Transitioned to ${statusFlow[i]}`,
          changedAt: d(sc.start[0], sc.start[1] + i, 1),
        },
      });
    }

    // Store references
    if (sc.key === "completed") {
      Object.assign(ctrCompleted, contract);
    } else if (sc.key === "suspended") {
      Object.assign(ctrSuspended, contract);
    } else {
      Object.assign(ctrActive, contract);
    }

    // Project
    const projectStatus = sc.key === "completed" ? "COMPLETED" : sc.key === "suspended" ? "ON_HOLD" : "ACTIVE";
    const project = await prisma.project.create({
      data: {
        clientId: clientA.id,
        contractId: contract.id,
        name: sc.key === "completed" ? "حملة تسويق رمضان" : sc.key === "suspended" ? "إدارة منصات التواصل" : "تصميم هوية بصرية",
        status: projectStatus as any,
        priority: "HIGH",
        startDate: d(sc.start[0], sc.start[1], sc.start[2]),
        endDate: d(sc.end[0], sc.end[1], sc.end[2]),
        completionPercentage: sc.key === "completed" ? 100 : sc.key === "suspended" ? 40 : 50,
      },
    });

    // Project members
    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: userIds["PM"], role: "MANAGER" },
        { projectId: project.id, userId: userIds["SALES"], role: "MEMBER" },
        { projectId: project.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      ],
    });

    if (sc.key === "completed") Object.assign(projCompleted, project);
    else if (sc.key === "suspended") Object.assign(projSuspended, project);
    else Object.assign(projActive, project);

    // ── Generate periods & invoices ────────────────────────────────────────
    const periods: any[] = [];
    for (let p = 0; p < sc.months; p++) {
      const pStart = new Date(sc.start[0]!, sc.start[1]! - 1 + p, sc.start[2]!);
      const pEnd = new Date(sc.start[0]!, sc.start[1]! - 1 + p + 1, sc.start[2]! - 1);
      const isLast = p === sc.months - 1;

      // Determine period status based on scenario
      let periodStatus: string;
      let invoiceStatus: string;
      let triggeredSuspension = false;
      let paidAt: Date | null = null;

      if (sc.key === "completed") {
        periodStatus = "CLOSED";
        invoiceStatus = "PAID";
        paidAt = new Date(pEnd);
      } else if (sc.key === "suspended") {
        if (p === 0) {
          periodStatus = "CLOSED";
          invoiceStatus = "PAID";
          paidAt = new Date(pEnd);
        } else if (p === 1) {
          periodStatus = "SUSPENDED";
          invoiceStatus = "LATE";
          triggeredSuspension = true;
        } else {
          periodStatus = "UPCOMING";
          invoiceStatus = "PENDING";
        }
      } else {
        // ACTIVE scenario
        if (p < 3) {
          periodStatus = "CLOSED";
          invoiceStatus = "PAID";
          paidAt = new Date(pEnd);
        } else if (p === 3) {
          periodStatus = "ACTIVE";
          invoiceStatus = "PENDING";
        } else {
          periodStatus = "UPCOMING";
          invoiceStatus = "PENDING";
        }
      }

      if (periodStatus === "UPCOMING") break; // Stop creating periods/invoices after UPCOMING starts

      // Goals for each period (PM-defined targets visible to client)
      const periodGoals = sc.key === "completed"
        ? [
            { title: "تصميم الهوية البصرية", description: "شعار، دليل الهوية، بطاقة العمل", completed: true },
            { title: "إعداد تقويم المحتوى", description: "تقويم 30 منشور", completed: true },
            { title: "إطلاق الحملة الإعلانية", description: "إعداد وإطلاق الحملة", completed: true },
          ]
        : sc.key === "suspended"
          ? p === 0
            ? [
                { title: "تصميم منشورات الشهر", description: "30 منشور للمنصات", completed: true },
                { title: "إعداد التقويم", description: "تقويم المحتوى", completed: true },
              ]
            : p === 1
              ? [
                  { title: "تصميم منشورات الشهر", description: "30 منشور للمنصات", completed: false },
                  { title: "تحليل الأداء", description: "تقرير أداء الحملات", completed: false },
                ]
              : []
          : p < 3
            ? [
                { title: `تصميم الهوية - المرحلة ${p + 1}`, description: `تطوير عناصر الهوية`, completed: true },
                { title: "مراجعة العمل", description: "مراجعة مع العميل", completed: true },
              ]
            : p === 3
              ? [
                  { title: "اللمسات النهائية", description: "تعديلات نهائية", completed: false },
                  { title: "تسليم الملفات", description: "جميع الملفات المصدرية", completed: false },
                ]
              : [];

      const period = await prisma.projectPeriod.create({
        data: {
          projectId: project.id,
          periodNumber: p + 1,
          startDate: pStart,
          endDate: pEnd,
          status: periodStatus as any,
          completionPercentage: periodStatus === "CLOSED" ? 100 : periodStatus === "ACTIVE" ? 50 : 0,
          goals: periodGoals.length > 0 ? periodGoals : undefined,
          closedAt: periodStatus === "CLOSED" ? new Date(pEnd) : null,
          suspendedAt: periodStatus === "SUSPENDED" ? new Date(pEnd) : null,
          summary: periodStatus === "CLOSED" ? `تم إنجاز أعمال الفترة ${p + 1} بنجاح` : null,
        },
      });
      periods.push(period);

      // Period history
      if (periodStatus !== "UPCOMING") {
        await prisma.projectPeriodHistory.create({
          data: {
            periodId: period.id,
            fromStatus: "UPCOMING",
            toStatus: periodStatus as any,
            changedBy: userIds["PM"],
            changedAt: new Date(pStart),
          },
        });
      }

      // Invoice
      if (p === 0 && downPaymentType && sc.downPct > 0) {
        // Down payment invoice
        const dpAmount = Math.round(sc.val * sc.downPct / 100);
        const dpInv = await prisma.invoice.create({
          data: {
            clientId: clientA.id,
            contractId: contract.id,
            createdBy: userIds["ACCOUNTANT"],
            invoiceNumber: `INV-DOWN-${sc.key.toUpperCase().slice(0, 4)}`,
            amount: dpAmount,
            status: sc.key === "suspended" ? "PAID" : "PAID",
            paymentMethod: "BANK_TRANSFER",
            issueDate: new Date(sc.start[0]!, sc.start[1]! - 1, 1),
            dueDate: new Date(sc.start[0]!, sc.start[1]! - 1, 7),
            paidAt: new Date(sc.start[0]!, sc.start[1]! - 1, 3),
            paymentReference: `PAY-DP-${sc.key.toUpperCase().slice(0, 4)}`,
            items: { create: { description: "الدفعة الأولى", quantity: 1, unitPrice: dpAmount, total: dpAmount } },
          },
        });

        if (periodStatus !== "UPCOMING" && invoiceStatus === "PAID") {
          // Payment
          await prisma.payment.create({
            data: {
              invoiceId: dpInv.id,
              clientId: clientA.id,
              amount: dpAmount,
              status: "SUCCESS",
              method: "BANK_TRANSFER",
              date: new Date(sc.start[0]!, sc.start[1]! - 1, 3),
            },
          });
        }
      }

      // Period invoice
      const invLabel = `الدفعة الشهرية — الفترة ${p + 1}`;
      const inv = await prisma.invoice.create({
        data: {
          clientId: clientA.id,
          contractId: contract.id,
          paymentPlanId: (await prisma.contractPaymentPlan.findFirst({ where: { contractId: contract.id, isRecurring: true } }))?.id,
          createdBy: userIds["ACCOUNTANT"],
          invoiceNumber: `INV-PRD-${sc.key.toUpperCase().slice(0, 4)}-${String(p + 1).padStart(2, "0")}`,
          amount: monthlyAmount,
          status: invoiceStatus as any,
          paymentMethod: "BANK_TRANSFER",
          issueDate: new Date(pEnd),
          dueDate: new Date(pEnd.getTime() + 7 * 24 * 60 * 60 * 1000),
          paidAt,
          paymentReference: paidAt ? `PAY-${sc.key.toUpperCase().slice(0, 4)}-${String(p + 1).padStart(2, "0")}` : null,
          triggeredSuspension,
          reminderFlags: invoiceStatus === "LATE" ? 7 : 0,
          items: { create: { description: invLabel, quantity: 1, unitPrice: monthlyAmount, total: monthlyAmount } },
        },
      });

      // Link period to invoice
      await prisma.projectPeriod.update({ where: { id: period.id }, data: { invoiceId: inv.id } });

      // Payment record for paid invoices
      if (invoiceStatus === "PAID" && paidAt) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            clientId: clientA.id,
            amount: monthlyAmount,
            status: "SUCCESS",
            method: "BANK_TRANSFER",
            date: paidAt,
          },
        });
      }
    }

    // ── Tasks ────────────────────────────────────────────────────────────────
    const taskDefs: Array<{ title: string; status: string; priority: string; due: number[] }> = [];
    if (sc.key === "completed") {
      taskDefs.push(
        { title: "تصميم الهوية البصرية", status: "DONE", priority: "HIGH", due: [2026, 4, 20] },
        { title: "إطلاق حملة إعلانية", status: "DONE", priority: "HIGH", due: [2026, 5, 15] },
        { title: "إعداد تقرير الإنجاز", status: "DONE", priority: "NORMAL", due: [2026, 6, 25] },
      );
    } else if (sc.key === "suspended") {
      taskDefs.push(
        { title: "تصميم منشورات شهر مايو", status: "DONE", priority: "HIGH", due: [2026, 5, 15] },
        { title: "تصميم منشورات شهر يونيو", status: "TODO", priority: "HIGH", due: [2026, 6, 15] },
      );
    } else {
      taskDefs.push(
        { title: "تصميم دليل الهوية البصرية", status: "IN_PROGRESS", priority: "HIGH", due: [2026, 6, 25] },
        { title: "تجهيز ملف العلامة التجارية", status: "TODO", priority: "NORMAL", due: [2026, 7, 10] },
      );
    }

    for (const t of taskDefs) {
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          departmentId: designDept!.id,
          title: t.title,
          status: t.status as any,
          priority: t.priority as any,
          dueDate: d(t.due[0], t.due[1], t.due[2]),
          assignedTo: userIds["EMPLOYEE"],
          createdBy: userIds["PM"],
        },
      });
      if (t.status === "DONE") {
        await prisma.taskStatusHistory.create({
          data: { taskId: task.id, fromStatus: "TODO", toStatus: "DONE", changedBy: userIds["EMPLOYEE"], changedAt: d(t.due[0], t.due[1], t.due[2]) },
        });
      }
      if (t.status === "IN_PROGRESS") {
        await prisma.taskStatusHistory.create({
          data: { taskId: task.id, fromStatus: "TODO", toStatus: "IN_PROGRESS", changedBy: userIds["EMPLOYEE"], changedAt: d(2026, 6, 10) },
        });
      }
    }

    // ── Deliverable ──────────────────────────────────────────────────────────
    await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title: sc.key === "completed" ? "تقرير الإنجاز النهائي" : sc.key === "suspended" ? "تقويم المحتوى الشهري" : "دليل الهوية البصرية",
        status: (sc.key === "completed" ? "DONE" : sc.key === "suspended" ? "DONE" : "IN_REVIEW") as any,
        filePath: "",
      },
    });
  }

  // ── Extra proposals — full status variety for the proposals page ──────────
  const extraLead = await prisma.lead.create({
    data: {
      companyName: "مؤسسة اختبار العروض",
      contactName: "مشاري التميمي",
      phoneWhatsapp: "+966500000099",
      email: "extra-proposals@example.com",
      businessName: "مؤسسة اختبار العروض",
      businessType: "OTHER",
      source: "WEBSITE",
      pipelineStage: "APPROVED",
      assignedTo: userIds["SALES"],
    } as any,
  });
  const EXTRA_STATUSES = ["DRAFT", "SENT", "REVISION_REQUESTED", "REJECTED"];
  for (const st of EXTRA_STATUSES) {
    await prisma.proposal.create({
      data: {
        leadId: extraLead.id,
        clientId: clientA.id,
        createdBy: userIds["SALES"],
        title: st === "DRAFT" ? "عرض مسودة — تصميم هوية"
             : st === "SENT" ? "عرض مرسل — حملة إعلانية"
             : st === "REVISION_REQUESTED" ? "عرض طلب تعديل — تطوير موقع"
             : "عرض مرفوض — خدمات استشارية",
        serviceDescription: `عرض توضيحي للحالة ${st}`,
        status: st as any,
        totalPrice: 5000,
        startDate: new Date("2026-06-01"),
        durationDays: 30,
        platforms: [],
        servicesList: [{ name: "خدمة اختبار", price: 5000, quantity: 1 }],
      } as any,
    });
  }

  // ── Extra contracts — full status variety for the contracts page ──────────
  const EXTRA_CONTRACT_STATUSES = ["DRAFT", "SENT", "SIGNED", "EXPIRED", "CANCELLED"];
  for (const st of EXTRA_CONTRACT_STATUSES) {
    await prisma.contract.create({
      data: {
        clientId: clientA.id,
        createdBy: userIds["SALES"],
        title: st === "DRAFT" ? "عقد مسودة — خدمات تصميم"
             : st === "SENT" ? "عقد مرسل — حملة إعلانية"
             : st === "SIGNED" ? "عقد موقع — تطوير موقع"
             : st === "EXPIRED" ? "عقد منتهي — استشارات"
             : "عقد ملغي — خدمات متكاملة",
        type: "MONTHLY_RETAINER",
        status: st as any,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        monthlyValue: 5000,
        totalValue: 60000,
      },
    });
  }

  // ── Campaign (for the active project only) ────────────────────────────────
  const campaignTask = await prisma.task.create({
    data: {
      projectId: projActive.id,
      departmentId: marketingDept!.id,
      title: "إدارة حملة إطلاق الهوية",
      status: "IN_PROGRESS" as any,
      priority: "HIGH" as any,
      dueDate: d(2026, 8, 31),
      assignedTo: userIds["MARKETING"],
      createdBy: userIds["PM"],
    },
  });
  const campaign = await prisma.campaign.create({
    data: {
      clientId: clientA.id,
      taskId: campaignTask.id,
      projectId: projActive.id,
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

  // ── Satisfaction rating for the completed project ─────────────────────────
  await prisma.satisfactionRating.create({
    data: {
      clientId: clientA.id,
      projectId: projCompleted.id,
      score: 5,
      comment: "تجربة ممتازة. تم تسليم جميع الأعمال في الوقت المحدد وبجودة عالية.",
      triggerEvent: "MONTHLY_REVIEW",
      autoAction: "NONE",
    },
  });

  // ── Client history log for the active contract ────────────────────────────
  await prisma.clientHistoryLog.create({
    data: {
      clientId: clientA.id,
      userId: userIds["ADMIN"],
      eventType: "CONTRACT_ACTIVATED",
      description: `تم تفعيل العقد: ${ctrActive.title}`,
      occurredAt: new Date(),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIENT B: Nova Eats — Active client with mixed data
  // ═══════════════════════════════════════════════════════════════════════════════

  const leadNova = await prisma.lead.create({
    data: {
      companyName: "Nova Eats",
      contactName: "Ahmad Saleh",
      phoneWhatsapp: "+966501112233",
      email: "ahmad@novaeats.sa",
      businessName: "Nova Eats Restaurant",
      businessType: "RESTAURANT",
      source: "REFERRAL",
      assignedTo: userIds["SALES"],
      pipelineStage: "CONTRACT_SIGNED",
    },
  });

  await prisma.leadPipelineHistory.create({
    data: {
      leadId: leadNova.id,
      fromStage: "PROPOSAL_SENT",
      toStage: "CONTRACT_SIGNED",
      changedBy: userIds["SALES"],
    },
  });

  const clientB = await prisma.client.create({
    data: {
      leadId: leadNova.id,
      userId: userIds["CLIENT2"],
      companyName: "Nova Eats",
      contactName: "Ahmad Saleh",
      phoneWhatsapp: "+966501112233",
      email: "ahmad@novaeats.sa",
      businessName: "Nova Eats Restaurant",
      businessType: "RESTAURANT",
      accountManager: userIds["SALES"],
      status: "ACTIVE",
    },
  });

  // Proposal for Nova Eats
  await prisma.proposal.create({
    data: {
      leadId: leadNova.id,
      clientId: clientB.id,
      createdBy: userIds["SALES"],
      title: "Social Media Management",
      serviceDescription: "Full SMM for Nova Eats",
      servicesList: [
        { name: "Content Creation", sessions: 12 },
        { name: "Story Design", sessions: 30 },
      ],
      totalPrice: 5500,
      durationDays: 30,
      platforms: ["Instagram", "TikTok", "Snapchat"],
      status: "APPROVED",
    },
  });

  // Contract
  const ctrNova = await prisma.contract.create({
    data: {
      clientId: clientB.id,
      createdBy: userIds["PM"],
      title: "Nova Eats Social Media",
      type: "MONTHLY_RETAINER",
      status: "ACTIVE",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-02-28"),
      monthlyValue: 5500,
      totalValue: 66000,
      eSigned: true,
      signedAt: new Date("2026-03-01"),
    },
  });

  // Project
  const projNova = await prisma.project.create({
    data: {
      clientId: clientB.id,
      contractId: ctrNova.id,
      projectManagerId: userIds["PM"],
      name: "إدارة محتوى Nova Eats",
      description: "إنشاء وجدولة محتوى شهري",
      status: "ACTIVE",
      priority: "NORMAL",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-02-28"),
      completionPercentage: 50,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projNova.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projNova.id, userId: userIds["MARKETING"], role: "MEMBER" },
    ],
    skipDuplicates: true,
  });

  // Tasks (need IDs back for campaigns)
  const novaTasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: projNova.id,
        departmentId: contentDept!.id,
        assignedTo: userIds["EMPLOYEE"],
        createdBy: userIds["PM"],
        title: "إنشاء تقويم المحتوى - يونيو",
        description: "تخطيط 30 منشور",
        status: "IN_PROGRESS",
        priority: "NORMAL",
        dueDate: new Date("2026-05-25"),
      },
    }),
    prisma.task.create({
      data: {
        projectId: projNova.id,
        departmentId: designDept!.id,
        assignedTo: userIds["EMPLOYEE"],
        createdBy: userIds["PM"],
        title: "تصميم منشورات العروض",
        description: "تصميم 10 منشورات ترويجية",
        status: "TODO",
        priority: "NORMAL",
        dueDate: new Date("2026-05-30"),
      },
    }),
    prisma.task.create({
      data: {
        projectId: projNova.id,
        departmentId: marketingDept!.id,
        assignedTo: userIds["MARKETING"],
        createdBy: userIds["PM"],
        title: "إطلاق حملة رمضان",
        description: "حملة إعلانية على ميتا",
        status: "DONE",
        priority: "URGENT",
        dueDate: new Date("2026-04-01"),
        approvedBy: userIds["PM"],
        approvedAt: new Date("2026-03-28"),
      },
    }),
  ]);

  // Deliverables
  await prisma.deliverable.createMany({
    data: [
      {
        projectId: projNova.id,
        title: "تقويم المحتوى - مايو",
        description: "خطة المحتوى لشهر مايو",
        filePath: "",
        status: "DONE",
        isVisibleToClient: true,
        approvedBy: userIds["PM"],
        approvedAt: new Date("2026-04-25"),
      },
      {
        projectId: projNova.id,
        title: "منشورات الأسبوع الأول",
        description: "تصاميم منشورات الأسبوع",
        filePath: "/uploads/nova-week1.zip",
        status: "IN_REVIEW",
        isVisibleToClient: true,
      },
      {
        projectId: projNova.id,
        title: "تقرير الأداء",
        description: "تقرير شهري بالأداء",
        filePath: "",
        status: "TODO",
        isVisibleToClient: true,
      },
    ],
  });

  // Invoices
  const invNova1 = await prisma.invoice.create({
    data: {
      clientId: clientB.id,
      contractId: ctrNova.id,
      createdBy: userIds["ACCOUNTANT"],
      invoiceNumber: "INV-20260501-N01",
      amount: 5500,
      status: "DUE",
      paymentMethod: "MADA",
      issueDate: new Date("2026-05-01"),
      dueDate: new Date("2026-05-15"),
    },
  });
  const invNova2 = await prisma.invoice.create({
    data: {
      clientId: clientB.id,
      contractId: ctrNova.id,
      createdBy: userIds["ACCOUNTANT"],
      invoiceNumber: "INV-20260401-N02",
      amount: 5500,
      status: "PARTIAL",
      paymentMethod: "BANK_TRANSFER",
      issueDate: new Date("2026-04-01"),
      dueDate: new Date("2026-04-15"),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invNova1.id,
        description: "إدارة سوشال ميديا - مايو",
        quantity: 1,
        unitPrice: 5500,
        total: 5500,
      },
      {
        invoiceId: invNova2.id,
        description: "إدارة سوشال ميديا - أبريل",
        quantity: 1,
        unitPrice: 5500,
        total: 5500,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      invoiceId: invNova2.id,
      clientId: clientB.id,
      amount: 2750,
      method: "BANK_TRANSFER",
      status: "SUCCESS",
      date: new Date("2026-04-10"),
    },
  });

  // Campaign
  await prisma.campaign.create({
    data: {
      clientId: clientB.id,
      taskId: novaTasks[0].id,
      projectId: projNova.id,
      managedBy: userIds["MARKETING"],
      name: "عروض Nova الصيفية",
      platform: "META",
      status: "ACTIVE",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-08-01"),
      budgetTotal: 8000,
      budgetSpent: 2000,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIENT C: Historical/Legacy client — all completed/cancelled, for reports
  // ═══════════════════════════════════════════════════════════════════════════════

  const leadLegacy = await prisma.lead.create({
    data: {
      companyName: "شركة التراث",
      contactName: "يوسف العمري",
      phoneWhatsapp: "+966504445566",
      email: "legacy@example.com",
      businessName: "مؤسسة التراث التجارية",
      businessType: "STORE",
      source: "REFERRAL",
      assignedTo: userIds["SALES"],
      pipelineStage: "CONTRACT_SIGNED",
    },
  });

  const clientC = await prisma.client.create({
    data: {
      leadId: leadLegacy.id,
      companyName: "شركة التراث",
      contactName: "يوسف العمري",
      phoneWhatsapp: "+966504445566",
      email: "legacy@example.com",
      businessName: "مؤسسة التراث التجارية",
      businessType: "STORE",
      accountManager: userIds["SALES"],
      status: "ACTIVE",
    },
  });

  const ctrLegacy1 = await prisma.contract.create({
    data: {
      clientId: clientC.id,
      createdBy: userIds["PM"],
      title: "حملة إطلاق المتجر 2024",
      type: "FIXED_PROJECT",
      status: "EXPIRED",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      monthlyValue: 0,
      totalValue: 45000,
      eSigned: true,
      signedAt: new Date("2024-01-01"),
    },
  });
  const ctrLegacy2 = await prisma.contract.create({
    data: {
      clientId: clientC.id,
      createdBy: userIds["PM"],
      title: "صيانة الموقع 2024",
      type: "MONTHLY_RETAINER",
      status: "EXPIRED",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      monthlyValue: 3000,
      totalValue: 36000,
      eSigned: true,
      signedAt: new Date("2024-01-01"),
    },
  });
  const ctrLegacy3 = await prisma.contract.create({
    data: {
      clientId: clientC.id,
      createdBy: userIds["PM"],
      title: "تطبيق جوال (ملغى)",
      type: "FIXED_PROJECT",
      status: "CANCELLED",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
      monthlyValue: 0,
      totalValue: 80000,
      eSigned: true,
      signedAt: new Date("2024-06-15"),
    },
  });

  const projLegacy1 = await prisma.project.create({
    data: {
      clientId: clientC.id,
      contractId: ctrLegacy1.id,
      projectManagerId: userIds["PM"],
      name: "إطلاق متجر التراث",
      description: "حملة إطلاق المتجر الإلكتروني",
      status: "COMPLETED",
      priority: "HIGH",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-06-15"),
      completionPercentage: 100,
    },
  });
  const projLegacy2 = await prisma.project.create({
    data: {
      clientId: clientC.id,
      contractId: ctrLegacy2.id,
      projectManagerId: userIds["PM"],
      name: "صيانة موقع التراث",
      description: "صيانة دورية وتحسينات",
      status: "COMPLETED",
      priority: "NORMAL",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      completionPercentage: 100,
    },
  });
  const projLegacy3 = await prisma.project.create({
    data: {
      clientId: clientC.id,
      contractId: ctrLegacy3.id,
      projectManagerId: userIds["PM"],
      name: "تطبيق التراث (ملغى)",
      description: "تم إلغاء المشروع",
      status: "CANCELLED",
      priority: "NORMAL",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
      completionPercentage: 10,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      {
        projectId: projLegacy1.id,
        userId: userIds["EMPLOYEE"],
        role: "MEMBER",
      },
      {
        projectId: projLegacy1.id,
        userId: userIds["MARKETING"],
        role: "MEMBER",
      },
      {
        projectId: projLegacy2.id,
        userId: userIds["EMPLOYEE"],
        role: "MEMBER",
      },
      {
        projectId: projLegacy3.id,
        userId: userIds["EMPLOYEE"],
        role: "MEMBER",
      },
    ],
    skipDuplicates: true,
  });

  const legacyTasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: projLegacy1.id,
        departmentId: marketingDept!.id,
        assignedTo: userIds["MARKETING"],
        createdBy: userIds["PM"],
        title: "تصميم هوية المتجر",
        description: "تصميم الهوية البصرية للمتجر",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2024-03-01"),
        approvedBy: userIds["PM"],
        approvedAt: new Date("2024-02-28"),
      },
    }),
    prisma.task.create({
      data: {
        projectId: projLegacy1.id,
        departmentId: designDept!.id,
        assignedTo: userIds["EMPLOYEE"],
        createdBy: userIds["PM"],
        title: "تطوير واجهة المتجر",
        description: "تطوير frontend",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2024-05-01"),
        approvedBy: userIds["PM"],
        approvedAt: new Date("2024-04-30"),
      },
    }),
    prisma.task.create({
      data: {
        projectId: projLegacy2.id,
        departmentId: designDept!.id,
        assignedTo: userIds["EMPLOYEE"],
        createdBy: userIds["PM"],
        title: "تحديثات شهرية",
        description: "تحديثات دورية",
        status: "DONE",
        priority: "NORMAL",
        dueDate: new Date("2024-12-15"),
        approvedBy: userIds["PM"],
        approvedAt: new Date("2024-12-10"),
      },
    }),
  ]);

  await prisma.deliverable.createMany({
    data: [
      {
        projectId: projLegacy1.id,
        title: "تقرير الإطلاق النهائي",
        description: "تقرير شامل",
        filePath: "",
        status: "DONE",
        isVisibleToClient: true,
        approvedBy: userIds["PM"],
        approvedAt: new Date("2024-06-10"),
      },
      {
        projectId: projLegacy2.id,
        title: "تقرير السنة",
        description: "ملخص أعمال السنة",
        filePath: "",
        status: "DONE",
        isVisibleToClient: true,
        approvedBy: userIds["PM"],
        approvedAt: new Date("2024-12-20"),
      },
    ],
  });

  const invLegacy1 = await prisma.invoice.create({
    data: {
      clientId: clientC.id,
      contractId: ctrLegacy1.id,
      createdBy: userIds["ACCOUNTANT"],
      invoiceNumber: "INV-20240101-L01",
      amount: 22500,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      issueDate: new Date("2024-01-01"),
      dueDate: new Date("2024-01-15"),
      paidAt: new Date("2024-01-12"),
      paymentReference: "TXN-20240112-L01",
    },
  });
  const invLegacy2 = await prisma.invoice.create({
    data: {
      clientId: clientC.id,
      contractId: ctrLegacy1.id,
      createdBy: userIds["ACCOUNTANT"],
      invoiceNumber: "INV-20240401-L02",
      amount: 22500,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      issueDate: new Date("2024-04-01"),
      dueDate: new Date("2024-04-15"),
      paidAt: new Date("2024-04-10"),
      paymentReference: "TXN-20240410-L02",
    },
  });
  const invLegacy3 = await prisma.invoice.create({
    data: {
      clientId: clientC.id,
      contractId: ctrLegacy3.id,
      createdBy: userIds["ACCOUNTANT"],
      invoiceNumber: "INV-20240701-L03",
      amount: 40000,
      status: "CANCELLED",
      paymentMethod: "BANK_TRANSFER",
      issueDate: new Date("2024-07-01"),
      dueDate: new Date("2024-07-15"),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invLegacy1.id,
        description: "الدفعة الأولى - تصميم",
        quantity: 1,
        unitPrice: 22500,
        total: 22500,
      },
      {
        invoiceId: invLegacy2.id,
        description: "الدفعة الثانية - تطوير",
        quantity: 1,
        unitPrice: 22500,
        total: 22500,
      },
      {
        invoiceId: invLegacy3.id,
        description: "الدفعة الأولى - تطبيق (ملغاة)",
        quantity: 1,
        unitPrice: 40000,
        total: 40000,
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      {
        invoiceId: invLegacy1.id,
        clientId: clientC.id,
        amount: 22500,
        method: "BANK_TRANSFER",
        status: "SUCCESS",
        date: new Date("2024-01-12"),
      },
      {
        invoiceId: invLegacy2.id,
        clientId: clientC.id,
        amount: 22500,
        method: "BANK_TRANSFER",
        status: "SUCCESS",
        date: new Date("2024-04-10"),
      },
    ],
  });

  // Campaigns
  await prisma.campaign.createMany({
    data: [
      {
        clientId: clientC.id,
        taskId: legacyTasks[0].id,
        projectId: projLegacy1.id,
        managedBy: userIds["MARKETING"],
        name: "حملة إطلاق 2024",
        platform: "META",
        status: "COMPLETED",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-05-31"),
        budgetTotal: 18000,
        budgetSpent: 17500,
      },
      {
        clientId: clientC.id,
        taskId: legacyTasks[1].id,
        projectId: projLegacy2.id,
        managedBy: userIds["MARKETING"],
        name: "حملة الصيانة الشهرية",
        platform: "GOOGLE",
        status: "COMPLETED",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-11-30"),
        budgetTotal: 12000,
        budgetSpent: 11800,
      },
    ],
  });

  await prisma.clientHistoryLog.createMany({
    data: [
      {
        clientId: clientC.id,
        userId: userIds["PM"],
        eventType: "PROJECT_COMPLETED",
        description: "تم اكتمال مشروع إطلاق متجر التراث",
        occurredAt: new Date("2024-06-15"),
      },
      {
        clientId: clientC.id,
        userId: userIds["PM"],
        eventType: "PROJECT_COMPLETED",
        description: "تم اكتمال مشروع صيانة الموقع السنوي",
        occurredAt: new Date("2024-12-31"),
      },
    ],
  });

  // Salaries
  await prisma.salary.createMany({
    data: [
      {
        employeeId: employeeIds["EMPLOYEE"],
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
    ],
  });

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
    "leads.create",
    "leads.read",
    "leads.update",
    "leads.assign",
    "leads.convert",
    "leads.delete",
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
    ],
    SALES: [
      "leads.create",
      "leads.read",
      "leads.update",
      "leads.assign",
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
    EMPLOYEE: [
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
      "leads.create",
      "contracts.read_public",
      "contracts.sign_public",
      "invoices.pay_public",
      "portal.read",
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

  console.log(
    "✓ Seed complete — all statuses covered across 3 clients (password: password123)",
  );
  console.log(
    "  Client A (client@hassad.com): 11 leads, 10 requests, 7 proposals, 8 contracts, 3 projects, 10+ invoices, 1 campaign",
  );
  console.log("  Client B (client2@hassad.com): Active client with mixed data");
  console.log(
    "  Client C (legacy): All completed/cancelled for history/reports",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
