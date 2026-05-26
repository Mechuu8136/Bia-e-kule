import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { BuildingsService } from './buildings.service';

@Controller('buildings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  findAll(@Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.buildingsService.findAll(user.sub, user.role);
  }
}