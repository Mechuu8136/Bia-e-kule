import { Controller, Get, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';

@ApiTags('Autoryzacja')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Logowanie użytkownika (JWT)' })
  @ApiResponse({ status: 401, description: 'Nieprawidłowe dane logowania' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Walidacja tokenu i dane zalogowanego użytkownika' })
  @ApiResponse({ status: 401, description: 'Token nieprawidłowy lub wygasły' })
  async me(@Req() req: any) {
    const userId = req.user?.sub as string;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sesja wygasła');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
