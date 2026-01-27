import { applyDecorators } from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';

export function ValidEmail() {
  return applyDecorators(
    IsNotEmpty({ message: 'Email cannot be empty' }),
    IsEmail({}, { message: 'Email must be a valid email' }),
  );
}
