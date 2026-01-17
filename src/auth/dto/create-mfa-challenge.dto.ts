import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateMfaChallengeDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
