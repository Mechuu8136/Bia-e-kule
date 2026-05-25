// backend/src/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // rejestruje encję User w kontekście tego modułu
  ],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // eksportujemy, żeby inne moduły (np. AuthModule) mogły korzystać
})
export class UsersModule {}