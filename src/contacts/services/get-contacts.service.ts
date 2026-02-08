import { Injectable, Logger } from '@nestjs/common';
import { ContactRepository } from '../repositories/contact.repository';
import { ContactsResult, GetContactsParams } from '../types/contacts.types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class GetContactsService {
  private readonly logger = new Logger(GetContactsService.name);

  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(params: GetContactsParams): Promise<ContactsResult> {
    const { ownerId, cursor } = params;
    const requestedLimit = params.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    this.logger.log(
      `Fetching contacts for owner ${ownerId} limit=${limit} cursor=${
        cursor ?? 'null'
      }`,
    );

    const rows = await this.contactRepository.findContactsPaginated(
      ownerId,
      limit,
      cursor ?? undefined,
    );

    const nextCursor = rows.length > limit ? rows.pop()!.id : null;

    const items = rows.map((row) => {
      return {
        contactId: row.contactId,
        name: row.contact.name,
        username: row.contact.username,
        avatarUrl: row.contact.avatarUrl,
        status: row.contact.status,
        blockedAt:
          row.contact.blocksReceived.length > 0
            ? row.contact.blocksReceived[0].createdAt
            : null,
        addedAt: row.createdAt,
      };
    });

    this.logger.log('Fetching contacts success');

    return {
      items,
      meta: {
        limit,
        nextCursor,
      },
    };
  }
}
