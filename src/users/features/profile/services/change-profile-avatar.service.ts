import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { ImageModerationService } from 'src/moderation/services/image-moderation.service';
import { MediaUploadService } from 'src/media/services/media-upload.service';
import { MediaDeleteService } from 'src/media/services/media-delete.service';
import { evaluateContentSeverity } from 'src/moderation/utils/moderation-threshold.util';
import type {
  ChangeAvatarParams,
  ChangeAvatarResult,
} from '../types/my-profile.types';

@Injectable()
export class ChangeProfileAvatarService {
  private readonly logger = new Logger(ChangeProfileAvatarService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly imageModerationService: ImageModerationService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly mediaDeleteService: MediaDeleteService,
  ) {}

  async execute(params: ChangeAvatarParams): Promise<ChangeAvatarResult> {
    this.logger.log(`Changing avatar for user ${params.userId} started`);
    if (!params.stream) {
      this.logger.warn(`Avatar is required`);
      throw new BadRequestException('AVATAR_REQUIRED');
    }

    const user = await this.usersService.ensureUserExists(params.userId);

    const upload = await this.mediaUploadService.execute({
      stream: params.stream,
      folder: 'CHAT-SYSTEM/avatars',
    });

    try {
      const moderation = await this.imageModerationService.moderate({
        url: upload.url,
        contentId: randomUUID(),
        authorId: user.id,
        metadata: { kind: 'avatar' },
      });

      const severityScore =
        (moderation.evaluation as { severity?: number } | undefined)
          ?.severity ?? 0;
      const decision = evaluateContentSeverity(severityScore, 'image');

      if (moderation.flagged || decision === 'rejected') {
        await this.mediaDeleteService
          .execute(upload.publicId)
          .catch(() => undefined);
        this.logger.warn(`Avatar moderation rejected`, moderation);
        throw new BadRequestException('REJECTED');
      }

      await this.usersRepository.update(
        { id: user.id },
        {
          avatarUrl: upload.url,
          avatarPublicId: upload.publicId,
        },
      );

      if (user.avatarPublicId && user.avatarPublicId !== upload.publicId) {
        await this.mediaDeleteService
          .execute(user.avatarPublicId)
          .catch(() => undefined);
        this.logger.log(`old avatar deleted`);
      }

      return { avatarUrl: upload.url, publicId: upload.publicId };
    } catch (error) {
      if (upload.publicId) {
        await this.mediaDeleteService
          .execute(upload.publicId)
          .catch(() => undefined);
      }
      this.logger.warn(`Avatar moderation failed`, error);
      throw new BadRequestException('FAILED');
    }
  }
}
