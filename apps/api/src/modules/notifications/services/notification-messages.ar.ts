import type {
  NotificationMessageKey,
  NotificationParams,
  NotificationTemplate,
} from "./notification-messages";
import { formatPlainNumber } from "../../../common/presentation/plain-number";

const snoozeCategoryLabels: Record<string, string> = {
  DELIVERABLE_APPROVAL: "اعتماد التسليم",
  INVOICE_PAYMENT: "سداد الفاتورة",
  PROPOSAL_REVIEW: "مراجعة العرض",
  CONTRACT_SIGN: "توقيع العقد",
  STRATEGY_REVIEW: "مراجعة الاستراتيجية التسويقية",
};

function getSnoozeCategory(itemType: NotificationParams[string]) {
  return typeof itemType === "string"
    ? (snoozeCategoryLabels[itemType] ?? "عنصر الإجراء")
    : "عنصر الإجراء";
}

function getSnoozeCompanyName(companyName: NotificationParams[string]) {
  return companyName === null || companyName === undefined
    ? "شركتك"
    : String(companyName);
}

/**
 * Arabic notification catalog.
 * User-provided parameters are interpolated unchanged; numeric parameters are
 * expected to already use the platform's Latin-digit formatting rules.
 */
export const arabicTemplates: Partial<
  Record<NotificationMessageKey, NotificationTemplate>
