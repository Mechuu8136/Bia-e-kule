import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { MetersService } from './meters.service';
import { MeterType } from './meter-type.enum';

@Controller('meters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findAll(@Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.metersService.findAllMetersWithAccess(user.sub, user.role);
  }

  @Get('building/:buildingId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByBuilding(@Param('buildingId') buildingId: string) {
    return this.metersService.findMetersByBuilding(buildingId);
  }

  @Get(':meterId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findOne(@Param('meterId') meterId: string) {
    return this.metersService.findMeterById(meterId);
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
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
