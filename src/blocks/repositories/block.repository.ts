import { Injectable } from '@nestjs/common';
import { Block, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type BlockWithBlockedUser = Prisma.BlockGetPayload<{
  include: {
    blocked: {
      select: {
        id: true;
        name: true;
        username: true;
        avatarUrl: true;
        status: true;
      };
    };
  };
}>;

@Injectable()
export class BlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  create(
    data: Prisma.BlockUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Block> {
    return this.getClient(tx).block.create({ data });
  }

  delete(
    where: Prisma.BlockWhereUniqueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Block> {
    return this.getClient(tx).block.delete({ where });
  }

  findByPair(
    blockerId: string,
    blockedId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Block | null> {
    return this.getClient(tx).block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });
  }

  findByBlocker(
    blockerId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Block[]> {
    return this.getClient(tx).block.findMany({ where: { blockerId } });
  }

  findBlockedUsersPaginated(
    blockerId: string,
    limit: number,
    cursor?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<BlockWithBlockedUser[]> {
    return this.getClient(tx).block.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor } } : {}),
    });
  }

  countBlockedUsers(blockerId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).block.count({ where: { blockerId } });
  }
}
