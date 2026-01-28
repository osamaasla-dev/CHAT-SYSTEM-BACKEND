import { IsNotEmpty, IsString } from 'class-validator';

import { StrongPassword } from 'src/common/validations/strong-password.decorator';

export class ResetPasswordDto {
  @IsString({ message: 'Token is required' })
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @StrongPassword()
  password!: string;
}
