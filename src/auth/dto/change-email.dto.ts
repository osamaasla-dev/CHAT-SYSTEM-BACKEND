import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty({ message: 'Email is required' })
  newEmail!: string;
}
