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
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
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
  const KNOWN_SERVICE_IDS = ["svc-branding", "svc-landing", "svc-ads", "svc-content"];

  // Clean up orphan service rows that may have been created by accidental create() calls
  await prisma.requestService.deleteMany({ where: { serviceId: { notIn: KNOWN_SERVICE_IDS } } });
  await prisma.leadService.deleteMany({ where: { serviceId: { notIn: KNOWN_SERVICE_IDS } } });
  await prisma.deliverableTemplate.deleteMany({ where: { serviceId: { notIn: KNOWN_SERVICE_IDS } } });
  await prisma.serviceCatalog.deleteMany({ where: { id: { notIn: KNOWN_SERVICE_IDS } } });

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
      { serviceId: services[0].id, title: "Brand Logo Design", titleAr: "تصميم شعار العلامة التجارية", description: "3 logo variants", descriptionAr: "3 خيارات للشعار", sortOrder: 1 },
      { serviceId: services[0].id, title: "Brand Guidelines", titleAr: "دليل الهوية البصرية", description: "Complete brand style guide", descriptionAr: "دليل شامل للهوية البصرية", sortOrder: 2 },
      { serviceId: services[0].id, title: "Business Card Design", titleAr: "تصميم بطاقة العمل", description: "Professional business card design", descriptionAr: "تصميم بطاقة عمل احترافية", sortOrder: 3 },
      { serviceId: services[1].id, title: "Landing Page Design", titleAr: "تصميم صفحة الهبوط", description: "UI/UX design for landing page", descriptionAr: "تصميم واجهة صفحة الهبوط", sortOrder: 1 },
      { serviceId: services[1].id, title: "Landing Page Development", titleAr: "تطوير صفحة الهبوط", description: "Front-end development", descriptionAr: "تطوير واجهة صفحة الهبوط", sortOrder: 2 },
      { serviceId: services[2].id, title: "Campaign Strategy", titleAr: "استراتيجية الحملة الإعلانية", description: "Ad campaign strategy document", descriptionAr: "وثيقة استراتيجية الحملة الإعلانية", sortOrder: 1 },
      { serviceId: services[2].id, title: "Ad Creative Design", titleAr: "تصميم الإعلانات", description: "Creative assets for the ad campaign", descriptionAr: "تصميم الأصول الإبداعية للحملة", sortOrder: 2 },
      { serviceId: services[2].id, title: "Campaign Launch & Management", titleAr: "إطلاق وإدارة الحملة", description: "Launching and managing the ad campaign", descriptionAr: "إطلاق وإدارة الحملة الإعلانية", sortOrder: 3 },
      { serviceId: services[3].id, title: "Content Calendar", titleAr: "تقويم المحتوى", description: "Monthly content calendar", descriptionAr: "تقويم المحتوى الشهري", sortOrder: 1 },
      { serviceId: services[3].id, title: "Social Media Posts", titleAr: "منشورات وسائل التواصل", description: "Design and copy for social media posts", descriptionAr: "تصميم ونصوص المنشورات", sortOrder: 2 },
    ],
  });

  // Roles
  const roleNames = ["ADMIN", "PM", "SALES", "EMPLOYEE", "MARKETING", "ACCOUNTANT", "CLIENT"];
  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Departments
  const deptNames = ["MANAGEMENT", "DESIGN", "CONTENT", "DEVELOPMENT", "MARKETING", "PRODUCTION"];
  for (const name of deptNames) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Users
  const userDefs = [
    { email: "admin@hassad.com", name: "Super Admin", role: "ADMIN" },
    { email: "pm@hassad.com", name: "Layla PM", role: "PM", dept: "MANAGEMENT" },
    { email: "sales@hassad.com", name: "Omar Sales", role: "SALES" },
    { email: "employee@hassad.com", name: "Hana Designer", role: "EMPLOYEE", dept: "DESIGN" },
    { email: "marketing@hassad.com", name: "Ziad Marketing", role: "MARKETING", dept: "MARKETING" },
    { email: "accountant@hassad.com", name: "Sara Accountant", role: "ACCOUNTANT" },
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
      },
    });
    userIds[u.role] = created.id;
    if (u.email === "client@hassad.com") userIds["CLIENT1"] = created.id;
    if (u.email === "client2@hassad.com") userIds["CLIENT2"] = created.id;

    if (u.dept) {
      const dept = await prisma.department.findUnique({ where: { name: u.dept } });
      if (dept) {
        await prisma.userDepartment.upsert({
          where: { userId_departmentId: { userId: created.id, departmentId: dept.id } },
          update: {},
          create: { userId: created.id, departmentId: dept.id },
        });
      }
    }
  }

  // Department lookups
  const designDept = await prisma.department.findUnique({ where: { name: "DESIGN" } });
  const contentDept = await prisma.department.findUnique({ where: { name: "CONTENT" } });
  const marketingDept = await prisma.department.findUnique({ where: { name: "MARKETING" } });

  // ── Employees ─────────────────────────────────────────────────────────────────
  const employee1 = await prisma.employee.upsert({
    where: { userId: userIds["EMPLOYEE"] },
    update: {},
    create: { userId: userIds["EMPLOYEE"], name: "Hana Designer", role: "Designer", baseSalary: 7000 },
  });
  const employee2 = await prisma.employee.upsert({
    where: { userId: userIds["MARKETING"] },
    update: {},
    create: { userId: userIds["MARKETING"], name: "Ziad Marketing", role: "Marketing Specialist", baseSalary: 8500 },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIENT A: TechVentures — FULL coverage of every enum value
  // ═══════════════════════════════════════════════════════════════════════════════

  // ── 9 Leads — one at every pipeline stage ────────────────────────────────────
  const leads = await Promise.all([
    prisma.lead.create({
      data: { companyName: "مرحلة جديد", contactName: "محمد علي", phoneWhatsapp: "+966500000001", email: "lead-new@example.com", businessName: "شركة البداية", businessType: "OTHER", source: "WEBSITE", assignedTo: userIds["SALES"], pipelineStage: "NEW" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة التواصل", contactName: "فهد الشمري", phoneWhatsapp: "+966500000002", email: "lead-intro@example.com", businessName: "مؤسسة التواصل", businessType: "STORE", source: "WHATSAPP", assignedTo: userIds["SALES"], pipelineStage: "INTRO_SENT" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة محاولة الاتصال", contactName: "سلمان العتيبي", phoneWhatsapp: "+966500000003", email: "lead-call@example.com", businessName: "شركة الاتصال", businessType: "SERVICE", source: "AD", assignedTo: userIds["SALES"], pipelineStage: "CALL_ATTEMPT" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة جدولة اجتماع", contactName: "نورة القحطاني", phoneWhatsapp: "+966500000004", email: "lead-meeting-sched@example.com", businessName: "مؤسسة الاجتماع", businessType: "CLINIC", source: "REFERRAL", assignedTo: userIds["SALES"], pipelineStage: "MEETING_SCHEDULED" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة تم الاجتماع", contactName: "عبدالله الحربي", phoneWhatsapp: "+966500000005", email: "lead-meeting-done@example.com", businessName: "شركة التمام", businessType: "RESTAURANT", source: "PLATFORM", assignedTo: userIds["SALES"], pipelineStage: "MEETING_DONE" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة إرسال عرض", contactName: "سارة المطيري", phoneWhatsapp: "+966500000006", email: "lead-proposal@example.com", businessName: "مؤسسة العروض", businessType: "OTHER", source: "WEBSITE", assignedTo: userIds["SALES"], pipelineStage: "PROPOSAL_SENT" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة متابعة", contactName: "خالد الدوسري", phoneWhatsapp: "+966500000007", email: "lead-followup@example.com", businessName: "شركة المتابعة", businessType: "STORE", source: "REFERRAL", assignedTo: userIds["SALES"], pipelineStage: "FOLLOW_UP" },
    }),
    prisma.lead.create({
      data: { companyName: "مرحلة معتمد", contactName: "منى الشهري", phoneWhatsapp: "+966500000008", email: "lead-approved@example.com", businessName: "مؤسسة الاعتماد", businessType: "SERVICE", source: "AD", assignedTo: userIds["SALES"], pipelineStage: "APPROVED" },
    }),
    prisma.lead.create({
      data: { companyName: "TechVentures", contactName: "Tech Ventures CEO", phoneWhatsapp: "+966509990011", email: "client@hassad.com", businessName: "TechVentures Co.", businessType: "OTHER", source: "WEBSITE", assignedTo: userIds["SALES"], pipelineStage: "CONTRACT_SIGNED" },
    }),
  ]);

  const [leadNew, leadIntroSent, leadCallAttempt, leadMeetingScheduled, leadMeetingDone, leadProposalSent, leadFollowUp, leadApproved, leadTechVentures] = leads;

  // Lead pipeline history for some leads
  await prisma.leadPipelineHistory.createMany({
    data: [
      { leadId: leadIntroSent.id, fromStage: "NEW", toStage: "INTRO_SENT", changedBy: userIds["SALES"] },
      { leadId: leadMeetingDone.id, fromStage: "MEETING_SCHEDULED", toStage: "MEETING_DONE", changedBy: userIds["SALES"] },
      { leadId: leadProposalSent.id, fromStage: "MEETING_DONE", toStage: "PROPOSAL_SENT", changedBy: userIds["SALES"] },
      { leadId: leadTechVentures.id, fromStage: "APPROVED", toStage: "CONTRACT_SIGNED", changedBy: userIds["SALES"] },
    ],
  });

  // Lead services for some leads
  await prisma.leadService.createMany({
    data: [
      { leadId: leadApproved.id, serviceId: services[0].id, quantity: 1 },
      { leadId: leadApproved.id, serviceId: services[1].id, quantity: 1 },
      { leadId: leadTechVentures.id, serviceId: services[0].id, quantity: 1 },
      { leadId: leadTechVentures.id, serviceId: services[1].id, quantity: 1 },
      { leadId: leadTechVentures.id, serviceId: services[2].id, quantity: 1 },
      { leadId: leadTechVentures.id, serviceId: services[3].id, quantity: 2 },
    ],
  });

  // Client A
  const clientA = await prisma.client.create({
    data: {
      leadId: leadTechVentures.id,
      userId: userIds["CLIENT1"],
      companyName: "TechVentures",
      contactName: "Tech Ventures CEO",
      phoneWhatsapp: "+966509990011",
      email: "client@hassad.com",
      businessName: "TechVentures Co.",
      businessType: "OTHER",
      accountManager: userIds["SALES"],
      status: "ACTIVE",
    },
  });

  // ── Proposals — all 5 statuses ──────────────────────────────────────────────
  const proposals = await Promise.all([
    prisma.proposal.create({
      data: { leadId: leadApproved.id, clientId: clientA.id, createdBy: userIds["SALES"], title: "Branding Package (DRAFT)", serviceDescription: "Brand identity proposal draft", servicesList: [{ name: "Brand Identity", sessions: 5 }], totalPrice: 5000, durationDays: 14, platforms: [], status: "DRAFT" },
    }),
    prisma.proposal.create({
      data: { leadId: leadProposalSent.id, clientId: clientA.id, createdBy: userIds["SALES"], title: "Social Media Package (SENT)", serviceDescription: "Monthly social media management", servicesList: [{ name: "Content Creation", sessions: 12 }], totalPrice: 5500, durationDays: 30, platforms: ["Instagram", "TikTok"], status: "SENT", shareLinkToken: "share-token-proposal-sent", sentAt: new Date() },
    }),
    prisma.proposal.create({
      data: { leadId: leadTechVentures.id, clientId: clientA.id, createdBy: userIds["SALES"], title: "Digital Marketing (APPROVED)", serviceDescription: "Approved marketing campaign", servicesList: [{ name: "Ad Campaign Management", sessions: 3 }], totalPrice: 24000, durationDays: 90, platforms: ["Meta", "Google"], status: "APPROVED" },
    }),
    prisma.proposal.create({
      data: { leadId: leadMeetingDone.id, clientId: clientA.id, createdBy: userIds["SALES"], title: "Content Strategy (REVISION_REQUESTED)", serviceDescription: "Content strategy proposal - awaiting revision", servicesList: [{ name: "Content Creation", sessions: 6 }], totalPrice: 8000, durationDays: 60, platforms: ["Snapchat"], status: "REVISION_REQUESTED" },
    }),
    prisma.proposal.create({
      data: { leadId: leadFollowUp.id, clientId: clientA.id, createdBy: userIds["SALES"], title: "Ad Campaign (REJECTED)", serviceDescription: "Rejected ad campaign proposal", servicesList: [{ name: "Ad Campaign Management", sessions: 1 }], totalPrice: 8000, durationDays: 30, platforms: ["TikTok"], status: "REJECTED" },
    }),
  ]);

  // ── Contracts — all 6 statuses ──────────────────────────────────────────────
  const contracts = await Promise.all([
    prisma.contract.create({
      data: { clientId: clientA.id, createdBy: userIds["PM"], title: "Mobile App Contract (DRAFT)", type: "FIXED_PROJECT", status: "DRAFT", startDate: new Date("2026-08-01"), endDate: new Date("2027-01-31"), monthlyValue: 0, totalValue: 120000 },
    }),
    prisma.contract.create({
      data: { clientId: clientA.id, createdBy: userIds["PM"], title: "E-Commerce Revamp (SENT)", type: "FIXED_PROJECT", status: "SENT", startDate: new Date("2026-07-01"), endDate: new Date("2026-12-31"), monthlyValue: 0, totalValue: 75000, shareLinkToken: "contract-share-token" },
    }),
    prisma.contract.create({
      data: { clientId: clientA.id, createdBy: userIds["PM"], title: "Social Media Management (SIGNED)", type: "MONTHLY_RETAINER", status: "SIGNED", startDate: new Date("2026-03-01"), endDate: new Date("2027-02-28"), monthlyValue: 5500, totalValue: 66000, eSigned: true, signedAt: new Date("2026-03-01") },
    }),
    prisma.contract.create({
      data: { clientId: clientA.id, createdBy: userIds["PM"], title: "Brand Overhaul (ACTIVE)", type: "FIXED_PROJECT", status: "ACTIVE", startDate: new Date("2026-01-15"), endDate: new Date("2026-07-15"), monthlyValue: 0, totalValue: 96000, eSigned: true, signedAt: new Date("2026-01-10") },
    }),
    prisma.contract.create({
      data: { clientId: clientA.id, createdBy: userIds["PM"], title: "Google Ads Q4 2025 (EXPIRED)", type: "FIXED_PROJECT", status: "EXPIRED", startDate: new Date("2025-10-01"), endDate: new Date("2025-12-31"), monthlyValue: 0, totalValue: 30000, eSigned: true, signedAt: new Date("2025-10-01") },
    }),
    prisma.contract.create({
      data: { clientId: clientA.id, createdBy: userIds["PM"], title: "TikTok Campaign (CANCELLED)", type: "FIXED_PROJECT", status: "CANCELLED", startDate: new Date("2026-02-01"), endDate: new Date("2026-04-30"), monthlyValue: 0, totalValue: 15000, eSigned: true, signedAt: new Date("2026-01-25") },
    }),
  ]);

  const [ctrDraft, ctrSent, ctrSigned, ctrActive, ctrExpired, ctrCancelled] = contracts;

  // ── Projects — all 7 statuses ───────────────────────────────────────────────
  const projects = await Promise.all([
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrDraft.id, projectManagerId: userIds["PM"], name: "تطبيق الجوال (تخطيط)", description: "في مرحلة التخطيط — لم يبدأ التنفيذ بعد", status: "PLANNING", priority: "NORMAL", startDate: new Date("2026-08-01"), endDate: new Date("2027-01-31") },
    }),
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrActive.id, projectManagerId: userIds["PM"], name: "تطوير الهوية البصرية (نشط)", description: "قيد التنفيذ — العمل جارٍ على المهام", status: "ACTIVE", priority: "HIGH", startDate: new Date("2026-01-15"), endDate: new Date("2026-07-15"), completionPercentage: 65 },
    }),
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrActive.id, projectManagerId: userIds["PM"], name: "مشروع التطوير (معلق)", description: "متوقف مؤقتاً بانتظار موافقة العميل على التعديلات",       status: "ON_HOLD", priority: "NORMAL", startDate: new Date("2026-03-01"), endDate: new Date("2026-09-01"), completionPercentage: 40 },
    }),
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrSigned.id, projectManagerId: userIds["PM"], name: "إدارة السوشال ميديا (بانتظار المراجعة)", description: "جاهز للمراجعة — جميع المهام مكتملة 100%", status: "AWAITING_REVIEW", priority: "HIGH", startDate: new Date("2026-03-01"), endDate: new Date("2026-06-01"), completionPercentage: 100 },
    }),
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrSigned.id, projectManagerId: userIds["PM"], name: "حملة إعلانية (مطلوب تعديلات)", description: "طلب العميل تعديلات — يحتاج إعادة عمل", status: "NEEDS_REVISION", priority: "HIGH", startDate: new Date("2026-04-01"), endDate: new Date("2026-07-01"), completionPercentage: 100 },
    }),
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrExpired.id, projectManagerId: userIds["PM"], name: "حملة Google Ads (مكتمل)", description: "تم الانتهاء بنجاح واعتماد العميل", status: "COMPLETED", priority: "HIGH", startDate: new Date("2025-10-01"), endDate: new Date("2025-12-31"), completionPercentage: 100 },
    }),
    prisma.project.create({
      data: { clientId: clientA.id, contractId: ctrCancelled.id, projectManagerId: userIds["PM"], name: "حملة تيكتوك (ملغى)", description: "تم الإلغاء من قبل العميل", status: "CANCELLED", priority: "LOW", startDate: new Date("2026-02-01"), endDate: new Date("2026-04-30"), completionPercentage: 15 },
    }),
  ]);

  const [projPlanning, projActive, projOnHold, projAwaitingReview, projNeedsRevision, projCompleted, projCancelled] = projects;

  // Project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: projActive.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projActive.id, userId: userIds["MARKETING"], role: "MEMBER" },
      { projectId: projOnHold.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projAwaitingReview.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projAwaitingReview.id, userId: userIds["MARKETING"], role: "MEMBER" },
      { projectId: projNeedsRevision.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projNeedsRevision.id, userId: userIds["MARKETING"], role: "MEMBER" },
      { projectId: projCompleted.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projPlanning.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
    ],
    skipDuplicates: true,
  });

  // ── Project Revision Requests for review workflow testing ───────────────────
  await prisma.projectRevisionRequest.createMany({
    data: [
      { projectId: projNeedsRevision.id, clientId: clientA.id, comment: "أرجو تعديل الألوان لتتناسب مع الهوية الجديدة للعلامة التجارية وإضافة قسم الشهادات", createdAt: new Date("2026-05-10") },
      { projectId: projNeedsRevision.id, clientId: clientA.id, comment: "الخطوط المستخدمة لا تتوافق مع الدليل الإرشادي — يرجى استخدام خط العلامة المعتمد", createdAt: new Date("2026-05-08") },
    ],
  });

  // ── Tasks — all 5 statuses distributed across projects ──────────────────────
  const tasks = await Promise.all([
    // Active project tasks
    prisma.task.create({
      data: { projectId: projActive.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم الشعار الأساسي", description: "إنشاء 3 نسخ أولية للشعار", status: "IN_REVIEW", priority: "HIGH", dueDate: new Date("2026-06-15") },
    }),
    prisma.task.create({
      data: { projectId: projActive.id, departmentId: contentDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "كتابة إرشادات الهوية", description: "توثيق النبرة والصوت والرسائل", status: "IN_PROGRESS", priority: "NORMAL", dueDate: new Date("2026-06-20") },
    }),
    prisma.task.create({
      data: { projectId: projActive.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم بطاقات العمل", description: "تصميم بطاقة عمل احترافية", status: "TODO", priority: "NORMAL", dueDate: new Date("2026-07-01") },
    }),
    prisma.task.create({
      data: { projectId: projActive.id, departmentId: marketingDept!.id, assignedTo: userIds["MARKETING"], createdBy: userIds["PM"], title: "إعداد خطة التسويق", description: "خطة تسويقية للإطلاق", status: "DONE", priority: "HIGH", dueDate: new Date("2026-05-15"), approvedBy: userIds["PM"], approvedAt: new Date("2026-05-10") },
    }),
    // On Hold project tasks
    prisma.task.create({
      data: { projectId: projOnHold.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم واجهات المستخدم", description: "تصميم UI للتطبيق", status: "IN_PROGRESS", priority: "NORMAL", dueDate: new Date("2026-08-01") },
    }),
    prisma.task.create({
      data: { projectId: projOnHold.id, departmentId: contentDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "كتابة محتوى التطبيق", description: "كتابة نصوص واجهات التطبيق", status: "TODO", priority: "LOW", dueDate: new Date("2026-08-15") },
    }),
    // Awaiting Review project tasks (all done → 100%)
    prisma.task.create({
      data: { projectId: projAwaitingReview.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم منشورات الشهر", description: "تصميم 30 منشور للسوشال ميديا", status: "DONE", priority: "HIGH", dueDate: new Date("2026-05-01"), approvedBy: userIds["PM"], approvedAt: new Date("2026-04-28") },
    }),
    prisma.task.create({
      data: { projectId: projAwaitingReview.id, departmentId: contentDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "جدولة المحتوى الشهري", description: "جدولة المنشورات على جميع المنصات", status: "DONE", priority: "HIGH", dueDate: new Date("2026-05-01"), approvedBy: userIds["PM"], approvedAt: new Date("2026-04-30") },
    }),
    // Needs Revision project tasks
    prisma.task.create({
      data: { projectId: projNeedsRevision.id, departmentId: marketingDept!.id, assignedTo: userIds["MARKETING"], createdBy: userIds["PM"], title: "تعديل تصاميم الإعلانات", description: "إعادة تصميم الإعلانات حسب طلب العميل", status: "REVISION", priority: "HIGH", dueDate: new Date("2026-05-25") },
    }),
    prisma.task.create({
      data: { projectId: projNeedsRevision.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تحديث الألوان والخطوط", description: "تطبيق الهوية الجديدة على جميع التصاميم", status: "IN_PROGRESS", priority: "HIGH", dueDate: new Date("2026-05-20") },
    }),
    // Completed project tasks
    prisma.task.create({
      data: { projectId: projCompleted.id, departmentId: marketingDept!.id, assignedTo: userIds["MARKETING"], createdBy: userIds["PM"], title: "إعداد حملة البحث", description: "إعداد كلمات مفتاحية وإعلانات البحث", status: "DONE", priority: "HIGH", dueDate: new Date("2025-11-30"), approvedBy: userIds["PM"], approvedAt: new Date("2025-11-28") },
    }),
    prisma.task.create({
      data: { projectId: projCompleted.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم لافتات العرض", description: "تصميم إعلانات شبكة البحث", status: "DONE", priority: "NORMAL", dueDate: new Date("2025-11-15"), approvedBy: userIds["PM"], approvedAt: new Date("2025-11-12") },
    }),
    // Cancelled project tasks
    prisma.task.create({
      data: { projectId: projCancelled.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم فيديو تيكتوك", description: "تصميم فيديو قصير — تم الإلغاء", status: "TODO", priority: "LOW", dueDate: new Date("2026-03-15") },
    }),
  ]);

  // Task status history for some tasks
  await prisma.taskStatusHistory.createMany({
    data: [
      { taskId: tasks[3].id, fromStatus: "IN_PROGRESS", toStatus: "DONE", changedBy: userIds["EMPLOYEE"] },
      { taskId: tasks[6].id, fromStatus: "IN_PROGRESS", toStatus: "DONE", changedBy: userIds["EMPLOYEE"] },
      { taskId: tasks[7].id, fromStatus: "IN_PROGRESS", toStatus: "DONE", changedBy: userIds["EMPLOYEE"] },
      { taskId: tasks[8].id, fromStatus: "IN_REVIEW", toStatus: "REVISION", changedBy: userIds["PM"] },
    ],
  });

  // ── Deliverables for portal testing ─────────────────────────────────────────
  await prisma.deliverable.createMany({
    data: [
      // Active project
      { projectId: projActive.id, title: "نماذج الشعار", description: "3 نماذج أولية للشعار", filePath: "", status: "DONE", isVisibleToClient: true, approvedBy: userIds["PM"], approvedAt: new Date("2026-05-01") },
      { projectId: projActive.id, title: "دليل الهوية المؤقت", description: "نسخة أولية من الدليل", filePath: "", status: "IN_PROGRESS", isVisibleToClient: true },
      { projectId: projActive.id, title: "عرض الإعلانات", description: "تصاميم إعلانات للسوشال ميديا", filePath: "/uploads/ad-preview.pdf", status: "IN_REVIEW", isVisibleToClient: true },
      // Awaiting Review project
      { projectId: projAwaitingReview.id, title: "تقرير الأداء الشهري", description: "تقرير مفصل عن أداء المنصات", filePath: "/uploads/monthly-report.pdf", status: "IN_REVIEW", isVisibleToClient: true },
      { projectId: projAwaitingReview.id, title: "نماذج المنشورات", description: "جميع منشورات الشهر", filePath: "/uploads/posts-batch.zip", status: "IN_REVIEW", isVisibleToClient: true },
      // Completed project
      { projectId: projCompleted.id, title: "تقرير الحملة النهائي", description: "تقرير شامل لنتائج الحملة", filePath: "", status: "DONE", isVisibleToClient: true, approvedBy: userIds["PM"], approvedAt: new Date("2025-12-20") },
      { projectId: projCompleted.id, title: "إحصائيات الأداء", description: "تحليلات مفصلة للأداء", filePath: "", status: "DONE", isVisibleToClient: true, approvedBy: userIds["PM"], approvedAt: new Date("2025-12-25") },
    ],
  });

  // ── Project Files for client review modal ────────────────────────────────────
  await prisma.projectFile.createMany({
    data: [
      { projectId: projAwaitingReview.id, uploadedBy: userIds["PM"], fileName: "تقرير-المشروع-النهائي.pdf", filePath: "/uploads/projects/report.pdf", fileType: "application/pdf", fileSize: 2048000 },
      { projectId: projAwaitingReview.id, uploadedBy: userIds["PM"], fileName: "جميع-التصاميم.zip", filePath: "/uploads/projects/designs.zip", fileType: "application/zip", fileSize: 5120000 },
      { projectId: projActive.id, uploadedBy: userIds["PM"], fileName: "مسودة-الهوية.pdf", filePath: "/uploads/projects/brand-draft.pdf", fileType: "application/pdf", fileSize: 1024000 },
    ],
  });

  // ── Invoices — all 7 statuses ────────────────────────────────────────────────
  const invoices = await Promise.all([
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrActive.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260501-001", amount: 16000, status: "DUE", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2026-05-01"), dueDate: new Date("2026-05-15") } }),
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrActive.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260401-002", amount: 16000, status: "SENT", paymentMethod: "MADA", issueDate: new Date("2026-04-01"), dueDate: new Date("2026-04-15") } }),
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrActive.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260301-003", amount: 16000, status: "PAID", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2026-03-01"), dueDate: new Date("2026-03-15"), paidAt: new Date("2026-03-10"), paymentReference: "TXN-20260310-001" } }),
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrSigned.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260501-004", amount: 5500, status: "PARTIAL", paymentMethod: "MADA", issueDate: new Date("2026-05-01"), dueDate: new Date("2026-05-15") } }),
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrSigned.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260401-005", amount: 5500, status: "PENDING", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2026-04-01"), dueDate: new Date("2026-04-15") } }),
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrExpired.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20251201-006", amount: 10000, status: "LATE", paymentMethod: "MADA", issueDate: new Date("2025-12-01"), dueDate: new Date("2025-12-15") } }),
    prisma.invoice.create({ data: { clientId: clientA.id, contractId: ctrCancelled.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260201-007", amount: 5000, status: "CANCELLED", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2026-02-01"), dueDate: new Date("2026-02-15") } }),
  ]);

  // Invoice items for some invoices
  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoices[0].id, description: "خدمات التصميم - مايو 2026", quantity: 1, unitPrice: 16000, total: 16000 },
      { invoiceId: invoices[3].id, description: "إدارة السوشال ميديا - مايو", quantity: 1, unitPrice: 5500, total: 5500 },
      { invoiceId: invoices[5].id, description: "إعلانات Google - ديسمبر 2025", quantity: 1, unitPrice: 10000, total: 10000 },
    ],
  });

  // Payments
  await prisma.payment.createMany({
    data: [
      { invoiceId: invoices[2].id, clientId: clientA.id, amount: 16000, method: "BANK_TRANSFER", status: "SUCCESS", date: new Date("2026-03-10") },
      { invoiceId: invoices[3].id, clientId: clientA.id, amount: 2750, method: "MADA", status: "SUCCESS", date: new Date("2026-05-05") },
    ],
  });

  // Payment ticket for the LATE invoice
  await prisma.paymentTicket.create({
    data: { invoiceId: invoices[5].id, clientId: clientA.id, assignedTo: userIds["ACCOUNTANT"], status: "PENDING", notes: "لم يتم الدفع — تجاوز تاريخ الاستحقاق بـ 5 أشهر" },
  });

  // ── Campaigns — all 5 statuses (using createMany + existing task IDs) ─────────
  const campaigns = [
    { clientId: clientA.id, taskId: tasks[2].id, projectId: projPlanning.id, managedBy: userIds["MARKETING"], name: "حملة الصيف (تخطيط)", platform: "META" as const, status: "PLANNING" as const, startDate: new Date("2026-08-01"), endDate: new Date("2026-09-30"), budgetTotal: 20000, budgetSpent: 0 },
    { clientId: clientA.id, taskId: tasks[3].id, projectId: projActive.id, managedBy: userIds["MARKETING"], name: "حملة العيد (نشطة)", platform: "META" as const, status: "ACTIVE" as const, startDate: new Date("2026-04-15"), endDate: new Date("2026-06-15"), budgetTotal: 15000, budgetSpent: 7500 },
    { clientId: clientA.id, taskId: tasks[4].id, projectId: projOnHold.id, managedBy: userIds["MARKETING"], name: "حملة المنتج الجديد (متوقفة)", platform: "GOOGLE" as const, status: "PAUSED" as const, startDate: new Date("2026-04-01"), endDate: new Date("2026-07-01"), budgetTotal: 25000, budgetSpent: 5000 },
    { clientId: clientA.id, taskId: tasks[12].id, projectId: projCancelled.id, managedBy: userIds["MARKETING"], name: "حملة تيكتوك (متوقفة)", platform: "TIKTOK" as const, status: "STOPPED" as const, startDate: new Date("2026-02-01"), endDate: new Date("2026-04-30"), budgetTotal: 10000, budgetSpent: 4500 },
    { clientId: clientA.id, taskId: tasks[10].id, projectId: projCompleted.id, managedBy: userIds["MARKETING"], name: "حملة Google Q4 (مكتملة)", platform: "GOOGLE" as const, status: "COMPLETED" as const, startDate: new Date("2025-10-01"), endDate: new Date("2025-12-31"), budgetTotal: 30000, budgetSpent: 29500 },
  ];
  await prisma.campaign.createMany({ data: campaigns });
  const campaignRecords = await prisma.campaign.findMany({ where: { clientId: clientA.id }, orderBy: { createdAt: "asc" } });

  // KPI Snapshots
  await prisma.campaignKpiSnapshot.createMany({
    data: [
      { campaignId: campaignRecords[1].id, impressions: 45000, clicks: 2800, conversions: 320, revenue: 22400, cpc: 0.51, cpa: 44.38, ctr: 6.22, conversionRate: 11.43, roas: 1.58, source: "meta_api", recordedAt: new Date("2026-05-05"), createdAt: new Date("2026-05-05") },
      { campaignId: campaignRecords[1].id, impressions: 22000, clicks: 1200, conversions: 140, revenue: 9800, cpc: 0.55, cpa: 45.71, ctr: 5.45, conversionRate: 11.67, roas: 1.45, source: "meta_api", recordedAt: new Date("2026-04-25"), createdAt: new Date("2026-04-25") },
      { campaignId: campaignRecords[2].id, impressions: 12000, clicks: 800, conversions: 60, revenue: 7200, cpc: 0.70, cpa: 83.33, ctr: 6.67, conversionRate: 7.5, roas: 1.44, source: "google_api", recordedAt: new Date("2026-04-15"), createdAt: new Date("2026-04-15") },
      { campaignId: campaignRecords[4].id, impressions: 67000, clicks: 4200, conversions: 450, revenue: 49500, cpc: 0.60, cpa: 55.56, ctr: 6.27, conversionRate: 10.71, roas: 1.68, source: "google_api", recordedAt: new Date("2025-12-31"), createdAt: new Date("2025-12-31") },
      { campaignId: campaignRecords[4].id, impressions: 30000, clicks: 1800, conversions: 180, revenue: 19800, cpc: 0.65, cpa: 60.0, ctr: 6.0, conversionRate: 10.0, roas: 1.56, source: "google_api", recordedAt: new Date("2025-11-15"), createdAt: new Date("2025-11-15") },
    ],
  });

  // ── Client History Logs (activity feed) ─────────────────────────────────────
  await prisma.clientHistoryLog.createMany({
    data: [
      { clientId: clientA.id, userId: userIds["PM"], eventType: "DELIVERABLE_APPROVED", description: "تم اعتماد نماذج الشعار من قبل العميل", occurredAt: new Date("2026-05-01") },
      { clientId: clientA.id, userId: userIds["MARKETING"], eventType: "CAMPAIGN_LAUNCHED", description: "تم إطلاق حملة العيد", occurredAt: new Date("2026-04-15") },
      { clientId: clientA.id, userId: userIds["MARKETING"], eventType: "CAMPAIGN_LAUNCHED", description: "تم إطلاق حملة Google Q4", occurredAt: new Date("2025-10-01") },
      { clientId: clientA.id, userId: userIds["ACCOUNTANT"], eventType: "INVOICE_PAID", description: "تم دفع فاتورة INV-20260301-003", occurredAt: new Date("2026-03-10") },
      { clientId: clientA.id, userId: userIds["PM"], eventType: "PROJECT_COMPLETED", description: "تم اكتمال مشروع حملة Google Ads", occurredAt: new Date("2025-12-31") },
    ],
  });

  // Snoozed item for demo
  await prisma.clientSnoozedItem.upsert({
    where: { clientId_itemType_itemId: { clientId: clientA.id, itemType: "INVOICE_PAYMENT", itemId: invoices[0].id } },
    update: {},
    create: { clientId: clientA.id, itemType: "INVOICE_PAYMENT", itemId: invoices[0].id, snoozedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000) },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIENT B: Nova Eats — Active client with mixed data
  // ═══════════════════════════════════════════════════════════════════════════════

  const leadNova = await prisma.lead.create({
    data: { companyName: "Nova Eats", contactName: "Ahmad Saleh", phoneWhatsapp: "+966501112233", email: "ahmad@novaeats.sa", businessName: "Nova Eats Restaurant", businessType: "RESTAURANT", source: "REFERRAL", assignedTo: userIds["SALES"], pipelineStage: "CONTRACT_SIGNED" },
  });

  await prisma.leadPipelineHistory.create({
    data: { leadId: leadNova.id, fromStage: "PROPOSAL_SENT", toStage: "CONTRACT_SIGNED", changedBy: userIds["SALES"] },
  });

  const clientB = await prisma.client.create({
    data: {
      leadId: leadNova.id, userId: userIds["CLIENT2"], companyName: "Nova Eats", contactName: "Ahmad Saleh",
      phoneWhatsapp: "+966501112233", email: "ahmad@novaeats.sa", businessName: "Nova Eats Restaurant",
      businessType: "RESTAURANT", accountManager: userIds["SALES"], status: "ACTIVE",
    },
  });

  // Proposal for Nova Eats
  await prisma.proposal.create({
    data: { leadId: leadNova.id, clientId: clientB.id, createdBy: userIds["SALES"], title: "Social Media Management", serviceDescription: "Full SMM for Nova Eats", servicesList: [{ name: "Content Creation", sessions: 12 }, { name: "Story Design", sessions: 30 }], totalPrice: 5500, durationDays: 30, platforms: ["Instagram", "TikTok", "Snapchat"], status: "APPROVED" },
  });

  // Contract
  const ctrNova = await prisma.contract.create({
    data: { clientId: clientB.id, createdBy: userIds["PM"], title: "Nova Eats Social Media", type: "MONTHLY_RETAINER", status: "ACTIVE", startDate: new Date("2026-03-01"), endDate: new Date("2027-02-28"), monthlyValue: 5500, totalValue: 66000, eSigned: true, signedAt: new Date("2026-03-01") },
  });

  // Project
  const projNova = await prisma.project.create({
    data: { clientId: clientB.id, contractId: ctrNova.id, projectManagerId: userIds["PM"], name: "إدارة محتوى Nova Eats", description: "إنشاء وجدولة محتوى شهري", status: "ACTIVE", priority: "NORMAL", startDate: new Date("2026-03-01"), endDate: new Date("2027-02-28"), completionPercentage: 50 },
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
    prisma.task.create({ data: { projectId: projNova.id, departmentId: contentDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "إنشاء تقويم المحتوى - يونيو", description: "تخطيط 30 منشور", status: "IN_PROGRESS", priority: "NORMAL", dueDate: new Date("2026-05-25") } }),
    prisma.task.create({ data: { projectId: projNova.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تصميم منشورات العروض", description: "تصميم 10 منشورات ترويجية", status: "TODO", priority: "NORMAL", dueDate: new Date("2026-05-30") } }),
    prisma.task.create({ data: { projectId: projNova.id, departmentId: marketingDept!.id, assignedTo: userIds["MARKETING"], createdBy: userIds["PM"], title: "إطلاق حملة رمضان", description: "حملة إعلانية على ميتا", status: "DONE", priority: "URGENT", dueDate: new Date("2026-04-01"), approvedBy: userIds["PM"], approvedAt: new Date("2026-03-28") } }),
  ]);

  // Deliverables
  await prisma.deliverable.createMany({
    data: [
      { projectId: projNova.id, title: "تقويم المحتوى - مايو", description: "خطة المحتوى لشهر مايو", filePath: "", status: "DONE", isVisibleToClient: true, approvedBy: userIds["PM"], approvedAt: new Date("2026-04-25") },
      { projectId: projNova.id, title: "منشورات الأسبوع الأول", description: "تصاميم منشورات الأسبوع", filePath: "/uploads/nova-week1.zip", status: "IN_REVIEW", isVisibleToClient: true },
      { projectId: projNova.id, title: "تقرير الأداء", description: "تقرير شهري بالأداء", filePath: "", status: "TODO", isVisibleToClient: true },
    ],
  });

  // Invoices
  const invNova1 = await prisma.invoice.create({
    data: { clientId: clientB.id, contractId: ctrNova.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260501-N01", amount: 5500, status: "DUE", paymentMethod: "MADA", issueDate: new Date("2026-05-01"), dueDate: new Date("2026-05-15") },
  });
  const invNova2 = await prisma.invoice.create({
    data: { clientId: clientB.id, contractId: ctrNova.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20260401-N02", amount: 5500, status: "PARTIAL", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2026-04-01"), dueDate: new Date("2026-04-15") },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invNova1.id, description: "إدارة سوشال ميديا - مايو", quantity: 1, unitPrice: 5500, total: 5500 },
      { invoiceId: invNova2.id, description: "إدارة سوشال ميديا - أبريل", quantity: 1, unitPrice: 5500, total: 5500 },
    ],
  });

  await prisma.payment.create({
    data: { invoiceId: invNova2.id, clientId: clientB.id, amount: 2750, method: "BANK_TRANSFER", status: "SUCCESS", date: new Date("2026-04-10") },
  });

  // Campaign
  await prisma.campaign.create({
    data: { clientId: clientB.id, taskId: novaTasks[0].id, projectId: projNova.id, managedBy: userIds["MARKETING"], name: "عروض Nova الصيفية", platform: "META", status: "ACTIVE", startDate: new Date("2026-05-01"), endDate: new Date("2026-08-01"), budgetTotal: 8000, budgetSpent: 2000 },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIENT C: Historical/Legacy client — all completed/cancelled, for reports
  // ═══════════════════════════════════════════════════════════════════════════════

  const leadLegacy = await prisma.lead.create({
    data: { companyName: "شركة التراث", contactName: "يوسف العمري", phoneWhatsapp: "+966504445566", email: "legacy@example.com", businessName: "مؤسسة التراث التجارية", businessType: "STORE", source: "REFERRAL", assignedTo: userIds["SALES"], pipelineStage: "CONTRACT_SIGNED" },
  });

  const clientC = await prisma.client.create({
    data: {
      leadId: leadLegacy.id, companyName: "شركة التراث", contactName: "يوسف العمري",
      phoneWhatsapp: "+966504445566", email: "legacy@example.com", businessName: "مؤسسة التراث التجارية",
      businessType: "STORE", accountManager: userIds["SALES"], status: "ACTIVE",
    },
  });

  const ctrLegacy1 = await prisma.contract.create({
    data: { clientId: clientC.id, createdBy: userIds["PM"], title: "حملة إطلاق المتجر 2024", type: "FIXED_PROJECT", status: "EXPIRED", startDate: new Date("2024-01-01"), endDate: new Date("2024-06-30"), monthlyValue: 0, totalValue: 45000, eSigned: true, signedAt: new Date("2024-01-01") },
  });
  const ctrLegacy2 = await prisma.contract.create({
    data: { clientId: clientC.id, createdBy: userIds["PM"], title: "صيانة الموقع 2024", type: "MONTHLY_RETAINER", status: "EXPIRED", startDate: new Date("2024-01-01"), endDate: new Date("2024-12-31"), monthlyValue: 3000, totalValue: 36000, eSigned: true, signedAt: new Date("2024-01-01") },
  });
  const ctrLegacy3 = await prisma.contract.create({
    data: { clientId: clientC.id, createdBy: userIds["PM"], title: "تطبيق جوال (ملغى)", type: "FIXED_PROJECT", status: "CANCELLED", startDate: new Date("2024-07-01"), endDate: new Date("2024-12-31"), monthlyValue: 0, totalValue: 80000, eSigned: true, signedAt: new Date("2024-06-15") },
  });

  const projLegacy1 = await prisma.project.create({
    data: { clientId: clientC.id, contractId: ctrLegacy1.id, projectManagerId: userIds["PM"], name: "إطلاق متجر التراث", description: "حملة إطلاق المتجر الإلكتروني", status: "COMPLETED", priority: "HIGH", startDate: new Date("2024-01-15"), endDate: new Date("2024-06-15"), completionPercentage: 100 },
  });
  const projLegacy2 = await prisma.project.create({
    data: { clientId: clientC.id, contractId: ctrLegacy2.id, projectManagerId: userIds["PM"], name: "صيانة موقع التراث", description: "صيانة دورية وتحسينات", status: "COMPLETED", priority: "NORMAL", startDate: new Date("2024-01-01"), endDate: new Date("2024-12-31"), completionPercentage: 100 },
  });
  const projLegacy3 = await prisma.project.create({
    data: { clientId: clientC.id, contractId: ctrLegacy3.id, projectManagerId: userIds["PM"], name: "تطبيق التراث (ملغى)", description: "تم إلغاء المشروع", status: "CANCELLED", priority: "NORMAL", startDate: new Date("2024-07-01"), endDate: new Date("2024-12-31"), completionPercentage: 10 },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projLegacy1.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projLegacy1.id, userId: userIds["MARKETING"], role: "MEMBER" },
      { projectId: projLegacy2.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
      { projectId: projLegacy3.id, userId: userIds["EMPLOYEE"], role: "MEMBER" },
    ],
    skipDuplicates: true,
  });

  const legacyTasks = await Promise.all([
    prisma.task.create({ data: { projectId: projLegacy1.id, departmentId: marketingDept!.id, assignedTo: userIds["MARKETING"], createdBy: userIds["PM"], title: "تصميم هوية المتجر", description: "تصميم الهوية البصرية للمتجر", status: "DONE", priority: "HIGH", dueDate: new Date("2024-03-01"), approvedBy: userIds["PM"], approvedAt: new Date("2024-02-28") } }),
    prisma.task.create({ data: { projectId: projLegacy1.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تطوير واجهة المتجر", description: "تطوير frontend", status: "DONE", priority: "HIGH", dueDate: new Date("2024-05-01"), approvedBy: userIds["PM"], approvedAt: new Date("2024-04-30") } }),
    prisma.task.create({ data: { projectId: projLegacy2.id, departmentId: designDept!.id, assignedTo: userIds["EMPLOYEE"], createdBy: userIds["PM"], title: "تحديثات شهرية", description: "تحديثات دورية", status: "DONE", priority: "NORMAL", dueDate: new Date("2024-12-15"), approvedBy: userIds["PM"], approvedAt: new Date("2024-12-10") } }),
  ]);

  await prisma.deliverable.createMany({
    data: [
      { projectId: projLegacy1.id, title: "تقرير الإطلاق النهائي", description: "تقرير شامل", filePath: "", status: "DONE", isVisibleToClient: true, approvedBy: userIds["PM"], approvedAt: new Date("2024-06-10") },
      { projectId: projLegacy2.id, title: "تقرير السنة", description: "ملخص أعمال السنة", filePath: "", status: "DONE", isVisibleToClient: true, approvedBy: userIds["PM"], approvedAt: new Date("2024-12-20") },
    ],
  });

  const invLegacy1 = await prisma.invoice.create({
    data: { clientId: clientC.id, contractId: ctrLegacy1.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20240101-L01", amount: 22500, status: "PAID", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2024-01-01"), dueDate: new Date("2024-01-15"), paidAt: new Date("2024-01-12"), paymentReference: "TXN-20240112-L01" },
  });
  const invLegacy2 = await prisma.invoice.create({
    data: { clientId: clientC.id, contractId: ctrLegacy1.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20240401-L02", amount: 22500, status: "PAID", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2024-04-01"), dueDate: new Date("2024-04-15"), paidAt: new Date("2024-04-10"), paymentReference: "TXN-20240410-L02" },
  });
  const invLegacy3 = await prisma.invoice.create({
    data: { clientId: clientC.id, contractId: ctrLegacy3.id, createdBy: userIds["ACCOUNTANT"], invoiceNumber: "INV-20240701-L03", amount: 40000, status: "CANCELLED", paymentMethod: "BANK_TRANSFER", issueDate: new Date("2024-07-01"), dueDate: new Date("2024-07-15") },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invLegacy1.id, description: "الدفعة الأولى - تصميم", quantity: 1, unitPrice: 22500, total: 22500 },
      { invoiceId: invLegacy2.id, description: "الدفعة الثانية - تطوير", quantity: 1, unitPrice: 22500, total: 22500 },
      { invoiceId: invLegacy3.id, description: "الدفعة الأولى - تطبيق (ملغاة)", quantity: 1, unitPrice: 40000, total: 40000 },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { invoiceId: invLegacy1.id, clientId: clientC.id, amount: 22500, method: "BANK_TRANSFER", status: "SUCCESS", date: new Date("2024-01-12") },
      { invoiceId: invLegacy2.id, clientId: clientC.id, amount: 22500, method: "BANK_TRANSFER", status: "SUCCESS", date: new Date("2024-04-10") },
    ],
  });

  // Campaigns
  await prisma.campaign.createMany({
    data: [
      { clientId: clientC.id, taskId: legacyTasks[0].id, projectId: projLegacy1.id, managedBy: userIds["MARKETING"], name: "حملة إطلاق 2024", platform: "META", status: "COMPLETED", startDate: new Date("2024-02-01"), endDate: new Date("2024-05-31"), budgetTotal: 18000, budgetSpent: 17500 },
      { clientId: clientC.id, taskId: legacyTasks[1].id, projectId: projLegacy2.id, managedBy: userIds["MARKETING"], name: "حملة الصيانة الشهرية", platform: "GOOGLE", status: "COMPLETED", startDate: new Date("2024-03-01"), endDate: new Date("2024-11-30"), budgetTotal: 12000, budgetSpent: 11800 },
    ],
  });

  await prisma.clientHistoryLog.createMany({
    data: [
      { clientId: clientC.id, userId: userIds["PM"], eventType: "PROJECT_COMPLETED", description: "تم اكتمال مشروع إطلاق متجر التراث", occurredAt: new Date("2024-06-15") },
      { clientId: clientC.id, userId: userIds["PM"], eventType: "PROJECT_COMPLETED", description: "تم اكتمال مشروع صيانة الموقع السنوي", occurredAt: new Date("2024-12-31") },
    ],
  });

  // Salaries
  await prisma.salary.createMany({
    data: [
      { employeeId: employee1.id, amount: 7000, baseSalary: 7000, status: "PAID", month: 5, year: 2026, paymentDate: new Date("2026-05-01") },
      { employeeId: employee2.id, amount: 8500, baseSalary: 8500, status: "PAID", month: 5, year: 2026, paymentDate: new Date("2026-05-01") },
    ],
  });

  // Ledger entries
  await prisma.ledger.createMany({
    data: [
      { action: "CREATE_INVOICE", entity: "INVOICE", entityId: invoices[0].id, userId: userIds["ACCOUNTANT"] },
      { action: "REGISTER_PAYMENT", entity: "PAYMENT", entityId: invoices[2].id, userId: userIds["ACCOUNTANT"] },
    ],
  });

  // ── Permissions (always upserted — never deleted) ────────────────────────────
  const permissions = [
    "chat.create", "chat.read", "chat.update", "chat.message",
    "projects.create", "projects.read", "projects.update", "projects.archive", "projects.manage_members",
    "proposals.create", "proposals.read", "proposals.read_public", "proposals.update", "proposals.send", "proposals.approve", "proposals.reject",
    "tasks.read", "tasks.create", "tasks.update", "tasks.assign", "tasks.approve", "tasks.comment", "tasks.delete",
    "notifications.read", "notifications.update", "notifications.broadcast",
    "marketing.manage_tests", "marketing.create", "marketing.read", "marketing.update", "marketing.delete", "marketing.manage_kpis", "marketing.flag_optimization",
    "portal.read", "portal.manage_deliverables", "portal.approve_deliverables", "portal.request_revisions", "portal.manage_intake",
    "finance.create_invoice", "finance.read", "finance.update_invoice", "finance.manage_tickets", "finance.read_ledger", "finance.manage_payroll",
    "leads.create", "leads.read", "leads.update", "leads.assign", "leads.convert", "leads.delete",
    "automation.create", "automation.read", "automation.execute",
    "contracts.create", "contracts.read", "contracts.update", "contracts.send", "contracts.sign", "contracts.activate", "contracts.cancel", "contracts.manage_versions",
    "contracts.read_public", "contracts.sign_public",
    "invoices.pay_public",
    "services.create", "services.read", "services.update", "services.delete",
  ];

  for (const name of permissions) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  const rolePermissionMapping: Record<string, string[]> = {
    ADMIN: permissions,
    PM: [
      "projects.create", "projects.read", "projects.update", "projects.manage_members",
      "tasks.read", "tasks.create", "tasks.assign", "tasks.update", "tasks.approve",
      "proposals.read", "proposals.update", "proposals.approve", "proposals.reject",
      "notifications.read", "notifications.update",
      "finance.read", "finance.update_invoice",
      "marketing.read",
      "portal.read",
      "services.read",
      "chat.create", "chat.read", "chat.message",
    ],
    SALES: [
      "leads.create", "leads.read", "leads.update", "leads.assign",
      "proposals.create", "proposals.read", "proposals.send", "proposals.read_public",
      "contracts.create", "contracts.read", "contracts.update", "contracts.send", "contracts.sign", "contracts.activate", "contracts.cancel", "contracts.manage_versions",
      "notifications.read", "notifications.update",
      "services.read",
      "chat.create", "chat.read", "chat.message",
    ],
    EMPLOYEE: [
      "tasks.read", "tasks.update", "tasks.comment",
      "projects.read",
      "notifications.read", "notifications.update",
    ],
    MARKETING: [
      "marketing.create", "marketing.read", "marketing.update", "marketing.delete",
      "marketing.manage_tests", "marketing.manage_kpis", "marketing.flag_optimization",
      "tasks.read", "tasks.update", "tasks.comment",
      "notifications.read",
    ],
    ACCOUNTANT: [
      "finance.create_invoice", "finance.read", "finance.update_invoice",
      "finance.manage_tickets", "finance.read_ledger", "finance.manage_payroll",
    ],
    CLIENT: [
      "proposals.read_public", "notifications.read", "leads.create",
      "contracts.read_public", "contracts.sign_public", "invoices.pay_public",
      "portal.read", "portal.approve_deliverables", "portal.request_revisions",
      "services.read",
      "chat.read", "chat.message",
    ],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionMapping)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    for (const permName of permNames) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  console.log("✓ Seed complete — all statuses covered across 3 clients (password: password123)");
  console.log("  Client A (client@hassad.com): 9 leads, 5 proposals, 6 contracts, 7 projects, 7 invoices, 5 campaigns");
  console.log("  Client B (client2@hassad.com): Active client with mixed data");
  console.log("  Client C (legacy): All completed/cancelled for history/reports");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
