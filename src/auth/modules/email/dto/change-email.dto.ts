import { ValidEmail } from 'src/common/validations/valid-email.decorator';

export class ChangeEmailDto {
  @ValidEmail()
  newEmail!: string;
}
