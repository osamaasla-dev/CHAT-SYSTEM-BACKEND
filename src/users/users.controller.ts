import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
