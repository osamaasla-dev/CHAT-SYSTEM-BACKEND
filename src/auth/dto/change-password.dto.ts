import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Current password is required' })
  @MinLength(6, { message: 'Current password must be at least 6 characters' })
  currentPassword!: string;

  @IsString({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword!: string;
}
