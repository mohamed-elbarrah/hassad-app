import { formatPlainNumber } from "../../../common/presentation/plain-number";
import { arabicTemplates } from "./notification-messages.ar";
import { preciseArabicTemplates } from "./notification-messages.ar.precise";
import { NotificationLocale } from "./notification-locale";

export type NotificationMessageKey =
  | "task.assigned"
  | "task.started"
  | "task.awaiting_review"
  | "task.approved"
  | "task.revision_requested"
  | "project.approved"
  | "project.revision_requested"
  | "project.status_changed"
  | "project.client_status_changed"
  | "project.awaiting_review"
  | "task.assigned_to"
  | "task.comment_added"
  | "contract.status_changed"
  | "proposal.submitted"
  | "proposal.approved"
  | "proposal.rejected"
  | "invoice.paid"
  | "campaign.status_changed"
  | "dispute.created"
  | "project.periods_generated"
  | "project.period_closed"
  | "project.period_invoice_issued"
  | "meeting.scheduled"
  | "meeting.updated"
  | "meeting.canceled"
  | "meeting.postponed"
  | "contract.expiring"
  | "contract.expired"
  | "contract.renewal_urgent"
  | "invoice.payment_reminder"
  | "project.suspended"
  | "marketing_task.assigned"
  | "contract.auto_canceled"
  | "invoice.overdue_escalation"
  | "invoice.created"
  | "invoice.automatic_created"
  | "invoice.scheduled_created"
  | "invoice.sent"
  | "invoice.due_reminder"
  | "payment.received"
  | "contract.activated"
  | "contract.sent"
  | "project.created_from_contract"
  | "period.resumed"
  | "contract.signed"
  | "contract.canceled"
  | "strategy.submitted"
  | "strategy.sent"
  | "strategy.approved"
  | "strategy.revision_requested"
  | "strategy.rejected"
  | "strategy.revised"
  | "campaign.launched"
  | "campaign.created"
  | "campaign.performance_updated"
  | "snooze.expired"
  | "campaign.optimization_needed"
  | "deliverable.approved"
  | "deliverable.revision_requested"
  | "crm.contract_review"
  | "crm.proposal_review"
  | "admin.stalled_project"
  | "admin.unassigned_requests"
  | "admin.system_failures"
  | "admin.inactive_client"
  | "admin.high_workload"
  | "admin.underloaded_team"
  | "admin.overdue_task"
  | "admin.request_followup"
  | "dispute.new_ticket"
  | "dispute.approved"
  | "dispute.rejected"
  | "dispute.new_message"
  | "dispute.awaiting_confirmation"
  | "dispute.client_confirmed"
  | "dispute.resolved"
  | "dispute.escalated"
  | "dispute.auto_escalated"
  | "dispute.manager_changed"
  | "dispute.manager_removed"
  | "dispute.manager_assigned"
  | "dispute.closed"
  | "dispute.reminder"
  | "meeting.pm_scheduled"
  | "meeting.pm_updated"
  | "project.file_uploaded"
  | "chat.new_message"
  | "proposal.client_approved"
  | "proposal.revision_requested"
  | "request.submitted";

export type NotificationParams = Record<string, string | number | null | undefined>;

export type NotificationTemplate = {
  title: (params: NotificationParams) => string;
  body: (params: NotificationParams) => string;
};

