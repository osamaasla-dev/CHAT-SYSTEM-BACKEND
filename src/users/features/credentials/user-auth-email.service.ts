import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { UsersRepository } from '../../repositories/users.repository';
import { UsersService } from '../../users.service';

@Injectable()
export class UserAuthEmailService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ email }, tx);
  }

  async findByVerificationTokenDigest(
    digest: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.usersRepository.findUnique(
      { emailVerificationToken: digest },
      tx,
    );
  }

  async findByPendingEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ pendingEmail: email }, tx);
  }
  async markEmailVerified(userId: string, tx?: Prisma.TransactionClient) {
    const user = await this.usersService.ensureUserExists(userId, tx);

    return await this.usersRepository.update(
      { id: userId },
      {
        email: user.pendingEmail ?? user.email,
        pendingEmail: null,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        status: UserStatus.ACTIVE,
      },
      tx,
    );
  }

  async updateEmailVerificationToken(
    userId: string,
    digest: string,
    expiresAt: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return await this.usersRepository.update(
      { id: userId },
      {
        emailVerificationToken: digest,
        emailVerificationExpiresAt: expiresAt,
        emailVerifiedAt: null,
      },
      tx,
    );
  }

  async changeEmail(
    userId: string,
    params: {
      pendingEmail: string;
      verificationDigest: string;
      verificationExpiresAt: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const user = await this.usersService.ensureUserExists(userId, tx);

    if (user.email === params.pendingEmail) {
      throw new BadRequestException('New email must be different');
    }

    const existingUser = await this.findByEmail(params.pendingEmail, tx);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const pendingEmailOwner = await this.findByPendingEmail(
      params.pendingEmail,
      tx,
    );
    if (pendingEmailOwner && pendingEmailOwner.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    return this.usersRepository.update(
      { id: userId },
      {
        pendingEmail: params.pendingEmail,
        emailVerificationToken: params.verificationDigest,
        emailVerificationExpiresAt: params.verificationExpiresAt,
      },
      tx,
    );
  }
}
