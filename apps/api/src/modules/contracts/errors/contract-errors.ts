import {
  badRequest,
  conflict,
  notFound,
} from "../../../common/errors/domain-errors";

export const CONTRACT_HANDOFF_CODES = {
  NOT_CONVERTIBLE: "CONTRACT_NOT_CONVERTIBLE",
  ALREADY_CONVERTED: "CONTRACT_ALREADY_CONVERTED",
  REQUEST_REQUIRED: "CONTRACT_REQUEST_REQUIRED",
  PROPOSAL_REQUIRED: "CONTRACT_PROPOSAL_REQUIRED",
  PAYMENT_PLAN_SEQUENCE_DUPLICATE: "CONTRACT_PAYMENT_PLAN_SEQUENCE_DUPLICATE",
  PAYMENT_PLAN_SEQUENCE_INVALID: "CONTRACT_PAYMENT_PLAN_SEQUENCE_INVALID",
  PAYMENT_PLAN_DOWN_PAYMENT_REQUIRED:
    "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_REQUIRED",
  COMMERCIAL_TERMS_IMMUTABLE: "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE",
  TOTAL_INVALID: "CONTRACT_TOTAL_INVALID",
  INVALID_STATUS_TRANSITION: "CONTRACT_INVALID_STATUS_TRANSITION",
} as const;

export function contractNotFound(details?: unknown) {
  return notFound("CONTRACT_NOT_FOUND", "Contract not found", details);
}

export function contractHandoverNotFound() {
  return notFound(
    "CONTRACT_HANDOVER_NOT_FOUND",
    "Contract not found for project handover",
  );
}

export function contractLinkExpired() {
  return notFound(
    "CONTRACT_LINK_EXPIRED",
    "Contract not found or the link has expired",
  );
}

export function contractPdfRequired() {
  return badRequest("CONTRACT_PDF_REQUIRED", "PDF file is required");
}

export function contractVersionPdfRequired() {
  return badRequest(
    "CONTRACT_VERSION_PDF_REQUIRED",
    "PDF file is required for a new version",
  );
}

export function contractPmRequired() {
  return badRequest(
    "CONTRACT_PM_REQUIRED",
    "Cannot auto-create project without an active PM account",
  );
}

export function contractNotSignedForActivation(currentStatus: string) {
  return badRequest(
    "CONTRACT_NOT_SIGNED",
    `Contract must be SIGNED to activate (current: ${currentStatus})`,
    { currentStatus, requiredStatus: "SIGNED" },
  );
}

export function contractNotSignable() {
  return badRequest(
    "CONTRACT_NOT_SIGNABLE",
    "This contract cannot be signed in its current state",
  );
}

export function contractNotConvertible(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.NOT_CONVERTIBLE,
    "Contract cannot be converted in its current state.",
    details,
  );
}

export function contractAlreadyConverted(details: unknown) {
  return conflict(
    CONTRACT_HANDOFF_CODES.ALREADY_CONVERTED,
    "Contract has already been converted.",
    details,
  );
}

export function contractRequestRequired(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.REQUEST_REQUIRED,
    "A request is required to create a contract.",
    details,
  );
}

export function contractProposalRequired(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.PROPOSAL_REQUIRED,
    "A proposal is required for this contract operation.",
    details,
  );
}

export function contractPaymentPlanSequenceDuplicate(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.PAYMENT_PLAN_SEQUENCE_DUPLICATE,
    "Payment plan sequence values must be unique within a contract.",
    details,
  );
}

export function contractPaymentPlanSequenceInvalid(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.PAYMENT_PLAN_SEQUENCE_INVALID,
    "Payment plan sequence must be a non-negative integer.",
    details,
  );
}

export function contractPaymentPlanDownPaymentRequired(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.PAYMENT_PLAN_DOWN_PAYMENT_REQUIRED,
    "The contract down payment must be paid before activation.",
    details,
  );
}

export function contractCommercialTermsImmutable(details?: unknown) {
  return conflict(
    CONTRACT_HANDOFF_CODES.COMMERCIAL_TERMS_IMMUTABLE,
    "Contract commercial terms cannot be changed after signing or invoice issuance.",
    details,
  );
}

export function contractTotalInvalid(details?: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.TOTAL_INVALID,
    "Contract total value must be a finite number greater than or equal to zero.",
    details,
  );
}

export function contractInvalidStatusTransition(details: unknown) {
  return badRequest(
    CONTRACT_HANDOFF_CODES.INVALID_STATUS_TRANSITION,
    "Contract status transition is not allowed.",
    details,
  );
}

export function contractPaymentPlanRowNotFound() {
  return notFound(
    "CONTRACT_PAYMENT_PLAN_ROW_NOT_FOUND",
    "Payment plan row not found",
  );
}

export function contractPaymentPlanDownPaymentDuplicate(details: unknown) {
  return badRequest(
    "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_DUPLICATE",
    "A contract may have at most one ON_SIGN down payment plan row.",
    details,
  );
}

export function contractPaymentPlanPercentInvalid(details: unknown) {
  return badRequest(
    "CONTRACT_PAYMENT_PLAN_PERCENT_INVALID",
    "Payment plan percentage must be between 0 and 100.",
    details,
  );
}

export function contractPaymentPlanAmountInvalid(details: unknown) {
  return badRequest(
    "CONTRACT_PAYMENT_PLAN_AMOUNT_INVALID",
    "Payment plan amount must be zero or greater.",
    details,
  );
}

export function contractPaymentPlanDownPaymentExceedsTotal(details: unknown) {
  return badRequest(
    "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL",
    "Down payment cannot exceed the contract total value.",
    details,
  );
}
