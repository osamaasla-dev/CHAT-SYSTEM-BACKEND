import { Injectable } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { UsersRepository } from '../../repositories/users.repository';
import { UsersService } from '../../users.service';
import { normalizeNameForUsername } from '../../utils/username';

interface RefreshPendingUserParams {
  userId: string;
  name: string;
  hashedPassword: string;
  verificationDigest: string;
  verificationExpiresAt: Date;
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class UserAuthAccountService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  createUser(
    data: Prisma.UserUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return this.usersRepository.create(data, tx);
  }

  async refreshPendingUser(params: RefreshPendingUserParams): Promise<User> {
    const {
      userId,
      name,
      hashedPassword,
      verificationDigest,
      verificationExpiresAt,
      tx,
    } = params;

    await this.usersService.ensureUserExists(userId, tx);

    return this.usersRepository.update(
      { id: userId },
      {
        name,
        password: hashedPassword,
        status: UserStatus.PENDING,
        emailVerificationToken: verificationDigest,
        emailVerificationExpiresAt: verificationExpiresAt,
        emailVerifiedAt: null,
        pendingEmail: null,
      },
      tx,
    );
  }

  async generateUniqueUsername(name: string): Promise<string> {
    const base = normalizeNameForUsername(name);
    const suffix = Date.now().toString().slice(-6);
    let candidate = `${base}${suffix}`;
    let counter = 0;

    while (await this.usersService.findByUsername(candidate)) {
      counter += 1;
      candidate = `${base}${suffix}${counter}`;
    }

    return candidate;
  }

  async updateLastLoginAt(
    userId: string,
    date: Date = new Date(),
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    await this.usersService.ensureUserExists(userId, tx);

    return this.usersRepository.update(
      { id: userId },
      {
        lastLoginAt: date,
      },
      tx,
    );
  }
}
