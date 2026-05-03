import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Clear dynamic data
  await prisma.notification.deleteMany();
  await prisma.notificationEvent.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.paymentTicket.deleteMany();

  await prisma.invoice.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.leadService.deleteMany();

  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();

  // ── 1a. Service Catalog ──────────────────────────────────────────────────────
  const serviceBranding = await prisma.serviceCatalog.create({
    data: {
      name: "Brand Identity",
      nameAr: "الهوية البصرية",
      description: "Complete brand identity design including logo, colors, and guidelines",
      descriptionAr: "تصميم هوية بصرية متكاملة تشمل الشعار والألوان والإرشادات",
      category: "BRANDING",
      estimatedDays: 14,
      basePrice: 5000,
      isActive: true,
      sortOrder: 1,
    },
  });

  const serviceLanding = await prisma.serviceCatalog.create({
    data: {
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
  });

  const serviceAdCampaign = await prisma.serviceCatalog.create({
    data: {
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
  });

  const serviceContent = await prisma.serviceCatalog.create({
    data: {
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
  });

  // ── 1b. Deliverable Templates per Service ────────────────────────────────────
  await prisma.deliverableTemplate.createMany({
    data: [
      { serviceId: serviceBranding.id, title: "Brand Logo Design", titleAr: "تصميم شعار العلامة التجارية", description: "3 logo variants to choose from", descriptionAr: "3 خيارات للشعار", sortOrder: 1 },
      { serviceId: serviceBranding.id, title: "Brand Guidelines", titleAr: "دليل الهوية البصرية", description: "Complete brand style guide", descriptionAr: "دليل.style شامل للهوية البصرية", sortOrder: 2 },
      { serviceId: serviceBranding.id, title: "Business Card Design", titleAr: "تصميم بطاقة العمل", description: "Professional business card design", descriptionAr: "تصميم بطاقة عمل احترافية", sortOrder: 3 },
      { serviceId: serviceLanding.id, title: "Landing Page Design", titleAr: "تصميم صفحة الهبوط", description: "UI/UX design for landing page", descriptionAr: "تصميم واجهة صفحة الهبوط", sortOrder: 1 },
      { serviceId: serviceLanding.id, title: "Landing Page Development", titleAr: "تطوير صفحة الهبوط", description: "Front-end development of landing page", descriptionAr: "تطوير واجهة صفحة الهبوط", sortOrder: 2 },
      { serviceId: serviceAdCampaign.id, title: "Campaign Strategy", titleAr: "استراتيجية الحملة الإعلانية", description: "Ad campaign strategy document", descriptionAr: "وثيقة استراتيجية الحملة الإعلانية", sortOrder: 1 },
      { serviceId: serviceAdCampaign.id, title: "Ad Creative Design", titleAr: "تصميم الإعلانات", description: "Creative assets for the ad campaign", descriptionAr: "تصميم الأصول الإبداعية للحملة", sortOrder: 2 },
      { serviceId: serviceAdCampaign.id, title: "Campaign Launch & Management", titleAr: "إطلاق وإدارة الحملة", description: "Launching and managing the ad campaign", descriptionAr: "إطلاق وإدارة الحملة الإعلانية", sortOrder: 3 },
      { serviceId: serviceContent.id, title: "Content Calendar", titleAr: "تقويم المحتوى", description: "Monthly content calendar", descriptionAr: "تقويم المحتوى الشهري", sortOrder: 1 },
      { serviceId: serviceContent.id, title: "Social Media Posts", titleAr: "منشورات وسائل التواصل", description: "Design and copy for social media posts", descriptionAr: "تصميم ونصوص المنشورات", sortOrder: 2 },
    ],
  });

  // ── 1. Roles ─────────────────────────────────────────────────────────────────
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

  // ── 2. Departments ────────────────────────────────────────────────────────────
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

  // ── 3. Users ──────────────────────────────────────────────────────────────────
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
  ];

  const users: Record<string, string> = {};
  for (const u of userDefs) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: { connect: { name: u.role } },
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: { connect: { name: u.role } },
      },
    });
    users[u.role] = created.id;

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

  // ── 4. Leads ──────────────────────────────────────────────────────────────────
  const lead1 = await prisma.lead.create({
    data: {
      companyName: "Nova Eats",
      contactName: "Ahmad Saleh",
      phoneWhatsapp: "+966501112233",
      email: "ahmad@novaeats.sa",
      businessName: "Nova Eats Restaurant",
      businessType: "RESTAURANT",
      source: "REFERRAL",
      assignedTo: users["SALES"],
      pipelineStage: "PROPOSAL_SENT",
      notes: "Interested in social media management",
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      companyName: "AlShifa Clinic",
      contactName: "Dr. Sara Al-Nasser",
      phoneWhatsapp: "+966507778899",
      email: "sara@alshifa.sa",
      businessName: "AlShifa Medical Center",
      businessType: "CLINIC",
      source: "AD",
      assignedTo: users["SALES"],
      pipelineStage: "MEETING_DONE",
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      companyName: "TechVentures",
      contactName: "Tech Ventures CEO",
      phoneWhatsapp: "+966509990011",
      email: "client@hassad.com",
      businessName: "TechVentures Co.",
      businessType: "OTHER",
      source: "WEBSITE",
      assignedTo: users["SALES"],
      pipelineStage: "CONTRACT_SIGNED",
    },
  });

  // ── 5. Clients ────────────────────────────────────────────────────────────────
  const client1 = await prisma.client.create({
    data: {
      leadId: lead3.id,
      companyName: "TechVentures",
      contactName: "Tech Ventures CEO",
      phoneWhatsapp: "+966509990011",
      email: "client@hassad.com",
      businessName: "TechVentures Co.",
      businessType: "OTHER",
      accountManager: users["PM"],
      status: "ACTIVE",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      leadId: lead1.id,
      companyName: "Nova Eats",
      contactName: "Ahmad Saleh",
      phoneWhatsapp: "+966501112233",
      email: "ahmad@novaeats.sa",
      businessName: "Nova Eats Restaurant",
      businessType: "RESTAURANT",
      accountManager: users["PM"],
      status: "ACTIVE",
    },
  });

  // ── 6. Proposal ───────────────────────────────────────────────────────────────
  const proposal1 = await prisma.proposal.create({
    data: {
      leadId: lead1.id,
      createdBy: users["SALES"],
      title: "Social Media Management Package",
      serviceDescription:
        "Full social media management including content creation, scheduling, and reporting.",
      servicesList: [
        { name: "Content Creation", sessions: 12 },
        { name: "Story Design", sessions: 30 },
        { name: "Monthly Report", sessions: 1 },
      ],
      totalPrice: 5500,
      durationDays: 30,
      platforms: ["Instagram", "TikTok", "Snapchat"],
      status: "SENT",
      shareLinkToken: "demo-share-token-abc123",
      sentAt: new Date(),
    },
  });

  // ── 7. Contracts ──────────────────────────────────────────────────────────────
  const contract1 = await prisma.contract.create({
    data: {
      clientId: client1.id,
      createdBy: users["PM"],
      title: "TechVentures Digital Marketing Contract",
      type: "MONTHLY_RETAINER",
      status: "ACTIVE",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      monthlyValue: 8000,
      totalValue: 96000,
      eSigned: true,
      signedAt: new Date("2024-01-01"),
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      clientId: client2.id,
      createdBy: users["PM"],
      title: "Nova Eats Social Media Contract",
      type: "MONTHLY_RETAINER",
      status: "SIGNED",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-02-28"),
      monthlyValue: 5500,
      totalValue: 66000,
      eSigned: true,
      signedAt: new Date("2024-03-01"),
    },
  });

  // ── 8. Projects ───────────────────────────────────────────────────────────────
  const designDept = await prisma.department.findUnique({
    where: { name: "DESIGN" },
  });
  const contentDept = await prisma.department.findUnique({
    where: { name: "CONTENT" },
  });
  const marketingDept = await prisma.department.findUnique({
    where: { name: "MARKETING" },
  });

  // Link services to lead3 (TechVentures)
  await prisma.leadService.createMany({
    data: [
      { leadId: lead3.id, serviceId: serviceBranding.id, quantity: 1 },
      { leadId: lead3.id, serviceId: serviceLanding.id, quantity: 1 },
      { leadId: lead3.id, serviceId: serviceAdCampaign.id, quantity: 1 },
    ],
  });

  const project1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      contractId: contract1.id,
      projectManagerId: users["PM"],
      name: "TechVentures Brand Overhaul",
      description:
        "Complete brand identity and digital presence overhaul for TechVentures.",
      status: "ACTIVE",
      priority: "HIGH",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-07-15"),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      clientId: client2.id,
      contractId: contract2.id,
      projectManagerId: users["PM"],
      name: "Nova Eats Monthly Content",
      description:
        "Monthly content creation and social media management for Nova Eats.",
      status: "ACTIVE",
      priority: "NORMAL",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-02-28"),
    },
  });

  // Project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: users["EMPLOYEE"], role: "MEMBER" },
      { projectId: project1.id, userId: users["MARKETING"], role: "MEMBER" },
      { projectId: project2.id, userId: users["EMPLOYEE"], role: "MEMBER" },
      { projectId: project2.id, userId: users["MARKETING"], role: "MEMBER" },
    ],
    skipDuplicates: true,
  });

  // ── 8b. Deliverables for project1 (client portal progress) ──────────────────
  await prisma.deliverable.createMany({
    data: [
      {
        projectId: project1.id,
        title: "تصميم شعار العلامة التجارية",
        description: "3 خيارات للشعار للاختيار من betweenها",
        filePath: "",
        status: "DONE",
        isVisibleToClient: true,
        approvedBy: users["PM"],
        approvedAt: new Date("2024-02-01"),
      },
      {
        projectId: project1.id,
        title: "تصميم صفحة الهبوط",
        description: "تصميم واجهة صفحة الهبوط",
        filePath: "",
        status: "IN_PROGRESS",
        isVisibleToClient: true,
      },
      {
        projectId: project1.id,
        title: "إطلاق وإدارة الحملة الإعلانية",
        description: "إطلاق وإدارة الحملة الإعلانية على الانستغرام وتيكتوك",
        filePath: "",
        status: "TODO",
        isVisibleToClient: true,
      },
    ],
  });

