import { Injectable } from '@nestjs/common';
import { Prisma, AuthProviderType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthProviderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  findByProvider(
    provider: AuthProviderType,
    providerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).authProvider.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).authProvider.findMany({
      where: { userId },
    });
  }

  create(
    data: Prisma.AuthProviderUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).authProvider.create({ data });
  }

  update(
    where: Prisma.AuthProviderWhereUniqueInput,
    data: Prisma.AuthProviderUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).authProvider.update({ where, data });
  }

  delete(
    where: Prisma.AuthProviderWhereUniqueInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).authProvider.delete({ where });
  }
}
