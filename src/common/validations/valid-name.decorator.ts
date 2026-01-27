import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export function ValidName(minLength = 2) {
  return applyDecorators(
    IsNotEmpty({ message: 'Name cannot be empty' }),
    IsString({ message: 'Name must be a string' }),
    MinLength(minLength, {
      message: `Name must be at least ${minLength} characters long`,
    }),
    Matches(/^[\p{L}\s'-]+$/u, {
      message: 'Name contains invalid characters',
    }),
  );
}