// ── 9. Tasks ──────────────────────────────────────────────────────────────────
const task1 = await prisma.task.create({
  data: {
    projectId: project1.id,
    departmentId: designDept!.id,
    assignedTo: users["EMPLOYEE"],
    createdBy: users["PM"],
    title: "Design brand logo variants",
    description: "Create 3 logo variants for TechVentures new identity",
    status: "IN_REVIEW",
    priority: "HIGH",
    dueDate: new Date("2024-02-10"),
  },
});

const task2 = await prisma.task.create({
  data: {
    projectId: project1.id,
    departmentId: contentDept!.id,
    assignedTo: users["EMPLOYEE"],
    createdBy: users["PM"],
    title: "Write brand voice guidelines",
    description: "Document tone, voice, and messaging pillars",
    status: "IN_PROGRESS",
    priority: "NORMAL",
    dueDate: new Date("2024-02-20"),
  },
});

const task3 = await prisma.task.create({
  data: {
    projectId: project2.id,
    departmentId: contentDept!.id,
    assignedTo: users["EMPLOYEE"],
    createdBy: users["PM"],
    title: "Create April content calendar",
    description: "Plan and design 30 posts for Instagram and TikTok",
    status: "TODO",
    priority: "NORMAL",
    dueDate: new Date("2024-03-25"),
  },
});

