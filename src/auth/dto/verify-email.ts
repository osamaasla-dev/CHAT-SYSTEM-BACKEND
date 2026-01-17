import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Token is required' })
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;
}
