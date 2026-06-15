import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './building.entity';
import { UserBuilding } from '../users/user-building.entity';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Building, UserBuilding]),
    AuthModule,
  ],
  providers: [BuildingsService],
  controllers: [BuildingsController],
  exports: [BuildingsService],
})
export class BuildingsModule { }