const task4 = await prisma.task.create({
  data: {
    projectId: project2.id,
    departmentId: marketingDept!.id,
    assignedTo: users["MARKETING"],
    createdBy: users["PM"],
    title: "Launch Ramadan campaign",
    description: "Set up and launch Meta ads for the Ramadan promotion",
    status: "DONE",
    priority: "URGENT",
    dueDate: new Date("2024-03-10"),
    approvedBy: users["PM"],
    approvedAt: new Date("2024-03-09"),
  },
});



  // ── 11. Invoices ──────────────────────────────────────────────────────────────
  const invoice1 = await prisma.invoice.create({
    data: {
      clientId: client1.id,
      contractId: contract1.id,
      createdBy: users["ACCOUNTANT"],
      invoiceNumber: "INV-20240101-0001",
      amount: 8000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      issueDate: new Date("2024-01-01"),
      dueDate: new Date("2024-01-15"),
      paidAt: new Date("2024-01-10"),
      paymentReference: "TXN-2024-001",
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      clientId: client1.id,
      contractId: contract1.id,
      createdBy: users["ACCOUNTANT"],
      invoiceNumber: "INV-20240201-0002",
      amount: 8000,
      status: "SENT",
      paymentMethod: "BANK_TRANSFER",
      issueDate: new Date("2024-02-01"),
      dueDate: new Date("2024-02-15"),
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      clientId: client2.id,
      contractId: contract2.id,
      createdBy: users["ACCOUNTANT"],
      invoiceNumber: "INV-20240301-0003",
      amount: 5500,
      status: "DUE",
      paymentMethod: "MADA",
      issueDate: new Date("2024-03-01"),
      dueDate: new Date("2024-03-15"),
    },
  });

  // Payment ticket for the overdue invoice
  await prisma.paymentTicket.create({
    data: {
      invoiceId: invoice3.id,
      clientId: client2.id,
      assignedTo: users["ACCOUNTANT"],
      status: "PENDING",
      notes: "Client requested 1-week extension",
    },
  });

  // ── 13. Finance Expansion (Payments, Employees, Salaries) ───────────────
  const employee1 = await prisma.employee.create({
    data: {
      userId: users["EMPLOYEE"],
      name: "Hana Designer",
      role: "Designer",
      baseSalary: 7000,
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      userId: users["MARKETING"],
      name: "Ziad Marketing",
      role: "Marketing Specialist",
      baseSalary: 8500,
    },
  });

  // Payments for existing invoices
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 8000,
      method: "BANK_TRANSFER",
      status: "SUCCESS",
      date: new Date("2024-01-10"),
    },
  });

  // Salaries
  await prisma.salary.createMany({
    data: [
      {
        employeeId: employee1.id,
        amount: 7000,
        baseSalary: 7000,
        status: "PAID",
        month: 1,
        year: 2024,
        paymentDate: new Date("2024-01-28"),
      },
      {
        employeeId: employee2.id,
        amount: 8500,
        baseSalary: 8500,
        status: "PAID",
        month: 1,
        year: 2024,
        paymentDate: new Date("2024-01-28"),
      },
    ],
  });

  // Initial Ledger Entries
  await prisma.ledger.createMany({
    data: [
      {
        action: "CREATE_INVOICE",
        entity: "INVOICE",
        entityId: invoice1.id,
        userId: users["ACCOUNTANT"],
      },
      {
        action: "REGISTER_PAYMENT",
        entity: "PAYMENT",
        entityId: invoice1.id, // technically the payment ID but using invoice for demo
        userId: users["ACCOUNTANT"],
      },
    ],
  });

  // ── 14. Permissions (seed default permission list + role mappings) ───────────
  const permissions = [
    "chat.create",
    "chat.read",
    "chat.update",
    "chat.message",
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
    "contracts.read_public",
    "contracts.sign_public",
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
      "notifications.read",
      "notifications.update",
      "services.read",
    ],
    EMPLOYEE: [
      "tasks.read",
      "tasks.update",
      "tasks.comment",
      "projects.read",
      "notifications.read",
      "notifications.update",
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
    ],
    ACCOUNTANT: [
      "finance.create_invoice",
      "finance.read",
      "finance.update_invoice",
      "finance.manage_tickets",
      "finance.read_ledger",
      "finance.manage_payroll",
    ],
    CLIENT: [
      "proposals.read_public",
      "notifications.read",
      "leads.create",
      "contracts.read_public",
      "contracts.sign_public",
      "portal.read",
      "services.read",
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
    "✓ Database seeded with full demo data for all 7 roles and permissions (password: password123)",
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
