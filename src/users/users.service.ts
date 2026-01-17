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

  private async ensureUserExists(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.findMany({});
    return users;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findUnique({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findUnique({ email });
  }

  async findByPendingEmail(email: string): Promise<User | null> {
    return this.usersRepository.findUnique({ pendingEmail: email });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByVerificationTokenDigest(digest: string): Promise<User | null> {
    return this.usersRepository.findUnique({ emailVerificationToken: digest });
  }

  async markEmailVerified(userId: string): Promise<User> {
    const user = await this.ensureUserExists(userId);

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
      user.password,
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
}
