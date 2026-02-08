import { Injectable } from '@nestjs/common';
import { Prisma, PrivacySettings } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrivacySettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  update(
    where: Prisma.PrivacySettingsWhereUniqueInput,
    data: Prisma.PrivacySettingsUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PrivacySettings> {
    return this.getClient(tx).privacySettings.update({ where, data });
  }

  create(
    data: Prisma.PrivacySettingsUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PrivacySettings> {
    return this.getClient(tx).privacySettings.create({ data });
  }

  findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PrivacySettings | null> {
    return this.getClient(tx).privacySettings.findUnique({ where: { userId } });
  }
}
