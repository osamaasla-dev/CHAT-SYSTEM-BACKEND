import { IsString, Matches } from 'class-validator';

import { StrongPassword } from 'src/common/validations/strong-password.decorator';

export class ChangePasswordDto {
  @Matches(/^\S+$/, { message: 'Current password must not contain spaces' })
  @IsString({ message: 'Current password is required' })
  currentPassword!: string;

  @StrongPassword()
  newPassword!: string;
}