const templates: Record<NotificationMessageKey, NotificationTemplate> = {
  "task.assigned": {
    title: () => "New task assigned",
    body: ({ taskTitle, department }) =>
      department
        ? `Task "${taskTitle}" was assigned to you in the ${department} department.`
        : `Task "${taskTitle}" was assigned to you.`,
  },
  "task.started": {
    title: () => "Task started",
    body: ({ actorName, taskTitle }) => `${actorName} started task "${taskTitle}".`,
  },
  "task.awaiting_review": {
    title: () => "Task awaiting review",
    body: ({ actorName, taskTitle }) =>
      `${actorName} submitted task "${taskTitle}" for review.`,
  },
  "task.approved": {
    title: () => "Task approved",
    body: ({ taskTitle }) => `Task "${taskTitle}" was approved.`,
  },
  "task.revision_requested": {
    title: () => "Task returned for revision",
    body: ({ actorName, taskTitle }) =>
      `${actorName} returned task "${taskTitle}" for revision.`,
  },
  "project.approved": {
    title: () => "Project approved",
    body: ({ projectName }) => `Project "${projectName}" was approved by the client.`,
  },
  "project.revision_requested": {
    title: () => "Client requested project revisions",
    body: ({ projectName, comment }) =>
      `The client requested revisions to project "${projectName}": ${comment}`,
  },
  "project.status_changed": {
    title: () => "Project status updated",
    body: ({ actorName, projectName, status }) =>
      `${actorName ?? "System"} changed project "${projectName}" status to ${status}`,
  },
  "project.client_status_changed": {
    title: () => "Your project status updated",
    body: ({ projectName, status }) =>
      `Project "${projectName}" status changed to ${status}`,
  },
  "project.awaiting_review": {
    title: () => "Your project is ready for review and approval",
    body: ({ projectName }) => `Project "${projectName}" is complete and ready for your review.`,
  },
  "task.assigned_to": {
    title: () => "New task assigned",
    body: ({ taskTitle, assigneeName }) => `Task "${taskTitle}" was assigned to ${assigneeName}.`,
  },
  "task.comment_added": {
    title: () => "New task comment",
    body: ({ taskTitle }) => `A new comment was added to task "${taskTitle}".`,
  },
  "contract.status_changed": {
    title: () => "Contract status updated",
    body: ({ contractTitle, status }) =>
      `Contract "${contractTitle}" status changed to ${status}.`,
  },
  "proposal.submitted": {
    title: () => "New proposal awaiting your review",
    body: ({ proposalTitle }) => `A new proposal was sent to you: "${proposalTitle}". You can review and respond using the provided link.`,
  },
  "proposal.approved": {
    title: () => "Proposal approved",
    body: ({ proposalTitle }) => `Proposal "${proposalTitle}" was approved.`,
  },
  "proposal.rejected": {
    title: () => "Proposal rejected",
    body: ({ proposalTitle }) => `Proposal "${proposalTitle}" was rejected.`,
  },
  "invoice.paid": {
    title: () => "Invoice paid",
    body: ({ invoiceNumber, amount }) =>
      amount === undefined || amount === null
        ? `Invoice ${invoiceNumber} was paid in full.`
        : `Invoice ${invoiceNumber} was paid in full for ${formatPlainNumber(amount)}.`,
  },
  "campaign.status_changed": {
    title: () => "Campaign status updated",
    body: ({ campaignName, status }) =>
      `Campaign "${campaignName}" status changed to ${status}.`,
  },
  "dispute.created": {
    title: () => "New dispute ticket",
    body: ({ projectName }) =>
      `A new dispute ticket was created for project "${projectName}".`,
  },
  "project.periods_generated": {
    title: () => "Project periods generated",
    body: ({ periodCount, projectName }) =>
      `${periodCount} monthly periods were created for project "${projectName}".`,
  },
  "project.period_closed": {
    title: () => "Period closed",
    body: ({ periodNumber, projectName }) =>
      `Period ${periodNumber} for project "${projectName}" was closed.`,
  },
  "project.period_invoice_issued": {
    title: () => "Period invoice issued",
    body: ({ periodNumber, amount }) =>
      `Invoice for period ${periodNumber} was issued for ${formatPlainNumber(amount ?? 0)} SAR.`,
  },
  "meeting.scheduled": {
    title: () => "New meeting scheduled",
    body: ({ meetingTitle, periodNumber, projectName }) =>
      `"${meetingTitle}" for period ${periodNumber} of project "${projectName}".`,
  },
  "meeting.updated": {
    title: () => "Meeting updated",
    body: ({ meetingTitle, periodNumber, projectName }) =>
      `"${meetingTitle}" for period ${periodNumber} of project "${projectName}".`,
  },
  "meeting.canceled": {
    title: () => "Meeting canceled",
    body: ({ meetingTitle, periodNumber, projectName }) =>
      `"${meetingTitle}" for period ${periodNumber} of project "${projectName}".`,
  },
  "meeting.postponed": {
    title: () => "Meeting postponed",
    body: ({ meetingTitle, periodNumber, projectName }) =>
      `"${meetingTitle}" for period ${periodNumber} of project "${projectName}".`,
  },
  "contract.expiring": {
    title: () => "Contract expiring soon",
    body: ({ contractTitle, companyName, days }) =>
      `Contract "${contractTitle}" with ${companyName} expires in ${days} days`,
  },
  "contract.expired": {
    title: () => "Contract expired",
    body: ({ contractTitle, companyName }) =>
      `Contract "${contractTitle}" with ${companyName} has expired. Please contact the client about renewal.`,
  },
  "contract.renewal_urgent": {
    title: () => "Urgent contract renewal",
    body: ({ contractTitle, companyName, days }) =>
      `Contract "${contractTitle}" with ${companyName} expires in ${days} days and no action has been taken. Please contact the client about renewal.`,
  },
  "invoice.payment_reminder": {
    title: () => "Invoice payment reminder",
    body: ({ invoiceTitle, dayLabel, amount }) =>
      `Invoice "${invoiceTitle}" is due ${dayLabel}. Please pay the amount ${formatPlainNumber(amount ?? 0)} SAR`,
  },
  "project.suspended": {
    title: () => "Project suspended",
    body: ({ invoiceTitle }) =>
      `The project was suspended because invoice "${invoiceTitle}" was not paid. Please follow up on payment to resume work.`,
  },
  "marketing_task.assigned": {
    title: () => "New marketing task assigned",
    body: ({ projectName }) =>
      `The task "Manage advertising campaigns" was created automatically for you in project ${projectName}.`,
  },
  "contract.auto_canceled": {
    title: () => "Contract automatically cancelled",
    body: ({ contractTitle, graceDays }) =>
      `Contract "${contractTitle}" was automatically cancelled because the down payment was not paid within ${graceDays} day(s)`,
  },
  "invoice.overdue_escalation": {
    title: () => "Invoices overdue by more than 30 days",
    body: ({ count }) =>
      `${count} invoice(s) have been overdue for more than 30 days and need follow-up.`,
  },
  "invoice.created": {
    title: () => "New invoice",
    body: ({ amount }) => `A new invoice was created for ${formatPlainNumber(amount ?? 0)} SAR`,
  },
  "invoice.automatic_created": {
    title: () => "Automatic invoice created",
    body: ({ invoiceNumber, contractTitle }) =>
      `Automatic invoice ${invoiceNumber} was created for contract "${contractTitle}"`,
  },
  "invoice.scheduled_created": {
    title: () => "Invoice created",
    body: ({ label, amount, contractTitle }) =>
      `Invoice "${label}" for ${formatPlainNumber(amount ?? 0)} SAR was created for contract "${contractTitle}"`,
  },
  "invoice.sent": {
    title: () => "Invoice sent",
    body: ({ invoiceNumber }) =>
      `Invoice "${invoiceNumber}" was sent to you for review and payment`,
  },
  "invoice.due_reminder": {
    title: () => "Invoice payment reminder",
    body: ({ invoiceNumber, amount }) =>
      `Reminder: invoice "${invoiceNumber}" for ${formatPlainNumber(amount ?? 0)} SAR is due for payment`,
  },
  "payment.received": {
    title: () => "Payment received",
    body: ({ amount, invoiceNumber }) =>
      `A payment of ${formatPlainNumber(amount ?? 0)} SAR was received for invoice "${invoiceNumber}"`,
  },
  "contract.activated": {
    title: () => "Contract activated",
    body: ({ contractTitle, client }) =>
      client
        ? `Contract "${contractTitle}" was activated. The team is ready to start your project.`
        : `Contract "${contractTitle}" was activated after receiving the down payment.`,
  },
  "contract.sent": {
    title: ({ client }) => client ? "New contract awaiting your signature" : "Contract sent",
    body: ({ actorName, contractTitle, companyName, client }) =>
      client
        ? `Contract "${contractTitle}" is ready for review and signature`
        : `${actorName ?? "System"} sent contract "${contractTitle}" to ${companyName}`,
  },
  "project.created_from_contract": {
    title: () => "New project created automatically",
    body: ({ projectName }) =>
      `Project "${projectName}" was created after the contract was signed. You can now assign tasks to the team.`,
  },
  "period.resumed": {
    title: () => "Period resumed",
    body: ({ periodNumber }) =>
      `Period ${periodNumber} was resumed after the invoice was paid`,
  },
  "contract.signed": {
    title: ({ client }) => client ? "Contract signed successfully" : "Contract signed",
    body: ({ contractTitle, companyName, client }) =>
      client
        ? `Contract "${contractTitle}" was signed successfully. Work on your project will begin soon.`
        : companyName
          ? `Contract "${contractTitle}" was signed with ${companyName}`
          : `The client signed contract "${contractTitle}"`,
  },
  "strategy.submitted": { title: () => "New marketing strategy", body: ({ taskTitle }) => `A new marketing strategy was submitted for task "${taskTitle}" and is awaiting your review` },
  "strategy.sent": { title: () => "Marketing strategy sent", body: ({ taskTitle }) => `The marketing strategy for task "${taskTitle}" was sent to the client` },
  "strategy.approved": { title: () => "Marketing strategy approved", body: ({ taskTitle }) => `The marketing strategy for task "${taskTitle}" was approved; campaigns can now be created` },
  "strategy.revision_requested": { title: () => "Marketing strategy revision requested", body: ({ taskTitle, comment }) => `The client requested a revision to the marketing strategy for task "${taskTitle}": ${comment}` },
  "strategy.rejected": { title: () => "Marketing strategy rejected", body: ({ taskTitle }) => `The client rejected the marketing strategy for task "${taskTitle}"` },
  "strategy.revised": { title: () => "Marketing strategy revised", body: () => "The revised marketing strategy was resubmitted and is awaiting your review" },
  "campaign.launched": { title: () => "New campaign launched", body: ({ campaignName }) => `Campaign "${campaignName}" was launched for your project` },
  "campaign.created": { title: () => "New campaign", body: ({ campaignName, taskTitle }) => `New campaign "${campaignName}" was created for task "${taskTitle}"` },
  "campaign.performance_updated": { title: () => "Campaign performance updated", body: ({ campaignName }) => `Campaign results for "${campaignName}" were updated` },
  "campaign.optimization_needed": { title: () => "Campaign needs optimization", body: ({ campaignName }) => `Campaign "${campaignName}" was flagged for optimization` },
  "snooze.expired": { title: ({ title }) => String(title ?? "Reminder"), body: ({ body }) => String(body ?? "") },
  "deliverable.approved": { title: () => "Deliverable approved", body: ({ deliverableTitle, projectName }) => `Deliverable "${deliverableTitle}" was approved in project ${projectName}` },
  "deliverable.revision_requested": { title: () => "Deliverable revision requested", body: ({ deliverableTitle, projectName }) => `Revisions were requested for deliverable "${deliverableTitle}" in project ${projectName}` },
  "crm.contract_review": { title: () => "Contract sent for review", body: ({ contractTitle }) => `The contract "${contractTitle}" is ready for approval.` },
  "crm.proposal_review": { title: () => "New proposal is ready", body: ({ proposalTitle }) => `A new proposal titled "${proposalTitle}" was sent for review.` },
  "admin.stalled_project": { title: () => "Stalled project", body: ({ projectName, status }) => `Project "${projectName}" is stalled (status: ${status}). Please review it.` },
  "admin.unassigned_requests": { title: () => "Unassigned requests", body: ({ count }) => `${count} request(s) are unassigned. Please distribute them to the sales team.` },
  "admin.system_failures": { title: () => "System failures", body: ({ webhooks, gateways }) => `${webhooks} webhook failure(s) and ${gateways} payment gateway failure(s) need review.` },
  "admin.inactive_client": { title: () => "Inactive client", body: ({ companyName }) => `Client "${companyName}" has been inactive for more than 30 days. Please contact them.` },
  "admin.high_workload": { title: () => "High workload", body: ({ activeTasks, averageTasks }) => `You have ${activeTasks} active task(s) (average: ${averageTasks}). Please review your priorities.` },
  "admin.underloaded_team": { title: () => "Underloaded team members", body: ({ names }) => `The following members have a low workload: ${names}. Please redistribute tasks.` },
  "admin.overdue_task": { title: () => "Overdue task", body: ({ taskTitle, message }) => `Task "${taskTitle}" ${message}.` },
  "admin.request_followup": { title: () => "Request needs follow-up", body: ({ contactName, companyName }) => `Request "${contactName}" (${companyName}) has not been updated for 14 days.` },
  "dispute.new_ticket": { title: () => "New dispute ticket", body: ({ ticketNumber }) => `New dispute ticket #${ticketNumber} needs review` },
  "dispute.approved": { title: () => "Dispute ticket approved", body: ({ title }) => `Dispute "${title}" was approved. You have 3 days to resolve it` },
  "dispute.rejected": { title: () => "Your dispute ticket was rejected", body: ({ reason }) => `Your dispute ticket was rejected. Reason: ${reason}` },
  "dispute.new_message": { title: () => "New dispute message", body: ({ ticketNumber }) => `You have a new message in dispute ticket #${ticketNumber}` },
  "dispute.awaiting_confirmation": { title: () => "Dispute ticket update", body: () => "The project manager marked the issue as resolved. Please confirm the resolution or escalate it." },
  "dispute.client_confirmed": { title: () => "Dispute resolved", body: ({ ticketNumber }) => `The client confirmed resolution of dispute ticket #${ticketNumber}` },
  "dispute.resolved": { title: () => "Dispute ticket resolved", body: ({ ticketNumber }) => `Dispute ticket #${ticketNumber} was resolved; the client confirmed the resolution` },
  "dispute.escalated": { title: () => "Dispute ticket escalated", body: ({ ticketNumber }) => `The client reported that dispute ticket #${ticketNumber} was not resolved` },
  "dispute.auto_escalated": { title: () => "Dispute ticket automatically escalated", body: ({ ticketNumber }) => `Dispute ticket #${ticketNumber} was automatically escalated because the response deadline expired` },
  "dispute.manager_changed": { title: () => "Project manager changed", body: ({ ticketNumber }) => `The project manager was changed to resolve dispute ticket #${ticketNumber}` },
  "dispute.manager_removed": { title: () => "Removed as project manager", body: ({ projectName }) => `You were removed as project manager of "${projectName}" because of a dispute` },
  "dispute.manager_assigned": { title: () => "Assigned as new project manager", body: ({ projectName }) => `You were assigned as project manager of "${projectName}"` },
  "dispute.closed": { title: () => "Dispute ticket closed", body: ({ ticketNumber, client }) => client ? `Your dispute ticket #${ticketNumber} was closed` : `Dispute ticket #${ticketNumber} was closed` },
  "dispute.reminder": { title: ({ reminderNumber }) => `Reminder ${reminderNumber}`, body: ({ message }) => String(message ?? "") },
  "meeting.pm_scheduled": { title: () => "New meeting scheduled", body: ({ meetingTitle }) => String(meetingTitle ?? "") },
  "meeting.pm_updated": { title: () => "Meeting updated", body: ({ meetingTitle }) => String(meetingTitle ?? "") },
  "project.file_uploaded": { title: () => "New file uploaded", body: ({ fileName }) => String(fileName ?? "") },
  "chat.new_message": { title: ({ sender }) => `New message from ${sender}`, body: ({ content }) => String(content ?? "") },
  "proposal.client_approved": { title: () => "Client approved proposal", body: ({ proposalTitle, notes }) => `The client approved proposal "${proposalTitle}"${notes ? ` — Notes: ${notes}` : ""}` },
  "proposal.revision_requested": { title: () => "Proposal revision requested", body: ({ proposalTitle, notes }) => `The client requested revisions to proposal "${proposalTitle}"${notes ? `: ${notes}` : ""}` },
  "request.submitted": { title: () => "New request", body: ({ contactName, companyName }) => `A new request was received from ${contactName} - ${companyName}` },
  "contract.canceled": {
    title: () => "Contract cancelled",
    body: ({ actorName, contractTitle, companyName, client }) =>
      client
        ? `Contract "${contractTitle}" was cancelled. Please contact our team if you have questions.`
        : `${actorName ?? "System"} cancelled contract "${contractTitle}" with ${companyName}`,
  },
};

// Arabic templates are added incrementally. Missing translations intentionally
// fall back to the English catalog until the Arabic catalog is complete.
const englishTemplates = templates;

const localizedTemplates: Partial<Record<NotificationMessageKey, NotificationTemplate>> = arabicTemplates;

export function renderNotificationMessage(
  key: NotificationMessageKey,
  params: NotificationParams,
  locale: NotificationLocale = "en",
) {
  const template =
    (locale === "ar"
      ? preciseArabicTemplates[key] ?? localizedTemplates[key]
      : undefined) ?? englishTemplates[key];
  return {
    title: template.title(params),
    body: template.body(params),
  };
}
