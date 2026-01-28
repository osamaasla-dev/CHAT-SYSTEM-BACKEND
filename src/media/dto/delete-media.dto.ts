import { IsString } from 'class-validator';

export class DeleteMediaDto {
  @IsString()
  publicId!: string;
}
