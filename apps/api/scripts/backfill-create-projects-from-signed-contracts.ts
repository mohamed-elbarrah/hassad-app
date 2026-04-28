import { PrismaClient } from '@prisma/client';

// Idempotent backfill: for every SIGNED contract without a linked project,
// create a Project, add the PM as ProjectMember, and emit notifications.
// Exit with non-zero code if any error occurs so the branch is NOT merged.

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting backfill: create projects for SIGNED contracts without projects');

    const contracts = await prisma.contract.findMany({
      where: { status: 'SIGNED', projects: { none: {} } },
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true, accountManager: true, leadId: true },
        },
      },
      orderBy: { signedAt: 'asc' },
    });

    if (contracts.length === 0) {
      console.log('No signed contracts without projects found. Nothing to do.');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`Found ${contracts.length} contract(s) to process.`);

    const errors: Array<{ contractId: string; error: any }> = [];
    let createdCount = 0;
    for (const contract of contracts) {
      console.log(`Processing contract ${contract.id} (${contract.title})`);
      try {
        const managerCandidates = [contract.client.accountManager, contract.createdBy].filter(Boolean) as string[];

        const preferredManagers =
          managerCandidates.length === 0
            ? []
            : await prisma.user.findMany({
                where: {
                  id: { in: managerCandidates },
                  isActive: true,
                  role: { name: 'PM' },
                },
                select: { id: true },
              });

        let projectManagerId =
          preferredManagers.find((c) => c.id === contract.client.accountManager)?.id ??
          preferredManagers.find((c) => c.id === contract.createdBy)?.id;

        let fallbackUsed = false;
        if (!projectManagerId) {
          const fallbackPm = await prisma.user.findFirst({
            where: { isActive: true, role: { name: 'PM' } },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          });

          if (!fallbackPm) {
            throw new Error('No active PM account available to assign project manager');
          }
          fallbackUsed = true;
          projectManagerId = fallbackPm.id;
        }

        const projectName = `${contract.client.companyName} — ${contract.title}`;
        const projectDescription = [
          `Auto-created after signing contract: ${contract.title}`,
          `Client contact: ${contract.client.contactName || 'N/A'}`,
          `Backfill createdAt: ${new Date().toISOString()}`,
        ].join('\n');

        const project = await prisma.$transaction(async (tx) => {
          const existing = await tx.project.findFirst({ where: { contractId: contract.id }, select: { id: true } });
          if (existing) return null;

          const created = await tx.project.create({
            data: {
              clientId: contract.client.id,
              contractId: contract.id,
              projectManagerId,
              name: projectName,
              description: projectDescription,
              status: 'PLANNING',
              priority: 'NORMAL',
              startDate: contract.startDate ?? undefined,
              endDate: contract.endDate ?? undefined,
            },
          });

          await tx.projectMember.create({
            data: { projectId: created.id, userId: projectManagerId, role: 'MANAGER' },
          });

          const event = await tx.notificationEvent.create({
            data: {
              entityId: created.id,
              entityType: 'project',
              eventType: 'PROJECT_CREATED_FROM_CONTRACT',
              metadata: {
                contractId: contract.id,
                clientId: contract.client.id,
                backfill: true,
              },
            },
          });

          await tx.notification.create({
            data: {
              eventId: event.id,
              userId: projectManagerId,
              title: 'تم إنشاء مشروع جديد تلقائياً',
              body: `تم إنشاء مشروع "${created.name}" بعد توقيع العقد. يمكنك الآن توزيع المهام على الفريق.`,
              channel: 'in-app',
              sentAt: new Date(),
            },
          });

          return created;
        });

        if (project) {
          createdCount += 1;
          console.log(`Created project ${project.id} for contract ${contract.id}`);
        } else {
          console.log(`Skipped contract ${contract.id}, project already exists`);
        }

        if (fallbackUsed) {
          // Broadcast to ADMIN and SALES that a fallback PM was used
          const targets = await prisma.user.findMany({ where: { isActive: true, role: { name: { in: ['ADMIN', 'SALES'] } } }, select: { id: true } });
          if (targets.length > 0) {
            const ev = await prisma.notificationEvent.create({ data: { entityId: 'broadcast', entityType: 'system', eventType: 'BROADCAST', metadata: { source: 'backfill', contractId: contract.id, projectId: project?.id } } });
            await prisma.notification.createMany({
              data: targets.map((u) => ({
                eventId: ev.id,
                userId: u.id,
                title: 'تعيين مدير مشروع احتياطي',
                body: `تم إنشاء مشروع تلقائياً من العقد "${contract.title}" وتم تعيين مدير مشروع احتياطي بسبب عدم توفر PM مرتبط بالعميل.`,
                channel: 'in-app',
                sentAt: new Date(),
              })),
            });
          }
        }
      } catch (err) {
        console.error(`Error processing contract ${contract.id}:`, err);
        errors.push({ contractId: contract.id, error: err });
      }
    }

    console.log(`Backfill complete. Projects created: ${createdCount}. Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors encountered during backfill. Aborting with non-zero exit code.');
      errors.slice(0, 5).forEach((e) => console.error(e.contractId, e.error));
      await prisma.$disconnect();
      process.exit(1);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during backfill:', err);
    process.exit(1);
  }
}

main();
