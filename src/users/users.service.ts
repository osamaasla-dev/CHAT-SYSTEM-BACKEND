import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ id }, tx);
  }

  async findByUsername(
    username: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ username }, tx);
  }

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ email }, tx);
  }

  async findByPendingEmail(
    pendingEmail: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return this.usersRepository.findUnique({ pendingEmail }, tx);
  }

  async ensureUserExists(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const user = await this.findById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
