// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { BuildingsModule } from './buildings/buildings.module';
import { User } from './users/user.entity';
import { Building } from './buildings/building.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Building], // ← DODAJ OBA MODELE TUTAJ
        synchronize: true,
        logging: true,
      }),
    }),

    UsersModule,     // ← zarejestruj moduł użytkowników
    BuildingsModule, // ← zarejestruj moduł budynków
  ],
})
export class AppModule {}