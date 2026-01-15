import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import type { FindAllResponse } from './types/user.type';
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

  async findAll(options: {
    limit: number;
    cursor?: string;
  }): Promise<FindAllResponse> {
    const users = await this.usersRepository.findMany({
      take: options.limit + 1,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      orderBy: {
        id: 'asc',
      },
    });
    let nextCursor: string | null = null;
    if (users.length > options.limit) {
      nextCursor = users.pop()?.id || null;
    }
    return { items: users, meta: { limit: options.limit, nextCursor } };
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findUnique({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findUnique({ email });
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.usersRepository.create(data);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    await this.ensureUserExists(id);
    return this.usersRepository.update({ id }, { password: hashedPassword });
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
    await this.usersRepository.update({ id }, { password: hashedPassword });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (user?.email === dto.email) {
      throw new ConflictException('Email already exists');
    }
    return this.usersRepository.update({ id }, dto);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete({ id });
  }
}
