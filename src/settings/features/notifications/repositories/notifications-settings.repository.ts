import { Injectable } from '@nestjs/common';
import { Prisma, NotificationSettings } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  update(
    where: Prisma.NotificationSettingsWhereUniqueInput,
    data: Prisma.NotificationSettingsUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationSettings> {
    return this.getClient(tx).notificationSettings.update({ where, data });
  }

  create(
    data: Prisma.NotificationSettingsUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationSettings> {
    return this.getClient(tx).notificationSettings.create({ data });
  }

  findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationSettings | null> {
    return this.getClient(tx).notificationSettings.findUnique({
      where: { userId },
    });
  }
}
