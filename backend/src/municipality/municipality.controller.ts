import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { MunicipalityService } from './municipality.service';
import { UpdateMunicipalitySettingsDto } from './dto/municipality.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MunicipalityController {
  constructor(private readonly municipalityService: MunicipalityService) {}

  @Get()
  @Roles(UserRole.URZEDNIK)
  getSettings() {
    return this.municipalityService.getSettingsForAdmin();
  }

  @Patch()
  @Roles(UserRole.URZEDNIK)
  updateSettings(@Body() dto: UpdateMunicipalitySettingsDto) {
    return this.municipalityService.updateSettings(dto);
  }
}
