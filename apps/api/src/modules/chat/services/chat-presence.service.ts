import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

type PresenceRecord = { sockets: Set<string>; lastSeenAt: Date };

@Injectable()
export class ChatPresenceService {
  private readonly records = new Map<string, PresenceRecord>();

  constructor(private readonly prisma: PrismaService) {}

  isOnline(userId: string) {
    return (this.records.get(userId)?.sockets.size ?? 0) > 0;
  }

  lastSeenAt(userId: string, fallback: Date | null | undefined) {
    return this.records.get(userId)?.lastSeenAt ?? fallback ?? null;
  }

  async connect(userId: string, socketId: string) {
    const record = this.records.get(userId) ?? {
      sockets: new Set<string>(),
      lastSeenAt: new Date(),
    };
    const wasOffline = record.sockets.size === 0;
    record.sockets.add(socketId);
    record.lastSeenAt = new Date();
    this.records.set(userId, record);
    if (wasOffline)
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: record.lastSeenAt },
      });
    return wasOffline;
  }

  async heartbeat(userId: string, socketId: string) {
    const record = this.records.get(userId);
    if (!record?.sockets.has(socketId)) return false;
    record.lastSeenAt = new Date();
    return true;
  }

  async disconnect(userId: string, socketId: string) {
    const record = this.records.get(userId);
    if (!record) return null;
    record.sockets.delete(socketId);
    record.lastSeenAt = new Date();
    if (record.sockets.size > 0) return null;
    this.records.delete(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: record.lastSeenAt },
    });
    return record.lastSeenAt;
  }
}
