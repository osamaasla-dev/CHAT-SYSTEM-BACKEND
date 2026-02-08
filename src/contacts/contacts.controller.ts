import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { CreateContactService } from './services/create-contact.service';
import { DeleteContactService } from './services/delete-contact.service';
import { GetContactsService } from './services/get-contacts.service';
import { GetContactsDto } from './dto/get-contacts.dto';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly createContactService: CreateContactService,
    private readonly deleteContactService: DeleteContactService,
    private readonly getContactsService: GetContactsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async getMyContacts(
    @CurrentUser() user: CurrentUserType,
    @Query() query: GetContactsDto,
  ) {
    return await this.getContactsService.execute({
      ownerId: user.id,
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async createContact(
    @CurrentUser() user: CurrentUserType,
    @Body('contactId') contactId: string,
  ) {
    return await this.createContactService.execute(user.id, contactId);
  }

  @Delete(':contactId')
  @UseGuards(JwtAuthGuard, JwtSessionGuard)
  async deleteContact(
    @CurrentUser() user: CurrentUserType,
    @Param('contactId') contactId: string,
  ) {
    return await this.deleteContactService.execute(user.id, contactId);
  }
}
