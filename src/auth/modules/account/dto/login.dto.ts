import { ValidEmail } from 'src/common/validations/valid-email.decorator';
import { StrongPassword } from 'src/common/validations/strong-password.decorator';

export class LoginDto {
  @ValidEmail()
  email!: string;

  @StrongPassword()
  password!: string;
}
