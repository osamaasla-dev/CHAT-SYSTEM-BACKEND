import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { UsersRepository } from './repositories/users.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private async ensureUserExists(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const user = await this.findById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(tx?: Prisma.TransactionClient): Promise<User[]> {
    const users = await this.usersRepository.findMany({}, tx);
    return users;
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ id }, tx);
  }

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ email }, tx);
  }

  async findByPendingEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ pendingEmail: email }, tx);
  }

  async findByUsername(
    username: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ username }, tx);
  }

  async createUser(
    data: Prisma.UserUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return this.usersRepository.create(data, tx);
  }

  async findByVerificationTokenDigest(
    digest: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique(
      { emailVerificationToken: digest },
      tx,
    );
  }

  async markEmailVerified(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const user = await this.ensureUserExists(userId, tx);

    return this.usersRepository.update(
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
  ): Promise<User> {
    return this.usersRepository.update(
      { id: userId },
      {
        emailVerificationToken: digest,
        emailVerificationExpiresAt: expiresAt,
        emailVerifiedAt: null,
      },
    );
  }

  async findByResetPasswordTokenDigest(digest: string): Promise<User | null> {
    return this.usersRepository.findUnique({ resetPasswordToken: digest });
  }

  async setResetPasswordToken(
    userId: string,
    digest: string,
    expiresAt: Date,
  ): Promise<User> {
    return this.usersRepository.update(
      { id: userId },
      {
        resetPasswordToken: digest,
        resetPasswordExpiresAt: expiresAt,
      },
    );
  }

  async clearResetPasswordToken(userId: string): Promise<User> {
    return this.usersRepository.update(
      { id: userId },
      {
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    );
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    await this.ensureUserExists(id);
    return this.usersRepository.update(
      { id },
      { password: hashedPassword, passwordChangedAt: new Date() },
    );
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.ensureUserExists(id);

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password || '',
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(
      { id },
      { password: hashedPassword, passwordChangedAt: new Date() },
    );
  }

  async changeEmail(
    userId: string,
    params: {
      pendingEmail: string;
      verificationDigest: string;
      verificationExpiresAt: Date;
    },
  ): Promise<User> {
    const user = await this.ensureUserExists(userId);

    if (user.email === params.pendingEmail) {
      throw new BadRequestException('New email must be different');
    }

    const existingUser = await this.findByEmail(params.pendingEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const pendingEmailOwner = await this.findByPendingEmail(
      params.pendingEmail,
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
    );
  }

  async refreshPendingUser(
    userId: string,
    params: {
      name: string;
      hashedPassword: string;
      verificationDigest: string;
      verificationExpiresAt: Date;
    },
  ): Promise<User> {
    return this.usersRepository.update(
      { id: userId },
      {
        name: params.name,
        password: params.hashedPassword,
        status: UserStatus.PENDING,
        emailVerificationToken: params.verificationDigest,
        emailVerificationExpiresAt: params.verificationExpiresAt,
        emailVerifiedAt: null,
        pendingEmail: null,
      },
    );
  }

  async updateLastLoginAt(
    userId: string,
    date: Date = new Date(),
  ): Promise<User> {
    await this.ensureUserExists(userId);
    return this.usersRepository.update(
      { id: userId },
      {
        lastLoginAt: date,
      },
    );
  }

  async generateUniqueUsername(name: string): Promise<string> {
    const base = this.normalizeNameForUsername(name);
    const suffix = Date.now().toString().slice(-6);
    let candidate = `${base}${suffix}`;
    let counter = 0;

    while (await this.findByUsername(candidate)) {
      counter += 1;
      candidate = `${base}${suffix}${counter}`;
    }

    return candidate;
  }

  private normalizeNameForUsername(name: string): string {
    const normalized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20);

    return normalized || `user${Date.now().toString().slice(-4)}`;
  }
}
