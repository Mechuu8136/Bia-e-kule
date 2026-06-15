import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MunicipalitySettings } from './municipality-settings.entity';
import { MunicipalityService } from './municipality.service';
import { MunicipalityController } from './municipality.controller';
import { UsersModule } from '../users/users.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MunicipalitySettings]),
    UsersModule,
    ApiKeysModule,
    AuthModule,
  ],
  providers: [MunicipalityService],
  controllers: [MunicipalityController],
  exports: [MunicipalityService],
})
export class MunicipalityModule {}
