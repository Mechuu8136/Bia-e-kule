import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // 1. Pobierz użytkownika z bazy po emailu
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    // 2. Porównaj hasło z hashem w bazie
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    // 3. Wygeneruj token JWT z id i rolą użytkownika
    const payload = { sub: user.id, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      role: user.role,
    };
  }
}