import { Module } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  providers: [AdminRepository, AdminService],
  exports: [AdminRepository, AdminService],
})
export class AdminModule {}
