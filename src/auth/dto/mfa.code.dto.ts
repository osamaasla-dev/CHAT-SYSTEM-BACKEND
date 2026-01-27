import { IsString, MinLength, Matches } from 'class-validator';
import { MFA_CODE_LENGTH } from '../constants/mfa.constants';

export class MfaCodeDto {
  @IsString({ message: 'MFA code is required' })
  @MinLength(MFA_CODE_LENGTH, {
    message: `MFA code must be at least ${MFA_CODE_LENGTH} characters`,
  })
  @Matches(/^\d+$/, { message: 'MFA code must contain only numbers' })
  code!: string;
}
