import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name!: string;

  @IsEmail({}, { message: 'Email must be a valid email' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
