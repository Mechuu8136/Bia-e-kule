import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { MetersService } from './meters.service';
import { MeterType } from './meter-type.enum';

@ApiTags('Liczniki')
@ApiBearerAuth()
@Controller('meters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Lista liczników dostępnych dla użytkownika' })
  async findAll(@Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.metersService.findAllMetersWithAccess(user.sub, user.role);
  }

  @Get('building/:buildingId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Liczniki przypisane do budynku' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do budynku' })
  async findByBuilding(@Param('buildingId') buildingId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.metersService.findMetersByBuilding(buildingId, user.sub, user.role);
  }

  @Get(':meterId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Szczegóły licznika' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do licznika' })
  async findOne(@Param('meterId') meterId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.metersService.findMeterById(meterId, user.sub, user.role);
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  @ApiOperation({ summary: 'Utwórz nowy licznik' })
  async create(
    @Body()
    createMeterDto: {
      building_id: string;
      type: MeterType;
      serial_number: string;
      unit: string;
    },
  ) {
    return this.metersService.createMeter(
      createMeterDto.building_id,
      createMeterDto.type,
      createMeterDto.serial_number,
      createMeterDto.unit,
    );
  }
}
