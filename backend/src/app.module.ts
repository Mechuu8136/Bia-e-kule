import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { BuildingsModule } from './buildings/buildings.module';
import { AuthModule } from './auth/auth.module'; // ← DODAJ TEN IMPORT
import { User } from './users/user.entity';
import { Building } from './buildings/building.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Building],
        synchronize: true,
        logging: true,
      }),
    }),
    UsersModule,
    BuildingsModule,
    AuthModule, // ← DODAJ TEN WPIS
  ],
})
export class AppModule {}