import { ValidEmail } from 'src/common/validations/valid-email.decorator';
import { ValidName } from 'src/common/validations/valid-name.decorator';
import { StrongPassword } from 'src/common/validations/strong-password.decorator';

export class SignupDto {
  @ValidName()
  name!: string;

  @ValidEmail()
  email!: string;

  @StrongPassword()
  password!: string;
}
