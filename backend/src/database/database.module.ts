import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MigratorService } from './migrator.service';

@Global()
@Module({
  providers: [DatabaseService, MigratorService],
  exports: [DatabaseService, MigratorService],
})
export class DatabaseModule {}