> = {
  "task.assigned": {
    title: () => "تم إسناد مهمة جديدة",
    body: ({ taskTitle, department }: NotificationParams) =>
      department
        ? `تم إسناد المهمة "${taskTitle}" إليك في قسم ${department}.`
        : `تم إسناد المهمة "${taskTitle}" إليك.`,
  },
  "task.started": {
    title: () => "بدأ تنفيذ المهمة",
    body: ({ actorName, taskTitle }) =>
      `بدأ ${actorName} تنفيذ المهمة "${taskTitle}".`,
  },
  "task.awaiting_review": {
    title: () => "مهمة بانتظار المراجعة",
    body: ({ actorName, taskTitle }) =>
      `سلّم ${actorName} المهمة "${taskTitle}" للمراجعة.`,
  },
  "task.approved": {
    title: () => "تم اعتماد المهمة",
    body: ({ taskTitle }) => `تم اعتماد المهمة "${taskTitle}".`,
  },
  "task.revision_requested": {
    title: () => "تم إرجاع المهمة للتعديل",
    body: ({ actorName, taskTitle }) =>
      `أعاد ${actorName} المهمة "${taskTitle}" للتعديل.`,
  },
  "project.approved": {
    title: () => "تمت الموافقة على المشروع",
    body: ({ projectName }) =>
      `تمت الموافقة على المشروع "${projectName}" من قبل العميل.`,
  },
  "project.revision_requested": {
    title: () => "طلب العميل تعديلات على المشروع",
    body: ({ projectName, comment }) =>
      `طلب العميل تعديلات على المشروع "${projectName}": ${comment}`,
  },
  "project.client_status_changed": {
    title: () => "تحديث حالة مشروعك",
    body: ({ projectName, status }) =>
      `تم تغيير حالة مشروع "${projectName}" إلى ${status}`,
  },
  "project.awaiting_review": {
    title: () => "مشروعك جاهز للمراجعة والموافقة",
    body: ({ projectName }) =>
      `المشروع "${projectName}" اكتمل وأصبح جاهزًا لمراجعتك.`,
  },
  "contract.sent": {
    title: ({ client }) =>
      client ? "عقد جديد بانتظار توقيعك" : "تم إرسال العقد",
    body: ({ contractTitle, client, actorName, companyName }) =>
      client
        ? `العقد "${contractTitle}" جاهز للمراجعة والتوقيع.`
        : `أرسل ${actorName ?? "النظام"} العقد "${contractTitle}" إلى ${companyName}.`,
  },
  "contract.signed": {
    title: ({ client }) => (client ? "تم توقيع العقد بنجاح" : "تم توقيع العقد"),
    body: ({ contractTitle, client, companyName }) =>
      client
        ? `تم توقيع العقد "${contractTitle}" بنجاح. سيبدأ العمل على مشروعك قريبًا.`
        : `تم توقيع العقد "${contractTitle}" مع ${companyName ?? "العميل"}.`,
  },
  "contract.canceled": {
    title: () => "تم إلغاء العقد",
    body: ({ contractTitle, client, actorName, companyName }) =>
      client
        ? `تم إلغاء العقد "${contractTitle}". يرجى التواصل مع فريقنا إذا كانت لديك أسئلة.`
        : `ألغى ${actorName ?? "النظام"} العقد "${contractTitle}" مع ${companyName}.`,
  },
  "contract.activated": {
    title: () => "تم تفعيل العقد",
    body: ({ contractTitle, client }) =>
      client
        ? `تم تفعيل العقد "${contractTitle}". الفريق جاهز لبدء مشروعك.`
        : `تم تفعيل العقد "${contractTitle}" بعد استلام الدفعة المقدمة.`,
  },
  "proposal.approved": {
    title: () => "تمت الموافقة على العرض",
    body: ({ proposalTitle }) => `تمت الموافقة على العرض "${proposalTitle}".`,
  },
  "proposal.rejected": {
    title: () => "تم رفض العرض",
    body: ({ proposalTitle }) => `تم رفض العرض "${proposalTitle}".`,
  },
  "proposal.client_approved": {
    title: () => "وافق العميل على العرض",
    body: ({ proposalTitle, notes }) =>
      `وافق العميل على العرض "${proposalTitle}"${notes ? ` — الملاحظات: ${notes}` : ""}`,
  },
  "proposal.revision_requested": {
    title: () => "طلب تعديل على العرض",
    body: ({ proposalTitle, notes }) =>
      `طلب العميل تعديلات على العرض "${proposalTitle}"${notes ? `: ${notes}` : ""}`,
  },
  "invoice.created": {
    title: () => "فاتورة جديدة",
    body: ({ amount }) =>
      `تم إنشاء فاتورة جديدة بقيمة ${formatPlainNumber(amount ?? 0)} ريال سعودي.`,
  },
  "invoice.paid": {
    title: () => "تم دفع الفاتورة",
    body: ({ invoiceNumber, amount }) =>
      amount === undefined || amount === null
        ? `تم دفع الفاتورة ${formatPlainNumber(invoiceNumber ?? "")} بالكامل.`
        : `تم دفع الفاتورة ${formatPlainNumber(invoiceNumber ?? "")} بالكامل بقيمة ${formatPlainNumber(amount)} ريال سعودي.`,
  },
  "payment.received": {
    title: () => "تم استلام الدفعة",
    body: ({ amount, invoiceNumber }) =>
      `تم استلام دفعة بقيمة ${formatPlainNumber(amount ?? 0)} ريال سعودي للفاتورة "${formatPlainNumber(invoiceNumber ?? "")}".`,
  },
  "deliverable.approved": {
    title: () => "تم اعتماد التسليم",
    body: ({ deliverableTitle, projectName }) =>
      `تم اعتماد التسليم "${deliverableTitle}" في المشروع ${projectName}.`,
  },
  "deliverable.revision_requested": {
    title: () => "طلب تعديل على التسليم",
    body: ({ deliverableTitle, projectName }) =>
      `طُلبت تعديلات على التسليم "${deliverableTitle}" في المشروع ${projectName}.`,
  },
  "request.submitted": {
    title: () => "طلب جديد",
    body: ({ contactName, companyName }) =>
      `تم استلام طلب جديد من ${contactName} - ${companyName}`,
  },
  "chat.new_message": {
    title: ({ sender }) => `رسالة جديدة من ${sender}`,
    body: ({ content }) => String(content ?? ""),
  },
  "project.status_changed": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "task.assigned_to": {
    title: () => "تحديث المهمة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "task.comment_added": {
    title: () => "تحديث المهمة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "contract.status_changed": {
    title: () => "تحديث العقد",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "proposal.submitted": {
    title: () => "تحديث العرض",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.created": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "project.periods_generated": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "project.period_closed": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "project.period_invoice_issued": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "meeting.scheduled": {
    title: () => "تحديث الاجتماع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "meeting.updated": {
    title: () => "تحديث الاجتماع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "meeting.canceled": {
    title: () => "تحديث الاجتماع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "meeting.postponed": {
    title: () => "تحديث الاجتماع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "contract.expiring": {
    title: () => "تحديث العقد",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "contract.expired": {
    title: () => "تحديث العقد",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "contract.renewal_urgent": {
    title: () => "تحديث العقد",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "invoice.payment_reminder": {
    title: () => "تحديث الفاتورة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "project.suspended": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "marketing_task.assigned": {
    title: () => "تحديث مهمة التسويق",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "contract.auto_canceled": {
    title: () => "تحديث العقد",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "invoice.overdue_escalation": {
    title: () => "تحديث الفاتورة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "invoice.automatic_created": {
    title: () => "تحديث الفاتورة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "invoice.scheduled_created": {
    title: () => "تحديث الفاتورة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "invoice.sent": {
    title: () => "تحديث الفاتورة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "invoice.due_reminder": {
    title: () => "تحديث الفاتورة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "project.created_from_contract": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "period.resumed": {
    title: () => "تحديث الفترة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "strategy.submitted": {
    title: () => "تحديث الاستراتيجية",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "strategy.sent": {
    title: () => "تحديث الاستراتيجية",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "strategy.approved": {
    title: () => "تحديث الاستراتيجية",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "strategy.revision_requested": {
    title: () => "تحديث الاستراتيجية",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "strategy.rejected": {
    title: () => "تحديث الاستراتيجية",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "strategy.revised": {
    title: () => "تحديث الاستراتيجية",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "campaign.launched": {
    title: () => "تحديث الحملة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "campaign.created": {
    title: () => "تحديث الحملة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "campaign.performance_updated": {
    title: () => "تحديث الحملة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "snooze.expired": {
    title: ({ itemType }) => `انتهى التأجيل: ${getSnoozeCategory(itemType)}`,
    body: ({ itemType, companyName }) =>
      `أصبح عنصر ${getSnoozeCategory(itemType)} الخاص بـ "${getSnoozeCompanyName(companyName)}" جاهزًا للمراجعة مرة أخرى.`,
  },
  "campaign.optimization_needed": {
    title: () => "تحديث الحملة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "crm.contract_review": {
    title: () => "تحديث إدارة العملاء",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "crm.proposal_review": {
    title: () => "تحديث إدارة العملاء",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.stalled_project": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.unassigned_requests": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.system_failures": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.inactive_client": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.high_workload": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.underloaded_team": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.overdue_task": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "admin.request_followup": {
    title: () => "تنبيه إداري",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.new_ticket": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.approved": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.rejected": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.new_message": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.awaiting_confirmation": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.client_confirmed": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.resolved": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.escalated": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.auto_escalated": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.manager_changed": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.manager_removed": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.manager_assigned": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.closed": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "dispute.reminder": {
    title: () => "تحديث التذكرة",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "meeting.pm_scheduled": {
    title: () => "تحديث الاجتماع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "meeting.pm_updated": {
    title: () => "تحديث الاجتماع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
  "project.file_uploaded": {
    title: () => "تحديث المشروع",
    body: (params: NotificationParams) => {
      const values = Object.values(params).filter(
        (value) => value !== undefined && value !== null && value !== "",
      );
      return values.length > 0
        ? `تم تحديث الإشعار: ${values.join(" - ")}`
        : "تم تحديث الإشعار المرتبط بهذا الإجراء.";
    },
  },
};
