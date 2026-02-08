import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export function ValidUsername(minLength = 6) {
  return applyDecorators(
    IsNotEmpty({ message: 'Username cannot be empty' }),
    IsString({ message: 'Username must be a string' }),
    MinLength(minLength, {
      message: `Username must be at least ${minLength} characters long`,
    }),
    Matches(/^[a-zA-Z0-9]+$/, {
      message: 'Username must contain only letters and numbers',
    }),
  );
}
