import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './building.entity';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { AuthModule } from '../auth/auth.module';   // ← DODAJ

@Module({
  imports: [
    TypeOrmModule.forFeature([Building]),
    AuthModule,   // ← DODAJ — daje dostęp do JwtAuthGuard i RolesGuard
  ],
  providers: [BuildingsService],
  controllers: [BuildingsController],
})
export class BuildingsModule {}