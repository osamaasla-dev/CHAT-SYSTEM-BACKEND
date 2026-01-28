import { IsString } from 'class-validator';

export class ModerateTextDto {
  @IsString()
  text!: string;
}
