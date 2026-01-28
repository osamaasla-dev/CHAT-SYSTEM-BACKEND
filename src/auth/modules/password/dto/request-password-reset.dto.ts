import { ValidEmail } from 'src/common/validations/valid-email.decorator';

export class RequestPasswordResetDto {
  @ValidEmail()
  email!: string;
}
