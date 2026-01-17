import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token is required' })
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @IsString({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword!: string;
}
