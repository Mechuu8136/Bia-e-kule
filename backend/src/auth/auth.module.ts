import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './jwt-auth.guard';   // ← DODAJ
import { RolesGuard } from './roles.guard';         // ← DODAJ

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: { expiresIn: 3600 },
      }),
    }),
  ],
  providers: [AuthService, JwtAuthGuard, RolesGuard],  // ← DODAJ oba guardy
  controllers: [AuthController],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],      // ← EKSPORTUJ oba guardy
})
export class AuthModule {}