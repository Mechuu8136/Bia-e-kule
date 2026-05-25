import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { BuildingsService } from './buildings.service';

@Controller('buildings')
@UseGuards(JwtAuthGuard, RolesGuard)   // ← stosuje oba guardy na całym kontrolerze
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)   // ← tylko te dwie role mają dostęp
  findAll() {
    return this.buildingsService.findAll();
  }
}