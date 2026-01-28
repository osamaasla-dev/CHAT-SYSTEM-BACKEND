import { ValidName } from 'src/common/validations/valid-name.decorator';

export class ChangeNameDto {
  @ValidName()
  name!: string;
}
