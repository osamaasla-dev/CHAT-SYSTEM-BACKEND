import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Session } from '@prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  create(
    data: Prisma.SessionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Session> {
    return this.getClient(tx).session.create({ data });
  }

  updateMany(
    where: Prisma.SessionUpdateManyArgs['where'],
    data: Prisma.SessionUpdateManyMutationInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).session.updateMany({ where, data });
  }

  findUnique(
    where: Prisma.SessionWhereUniqueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Session | null> {
    return this.getClient(tx).session.findUnique({ where });
  }

  findMany(
    args: Prisma.SessionFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Session[]> {
    return this.getClient(tx).session.findMany(args);
  }

  update(
    where: Prisma.SessionWhereUniqueInput,
    data: Prisma.SessionUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Session> {
    return this.getClient(tx).session.update({ where, data });
  }
}
