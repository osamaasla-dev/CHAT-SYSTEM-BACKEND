import { Injectable } from '@nestjs/common';
import { Contact, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

// Contact with the target user's basic public profile and block info
export type ContactWithUser = Prisma.ContactGetPayload<{
  include: {
    contact: {
      select: {
        id: true;
        name: true;
        username: true;
        avatarUrl: true;
        status: true;
        blocksReceived: {
          select: {
            blockerId: true;
            createdAt: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  create(
    data: Prisma.ContactUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Contact> {
    return this.getClient(tx).contact.create({ data });
  }

  delete(
    where: Prisma.ContactWhereUniqueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Contact> {
    return this.getClient(tx).contact.delete({ where });
  }

  findByPair(
    ownerId: string,
    contactId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Contact | null> {
    return this.getClient(tx).contact.findUnique({
      where: {
        ownerId_contactId: { ownerId, contactId },
      },
    });
  }

  findContactsPaginated(
    ownerId: string,
    limit: number,
    cursor?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ContactWithUser[]> {
    return this.getClient(tx).contact.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            status: true,
            blocksReceived: {
              where: {
                blockerId: ownerId,
              },
              select: {
                blockerId: true,
                createdAt: true,
              },
            },
          },
        },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor } } : {}),
    });
  }

  countContacts(ownerId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).contact.count({ where: { ownerId } });
  }
}
