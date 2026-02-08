import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { CONTACTS_RATE_LIMITS } from '../constants/rate-limit.constants';
import { ContactRepository } from '../repositories/contact.repository';

@Injectable()
export class CreateContactService {
  private readonly logger = new Logger(CreateContactService.name);

  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(ownerId: string, contactId: string): Promise<void> {
    if (ownerId === contactId) {
      this.logger.warn('Invalid contact operation: ownerId equals contactId');
      throw new BadRequestException('Invalid contact operation');
    }

    const { keyPrefix, limit, windowSeconds } =
      CONTACTS_RATE_LIMITS.createContact;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: ownerId,
      limit,
      windowSeconds,
      logContext: `contacts:create ownerId=${ownerId} contactId=${contactId}`,
    });

    this.logger.log(
      `Attempting to create contact: ownerId=${ownerId}, contactId=${contactId} started`,
    );

    try {
      await this.contactRepository.create({
        ownerId,
        contactId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create contact: ownerId=${ownerId}, contactId=${contactId}`,
        error,
      );

      throw new BadRequestException('FAILED');
    }

    this.logger.log(
      `Contact created successfully: ownerId=${ownerId}, contactId=${contactId}`,
    );
  }
}
