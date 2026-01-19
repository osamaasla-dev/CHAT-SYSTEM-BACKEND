import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  findMany(
    args: Prisma.UserFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<User[]> {
    return this.getClient(tx).user.findMany(args);
  }

  findUnique(
    where: Prisma.UserWhereUniqueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.getClient(tx).user.findUnique({ where });
  }

  create(
    data: Prisma.UserUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return this.getClient(tx).user.create({ data });
  }

  update(
    where: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).user.update({ where, data });
  }

  delete(where: Prisma.UserWhereUniqueInput, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).user.delete({ where });
  }
}
