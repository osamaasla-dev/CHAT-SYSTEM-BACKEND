import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../../repositories/users.repository';
import { UsersService } from '../../users.service';

interface ResetTokenPayload {
  userId: string;
  digest: string;
  expiresAt: Date;
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class UserAuthPasswordService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async findByResetPasswordTokenDigest(
    digest: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ resetPasswordToken: digest }, tx);
  }

  async setResetPasswordToken(payload: ResetTokenPayload): Promise<User> {
    const { userId, digest, expiresAt, tx } = payload;
    return this.usersRepository.update(
      { id: userId },
      {
        resetPasswordToken: digest,
        resetPasswordExpiresAt: expiresAt,
      },
      tx,
    );
  }

  async clearResetPasswordToken(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return this.usersRepository.update(
      { id: userId },
      {
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
      tx,
    );
  }

  async updatePassword(
    userId: string,
    hashedPassword: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    await this.usersService.ensureUserExists(userId, tx);
    return this.usersRepository.update(
      { id: userId },
      { password: hashedPassword, passwordChangedAt: new Date() },
      tx,
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.ensureUserExists(userId);

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password || '',
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('INVALID_CURRENT_PASSWORD');
    }

    if (currentPassword === newPassword) {
      throw new UnauthorizedException('PASSWORD_SAME');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(
      { id: userId },
      { password: hashedPassword, passwordChangedAt: new Date() },
    );
  }
}
