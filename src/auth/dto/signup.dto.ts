import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';

export class SignupDto {
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email must be a valid email' })
  email!: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
