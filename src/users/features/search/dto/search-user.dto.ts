import { ValidUsername } from 'src/common/validations/valid-username.decorator';

export class SearchUserDto {
  @ValidUsername()
  username!: string;
}
