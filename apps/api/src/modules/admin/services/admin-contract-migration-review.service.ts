import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ResolveContractMigrationReviewDto } from "../dto/contract-migration-review.dto";

@Injectable()
export class AdminContractMigrationReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeResolved = false) {
    const reviews = await this.prisma.legacyContractMigrationReview.findMany({
      where: includeResolved ? undefined : { resolvedAt: null },
      orderBy: { createdAt: "asc" },
    });

    const contractIds = reviews.map((review) => review.contractId);
    const contracts = await this.prisma.contract.findMany({
      where: { id: { in: contractIds } },
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        createdAt: true,
        requestId: true,
        client: { select: { id: true, companyName: true } },
      },
    });
    const contractById = new Map(contracts.map((contract) => [contract.id, contract]));

    const candidateIds = reviews.flatMap((review) =>
      Array.isArray(review.candidateRequestIds)
        ? review.candidateRequestIds.filter((id): id is string => typeof id === "string")
        : [],
    );
    const requests = await this.prisma.request.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, companyName: true, status: true, createdAt: true, clientId: true },
    });
    const requestById = new Map(requests.map((request) => [request.id, request]));

    return reviews.map((review) => ({
      ...review,
      contract: contractById.get(review.contractId) ?? null,
      candidates: (Array.isArray(review.candidateRequestIds) ? review.candidateRequestIds : [])
        .filter((id): id is string => typeof id === "string")
        .map((id) => requestById.get(id))
        .filter(Boolean),
    }));
  }

  async resolve(
    reviewId: string,
    dto: ResolveContractMigrationReviewDto,
    adminId: string,
  ) {
    const review = await this.prisma.legacyContractMigrationReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException("Contract migration review not found");
    if (review.resolvedAt) throw new BadRequestException("Review is already resolved");

    const candidates = Array.isArray(review.candidateRequestIds)
      ? review.candidateRequestIds.filter((id): id is string => typeof id === "string")
      : [];
    if (!candidates.includes(dto.requestId)) {
      throw new BadRequestException("Request is not a candidate for this contract");
    }

    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
      select: { id: true, clientId: true },
    });
    if (!request) throw new NotFoundException("Request not found");

    const contract = await this.prisma.contract.findUnique({
      where: { id: review.contractId },
      select: { id: true, clientId: true, requestId: true },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    if (contract.clientId !== request.clientId) {
      throw new BadRequestException("Request and contract belong to different clients");
    }
    if (contract.requestId && contract.requestId !== request.id) {
      throw new BadRequestException("Contract is already linked to another request");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id: contract.id },
        data: { requestId: request.id },
        select: { id: true, requestId: true },
      });
      const updatedReview = await tx.legacyContractMigrationReview.update({
        where: { id: review.id },
        data: {
          resolvedRequestId: request.id,
          resolvedAt: new Date(),
        },
      });
      await tx.ledger.create({
        data: {
          action: "crm.contract-migration.resolve",
          entity: "contract",
          entityId: contract.id,
          userId: adminId,
          after: { requestId: request.id, migrationReviewId: review.id },
        },
      });
      return { contract: updatedContract, review: updatedReview };
    });
  }

  async createRequestForUnmatchedContract(reviewId: string, adminId: string) {
    const review = await this.prisma.legacyContractMigrationReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException("Contract migration review not found");
    if (review.resolvedAt) throw new BadRequestException("Review is already resolved");

    const contract = await this.prisma.contract.findUnique({
      where: { id: review.contractId },
      select: {
        id: true,
        clientId: true,
        requestId: true,
        title: true,
        client: {
          select: {
            id: true,
            companyName: true,
            businessName: true,
            businessType: true,
            userId: true,
            user: { select: { name: true, email: true, phoneWhatsapp: true } },
          },
        },
      },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    if (contract.requestId) throw new BadRequestException("Contract is already linked");

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.request.create({
        data: {
          clientId: contract.clientId,
          submittedBy: adminId,
          companyName: contract.client.companyName,
          contactName: contract.client.user?.name ?? contract.client.companyName,
          phoneWhatsapp: contract.client.user?.phoneWhatsapp ?? "",
          email: contract.client.user?.email ?? undefined,
          businessName: contract.client.businessName,
          businessType: contract.client.businessType,
          source: "DIRECT",
          notes: `Created explicitly while reconciling legacy contract: ${contract.title}`,
          status: "SIGNED",
          crmStage: "SIGNED",
        },
      });
      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          toStatus: "SIGNED",
          changedBy: adminId,
          note: "Request created during explicit legacy contract reconciliation",
        },
      });
      await tx.contract.update({ where: { id: contract.id }, data: { requestId: request.id } });
      const existingCandidates = Array.isArray(review.candidateRequestIds)
        ? review.candidateRequestIds.filter((id): id is string => typeof id === "string")
        : [];
      const updatedReview = await tx.legacyContractMigrationReview.update({
        where: { id: review.id },
        data: {
          candidateRequestIds: [...existingCandidates, request.id],
          resolvedRequestId: request.id,
          resolvedAt: new Date(),
        },
      });
      await tx.ledger.create({
        data: {
          action: "crm.contract-migration.create-request",
          entity: "contract",
          entityId: contract.id,
          userId: adminId,
          after: { requestId: request.id, migrationReviewId: review.id },
        },
      });
      return { contractId: contract.id, request, review: updatedReview };
    });
  }
}
