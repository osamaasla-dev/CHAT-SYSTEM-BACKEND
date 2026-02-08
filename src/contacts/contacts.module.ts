import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { ContactRepository } from './repositories/contact.repository';
import { CreateContactService } from './services/create-contact.service';
import { DeleteContactService } from './services/delete-contact.service';
import { GetContactsService } from './services/get-contacts.service';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [PrismaModule, CommonModule, SessionsModule],
  controllers: [ContactsController],
  providers: [
    ContactRepository,
    CreateContactService,
    DeleteContactService,
    GetContactsService,
  ],
})
export class ContactsModule {}
