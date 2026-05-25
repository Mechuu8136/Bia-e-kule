import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Szuka użytkownika po emailu — używane przy logowaniu
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Tworzy nowego użytkownika z zahashowanym hasłem
  async createUser(email: string, plainPassword: string, role: any): Promise<User> {
    const password_hash = await bcrypt.hash(plainPassword, 10);
    const user = this.usersRepository.create({ email, password_hash, role });
    return this.usersRepository.save(user);
  }
}