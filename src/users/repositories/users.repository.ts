import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(args: Prisma.UserFindManyArgs): Promise<User[]> {
    return this.prisma.user.findMany(args);
  }

  findUnique(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({ where });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where, data });
  }

  delete(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({ where });
  }
}
