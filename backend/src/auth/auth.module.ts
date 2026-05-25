import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // importujemy, żeby mieć dostęp do UsersService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: { expiresIn: 3600 },
    }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [JwtModule], // eksportujemy JwtModule — przyda się w Guards (krok 3)
})
export class AuthModule {}