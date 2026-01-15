import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
