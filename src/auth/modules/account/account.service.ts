import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { SignupService } from './services/signup.service';
import { LoginService } from './services/login.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly signupService: SignupService,
    private readonly loginService: LoginService,
  ) {}

  async signup(name: string, email: string, password: string) {
    return this.signupService.execute({ name, email, password });
  }

  async login(email: string, password: string, response: FastifyReply) {
    return this.loginService.execute({ email, password, response });
  }
}
