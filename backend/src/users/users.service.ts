import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(
    email: string,
    plainPassword: string,
    role: UserRole,
    assigned_building_id?: string,
  ): Promise<User> {
    const password_hash = await bcrypt.hash(plainPassword, 10);
    const user = this.usersRepository.create({
      email,
      password_hash,
      role,
      assigned_building_id: assigned_building_id ?? null,
    });
    return this.usersRepository.save(user);
  }
}