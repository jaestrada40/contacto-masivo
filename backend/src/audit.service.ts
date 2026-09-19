import { Injectable } from '@nestjs/common'; import { PrismaService } from './prisma.service';
@Injectable() export class AuditService { constructor(private prisma: PrismaService) {} async log(userId: string | undefined, action: string, entity: string, entityId: string, metadata?: object) { await this.prisma.auditLog.create({ data: { userId, action, entity, entityId, metadata } }); } }
