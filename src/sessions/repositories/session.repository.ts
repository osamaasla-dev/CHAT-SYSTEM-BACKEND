import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Session } from '@prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  updateMany(
    where: Prisma.SessionUpdateManyArgs['where'],
    data: Prisma.SessionUpdateManyMutationInput,
  ) {
    return this.prisma.session.updateMany({ where, data });
  }

  findUnique(where: Prisma.SessionWhereUniqueInput): Promise<Session | null> {
    return this.prisma.session.findUnique({ where });
  }

  findMany(args: Prisma.SessionFindManyArgs): Promise<Session[]> {
    return this.prisma.session.findMany(args);
  }

  update(
    where: Prisma.SessionWhereUniqueInput,
    data: Prisma.SessionUpdateInput,
  ): Promise<Session> {
    return this.prisma.session.update({ where, data });
  }
}
